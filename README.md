# Cổng Bình Chọn Sinh Viên Tiêu Biểu 2026 — FPT Polytechnic Đồng Nai

Ứng dụng bình chọn trực tuyến thời gian thực kèm Cổng Quản Trị CMS (`/admin`) xây dựng cho **Cao đẳng FPT Polytechnic — Cơ sở Đồng Nai**, đã được **tối ưu chuyên sâu cho gói miễn phí Vercel Hobby (`vercel.app`) + Free Cloud PostgreSQL (Neon / Supabase)**.

## Điểm nổi bật đã tối ưu cho Vercel Free (`vercel.app`)
- **Zero-Config Database Auto-Bootstrap**: Tự động khởi tạo bảng (`users`, `candidates`, `votes`, `news_articles`, `uploaded_media`) và nạp dữ liệu mẫu ngay trong lần truy cập đầu tiên khi gắn `DATABASE_URL` / `POSTGRES_URL` mới — không cần chạy lệnh CLI thủ công.
- **Serverless Connection Pooling & SSL**: Giới hạn pool thông minh (`max: 3`, `allowExitOnIdle`), hỗ trợ scale-to-zero của **Neon Free** & **Supabase Pooler**, tự động tương thích SSL trên mọi Cloud PostgreSQL.
- **Upload ảnh `/admin` không cần S3 / Vercel Blob trả phí**: Tự động nén ảnh sang **WebP** ngay trên trình duyệt (~120KB, không bao giờ vượt giới hạn 4.5MB của Vercel Serverless), lưu trữ bền vững trong PostgreSQL và phân phối qua `/api/media/[id]` với `Cache-Control: immutable` trên Vercel Global Edge CDN.
- **Bảo vệ hạn mức Vercel Free (Invocations, GB-Hours & Image Optimization)**:
  - Tự động chuyển từ long-lived SSE sang **Edge-Cached SWR Sync** (`s-maxage` + `stale-while-revalidate` + `revalidateTag`) khi chạy trên Vercel Serverless, không treo Lambda tốn GB-Hours.
  - Tự tạm dừng đồng bộ khi ẩn tab trình duyệt, loại bỏ 100% request kiểm tra lượt vote đối với khách chưa đăng nhập.
  - Định tuyến Serverless Function về cụm **Singapore (`sin1`)** trong `vercel.json` giúp tốc độ phản hồi từ Việt Nam cực nhanh (~40ms).

---

## Hướng dẫn Deploy lên `vercel.app` Miễn Phí (3 phút)

### Bước 1: Đẩy mã nguồn lên GitHub
```bash
git init
git add .
git commit -m "chore: optimize for vercel free deployment"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

### Bước 2: Tạo Database PostgreSQL Miễn Phí (Neon hoặc Supabase)
1. Vào [vercel.com/new](https://vercel.com/new) và **Import** repository GitHub vừa đẩy lên.
2. Trong tab **Storage** trên dự án Vercel (hoặc tại [neon.tech](https://neon.tech) — chọn Region **Singapore `ap-southeast-1`**), tạo 1 database **Neon Postgres (Free Plan)** và bấm **Connect to Project**. Vercel sẽ tự gắn `DATABASE_URL` / `POSTGRES_URL`.

### Bước 3: Khai báo Environment Variables trên Vercel
Vào **Project Settings → Environment Variables**, thêm các biến sau:

| Biến môi trường | Giá trị gợi ý |
| --- | --- |
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL (tự có nếu nối Neon từ Vercel Marketplace) |
| `AUTH_SECRET` | Chuỗi bí mật bất kỳ dài 32+ ký tự (ví dụ chạy `npx auth secret`) |
| `AUTH_TRUST_HOST` | `true` |
| `GOOGLE_CLIENT_ID` | Client ID từ Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Client Secret từ Google Cloud Console |
| `APP_TIMEZONE` | `Asia/Ho_Chi_Minh` |
| `ADMIN_USERNAME` | Tài khoản đăng nhập `/admin` (ví dụ: `admin`) |
| `ADMIN_PASSWORD` | Mật khẩu mạnh cho trang `/admin` |

> **Lưu ý cấu hình Google OAuth 2.0** tại [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials):
> - **Authorized JavaScript origins**: `https://<ten-du-an>.vercel.app`
> - **Authorized redirect URIs**: `https://<ten-du-an>.vercel.app/api/auth/callback/google`

### Bước 4: Deploy & Sử dụng
Bấm **Deploy** (hoặc **Redeploy** sau khi thêm biến môi trường):
- **Trang bình chọn công khai**: `https://<ten-du-an>.vercel.app`
- **Cổng quản trị CMS**: `https://<ten-du-an>.vercel.app/admin`

---

## Chạy thử nghiệm ở máy cá nhân (Local)

```bash
npm install
npm run db:seed   # (Tùy chọn) Khởi tạo lại dữ liệu mẫu trên PostgreSQL local
npm run dev       # Mở http://localhost:3000

# Kiểm tra lint & build chuẩn Production trước khi push lên Vercel:
npm run lint
npm run build
```
