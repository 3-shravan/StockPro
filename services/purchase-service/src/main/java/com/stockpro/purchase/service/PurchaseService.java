package com.stockpro.purchase.service;

import com.stockpro.purchase.entity.POLineItem;
import com.stockpro.purchase.entity.PurchaseOrder;
import com.stockpro.purchase.entity.PurchaseOrderStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PurchaseService {
    PurchaseOrder createPO(PurchaseOrder order);

    Optional<PurchaseOrder> getPOById(int poId);

    List<PurchaseOrder> getPOsBySupplier(int supplierId);

    List<PurchaseOrder> getPOsByStatus(PurchaseOrderStatus status);

    void approvePO(int poId);

    void receiveGoods(int poId, List<POLineItem> receivedItems); // supports partial receipt

    void cancelPO(int poId);

    PurchaseOrder updatePO(int poId, PurchaseOrder order);

    List<PurchaseOrder> getPOsByWarehouse(int warehouseId);

    List<PurchaseOrder> getPOsByDateRange(LocalDate start, LocalDate end);

    List<PurchaseOrder> getAllPOs();

    void dispatchOverdueReceiptAlerts();
}
