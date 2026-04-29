# StockPro — Frontend Client Architecture

This document outlines the scalable folder structure for the StockPro frontend, designed to integrate seamlessly with the microservices backend.

## 📁 Folder Structure

```text
client/
├── public/                 # Static assets (favicons, etc.)
├── src/
│   ├── api/                # API communication layer
│   │   ├── apiClient.ts    # Base Axios instance with interceptors
│   │   ├── auth.ts         # Login, Register, Profile endpoints
│   │   ├── products.ts     # Product management endpoints
│   │   ├── warehouses.ts   # Stock & Warehouse endpoints
│   │   ├── purchase.ts     # PO lifecycle endpoints
│   │   ├── suppliers.ts    # Vendor management endpoints
│   │   ├── movements.ts    # Audit log / History endpoints
│   │   └── alerts.ts       # Notification endpoints
│   ├── assets/             # Global assets
│   │   ├── images/         # Icons, Logos, Backgrounds
│   │   └── styles/         # Global CSS / Tailwind base
│   ├── components/         # Reusable UI components
│   │   ├── common/         # Buttons, Inputs, Tables, Modals (Atomic UI)
│   │   ├── layout/         # Sidebar, Navbar, Footer, PageWrappers
│   │   └── features/       # Feature-specific complex components (e.g., StockChart)
│   ├── context/            # Global state management
│   │   └── AuthContext.tsx # User session, Roles, and Permission state
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Access AuthContext easily
│   │   └── useAlerts.ts    # Poll or subscribe to notifications
│   ├── pages/              # View components (organized by domain)
│   │   ├── auth/           # Login, Register, Forgot Password
│   │   ├── dashboard/      # Main stats and overview
│   │   ├── inventory/      # Product list, Stock levels, Warehouse management
│   │   ├── orders/         # Purchase order creation and tracking
│   │   ├── suppliers/      # Supplier directory and details
│   │   └── users/          # User management (Admin/Manager only)
│   ├── routes/             # Navigation configuration
│   │   ├── AppRoutes.tsx   # Main router setup
│   │   └── PrivateRoute.tsx# Auth & Role-based route guards
│   ├── types/              # TypeScript definitions
│   │   ├── api.d.ts        # Common ApiResponse wrapper
│   │   ├── models.d.ts     # Entities (Product, User, PO, etc.)
│   │   └── enums.ts        # Client-side copies of backend Enums
│   ├── utils/              # Helper functions
│   │   ├── formatters.ts   # Date, Currency, and Unit formatters
│   │   └── validators.ts   # Form validation logic
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── .env                    # Environment variables (API_URL)
├── tailwind.config.js      # Tailwind styling rules
├── tsconfig.json           # TypeScript rules
└── vite.config.ts          # Vite build config
```

---

## 🛠 Core Implementation Details

### 1. API Layer (`src/api/apiClient.ts`)
Centralized Axios instance that handles:
- Base URL from environment variables.
- Automatic JWT injection in headers.
- Global 401 (Unauthorized) handling to redirect to login.

### 2. State Management (`src/context/AuthContext.tsx`)
A provider that stores:
- Current logged-in `user` object.
- `isAuthenticated` boolean.
- Helper methods like `hasRole(role: string)`.

### 3. Route Guarding (`src/routes/PrivateRoute.tsx`)
A wrapper component that prevents unauthenticated users or users with insufficient roles from accessing specific pages.

### 4. Shared Types (`src/types/models.d.ts`)
Interfaces that exactly match the backend DTOs listed in the `frontend_integration_guide.md`, ensuring full end-to-end type safety.
