'use client';

// TỔNG QUAN: chỉ những việc cần làm ngay (gom từ phản hồi, thực đơn, kho, mã giảm giá), việc gấp lên trước,
// kèm một hàng số liệu ngắn bấm vào là tới đúng mục.
import Link from 'next/link';
import { useMemo } from 'react';
import { useFeedbackList } from '@/lib/feedback-admin';
import { cupsLeft, stateOf, useInventory } from '@/lib/inventory';
import { useAllProducts } from '@/lib/products';
import { useStorefront, voucherState } from '@/lib/storefront';
import { btnLine } from './ui';

type Level = 'urgent' | 'soon' | 'later';
interface Todo {
  level: Level;
  title: string;
  detail: string;
  href: string;
  cta: string;
}
const TONE: Record<Level, string> = { urgent: 'bg-chili', soon: 'bg-amber-600', later: 'bg-roast' };
const LEVEL_LABEL: Record<Level, string> = { urgent: 'Gấp', soon: 'Trong ngày', later: 'Khi rảnh' };

export default function Overview() {
  const { ingredients, receipts, recipes } = useInventory();
  const { data: products = [] } = useAllProducts();
  const { vouchers, content, feedback: fbState } = useStorefront();
  const { data: feedback = [] } = useFeedbackList();
  const map = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);

  const out = ingredients.filter((i) => stateOf(i) === 'out');
  const low = ingredients.filter((i) => stateOf(i) === 'low');
  const running = vouchers.filter((v) => voucherState(v) === 'running');
  const newFeedback = feedback.filter((f) => (fbState[f.id]?.status ?? 'new') === 'new');
  const openFeedback = feedback.filter((f) => (fbState[f.id]?.status ?? 'new') !== 'done');
  const selling = products.filter((p) => !p.hidden && p.stock > 0).length;
  const drafts = receipts.filter((r) => r.status === 'draft');

  const todos: Todo[] = [];
  // Món khách vẫn đặt được nhưng quầy không pha được
  const blocked = recipes.filter((r) => {
    const p = products.find((x) => x.id === r.productId);
    return p && !p.hidden && p.stock > 0 && cupsLeft(r, map).cups === 0;
  });
  if (blocked.length) {
    const names = blocked.map((r) => products.find((p) => p.id === r.productId)?.name).join(', ');
    todos.push({ level: 'urgent', title: `Báo hết món: ${names}`, detail: 'Khách vẫn đặt được nhưng quầy đã hết nguyên liệu để pha', href: `/quan-ly/thuc-don?sua=${blocked[0].productId}`, cta: 'Báo hết' });
  }
  if (out.length) todos.push({ level: 'urgent', title: `Nhập gấp: ${out.map((i) => i.name).join(', ')}`, detail: 'Đã hết trong kho', href: '/quan-ly/nguyen-lieu?loc=can-nhap', cta: 'Tạo phiếu' });
  if (!running.some((v) => v.code === content.promo.code))
    todos.push({ level: 'urgent', title: `Trang nhất quảng bá mã ${content.promo.code} đã ngừng`, detail: 'Khách thấy mã nhưng không dùng được', href: '/quan-ly/noi-dung', cta: 'Đổi mã' });
  if (newFeedback.length)
    todos.push({ level: 'soon', title: `Trả lời ${newFeedback.length} thư góp ý mới`, detail: newFeedback.slice(0, 3).map((f) => f.name).join(', '), href: '/quan-ly/phan-hoi', cta: 'Đọc thư' });
  const nearly = running.filter((v) => v.usageLimit && v.usedCount / v.usageLimit >= 0.8);
  if (nearly.length)
    todos.push({ level: 'soon', title: `Mã ${nearly.map((v) => v.code).join(', ')} sắp hết lượt`, detail: nearly.map((v) => `${v.usedCount}/${v.usageLimit} lượt`).join(' · '), href: `/quan-ly/ma-giam-gia?sua=${nearly[0].code}`, cta: 'Thêm lượt' });
  if (low.length) todos.push({ level: 'soon', title: `${low.length} nguyên liệu sắp hết`, detail: low.map((i) => i.name).join(', '), href: '/quan-ly/nguyen-lieu?loc=can-nhap', cta: 'Xem' });
  if (drafts.length) todos.push({ level: 'later', title: `${drafts.length} phiếu nhập nháp chờ hàng về`, detail: drafts.map((r) => r.id).join(', '), href: '/quan-ly/nhap-kho', cta: 'Mở phiếu' });

  const stats = [
    { label: 'Món đang bán', value: `${selling}/${products.length || '–'}`, href: '/quan-ly/thuc-don' },
    { label: 'Mã đang chạy', value: running.length, href: '/quan-ly/ma-giam-gia' },
    { label: 'Thư chờ xử lý', value: openFeedback.length, href: '/quan-ly/phan-hoi' },
    { label: 'Nguyên liệu cần nhập', value: out.length + low.length, href: '/quan-ly/nguyen-lieu?loc=can-nhap' },
  ];

  return (
    <>
      <div className="flex items-baseline justify-between gap-4 border-b-2 border-roast pb-3">
        <h1 className="text-3xl font-black sm:text-4xl">Việc cần làm</h1>
        <span className="font-mono text-sm text-roast/60">{todos.length ? `${todos.length} việc` : 'Xong hết'}</span>
      </div>

      {todos.length === 0 ? (
        <p className="py-12 text-center text-lg text-roast/60">Không có việc gấp. Cửa hàng đang chạy êm.</p>
      ) : (
        <ol className="divide-y divide-dotted divide-roast/40">
          {todos.map((t) => (
            <li key={t.title} className="flex items-center gap-4 py-3.5">
              <span className={`w-20 shrink-0 py-1 text-center font-label text-[10px] font-semibold uppercase tracking-wider text-foam ${TONE[t.level]}`}>{LEVEL_LABEL[t.level]}</span>
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

      <ul className="mt-8 grid grid-cols-2 border-2 border-roast sm:grid-cols-4">
        {stats.map((s, i) => (
          <li key={s.label} className={`${i % 2 ? 'border-l' : ''} ${i > 1 ? 'border-t sm:border-t-0' : ''} ${i === 2 ? 'sm:border-l' : ''} border-roast`}>
            <Link href={s.href} className="block px-4 py-3 hover:bg-roast/5">
              <span className="block font-display text-2xl font-black tabular-nums">{s.value}</span>
              <span className="block font-label text-[11px] uppercase tracking-wider text-roast/60">{s.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
