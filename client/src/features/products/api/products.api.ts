/**
 * ─── Products API ───────────────────────────────────────────────────────────
 * All HTTP calls for the Product Service.
 */
import apiClient from '@/lib/api-client';
import type { ApiResponse, Product, ProductRequest } from '@/types';

export const productsApi = {
  /** GET /products → all products */
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<Product[]>>('/products');
    return data;
  },

  /** GET /products/:id → single product */
  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return data;
  },

  /** GET /products/sku/:sku → lookup by SKU */
  getBySku: async (sku: string) => {
    const { data } = await apiClient.get<ApiResponse<Product>>(`/products/sku/${sku}`);
    return data;
  },

  /** GET /products/barcode/:barcode → lookup by barcode */
  getByBarcode: async (barcode: string) => {
    const { data } = await apiClient.get<ApiResponse<Product>>(`/products/barcode/${barcode}`);
    return data;
  },

  /** GET /products/category/:category → filter by category */
  getByCategory: async (category: string) => {
    const { data } = await apiClient.get<ApiResponse<Product[]>>(`/products/category/${category}`);
    return data;
  },

  /** GET /products/brand/:brand → filter by brand */
  getByBrand: async (brand: string) => {
    const { data } = await apiClient.get<ApiResponse<Product[]>>(`/products/brand/${brand}`);
    return data;
  },

  /** GET /products/search?query=... → full-text search */
  search: async (query: string) => {
    const { data } = await apiClient.get<ApiResponse<Product[]>>('/products/search', {
      params: { query },
    });
    return data;
  },

  /** GET /products/low-stock → products below reorder level */
  getLowStock: async () => {
    const { data } = await apiClient.get<ApiResponse<Product[]>>('/products/low-stock');
    return data;
  },

  /** POST /products → create a new product */
  create: async (payload: ProductRequest) => {
    const { data } = await apiClient.post<ApiResponse<Product>>('/products', payload);
    return data;
  },

  /** PUT /products/:id → update existing product */
  update: async (id: number, payload: Partial<ProductRequest>) => {
    const { data } = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, payload);
    return data;
  },

  /** PUT /products/:id/deactivate → soft-delete */
  deactivate: async (id: number) => {
    const { data } = await apiClient.put<ApiResponse<void>>(`/products/${id}/deactivate`);
    return data;
  },

  /** DELETE /products/:id → hard delete */
  delete: async (id: number) => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/products/${id}`);
    return data;
  },
};
