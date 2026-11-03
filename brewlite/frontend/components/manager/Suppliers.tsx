'use client';

// NHÀ CUNG CẤP: liên hệ, mặt hàng cung cấp, lần nhập gần nhất, tiền nhập trong tháng
import Link from 'next/link';
import { formatDateTime, formatVnd } from '@/lib/format';
import { receiptTotal, stateOf, useInventory } from '@/lib/inventory';
import { PageHead, btnLine, btnSolid } from './ui';

export default function Suppliers() {
  const { suppliers, ingredients, receipts } = useInventory();
  const month = new Date().getMonth();

  return (
    <>
      <PageHead kicker="Sổ kho" title="Nhà cung cấp" lead="Mỗi nguyên liệu gắn với một nhà cung cấp chính để tạo phiếu nhập nhanh." />
      <ul className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {suppliers.map((s) => {
          const items = ingredients.filter((i) => i.supplierId === s.id);
          const need = items.filter((i) => stateOf(i) !== 'ok');
          const done = receipts.filter((r) => r.supplierId === s.id && r.status === 'done').sort((a, b) => b.at.localeCompare(a.at));
          const spent = done.filter((r) => new Date(r.at).getMonth() === month).reduce((n, r) => n + receiptTotal(r), 0);
          return (
            <li key={s.id} className="flex flex-col border-2 border-roast p-4">
              <p className="font-display text-xl font-black leading-tight">{s.name}</p>
              <a href={`tel:${s.phone.replace(/\s/g, '')}`} className="mt-1 font-mono text-sm underline underline-offset-4 hover:text-gold">
                {s.phone}
              </a>
              {s.note && <p className="mt-1 text-sm italic text-roast/65">{s.note}</p>}

              <p className="kicker mt-4">Cung cấp {items.length} mặt hàng</p>
              <p className="mt-1 text-sm text-roast/80">
                {items.map((i, k) => (
                  <span key={i.id}>
                    {k > 0 && ', '}
                    <span className={stateOf(i) === 'out' ? 'font-semibold text-chili' : stateOf(i) === 'low' ? 'font-semibold text-amber-700' : ''}>{i.name}</span>
                  </span>
                ))}
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-dotted border-roast/50 pt-3 text-sm">
                <div>
                  <dt className="font-label text-[10px] uppercase tracking-wider text-roast/55">Lần nhập gần nhất</dt>
                  <dd>{done[0] ? formatDateTime(done[0].at) : 'Chưa có'}</dd>
                </div>
                <div>
                  <dt className="font-label text-[10px] uppercase tracking-wider text-roast/55">Nhập tháng này</dt>
                  <dd className="font-mono">{formatVnd(spent)}</dd>
                </div>
              </dl>

              <div className="mt-auto pt-4">
                <Link href={`/quan-ly/nhap-kho?tao=1&ncc=${s.id}`} className={`${need.length ? btnSolid : btnLine} w-full`}>
                  {need.length ? `Tạo phiếu nhập · ${need.length} món cần nhập` : 'Tạo phiếu nhập'}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
