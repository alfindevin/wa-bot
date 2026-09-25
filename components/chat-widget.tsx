"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, MessageCircle, RotateCcw, Send, ShieldCheck } from "lucide-react";
import type { ChatMessage, Tenant } from "@/lib/types";
import { initials } from "@/lib/utils";

export function ChatWidget({ tenant }: { tenant: Tenant }) {
  const storageKey = `lantur-chat-${tenant.slug}`;
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: tenant.welcome_message }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState("");
  const [visitor, setVisitor] = useState({ name: "", email: "", phone: "" });
  const [leadReady, setLeadReady] = useState(!tenant.lead_capture_enabled);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    const savedVisitor = localStorage.getItem(`${storageKey}-visitor`);
    const session = localStorage.getItem(`${storageKey}-session`) || crypto.randomUUID();
    localStorage.setItem(`${storageKey}-session`, session);
    const timer = window.setTimeout(() => {
      setSessionToken(session);
      if (saved) { try { setMessages(JSON.parse(saved)); } catch {} }
      if (savedVisitor) { try { setVisitor(JSON.parse(savedVisitor)); setLeadReady(true); } catch {} }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [storageKey]);
  useEffect(() => { if (sessionToken) localStorage.setItem(storageKey, JSON.stringify(messages.slice(-30))); endRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages, sessionToken, storageKey]);

  async function send(text = input) {
    const clean = text.trim(); if (!clean || loading || !sessionToken) return;
    const userMessage: ChatMessage = { role: "user", content: clean }; setMessages((current)=>[...current,userMessage]); setInput(""); setLoading(true);
    try {
      const response = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ slug:tenant.slug, sessionToken, message:clean, history:messages.slice(-8), visitor }) });
      const data = await response.json();
      setMessages((current)=>[...current,{role:"assistant",content:data.reply || data.error || "Maaf, terjadi kesalahan."}]);
    } catch { setMessages((current)=>[...current,{role:"assistant",content:"Koneksi terputus. Silakan coba lagi."}]); }
    finally { setLoading(false); }
  }
  function reset() { localStorage.removeItem(storageKey); const session=crypto.randomUUID(); localStorage.setItem(`${storageKey}-session`,session); setSessionToken(session); setMessages([{role:"assistant",content:tenant.welcome_message}]); }

  function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!visitor.name.trim() || (!visitor.email.trim() && !visitor.phone.trim())) return;
    localStorage.setItem(`${storageKey}-visitor`, JSON.stringify(visitor));
    setLeadReady(true);
  }

  if (!leadReady) return <div className="chat-shell" style={{"--chat-brand":tenant.brand_color} as React.CSSProperties}>
    <header className="chat-header"><span className="avatar" style={{background:tenant.brand_color}}>{initials(tenant.name)}</span><div className="chat-header-info"><strong>{tenant.bot_name} · {tenant.name}</strong><span className="online">Asisten AI online</span></div></header>
    <main className="lead-gate"><span className="lead-icon" style={{background:tenant.brand_color}}><MessageCircle size={25}/></span><h2>Mulai percakapan</h2><p>Isi data singkat agar tim {tenant.name} dapat membantu jika diperlukan.</p><form onSubmit={submitLead} className="stack lead-form">
      <label className="field"><span className="field-label">Nama</span><input className="input" value={visitor.name} onChange={(e)=>setVisitor({...visitor,name:e.target.value})} placeholder="Nama Anda" maxLength={100} required/></label>
      <label className="field"><span className="field-label">Nomor WhatsApp</span><input className="input" value={visitor.phone} onChange={(e)=>setVisitor({...visitor,phone:e.target.value})} placeholder="08xxxxxxxxxx" inputMode="tel" maxLength={20}/></label>
      <label className="field"><span className="field-label">Email <span className="subtle">(opsional)</span></span><input className="input" value={visitor.email} onChange={(e)=>setVisitor({...visitor,email:e.target.value})} placeholder="nama@email.com" type="email" maxLength={254}/></label>
      <button className="button button-primary" disabled={!visitor.name.trim() || (!visitor.email.trim() && !visitor.phone.trim())}>Mulai chat</button>
      <span className="privacy-note"><ShieldCheck size={12}/> Data digunakan untuk menindaklanjuti percakapan. <a href="/privacy" target="_blank">Privasi</a></span>
    </form></main>
  </div>;

  return <div className="chat-shell" style={{"--chat-brand":tenant.brand_color} as React.CSSProperties}>
    <header className="chat-header"><span className="avatar" style={{background:tenant.brand_color}}>{initials(tenant.name)}</span><div className="chat-header-info"><strong>{tenant.bot_name} · {tenant.name}</strong><span className="online">Asisten AI online</span></div>{tenant.handoff_whatsapp && <a className="icon-button" href={`https://wa.me/${tenant.handoff_whatsapp}?text=${encodeURIComponent(`Halo ${tenant.name}, saya ingin melanjutkan percakapan dengan admin.`)}`} target="_blank" rel="noreferrer" title="Hubungi admin via WhatsApp"><MessageCircle size={15}/></a>}<button className="icon-button" onClick={reset} title="Mulai chat baru"><RotateCcw size={15}/></button></header>
    <main className="chat-body">{messages.map((message,index)=><div className={`chat-bubble ${message.role}`} key={`${index}-${message.content.slice(0,8)}`}>{message.content}<span className="chat-time">{message.role === "assistant" ? "Asisten AI" : "Anda"}</span></div>)}
      {messages.length===1 && <div className="suggestions">{tenant.quick_questions.map(text=><button className="suggestion" onClick={()=>send(text)} key={text}>{text}</button>)}<button className="suggestion suggestion-primary" onClick={()=>send("Saya ingin bicara dengan admin")}>Bicara dengan admin</button></div>}
      {loading && <div className="chat-bubble assistant"><span className="typing"><i/><i/><i/></span></div>}<div ref={endRef}/></main>
    <form className="chat-form" onSubmit={(event)=>{event.preventDefault();send();}}><div className="chat-input-wrap"><input className="chat-input" value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Tulis pertanyaan Anda..." maxLength={1500} autoFocus/><button className="send-button" disabled={loading || !input.trim()} aria-label="Kirim pesan"><Send size={17}/></button></div><div className="powered"><Bot size={9} style={{verticalAlign:"middle"}}/> Didukung oleh LanturAI · AI dapat membuat kesalahan</div></form>
  </div>;
}
