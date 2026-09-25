import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const source = `(() => {
  const script = document.currentScript;
  const tenant = script && script.dataset.tenant;
  if (!tenant || !/^[a-z0-9-]+$/.test(tenant) || document.getElementById('lantur-ai-widget')) return;
  const origin = ${JSON.stringify(origin)};
  const side = script.dataset.position === 'left' ? 'left' : 'right';
  const color = /^#[0-9a-f]{6}$/i.test(script.dataset.color || '') ? script.dataset.color : '#6d5dfb';
  const host = document.createElement('div'); host.id = 'lantur-ai-widget';
  const shadow = host.attachShadow({mode:'open'});
  const style = document.createElement('style');
  style.textContent = ':host{all:initial}.wrap{position:fixed;bottom:22px;'+side+':22px;z-index:2147483000;font-family:Arial,sans-serif}.frame{display:none;width:min(390px,calc(100vw - 28px));height:min(650px,calc(100vh - 100px));border:0;border-radius:20px;box-shadow:0 20px 70px rgba(25,20,55,.25);background:#fff;margin-bottom:12px}.frame.open{display:block}.button{width:58px;height:58px;border:0;border-radius:18px;background:'+color+';color:white;box-shadow:0 10px 30px rgba(50,40,120,.3);font-size:25px;cursor:pointer;display:block;margin-left:auto}.label{position:absolute;right:70px;bottom:13px;background:#fff;color:#262238;padding:9px 12px;border-radius:10px;box-shadow:0 8px 26px rgba(30,25,60,.16);font-size:12px;font-weight:700;white-space:nowrap}.open~.label{display:none}@media(max-width:500px){.wrap{bottom:10px;'+side+':10px}.frame{width:calc(100vw - 20px);height:calc(100vh - 88px)}}';
  const wrap = document.createElement('div'); wrap.className = 'wrap';
  const frame = document.createElement('iframe'); frame.className = 'frame'; frame.title = 'Customer service chat'; frame.loading = 'lazy'; frame.src = origin + '/embed/' + encodeURIComponent(tenant);
  const button = document.createElement('button'); button.className = 'button'; button.type = 'button'; button.setAttribute('aria-label','Buka chatbot'); button.textContent = '✦';
  const label = document.createElement('span'); label.className = 'label'; label.textContent = script.dataset.label || 'Ada yang bisa dibantu?';
  button.addEventListener('click', () => { const open = frame.classList.toggle('open'); button.textContent = open ? '×' : '✦'; button.setAttribute('aria-label', open ? 'Tutup chatbot' : 'Buka chatbot'); });
  wrap.append(frame,label,button); shadow.append(style,wrap); document.body.appendChild(host);
})();`;
  return new Response(source, { headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "public, max-age=3600", "Access-Control-Allow-Origin": "*", "X-Content-Type-Options": "nosniff" } });
}
