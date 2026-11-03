'use client';

// SỬA CÔNG THỨC một món: thêm, bớt nguyên liệu, đổi định lượng; giá vốn mỗi ly và lãi gộp tính lại ngay.
// Dùng chung ở khung sửa món (Thực đơn) và trang Công thức.
import { useMemo, useState } from 'react';
import { formatVnd } from '@/lib/format';
import { GROUPS, recipeCost, useInventory, type Recipe } from '@/lib/inventory';
import { TrashIcon } from '@/components/ui/Icons';
import { btnLine, btnSolid, num, th, toolSelect } from './ui';

interface Row {
  key: number;
  ingredientId: string;
  amount: string;
}
let k = 0;
const cell = 'h-9 w-full border border-roast/25 bg-cream px-2.5 text-sm focus:border-roast focus:outline-none';

export default function RecipeEditor({ productId, price, isFood, onSaved, onCancel }: { productId: string; price: number; isFood: boolean; onSaved: (msg: string) => void; onCancel?: () => void }) {
  const { ingredients, recipes, saveRecipe } = useInventory();
  const map = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);
  const current = recipes.find((r) => r.productId === productId);
  const toRows = (r?: Recipe): Row[] => (r?.lines.length ? r.lines.map((l) => ({ key: ++k, ingredientId: l.ingredientId, amount: String(l.amount) })) : [{ key: ++k, ingredientId: '', amount: '' }]);
  const [rows, setRows] = useState<Row[]>(() => toRows(current));
  const [error, setError] = useState<string | null>(null);

  const lines = rows.filter((r) => r.ingredientId && Number(r.amount.replace(',', '.')) > 0).map((r) => ({ ingredientId: r.ingredientId, amount: Number(r.amount.replace(',', '.')) }));
  const draft: Recipe = { productId, size: isFood ? '1 cái' : 'M', lines };
  const cost = recipeCost(draft, map);
  const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
  const dirty = JSON.stringify(lines) !== JSON.stringify(current?.lines ?? []);
  const update = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  function save() {
    if (!lines.length) return setError('Công thức cần ít nhất một nguyên liệu có định lượng.');
    saveRecipe(draft);
    setError(null);
    onSaved(`Đã lưu công thức, giá vốn mới ${formatVnd(cost)}/${isFood ? 'cái' : 'ly'}`);
  }

  return (
    <div>
      <p className="text-sm text-roast/65">{isFood ? 'Định lượng cho 1 cái bánh.' : 'Định lượng cho 1 ly size M. Size S, L quầy tự giảm hoặc tăng theo tỉ lệ.'}</p>
      <div className="relative mt-3 overflow-x-auto border border-roast/20">
        <table className="w-full min-w-[30rem] text-sm">
          <thead>
            <tr>
              <th className={th}>Nguyên liệu</th>
              <th className={`${th} w-36`}>Định lượng</th>
              <th className={`${th} w-28 text-right`}>Giá vốn</th>
              <th className={`${th} w-10`}>
                <span className="sr-only">Xoá</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const ing = map.get(r.ingredientId);
              const amount = Number(r.amount.replace(',', '.')) || 0;
              return (
                <tr key={r.key} className="border-t border-roast/10">
                  <td className="px-3 py-2">
                    <select value={r.ingredientId} onChange={(e) => update(r.key, { ingredientId: e.target.value })} className={`${toolSelect} w-full`} aria-label="Nguyên liệu">
                      <option value="">Chọn nguyên liệu…</option>
                      {GROUPS.map((g) => (
                        <optgroup key={g.id} label={g.name}>
                          {ingredients
                            .filter((i) => i.group === g.id)
                            .map((i) => (
                              <option key={i.id} value={i.id} disabled={i.id !== r.ingredientId && rows.some((x) => x.ingredientId === i.id)}>
                                {i.name}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <span className="relative block">
                      <input
                        inputMode="decimal"
                        value={r.amount}
                        onChange={(e) => update(r.key, { amount: e.target.value })}
                        placeholder="0"
                        className={`${cell} pr-10 text-right ${num}`}
                        aria-label="Định lượng"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-roast/50">{ing?.sub ?? ''}</span>
                    </span>
                  </td>
                  <td className={`px-3 py-2 text-right text-roast/70 ${num}`}>{ing && amount ? formatVnd((amount / ing.per) * ing.cost) : '—'}</td>
                  <td className="px-1 py-2">
                    <button
                      type="button"
                      onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : [{ key: ++k, ingredientId: '', amount: '' }]))}
                      aria-label="Xoá nguyên liệu"
                      className="grid h-9 w-9 place-items-center text-roast/45 hover:text-chili"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="border-t border-roast/10 px-3 py-1.5">
          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, { key: ++k, ingredientId: '', amount: '' }])}
            className="h-8 text-xs font-semibold tracking-wider text-roast/70 hover:text-roast"
          >
            + Thêm nguyên liệu
          </button>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-3 border border-roast/20">
        {[
          { k: `Giá vốn/${isFood ? 'cái' : 'ly'}`, v: formatVnd(cost) },
          { k: 'Giá bán', v: formatVnd(price) },
          { k: 'Lãi gộp', v: `${margin}%`, tone: margin < 60 ? 'text-amber-700' : 'text-leaf' },
        ].map((f, i) => (
          <div key={f.k} className={`px-3 py-2.5 ${i ? 'border-l border-roast/20' : ''}`}>
            <dt className="font-label text-[11px] uppercase tracking-wider text-roast/55">{f.k}</dt>
            <dd className={`mt-0.5 font-semibold ${num} ${f.tone ?? ''}`}>{f.v}</dd>
          </div>
        ))}
      </dl>

      {error && <p className="mt-2 text-sm text-chili">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={save} disabled={!dirty} className={btnSolid}>
          Lưu công thức
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={btnLine}>
            Huỷ
          </button>
        )}
        {!current && <span className="self-center text-xs text-roast/55">Món này chưa có công thức.</span>}
      </div>
    </div>
  );
}
