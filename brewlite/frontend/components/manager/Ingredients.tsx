'use client';

// NGUYÊN LIỆU: ô số liệu bấm để lọc, bảng gọn có chia trang; bấm một dòng mở khung chi tiết
// (tồn, giá vốn, món đang dùng, lịch sử) để nhập thêm, điều chỉnh tồn hoặc sửa thông tin.
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { formatDateTime, formatVnd } from '@/lib/format';
import { GROUPS, MOVE_LABEL, qtyText, stateOf, suggestQty, useInventory, type GroupId, type Ingredient, type StockState } from '@/lib/inventory';
import { useProductMap } from '@/lib/products';
import { matchText } from '@/lib/search';
import Modal from '@/components/ui/Modal';
import Toast from '@/components/ui/Toast';
import { SearchIcon } from '@/components/ui/Icons';
import { FieldLabel, FilterTile, PageHead, Pager, Panel, SidePanel, StockBadge, StockBar, btnInk, btnLine, btnSolid, input, num, searchInput, td, th, toolSelect, tr } from './ui';

type Filter = 'all' | 'need' | 'out';
const PAGE = 10;
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();
const groupName = (id: GroupId) => GROUPS.find((g) => g.id === id)?.name ?? id;
const RANK: Record<StockState, number> = { out: 0, low: 1, ok: 2 };

export default function Ingredients() {
  const params = useSearchParams();
  const router = useRouter();
  const { ingredients } = useInventory();
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<GroupId | 'all'>('all');
  const [filter, setFilter] = useState<Filter>(params.get('loc') === 'can-nhap' ? 'need' : 'all');
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(params.get('xem'));
  const [editing, setEditing] = useState<Ingredient | 'new' | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Mở từ ô tìm nhanh khi đang ở sẵn trang này
  useEffect(() => {
    const id = params.get('xem');
    if (id) setOpenId(id);
  }, [params]);
  useEffect(() => setPage(0), [q, group, filter]);

  const counts = useMemo(() => {
    let need = 0;
    let out = 0;
    for (const i of ingredients) {
      const st = stateOf(i);
      if (st !== 'ok') need++;
      if (st === 'out') out++;
    }
    return { all: ingredients.length, need, out, value: ingredients.reduce((n, i) => n + i.stock * i.cost, 0) };
  }, [ingredients]);

  const list = useMemo(() => {
    const term = q.trim();
    return ingredients
      .filter((i) => group === 'all' || i.group === group)
      .filter((i) => filter === 'all' || (filter === 'need' ? stateOf(i) !== 'ok' : stateOf(i) === 'out'))
      .filter((i) => !term || matchText(i.name, term) !== null || fold(i.name).includes(fold(term)))
      .sort((a, b) => RANK[stateOf(a)] - RANK[stateOf(b)] || a.name.localeCompare(b.name, 'vi'));
  }, [ingredients, q, group, filter]);
  const rows = list.slice(page * PAGE, page * PAGE + PAGE);
  const opened = ingredients.find((i) => i.id === openId) ?? null;

  return (
    <>
      <PageHead
        title="Nguyên liệu"
        actions={
          <>
            <Link href="/quan-ly/nhap-kho" className={btnLine}>
              Nhập kho
            </Link>
            <button type="button" onClick={() => setEditing('new')} className={btnSolid}>
              + Thêm nguyên liệu
            </button>
          </>
        }
      />

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FilterTile label="Tất cả" value={counts.all} active={filter === 'all'} onClick={() => setFilter('all')} />
        <FilterTile label="Cần nhập" value={counts.need} tone={counts.need ? 'text-amber-700' : ''} active={filter === 'need'} onClick={() => setFilter('need')} />
        <FilterTile label="Hết hàng" value={counts.out} tone={counts.out ? 'text-chili' : ''} active={filter === 'out'} onClick={() => setFilter('out')} />
        <FilterTile label="Giá trị tồn kho" value={formatVnd(counts.value)} />
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
        footer={<Pager page={page} size={PAGE} total={list.length} onPage={setPage} />}
      >
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-roast/60">Không có nguyên liệu nào khớp bộ lọc.</p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr>
                  <th className={th}>Nguyên liệu</th>
                  <th className={th}>Tồn kho</th>
                  <th className={th}>Trạng thái</th>
                  <th className={`${th} text-right`}>Giá vốn</th>
                  <th className={`${th} text-right`}>Giá trị tồn</th>
                  <th className={th}>
                    <span className="sr-only">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => {
                  const st = stateOf(i);
                  return (
                    <tr key={i.id} onClick={() => setOpenId(i.id)} className={`${tr} cursor-pointer`}>
                      <td className={td}>
                        <span className="block font-semibold">{i.name}</span>
                        <span className="block text-xs text-roast/55">{groupName(i.group)}</span>
                      </td>
                      <td className={`${td} w-48`}>
                        <span className={`text-sm ${num}`}>
                          {qtyText(i.stock, i.unit)} <span className="text-roast/45">/ {qtyText(i.min, i.unit)}</span>
                        </span>
                        <span className="mt-1.5 block w-36">
                          <StockBar stock={i.stock} min={i.min} />
                        </span>
                      </td>
                      <td className={td}>
                        <StockBadge state={st} />
                      </td>
                      <td className={`${td} text-right text-roast/75 ${num}`}>
                        {formatVnd(i.cost)}
                        <span className="text-roast/45">/{i.unit}</span>
                      </td>
                      <td className={`${td} text-right ${num}`}>{formatVnd(i.stock * i.cost)}</td>
                      <td className={`${td} w-24 text-right`} onClick={(e) => e.stopPropagation()}>
                        <Link href={`/quan-ly/nhap-kho?nl=${i.id}`} className="inline-flex h-8 items-center border border-roast/30 px-3 font-label text-[11px] font-semibold uppercase tracking-wider hover:border-roast hover:bg-roast hover:text-cream">
                          Nhập
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <IngredientPanel
        ingredient={opened}
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
  const { movements, recipes, adjust } = useInventory();
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
  const history = movements.filter((m) => m.ingredientId === i.id).slice(0, 10);
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

  const facts = [
    { k: 'Tồn kho', v: qtyText(i.stock, i.unit) },
    { k: 'Mức tối thiểu', v: qtyText(i.min, i.unit) },
    { k: 'Giá vốn', v: `${formatVnd(i.cost)}/${i.unit}` },
    { k: 'Giá trị tồn', v: formatVnd(i.stock * i.cost) },
  ];

  return (
    <SidePanel
      open
      title={i.name}
      onClose={onClose}
      footer={
        mode === 'view' ? (
          <div className="flex flex-wrap gap-2">
            <Link href={`/quan-ly/nhap-kho?nl=${i.id}`} className={btnSolid}>
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
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-roast/60">
          {groupName(i.group)} · 1 {i.unit} = {i.per.toLocaleString('vi-VN')} {i.sub}
        </span>
        <StockBadge state={st} />
      </div>
      <dl className="mt-3 grid grid-cols-2 border border-roast/20">
        {facts.map((f, k) => (
          <div key={f.k} className={`px-3 py-2.5 ${k % 2 ? 'border-l border-roast/20' : ''} ${k > 1 ? 'border-t border-roast/20' : ''}`}>
            <dt className="font-label text-[11px] uppercase tracking-wider text-roast/55">{f.k}</dt>
            <dd className={`mt-0.5 font-semibold ${num}`}>{f.v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3">
        <StockBar stock={i.stock} min={i.min} />
        {st !== 'ok' && <p className="mt-1.5 text-xs text-amber-700">Nên nhập thêm khoảng {qtyText(suggestQty(i), i.unit)}.</p>}
      </div>

      {mode === 'adjust' && (
        <form onSubmit={submitAdjust} className="mt-5 space-y-3 border border-roast/30 bg-foam p-4">
          <p className="font-semibold">Điều chỉnh tồn kho</p>
          <FieldLabel
            label={`Tồn mới (${i.unit})`}
            hint={newStock.trim() !== '' && Number.isFinite(parsed) ? `Chênh lệch ${parsed - i.stock >= 0 ? '+' : ''}${qtyText(Math.round((parsed - i.stock) * 1000) / 1000, i.unit)}` : undefined}
          >
            <input inputMode="decimal" value={newStock} onChange={(e) => setNewStock(e.target.value)} className={input} />
          </FieldLabel>
          <FieldLabel label="Lý do">
            <select value={reason} onChange={(e) => setReason(e.target.value as 'adjust' | 'waste')} className={input}>
              <option value="waste">Huỷ do hư hỏng, hết hạn</option>
              <option value="adjust">Điều chỉnh khác (đếm lại, nhập sai...)</option>
            </select>
          </FieldLabel>
          <FieldLabel label="Ghi chú">
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

      <h3 className="mt-6 font-label text-xs font-semibold uppercase tracking-wider text-roast/60">Dùng trong món</h3>
      {usedIn.length === 0 ? (
        <p className="mt-1 text-sm text-roast/60">Chưa có công thức nào dùng nguyên liệu này.</p>
      ) : (
        <ul className="mt-1 text-sm">
          {usedIn.map((r) => {
            const amount = r.lines.find((l) => l.ingredientId === i.id)?.amount ?? 0;
            return (
              <li key={r.productId} className="flex justify-between gap-3 border-b border-roast/10 py-2">
                <span>{products.get(r.productId)?.name ?? r.productId}</span>
                <span className={`text-roast/65 ${num}`}>
                  {amount.toLocaleString('vi-VN')} {i.sub}/{r.size === 'M' ? 'ly' : 'cái'}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <h3 className="mt-6 font-label text-xs font-semibold uppercase tracking-wider text-roast/60">Lịch sử nhập xuất</h3>
      {history.length === 0 ? (
        <p className="mt-1 text-sm text-roast/60">Chưa có ghi nhận nào.</p>
      ) : (
        <ol className="mt-1 text-sm">
          {history.map((m) => (
            <li key={m.id} className="flex items-start justify-between gap-3 border-b border-roast/10 py-2">
              <span className="min-w-0">
                <span className="block font-semibold">
                  {MOVE_LABEL[m.kind]}
                  {m.ref && <span className="ml-1.5 text-xs font-normal text-roast/55">{m.ref}</span>}
                </span>
                <span className="block truncate text-xs text-roast/55">
                  {formatDateTime(m.at)} · {m.note}
                </span>
              </span>
              <span className={`shrink-0 font-semibold ${num} ${m.qty >= 0 ? 'text-leaf' : 'text-chili'}`}>
                {m.qty >= 0 ? '+' : '−'}
                {qtyText(Math.abs(m.qty), i.unit)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </SidePanel>
  );
}

/** Thêm / sửa thông tin nguyên liệu (không sửa số tồn ở đây; tồn chỉ đổi qua nhập kho, điều chỉnh, kiểm kho) */
function IngredientForm({ value, onClose, onSaved }: { value: Ingredient | 'new' | null; onClose: () => void; onSaved: (name: string) => void }) {
  const { saveIngredient, ingredients } = useInventory();
  const empty: Ingredient = { id: '', name: '', group: 'ca-phe', unit: 'kg', sub: 'g', per: 1000, stock: 0, min: 1, cost: 0 };
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
    const id = isNew
      ? fold(name)
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      : f.id;
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
          <p role="alert" className="border border-chili px-3 py-2 text-sm text-chili sm:col-span-2">
            {error}
          </p>
        )}
        <FieldLabel label="Tên nguyên liệu">
          <input value={f.name} onChange={(e) => set('name', e.target.value)} className={input} />
        </FieldLabel>
        <FieldLabel label="Nhóm">
          <select value={f.group} onChange={(e) => set('group', e.target.value as GroupId)} className={input}>
            {GROUPS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
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
        <FieldLabel label={`Giá vốn (đ/${f.unit || 'đơn vị'})`}>
          <input type="number" min={0} step={100} value={f.cost} onChange={(e) => set('cost', Number(e.target.value))} className={input} />
        </FieldLabel>
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
