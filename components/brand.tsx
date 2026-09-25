import { Bot } from "lucide-react";
import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="Lantur AI">
      <span className="brand-mark"><Bot size={20} strokeWidth={2.4} /></span>
      {!compact && <span>Lantur<span className="brand-accent">AI</span></span>}
    </Link>
  );
}
