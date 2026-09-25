# LanturAI — MVP chatbot AI multi-tenant

MVP SaaS chatbot untuk banyak bisnis, dibuat dengan Next.js, Supabase, Vercel, dan Gemini API. Aplikasi bisa langsung dijalankan dalam **demo mode tanpa akun atau API key**. Setelah Supabase dihubungkan, autentikasi, penyimpanan, RLS, histori, dan kuota tenant akan aktif.

## Fitur

- Landing page SaaS dan web chat responsif
- Dashboard admin untuk profil bisnis, FAQ, produk/harga, dan knowledge base
- Supabase Auth (email/password) dengan sesi berbasis cookie
- Multi-tenant: semua data memiliki `tenant_id` dan dilindungi RLS
- Histori percakapan dan pesan
- Kuota pesan bulanan atomik per tenant
- Gemini API opsional; fallback berbasis knowledge tetap bekerja tanpa AI key
- Channel model (`web`, `whatsapp`, `api`) agar mudah ditambah WhatsApp Cloud API
- Demo mode tanpa database untuk presentasi awal

## Menjalankan sekarang (Rp0)

Persyaratan: Node.js 20.9 atau lebih baru.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`. Dengan `NEXT_PUBLIC_DEMO_MODE=true`, dashboard demo ada di `/dashboard` dan chatbot demo di `/c/demo`.

## Setup Supabase Free

1. Buat project gratis di [Supabase](https://database.new/).
2. Buka **SQL Editor**, salin seluruh isi file migration di `supabase/migrations/`, lalu jalankan sekali.
3. Di **Authentication → Providers → Email**, aktifkan Email. Untuk demo cepat, Anda dapat menonaktifkan email confirmation; untuk publik sebaiknya tetap aktif.
4. Di **Authentication → URL Configuration** isi:
   - Site URL lokal: `http://localhost:3000`
   - Redirect URL lokal: `http://localhost:3000/**`
   - Setelah deploy, tambahkan `https://DOMAIN-VERCEL-ANDA.vercel.app/**`
5. Ambil URL project, publishable key, dan secret key dari **Project Settings → API**.
6. Isi `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
SUPABASE_SECRET_KEY=sb_secret_xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=false
```

`SUPABASE_SECRET_KEY` hanya boleh dipakai di server. Jangan mengubah namanya menjadi `NEXT_PUBLIC_*` dan jangan commit `.env.local`.

## Setup Gemini API (opsional, free tier bila tersedia)

1. Buat API key di [Google AI Studio](https://aistudio.google.com/apikey).
2. Tambahkan ke `.env.local`:

```dotenv
GEMINI_API_KEY=xxxxx
GEMINI_MODEL=gemini-2.5-flash-lite
```

Tanpa key, aplikasi tetap runnable dan menjawab dengan pencarian sederhana dari FAQ/produk. Ketersediaan model dan batas free tier ditentukan oleh Google dan dapat berubah. Jangan gunakan data pelanggan sensitif pada provider free tier tanpa meninjau ketentuan pemrosesan datanya.

## Verifikasi lokal

```bash
npm run typecheck
npm run lint
npm run build
npm start
```

Alur tes:

1. Daftar akun di `/login`.
2. Buat workspace di `/onboarding`.
3. Isi profil, FAQ, produk, dan knowledge di `/dashboard`.
4. Buka link `/c/slug-bisnis`, kirim pesan, lalu cek histori/usage di dashboard.
5. Buat akun kedua dan pastikan akun itu tidak bisa membaca data tenant pertama.

## Deploy Vercel Free

1. Push folder ini ke repository GitHub.
2. Import repository di [Vercel](https://vercel.com/new).
3. Framework akan terdeteksi sebagai Next.js. Build command: `npm run build`.
4. Tambahkan semua environment variable dari `.env.example` di **Project Settings → Environment Variables** untuk Production dan Preview.
5. Ubah `NEXT_PUBLIC_APP_URL` menjadi URL produksi, lalu redeploy.
6. Tambahkan URL produksi ke Supabase Auth Redirect URLs seperti pada langkah setup.

Untuk demo tanpa backend, cukup set `NEXT_PUBLIC_DEMO_MODE=true`. Untuk data sungguhan, set `false` dan isi ketiga variable Supabase.

## Arsitektur

```text
Browser customer
  └─ /c/[slug] → POST /api/chat
                     ├─ validasi tenant + kuota atomik
                     ├─ simpan user message
                     ├─ rakit context bisnis
                     ├─ Gemini/local fallback
                     └─ simpan assistant message

Browser admin
  └─ Supabase Auth cookie → Server Actions → Postgres + RLS
```

Setiap baris bisnis memiliki `tenant_id`. Dashboard memakai user session dan RLS. Endpoint customer memakai secret key hanya di server karena pengunjung publik tidak boleh diberi akses langsung ke tabel.

## Menambahkan WhatsApp Cloud API nanti

Fondasi yang sudah ada:

- `conversations.channel` menerima `whatsapp`
- `conversations.external_id` dapat menyimpan nomor/ID percakapan Meta
- `tenants.channel_config` menyimpan status channel (jangan simpan access token mentah di sini)
- Logika AI terpisah di `lib/ai/provider.ts`

Tahap berikutnya adalah menambah `app/api/webhooks/whatsapp/route.ts`, verifikasi signature Meta, memetakan `phone_number_id` ke tenant, lalu meneruskan pesan ke service chat bersama. Simpan token WhatsApp terenkripsi/di environment atau secret manager, bukan di browser/database terbuka.

## Batas MVP

- Satu owner dapat memiliki beberapa tenant, tetapi dashboard saat ini membuka tenant pertama.
- Belum ada billing, undangan tim, upload dokumen, embedding/vector search, handoff agent, atau WhatsApp.
- Demo mode menyimpan tampilan chat di `localStorage`; persistence server aktif setelah Supabase dikonfigurasi.
- Untuk produksi berbayar, tambahkan CAPTCHA/rate limit per IP, observability, backup, retention policy, dan moderasi konten.

## Struktur utama

```text
app/
  api/chat/             endpoint customer
  c/[slug]/             web chatbot publik
  dashboard/            admin + server actions
  login/ onboarding/    auth dan pembuatan tenant
lib/
  ai/provider.ts        adapter Gemini/fallback
  supabase/             browser, server, admin clients
supabase/migrations/    schema, RLS, index, fungsi kuota
```
