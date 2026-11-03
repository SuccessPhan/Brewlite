'use client';

// KIỂM KHO: đếm thực tế từng nguyên liệu, so với số trên sổ; hoàn tất thì cập nhật tồn và ghi lịch sử.
// Dòng nào chưa nhập số đếm thì giữ nguyên.
import { useMemo, useState } from 'react';
import { formatVnd } from '@/lib/format';
import { GROUPS, qtyText, useInventory, type GroupId } from '@/lib/inventory';
import Toast from '@/components/ui/Toast';
import { FieldLabel, PageHead, btnInk, btnLine, input } from './ui';

export default function Stocktake() {
  const { ingredients, applyCount } = useInventory();
  const [group, setGroup] = useState<GroupId | 'all'>('all');
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const rows = ingredients.filter((i) => group === 'all' || i.group === group);
  const parsed = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [id, v] of Object.entries(counts)) {
      const n = Number(v.replace(',', '.'));
      if (v.trim() !== '' && Number.isFinite(n) && n >= 0) out[id] = n;
    }
    return out;
  }, [counts]);

  const counted = Object.keys(parsed).length;
  const diffs = ingredients.filter((i) => parsed[i.id] !== undefined && Math.round((parsed[i.id] - i.stock) * 1000) !== 0);
  const diffValue = diffs.reduce((n, i) => n + (parsed[i.id] - i.stock) * i.cost, 0);

  function finish() {
    if (note.trim().length < 3) return;
    const n = applyCount(parsed, `Kiểm kho: ${note.trim()}`);
    setToast(n ? `Đã cập nhật tồn cho ${n} nguyên liệu.` : 'Số đếm khớp sổ, không có gì thay đổi.');
    setCounts({});
    setNote('');
    setConfirming(false);
  }

  return (
    <>
      <PageHead kicker="Sổ kho" title="Kiểm kho" lead="Đếm hàng thực tế rồi nhập vào cột Đếm được. Bấm Hoàn tất để đưa số tồn về đúng thực tế; mọi chênh lệch được ghi vào lịch sử." />

      <div className="sticky top-14 z-10 -mx-4 mt-5 grid grid-cols-3 border-y-2 border-roast bg-cream px-4 py-3 text-sm lg:top-16">
        <div>
          <p className="font-label text-[11px] uppercase tracking-wider text-roast/60">Đã đếm</p>
          <p className="font-mono text-lg font-bold">
            {counted}/{ingredients.length}
          </p>
        </div>
        <div>
          <p className="font-label text-[11px] uppercase tracking-wider text-roast/60">Lệch sổ</p>
          <p className={`font-mono text-lg font-bold ${diffs.length ? 'text-amber-700' : ''}`}>{diffs.length} món</p>
        </div>
        <div>
          <p className="font-label text-[11px] uppercase tracking-wider text-roast/60">Giá trị chênh</p>
          <p className={`font-mono text-lg font-bold ${diffValue < 0 ? 'text-chili' : diffValue > 0 ? 'text-leaf' : ''}`}>
            {diffValue > 0 ? '+' : diffValue < 0 ? '−' : ''}
            {formatVnd(Math.abs(Math.round(diffValue)))}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {[{ id: 'all' as const, name: 'Tất cả' }, ...GROUPS].map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGroup(g.id)}
            aria-pressed={group === g.id}
            className={`border-2 px-3 py-1.5 font-label text-xs font-semibold uppercase tracking-wider ${group === g.id ? 'border-roast bg-roast text-cream' : 'border-roast/30 hover:border-roast'}`}
          >
            {g.name}
          </button>
        ))}
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[38rem] text-sm">
          <thead>
            <tr className="border-b border-roast text-left font-label text-[11px] uppercase tracking-wider text-roast/60">
              <th className="py-2.5 pr-3 font-semibold">Nguyên liệu</th>
              <th className="px-3 py-2.5 text-right font-semibold">Trên sổ</th>
              <th className="w-40 px-3 py-2.5 font-semibold">Đếm được</th>
              <th className="py-2.5 pl-3 text-right font-semibold">Chênh lệch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dotted divide-roast/40">
            {rows.map((i) => {
              const c = parsed[i.id];
              const d = c === undefined ? null : Math.round((c - i.stock) * 1000) / 1000;
              return (
                <tr key={i.id} className={d ? 'bg-gold/5' : ''}>
                  <td className="py-2.5 pr-3 font-semibold">{i.name}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{qtyText(i.stock, i.unit)}</td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-1.5">
                      <input
                        inputMode="decimal"
                        value={counts[i.id] ?? ''}
                        onChange={(e) => setCounts((x) => ({ ...x, [i.id]: e.target.value }))}
                        placeholder="—"
                        className={`${input} h-9 px-2 text-right font-mono`}
                        aria-label={`Số đếm ${i.name}`}
                      />
                      <span className="w-8 text-xs text-roast/60">{i.unit}</span>
                    </span>
                  </td>
                  <td className="py-2.5 pl-3 text-right font-mono">
                    {d === null ? (
                      <span className="text-roast/35">chưa đếm</span>
                    ) : d === 0 ? (
                      <span className="text-leaf">khớp</span>
                    ) : (
                      <span className={d < 0 ? 'text-chili' : 'text-leaf'}>
                        {d > 0 ? '+' : '−'}
                        {qtyText(Math.abs(d), i.unit)}
                        <span className="block text-[11px] text-roast/55">{formatVnd(Math.abs(Math.round(d * i.cost)))}</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 border-2 border-roast p-4">
        {!confirming ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-roast/70">{counted ? `Đã nhập ${counted} số đếm, ${diffs.length} món lệch sổ.` : 'Chưa nhập số đếm nào.'}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCounts({})} disabled={!counted} className={btnLine}>
                Xoá số đếm
              </button>
              <button type="button" onClick={() => setConfirming(true)} disabled={!counted} className={btnInk}>
                Hoàn tất kiểm kho
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="font-display text-lg font-bold">
              Cập nhật tồn cho {diffs.length} nguyên liệu lệch sổ{diffValue !== 0 && `, giá trị chênh ${diffValue < 0 ? '−' : '+'}${formatVnd(Math.abs(Math.round(diffValue)))}`}?
            </p>
            <FieldLabel label="Ghi chú lần kiểm" hint="Bắt buộc, ví dụ: kiểm cuối tuần, ca tối">
              <input value={note} onChange={(e) => setNote(e.target.value)} className={input} autoFocus />
            </FieldLabel>
            <div className="flex gap-2">
              <button type="button" onClick={finish} disabled={note.trim().length < 3} className={btnInk}>
                Xác nhận cập nhật
              </button>
              <button type="button" onClick={() => setConfirming(false)} className={btnLine}>
                Quay lại
              </button>
            </div>
          </div>
        )}
      </div>
      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}
