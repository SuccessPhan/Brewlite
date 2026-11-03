'use client';

// TỔNG QUAN CỬA HÀNG: số liệu chính, việc cần làm (phản hồi, kho, mã, thực đơn), trang khách đang hiển thị,
// rồi phần kho: đề xuất nhập theo nhà cung cấp, món sắp không pha được, hoạt động gần đây
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { heroSrc } from '@/components/home/HomeHero';
import { useFeedbackList } from '@/lib/feedback-admin';
import { formatClock, formatDate, formatDateTime, formatVnd } from '@/lib/format';
import { MOVE_LABEL, cupsLeft, qtyText, receiptTotal, stateOf, suggestQty, useInventory } from '@/lib/inventory';
import { useAllProducts, useProductMap } from '@/lib/products';
import { useStorefront, voucherState } from '@/lib/storefront';
import { PageHead, Stat, StateText, StockBar, btnLine, btnSolid } from './ui';

interface Todo {
  title: string;
  detail: string;
  href: string;
  cta: string;
  tone: string;
}

export default function Overview() {
  const { ingredients, suppliers, receipts, movements, recipes } = useInventory();
  const products = useProductMap();
  const { user } = useAuth();
  const { data: allProducts = [] } = useAllProducts();
  const { vouchers, content, log, feedback: fbState } = useStorefront();
  const { data: feedback = [] } = useFeedbackList();
  const map = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);

  // Giờ tính ở trình duyệt để khớp giờ máy của quản lý
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const hour = now?.getHours() ?? 9;
  const greet = hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  const value = ingredients.reduce((n, i) => n + i.stock * i.cost, 0);
  const low = ingredients.filter((i) => stateOf(i) === 'low');
  const out = ingredients.filter((i) => stateOf(i) === 'out');
  const weekAgo = Date.now() - 7 * 86_400_000;
  const imported = receipts.filter((r) => r.status === 'done' && new Date(r.at).getTime() >= weekAgo);
  const drafts = receipts.filter((r) => r.status === 'draft');

  const hiddenCount = allProducts.filter((p) => p.hidden).length;
  const soldOutCount = allProducts.filter((p) => !p.hidden && p.stock <= 0).length;
  const selling = allProducts.length - hiddenCount - soldOutCount;
  const running = vouchers.filter((v) => voucherState(v) === 'running');
  const openFeedback = feedback.filter((f) => (fbState[f.id]?.status ?? 'new') !== 'done');
  const newFeedback = feedback.filter((f) => (fbState[f.id]?.status ?? 'new') === 'new');

  // Cần nhập: hết trước, rồi tới sắp hết; nhóm theo nhà cung cấp để gọi một lần
  const needs = [...out, ...low];
  const bySupplier = suppliers.map((s) => ({ supplier: s, items: needs.filter((i) => i.supplierId === s.id) })).filter((g) => g.items.length > 0);

  // Món nào sắp không pha được (ít ly nhất trước)
  const risky = recipes
    .map((r) => ({ r, ...cupsLeft(r, map) }))
    .sort((a, b) => a.cups - b.cups)
    .slice(0, 5);

  // Việc cần làm: gom từ phản hồi, kho, mã giảm giá, thực đơn; việc gấp lên trước
  const todos: Todo[] = [];
  if (newFeedback.length)
    todos.push({
      title: `Trả lời ${newFeedback.length} phản hồi mới của khách`,
      detail: newFeedback
        .slice(0, 2)
        .map((f) => `${f.name}: ${f.message.slice(0, 40)}…`)
        .join(' · '),
      href: '/quan-ly/phan-hoi',
      cta: 'Đọc thư',
      tone: 'bg-gold',
    });
  const blocked = risky.filter((r) => {
    const p = allProducts.find((x) => x.id === r.r.productId);
    return r.cups === 0 && p && !p.hidden && p.stock > 0;
  });
  if (blocked.length)
    todos.push({
      title: `${blocked.length} món đang bán nhưng không pha được vì hết nguyên liệu`,
      detail: blocked.map((r) => `${products.get(r.r.productId)?.name ?? r.r.productId} (hết ${r.limitBy?.name ?? '—'})`).join(', '),
      href: `/quan-ly/thuc-don?sua=${blocked[0].r.productId}`,
      cta: 'Báo hết món',
      tone: 'bg-chili',
    });
  if (out.length)
    todos.push({ title: `Nhập gấp ${out.length} nguyên liệu đã hết`, detail: out.map((i) => i.name).join(', '), href: '/quan-ly/nguyen-lieu?loc=can-nhap', cta: 'Xem', tone: 'bg-chili' });
  if (!running.some((v) => v.code === content.promo.code))
    todos.push({ title: `Trang nhất đang quảng bá mã ${content.promo.code} đã ngừng`, detail: 'Khách thấy mã nhưng không dùng được', href: '/quan-ly/noi-dung', cta: 'Đổi mã', tone: 'bg-chili' });
  const nearly = running.filter((v) => v.usageLimit && v.usedCount / v.usageLimit >= 0.8);
  if (nearly.length)
    todos.push({
      title: `Mã ${nearly.map((v) => v.code).join(', ')} sắp hết lượt`,
      detail: nearly.map((v) => `${v.code}: ${v.usedCount}/${v.usageLimit} lượt`).join(' · '),
      href: `/quan-ly/ma-giam-gia?sua=${nearly[0].code}`,
      cta: 'Thêm lượt',
      tone: 'bg-amber-600',
    });
  if (low.length) todos.push({ title: `${low.length} nguyên liệu sắp hết`, detail: low.map((i) => i.name).join(', '), href: '/quan-ly/nguyen-lieu?loc=can-nhap', cta: 'Xem', tone: 'bg-amber-600' });
  if (drafts.length) todos.push({ title: `${drafts.length} phiếu nhập nháp chờ hàng về`, detail: drafts.map((r) => r.id).join(', '), href: '/quan-ly/nhap-kho', cta: 'Mở phiếu', tone: 'bg-roast' });

  return (
    <>
      <PageHead
        kicker={now ? `Hôm nay, ${formatDate(now.getTime())}` : 'Hôm nay'}
        title={`${greet}, ${user?.fullName ?? 'quản lý'}`}
        lead="Việc cần làm hôm nay, trang khách đang hiển thị gì và tình hình kho."
        actions={
          <>
            <Link href="/quan-ly/thuc-don" className={btnLine}>
              Sửa thực đơn
            </Link>
            <Link href="/quan-ly/nhap-kho?tao=1" className={btnSolid}>
              + Tạo phiếu nhập
            </Link>
          </>
        }
      />

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" aria-label="Số liệu cửa hàng">
        <Stat label="Món đang bán" value={`${selling}/${allProducts.length || '–'}`} hint={hiddenCount || soldOutCount ? `${hiddenCount} đang ẩn · ${soldOutCount} hết hàng` : 'Đủ món trên web'} />
        <Stat label="Mã đang chạy" value={running.length} hint={running.map((v) => v.code).join(', ') || 'Chưa có mã'} />
        <Stat label="Phản hồi chờ" value={openFeedback.length} tone={newFeedback.length ? 'text-gold' : ''} hint={newFeedback.length ? `${newFeedback.length} thư mới chưa đọc` : 'Đã xử lý hết'} />
        <Stat label="Cần nhập" value={out.length + low.length} tone={out.length ? 'text-chili' : low.length ? 'text-amber-700' : ''} hint={`${out.length} hết · ${low.length} sắp hết`} />
        <Stat label="Giá trị tồn kho" value={formatVnd(value)} hint={`Nhập 7 ngày: ${formatVnd(imported.reduce((n, r) => n + receiptTotal(r), 0))}`} />
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_22rem]">
        {/* Việc cần làm */}
        <section aria-labelledby="todo-title">
          <div className="flex items-end justify-between gap-3 border-b-2 border-roast pb-2">
            <h2 id="todo-title" className="text-2xl font-black">
              Việc cần làm
            </h2>
            <span className="font-mono text-xs text-roast/60">{todos.length} việc</span>
          </div>
          {todos.length === 0 ? (
            <p className="py-8 text-center text-roast/60">Không có việc gấp. Cửa hàng đang chạy êm.</p>
          ) : (
            <ol className="divide-y divide-dotted divide-roast/40">
              {todos.map((t, i) => (
                <li key={t.title} className="flex items-center gap-4 py-3">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center font-display text-lg font-black text-foam ${t.tone}`}>{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-snug">{t.title}</span>
                    <span className="block truncate text-xs text-roast/60">{t.detail}</span>
                  </span>
                  <Link href={t.href} className={`${btnLine} shrink-0`}>
                    {t.cta}
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Trang khách đang hiển thị */}
        <section aria-labelledby="live-title">
          <div className="flex items-end justify-between gap-3 border-b-2 border-roast pb-2">
            <h2 id="live-title" className="text-2xl font-black">
              Trang khách lúc này
            </h2>
            <Link href="/" className="font-label text-xs font-semibold uppercase tracking-wider underline underline-offset-4 hover:text-gold">
              Mở ↗
            </Link>
          </div>
          <Link href="/quan-ly/noi-dung" className="group mt-3 block border-2 border-roast bg-cream hover:border-gold">
            {content.notice.on && <p className="truncate bg-gold px-3 py-1 text-center font-label text-[10px] font-semibold uppercase tracking-wider text-foam">{content.notice.text}</p>}
            <div className="p-3">
              <p className="border-b-[3px] border-double border-roast pb-1 text-center font-display text-xl font-black leading-none">BrewLite</p>
              <p className="kicker mt-3 text-[10px]">{content.heroKicker}</p>
              <p className="font-display text-lg font-black leading-tight">{content.heroTitle}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroSrc(content.heroImage, 600)} alt="" className="newsprint mt-2 aspect-[16/9] w-full object-cover" />
              <div className="mt-2 flex items-center justify-between gap-2 border-2 border-dashed border-gold px-2 py-1">
                <span className="font-mono text-sm font-bold tracking-widest text-gold">{content.promo.code}</span>
                <span className="font-display text-lg font-black text-gold">{content.promo.badge}</span>
              </div>
            </div>
            <p className="border-t border-roast px-3 py-1.5 text-center font-label text-[10px] font-semibold uppercase tracking-wider group-hover:bg-gold group-hover:text-foam">
              Sửa nội dung trang →
            </p>
          </Link>
          {log.length > 0 && (
            <>
              <h3 className="kicker mt-6">Vừa thay đổi</h3>
              <ol className="mt-1 divide-y divide-dotted divide-roast/40 text-sm">
                {log.slice(0, 5).map((l) => (
                  <li key={l.id} className="flex items-baseline justify-between gap-3 py-1.5">
                    <Link href={l.href} className="truncate hover:underline">
                      {l.text}
                    </Link>
                    <span className="shrink-0 font-mono text-[11px] text-roast/55">{formatClock(l.at)}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      </div>

      <h2 className="mt-12 border-t-[3px] border-double border-roast pt-4 font-display text-3xl font-black">Kho nguyên liệu</h2>

      <div className="mt-4 grid gap-8 xl:grid-cols-[1fr_22rem]">
        {/* Cần nhập */}
        <section aria-labelledby="need-title">
          <div className="flex items-end justify-between gap-3 border-b-2 border-roast pb-2">
            <h3 id="need-title" className="text-2xl font-black">
              Cần nhập
            </h3>
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
            <h3 id="risk-title" className="border-b-2 border-roast pb-2 text-2xl font-black">
              Còn pha được
            </h3>
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

          {/* Hoạt động kho gần đây */}
          <section aria-labelledby="recent-title">
            <h3 id="recent-title" className="border-b-2 border-roast pb-2 text-2xl font-black">
              Hoạt động kho
            </h3>
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
