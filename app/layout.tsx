import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "LanturAI — Chatbot AI untuk bisnis", template: "%s · LanturAI" },
  description: "Chatbot AI multi-bisnis yang menjawab pelanggan dari informasi bisnis Anda.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
