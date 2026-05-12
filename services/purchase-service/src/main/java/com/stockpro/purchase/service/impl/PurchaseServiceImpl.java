package com.stockpro.purchase.service.impl;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.stockpro.purchase.entity.POLineItem;
import com.stockpro.purchase.entity.PurchaseOrder;
import com.stockpro.purchase.entity.PurchaseOrderStatus;
import com.stockpro.purchase.exception.CustomException;
import com.stockpro.purchase.exception.ResourceNotFoundException;
import com.stockpro.purchase.repository.PurchaseRepository;
import com.stockpro.purchase.service.PurchaseService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PurchaseServiceImpl implements the business logic for the procurement
 * lifecycle.
 * It coordinates between internal database state and external service updates
 * (Warehouse/Product).
 * 
 * Why: This implementation centralizes the "Brain" of the purchase
 * microservice,
 * ensuring that all status transitions and stock updates happen atomically.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PurchaseServiceImpl implements PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final RestTemplate restTemplate;

    @Value("${services.warehouse.url}")
    private String warehouseServiceUrl;

    @Value("${services.alert.url}")
    private String alertServiceUrl;

    @Value("${services.movement.url}")
    private String movementServiceUrl;

    @Value("${services.product.url}")
    private String productServiceUrl;

    private static final String GATEWAY_SECRET = "StockProGateway2024";

    private HttpHeaders getInternalHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Gateway-Secret", GATEWAY_SECRET);
        headers.set("X-User-Name", "system");
        headers.set("X-User-Roles", "ADMIN");
        return headers;
    }

    /**
     * Initializes a new Purchase Order in the database.
     * What: Sets baseline status and calculates monetary totals for the entire
     * order.
     */
    @Override
    @Transactional // What: Ensures the PO and all its Line Items are saved together or not at all.
    public PurchaseOrder createPO(PurchaseOrder order) {
        log.info("Creating new Purchase Order for supplier {} and warehouse {}", order.getSupplierId(),
                order.getWarehouseId());

        // Why: Every new order is automatically submitted for approval upon creation.
        order.setStatus(PurchaseOrderStatus.PENDING_APPROVAL);

        // What: Iterates through line items to set relationships and calculate
        // individual costs.
        // Why: JPA requires the "Child" items to have a reference to the "Parent"
        // order.
        double total = order.getLineItems().stream()
                .peek(item -> {
                    // Link to parent for database foreign key mapping.
                    item.setPurchaseOrder(order);
                    // Business Logic: Subtotal = Quantity * Cost per unit.
                    item.setTotalCost(item.getQuantity() * item.getUnitCost());
                    // Start at 0; we haven't physically received anything yet.
                    item.setReceivedQty(0);
                })
                .mapToDouble(POLineItem::getTotalCost)
                .sum();

        // Why: Storing a pre-calculated total on the header makes reporting and UI
        // display faster.
        order.setTotalAmount(total);
        PurchaseOrder saved = purchaseRepository.save(order);

        sendPoPendingAlert(saved);
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PurchaseOrder> getPOById(int poId) {
        return purchaseRepository.findByPoId(poId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrder> getPOsBySupplier(int supplierId) {
        return purchaseRepository.findBySupplierId(supplierId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrder> getPOsByStatus(PurchaseOrderStatus status) {
        return purchaseRepository.findByStatus(status);
    }
    @Override
    @Transactional
    public void submitForApproval(int poId) {
        log.info("Submitting PO ID: {} for approval", poId);
        PurchaseOrder order = purchaseRepository.findById(poId)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "Purchase Order not found with ID: " + poId));

        if (order.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new CustomException(HttpStatus.BAD_REQUEST, "Only DRAFT orders can be submitted for approval");
        }

        order.setStatus(PurchaseOrderStatus.PENDING_APPROVAL);
        purchaseRepository.save(order);
    }

    /**
     * Transitions a PO to APPROVED status.
     * What: Validates current status and persists the transition.
     * Why: Approval is the gatekeeper that allows inventory to be received and
     * money to be spent.
     */
    @Override
    @Transactional // Why: Ensures status change is atomic.
    public void approvePO(int poId) {
        log.info("Approving PO ID: {}", poId);

        // Fetch the order.
        PurchaseOrder order = purchaseRepository.findById(poId)
                .orElseThrow(
                        () -> new CustomException(HttpStatus.NOT_FOUND, "Purchase Order not found with ID: " + poId));

        // Validation: Only orders that haven't been processed yet can be approved.
        if (order.getStatus() != PurchaseOrderStatus.PENDING_APPROVAL
                && order.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new CustomException(HttpStatus.BAD_REQUEST, "Only DRAFT or PENDING_APPROVAL POs can be approved");
        }

        // Logic: Move to Approved.
        order.setStatus(PurchaseOrderStatus.APPROVED);
        purchaseRepository.save(order);

        clearPoAlerts(order.getWarehouseId(), "PO_PENDING");
        sendPoStatusAlert(order, "APPROVED", "PO Approved");
    }

    private void sendPoStatusAlert(PurchaseOrder order, String status, String title) {
        try {
            String url = alertServiceUrl + "/alerts";
            Map<String, Object> payload = new HashMap<>();
            payload.put("recipientId", 1);
            payload.put("type", "PO_PENDING");
            payload.put("severity", "INFO");
            payload.put("title", title);
            payload.put("message", "PO " + order.getPoId() + " has been " + status.toLowerCase() + ".");
            payload.put("relatedWarehouseId", order.getWarehouseId());
            payload.put("channel", "IN_APP");
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, getInternalHeaders());
            restTemplate.postForEntity(url, entity, Object.class);
        } catch (Exception ex) {
            log.warn("PO status alert dispatch failed for PO {}: {}", order.getPoId(), ex.getMessage());
        }
    }

    private void clearPoAlerts(int warehouseId, String type) {
        try {
            String url = alertServiceUrl + "/alerts/clear-type?type=" + type + "&warehouseId=" + warehouseId;
            HttpEntity<Void> entity = new HttpEntity<>(getInternalHeaders());
            restTemplate.exchange(url, HttpMethod.DELETE, entity, Void.class);
        } catch (Exception ex) {
            log.warn("Failed to clear alerts of type {} for warehouse {}: {}", type, warehouseId, ex.getMessage());
        }
    }

    /**
     * Processes physical goods receipt and triggers stock updates in the Warehouse
     * Service.
     * What: Updates received quantities and makes synchronous REST calls to the
     * warehouse service.
     * Why: This is the critical integration point where physical stock becomes
     * digital inventory.
     */
    @Override
    @Transactional // Why: If the warehouse-service call fails, we MUST roll back the database
                   // arrival entry.
    public void receiveGoods(int poId, List<POLineItem> receivedItems) {
        log.info("Receiving goods for PO ID: {}", poId);
        PurchaseOrder order = purchaseRepository.findById(poId)
                .orElseThrow(
                        () -> new CustomException(HttpStatus.NOT_FOUND, "Purchase Order not found with ID: " + poId));

        // Security check: Only approved or partially received orders can accept goods.
        if (order.getStatus() != PurchaseOrderStatus.APPROVED
                && order.getStatus() != PurchaseOrderStatus.PARTIALLY_RECEIVED) {
            throw new CustomException(HttpStatus.BAD_REQUEST,
                    "Can only receive goods for APPROVED or PARTIALLY_RECEIVED POs");
        }

        // Loop through the actual items offloaded from the truck.
        for (POLineItem receivedItem : receivedItems) {
            // Find the corresponding line item in our database.
            POLineItem existingItem = order.getLineItems().stream()
                    .filter(item -> item.getProductId() == receivedItem.getProductId())
                    .findFirst()
                    .orElseThrow(() -> new CustomException(HttpStatus.BAD_REQUEST,
                            "Product ID " + receivedItem.getProductId() + " not found in PO"));

            // Validation: Cannot receive more than was originally ordered.
            int newReceivedQty = existingItem.getReceivedQty() + receivedItem.getQuantity();
            if (newReceivedQty > existingItem.getQuantity()) {
                throw new CustomException(HttpStatus.BAD_REQUEST,
                        "Received quantity exceeds ordered quantity for product " + existingItem.getProductId());
            }

            // Update the running tally of received units.
            existingItem.setReceivedQty(newReceivedQty);

            // Integration: Call the Warehouse Service to increment the actual stock level.
            // Why: Inventory balance is owned by the warehouse-service, not the
            // purchase-service.
            adjustWarehouseStock(order.getWarehouseId(), existingItem.getProductId(), receivedItem.getQuantity(), order.getPoId());
            adjustProductGlobalStock(existingItem.getProductId(), receivedItem.getQuantity());

            // Movement is now automatically recorded by warehouse-service using the PO context
            // provided in adjustWarehouseStock.
        }

        // Status Logic: Check if the entire order is now complete.
        boolean allReceived = order.getLineItems().stream()
                .allMatch(item -> item.getReceivedQty() == item.getQuantity());

        if (allReceived) {
            // Why: Order is closed and ready for financial processing.
            order.setStatus(PurchaseOrderStatus.FULLY_RECEIVED);
            order.setReceivedDate(LocalDate.now());
            clearPoAlerts(order.getWarehouseId(), "OVERDUE_RECEIPT");
            clearPoAlerts(order.getWarehouseId(), "PO_PENDING");
        } else {
            // Why: Tells the system that more shipments are expected.
            order.setStatus(PurchaseOrderStatus.PARTIALLY_RECEIVED);
        }

        purchaseRepository.save(order);
    }

    /**
     * Internal helper to synchronize stock levels with the Warehouse Service.
     * What: Sends a synchronous PUT request to the external warehouse microservice.
     * Why: This ensures that our procurement data and the warehouse's inventory
     * data stay in sync.
     */
    private void adjustWarehouseStock(int warehouseId, int productId, int quantity, int poId) {
        log.info("Adjusting stock in warehouse {} for product {}: +{}", warehouseId, productId, quantity);
        String url = warehouseServiceUrl + "/warehouses/stock/adjust";
        // Build the payload for the external API.
        Map<String, Object> request = new HashMap<>();
        request.put("warehouseId", warehouseId);
        request.put("productId", productId);
        request.put("quantity", quantity);
        request.put("referenceId", poId);
        request.put("referenceType", "PURCHASE_ORDER");
        request.put("notes", "Received from PO #" + poId);

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, getInternalHeaders());
            restTemplate.exchange(url, HttpMethod.PUT, entity, Void.class);
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            log.error("Downstream error from warehouse-service: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            // Propagate the specific status and message from the warehouse-service
            throw new CustomException((HttpStatus) e.getStatusCode(), "Warehouse Service Error: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Failed to adjust stock in warehouse-service: {}", e.getMessage());
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to update stock level in warehouse-service: " + e.getMessage());
        }
    }

    /**
     * Internal helper to synchronize global stock levels with the Product Service.
     */
    private void adjustProductGlobalStock(int productId, int quantity) {
        log.info("Adjusting global stock for product {}: +{}", productId, quantity);
        String url = productServiceUrl + "/products/" + productId + "/stock?quantity=" + quantity;

        try {
            HttpEntity<Void> entity = new HttpEntity<>(getInternalHeaders());
            restTemplate.exchange(url, HttpMethod.PUT, entity, Void.class);
        } catch (Exception e) {
            log.error("Failed to update global product stock: {}", e.getMessage());
            // We don't necessarily want to fail the whole receipt if just the catalogue cache update fails,
            // but in this system we treat it as required for UI consistency.
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, "External Product Service Error: " + e.getMessage());
        }
    }

    /**
     * Terminates a Purchase Order.
     * What: Sets status to CANCELLED.
     * Why: To stop an order that was created in error or is no longer needed.
     */
    @Override
    @Transactional
    public void cancelPO(int poId) {
        log.info("Cancelling PO ID: {}", poId);

        // Fetch order.
        PurchaseOrder order = purchaseRepository.findById(poId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + poId));

        // Logic: Preventing cancellation of fulfilled orders.
        // Why: If goods are already received, you can't "un-buy" them via simple
        // cancellation.
        if (order.getStatus() == PurchaseOrderStatus.FULLY_RECEIVED
                || order.getStatus() == PurchaseOrderStatus.PARTIALLY_RECEIVED) {
            throw new CustomException(HttpStatus.BAD_REQUEST, "Cannot cancel already received POs");
        }

        order.setStatus(PurchaseOrderStatus.CANCELLED);
        purchaseRepository.save(order);
    }

    /**
     * Modifies an existing DRAFT Purchase Order.
     * What: Updates core fields and replaces the list of items.
     * Why: To allow correcting an order before it moves to approval.
     */
    @Override
    @Transactional // Why: Ensures the mapping and total update is atomic.
    public PurchaseOrder updatePO(int poId, PurchaseOrder updatedOrder) {
        log.info("Updating Draft PO ID: {}", poId);
        PurchaseOrder existingOrder = purchaseRepository.findById(poId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + poId));

        // Logic: Only DRAFT orders are mutable.
        if (existingOrder.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new CustomException(HttpStatus.BAD_REQUEST, "Only DRAFT POs can be updated");
        }

        // Update header fields.
        existingOrder.setSupplierId(updatedOrder.getSupplierId());
        existingOrder.setWarehouseId(updatedOrder.getWarehouseId());
        existingOrder.setExpectedDate(updatedOrder.getExpectedDate());
        existingOrder.setNotes(updatedOrder.getNotes());
        existingOrder.setReferenceNumber(updatedOrder.getReferenceNumber());

        // What: Clear and replace line items.
        // Why: It's safer to rebuild the items list and recalculate totals than to try
        // and sync individual rows.
        existingOrder.getLineItems().clear();
        double total = 0;
        for (POLineItem item : updatedOrder.getLineItems()) {
            // Re-establish relationships for JPA.
            item.setPurchaseOrder(existingOrder);
            item.setTotalCost(item.getQuantity() * item.getUnitCost());
            item.setReceivedQty(0);

            existingOrder.getLineItems().add(item);
            total += item.getTotalCost();
        }

        existingOrder.setTotalAmount(total);
        return purchaseRepository.save(existingOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrder> getPOsByWarehouse(int warehouseId) {
        return purchaseRepository.findByWarehouseId(warehouseId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrder> getPOsByDateRange(LocalDate start, LocalDate end) {
        return purchaseRepository.findByOrderDateBetween(start, end);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrder> getAllPOs() {
        return purchaseRepository.findAll();
    }

    private void sendPoPendingAlert(PurchaseOrder order) {
        try {
            String url = alertServiceUrl + "/alerts";
            Map<String, Object> payload = new HashMap<>();
            payload.put("recipientId", 1);
            payload.put("type", "PO_PENDING");
            payload.put("severity", "INFO");
            payload.put("title", "PO pending approval");
            payload.put("message", "PO " + order.getPoId() + " requires/has gone through approval workflow.");
            payload.put("relatedWarehouseId", order.getWarehouseId());
            payload.put("channel", "IN_APP");
            restTemplate.postForEntity(url, payload, Object.class);
        } catch (Exception ex) {
            log.warn("PO pending alert dispatch failed for PO {}: {}", order.getPoId(), ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public void dispatchOverdueReceiptAlerts() {
        LocalDate today = LocalDate.now();
        List<PurchaseOrder> approvedOrders = purchaseRepository.findByStatus(PurchaseOrderStatus.APPROVED);

        approvedOrders.stream()
                .filter(order -> order.getExpectedDate() != null && order.getExpectedDate().isBefore(today))
                .forEach(this::sendOverdueReceiptAlert);
    }

    private void sendOverdueReceiptAlert(PurchaseOrder order) {
        try {
            String url = alertServiceUrl + "/alerts";
            Map<String, Object> payload = new HashMap<>();
            payload.put("recipientId", 1);
            payload.put("type", "OVERDUE_RECEIPT");
            payload.put("severity", "CRITICAL");
            payload.put("title", "Overdue PO receipt");
            payload.put("message",
                    "PO " + order.getPoId() + " is overdue. Expected date was " + order.getExpectedDate() + ".");
            payload.put("relatedWarehouseId", order.getWarehouseId());
            payload.put("channel", "BOTH");
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, getInternalHeaders());
            restTemplate.postForEntity(url, entity, Object.class);
        } catch (Exception ex) {
            log.warn("Overdue receipt alert dispatch failed for PO {}: {}", order.getPoId(), ex.getMessage());
        }
    }
}
