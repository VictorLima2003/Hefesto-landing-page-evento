import { useEffect, useRef, useState } from 'react'
import './AnimacaoPipeline.css'

/**
 * Como a fábrica vira programa pronto.
 *
 * Porte em React da animação original (.dc.html), com a paleta do produto.
 * Como a outra cena, tudo é função pura do tempo `t` dentro do ciclo — nenhuma
 * biblioteca de animação, só um relógio em requestAnimationFrame.
 */

const END = 22.8

const ETAPAS = [
  [0,    'Começando pelo que a fábrica já sabe'],
  [2.6,  'Lendo o contexto'],
  [5.0,  'Os agentes analisando'],
  [8.6,  'Juntando tudo'],
  [9.7,  'O profissional valida'],
  [11.7, 'Entregas prontas'],
  [14.4, 'O aprendizado volta para a base'],
  [17.5, 'Ciclo completo'],
]

const ENTRADAS = [
  ['A máquina',      'CNC-03 · Fanuc 0i'],
  ['As ferramentas', '12 ferramentas ativas'],
  ['Os dispositivos', 'Morsa e fixação'],
  ['A peça',         'Cavidades e furos'],
  ['O histórico',    'Programas anteriores'],
]

const AGENTES = [
  ['Agente de máquina',      'conhece os limites dela'],
  ['Agente de ferramental',  'acompanha o desgaste'],
  ['Agente de processo',     'estratégia e parâmetros'],
  ['Agente de programação',  'escreve o seu G-code'],
  ['Agente de conhecimento', 'guarda o jeito da casa'],
]

const SAIDAS = [
  ['Programa CNC pronto',    'O1001_placa_base.nc',           96],
  ['Folha de processo',      'setup, ferramentas e tempos',   164],
  ['Programa versionado',    'versão 3, com histórico',       232],
  ['Camada de conhecimento', 'registrado para aprender',       300],
]

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const win = (t, a, b) => clamp((t - a) / (b - a), 0, 1)
const easeOut = p => 1 - Math.pow(1 - p, 3)
const easeInOut = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
const num = v => Number(v).toFixed(3)

export default function AnimacaoPipeline() {
  const [t, setT] = useState(0)
  const [tocando, setTocando] = useState(true)
  const [naTela, setNaTela] = useState(true)
  const caixa = useRef(null)

  useEffect(() => {
    const el = caixa.current
    if (!el || !('IntersectionObserver' in window)) return
    const obs = new IntersectionObserver(([e]) => setNaTela(e.isIntersecting), { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!tocando || !naTela) return
    let raf
    let ultimo = null
    const passo = ts => {
      raf = requestAnimationFrame(passo)
      if (ultimo === null) { ultimo = ts; return }
      const dt = Math.min(0.05, (ts - ultimo) / 1000)
      ultimo = ts
      setT(prev => (prev + dt) % END)
    }
    raf = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(raf)
  }, [tocando, naTela])

  // ── valores derivados do tempo ────────────────────────────────────────────
  const cena = 1 - win(t, 22.2, 22.75)
  const painel = easeOut(win(t, 2.7, 3.5))
  const brilhoPainel = clamp(win(t, 16.3, 16.9) - win(t, 17.3, 18.1), 0, 1) * 0.85

  const entradas = ENTRADAS.map((e, i) => {
    const p = easeOut(win(t, 0.5 + i * 0.3, 1.3 + i * 0.3))
    return { rotulo: e[0], valor: e[1], y: 88 + i * 60, op: p, x: (1 - p) * -18 }
  })

  const fios = ENTRADAS.map((_, i) => {
    const s = 2.6 + i * 0.22
    const andar = win(t, s, s + 0.9)
    return {
      y: 113 + i * 60,
      op: win(t, s - 0.1, s + 0.2),
      traco: 100 - 100 * easeInOut(win(t, s, s + 0.9)),
      pontoX: 216 + 42 * easeInOut(andar),
      pontoOp: andar > 0.02 && andar < 0.98 ? 1 : 0,
    }
  })

  const agentes = AGENTES.map((a, i) => {
    const entrada = easeOut(win(t, 3.3 + i * 0.26, 3.3 + i * 0.26 + 0.7))
    const w0 = 5.1 + i * 0.72
    const carga = easeInOut(win(t, w0, w0 + 0.95))
    return {
      titulo: a[0], sub: a[1], y: 88 + i * 60,
      op: entrada,
      largura: 184 * carga,
      cor: carga >= 1 ? 'var(--pi-ok)' : carga > 0 ? 'var(--pi-ink)' : 'var(--pi-linha)',
      borda: carga > 0 && carga < 1 ? 'var(--pi-ink)' : 'var(--pi-borda)',
    }
  })

  const barramentoOp = win(t, 8.5, 8.8)
  const barramentoTraco = 100 - 100 * easeInOut(win(t, 8.6, 9.5))

  const val = easeOut(win(t, 9.7, 10.4))
  const valCheck = easeOut(win(t, 10.7, 11.2))

  const ramos = SAIDAS.map((_, i) => {
    const s = 11.2 + i * 0.3
    return { op: win(t, s - 0.1, s + 0.2), traco: 100 - 100 * easeInOut(win(t, s, s + 0.75)) }
  })

  const saidas = SAIDAS.map((s, i) => {
    const o = 11.7 + i * 0.6
    const p = easeOut(win(t, o, o + 0.7))
    return { titulo: s[0], sub: s[1], y: s[2], op: p, x: (1 - p) * 16, check: win(t, o + 0.6, o + 1.0) }
  })

  const retornoOp = win(t, 14.3, 14.7)
  const desenhoRetorno = easeInOut(win(t, 14.4, 15.8))
  const retornoTraco = desenhoRetorno < 1 ? '100 100' : '2.6 3.4'
  const retornoOff = desenhoRetorno < 1 ? 100 - 100 * desenhoRetorno : -((t * 9) % 6)

  const etapa = ETAPAS.reduce((acc, [em], i) => (t >= em ? i : acc), 0)
  const tom = etapa >= 6 ? 'ok' : 'andamento'

  return (
    <figure className="pipe" ref={caixa}>
      <figcaption className="pipe__cap">
        <span className={`pipe__dot pipe__dot--${tom}`} aria-hidden="true" />
        Como a sua fábrica vira programa pronto
      </figcaption>

      <div className="pipe__palco">
        <svg viewBox="0 0 960 546" className="pipe__svg" role="img"
             aria-label="O contexto da fábrica alimenta cinco agentes especialistas; o profissional aprova; saem o programa CNC, a folha de processo, a versão e o conhecimento registrado, que volta para a base.">
          <defs>
            <pattern id="pipeGrid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="1.1" fill="var(--pi-grade)" />
            </pattern>
          </defs>

          <g opacity={num(cena)}>
            <rect x="0" y="0" width="960" height="546" fill="url(#pipeGrid)" />

            {/* rótulos das colunas */}
            <g fontSize="13.5" fill="var(--pi-fraco)">
              <text x="14" y="44" opacity={num(easeOut(win(t, 0.1, 0.8)))}>O que a fábrica já sabe</text>
              <text x="246" y="44" opacity={num(easeOut(win(t, 2.7, 3.3)))}>Agentes especialistas</text>
              <text x="506" y="44" opacity={num(easeOut(win(t, 9.3, 9.9)))}>Onde a pessoa entra</text>
              <text x="690" y="44" opacity={num(easeOut(win(t, 11.1, 11.7)))}>O que sai pronto</text>
            </g>

            {/* moldura dos agentes */}
            <rect x="246" y="62" width="236" height="340" rx="20" fill="var(--pi-sutil)"
                  stroke="var(--pi-borda)" strokeWidth="1" strokeDasharray="6 6" opacity={num(painel)} />
            <rect x="246" y="62" width="236" height="340" rx="20" fill="none"
                  stroke="var(--pi-ok)" strokeWidth="1.4" opacity={num(brilhoPainel)} />

            {/* entradas */}
            {entradas.map((e, i) => (
              <g key={i} transform={`translate(${num(e.x)} 0)`} opacity={num(e.op)}>
                <rect x="14" y={e.y} width="202" height="50" rx="14" fill="var(--pi-papel)"
                      stroke="var(--pi-borda)" strokeWidth="1.2" />
                <text x="30" y={e.y + 20} fontSize="12.5" fill="var(--pi-fraco)">{e.rotulo}</text>
                <text x="30" y={e.y + 39} fontSize="14.5" fill="var(--pi-ink)">{e.valor}</text>
              </g>
            ))}

            {/* fios das entradas até os agentes */}
            <g stroke="var(--pi-linha)" strokeWidth="1.3" fill="none">
              {fios.map((f, i) => (
                <line key={i} x1="216" y1={f.y} x2="258" y2={f.y} opacity={num(f.op)}
                      pathLength="100" strokeDasharray="100" strokeDashoffset={num(f.traco)} />
              ))}
            </g>
            <g fill="var(--pi-ink)">
              {fios.map((f, i) => (
                <circle key={i} cx={num(f.pontoX)} cy={f.y} r="3.4" opacity={f.pontoOp} />
              ))}
            </g>

            {/* agentes */}
            {agentes.map((a, i) => (
              <g key={i} opacity={num(a.op)}>
                <rect x="258" y={a.y} width="212" height="50" rx="14" fill="var(--pi-papel)"
                      stroke={a.borda} strokeWidth="1.2" />
                <circle cx="278" cy={a.y + 25} r="5" fill={a.cor} />
                <text x="292" y={a.y + 22} fontSize="14" fill="var(--pi-ink)">{a.titulo}</text>
                <text x="292" y={a.y + 39} fontSize="12.5" fill="var(--pi-fraco)">{a.sub}</text>
                <rect x="272" y={a.y + 47} width={num(a.largura)} height="2.6" rx="1.3"
                      fill="var(--pi-ok)" opacity=".85" />
              </g>
            ))}

            {/* barramento até a validação */}
            <g stroke="var(--pi-linha)" strokeWidth="1.3" fill="none" opacity={num(barramentoOp)}>
              <path d="M470 113 H488 M470 173 H488 M470 233 H488 M470 293 H488 M470 353 H488"
                    pathLength="100" strokeDasharray="100" strokeDashoffset={num(barramentoTraco)} />
              <path d="M488 113 V353" pathLength="100" strokeDasharray="100" strokeDashoffset={num(barramentoTraco)} />
              <path d="M488 233 H506" pathLength="100" strokeDasharray="100" strokeDashoffset={num(barramentoTraco)} />
            </g>

            {/* validação do profissional */}
            <g transform={`translate(${num((1 - val) * 16)} 0)`} opacity={num(val)}>
              <rect x="506" y="150" width="150" height="170" rx="18" fill="var(--pi-papel)"
                    stroke={valCheck > 0.5 ? 'var(--pi-ok-borda)' : 'var(--pi-borda)'} strokeWidth="1.2" />
              <text x="581" y="196" textAnchor="middle" fontSize="16" fill="var(--pi-ink)">Validação</text>
              <text x="581" y="216" textAnchor="middle" fontSize="14" fill="var(--pi-ink)">do profissional</text>
              <text x="581" y="242" textAnchor="middle" fontSize="12" fill="var(--pi-fraco)">aprovação do</text>
              <text x="581" y="259" textAnchor="middle" fontSize="12" fill="var(--pi-fraco)">programador antes</text>
              <text x="581" y="276" textAnchor="middle" fontSize="12" fill="var(--pi-fraco)">de qualquer passo</text>
              <circle cx="581" cy="300" r="14" fill="none" stroke="var(--pi-ok-borda)" strokeWidth="1.4" opacity={num(valCheck)} />
              <text x="581" y="306" textAnchor="middle" fontSize="15" fill="var(--pi-ok)" opacity={num(valCheck)}>✓</text>
            </g>

            {/* ramos até as saídas */}
            <g stroke="var(--pi-linha)" strokeWidth="1.3" fill="none">
              {[125, 193, 261, 329].map((destino, i) => (
                <path key={i} d={`M656 235 C 674 235 674 ${destino} 690 ${destino}`}
                      opacity={num(ramos[i].op)} pathLength="100" strokeDasharray="100"
                      strokeDashoffset={num(ramos[i].traco)} />
              ))}
            </g>

            {/* saídas */}
            {saidas.map((s, i) => (
              <g key={i} transform={`translate(${num(s.x)} 0)`} opacity={num(s.op)}>
                <rect x="690" y={s.y} width="254" height="58" rx="14" fill="var(--pi-papel)"
                      stroke={i === 3 ? 'var(--pi-ok-borda)' : 'var(--pi-borda)'} strokeWidth="1.2" />
                <g transform={`translate(706 ${s.y + 21})`}>{ICONES[i]}</g>
                <text x="734" y={s.y + 26} fontSize="15" fill="var(--pi-ink)">{s.titulo}</text>
                <text x="734" y={s.y + 45} fontSize="13" fill="var(--pi-fraco)">{s.sub}</text>
                <text x="924" y={s.y + 45} textAnchor="end" fontSize="13" fill="var(--pi-ok)"
                      opacity={num(s.check)}>✓</text>
              </g>
            ))}

            {/* o aprendizado voltando para a base */}
            <g opacity={num(retornoOp)}>
              <path d="M817 358 V 460 Q 817 478 799 478 H 382 Q 364 478 364 460 V 406"
                    fill="none" stroke="var(--pi-ok)" strokeWidth="1.4" pathLength="100"
                    strokeDasharray={retornoTraco} strokeDashoffset={num(retornoOff)} />
              <path d="M358 412 L364 402 L370 412" fill="none" stroke="var(--pi-ok)" strokeWidth="1.4"
                    opacity={num(easeOut(win(t, 15.7, 16.1)))} />
              <text x="600" y="506" textAnchor="middle" fontSize="13" fill="var(--pi-ok)"
                    opacity={num(easeOut(win(t, 16.0, 16.6)))}>
                o que foi aprendido volta para a base
              </text>
            </g>
          </g>
        </svg>
      </div>

      <p className="pipe__arraste">arraste para o lado para ver o fluxo inteiro</p>

      {/* a frase que resume */}
      <div className="pipe__resumo">
        <span className="pipe__filete" style={{ width: `${(320 * easeInOut(win(t, 17.4, 18.3))).toFixed(0)}px` }} />
        <p>
          <span style={{ opacity: num(easeOut(win(t, 17.7, 18.3))) }}>Contexto da fábrica</span>
          <i style={{ opacity: num(easeOut(win(t, 18.2, 18.8))) }}>→</i>
          <span style={{ opacity: num(easeOut(win(t, 18.2, 18.8))) }}>agentes especialistas</span>
          <i style={{ opacity: num(easeOut(win(t, 18.7, 19.3))) }}>→</i>
          <span style={{ opacity: num(easeOut(win(t, 18.7, 19.3))) }}>aprovação</span>
          <i style={{ opacity: num(easeOut(win(t, 19.2, 19.8))) }}>→</i>
          <b style={{ opacity: num(easeOut(win(t, 19.2, 19.8))) }}>programa pronto</b>
        </p>
      </div>

      <div className="pipe__barra">
        <span className="pipe__etapas" aria-hidden="true">
          {ETAPAS.map((_, i) => (
            <i key={i} className={i <= etapa ? (etapa >= 6 ? 'is-ok' : 'is-feita') : undefined} />
          ))}
        </span>
        <span className="pipe__etapa-nome">{ETAPAS[etapa][1]}</span>
        <span className="pipe__botoes">
          <button type="button" onClick={() => setTocando(p => !p)}>
            {tocando ? 'Pausar' : 'Reproduzir'}
          </button>
          <button type="button" onClick={() => { setT(0); setTocando(true) }}>Reiniciar</button>
        </span>
      </div>
    </figure>
  )
}

/* ── ícones das saídas ─────────────────────────────────────────────────────── */
const traco = {
  fill: 'none', stroke: 'var(--pi-fraco)', strokeWidth: 1.3,
  strokeLinecap: 'round', strokeLinejoin: 'round',
}
const ICONES = [
  <g {...traco}><rect x="2" y="1" width="12" height="14" rx="2.5" /><path d="M5 6 H11 M5 9 H11 M5 12 H9" /></g>,
  <g {...traco}>
    <path d="M6 4 H14 M6 8 H14 M6 12 H12" />
    <circle cx="2.6" cy="4" r="1.1" fill="var(--pi-fraco)" stroke="none" />
    <circle cx="2.6" cy="8" r="1.1" fill="var(--pi-fraco)" stroke="none" />
    <circle cx="2.6" cy="12" r="1.1" fill="var(--pi-fraco)" stroke="none" />
  </g>,
  <g {...traco}>
    <path d="M4 5 V11 M4 8 H10" />
    <circle cx="4" cy="3" r="2" /><circle cx="4" cy="13" r="2" /><circle cx="12" cy="8" r="2" />
  </g>,
  <g {...traco}><path d="M8 2 L14 5 L8 8 L2 5 Z" /><path d="M2 9 L8 12 L14 9" /></g>,
]
