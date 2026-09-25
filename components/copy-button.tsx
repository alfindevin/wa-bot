"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ value, label = "Salin" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(()=>setCopied(false), 1600);
  }
  return <button type="button" className="button button-secondary" onClick={copy}>{copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? "Tersalin" : label}</button>;
}
