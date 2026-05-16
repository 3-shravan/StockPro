package com.stockpro.warehouse.mapper;

import com.stockpro.warehouse.entity.StockLevel;
import com.stockpro.warehouse.dto.response.StockLevelResponse;
import org.springframework.stereotype.Component;

/**
 * StockMapper handles the transformation between StockLevel entities and their DTOs.
 * 
 * Why: We are using a manual implementation instead of MapStruct here because of a 
 * persistent annotation processor conflict (erroneous element null). This manual 
 * approach is 100% stable and avoids build-time race conditions between Lombok and MapStruct.
 */
@Component
public class StockMapper {

    public StockLevelResponse toResponse(StockLevel stockLevel) {
        if (stockLevel == null) {
            return null;
        }

        return StockLevelResponse.builder()
                .stockId(stockLevel.getStockId())
                .warehouseId(stockLevel.getWarehouseId())
                .productId(stockLevel.getProductId())
                .quantity(stockLevel.getQuantity())
                .reservedQuantity(stockLevel.getReservedQuantity())
                .availableQuantity(stockLevel.getQuantity() - stockLevel.getReservedQuantity())
                .location(stockLevel.getLocation())
                .lastUpdated(stockLevel.getLastUpdated())
                .build();
    }
}
