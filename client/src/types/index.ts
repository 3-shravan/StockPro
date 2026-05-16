/**
 * ─── Types Barrel Export ────────────────────────────────────────────────────
 * Single import point for global types.
 * Domain models are co-located inside their respective src/features/*
 * They are re-exported here to maintain backward compatibility during refactor.
 */
export * from './api.types';
export * from './enums';

export * from '@/features/auth/types';
export * from '@/features/products/types';
export * from '@/features/warehouses/types';
export * from '@/features/purchases/types';
export * from '@/features/movements/types';
export * from '@/features/suppliers/types';
export * from '@/features/alerts/types';
