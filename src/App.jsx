import { useEffect, useRef, useState } from 'react'
import wordmarkSvg from '@/assets/hefesto-wordmark.svg?raw'
import hSvg from '@/assets/hefesto-h.svg?raw'
import AnimacaoCNC from '@/components/AnimacaoCNC'
import AnimacaoPipeline from '@/components/AnimacaoPipeline'
import TracosHero from '@/components/TracosHero'
import ListaDeEspera from '@/components/ListaDeEspera'

const ANO = new Date().getFullYear()

function Wordmark() {
  return <span className="wordmark" role="img" aria-label="Hefesto"
               dangerouslySetInnerHTML={{ __html: wordmarkSvg }} />
}

const Check = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 12.5 9.5 18 20 6.5" />
  </svg>
)

const Xis = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

// ── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [presa, setPresa] = useState(false)
  const [mostrarCta, setMostrarCta] = useState(false)

  useEffect(() => {
    const problema = document.getElementById('problema')

    const aoRolar = () => {
      setPresa(window.scrollY > 8)
      // O botão do topo só entra quando a seção do problema aparece: enquanto
      // o hero está na tela, o botão dele já faz esse trabalho, e bem maior.
      if (problema) {
        setMostrarCta(problema.getBoundingClientRect().top < window.innerHeight * 0.85)
      }
    }

    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    window.addEventListener('resize', aoRolar)
    return () => {
      window.removeEventListener('scroll', aoRolar)
      window.removeEventListener('resize', aoRolar)
    }
  }, [])

  return (
    <header className={`nav${presa ? ' is-stuck' : ''}`}>
      <div className="container nav__inner">
        <a className="nav__brand" href="#topo">
          <Wordmark />
          <span className="nav__badge">em desenvolvimento</span>
        </a>
        {/* inert enquanto escondido: não recebe foco nem clique */}
        <div className={`nav__cta${mostrarCta ? ' is-visivel' : ''}`} inert={!mostrarCta}>
          <a className="btn btn--sm" href="#lista">Entrar na lista</a>
        </div>
      </div>
    </header>
  )
}

// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  // O título sobe de baixo toda vez que o hero volta a aparecer — não só no
  // primeiro carregamento. Por isso o estado acompanha entrar E sair da tela.
  const [naTela, setNaTela] = useState(false)
  const titulo = useRef(null)

  useEffect(() => {
    const el = titulo.current
    if (!el || !('IntersectionObserver' in window)) {
      setNaTela(true)   // sem observer, o título simplesmente fica visível
      return
    }
    // threshold 0: só reinicia quando o título saiu inteiro da tela, para
    // ninguém ver o desaparecimento no meio da rolagem.
    const obs = new IntersectionObserver(([e]) => setNaTela(e.isIntersecting), { threshold: 0 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section className="hero" id="topo">
      <TracosHero />
      <div className="container hero__grid">
        <div className="hero__copy">
          <h1 ref={titulo} className={`hero__h1${naTela ? ' is-dentro' : ''}`}>
            {/* A ênfase começa em "padrão": com o artigo dentro, a quebra do
                celular deixava um "o" sublinhado sozinho no fim da linha. */}
            A inteligência artificial que programa no CNC seguindo o{' '}
            <em>padrão da sua fábrica</em>.
          </h1>
          <p className={`hero__sub${naTela ? ' is-dentro' : ''}`}>
            Conecte as máquinas, ferramentas e dispositivos que você já tem. O Hefesto
            aprende com os programas que a sua equipe aprovou.
          </p>
          <div className="hero__actions">
            <a className="btn" href="#lista">Entrar na lista de espera</a>
            <span className="hero__note">Cadastro em 20 segundos. Sem compromisso.</span>
          </div>
        </div>
        <AnimacaoCNC />
      </div>
    </section>
  )
}

// ── O problema ───────────────────────────────────────────────────────────────
const PROBLEMAS = [
  {
    t: 'A programação depende sempre das mesmas pessoas',
    d: 'Férias, afastamento ou desligamento de um programador experiente interrompem a produção. O critério que ele aplica não está registrado em nenhum sistema.',
  },
  {
    t: 'O padrão da empresa não está documentado',
    d: 'Ele vive em anotações pessoais, em planilhas e em programas antigos arquivados. Cada profissional aplica o próprio critério, e não existe conferência.',
  },
  {
    t: 'Peças semelhantes são reprogramadas do zero',
    d: 'Mesmo material, mesma família de peça e mesmo dispositivo de fixação. Ainda assim o programa é reescrito linha por linha, sem aproveitar nada do que já foi validado.',
  },
]

function Problema() {
  return (
    <section className="problema" id="problema">
      <div className="container">
        <div className="problema__head reveal">
          <h2 className="h2">
            O conhecimento técnico da sua fábrica está retido na memória de poucos profissionais.
          </h2>
        </div>
        <div className="problema__list">
          {PROBLEMAS.map(p => (
            <article className="problema__item reveal" key={p.t}>
              <h3>{p.t}</h3>
              <p>{p.d}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Como funciona ────────────────────────────────────────────────────────────
const PASSOS = [
  {
    t: 'Cadastre a sua fábrica',
    d: 'Máquinas e comandos, ferramentas e dispositivos de fixação. A importação pode partir dos sistemas que você já utiliza ou ser feita manualmente. É uma configuração única, válida para todas as peças seguintes.',
  },
  {
    t: 'Registre as operações recorrentes',
    d: 'As rotinas da fábrica viram cadastro. A cavidade é configurada uma única vez, com as ferramentas e a sequência corretas, e passa a ser reconhecida pela designação indicada no desenho.',
  },
  {
    t: 'Importe os programas já aprovados',
    d: 'O sistema analisa programas que já rodaram na sua fábrica e absorve o padrão de escrita e as práticas da sua controladora. O código gerado sai no formato que a sua equipe reconhece, e não no G-code genérico de manual.',
  },
  {
    t: 'Suba o projeto',
    d: 'O sistema lê o desenho, cruza as informações com o cadastro e monta o programa: zero-peça definido pelo dispositivo, um programa por fixação e os ciclos da máquina selecionada. Quando falta informação, ele interrompe e pergunta.',
  },
  {
    t: 'Valide o retorno',
    d: 'As correções feitas na revisão retornam ao cadastro. Cada peça processada encurta o tempo da próxima, porque o critério da sua fábrica passa a fazer parte da base.',
  },
]

function Como() {
  return (
    <section className="como" id="como">
      <div className="container como__inner">
        <div className="como__head reveal">
          <h2 className="h2" style={{ marginBottom: 'var(--s5)' }}>
            Você configura uma vez. O sistema aplica em todas as peças.
          </h2>
          <p className="lede">
            Os três primeiros passos são de configuração e acontecem uma única vez.
            Do quarto em diante, é a rotina de produção.
          </p>
        </div>
        <div className="passos">
          {PASSOS.map((p, i) => (
            <article className="passo reveal" key={p.t} style={{ '--i': i }}>
              <span className="passo__n" aria-hidden="true" />
              <div>
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── O que ele não faz ────────────────────────────────────────────────────────
const NAOFAZ = [
  {
    t: 'Não estima parâmetros de corte',
    d: 'Se a ferramenta não tem avanço e rotação cadastrados, o sistema sinaliza a ausência e interrompe a geração. Nenhum valor é arbitrado para completar a linha.',
  },
  {
    t: 'Não gera o que não consegue validar',
    d: 'Operações que o sistema não é capaz de conferir não são escritas. A execução para no ponto exato e informa qual verificação não foi possível.',
  },
  {
    t: 'Não substitui o programador',
    d: 'A saída é um programa em rascunho, com a memória de cálculo disponível para auditoria. A aprovação e o envio à máquina continuam sendo decisão da sua equipe.',
  },
]

function NaoFaz() {
  return (
    <section className="naofaz" id="confianca">
      {/* Marca d'água: o "h" do logotipo deitado, saindo pela borda. */}
      <span className="naofaz__marca" aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: hSvg }} />
      <div className="container">
        <div className="naofaz__head reveal">
          <h2 className="h2" style={{ marginBottom: 'var(--s5)' }}>O que o Hefesto não faz.</h2>
          <p className="naofaz__lede">
            No chão de fábrica, um erro de programa não se corrige depois: ele quebra ferramenta, perde material
            e para a máquina. Por isso o Hefesto foi projetado para interromper o processo sempre que não tiver
            informação suficiente para decidir.
          </p>
        </div>
        <div className="naofaz__list">
          {NAOFAZ.map(n => (
            <article className="naofaz__item reveal" key={n.t}>
              <span className="naofaz__x"><Xis /></span>
              <h3>{n.t}</h3>
              <p>{n.d}</p>
            </article>
          ))}
        </div>
        <p className="naofaz__foot">
          <span>Em desenvolvimento, com <b>validação peça a peça conduzida ao lado de um usineiro em atividade</b>.</span>
        </p>
      </div>
    </section>
  )
}

// ── Os agentes ───────────────────────────────────────────────────────────────
function Agentes() {
  return (
    <section className="agentes" id="agentes">
      <div className="container">
        <div className="agentes__head reveal">
          <h2 className="h2">Não é um único modelo. São agentes especializados.</h2>
          <p className="lede">
            Cada etapa do processo é conduzida por um agente especializado: máquina,
            ferramental, processo, programação e o padrão da empresa. Nenhuma etapa
            avança sem aprovação, e toda correção retorna para a base de conhecimento.
          </p>
        </div>
        <div className="agentes__cena reveal">
          <AnimacaoPipeline />
        </div>
      </div>
    </section>
  )
}

// ── O sistema por dentro ─────────────────────────────────────────────────────
const TELAS = [
  {
    arq: 'ordens-de-producao',
    titulo: 'Ordens de produção',
    rota: '/ordens',
    d: 'A fila de produção ordenada por atraso e prioridade. Ordens fora do prazo são sinalizadas em vermelho no topo da lista.',
  },
  {
    arq: 'cadastro-de-maquinas',
    titulo: 'Máquinas',
    rota: '/maquinas',
    d: 'Cada centro de usinagem com o seu comando, número de eixos e curso. É este cadastro que define as regras que o programa deve obedecer.',
  },
  {
    arq: 'cadastro-de-dispositivos',
    titulo: 'Dispositivos de fixação',
    rota: '/dispositivos',
    d: 'Morsas, placas, divisores e batentes especiais, com controle de vida útil e inspeção. O dispositivo é o elemento que determina o zero-peça.',
  },
  {
    arq: 'agentcode',
    titulo: 'AgentCode',
    rota: '/agentcode',
    d: 'O agente antes do envio do desenho: separar as faces, conferir o contrato de usinagem e gerar o programa.',
  },
]

function Sistema() {
  const [ativa, setAtiva] = useState(0)
  const [ampliada, setAmpliada] = useState(false)
  const trilho = useRef(null)
  const dialogo = useRef(null)
  const tela = TELAS[ativa]

  // <dialog> nativo: o Esc e o foco preso já vêm de graça do navegador.
  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (ampliada && !d.open) d.showModal()
    else if (!ampliada && d.open) d.close()
  }, [ampliada])

  function navegarPorTeclado(e) {
    const passo = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]
    if (!passo) return
    e.preventDefault()
    const proxima = (ativa + passo + TELAS.length) % TELAS.length
    setAtiva(proxima)
    trilho.current?.querySelectorAll('button')[proxima]?.focus()
  }

  return (
    <section className="sistema" id="sistema">
      <div className="container">
        <div className="sistema__head reveal">
          <h2 className="h2">Por dentro do Hefesto.</h2>
          <p className="lede">
            As telas abaixo são do sistema em operação, com um parque fabril real
            cadastrado. Não são protótipos.
          </p>

          <p className="nota">
            <span className="nota__rotulo">Nota · versão em desenvolvimento</span>
            <span>
              O Hefesto está em estágio final de implementação.{' '}
              <b>A interface e a usabilidade ainda serão alteradas até o lançamento.</b>{' '}
              As imagens representam a versão de desenvolvimento, e não a versão final do produto.
            </span>
          </p>
        </div>

        <div className="vitrine reveal">
          <div className="vitrine__trilho" role="tablist" aria-orientation="vertical"
               aria-label="Telas do sistema" ref={trilho} onKeyDown={navegarPorTeclado}>
            {TELAS.map((t, i) => (
              <button
                key={t.arq}
                type="button"
                role="tab"
                id={`aba-${t.arq}`}
                aria-controls="palco-telas"
                aria-selected={i === ativa}
                tabIndex={i === ativa ? 0 : -1}
                className="vitrine__aba"
                onClick={() => setAtiva(i)}
              >
                <span className="vitrine__titulo">{t.titulo}</span>
                <span className="vitrine__rota">{t.rota}</span>
              </button>
            ))}
          </div>

          <div className="vitrine__palco">
            <div className="janela">
              <div className="janela__barra">
                <span className="janela__luzes" aria-hidden="true"><i /><i /><i /></span>
                <span className="janela__rota">{tela.rota}</span>
                <span className="janela__tag">em desenvolvimento</span>
                <button type="button" className="janela__ampliar" onClick={() => setAmpliada(true)}>
                  Ampliar
                </button>
              </div>
              <div className="janela__tela" id="palco-telas" role="tabpanel"
                   aria-labelledby={`aba-${tela.arq}`}>
                {/* As telas acima da atual saem por cima, as de baixo entram por
                    baixo — o movimento acompanha a ordem do trilho. */}
                {TELAS.map((t, i) => (
                  <img
                    key={t.arq}
                    src={`/assets/telas/${t.arq}.webp`}
                    alt={i === ativa ? `Tela de ${t.titulo} do Hefesto` : ''}
                    className={i === ativa ? 'is-ativa' : i < ativa ? 'is-acima' : 'is-abaixo'}
                    aria-hidden={i === ativa ? undefined : 'true'}
                    width="1800" height="1143"
                    loading="lazy" decoding="async"
                  />
                ))}
              </div>
            </div>
            <p className="vitrine__legenda" key={tela.arq}>{tela.d}</p>
          </div>
        </div>

        <dialog className="lupa" ref={dialogo} onClose={() => setAmpliada(false)}
                onClick={e => { if (e.target === dialogo.current) setAmpliada(false) }}>
          <div className="lupa__topo">
            <span className="lupa__nome">{tela.titulo} <i>{tela.rota}</i></span>
            <button type="button" className="lupa__fechar" onClick={() => setAmpliada(false)}>
              Fechar
            </button>
          </div>
          <div className="lupa__rolagem">
            {ampliada && (
              <img src={`/assets/telas/${tela.arq}.webp`}
                   alt={`Tela de ${tela.titulo} do Hefesto, ampliada`}
                   width="1800" height="1143" />
            )}
          </div>
        </dialog>
      </div>
    </section>
  )
}

// ── Lista de espera ──────────────────────────────────────────────────────────
const PONTOS = [
  'Entrada por ordem de inscrição, em grupos reduzidos.',
  'Conversamos antes da liberação para cadastrar as suas máquinas junto com a sua equipe.',
  'Sem custo nesta fase.',
]

function Lista() {
  return (
    <section className="lista" id="lista">
      <div className="container lista__grid">
        <div className="lista__head reveal">
          <h2 className="h2">Participe do primeiro grupo de fábricas.</h2>
          <p className="lede">
            A liberação será feita para um número reduzido de fábricas. Registre os seus dados
            e faremos o contato por ordem de inscrição.
          </p>
          <ul className="lista__pontos">
            {PONTOS.map(p => (
              <li className="lista__ponto" key={p}><Check />{p}</li>
            ))}
          </ul>
        </div>
        <div className="reveal">
          <ListaDeEspera />
        </div>
      </div>
    </section>
  )
}

// ── Rodapé ───────────────────────────────────────────────────────────────────
function Rodape() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <Wordmark />
          <p>Programação CNC assistida por inteligência artificial para a indústria metalúrgica.</p>
        </div>
        <nav className="footer__links">
          <a href="/aviso-de-privacidade" target="_blank" rel="noopener noreferrer">Aviso de privacidade</a>
          <a href="mailto:contato@hefesto.com.br">contato@hefesto.com.br</a>
          <span>© {ANO} Hefesto</span>
        </nav>
      </div>
    </footer>
  )
}

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  // Revelação ao rolar.
  //
  // Checagem direta a cada quadro de rolagem, e não IntersectionObserver: o
  // observer deixava blocos curtos para trás e o texto ficava invisível de vez.
  // Aqui, se o elemento entrou na tela, ele aparece — sem exceção.
  useEffect(() => {
    let pendentes = Array.from(document.querySelectorAll('.reveal'))
    if (!pendentes.length) return

    let agendado = false

    const revelar = () => {
      agendado = false
      // Basta o topo do bloco ter cruzado a linha: o que já passou para cima
      // também conta. Senão, quem pula direto para o formulário e volta
      // rolando encontra texto invisível.
      const limite = window.innerHeight - 40
      pendentes = pendentes.filter(el => {
        if (el.getBoundingClientRect().top >= limite) return true
        el.classList.add('visible')
        return false
      })
      if (!pendentes.length) desligar()
    }

    const agendar = () => {
      if (agendado) return
      agendado = true
      requestAnimationFrame(revelar)
    }

    const desligar = () => {
      window.removeEventListener('scroll', agendar)
      window.removeEventListener('resize', agendar)
    }

    revelar() // o que já está na tela aparece na hora
    window.addEventListener('scroll', agendar, { passive: true })
    window.addEventListener('resize', agendar)
    return desligar
  }, [])

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problema />
        <Como />
        <NaoFaz />
        <Agentes />
        <Sistema />
        <Lista />
      </main>
      <Rodape />
    </>
  )
}
