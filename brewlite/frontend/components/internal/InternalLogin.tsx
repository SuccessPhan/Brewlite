'use client';

// ĐĂNG NHẬP NỘI BỘ: trang riêng cho nhân viên quầy và quản lý, tách khỏi trang đăng nhập của khách
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/lib/api';
import { DEMO_INTERNAL, DEMO_PASSWORD, SHOW_DEMO_HINTS } from '@/lib/demo';
import { canOpen, homeOf } from '@/lib/internal';
import { STORE } from '@/lib/mock-data';
import type { User } from '@/lib/types';
import QuickLogin from '@/components/auth/QuickLogin';
import { AlertIcon } from '@/components/ui/Icons';

const AREAS = [
  {
    title: 'Quầy pha chế',
    text: 'Hàng đợi đơn đã thanh toán: chờ pha, đang pha, chờ khách lấy.',
    who: 'Nhân viên quầy',
  },
  {
    title: 'Quản lý cửa hàng',
    text: 'Thực đơn, mã giảm giá, nội dung trang, phản hồi của khách và kho nguyên liệu.',
    who: 'Quản lý',
  },
];

const field = 'mt-1.5 h-12 w-full font-serif normal-case tracking-normal border-2 border-roast/30 bg-foam px-4 placeholder:text-roast/40 focus:border-roast focus:outline-none';

export default function InternalLogin({ next }: { next: string }) {
  const router = useRouter();
  const { status, user, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const target = (me: User) => (next !== '/' && canOpen(me.role, next) ? next : homeOf(me.role));

  // Đang đăng nhập sẵn bằng tài khoản nội bộ thì vào thẳng khu làm việc
  useEffect(() => {
    if (status === 'authed' && user && user.role !== 'CUSTOMER' && !submitting) router.replace(target(user));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, user]);

  async function signIn(mail: string, pass: string) {
    setError(null);
    setSubmitting(true);
    try {
      const me = await login(mail, pass);
      if (me.role === 'CUSTOMER') {
        logout();
        setError('Đây là tài khoản khách hàng. Khu nội bộ chỉ dành cho nhân viên quầy và quản lý cửa hàng.');
        setSubmitting(false);
        return;
      }
      router.replace(target(me));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đăng nhập chưa được, thử lại sau ít phút.');
      setSubmitting(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Nhập email và mật khẩu được cấp.');
      return;
    }
    void signIn(email.trim(), password);
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Cột trái: giới thiệu khu nội bộ */}
      <section className="bg-roast px-6 py-6 text-cream sm:px-10 lg:py-12">
        <div className="mx-auto flex h-full w-full max-w-lg flex-col justify-between gap-6 lg:gap-10">
          <div className="flex items-center gap-3">
            <span className="font-display text-3xl font-black leading-none">BrewLite</span>
            <span className="border border-cream/50 px-2 py-0.5 font-label text-[11px] uppercase tracking-[0.2em]">Nội bộ</span>
          </div>

          <div>
            <p className="font-label text-xs uppercase tracking-[0.3em] text-cream/60">Sổ quầy · Sổ kho</p>
            <h1 className="mt-3 max-w-lg font-display text-3xl font-black leading-[1.05] sm:text-5xl">Ca làm việc bắt đầu từ đây.</h1>
            <ul className="mt-8 hidden divide-y divide-cream/20 border-y border-cream/20 lg:block">
              {AREAS.map((a) => (
                <li key={a.title} className="py-4">
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-xl font-bold">{a.title}</span>
                    <span className="font-label text-[10px] uppercase tracking-wider text-cream/55">{a.who}</span>
                  </p>
                  <p className="mt-1 text-sm text-cream/70">{a.text}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4 text-sm text-cream/60">
            <p className="hidden lg:block">
              {STORE.address}
              <br />
              Mở cửa {STORE.hours}
            </p>
            <Link href="/" className="font-label text-xs font-semibold uppercase tracking-wider text-cream underline underline-offset-4 hover:text-cream/70">
              ← Về trang của khách
            </Link>
          </div>
        </div>
      </section>

      {/* Cột phải: biểu mẫu */}
      <section className="flex items-center justify-center px-4 py-10 sm:px-10">
        <div className="w-full max-w-md animate-rise space-y-6">
          <div>
            <p className="kicker">Dành cho nhân viên</p>
            <h2 className="mt-1 text-3xl font-black">Đăng nhập nội bộ</h2>
            <p className="mt-1 text-sm text-roast/65">Dùng email và mật khẩu quản lý cửa hàng đã cấp cho bạn.</p>
          </div>

          <form onSubmit={onSubmit} noValidate className="space-y-4 border-2 border-roast bg-cream p-5 sm:p-6">
            {error && (
              <p role="alert" className="flex items-start gap-2 bg-chili/10 px-3 py-2.5 text-sm text-chili">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </p>
            )}
            <label className="block">
              <span className="font-label text-xs uppercase tracking-wider text-roast/70">Email công việc</span>
              <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ten@brewlite.vn" className={field} />
            </label>
            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="internal-password" className="font-label text-xs uppercase tracking-wider text-roast/70">
                  Mật khẩu
                </label>
                <button type="button" onClick={() => setShow((s) => !s)} className="font-label text-[11px] font-semibold text-roast underline underline-offset-2">
                  {show ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
              <input id="internal-password" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center bg-roast font-label text-sm font-semibold uppercase tracking-wider text-cream hover:bg-espresso disabled:cursor-wait disabled:opacity-70"
            >
              {submitting ? 'Đang đăng nhập…' : 'Vào ca làm việc'}
            </button>
            <p className="text-center text-xs text-roast/55">Quên mật khẩu hoặc chưa có tài khoản? Báo quản lý cửa hàng để được cấp lại.</p>
          </form>

          {SHOW_DEMO_HINTS && <QuickLogin title="Đăng nhập nhanh" accounts={DEMO_INTERNAL} onPick={(a) => signIn(a.email, DEMO_PASSWORD)} />}
        </div>
      </section>
    </main>
  );
}
