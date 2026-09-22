import { useEffect, useRef, useState } from 'react'
import wordmarkSvg from '@/assets/hefesto-wordmark.svg?raw'
import hSvg from '@/assets/hefesto-h.svg?raw'
import AnimacaoCNC from '@/components/AnimacaoCNC'
import AnimacaoPipeline from '@/components/AnimacaoPipeline'
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
  useEffect(() => {
    const onScroll = () => setPresa(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`nav${presa ? ' is-stuck' : ''}`}>
      <div className="container nav__inner">
        <a className="nav__brand" href="#topo">
          <Wordmark />
          <span className="nav__badge">em desenvolvimento</span>
        </a>
        <a className="btn btn--sm" href="#lista">Entrar na lista</a>
      </div>
    </header>
  )
}

// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="hero" id="topo">
      <div className="container hero__grid">
        <div>
          <span className="eyebrow">Programação CNC assistida</span>
          <h1 className="hero__h1">O programa sai com as <em>regras da sua fábrica</em>.</h1>
          <p className="lede hero__lede">
            O Hefesto lê o desenho, consulta o que você cadastrou — suas máquinas, seus dispositivos,
            suas cavidades — e monta o programa. Onde falta informação, ele para e pergunta.
            Não inventa.
          </p>
          <div className="hero__actions">
            <a className="btn" href="#lista">Entrar na lista de espera</a>
            <span className="hero__note">Leva 20 segundos. Sem compromisso.</span>
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
    t: 'Quem programa é sempre o mesmo',
    d: 'Se ele falta, tira férias ou sai da empresa, a máquina espera. O conhecimento não está em lugar nenhum além da cabeça dele.',
  },
  {
    t: 'A regra da casa não está no sistema',
    d: 'Está no caderno, no post-it, no programa antigo que alguém salvou. Cada um aplica do seu jeito, e ninguém confere.',
  },
  {
    t: 'Peça parecida recomeça do zero',
    d: 'Mesmo material, mesma família, mesmo dispositivo — e o programa é escrito de novo, linha por linha, como se fosse a primeira vez.',
  },
]

function Problema() {
  return (
    <section className="problema" id="problema">
      <div className="container">
        <div className="problema__head reveal">
          <span className="eyebrow">O problema</span>
          <h2 className="h2" style={{ marginTop: 'var(--s5)' }}>
            Hoje o programa mora na cabeça de uma pessoa.
          </h2>
        </div>
        <div className="problema__list">
          {PROBLEMAS.map(p => (
            <article className="problema__item reveal" key={p.t}>
              <span className="problema__rule" aria-hidden="true" />
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
    d: 'Máquinas e comandos, ferramentas, dispositivos de fixação. Dá para puxar do sistema que você já usa ou cadastrar na mão — e é uma vez só: o que entra aqui vale para toda peça que vier depois.',
  },
  {
    t: 'Guarde o que se repete',
    d: 'As operações de rotina viram receita. Você cadastra a cavidade uma vez, com as ferramentas e a ordem certa, e ela passa a ser reconhecida pela designação no desenho.',
  },
  {
    t: 'Ensine o jeito da casa',
    d: 'Cole programas que já rodaram e foram aprovados. O Hefesto aprende o padrão de escrita e as práticas da sua controladora — o programa sai parecido com o que o seu pessoal escreve, não com G-code de manual.',
  },
  {
    t: 'Suba o projeto',
    d: 'Ele lê o desenho, cruza com o que está cadastrado e monta o programa: zero-peça pelo dispositivo, um programa por fixação, os ciclos da sua máquina. Onde falta informação, para e pergunta.',
  },
  {
    t: 'Valide o retorno',
    d: 'O que você corrigir na revisão volta para o cadastro. Cada peça que passa por aqui deixa a próxima mais rápida — o sistema aprende com a sua fábrica, não contra ela.',
  },
]

function Como() {
  return (
    <section className="como" id="como">
      <div className="container como__inner">
        <div className="como__head reveal">
          <span className="eyebrow">Como funciona</span>
          <h2 className="h2" style={{ marginBlock: 'var(--s5)' }}>
            Você ensina a sua fábrica. Ele não esquece.
          </h2>
          <p className="lede">
            Os três primeiros passos são de cadastro e você faz uma vez.
            Do quarto em diante é o dia a dia.
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
    t: 'Não inventa parâmetro de corte',
    d: 'Ferramenta sem cadastro? Ele avisa que falta o avanço e a rotação. Não chuta um número para preencher a linha.',
  },
  {
    t: 'Não gera o que não consegue validar',
    d: 'Operação que ele não sabe conferir, ele não escreve. Prefere parar e explicar a entregar programa errado.',
  },
  {
    t: 'Não substitui o programador',
    d: 'O que sai é um rascunho revisável, com a memória de cálculo à vista. Quem aprova e manda para a máquina é você.',
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
          <span className="eyebrow">Confiança</span>
          <h2 className="h2" style={{ marginBlock: 'var(--s5)' }}>O que ele não faz.</h2>
          <p className="naofaz__lede">
            Num programa CNC, o erro não volta atrás — quebra ferramenta, perde peça, para a máquina.
            Por isso o Hefesto foi desenhado para recuar quando não tem certeza.
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
          <span>Em desenvolvimento, <b>validado peça a peça com um usineiro de verdade</b>.</span>
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
          <span className="eyebrow">Por dentro</span>
          <h2 className="h2">Não é um robô só. São especialistas.</h2>
          <p className="lede">
            Cada parte do problema tem um agente que entende dela: a máquina, o
            ferramental, o processo, a programação e o jeito da casa. Nada segue
            sem a sua aprovação — e o que você corrige volta para a base.
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
    d: 'A fila da fábrica, ordenada por atraso e urgência. O que estourou o prazo aparece em vermelho antes de qualquer outra coisa.',
  },
  {
    arq: 'cadastro-de-maquinas',
    titulo: 'Máquinas',
    rota: '/maquinas',
    d: 'Cada centro com seu comando, número de eixos e curso. É daqui que sai a regra que o programa vai obedecer.',
  },
  {
    arq: 'cadastro-de-dispositivos',
    titulo: 'Dispositivos de fixação',
    rota: '/dispositivos',
    d: 'Morsas, placas, divisores e batentes especiais, com vida útil e inspeção. O dispositivo é quem define o zero-peça.',
  },
  {
    arq: 'agentcode',
    titulo: 'AgentCode',
    rota: '/agentcode',
    d: 'O agente antes de receber o desenho: recortar as faces, conferir o contrato, gerar o programa.',
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
          <span className="eyebrow">O sistema hoje</span>
          <h2 className="h2">Por dentro do Hefesto.</h2>
          <p className="lede">
            Estas telas são do sistema rodando de verdade, com o parque fabril
            cadastrado. Não são maquete.
          </p>

          <p className="nota">
            <span className="nota__rotulo">Nota · versão em desenvolvimento</span>
            <span>
              O Hefesto está em estágio final de implementação.{' '}
              <b>A interface e a usabilidade ainda vão mudar até o lançamento</b> —
              nada do que aparece aqui é definitivo.
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
  'Entrada por ordem de chegada, em grupos pequenos.',
  'A gente conversa antes de liberar — para cadastrar suas máquinas junto com você.',
  'Sem cobrança nesta fase.',
]

function Lista() {
  return (
    <section className="lista" id="lista">
      <div className="container lista__grid">
        <div className="lista__head reveal">
          <span className="eyebrow">Lista de espera</span>
          <h2 className="h2">Quer testar quando abrir?</h2>
          <p className="lede">
            Vamos abrir para um grupo pequeno de fábricas. Deixe seu contato e a gente chama
            por ordem de entrada.
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
          <p>Programação CNC assistida para metalúrgicas.</p>
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
      <div className="barra-mobile">
        <a className="btn btn--block" href="#lista">Entrar na lista de espera</a>
      </div>
    </>
  )
}
