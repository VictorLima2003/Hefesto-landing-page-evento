import { useEffect, useRef, useState } from 'react'
import './AnimacaoCNCQuadrada.css'

/**
 * A mesma cena da versão larga, empilhada num quadrado — para o celular.
 *
 * Em vez de duas colunas lado a lado, três camadas que sobem uma sobre a
 * outra: o desenho, o programa e as ferramentas. Cada uma entra cobrindo
 * parcialmente a anterior, então a tela estreita nunca precisa mostrar as
 * três inteiras ao mesmo tempo.
 *
 * O palco é fixo em 440 x 440 e um ResizeObserver calcula a escala para
 * caber na largura disponível. É o que mantém proporção e alinhamento
 * idênticos em qualquer aparelho, sem um único media query aqui dentro.
 *
 * Como na versão larga, tudo é função pura do tempo `t`: nenhuma biblioteca
 * de animação, só um relógio em requestAnimationFrame.
 */

const LADO = 440       // o palco é sempre este; a escala é que muda
const END = 28
const ROW = 20         // altura de cada linha do editor
const VISIBLE = 7      // linhas visíveis na janela

const MAQUINA = 'ROMI D800'

const LINES = [
  { text: 'O1001',              note: 'programa 1001' },
  { text: 'G21 G90 G17',        note: 'mm · absoluto' },
  { text: 'T01 M06',            note: 'broca Ø10' },
  { text: 'S3200 M03',          note: '3200 rpm' },
  { text: 'G00 X20 Y20 Z5',     note: '' },
  { text: 'G81 Z-12 R2 F180',   note: 'furação' },
  { text: 'G80',                note: '' },
  { text: 'T02 M06',            note: 'fresa Ø8' },
  { text: 'S1800 M03',          note: '' },
  { text: 'G00 X50 Y40 Z5',     note: 'cavidade' },
  { text: 'G01 Z-6 F600',       note: '', fix: 'G01 Z-6 F420' },
  { text: 'G02 X70 Y40 I10 J0', note: 'contorno' },
  { text: 'M30',                note: 'fim' },
]
// A linha 11 é a que o agente corrige: ela para de digitar e espera o ajuste.
LINES.forEach((L, i) => { L.at = 7.9 + i * 0.42 + (i > 10 ? 1.2 : 0) })
LINES.forEach(L => { L.end = L.fix ? 13.3 : L.at + Math.max(0.2, L.text.length * 0.032) })

const FIX = { typeEnd: 12.4, alert: 12.5, delStart: 12.9, delEnd: 13.05, reEnd: 13.3 }
const MAX_SCROLL = (LINES.length - VISIBLE) * ROW

const STAGE_AT = [0, 7.0, 14.4, 17.0]
const STAGE_LABEL = ['Extração da peça', 'Construção do programa', 'Leitura das ferramentas', 'Validação']

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const win = (t, a, b) => clamp((t - a) / (b - a), 0, 1)
const easeOut = p => 1 - Math.pow(1 - p, 3)
const easeInOut = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
const num = v => Number(v).toFixed(3)

/** Realce de sintaxe do G-code — a única parte colorida da cena. */
function tokenColor(c) {
  if (c === 'G') return 'var(--an-g)'
  if (c === 'T' || c === 'S') return 'var(--an-t)'
  if (c === 'O') return 'var(--an-muted)'
  return 'var(--an-m)'
}

/** Texto visível de uma linha, considerando digitação e a correção do avanço. */
function visibleLine(L, t) {
  if (t < L.at) return { text: '', active: false, alert: false }
  if (L.fix) {
    if (t < FIX.typeEnd) {
      const n = Math.floor(win(t, L.at, FIX.typeEnd) * L.text.length)
      return { text: L.text.slice(0, n), active: true, alert: false }
    }
    if (t < FIX.delStart) return { text: L.text, active: true, alert: t >= FIX.alert }
    if (t < FIX.delEnd) {
      const n = Math.round(12 - win(t, FIX.delStart, FIX.delEnd) * 3)
      return { text: L.fix.slice(0, n), active: true, alert: true }
    }
    if (t < FIX.reEnd) {
      const n = Math.round(9 + win(t, FIX.delEnd, FIX.reEnd) * 3)
      return { text: L.fix.slice(0, n), active: true, alert: true }
    }
    return { text: L.fix, active: false, alert: false }
  }
  const p = win(t, L.at, L.end)
  return { text: L.text.slice(0, Math.floor(p * L.text.length)), active: p < 1, alert: false }
}

export default function AnimacaoCNCQuadrada() {
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [naTela, setNaTela] = useState(true)
  const [semPisca, setSemPisca] = useState(false)
  const [escala, setEscala] = useState(1)
  const caixa = useRef(null)
  const medida = useRef(null)

  useEffect(() => {
    setSemPisca(Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches))
  }, [])

  // O palco tem lado fixo; quem se ajusta é a escala.
  useEffect(() => {
    const el = medida.current
    if (!el) return
    const medir = () => {
      const s = Math.min(1, el.clientWidth / LADO)
      setEscala(anterior => (Math.abs(s - anterior) > 0.001 ? s : anterior))
    }
    medir()
    if (!window.ResizeObserver) {
      window.addEventListener('resize', medir)
      return () => window.removeEventListener('resize', medir)
    }
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Fora da tela o relógio para — não gasta bateria de quem já rolou a página.
  useEffect(() => {
    const el = caixa.current
    if (!el || !('IntersectionObserver' in window)) return
    const obs = new IntersectionObserver(([e]) => setNaTela(e.isIntersecting), { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!playing || !naTela) return
    let raf
    let last = null
    const tick = ts => {
      raf = requestAnimationFrame(tick)
      if (last === null) { last = ts; return }
      const dt = Math.min(0.05, (ts - last) / 1000)
      last = ts
      setT(prev => (prev + dt) % END)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, naTela])

  const alternar = () => setPlaying(p => !p)
  const reiniciar = () => { setT(0); setPlaying(true) }

  // ── valores derivados do tempo ────────────────────────────────────────────
  const blink = semPisca ? 1 : ((t * 2) % 1 < 0.55 ? 1 : 0)

  // camadas: cada uma entra empurrando a anterior para trás
  const l2In = easeOut(win(t, 7.0, 7.8))
  const l3In = easeOut(win(t, 14.4, 15.2))
  const l1Y = -6 * l2In - 4 * l3In
  const l1S = 1 - 0.04 * l2In - 0.03 * l3In
  const l2Y = (1 - l2In) * 300 - 4 * l3In
  const l2S = 1 - 0.03 * l3In
  const l3Y = (1 - l3In) * 240

  // camada 1 · desenho
  const scanP = win(t, 0.8, 2.8)
  const lido = t >= 6.0
  const geoColor = lido ? 'var(--an-ok)' : 'var(--an-ink)'

  let labelText = '2x furo Ø10 detectados'
  let labelOk = false
  let labelOp = 0
  let holeLeaderOp = 1
  let cavLeaderOp = 0
  if (t >= 3.1) labelOp = easeOut(win(t, 3.1, 3.5)) * (1 - win(t, 4.4, 4.6))
  if (t >= 4.7) {
    labelText = 'Cavidade 130 x 70'
    labelOp = easeOut(win(t, 4.7, 5.1))
    holeLeaderOp = 0; cavLeaderOp = 1
  }
  if (lido) {
    labelText = 'Geometria extraída'
    labelOk = true
    labelOp = 1 - win(t, 7.0, 7.4)
  }

  // camada 2 · programa
  let activeIdx = -1
  const codeLines = LINES.map((L, i) => {
    const v = visibleLine(L, t)
    const started = t >= L.at
    if (started) activeIdx = i
    const primeiro = v.text.trim()[0]
    return {
      n: String(i + 1).padStart(2, '0'),
      text: v.text,
      color: v.alert ? 'var(--an-warn)' : tokenColor(primeiro),
      op: started ? 1 : 0,
      alert: v.alert,
      active: v.active,
      caretOp: v.active && started ? blink : 0,
      note: L.note,
      noteOp: L.note
        ? easeOut(win(t, L.end + 0.1, L.end + 0.35)) * (1 - win(t, L.end + 1.2, L.end + 1.5))
        : 0,
    }
  })
  const scroll = clamp(activeIdx - (VISIBLE - 2), 0, MAX_SCROLL / ROW) * ROW

  let l2Status = 'Gerando operações'
  let l2Tone = 'neutro'
  if (t >= FIX.alert) { l2Status = `Ajustando à ${MAQUINA} · F600 → F420`; l2Tone = 'aviso' }
  if (t >= 14.0) { l2Status = 'Programa gerado · 13 linhas'; l2Tone = 'ok' }

  // camada 3 · ferramentas
  const tools = [
    { code: 'T01', name: 'Broca Ø10 · 3200 rpm', at: 15.3 },
    { code: 'T02', name: 'Fresa Ø8 · 1800 rpm', at: 16.0 },
  ].map(d => ({
    ...d,
    op: num(easeOut(win(t, d.at, d.at + 0.3))),
    bar: (easeInOut(win(t, d.at + 0.2, d.at + 0.9)) * 100).toFixed(0),
    tick: win(t, d.at + 0.9, d.at + 1.1).toFixed(2),
  }))

  const checks = [
    { label: 'Sintaxe', at: 17.2 },
    { label: 'Ferramentas compatíveis', at: 17.6 },
    { label: `Parâmetros da ${MAQUINA}`, at: 18.0 },
  ].map(c => {
    const d = win(t, c.at, c.at + 0.3)
    return { ...c, done: d > 0.5, op: (0.45 + 0.55 * d).toFixed(2) }
  })

  const stageIdx = STAGE_AT.reduce((acc, a, i) => (t >= a ? i : acc), 0)
  const finaleOp = easeOut(win(t, 20.0, 20.9)) * (1 - win(t, 27.0, END))
  const tone = t >= 18.5 ? 'ok' : (t >= FIX.alert && t < 14.0 ? 'aviso' : 'neutro')

  return (
    <figure className="anq" ref={caixa}>
      <div className="anq__medida" ref={medida} style={{ height: `${(LADO * escala).toFixed(1)}px` }}>
        <div className="anq__palco" style={{ transform: `scale(${escala.toFixed(4)})` }}>

          {/* ── cabeçalho ─────────────────────────────────────── */}
          <div className="anq__topo">
            <span className={`anq__dot anq__dot--${tone}`} aria-hidden="true" />
            <span>Máquina <b>{MAQUINA}</b></span>
            <span className="anq__comando">Comando <b>Fanuc</b></span>
          </div>

          <div className="anq__pilha">

            {/* ── camada 1 · o desenho ────────────────────────── */}
            <div className="anq__camada anq__camada--1"
                 style={{ transform: `translateY(${l1Y.toFixed(1)}px) scale(${l1S.toFixed(4)})` }}>
              <div className="anq__cabeca">
                <span className="anq__passo">1</span>
                <span className="anq__titulo">Extração da peça</span>
                <span className="anq__meta">{lido ? '3 features' : (t >= 0.8 ? 'lendo desenho…' : '')}</span>
              </div>

              <div className="anq__desenho">
                <svg viewBox="40 30 470 200" className="anq__svg" role="img"
                     aria-label="Desenho técnico de uma placa: o agente reconhece os furos e a cavidade.">
                  <defs>
                    <pattern id="anqGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M20 0 H0 V20" fill="none" stroke="var(--an-grid)" strokeWidth="1" />
                    </pattern>
                    <linearGradient id="anqScan" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0" stopColor="var(--an-ink)" stopOpacity="0" />
                      <stop offset="1" stopColor="var(--an-ink)" stopOpacity=".10" />
                    </linearGradient>
                  </defs>

                  <rect x="40" y="30" width="470" height="200" fill="url(#anqGrid)" />

                  {/* planta da peça */}
                  <g opacity={num(easeOut(win(t, 0.15, 1.0)))}>
                    <g stroke="var(--an-line)" strokeWidth="1" strokeDasharray="7 5">
                      <line x1="106" y1="88" x2="164" y2="88" />
                      <line x1="135" y1="70" x2="135" y2="106" />
                      <line x1="106" y1="154" x2="164" y2="154" />
                      <line x1="135" y1="136" x2="135" y2="172" />
                      <line x1="270" y1="76" x2="270" y2="166" />
                      <line x1="191" y1="121" x2="349" y2="121" />
                    </g>
                    <rect x="90" y="56" width="340" height="130" fill="var(--an-paper)" stroke="var(--an-ink)" strokeWidth="1.8" />
                    <circle cx="135" cy="88" r="12" fill="var(--an-paper)" stroke="var(--an-ink)" strokeWidth="1.6" />
                    <circle cx="135" cy="154" r="12" fill="var(--an-paper)" stroke="var(--an-ink)" strokeWidth="1.6" />
                    <rect x="205" y="86" width="130" height="70" rx="6" fill="var(--an-paper)" stroke="var(--an-ink)" strokeWidth="1.6" />
                    <path d="M380 105 H431 M380 105 V138 M380 138 H431" fill="none" stroke="var(--an-ink)" strokeWidth="1.6" />
                  </g>

                  {/* cotas */}
                  <g opacity={num(easeOut(win(t, 0.9, 1.9)))} stroke="var(--an-dim)"
                     fill="var(--an-muted)" fontFamily="var(--font-mono)" fontSize="13">
                    <g strokeWidth="1">
                      <line x1="90" y1="204" x2="430" y2="204" />
                      <line x1="90" y1="199" x2="90" y2="209" />
                      <line x1="430" y1="199" x2="430" y2="209" />
                      <line x1="64" y1="56" x2="64" y2="186" />
                      <line x1="59" y1="56" x2="69" y2="56" />
                      <line x1="59" y1="186" x2="69" y2="186" />
                      <line x1="440" y1="105" x2="440" y2="138" />
                    </g>
                    <text x="236" y="222" stroke="none">340,0</text>
                    <text x="52" y="121" stroke="none" transform="rotate(-90 52 121)" textAnchor="middle">130,0</text>
                    <text x="270" y="178" stroke="none" textAnchor="middle">130 x 70</text>
                    <text x="448" y="126" stroke="none">33,0</text>
                  </g>

                  {/* varredura da leitura */}
                  <g opacity={num((scanP > 0 && scanP < 1 ? 1 : 0) * (1 - win(t, 2.6, 2.85)))}
                     transform={`translate(${(70 + scanP * 380).toFixed(1)} 0)`}>
                    <rect x="-42" y="46" width="42" height="150" fill="url(#anqScan)" />
                    <line x1="0" y1="46" x2="0" y2="196" stroke="var(--an-ink)" strokeWidth="1.5" />
                  </g>

                  {/* furos reconhecidos */}
                  <g opacity={num(win(t, 3.0, 3.3))}>
                    {[88, 154].map(cy => (
                      <circle key={cy} cx="135" cy={cy} r={(lido ? 16 : 16 + Math.sin(t * 5) * 2).toFixed(1)}
                              fill="none" stroke={geoColor} strokeWidth="2.2" pathLength="100"
                              strokeDasharray="100"
                              strokeDashoffset={(100 - easeOut(win(t, 3.0, 3.6)) * 100).toFixed(1)} />
                    ))}
                  </g>

                  {/* cavidade reconhecida */}
                  <g opacity={num(win(t, 4.6, 5.0))}>
                    <rect x="197" y="78" width="146" height="86" rx="8" fill="none"
                          stroke={geoColor} strokeWidth="2.2" pathLength="100" strokeDasharray="100"
                          strokeDashoffset={(100 - easeOut(win(t, 4.7, 5.7)) * 100).toFixed(1)} />
                  </g>

                  {/* chamadas */}
                  <g stroke="var(--an-ink)" strokeWidth="1" fill="none" opacity={num(labelOp)}>
                    <path d="M147 78 L200 44 L250 44" opacity={holeLeaderOp} />
                    <path d="M270 78 V44" opacity={cavLeaderOp} />
                  </g>
                </svg>

                <span className={`anq__label${labelOk ? ' anq__label--ok' : ''}`}
                      style={{ opacity: num(labelOp) }}>
                  {labelText}
                </span>
              </div>

              <div className="anq__veu" style={{ opacity: num(0.5 * l2In + 0.25 * l3In) }} />
            </div>

            {/* ── camada 2 · o programa ───────────────────────── */}
            <div className="anq__camada anq__camada--2"
                 style={{
                   transform: `translateY(${l2Y.toFixed(1)}px) scale(${l2S.toFixed(4)})`,
                   opacity: num(win(t, 7.0, 7.3)),
                 }}>
              <div className="anq__cabeca anq__cabeca--fixa">
                <span className="anq__passo">2</span>
                <span className="anq__titulo">Construção do programa</span>
                <span className="anq__arquivo">O1001.nc</span>
              </div>

              <div className="anq__editor">
                <div style={{ transform: `translateY(${(-scroll).toFixed(0)}px)` }}>
                  {codeLines.map((ln, i) => (
                    <div key={i}
                         className={`anq__ln${ln.alert ? ' is-alert' : ln.active ? ' is-active' : ''}`}
                         style={{ opacity: ln.op }}>
                      <span className="anq__lnum">{ln.n}</span>
                      <span className="anq__code" style={{ color: ln.color }}>{ln.text}</span>
                      <span className="anq__caret" style={{ opacity: ln.caretOp }} />
                      {ln.note && <span className="anq__note" style={{ opacity: ln.noteOp }}>{ln.note}</span>}
                    </div>
                  ))}
                </div>
              </div>

              <p className={`anq__status anq__status--${l2Tone}`}>
                <span className={`anq__dot anq__dot--${l2Tone}`} aria-hidden="true" />
                {l2Status}
              </p>

              <div className="anq__veu" style={{ opacity: num(0.6 * l3In) }} />
            </div>

            {/* ── camada 3 · as ferramentas ───────────────────── */}
            <div className="anq__camada anq__camada--3"
                 style={{ transform: `translateY(${l3Y.toFixed(1)}px)`, opacity: num(win(t, 14.4, 14.7)) }}>
              <div className="anq__cabeca">
                <span className="anq__passo">3</span>
                <span className="anq__titulo">Leitura das ferramentas</span>
              </div>

              <ul className="anq__ferramentas">
                {tools.map(tl => (
                  <li key={tl.code} style={{ opacity: tl.op }}>
                    <span className="anq__codigo">{tl.code}</span>
                    <span className="anq__nome">{tl.name}</span>
                    <span className="anq__barra"><i style={{ width: `${tl.bar}%` }} /></span>
                    <span className="anq__tick" style={{ opacity: tl.tick }}>✓</span>
                  </li>
                ))}
              </ul>

              <ul className="anq__checks">
                {checks.map(c => (
                  <li key={c.label} className={c.done ? 'is-done' : ''} style={{ opacity: c.op }}>
                    <span className="anq__box">{c.done ? '✓' : ''}</span>{c.label}
                  </li>
                ))}
              </ul>

              <div className="anq__pronto" style={{ opacity: num(easeOut(win(t, 18.5, 19.0))) }}>
                <span className="anq__ready">Pronto para revisão</span>
                {/* é a tela do produto sendo retratada, não um botão desta página */}
                <span className="anq__cta" aria-hidden="true">Revisar programa</span>
              </div>
            </div>
          </div>

          {/* ── barra de controle ─────────────────────────────── */}
          <div className="anq__bar">
            <span className="anq__stages" aria-hidden="true">
              {STAGE_LABEL.map((_, i) => (
                <i key={i} className={i === stageIdx ? 'is-now' : i < stageIdx ? 'is-past' : undefined} />
              ))}
            </span>
            <span className="anq__stage-label">
              {stageIdx + 1} · {t >= 18.5 ? 'Pronto' : STAGE_LABEL[stageIdx]}
            </span>
            <span className="anq__btns">
              <button type="button" onClick={alternar}>{playing ? 'Pausar' : 'Reproduzir'}</button>
              <button type="button" onClick={reiniciar}>Reiniciar</button>
            </span>
          </div>

          {/* ── encerramento ──────────────────────────────────── */}
          <div className="anq__finale" style={{ opacity: num(finaleOp) }} aria-hidden={finaleOp < 0.5}>
            <div className="anq__chain">
              <span style={{ opacity: num(easeOut(win(t, 20.4, 21.0))) }}>
                <i><IconPeca /></i>Peça
              </span>
              <svg viewBox="0 0 60 10" className="anq__link">
                <line x1="1" y1="5" x2="59" y2="5" stroke="var(--an-dim)" strokeWidth="1.4"
                      strokeDasharray="4 4" pathLength="100"
                      strokeDashoffset={(100 - easeInOut(win(t, 20.9, 21.7)) * 100).toFixed(1)} />
              </svg>
              <span style={{ opacity: num(easeOut(win(t, 20.8, 21.4))) }}>
                <i><IconPrograma /></i>Programa
              </span>
              <svg viewBox="0 0 60 10" className="anq__link">
                <line x1="1" y1="5" x2="59" y2="5" stroke="var(--an-dim)" strokeWidth="1.4"
                      strokeDasharray="4 4" pathLength="100"
                      strokeDashoffset={(100 - easeInOut(win(t, 21.3, 22.1)) * 100).toFixed(1)} />
              </svg>
              <span style={{ opacity: num(easeOut(win(t, 21.2, 21.8))) }}>
                <i className="is-ok"><IconFerramentas /></i>Ferramentas
              </span>
            </div>
            <span className="anq__rule" style={{ width: `${(easeOut(win(t, 22.0, 22.8)) * 240).toFixed(0)}px` }} />
            <p className="anq__claim">
              <span style={{ opacity: num(easeOut(win(t, 22.2, 22.7))) }}>Sua fábrica.</span>{' '}
              <span style={{ opacity: num(easeOut(win(t, 22.5, 23.0))) }}>Suas regras.</span>{' '}
              <b style={{ opacity: num(easeOut(win(t, 22.8, 23.3))) }}>Sua inteligência.</b>
            </p>
          </div>

        </div>
      </div>
    </figure>
  )
}

/* ── ícones do encerramento (embutidos: sem dependência externa) ──────────── */
const svgProps = {
  width: 25, height: 25, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
}
const IconPeca = () => (
  <svg {...svgProps} aria-hidden="true">
    <circle cx="12" cy="5" r="2" /><path d="M12 7v3" />
    <path d="M12 10 5.5 21" /><path d="M12 10 18.5 21" />
    <path d="M7.7 17h8.6" />
  </svg>
)
const IconPrograma = () => (
  <svg {...svgProps} aria-hidden="true">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="m10 12-2 2 2 2" /><path d="m14 12 2 2-2 2" />
  </svg>
)
const IconFerramentas = () => (
  <svg {...svgProps} aria-hidden="true">
    <path d="M14.7 6.3a4 4 0 0 0 5 5l-9.4 9.4a2.1 2.1 0 0 1-3-3Z" />
    <path d="M14.7 6.3 17.5 3.5" />
  </svg>
)
