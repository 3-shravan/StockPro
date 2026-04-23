# StockPro — Microservices Architecture Reference

> **Purpose:** This document is the authoritative reference for every agent or developer building any microservice in the StockPro platform. Read this fully before writing any code. Every service must conform to the standards defined here.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Engineering Handbook (Non-Negotiable Standards)](#2-engineering-handbook-non-negotiable-standards)
3. [Microservice Registry](#3-microservice-registry)
4. [Universal Folder Structure](#4-universal-folder-structure)
5. [Universal Class Structure Per Service](#5-universal-class-structure-per-service)
6. [API Response Standard](#6-api-response-standard)
7. [JWT & Security Standard](#7-jwt--security-standard)
8. [Environment & Docker Standard](#8-environment--docker-standard)
9. [Service-by-Service Specifications](#9-service-by-service-specifications)
   - [9.1 auth-service](#91-auth-service)
   - [9.2 product-service](#92-product-service)
   - [9.3 warehouse-service](#93-warehouse-service)
   - [9.4 purchase-service](#94-purchase-service)
   - [9.5 supplier-service](#95-supplier-service)
   - [9.6 movement-service](#96-movement-service)
   - [9.7 alert-service](#97-alert-service)
   - [9.8 report-service](#98-report-service)
   - [9.9 stockpro-web (MVC Layer)](#99-stockpro-web-mvc-layer)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Technology Stack](#11-technology-stack)
12. [Glossary](#12-glossary)

---

## 1. Platform Overview

**StockPro** is a full-stack Inventory Management System for mid-size businesses operating across multiple warehouses. It is built as a **microservices system** modelled on the EShoppingZone reference pattern.

### Core Capabilities
- Complete stock visibility across multiple warehouses
- Structured purchase order procurement workflows
- Full immutable audit trail for every stock movement
- Intelligent alerting and reorder automation
- Role-based access for four distinct user personas

### Four Roles
| Role | Responsibility |
|---|---|
| **Warehouse Staff** | Day-to-day stock operations: receipts, issues, transfers, adjustments |
| **Inventory Manager** | Product catalogue, warehouse config, reports, alert thresholds |
| **Purchase Officer** | Procurement: POs, goods receipt, supplier management |
| **Admin** | User management, warehouse setup, platform analytics, system config |

### System Actors (for Use Case reference)
| Actor | Type | Description |
|---|---|---|
| Warehouse Staff | Human | Records stock receipts, issues, transfers, adjustments |
| Inventory Manager | Human | Oversees products, stock health, reports, alerts |
| Purchase Officer | Human | Creates POs, manages suppliers |
| Admin | Human | Full system control |
| System (Automated) | Automated | Triggers alerts, runs snapshots, checks overdue POs |
| Supplier | External | Receives reorder emails; fulfils purchase orders |

---

## 2. Engineering Handbook (Non-Negotiable Standards)

> **Every microservice MUST follow all rules in this section without exception.**

### 2.1 Core Principles

- Every microservice follows the **same structure and patterns**
- **No business logic in controllers** — controllers are HTTP-only
- All configurations must be **externalized** (environment variables / `.env`)
- APIs must follow a **consistent response format** (see Section 6)
- Code must be **modular, readable, and testable**

### 2.2 Architecture Principles

- Each service is **independent and self-contained**
- Services communicate via **REST APIs** — no shared databases
- **auth-service** is responsible for authentication and JWT generation
- All other services **validate tokens** (temporarily); JWT validation will later move to API Gateway
- Services must **NOT** perform login logic or access the user database for authentication

### 2.3 Anti-Patterns — Never Do These

- Mixing business logic in a controller
- Returning an entity directly from an API (always use DTOs)
- Hardcoding credentials or secrets
- Using different response formats across services
- Copy-pasting architecture inconsistently between services
- Over-engineering early

---

## 3. Microservice Registry

| Service | Base Package | Port | Primary Domain |
|---|---|---|---|
| `auth-service` | `com.stockpro.auth` | 8081 | User accounts, JWT, role management |
| `product-service` | `com.stockpro.product` | 8082 | Product catalogue, SKU/barcode, reorder config |
| `warehouse-service` | `com.stockpro.warehouse` | 8083 | Warehouse registry, stock levels, inter-warehouse transfer |
| `purchase-service` | `com.stockpro.purchase` | 8084 | PO lifecycle, goods receipt, line-item tracking |
| `supplier-service` | `com.stockpro.supplier` | 8085 | Supplier profiles, payment terms, performance rating |
| `movement-service` | `com.stockpro.movement` | 8086 | Immutable stock movement audit trail |
| `alert-service` | `com.stockpro.alert` | 8087 | Low-stock/overstock alerts, PO alerts, email dispatch |
| `report-service` | `com.stockpro.report` | 8088 | Inventory snapshots, valuation, turnover, dead stock |
| `stockpro-web` | `com.stockpro.web` | 8080 | Spring MVC controllers, Thymeleaf view rendering |

Inter-service calls use **RestTemplate** (synchronous). Asynchronous alert dispatch and daily snapshot jobs use **RabbitMQ + Spring Scheduler**.

---

## 4. Universal Folder Structure

Every microservice must use the following layered package structure. Do not deviate.

```
com.stockpro.<servicename>/
├── config/          → Spring Security, JWT filter, CORS, app config beans
├── controller/      → REST controllers (@RestController) — HTTP layer ONLY, no logic
├── service/         → Business logic interfaces
│   └── impl/        → Business logic implementations
├── repository/      → Spring Data JPA interfaces
├── entity/          → JPA entity classes (@Entity)
├── dto/
│   ├── request/     → Incoming API payloads
│   └── response/    → Outgoing API payloads
├── mapper/          → Entity ↔ DTO conversion (no business logic)
├── exception/       → Custom exceptions + GlobalExceptionHandler (@ControllerAdvice)
├── common/          → ApiResponse wrapper, constants, shared utilities
└── validation/      → Validation groups and custom validators
```

### Layer Responsibilities

| Layer | Responsibility | Rules |
|---|---|---|
| `controller` | Receive HTTP request, call service, return response | No `if/else` business logic; no direct repo calls |
| `service` (interface) | Declare the business contract | No implementation |
| `service/impl` | All business logic lives here | No direct HTTP concerns |
| `repository` | Database queries via Spring Data JPA | Custom JPQL/native queries only if needed |
| `entity` | JPA domain model | No business methods; no DTO fields |
| `dto/request` | Validated input payload | `@Valid`, `@NotNull`, etc. |
| `dto/response` | Output payload | Never expose `passwordHash` or internal IDs unnecessarily |
| `mapper` | Convert entity ↔ DTO | No `if/else` logic; no service calls |
| `exception` | Custom exception classes + global handler | Always map to correct HTTP status |
| `common` | `ApiResponse<T>`, `ErrorResponse`, constants | No business logic |

---

## 5. Universal Class Structure Per Service

Every service implements exactly **five core layers**:

```
Entity / POJO  →  Repository Interface  →  Service Interface  →  ServiceImpl  →  REST Controller
```

### Entity Pattern
```java
@Entity
@Table(name = "table_name")
public class MyEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    // fields with getters/setters
    // equals() and hashCode() on business key
}
```

### Repository Pattern
```java
public interface MyRepository extends JpaRepository<MyEntity, Integer> {
    Optional<MyEntity> findByUniqueField(String value);
    List<MyEntity> findByStatus(String status);
}
```

### Service Interface Pattern
```java
public interface MyService {
    MyEntity create(MyEntity entity);
    Optional<MyEntity> getById(int id);
    List<MyEntity> getAll();
    MyEntity update(int id, MyEntity entity);
    void delete(int id);
}
```

### ServiceImpl Pattern
```java
@Service
public class MyServiceImpl implements MyService {
    @Autowired
    private MyRepository repository;
    // All business logic here
    // Throw meaningful custom exceptions
    // Never return entities — convert via mapper first if needed internally
}
```

### Controller Pattern
```java
@RestController
@RequestMapping("/api/v1/resource")
public class MyController {
    @Autowired
    private MyService service;
    // Only: receive request → call service → return ApiResponse
    // No business logic
}
```

---

## 6. API Response Standard

**All APIs across all services must return this structure.**

### Success Response (`ApiResponse<T>`)

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": { ... },
  "timestamp": "2026-04-22T10:30:00Z"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "error": "Field 'sku' must not be blank",
  "status": 400,
  "path": "/api/v1/products",
  "timestamp": "2026-04-22T10:30:00Z"
}
```

### Java Implementation (place in `common/`)

```java
// ApiResponse.java
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private String timestamp;
}

// ErrorResponse.java
public class ErrorResponse {
    private boolean success = false;
    private String message;
    private String error;
    private int status;
    private String path;
    private String timestamp;
}
```

### GlobalExceptionHandler (place in `exception/`)

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    // Handle ResourceNotFoundException → 404
    // Handle ValidationException → 400
    // Handle Exception → 500
    // Never expose stack traces in response
}
```

---

## 7. JWT & Security Standard

### Token Generation (auth-service only)
- JWT generated **only** in `auth-service`
- Tokens expire in **8 hours**
- Token contains: `userId`, `email`, `role`, `department`, `iat`, `exp`
- Passwords stored as **bcrypt** hashes — never plaintext

### Token Validation (all other services)
- Every request must include: `Authorization: Bearer <token>`
- Each service validates the token in a `JwtAuthFilter` (placed in `config/`)
- After validation, set `SecurityContext` with user identity and role
- Services must **NOT** perform login or access the user database

### Role Enum
```java
public enum Role {
    STAFF,      // Warehouse Staff
    MANAGER,    // Inventory Manager
    OFFICER,    // Purchase Officer
    ADMIN       // Administrator
}
```

### Endpoint Access Matrix

| Role | Accessible Services |
|---|---|
| `STAFF` | warehouse-service (read + stock ops), product-service (read), alert-service (read/ack), movement-service (read) |
| `MANAGER` | All above + product-service (write), report-service, alert-service (configure) |
| `OFFICER` | purchase-service, supplier-service, alert-service (read) |
| `ADMIN` | All services, all operations |

---

## 8. Environment & Docker Standard

### `.env` File Pattern

```properties
# Common (shared)
JWT_SECRET=your-secret-key
JWT_EXPIRY=28800000

# Development (prefixed LOCAL_)
LOCAL_DB_URL=jdbc:mysql://localhost:3306/stockpro_auth
LOCAL_DB_USER=root
LOCAL_DB_PASSWORD=local_password

# Production (default — preferred over LOCAL_)
DB_URL=jdbc:mysql://auth-db:3306/stockpro_auth
DB_USER=stockpro_user
DB_PASSWORD=prod_password
```

### Resolution Pattern in `application.properties`

```properties
spring.datasource.url=${DB_URL:${LOCAL_DB_URL}}
spring.datasource.username=${DB_USER:${LOCAL_DB_USER}}
spring.datasource.password=${DB_PASSWORD:${LOCAL_DB_PASSWORD}}
```

### Dockerfile Pattern (every service)

```dockerfile
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 808X
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Docker Compose Rule
- Services connect using **container names**, not `localhost`
- All services declared in root-level `docker-compose.yml`
- Each service reads env vars from shared `.env`

---

## 9. Service-by-Service Specifications

---

### 9.1 auth-service

**Base Package:** `com.stockpro.auth`  
**Port:** `8081`  
**Database:** `stockpro_auth`  
**Responsibility:** Authentication gateway — user registration, login, JWT lifecycle, profile management, password change, account deactivation.

#### Entity: `User`

| Field | Type | Notes |
|---|---|---|
| `userId` | `int` | PK, auto-generated |
| `fullName` | `String` | Not null |
| `email` | `String` | Unique, not null |
| `passwordHash` | `String` | bcrypt, never expose in response |
| `phone` | `String` | |
| `role` | `String` | STAFF / MANAGER / OFFICER / ADMIN |
| `department` | `String` | For department-level scoping |
| `isActive` | `boolean` | Default true |
| `createdAt` | `LocalDateTime` | Auto-set |
| `lastLoginAt` | `LocalDateTime` | Updated on login |

#### Repository: `UserRepository`

```java
Optional<User> findByEmail(String email);
User findByUserId(int userId);
boolean existsByEmail(String email);
List<User> findAllByRole(String role);
List<User> findByDepartment(String department);
List<User> findByIsActive(boolean isActive);
void deleteByUserId(int userId);
```

#### Service Interface: `AuthService`

```java
User register(User user);
String login(String email, String password);   // returns JWT
void logout(String token);
boolean validateToken(String token);
String refreshToken(String token);
User getUserById(int userId);
User getUserByEmail(String email);
User updateProfile(int userId, User user);
void changePassword(int userId, String newPassword);
void deactivateUser(int userId);
List<User> getAllUsers();
```

#### REST Endpoints: `AuthResource`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register a new user |
| `POST` | `/api/v1/auth/login` | Public | Login, receive JWT |
| `POST` | `/api/v1/auth/logout` | Authenticated | Invalidate token |
| `POST` | `/api/v1/auth/refresh` | Authenticated | Refresh JWT |
| `GET` | `/api/v1/auth/profile/{id}` | Authenticated | Get own profile |
| `PUT` | `/api/v1/auth/profile/{id}` | Authenticated | Update profile |
| `PUT` | `/api/v1/auth/password/{id}` | Authenticated | Change password |
| `PUT` | `/api/v1/auth/deactivate/{id}` | ADMIN | Deactivate user |
| `GET` | `/api/v1/auth/users` | ADMIN | List all users |

---

### 9.2 product-service

**Base Package:** `com.stockpro.product`  
**Port:** `8082`  
**Database:** `stockpro_product`  
**Responsibility:** Master product catalogue — full metadata, pricing, barcode lookup, reorder configuration.

> **Note:** `reorderLevel` and `maxStockLevel` are read by `alert-service` to trigger low-stock and overstock alerts.

#### Entity: `Product`

| Field | Type | Notes |
|---|---|---|
| `productId` | `int` | PK, auto-generated |
| `sku` | `String` | Unique, not null |
| `name` | `String` | Not null |
| `description` | `String` | |
| `category` | `String` | |
| `brand` | `String` | |
| `unitOfMeasure` | `String` | e.g., PCS, KG, LITRE |
| `costPrice` | `double` | Purchase cost |
| `sellingPrice` | `double` | |
| `reorderLevel` | `int` | Low-stock threshold |
| `maxStockLevel` | `int` | Overstock threshold |
| `leadTimeDays` | `int` | Days from PO to delivery |
| `imageUrl` | `String` | AWS S3 URL |
| `isActive` | `boolean` | Default true |
| `barcode` | `String` | For scan-based lookup |

#### Repository: `ProductRepository`

```java
Optional<Product> findBySku(String sku);
List<Product> findByCategory(String category);
List<Product> findByBrand(String brand);
Optional<Product> findByProductId(int productId);
List<Product> searchByName(String name);        // LIKE query
List<Product> findByIsActive(boolean isActive);
Optional<Product> findByBarcode(String barcode);
int countByCategory(String category);
```

#### Service Interface: `ProductService`

```java
Product createProduct(Product product);
Optional<Product> getById(int productId);
Optional<Product> getBySku(String sku);
List<Product> getByCategory(String category);
List<Product> getByBrand(String brand);
List<Product> searchProducts(String query);
Product updateProduct(int productId, Product product);
void deactivateProduct(int productId);
void deleteProduct(int productId);
List<Product> getAllProducts();
Optional<Product> getByBarcode(String barcode);
List<Product> getLowStockProducts();
```

#### REST Endpoints: `ProductResource`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/products` | MANAGER, ADMIN | Create product |
| `GET` | `/api/v1/products/{id}` | All | Get by ID |
| `GET` | `/api/v1/products/sku/{sku}` | All | Get by SKU |
| `GET` | `/api/v1/products/category/{cat}` | All | Get by category |
| `GET` | `/api/v1/products/brand/{brand}` | All | Get by brand |
| `GET` | `/api/v1/products/barcode/{barcode}` | All | Barcode lookup |
| `GET` | `/api/v1/products/search?q=` | All | Search by name |
| `GET` | `/api/v1/products` | All | List all active |
| `GET` | `/api/v1/products/low-stock` | MANAGER, ADMIN | Products below reorder level |
| `PUT` | `/api/v1/products/{id}` | MANAGER, ADMIN | Update product |
| `PUT` | `/api/v1/products/{id}/deactivate` | MANAGER, ADMIN | Deactivate |
| `DELETE` | `/api/v1/products/{id}` | ADMIN | Delete |

---

### 9.3 warehouse-service

**Base Package:** `com.stockpro.warehouse`  
**Port:** `8083`  
**Database:** `stockpro_warehouse`  
**Responsibility:** Physical warehouse registry + per-product stock levels within each warehouse. Atomic inter-warehouse stock transfers. Low-stock scheduler query source for alert-service.

#### Entity: `Warehouse`

| Field | Type | Notes |
|---|---|---|
| `warehouseId` | `int` | PK, auto-generated |
| `name` | `String` | Not null |
| `location` | `String` | City/region |
| `address` | `String` | |
| `managerId` | `int` | FK → User |
| `capacity` | `int` | Max units |
| `usedCapacity` | `int` | Current used |
| `isActive` | `boolean` | Default true |
| `phone` | `String` | |
| `createdAt` | `LocalDate` | |

#### Entity: `StockLevel`

| Field | Type | Notes |
|---|---|---|
| `stockId` | `int` | PK, auto-generated |
| `warehouseId` | `int` | FK → Warehouse |
| `productId` | `int` | FK → Product |
| `quantity` | `int` | Total on-hand |
| `reservedQuantity` | `int` | Allocated to open orders |
| `location` | `String` | Bin/aisle reference |
| `lastUpdated` | `LocalDateTime` | |

> **Computed:** `availableQuantity = quantity − reservedQuantity`

> **Concurrency:** Use `@Version` (optimistic locking) on `StockLevel` to prevent race conditions during concurrent deductions.

#### Repository: `WarehouseRepository`

```java
Optional<Warehouse> findByWarehouseId(int warehouseId);
List<Warehouse> findByManagerId(int managerId);
List<Warehouse> findByIsActive(boolean isActive);
List<Warehouse> findByLocation(String location);
Optional<StockLevel> findStockByWarehouseAndProduct(int warehouseId, int productId);
List<StockLevel> findLowStockItems(int threshold);   // custom JPQL
int countByIsActive(boolean isActive);
```

#### Service Interface: `WarehouseService`

```java
Warehouse createWarehouse(Warehouse warehouse);
Optional<Warehouse> getById(int warehouseId);
List<Warehouse> getAllWarehouses();
Warehouse updateWarehouse(int warehouseId, Warehouse warehouse);
void deactivateWarehouse(int warehouseId);
Optional<StockLevel> getStockLevel(int warehouseId, int productId);
void updateStock(int warehouseId, int productId, int quantity);
void reserveStock(int warehouseId, int productId, int quantity);
void releaseReservation(int warehouseId, int productId, int quantity);
void transferStock(int fromWarehouseId, int toWarehouseId, int productId, int quantity);
List<StockLevel> getLowStockItems(int threshold);
```

> **Critical:** `transferStock()` must execute as a **single atomic transaction** — debit source, credit destination. No partial transfers allowed.

#### REST Endpoints: `WarehouseResource`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/warehouses` | ADMIN | Create warehouse |
| `GET` | `/api/v1/warehouses/{id}` | All | Get warehouse |
| `GET` | `/api/v1/warehouses` | All | List all warehouses |
| `PUT` | `/api/v1/warehouses/{id}` | ADMIN | Update warehouse |
| `PUT` | `/api/v1/warehouses/{id}/deactivate` | ADMIN | Deactivate |
| `GET` | `/api/v1/stock/{warehouseId}/{productId}` | All | Get stock level |
| `PUT` | `/api/v1/stock/{warehouseId}/{productId}` | STAFF, MANAGER | Update stock |
| `POST` | `/api/v1/stock/reserve` | OFFICER, MANAGER | Reserve stock |
| `POST` | `/api/v1/stock/release` | OFFICER, MANAGER | Release reservation |
| `POST` | `/api/v1/stock/transfer` | STAFF, MANAGER | Transfer between warehouses |
| `GET` | `/api/v1/stock/low-stock` | MANAGER, ADMIN | Items below reorder level |

---

### 9.4 purchase-service

**Base Package:** `com.stockpro.purchase`  
**Port:** `8084`  
**Database:** `stockpro_purchase`  
**Responsibility:** Full procurement lifecycle — PO creation through goods receipt. On goods receipt, triggers `warehouse-service` to record a Stock In movement.

#### PO Status Lifecycle

```
DRAFT → PENDING_APPROVAL → APPROVED → PARTIALLY_RECEIVED → FULLY_RECEIVED
                                    ↘ CANCELLED
```

#### Entity: `PurchaseOrder`

| Field | Type | Notes |
|---|---|---|
| `poId` | `int` | PK, auto-generated |
| `supplierId` | `int` | FK → Supplier |
| `warehouseId` | `int` | FK → Warehouse |
| `createdById` | `int` | FK → User |
| `status` | `String` | DRAFT/PENDING/APPROVED/RECEIVED/CANCELLED |
| `totalAmount` | `double` | Sum of all line items |
| `orderDate` | `LocalDate` | |
| `expectedDate` | `LocalDate` | Expected delivery |
| `receivedDate` | `LocalDate` | Actual receipt date |
| `notes` | `String` | |
| `referenceNumber` | `String` | External PO reference |

#### Entity: `POLineItem`

| Field | Type | Notes |
|---|---|---|
| `lineItemId` | `int` | PK, auto-generated |
| `poId` | `int` | FK → PurchaseOrder |
| `productId` | `int` | FK → Product |
| `quantity` | `int` | Ordered quantity |
| `unitCost` | `double` | |
| `totalCost` | `double` | quantity × unitCost |
| `receivedQty` | `int` | Partial receipt tracking |

#### Repository: `PurchaseRepository`

```java
List<PurchaseOrder> findBySupplierId(int supplierId);
List<PurchaseOrder> findByWarehouseId(int warehouseId);
List<PurchaseOrder> findByStatus(String status);
Optional<PurchaseOrder> findByPoId(int poId);
List<PurchaseOrder> findByOrderDateBetween(LocalDate start, LocalDate end);
List<PurchaseOrder> findByCreatedById(int userId);
int countByStatus(String status);
```

#### Service Interface: `PurchaseService`

```java
PurchaseOrder createPO(PurchaseOrder order);
Optional<PurchaseOrder> getPOById(int poId);
List<PurchaseOrder> getPOsBySupplier(int supplierId);
List<PurchaseOrder> getPOsByStatus(String status);
void approvePO(int poId);
void receiveGoods(int poId, List<POLineItem> receivedItems);   // supports partial receipt
void cancelPO(int poId);
PurchaseOrder updatePO(int poId, PurchaseOrder order);
List<PurchaseOrder> getPOsByWarehouse(int warehouseId);
List<PurchaseOrder> getPOsByDateRange(LocalDate start, LocalDate end);
```

> **On `receiveGoods()`:** Update `receivedQty` per line item. If all lines fully received → status = `FULLY_RECEIVED`. Otherwise → `PARTIALLY_RECEIVED`. Call `warehouse-service` to increment stock.

#### REST Endpoints: `PurchaseResource`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/purchase-orders` | OFFICER | Create PO |
| `GET` | `/api/v1/purchase-orders/{id}` | OFFICER, MANAGER, ADMIN | Get PO |
| `GET` | `/api/v1/purchase-orders/supplier/{id}` | OFFICER, ADMIN | By supplier |
| `GET` | `/api/v1/purchase-orders/status/{status}` | OFFICER, MANAGER, ADMIN | By status |
| `GET` | `/api/v1/purchase-orders/warehouse/{id}` | OFFICER, MANAGER, ADMIN | By warehouse |
| `GET` | `/api/v1/purchase-orders/date-range` | MANAGER, ADMIN | By date range |
| `PUT` | `/api/v1/purchase-orders/{id}/approve` | MANAGER, ADMIN | Approve PO |
| `PUT` | `/api/v1/purchase-orders/{id}/cancel` | OFFICER, ADMIN | Cancel PO |
| `PUT` | `/api/v1/purchase-orders/{id}` | OFFICER | Update draft PO |
| `POST` | `/api/v1/purchase-orders/{id}/receive` | STAFF | Record goods receipt |

---

### 9.5 supplier-service

**Base Package:** `com.stockpro.supplier`  
**Port:** `8085`  
**Database:** `stockpro_supplier`  
**Responsibility:** Supplier master register — full contact details, payment terms, lead times, performance rating. Deactivation prevents new POs while preserving history.

#### Entity: `Supplier`

| Field | Type | Notes |
|---|---|---|
| `supplierId` | `int` | PK, auto-generated |
| `name` | `String` | Not null |
| `contactPerson` | `String` | |
| `email` | `String` | For reorder emails |
| `phone` | `String` | |
| `address` | `String` | |
| `city` | `String` | |
| `country` | `String` | |
| `taxId` | `String` | |
| `paymentTerms` | `String` | e.g., NET-30, NET-60 |
| `leadTimeDays` | `int` | |
| `rating` | `double` | Avg performance rating (0–5) |
| `isActive` | `boolean` | Default true |

#### Repository: `SupplierRepository`

```java
Optional<Supplier> findBySupplierId(int supplierId);
List<Supplier> findByCity(String city);
List<Supplier> findByCountry(String country);
List<Supplier> searchByName(String name);      // LIKE query
List<Supplier> findByIsActive(boolean isActive);
Optional<Supplier> findByTaxId(String taxId);
int countByIsActive(boolean isActive);
void deleteBySupplied(int supplierId);
```

#### Service Interface: `SupplierService`

```java
Supplier createSupplier(Supplier supplier);
Optional<Supplier> getById(int supplierId);
List<Supplier> getAllSuppliers();
List<Supplier> searchSuppliers(String query);
Supplier updateSupplier(int supplierId, Supplier supplier);
void deactivateSupplier(int supplierId);
void deleteSupplier(int supplierId);
List<Supplier> getByCity(String city);
List<Supplier> getByCountry(String country);
void updateRating(int supplierId, double newRating);   // recalculates rolling average
```

#### REST Endpoints: `SupplierResource`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/suppliers` | OFFICER, ADMIN | Create supplier |
| `GET` | `/api/v1/suppliers/{id}` | All | Get supplier |
| `GET` | `/api/v1/suppliers` | All | List all active |
| `GET` | `/api/v1/suppliers/search?q=` | All | Search by name |
| `GET` | `/api/v1/suppliers/city/{city}` | All | By city |
| `GET` | `/api/v1/suppliers/country/{country}` | All | By country |
| `PUT` | `/api/v1/suppliers/{id}` | OFFICER, ADMIN | Update |
| `PUT` | `/api/v1/suppliers/{id}/deactivate` | OFFICER, ADMIN | Deactivate |
| `PUT` | `/api/v1/suppliers/{id}/rating` | OFFICER | Update rating |
| `DELETE` | `/api/v1/suppliers/{id}` | ADMIN | Delete |

---

### 9.6 movement-service

**Base Package:** `com.stockpro.movement`  
**Port:** `8086`  
**Database:** `stockpro_movement`  
**Responsibility:** Immutable audit trail for every stock change. Write-once records. Corrections require a new opposing movement.

#### Movement Types

| Type | Trigger |
|---|---|
| `STOCK_IN` | Goods received against a PO (GRN) |
| `STOCK_OUT` | Stock issued to production, sales, or internal use |
| `TRANSFER_IN` | Stock received at destination warehouse |
| `TRANSFER_OUT` | Stock deducted from source warehouse |
| `ADJUSTMENT` | Manual correction from cycle count |
| `WRITE_OFF` | Removal of damaged, expired, or lost stock |
| `RETURN` | Stock returned from supplier or customer |

#### Entity: `StockMovement`

| Field | Type | Notes |
|---|---|---|
| `movementId` | `int` | PK, auto-generated |
| `productId` | `int` | FK → Product |
| `warehouseId` | `int` | FK → Warehouse |
| `movementType` | `String` | See Movement Types above |
| `quantity` | `int` | Always positive; direction determined by type |
| `referenceId` | `int` | FK to PO, issue order, etc. |
| `referenceType` | `String` | PO / ISSUE_ORDER / TRANSFER / ADJUSTMENT |
| `unitCost` | `double` | Cost at time of movement |
| `performedBy` | `int` | FK → User |
| `notes` | `String` | |
| `movementDate` | `LocalDateTime` | Auto-set; immutable |
| `balanceAfter` | `int` | Stock on hand after this movement |

> **Immutability Rule:** No `UPDATE` or `DELETE` on StockMovement records ever. Corrections = new opposing record.

#### Repository: `MovementRepository`

```java
List<StockMovement> findByProductId(int productId);
List<StockMovement> findByWarehouseId(int warehouseId);
List<StockMovement> findByMovementType(String type);
List<StockMovement> findByReferenceId(int referenceId);
List<StockMovement> findByMovementDateBetween(LocalDateTime start, LocalDateTime end);
List<StockMovement> findByPerformedBy(int userId);
int countByProductIdAndType(int productId, String type);
```

#### Service Interface: `MovementService`

```java
StockMovement recordMovement(StockMovement movement);
List<StockMovement> getByProduct(int productId);
List<StockMovement> getByWarehouse(int warehouseId);
List<StockMovement> getByType(String movementType);
List<StockMovement> getByDateRange(LocalDateTime start, LocalDateTime end);
List<StockMovement> getByReference(int referenceId);
List<StockMovement> getMovementHistory(int productId, int warehouseId);
int getStockIn(int productId);     // total STOCK_IN units
int getStockOut(int productId);    // total STOCK_OUT units
List<StockMovement> getAllMovements();
```

#### REST Endpoints: `MovementResource`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/movements` | STAFF, MANAGER | Record movement |
| `GET` | `/api/v1/movements/product/{id}` | MANAGER, ADMIN | By product |
| `GET` | `/api/v1/movements/warehouse/{id}` | MANAGER, ADMIN | By warehouse |
| `GET` | `/api/v1/movements/type/{type}` | MANAGER, ADMIN | By type |
| `GET` | `/api/v1/movements/date-range` | MANAGER, ADMIN | By date range |
| `GET` | `/api/v1/movements/reference/{id}` | All | By reference (PO etc.) |
| `GET` | `/api/v1/movements/history/{productId}/{warehouseId}` | All | Movement history |
| `GET` | `/api/v1/movements/stock-in/{productId}` | MANAGER, ADMIN | Total in |
| `GET` | `/api/v1/movements/stock-out/{productId}` | MANAGER, ADMIN | Total out |
| `GET` | `/api/v1/movements` | ADMIN | All movements |

---

### 9.7 alert-service

**Base Package:** `com.stockpro.alert`  
**Port:** `8087`  
**Database:** `stockpro_alert`  
**Responsibility:** Dispatch and manage all inventory alerts. `CRITICAL` alerts also trigger email via JavaMailSender (AWS SES).

#### Alert Types & Triggers

| Alert Type | Trigger | Severity |
|---|---|---|
| `LOW_STOCK` | Quantity < product reorderLevel | WARNING / CRITICAL |
| `OVERSTOCK` | Quantity > product maxStockLevel | INFO / WARNING |
| `PO_PENDING` | PO submitted for approval | INFO |
| `OVERDUE_RECEIPT` | Approved PO past expectedDate with no GRN | WARNING / CRITICAL |
| `SYSTEM` | Platform-wide broadcast from Admin | INFO / WARNING / CRITICAL |

#### Scheduled Alert Jobs

| Job | Schedule | Action |
|---|---|---|
| Low-stock scan | Every 15 minutes | Query `warehouse-service` findLowStockItems; send alerts |
| Overdue PO check | Daily at 09:00 | Query `purchase-service` for approved POs past expectedDate |
| Daily snapshot trigger | Midnight | Publish event to RabbitMQ → `report-service` |

#### Entity: `Alert`

| Field | Type | Notes |
|---|---|---|
| `alertId` | `int` | PK, auto-generated |
| `recipientId` | `int` | FK → User |
| `type` | `String` | See Alert Types above |
| `severity` | `String` | INFO / WARNING / CRITICAL |
| `title` | `String` | Short display title |
| `message` | `String` | Full description |
| `relatedProductId` | `int` | Nullable |
| `relatedWarehouseId` | `int` | Nullable |
| `channel` | `String` | IN_APP / EMAIL / BOTH |
| `isRead` | `boolean` | Default false |
| `isAcknowledged` | `boolean` | Default false |
| `createdAt` | `LocalDateTime` | Auto-set |

#### Repository: `AlertRepository`

```java
List<Alert> findByRecipientId(int recipientId);
List<Alert> findByRecipientIdAndIsRead(int recipientId, boolean isRead);
int countByRecipientIdAndIsRead(int recipientId, boolean isRead);
List<Alert> findByType(String type);
List<Alert> findBySeverity(String severity);
List<Alert> findByRelatedProductId(int productId);
List<Alert> findUnacknowledged();
void deleteByAlertId(int alertId);
```

#### Service Interface: `AlertService`

```java
void sendAlert(Alert alert);
void sendLowStockAlert(int productId, int warehouseId, int currentQty);
void sendBulk(List<Integer> recipientIds, String title, String message);
void markAsRead(int alertId);
void markAllRead(int recipientId);
void acknowledge(int alertId);
List<Alert> getByRecipient(int recipientId);
int getUnreadCount(int recipientId);
List<Alert> getUnacknowledged();
void deleteAlert(int alertId);
void sendEmail(String toEmail, String subject, String body);   // CRITICAL alerts only
```

#### REST Endpoints: `AlertResource`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/alerts/recipient/{id}` | Authenticated | Get own alerts |
| `PUT` | `/api/v1/alerts/{id}/read` | Authenticated | Mark as read |
| `PUT` | `/api/v1/alerts/recipient/{id}/read-all` | Authenticated | Mark all read |
| `PUT` | `/api/v1/alerts/{id}/acknowledge` | Authenticated | Acknowledge |
| `GET` | `/api/v1/alerts/recipient/{id}/unread-count` | Authenticated | Unread count |
| `GET` | `/api/v1/alerts/unacknowledged` | MANAGER, ADMIN | All unacknowledged |
| `DELETE` | `/api/v1/alerts/{id}` | ADMIN | Delete alert |
| `POST` | `/api/v1/alerts/bulk` | ADMIN | Broadcast alert |
| `GET` | `/api/v1/alerts` | ADMIN | All alerts |

---

### 9.8 report-service

**Base Package:** `com.stockpro.report`  
**Port:** `8088`  
**Database:** `stockpro_report`  
**Responsibility:** Business intelligence. Daily snapshot records for trend analysis. Valuation, turnover, movement velocity, dead stock, PO spend summaries.

#### Entity: `InventorySnapshot`

| Field | Type | Notes |
|---|---|---|
| `snapshotId` | `int` | PK, auto-generated |
| `warehouseId` | `int` | FK → Warehouse |
| `productId` | `int` | FK → Product |
| `quantity` | `int` | Stock on hand at snapshot time |
| `stockValue` | `double` | `quantity × costPrice` |
| `snapshotDate` | `LocalDate` | Date of snapshot |
| `createdAt` | `LocalDateTime` | Auto-set |

> **Written daily** by a Spring `@Scheduled` job at midnight (also triggered via RabbitMQ event from `alert-service`).

#### Repository: `ReportRepository`

```java
List<InventorySnapshot> findByWarehouseId(int warehouseId);
List<InventorySnapshot> findByProductId(int productId);
List<InventorySnapshot> findBySnapshotDate(LocalDate date);
List<InventorySnapshot> findByDateBetween(LocalDate start, LocalDate end);
Double sumStockValueByWarehouse(int warehouseId);
List<InventorySnapshot> findLowStockSnapshot(int threshold);
Double avgTurnoverByProduct(int productId);
```

#### Service Interface: `ReportService`

```java
InventorySnapshot takeSnapshot(int warehouseId);
Double getTotalStockValue();
Double getStockValueByWarehouse(int warehouseId);
Double getInventoryTurnover(int productId, LocalDate start, LocalDate end);
List<InventorySnapshot> getLowStockReport();
Map<String, Integer> getStockMovementSummary(int warehouseId);
List<Integer> getTopMovingProducts(int limit);        // ranked by units moved
List<Integer> getSlowMovingProducts(int limit);       // minimal movement over period
Map<String, Object> getPOSummary(LocalDate start, LocalDate end);
InventoryReport generateInventoryReport();
List<Integer> getDeadStock();                         // no movement > 90 days (configurable)
```

#### REST Endpoints: `ReportResource`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/reports/total-value` | MANAGER, ADMIN | Total stock valuation |
| `GET` | `/api/v1/reports/value/warehouse/{id}` | MANAGER, ADMIN | By warehouse |
| `GET` | `/api/v1/reports/turnover/{productId}` | MANAGER, ADMIN | Turnover rate |
| `GET` | `/api/v1/reports/low-stock` | MANAGER, ADMIN | Low stock report |
| `GET` | `/api/v1/reports/top-moving` | MANAGER, ADMIN | Top moving products |
| `GET` | `/api/v1/reports/slow-moving` | MANAGER, ADMIN | Slow moving products |
| `GET` | `/api/v1/reports/dead-stock` | MANAGER, ADMIN | Dead stock |
| `GET` | `/api/v1/reports/po-summary` | MANAGER, ADMIN | PO spend summary |
| `POST` | `/api/v1/reports/snapshot/{warehouseId}` | ADMIN | Manual snapshot trigger |
| `GET` | `/api/v1/reports/generate` | MANAGER, ADMIN | Generate full report |

---

### 9.9 stockpro-web (MVC Layer)

**Base Package:** `com.stockpro.web`  
**Port:** `8080`  
**Responsibility:** Spring MVC integration layer. Wires all microservices via RestTemplate. Renders Thymeleaf views.

> This is **not a microservice** — it is the frontend coordination layer. It contains no business logic, no repositories, and no databases of its own.

#### Three MVC Controllers

| Controller | Injected Services | Primary Views |
|---|---|---|
| `InventoryController` | AuthService, ProductService, WarehouseService, MovementService, AlertService, ReportService | Dashboard, Products, Warehouses, Stock, Movements, Alerts, Reports |
| `PurchaseController` | PurchaseService, SupplierService, WarehouseService, ProductService, AlertService | Purchase Orders, Suppliers |
| `AdminController` | AuthService, AlertService, ReportService, WarehouseService | Users, Warehouses config, Platform analytics, Audit logs |

#### InventoryController Key Methods

```java
dashboard()                    // Main KPI dashboard
viewProducts()                 // Product list
viewProductDetail(int id)      // Product detail + stock levels
addProduct(Product product)    // Create product
editProduct(int id, Product p) // Update product
deactivateProduct(int id)      // Deactivate
searchProducts(String query)   // Search
scanBarcode(String barcode)    // Barcode lookup
viewWarehouses()               // Warehouse list
viewWarehouseDetail(int id)    // Warehouse + capacity + stock
viewStockLevel(int w, int p)   // Stock for product in warehouse
transferStock(...)             // Initiate inter-warehouse transfer
viewMovements(int id)          // Movement list
viewMovementsByDate(...)       // Filtered movements
viewAlerts()                   // Alert centre
markAlertRead(int id)          // Mark read
acknowledgeAlert(int id)       // Acknowledge
viewReports()                  // Reports dashboard
viewLowStockReport()           // Low stock report view
```

#### PurchaseController Key Methods

```java
viewPurchaseOrders()           // PO list
viewPODetail(int id)           // PO + line items
createPO(PurchaseOrder po)     // Create PO
editPO(int id, PurchaseOrder p)
approvePO(int id)
cancelPO(int id)
receiveGoods(int id, List<POLineItem> items)
viewPOsBySupplier(int id)
viewPOsByStatus(String status)
viewSuppliers()
viewSupplierDetail(int id)
addSupplier(Supplier s)
editSupplier(int id, Supplier s)
deactivateSupplier(int id)
viewPOsByDateRange(LocalDate start, LocalDate end)
```

#### AdminController Key Methods

```java
adminDashboard()
manageUsers()
addUser(User u)
editUser(int id, User u)
deactivateUser(int id)
manageWarehouses()
addWarehouse(Warehouse w)
editWarehouse(int id, Warehouse w)
deactivateWarehouse(int id)
viewTotalStockValue()
viewInventoryTurnover()
viewTopMovingProducts(int limit)
viewDeadStock()
generateInventoryReport()
sendPlatformAlert(String title, String message)
viewAuditLogs()
```

---

## 10. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Stock queries and product search: < 1 second. Dashboard KPIs: < 2 seconds |
| **Scalability** | Each service independently scalable via Docker/Kubernetes. Redis caches stock-level reads |
| **Security** | bcrypt passwords. JWT 8-hour expiry. Role-based field-level access at service layer |
| **Availability** | 99.9% uptime SLA during business hours. Health-check endpoints per service. Graceful degradation if report/alert service unavailable |
| **Data Integrity** | Stock transfers atomic (debit + credit in single transaction). No negative stock balances. Movements immutable after creation |
| **Audit Trail** | Every stock movement, PO status change, and user management action logged with actor, timestamp, before/after values. Retained for 7 years |
| **Concurrent Access** | `@Version` (optimistic locking) on `StockLevel` entity |
| **Scheduled Jobs** | Daily snapshot at midnight. Low-stock check every 15 min. Overdue PO alert at 09:00 daily |
| **Usability** | Responsive UI (desktop + tablet). Barcode scan via device camera (ZXing + HTML5). CSV and PDF export on all reports. WCAG 2.1 AA |
| **Maintainability** | Services independently deployable. All REST APIs versioned under `/api/v1/`. Flyway for DB schema migrations |

---

## 11. Technology Stack

| Layer | Technology |
|---|---|
| Backend Framework | Java Spring Boot (Spring MVC, Spring Security, Spring Data JPA) |
| Authentication | JWT (JSON Web Tokens) via Spring Security — no third-party OAuth |
| Database | MySQL (primary relational, per-service schema); Redis (stock-level cache, session store) |
| DB Migrations | Flyway — version-controlled schema migrations across all services |
| Barcode / QR | ZXing (Zebra Crossing) server-side decoding; HTML5 device camera on web |
| Reporting / Export | JasperReports or Apache POI (PDF/Excel); Spring Batch for large exports |
| Frontend | Thymeleaf + Bootstrap 5 + Chart.js (dashboard KPI widgets and trend charts) |
| Messaging | RabbitMQ — async alert dispatch, daily snapshot events, low-stock trigger broadcast |
| Scheduled Jobs | Spring `@Scheduled` + Quartz Scheduler |
| File Storage | AWS S3 (product images, report PDFs); CloudFront CDN |
| Email | Spring Boot JavaMailSender via AWS SES — CRITICAL alerts + PO approval notifications |
| Containerisation | Docker + Docker Compose; Kubernetes for production autoscaling |
| API Documentation | Swagger / OpenAPI 3.0 for all REST endpoints |
| CI/CD | GitHub Actions or Jenkins — automated build, test, deploy |
| Caching | Redis for `StockLevel` reads |

---

## 12. Glossary

| Term | Definition |
|---|---|
| **SKU** | Stock Keeping Unit — unique alphanumeric identifier per product |
| **GRN** | Goods Received Note — document raised on physical receipt of goods against a PO |
| **PO** | Purchase Order — formal document authorising purchase of goods from a supplier |
| **Stock Level** | Quantity of a product held in a specific warehouse at a point in time |
| **Reorder Level** | Minimum quantity below which LOW_STOCK alert fires |
| **Maximum Stock Level** | Upper quantity threshold above which OVERSTOCK alert fires |
| **Lead Time** | Days between raising a PO and receiving goods |
| **Inventory Turnover** | COGS / Average Inventory Value — measures how fast stock cycles |
| **Dead Stock** | Products with no movement for > 90 days (configurable) |
| **Stock Movement** | Any transaction changing product quantity in a warehouse |
| **Cycle Count** | Periodic partial stock audit — subset of products physically counted and reconciled |
| **Reserved Quantity** | Stock allocated to an open order; not available for new orders |
| **Available Quantity** | `quantity − reservedQuantity` |
| **Write-Off** | Movement recording removal of damaged, expired, or lost stock |
| **Payment Terms** | Supplier payment conditions, e.g., NET-30 = payment due 30 days after invoice |
| **Inventory Snapshot** | Point-in-time record of stock quantities and values per product/warehouse; taken daily |
| **Optimistic Locking** | Concurrency control via `@Version` — rejects conflicting concurrent updates |
| **JPQL** | Java Persistence Query Language — used in repository custom queries |
| **DTO** | Data Transfer Object — the API contract; never expose raw entities |
| **DXA** | Document exchange — measurement unit in Word documents (1440 DXA = 1 inch) |
