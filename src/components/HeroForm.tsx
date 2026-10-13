import { useId, useState, type FormEvent } from 'react'
import { maskPhone, submitLead, validators, type Status } from '../lib/form'

type Errors = Partial<Record<'email' | 'whatsapp' | 'consent', string>>

export function HeroForm({ emailId }: { emailId: string }) {
  const uid = useId()
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>('idle')

  const check = (k: keyof Errors, v: string | boolean) => {
    const msg = k === 'consent' ? validators.consent(Boolean(v)) : validators[k](String(v))
    setErrors((e) => ({ ...e, [k]: msg }))
    return msg === ''
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    const ok = [check('email', email), check('whatsapp', whatsapp), check('consent', consent)].every(Boolean)
    if (!ok) return
    setStatus('loading')
    try {
      await submitLead({ origem: 'hero', email: email.trim(), whatsapp, consent })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="form" role="status">
        <h2>Você está na lista.</h2>
        <p className="sub" style={{ display: 'block', margin: 0 }}>Entraremos em contato pelo e-mail ou WhatsApp informado.</p>
      </div>
    )
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate aria-labelledby={`${uid}-t`}>
      <h2 id={`${uid}-t`}>Entre na lista de espera</h2>
      <p className="sub">Receba o acesso ao Cerne assim que abrirmos novas vagas.</p>

      <div className="field" data-invalid={Boolean(errors.email)}>
        <label htmlFor={emailId}>E-mail</label>
        <input id={emailId} type="email" autoComplete="email" inputMode="email" placeholder="voce@suafazenda.com.br"
          value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => check('email', email)}
          aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? `${uid}-e1` : undefined} />
        {errors.email && <span className="err" id={`${uid}-e1`}>{errors.email}</span>}
      </div>

      <div className="field" data-invalid={Boolean(errors.whatsapp)}>
        <label htmlFor={`${uid}-w`}>WhatsApp</label>
        <input id={`${uid}-w`} type="tel" autoComplete="tel-national" inputMode="tel" placeholder="(00) 00000-0000"
          value={whatsapp} onChange={(e) => setWhatsapp(maskPhone(e.target.value))} onBlur={() => check('whatsapp', whatsapp)}
          aria-invalid={Boolean(errors.whatsapp)} aria-describedby={errors.whatsapp ? `${uid}-e2` : undefined} />
        {errors.whatsapp && <span className="err" id={`${uid}-e2`}>{errors.whatsapp}</span>}
      </div>

      <label className="consent">
        <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); check('consent', e.target.checked) }}
          aria-invalid={Boolean(errors.consent)} />
        <span>Concordo em receber contato da GB Agritech sobre o Cerne, conforme a LGPD.</span>
      </label>
      {errors.consent && <span className="err" style={{ marginTop: -8, marginBottom: 10 }}>{errors.consent}</span>}

      <button className="btn btn-primary" type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Enviando…' : 'Entrar na lista de espera'}
      </button>
      {status === 'error' && <p className="form-msg bad" role="alert">Não foi possível enviar agora. Tente novamente em instantes.</p>}
    </form>
  )
}
