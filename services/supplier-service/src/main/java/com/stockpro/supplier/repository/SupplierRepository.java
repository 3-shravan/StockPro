package com.stockpro.supplier.repository;

import com.stockpro.supplier.entity.SupplierEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SupplierRepository extends JpaRepository<SupplierEntity, Integer> {

    Optional<SupplierEntity> findBySupplierId(int supplierId);

    List<SupplierEntity> findByCity(String city);

    List<SupplierEntity> findByCountry(String country);

    @Query("SELECT s FROM SupplierEntity s WHERE s.name LIKE %:name%")
    List<SupplierEntity> searchByName(@Param("name") String name);

    List<SupplierEntity> findByActive(boolean active);

    Optional<SupplierEntity> findByTaxId(String taxId);

    long countByActive(boolean active);
}
