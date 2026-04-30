package com.stockpro.report.controller;

import com.stockpro.report.common.response.ApiResponse;
import com.stockpro.report.entity.InventorySnapshot;
import com.stockpro.report.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportResource {

    private final ReportService reportService;

    @GetMapping("/total-value")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Double>> getTotalStockValue() {
        return ResponseEntity.ok(ApiResponse.success("Total stock value retrieved", reportService.getTotalStockValue()));
    }

    @GetMapping("/value/warehouse/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Double>> getStockValueByWarehouse(@PathVariable int id) {
        return ResponseEntity.ok(ApiResponse.success("Warehouse stock value retrieved", reportService.getStockValueByWarehouse(id)));
    }

    @GetMapping("/turnover/{productId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Double>> getInventoryTurnover(@PathVariable int productId,
                                                                  @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
                                                                  @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(ApiResponse.success("Inventory turnover retrieved", reportService.getInventoryTurnover(productId, start, end)));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<InventorySnapshot>>> getLowStockReport() {
        return ResponseEntity.ok(ApiResponse.success("Low stock report retrieved", reportService.getLowStockReport()));
    }

    @GetMapping("/top-moving")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<Integer>>> getTopMovingProducts(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.success("Top moving products retrieved", reportService.getTopMovingProducts(limit)));
    }

    @GetMapping("/slow-moving")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<Integer>>> getSlowMovingProducts(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.success("Slow moving products retrieved", reportService.getSlowMovingProducts(limit)));
    }

    @GetMapping("/dead-stock")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<Integer>>> getDeadStock() {
        return ResponseEntity.ok(ApiResponse.success("Dead stock retrieved", reportService.getDeadStock()));
    }

    @GetMapping("/po-summary")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPOSummary(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
                                                                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(ApiResponse.success("PO summary retrieved", reportService.getPOSummary(start, end)));
    }

    @PostMapping("/snapshot/{warehouseId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InventorySnapshot>> takeManualSnapshot(@PathVariable int warehouseId, @RequestParam int productId) {
        return ResponseEntity.ok(ApiResponse.success("Manual snapshot recorded", reportService.takeSnapshot(warehouseId, productId)));
    }
}
