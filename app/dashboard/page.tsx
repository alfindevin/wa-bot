import Link from "next/link";
import { AlertCircle, BarChart3, BookOpen, Bot, Box, Code2, HelpCircle, MessageSquareText, Plus, Send, Sparkles, Store, Trash2, UserCheck, Users } from "lucide-react";
import { Badge, Button, Card, Field } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";
import { DashboardShell } from "@/components/dashboard-shell";
import { getDashboardData } from "@/lib/dashboard-data";
import { requireUser } from "@/lib/auth";
import { getPlan, planCatalog, usagePercent } from "@/lib/plans";
import { rupiah } from "@/lib/utils";
import { addFaq, addKnowledge, addProduct, deleteItem, updateBusiness } from "./actions";

export default async function DashboardPage() {
  await requireUser();
  const data = await getDashboardData();
  const chatUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/c/${data.tenant.slug}`;
  const widgetCode = `<script src="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/widget.js" data-tenant="${data.tenant.slug}" defer></script>`;
  const percent = usagePercent(data.usage, data.tenant.monthly_limit);
  const plan = getPlan(data.tenant.plan);
  const setupItems = [
    { label: "Profil bisnis", done: data.tenant.business_profile.trim().length > 40 },
    { label: "FAQ", done: data.faqs.length > 0 },
    { label: "Produk & harga", done: data.products.length > 0 },
    { label: "Knowledge base", done: data.knowledge.length > 0 },
    { label: "Kontak handover", done: Boolean(data.tenant.handoff_whatsapp) },
  ];
  const setupDone = setupItems.filter((item) => item.done).length;
  const webChannel = data.channels.find((channel) => channel.channel === "web");
  const whatsappChannel = data.channels.find((channel) => channel.channel === "whatsapp");
  const faqDelete = deleteItem.bind(null, "faqs");
  const productDelete = deleteItem.bind(null, "products");
  const knowledgeDelete = deleteItem.bind(null, "knowledge_entries");

  return <DashboardShell tenant={data.tenant} usage={data.usage}><div className="dashboard-content">
    <section id="ringkasan" className="section-anchor">
      <div className="page-intro"><div><h1>Halo, {data.tenant.name}</h1><p>Berikut ringkasan performa chatbot Anda bulan ini.</p></div><Badge tone={data.tenant.allow_public_widget === false ? "neutral" : "success"}>{data.tenant.allow_public_widget === false ? "Chatbot publik nonaktif" : "Chatbot aktif"}</Badge></div>
      <div className="stats-grid">
        <Stat icon={MessageSquareText} label="Total percakapan" value={String(data.conversationCount)} note="Tersimpan aman" />
        <Stat icon={Send} label="Pesan terkirim" value={String(data.messageCount)} note={`${data.usage} pesan AI bulan ini`} />
        <Stat icon={UserCheck} label="Leads terkumpul" value={String(data.analytics.leadCount)} note="Nama dan kontak customer" />
        <Stat icon={AlertCircle} label="Perlu ditangani" value={String(data.analytics.needsHumanCount)} note={`${data.analytics.handoffCount} permintaan handover`} />
      </div>
      <div className="dashboard-grid" style={{marginTop:18}}>
        <Card className="panel"><div className="panel-head"><div><h2>Top pertanyaan customer</h2><p>Pertanyaan yang paling sering muncul.</p></div><BarChart3 size={17} color="var(--purple)"/></div>{data.analytics.topQuestions.length ? data.analytics.topQuestions.map((item,index)=><div className="metric-row" key={item.question}><span className="metric-rank">{index+1}</span><span className="metric-question">{item.question}</span><span className="metric-count">{item.count}×</span></div>) : <p className="subtle">Data akan muncul setelah customer mulai chat.</p>}</Card>
        <Card className="panel"><div className="panel-head"><div><h2>Kesehatan chatbot</h2><p>Kesiapan melayani customer.</p></div><Badge tone={setupDone >= 4 ? "success" : "purple"}>{setupDone}/5 siap</Badge></div><div className="data-list">{setupItems.map((item)=><div className="check-row" key={item.label}><span className={item.done ? "check-dot done" : "check-dot"} />{item.label}</div>)}<div className="data-row"><div><strong>Sisa kuota</strong><p>{data.tenant.monthly_limit-data.usage} dari {data.tenant.monthly_limit} pesan</p></div><Badge tone={percent>85?"neutral":"purple"}>{100-percent}%</Badge></div></div></Card>
      </div>
      <div className="dashboard-grid">
        <Card className="panel"><div className="panel-head"><div><h2>Mulai dari sini</h2><p>Lengkapi chatbot agar jawabannya makin akurat.</p></div><Sparkles size={17} color="var(--purple)"/></div><div className="quick-grid">
          <a href="#profil" className="quick-link"><span><Store size={16}/></span>Lengkapi profil bisnis</a>
          <a href="#faq" className="quick-link"><span><HelpCircle size={16}/></span>Tambah pertanyaan umum</a>
          <a href="#produk" className="quick-link"><span><Box size={16}/></span>Masukkan produk & harga</a>
          <a href={`/c/${data.tenant.slug}`} target="_blank" className="quick-link"><span><Bot size={16}/></span>Uji chatbot sekarang</a>
        </div></Card>
        <Card className="panel"><div className="panel-head"><div><h2>Paket aktif</h2><p>{plan.description}</p></div><Badge tone="purple">{plan.name}</Badge></div><strong style={{fontSize:22}}>{plan.priceLabel}</strong><div className="progress"><div className="progress-bar" style={{width:`${percent}%`}} /></div><p className="subtle">{data.usage} / {data.tenant.monthly_limit} pesan bulan ini. Struktur ini siap disambungkan ke billing sungguhan.</p></Card>
      </div>
    </section>

    <div className="settings-sections" style={{marginTop:22}}>
      <Card className="panel section-anchor" id="profil"><PanelTitle icon={Store} title="Profil & perilaku chatbot" subtitle="Atur identitas bisnis, karakter bot, lead capture, dan handoff."/><form action={updateBusiness} className="stack"><div className="settings-grid"><Field label="Nama bisnis"><input className="input" name="name" defaultValue={data.tenant.name} required/></Field><Field label="Nama asisten"><input className="input" name="bot_name" defaultValue={data.tenant.bot_name} placeholder="Nara" required/></Field><Field label="Gaya bahasa"><select className="select" name="bot_tone" defaultValue={data.tenant.bot_tone}><option value="friendly">Ramah dan membantu</option><option value="professional">Profesional</option><option value="casual">Santai</option></select></Field><Field label="Warna brand"><div style={{display:"flex",gap:8}}><input type="color" name="brand_color" defaultValue={data.tenant.brand_color} style={{width:48,height:43,border:"1px solid var(--line)",borderRadius:10,padding:4}}/><input className="input" defaultValue={data.tenant.brand_color} readOnly/></div></Field></div><Field label="Deskripsi bisnis" hint="Jelaskan lokasi, target pelanggan, gaya layanan, dan hal penting lain."><textarea className="textarea" name="business_profile" defaultValue={data.tenant.business_profile}/></Field><Field label="Pesan sambutan"><input className="input" name="welcome_message" defaultValue={data.tenant.welcome_message}/></Field><div className="settings-grid"><Field label="Nomor WhatsApp admin" hint="Gunakan format negara, contoh: 628123456789"><input className="input" name="handoff_whatsapp" defaultValue={data.tenant.handoff_whatsapp} inputMode="tel"/></Field><Field label="Pertanyaan cepat" hint="Satu pertanyaan per baris, maksimal 6"><textarea className="textarea" name="quick_questions" defaultValue={data.tenant.quick_questions.join("\n")}/></Field></div><label className="data-row" style={{cursor:"pointer"}}><div><strong>Kumpulkan data calon customer</strong><p>Minta nama dan kontak sebelum percakapan dimulai.</p></div><input type="checkbox" name="lead_capture_enabled" defaultChecked={data.tenant.lead_capture_enabled} style={{width:19,height:19,accentColor:"var(--purple)"}}/></label><label className="data-row" style={{cursor:"pointer"}}><div><strong>Aktifkan chatbot publik</strong><p>Matikan jika tenant sedang setup dan belum siap menerima customer.</p></div><input type="checkbox" name="allow_public_widget" defaultChecked={data.tenant.allow_public_widget !== false} style={{width:19,height:19,accentColor:"var(--purple)"}}/></label><Button style={{alignSelf:"flex-start"}}>Simpan perubahan</Button></form></Card>

      <Card className="panel section-anchor" id="faq"><PanelTitle icon={HelpCircle} title="FAQ" subtitle="Pertanyaan yang sering ditanyakan pelanggan."/><form action={addFaq} className="stack"><div className="settings-grid"><Field label="Pertanyaan"><input className="input" name="question" placeholder="Contoh: Jam buka?" required/></Field><Field label="Jawaban"><input className="input" name="answer" placeholder="Setiap hari pukul 08.00–22.00" required/></Field></div><Button style={{alignSelf:"flex-start"}}><Plus size={15}/> Tambah FAQ</Button></form><hr className="divider"/><div className="data-list">{data.faqs.map(item=><div className="data-row" key={item.id}><div><strong>{item.question}</strong><p>{item.answer}</p></div><form action={faqDelete.bind(null,item.id)}><button className="icon-button" aria-label="Hapus FAQ"><Trash2 size={14}/></button></form></div>)}</div></Card>

      <Card className="panel section-anchor" id="produk"><PanelTitle icon={Box} title="Produk & harga" subtitle="Bantu AI merekomendasikan produk yang tepat."/><form action={addProduct} className="stack"><div className="settings-grid"><Field label="Nama produk"><input className="input" name="name" placeholder="Es Kopi Gula Aren" required/></Field><Field label="Harga (angka)"><input className="input" name="price" type="number" min="0" placeholder="22000" required/></Field><Field label="Label harga (opsional)"><input className="input" name="price_label" placeholder="Mulai Rp22.000"/></Field><Field label="Deskripsi"><input className="input" name="description" placeholder="Espresso, susu, dan gula aren"/></Field></div><Button style={{alignSelf:"flex-start"}}><Plus size={15}/> Tambah produk</Button></form><hr className="divider"/><div className="data-list">{data.products.map(item=><div className="data-row" key={item.id}><div><strong>{item.name} · {item.price_label || rupiah(item.price)}</strong><p>{item.description || "Tanpa deskripsi"}</p></div><form action={productDelete.bind(null,item.id)}><button className="icon-button" aria-label="Hapus produk"><Trash2 size={14}/></button></form></div>)}</div></Card>

      <Card className="panel section-anchor" id="knowledge"><PanelTitle icon={BookOpen} title="Knowledge base" subtitle="Kebijakan, lokasi, pembayaran, pengiriman, dan informasi tambahan."/><form action={addKnowledge} className="stack"><Field label="Judul"><input className="input" name="title" placeholder="Kebijakan pengiriman" required/></Field><Field label="Isi pengetahuan"><textarea className="textarea" name="content" placeholder="Pesanan dikirim setiap hari kerja..." required/></Field><Button style={{alignSelf:"flex-start"}}><Plus size={15}/> Tambah pengetahuan</Button></form><hr className="divider"/><div className="data-list">{data.knowledge.map(item=><div className="data-row" key={item.id}><div><strong>{item.title}</strong><p>{item.content}</p></div><form action={knowledgeDelete.bind(null,item.id)}><button className="icon-button" aria-label="Hapus knowledge"><Trash2 size={14}/></button></form></div>)}</div></Card>

      <Card className="panel section-anchor" id="percakapan"><PanelTitle icon={MessageSquareText} title="Percakapan & leads" subtitle="Buka detail chat dan tindak lanjuti calon customer."/><div className="data-list">{data.recentConversations.map(c=><Link href={`/dashboard/conversations/${c.id}`} className="data-row" key={c.id}><div><strong>{c.visitor_name || `Percakapan ${c.id.slice(0,8)}`}</strong><p>{c.visitor_phone || c.visitor_email || `Channel: ${c.channel}`} · {new Date(c.updated_at).toLocaleString("id-ID")}</p></div><Badge tone={c.status==="needs_human"?"purple":c.status==="resolved"?"success":"neutral"}>{c.status==="needs_human"?"Perlu admin":c.status==="resolved"?"Selesai":"Terbuka"}</Badge></Link>)}{!data.recentConversations.length&&<p className="subtle">Belum ada percakapan.</p>}</div></Card>

      <Card className="panel section-anchor" id="paket"><PanelTitle icon={BarChart3} title="Paket & monetisasi" subtitle="Struktur harga siap dipakai untuk jualan manual sebelum billing otomatis."/><div className="plan-grid">{planCatalog.map((item)=><div className={`plan-card ${item.key === data.tenant.plan ? "active" : ""}`} key={item.key}><div><strong>{item.name}</strong><p>{item.description}</p></div><span>{item.priceLabel}</span><small>{item.monthlyLimit.toLocaleString("id-ID")} pesan / bulan</small></div>)}</div><p className="subtle" style={{marginTop:12}}>Upgrade paket bisa kamu atur manual dulu di Supabase. Nanti tinggal disambungkan ke Stripe, Midtrans, atau invoice WhatsApp.</p></Card>

      <Card className="panel section-anchor" id="pengaturan"><PanelTitle icon={Users} title="Publikasi & integrasi" subtitle="Bagikan halaman chat atau pasang bubble chatbot di website mana pun."/><Field label="Link chatbot publik"><div className="copy-box"><code>{chatUrl}</code><CopyButton value={chatUrl}/></div></Field><hr className="divider"/><Field label="Kode embed website" hint="Tempel sebelum tag </body> di website customer."><div className="copy-box"><code>{widgetCode}</code><CopyButton value={widgetCode} label="Salin kode"/></div></Field><div style={{marginTop:18}} className="data-row"><div style={{display:"flex",gap:10,alignItems:"center"}}><span className="stat-icon"><Code2 size={16}/></span><div><strong>{webChannel?.label || "Floating Web Widget"}</strong><p>Responsif, bisa dipasang di website customer, status: {webChannel?.status || "active"}.</p></div></div><Badge tone={data.tenant.allow_public_widget === false ? "neutral" : "success"}>{data.tenant.allow_public_widget === false ? "Nonaktif" : "Aktif"}</Badge></div><div style={{marginTop:10}} className="data-row"><div><strong>{whatsappChannel?.label || "WhatsApp Cloud API"}</strong><p>{data.tenant.handoff_whatsapp ? `Handoff aktif ke +${data.tenant.handoff_whatsapp}. Webhook WhatsApp tinggal ditambahkan.` : "Isi nomor WhatsApp di profil untuk handoff. Integrasi API masih draft."}</p></div><Badge tone={data.tenant.handoff_whatsapp?"purple":"neutral"}>{data.tenant.handoff_whatsapp?"Handoff siap":"Draft"}</Badge></div></Card>
    </div>
  </div></DashboardShell>;
}

function Stat({icon:Icon,label,value,note}:{icon:typeof BarChart3;label:string;value:string;note:string}) { return <Card className="stat"><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={16}/></span></div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></Card>; }
function PanelTitle({icon:Icon,title,subtitle}:{icon:typeof Store;title:string;subtitle:string}) { return <div className="panel-head"><div><h2 style={{display:"flex",alignItems:"center",gap:8}}><Icon size={17} color="var(--purple)"/>{title}</h2><p>{subtitle}</p></div></div>; }
