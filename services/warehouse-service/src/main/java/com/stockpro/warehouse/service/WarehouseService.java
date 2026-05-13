package com.stockpro.warehouse.service;

import com.stockpro.warehouse.dto.request.WarehouseRequest;
import com.stockpro.warehouse.dto.response.StockLevelResponse;
import com.stockpro.warehouse.dto.response.WarehouseResponse;

import java.util.List;
import java.util.Optional;

public interface WarehouseService {

    WarehouseResponse createWarehouse(WarehouseRequest request);

    Optional<WarehouseResponse> getWarehouseById(int id);

    List<WarehouseResponse> getAllWarehouses(boolean includeInactive);

    WarehouseResponse updateWarehouse(int warehouseId, WarehouseRequest request);

    void deactivateWarehouse(int warehouseId);

    void activateWarehouse(int warehouseId);

    void deleteWarehouse(int warehouseId);

    List<WarehouseResponse> getWarehousesByManager(int managerId, boolean includeInactive);

    Optional<StockLevelResponse> getStockLevel(int warehouseId, int productId);
    List<StockLevelResponse> getAllStockByWarehouse(int warehouseId);
    List<StockLevelResponse> getStockLevelsByProductId(int productId);

    void updateStock(int warehouseId, int productId, int quantity);
    void updateStock(com.stockpro.warehouse.dto.request.StockUpdateRequest request);

    void adjustStock(int warehouseId, int productId, int delta);
    void adjustStock(com.stockpro.warehouse.dto.request.StockUpdateRequest request);

    void reserveStock(int warehouseId, int productId, int quantity);

    void releaseStock(int warehouseId, int productId, int quantity);

    void transferStock(int fromWarehouseId, int toWarehouseId, int productId, int quantity);

    List<StockLevelResponse> getLowStockItems(int warehouseId);

    com.stockpro.warehouse.dto.response.WarehouseStatsResponse getWarehouseStats(int warehouseId);

    void reconcileWarehouseCapacity(int warehouseId);
}
