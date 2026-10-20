import { useEffect, useId, useState, type FormEvent } from 'react'
import { maskPhone, submitLead, validators, type Status } from '../lib/form'

type Errors = Partial<Record<'name' | 'email' | 'whatsapp' | 'consent', string>>
type Values = { name: string; email: string; whatsapp: string; size: string; interest: string; consent: boolean }

/**
 * Formulário único da página (Hero e seção final): os mesmos campos, validações e envio nos dois lugares.
 * `hero` usa o cartão de vidro do Hero e empilha os campos; `page` usa o cartão branco da seção e agrupa em duas colunas.
 * `emailId` deixa o CTA do cabeçalho focar o e-mail do Hero.
 */
export function LeadForm({ variant, emailId }: { variant: 'hero' | 'page'; emailId?: string }) {
  const uid = useId()
  const hero = variant === 'hero'
  const [v, setV] = useState<Values>({ name: '', email: '', whatsapp: '', size: '', interest: '', consent: false })
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>('idle')
  const id = (k: string) => (k === 'email' && emailId ? emailId : `${uid}-${k}`)

  // os CTAs com data-interest (ex.: "Entrar na lista de testes") pré-selecionam o interesse do formulário da seção final
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
  const check = (k: keyof Errors, val: Values[keyof Values] = v[k]) => {
    const msg = k === 'consent' ? validators.consent(Boolean(val)) : validators[k](String(val))
    setErrors((e) => ({ ...e, [k]: msg }))
    return !msg
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    const keys: (keyof Errors)[] = ['name', 'email', 'whatsapp', 'consent']
    const results = keys.map((k) => check(k))
    if (!results.every(Boolean)) {
      // foco no primeiro campo com erro (o leitor de tela anuncia a mensagem ligada por aria-describedby)
      document.getElementById(id(keys[results.indexOf(false)]))?.focus()
      return
    }
    setStatus('loading')
    try {
      await submitLead({ origem: hero ? 'hero' : 'form-completo', intencao: 'lista', nome: v.name.trim(), email: v.email.trim(), whatsapp: v.whatsapp, tamanho: v.size, interesse: v.interest, consent: v.consent })
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
        <p className="sub show">Você será avisado na primeira hora do lançamento, pelo e-mail ou WhatsApp informado.</p>
      </div>
    )
  }

  const field = (k: 'name' | 'email' | 'whatsapp', label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="field" data-invalid={Boolean(errors[k])}>
      <label htmlFor={id(k)} className={hero ? 'sr-only' : undefined}>{label}</label>
      <input id={id(k)} {...props} value={v[k]} onBlur={() => check(k)}
        onChange={(e) => set(k, k === 'whatsapp' ? maskPhone(e.target.value) : e.target.value)}
        aria-invalid={Boolean(errors[k])} aria-describedby={errors[k] ? `${id(k)}-e` : undefined} />
      {errors[k] && <span className="err" id={`${id(k)}-e`}>{errors[k]}</span>}
    </div>
  )
  // no cartão da seção, e-mail/WhatsApp e tamanho/interesse vão em duas colunas; no Hero (cartão estreito) só os dois seletores, e os rótulos viram placeholders (o rótulo continua para leitor de tela)
  const row = (children: React.ReactNode, pairInHero = false) => (hero && !pairInHero ? children : <div className="row2">{children}</div>)

  return (
    <form className={cls} noValidate onSubmit={onSubmit} aria-labelledby={`${uid}-t`}>
      <p className="form-title" id={`${uid}-t`}>Seja um dos primeiros a usar o Cerne</p>
      <p className="sub">Receba acesso na primeira hora do lançamento.</p>

      {field('name', 'Nome', { autoComplete: 'name', placeholder: 'Seu nome' })}
      {row(<>
        {field('email', 'E-mail', { type: 'email', autoComplete: 'email', inputMode: 'email', placeholder: 'voce@suafazenda.com.br' })}
        {field('whatsapp', 'WhatsApp', { type: 'tel', autoComplete: 'tel-national', inputMode: 'tel', placeholder: '(00) 00000-0000' })}
      </>)}
      {row(<>
        <div className="field">
          <label htmlFor={id('size')} className={hero ? 'sr-only' : undefined}>Tamanho da operação</label>
          <select id={id('size')} value={v.size} onChange={(e) => set('size', e.target.value)}>
            <option value="">{hero ? 'Tamanho da operação' : 'Selecione'}</option>
            <option value="ate-1000">Até 1.000 cabeças</option>
            <option value="1000-5000">1.000 a 5.000 cabeças</option>
            <option value="acima-5000">Acima de 5.000 cabeças</option>
            <option value="agricultura-outro">Agricultura / outro</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor={id('interest')} className={hero ? 'sr-only' : undefined}>Interesse</label>
          <select id={id('interest')} value={v.interest} onChange={(e) => set('interest', e.target.value)}>
            <option value="">{hero ? 'Interesse' : 'Selecione'}</option>
            <option value="web">Cerne Web</option>
            <option value="app-administracao">App Administração</option>
            <option value="app-operacao">App Operação</option>
            <option value="gb-twin">GB Twin</option>
            <option value="todos">Todos</option>
          </select>
        </div>
      </>, true)}

      <label className="consent">
        <input id={id('consent')} type="checkbox" checked={v.consent} onChange={(e) => { set('consent', e.target.checked); check('consent', e.target.checked) }}
          aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? `${id('consent')}-e` : undefined} />
        <span>Concordo em receber contato da GB Agritech sobre o Cerne, conforme a Política de Privacidade (LGPD).</span>
      </label>
      {errors.consent && <span className="err err-consent" id={`${id('consent')}-e`}>{errors.consent}</span>}

      <button className="btn btn-primary" type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'Enviando…' : 'Quero acesso antecipado'}</button>
      {status === 'error' && <p className="form-msg bad" role="alert">Não foi possível enviar agora. Tente novamente em instantes.</p>}
    </form>
  )
}
