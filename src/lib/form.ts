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

/** Envia para VITE_FORM_ENDPOINT (POST JSON). Sem endpoint: mock local, nada sai do navegador. */
export async function submitLead(payload: Record<string, unknown>) {
  if (ENDPOINT) {
    const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) throw new Error(String(res.status))
    return
  }
  await new Promise((r) => setTimeout(r, 900))
  console.info('[Cerne LP] lead (mock, não enviado):', payload)
}
