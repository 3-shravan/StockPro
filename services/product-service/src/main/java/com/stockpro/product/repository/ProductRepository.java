package com.stockpro.product.repository;

import com.stockpro.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {

    Optional<Product> findBySku(String sku);

    List<Product> findByCategory(String category);

    List<Product> findByBrand(String brand);

    Optional<Product> findByProductId(int productId);

    @Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Product> searchByName(@Param("name") String name);

    List<Product> findByIsActive(boolean isActive);

    Optional<Product> findByBarcode(String barcode);

    int countByCategory(String category);

    @Query("SELECT p FROM Product p WHERE p.currentQuantity <= p.reorderLevel AND p.isActive = true")
    List<Product> findLowStockProducts();
}
