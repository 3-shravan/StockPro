package com.stockpro.purchase;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PurchaseServiceApplication {

    public static void main(String[] args) {
        // Set context name for logging or other purposes if needed
        System.setProperty("spring.application.name", "purchase-service");
        SpringApplication.run(PurchaseServiceApplication.class, args);
    }
}
