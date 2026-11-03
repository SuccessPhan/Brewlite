// SỐ LIỆU BÁN HÀNG cho trang Tổng quan của quản lý.
// Hiện sinh dữ liệu mẫu cố định (cùng ngày luôn ra cùng số) từ thực đơn thật để làm xong giao diện;
// sau này thay salesFor() bằng gọi API thống kê đơn hàng, giao diện giữ nguyên.
import type { Product } from './types';

export type Range = 'today' | '7d' | '30d';
export const RANGE_LABEL: Record<Range, string> = { today: 'Hôm nay', '7d': '7 ngày', '30d': '30 ngày' };
const PREV_LABEL: Record<Range, string> = { today: 'so với hôm qua', '7d': 'so với 7 ngày trước', '30d': 'so với 30 ngày trước' };

export type OrderState = 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED';
export interface SaleOrder {
  code: string;
  at: Date;
  customer: string;
  items: { productId: string; qty: number; price: number }[];
  total: number;
  method: 'VNPAY' | 'POINTS';
  state: OrderState;
}

export interface Bucket {
  label: string;
  /** Nhãn đầy đủ cho chú thích khi rê chuột */
  title: string;
  revenue: number;
  orders: number;
}

export interface SalesSummary {
  revenue: number;
  orders: number;
  cups: number;
  aov: number;
  prev: { revenue: number; orders: number; cups: number; aov: number };
  prevLabel: string;
  buckets: Bucket[];
  top: { productId: string; qty: number; revenue: number }[];
  methods: { VNPAY: number; POINTS: number };
  recent: SaleOrder[];
}

const NAMES = ['Nguyễn Minh Anh', 'Trần Thu Hà', 'Lê Quang Minh', 'Phạm Ngọc Lan', 'Võ Đức Huy', 'Đặng Bảo Ngọc', 'Hoàng Gia Bảo', 'Bùi Khánh Linh', 'Đỗ Tuấn Kiệt', 'Ngô Thảo Vy', 'Huỳnh Nhật Nam', 'Phan Mỹ Duyên'];
// Khách gọi theo khung giờ: đông sáng 7–9 giờ và chiều 15–17 giờ
const HOUR_WEIGHT = [0, 0, 0, 0, 0, 0, 2, 9, 10, 6, 4, 4, 5, 3, 3, 6, 6, 4, 3, 3, 2, 1, 0, 0];

/** Số ngẫu nhiên cố định theo hạt giống (mulberry32) */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T>(r: () => number, items: T[], weight: (t: T) => number): T {
  const total = items.reduce((n, t) => n + weight(t), 0);
  let x = r() * total;
  for (const t of items) {
    x -= weight(t);
    if (x <= 0) return t;
  }
  return items[items.length - 1];
}

const dayKey = (d: Date) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Đơn của một ngày; hôm nay chỉ tính tới giờ hiện tại */
function ordersOn(day: Date, products: Product[], now: Date): SaleOrder[] {
  const r = rng(dayKey(day));
  const weekend = day.getDay() === 0 || day.getDay() === 6;
  const count = Math.round((weekend ? 62 : 48) + r() * 18);
  const menu = products.filter((p) => p.price > 0);
  const out: SaleOrder[] = [];
  for (let i = 0; i < count; i++) {
    const hour = pickWeighted(r, HOUR_WEIGHT.map((w, h) => ({ h, w })), (x) => x.w).h;
    const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, Math.floor(r() * 60));
    if (at > now) continue;
    const lines = 1 + Math.floor(r() * r() * 3);
    const items = Array.from({ length: lines }, () => {
      const p = pickWeighted(r, menu, (x) => (x.tag === 'hot' ? 3 : 1) + x.sold / 800);
      return { productId: p.id, qty: 1 + Math.floor(r() * r() * 2), price: p.price };
    });
    const total = items.reduce((n, it) => n + it.qty * it.price, 0);
    const ageMin = (now.getTime() - at.getTime()) / 60000;
    out.push({
      code: `BL${String(Math.floor(r() * 900000) + 100000)}`,
      at,
      customer: NAMES[Math.floor(r() * NAMES.length)],
      items,
      total,
      method: r() < 0.82 ? 'VNPAY' : 'POINTS',
      state: ageMin < 6 ? 'PAID' : ageMin < 14 ? 'PREPARING' : ageMin < 22 ? 'READY' : 'COMPLETED',
    });
  }
  return out.sort((a, b) => b.at.getTime() - a.at.getTime());
}

function totals(orders: SaleOrder[]) {
  const revenue = orders.reduce((n, o) => n + o.total, 0);
  const cups = orders.reduce((n, o) => n + o.items.reduce((m, it) => m + it.qty, 0), 0);
  return { revenue, orders: orders.length, cups, aov: orders.length ? Math.round(revenue / orders.length) : 0 };
}

const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const dm = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;

export function salesFor(range: Range, products: Product[], now = new Date()): SalesSummary | null {
  if (!products.length) return null;
  const days = range === 'today' ? 1 : range === '7d' ? 7 : 30;
  const today = startOfDay(now);
  const dayAt = (offset: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);

  const current: SaleOrder[][] = [];
  for (let i = days - 1; i >= 0; i--) current.push(ordersOn(dayAt(i), products, now));
  // Kỳ trước: cùng số ngày ngay trước đó; với "hôm nay" thì lấy hôm qua tới cùng giờ cho công bằng
  const prevOrders: SaleOrder[] = [];
  for (let i = 2 * days - 1; i >= days; i--) {
    const d = dayAt(i);
    const cut = range === 'today' ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), now.getHours(), now.getMinutes()) : now;
    prevOrders.push(...ordersOn(d, products, cut));
  }
  const all = current.flat();

  const buckets: Bucket[] =
    range === 'today'
      ? Array.from({ length: 17 }, (_, k) => {
          const h = k + 6;
          const os = all.filter((o) => o.at.getHours() === h);
          return { label: `${h}h`, title: `${h}:00 – ${h}:59`, revenue: os.reduce((n, o) => n + o.total, 0), orders: os.length };
        })
      : current.map((os, k) => {
          const d = dayAt(days - 1 - k);
          return { label: range === '7d' ? WD[d.getDay()] : dm(d), title: `${WD[d.getDay()]}, ${dm(d)}`, revenue: os.reduce((n, o) => n + o.total, 0), orders: os.length };
        });

  const byProduct = new Map<string, { qty: number; revenue: number }>();
  for (const o of all)
    for (const it of o.items) {
      const e = byProduct.get(it.productId) ?? { qty: 0, revenue: 0 };
      e.qty += it.qty;
      e.revenue += it.qty * it.price;
      byProduct.set(it.productId, e);
    }

  const methods = { VNPAY: 0, POINTS: 0 };
  for (const o of all) methods[o.method] += o.total;

  return {
    ...totals(all),
    prev: totals(prevOrders),
    prevLabel: PREV_LABEL[range],
    buckets,
    top: [...byProduct.entries()]
      .map(([productId, v]) => ({ productId, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5),
    methods,
    // Đơn mới nhất, kể cả hôm qua khi hôm nay chưa có đơn
    recent: [...ordersOn(today, products, now), ...ordersOn(dayAt(1), products, now)].slice(0, 6),
  };
}

/** Số tiền gọn cho trục và ô số liệu: 1,2 tr · 850 N */
export function compactVnd(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`;
  if (n >= 1000) return `${Math.round(n / 1000).toLocaleString('vi-VN')} N`;
  return String(n);
}
