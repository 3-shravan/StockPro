# StockPro Frontend Auth Architecture

## Runtime Contract

`POST /auth/login` is the only public user entry point.

```json
{
  "token": "jwt",
  "role": "ADMIN | MANAGER | STAFF | OFFICER",
  "userId": 1
}
```

The frontend stores the token, role, and user id in `localStorage` under `stockpro.auth`. UI checks are only for navigation and rendering. Backend services must enforce authorization on every protected API.

## Frontend Structure

```txt
src/
  app/provider.tsx
  contexts/AuthContext.tsx
  lib/api-client.ts
  lib/auth-storage.ts
  router/ProtectedRoute.tsx
  router/index.tsx
  components/layout/
    DashboardLayout.tsx
    Header.tsx
    Navigation.tsx
  features/
    auth/
    dashboard/
    products/
    warehouses/
    purchases/
    suppliers/
    movements/
    reports/
```

## Routes

Public:

- `/login`
- `/unauthorized`

Protected:

- `/admin/*` for `ADMIN`
- `/manager/*` for `MANAGER`
- `/warehouse/*` for `STAFF`
- `/purchase/*` for `OFFICER`

## Backend Refactor Checklist

- Remove public signup from the gateway route: `/api/v1/auth/register` must not be public. If user creation is needed, expose it as an admin-only endpoint such as `POST /auth/users`.
- Keep `/auth/login` public and return exactly `token`, `role`, and `userId`.
- Put `role` and `userId` claims in the JWT and validate expiry at the gateway.
- Enforce authorization in backend code, not only in the frontend. Use `@PreAuthorize`, route metadata, or service-level role checks.
- Strip client-supplied internal headers at the gateway before forwarding, then inject trusted `X-User-Id`, `X-User-Roles`, and `X-Internal-Gateway-Secret`.
- Return `401` for missing/invalid/expired tokens and `403` for valid tokens with insufficient role.
- Configure CORS only for deployed frontend origins in production.
- Use environment variables for `JWT_SECRET` and the internal gateway secret.

## Example API Calls

```ts
import apiClient from '@/lib/api-client';

export const adminUsersApi = {
  getAll: async () => {
    const response = await apiClient.get('/auth/users');
    return response.data.data;
  },
};

export const warehouseApi = {
  transferStock: async (payload: {
    productId: number;
    sourceWarehouseId: number;
    targetWarehouseId: number;
    quantity: number;
  }) => {
    const response = await apiClient.post('/warehouses/stock/transfer', payload);
    return response.data.data;
  },
};
```

The Axios interceptor in `src/lib/api-client.ts` automatically attaches:

```http
Authorization: Bearer <token>
```

and globally clears the session on `401`.
