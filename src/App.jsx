import { useEffect, useState } from 'react'
import wordmarkSvg from '@/assets/hefesto-wordmark.svg?raw'
import hSvg from '@/assets/hefesto-h.svg?raw'
import AnimacaoCNC from '@/components/AnimacaoCNC'
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
  // Revelação ao rolar: o que já está na tela aparece na hora, sem esperar o observer.
  useEffect(() => {
    const alvos = document.querySelectorAll('.reveal')
    if (!('IntersectionObserver' in window)) {
      alvos.forEach(el => el.classList.add('visible'))
      return
    }
    const obs = new IntersectionObserver(entradas => {
      entradas.forEach(e => {
        if (!e.isIntersecting) return
        e.target.classList.add('visible')
        obs.unobserve(e.target)
      })
    }, { threshold: 0.12 })

    alvos.forEach(el => {
      const r = el.getBoundingClientRect()
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('visible')
      else obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problema />
        <Como />
        <NaoFaz />
        <Lista />
      </main>
      <Rodape />
      <div className="barra-mobile">
        <a className="btn btn--block" href="#lista">Entrar na lista de espera</a>
      </div>
    </>
  )
}
