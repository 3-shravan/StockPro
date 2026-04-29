# StockPro — Frontend Developer Integration Guide

> **This document is self-sufficient. You do NOT need access to backend source code.**

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Environment Setup](#2-environment-setup)
3. [Authentication Flow](#3-authentication-flow)
4. [API Client Setup (Axios)](#4-api-client-setup)
5. [Roles & Permissions](#5-roles--permissions)
6. [API Reference — Auth Service](#6-auth-service)
7. [API Reference — Product Service](#7-product-service)
8. [API Reference — Warehouse Service](#8-warehouse-service)
9. [API Reference — Purchase Service](#9-purchase-service)
10. [API Reference — Supplier Service](#10-supplier-service)
11. [API Reference — Movement Service](#11-movement-service)
12. [API Reference — Alert Service](#12-alert-service)
13. [Enums & Allowed Values](#13-enums--allowed-values)
14. [Error Handling](#14-error-handling)

---

## 1. Architecture Overview

All frontend requests go through a **single entry point** — the API Gateway. You never call individual services directly.

```
Browser / App
     │
     ▼
API Gateway (http://localhost:8080)
     │  Validates JWT token
     │  Routes to correct service
     │
     ├──► Auth Service      (:8081)  →  /api/v1/auth/**
     ├──► Product Service   (:8082)  →  /api/v1/products/**
     ├──► Warehouse Service (:8083)  →  /api/v1/warehouses/**
     ├──► Purchase Service  (:8084)  →  /api/v1/purchase-orders/**
     ├──► Supplier Service  (:8085)  →  /api/v1/suppliers/**
     ├──► Movement Service  (:8086)  →  /api/v1/movements/**
     └──► Alert Service     (:8087)  →  /api/v1/alerts/**
```

**Rule**: Your base URL is always `http://localhost:8080/api/v1`. Every request is prefixed with this.

---

## 2. Environment Setup

Create a `.env.local` (Next.js) or `.env` (Vite/CRA) file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

---

## 3. Authentication Flow

### Step 1 — Login
```
POST /api/v1/auth/login
```
**Request Body:**
```json
{
  "email": "admin@stockpro.com",
  "password": "yourpassword"
}
```
**Success Response (200):**
```json
{
  "status": 200,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9..."
  },
  "timestamp": "2026-04-28T22:00:00"
}
```

### Step 2 — Store Token
Save the `data.token` value to `localStorage`:
```js
localStorage.setItem('token', response.data.data.token);
```

### Step 3 — Attach Token to All Requests
Every subsequent request must include the header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### Step 4 — Logout
```
POST /api/v1/auth/logout
```
Call this endpoint then clear `localStorage.removeItem('token')`.

### Step 5 — Refresh Token
```
POST /api/v1/auth/refresh
```
Send the existing (soon-to-expire) token as `Authorization: Bearer <token>`.
Receive a new token in the response. Replace the stored token.

---

## 4. API Client Setup

### Recommended Axios Instance
```js
// src/lib/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally (session expired)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Standard API Response Shape
Every API call returns this structure. Always access `response.data.data` for the actual payload:
```json
{
  "status": 200,
  "message": "Human-readable message",
  "data": { ... },
  "timestamp": "2026-04-28T22:00:00",
  "path": "/api/v1/resource"
}
```

---

## 5. Roles & Permissions

The JWT token embeds a `role` claim. The backend enforces these rules:

| Role | Description | Typical Pages |
|---|---|---|
| `ADMIN` | Full access, user management | All pages + Admin panel |
| `MANAGER` | Manage inventory, approve POs, view reports | Dashboard, Inventory, POs, Reports |
| `OFFICER` | Create/update suppliers and POs | Suppliers, Purchase Orders |
| `STAFF` | Read-only, limited actions | Dashboard, View-only Inventory |

**How to decode the role on the frontend:**
```js
import { jwtDecode } from 'jwt-decode';

const token = localStorage.getItem('token');
const decoded = jwtDecode(token);
// decoded.role → "ADMIN" | "MANAGER" | "OFFICER" | "STAFF"
// decoded.sub  → user email
// decoded.userId → user ID (integer)
```

---

## 6. Auth Service

**Base path:** `/api/v1/auth`

### Register a New User
```
POST /api/v1/auth/register
```
**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@stockpro.com",
  "password": "securepass123",
  "phone": "+1234567890",
  "department": "Warehouse",
  "role": "STAFF"
}
```
**Response `data`:** Full User object (see schema below).

### Login
```
POST /api/v1/auth/login
```
**Request Body:** `{ "email": "...", "password": "..." }`
**Response `data`:** `{ "token": "eyJ..." }`

### Logout *(Auth required)*
```
POST /api/v1/auth/logout
```
Send `Authorization: Bearer <token>`. No request body needed.

### Refresh Token *(Auth required)*
```
POST /api/v1/auth/refresh
```
Send `Authorization: Bearer <current_token>`. Returns new token.

### Get User Profile *(Auth required)*
```
GET /api/v1/auth/profile/{userId}
```
**Response `data`:** Full User object.

### Update Profile *(Auth required)*
```
PUT /api/v1/auth/profile/{userId}
```
**Request Body:** Partial User fields to update.

### Change Password *(Auth required)*
```
PUT /api/v1/auth/password/{userId}
```
**Request Body:** `{ "newPassword": "newSecurePass123" }`

### Deactivate User *(ADMIN only)*
```
PUT /api/v1/auth/deactivate/{userId}
```

### Get All Users *(ADMIN or MANAGER)*
```
GET /api/v1/auth/users
```
**Response `data`:** Array of User objects.

### User Schema
```json
{
  "userId": 1,
  "fullName": "John Doe",
  "email": "john@stockpro.com",
  "phone": "+1234567890",
  "role": "STAFF",
  "department": "Warehouse",
  "isActive": true,
  "createdAt": "2026-04-01T10:00:00",
  "lastLoginAt": "2026-04-28T22:00:00"
}
```
> **Note:** `passwordHash` is never returned in any API response.

---

## 7. Product Service

**Base path:** `/api/v1/products`  All endpoints require authentication.

### Create Product
```
POST /api/v1/products
```
**Request Body:**
```json
{
  "sku": "PRD-001",
  "name": "Industrial Wrench",
  "description": "Heavy duty 12-inch wrench",
  "category": "Tools",
  "brand": "Stanley",
  "unitOfMeasure": "PCS",
  "costPrice": 15.50,
  "sellingPrice": 29.99,
  "reorderLevel": 10,
  "maxStockLevel": 500,
  "leadTimeDays": 7,
  "imageUrl": "https://cdn.example.com/wrench.jpg",
  "barcode": "1234567890123",
  "currentQuantity": 100
}
```
**Response `data`:** Full Product object.

### Get All Products
```
GET /api/v1/products
```

### Get Product by ID
```
GET /api/v1/products/{id}
```

### Get Product by SKU
```
GET /api/v1/products/sku/{sku}
```

### Get Product by Barcode
```
GET /api/v1/products/barcode/{barcode}
```

### Get Products by Category
```
GET /api/v1/products/category/{category}
```

### Get Products by Brand
```
GET /api/v1/products/brand/{brand}
```

### Search Products
```
GET /api/v1/products/search?query=wrench
```

### Get Low Stock Products
```
GET /api/v1/products/low-stock
```
Returns products where `currentQuantity <= reorderLevel`.

### Update Product
```
PUT /api/v1/products/{id}
```
**Request Body:** Same as create, but `sku` is not required.

### Deactivate Product
```
PUT /api/v1/products/{id}/deactivate
```

### Delete Product
```
DELETE /api/v1/products/{id}
```

### Product Schema (Response)
```json
{
  "productId": 1,
  "sku": "PRD-001",
  "name": "Industrial Wrench",
  "description": "Heavy duty 12-inch wrench",
  "category": "Tools",
  "brand": "Stanley",
  "unitOfMeasure": "PCS",
  "costPrice": 15.50,
  "sellingPrice": 29.99,
  "reorderLevel": 10,
  "maxStockLevel": 500,
  "leadTimeDays": 7,
  "imageUrl": "https://cdn.example.com/wrench.jpg",
  "barcode": "1234567890123",
  "currentQuantity": 100,
  "active": true
}
```

---

## 8. Warehouse Service

**Base path:** `/api/v1/warehouses`  All endpoints require authentication.

### Create Warehouse
```
POST /api/v1/warehouses
```
**Request Body:**
```json
{
  "name": "Main Warehouse",
  "location": "Downtown",
  "address": "123 Industrial Ave, City",
  "managerId": 5,
  "capacity": 10000,
  "phone": "+1234567890"
}
```

### Get All Warehouses
```
GET /api/v1/warehouses
```

### Get Warehouse by ID
```
GET /api/v1/warehouses/{id}
```

### Update Warehouse
```
PUT /api/v1/warehouses/{id}
```

### Deactivate Warehouse
```
DELETE /api/v1/warehouses/{id}
```

### Get Stock Level for a Product in a Warehouse
```
GET /api/v1/warehouses/{warehouseId}/stock/{productId}
```

### Get Low Stock Items in a Warehouse
```
GET /api/v1/warehouses/{warehouseId}/stock/low
```

### Update Stock (Set absolute value)
```
PUT /api/v1/warehouses/stock/update
```
**Request Body:**
```json
{ "warehouseId": 1, "productId": 2, "quantity": 150 }
```

### Adjust Stock (Add/subtract from current)
```
PUT /api/v1/warehouses/stock/adjust
```
**Request Body:** Same as update. Use negative `quantity` to subtract.

### Reserve Stock
```
POST /api/v1/warehouses/stock/reserve
```
**Request Body:**
```json
{ "warehouseId": 1, "productId": 2, "quantity": 20 }
```

### Transfer Stock Between Warehouses
```
POST /api/v1/warehouses/stock/transfer
```
**Request Body:**
```json
{
  "fromWarehouseId": 1,
  "toWarehouseId": 2,
  "productId": 5,
  "quantity": 50,
  "managerId": 3
}
```

### Warehouse Schema (Response)
```json
{
  "warehouseId": 1,
  "name": "Main Warehouse",
  "location": "Downtown",
  "address": "123 Industrial Ave, City",
  "managerId": 5,
  "capacity": 10000,
  "usedCapacity": 3200,
  "active": true,
  "phone": "+1234567890",
  "createdAt": "2026-01-15"
}
```

### Stock Level Schema (Response)
```json
{
  "stockId": 10,
  "warehouseId": 1,
  "productId": 2,
  "quantity": 150,
  "reservedQuantity": 20,
  "availableQuantity": 130,
  "location": "Aisle B-3",
  "lastUpdated": "2026-04-28T14:30:00"
}
```

---

## 9. Purchase Service

**Base path:** `/api/v1/purchase-orders`  All endpoints require authentication.

### Purchase Order Lifecycle
```
DRAFT → PENDING_APPROVAL → APPROVED → PARTIALLY_RECEIVED → FULLY_RECEIVED
                                    ↓
                                CANCELLED
```

### Create Purchase Order
```
POST /api/v1/purchase-orders
```
**Request Body:**
```json
{
  "supplierId": 3,
  "warehouseId": 1,
  "expectedDate": "2026-05-15",
  "notes": "Urgent reorder",
  "referenceNumber": "REF-2026-001",
  "lineItems": [
    { "productId": 5, "quantity": 100, "unitCost": 15.50 },
    { "productId": 8, "quantity": 50,  "unitCost": 22.00 }
  ]
}
```

### Get All Purchase Orders
```
GET /api/v1/purchase-orders
```

### Get by ID
```
GET /api/v1/purchase-orders/{id}
```

### Get by Supplier
```
GET /api/v1/purchase-orders/supplier/{supplierId}
```

### Get by Warehouse
```
GET /api/v1/purchase-orders/warehouse/{warehouseId}
```

### Get by Status
```
GET /api/v1/purchase-orders/status/{status}
```
`status` must be one of: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `PARTIALLY_RECEIVED`, `FULLY_RECEIVED`, `CANCELLED`

### Get by Date Range
```
GET /api/v1/purchase-orders/date-range?start=2026-04-01&end=2026-04-30
```

### Update PO (DRAFT only)
```
PUT /api/v1/purchase-orders/{id}
```
Same body as create.

### Approve PO
```
PUT /api/v1/purchase-orders/{id}/approve
```

### Receive Goods
```
POST /api/v1/purchase-orders/{id}/receive
```
**Request Body:**
```json
{
  "items": [
    { "productId": 5, "quantity": 80 },
    { "productId": 8, "quantity": 50 }
  ]
}
```
> This automatically updates stock in the Warehouse Service.

### Cancel PO
```
PUT /api/v1/purchase-orders/{id}/cancel
```

### Purchase Order Schema (Response)
```json
{
  "poId": 1,
  "supplierId": 3,
  "supplierName": "ABC Suppliers Ltd",
  "warehouseId": 1,
  "warehouseName": "Main Warehouse",
  "createdById": 4,
  "status": "APPROVED",
  "totalAmount": 2650.00,
  "orderDate": "2026-04-28",
  "expectedDate": "2026-05-15",
  "receivedDate": null,
  "notes": "Urgent reorder",
  "referenceNumber": "REF-2026-001",
  "lineItems": [
    {
      "lineItemId": 1,
      "productId": 5,
      "productName": "Industrial Wrench",
      "productSku": "PRD-001",
      "quantity": 100,
      "unitCost": 15.50,
      "totalCost": 1550.00,
      "receivedQty": 0
    }
  ]
}
```

---

## 10. Supplier Service

**Base path:** `/api/v1/suppliers`  All endpoints require authentication.

### Create Supplier *(OFFICER or ADMIN)*
```
POST /api/v1/suppliers
```
**Request Body:**
```json
{
  "name": "ABC Suppliers Ltd",
  "contactPerson": "Jane Smith",
  "email": "jane@abcsuppliers.com",
  "phone": "+9876543210",
  "address": "456 Commerce Blvd",
  "city": "Mumbai",
  "country": "India",
  "taxId": "GSTIN123456",
  "paymentTerms": "Net 30",
  "leadTimeDays": 14
}
```

### Get All Suppliers
```
GET /api/v1/suppliers
```

### Get Supplier by ID
```
GET /api/v1/suppliers/{id}
```

### Search Suppliers
```
GET /api/v1/suppliers/search?q=ABC
```

### Get by City
```
GET /api/v1/suppliers/city/{city}
```

### Get by Country
```
GET /api/v1/suppliers/country/{country}
```

### Update Supplier *(OFFICER or ADMIN)*
```
PUT /api/v1/suppliers/{id}
```

### Update Supplier Rating *(OFFICER or ADMIN)*
```
PUT /api/v1/suppliers/{id}/rating?rating=4.5
```

### Deactivate Supplier *(OFFICER or ADMIN)*
```
PUT /api/v1/suppliers/{id}/deactivate
```

### Delete Supplier *(ADMIN only)*
```
DELETE /api/v1/suppliers/{id}
```

### Supplier Schema (Response)
```json
{
  "supplierId": 3,
  "name": "ABC Suppliers Ltd",
  "contactPerson": "Jane Smith",
  "email": "jane@abcsuppliers.com",
  "phone": "+9876543210",
  "address": "456 Commerce Blvd",
  "city": "Mumbai",
  "country": "India",
  "taxId": "GSTIN123456",
  "paymentTerms": "Net 30",
  "leadTimeDays": 14,
  "rating": 4.5,
  "isActive": true
}
```

---

## 11. Movement Service

**Base path:** `/api/v1/movements`  All endpoints require authentication.  
> Movements are typically created automatically by the system (e.g., when a PO is received). You will primarily **read** this data for audit logs and reports.

### Get All Movements
```
GET /api/v1/movements
```

### Get Movements by Product
```
GET /api/v1/movements/product/{productId}
```

### Get Movements by Warehouse
```
GET /api/v1/movements/warehouse/{warehouseId}
```

### Get Movements by Type
```
GET /api/v1/movements/type/{movementType}
```
`movementType`: `STOCK_IN` | `STOCK_OUT` | `TRANSFER_IN` | `TRANSFER_OUT` | `ADJUSTMENT` | `WRITE_OFF` | `RETURN`

### Get Movements by Date Range
```
GET /api/v1/movements/date-range?start=2026-04-01T00:00:00&end=2026-04-30T23:59:59
```

### Get Movements by Reference
```
GET /api/v1/movements/reference/{referenceId}
```

### Get Movement History (Product + Warehouse)
```
GET /api/v1/movements/history/{productId}/{warehouseId}
```

### Get Total Stock In for a Product
```
GET /api/v1/movements/stock-in/{productId}
```
**Response `data`:** Integer (total units received)

### Get Total Stock Out for a Product
```
GET /api/v1/movements/stock-out/{productId}
```
**Response `data`:** Integer (total units dispatched)

### Create Movement (Manual entry if needed)
```
POST /api/v1/movements
```
**Request Body:**
```json
{
  "productId": 5,
  "warehouseId": 1,
  "movementType": "STOCK_IN",
  "quantity": 100,
  "referenceId": 1,
  "referenceType": "PURCHASE_ORDER",
  "unitCost": 15.50,
  "performedBy": 3,
  "notes": "Received against PO #1",
  "balanceAfter": 250
}
```

### Movement Schema (Response)
```json
{
  "movementId": 42,
  "productId": 5,
  "warehouseId": 1,
  "movementType": "STOCK_IN",
  "quantity": 100,
  "referenceId": 1,
  "referenceType": "PURCHASE_ORDER",
  "unitCost": 15.50,
  "performedBy": 3,
  "notes": "Received against PO #1",
  "movementDate": "2026-04-28T14:30:00",
  "balanceAfter": 250
}
```

---

## 12. Alert Service

**Base path:** `/api/v1/alerts`  All endpoints require authentication.

### Send Alert *(MANAGER or ADMIN)*
```
POST /api/v1/alerts
```
**Request Body:**
```json
{
  "recipientId": 3,
  "type": "LOW_STOCK",
  "severity": "WARNING",
  "title": "Low Stock Warning",
  "message": "Product #5 has only 8 units remaining.",
  "relatedProductId": 5,
  "relatedWarehouseId": 1,
  "channel": "IN_APP"
}
```

### Get Alerts for a User
```
GET /api/v1/alerts/recipient/{userId}
```

### Get Unread Count for a User
```
GET /api/v1/alerts/recipient/{userId}/unread-count
```
**Response `data`:** Integer

### Mark Single Alert as Read
```
PUT /api/v1/alerts/{alertId}/read
```

### Mark All Alerts as Read for a User
```
PUT /api/v1/alerts/recipient/{userId}/read-all
```

### Acknowledge Alert
```
PUT /api/v1/alerts/{alertId}/acknowledge
```

### Get All Unacknowledged Alerts *(MANAGER or ADMIN)*
```
GET /api/v1/alerts/unacknowledged
```

### Get All Alerts *(ADMIN only)*
```
GET /api/v1/alerts
```

### Delete Alert *(ADMIN only)*
```
DELETE /api/v1/alerts/{alertId}
```

### Send Bulk Alerts *(ADMIN only)*
```
POST /api/v1/alerts/bulk
```

### Send Low Stock Alert (System use)
```
POST /api/v1/alerts/low-stock?productId=5&warehouseId=1&currentQty=8
```

### Alert Schema (Response)
```json
{
  "alertId": 10,
  "recipientId": 3,
  "type": "LOW_STOCK",
  "severity": "WARNING",
  "title": "Low Stock Warning",
  "message": "Product #5 has only 8 units remaining.",
  "relatedProductId": 5,
  "relatedWarehouseId": 1,
  "channel": "IN_APP",
  "read": false,
  "acknowledged": false,
  "createdAt": "2026-04-28T22:15:00"
}
```

---

## 13. Enums & Allowed Values

### User Roles
| Value | Description |
|---|---|
| `STAFF` | Basic warehouse staff |
| `MANAGER` | Inventory and order manager |
| `OFFICER` | Procurement officer |
| `ADMIN` | Full system administrator |

### Purchase Order Status
| Value | Description |
|---|---|
| `DRAFT` | Created, not yet submitted |
| `PENDING_APPROVAL` | Awaiting manager approval |
| `APPROVED` | Approved, awaiting delivery |
| `PARTIALLY_RECEIVED` | Some goods received |
| `FULLY_RECEIVED` | All goods received |
| `CANCELLED` | Order cancelled |

### Movement Types
| Value | Description |
|---|---|
| `STOCK_IN` | Goods received into warehouse |
| `STOCK_OUT` | Goods dispatched from warehouse |
| `TRANSFER_IN` | Stock arrived from another warehouse |
| `TRANSFER_OUT` | Stock sent to another warehouse |
| `ADJUSTMENT` | Manual stock correction |
| `WRITE_OFF` | Damaged/expired stock removed |
| `RETURN` | Returned goods |

### Alert Types
| Value | When to Show |
|---|---|
| `LOW_STOCK` | Product below reorder level |
| `OVERSTOCK` | Product above max stock level |
| `PO_PENDING` | Purchase order awaiting action |
| `OVERDUE_RECEIPT` | PO expected but not received |
| `SYSTEM` | General system notification |

### Alert Severity
`INFO` | `WARNING` | `CRITICAL`

### Alert Channel
`IN_APP` | `EMAIL` | `BOTH`

---

## 14. Error Handling

### HTTP Status Codes

| Code | Meaning | What To Do |
|---|---|---|
| `200` | Success | Read `data` field |
| `201` | Created | Resource was created successfully |
| `400` | Bad Request | Show validation errors from `message` |
| `401` | Unauthorized | Token missing/expired → redirect to login |
| `403` | Forbidden | User lacks required role → show "Access Denied" |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate data (e.g., duplicate SKU or Tax ID) |
| `500` | Server Error | Show generic error, log for debugging |

### Error Response Format
```json
{
  "status": 400,
  "message": "SKU is required, Name is required",
  "timestamp": "2026-04-28T22:00:00",
  "path": "/api/v1/products"
}
```

### Recommended Error Handler
```js
function handleApiError(error) {
  const status = error.response?.status;
  const message = error.response?.data?.message || 'An unexpected error occurred';

  switch (status) {
    case 400: showToast('Validation Error: ' + message, 'error'); break;
    case 401: redirectToLogin(); break;
    case 403: showToast('Access Denied. Insufficient permissions.', 'error'); break;
    case 404: showToast('Resource not found.', 'warning'); break;
    case 409: showToast('Conflict: ' + message, 'error'); break;
    default:  showToast('Server error. Please try again.', 'error');
  }
}
```

---

*This document was auto-generated from the StockPro backend source code. All API paths, schemas, and rules are accurate as of the last backend build.*
