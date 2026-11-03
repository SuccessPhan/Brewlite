import type { Metadata } from 'next';
import Link from 'next/link';
import Article from '@/components/layout/Article';
import { AUTH_IMAGE, photo } from '@/lib/images';
import { STORE } from '@/lib/mock-data';

export const metadata: Metadata = { title: 'Câu chuyện – BrewLite', description: 'BrewLite ra đời để khách không phải xếp hàng hai lần mỗi sáng.' };

export default function StoryPage() {
  return (
    <Article
      kicker="Phóng sự"
      title="Chuyện hai hàng người trước một quầy cà phê"
      lead="Giờ cao điểm, khách xếp hàng một lần để gọi món và trả tiền, rồi thêm một lần nữa để chờ lấy ly. BrewLite ra đời để bỏ hàng thứ nhất."
    >
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo(AUTH_IMAGE, 1200)} alt="Rót sữa vào ly cà phê" className="newsprint aspect-[21/9] w-full object-cover" />
        <figcaption className="mt-1.5 font-label text-[11px] uppercase tracking-wider text-roast/60">Ảnh minh hoạ</figcaption>
      </figure>
      <div className="mt-6 gap-8 sm:columns-2">
        <p className="first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:font-black first-letter:leading-[0.8]">
          Quầy {STORE.name} nằm trên trục đường đông sinh viên. Bảy giờ sáng và mười hai giờ trưa, nhân viên vừa ghi món vừa thu tiền mặt, dễ nhầm món, nhầm tiền thối, và quán không biết trước món nào sắp hết.
        </p>
        <p className="mt-3">
          BrewLite chuyển việc gọi món và trả tiền lên điện thoại. Khách chọn món, chọn size và topping, thấy giá ngay; trả qua cổng VNPay hoặc bằng điểm tích luỹ. Quầy chỉ nhận đơn đã thanh toán và pha theo thứ tự.
        </p>
        <p className="mt-3">
          Phía sau là những thứ khách không thấy: máy chủ tự tính lại tiền thay vì tin giá từ trình duyệt, mỗi lần bấm thanh toán có một khoá chống trùng để không trừ tiền hai lần, và tồn kho được giữ đúng khi nhiều người đặt cùng một món còn ít.
        </p>
        <p className="mt-3">
          Dữ liệu được rào kỹ: ứng dụng kết nối cơ sở dữ liệu bằng một tài khoản chỉ được đọc, ghi dữ liệu, không thể xoá bảng; cơ sở dữ liệu tự từ chối số âm cho tồn kho, điểm và tiền.
        </p>
      </div>
      <blockquote className="my-8 border-y-[3px] border-double border-roast py-5 text-center font-display text-2xl font-bold italic leading-snug sm:text-3xl">
        “Pha đúng lúc khách tới, không bắt khách đứng chờ để trả tiền.”
      </blockquote>
      <p>
        BrewLite là đồ án môn Công nghệ Phần mềm tại Trường Đại học Sài Gòn, làm theo quy trình Scrum, dùng Next.js, NestJS và PostgreSQL. Cổng thanh toán chạy ở môi trường thử của VNPay nên không có tiền thật nào bị trừ.
      </p>
      <Link href="/menu" className="mt-6 inline-flex h-11 items-center bg-gold px-6 font-label text-sm font-semibold uppercase tracking-wider text-foam hover:bg-gold-deep">
        Xem thực đơn
      </Link>
    </Article>
  );
}
