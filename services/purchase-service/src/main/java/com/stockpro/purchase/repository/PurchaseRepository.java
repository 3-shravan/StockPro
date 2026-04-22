package com.stockpro.purchase.repository;

import com.stockpro.purchase.entity.PurchaseOrder;
import com.stockpro.purchase.entity.PurchaseOrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseRepository extends JpaRepository<PurchaseOrder, Integer> {
    @EntityGraph(attributePaths = {"lineItems"})
    List<PurchaseOrder> findBySupplierId(int supplierId);

    @EntityGraph(attributePaths = {"lineItems"})
    List<PurchaseOrder> findByWarehouseId(int warehouseId);

    @EntityGraph(attributePaths = {"lineItems"})
    List<PurchaseOrder> findByStatus(PurchaseOrderStatus status);

    @EntityGraph(attributePaths = {"lineItems"})
    Optional<PurchaseOrder> findByPoId(int poId);

    @EntityGraph(attributePaths = {"lineItems"})
    List<PurchaseOrder> findByOrderDateBetween(LocalDate start, LocalDate end);

    @EntityGraph(attributePaths = {"lineItems"})
    List<PurchaseOrder> findByCreatedById(int userId);

    @EntityGraph(attributePaths = {"lineItems"})
    List<PurchaseOrder> findAll();

    int countByStatus(PurchaseOrderStatus status);
}
