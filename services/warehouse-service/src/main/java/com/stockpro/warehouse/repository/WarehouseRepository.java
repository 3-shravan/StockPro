package com.stockpro.warehouse.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.stockpro.warehouse.entity.Warehouse;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Integer> {

    Optional<Warehouse> findByWarehouseId(int warehouseId);

    List<Warehouse> findByManagerId(int managerId);

    List<Warehouse> findByActive(boolean isActive);

    List<Warehouse> findByLocation(String location);

    long countByActive(boolean isActive);
}
