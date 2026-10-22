import { useEffect, useId, useState, type FormEvent } from 'react'
import { maskPhone, submitLead, validators, type Status } from '../lib/form'

type Errors = Partial<Record<'name' | 'email' | 'whatsapp', string>>
type Values = { name: string; email: string; whatsapp: string; interest: string }

const CTA = 'Quero acesso antecipado'
/** Página da Política de Privacidade (página PrivacyApp, rota /privacidade). VITE_PRIVACY_URL troca o endereço, se preciso. */
const PRIVACY_URL = (import.meta.env.VITE_PRIVACY_URL as string | undefined) || '/privacidade'
/** Texto de ciência exibido sob o botão: é registrado junto do lead (prova do que a pessoa viu ao clicar). */
const CONSENT_TEXT = `Ao clicar em "${CTA}", declaro que li e concordo com a Política de Privacidade e autorizo a GB Agritech a entrar em contato por WhatsApp (e por e-mail, se informado) sobre o Cerne.`

/**
 * Formulário único da página (Hero e seção final): só nome, WhatsApp e e-mail opcional, para ter volume e medir interesse.
 * `hero` usa o cartão de vidro do Hero e empilha os campos; `page` usa o cartão branco da seção (WhatsApp e e-mail lado a lado).
 * `focusId` deixa o CTA do cabeçalho focar o primeiro campo do Hero.
 * Ciência/consentimento: sem caixa a marcar; o aviso fica sob o botão e vale ao enviar (a ação de clicar é a manifestação).
 */
export function LeadForm({ variant, focusId }: { variant: 'hero' | 'page'; focusId?: string }) {
  const uid = useId()
  const hero = variant === 'hero'
  const [v, setV] = useState<Values>({ name: '', email: '', whatsapp: '', interest: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>('idle')
  const id = (k: string) => (k === 'name' && focusId ? focusId : `${uid}-${k}`)

  // os CTAs com data-interest (ex.: "Entrar na lista de testes") registram o interesse do lead no formulário da seção final
  useEffect(() => {
    if (hero) return
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('[data-interest]') as HTMLElement | null
      if (a) setV((s) => ({ ...s, interest: a.dataset.interest ?? '' }))
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [hero])

  const set = <K extends keyof Values>(k: K, val: Values[K]) => setV((s) => ({ ...s, [k]: val }))
  const check = (k: keyof Errors) => {
    const msg = validators[k](v[k])
    setErrors((e) => ({ ...e, [k]: msg }))
    return !msg
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    const keys: (keyof Errors)[] = ['name', 'whatsapp', 'email']
    const results = keys.map((k) => check(k))
    if (!results.every(Boolean)) {
      // foco no primeiro campo com erro (o leitor de tela anuncia a mensagem ligada por aria-describedby)
      document.getElementById(id(keys[results.indexOf(false)]))?.focus()
      return
    }
    setStatus('loading')
    try {
      await submitLead({
        origem: hero ? 'hero' : 'form-completo', intencao: 'lista', nome: v.name.trim(), whatsapp: v.whatsapp, email: v.email.trim(), interesse: v.interest,
        consent: true, consentTexto: CONSENT_TEXT, consentEm: new Date().toISOString(),
      })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const cls = hero ? 'form' : 'form big'
  if (status === 'success') {
    return (
      <div className={cls} role="status">
        <p className="form-title">Pronto, seu acesso está reservado.</p>
        <p className="sub show">Você será avisado na primeira hora do lançamento, pelo WhatsApp informado.</p>
      </div>
    )
  }

  const field = (k: keyof Errors, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="field" data-invalid={Boolean(errors[k])}>
      <label htmlFor={id(k)} className={hero ? 'sr-only' : undefined}>{label}</label>
      <input id={id(k)} {...props} value={v[k]} onBlur={() => check(k)}
        onChange={(e) => set(k, k === 'whatsapp' ? maskPhone(e.target.value) : e.target.value)}
        aria-invalid={Boolean(errors[k])} aria-describedby={errors[k] ? `${id(k)}-e` : undefined} />
      {errors[k] && <span className="err" id={`${id(k)}-e`}>{errors[k]}</span>}
    </div>
  )
  const whatsapp = field('whatsapp', 'WhatsApp', { type: 'tel', autoComplete: 'tel-national', inputMode: 'tel', placeholder: 'WhatsApp com DDD', required: true })
  const email = field('email', 'E-mail (opcional)', { type: 'email', autoComplete: 'email', inputMode: 'email', placeholder: 'E-mail (opcional)' })

  return (
    <form className={cls} noValidate onSubmit={onSubmit} aria-labelledby={`${uid}-t`}>
      <p className="form-title" id={`${uid}-t`}>Seja um dos primeiros a usar o Cerne</p>
      <p className="sub">Receba acesso na primeira hora do lançamento.</p>

      {field('name', 'Nome', { autoComplete: 'name', placeholder: 'Seu nome', required: true })}
      {hero ? <>{whatsapp}{email}</> : <div className="row2">{whatsapp}{email}</div>}

      <button className="btn btn-primary" type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'Enviando…' : CTA}</button>
      <p className="legal-note">
        Ao clicar em “{CTA}”, declaro que li e concordo com a <a href={PRIVACY_URL} target="_blank" rel="noreferrer">Política de Privacidade</a> e autorizo a GB Agritech a entrar em contato por WhatsApp (e por e-mail, se informado) sobre o Cerne.
      </p>
      {status === 'error' && <p className="form-msg bad" role="alert">Não foi possível enviar agora. Tente novamente em instantes.</p>}
    </form>
  )
}
