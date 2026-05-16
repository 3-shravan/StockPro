package com.stockpro.supplier.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "suppliers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int supplierId;

    @Column(nullable = false)
    private String name;

    private String contactPerson;

    private String email;

    private String phone;

    private String address;

    private String city;

    private String country;

    private String taxId;

    private String paymentTerms;

    private int leadTimeDays;

    private double rating;

    @Builder.Default
    @Column(name = "is_active")
    private boolean active = true;

    // Standard equals and hashCode on name and taxId (business keys)

}
