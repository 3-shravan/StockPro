package com.stockpro.warehouse.service;

import com.stockpro.warehouse.dto.request.WarehouseRequest;
import com.stockpro.warehouse.dto.response.StockLevelResponse;
import com.stockpro.warehouse.dto.response.WarehouseResponse;

import java.util.List;
import java.util.Optional;

public interface WarehouseService {

    WarehouseResponse createWarehouse(WarehouseRequest request);

    Optional<WarehouseResponse> getById(int warehouseId);

    List<WarehouseResponse> getAllWarehouses();

    WarehouseResponse updateWarehouse(int warehouseId, WarehouseRequest request);

    void deactivateWarehouse(int warehouseId);

    Optional<StockLevelResponse> getStockLevel(int warehouseId, int productId);

    void updateStock(int warehouseId, int productId, int quantity);
    void adjustStock(int warehouseId, int productId, int delta);
    void reserveStock(int warehouseId, int productId, int quantity);

    void releaseReservation(int warehouseId, int productId, int quantity);

    void transferStock(int fromWarehouseId, int toWarehouseId, int productId, int quantity, int managerId);

    List<StockLevelResponse> getLowStockItems(int warehouseId);
}
