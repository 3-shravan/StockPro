package com.stockpro.purchase.dto.response;

import com.stockpro.purchase.entity.PurchaseOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderResponse {
    private int poId;
    private int supplierId;
    private String supplierName; // Placeholder for enrichment
    
    private int warehouseId;
    private String warehouseName; // Placeholder for enrichment
    
    private int createdById;
    private PurchaseOrderStatus status;
    private double totalAmount;
    private LocalDate orderDate;
    private LocalDate expectedDate;
    private LocalDate receivedDate;
    private String notes;
    private String referenceNumber;
    private List<POLineItemResponse> lineItems;
}
