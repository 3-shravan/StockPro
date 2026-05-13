package com.stockpro.report.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.stockpro.report.common.response.ApiResponse;
import com.stockpro.report.entity.InventorySnapshot;
import com.stockpro.report.service.ReportService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportResource {

    private final ReportService reportService;
    private final RestTemplate restTemplate;

    @Value("${services.warehouse.url}")
    private String warehouseServiceUrl;

    private static final String GATEWAY_SECRET = "StockProGateway2024";

    private HttpHeaders getInternalHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Gateway-Secret", GATEWAY_SECRET);
        headers.set("X-User-Name", "system");
        headers.set("X-User-Roles", "ADMIN");
        return headers;
    }

    @GetMapping("/total-value")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'OFFICER', 'STAFF')")
    public ResponseEntity<ApiResponse<Double>> getTotalStockValue() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isOfficer = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OFFICER"));

        if (isAdmin || isOfficer) {
            return ResponseEntity.ok(ApiResponse.success("Global total stock value retrieved", reportService.getTotalStockValue()));
        } else {
            String department = getCurrentUserDepartment();
            if (department != null && !department.isBlank() && !department.equalsIgnoreCase("GLOBAL HUB (UNASSIGNED)")) {
                Integer warehouseId = resolveWarehouseIdByName(department);
                if (warehouseId != null) {
                    return ResponseEntity.ok(ApiResponse.success("Warehouse stock value retrieved", reportService.getStockValueByWarehouse(warehouseId)));
                }
            }
            return ResponseEntity.ok(ApiResponse.success("Total stock value retrieved (No Warehouse)", 0.0));
        }
    }

    @GetMapping("/valuation-details")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'OFFICER', 'STAFF')")
    public ResponseEntity<ApiResponse<List<InventorySnapshot>>> getValuationDetails() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isOfficer = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OFFICER"));

        if (isAdmin || isOfficer) {
            return ResponseEntity.ok(ApiResponse.success("Detailed valuation retrieved", reportService.getValuationDetails()));
        } else {
            String department = getCurrentUserDepartment();
            if (department != null && !department.isBlank() && !department.equalsIgnoreCase("GLOBAL HUB (UNASSIGNED)")) {
                Integer warehouseId = resolveWarehouseIdByName(department);
                if (warehouseId != null) {
                    List<InventorySnapshot> allDetails = reportService.getValuationDetails();
                    return ResponseEntity.ok(ApiResponse.success("Warehouse detailed valuation retrieved", allDetails));
                }
            }
            return ResponseEntity.ok(ApiResponse.success("Detailed valuation retrieved", List.of()));
        }
    }

    @GetMapping("/value/warehouse/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Double>> getStockValueByWarehouse(@PathVariable int id) {
        return ResponseEntity.ok(ApiResponse.success("Warehouse stock value retrieved", reportService.getStockValueByWarehouse(id)));
    }

    @GetMapping("/turnover/{productId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<Double>> getInventoryTurnover(@PathVariable int productId,
                                                                  @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
                                                                  @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(ApiResponse.success("Inventory turnover retrieved", reportService.getInventoryTurnover(productId, start, end)));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'OFFICER', 'STAFF')")
    public ResponseEntity<ApiResponse<List<InventorySnapshot>>> getLowStockReport() {
        return ResponseEntity.ok(ApiResponse.success("Low stock report retrieved", reportService.getLowStockReport()));
    }

    @GetMapping("/top-moving")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'OFFICER', 'STAFF')")
    public ResponseEntity<ApiResponse<List<Integer>>> getTopMovingProducts(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.success("Top moving products retrieved", reportService.getTopMovingProducts(limit)));
    }

    @GetMapping("/slow-moving")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'OFFICER', 'STAFF')")
    public ResponseEntity<ApiResponse<List<Integer>>> getSlowMovingProducts(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.success("Slow moving products retrieved", reportService.getSlowMovingProducts(limit)));
    }

    @GetMapping("/dead-stock")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'OFFICER', 'STAFF')")
    public ResponseEntity<ApiResponse<List<Integer>>> getDeadStock() {
        return ResponseEntity.ok(ApiResponse.success("Dead stock retrieved", reportService.getDeadStock()));
    }

    @GetMapping("/po-summary")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'OFFICER', 'STAFF')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPOSummary(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
                                                                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(ApiResponse.success("PO summary retrieved", reportService.getPOSummary(start, end)));
    }

    @PostMapping("/snapshot/{warehouseId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InventorySnapshot>> takeManualSnapshot(@PathVariable int warehouseId, @RequestParam int productId) {
        return ResponseEntity.ok(ApiResponse.success("Manual snapshot recorded", reportService.takeSnapshot(warehouseId, productId)));
    }

    @PostMapping("/sync")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> sync() {
        reportService.runSync();
        return ResponseEntity.ok(ApiResponse.success("Analytics synchronization triggered successfully", null));
    }

    /**
     * Helper to resolve a Warehouse Name (Department) to its ID.
     */
    private Integer resolveWarehouseIdByName(String name) {
        try {
            String url = warehouseServiceUrl + "/warehouses";
            HttpHeaders headers = getInternalHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            
            ResponseEntity<ApiResponse<List<Map<String, Object>>>> res = restTemplate.exchange(
                url, HttpMethod.GET, entity, new ParameterizedTypeReference<ApiResponse<List<Map<String, Object>>>>() {}
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
}
