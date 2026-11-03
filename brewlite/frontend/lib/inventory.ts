'use client';

// KHO NGUYÊN VẬT LIỆU (phần quản lý). Hiện chạy bằng dữ liệu mẫu trong trình duyệt để làm xong giao diện;
// các hàm nhập kho, điều chỉnh, kiểm kho đã đúng luồng nghiệp vụ, sau này chỉ cần thay bằng gọi API.
import { create } from 'zustand';

export type GroupId = 'ca-phe' | 'sua' | 'tra' | 'duong' | 'banh' | 'bao-bi';
export type StockState = 'ok' | 'low' | 'out';
export type MoveKind = 'receipt' | 'usage' | 'adjust' | 'waste' | 'count';

export const GROUPS: { id: GroupId; name: string }[] = [
  { id: 'ca-phe', name: 'Cà phê' },
  { id: 'sua', name: 'Sữa & kem' },
  { id: 'tra', name: 'Trà & trái cây' },
  { id: 'duong', name: 'Đường & siro' },
  { id: 'banh', name: 'Làm bánh' },
  { id: 'bao-bi', name: 'Ly & bao bì' },
];

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  note: string;
}

export interface Ingredient {
  id: string;
  name: string;
  group: GroupId;
  /** Đơn vị nhập kho (kg, lít, hộp...) */
  unit: string;
  /** Đơn vị dùng trong công thức và hệ số đổi: 1 unit = per sub (1 kg = 1000 g) */
  sub: string;
  per: number;
  stock: number;
  min: number;
  /** Giá vốn bình quân cho 1 unit */
  cost: number;
  supplierId: string;
}

export interface Movement {
  id: string;
  ingredientId: string;
  kind: MoveKind;
  /** Số lượng theo unit, dương là vào kho, âm là ra kho */
  qty: number;
  at: string;
  note: string;
  ref?: string;
}

export interface ReceiptLine {
  ingredientId: string;
  qty: number;
  price: number;
}

export interface Receipt {
  id: string;
  supplierId: string;
  at: string;
  status: 'draft' | 'done';
  lines: ReceiptLine[];
  note: string;
}

export interface RecipeLine {
  ingredientId: string;
  /** Số lượng theo đơn vị công thức (sub) */
  amount: number;
}

export interface Recipe {
  productId: string;
  size: string;
  lines: RecipeLine[];
}

export const MOVE_LABEL: Record<MoveKind, string> = {
  receipt: 'Nhập kho',
  usage: 'Xuất pha chế',
  adjust: 'Điều chỉnh',
  waste: 'Huỷ hư hỏng',
  count: 'Kiểm kho',
};

const SUPPLIERS: Supplier[] = [
  { id: 'ncc-rang', name: 'Xưởng rang Tây Nguyên', phone: '0901 234 567', note: 'Giao thứ hai và thứ năm' },
  { id: 'ncc-sua', name: 'Đại lý sữa Phú Nhuận', phone: '0902 345 678', note: 'Đặt trước 1 ngày' },
  { id: 'ncc-trai-cay', name: 'Vựa trái cây Bình Điền', phone: '0903 456 789', note: 'Giao sáng sớm hằng ngày' },
  { id: 'ncc-tra', name: 'Trà Thái Nguyên Phát', phone: '0904 567 890', note: '' },
  { id: 'ncc-bao-bi', name: 'Bao bì Minh Khang', phone: '0905 678 901', note: 'Đơn từ 2 triệu miễn phí giao' },
  { id: 'ncc-tap-hoa', name: 'Tạp hoá Ba Mến', phone: '0906 789 012', note: 'Mua lẻ, trả tiền mặt' },
];

const INGREDIENTS: Ingredient[] = [
  { id: 'robusta', name: 'Hạt robusta rang mộc', group: 'ca-phe', unit: 'kg', sub: 'g', per: 1000, stock: 18.5, min: 10, cost: 220000, supplierId: 'ncc-rang' },
  { id: 'arabica', name: 'Hạt arabica', group: 'ca-phe', unit: 'kg', sub: 'g', per: 1000, stock: 6.2, min: 8, cost: 380000, supplierId: 'ncc-rang' },
  { id: 'sua-dac', name: 'Sữa đặc', group: 'sua', unit: 'hộp', sub: 'g', per: 380, stock: 42, min: 30, cost: 24000, supplierId: 'ncc-sua' },
  { id: 'sua-tuoi', name: 'Sữa tươi không đường', group: 'sua', unit: 'lít', sub: 'ml', per: 1000, stock: 12, min: 20, cost: 32000, supplierId: 'ncc-sua' },
  { id: 'kem-beo', name: 'Kem béo whipping', group: 'sua', unit: 'lít', sub: 'ml', per: 1000, stock: 3.5, min: 4, cost: 120000, supplierId: 'ncc-sua' },
  { id: 'cot-dua', name: 'Nước cốt dừa', group: 'sua', unit: 'lít', sub: 'ml', per: 1000, stock: 0, min: 3, cost: 65000, supplierId: 'ncc-trai-cay' },
  { id: 'tra-den', name: 'Trà đen', group: 'tra', unit: 'kg', sub: 'g', per: 1000, stock: 4.8, min: 2, cost: 260000, supplierId: 'ncc-tra' },
  { id: 'matcha', name: 'Bột matcha', group: 'tra', unit: 'kg', sub: 'g', per: 1000, stock: 1.2, min: 1, cost: 900000, supplierId: 'ncc-tra' },
  { id: 'dao-ngam', name: 'Đào ngâm', group: 'tra', unit: 'hộp', sub: 'g', per: 820, stock: 14, min: 10, cost: 58000, supplierId: 'ncc-trai-cay' },
  { id: 'vai-ngam', name: 'Vải ngâm', group: 'tra', unit: 'hộp', sub: 'g', per: 565, stock: 9, min: 8, cost: 62000, supplierId: 'ncc-trai-cay' },
  { id: 'chanh-day', name: 'Chanh dây', group: 'tra', unit: 'kg', sub: 'g', per: 1000, stock: 2, min: 3, cost: 45000, supplierId: 'ncc-trai-cay' },
  { id: 'cam', name: 'Cam sành', group: 'tra', unit: 'kg', sub: 'g', per: 1000, stock: 6, min: 4, cost: 38000, supplierId: 'ncc-trai-cay' },
  { id: 'sa', name: 'Sả cây', group: 'tra', unit: 'kg', sub: 'g', per: 1000, stock: 1.5, min: 1, cost: 25000, supplierId: 'ncc-trai-cay' },
  { id: 'tran-chau', name: 'Trân châu đen', group: 'tra', unit: 'kg', sub: 'g', per: 1000, stock: 5, min: 3, cost: 70000, supplierId: 'ncc-tap-hoa' },
  { id: 'duong', name: 'Đường cát trắng', group: 'duong', unit: 'kg', sub: 'g', per: 1000, stock: 25, min: 10, cost: 22000, supplierId: 'ncc-tap-hoa' },
  { id: 'siro-caramel', name: 'Siro caramel', group: 'duong', unit: 'chai', sub: 'ml', per: 750, stock: 4, min: 3, cost: 210000, supplierId: 'ncc-tap-hoa' },
  { id: 'sot-socola', name: 'Sốt sô-cô-la', group: 'duong', unit: 'chai', sub: 'ml', per: 500, stock: 2, min: 2, cost: 180000, supplierId: 'ncc-tap-hoa' },
  { id: 'bot-mi', name: 'Bột mì số 11', group: 'banh', unit: 'kg', sub: 'g', per: 1000, stock: 15, min: 10, cost: 28000, supplierId: 'ncc-tap-hoa' },
  { id: 'bo', name: 'Bơ lạt', group: 'banh', unit: 'kg', sub: 'g', per: 1000, stock: 3, min: 4, cost: 260000, supplierId: 'ncc-sua' },
  { id: 'trung', name: 'Trứng gà', group: 'banh', unit: 'quả', sub: 'quả', per: 1, stock: 120, min: 60, cost: 3500, supplierId: 'ncc-tap-hoa' },
  { id: 'da-vien', name: 'Đá viên', group: 'bao-bi', unit: 'kg', sub: 'g', per: 1000, stock: 80, min: 50, cost: 3000, supplierId: 'ncc-tap-hoa' },
  { id: 'ly-500', name: 'Ly nhựa 500 ml', group: 'bao-bi', unit: 'cái', sub: 'cái', per: 1, stock: 850, min: 500, cost: 1200, supplierId: 'ncc-bao-bi' },
  { id: 'nap-ly', name: 'Nắp ly', group: 'bao-bi', unit: 'cái', sub: 'cái', per: 1, stock: 900, min: 500, cost: 400, supplierId: 'ncc-bao-bi' },
  { id: 'ong-hut', name: 'Ống hút giấy', group: 'bao-bi', unit: 'cái', sub: 'cái', per: 1, stock: 300, min: 400, cost: 300, supplierId: 'ncc-bao-bi' },
  { id: 'tui-giay', name: 'Túi giấy mang đi', group: 'bao-bi', unit: 'cái', sub: 'cái', per: 1, stock: 400, min: 200, cost: 1500, supplierId: 'ncc-bao-bi' },
];

// Công thức định lượng cho ly size M (hoặc 1 cái bánh)
const CUP = [
  { ingredientId: 'ly-500', amount: 1 },
  { ingredientId: 'nap-ly', amount: 1 },
  { ingredientId: 'ong-hut', amount: 1 },
];
const RECIPES: Recipe[] = [
  { productId: 'ca-phe-sua-da', size: 'M', lines: [{ ingredientId: 'robusta', amount: 25 }, { ingredientId: 'sua-dac', amount: 35 }, { ingredientId: 'da-vien', amount: 150 }, ...CUP] },
  { productId: 'bac-xiu', size: 'M', lines: [{ ingredientId: 'robusta', amount: 15 }, { ingredientId: 'sua-dac', amount: 30 }, { ingredientId: 'sua-tuoi', amount: 80 }, { ingredientId: 'da-vien', amount: 120 }, ...CUP] },
  { productId: 'ca-phe-den-da', size: 'M', lines: [{ ingredientId: 'robusta', amount: 25 }, { ingredientId: 'duong', amount: 15 }, { ingredientId: 'da-vien', amount: 150 }, ...CUP] },
  { productId: 'ca-phe-cot-dua', size: 'M', lines: [{ ingredientId: 'robusta', amount: 25 }, { ingredientId: 'cot-dua', amount: 60 }, { ingredientId: 'sua-dac', amount: 20 }, { ingredientId: 'da-vien', amount: 150 }, ...CUP] },
  { productId: 'latte', size: 'M', lines: [{ ingredientId: 'arabica', amount: 18 }, { ingredientId: 'sua-tuoi', amount: 200 }, ...CUP] },
  { productId: 'caramel-macchiato', size: 'M', lines: [{ ingredientId: 'arabica', amount: 18 }, { ingredientId: 'sua-tuoi', amount: 180 }, { ingredientId: 'siro-caramel', amount: 20 }, { ingredientId: 'kem-beo', amount: 30 }, ...CUP] },
  { productId: 'tra-dao-cam-sa', size: 'M', lines: [{ ingredientId: 'tra-den', amount: 8 }, { ingredientId: 'dao-ngam', amount: 70 }, { ingredientId: 'cam', amount: 40 }, { ingredientId: 'sa', amount: 10 }, { ingredientId: 'duong', amount: 15 }, { ingredientId: 'da-vien', amount: 150 }, ...CUP] },
  { productId: 'tra-chanh-day', size: 'M', lines: [{ ingredientId: 'tra-den', amount: 6 }, { ingredientId: 'chanh-day', amount: 50 }, { ingredientId: 'duong', amount: 20 }, { ingredientId: 'da-vien', amount: 150 }, ...CUP] },
  { productId: 'tra-sua-tran-chau', size: 'M', lines: [{ ingredientId: 'tra-den', amount: 8 }, { ingredientId: 'sua-tuoi', amount: 100 }, { ingredientId: 'tran-chau', amount: 50 }, { ingredientId: 'duong', amount: 20 }, { ingredientId: 'da-vien', amount: 120 }, ...CUP] },
  { productId: 'croissant-bo', size: '1 cái', lines: [{ ingredientId: 'bot-mi', amount: 60 }, { ingredientId: 'bo', amount: 35 }, { ingredientId: 'trung', amount: 0.3 }, { ingredientId: 'tui-giay', amount: 1 }] },
];

/** Ngày giờ lùi về quá khứ (dữ liệu mẫu) */
const ago = (days: number, hour = 8) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
};

const RECEIPTS: Receipt[] = [
  { id: 'PN0018', supplierId: 'ncc-rang', at: ago(1, 9), status: 'done', note: '', lines: [{ ingredientId: 'robusta', qty: 10, price: 220000 }, { ingredientId: 'arabica', qty: 3, price: 380000 }] },
  { id: 'PN0017', supplierId: 'ncc-sua', at: ago(2, 7), status: 'done', note: 'Thiếu 1 thùng sữa tươi, giao bù sau', lines: [{ ingredientId: 'sua-dac', qty: 24, price: 24000 }, { ingredientId: 'sua-tuoi', qty: 12, price: 32000 }] },
  { id: 'PN0016', supplierId: 'ncc-trai-cay', at: ago(3, 6), status: 'done', note: '', lines: [{ ingredientId: 'cam', qty: 5, price: 38000 }, { ingredientId: 'chanh-day', qty: 3, price: 45000 }, { ingredientId: 'dao-ngam', qty: 12, price: 58000 }] },
  { id: 'PN0015', supplierId: 'ncc-bao-bi', at: ago(5, 10), status: 'done', note: '', lines: [{ ingredientId: 'ly-500', qty: 1000, price: 1200 }, { ingredientId: 'nap-ly', qty: 1000, price: 400 }] },
  { id: 'PN0019', supplierId: 'ncc-sua', at: ago(0, 8), status: 'draft', note: 'Chờ đại lý báo giá kem béo', lines: [{ ingredientId: 'kem-beo', qty: 6, price: 120000 }, { ingredientId: 'sua-tuoi', qty: 24, price: 32000 }] },
];

let seq = 0;
const mid = () => `mv-${Date.now().toString(36)}-${(seq++).toString(36)}`;

const MOVEMENTS: Movement[] = [
  { id: 'm1', ingredientId: 'robusta', kind: 'receipt', qty: 10, at: ago(1, 9), note: 'Nhập từ Xưởng rang Tây Nguyên', ref: 'PN0018' },
  { id: 'm2', ingredientId: 'arabica', kind: 'receipt', qty: 3, at: ago(1, 9), note: 'Nhập từ Xưởng rang Tây Nguyên', ref: 'PN0018' },
  { id: 'm3', ingredientId: 'robusta', kind: 'usage', qty: -2.4, at: ago(0, 21), note: 'Pha chế trong ngày (96 ly)' },
  { id: 'm4', ingredientId: 'sua-tuoi', kind: 'usage', qty: -6.8, at: ago(0, 21), note: 'Pha chế trong ngày' },
  { id: 'm5', ingredientId: 'cot-dua', kind: 'waste', qty: -1, at: ago(1, 14), note: 'Hộp mở quá 2 ngày, có mùi chua' },
  { id: 'm6', ingredientId: 'sua-dac', kind: 'receipt', qty: 24, at: ago(2, 7), note: 'Nhập từ Đại lý sữa Phú Nhuận', ref: 'PN0017' },
  { id: 'm7', ingredientId: 'ong-hut', kind: 'count', qty: -40, at: ago(2, 22), note: 'Kiểm kho cuối tuần: đếm thiếu 40 cái' },
  { id: 'm8', ingredientId: 'chanh-day', kind: 'usage', qty: -1.6, at: ago(0, 21), note: 'Pha chế trong ngày' },
  { id: 'm9', ingredientId: 'cam', kind: 'receipt', qty: 5, at: ago(3, 6), note: 'Nhập từ Vựa trái cây Bình Điền', ref: 'PN0016' },
  { id: 'm10', ingredientId: 'bo', kind: 'usage', qty: -1.2, at: ago(0, 6), note: 'Mẻ croissant buổi sáng (34 cái)' },
];

interface InventoryState {
  ingredients: Ingredient[];
  suppliers: Supplier[];
  receipts: Receipt[];
  movements: Movement[];
  recipes: Recipe[];
  /** Lưu phiếu nhập; status 'done' thì cộng tồn và tính lại giá vốn bình quân */
  saveReceipt: (r: Omit<Receipt, 'id' | 'at'> & { id?: string }) => string;
  /** Điều chỉnh tồn về số mới (hao hụt, hư hỏng, đếm lại) */
  adjust: (ingredientId: string, newStock: number, kind: 'adjust' | 'waste', note: string) => void;
  /** Áp kết quả kiểm kho: { id: số đếm thực tế } */
  applyCount: (counts: Record<string, number>, note: string) => number;
  saveIngredient: (i: Ingredient) => void;
}

const round = (n: number) => Math.round(n * 1000) / 1000;

export const useInventory = create<InventoryState>()((set, get) => ({
  ingredients: INGREDIENTS,
  suppliers: SUPPLIERS,
  receipts: RECEIPTS,
  movements: MOVEMENTS,
  recipes: RECIPES,

  saveReceipt: (input) => {
    const { receipts } = get();
    const id = input.id ?? `PN${String(Math.max(...receipts.map((r) => Number(r.id.slice(2))), 0) + 1).padStart(4, '0')}`;
    const at = new Date().toISOString();
    const receipt: Receipt = { ...input, id, at };
    set((s) => {
      const others = s.receipts.filter((r) => r.id !== id);
      if (receipt.status !== 'done') return { receipts: [receipt, ...others] };
      const supplier = s.suppliers.find((x) => x.id === receipt.supplierId)?.name ?? '';
      const ingredients = s.ingredients.map((ing) => {
        const line = receipt.lines.find((l) => l.ingredientId === ing.id);
        if (!line) return ing;
        const stock = round(ing.stock + line.qty);
        // Giá vốn bình quân gia quyền
        const cost = stock > 0 ? Math.round((ing.stock * ing.cost + line.qty * line.price) / stock) : line.price;
        return { ...ing, stock, cost };
      });
      const moves: Movement[] = receipt.lines.map((l) => ({ id: mid(), ingredientId: l.ingredientId, kind: 'receipt', qty: l.qty, at, note: `Nhập từ ${supplier}`, ref: id }));
      return { receipts: [receipt, ...others], ingredients, movements: [...moves, ...s.movements] };
    });
    return id;
  },

  adjust: (ingredientId, newStock, kind, note) =>
    set((s) => {
      const ing = s.ingredients.find((i) => i.id === ingredientId);
      if (!ing) return {};
      const qty = round(newStock - ing.stock);
      if (qty === 0) return {};
      return {
        ingredients: s.ingredients.map((i) => (i.id === ingredientId ? { ...i, stock: round(newStock) } : i)),
        movements: [{ id: mid(), ingredientId, kind, qty, at: new Date().toISOString(), note }, ...s.movements],
      };
    }),

  applyCount: (counts, note) => {
    const at = new Date().toISOString();
    let changed = 0;
    set((s) => {
      const moves: Movement[] = [];
      const ingredients = s.ingredients.map((i) => {
        const counted = counts[i.id];
        if (counted === undefined || round(counted - i.stock) === 0) return i;
        changed++;
        moves.push({ id: mid(), ingredientId: i.id, kind: 'count', qty: round(counted - i.stock), at, note });
        return { ...i, stock: round(counted) };
      });
      return { ingredients, movements: [...moves, ...s.movements] };
    });
    return changed;
  },

  saveIngredient: (ing) =>
    set((s) => ({ ingredients: s.ingredients.some((i) => i.id === ing.id) ? s.ingredients.map((i) => (i.id === ing.id ? ing : i)) : [...s.ingredients, ing] })),
}));

// ----- Phép tính dùng chung cho các trang -----

export function stateOf(i: Pick<Ingredient, 'stock' | 'min'>): StockState {
  if (i.stock <= 0) return 'out';
  if (i.stock <= i.min) return 'low';
  return 'ok';
}

export const STATE_LABEL: Record<StockState, string> = { ok: 'Đủ dùng', low: 'Sắp hết', out: 'Hết hàng' };
export const STATE_TONE: Record<StockState, string> = { ok: 'text-leaf', low: 'text-amber-700', out: 'text-chili' };

/** Gợi ý nhập: đưa tồn lên gấp đôi mức tối thiểu */
export const suggestQty = (i: Ingredient) => Math.max(0, Math.ceil(i.min * 2 - i.stock));

export const receiptTotal = (r: Pick<Receipt, 'lines'>) => r.lines.reduce((n, l) => n + l.qty * l.price, 0);

/** Giá vốn một ly theo công thức */
export function recipeCost(r: Recipe, map: Map<string, Ingredient>): number {
  return Math.round(r.lines.reduce((n, l) => {
    const ing = map.get(l.ingredientId);
    return ing ? n + (l.amount / ing.per) * ing.cost : n;
  }, 0));
}

/** Với tồn hiện tại còn pha được bao nhiêu ly, và nguyên liệu nào giới hạn */
export function cupsLeft(r: Recipe, map: Map<string, Ingredient>): { cups: number; limitBy: Ingredient | null } {
  let cups = Infinity;
  let limitBy: Ingredient | null = null;
  for (const l of r.lines) {
    const ing = map.get(l.ingredientId);
    if (!ing || l.amount <= 0) continue;
    const n = Math.floor((ing.stock * ing.per) / l.amount);
    if (n < cups) {
      cups = n;
      limitBy = ing;
    }
  }
  return { cups: cups === Infinity ? 0 : cups, limitBy };
}

/** "18,5 kg" */
export function qtyText(n: number, unit: string): string {
  return `${n.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} ${unit}`;
}
