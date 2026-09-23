import { useEffect, useRef, useState } from 'react'
import './AnimacaoCNC.css'

/**
 * Do desenho ao programa — a cena que o Hefesto executa.
 *
 * Porte em React da animação original (.dc.html, versão 2), com a paleta do
 * produto. Tudo é função pura do tempo `t` dentro de um ciclo de END segundos:
 * nenhuma biblioteca de animação, só um relógio em requestAnimationFrame.
 */

const END = 26.4
const ROW = 22        // altura de cada linha do editor
const VISIBLE = 9     // linhas visíveis na janela

const LINES = [
  { at: 3.40,  text: '%',                  note: '' },
  { at: 3.70,  text: 'O1001',              note: 'programa 1001' },
  { at: 4.00,  text: 'G21 G90 G17',        note: 'mm · absoluto · plano XY' },
  { at: 4.35,  text: 'T01 M06',            note: 'broca Ø10 mm' },
  { at: 4.70,  text: 'S3200 M03',          note: '3200 rpm' },
  { at: 5.30,  text: 'G00 X20 Y20 Z5',     note: 'posiciona sobre o furo' },
  { at: 5.95,  text: 'G81 Z-12 R2 F180',   note: 'ciclo de furação' },
  { at: 6.70,  text: 'G80',                note: 'cancela ciclo' },
  { at: 8.40,  text: 'T02 M06',            note: 'fresa Ø8 mm' },
  { at: 8.90,  text: 'S1800 M03',          note: '' },
  { at: 9.40,  text: 'G00 X50 Y40 Z5',     note: 'entrada na cavidade' },
  { at: 10.00, text: 'G01 Z-6 F600',       note: '', fix: 'G01 Z-6 F420' },
  { at: 11.95, text: 'G02 X70 Y40 I10 J0', note: 'contorno da cavidade' },
  { at: 12.30, text: 'M05',                note: '' },
  { at: 12.55, text: 'M30',                note: 'fim de programa' },
  { at: 12.75, text: '%',                  note: '' },
]
LINES.forEach(L => { L.end = L.fix ? 11.92 : L.at + Math.max(0.22, L.text.length * 0.035) })

const FIX = { typeEnd: 10.55, alert: 10.70, delStart: 11.30, delEnd: 11.58, reEnd: 11.92 }
const VAL_START = 13.0
const VAL_END = 15.1
const MAX_SCROLL = (LINES.length - VISIBLE) * ROW

const STAGE_AT = [0, 3.0, 5.0, 7.2, 10.0, 13.0, 15.35]
const STAGE_LABEL = ['Leitura do desenho', 'Furo detectado', 'Furação', 'Cavidade', 'Correção', 'Validação', 'Pronto']

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const win = (t, a, b) => clamp((t - a) / (b - a), 0, 1)
const easeOut = p => 1 - Math.pow(1 - p, 3)
const easeInOut = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)

/** Realce de sintaxe do G-code — a única parte colorida da cena. */
function tokenColor(tk) {
  const c = tk[0]
  if (c === 'G') return 'var(--an-g)'
  if (c === 'M') return 'var(--an-m)'
  if (c === 'T' || c === 'S') return 'var(--an-t)'
  if ('XYZRFIJ'.indexOf(c) >= 0) return 'var(--an-xyz)'
  return 'var(--an-muted)'
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
  const dur = Math.max(0.22, L.text.length * 0.035)
  const p = win(t, L.at, L.at + dur)
  return { text: L.text.slice(0, Math.floor(p * L.text.length)), active: p < 1, alert: false }
}

const MAQUINA = 'ROMI D800'
const num = v => Number(v).toFixed(3)

export default function AnimacaoCNC() {
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [naTela, setNaTela] = useState(true)
  const [semPisca, setSemPisca] = useState(false)
  const box = useRef(null)

  // A cena é o conteúdo da página, não enfeite: ela roda sozinha para todo mundo.
  // Quem pede menos movimento perde só o pisca-pisca do cursor, e o botão
  // "Pausar" continua à mão.
  useEffect(() => {
    setSemPisca(Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches))
  }, [])

  // Fora da tela o relógio para — não gasta bateria de quem já rolou a página.
  useEffect(() => {
    const el = box.current
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
  const validando = t >= VAL_START

  let activeIdx = -1
  const codeLines = LINES.map((L, i) => {
    const v = visibleLine(L, t)
    const started = t >= L.at
    if (started) activeIdx = i
    const tickT = VAL_START + 0.1 + i * 0.115
    const tick = win(t, tickT, tickT + 0.2)
    const tokens = v.text.split(/(\s+)/).filter(s => s.length)
    let color = tokens.length ? tokenColor(tokens[0]) : 'var(--an-xyz)'
    if (v.alert) color = 'var(--an-warn)'
    const noteOp = L.note && !validando
      ? easeOut(win(t, L.end + 0.1, L.end + 0.4)) * (1 - win(t, L.end + 1.5, L.end + 1.8))
      : 0
    return {
      n: String(i + 1).padStart(2, '0'),
      text: v.text,
      color,
      op: started ? 1 : 0,
      alert: v.alert,
      active: v.active,
      caretOp: v.active && started ? blink : 0,
      tickOp: tick,
      note: L.note,
      noteOp,
    }
  })

  let scroll = clamp(activeIdx - (VISIBLE - 3), 0, MAX_SCROLL / ROW) * ROW
  if (validando) scroll = easeInOut(win(t, VAL_START, VAL_END)) * MAX_SCROLL

  const scanP = win(t, 0.8, 2.8)
  const holeFade = win(t, 3.0, 3.4) * (1 - win(t, 7.4, 7.9) * 0.55)
  const pulse = 16 + Math.sin(t * 5) * 2
  const peck = win(t, 5.2, 6.9)
  const drillY = peck === 0 ? -52
    : -52 + 52 * easeInOut(clamp(Math.sin(peck * Math.PI * 2.5) * 0.25 + peck * 1.05, 0, 1))

  let toolText = 'Ferramenta selecionada: broca Ø10 mm'
  if (t >= 8.2) toolText = 'Selecionando fresa Ø8 mm'
  if (t >= 9.6) toolText = 'Fresa Ø8 mm em uso · operação: fresamento'
  const toolOp = t >= 4.3 ? 1 : 0

  let statusText = 'Lendo o desenho técnico'
  let statusTone = 'neutro'
  if (t >= 3.0) statusText = 'Furo Ø10 mm detectado'
  if (t >= 5.0) statusText = 'Gerando a operação de furação'
  if (t >= 7.4) statusText = 'Cavidade identificada'
  if (t >= 8.6) statusText = 'Operação sugerida: fresamento'
  if (t >= 10.6) { statusText = `Ajustando aos parâmetros da ${MAQUINA}`; statusTone = 'aviso' }
  if (t >= 12.0) { statusText = 'Validando o programa'; statusTone = 'neutro' }
  if (t >= 15.35) { statusText = 'Programa pronto para revisão humana'; statusTone = 'ok' }

  let labelText = 'Furo Ø10 mm detectado'
  let labelOp = 0
  let labelOk = false
  let holeLeaderOp = 1
  let cavLeaderOp = 0
  if (t >= 3.1 && t < 7.2) labelOp = easeOut(win(t, 3.1, 3.6)) * (1 - win(t, 6.9, 7.2))
  if (t >= 7.6) {
    labelText = t >= 8.6 ? 'Operação sugerida: fresamento' : 'Cavidade identificada'
    labelOp = easeOut(win(t, 7.6, 8.1)) * (1 - win(t, 12.6, 13.0))
    holeLeaderOp = 0; cavLeaderOp = 1
  }
  if (t >= 13.0) {
    labelText = 'Geometrias validadas'
    labelOk = true
    labelOp = easeOut(win(t, 13.2, 13.7)) * (1 - win(t, 15.5, 15.8))
    holeLeaderOp = 0; cavLeaderOp = 1
  }

  const checks = [
    { label: 'Sintaxe validada', at: 13.8 },
    { label: 'Ferramentas compatíveis', at: 14.4 },
    { label: `Parâmetros da ${MAQUINA} conferidos`, at: 15.0 },
  ].map(c => {
    const done = win(t, c.at, c.at + 0.3)
    return { ...c, done: done > 0.5, op: ((0.4 + 0.6 * done) * (validando ? 1 : 0.35)).toFixed(2) }
  })

  const stageIdx = STAGE_AT.reduce((acc, a, i) => (t >= a ? i : acc), 0)
  const sweepIdx = win(t, VAL_START, VAL_END) * LINES.length
  const finaleOp = easeOut(win(t, 15.9, 16.8)) * (1 - win(t, 25.4, END))

  return (
    <figure className="an" ref={box}>
      <div className="an__corpo">

        {/* ── coluna do desenho ───────────────────────────────── */}
        <div className="an__esquerda">
          <div className="an__ctx">
            <span>Máquina <b>{MAQUINA}</b></span>
            <span>Comando <b>Fanuc</b></span>
            <span>Ferramentas <b>12</b></span>
          </div>

          <div className="an__draw">
            <svg viewBox="0 0 540 250" className="an__svg" role="img"
                 aria-label="Desenho técnico de uma placa: o agente identifica o furo e a cavidade e gera as operações.">
              <defs>
                <pattern id="cncGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M20 0 H0 V20" fill="none" stroke="var(--an-grid)" strokeWidth="1" />
                </pattern>
                <linearGradient id="cncScan" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="var(--an-ink)" stopOpacity="0" />
                  <stop offset="1" stopColor="var(--an-ink)" stopOpacity=".10" />
                </linearGradient>
              </defs>

              <rect x="0" y="0" width="540" height="250" fill="url(#cncGrid)" />

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
              <g opacity={num(easeOut(win(t, 0.9, 1.9)) * (1 - win(t, 15.9, 16.6) * 0.4))}
                 stroke="var(--an-dim)" fill="var(--an-muted)" fontFamily="var(--font-mono)" fontSize="12">
                <g strokeWidth="1">
                  <line x1="90" y1="204" x2="430" y2="204" />
                  <line x1="90" y1="199" x2="90" y2="209" />
                  <line x1="430" y1="199" x2="430" y2="209" />
                  <line x1="64" y1="56" x2="64" y2="186" />
                  <line x1="59" y1="56" x2="69" y2="56" />
                  <line x1="59" y1="186" x2="69" y2="186" />
                  <path d="M147 80 L176 50" fill="none" />
                  <line x1="440" y1="105" x2="440" y2="138" />
                </g>
                <text x="238" y="220" stroke="none">340,0</text>
                <text x="50" y="121" stroke="none" transform="rotate(-90 50 121)">130,0</text>
                <text x="270" y="176" stroke="none" textAnchor="middle">130,0 x 70,0</text>
                <text x="180" y="46" stroke="none">2x Ø10 H7</text>
                <text x="448" y="125" stroke="none">33,0</text>
                <text x="90" y="242" stroke="none">ESC 1:2</text>
                <text x="176" y="242" stroke="none">ISO 2768-m</text>
                <text x="296" y="242" stroke="none">Ra 1,6</text>
                <text x="376" y="242" stroke="none">AÇO 1045</text>
              </g>

              {/* varredura da leitura */}
              <g opacity={num((scanP > 0 && scanP < 1 ? 1 : 0) * (1 - win(t, 2.6, 2.85)))}
                 transform={`translate(${(70 + scanP * 380).toFixed(1)} 0)`}>
                <rect x="-42" y="46" width="42" height="150" fill="url(#cncScan)" />
                <line x1="0" y1="46" x2="0" y2="196" stroke="var(--an-ink)" strokeWidth="1.5" />
              </g>

              {/* furo reconhecido */}
              <g opacity={num(holeFade)}>
                <circle cx="135" cy="88" r={(validando ? 16 : pulse).toFixed(1)} fill="none"
                        stroke={validando ? 'var(--an-ok)' : 'var(--an-ink)'} strokeWidth="2.2"
                        pathLength="100" strokeDasharray="100"
                        strokeDashoffset={(100 - easeOut(win(t, 3.0, 3.6)) * 100).toFixed(1)} />
              </g>

              {/* cavidade reconhecida */}
              <g opacity={num(win(t, 7.4, 8.4) * (1 - win(t, 15.7, 16.1) * 0.4))}>
                <rect x="197" y="78" width="146" height="86" rx="8" fill="none"
                      stroke={validando ? 'var(--an-ok)' : 'var(--an-ink)'} strokeWidth="2.2"
                      pathLength="100" strokeDasharray="100"
                      strokeDashoffset={(100 - easeOut(win(t, 7.5, 8.7)) * 100).toFixed(1)} />
              </g>

              {/* trajetória da fresa */}
              <g opacity={num(win(t, 9.5, 10.0) * (1 - win(t, 15.7, 16.1) * 0.4))}>
                <rect x="221" y="102" width="98" height="38" rx="8" fill="none"
                      stroke="var(--an-ink)" strokeWidth="1.6" strokeDasharray="3 4"
                      pathLength="100"
                      strokeDashoffset={(100 - easeOut(win(t, 9.6, 12.4)) * 100).toFixed(1)} />
              </g>

              {/* broca descendo em pica-pau */}
              <g opacity={num(win(t, 5.1, 5.4) * (1 - win(t, 6.9, 7.3)))} transform={`translate(0 ${drillY.toFixed(1)})`}>
                <rect x="117" y="2" width="36" height="9" rx="2" fill="var(--an-ink)" />
                <line x1="135" y1="11" x2="135" y2="72" stroke="var(--an-ink)" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M129 72 L141 72 L135 84 Z" fill="var(--an-ink)" />
              </g>

              {/* chamadas */}
              <g opacity={num(labelOp)}>
                <path d="M147 76 L250 44 L272 44" stroke="var(--an-ink)" strokeWidth="1" opacity={holeLeaderOp} fill="none" />
                <path d="M270 86 V44" stroke="var(--an-ink)" strokeWidth="1" opacity={cavLeaderOp} fill="none" />
              </g>
            </svg>

            <span className={`an__label${labelOk ? ' an__label--ok' : ''}`} style={{ opacity: num(labelOp) }}>
              {labelText}
            </span>
          </div>
        </div>

        {/* ── coluna do programa ──────────────────────────────── */}
        <div className="an__direita">
          <p className="an__status">
            <span className={`an__dot an__dot--${statusTone}`} aria-hidden="true" />
            {statusText}
          </p>

          <div className="an__file">
            <span className="an__fname">O1001_placa_base.nc</span>
            <span className="an__work">
              <i style={{ opacity: (0.25 + 0.75 * Math.abs(Math.sin(t * 3))).toFixed(2) }} />
              <i style={{ opacity: (0.25 + 0.75 * Math.abs(Math.sin(t * 3 - 0.6))).toFixed(2) }} />
              <i style={{ opacity: (0.25 + 0.75 * Math.abs(Math.sin(t * 3 - 1.2))).toFixed(2) }} />
              {t >= 15.35 ? 'validação concluída' : (validando ? 'verificando o código' : 'lendo o desenho')}
            </span>
          </div>

          <div className="an__editor">
            <div style={{ transform: `translateY(${(-scroll).toFixed(0)}px)` }}>
              {codeLines.map((ln, i) => (
                <div key={i} className={`an__ln${ln.alert ? ' is-alert' : ln.active ? ' is-active' : ''}`}
                     style={{ opacity: ln.op }}>
                  <span className="an__lnum">{ln.n}</span>
                  <span className="an__tick" style={{ opacity: ln.tickOp }}>✓</span>
                  <span className="an__code" style={{ color: ln.color }}>{ln.text}</span>
                  <span className="an__caret" style={{ opacity: ln.caretOp }} />
                  {ln.note && (
                    <span className="an__note" style={{ opacity: ln.noteOp }}>{ln.note}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="an__sweep"
                 style={{
                   opacity: num(win(t, VAL_START, VAL_START + 0.2) * (1 - win(t, VAL_END - 0.1, VAL_END + 0.2))),
                   transform: `translateY(${clamp(sweepIdx * ROW - scroll, 0, VISIBLE * ROW - ROW).toFixed(0)}px)`,
                 }} />
          </div>

          <div className="an__foot">
            <p className="an__row" style={{ opacity: toolOp }}>
              <span className="an__tag">FERR.</span>{toolText}
            </p>
            <p className="an__row an__row--warn"
               style={{ opacity: num(easeOut(win(t, 10.7, 11.1)) * (1 - win(t, 12.6, 13.0))) }}>
              <span className="an__tag an__tag--warn">AJUSTE</span>
              Regra da {MAQUINA} · avanço F600 → F420
            </p>

            <ul className="an__checks">
              {checks.map((c, i) => (
                <li key={i} className={c.done ? 'is-done' : ''} style={{ opacity: c.op }}>
                  <span className="an__box">{c.done ? '✓' : ''}</span>{c.label}
                </li>
              ))}
            </ul>

            <div className="an__pronto" style={{ opacity: num(easeOut(win(t, 15.35, 15.8))) }}>
              <span className="an__ready">Programa pronto para revisão</span>
              {/* é a tela do produto sendo retratada, não um botão desta página */}
              <span className="an__cta" aria-hidden="true">Revisar programa CNC</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── barra de controle ───────────────────────────────────── */}
      <div className="an__bar">
        <span className="an__stages" aria-hidden="true">
          {STAGE_LABEL.map((_, i) => (
            <i key={i} className={i === stageIdx ? 'is-now' : i < stageIdx ? 'is-past' : undefined} />
          ))}
        </span>
        <span className="an__stage-label">{stageIdx + 1} · {STAGE_LABEL[stageIdx]}</span>
        <span className="an__btns">
          <button type="button" onClick={alternar}>{playing ? 'Pausar' : 'Reproduzir'}</button>
          <button type="button" onClick={reiniciar}>Reiniciar</button>
        </span>
      </div>

      {/* ── encerramento ────────────────────────────────────────── */}
      <div className="an__finale" style={{ opacity: num(finaleOp) }} aria-hidden={finaleOp < 0.5}>
        <div className="an__chain">
          <span style={{ opacity: num(easeOut(win(t, 16.2, 16.8))) }}>
            <i><IconDesenho /></i>Desenho
          </span>
          <svg viewBox="0 0 60 10" className="an__link">
            <line x1="1" y1="5" x2="59" y2="5" stroke="var(--an-dim)" strokeWidth="1.4"
                  strokeDasharray="4 4" pathLength="100"
                  strokeDashoffset={(100 - easeInOut(win(t, 16.7, 17.5)) * 100).toFixed(1)} />
          </svg>
          <span style={{ opacity: num(easeOut(win(t, 16.6, 17.2))) }}>
            <i><IconPrograma /></i>Programa
          </span>
          <svg viewBox="0 0 60 10" className="an__link">
            <line x1="1" y1="5" x2="59" y2="5" stroke="var(--an-dim)" strokeWidth="1.4"
                  strokeDasharray="4 4" pathLength="100"
                  strokeDashoffset={(100 - easeInOut(win(t, 17.1, 17.9)) * 100).toFixed(1)} />
          </svg>
          <span style={{ opacity: num(easeOut(win(t, 17.0, 17.6))) }}>
            <i className="is-ok"><IconMaquina /></i>{MAQUINA}
          </span>
        </div>
        <span className="an__rule" style={{ width: `${(easeOut(win(t, 17.8, 18.6)) * 320).toFixed(0)}px` }} />
        <p className="an__claim">
          <span style={{ opacity: num(easeOut(win(t, 18.0, 18.5))) }}>Sua fábrica.</span>{' '}
          <span style={{ opacity: num(easeOut(win(t, 18.25, 18.75))) }}>Suas regras.</span>{' '}
          <b style={{ opacity: num(easeOut(win(t, 18.5, 19.0))) }}>Sua inteligência.</b>
        </p>
      </div>
    </figure>
  )
}

/* ── ícones do encerramento (embutidos: sem dependência externa) ──────────── */
const svgProps = {
  width: 29, height: 29, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
}
const IconDesenho = () => (
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
    <path d="m10.5 12.5-2 2 2 2" /><path d="m13.5 12.5 2 2-2 2" />
  </svg>
)
const IconMaquina = () => (
  <svg {...svgProps} aria-hidden="true">
    <path d="M3 21h18" />
    <path d="M4 21V10l5 3V10l5 3V7l6 3v11" />
    <path d="M9 21v-4h4v4" />
  </svg>
)
