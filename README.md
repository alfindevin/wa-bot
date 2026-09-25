# WA Bot — Free MVP

MVP chatbot untuk UMKM dengan target biaya awal **Rp0**.

## Fitur
- Web chatbot untuk customer
- Dashboard pengaturan bisnis
- FAQ & katalog produk
- Smart local retrieval (tanpa API AI berbayar)
- Riwayat chat tersimpan di browser
- Batas penggunaan bulanan per tenant
- Struktur API yang mudah diganti ke Gemini / Qwen / DeepSeek / WhatsApp Cloud API nanti

## Stack
- Next.js
- React
- Vercel-compatible
- localStorage untuk MVP data tenant
- Server Route Handler untuk engine chatbot gratis

## Jalankan lokal
```bash
npm install
npm run dev
```

Buka http://localhost:3000

## Deploy
Import repository ini ke Vercel lalu deploy. MVP ini tidak membutuhkan environment variable.

## Catatan
Versi gratis ini belum terhubung ke WhatsApp. Engine saat ini menggunakan pencocokan FAQ/produk berbasis kata kunci sehingga tidak membutuhkan token API. Integrasi AI generatif dan WhatsApp disiapkan sebagai tahap berikutnya.
