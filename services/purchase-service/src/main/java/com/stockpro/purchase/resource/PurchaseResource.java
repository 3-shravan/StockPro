package com.stockpro.purchase.resource;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.stockpro.purchase.common.response.ApiResponse;
import com.stockpro.purchase.dto.request.PurchaseOrderRequest;
import com.stockpro.purchase.dto.request.ReceiveGoodsRequest;
import com.stockpro.purchase.dto.response.POLineItemResponse;
import com.stockpro.purchase.dto.response.PurchaseOrderResponse;
import com.stockpro.purchase.entity.POLineItem;
import com.stockpro.purchase.entity.PurchaseOrder;
import com.stockpro.purchase.entity.PurchaseOrderStatus;
import com.stockpro.purchase.exception.CustomException;
import com.stockpro.purchase.mapper.PurchaseMapper;
import com.stockpro.purchase.service.PurchaseService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PurchaseResource (formerly PurchaseController) provides exposure to the procurement lifecycle.
 * It translates HTTP requests into business operations handled by the
 * PurchaseService.
 * 
 * Why: This layer ensures that the domain logic is decoupled from HTTP concerns
 * while managing authentication and DTO transformations.
 */
@RestController
@RequestMapping("/purchase-orders")
@RequiredArgsConstructor
@Slf4j
public class PurchaseResource {

    private final PurchaseService purchaseService;
    private final PurchaseMapper purchaseMapper;
    private final RestTemplate restTemplate;

    @Value("${services.product.url}")
    private String productServiceUrl;

    @Value("${services.supplier.url}")
    private String supplierServiceUrl;

    @Value("${services.warehouse.url}")
    private String warehouseServiceUrl;


    /**
     * Creates a new Purchase Order in the system.
     * What: Takes raw frontend input, attaches the creator's identity, and persists
     * it as a DRAFT.
     * Why: Every order needs an audit trail of who created it, and DRAFT status
     * prevents accidental fulfillment.
     */
    /** Purchase Officers (and Admins) create new POs. */
    @PostMapping
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> create(@Valid @RequestBody PurchaseOrderRequest request) {
        log.info("API: Creating purchase order");

        // Convert Request DTO to Domain Entity.
        // Why: We map early to keep the service layer clean of HTTP-specific DTO
        // objects.
        PurchaseOrder order = purchaseMapper.toEntity(request);

        // Security: Identify the logged-in user.
        // What: Extracts the actual User ID from the SecurityContext (set by
        // JwtAuthFilter).
        // Why: We do this at the Controller level so the Service layer doesn't have to
        // depend on Spring Security.
        order.setCreatedById(getCurrentUserId());

        // What: Delegate the heavy lifting (cost calculation and DB save) to the
        // service layer.
        PurchaseOrder savedOrder = purchaseService.createPO(order);

        // What: Transform back to Response DTO and enrich with product metadata.
        // Why: Frontend needs names/SKUs, not just IDs, for a usable display.
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Purchase order created successfully",
                        enrichResponse(purchaseMapper.toResponse(savedOrder))));
    }

    /**
     * Fetches a specific Purchase Order by its ID.
     * What: Retrieves order data and expands productId into full product
     * names/SKUs.
     * Why: Looking at an ID (e.g. 502) is useless for a user; we must fetch
     * descriptions for clarity.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'OFFICER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> getById(@PathVariable int id) {
        log.info("API: Getting purchase order by ID: {}", id);
        return purchaseService.getPOById(id)
                .map(order -> {
                    // STAFF/MANAGER Isolation Check
                    if (!isAuthorizedForWarehouse(order.getWarehouseId())) {
                        log.warn("Access denied for PO ID: {} — warehouse mismatch", id);
                        throw new CustomException(HttpStatus.FORBIDDEN, "Access denied: this order belongs to another warehouse hub");
                    }
                    
                    // Convert Entity to Response DTO
                    PurchaseOrderResponse response = purchaseMapper.toResponse(order);
                    // Add Product Names/SKUs from product-service
                    return ResponseEntity.ok(ApiResponse.success("Purchase order found", enrichResponse(response)));
                })
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "Purchase Order not found"));
    }

    /**
     * Retrieves all Purchase Orders for a specific supplier.
     * What: Filters the PO collection by supplierId and enriches them with product metadata.
     * Why: Suppliers often call to check the status of all their pending orders.
     */
    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<ApiResponse<List<PurchaseOrderResponse>>> getBySupplier(@PathVariable int supplierId) {
        log.info("API: Getting POs for supplier: {}", supplierId);
        
        // Fetch raw list from DB.
        List<PurchaseOrder> orders = purchaseService.getPOsBySupplier(supplierId);
        
        // Convert to DTOs, filter by warehouse access, and enrich.
        List<PurchaseOrderResponse> responses = purchaseMapper.toResponseList(orders).stream()
                .filter(o -> isAuthorizedForWarehouse(o.getWarehouseId()))
                .map(this::enrichResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success("Purchase orders retrieved", responses));
    }

    /**
     * Retrieves all Purchase Orders having a specific status (e.g. DRAFT, APPROVED).
     * What: Filters the global PO list by the status enum.
     * Why: This powers dashboard widgets like "Orders Pending Receipt" or "Approvals Needed".
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('STAFF', 'OFFICER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<PurchaseOrderResponse>>> getByStatus(
            @PathVariable PurchaseOrderStatus status) {
        log.info("API: Getting POs with status: {}", status);
        
        // Filter DB records by status.
        List<PurchaseOrder> orders = purchaseService.getPOsByStatus(status);
        
        // Convert to DTOs, filter by warehouse access, and enrich.
        List<PurchaseOrderResponse> responses = purchaseMapper.toResponseList(orders).stream()
                .filter(o -> isAuthorizedForWarehouse(o.getWarehouseId()))
                .map(this::enrichResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success("Purchase orders retrieved", responses));
    }

    /**
     * Submits a Purchase Order for approval.
     * What: Moves order from DRAFT to PENDING_APPROVAL.
     */
    @PutMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> submit(@PathVariable int id) {
        log.info("API: Submitting PO ID: {} for approval", id);
        
        PurchaseOrder order = purchaseService.getPOById(id)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "Purchase Order not found"));
        
        if (!isAuthorizedForWarehouse(order.getWarehouseId())) {
            throw new CustomException(HttpStatus.FORBIDDEN, "Access denied: this order belongs to another warehouse hub");
        }
        
        purchaseService.submitForApproval(id);
        return ResponseEntity.ok(ApiResponse.success("Purchase order submitted for approval", null));
    }

    /**
     * Approves a Purchase Order, moving it from DRAFT to APPROVED.
     * What: Triggers the approval workflow in the service layer.
     * Why: Orders must be approved before goods can be physically received.
     */
    /** Only Inventory Managers (and Admins) can approve POs. */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> approve(@PathVariable int id) {
        log.info("API: Approving PO ID: {}", id);
        
        PurchaseOrder order = purchaseService.getPOById(id)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "Purchase Order not found"));
        
        if (!isAuthorizedForWarehouse(order.getWarehouseId())) {
            throw new CustomException(HttpStatus.FORBIDDEN, "Access denied: this order belongs to another warehouse hub");
        }
        
        // Delegate status transition logic to service (includes validation checks).
        purchaseService.approvePO(id);
        
        return ResponseEntity.ok(ApiResponse.success("Purchase order approved successfully", null));
    }

    /**
     * Confirms the arrival of goods at the warehouse location.
     * What: Increments "received_qty" in the purchase DB and increments
     * "stock_level" in the warehouse DB.
     * Why: Keeping the physical reality (the truck arrived) in sync with digital
     * inventory is the key StockPro value.
     */
    /** Both Staff and Management can record physical receipt of goods. */
    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('STAFF', 'OFFICER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> receiveGoods(@PathVariable int id,
            @Valid @RequestBody ReceiveGoodsRequest request) {
        log.info("API: Receiving goods for PO ID: {}", id);

        PurchaseOrder order = purchaseService.getPOById(id)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "Purchase Order not found"));
        
        if (!isAuthorizedForWarehouse(order.getWarehouseId())) {
            throw new CustomException(HttpStatus.FORBIDDEN, "Access denied: you can only receive goods at your assigned warehouse");
        }

        // What: Map simplified UI request (list of IDs and quantities) into domain
        // POLineItem objects.
        // Why: This allows the service layer to work with rich objects instead of raw
        // maps or DTOs.
        List<POLineItem> receivedItems = request.getItems().stream()
                .map(item -> {
                    POLineItem pi = new POLineItem();
                    pi.setProductId(item.getProductId());
                    pi.setQuantity(item.getQuantity());
                    return pi;
                })
                .collect(Collectors.toList());

        // What: Execute the multi-service receipt logic.
        // Why: This call is Transactional. If the warehouse-service call fails,
        // the purchase-service DB update will roll back automatically.
        purchaseService.receiveGoods(id, receivedItems);
        return ResponseEntity.ok(ApiResponse.success("Goods received successfully", null));
    }

    /**
     * Cancels a Purchase Order.
     * What: Sets status to CANCELLED and prevents further receipt of goods.
     * Why: To stop a procurement process due to errors or changing requirements.
     */
    /** Officers and Admins can cancel POs. */
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('OFFICER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> cancel(@PathVariable int id) {
        log.info("API: Cancelling PO ID: {}", id);
        
        PurchaseOrder order = purchaseService.getPOById(id)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "Purchase Order not found"));
        
        if (!isAuthorizedForWarehouse(order.getWarehouseId())) {
            throw new CustomException(HttpStatus.FORBIDDEN, "Access denied: this order belongs to another warehouse hub");
        }

        // Service ensures already received POs cannot be cancelled.
        purchaseService.cancelPO(id);
        
        return ResponseEntity.ok(ApiResponse.success("Purchase order cancelled successfully", null));
    }

    /**
     * Updates an existing PO (Only allowed if status is DRAFT).
     * What: Replaces PO details and recalculates totals.
     * Why: Allows correcting errors before an order is officially approved.
     */
    /** Officers can update DRAFT POs before submission. */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> update(@PathVariable int id,
            @Valid @RequestBody PurchaseOrderRequest request) {
        log.info("API: Updating draft PO ID: {}", id);
        
        PurchaseOrder existing = purchaseService.getPOById(id)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "Purchase Order not found"));
        
        if (!isAuthorizedForWarehouse(existing.getWarehouseId())) {
            throw new CustomException(HttpStatus.FORBIDDEN, "Access denied: this order belongs to another warehouse hub");
        }

        // Convert updated details to Entity.
        PurchaseOrder order = purchaseMapper.toEntity(request);
        
        // Execute update (re-calculates costs internally).
        PurchaseOrder updatedOrder = purchaseService.updatePO(id, order);
        
        return ResponseEntity.ok(ApiResponse.success("Purchase order updated successfully",
                enrichResponse(purchaseMapper.toResponse(updatedOrder))));
    }

    /**
     * Retrieves all POs destined for a specific warehouse.
     * Why: Warehouse managers use this to forecast upcoming delivery workloads.
     */
    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<ApiResponse<List<PurchaseOrderResponse>>> getByWarehouse(@PathVariable int warehouseId) {
        log.info("API: Getting POs for warehouse: {}", warehouseId);
        
        if (!isAuthorizedForWarehouse(warehouseId)) {
            throw new CustomException(HttpStatus.FORBIDDEN, "Access denied: you are not authorized to view logs for this warehouse hub");
        }

        List<PurchaseOrder> orders = purchaseService.getPOsByWarehouse(warehouseId);
        List<PurchaseOrderResponse> responses = purchaseMapper.toResponseList(orders).stream()
                .map(this::enrichResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Purchase orders retrieved", responses));
    }

    /**
     * Searches for POs created within a specific date range.
     * Why: Essential for monthly auditing and financial reporting.
     */
    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<PurchaseOrderResponse>>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        log.info("API: Getting POs between {} and {}", start, end);
        List<PurchaseOrder> orders = purchaseService.getPOsByDateRange(start, end);
        
        // Filter by warehouse access
        List<PurchaseOrderResponse> responses = purchaseMapper.toResponseList(orders).stream()
                .filter(o -> isAuthorizedForWarehouse(o.getWarehouseId()))
                .map(this::enrichResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success("Purchase orders retrieved", responses));
    }

    /** All management roles can view the full PO list. */
    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'OFFICER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<PurchaseOrderResponse>>> getAll() {
        log.info("API: Listing purchase orders");
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isOfficer = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OFFICER"));
        boolean isManager = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"));
        
        List<PurchaseOrder> orders;
        
        if (isAdmin || isOfficer) {
            // Admins and Officers see everything
            orders = purchaseService.getAllPOs();
        } else if (isManager) {
            // Managers see all their assigned hubs
            int userId = getCurrentUserId();
            List<Integer> warehouseIds = getManagedWarehouseIds(userId);
            log.info("Scoping PO list to manager ID: {} ({} warehouses)", userId, warehouseIds.size());
            
            orders = warehouseIds.stream()
                    .flatMap(id -> purchaseService.getPOsByWarehouse(id).stream())
                    .collect(Collectors.toList());
        } else {
            // Staff see only their assigned hub via department
            String department = getCurrentUserDepartment();
            log.info("Scoping PO list to department: {}", department);
            
            if (department != null && !department.isBlank() && !department.equalsIgnoreCase("GLOBAL HUB (UNASSIGNED)")) {
                Integer warehouseId = resolveWarehouseIdByName(department);
                if (warehouseId != null) {
                    orders = purchaseService.getPOsByWarehouse(warehouseId);
                } else {
                    orders = List.of();
                }
            } else {
                orders = List.of();
            }
        }
        
        List<PurchaseOrderResponse> responses = purchaseMapper.toResponseList(orders).stream()
                .map(this::enrichResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Purchase orders retrieved", responses));
    }

    private List<Integer> getManagedWarehouseIds(int managerId) {
        log.info("Fetching managed warehouse IDs for manager: {}", managerId);
        try {
            String url = warehouseServiceUrl + "/warehouses";
            
            ResponseEntity<ApiResponse<List<Map<String, Object>>>> res = restTemplate.exchange(
                url, HttpMethod.GET, HttpEntity.EMPTY, new ParameterizedTypeReference<ApiResponse<List<Map<String, Object>>>>() {}
            );
            
            if (res.getBody() != null && res.getBody().getData() != null) {
                return res.getBody().getData().stream()
                    .filter(w -> {
                        Object mId = w.get("managerId");
                        return mId instanceof Number && ((Number) mId).intValue() == managerId;
                    })
                    .map(w -> (Integer) w.get("warehouseId"))
                    .collect(Collectors.toList());
            }
        } catch (org.springframework.web.client.HttpClientErrorException.Unauthorized e) {
            log.error("Internal Auth Failure: warehouse-service rejected credentials for manager {}. This usually indicates a gateway secret mismatch.", managerId);
            // We don't rethrow as 401 to prevent frontend logout
        } catch (Exception e) {
            log.error("Failed to fetch managed warehouses for manager {}: {}", managerId, e.getMessage());
        }
        return List.of();
    }

    /**
     * Helper to resolve a Warehouse Name (Department) to its ID.
     */
    private Integer resolveWarehouseIdByName(String name) {
        try {
            String url = warehouseServiceUrl + "/warehouses";
            
            ResponseEntity<ApiResponse<List<Map<String, Object>>>> res = restTemplate.exchange(
                url, HttpMethod.GET, HttpEntity.EMPTY, new ParameterizedTypeReference<ApiResponse<List<Map<String, Object>>>>() {}
            );
            
            if (res.getBody() != null && res.getBody().getData() != null) {
                return res.getBody().getData().stream()
                    .filter(w -> name.equalsIgnoreCase((String) w.get("name")))
                    .map(w -> (Integer) w.get("warehouseId"))
                    .findFirst()
                    .orElse(null);
            }
        } catch (Exception e) {
            log.error("Failed to resolve warehouse ID for name {}: {}", name, e.getMessage());
        }
        return null;
    }

    /**
     * Enriches the response with details from other services (Product, Supplier, Warehouse).
     */
    private PurchaseOrderResponse enrichResponse(PurchaseOrderResponse response) {
        // 1. Fetch Supplier Name
        try {
            String url = supplierServiceUrl + "/suppliers/" + response.getSupplierId();
            ResponseEntity<ApiResponse<Map<String, Object>>> res = restTemplate.exchange(
                url, HttpMethod.GET, HttpEntity.EMPTY, new ParameterizedTypeReference<ApiResponse<Map<String, Object>>>() {}
            );
            if (res.getBody() != null && res.getBody().getData() != null) {
                response.setSupplierName((String) res.getBody().getData().get("name"));
            }
        } catch (Exception e) {
            log.warn("Could not fetch supplier details for ID {}: {}", response.getSupplierId(), e.getMessage());
            response.setSupplierName("Supplier #" + response.getSupplierId());
        }

        // 2. Fetch Warehouse Name
        try {
            String url = warehouseServiceUrl + "/warehouses/" + response.getWarehouseId();
            ResponseEntity<ApiResponse<Map<String, Object>>> res = restTemplate.exchange(
                url, HttpMethod.GET, HttpEntity.EMPTY, new ParameterizedTypeReference<ApiResponse<Map<String, Object>>>() {}
            );
            if (res.getBody() != null && res.getBody().getData() != null) {
                response.setWarehouseName((String) res.getBody().getData().get("name"));
            }
        } catch (Exception e) {
            log.warn("Could not fetch warehouse details for ID {}: {}", response.getWarehouseId(), e.getMessage());
            response.setWarehouseName("Warehouse #" + response.getWarehouseId());
        }

        // 3. Fetch Line Item Details (Product names)
        if (response.getLineItems() != null) {
            for (POLineItemResponse item : response.getLineItems()) {
                try {
                    String url = productServiceUrl + "/products/" + item.getProductId();
                    log.debug("Enriching item: fetching product details from {}", url);
                    
                    ResponseEntity<ApiResponse<Map<String, Object>>> productResponseEntity = restTemplate.exchange(
                        url, HttpMethod.GET, HttpEntity.EMPTY, new ParameterizedTypeReference<ApiResponse<Map<String, Object>>>() {}
                    );
                    
                    ApiResponse<Map<String, Object>> productResponse = productResponseEntity.getBody();
                    if (productResponse != null && productResponse.getData() != null) {
                        Map<String, Object> productData = productResponse.getData();
                        String productName = (String) productData.get("name");
                        String productSku = (String) productData.get("sku");
                        
                        item.setProductName(productName);
                        item.setProductSku(productSku);
                        log.debug("Successfully enriched item {} with product name: {}", item.getProductId(), productName);
                    } else {
                        log.warn("Product service returned empty data for ID {}", item.getProductId());
                        item.setProductName("Product #" + item.getProductId());
                    }
                } catch (Exception e) {
                    log.error("Failed to fetch product details for ID {}: {}", item.getProductId(), e.getMessage());
                    item.setProductName("Unknown Product (" + item.getProductId() + ")");
                }
            }
        }
        return response;
    }

    /**
     * Extracts the current user's ID from the SecurityContext details.
     */
    private Integer getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getDetails() instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> details = (Map<String, Object>) auth.getDetails();
            Object userIdObj = details.get("userId");
            if (userIdObj instanceof Integer) {
                return (Integer) userIdObj;
            } else if (userIdObj instanceof String) {
                try {
                    return Integer.parseInt((String) userIdObj);
                } catch (NumberFormatException e) {
                    log.error("Failed to parse userId string from details: {}", userIdObj);
                }
            }
        }
        log.warn("Could not extract userId from SecurityContextDetails; falling back to 0");
        return 0;
    }

    /**
     * Extracts the current user's Department (Warehouse Name) from the SecurityContext details.
     */
    private String getCurrentUserDepartment() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getDetails() instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> details = (Map<String, Object>) auth.getDetails();
            Object deptObj = details.get("department");
            if (deptObj instanceof String) {
                return (String) deptObj;
            }
        }
        return null;
    }

    /**
     * Checks if the current user has access to a specific warehouse ID.
     * High-level roles (ADMIN, OFFICER) have global access.
     */
    private boolean isAuthorizedForWarehouse(int warehouseId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isOfficer = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OFFICER"));
        
        if (isAdmin || isOfficer) return true;

        String department = getCurrentUserDepartment();
        int userId = getCurrentUserId();

        // 1. Check Manager assignment (via warehouse-service)
        try {
            String url = warehouseServiceUrl + "/warehouses/" + warehouseId;
            
            ResponseEntity<ApiResponse<Map<String, Object>>> res = restTemplate.exchange(
                url, HttpMethod.GET, HttpEntity.EMPTY, new ParameterizedTypeReference<ApiResponse<Map<String, Object>>>() {}
            );
            
            if (res.getBody() != null && res.getBody().getData() != null) {
                Object mId = res.getBody().getData().get("managerId");
                if (mId instanceof Number && ((Number) mId).intValue() == userId) {
                    return true;
                }
            }
        } catch (org.springframework.web.client.HttpClientErrorException.Unauthorized e) {
            log.error("Authorization check failed: warehouse-service returned 401 for user {}. Likely internal secret mismatch.", userId);
            // Fallback to second check instead of crashing
        } catch (Exception e) {
            log.error("Failed to verify manager assignment for warehouse {}: {}", warehouseId, e.getMessage());
        }

        // 2. Check Staff assignment (via department match)
        if (department != null && !department.isBlank() && !department.equalsIgnoreCase("GLOBAL HUB (UNASSIGNED)")) {
            Integer assignedId = resolveWarehouseIdByName(department);
            return assignedId != null && assignedId == warehouseId;
        }

        return false;
    }
}
