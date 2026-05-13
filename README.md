# StockPro: Microservices Inventory Management Platform

StockPro is a production-grade, distributed inventory and procurement management system designed for multi-warehouse (Hub) organizations. It utilizes a microservices architecture to ensure high availability, horizontal scalability, and strict data isolation between geographical locations.

---

## 🏗 System Architecture

StockPro is built on a **Cloud-Native Microservices** foundation:

*   **Discovery Server (Eureka)**: Centralized service registry allowing microservices to locate each other dynamically.
*   **API Gateway (Spring Cloud Gateway)**: The entry point for all client requests. It handles JWT validation, role extraction, and data-scoping header injection.
*   **Auth Service**: Identity provider managing users, RBAC (Role-Based Access Control), and Hub assignments.
*   **Core Services**:
    *   `product-service`: Master catalog management.
    *   `warehouse-service`: Real-time stock levels and hub capacity tracking.
    *   `purchase-service`: Supplier management and procurement workflows.
    *   `movement-service`: Immutable audit logging for every item movement.
    *   `alert-service`: Real-time monitoring and low-stock notifications.
    *   `report-service`: Aggregated analytics and financial valuations.

---

## 👥 Role & Responsibility Matrix

The system enforces strict **Multi-Tenant Data Isolation** based on the user's role and assigned Hub.

### 🏢 Global Roles (Unbound)
These roles have oversight across the entire organization and are not restricted to any single warehouse.

*   **Admin**: 
    *   **Control**: Total.
    *   **Responsibility**: User management, hub configuration, global settings, and full system visibility.
*   **Procurement Officer**:
    *   **Control**: Organization-wide Procurement.
    *   **Responsibility**: Maintains relationships with **Suppliers**. They act as a central procurement hub, creating purchase orders for any warehouse based on global demand. They are **not bound** to a specific hub, allowing them to serve any Manager's requirements.

### 📍 Scoped Roles (Bound to Hub)
These roles are strictly partitioned. They can only see and interact with data belonging to their assigned **Deployment Hub**.

*   **Warehouse Manager**:
    *   **Control**: Local Hub Authority.
    *   **Responsibility**: Oversees their specific hub. They **Approve or Reject** purchase orders initiated by Officers for their warehouse. They monitor local analytics and manage staff operations.
*   **Warehouse Staff**:
    *   **Control**: Local Hub Operations.
    *   **Responsibility**: The "hands-on" users. They record "Stock-ins" (receiving orders) and "Stock-outs" (sales/shipments) and view the local audit trail.

---

## 🔄 The Procurement Lifecycle

1.  **Sourcing (Officer)**: The **Procurement Officer** connects with a Supplier and initiates a **Purchase Order (PO)**. They specify which Hub (e.g., "New York") the stock is for.
2.  **Authorization (Manager)**: The **Warehouse Manager** for the "New York Hub" sees the pending PO on their scoped dashboard. They verify the requirement and **Approve** the order.
3.  **Receipt (Staff)**: Once the shipment arrives at the New York facility, the **Staff** member (also scoped to New York) marks the items as "Received."
4.  **Automatic Inventory Update**: The system automatically increases the stock in the `warehouse-service` and logs an immutable audit event in the `movement-service`.

---

## 🔒 Security & Data Scoping

StockPro uses a "Trust-at-the-Edge" security model:

1.  **Header Injection**: The API Gateway extracts the user's `department` (Hub Name) from the JWT and injects it as an `X-User-Department` header into downstream requests.
2.  **Context Reconstruction**: Microservices use an `InternalSecurityFilter` to rebuild the security context, including the Hub assignment.
3.  **Backend Enforcement**: Controllers and Services check if the user is a `MANAGER` or `STAFF`. If so, they automatically append filters to database queries so the user **cannot even see** data from other hubs, even if they know the IDs.
4.  **Internal Gateway Secret**: Services only accept requests containing a pre-shared `X-Internal-Gateway-Secret`, ensuring that internal APIs cannot be called directly by unauthorized parties.
