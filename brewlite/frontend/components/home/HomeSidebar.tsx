"use client";

// Cột phải trang nhất: mỗi ô đều bấm được để làm một việc thật
// (lưu mã ưu đãi cho bước thanh toán, thêm món nhanh, xem điểm và quà đổi được)
import Link from "next/link";
import { useState } from "react";
import { useAppStore } from "@/context/app-store";
import { useAuth } from "@/context/auth-context";
import { formatNumber, formatVnd } from "@/lib/format";
import { REWARDS } from "@/lib/mock-data";
import { POINT_VALUE } from "@/lib/pricing";
import TodayPrices from "@/components/menu/TodayPrices";
import { CheckIcon, CopyIcon } from "@/components/ui/Icons";

const PROMO_CODE = "VNPAY20";
const SIGNUP_POINTS = 1250;

export default function HomeSidebar() {
  return (
    <aside className="lg:pl-8" aria-labelledby="prices-title">
      <PromoBox />
      <h2 id="prices-title" className="kicker border-b-2 border-gold pb-1">
        Được gọi nhiều hôm nay
      </h2>
      <TodayPrices />
      <Link
        href="/menu"
        className="mt-3 inline-block font-label text-xs uppercase tracking-wider underline underline-offset-4 hover:text-gold"
      >
        Xem cả thực đơn →
      </Link>
      <MemberBox />
    </aside>
  );
}

function PromoBox() {
  const { savedVoucher, setSavedVoucher, cartCount, hydrated } = useAppStore();
  const [copied, setCopied] = useState(false);
  const saved = hydrated && savedVoucher === PROMO_CODE;

  async function copy() {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Trình duyệt chặn chép: mã vẫn hiện rõ để khách tự chép
    }
  }

  return (
    <div className="postage mb-8">
      <div className="postage-inner relative overflow-hidden p-4">
        {/* Dấu bưu điện và mệnh giá ở góc như tem thư */}
        <div
          className="postmark pointer-events-none absolute -right-3 top-10 grid h-24 w-24 place-items-center text-center font-label text-[9px] font-semibold uppercase leading-tight tracking-widest text-roast/25"
          aria-hidden="true"
        >
          BrewLite
          <br />
          Sài Gòn
          <br />
          2026
        </div>
        <div className="flex items-start justify-between gap-3">
          <p className="kicker">Ưu đãi đang chạy</p>
          <p className="-mt-1 font-display text-3xl font-black leading-none text-gold">
            −20%
          </p>
        </div>
        <p className="relative mt-1 font-display text-2xl font-black leading-tight">
          Trả qua VNPay, giảm 20% mỗi đơn
        </p>
        <p className="relative mt-2 text-sm text-roast/75">
          Giảm tới 25.000đ cho mỗi đơn trả bằng thẻ ATM, thẻ quốc tế hoặc QR.
        </p>

        <div className="relative mt-3 flex items-stretch border-2 border-dashed border-gold bg-[#f7f1e3]">
          <span className="flex flex-1 items-center px-3 font-mono text-lg font-bold tracking-widest text-gold">
            {PROMO_CODE}
          </span>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 border-l-2 border-dashed border-gold px-3 text-xs font-semibold hover:bg-gold/10"
            aria-label="Chép mã ưu đãi"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <CopyIcon className="h-4 w-4" />
            )}
            {copied ? "Đã chép" : "Chép"}
          </button>
        </div>

        {saved ? (
          <div className="mt-3 text-sm">
            <p className="flex items-center gap-1.5 font-semibold text-leaf">
              <CheckIcon className="h-4 w-4" /> Đã lưu mã, sẽ tự áp khi thanh
              toán
            </p>
            <div className="mt-2 flex items-center gap-3">
              <Link
                href={cartCount > 0 ? "/checkout" : "#menu"}
                className="inline-flex h-10 items-center bg-gold px-4 font-label text-xs font-semibold uppercase tracking-wider text-foam hover:bg-gold-deep"
              >
                {cartCount > 0 ? "Đi tới thanh toán" : "Chọn món ngay"}
              </Link>
              <button
                type="button"
                onClick={() => setSavedVoucher(null)}
                className="text-xs underline underline-offset-4 text-roast/60 hover:text-gold"
              >
                Bỏ lưu
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSavedVoucher(PROMO_CODE)}
            className="mt-3 inline-flex h-10 w-full items-center justify-center bg-gold font-label text-xs font-semibold uppercase tracking-wider text-foam hover:bg-gold-deep"
          >
            Dùng mã này cho đơn tới
          </button>
        )}
      </div>
    </div>
  );
}

function MemberBox() {
  const { status, user } = useAuth();

  if (status === "authed" && user) {
    const next = REWARDS.find((r) => r.cost > user.points);
    const ready = REWARDS.filter((r) => r.cost <= user.points);
    const firstName = user.fullName.trim().split(/\s+/).pop();
    return (
      <div className="mt-8 border-2 border-roast p-4">
        <p className="kicker">Điểm của {firstName}</p>
        <p className="mt-1 font-display text-4xl font-black tabular-nums leading-none">
          {formatNumber(user.points)}
        </p>
        <p className="mt-1 text-sm text-roast/75">
          điểm, trừ được {formatVnd(user.points * POINT_VALUE)} vào đơn tới
        </p>
        {ready.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-dotted border-roast/60 pt-3 text-sm">
            {ready.map((r) => (
              <li
                key={r.id}
                className="flex items-baseline justify-between gap-3"
              >
                <span className="flex items-center gap-1.5">
                  <CheckIcon className="h-4 w-4 shrink-0 text-leaf" /> {r.name}
                </span>
                <span className="font-mono text-xs text-roast/60">
                  {r.cost}
                </span>
              </li>
            ))}
          </ul>
        )}
        {next && (
          <p className="mt-3 text-sm text-roast/75">
            Còn{" "}
            <b className="tabular-nums">
              {formatNumber(next.cost - user.points)}
            </b>{" "}
            điểm nữa để đổi {next.name.toLowerCase()}.
          </p>
        )}
        <Link
          href="/account#doi-qua"
          className="mt-3 inline-flex h-10 w-full items-center justify-center border-2 border-roast font-label text-xs font-semibold uppercase tracking-wider hover:bg-roast hover:text-cream"
        >
          {ready.length > 0 ? "Đổi quà ngay" : "Xem quà đổi điểm"}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 border-2 border-roast p-4 text-center">
      <p className="kicker">Thành viên mới</p>
      <p className="mt-1 font-display text-2xl font-black leading-tight">
        Tặng {formatNumber(SIGNUP_POINTS)} điểm khi đăng ký
      </p>
      <p className="mt-2 text-sm text-roast/75">
        Đủ đổi một ly cà phê size S hoặc một bánh croissant bơ ngay đơn đầu
        tiên.
      </p>
      <Link
        href="/register"
        className="mt-3 inline-flex h-11 w-full items-center justify-center bg-roast font-label text-sm font-semibold uppercase tracking-wider text-cream hover:bg-espresso"
      >
        Đăng ký nhận điểm
      </Link>
      <p className="mt-2 text-xs text-roast/65">
        Đã có tài khoản?{" "}
        <Link
          href="/login"
          className="font-semibold underline underline-offset-4 hover:text-gold"
        >
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
