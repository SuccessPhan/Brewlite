import type { Metadata } from 'next';
import Article from '@/components/layout/Article';
import { STORE } from '@/lib/mock-data';

export const metadata: Metadata = { title: 'Liên hệ – BrewLite', description: `Địa chỉ, giờ mở cửa và cách liên hệ ${STORE.name}.` };

const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE.address)}`;

const FAQ = [
  { q: 'Tôi đã trả tiền nhưng đơn vẫn "chờ thanh toán"?', a: 'Vào Lịch sử giao dịch, mở giao dịch đó và bấm "Kiểm tra lại với VNPay". BrewLite sẽ hỏi lại VNPay và cập nhật đơn.' },
  { q: 'Thanh toán thất bại có bị trừ tiền không?', a: 'Không. Đơn chuyển sang "thanh toán lỗi", giỏ hàng được giữ nguyên và bạn có thể thanh toán lại với một lần thanh toán mới.' },
  { q: 'Huỷ đơn thế nào?', a: 'Đơn chưa thanh toán huỷ được ngay ở trang theo dõi đơn; món được trả lại kho cho khách khác đặt.' },
  { q: 'Quên mã đơn khi tới quầy?', a: 'Mở mục Đơn của tôi trên web, mã đơn nằm ngay đầu trang theo dõi đơn.' },
];

export default function ContactPage() {
  return (
    <Article kicker="Hộp thư toà soạn" title="Liên hệ và hỏi đáp" lead="Ghé quầy, gọi điện hoặc gửi thư. Phần lớn câu hỏi về đơn hàng có lời đáp ngay bên dưới.">
      <div className="grid gap-6 sm:grid-cols-2">
        <section className="border-2 border-roast p-5">
          <h2 className="kicker">Quầy nhận món</h2>
          <p className="mt-2 font-display text-2xl font-bold leading-tight">{STORE.name}</p>
          <p className="mt-1">{STORE.address}</p>
          <p className="mt-1">Mở cửa hằng ngày {STORE.hours}</p>
          <a href={MAP_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block font-label text-xs uppercase tracking-wider underline underline-offset-4 hover:text-gold">
            Mở bản đồ chỉ đường ↗
          </a>
        </section>
        <section className="border-2 border-roast p-5">
          <h2 className="kicker">Thư từ, góp ý</h2>
          <dl className="mt-2 space-y-2">
            <div>
              <dt className="font-label text-xs uppercase tracking-wider text-roast/60">Email</dt>
              <dd>
                <a href="mailto:hotro@brewlite.vn" className="underline underline-offset-4 hover:text-gold">
                  hotro@brewlite.vn
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-label text-xs uppercase tracking-wider text-roast/60">Thời gian trả lời</dt>
              <dd>Trong giờ mở cửa, thường dưới 1 ngày</dd>
            </div>
            <div>
              <dt className="font-label text-xs uppercase tracking-wider text-roast/60">Khi gửi, nhớ ghi</dt>
              <dd>Mã đơn (ví dụ BL123456) và email tài khoản</dd>
            </div>
          </dl>
        </section>
      </div>

      <h2 className="mt-12 border-t-[3px] border-double border-roast pt-4 text-3xl font-black">Hỏi đáp</h2>
      <div className="mt-2">
        {FAQ.map((f) => (
          <details key={f.q} className="group border-b border-roast py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold">
              {f.q}
              <span className="font-mono text-xl text-gold transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-roast/80">{f.a}</p>
          </details>
        ))}
      </div>
    </Article>
  );
}
