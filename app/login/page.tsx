"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button, Field } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function submit(formData: FormData) {
    setLoading(true); setMessage("");
    try {
      const supabase = createClient();
      const email = String(formData.get("email"));
      const password = String(formData.get("password"));
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) { setMessage("Cek email Anda untuk mengonfirmasi akun, lalu masuk."); return; }
        router.push("/onboarding");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(new URLSearchParams(window.location.search).get("next") || "/dashboard");
        router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Terjadi kesalahan. Coba lagi.");
    } finally { setLoading(false); }
  }

  return <div className="auth-page">
    <aside className="auth-aside"><Brand /><div className="auth-quote"><span className="eyebrow"><Sparkles size={13}/> AI customer service</span><h2>Bisnis kecil juga pantas punya layanan pelanggan yang hebat.</h2><p>Bangun asisten AI yang mengenal produk Anda dan siap menjawab setiap saat.</p></div><small style={{color:"#bcb6e4"}}>Satu platform. Banyak bisnis. Data tetap terpisah.</small></aside>
    <main className="auth-main"><div className="auth-box">
      <Link href="/" className="subtle">← Kembali ke beranda</Link>
      <h1>{mode === "login" ? "Selamat datang kembali" : "Buat akun gratis"}</h1>
      <p>{mode === "login" ? "Masuk untuk mengelola chatbot bisnis Anda." : "Tidak perlu kartu kredit. Selesai dalam beberapa menit."}</p>
      <form action={submit} className="stack">
        <Field label="Email"><input className="input" name="email" type="email" placeholder="nama@bisnis.com" required /></Field>
        <Field label="Password" hint="Minimal 8 karakter"><input className="input" name="password" type="password" minLength={8} placeholder="••••••••" required /></Field>
        {message && <div className="form-message">{message}</div>}
        <Button type="submit" disabled={loading}>{loading ? "Memproses..." : mode === "login" ? "Masuk" : "Buat akun"}<ArrowRight size={16}/></Button>
      </form>
      <p style={{textAlign:"center",fontSize:13,marginTop:22}}>{mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"} <button className="button button-ghost" style={{padding:4,color:"var(--purple)"}} onClick={()=>setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Daftar gratis" : "Masuk"}</button></p>
      {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && <Link href="/dashboard" className="button button-secondary" style={{width:"100%",marginTop:10}}>Buka dashboard demo</Link>}
    </div></main>
  </div>;
}
