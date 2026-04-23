package com.stockpro.purchase.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
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
public class PurchaseOrderRequest {

    @NotNull(message = "Supplier ID is required")
    private Integer supplierId;

    @NotNull(message = "Warehouse ID is required")
    private Integer warehouseId;

    private LocalDate expectedDate;

    private String notes;

    private String referenceNumber;

    @NotEmpty(message = "Purchase Order must have at least one line item")
    @Valid
    private List<POLineItemRequest> lineItems;
}
