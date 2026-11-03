'use client';

// KIỂM KHO: đếm thực tế từng nguyên liệu, so với số trên sổ; hoàn tất thì cập nhật tồn và ghi lịch sử.
// Dòng nào chưa nhập số đếm thì giữ nguyên.
import { useMemo, useState } from 'react';
import { formatVnd } from '@/lib/format';
import { GROUPS, qtyText, useInventory, type GroupId } from '@/lib/inventory';
import { matchText } from '@/lib/search';
import Toast from '@/components/ui/Toast';
import { SearchIcon } from '@/components/ui/Icons';
import { FilterTile, PageHead, Panel, btnInk, btnLine, num, searchInput, td, th, toolSelect } from './ui';

const cell = 'h-9 w-full border border-roast/25 bg-cream px-2.5 text-sm focus:border-roast focus:outline-none';

export default function Stocktake() {
  const { ingredients, applyCount } = useInventory();
  const [group, setGroup] = useState<GroupId | 'all'>('all');
  const [q, setQ] = useState('');
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const parsed = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [id, v] of Object.entries(counts)) {
      const n = Number(v.replace(',', '.'));
      if (v.trim() !== '' && Number.isFinite(n) && n >= 0) out[id] = n;
    }
    return out;
  }, [counts]);
  const diffOf = (id: string, stock: number) => (parsed[id] === undefined ? null : Math.round((parsed[id] - stock) * 1000) / 1000);

  const counted = Object.keys(parsed).length;
  const diffs = ingredients.filter((i) => diffOf(i.id, i.stock));
  const diffValue = diffs.reduce((n, i) => n + (parsed[i.id] - i.stock) * i.cost, 0);
  const rows = ingredients
    .filter((i) => group === 'all' || i.group === group)
    .filter((i) => !q.trim() || matchText(i.name, q.trim()))
    .filter((i) => !onlyDiff || diffOf(i.id, i.stock));

  function finish() {
    const n = applyCount(parsed, note.trim() ? `Kiểm kho: ${note.trim()}` : 'Kiểm kho');
    setToast(n ? `Đã cập nhật tồn cho ${n} nguyên liệu.` : 'Số đếm khớp sổ, không có gì thay đổi.');
    setCounts({});
    setNote('');
    setOnlyDiff(false);
  }

  return (
    <>
      <PageHead title="Kiểm kho" lead="Nhập số đếm thực tế, món nào chưa đếm thì giữ nguyên số trên sổ." />

      <div className="mt-5 grid grid-cols-3 gap-3">
        <FilterTile label="Đã đếm" value={`${counted}/${ingredients.length}`} />
        <FilterTile label="Lệch sổ" value={diffs.length} tone={diffs.length ? 'text-amber-700' : ''} active={onlyDiff} onClick={() => setOnlyDiff((v) => !v)} />
        <FilterTile
          label="Giá trị chênh"
          value={`${diffValue > 0 ? '+' : diffValue < 0 ? '−' : ''}${formatVnd(Math.abs(diffValue))}`}
          tone={diffValue < 0 ? 'text-chili' : diffValue > 0 ? 'text-leaf' : ''}
        />
      </div>

      <Panel
        className="mt-4"
        toolbar={
          <>
            <label className="relative min-w-[12rem] flex-1">
              <span className="sr-only">Tìm nguyên liệu</span>
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-roast/45" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm nguyên liệu" className={searchInput} />
            </label>
            <select value={group} onChange={(e) => setGroup(e.target.value as GroupId | 'all')} className={toolSelect} aria-label="Nhóm">
              <option value="all">Tất cả nhóm</option>
              {GROUPS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </>
        }
        footer={
          <div className="flex flex-wrap items-center gap-3">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú lần kiểm, ví dụ: ca tối thứ bảy" className={`${cell} max-w-sm flex-1`} />
            <span className="ml-auto text-sm text-roast/60">{counted ? `${counted} món đã đếm, ${diffs.length} món lệch` : 'Chưa đếm món nào'}</span>
            <button type="button" onClick={() => setCounts({})} disabled={!counted} className={btnLine}>
              Xoá số đếm
            </button>
            <button type="button" onClick={finish} disabled={!counted} className={btnInk}>
              Hoàn tất kiểm kho
            </button>
          </div>
        }
      >
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-roast/60">Không có nguyên liệu nào ở mục này.</p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[38rem] text-sm">
              <thead>
                <tr>
                  <th className={th}>Nguyên liệu</th>
                  <th className={`${th} w-36 text-right`}>Trên sổ</th>
                  <th className={`${th} w-44`}>Đếm thực tế</th>
                  <th className={`${th} w-40 text-right`}>Chênh lệch</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => {
                  const d = diffOf(i.id, i.stock);
                  return (
                    <tr key={i.id} className={`border-t border-roast/10 ${d ? 'bg-amber-600/[0.06]' : ''}`}>
                      <td className={td}>
                        <span className="block font-semibold">{i.name}</span>
                        <span className="block text-xs text-roast/55">{GROUPS.find((g) => g.id === i.group)?.name}</span>
                      </td>
                      <td className={`${td} text-right text-roast/75 ${num}`}>{qtyText(i.stock, i.unit)}</td>
                      <td className="px-4 py-2">
                        <span className="relative block">
                          <input
                            inputMode="decimal"
                            value={counts[i.id] ?? ''}
                            onChange={(e) => setCounts((x) => ({ ...x, [i.id]: e.target.value }))}
                            placeholder="Chưa đếm"
                            className={`${cell} pr-12 text-right ${num}`}
                            aria-label={`Số đếm ${i.name}`}
                          />
                          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-roast/50">{i.unit}</span>
                        </span>
                      </td>
                      <td className={`${td} text-right ${num}`}>
                        {d === null ? (
                          <span className="text-roast/35">—</span>
                        ) : d === 0 ? (
                          <span className="font-semibold text-leaf">Khớp</span>
                        ) : (
                          <span className={`font-semibold ${d < 0 ? 'text-chili' : 'text-leaf'}`}>
                            {d > 0 ? '+' : '−'}
                            {qtyText(Math.abs(d), i.unit)}
                            <span className="block text-xs font-normal text-roast/55">{formatVnd(Math.abs(d * i.cost))}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}
