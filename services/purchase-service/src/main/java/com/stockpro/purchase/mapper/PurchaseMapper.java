package com.stockpro.purchase.mapper;

import com.stockpro.purchase.dto.request.POLineItemRequest;
import com.stockpro.purchase.dto.request.PurchaseOrderRequest;
import com.stockpro.purchase.dto.response.POLineItemResponse;
import com.stockpro.purchase.dto.response.PurchaseOrderResponse;
import com.stockpro.purchase.entity.POLineItem;
import com.stockpro.purchase.entity.PurchaseOrder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * PurchaseMapper handles the conversion between DTOs and Entities.
 * Manual implementation to resolve persistent MapStruct/Lombok classloading issues.
 */
@Component
public class PurchaseMapper {

    public PurchaseOrder toEntity(PurchaseOrderRequest request) {
        if (request == null) return null;
        
        PurchaseOrder order = new PurchaseOrder();
        order.setSupplierId(request.getSupplierId());
        order.setWarehouseId(request.getWarehouseId());
        order.setExpectedDate(request.getExpectedDate());
        order.setNotes(request.getNotes());
        order.setReferenceNumber(request.getReferenceNumber());
        
        if (request.getLineItems() != null) {
            List<POLineItem> items = request.getLineItems().stream()
                    .map(this::toEntity)
                    .collect(Collectors.toList());
            order.setLineItems(items);
            // Service layer will handle setting back-references
        }
        
        return order;
    }

    public POLineItem toEntity(POLineItemRequest request) {
        if (request == null) return null;
        
        POLineItem item = new POLineItem();
        item.setProductId(request.getProductId());
        item.setQuantity(request.getQuantity());
        item.setUnitCost(request.getUnitCost());
        // lineItemId is auto-generated, receivedQty starts at 0
        return item;
    }

    public PurchaseOrderResponse toResponse(PurchaseOrder order) {
        if (order == null) return null;
        
        PurchaseOrderResponse response = new PurchaseOrderResponse();
        response.setPoId(order.getPoId());
        response.setSupplierId(order.getSupplierId());
        response.setWarehouseId(order.getWarehouseId());
        response.setCreatedById(order.getCreatedById());
        response.setStatus(order.getStatus());
        response.setTotalAmount(order.getTotalAmount());
        response.setOrderDate(order.getOrderDate());
        response.setExpectedDate(order.getExpectedDate());
        response.setReceivedDate(order.getReceivedDate());
        response.setNotes(order.getNotes());
        response.setReferenceNumber(order.getReferenceNumber());
        
        if (order.getLineItems() != null) {
            response.setLineItems(order.getLineItems().stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList()));
        }
        
        return response;
    }

    public POLineItemResponse toResponse(POLineItem item) {
        if (item == null) return null;
        
        POLineItemResponse response = new POLineItemResponse();
        response.setLineItemId(item.getLineItemId());
        response.setProductId(item.getProductId());
        response.setQuantity(item.getQuantity());
        response.setUnitCost(item.getUnitCost());
        response.setTotalCost(item.getTotalCost());
        response.setReceivedQty(item.getReceivedQty());
        return response;
    }

    public List<PurchaseOrderResponse> toResponseList(List<PurchaseOrder> orders) {
        if (orders == null) return new ArrayList<>();
        return orders.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
