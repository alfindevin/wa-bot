import Link from "next/link";
import { ArrowLeft, Mail, MessageCircle, Phone, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { DashboardShell } from "@/components/dashboard-shell";
import { demoBusiness } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/env";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateConversationStatus } from "../../actions";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  let tenant = demoBusiness.tenant;
  let usage = 127;
  let conversation = { id, visitor_name: "Dina", visitor_email: "dina@example.com", visitor_phone: "628123400001", channel: "web", status: "open", created_at: "2026-09-25T09:20:00.000Z", updated_at: "2026-09-25T10:00:00.000Z" };
  let messages = [
    { id:"m1", role:"user", content:"Halo, apakah ada tempat untuk meeting 6 orang?", created_at:"2026-09-25T09:20:00.000Z" },
    { id:"m2", role:"assistant", content:"Halo Dina! Ada area meja besar yang nyaman untuk 6 orang. Untuk memastikan tempat tersedia, reservasi minimal H-1 ya.", created_at:"2026-09-25T09:21:00.000Z" },
    { id:"m3", role:"user", content:"Boleh dibantu reservasi untuk besok jam 2?", created_at:"2026-09-25T09:22:00.000Z" },
  ];

  if (!isDemoMode) {
    const supabase = await createClient();
    const { data: tenantData } = await supabase.from("tenants").select("id,name,slug,business_profile,welcome_message,brand_color,monthly_limit,plan,bot_name,bot_tone,handoff_whatsapp,lead_capture_enabled,quick_questions").order("created_at").limit(1).single();
    if (!tenantData) notFound(); tenant = tenantData;
    const month = new Date().toISOString().slice(0,7)+"-01";
    const [{data: conversationData},{data: messageData},{data: usageData}] = await Promise.all([
      supabase.from("conversations").select("id,visitor_name,visitor_email,visitor_phone,channel,status,created_at,updated_at").eq("id",id).eq("tenant_id",tenant.id).single(),
      supabase.from("messages").select("id,role,content,created_at").eq("conversation_id",id).eq("tenant_id",tenant.id).order("created_at"),
      supabase.from("monthly_usage").select("message_count").eq("tenant_id",tenant.id).eq("month",month).maybeSingle(),
    ]);
    if (!conversationData) notFound();
    conversation = conversationData;
    messages = messageData || [];
    usage = usageData?.message_count || 0;
  }

  const status = conversation.status as "open"|"needs_human"|"resolved";
  return <DashboardShell tenant={tenant} usage={usage}><div className="dashboard-content"><div className="page-intro"><div><Link href="/dashboard#percakapan" className="subtle" style={{display:"inline-flex",alignItems:"center",gap:5,marginBottom:12}}><ArrowLeft size={13}/> Kembali ke dashboard</Link><h1>{conversation.visitor_name || "Pengunjung anonim"}</h1><p>Percakapan melalui {conversation.channel} · {new Date(conversation.created_at).toLocaleString("id-ID")}</p></div><Badge tone={status==="needs_human"?"purple":status==="resolved"?"success":"neutral"}>{status==="needs_human"?"Perlu admin":status==="resolved"?"Selesai":"Terbuka"}</Badge></div>
    <div className="conversation-layout"><Card className="panel"><div className="panel-head"><div><h2>Isi percakapan</h2><p>{messages.length} pesan tersimpan.</p></div></div><div className="conversation-thread">{messages.map(message=><div className={`chat-bubble ${message.role === "assistant" ? "assistant" : "user"}`} key={message.id}>{message.content}<span className="chat-time">{message.role === "assistant" ? tenant.bot_name : conversation.visitor_name || "Customer"} · {new Date(message.created_at).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}</span></div>)}{!messages.length&&<p className="subtle">Belum ada pesan.</p>}</div></Card>
      <div className="conversation-meta"><Card className="panel"><div className="panel-head"><div><h2>Data lead</h2><p>Kontak untuk tindak lanjut.</p></div></div><Meta icon={UserRound} label="Nama" value={conversation.visitor_name || "Tidak diisi"}/><Meta icon={Phone} label="WhatsApp" value={conversation.visitor_phone || "Tidak diisi"}/><Meta icon={Mail} label="Email" value={conversation.visitor_email || "Tidak diisi"}/>{conversation.visitor_phone&&<a className="button button-primary" style={{width:"100%",marginTop:14}} href={`https://wa.me/${conversation.visitor_phone}`} target="_blank"><MessageCircle size={15}/> Hubungi lead</a>}</Card>
      <Card className="panel"><div className="panel-head"><div><h2>Status penanganan</h2><p>Tandai agar tim tahu tindak lanjutnya.</p></div></div><div className="stack"><StatusButton id={id} status="open" current={status} label="Tandai terbuka"/><StatusButton id={id} status="needs_human" current={status} label="Perlu ditangani admin"/><StatusButton id={id} status="resolved" current={status} label="Tandai selesai"/></div></Card></div>
    </div></div></DashboardShell>;
}

function Meta({icon:Icon,label,value}:{icon:typeof UserRound;label:string;value:string}) { return <div className="meta-item"><span style={{display:"flex",alignItems:"center",gap:5}}><Icon size={12}/>{label}</span><strong>{value}</strong></div>; }
function StatusButton({id,status,current,label}:{id:string;status:"open"|"needs_human"|"resolved";current:string;label:string}) { const action=updateConversationStatus.bind(null,id,status); return <form action={action}><button className={`button ${current===status?"button-primary":"button-secondary"}`} style={{width:"100%"}} disabled={current===status}>{label}</button></form>; }
