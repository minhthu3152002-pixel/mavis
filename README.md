# Mavis nè 🐹

Web app "thú cưng ảo" — bé hamster Mavis nhắc anh uống nước, ăn cơm, và nói lời thương.
Vite + React, cài như app qua **Add to Home Screen** (PWA).

## Chạy thử ở máy
```bash
npm install
npm run dev
```
Mở link hiện ra (thường http://localhost:5173).

## Deploy lên Vercel (miễn phí)
1. Đẩy thư mục này lên một repo GitHub.
2. Vào https://vercel.com → **Add New → Project** → chọn repo.
3. Vercel tự nhận Vite. Cứ bấm **Deploy** (không cần chỉnh gì).
4. Xong sẽ có link dạng `https://mavis-....vercel.app`.

## Cài như app trên điện thoại
- **iPhone (Safari):** mở link → nút Share → *Thêm vào MH chính*.
- **Android (Chrome):** mở link → menu ⋮ → *Cài đặt ứng dụng / Thêm vào MH chính*.

## Đổi nội dung
- Câu nói mỗi hoạt động: sửa mảng `lines` trong `src/App.jsx`.
- Ảnh hamster: thay file trong `src/assets/hamsters/`.
- Giờ nhắc uống nước: sửa `WATER_TIMES` trong `src/App.jsx`.
Thời tiết dùng Open-Meteo, không cần API key.
