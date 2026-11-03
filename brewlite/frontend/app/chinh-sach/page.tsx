import type { Metadata } from 'next';
import Article from '@/components/layout/Article';

export const metadata: Metadata = { title: 'Chính sách – BrewLite', description: 'Chính sách đổi trả, hoàn tiền, bảo mật thông tin và điều khoản sử dụng BrewLite.' };

const SECTIONS = [
  {
    id: 'doi-tra',
    title: 'Đổi trả và hoàn tiền',
    items: [
      'Đơn chưa thanh toán: huỷ miễn phí bất kỳ lúc nào ở trang theo dõi đơn.',
      'Đơn đã thanh toán nhưng quầy chưa pha: liên hệ quầy để được huỷ và hoàn tiền về phương thức đã trả.',
      'Món pha sai so với đơn: quầy pha lại miễn phí khi bạn báo ngay tại quầy.',
      'Lỡ trả hai lần cho cùng một đơn (ví dụ mở hai tab VNPay): giao dịch thứ hai được đánh dấu "cần hoàn tiền" và được hoàn lại.',
      'Bản hiện tại chạy trên môi trường thử VNPay sandbox: không có tiền thật nào bị trừ.',
    ],
  },
  {
    id: 'bao-mat',
    title: 'Bảo mật thông tin',
    items: [
      'BrewLite chỉ lưu họ tên, email, lịch sử đơn và điểm thưởng. Mật khẩu được băm bằng bcrypt, không ai đọc được, kể cả quản trị viên.',
      'BrewLite không lưu số thẻ. Thông tin thẻ chỉ nhập trên trang của VNPay.',
      'Mỗi tài khoản chỉ xem được đơn và giao dịch của chính mình. Nhân viên quầy chỉ thấy tên khách và món cần pha.',
      'Kết quả thanh toán được kiểm chữ ký số của VNPay trước khi ghi nhận, nên không thể sửa đường dẫn để giả kết quả.',
      'Đăng nhập sai liên tục sẽ bị tạm chặn để chống dò mật khẩu.',
    ],
  },
  {
    id: 'dieu-khoan',
    title: 'Điều khoản sử dụng',
    items: [
      'Giá và tồn kho hiển thị theo thời gian thực; giá cuối cùng là giá máy chủ tính lúc tạo đơn.',
      'Mỗi đơn áp dụng tối đa một mã giảm giá; mã có điều kiện riêng ghi ở mục Ưu đãi.',
      'Điểm thưởng chỉ cộng khi đơn thanh toán thành công và không quy đổi thành tiền mặt.',
      'BrewLite có thể khoá tài khoản dùng công cụ tự động để đặt đơn hoặc dò mã giảm giá.',
    ],
  },
];

export default function PolicyPage() {
  return (
    <Article kicker="Văn bản" title="Chính sách và điều khoản" lead="Viết ngắn, đọc một lần là hiểu. Áp dụng cho mọi đơn đặt trên BrewLite.">
      <nav aria-label="Mục lục chính sách" className="mb-8 flex flex-wrap gap-x-6 gap-y-2 text-sm uppercase">
        {SECTIONS.map((s, i) => (
          <a key={s.id} href={`#${s.id}`} className="underline underline-offset-4 hover:text-gold">
            {i + 1}. {s.title}
          </a>
        ))}
      </nav>
      {SECTIONS.map((s, i) => (
        <section key={s.id} id={s.id} className="scroll-mt-16 border-t-[3px] border-double border-roast pb-8 pt-4">
          <h2 className="text-2xl font-black">
            <span className="text-gold">Điều {i + 1}.</span> {s.title}
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-6 marker:font-mono marker:text-roast/60">
            {s.items.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
        </section>
      ))}
    </Article>
  );
}
