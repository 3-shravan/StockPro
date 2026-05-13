package com.stockpro.purchase.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "po_line_items")
@Getter
@Setter
@NoArgsConstructor
public class POLineItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "line_item_id")
    private int lineItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "po_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    @Column(name = "product_id", nullable = false)
    private int productId;

    @Column(name = "quantity", nullable = false)
    private int quantity;

    @Column(name = "unit_cost", nullable = false)
    private double unitCost;

    @Column(name = "total_cost", nullable = false)
    private double totalCost;

    @Column(name = "received_qty", nullable = false)
    private int receivedQty;
}
