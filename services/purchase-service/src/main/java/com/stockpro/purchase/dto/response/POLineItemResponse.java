package com.stockpro.purchase.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class POLineItemResponse {
    private int lineItemId;
    private int productId;
    
    // Enriched fields from product-service
    private String productName;
    private String productSku;
    
    private int quantity;
    private double unitCost;
    private double totalCost;
    private int receivedQty;
}
