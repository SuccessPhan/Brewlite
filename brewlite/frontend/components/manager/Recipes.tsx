'use client';

// CÔNG THỨC (định lượng): mỗi món dùng bao nhiêu nguyên liệu, giá vốn mỗi ly so với giá bán, còn pha được bao nhiêu ly
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { formatVnd } from '@/lib/format';
import { cupsLeft, recipeCost, stateOf, useInventory } from '@/lib/inventory';
import { useProductMap } from '@/lib/products';
import { PageHead } from './ui';

type Sort = 'cups' | 'margin' | 'name';

export default function Recipes() {
  const { ingredients, recipes } = useInventory();
  const products = useProductMap();
  const map = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);
  const [sort, setSort] = useState<Sort>('cups');

  const rows = useMemo(
    () =>
      recipes
        .map((r) => {
          const product = products.get(r.productId);
          const cost = recipeCost(r, map);
          const price = product?.price ?? 0;
          const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
          return { r, name: product?.name ?? r.productId, price, cost, margin, ...cupsLeft(r, map) };
        })
        .sort((a, b) => (sort === 'cups' ? a.cups - b.cups : sort === 'margin' ? a.margin - b.margin : a.name.localeCompare(b.name, 'vi'))),
    [recipes, products, map, sort],
  );

  return (
    <>
      <PageHead
        kicker="Sổ kho"
        title="Công thức định lượng"
        lead="Định lượng cho ly size M (bánh tính theo cái). Giá vốn tính theo giá vốn bình quân hiện tại của từng nguyên liệu."
        actions={
          <label className="flex items-center gap-2 text-sm">
            <span className="text-roast/60">Sắp xếp</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-10 border-2 border-roast/30 bg-cream px-3 font-semibold focus:border-roast focus:outline-none">
              <option value="cups">Sắp hết nguyên liệu trước</option>
              <option value="margin">Lãi gộp thấp trước</option>
              <option value="name">Theo tên</option>
            </select>
          </label>
        }
      />

      <ul className="mt-6 grid gap-5 md:grid-cols-2">
        {rows.map(({ r, name, price, cost, margin, cups, limitBy }) => (
          <li key={r.productId} className="flex flex-col border-2 border-roast">
            <div className="flex items-start justify-between gap-3 border-b border-roast px-4 py-3">
              <div>
                <p className="font-display text-xl font-black leading-tight">{name}</p>
                <p className="text-xs text-roast/60">
                  Size {r.size} · giá bán {formatVnd(price)}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-display text-2xl font-black leading-none ${margin < 60 ? 'text-amber-700' : 'text-leaf'}`}>{margin}%</p>
                <p className="font-label text-[10px] uppercase tracking-wider text-roast/55">lãi gộp</p>
              </div>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-dotted divide-roast/40">
                {r.lines.map((l) => {
                  const ing = map.get(l.ingredientId);
                  if (!ing) return null;
                  const st = stateOf(ing);
                  return (
                    <tr key={l.ingredientId}>
                      <td className="px-4 py-1.5">
                        <Link href={`/quan-ly/nguyen-lieu?xem=${ing.id}`} className="hover:underline">
                          {ing.name}
                        </Link>
                        {st !== 'ok' && <span className={`ml-2 font-label text-[10px] font-semibold uppercase tracking-wider ${st === 'out' ? 'text-chili' : 'text-amber-700'}`}>{st === 'out' ? 'hết' : 'sắp hết'}</span>}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-xs">
                        {l.amount.toLocaleString('vi-VN')} {ing.sub}
                      </td>
                      <td className="px-4 py-1.5 text-right font-mono text-xs text-roast/65">{formatVnd(Math.round((l.amount / ing.per) * ing.cost))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-auto grid grid-cols-2 border-t-2 border-roast text-sm">
              <div className="px-4 py-2.5">
                <p className="font-label text-[10px] uppercase tracking-wider text-roast/55">Giá vốn mỗi ly</p>
                <p className="font-mono font-bold">{formatVnd(cost)}</p>
              </div>
              <div className="border-l border-roast px-4 py-2.5">
                <p className="font-label text-[10px] uppercase tracking-wider text-roast/55">Còn pha được</p>
                <p className={`font-bold ${cups === 0 ? 'text-chili' : `font-mono ${cups < 30 ? 'text-amber-700' : ''}`}`}>{cups === 0 ? 'Hết, không pha được' : `~${cups.toLocaleString('vi-VN')} ly`}</p>
                {limitBy && <p className="truncate text-[11px] text-roast/55">Hết trước: {limitBy.name}</p>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
