import "server-only";
import type { BusinessContext, ChatMessage } from "@/lib/types";

type GenerateInput = { context: BusinessContext; messages: ChatMessage[] };

function systemPrompt(context: BusinessContext) {
  const products = context.products.filter((p) => p.is_active).map((p) => `- ${p.name}: ${p.price_label || `Rp${p.price}`} — ${p.description}`).join("\n") || "Belum ada data produk.";
  const faqs = context.faqs.map((f) => `T: ${f.question}\nJ: ${f.answer}`).join("\n\n") || "Belum ada FAQ.";
  const knowledge = context.knowledge.map((k) => `${k.title}: ${k.content}`).join("\n") || "Belum ada pengetahuan tambahan.";
  const tone = context.tenant.bot_tone === "professional" ? "profesional dan sopan" : context.tenant.bot_tone === "casual" ? "santai, hangat, dan natural" : "ramah, ringkas, dan membantu";
  return `Anda adalah ${context.tenant.bot_name}, asisten customer service untuk ${context.tenant.name}.
Jawab dalam Bahasa Indonesia dengan gaya ${tone}.
Gunakan HANYA informasi bisnis di bawah ini. Jika informasi tidak tersedia, katakan dengan jujur dan arahkan pelanggan menghubungi admin. Jangan mengarang harga, stok, promo, alamat, atau kebijakan.

PROFIL BISNIS:
${context.tenant.business_profile}

PRODUK:
${products}

FAQ:
${faqs}

PENGETAHUAN TAMBAHAN:
${knowledge}`;
}

function localResponse({ context, messages }: GenerateInput) {
  const question = messages.at(-1)?.content.toLowerCase() || "";
  const faq = context.faqs.find((f) => question.split(/\s+/).some((word) => word.length > 3 && f.question.toLowerCase().includes(word)));
  if (faq) return faq.answer;
  const product = context.products.find((p) => question.includes(p.name.toLowerCase()) || p.name.toLowerCase().split(" ").some((word) => word.length > 3 && question.includes(word)));
  if (product) return `${product.name} tersedia dengan harga ${product.price_label || `Rp${product.price.toLocaleString("id-ID")}`}. ${product.description || ""}`.trim();
  if (/menu|produk|harga|jual|tersedia/.test(question)) {
    return `Produk yang tersedia:\n${context.products.filter(p=>p.is_active).map(p=>`• ${p.name} — ${p.price_label || `Rp${p.price.toLocaleString("id-ID")}`}`).join("\n")}\n\nMau tahu detail produk yang mana?`;
  }
  return `Terima kasih sudah menghubungi ${context.tenant.name}. Informasi itu belum ada di basis pengetahuan kami. Silakan hubungi admin untuk jawaban yang lebih tepat, ya.`;
}

const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";

export async function generateReply(input: GenerateInput) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return { text: localResponse(input), provider: "local-fallback" };
  const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
  // GPT-OSS models reason before answering; keep reasoning short and out of the reply.
  const isReasoningModel = model.startsWith("openai/gpt-oss");
  const reasoning = isReasoningModel ? { reasoning_effort: "low", include_reasoning: false } : {};
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt(input.context) },
        ...input.messages.slice(-10).map((message) => ({ role: message.role, content: message.content })),
      ],
      temperature: 0.25,
      max_completion_tokens: isReasoningModel ? 800 : 350,
      ...reasoning,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`AI provider error (${response.status})`);
  const json = await response.json();
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("AI provider tidak mengembalikan jawaban.");
  return { text, provider: `groq:${model}` };
}
