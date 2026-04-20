package com.stockpro.product.controller;

import com.stockpro.product.dto.request.ProductRequest;
import com.stockpro.product.dto.response.ProductResponse;
import com.stockpro.product.service.ProductService;
import com.stockpro.product.validation.ValidationGroups;
import com.stockpro.product.exception.CustomException;
import com.stockpro.product.common.response.ApiResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@Slf4j
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> create(@Validated(ValidationGroups.OnCreate.class) @RequestBody ProductRequest request) {
        log.info("API: Creating new product with SKU: {}", request.getSku());
        ProductResponse response = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(HttpStatus.CREATED.value(), "Product created successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getById(@PathVariable int id) {
        log.info("API: Retrieving product by ID: {}", id);
        ProductResponse response = productService.getById(id)
                .orElseThrow(() -> new CustomException("Product not found", HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.success("Product retrieved successfully", response));
    }

    @GetMapping("/sku/{sku}")
    public ResponseEntity<ApiResponse<ProductResponse>> getBySku(@PathVariable String sku) {
        log.info("API: Retrieving product by SKU: {}", sku);
        ProductResponse response = productService.getBySku(sku)
                .orElseThrow(() -> new CustomException("Product not found with SKU: " + sku, HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.success("Product retrieved successfully", response));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getByCategory(@PathVariable String category) {
        List<ProductResponse> response = productService.getByCategory(category);
        return ResponseEntity.ok(ApiResponse.success("Products retrieved successfully", response));
    }

    @GetMapping("/brand/{brand}")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getByBrand(@PathVariable String brand) {
        List<ProductResponse> response = productService.getByBrand(brand);
        return ResponseEntity.ok(ApiResponse.success("Products retrieved successfully", response));
    }

    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<ApiResponse<ProductResponse>> getByBarcode(@PathVariable String barcode) {
        ProductResponse response = productService.getByBarcode(barcode)
                .orElseThrow(() -> new CustomException("Product not found with barcode: " + barcode, HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.success("Product retrieved successfully", response));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> search(@RequestParam String query) {
        List<ProductResponse> response = productService.searchProducts(query);
        return ResponseEntity.ok(ApiResponse.success("Products retrieved successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getAll() {
        List<ProductResponse> response = productService.getAllProducts();
        return ResponseEntity.ok(ApiResponse.success("Products retrieved successfully", response));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getLowStockProducts() {
        List<ProductResponse> response = productService.getLowStockProducts();
        return ResponseEntity.ok(ApiResponse.success("Low stock products retrieved successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> update(@PathVariable int id, @Validated(ValidationGroups.OnUpdate.class) @RequestBody ProductRequest request) {
        log.info("API: Updating product with ID: {}", id);
        ProductResponse response = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success("Product updated successfully", response));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable int id) {
        log.info("API: Deactivating product with ID: {}", id);
        productService.deactivateProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product deactivated successfully", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable int id) {
        log.info("API: Deleting product with ID: {}", id);
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted successfully", null));
    }
}
