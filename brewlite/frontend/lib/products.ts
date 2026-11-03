'use client';

// Menu lấy từ backend (GET /products) bằng React Query: tự cache, tự thử lại, có trạng thái loading/lỗi.
// Chỉnh sửa của quản lý (lib/storefront.ts) được áp lên trước khi hiện cho khách; món bị ẩn không hiện ra.
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiRequest } from './api';
import { applyEdit, useStorefront } from './storefront';
import type { Product } from './types';

export const PRODUCTS_KEY = ['products'] as const;

/** Tất cả món kể cả món đang ẩn (dùng trong khu quản lý) */
export function useAllProducts() {
  const query = useQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: () => apiRequest<Product[]>('/products'),
    staleTime: 30_000,
  });
  const edits = useStorefront((s) => s.products);
  const data = useMemo(() => query.data?.map((p) => applyEdit(p, edits[p.id])), [query.data, edits]);
  return { ...query, data };
}

/** Món khách thấy được */
export function useProducts() {
  const query = useAllProducts();
  const data = useMemo(() => query.data?.filter((p) => !p.hidden), [query.data]);
  return { ...query, data };
}

/** Tra cứu nhanh sản phẩm theo id (ảnh trong giỏ hàng, đơn hàng...), gồm cả món đang ẩn */
export function useProductMap(): Map<string, Product> {
  const { data } = useAllProducts();
  return useMemo(() => new Map((data ?? []).map((p) => [p.id, p])), [data]);
}
