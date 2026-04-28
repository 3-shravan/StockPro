package com.stockpro.supplier.controller;

import com.stockpro.supplier.common.response.ApiResponse;
import com.stockpro.supplier.dto.request.SupplierRequest;
import com.stockpro.supplier.dto.response.SupplierResponse;
import com.stockpro.supplier.service.SupplierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/suppliers")
@RequiredArgsConstructor
@Slf4j
public class SupplierResource {

    private final SupplierService supplierService;

    @PostMapping
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<SupplierResponse>> createSupplier(@Valid @RequestBody SupplierRequest request) {
        log.info("API: Creating supplier name={}, taxId={}", request.getName(), request.getTaxId());
        SupplierResponse response = supplierService.createSupplier(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(201, "Supplier created successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SupplierResponse>> getSupplier(@PathVariable int id) {
        log.info("API: Getting supplier by ID={}", id);
        return ResponseEntity.ok(ApiResponse.success("Supplier retrieved successfully", supplierService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SupplierResponse>>> getAllSuppliers() {
        log.info("API: Getting all active suppliers");
        return ResponseEntity
                .ok(ApiResponse.success("Suppliers retrieved successfully", supplierService.getAllSuppliers()));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<SupplierResponse>>> searchSuppliers(@RequestParam("q") String query) {
        log.info("API: Searching suppliers with query={}", query);
        return ResponseEntity.ok(ApiResponse.success("Search results retrieved successfully", supplierService.searchSuppliers(query)));
    }

    @GetMapping("/city/{city}")
    public ResponseEntity<ApiResponse<List<SupplierResponse>>> getByCity(@PathVariable String city) {
        log.info("API: Getting suppliers by city={}", city);
        List<SupplierResponse> response = supplierService.getByCity(city);
        return ResponseEntity.ok(ApiResponse.success("Suppliers in " + city + " retrieved successfully", response));
    }

    @GetMapping("/country/{country}")
    public ResponseEntity<ApiResponse<List<SupplierResponse>>> getByCountry(@PathVariable String country) {
        log.info("API: Getting suppliers by country={}", country);
        List<SupplierResponse> response = supplierService.getByCountry(country);
        return ResponseEntity.ok(ApiResponse.success("Suppliers in " + country + " retrieved successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<SupplierResponse>> updateSupplier(@PathVariable int id,
            @Valid @RequestBody SupplierRequest request) {
        log.info("API: Updating supplier ID={}, taxId={}", id, request.getTaxId());
        SupplierResponse response = supplierService.updateSupplier(id, request);
        return ResponseEntity.ok(ApiResponse.success("Supplier updated successfully", response));
    }

    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivateSupplier(@PathVariable int id) {
        log.info("API: Deactivating supplier ID={}", id);
        supplierService.deactivateSupplier(id);
        return ResponseEntity.ok(ApiResponse.success("Supplier deactivated successfully", null));
    }

    @PutMapping("/{id}/rating")
    @PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> updateRating(@PathVariable int id, @RequestParam double rating) {
        log.info("API: Updating supplier rating ID={}, rating={}", id, rating);
        supplierService.updateRating(id, rating);
        return ResponseEntity.ok(ApiResponse.success("Supplier rating updated successfully", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteSupplier(@PathVariable int id) {
        log.info("API: Deleting supplier ID={}", id);
        supplierService.deleteSupplier(id);
        return ResponseEntity.ok(ApiResponse.success("Supplier deleted successfully", null));
    }
}
