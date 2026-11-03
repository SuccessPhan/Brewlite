'use client';

// THỰC ĐƠN (phần quản lý): sửa tên, giá, ảnh, câu giới thiệu, nhãn; ẩn món hoặc báo hết hàng.
// Sửa trong khung bên phải có bản xem trước đúng như thẻ món khách thấy.
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatVnd } from '@/lib/format';
import { CATEGORIES } from '@/lib/mock-data';
import { useAllProducts } from '@/lib/products';
import { matchText, type Range } from '@/lib/search';
import { useStorefront, type ProductEdit } from '@/lib/storefront';
import type { CategoryId, Product } from '@/lib/types';
import ProductImage from '@/components/menu/ProductImage';
import Highlight from '@/components/ui/Highlight';
import Toast from '@/components/ui/Toast';
import { SearchIcon } from '@/components/ui/Icons';
import { Chip, FieldLabel, PageHead, SidePanel, Toggle, btnInk, btnLine, btnSolid, input, select, textarea } from './ui';

type Item = Product & { hidden: boolean };
type Status = 'all' | 'selling' | 'soldout' | 'hidden';
const STATUS: { id: Status; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'selling', label: 'Đang bán' },
  { id: 'soldout', label: 'Hết hàng' },
  { id: 'hidden', label: 'Đang ẩn' },
];
const catName = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.name ?? id;
const statusOf = (p: Item): Exclude<Status, 'all'> => (p.hidden ? 'hidden' : p.stock <= 0 ? 'soldout' : 'selling');

export default function MenuManager() {
  const params = useSearchParams();
  const router = useRouter();
  const { data = [], isLoading } = useAllProducts();
  const { products: edits, editProduct, editProducts } = useStorefront();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [cat, setCat] = useState<CategoryId | 'all'>('all');
  const [status, setStatus] = useState<Status>('all');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [editId, setEditId] = useState<string | null>(params.get('sua'));
  const [toast, setToast] = useState<string | null>(null);

  // Mở từ ô tìm nhanh hoặc nhật ký: ?sua=<id>
  useEffect(() => {
    const id = params.get('sua');
    if (id) setEditId(id);
  }, [params]);

  const rows = useMemo(() => {
    const term = q.trim();
    const out: { p: Item; ranges: Range[]; score: number }[] = [];
    for (const p of data) {
      if (cat !== 'all' && p.category !== cat) continue;
      if (status !== 'all' && statusOf(p) !== status) continue;
      if (!term) {
        out.push({ p, ranges: [], score: 0 });
        continue;
      }
      const m = matchText(p.name, term);
      if (m) out.push({ p, ranges: m.ranges, score: m.score });
      else if (p.keywords.some((k) => matchText(k, term)) || (p.tagline && matchText(p.tagline, term))) out.push({ p, ranges: [], score: 20 });
    }
    return out.sort((a, b) => b.score - a.score || a.p.category.localeCompare(b.p.category) || a.p.name.localeCompare(b.p.name, 'vi'));
  }, [data, q, cat, status]);

  const counts = useMemo(() => {
    const c: Record<Status, number> = { all: data.length, selling: 0, soldout: 0, hidden: 0 };
    for (const p of data) c[statusOf(p)]++;
    return c;
  }, [data]);

  const editing = data.find((p) => p.id === editId) ?? null;
  const allPicked = rows.length > 0 && rows.every((r) => picked.has(r.p.id));

  function close() {
    setEditId(null);
    if (params.get('sua')) router.replace('/quan-ly/thuc-don');
  }

  function togglePick(id: string) {
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function bulk(patch: ProductEdit, verb: string) {
    const ids = [...picked];
    editProducts(ids, patch, `${verb} ${ids.length} món`);
    setToast(`Đã ${verb.toLowerCase()} ${ids.length} món`);
    setPicked(new Set());
  }

  return (
    <>
      <PageHead
        kicker="Cửa hàng"
        title="Thực đơn"
        lead="Sửa tên, giá, ảnh và câu giới thiệu; ẩn món hoặc báo hết hàng. Lưu xong là khách thấy ngay trên web."
        actions={
          <Link href="/menu" className={btnLine}>
            Xem thực đơn khách ↗
          </Link>
        }
      />

      {/* Bộ lọc */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <label className="relative min-w-[14rem] flex-1">
          <span className="sr-only">Tìm món</span>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-roast/50" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm món: gõ không dấu, chữ đầu (cpsd, bx)…" className={`${input} pl-9 font-serif normal-case tracking-normal`} />
        </label>
        <select value={cat} onChange={(e) => setCat(e.target.value as CategoryId | 'all')} className={select} aria-label="Nhóm món">
          <option value="all">Mọi nhóm</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div role="tablist" aria-label="Trạng thái" className="mt-4 flex gap-1 overflow-x-auto border-b-2 border-roast">
        {STATUS.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={status === s.id}
            onClick={() => setStatus(s.id)}
            className={`-mb-0.5 shrink-0 border-b-[3px] px-3 py-2 text-xs font-semibold tracking-wider ${status === s.id ? 'border-gold text-roast' : 'border-transparent text-roast/55 hover:text-roast'}`}
          >
            {s.label} <span className="ml-1 font-mono text-[11px] opacity-70">{counts[s.id]}</span>
          </button>
        ))}
      </div>

      {/* Danh sách */}
      {isLoading ? (
        <p className="py-10 text-center text-roast/60">Đang tải thực đơn…</p>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-roast/60">Không có món nào khớp bộ lọc.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="hidden md:table-header-group">
            <tr className="border-b border-roast text-left font-label text-[11px] uppercase tracking-wider text-roast/55">
              <th className="w-10 py-2 pl-1">
                <input
                  type="checkbox"
                  checked={allPicked}
                  onChange={() => setPicked(allPicked ? new Set() : new Set(rows.map((r) => r.p.id)))}
                  aria-label="Chọn tất cả"
                  className="h-4 w-4 accent-roast"
                />
              </th>
              <th className="py-2 font-semibold">Món</th>
              <th className="px-2 py-2 font-semibold">Nhóm</th>
              <th className="px-2 py-2 text-right font-semibold">Giá</th>
              <th className="px-3 py-2 text-center font-semibold">Hiện trên web</th>
              <th className="px-3 py-2 text-center font-semibold">Còn hàng</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-dotted divide-roast/40">
            {rows.map(({ p, ranges }) => {
              const st = statusOf(p);
              const changed = Boolean(edits[p.id]);
              return (
                <tr key={p.id} onClick={() => setEditId(p.id)} className={`cursor-pointer hover:bg-roast/5 ${p.hidden ? 'opacity-60' : ''} ${picked.has(p.id) ? 'bg-gold/5' : ''}`}>
                  <td className="py-2.5 pl-1 align-middle" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={picked.has(p.id)} onChange={() => togglePick(p.id)} aria-label={`Chọn ${p.name}`} className="h-4 w-4 accent-roast" />
                  </td>
                  <td className="py-2.5 pr-2">
                    <div className="flex items-center gap-3">
                      <span className="h-12 w-12 shrink-0 overflow-hidden border border-roast bg-cream">
                        <ProductImage product={p} width={120} className="h-full w-full object-cover" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold">
                            <Highlight text={p.name} ranges={ranges} />
                          </span>
                          {p.tag === 'hot' && <Chip tone="bad">Bán chạy</Chip>}
                          {p.tag === 'new' && <Chip tone="ok">Món mới</Chip>}
                          {st === 'soldout' && <Chip tone="warn">Hết hàng</Chip>}
                          {st === 'hidden' && <Chip tone="mute">Đang ẩn</Chip>}
                          {changed && <span className="font-label text-[10px] uppercase tracking-wider text-gold">· đã sửa</span>}
                        </span>
                        <span className={`block truncate text-xs ${p.tagline ? 'italic text-roast/70' : 'text-roast/40'}`}>{p.tagline || 'Chưa có câu giới thiệu'}</span>
                        <span className="mt-0.5 block font-mono text-xs md:hidden">
                          {formatVnd(p.price)} · {catName(p.category)}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-2 py-2.5 text-roast/75 md:table-cell">{catName(p.category)}</td>
                  <td className="hidden px-2 py-2.5 text-right font-mono md:table-cell">{formatVnd(p.price)}</td>
                  <td className="hidden px-3 py-2.5 text-center md:table-cell">
                    <Toggle on={!p.hidden} label={`${p.name} hiện trên web`} onChange={(v) => editProduct(p.id, { hidden: !v }, `${v ? 'Hiện lại' : 'Ẩn'} món ${p.name}`)} />
                  </td>
                  <td className="hidden px-3 py-2.5 text-center md:table-cell">
                    <Toggle on={p.stock > 0} label={`${p.name} còn hàng`} onChange={(v) => editProduct(p.id, { soldOut: !v }, `${v ? 'Mở bán lại' : 'Báo hết hàng'} ${p.name}`)} />
                  </td>
                  <td className="py-2.5 pl-2 text-right">
                    <span className="font-label text-xs font-semibold uppercase tracking-wider underline underline-offset-4">Sửa</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Thanh thao tác hàng loạt */}
      {picked.size > 0 && (
        <div className="sticky bottom-4 z-30 mt-4 flex flex-wrap items-center gap-2 border-2 border-roast bg-roast p-2 pl-4 text-cream">
          <span className="mr-auto text-sm font-semibold">Đã chọn {picked.size} món</span>
          <button type="button" onClick={() => bulk({ hidden: true }, 'Ẩn')} className="h-9 border border-cream/50 px-3 text-xs font-semibold tracking-wider hover:bg-cream hover:text-roast">
            Ẩn khỏi web
          </button>
          <button type="button" onClick={() => bulk({ hidden: false }, 'Hiện lại')} className="h-9 border border-cream/50 px-3 text-xs font-semibold tracking-wider hover:bg-cream hover:text-roast">
            Hiện lại
          </button>
          <button
            type="button"
            onClick={() => bulk({ soldOut: true }, 'Báo hết hàng')}
            className="h-9 border border-cream/50 px-3 text-xs font-semibold tracking-wider hover:bg-cream hover:text-roast"
          >
            Báo hết hàng
          </button>
          <button type="button" onClick={() => bulk({ soldOut: false }, 'Mở bán lại')} className="h-9 border border-cream/50 px-3 text-xs font-semibold tracking-wider hover:bg-cream hover:text-roast">
            Còn hàng
          </button>
          <button type="button" onClick={() => setPicked(new Set())} className="h-9 px-3 text-xs font-semibold tracking-wider text-cream/70 hover:text-cream">
            Bỏ chọn
          </button>
        </div>
      )}

      {editing && <ProductEditor key={editing.id} product={editing} onClose={close} onSaved={(m) => setToast(m)} />}
      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}

/** Khung sửa món: biểu mẫu bên trái, thẻ món xem trước bên phải */
function ProductEditor({ product, onClose, onSaved }: { product: Item; onClose: () => void; onSaved: (m: string) => void }) {
  const { data = [] } = useAllProducts();
  const { editProduct, resetProduct, products: edits } = useStorefront();
  const fileRef = useRef<HTMLInputElement>(null);
  const [f, setF] = useState({
    name: product.name,
    tagline: product.tagline ?? '',
    description: product.description,
    price: String(product.price),
    category: product.category,
    tag: product.tag,
    imageUrl: product.imageUrl,
    keywords: product.keywords.join(', '),
    hidden: product.hidden,
    soldOut: product.stock <= 0,
  });
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const price = Number(f.price.replace(/\D/g, ''));

  const preview: Item = {
    ...product,
    name: f.name || 'Tên món',
    tagline: f.tagline,
    description: f.description,
    price,
    category: f.category,
    tag: f.tag,
    imageUrl: f.imageUrl,
    stock: f.soldOut ? 0 : Math.max(product.stock, 1),
    hidden: f.hidden,
  };
  // Ảnh có sẵn của các món khác để chọn nhanh
  const gallery = useMemo(() => [...new Set(data.map((p) => p.imageUrl))].filter((u) => u !== f.imageUrl).slice(0, 11), [data, f.imageUrl]);

  function pickFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Chọn tệp ảnh (JPG, PNG, WEBP).');
    if (file.size > 3 * 1024 * 1024) return setError('Ảnh tối đa 3 MB.');
    const reader = new FileReader();
    reader.onload = () => set('imageUrl', String(reader.result));
    reader.readAsDataURL(file);
  }

  function save() {
    if (f.name.trim().length < 2) return setError('Tên món cần ít nhất 2 ký tự.');
    if (!price || price < 1000) return setError('Giá bán chưa hợp lệ.');
    if (!f.imageUrl.trim()) return setError('Món cần có ảnh.');
    editProduct(
      product.id,
      {
        name: f.name.trim(),
        tagline: f.tagline.trim(),
        description: f.description.trim(),
        price,
        category: f.category,
        tag: f.tag,
        imageUrl: f.imageUrl.trim(),
        keywords: f.keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        hidden: f.hidden,
        soldOut: f.soldOut,
      },
      `Sửa món ${f.name.trim()}`,
    );
    onSaved(`Đã lưu ${f.name.trim()}. Khách thấy ngay trên web.`);
    onClose();
  }

  return (
    <SidePanel
      open
      wide
      title={`Sửa món: ${product.name}`}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center gap-2">
          {error && <p className="w-full text-sm text-chili">{error}</p>}
          <button type="button" onClick={save} className={btnSolid}>
            Lưu thay đổi
          </button>
          <button type="button" onClick={onClose} className={btnLine}>
            Huỷ
          </button>
          {edits[product.id] && (
            <button
              type="button"
              onClick={() => {
                resetProduct(product.id, `Khôi phục món ${product.name}`);
                onSaved('Đã khôi phục bản gốc');
                onClose();
              }}
              className="ml-auto text-xs font-semibold tracking-wider text-roast/60 underline underline-offset-4 hover:text-chili"
            >
              Khôi phục bản gốc
            </button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-[1fr_15rem]">
        <div className="space-y-4">
          <FieldLabel label="Tên món">
            <input value={f.name} onChange={(e) => set('name', e.target.value)} maxLength={60} className={input} />
          </FieldLabel>
          <FieldLabel label={`Câu giới thiệu · ${f.tagline.length}/80`} hint="Một câu ngắn hiện dưới tên món, ví dụ: “Đậm vị phin, ngọt hậu sữa đặc”.">
            <input value={f.tagline} onChange={(e) => set('tagline', e.target.value)} maxLength={80} placeholder="Viết một câu khiến khách muốn gọi món" className={input} />
          </FieldLabel>
          <FieldLabel label={`Mô tả chi tiết · ${f.description.length}/240`}>
            <textarea value={f.description} onChange={(e) => set('description', e.target.value)} maxLength={240} rows={3} className={textarea} />
          </FieldLabel>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldLabel label="Giá bán (size nhỏ)" hint={price ? formatVnd(price) : undefined}>
              <input value={f.price} onChange={(e) => set('price', e.target.value.replace(/\D/g, ''))} inputMode="numeric" className={`${input} font-mono`} />
            </FieldLabel>
            <FieldLabel label="Nhóm">
              <select value={f.category} onChange={(e) => set('category', e.target.value as CategoryId)} className={`${select} w-full`}>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FieldLabel>
          </div>
          <div>
            <p className="font-label text-xs uppercase tracking-wider text-roast/70">Nhãn trên thẻ món</p>
            <div className="mt-1 inline-flex border-2 border-roast">
              {[
                { v: null, l: 'Không' },
                { v: 'hot' as const, l: 'Bán chạy' },
                { v: 'new' as const, l: 'Món mới' },
              ].map((o) => (
                <button
                  key={o.l}
                  type="button"
                  onClick={() => set('tag', o.v)}
                  className={`h-9 px-3 text-xs font-semibold tracking-wider ${f.tag === o.v ? 'bg-roast text-cream' : 'hover:bg-roast/10'}`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-label text-xs uppercase tracking-wider text-roast/70">Ảnh món</p>
            <div className="mt-1 flex gap-2">
              <input
                value={f.imageUrl.startsWith('data:') ? 'Ảnh tải lên từ máy' : f.imageUrl}
                onChange={(e) => set('imageUrl', e.target.value)}
                placeholder="Dán đường dẫn ảnh"
                className={`${input} font-mono text-xs`}
              />
              <button type="button" onClick={() => fileRef.current?.click()} className={`${btnInk} shrink-0`}>
                Tải ảnh lên
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickFile(e.target.files?.[0])} />
            </div>
            <p className="mt-2 text-xs text-roast/55">Hoặc chọn nhanh ảnh có sẵn:</p>
            <div className="mt-1 grid grid-cols-6 gap-1.5">
              {gallery.map((u) => (
                <button key={u} type="button" onClick={() => set('imageUrl', u)} className="aspect-square overflow-hidden border border-roast/40 hover:border-roast" aria-label="Dùng ảnh này">
                  <ProductImage product={{ ...product, imageUrl: u }} width={120} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <FieldLabel label="Từ khoá tìm kiếm" hint="Cách nhau bằng dấu phẩy. Khách gõ các từ này cũng ra món, ví dụ: cf, cafe, phin.">
            <input value={f.keywords} onChange={(e) => set('keywords', e.target.value)} className={input} />
          </FieldLabel>

          <div className="space-y-2 border-t border-dotted border-roast/50 pt-4">
            <label className="flex items-center justify-between gap-3">
              <span>
                <span className="block font-semibold">Hiện trên web</span>
                <span className="block text-xs text-roast/60">Tắt để ẩn món khỏi thực đơn, tìm kiếm và trang nhất.</span>
              </span>
              <Toggle on={!f.hidden} label="Hiện trên web" onChange={(v) => set('hidden', !v)} />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>
                <span className="block font-semibold">Còn hàng</span>
                <span className="block text-xs text-roast/60">Tắt khi hết nguyên liệu: món vẫn hiện nhưng khách không đặt được.</span>
              </span>
              <Toggle on={!f.soldOut} label="Còn hàng" onChange={(v) => set('soldOut', !v)} />
            </label>
          </div>
        </div>

        {/* Xem trước */}
        <div className="md:sticky md:top-0 md:self-start">
          <p className="kicker">Khách sẽ thấy</p>
          <div className={`mt-2 border-2 border-dashed border-roast/40 p-3 ${f.hidden ? 'opacity-50' : ''}`}>
            <PreviewCard p={preview} />
          </div>
          {f.hidden && <p className="mt-2 text-xs font-semibold text-chili">Món đang ẩn, khách không thấy món này.</p>}
        </div>
      </div>
    </SidePanel>
  );
}

/** Bản sao tĩnh của thẻ món phía khách (không bấm được) */
function PreviewCard({ p }: { p: Item }) {
  const soldOut = p.stock <= 0;
  return (
    <article className="flex flex-col border-t-2 border-roast pt-2">
      <div className="flex items-center justify-between font-label text-[11px] uppercase tracking-wider">
        <span className={p.tag === 'hot' ? 'text-gold' : p.tag === 'new' ? 'text-leaf' : 'text-roast/50'}>{p.tag === 'hot' ? 'Bán chạy' : p.tag === 'new' ? 'Món mới' : ''}</span>
        <span className="text-roast/60">★ {p.rating.toFixed(1).replace('.', ',')}</span>
      </div>
      <div className="relative mt-2 aspect-square overflow-hidden border border-roast bg-cream p-1.5">
        <ProductImage key={p.imageUrl} product={p} className="menu-print h-full w-full" />
        {soldOut && (
          <span className="absolute inset-0 grid place-items-center bg-cream/70">
            <span className="stamp text-base text-gold">Hết hàng</span>
          </span>
        )}
      </div>
      <h3 className="mt-2 text-lg font-bold leading-tight">{p.name}</h3>
      {p.tagline && <p className="mt-0.5 font-serif text-sm italic leading-snug text-roast/70">{p.tagline}</p>}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-dotted border-roast/60 pt-2">
        <span className="tabular-nums font-semibold">{formatVnd(p.price)}</span>
        <span className={`inline-flex h-9 items-center border-2 px-2.5 font-label text-xs font-semibold uppercase ${soldOut ? 'border-roast/30 text-roast/40' : 'border-roast'}`}>+ Thêm</span>
      </div>
    </article>
  );
}
