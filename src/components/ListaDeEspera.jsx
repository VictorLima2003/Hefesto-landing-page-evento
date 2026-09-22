import { useState } from 'react'

const COMANDOS = ['Fanuc', 'Siemens', 'Heidenhain', 'Outro', 'Não sei']

/** Contato de emergência: se a gravação falhar, o visitante ainda fala com você. */
const FALLBACK_WHATS = '5511999999999'
const FALLBACK_EMAIL = 'contato@hefesto.com.br'

const VAZIO = { nome: '', empresa: '', email: '', whatsapp: '', comando: '', consent: false, _site: '' }

function mascaraTelefone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function validar(f) {
  const e = {}
  if (f.nome.trim().length < 2) e.nome = 'Como podemos te chamar?'
  if (f.empresa.trim().length < 2) e.empresa = 'Qual é o nome da empresa?'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Confira o e-mail — é por ele que avisamos.'
  const d = f.whatsapp.replace(/\D/g, '')
  if (d && (d.length < 10 || d.length > 11)) e.whatsapp = 'Faltou um dígito no número.'
  if (!f.consent) e.consent = 'Precisamos do seu aceite para entrar em contato.'
  return e
}

export default function ListaDeEspera() {
  const [f, setF] = useState(VAZIO)
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [falha, setFalha] = useState(null)
  const [pronto, setPronto] = useState(null)

  const set = (campo, valor) => {
    setF(prev => ({ ...prev, [campo]: valor }))
    if (erros[campo]) setErros(prev => ({ ...prev, [campo]: undefined }))
  }

  async function enviar(ev) {
    ev.preventDefault()
    const e = validar(f)
    setErros(e)
    const primeiro = ['nome', 'empresa', 'email', 'whatsapp', 'consent'].find(c => e[c])
    if (primeiro) {
      // Espera o React repintar antes de mandar o foco para o campo com erro.
      requestAnimationFrame(() => {
        document.getElementById(primeiro === 'whatsapp' ? 'lead-whats' : `lead-${primeiro}`)?.focus()
      })
      return
    }

    setEnviando(true)
    setFalha(null)
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: f.nome.trim(),
          empresa: f.empresa.trim(),
          email: f.email.trim(),
          whatsapp: f.whatsapp.trim(),
          comando: f.comando,
          origem: 'landing',
          _site: f._site,
        }),
      })
      const dados = await res.json().catch(() => ({}))
      if (!res.ok || !dados.ok) throw new Error(dados.mensagem || 'falha ao gravar')
      setPronto(f.nome.trim().split(/\s+/)[0])
    } catch (err) {
      setFalha(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (pronto) {
    return (
      <div className="form" aria-live="polite">
        <div className="sucesso">
          <svg className="check" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <circle cx="32" cy="32" r="30" pathLength="1" stroke="#2f6b4f" strokeOpacity=".35"
                    strokeWidth="2" strokeLinecap="round" />
            <polyline points="20,33 28,41 45,23" pathLength="1" stroke="#2f6b4f" strokeWidth="3"
                      strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3>Pronto, {pronto}. Você está na lista.</h3>
          <p>A gente avisa por e-mail quando abrir para novas fábricas. Sem spam, e dá para sair quando quiser.</p>
        </div>
      </div>
    )
  }

  return (
    <form className="form" onSubmit={enviar} noValidate>
      <div className="field">
        <label htmlFor="lead-nome">Seu nome</label>
        <input id="lead-nome" name="nome" autoComplete="name" placeholder="Como devemos te chamar"
               value={f.nome} onChange={e => set('nome', e.target.value)}
               aria-invalid={erros.nome ? 'true' : undefined}
               aria-describedby={erros.nome ? 'erro-nome' : undefined} />
        {erros.nome && <span className="field__erro" id="erro-nome">{erros.nome}</span>}
      </div>

      <div className="field">
        <label htmlFor="lead-empresa">Empresa</label>
        <input id="lead-empresa" name="organization" autoComplete="organization" placeholder="Nome da sua empresa"
               value={f.empresa} onChange={e => set('empresa', e.target.value)}
               aria-invalid={erros.empresa ? 'true' : undefined}
               aria-describedby={erros.empresa ? 'erro-empresa' : undefined} />
        {erros.empresa && <span className="field__erro" id="erro-empresa">{erros.empresa}</span>}
      </div>

      <div className="field">
        <label htmlFor="lead-email">E-mail</label>
        <input id="lead-email" name="email" type="email" inputMode="email" autoComplete="email"
               placeholder="voce@empresa.com.br"
               value={f.email} onChange={e => set('email', e.target.value)}
               aria-invalid={erros.email ? 'true' : undefined}
               aria-describedby={erros.email ? 'erro-email' : undefined} />
        {erros.email && <span className="field__erro" id="erro-email">{erros.email}</span>}
      </div>

      <div className="field">
        <label htmlFor="lead-whats">WhatsApp <span style={{ fontWeight: 400 }}>(opcional)</span></label>
        <input id="lead-whats" name="tel" type="tel" inputMode="tel" autoComplete="tel"
               placeholder="(11) 90000-0000"
               value={f.whatsapp} onChange={e => set('whatsapp', mascaraTelefone(e.target.value))}
               aria-invalid={erros.whatsapp ? 'true' : undefined}
               aria-describedby={erros.whatsapp ? 'erro-whats' : undefined} />
        {erros.whatsapp && <span className="field__erro" id="erro-whats">{erros.whatsapp}</span>}
      </div>

      <div className="field">
        <label id="lbl-comando">Comando das suas máquinas</label>
        <div className="chips" role="group" aria-labelledby="lbl-comando">
          {COMANDOS.map(c => (
            <button key={c} type="button" className="chip" aria-pressed={f.comando === c}
                    onClick={() => set('comando', f.comando === c ? '' : c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Isca para robô: humano nunca vê, robô costuma preencher. */}
      <input className="hp" tabIndex="-1" autoComplete="off" aria-hidden="true"
             id="lead-site" name="site" value={f._site} onChange={e => set('_site', e.target.value)} />

      <label className="consent" htmlFor="lead-consent">
        <input id="lead-consent" type="checkbox" checked={f.consent}
               onChange={e => set('consent', e.target.checked)}
               aria-invalid={erros.consent ? 'true' : undefined} />
        <span>
          Aceito receber contato sobre o lançamento do Hefesto.
          Seus dados ficam só com a gente — veja o <a href="/aviso-de-privacidade" target="_blank" rel="noopener noreferrer">aviso de privacidade</a>.
          {erros.consent && <><br /><span className="field__erro">{erros.consent}</span></>}
        </span>
      </label>

      {falha && (
        <div className="form__erro" role="alert">
          <b>Não consegui gravar seu contato.</b>
          <span>
            Para não te perder: chame no{' '}
            <a href={`https://wa.me/${FALLBACK_WHATS}?text=${encodeURIComponent('Quero entrar na lista de espera do Hefesto')}`}
               target="_blank" rel="noopener noreferrer">WhatsApp</a>{' '}
            ou escreva para <a href={`mailto:${FALLBACK_EMAIL}`}>{FALLBACK_EMAIL}</a>.
          </span>
        </div>
      )}

      <button className="btn btn--block" type="submit" disabled={enviando}>
        {enviando ? 'Enviando…' : 'Entrar na lista'}
      </button>
    </form>
  )
}
