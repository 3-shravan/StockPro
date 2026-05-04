export interface Supplier {
  supplierId: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  paymentTerms?: string;
  leadTimeDays: number;
  rating: number;
  isActive: boolean;
}

export interface SupplierRequest {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  paymentTerms?: string;
  leadTimeDays: number;
}
