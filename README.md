# Landing de lista de espera — Hefesto

Página única para captar contatos de fábricas interessadas em testar o Hefesto.
React + Vite, CSS com variáveis, hospedada na Cloudflare. Sem vídeo, sem
biblioteca de animação: a cena do hero é SVG desenhado no navegador.

- Paleta e tipografia: navy/grafite do produto + DM Sans / Rethink Sans
- O estudo que originou estas escolhas fica em `docs/estudo-techmenow.md`, fora
  do versionamento: ele descreve o site de captação da TechMeNow que está no ar.

## Rodar na sua máquina

```bash
npm install
npm run dev
```

Abre em <http://localhost:5180>. O formulário vai falhar em `npm run dev` — o
`/api/lead` só existe no Worker. Para testar a página **com** o formulário:

```bash
npm run build
npx wrangler dev --port 8788 --local
```

## Publicar

```bash
npm run deploy
```

Na primeira vez o Wrangler pede login na Cloudflare pelo navegador.

---

## Onde os contatos são gravados

`formulário → Worker (/api/lead) → Apps Script → planilha do Google`

**O Worker só responde "ok" se a planilha confirmar a gravação.** Se a planilha
recusar ou estiver fora do ar, o visitante vê o erro e um canal alternativo
(WhatsApp/e-mail) em vez de um falso sucesso — e o contato fica registrado no
log do Worker, recuperável com `npx wrangler tail`.

### Configurar a planilha (uma vez, ~5 min)

1. Crie uma planilha nova no Google Sheets.
2. **Extensões › Apps Script**, apague o conteúdo e cole
   [`apps-script/Codigo.gs`](apps-script/Codigo.gs).
3. Troque `TOKEN` por uma frase secreta sua.
4. **Implantar › Nova implantação › App da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
5. Abra a URL `/exec` no navegador. Tem que responder `{"ok":true,"vivo":true}`.
6. Cadastre os segredos na Cloudflare:

```bash
npx wrangler secret put SHEET_URL
npx wrangler secret put SHEET_TOKEN
```

Para rodar o Worker local com a planilha de verdade, crie um `.dev.vars`
(já ignorado pelo git):

```
SHEET_URL="https://script.google.com/macros/s/.../exec"
SHEET_TOKEN="a mesma frase do passo 3"
```

### Conferir antes do evento

```bash
curl -X POST https://SEU-DOMINIO/api/lead \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","empresa":"Teste","email":"teste@teste.com.br"}'
```

Resposta esperada: `{"ok":true}` — e a linha aparecendo na planilha.
Apague a linha de teste depois.

---

## Estrutura

```
index.html                  meta tags, fontes (carregadas sem travar a página)
worker.js                   /api/lead, URL limpa da privacidade, cache
wrangler.toml               configuração da Cloudflare
apps-script/Codigo.gs       cola no Apps Script da planilha
public/
  assets/favicon.svg        o "h" do logotipo em quadrado navy
  aviso-de-privacidade.html  LGPD
src/
  assets/hefesto-wordmark.svg  logotipo vetorizado (usa currentColor)
  styles.css                 tokens + todas as seções
  App.jsx                    navbar, hero, problema, como, não-faz, lista, rodapé
  components/
    AnimacaoCNC.jsx/.css     a cena do desenho ao programa
    ListaDeEspera.jsx        formulário, validação e estados de erro/sucesso
tools/vetorizar-logo.py      refaz o SVG se o logotipo mudar
```

## Onde mexer no texto

Tudo em `src/App.jsx`, no topo de cada seção: as listas `PROBLEMAS`, `PASSOS`,
`NAOFAZ` e `PONTOS`. O título do hero está no componente `Hero`.

O WhatsApp e o e-mail de emergência do formulário estão em
`src/components/ListaDeEspera.jsx` (`FALLBACK_WHATS` e `FALLBACK_EMAIL`) —
**trocar antes de publicar**, hoje é um número de exemplo.
