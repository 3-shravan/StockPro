package com.stockpro.supplier.repository;

import com.stockpro.supplier.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SupplierRepository extends JpaRepository<Supplier, Integer> {

    Optional<Supplier> findBySupplierId(int supplierId);

    List<Supplier> findByCity(String city);

    List<Supplier> findByCountry(String country);

    @Query("SELECT s FROM Supplier s WHERE s.name LIKE %:name%")
    List<Supplier> searchByName(@Param("name") String name);

    List<Supplier> findByActive(boolean active);

    Optional<Supplier> findByTaxId(String taxId);

    long countByActive(boolean active);
}
