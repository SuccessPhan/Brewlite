'use client';

// CÔNG THỨC: bảng gọn mỗi món một dòng (giá bán, giá vốn mỗi ly, lãi gộp, còn pha được);
// bấm một dòng mở khung định lượng chi tiết, sửa được công thức; món chưa có công thức thì thêm mới.
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { formatVnd } from '@/lib/format';
import { cupsLeft, recipeCost, stateOf, useInventory, type Recipe } from '@/lib/inventory';
import { useAllProducts, useProductMap } from '@/lib/products';
import Toast from '@/components/ui/Toast';
import RecipeEditor from './RecipeEditor';
import { FilterTile, PageHead, Panel, SidePanel, StockBadge, btnLine, btnSolid, num, td, th, toolSelect, tr } from './ui';

type Sort = 'cups' | 'margin' | 'name';

export default function Recipes() {
  const { ingredients, recipes } = useInventory();
  const products = useProductMap();
  const map = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);
  const [sort, setSort] = useState<Sort>('cups');
  const [openId, setOpenId] = useState<string | null>(null);
  const [newFor, setNewFor] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { data: allProducts = [] } = useAllProducts();
  const missing = allProducts.filter((p) => !recipes.some((r) => r.productId === p.id));
  const newProduct = allProducts.find((p) => p.id === newFor) ?? null;

  const rows = useMemo(
    () =>
      recipes
        .map((r) => {
          const price = products.get(r.productId)?.price ?? 0;
          const cost = recipeCost(r, map);
          return { r, name: products.get(r.productId)?.name ?? r.productId, price, cost, margin: price > 0 ? Math.round(((price - cost) / price) * 100) : 0, ...cupsLeft(r, map) };
        })
        .sort((a, b) => (sort === 'cups' ? a.cups - b.cups : sort === 'margin' ? a.margin - b.margin : a.name.localeCompare(b.name, 'vi'))),
    [recipes, products, map, sort],
  );

  const avgCost = rows.length ? rows.reduce((n, x) => n + x.cost, 0) / rows.length : 0;
  const avgMargin = rows.length ? Math.round(rows.reduce((n, x) => n + x.margin, 0) / rows.length) : 0;
  const blocked = rows.filter((x) => x.cups === 0).length;
  const opened = rows.find((x) => x.r.productId === openId) ?? null;

  return (
    <>
      <PageHead
        title="Công thức"
        lead="Định lượng cho ly size M, bánh tính theo cái. Giá vốn theo giá vốn bình quân hiện tại."
        actions={
          missing.length > 0 && (
            <select
              value=""
              onChange={(e) => e.target.value && setNewFor(e.target.value)}
              className={`${toolSelect} h-10 font-label text-xs font-semibold uppercase tracking-wider`}
              aria-label="Thêm công thức cho món"
            >
              <option value="">+ Thêm công thức ({missing.length} món chưa có)</option>
              {missing.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )
        }
      />

      <div className="mt-5 grid grid-cols-3 gap-3">
        <FilterTile label="Giá vốn trung bình" value={formatVnd(avgCost)} />
        <FilterTile label="Lãi gộp trung bình" value={`${avgMargin}%`} />
        <FilterTile label="Không pha được" value={blocked} tone={blocked ? 'text-chili' : ''} />
      </div>

      <Panel
        className="mt-4"
        toolbar={
          <>
            <span className="mr-auto text-sm text-roast/60">{rows.length} món có công thức</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={toolSelect} aria-label="Sắp xếp">
              <option value="cups">Sắp hết nguyên liệu trước</option>
              <option value="margin">Lãi gộp thấp trước</option>
              <option value="name">Theo tên</option>
            </select>
          </>
        }
      >
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr>
                <th className={th}>Món</th>
                <th className={`${th} text-right`}>Giá bán</th>
                <th className={`${th} text-right`}>Giá vốn/ly</th>
                <th className={`${th} w-44`}>Lãi gộp</th>
                <th className={th}>Còn pha được</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x) => (
                <tr key={x.r.productId} onClick={() => setOpenId(x.r.productId)} className={`${tr} cursor-pointer`}>
                  <td className={td}>
                    <span className="block font-semibold">{x.name}</span>
                    <span className="block text-xs text-roast/55">
                      {x.r.lines.length} nguyên liệu · {x.r.size === 'M' ? 'size M' : x.r.size}
                    </span>
                  </td>
                  <td className={`${td} text-right ${num}`}>{formatVnd(x.price)}</td>
                  <td className={`${td} text-right ${num}`}>{formatVnd(x.cost)}</td>
                  <td className={td}>
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-20 bg-roast/10" aria-hidden="true">
                        <span className={`block h-full ${x.margin < 60 ? 'bg-amber-600' : 'bg-leaf'}`} style={{ width: `${Math.max(0, x.margin)}%` }} />
                      </span>
                      <span className={`font-semibold ${num} ${x.margin < 60 ? 'text-amber-700' : ''}`}>{x.margin}%</span>
                    </span>
                  </td>
                  <td className={td}>
                    {x.cups === 0 ? (
                      <span className="bg-chili/10 px-2 py-0.5 text-xs font-semibold text-chili">Hết · thiếu {x.limitBy?.name}</span>
                    ) : (
                      <>
                        <span className={`font-semibold ${num} ${x.cups < 30 ? 'text-amber-700' : ''}`}>~{x.cups.toLocaleString('vi-VN')} ly</span>
                        <span className="block text-xs text-roast/55">Hết trước: {x.limitBy?.name}</span>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {opened && <RecipePanel recipe={opened.r} name={opened.name} price={opened.price} cost={opened.cost} margin={opened.margin} onClose={() => setOpenId(null)} onSaved={setToast} />}
      {newProduct && (
        <SidePanel open wide title={`Công thức: ${newProduct.name}`} onClose={() => setNewFor(null)}>
          <RecipeEditor
            productId={newProduct.id}
            price={newProduct.price}
            isFood={newProduct.kind === 'food'}
            onCancel={() => setNewFor(null)}
            onSaved={(m) => {
              setToast(m);
              setNewFor(null);
            }}
          />
        </SidePanel>
      )}
      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}

function RecipePanel({
  recipe,
  name,
  price,
  cost,
  margin,
  onClose,
  onSaved,
}: {
  recipe: Recipe;
  name: string;
  price: number;
  cost: number;
  margin: number;
  onClose: () => void;
  onSaved: (m: string) => void;
}) {
  const { ingredients } = useInventory();
  const products = useProductMap();
  const [editing, setEditing] = useState(false);
  const map = new Map(ingredients.map((i) => [i.id, i]));
  const facts = [
    { k: 'Giá bán', v: formatVnd(price) },
    { k: 'Giá vốn/ly', v: formatVnd(cost) },
    { k: 'Lãi mỗi ly', v: formatVnd(price - cost) },
    { k: 'Lãi gộp', v: `${margin}%` },
  ];
  return (
    <SidePanel
      open
      wide={editing}
      title={editing ? `Sửa công thức: ${name}` : name}
      onClose={onClose}
      footer={
        !editing && (
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditing(true)} className={btnSolid}>
              Sửa công thức
            </button>
            <Link href={`/quan-ly/thuc-don?sua=${recipe.productId}`} className={btnLine}>
              Sửa món
            </Link>
          </div>
        )
      }
    >
      {editing ? (
        <RecipeEditor
          productId={recipe.productId}
          price={price}
          isFood={products.get(recipe.productId)?.kind === 'food'}
          onCancel={() => setEditing(false)}
          onSaved={(m) => {
            onSaved(m);
            setEditing(false);
          }}
        />
      ) : (
        <>
          <dl className="grid grid-cols-2 border border-roast/20">
            {facts.map((f, k) => (
              <div key={f.k} className={`px-3 py-2.5 ${k % 2 ? 'border-l border-roast/20' : ''} ${k > 1 ? 'border-t border-roast/20' : ''}`}>
                <dt className="font-label text-[11px] uppercase tracking-wider text-roast/55">{f.k}</dt>
                <dd className={`mt-0.5 font-semibold ${num}`}>{f.v}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-6 font-label text-xs font-semibold uppercase tracking-wider text-roast/60">Định lượng {recipe.size === 'M' ? 'cho 1 ly size M' : `cho ${recipe.size}`}</h3>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr>
                <th className={th}>Nguyên liệu</th>
                <th className={`${th} text-right`}>Lượng</th>
                <th className={`${th} text-right`}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {recipe.lines.map((l) => {
                const ing = map.get(l.ingredientId);
                if (!ing) return null;
                const st = stateOf(ing);
                return (
                  <tr key={l.ingredientId} className="border-t border-roast/10">
                    <td className="px-4 py-2.5">
                      <Link href={`/quan-ly/nguyen-lieu?xem=${ing.id}`} className="hover:underline">
                        {ing.name}
                      </Link>
                      {st !== 'ok' && (
                        <span className="ml-2 align-middle">
                          <StockBadge state={st} />
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-2.5 text-right ${num}`}>
                      {l.amount.toLocaleString('vi-VN')} {ing.sub}
                    </td>
                    <td className={`px-4 py-2.5 text-right text-roast/70 ${num}`}>{formatVnd((l.amount / ing.per) * ing.cost)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 flex justify-between border-t border-roast px-4 pt-3 font-semibold">
            Tổng giá vốn <span className={num}>{formatVnd(cost)}</span>
          </p>
        </>
      )}
    </SidePanel>
  );
}
