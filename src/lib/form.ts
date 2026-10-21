/** Lógica compartilhada dos formulários (compacto do Hero e completo). */

export type Status = 'idle' | 'loading' | 'success' | 'error'

const ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT as string | undefined
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export const validators = {
  name: (v: string) => (v.trim().length >= 2 ? '' : 'Informe seu nome.'),
  email: (v: string) => (EMAIL_RE.test(v.trim()) ? '' : 'Informe um e-mail válido.'),
  whatsapp: (v: string) => (v.replace(/\D/g, '').length >= 10 ? '' : 'Informe o WhatsApp com DDD.'),
  consent: (v: boolean) => (v ? '' : 'Aceite para receber nosso contato.'),
}

/** Origem da visita (UTM e referrer), anexada a todo lead para medir canal. */
function attribution() {
  const q = new URLSearchParams(window.location.search)
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid']
  const out: Record<string, string> = {}
  keys.forEach((k) => { const v = q.get(k); if (v) out[k] = v.slice(0, 120) })
  if (document.referrer) out.referrer = document.referrer.slice(0, 200)
  return out
}

/** Envia para VITE_FORM_ENDPOINT (POST JSON). Sem endpoint: mock local em desenvolvimento; em produção falha (nunca finge sucesso). */
export async function submitLead(payload: Record<string, unknown>) {
  const body = { ...payload, ...attribution(), pagina: window.location.pathname }
  if (ENDPOINT) {
    const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) throw new Error(String(res.status))
    return
  }
  if (import.meta.env.PROD) {
    console.error('[Cerne LP] VITE_FORM_ENDPOINT não configurado: o lead não foi enviado.')
    throw new Error('no-endpoint')
  }
  await new Promise((r) => setTimeout(r, 900))
  console.info('[Cerne LP] lead (mock, não enviado):', body)
}

/** WhatsApp comercial (DDI+DDD+número, só dígitos). VITE_WHATSAPP sobrescreve, se preciso trocar sem mexer no código. */
export const WHATSAPP = String(import.meta.env.VITE_WHATSAPP || '5527999745731').replace(/\D/g, '')

export function whatsappHref(text: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`
}
