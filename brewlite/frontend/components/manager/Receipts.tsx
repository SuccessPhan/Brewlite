'use client';

// NHẬP KHO: danh sách phiếu nhập (đã nhập / nháp) và form tạo phiếu.
// Bấm "Nhập kho" thì cộng tồn và tính lại giá vốn bình quân; "Lưu nháp" để chờ hàng về rồi nhập sau.
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { formatDateTime, formatVnd } from '@/lib/format';
import { qtyText, receiptTotal, stateOf, suggestQty, useInventory, type Receipt, type ReceiptLine } from '@/lib/inventory';
import Modal from '@/components/ui/Modal';
import Toast from '@/components/ui/Toast';
import { TrashIcon } from '@/components/ui/Icons';
import { FieldLabel, PageHead, btnInk, btnLine, btnSolid, input } from './ui';

type Tab = 'done' | 'draft';

export default function Receipts() {
  const params = useSearchParams();
  const router = useRouter();
  const { receipts, suppliers } = useInventory();
  const [tab, setTab] = useState<Tab>('done');
  const [form, setForm] = useState<{ receipt?: Receipt; supplierId?: string; ingredientId?: string } | null>(null);
  const [view, setView] = useState<Receipt | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Mở sẵn form khi tới từ "Tạo phiếu nhập" ở trang khác (?tao=1&ncc=...&nl=...)
  useEffect(() => {
    if (params.get('tao')) {
      setForm({ supplierId: params.get('ncc') ?? undefined, ingredientId: params.get('nl') ?? undefined });
      router.replace('/quan-ly/nhap-kho');
    }
  }, [params, router]);

  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? '—';
  const list = receipts.filter((r) => r.status === tab).sort((a, b) => b.at.localeCompare(a.at));
  const monthTotal = receipts
    .filter((r) => r.status === 'done' && new Date(r.at).getMonth() === new Date().getMonth())
    .reduce((n, r) => n + receiptTotal(r), 0);

  return (
    <>
      <PageHead
        kicker="Sổ kho"
        title="Nhập kho"
        lead={`Tháng này đã nhập ${formatVnd(monthTotal)}. Phiếu nháp dùng khi đã đặt hàng nhưng hàng chưa về.`}
        actions={
          <button type="button" onClick={() => setForm({})} className={btnSolid}>
            + Tạo phiếu nhập
          </button>
        }
      />

      <div className="mt-5 flex gap-1 border-b-2 border-roast" role="tablist">
        {(['done', 'draft'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`-mb-0.5 border-b-[3px] px-3 py-2 font-label text-sm font-semibold uppercase tracking-wider ${tab === t ? 'border-gold' : 'border-transparent text-roast/55 hover:text-roast'}`}
          >
            {t === 'done' ? 'Đã nhập' : 'Nháp'}
            <span className="ml-1.5 font-mono text-xs opacity-70">{receipts.filter((r) => r.status === t).length}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="py-12 text-center text-roast/60">{tab === 'draft' ? 'Không có phiếu nháp nào.' : 'Chưa có phiếu nhập nào.'}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-roast text-left font-label text-[11px] uppercase tracking-wider text-roast/60">
                <th className="py-2.5 pr-3 font-semibold">Số phiếu</th>
                <th className="px-3 py-2.5 font-semibold">Nhà cung cấp</th>
                <th className="px-3 py-2.5 font-semibold">Mặt hàng</th>
                <th className="px-3 py-2.5 font-semibold">{tab === 'done' ? 'Ngày nhập' : 'Tạo lúc'}</th>
                <th className="py-2.5 pl-3 text-right font-semibold">Tổng tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dotted divide-roast/40">
              {list.map((r) => (
                <tr key={r.id} onClick={() => (r.status === 'draft' ? setForm({ receipt: r }) : setView(r))} className="cursor-pointer hover:bg-roast/5">
                  <td className="py-3 pr-3 font-mono font-semibold">{r.id}</td>
                  <td className="px-3 py-3">{supplierName(r.supplierId)}</td>
                  <td className="px-3 py-3 text-roast/75">
                    {r.lines.length} mặt hàng
                    {r.note && <span className="block truncate text-xs italic text-roast/55">{r.note}</span>}
                  </td>
                  <td className="px-3 py-3 text-roast/75">{formatDateTime(r.at)}</td>
                  <td className="py-3 pl-3 text-right font-mono font-semibold">{formatVnd(receiptTotal(r))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ReceiptForm init={form} onClose={() => setForm(null)} onDone={(m) => setToast(m)} />
      <ReceiptView receipt={view} onClose={() => setView(null)} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}

function ReceiptView({ receipt: r, onClose }: { receipt: Receipt | null; onClose: () => void }) {
  const { ingredients, suppliers } = useInventory();
  if (!r) return null;
  const name = (id: string) => ingredients.find((i) => i.id === id);
  return (
    <Modal open titleId="receipt-view-title" onClose={onClose} xl>
      <p className="kicker">Phiếu nhập kho</p>
      <h2 id="receipt-view-title" className="font-display text-3xl font-black">
        {r.id}
      </h2>
      <p className="text-sm text-roast/70">
        {suppliers.find((s) => s.id === r.supplierId)?.name} · {formatDateTime(r.at)}
      </p>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-roast text-left font-label text-[11px] uppercase tracking-wider text-roast/60">
            <th className="py-2 font-semibold">Mặt hàng</th>
            <th className="py-2 text-right font-semibold">Số lượng</th>
            <th className="py-2 text-right font-semibold">Đơn giá</th>
            <th className="py-2 text-right font-semibold">Thành tiền</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dotted divide-roast/40">
          {r.lines.map((l) => {
            const ing = name(l.ingredientId);
            return (
              <tr key={l.ingredientId}>
                <td className="py-2">{ing?.name}</td>
                <td className="py-2 text-right font-mono">{qtyText(l.qty, ing?.unit ?? '')}</td>
                <td className="py-2 text-right font-mono">{formatVnd(l.price)}</td>
                <td className="py-2 text-right font-mono">{formatVnd(l.qty * l.price)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-roast">
            <td colSpan={3} className="py-2 font-label text-xs font-semibold uppercase tracking-wider">
              Tổng cộng
            </td>
            <td className="py-2 text-right font-mono text-lg font-bold">{formatVnd(receiptTotal(r))}</td>
          </tr>
        </tfoot>
      </table>
      {r.note && <p className="mt-3 border-l-2 border-gold pl-3 text-sm italic text-roast/70">{r.note}</p>}
    </Modal>
  );
}

interface Line extends ReceiptLine {
  key: string;
}

function ReceiptForm({ init, onClose, onDone }: { init: { receipt?: Receipt; supplierId?: string; ingredientId?: string } | null; onClose: () => void; onDone: (m: string) => void }) {
  const { ingredients, suppliers, saveReceipt } = useInventory();
  const [supplierId, setSupplierId] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const byId = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);

  const lineOf = (id: string): Line => {
    const ing = byId.get(id);
    return { key: `${id}-${Math.random().toString(36).slice(2, 6)}`, ingredientId: id, qty: ing ? suggestQty(ing) || 1 : 1, price: ing?.cost ?? 0 };
  };

  useEffect(() => {
    if (!init) return;
    setError(null);
    if (init.receipt) {
      setSupplierId(init.receipt.supplierId);
      setLines(init.receipt.lines.map((l) => ({ ...l, key: l.ingredientId })));
      setNote(init.receipt.note);
      return;
    }
    const sid = init.supplierId ?? suppliers[0]?.id ?? '';
    setSupplierId(sid);
    setNote('');
    setLines(init.ingredientId ? [lineOf(init.ingredientId)] : []);
  }, [init]); // eslint-disable-line react-hooks/exhaustive-deps

  const ofSupplier = ingredients.filter((i) => i.supplierId === supplierId);
  const needing = ofSupplier.filter((i) => stateOf(i) !== 'ok' && !lines.some((l) => l.ingredientId === i.id));
  const others = ingredients.filter((i) => !lines.some((l) => l.ingredientId === i.id));
  const total = lines.reduce((n, l) => n + (l.qty || 0) * (l.price || 0), 0);
  const update = (key: string, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  function save(status: 'draft' | 'done') {
    if (!supplierId) return setError('Chọn nhà cung cấp.');
    if (lines.length === 0) return setError('Thêm ít nhất một mặt hàng.');
    if (lines.some((l) => !(l.qty > 0) || !(l.price >= 0))) return setError('Số lượng phải lớn hơn 0 và đơn giá không được âm.');
    const id = saveReceipt({ id: init?.receipt?.id, supplierId, status, note: note.trim(), lines: lines.map(({ key: _key, ...l }) => l) });
    onDone(status === 'done' ? `Đã nhập kho phiếu ${id}, tồn kho đã được cộng.` : `Đã lưu nháp phiếu ${id}.`);
    onClose();
  }

  return (
    <Modal open={init !== null} titleId="receipt-form-title" onClose={onClose} xl>
      <p className="kicker">{init?.receipt ? `Phiếu nháp ${init.receipt.id}` : 'Phiếu mới'}</p>
      <h2 id="receipt-form-title" className="font-display text-2xl font-black">
        {init?.receipt ? 'Hoàn tất phiếu nhập' : 'Tạo phiếu nhập kho'}
      </h2>

      {error && (
        <p role="alert" className="mt-3 border-2 border-chili px-3 py-2 text-sm text-chili">
          {error}
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <FieldLabel label="Nhà cung cấp">
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={input}>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel label="Ghi chú">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: giao thiếu, hẹn bù" className={input} />
        </FieldLabel>
      </div>

      {needing.length > 0 && (
        <button type="button" onClick={() => setLines((ls) => [...ls, ...needing.map((i) => lineOf(i.id))])} className="mt-4 w-full border-2 border-dashed border-gold px-3 py-2 text-left text-sm hover:bg-gold/10">
          <b className="text-amber-700">+ Thêm {needing.length} món sắp hết</b> của nhà cung cấp này: {needing.map((i) => i.name).join(', ')}
        </button>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <thead>
            <tr className="border-b border-roast text-left font-label text-[11px] uppercase tracking-wider text-roast/60">
              <th className="py-2 font-semibold">Mặt hàng</th>
              <th className="w-28 py-2 font-semibold">Số lượng</th>
              <th className="w-32 py-2 font-semibold">Đơn giá (đ)</th>
              <th className="py-2 text-right font-semibold">Thành tiền</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-dotted divide-roast/40">
            {lines.map((l) => {
              const ing = byId.get(l.ingredientId);
              return (
                <tr key={l.key}>
                  <td className="py-2 pr-2">
                    <span className="font-semibold">{ing?.name}</span>
                    {ing && <span className="block text-xs text-roast/55">Đang tồn {qtyText(ing.stock, ing.unit)}</span>}
                  </td>
                  <td className="py-2 pr-2">
                    <span className="flex items-center gap-1">
                      <input type="number" min={0} step="any" value={l.qty} onChange={(e) => update(l.key, { qty: Number(e.target.value) })} className={`${input} px-2`} aria-label={`Số lượng ${ing?.name}`} />
                      <span className="text-xs text-roast/60">{ing?.unit}</span>
                    </span>
                  </td>
                  <td className="py-2 pr-2">
                    <input type="number" min={0} step={100} value={l.price} onChange={(e) => update(l.key, { price: Number(e.target.value) })} className={`${input} px-2`} aria-label={`Đơn giá ${ing?.name}`} />
                  </td>
                  <td className="py-2 text-right font-mono">{formatVnd((l.qty || 0) * (l.price || 0))}</td>
                  <td className="py-2 text-right">
                    <button type="button" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} aria-label={`Bỏ ${ing?.name}`} className="grid h-8 w-8 place-items-center text-roast/50 hover:text-chili">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3">
        <select
          value=""
          onChange={(e) => e.target.value && setLines((ls) => [...ls, lineOf(e.target.value)])}
          className={`${input} w-full sm:w-auto`}
          aria-label="Thêm mặt hàng"
        >
          <option value="">+ Thêm mặt hàng khác…</option>
          {others.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name} ({i.unit})
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t-2 border-roast pt-4">
        <p>
          <span className="font-label text-xs uppercase tracking-wider text-roast/60">Tổng cộng </span>
          <span className="font-mono text-2xl font-bold">{formatVnd(total)}</span>
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => save('draft')} className={btnLine}>
            Lưu nháp
          </button>
          <button type="button" onClick={() => save('done')} className={btnInk}>
            Nhập kho
          </button>
        </div>
      </div>
    </Modal>
  );
}
