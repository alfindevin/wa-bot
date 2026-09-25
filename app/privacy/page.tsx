import Link from "next/link";
import { Brand } from "@/components/brand";

export const metadata = { title: "Kebijakan Privasi" };

export default function PrivacyPage() {
  return <><nav className="container site-nav"><Brand/><Link href="/" className="button button-secondary">Kembali</Link></nav><main className="legal-page container"><span className="eyebrow">Terakhir diperbarui 25 September 2026</span><h1>Kebijakan Privasi</h1><p>LanturAI membantu bisnis menjawab pertanyaan pelanggan melalui chatbot. Dokumen ini menjelaskan data yang dapat diproses ketika layanan digunakan.</p>
    <h2>Data yang dikumpulkan</h2><p>Chatbot dapat menyimpan nama, email, nomor telepon, isi percakapan, waktu interaksi, dan channel yang digunakan. Informasi teknis seperti alamat IP hanya diproses sementara dalam bentuk hash untuk mencegah spam.</p>
    <h2>Tujuan penggunaan</h2><p>Data digunakan untuk memberikan jawaban, memungkinkan bisnis menindaklanjuti permintaan, menampilkan histori percakapan, menghitung penggunaan layanan, serta menjaga keamanan sistem.</p>
    <h2>Akses data</h2><p>Setiap bisnis hanya dapat mengakses data tenant miliknya. Data dipisahkan menggunakan kebijakan akses database. Penyedia AI dapat memproses isi pesan ketika integrasi AI diaktifkan oleh pemilik bisnis.</p>
    <h2>Penyimpanan dan penghapusan</h2><p>Pemilik bisnis bertanggung jawab menentukan masa penyimpanan yang sesuai. Pelanggan dapat meminta koreksi atau penghapusan data dengan menghubungi bisnis yang menyediakan chatbot.</p>
    <h2>Catatan untuk pemilik layanan</h2><p>Ini adalah template awal, bukan nasihat hukum. Sebelum digunakan untuk pelanggan berbayar, sesuaikan nama badan usaha, kontak, lokasi pemrosesan data, periode retensi, serta ketentuan penyedia pihak ketiga.</p>
  </main></>;
}
