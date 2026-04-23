package com.stockpro.purchase.resource;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    /**
     * Creates a new Purchase Order in the system.
     * What: Takes raw frontend input, attaches the creator's identity, and persists
     * it as a DRAFT.
     * Why: Every order needs an audit trail of who created it, and DRAFT status
     * prevents accidental fulfillment.
     */
    @PostMapping
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
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> getById(@PathVariable int id) {
        log.info("API: Getting purchase order by ID: {}", id);
        return purchaseService.getPOById(id)
                .map(order -> {
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
        
        // Convert to DTOs and enrich (add product names) in a stream.
        // Why: Standard query results are more useful when they include descriptive names.
        List<PurchaseOrderResponse> responses = purchaseMapper.toResponseList(orders).stream()
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
    public ResponseEntity<ApiResponse<List<PurchaseOrderResponse>>> getByStatus(
            @PathVariable PurchaseOrderStatus status) {
        log.info("API: Getting POs with status: {}", status);
        
        // Filter DB records by status.
        List<PurchaseOrder> orders = purchaseService.getPOsByStatus(status);
        
        // Enrich responses for UI display.
        List<PurchaseOrderResponse> responses = purchaseMapper.toResponseList(orders).stream()
                .map(this::enrichResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success("Purchase orders retrieved", responses));
    }

    /**
     * Approves a Purchase Order, moving it from DRAFT to APPROVED.
     * What: Triggers the approval workflow in the service layer.
     * Why: Orders must be approved before goods can be physically received.
     */
    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approve(@PathVariable int id) {
        log.info("API: Approving PO ID: {}", id);
        
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
    @PostMapping("/{id}/receive")
    public ResponseEntity<ApiResponse<Void>> receiveGoods(@PathVariable int id,
            @Valid @RequestBody ReceiveGoodsRequest request) {
        log.info("API: Receiving goods for PO ID: {}", id);

        // What: Map simplified UI request (list of IDs and quantities) into domain
        // POLineItem objects.
        // Why: This allows the service layer to work with rich objects instead of raw
        // maps or DTOs.
        List<POLineItem> receivedItems = request.getItems().stream()
                .map(item -> POLineItem.builder()
                        .productId(item.getProductId())
                        .quantity(item.getQuantity())
                        .build())
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
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancel(@PathVariable int id) {
        log.info("API: Cancelling PO ID: {}", id);
        
        // Service ensures already received POs cannot be cancelled.
        purchaseService.cancelPO(id);
        
        return ResponseEntity.ok(ApiResponse.success("Purchase order cancelled successfully", null));
    }

    /**
     * Updates an existing PO (Only allowed if status is DRAFT).
     * What: Replaces PO details and recalculates totals.
     * Why: Allows correcting errors before an order is officially approved.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> update(@PathVariable int id,
            @Valid @RequestBody PurchaseOrderRequest request) {
        log.info("API: Updating draft PO ID: {}", id);
        
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
        List<PurchaseOrderResponse> responses = purchaseMapper.toResponseList(orders).stream()
                .map(this::enrichResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Purchase orders retrieved", responses));
    }

    /**
     * Fetches all Purchase Orders in the system.
     * Why: For administrative oversight and global export capabilities.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PurchaseOrderResponse>>> getAll() {
        log.info("API: Listing all purchase orders");
        List<PurchaseOrder> orders = purchaseService.getAllPOs();
        List<PurchaseOrderResponse> responses = purchaseMapper.toResponseList(orders).stream()
                .map(this::enrichResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Purchase orders retrieved", responses));
    }

    /**
     * Helper to enrich the response with product names and SKUs from
     * product-service.
     * This follows the "do what's best" guidance for better UX.
     */
    private PurchaseOrderResponse enrichResponse(PurchaseOrderResponse response) {
        if (response.getLineItems() != null) {
            for (POLineItemResponse item : response.getLineItems()) {
                try {
                    // Fetch product details from product-service
                    String url = productServiceUrl + "/" + item.getProductId();
                    ApiResponse<Map<String, Object>> productResponse = restTemplate.getForObject(url,
                            ApiResponse.class);
                    if (productResponse != null && productResponse.getData() != null) {
                        Map<String, Object> productData = productResponse.getData();
                        item.setProductName((String) productData.get("name"));
                        item.setProductSku((String) productData.get("sku"));
                    }
                } catch (Exception e) {
                    log.warn("Could not fetch product details for product ID {}: {}", item.getProductId(),
                            e.getMessage());
                    // Fallback to placeholders
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
            Map<?, ?> details = (Map<?, ?>) auth.getDetails();
            Object userIdObj = details.get("userId");
            if (userIdObj instanceof Integer) {
                return (Integer) userIdObj;
            }
        }
        log.warn("Could not extract userId from SecurityContextDetails; falling back to 0");
        return 0; // Or throw an exception if strictness is required
    }
}
