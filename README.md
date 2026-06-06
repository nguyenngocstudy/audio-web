# 🎧 Truyện Audio App — Project hoàn chỉnh

Stack: **Next.js 14** · **Neon PostgreSQL** · **Drizzle ORM** · **Cloudflare R2** · **PayOS** · **NextAuth v5** · **Tailwind CSS** · **HLS.js** · **Recharts**

---

## Cấu trúc project

```
src/
├── lib/
│   ├── schema.ts          ← DB schema (users, stories, chapters, progress, unlocks, transactions)
│   ├── db.ts              ← Neon serverless client
│   ├── auth.ts            ← NextAuth v5 (email + Google)
│   ├── r2.ts              ← Cloudflare R2 client
│   ├── payos.ts           ← PayOS client + gói cước
│   ├── admin-stats.ts     ← Queries thống kê dashboard
│   └── utils.ts           ← cn, fmtVnd, fmtDate, GENRE_LABEL...
├── types/
│   └── next-auth.d.ts
├── hooks/
│   └── useAudioPlayer.ts
├── components/
│   ├── ui/                ← Button, Input, Badge
│   ├── audio/             ← AudioPlayer (HLS + Media Session API)
│   ├── story/             ← StoryCard
│   └── layout/            ← Navbar
├── middleware.ts
└── app/
    ├── layout.tsx          ← Root layout + SessionProvider
    ├── globals.css
    ├── (auth)/             ← /login · /register
    ├── (main)/             ← Layout với Navbar
    │   ├── page.tsx        ← Trang chủ · danh sách · filter thể loại
    │   ├── stories/[storyId]/               ← Chi tiết truyện
    │   ├── stories/[storyId]/chapters/[id]/ ← Trang nghe
    │   ├── vip/            ← Mua VIP / coin (4 gói)
    │   ├── vip/success/    ← Cảm ơn sau thanh toán
    │   ├── history/        ← Lịch sử nghe + progress bar
    │   └── profile/        ← Tài khoản + lịch sử giao dịch
    ├── admin/
    │   ├── page.tsx        ← Dashboard: stat cards + 2 charts + top stories + recent txns
    │   ├── stories/        ← CRUD truyện
    │   ├── chapters/       ← CRUD chương + upload audio lên R2
    │   ├── users/          ← Danh sách user + VIP status
    │   ├── transactions/   ← Lịch sử giao dịch + tổng doanh thu
    │   └── settings/       ← Kiểm tra env + hướng dẫn webhook + FFmpeg
    └── api/
        ├── auth/           ← NextAuth handler + register
        ├── progress/       ← Save vị trí nghe (upsert)
        ├── upload/         ← Presigned URL cho R2
        ├── payos/create    ← Tạo link thanh toán PayOS
        ├── payos/webhook   ← Nhận callback · kích hoạt VIP/coin
        └── admin/          ← CRUD stories · CRUD chapters (admin only)
```

---

## Setup từng bước

### 1. Tạo project Next.js mới

```bash
npx create-next-app@latest my-audio-app --typescript --tailwind --eslint --app --src-dir --no-turbopack
cd my-audio-app
```

### 2. Copy toàn bộ file vào project (ghi đè)

Copy tất cả file từ zip này vào thư mục project. Giữ nguyên cấu trúc đường dẫn.

### 3. Cài dependencies

```bash
npm install @neondatabase/serverless drizzle-orm
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install @payos/node next-auth@beta bcryptjs hls.js recharts clsx tailwind-merge
npm install -D drizzle-kit @types/bcryptjs
```

### 4. Tạo .env.local

```bash
cp .env.local.example .env.local
```

Điền đầy đủ:

| Biến | Lấy ở đâu |
|------|-----------|
| `DATABASE_URL` | neon.tech → project → Connection string |
| `AUTH_SECRET` | `openssl rand -hex 32` |
| `R2_ACCOUNT_ID` | Cloudflare Dashboard → Overview → Account ID |
| `R2_ACCESS_KEY_ID` | R2 → Manage API Tokens → Create |
| `R2_SECRET_ACCESS_KEY` | R2 API Token |
| `R2_BUCKET_NAME` | Tên bucket R2 bạn tạo |
| `R2_PUBLIC_URL` | R2 bucket → Settings → Public URL |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Giống R2_PUBLIC_URL |
| `PAYOS_CLIENT_ID` | my.payos.vn → Thông tin tích hợp |
| `PAYOS_API_KEY` | my.payos.vn → Thông tin tích hợp |
| `PAYOS_CHECKSUM_KEY` | my.payos.vn → Thông tin tích hợp |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (dev) hoặc domain thật |
| `NEXTAUTH_URL` | Giống NEXT_PUBLIC_APP_URL |

### 5. Khởi tạo database

```bash
npm run db:push
```

Kiểm tra:
```bash
npm run db:studio   # mở http://local.drizzle.studio
```

### 6. Tạo tài khoản Admin

1. Chạy app: `npm run dev`
2. Đăng ký tại `http://localhost:3000/register`
3. Vào Drizzle Studio → bảng `users` → set `is_admin = true`

### 7. Chạy

```bash
npm run dev
```

Mở:
- `http://localhost:3000` — trang chủ
- `http://localhost:3000/admin` — admin panel
- `http://localhost:3000/login` — đăng nhập

---

## Thêm truyện mới

1. `/admin/stories` → Thêm truyện → điền thông tin → bật Công khai
2. `/admin/chapters` → chọn truyện → Thêm chương
3. Upload file audio (`.m3u8` HLS hoặc `.mp3` để test)
4. Bật Công khai cho chương

## Encode MP3 → HLS (stream hiệu quả hơn)

```bash
# Cài FFmpeg: https://ffmpeg.org/download.html
ffmpeg -i input.mp3 -codec: copy -start_number 0 -hls_time 10 -hls_list_size 0 -f hls output/index.m3u8
```

Upload thư mục `output/` lên R2, dán URL `index.m3u8` vào chương.

---

## Deploy lên Vercel

1. Push code lên GitHub
2. vercel.com → Import repository
3. Điền tất cả biến môi trường
4. Deploy
5. Cập nhật `NEXT_PUBLIC_APP_URL` và `NEXTAUTH_URL` thành domain thật
6. Cấu hình PayOS Webhook: `https://yourdomain.com/api/payos/webhook`

---

## Chi phí ước tính

| Dịch vụ | Chi phí |
|---------|---------|
| Vercel | $0 (free tier) |
| Neon PostgreSQL | $0 (0.5GB free) |
| Cloudflare R2 | $0 (10GB/tháng free) |
| PayOS | $0 phí cố định |
| Domain .vn | ~150.000đ/năm |
| **Tổng** | **~$0 đến khi có user thật** |
