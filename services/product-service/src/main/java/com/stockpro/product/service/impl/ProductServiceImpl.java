package com.stockpro.product.service.impl;

import com.stockpro.product.dto.request.ProductRequest;
import com.stockpro.product.dto.response.ProductResponse;
import com.stockpro.product.entity.Product;
import com.stockpro.product.mapper.ProductMapper;
import com.stockpro.product.repository.ProductRepository;
import com.stockpro.product.service.ProductService;
import com.stockpro.product.exception.CustomException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        log.info("Creating new product with SKU: {}", request.getSku());
        if (productRepository.findBySku(request.getSku()).isPresent()) {
            throw new CustomException("Product with SKU " + request.getSku() + " already exists", HttpStatus.CONFLICT);
        }
        
        Product product = productMapper.toEntity(request);
        Product savedProduct = productRepository.save(product);
        return productMapper.toResponse(savedProduct);
    }

    @Override
    public Optional<ProductResponse> getById(int productId) {
        log.debug("Service: Fetching product by ID: {}", productId);
        return productRepository.findById(productId).map(productMapper::toResponse);
    }

    @Override
    public Optional<ProductResponse> getBySku(String sku) {
        log.debug("Service: Fetching product by SKU: {}", sku);
        return productRepository.findBySku(sku).map(productMapper::toResponse);
    }

    @Override
    public List<ProductResponse> getByCategory(String category) {
        return productRepository.findByCategory(category).stream()
                .map(productMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductResponse> getByBrand(String brand) {
        return productRepository.findByBrand(brand).stream()
                .map(productMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductResponse> searchProducts(String query) {
        log.debug("Service: Searching products with query: {}", query);
        return productRepository.searchByName(query).stream()
                .map(productMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(int productId, ProductRequest request) {
        log.info("Updating product with ID: {}", productId);
        Product existingProduct = productRepository.findById(productId)
                .orElseThrow(() -> new CustomException("Product not found with ID: " + productId, HttpStatus.NOT_FOUND));

        // Use MapStruct to update the existing entity from the request DTO
        productMapper.updateEntityFromRequest(request, existingProduct);
        
        Product updatedProduct = productRepository.save(existingProduct);
        return productMapper.toResponse(updatedProduct);
    }

    @Override
    @Transactional
    public void deactivateProduct(int productId) {
        log.info("Deactivating product with ID: {}", productId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new CustomException("Product not found with ID: " + productId, HttpStatus.NOT_FOUND));
        product.setActive(false);
        productRepository.save(product);
    }

    @Override
    @Transactional
    public ProductResponse adjustStock(int productId, int quantity) {
        log.info("Adjusting stock for product ID {}: +{}", productId, quantity);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new CustomException("Product not found with ID: " + productId, HttpStatus.NOT_FOUND));
        
        int newQty = product.getCurrentQuantity() + quantity;
        if (newQty < 0) {
            throw new CustomException("Stock level cannot be negative", HttpStatus.BAD_REQUEST);
        }
        
        product.setCurrentQuantity(newQty);
        Product saved = productRepository.save(product);
        return productMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteProduct(int productId) {
        log.info("Deleting product with ID: {}", productId);
        if (!productRepository.existsById(productId)) {
            throw new CustomException("Product not found with ID: " + productId, HttpStatus.NOT_FOUND);
        }
        productRepository.deleteById(productId);
    }

    @Override
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(productMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<ProductResponse> getByBarcode(String barcode) {
        return productRepository.findByBarcode(barcode).map(productMapper::toResponse);
    }

    @Override
    public List<ProductResponse> getLowStockProducts() {
        return productRepository.findLowStockProducts().stream()
                .map(productMapper::toResponse)
                .collect(Collectors.toList());
    }
}
