'use client';

// Mảnh giao diện dùng chung cho khu Quản lý: đầu trang, ô số liệu, nhãn trạng thái tồn, khung trượt bên phải
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { STATE_LABEL, STATE_TONE, type StockState } from '@/lib/inventory';
import { CloseIcon } from '@/components/ui/Icons';

export const btnSolid = 'inline-flex h-10 items-center justify-center gap-1.5 bg-gold px-4 font-label text-xs font-semibold uppercase tracking-wider text-foam hover:bg-gold-deep disabled:opacity-50';
export const btnInk = 'inline-flex h-10 items-center justify-center gap-1.5 bg-roast px-4 font-label text-xs font-semibold uppercase tracking-wider text-cream hover:bg-espresso disabled:opacity-50';
export const btnLine =
  'inline-flex h-10 items-center justify-center gap-1.5 border-2 border-roast px-4 font-label text-xs font-semibold uppercase tracking-wider hover:bg-roast hover:text-cream disabled:opacity-50';
export const input = 'h-10 w-full border-2 border-roast/30 bg-cream px-3 text-sm focus:border-roast focus:outline-none';
/** Ô chọn gọn theo nội dung, dùng trong hàng bộ lọc */
export const select = 'h-10 border-2 border-roast/30 bg-cream px-3 text-sm focus:border-roast focus:outline-none';

export function PageHead({ kicker, title, lead, actions }: { kicker: string; title: string; lead?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-roast pb-4">
      <div>
        <p className="kicker">{kicker}</p>
        <h1 className="mt-1 text-3xl font-black leading-tight sm:text-4xl">{title}</h1>
        {lead && <p className="mt-1 max-w-2xl text-sm text-roast/70">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: string }) {
  return (
    <div className="border-2 border-roast bg-cream p-4">
      <p className="font-label text-[11px] font-semibold uppercase tracking-wider text-roast/60">{label}</p>
      <p className={`mt-1 break-words font-display text-xl font-black leading-none tabular-nums sm:text-3xl ${tone ?? ''}`}>{value}</p>
      {hint && <p className="mt-1.5 text-xs text-roast/65">{hint}</p>}
    </div>
  );
}

export function StateText({ state }: { state: StockState }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold ${STATE_TONE[state]}`}>
      <span className={`keep-round h-2 w-2 rounded-full ${state === 'ok' ? 'bg-leaf' : state === 'low' ? 'bg-amber-600' : 'bg-chili'}`} aria-hidden="true" />
      {STATE_LABEL[state]}
    </span>
  );
}

/** Thanh mức tồn so với mức tối thiểu (vạch đen là mức tối thiểu) */
export function StockBar({ stock, min }: { stock: number; min: number }) {
  const max = Math.max(min * 2.5, stock, 1);
  const pct = Math.min(100, (stock / max) * 100);
  const tone = stock <= 0 ? 'bg-chili' : stock <= min ? 'bg-amber-600' : 'bg-leaf';
  return (
    <span className="relative block h-1.5 w-full bg-roast/10" aria-hidden="true">
      <span className={`absolute inset-y-0 left-0 ${tone}`} style={{ width: `${pct}%` }} />
      <span className="absolute -top-0.5 h-2.5 w-0.5 bg-roast" style={{ left: `${(min / max) * 100}%` }} />
    </span>
  );
}

/** Khung trượt từ bên phải để xem chi tiết mà không rời trang */
export function SidePanel({ open, title, onClose, children, footer, wide }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 animate-fade-in bg-roast/50" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`absolute inset-y-0 right-0 flex w-full flex-col ${wide ? 'max-w-4xl' : 'max-w-lg'} border-l-[3px] border-double border-roast bg-cream`}
      >
        <div className="flex items-center justify-between gap-3 border-b-2 border-roast px-5 py-4">
          <h2 className="font-display text-2xl font-black leading-tight">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="grid h-10 w-10 place-items-center hover:bg-roast/5">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t-2 border-roast px-5 py-4">{footer}</div>}
      </aside>
    </div>,
    document.body,
  );
}

export function FieldLabel({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="font-label text-xs uppercase tracking-wider text-roast/70">{label}</span>
      <span className="mt-1 block">{children}</span>
      {hint && <span className="mt-1 block text-xs text-roast/55">{hint}</span>}
    </label>
  );
}

/** Công tắc bật/tắt (ẩn món, chạy mã, bật thông báo) */
export function Toggle({ on, onChange, label, size = 'md' }: { on: boolean; onChange: (v: boolean) => void; label: string; size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11';
  const knob = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const shift = size === 'sm' ? 'translate-x-4' : 'translate-x-5';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!on);
      }}
      className={`relative inline-flex shrink-0 items-center border-2 border-roast transition-colors ${box} ${on ? 'bg-leaf' : 'bg-cream'}`}
    >
      <span className={`absolute left-0.5 transition-transform ${knob} ${on ? `${shift} bg-cream` : 'bg-roast'}`} />
    </button>
  );
}

/** Nhãn trạng thái nhỏ có viền */
export function Chip({ tone = 'ink', children }: { tone?: 'ink' | 'ok' | 'warn' | 'bad' | 'mute'; children: ReactNode }) {
  const cls = { ink: 'border-roast text-roast', ok: 'border-leaf text-leaf', warn: 'border-amber-700 text-amber-700', bad: 'border-chili text-chili', mute: 'border-roast/40 text-roast/55' }[tone];
  return <span className={`inline-flex items-center whitespace-nowrap border px-1.5 py-px font-label text-[10px] font-semibold uppercase tracking-wider ${cls}`}>{children}</span>;
}

export const textarea = 'w-full border-2 border-roast/30 bg-cream px-3 py-2 text-sm leading-relaxed focus:border-roast focus:outline-none';
