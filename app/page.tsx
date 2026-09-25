import Link from "next/link";
import { ArrowRight, BarChart3, Bot, Check, Database, Globe2, MessageSquareText, Send, ShieldCheck, Store } from "lucide-react";
import { Brand } from "@/components/brand";

const features = [
  { icon: Store, title: "Satu dashboard per bisnis", copy: "Profil, produk, harga, FAQ, dan pengetahuan setiap bisnis tersimpan terpisah." },
  { icon: MessageSquareText, title: "Jawaban otomatis 24/7", copy: "AI menjawab berdasarkan informasi yang Anda masukkan, bukan menebak-nebak." },
  { icon: Database, title: "Histori percakapan", copy: "Setiap percakapan tersimpan agar Anda bisa memahami pertanyaan pelanggan." },
  { icon: BarChart3, title: "Limit yang terkendali", copy: "Atur kuota pesan per tenant dan pantau penggunaan bulanan dari dashboard." },
  { icon: ShieldCheck, title: "Data terisolasi", copy: "Row Level Security menjaga setiap admin hanya dapat melihat data bisnisnya." },
  { icon: Globe2, title: "Siap multi-channel", copy: "Mulai dari web gratis, lalu hubungkan WhatsApp Cloud API saat bisnis sudah siap." },
];

export default function Home() {
  return (
    <>
      <nav className="container site-nav">
        <Brand />
        <div className="nav-links">
          <a href="#fitur">Fitur</a><a href="#cara-kerja">Cara kerja</a><a href="#harga">Harga</a>
          <Link href="/login" className="button button-secondary">Masuk</Link>
          <Link href="/dashboard" className="button button-primary">Coba gratis</Link>
        </div>
      </nav>
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <span className="eyebrow"><span className="eyebrow-dot" /> Dibuat untuk UMKM Indonesia</span>
              <h1>Customer bertanya.<br /><span className="text-gradient">AI yang menjawab.</span></h1>
              <p className="hero-copy">Ubah informasi bisnis Anda menjadi chatbot pintar yang siap melayani pelanggan kapan pun—tanpa coding dan bisa mulai gratis.</p>
              <div className="hero-actions">
                <Link href="/dashboard" className="button button-primary button-lg">Buat chatbot gratis <ArrowRight size={17} /></Link>
                <Link href="/c/demo" className="button button-secondary button-lg">Lihat demo langsung</Link>
              </div>
              <div className="hero-note"><span>Tanpa kartu kredit</span><span>Setup 5 menit</span><span>Web chat gratis</span></div>
            </div>
            <div style={{ position: "relative" }}>
              <div className="product-window">
                <div className="window-bar"><span className="window-dot" /><span className="window-dot" /><span className="window-dot" /></div>
                <div className="mock-chat">
                  <div className="mock-head"><span className="avatar"><Bot size={19} /></span><div><strong style={{display:"block",fontSize:13}}>Asisten Kopi Senandika</strong><span className="online">Online sekarang</span></div></div>
                  <div className="mock-messages">
                    <div className="bubble bubble-ai">Halo! Selamat datang di Kopi Senandika ☕ Ada yang bisa aku bantu?</div>
                    <div className="bubble bubble-user">Ada menu kopi yang nggak terlalu manis?</div>
                    <div className="bubble bubble-ai">Ada! Kamu bisa coba <strong>Manual Brew V60</strong> mulai Rp28.000. Rasanya clean dan tanpa gula. Mau tahu pilihan beans hari ini?</div>
                  </div>
                  <div className="mock-input"><span>Ketik pesan...</span><Send size={16} color="#6d5dfb" /></div>
                </div>
              </div>
              <div className="mini-float float-one">⚡ Jawaban &lt; 3 detik</div>
              <div className="mini-float float-two"><Check size={14} color="#18a873" /> 98% pertanyaan terjawab</div>
            </div>
          </div>
        </section>
        <section className="section section-soft" id="fitur">
          <div className="container">
            <div className="section-heading"><span className="eyebrow">Semua yang dibutuhkan</span><h2>Terlihat simpel di depan.<br />Kuat di belakang.</h2><p>Dari data bisnis hingga percakapan pelanggan, semuanya sudah disiapkan untuk menjadi produk SaaS yang bisa Anda jual.</p></div>
            <div className="feature-grid">{features.map(({ icon: Icon, title, copy }) => <div className="card feature" key={title}><span className="feature-icon"><Icon size={21} /></span><h3>{title}</h3><p>{copy}</p></div>)}</div>
          </div>
        </section>
        <section className="section" id="cara-kerja">
          <div className="container"><div className="section-heading"><span className="eyebrow">Tiga langkah</span><h2>Dari kosong hingga siap melayani</h2></div><div className="feature-grid">
            {[["01","Buat workspace","Daftarkan bisnis dan pilih alamat chatbot Anda."],["02","Isi pengetahuan","Tambahkan profil, FAQ, produk, harga, dan informasi penting."],["03","Bagikan link","Pasang link di bio, website, atau QR code dan mulai menerima chat."]].map(([n,t,c])=><div className="feature" key={n}><span className="eyebrow">{n}</span><h3 style={{marginTop:18}}>{t}</h3><p>{c}</p></div>)}
          </div></div>
        </section>
        <section className="section" id="harga"><div className="container"><div className="cta-card"><div><h2>Mulai dengan Rp0. Validasi dulu, scale kemudian.</h2><p>Free-tier friendly untuk demo, UMKM awal, dan mendapatkan pelanggan pertama.</p></div><Link href="/dashboard" className="button button-secondary button-lg">Mulai sekarang <ArrowRight size={17}/></Link></div></div></section>
      </main>
      <footer className="footer"><div className="container footer-inner"><Brand /><span>© 2026 LanturAI. MVP chatbot multi-tenant.</span><span><Link href="/privacy">Privasi</Link> · Next.js · Supabase · Gemini</span></div></footer>
    </>
  );
}
