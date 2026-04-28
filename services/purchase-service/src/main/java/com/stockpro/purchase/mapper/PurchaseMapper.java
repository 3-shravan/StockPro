package com.stockpro.purchase.mapper;

import com.stockpro.purchase.dto.request.POLineItemRequest;
import com.stockpro.purchase.dto.request.PurchaseOrderRequest;
import com.stockpro.purchase.dto.response.POLineItemResponse;
import com.stockpro.purchase.dto.response.PurchaseOrderResponse;
import com.stockpro.purchase.entity.POLineItem;
import com.stockpro.purchase.entity.PurchaseOrder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PurchaseMapper {

    @Mapping(target = "poId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "totalAmount", ignore = true)
    @Mapping(target = "receivedDate", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "orderDate", ignore = true) // Handled by @PrePersist in entity
    @Mapping(target = "createdById", ignore = true) // Will be set from SecurityContext
    PurchaseOrder toEntity(PurchaseOrderRequest request);

    @Mapping(target = "lineItemId", ignore = true)
    @Mapping(target = "purchaseOrder", ignore = true)
    @Mapping(target = "totalCost", ignore = true)
    @Mapping(target = "receivedQty", ignore = true)
    POLineItem toEntity(POLineItemRequest request);

    @Mapping(target = "supplierName", ignore = true)
    @Mapping(target = "warehouseName", ignore = true)
    PurchaseOrderResponse toResponse(PurchaseOrder order);

    @Mapping(target = "productName", ignore = true)
    @Mapping(target = "productSku", ignore = true)
    POLineItemResponse toResponse(POLineItem item);

    List<PurchaseOrderResponse> toResponseList(List<PurchaseOrder> orders);
}
