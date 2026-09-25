import Link from "next/link";
import { Brand } from "@/components/brand";

export default function NotFound() { return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:30,textAlign:"center"}}><div><Brand/><h1 style={{fontSize:70,margin:"45px 0 5px"}}>404</h1><p className="subtle">Halaman atau chatbot tidak ditemukan.</p><Link href="/" className="button button-primary" style={{marginTop:16}}>Kembali ke beranda</Link></div></main>; }
