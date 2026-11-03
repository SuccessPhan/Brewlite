'use client';

// NỘI DUNG CỬA HÀNG mà quản lý chỉnh được: món (tên, giá, ảnh, câu giới thiệu, ẩn/hết hàng), mã giảm giá,
// chữ trên trang nhất, dải thông báo, trạng thái xử lý phản hồi.
// Hiện lưu trong bộ nhớ trình duyệt để hoàn thiện giao diện: sửa xong bấm "Xem trang khách" là thấy ngay,
// tải lại trang sẽ về như ban đầu. Sau này thay các hàm dưới bằng gọi API.
import { create } from 'zustand';
import type { CategoryId, Product } from './types';

export type ProductEdit = Partial<Pick<Product, 'name' | 'price' | 'imageUrl' | 'description' | 'tagline' | 'tag' | 'category' | 'keywords'>> & {
  hidden?: boolean;
  soldOut?: boolean;
};

export type VoucherType = 'PERCENT' | 'FREESHIP';

export interface Voucher {
  code: string;
  type: VoucherType;
  /** Tiêu đề và điều kiện hiện trên trang Ưu đãi */
  title: string;
  terms: string;
  percent: number;
  maxDiscount: number;
  minOrder: number;
  requiredMethod: 'VNPAY' | 'POINTS' | null;
  requiresDelivery: boolean;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
  /** Hiện trên trang Ưu đãi (tắt đi thì mã vẫn dùng được nếu khách biết) */
  showOnSite: boolean;
  /** yyyy-mm-dd, để trống là không giới hạn */
  startsAt: string;
  endsAt: string;
}

export interface SiteContent {
  heroKicker: string;
  heroTitle: string;
  heroCaption: string;
  heroLead: string;
  /** Mã ảnh Unsplash hoặc đường dẫn ảnh đầy đủ */
  heroImage: string;
  notice: { on: boolean; text: string; href: string };
  promo: { code: string; badge: string; title: string; text: string };
}

export type FeedbackStatus = 'new' | 'doing' | 'done';
export interface FeedbackState {
  status: FeedbackStatus;
  note: string;
  updatedAt: string;
}

export interface ChangeLog {
  id: number;
  at: string;
  text: string;
  href: string;
}

export const DEFAULT_CONTENT: SiteContent = {
  heroKicker: 'Cà phê kiểu Sài Gòn xưa',
  heroTitle: 'Ly phin chậm rãi ngày xưa, nay đặt trước khỏi chờ',
  heroCaption: 'Bàn gỗ, ghế đệm, sàn gạch bông và tiếng phin nhỏ giọt, như một quán quen của Sài Gòn những năm 80.',
  heroLead: 'Đặt món trên điện thoại trước khi ra khỏi nhà, tới quầy là có ly. Mỗi 1.000đ bạn được tích 1 điểm, dùng để đổi bánh, nâng size hoặc trừ thẳng vào đơn sau.',
  heroImage: '1571851534298-1ffa72eab79e',
  notice: { on: false, text: 'Tuần này: cà phê muối giảm 10% cho đơn đặt trước 9 giờ sáng.', href: '/menu' },
  promo: { code: 'VNPAY20', badge: '−20%', title: 'Trả qua VNPay, giảm 20% mỗi đơn', text: 'Giảm tới 25.000đ cho mỗi đơn trả bằng thẻ ATM, thẻ quốc tế hoặc QR.' },
};

/** Khớp bảng Voucher ở backend (src/seed.ts); số lượt đã dùng là số mẫu */
const VOUCHERS: Voucher[] = [
  {
    code: 'VNPAY20',
    type: 'PERCENT',
    title: 'Giảm 20% khi trả qua VNPay',
    terms: 'Tối đa 25.000đ. Chỉ áp dụng khi chọn thanh toán VNPay.',
    percent: 20,
    maxDiscount: 25000,
    minOrder: 0,
    requiredMethod: 'VNPAY',
    requiresDelivery: false,
    usageLimit: 500,
    usedCount: 312,
    active: true,
    showOnSite: true,
    startsAt: '2026-10-01',
    endsAt: '2026-12-31',
  },
  {
    code: 'BREW20',
    type: 'PERCENT',
    title: 'Giảm 20% cho đơn từ 50.000đ',
    terms: 'Tối đa 20.000đ. Áp dụng mọi phương thức thanh toán.',
    percent: 20,
    maxDiscount: 20000,
    minOrder: 50000,
    requiredMethod: null,
    requiresDelivery: false,
    usageLimit: 300,
    usedCount: 281,
    active: true,
    showOnSite: true,
    startsAt: '2026-10-15',
    endsAt: '2026-11-30',
  },
  {
    code: 'FREESHIP',
    type: 'FREESHIP',
    title: 'Miễn phí giao hàng',
    terms: 'Áp dụng khi chọn giao tận nơi, phí giao thường là 15.000đ.',
    percent: 0,
    maxDiscount: 0,
    minOrder: 0,
    requiredMethod: null,
    requiresDelivery: true,
    usageLimit: null,
    usedCount: 148,
    active: true,
    showOnSite: true,
    startsAt: '',
    endsAt: '',
  },
];

export type VoucherState = 'running' | 'paused' | 'used-up' | 'expired' | 'scheduled';
export const VOUCHER_STATE_LABEL: Record<VoucherState, string> = {
  running: 'Đang chạy',
  paused: 'Tạm dừng',
  'used-up': 'Hết lượt',
  expired: 'Hết hạn',
  scheduled: 'Chưa tới ngày',
};

const today = () => new Date().toISOString().slice(0, 10);

export function voucherState(v: Voucher): VoucherState {
  if (!v.active) return 'paused';
  if (v.usageLimit !== null && v.usedCount >= v.usageLimit) return 'used-up';
  if (v.endsAt && v.endsAt < today()) return 'expired';
  if (v.startsAt && v.startsAt > today()) return 'scheduled';
  return 'running';
}

/** Mô tả ngắn mức giảm: "−20%", "Freeship" */
export const voucherBadge = (v: Pick<Voucher, 'type' | 'percent'>) => (v.type === 'FREESHIP' ? 'Freeship' : `−${v.percent}%`);

export const FEEDBACK_STATUS_LABEL: Record<FeedbackStatus, string> = { new: 'Mới', doing: 'Đang xử lý', done: 'Đã xong' };

interface StorefrontState {
  products: Record<string, ProductEdit>;
  vouchers: Voucher[];
  content: SiteContent;
  feedback: Record<string, FeedbackState>;
  log: ChangeLog[];
  editProduct: (id: string, patch: ProductEdit, label?: string) => void;
  editProducts: (ids: string[], patch: ProductEdit, label: string) => void;
  resetProduct: (id: string, label: string) => void;
  saveVoucher: (v: Voucher, original?: string) => void;
  setVoucherActive: (code: string, active: boolean) => void;
  removeVoucher: (code: string) => void;
  setContent: (patch: Partial<SiteContent>, label?: string) => void;
  setFeedback: (id: string, patch: Partial<FeedbackState>) => void;
}

let logId = 0;
const entry = (text: string, href: string): ChangeLog => ({ id: ++logId, at: new Date().toISOString(), text, href });

export const useStorefront = create<StorefrontState>((set) => ({
  products: {},
  vouchers: VOUCHERS,
  content: DEFAULT_CONTENT,
  feedback: {},
  log: [],

  editProduct: (id, patch, label) =>
    set((s) => ({
      products: { ...s.products, [id]: { ...s.products[id], ...patch } },
      log: label ? [entry(label, `/quan-ly/thuc-don?sua=${id}`), ...s.log].slice(0, 30) : s.log,
    })),

  editProducts: (ids, patch, label) =>
    set((s) => {
      const products = { ...s.products };
      for (const id of ids) products[id] = { ...products[id], ...patch };
      return { products, log: [entry(label, '/quan-ly/thuc-don'), ...s.log].slice(0, 30) };
    }),

  resetProduct: (id, label) =>
    set((s) => {
      const { [id]: _drop, ...products } = s.products;
      void _drop;
      return { products, log: [entry(label, `/quan-ly/thuc-don?sua=${id}`), ...s.log].slice(0, 30) };
    }),

  saveVoucher: (v, original) =>
    set((s) => {
      const exists = s.vouchers.some((x) => x.code === (original ?? v.code));
      const vouchers = exists ? s.vouchers.map((x) => (x.code === (original ?? v.code) ? v : x)) : [v, ...s.vouchers];
      return { vouchers, log: [entry(`${exists ? 'Sửa' : 'Tạo'} mã ${v.code}`, '/quan-ly/ma-giam-gia'), ...s.log].slice(0, 30) };
    }),

  setVoucherActive: (code, active) =>
    set((s) => ({
      vouchers: s.vouchers.map((v) => (v.code === code ? { ...v, active } : v)),
      log: [entry(`${active ? 'Chạy lại' : 'Tạm dừng'} mã ${code}`, '/quan-ly/ma-giam-gia'), ...s.log].slice(0, 30),
    })),

  removeVoucher: (code) =>
    set((s) => ({ vouchers: s.vouchers.filter((v) => v.code !== code), log: [entry(`Xoá mã ${code}`, '/quan-ly/ma-giam-gia'), ...s.log].slice(0, 30) })),

  setContent: (patch, label) =>
    set((s) => ({ content: { ...s.content, ...patch }, log: label ? [entry(label, '/quan-ly/noi-dung'), ...s.log].slice(0, 30) : s.log })),

  setFeedback: (id, patch) =>
    set((s) => {
      const prev = s.feedback[id] ?? { status: 'new' as const, note: '', updatedAt: '' };
      return { feedback: { ...s.feedback, [id]: { ...prev, ...patch, updatedAt: new Date().toISOString() } } };
    }),
}));

/** Áp chỉnh sửa của quản lý lên món lấy từ máy chủ */
export function applyEdit(p: Product, e: ProductEdit | undefined): Product & { hidden: boolean } {
  if (!e) return { ...p, hidden: false };
  const { hidden = false, soldOut = false, ...rest } = e;
  return { ...p, ...rest, stock: soldOut ? 0 : p.stock, hidden };
}

export const CATEGORY_OPTIONS: CategoryId[] = ['truyen-thong', 'pha-may', 'tra-da-xay', 'banh-ngot'];
