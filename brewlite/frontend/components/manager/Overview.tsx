'use client';

// TỔNG QUAN KHO: giá trị tồn, cảnh báo sắp hết, đề xuất nhập theo nhà cung cấp, món sắp không pha được, hoạt động gần đây
import Link from 'next/link';
import { useMemo } from 'react';
import { formatDateTime, formatVnd } from '@/lib/format';
import { MOVE_LABEL, cupsLeft, qtyText, receiptTotal, stateOf, suggestQty, useInventory } from '@/lib/inventory';
import { useProductMap } from '@/lib/products';
import { PageHead, Stat, StateText, StockBar, btnLine, btnSolid } from './ui';

export default function Overview() {
  const { ingredients, suppliers, receipts, movements, recipes } = useInventory();
  const products = useProductMap();
  const map = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);

  const value = ingredients.reduce((n, i) => n + i.stock * i.cost, 0);
  const low = ingredients.filter((i) => stateOf(i) === 'low');
  const out = ingredients.filter((i) => stateOf(i) === 'out');
  const weekAgo = Date.now() - 7 * 86_400_000;
  const imported = receipts.filter((r) => r.status === 'done' && new Date(r.at).getTime() >= weekAgo);
  const drafts = receipts.filter((r) => r.status === 'draft');

  // Cần nhập: hết trước, rồi tới sắp hết; nhóm theo nhà cung cấp để gọi một lần
  const needs = [...out, ...low];
  const bySupplier = suppliers
    .map((s) => ({ supplier: s, items: needs.filter((i) => i.supplierId === s.id) }))
    .filter((g) => g.items.length > 0);

  // Món nào sắp không pha được (ít ly nhất trước)
  const risky = recipes
    .map((r) => ({ r, ...cupsLeft(r, map) }))
    .sort((a, b) => a.cups - b.cups)
    .slice(0, 5);

  return (
    <>
      <PageHead
        kicker="Sổ kho · hôm nay"
        title="Tổng quan kho"
        lead="Tình hình nguyên liệu, việc cần làm trong ngày và những món có thể sắp không pha được."
        actions={
          <>
            <Link href="/quan-ly/kiem-kho" className={btnLine}>
              Kiểm kho
            </Link>
            <Link href="/quan-ly/nhap-kho?tao=1" className={btnSolid}>
              + Tạo phiếu nhập
            </Link>
          </>
        }
      />

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Số liệu kho">
        <Stat label="Giá trị tồn kho" value={formatVnd(value)} hint={`${ingredients.length} nguyên liệu`} />
        <Stat label="Hết hàng" value={out.length} tone={out.length ? 'text-chili' : ''} hint={out.length ? out.map((i) => i.name).join(', ') : 'Không có'} />
        <Stat label="Sắp hết" value={low.length} tone={low.length ? 'text-amber-700' : ''} hint="Dưới hoặc bằng mức tối thiểu" />
        <Stat label="Nhập 7 ngày qua" value={formatVnd(imported.reduce((n, r) => n + receiptTotal(r), 0))} hint={`${imported.length} phiếu${drafts.length ? ` · ${drafts.length} phiếu nháp` : ''}`} />
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_22rem]">
        {/* Cần nhập */}
        <section aria-labelledby="need-title">
          <div className="flex items-end justify-between gap-3 border-b-2 border-roast pb-2">
            <h2 id="need-title" className="text-2xl font-black">
              Cần nhập
            </h2>
            <Link href="/quan-ly/nguyen-lieu?loc=can-nhap" className="font-label text-xs font-semibold uppercase tracking-wider underline underline-offset-4 hover:text-gold">
              Xem trong danh sách →
            </Link>
          </div>
          {bySupplier.length === 0 ? (
            <p className="py-8 text-center text-roast/60">Kho đủ dùng, chưa cần nhập thêm.</p>
          ) : (
            bySupplier.map(({ supplier, items }) => (
              <div key={supplier.id} className="mt-4 border-2 border-roast">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-roast bg-roast/5 px-4 py-2.5">
                  <div>
                    <p className="font-display text-lg font-bold leading-tight">{supplier.name}</p>
                    <p className="text-xs text-roast/60">
                      {supplier.phone}
                      {supplier.note && ` · ${supplier.note}`}
                    </p>
                  </div>
                  <Link href={`/quan-ly/nhap-kho?tao=1&ncc=${supplier.id}`} className={btnSolid}>
                    Tạo phiếu nhập
                  </Link>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left font-label text-[11px] uppercase tracking-wider text-roast/55">
                      <th className="px-4 py-2 font-semibold">Nguyên liệu</th>
                      <th className="hidden px-2 py-2 font-semibold sm:table-cell">Tồn / tối thiểu</th>
                      <th className="px-2 py-2 font-semibold">Trạng thái</th>
                      <th className="px-4 py-2 text-right font-semibold">Nên nhập</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dotted divide-roast/40">
                    {items.map((i) => (
                      <tr key={i.id}>
                        <td className="px-4 py-2.5">
                          <Link href={`/quan-ly/nguyen-lieu?xem=${i.id}`} className="font-semibold hover:underline">
                            {i.name}
                          </Link>
                          <span className="mt-1 block w-28 sm:hidden">
                            <StockBar stock={i.stock} min={i.min} />
                          </span>
                        </td>
                        <td className="hidden px-2 py-2.5 sm:table-cell">
                          <span className="font-mono text-xs">
                            {qtyText(i.stock, i.unit)} / {qtyText(i.min, i.unit)}
                          </span>
                          <span className="mt-1 block w-32">
                            <StockBar stock={i.stock} min={i.min} />
                          </span>
                        </td>
                        <td className="px-2 py-2.5">
                          <StateText state={stateOf(i)} />
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold">{qtyText(suggestQty(i), i.unit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </section>

        <div className="space-y-8">
          {/* Món sắp không pha được */}
          <section aria-labelledby="risk-title">
            <h2 id="risk-title" className="border-b-2 border-roast pb-2 text-2xl font-black">
              Còn pha được
            </h2>
            <ul className="divide-y divide-dotted divide-roast/40">
              {risky.map(({ r, cups, limitBy }) => (
                <li key={r.productId} className="flex items-baseline justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block font-semibold">{products.get(r.productId)?.name ?? r.productId}</span>
                    <span className="block truncate text-xs text-roast/60">Hết trước: {limitBy?.name ?? '—'}</span>
                  </span>
                  <span className={`shrink-0 font-semibold ${cups === 0 ? 'text-chili' : `font-mono ${cups < 30 ? 'text-amber-700' : ''}`}`}>{cups === 0 ? 'Hết, không pha được' : `~${cups} ly`}</span>
                </li>
              ))}
            </ul>
            <Link href="/quan-ly/cong-thuc" className="mt-2 inline-block font-label text-xs font-semibold uppercase tracking-wider underline underline-offset-4 hover:text-gold">
              Xem công thức →
            </Link>
          </section>

          {/* Hoạt động gần đây */}
          <section aria-labelledby="recent-title">
            <h2 id="recent-title" className="border-b-2 border-roast pb-2 text-2xl font-black">
              Hoạt động gần đây
            </h2>
            <ol className="divide-y divide-dotted divide-roast/40">
              {movements.slice(0, 6).map((m) => {
                const ing = map.get(m.ingredientId);
                return (
                  <li key={m.id} className="py-2.5 text-sm">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold">{ing?.name}</span>
                      <span className={`shrink-0 font-mono ${m.qty >= 0 ? 'text-leaf' : 'text-chili'}`}>
                        {m.qty >= 0 ? '+' : '−'}
                        {qtyText(Math.abs(m.qty), ing?.unit ?? '')}
                      </span>
                    </div>
                    <p className="text-xs text-roast/60">
                      {MOVE_LABEL[m.kind]} · {formatDateTime(m.at)}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}
