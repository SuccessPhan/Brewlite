'use client';

// DANH SÁCH NGUYÊN LIỆU: tìm, lọc theo nhóm và trạng thái; bấm một dòng mở khung chi tiết (lịch sử, món dùng, điều chỉnh tồn)
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { formatDateTime, formatVnd } from '@/lib/format';
import { GROUPS, MOVE_LABEL, qtyText, stateOf, suggestQty, useInventory, type GroupId, type Ingredient, type StockState } from '@/lib/inventory';
import { useProductMap } from '@/lib/products';
import Modal from '@/components/ui/Modal';
import Toast from '@/components/ui/Toast';
import { SearchIcon } from '@/components/ui/Icons';
import { FieldLabel, PageHead, SidePanel, StateText, StockBar, btnInk, btnLine, btnSolid, input, select } from './ui';

type StateFilter = 'all' | 'need' | StockState;
const STATE_FILTERS: { id: StateFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'need', label: 'Cần nhập' },
  { id: 'out', label: 'Hết hàng' },
  { id: 'ok', label: 'Đủ dùng' },
];
type Sort = 'state' | 'name' | 'value';

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();

export default function Ingredients() {
  const params = useSearchParams();
  const router = useRouter();
  const { ingredients, suppliers } = useInventory();
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<GroupId | 'all'>('all');
  const [state, setState] = useState<StateFilter>(params.get('loc') === 'can-nhap' ? 'need' : 'all');
  const [sort, setSort] = useState<Sort>('state');
  const [openId, setOpenId] = useState<string | null>(params.get('xem'));
  const [editing, setEditing] = useState<Ingredient | 'new' | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? '—';
  const rank: Record<StockState, number> = { out: 0, low: 1, ok: 2 };

  const list = useMemo(() => {
    const term = fold(q.trim());
    return ingredients
      .filter((i) => (group === 'all' || i.group === group) && (!term || fold(i.name).includes(term)))
      .filter((i) => {
        const st = stateOf(i);
        return state === 'all' || (state === 'need' ? st !== 'ok' : st === state);
      })
      .sort((a, b) =>
        sort === 'name' ? a.name.localeCompare(b.name, 'vi') : sort === 'value' ? b.stock * b.cost - a.stock * a.cost : rank[stateOf(a)] - rank[stateOf(b)] || a.name.localeCompare(b.name, 'vi'),
      );
  }, [ingredients, q, group, state, sort]);

  const counts = useMemo(() => {
    const c: Record<StateFilter, number> = { all: ingredients.length, need: 0, out: 0, low: 0, ok: 0 };
    for (const i of ingredients) {
      const st = stateOf(i);
      c[st]++;
      if (st !== 'ok') c.need++;
    }
    return c;
  }, [ingredients]);

  const open = ingredients.find((i) => i.id === openId) ?? null;

  return (
    <>
      <PageHead
        kicker="Sổ kho"
        title="Nguyên liệu"
        lead="Mỗi nguyên liệu có mức tối thiểu; tồn xuống tới mức này là cần nhập thêm."
        actions={
          <button type="button" onClick={() => setEditing('new')} className={btnSolid}>
            + Thêm nguyên liệu
          </button>
        }
      />

      {/* Bộ lọc */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <label className="relative min-w-[14rem] flex-1">
          <span className="sr-only">Tìm nguyên liệu</span>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-roast/50" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm nguyên liệu, gõ không dấu cũng được" className={`${input} pl-9`} />
        </label>
        <select value={group} onChange={(e) => setGroup(e.target.value as GroupId | 'all')} className={select} aria-label="Nhóm">
          <option value="all">Mọi nhóm</option>
          {GROUPS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={select} aria-label="Sắp xếp">
          <option value="state">Cần chú ý trước</option>
          <option value="name">Theo tên A–Z</option>
          <option value="value">Giá trị tồn cao trước</option>
        </select>
      </div>
      <div className="no-scrollbar -mx-4 mt-4 flex gap-1 overflow-x-auto border-b-2 border-roast px-4" role="tablist" aria-label="Lọc theo trạng thái">
        {STATE_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={state === f.id}
            onClick={() => setState(f.id)}
            className={`-mb-0.5 shrink-0 border-b-[3px] px-3 py-2 font-label text-sm font-semibold uppercase tracking-wider ${state === f.id ? 'border-gold' : 'border-transparent text-roast/55 hover:text-roast'}`}
          >
            {f.label}
            <span className={`ml-1.5 font-mono text-xs ${f.id === 'need' && counts.need ? 'text-chili' : 'opacity-70'}`}>{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {/* Bảng */}
      {list.length === 0 ? (
        <p className="py-12 text-center text-roast/60">Không có nguyên liệu nào khớp bộ lọc.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr className="border-b border-roast text-left font-label text-[11px] uppercase tracking-wider text-roast/60">
                <th className="py-2.5 pr-3 font-semibold">Nguyên liệu</th>
                <th className="px-3 py-2.5 font-semibold">Tồn kho</th>
                <th className="px-3 py-2.5 font-semibold">Trạng thái</th>
                <th className="px-3 py-2.5 text-right font-semibold">Giá vốn</th>
                <th className="px-3 py-2.5 text-right font-semibold">Giá trị tồn</th>
                <th className="py-2.5 pl-3 font-semibold">Nhà cung cấp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dotted divide-roast/40">
              {list.map((i) => (
                <tr key={i.id} onClick={() => setOpenId(i.id)} className="cursor-pointer hover:bg-roast/5">
                  <td className="py-3 pr-3">
                    <button type="button" className="plain-btn text-left font-semibold hover:underline" onClick={() => setOpenId(i.id)}>
                      {i.name}
                    </button>
                    <span className="block text-xs text-roast/55">{GROUPS.find((g) => g.id === i.group)?.name}</span>
                  </td>
                  <td className="w-44 px-3 py-3">
                    <span className="font-mono">{qtyText(i.stock, i.unit)}</span>
                    <span className="ml-1 font-mono text-xs text-roast/50">/ {i.min}</span>
                    <span className="mt-1.5 block">
                      <StockBar stock={i.stock} min={i.min} />
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <StateText state={stateOf(i)} />
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-xs">
                    {formatVnd(i.cost)}/{i.unit}
                  </td>
                  <td className="px-3 py-3 text-right font-mono">{formatVnd(Math.round(i.stock * i.cost))}</td>
                  <td className="py-3 pl-3 text-roast/75">{supplierName(i.supplierId)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <IngredientPanel
        ingredient={open}
        onClose={() => {
          setOpenId(null);
          if (params.get('xem')) router.replace('/quan-ly/nguyen-lieu');
        }}
        onEdit={(i) => setEditing(i)}
        onToast={setToast}
      />
      <IngredientForm value={editing} onClose={() => setEditing(null)} onSaved={(name) => setToast(`Đã lưu ${name}.`)} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}

/** Khung chi tiết một nguyên liệu */
function IngredientPanel({ ingredient: i, onClose, onEdit, onToast }: { ingredient: Ingredient | null; onClose: () => void; onEdit: (i: Ingredient) => void; onToast: (m: string) => void }) {
  const { suppliers, movements, recipes, adjust } = useInventory();
  const products = useProductMap();
  const [mode, setMode] = useState<'view' | 'adjust'>('view');
  const [newStock, setNewStock] = useState('');
  const [reason, setReason] = useState<'adjust' | 'waste'>('waste');
  const [note, setNote] = useState('');

  useEffect(() => {
    setMode('view');
    setNewStock(i ? String(i.stock) : '');
    setNote('');
  }, [i?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!i) return null;
  const st = stateOf(i);
  const supplier = suppliers.find((s) => s.id === i.supplierId);
  const history = movements.filter((m) => m.ingredientId === i.id).slice(0, 12);
  const usedIn = recipes.filter((r) => r.lines.some((l) => l.ingredientId === i.id));
  const parsed = Number(newStock.replace(',', '.'));
  const validAdjust = newStock.trim() !== '' && Number.isFinite(parsed) && parsed >= 0 && note.trim().length >= 3;

  function submitAdjust(e: FormEvent) {
    e.preventDefault();
    if (!i || !validAdjust) return;
    adjust(i.id, parsed, reason, note.trim());
    onToast(`Đã cập nhật tồn ${i.name}: ${qtyText(parsed, i.unit)}.`);
    setMode('view');
  }

  return (
    <SidePanel
      open
      title={i.name}
      onClose={onClose}
      footer={
        mode === 'view' ? (
          <div className="flex flex-wrap gap-2">
            <Link href={`/quan-ly/nhap-kho?tao=1&ncc=${i.supplierId}&nl=${i.id}`} className={btnSolid}>
              Nhập thêm
            </Link>
            <button type="button" onClick={() => setMode('adjust')} className={btnLine}>
              Điều chỉnh tồn
            </button>
            <button type="button" onClick={() => onEdit(i)} className={`${btnLine} border-roast/30`}>
              Sửa thông tin
            </button>
          </div>
        ) : null
      }
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-label text-[11px] uppercase tracking-wider text-roast/60">Tồn hiện tại</p>
          <p className="font-display text-4xl font-black tabular-nums leading-none">{qtyText(i.stock, i.unit)}</p>
        </div>
        <StateText state={st} />
      </div>
      <div className="mt-3">
        <StockBar stock={i.stock} min={i.min} />
        <p className="mt-1 text-xs text-roast/60">
          Mức tối thiểu {qtyText(i.min, i.unit)}
          {st !== 'ok' && ` · nên nhập thêm ${qtyText(suggestQty(i), i.unit)}`}
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-roast py-4 text-sm">
        <div>
          <dt className="font-label text-[11px] uppercase tracking-wider text-roast/60">Giá vốn</dt>
          <dd className="font-mono">
            {formatVnd(i.cost)}/{i.unit}
          </dd>
        </div>
        <div>
          <dt className="font-label text-[11px] uppercase tracking-wider text-roast/60">Giá trị tồn</dt>
          <dd className="font-mono">{formatVnd(Math.round(i.stock * i.cost))}</dd>
        </div>
        <div>
          <dt className="font-label text-[11px] uppercase tracking-wider text-roast/60">Đơn vị dùng</dt>
          <dd>
            1 {i.unit} = {i.per.toLocaleString('vi-VN')} {i.sub}
          </dd>
        </div>
        <div>
          <dt className="font-label text-[11px] uppercase tracking-wider text-roast/60">Nhà cung cấp</dt>
          <dd>{supplier?.name ?? '—'}</dd>
          {supplier && <dd className="text-xs text-roast/60">{supplier.phone}</dd>}
        </div>
      </dl>

      {mode === 'adjust' && (
        <form onSubmit={submitAdjust} className="mt-5 space-y-3 border-2 border-roast p-4">
          <p className="font-display text-lg font-bold">Điều chỉnh tồn kho</p>
          <FieldLabel label={`Tồn mới (${i.unit})`} hint={newStock.trim() !== '' && Number.isFinite(parsed) ? `Chênh lệch ${parsed - i.stock >= 0 ? '+' : ''}${qtyText(Math.round((parsed - i.stock) * 1000) / 1000, i.unit)}` : undefined}>
            <input inputMode="decimal" value={newStock} onChange={(e) => setNewStock(e.target.value)} className={input} />
          </FieldLabel>
          <FieldLabel label="Lý do">
            <select value={reason} onChange={(e) => setReason(e.target.value as 'adjust' | 'waste')} className={input}>
              <option value="waste">Huỷ do hư hỏng, hết hạn</option>
              <option value="adjust">Điều chỉnh khác (đếm lại, nhập sai...)</option>
            </select>
          </FieldLabel>
          <FieldLabel label="Ghi chú" hint="Bắt buộc, để sau này tra lại được">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: 2 hộp sữa phồng nắp" className={input} />
          </FieldLabel>
          <div className="flex gap-2">
            <button type="submit" disabled={!validAdjust} className={btnInk}>
              Lưu điều chỉnh
            </button>
            <button type="button" onClick={() => setMode('view')} className={btnLine}>
              Huỷ
            </button>
          </div>
        </form>
      )}

      <h3 className="kicker mt-6">Dùng trong món</h3>
      {usedIn.length === 0 ? (
        <p className="mt-1 text-sm text-roast/60">Chưa có công thức nào dùng nguyên liệu này.</p>
      ) : (
        <ul className="mt-1 text-sm">
          {usedIn.map((r) => {
            const amount = r.lines.find((l) => l.ingredientId === i.id)?.amount ?? 0;
            return (
              <li key={r.productId} className="flex justify-between gap-3 border-b border-dotted border-roast/40 py-1.5">
                <span>
                  {products.get(r.productId)?.name ?? r.productId} <span className="text-roast/50">({r.size})</span>
                </span>
                <span className="font-mono text-xs">
                  {amount.toLocaleString('vi-VN')} {i.sub}/ly
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <h3 className="kicker mt-6">Lịch sử nhập xuất</h3>
      {history.length === 0 ? (
        <p className="mt-1 text-sm text-roast/60">Chưa có ghi nhận nào.</p>
      ) : (
        <ol className="mt-1 text-sm">
          {history.map((m) => (
            <li key={m.id} className="border-b border-dotted border-roast/40 py-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">
                  {MOVE_LABEL[m.kind]}
                  {m.ref && <span className="ml-1 font-mono text-xs text-roast/60">{m.ref}</span>}
                </span>
                <span className={`font-mono ${m.qty >= 0 ? 'text-leaf' : 'text-chili'}`}>
                  {m.qty >= 0 ? '+' : '−'}
                  {qtyText(Math.abs(m.qty), i.unit)}
                </span>
              </div>
              <p className="text-xs text-roast/60">
                {formatDateTime(m.at)} · {m.note}
              </p>
            </li>
          ))}
        </ol>
      )}
    </SidePanel>
  );
}

/** Thêm / sửa thông tin nguyên liệu (không sửa số tồn ở đây; tồn chỉ đổi qua nhập kho, điều chỉnh, kiểm kho) */
function IngredientForm({ value, onClose, onSaved }: { value: Ingredient | 'new' | null; onClose: () => void; onSaved: (name: string) => void }) {
  const { suppliers, saveIngredient, ingredients } = useInventory();
  const empty: Ingredient = { id: '', name: '', group: 'ca-phe', unit: 'kg', sub: 'g', per: 1000, stock: 0, min: 1, cost: 0, supplierId: suppliers[0]?.id ?? '' };
  const [f, setF] = useState<Ingredient>(empty);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setF(value && value !== 'new' ? value : empty);
    setError(null);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const isNew = value === 'new';
  const set = <K extends keyof Ingredient>(k: K, v: Ingredient[K]) => setF((x) => ({ ...x, [k]: v }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const name = f.name.trim();
    if (name.length < 2) return setError('Nhập tên nguyên liệu.');
    if (!f.unit.trim() || !f.sub.trim() || !(f.per > 0)) return setError('Đơn vị và hệ số đổi phải hợp lệ.');
    if (!(f.min >= 0) || !(f.cost >= 0)) return setError('Mức tối thiểu và giá vốn không được âm.');
    const id = isNew ? fold(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : f.id;
    if (isNew && ingredients.some((i) => i.id === id)) return setError('Đã có nguyên liệu trùng tên.');
    saveIngredient({ ...f, id, name });
    onSaved(name);
    onClose();
  }

  return (
    <Modal open={value !== null} titleId="ingredient-form-title" onClose={onClose}>
      <h2 id="ingredient-form-title" className="font-display text-2xl font-black">
        {isNew ? 'Thêm nguyên liệu' : 'Sửa thông tin'}
      </h2>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        {error && (
          <p role="alert" className="border-2 border-chili px-3 py-2 text-sm text-chili sm:col-span-2">
            {error}
          </p>
        )}
        <div className="sm:col-span-2">
          <FieldLabel label="Tên nguyên liệu">
            <input value={f.name} onChange={(e) => set('name', e.target.value)} className={input} />
          </FieldLabel>
        </div>
        <FieldLabel label="Nhóm">
          <select value={f.group} onChange={(e) => set('group', e.target.value as GroupId)} className={input}>
            {GROUPS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel label="Nhà cung cấp">
          <select value={f.supplierId} onChange={(e) => set('supplierId', e.target.value)} className={input}>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel label="Đơn vị nhập" hint="kg, lít, hộp, chai, cái...">
          <input value={f.unit} onChange={(e) => set('unit', e.target.value)} className={input} />
        </FieldLabel>
        <FieldLabel label="Đổi ra đơn vị pha chế" hint={`1 ${f.unit || '...'} = ${f.per || '...'} ${f.sub || '...'}`}>
          <span className="flex gap-2">
            <input type="number" min={0} step="any" value={f.per} onChange={(e) => set('per', Number(e.target.value))} className={`${input} w-24`} aria-label="Hệ số đổi" />
            <input value={f.sub} onChange={(e) => set('sub', e.target.value)} className={input} aria-label="Đơn vị pha chế" />
          </span>
        </FieldLabel>
        <FieldLabel label={`Mức tối thiểu (${f.unit || 'đơn vị'})`}>
          <input type="number" min={0} step="any" value={f.min} onChange={(e) => set('min', Number(e.target.value))} className={input} />
        </FieldLabel>
        <FieldLabel label={`Giá vốn (đ/${f.unit || 'đơn vị'})`} hint={isNew ? 'Lần nhập kho sau sẽ tự tính lại giá vốn bình quân' : undefined}>
          <input type="number" min={0} step={100} value={f.cost} onChange={(e) => set('cost', Number(e.target.value))} className={input} />
        </FieldLabel>
        {!isNew && <p className="text-xs text-roast/60 sm:col-span-2">Số tồn không sửa ở đây. Muốn đổi tồn, dùng Nhập kho, Điều chỉnh tồn hoặc Kiểm kho để có lịch sử.</p>}
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" className={btnSolid}>
            {isNew ? 'Thêm nguyên liệu' : 'Lưu thay đổi'}
          </button>
          <button type="button" onClick={onClose} className={btnLine}>
            Huỷ
          </button>
        </div>
      </form>
    </Modal>
  );
}
