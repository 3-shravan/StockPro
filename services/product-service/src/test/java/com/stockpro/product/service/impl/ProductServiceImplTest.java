package com.stockpro.product.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.stockpro.product.dto.request.ProductRequest;
import com.stockpro.product.dto.response.ProductResponse;
import com.stockpro.product.entity.Product;
import com.stockpro.product.exception.CustomException;
import com.stockpro.product.mapper.ProductMapper;
import com.stockpro.product.repository.ProductRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProductServiceImpl")
class ProductServiceImplTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductMapper productMapper;

    @InjectMocks
    private ProductServiceImpl productService;

    private Product product;
    private ProductRequest request;
    private ProductResponse response;

    @BeforeEach
    void setUp() {
        product = Product.builder()
                .productId(1)
                .sku("PROD-001")
                .name("Test Product")
                .category("Electronics")
                .brand("TestBrand")
                .unitOfMeasure("PCS")
                .costPrice(10.0)
                .sellingPrice(15.0)
                .reorderLevel(10)
                .maxStockLevel(100)
                .leadTimeDays(5)
                .active(true)
                .currentQuantity(50)
                .build();

        request = ProductRequest.builder()
                .sku("PROD-001")
                .name("Test Product")
                .category("Electronics")
                .brand("TestBrand")
                .unitOfMeasure("PCS")
                .costPrice(10.0)
                .sellingPrice(15.0)
                .reorderLevel(10)
                .maxStockLevel(100)
                .leadTimeDays(5)
                .currentQuantity(50)
                .build();

        response = new ProductResponse();
        response.setProductId(1);
        response.setSku("PROD-001");
        response.setName("Test Product");
        response.setCategory("Electronics");
        response.setBrand("TestBrand");
        response.setUnitOfMeasure("PCS");
        response.setCostPrice(10.0);
        response.setSellingPrice(15.0);
        response.setReorderLevel(10);
        response.setMaxStockLevel(100);
        response.setLeadTimeDays(5);
        response.setActive(true);
        response.setCurrentQuantity(50);
    }

    @Nested
    @DisplayName("createProduct()")
    class CreateProduct {

        @Test
        @DisplayName("saves and returns product when SKU is unique")
        void success() {
            when(productRepository.findBySku("PROD-001")).thenReturn(Optional.empty());
            when(productMapper.toEntity(any(ProductRequest.class))).thenReturn(product);
            when(productRepository.save(any(Product.class))).thenReturn(product);
            when(productMapper.toResponse(any(Product.class))).thenReturn(response);

            ProductResponse result = productService.createProduct(request);

            assertThat(result).isNotNull();
            assertThat(result.getSku()).isEqualTo("PROD-001");
            verify(productRepository).save(any(Product.class));
        }

        @Test
        @DisplayName("throws CONFLICT when SKU already exists")
        void duplicateSku_throwsConflict() {
            when(productRepository.findBySku("PROD-001")).thenReturn(Optional.of(product));

            CustomException ex = catchThrowableOfType(
                    () -> productService.createProduct(request), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT);
            assertThat(ex.getMessage()).contains("already exists");
            verify(productRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("getById() & getBySku() & getByBarcode()")
    class Retrievals {

        @Test
        @DisplayName("returns product response by id when found")
        void getById_found() {
            when(productRepository.findById(1)).thenReturn(Optional.of(product));
            when(productMapper.toResponse(product)).thenReturn(response);

            Optional<ProductResponse> result = productService.getById(1);

            assertThat(result).isPresent();
            assertThat(result.get().getProductId()).isEqualTo(1);
        }

        @Test
        @DisplayName("returns empty optional by id when not found")
        void getById_notFound() {
            when(productRepository.findById(99)).thenReturn(Optional.empty());

            Optional<ProductResponse> result = productService.getById(99);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns product response by sku when found")
        void getBySku_found() {
            when(productRepository.findBySku("PROD-001")).thenReturn(Optional.of(product));
            when(productMapper.toResponse(product)).thenReturn(response);

            Optional<ProductResponse> result = productService.getBySku("PROD-001");

            assertThat(result).isPresent();
            assertThat(result.get().getSku()).isEqualTo("PROD-001");
        }

        @Test
        @DisplayName("returns product response by barcode when found")
        void getByBarcode_found() {
            product.setBarcode("123456789");
            response.setBarcode("123456789");
            when(productRepository.findByBarcode("123456789")).thenReturn(Optional.of(product));
            when(productMapper.toResponse(product)).thenReturn(response);

            Optional<ProductResponse> result = productService.getByBarcode("123456789");

            assertThat(result).isPresent();
            assertThat(result.get().getBarcode()).isEqualTo("123456789");
        }
    }

    @Nested
    @DisplayName("getByCategory() & getByBrand() & searchProducts() & getAllProducts()")
    class Lists {

        @Test
        @DisplayName("returns list of products by category")
        void getByCategory() {
            when(productRepository.findByCategory("Electronics")).thenReturn(List.of(product));
            when(productMapper.toResponse(product)).thenReturn(response);

            List<ProductResponse> result = productService.getByCategory("Electronics");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getCategory()).isEqualTo("Electronics");
        }

        @Test
        @DisplayName("returns list of products by brand")
        void getByBrand() {
            when(productRepository.findByBrand("TestBrand")).thenReturn(List.of(product));
            when(productMapper.toResponse(product)).thenReturn(response);

            List<ProductResponse> result = productService.getByBrand("TestBrand");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getBrand()).isEqualTo("TestBrand");
        }

        @Test
        @DisplayName("returns matching products for query")
        void searchProducts() {
            when(productRepository.searchByName("Test")).thenReturn(List.of(product));
            when(productMapper.toResponse(product)).thenReturn(response);

            List<ProductResponse> result = productService.searchProducts("Test");

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("returns all products")
        void getAllProducts() {
            when(productRepository.findAll()).thenReturn(List.of(product));
            when(productMapper.toResponse(product)).thenReturn(response);

            List<ProductResponse> result = productService.getAllProducts();

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("returns low stock products")
        void getLowStockProducts() {
            when(productRepository.findLowStockProducts()).thenReturn(List.of(product));
            when(productMapper.toResponse(product)).thenReturn(response);

            List<ProductResponse> result = productService.getLowStockProducts();

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("updateProduct()")
    class UpdateProduct {

        @Test
        @DisplayName("updates and saves product when found")
        void success() {
            when(productRepository.findById(1)).thenReturn(Optional.of(product));
            when(productRepository.save(product)).thenReturn(product);
            when(productMapper.toResponse(product)).thenReturn(response);

            ProductResponse result = productService.updateProduct(1, request);

            assertThat(result).isNotNull();
            verify(productMapper).updateEntityFromRequest(request, product);
            verify(productRepository).save(product);
        }

        @Test
        @DisplayName("throws NOT_FOUND when product to update does not exist")
        void notFound_throwsNotFound() {
            when(productRepository.findById(99)).thenReturn(Optional.empty());

            CustomException ex = catchThrowableOfType(
                    () -> productService.updateProduct(99, request), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
            verify(productRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("deactivateProduct() & deleteProduct()")
    class DeactivateAndDelete {

        @Test
        @DisplayName("deactivates product successfully")
        void deactivateSuccess() {
            when(productRepository.findById(1)).thenReturn(Optional.of(product));
            when(productRepository.save(product)).thenReturn(product);

            productService.deactivateProduct(1);

            assertThat(product.isActive()).isFalse();
            verify(productRepository).save(product);
        }

        @Test
        @DisplayName("deactivate throws NOT_FOUND when product not found")
        void deactivateNotFound_throwsNotFound() {
            when(productRepository.findById(99)).thenReturn(Optional.empty());

            CustomException ex = catchThrowableOfType(
                    () -> productService.deactivateProduct(99), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
        }

        @Test
        @DisplayName("deletes product successfully when it exists")
        void deleteSuccess() {
            when(productRepository.existsById(1)).thenReturn(true);

            productService.deleteProduct(1);

            verify(productRepository).deleteById(1);
        }

        @Test
        @DisplayName("delete throws NOT_FOUND when product does not exist")
        void deleteNotFound_throwsNotFound() {
            when(productRepository.existsById(99)).thenReturn(false);

            CustomException ex = catchThrowableOfType(
                    () -> productService.deleteProduct(99), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
            verify(productRepository, never()).deleteById(any());
        }
    }

    @Nested
    @DisplayName("adjustStock()")
    class AdjustStock {

        @Test
        @DisplayName("adds stock quantity successfully")
        void addStockSuccess() {
            when(productRepository.findById(1)).thenReturn(Optional.of(product));
            when(productRepository.save(product)).thenReturn(product);
            when(productMapper.toResponse(product)).thenReturn(response);

            productService.adjustStock(1, 20);

            assertThat(product.getCurrentQuantity()).isEqualTo(70);
            verify(productRepository).save(product);
        }

        @Test
        @DisplayName("subtracts stock quantity successfully")
        void subtractStockSuccess() {
            when(productRepository.findById(1)).thenReturn(Optional.of(product));
            when(productRepository.save(product)).thenReturn(product);
            when(productMapper.toResponse(product)).thenReturn(response);

            productService.adjustStock(1, -20);

            assertThat(product.getCurrentQuantity()).isEqualTo(30);
            verify(productRepository).save(product);
        }

        @Test
        @DisplayName("throws BAD_REQUEST when adjusted quantity is negative")
        void negativeStock_throwsBadRequest() {
            when(productRepository.findById(1)).thenReturn(Optional.of(product));

            CustomException ex = catchThrowableOfType(
                    () -> productService.adjustStock(1, -60), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(ex.getMessage()).contains("cannot be negative");
            verify(productRepository, never()).save(any());
        }
    }
}
