import { BarChart3, BookOpen, Bot, Box, Copy, HelpCircle, MessageSquareText, Plus, Send, Sparkles, Store, Trash2, Users } from "lucide-react";
import { Badge, Button, Card, Field } from "@/components/ui";
import { DashboardShell } from "@/components/dashboard-shell";
import { getDashboardData } from "@/lib/dashboard-data";
import { requireUser } from "@/lib/auth";
import { rupiah } from "@/lib/utils";
import { addFaq, addKnowledge, addProduct, deleteItem, updateBusiness } from "./actions";

export default async function DashboardPage() {
  await requireUser();
  const data = await getDashboardData();
  const chatUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/c/${data.tenant.slug}`;
  const percent = Math.min(100, Math.round((data.usage / data.tenant.monthly_limit) * 100));
  const faqDelete = deleteItem.bind(null, "faqs");
  const productDelete = deleteItem.bind(null, "products");
  const knowledgeDelete = deleteItem.bind(null, "knowledge_entries");

  return <DashboardShell tenant={data.tenant} usage={data.usage}><div className="dashboard-content">
    <section id="ringkasan" className="section-anchor">
      <div className="page-intro"><div><h1>Halo, {data.tenant.name} 👋</h1><p>Berikut ringkasan performa chatbot Anda bulan ini.</p></div><Badge tone="success">● Chatbot aktif</Badge></div>
      <div className="stats-grid">
        <Stat icon={MessageSquareText} label="Total percakapan" value={String(data.conversationCount)} note="Tersimpan aman" />
        <Stat icon={Send} label="Pesan terkirim" value={String(data.messageCount)} note={`${data.usage} pesan AI bulan ini`} />
        <Stat icon={BarChart3} label="Kuota terpakai" value={`${percent}%`} note={`${data.tenant.monthly_limit-data.usage} pesan tersisa`} />
        <Stat icon={BookOpen} label="Sumber pengetahuan" value={String(data.faqs.length+data.products.length+data.knowledge.length)} note="FAQ, produk & knowledge" />
      </div>
      <div className="dashboard-grid">
        <Card className="panel"><div className="panel-head"><div><h2>Mulai dari sini</h2><p>Lengkapi chatbot agar jawabannya makin akurat.</p></div><Sparkles size={17} color="var(--purple)"/></div><div className="quick-grid">
          <a href="#profil" className="quick-link"><span><Store size={16}/></span>Lengkapi profil bisnis</a>
          <a href="#faq" className="quick-link"><span><HelpCircle size={16}/></span>Tambah pertanyaan umum</a>
          <a href="#produk" className="quick-link"><span><Box size={16}/></span>Masukkan produk & harga</a>
          <a href={`/c/${data.tenant.slug}`} target="_blank" className="quick-link"><span><Bot size={16}/></span>Uji chatbot sekarang</a>
        </div></Card>
        <Card className="panel"><div className="panel-head"><div><h2>Aktivitas terbaru</h2><p>Interaksi pelanggan terkini.</p></div></div><div className="activity-list">{data.recentConversations.length ? data.recentConversations.map((item)=><div className="activity" key={item.id}><span className="activity-dot"/><div><strong>{item.visitor_name || "Pengunjung anonim"}</strong><p>Chat melalui {item.channel}</p><time>{new Date(item.updated_at).toLocaleString("id-ID",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</time></div></div>) : <p className="subtle">Belum ada percakapan. Bagikan link chatbot untuk mulai.</p>}</div></Card>
      </div>
    </section>

    <div className="settings-sections" style={{marginTop:22}}>
      <Card className="panel section-anchor" id="profil"><PanelTitle icon={Store} title="Profil bisnis" subtitle="Informasi utama yang digunakan AI saat menjawab."/><form action={updateBusiness} className="stack"><div className="settings-grid"><Field label="Nama bisnis"><input className="input" name="name" defaultValue={data.tenant.name} required/></Field><Field label="Warna brand"><div style={{display:"flex",gap:8}}><input type="color" name="brand_color" defaultValue={data.tenant.brand_color} style={{width:48,height:43,border:"1px solid var(--line)",borderRadius:10,padding:4}}/><input className="input" defaultValue={data.tenant.brand_color} readOnly/></div></Field></div><Field label="Deskripsi bisnis" hint="Jelaskan lokasi, target pelanggan, gaya layanan, dan hal penting lain."><textarea className="textarea" name="business_profile" defaultValue={data.tenant.business_profile}/></Field><Field label="Pesan sambutan"><input className="input" name="welcome_message" defaultValue={data.tenant.welcome_message}/></Field><Button style={{alignSelf:"flex-start"}}>Simpan perubahan</Button></form></Card>

      <Card className="panel section-anchor" id="faq"><PanelTitle icon={HelpCircle} title="FAQ" subtitle="Pertanyaan yang sering ditanyakan pelanggan."/><form action={addFaq} className="stack"><div className="settings-grid"><Field label="Pertanyaan"><input className="input" name="question" placeholder="Contoh: Jam buka?" required/></Field><Field label="Jawaban"><input className="input" name="answer" placeholder="Setiap hari pukul 08.00–22.00" required/></Field></div><Button style={{alignSelf:"flex-start"}}><Plus size={15}/> Tambah FAQ</Button></form><hr className="divider"/><div className="data-list">{data.faqs.map(item=><div className="data-row" key={item.id}><div><strong>{item.question}</strong><p>{item.answer}</p></div><form action={faqDelete.bind(null,item.id)}><button className="icon-button" aria-label="Hapus FAQ"><Trash2 size={14}/></button></form></div>)}</div></Card>

      <Card className="panel section-anchor" id="produk"><PanelTitle icon={Box} title="Produk & harga" subtitle="Bantu AI merekomendasikan produk yang tepat."/><form action={addProduct} className="stack"><div className="settings-grid"><Field label="Nama produk"><input className="input" name="name" placeholder="Es Kopi Gula Aren" required/></Field><Field label="Harga (angka)"><input className="input" name="price" type="number" min="0" placeholder="22000" required/></Field><Field label="Label harga (opsional)"><input className="input" name="price_label" placeholder="Mulai Rp22.000"/></Field><Field label="Deskripsi"><input className="input" name="description" placeholder="Espresso, susu, dan gula aren"/></Field></div><Button style={{alignSelf:"flex-start"}}><Plus size={15}/> Tambah produk</Button></form><hr className="divider"/><div className="data-list">{data.products.map(item=><div className="data-row" key={item.id}><div><strong>{item.name} · {item.price_label || rupiah(item.price)}</strong><p>{item.description || "Tanpa deskripsi"}</p></div><form action={productDelete.bind(null,item.id)}><button className="icon-button" aria-label="Hapus produk"><Trash2 size={14}/></button></form></div>)}</div></Card>

      <Card className="panel section-anchor" id="knowledge"><PanelTitle icon={BookOpen} title="Knowledge base" subtitle="Kebijakan, lokasi, pembayaran, pengiriman, dan informasi tambahan."/><form action={addKnowledge} className="stack"><Field label="Judul"><input className="input" name="title" placeholder="Kebijakan pengiriman" required/></Field><Field label="Isi pengetahuan"><textarea className="textarea" name="content" placeholder="Pesanan dikirim setiap hari kerja..." required/></Field><Button style={{alignSelf:"flex-start"}}><Plus size={15}/> Tambah pengetahuan</Button></form><hr className="divider"/><div className="data-list">{data.knowledge.map(item=><div className="data-row" key={item.id}><div><strong>{item.title}</strong><p>{item.content}</p></div><form action={knowledgeDelete.bind(null,item.id)}><button className="icon-button" aria-label="Hapus knowledge"><Trash2 size={14}/></button></form></div>)}</div></Card>

      <Card className="panel section-anchor" id="percakapan"><PanelTitle icon={MessageSquareText} title="Percakapan" subtitle="Histori terbaru dari seluruh channel."/><div className="data-list">{data.recentConversations.map(c=><div className="data-row" key={c.id}><div><strong>{c.visitor_name || `Percakapan ${c.id.slice(0,8)}`}</strong><p>Channel: {c.channel} · {new Date(c.updated_at).toLocaleString("id-ID")}</p></div><Badge>{c.channel}</Badge></div>)}{!data.recentConversations.length&&<p className="subtle">Belum ada percakapan.</p>}</div></Card>

      <Card className="panel section-anchor" id="pengaturan"><PanelTitle icon={Users} title="Publikasi & integrasi" subtitle="Bagikan chatbot sekarang; tambah channel lain nanti."/><Field label="Link chatbot publik"><div className="copy-box"><code>{chatUrl}</code><Copy size={15}/></div></Field><div style={{marginTop:18}} className="data-row"><div><strong>Web Chat</strong><p>Aktif dan siap digunakan tanpa biaya channel.</p></div><Badge tone="success">Aktif</Badge></div><div style={{marginTop:10}} className="data-row"><div><strong>WhatsApp Cloud API</strong><p>Struktur channel sudah disiapkan. Hubungkan saat sudah siap menggunakan nomor bisnis.</p></div><Badge>Segera</Badge></div></Card>
    </div>
  </div></DashboardShell>;
}

function Stat({icon:Icon,label,value,note}:{icon:typeof BarChart3;label:string;value:string;note:string}) { return <Card className="stat"><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={16}/></span></div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></Card>; }
function PanelTitle({icon:Icon,title,subtitle}:{icon:typeof Store;title:string;subtitle:string}) { return <div className="panel-head"><div><h2 style={{display:"flex",alignItems:"center",gap:8}}><Icon size={17} color="var(--purple)"/>{title}</h2><p>{subtitle}</p></div></div>; }
