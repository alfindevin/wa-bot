import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { Button, Field } from "@/components/ui";
import { isDemoMode } from "@/lib/env";
import { requireUser } from "@/lib/auth";
import { createWorkspace } from "./actions";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{error?: string}> }) {
  if (isDemoMode) redirect("/dashboard");
  await requireUser();
  const { error } = await searchParams;
  return <div className="auth-page"><aside className="auth-aside"><Brand /><div className="auth-quote"><span className="eyebrow">Langkah 1 dari 1</span><h2>Kenalkan bisnis Anda.</h2><p>Informasi ini menjadi fondasi chatbot. Semuanya dapat diubah lagi dari dashboard.</p></div><small style={{color:"#bcb6e4"}}>Setup awal kurang dari 2 menit.</small></aside><main className="auth-main"><div className="auth-box"><h1>Buat workspace</h1><p>Satu workspace untuk satu brand atau bisnis.</p><form action={createWorkspace} className="stack">
    <Field label="Nama bisnis"><input className="input" name="name" placeholder="Contoh: Kopi Senandika" required /></Field>
    <Field label="Alamat chatbot" hint="Hanya huruf kecil, angka, dan tanda hubung"><div style={{display:"flex",alignItems:"center"}}><span className="input" style={{width:"auto",borderRadius:"11px 0 0 11px",background:"#f5f4f8",color:"var(--muted)"}}>/c/</span><input className="input" style={{borderRadius:"0 11px 11px 0",marginLeft:-1}} name="slug" placeholder="kopi-senandika" minLength={3} required /></div></Field>
    <Field label="Tentang bisnis" hint="Deskripsikan produk, pelanggan, dan karakter layanan Anda."><textarea className="textarea" name="profile" placeholder="Kami adalah kedai kopi lokal di Bandung..." /></Field>
    {error && <div className="form-message">{error}</div>}<Button type="submit">Buat workspace</Button>
  </form></div></main></div>;
}
