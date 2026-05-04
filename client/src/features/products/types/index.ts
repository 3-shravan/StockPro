export interface Product {
  productId: number;
  sku: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  maxStockLevel: number;
  leadTimeDays: number;
  imageUrl?: string;
  barcode?: string;
  currentQuantity: number;
  active: boolean;
}

export interface ProductRequest {
  sku?: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  maxStockLevel: number;
  leadTimeDays: number;
  imageUrl?: string;
  barcode?: string;
  currentQuantity: number;
}
