package com.stockpro.product.service;

import com.stockpro.product.dto.request.ProductRequest;
import com.stockpro.product.dto.response.ProductResponse;

import java.util.List;
import java.util.Optional;

public interface ProductService {

    ProductResponse createProduct(ProductRequest request);

    Optional<ProductResponse> getById(int productId);

    Optional<ProductResponse> getBySku(String sku);

    List<ProductResponse> getByCategory(String category);

    List<ProductResponse> getByBrand(String brand);

    List<ProductResponse> searchProducts(String query);

    ProductResponse updateProduct(int productId, ProductRequest request);

    void deactivateProduct(int productId);

    void adjustStock(int productId, int quantity);

    void deleteProduct(int productId);

    List<ProductResponse> getAllProducts();

    Optional<ProductResponse> getByBarcode(String barcode);

    List<ProductResponse> getLowStockProducts();
}
