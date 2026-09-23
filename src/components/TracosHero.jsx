import './TracosHero.css'

/**
 * Traços que riscam o fundo do hero, um de cada vez.
 *
 * Mesma ideia do HeroTracing da TechMeNow, com duas diferenças: os traços são
 * navy em vez de azul-e-coral, e todos os caminhos declaram `pathLength="100"`
 * — assim um único conjunto de keyframes serve para todos, e o que muda entre
 * eles é só o atraso. Zero JavaScript: quem anima é o CSS.
 */

const W = 1440
const H = 620

// Curvas largas, espalhadas pela altura do hero. A ordem é a ordem em que
// entram em cena.
const TRACOS = [
  `M0,${H * 0.22} C${W * 0.22},${H * 0.05} ${W * 0.44},${H * 0.40} ${W * 0.66},${H * 0.20} S${W * 0.88},${H * 0.02} ${W},${H * 0.16}`,
  `M0,${H * 0.62} C${W * 0.18},${H * 0.44} ${W * 0.40},${H * 0.80} ${W * 0.64},${H * 0.58} S${W * 0.86},${H * 0.42} ${W},${H * 0.54}`,
  `M0,${H * 0.40} C${W * 0.26},${H * 0.66} ${W * 0.48},${H * 0.14} ${W * 0.72},${H * 0.44} S${W * 0.90},${H * 0.62} ${W},${H * 0.36}`,
  `M0,${H * 0.84} C${W * 0.24},${H * 0.66} ${W * 0.46},${H * 0.96} ${W * 0.70},${H * 0.76} S${W * 0.88},${H * 0.64} ${W},${H * 0.72}`,
  `M0,${H * 0.08} C${W * 0.20},${H * 0.28} ${W * 0.42},${H * 0.02} ${W * 0.68},${H * 0.26} S${W * 0.86},${H * 0.36} ${W},${H * 0.28}`,
  `M0,${H * 0.50} C${W * 0.16},${H * 0.72} ${W * 0.38},${H * 0.30} ${W * 0.60},${H * 0.50} S${W * 0.84},${H * 0.74} ${W},${H * 0.64}`,
]

export default function TracosHero() {
  return (
    <svg className="tracos" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
         aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="tracoNavy" x1="0" y1="0" x2="1" y2="0">
          {/* Sobre o azul do fundo, só o navy escuro ainda lê. */}
          <stop offset="0%"   stopColor="#111622" stopOpacity="0" />
          <stop offset="24%"  stopColor="#111622" stopOpacity=".62" />
          <stop offset="58%"  stopColor="#26334d" stopOpacity=".52" />
          <stop offset="100%" stopColor="#344a73" stopOpacity="0" />
        </linearGradient>
      </defs>
      {TRACOS.map((d, i) => (
        <path key={i} d={d} pathLength="100" style={{ animationDelay: `${i * 8}s` }} />
      ))}
    </svg>
  )
}
