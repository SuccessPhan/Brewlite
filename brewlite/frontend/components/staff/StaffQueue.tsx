'use client';

// HÀNG ĐỢI CỦA QUẦY: đơn đã thanh toán chia 3 cột theo trạng thái, nhân viên bấm để chuyển bước.
// Quyền do backend quyết định (GET/POST /staff/orders trả 403 nếu không phải STAFF); kiểm tra role ở đây chỉ để hiện giao diện cho đúng.
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/lib/api';
import { describeOptions, formatClock } from '@/lib/format';
import type { OrderStatus, StaffOrder } from '@/lib/types';
import Skeleton from '@/components/ui/Skeleton';
import { AlertIcon, CupIcon, LockIcon } from '@/components/ui/Icons';

const COLUMNS: { status: OrderStatus; title: string; action: string }[] = [
  { status: 'PAID', title: 'Chờ pha', action: 'Bắt đầu pha' },
  { status: 'PREPARING', title: 'Đang pha', action: 'Pha xong' },
  { status: 'READY', title: 'Chờ khách lấy', action: 'Đã giao khách' },
];

function OrderCard({ order, action, busy, onAdvance }: { order: StaffOrder; action: string; busy: boolean; onAdvance: () => void }) {
  return (
    <li className="animate-rise rounded-2xl bg-foam p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-lg font-extrabold tabular-nums">#{order.id}</p>
        <p className="text-xs text-roast/55">{formatClock(order.createdAt)}</p>
      </div>
      <p className="mt-0.5 text-sm font-semibold">{order.user.fullName}</p>
      <p className="text-xs text-roast/60">{order.fulfillment === 'PICKUP' ? `Lấy tại quầy · ${order.pickupTime}` : `Giao: ${order.address}`}</p>
      <ul className="mt-3 space-y-1.5 border-t border-roast/10 pt-3 text-sm">
        {order.items.map((it) => (
          <li key={it.id}>
            <span className="font-bold tabular-nums">{it.qty}×</span> {it.productName}
            <span className="block text-xs text-roast/60">{describeOptions(it)}</span>
            {it.note && <span className="block text-xs italic text-roast/60">Ghi chú: {it.note}</span>}
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={busy}
        onClick={onAdvance}
        className="mt-4 w-full rounded-full bg-gold px-4 py-2.5 text-sm font-bold text-roast hover:bg-gold-deep hover:text-foam disabled:opacity-60"
      >
        {busy ? 'Đang cập nhật…' : action}
      </button>
    </li>
  );
}

export default function StaffQueue() {
  const { user, request } = useAuth();
  const isStaff = user?.role === 'STAFF' || user?.role === 'MANAGER';
  const [orders, setOrders] = useState<StaffOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setOrders(await request<StaffOrder[]>('/staff/orders'));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được hàng đợi.');
    }
  }, [request]);

  // Cứ 5 giây hỏi lại để thấy đơn mới khách vừa thanh toán
  useEffect(() => {
    if (!isStaff) return;
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [isStaff, load]);

  async function advance(id: string) {
    setBusyId(id);
    setActionError(null);
    try {
      await request<StaffOrder>(`/staff/orders/${encodeURIComponent(id)}/advance`, { method: 'POST' });
    } catch (err) {
      // Đơn có thể vừa bị nhân viên khác chuyển bước hoặc khách huỷ
      setActionError(err instanceof ApiError ? err.message : 'Chưa cập nhật được đơn.');
    } finally {
      await load();
      setBusyId(null);
    }
  }

  if (!isStaff) {
    return (
      <div className="mx-auto mt-8 max-w-md rounded-[2rem] bg-foam px-6 py-10 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-cream text-espresso">
          <LockIcon className="h-8 w-8" />
        </span>
        <h2 className="mt-4 text-xl font-extrabold">Bạn không có quyền vào quầy</h2>
        <p className="mt-2 text-sm text-roast/65">Trang này chỉ dành cho tài khoản nhân viên.</p>
      </div>
    );
  }

  if (error && !orders) {
    return (
      <div className="mt-6 flex flex-col items-center rounded-3xl bg-foam px-6 py-10 text-center">
        <AlertIcon className="h-10 w-10 text-chili" />
        <p className="mt-3 font-bold">Không tải được hàng đợi</p>
        <p className="mt-1 text-sm text-roast/65">{error}</p>
        <button type="button" onClick={load} className="mt-5 rounded-full bg-gold px-5 py-2.5 font-bold text-roast">
          Thử lại
        </button>
      </div>
    );
  }

  if (!orders) {
    return (
      <div className="mt-6 grid gap-4 md:grid-cols-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-64 rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6">
      {actionError && (
        <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl bg-chili/10 px-4 py-3 text-sm text-chili">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" /> {actionError}
        </p>
      )}
      {error && <p className="mb-4 text-sm text-chili">Mất kết nối, đang thử lại… ({error})</p>}
      {orders.length === 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-foam px-5 py-4 text-sm text-roast/70">
          <CupIcon className="h-6 w-6 text-espresso" /> Chưa có đơn nào cần pha. Đơn mới sẽ tự hiện khi khách thanh toán xong.
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const list = orders.filter((o) => o.status === col.status);
          return (
            <section key={col.status} className="border-t-[3px] border-double border-roast pt-2" aria-label={col.title}>
              <h2 className="flex items-center justify-between py-1 text-xl font-black">
                {col.title}
                <span className="tabular-nums text-base text-gold">{String(list.length).padStart(2, "0")}</span>
              </h2>
              <ul className="mt-2 space-y-3">
                {list.map((o) => (
                  <OrderCard key={o.id} order={o} action={col.action} busy={busyId === o.id} onAdvance={() => advance(o.id)} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
