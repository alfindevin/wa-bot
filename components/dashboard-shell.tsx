import Link from "next/link";
import { Bell, BookOpen, Box, HelpCircle, LayoutDashboard, LogOut, MessageSquareText, Settings, Store, UserRound } from "lucide-react";
import { Brand } from "@/components/brand";
import { initials } from "@/lib/utils";
import { usagePercent } from "@/lib/plans";
import type { Tenant } from "@/lib/types";
import { signOut } from "@/app/dashboard/actions";

const links = [
  ["Ringkasan", "/dashboard#ringkasan", LayoutDashboard], ["Profil bisnis", "/dashboard#profil", Store], ["FAQ", "/dashboard#faq", HelpCircle], ["Produk", "/dashboard#produk", Box], ["Knowledge", "/dashboard#knowledge", BookOpen], ["Percakapan", "/dashboard#percakapan", MessageSquareText], ["Paket", "/dashboard#paket", LayoutDashboard], ["Pengaturan", "/dashboard#pengaturan", Settings],
] as const;

export function DashboardShell({ tenant, usage, children }: { tenant: Tenant; usage: number; children: React.ReactNode }) {
  const percent = usagePercent(usage, tenant.monthly_limit);
  return <div className="dashboard">
    <aside className="sidebar"><Brand />
      <div className="workspace"><span className="workspace-avatar">{initials(tenant.name)}</span><div><strong>{tenant.name}</strong><span>{tenant.plan} workspace</span></div></div>
      <nav className="sidebar-nav">{links.map(([label,href,Icon], i)=><Link className={`side-link ${i===0?"active":""}`} href={href} key={href}><Icon size={16}/><span>{label}</span></Link>)}</nav>
      <div className="side-foot"><div className="usage-mini"><strong>Penggunaan bulanan</strong><div className="progress"><div className="progress-bar" style={{width:`${percent}%`}} /></div><span>{usage} / {tenant.monthly_limit} pesan</span></div><form action={signOut}><button className="side-link" style={{border:0,background:"transparent",width:"100%",marginTop:8,cursor:"pointer"}}><LogOut size={16}/><span>Keluar</span></button></form></div>
    </aside>
    <main className="dashboard-main"><header className="topbar"><span className="topbar-title">Dashboard</span><div className="top-actions"><a className="button button-secondary" href={`/c/${tenant.slug}`} target="_blank">Lihat chatbot ↗</a><span className="icon-button"><Bell size={16}/></span><span className="icon-button"><UserRound size={16}/></span></div></header>{children}</main>
  </div>;
}
