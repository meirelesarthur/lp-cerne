# Auditoria UX/UI, acessibilidade, SEO e performance da LP Cerne

## Contexto
Pedido: análise completa da LP como UX/UI sênior (contraste, W3C, acessibilidade, estética, layout, copy, arquitetura e ordem das seções, SEO, velocidade), cruzada com o frontend (`GB.Cerne.FrontEnd`) e o banco (`init_db.sql`, 415 tabelas, schema `gbcerne`).
Base da análise: leitura de todo o código da LP (`index.html`, `App.tsx`, `Hero`, `GroundSection`, `Sections`, `HeroForm`, CSS, `vite.config.ts`, `_headers`), medições na página rodando (1440×900), docs 08/09/16/17 do `workbench`, árvore de navegação e páginas do front, nomes das tabelas do banco.
Entrega deste plano: o relatório abaixo, salvo depois em `workbench/docs/18-auditoria-ux-seo-performance.md`. Nada na LP é alterado agora. Os itens aprovados viram tarefas separadas.

**Limites da análise (o que não foi medido):** contraste real do texto sobre os quadros do vídeo/vidro (varia por quadro); Lighthouse/PageSpeed no domínio publicado (o 99 do doc 16 é preview local, com assets locais); consumo de memória do scrub de quadros em Android modesto; o dump de 2 GB só teve as tabelas listadas (sem dados). Funcionalidade do banco sem tela no front não é afirmada (regra já adotada no doc 17).

---

## 1. Veredito em uma tela
| Eixo | Nota | Resumo |
|---|---|---|
| Estética e marca | **A-** | Paleta verde coerente, tokens, tipografia Outfit, hero cinematográfico, bento caprichado. |
| Copy | **B+** | H1 forte, sem número inventado, específica. Cai por CTAs inconsistentes, jargão "cadastro" e promessas que se contradizem (lançamento × já disponível). |
| Arquitetura/ordem | **C+** | Há repetição (4 blocos dizem "um cadastro"); faltam preço/como começar e segurança real (prova social fica para depois, sem material). FAQ depois do form. |
| Conversão | **C** | A primeira tela não mostra proposta de valor nem formulário. Form completo só aos ~20.500 px. |
| Acessibilidade | **B-** | Base boa (landmarks, `aria-labelledby`, reduced-motion, contraste dos tokens). Falhas pontuais e algumas sérias (form invisível focável, sem skip link, sem pausa de vídeo). |
| SEO | **D+** | `<div id="root">` vazio, seções abaixo só montam após interação, sem canonical/robots/sitemap/JSON-LD, OG image fora do padrão. |
| Performance | **B+** (A- se o R2 ganhar domínio/CDN) | Carga inicial enxuta (doc 16: 280 KB), mas 59% da rolagem é scroll-jacking e há um chunk de 447 KB. |
| Pronto para publicar? | **Não** | 7 etiquetas "a validar" visíveis, WhatsApp desativado, política de privacidade sem link, form possivelmente sem endpoint em produção. |

---

## 2. Bloqueadores antes de publicar (P0)
1. **Formulário pode estar descartando leads em produção.** `submitLead` sem `VITE_FORM_ENDPOINT` faz mock local e mostra "Seu acesso está reservado". `.env.production` só define `VITE_ASSET_BASE`. Confirmar se o endpoint está nas variáveis do build (Cloudflare); se não, todo lead é perdido sem erro. Mitigação: em produção, falhar o build sem endpoint.
2. **7 etiquetas `.tbd` publicadas:** "texto a validar", "disponibilidade a validar", "número a definir", "a validar" (×3), "link". Mais o botão "Falar agora no WhatsApp" desativado (`aria-disabled`, `href="#contato"`) e "Política de Privacidade" que só rola para o form. LGPD exige a política acessível. Resolver ou esconder cada um.
3. **Primeira tela sem proposta de valor.** `.hero-copy` e `.hero-form-wrap` têm `opacity:0` até 86% de um pin de 420% (medido: opacidade 0 em scroll 0, 2860 e 3000 px). O visitante vê foto + "Role para conhecer" e só o botão do header. Mostrar H1, lead e CTA já no quadro 0 (sobre o véu esquerdo) e deixar o filme como progressão.
4. **Campos do hero invisíveis e focáveis.** `opacity:0` + `pointer-events:auto`, sem `visibility:hidden`: quem navega por Tab cai num form que não vê (WCAG 2.4.7). Usar `visibility`/`inert` até a fase de entrada.
5. **Links com âncora podem não funcionar.** `Below` só monta na 1ª interação (ou 6 s). Um link `/#contato` de campanha, e-mail ou WhatsApp pode abrir sem a seção existir, e não há tratamento de hash em `App.tsx`. Montar `Below` imediatamente se `location.hash` existir e rolar após montar. (Provável; confirmar em teste.)

---

## 3. Arquitetura e ordem das seções

### Como está hoje (13 blocos, 22.800 px a 900 px de altura)
Hero (pin 420%) → Escopo (4 frentes + 3 fatos) → Problema→virada (pin 320%) → Trailer (pin 240%) → Maquete da fazenda → Módulos (bento de 8 + "espinha" + 4 diferenciais) → Edições → Perfis (pin 480%) → GB Twin → Confiança → Contato → FAQ → Rodapé.

### Medições
- Rolagem fixada (pins): Hero 3.744 + Problema 3.024 + Trailer 2.448 + Perfis 4.176 ≈ **13.400 de 22.800 px (59%)**. Mais Lenis de rolagem suave sequestrando o scroll.
- Form completo: topo em 20.495 px (**22,8 telas**). Só o form do hero antecipa, e ele fica invisível na 1ª tela.
- Sem navegação por âncoras no header (só logo + 1 botão). Rodapé tem Sistema, Edições, Perfis, Dúvidas; não tem Contato, Privacidade real nem Fiscal.

### Excesso (sobra)
| Item | Problema | Ação |
|---|---|---|
| **Escopo** (4 frentes + 3 fatos) e **Módulos** (8 frentes) | Mesma mensagem duas vezes, em 2 estilos de card. | Fundir: manter Escopo só como ponte visual curta (título + 3 fatos) e levar as frentes para o bento. |
| **Maquete + Bento + "espinha" + Diferenciais** | "Um só cadastro" aparece em 5 títulos/notas. A "espinha" é `aria-hidden` e repete os nomes dos módulos. | Maquete como seletor de setor, bento como detalhe; remover a espinha. |
| **Confiança × Diferenciais** | Mesmo componente (`Conquistas`) e mesmo formato; "Confiança" não é prova de confiança, é lista de recursos de governança. | Unir em "Diferenciais" e criar uma Confiança de verdade (ver §3.3). |
| **Perfis** (pin de 480%) × **Edições** | Ambos explicam os apps, o primeiro com ~5 telas de rolagem. | Reduzir Perfis a ~200% ou virar passo a passo curto dentro de Edições. |
| **GB Twin** | Produto à parte, no meio do funil, entre Perfis e Confiança, quebra a narrativa; o H2 fala de "pé de lavoura" depois de 80% do texto em pecuária. | Teaser compacto (faixa) depois da prova, ou próximo ao FAQ. |
| **Trailer com pin** | O vídeo com capítulos clicáveis funciona sem fixar a tela; os 240% são rolagem forçada. | Tirar o pin; manter capítulos. |

### Falta (e pesa na decisão de compra)
1. **Prova social: fora do escopo por ora** (sem clientes, logos ou depoimentos disponíveis). A confiança vem de prova de produto verificável: números reais (115 relatórios, 10 painéis, 11 módulos), telas reais com "dados de demonstração", fiscal completo, a GB Agritech como empresa por trás e uma seção de segurança/LGPD. Reavaliar quando houver o primeiro cliente-piloto autorizado a ser citado. Não criar selos nem números sem fonte.
2. **Segurança e dados (LGPD):** onde os dados ficam, backup, acesso por perfil, log de auditoria (isso o produto tem: `audits`, `user_activities`, `roles/permissions`). A seção "Confiança" atual não responde "meus dados estão seguros?".
3. **Como começar / implantação:** 3 passos (cadastros → importação de saldos/OFX/planilhas → treinamento). As respostas "Como funciona o teste?" e "Quanto custa?" estão marcadas "a validar" e são as duas maiores objeções.
4. **Para quem é (segmentos):** pecuária de corte (cria/recria/engorda), confinamento, lavoura, multifazenda. Um seletor de perfil leva cada visitante ao caso certo.
5. **Integrações visíveis:** Domínio, balança, OFX, WhatsApp (cotação), SEFAZ. Hoje estão espalhadas em FAQ e bento. Uma faixa "Conecta com" resolve em 1 tela.
6. **WhatsApp ativo** (canal nº 1 do B2B agro): botão flutuante e no header depois que o número existir.
7. **CTA fixo/sticky** a partir da 2ª tela (hoje há só o botão do header, que volta ao hero).
8. **Medição:** não há analytics, UTM nem eventos. Sem isso não dá para otimizar nada.

### Ordem proposta (13 → 10 blocos)
1. **Hero** (valor + CTA visíveis no quadro 0; filme depois)
2. **Faixa de prova de produto** (números reais do sistema + "Conecta com: Domínio, balança, OFX, WhatsApp, SEFAZ"; sem depoimentos nem logos)
3. **Problema → virada** (pin ≤ 200%, ou sem pin no celular, como já é)
4. **Módulos** (maquete como seletor + bento; Escopo absorvido)
5. **Diferenciais** (Fiscal/LCDPR e contador em destaque, rastreio, balança→NF-e, cotação por link, custo por lote)
6. **Trailer** (vídeo com capítulos, sem pin, com botão pausar)
7. **Para quem é + Perfis/Edições** (web disponível; apps em teste; 1 bloco só)
8. **Segurança, implantação e preço** (como começar em 3 passos; LGPD; "fale com a equipe" se não houver preço)
9. **FAQ** (agrupado por tema) **antes** do fechamento
10. **Contato** (form completo + WhatsApp) → Rodapé
GB Twin vira faixa compacta entre 8 e 9.

---

## 4. Layout e estética
**Acertos:** paleta verde única com tokens (`tokens.css`), tema GB Mode escuro já previsto, `font-variant-numeric: tabular-nums` nos números, raio e sombras consistentes, hero cinematográfico distinto de ERP genérico, mockup de planilha/caderno/WhatsApp na dor (excelente, específico do agro), `prefers-reduced-motion` tratado em quase tudo.

**Melhorias:**
1. **Excesso de estilos de card:** `glass-card`, `fatos`, `cell` (bento), `conq`, `edition`, `pf-glass`, `.form`. Seis linguagens de cartão. Reduzir a 3 (vidro sobre foto, branco com borda, escuro) com tokens (`--card-radius`, `--card-shadow`).
2. **Ritmo de fundo:** claro → foto → claro → escuro (trailer) → claro → foto (perfis) → foto (twin) → claro. Duas seções de foto cheia seguidas (Perfis, Twin) cansam; intercalar uma seção clara.
3. **Densidade:** a seção Sistema + Módulos tem ~3.300 px só de cards. Um seletor por segmento reduz.
4. **CTA com peso visual:** `.btn-ghost` (branco, borda `#d3dfd6`) quase não se vê sobre o fundo claro (borda de ~1,4:1 com o canvas); aumentar a borda para ≥3:1 (WCAG 1.4.11) ou usar contorno verde.
5. **Tabela de 4 CTAs diferentes** (ver §7): unificar rótulos e destacar 1 primário por tela.
6. **Mobile do hero:** form comprimido (labels 12 px, campos 40 px, sem subtítulo). O alvo é ≥44 px (guideline do projeto e WCAG 2.5.8 mínimo 24 px).
7. **Alvos pequenos medidos:** links do rodapé 19 px de altura, links legais 22 px, logo do header 30 px. Dar padding vertical para ≥24 px (ideal 44).
8. **Inputs a 15 px:** `.field input` e `select` usam 15 px; o iOS Safari dá zoom ao focar campos com <16 px. Subir para 16 px.
9. **Perfis no celular:** 3 estados de texto sobre vídeo 9:16 com vidro; testar legibilidade em aparelho real (ver §5).

---

## 5. Contraste e acessibilidade (WCAG 2.2 AA)
### Contrastes medidos (cálculo WCAG, tokens do CSS)
| Par | Razão | Veredito |
|---|---|---|
| Texto `#171717` / canvas | 16,75 | OK |
| `--muted #4a5b50` / canvas, branco, mint | 6,3 – 7,2 | OK |
| Botão primário branco / `#047857` | 5,48 | OK (hover 7,68) |
| Eyebrow/ghost `#047857` / canvas | 5,12 | OK |
| `#047857` / `#e3f4e9` (selo das cells) | 4,80 | OK (margem curta) |
| Texto no escuro (`#a9c7b6`, `#7da893`) / `#0e2a1d`–`#081a12` | 5,8 – 9,9 | OK |
| Erro `#b91c1c` / branco | 6,47 | OK |
| **`.tbd` `#7a5410` / `#fff6e0`** | 6,29 | OK |
| **Placeholder `#6b7d71` / branco** | **4,38** | **Falha AA** (<4,5). Escurecer para `#5f7166` (≈5,2). |
| **H1 `em` `#059669` / canvas** | **3,52** | Passa só como texto grande (≥24 px, 600). No celular (28 px) ok; evitar em texto menor. |
| **Focus ring `#059669` / canvas** | 3,52 | Passa 3:1 (2.4.11/1.4.11), mas sem folga. |
| **Texto branco sobre vidro sobre quadro claro (pior caso estimado)** | **2,6 – 3,2** | **Risco** em `pf-kicker`, `pf-card p` e `.note` quando o quadro é claro (céu/fachada). Medir por quadro; reforçar o vidro (`.52 → .62`) e o `text-shadow`, ou usar fundo sólido no cartão. |
| **`hero-hint` branco sobre céu** | ~1,3 (céu claro) | Decorativo, mas visível; usar sombra/fundo ou trocar para chip escuro. |
| Planilha/WhatsApp decorativos (3,3 – 3,7) | — | Fora do escopo: `aria-hidden`. |

### Falhas de acessibilidade (por gravidade)
1. **Form do hero focável e invisível** (P0 #4).
2. **Sem "pular para o conteúdo"** e `<main>` sem `id`. Com 12 links antes, e pins que prendem a rolagem, é obrigatório para teclado.
3. **Vídeo em loop sem pausa** (hero tablet e Trailer): 2.2.2 exige controle quando passa de 5 s. Adicionar botão "Pausar" e respeitar `prefers-reduced-motion` (hoje o trailer toca mesmo com reduce; o pin é que desliga).
4. **Vídeo sem legenda/descrição:** `<track kind="descriptions">` ou texto alternativo longo; o aria-label curto não descreve as telas.
5. **Form:** mensagens de erro ligadas por `aria-describedby` nos campos de texto, mas **não no checkbox de consentimento**; sem foco no 1º campo inválido ao enviar; sem resumo de erros; `select` sem validação; sucesso usa `role="status"` (ok). Adicionar `autocomplete="organization"` quando houver campo de empresa.
6. **Alvos <24 px** (rodapé, links legais) — WCAG 2.5.8.
7. **Link com `aria-disabled` apontando para `#contato`** (botão WhatsApp): usar `<button disabled>` ou ocultar; leitores anunciam link funcional.
8. **Logo duplicado** no header (dois `<img>` empilhados): ok, o segundo é `aria-hidden`; trocar para um SVG com `currentColor`/CSS reduz DOM.
9. **Lenis (rolagem suave):** confirmar que desliga com `prefers-reduced-motion` e que não captura teclas (Home/End/PageDown). Não li `scroll.ts` a fundo; incluir no teste.
10. **Conteúdo que só aparece por scroll (Perfis, Problema):** em modo reduzido já há `still`; manter e testar com leitor de tela (NVDA/VoiceOver) que todo o texto é lido em ordem. `autoAlpha` aplica `visibility:hidden`, o que esconde dos leitores até a fase aparecer: conferir se o texto das 3 fases está acessível em ordem.
11. **Sem `noscript`:** sem JS a página é em branco. Ver SEO.
12. `<h3 class="eyebrow">O que pouca gente tem</h3>`: eyebrow como heading polui a estrutura; virar `<p>` e dar um H3 de verdade ("Diferenciais").
13. Heading order ok (H1 → H2 → H3). Dois H2 antes do Escopo (form do hero); o H2 do form pode virar `<p>` ou `legend`.

### Itens bons (manter)
`lang="pt-BR"`, landmarks (header/main/nav/footer), `aria-labelledby` em todas as seções, `aria-pressed` nos capítulos, `aria-current="step"`, `details/summary` nativo no FAQ, `:focus-visible` global, alt úteis nas telas das Edições, `viewport` sem `maximum-scale`, `inputMode`/`autocomplete` corretos, `role="alert"` no erro de envio.

---

## 6. W3C / HTML
- Documento válido em estrutura (doctype, lang, charset, viewport). Não rodei o validador oficial; rodar `validator.w3.org/nu` no HTML renderizado.
- `17 de 19 <img>` sem `width/height` (as das telas/Edições/Perfis): risco de CLS ao carregar sob demanda. Declarar dimensões ou `aspect-ratio`.
- `<link rel="preload" as="image">` com `media` está correto; falta `preconnect` para a origem do R2.
- `aria-disabled` em `<a>`: ver acessibilidade.
- `<video>` sem `<track>`.
- Estilos inline (`style={{display:'block'}}`, `marginTop:-8`) em vez de classes: manutenção.
- `<section class="trust">` sem `id` (sem âncora/menu). `<section>` do Problema tem `aria-labelledby` para o H2 da dor, mas a "virada" tem outro H2 dentro da mesma seção: dividir em duas seções ou usar H3.
- Favicon só SVG: adicionar `apple-touch-icon` (180 px), `manifest` e ícone 32 px PNG para fallback.

---

## 7. Copy
**Mantém:** H1 "Do campo ao financeiro, num só sistema." A dor "Planilha aqui, caderno ali, WhatsApp no meio." é a melhor linha da página. Linhas com prova ("115 relatórios · 10 painéis · NF-e, MDF-e e LCDPR").

**Corrigir:**
| # | Onde | Problema | Sugestão |
|---|---|---|---|
| 1 | Hero lead, vários H2 | "no mesmo cadastro" é jargão de sistema; o dono da fazenda pensa em resultado. | "…e saiba o custo e a margem de cada lote antes do fechamento do mês." |
| 2 | Hero, form, FAQ | "Primeira hora do lançamento" × "Cerne Web já disponível". Contradição já apontada no doc 17 §4. | Definir a promessa: "Acesso ao Cerne Web e aos apps em teste" ou "Agende uma demonstração". |
| 3 | CTAs (7 rótulos) | "Quero acesso antecipado", "Agendar demonstração", "Quero testar" ×2, "Quero conhecer o GB Twin", "Prefiro agendar demonstração", "Falar agora no WhatsApp". A regra do doc 08 era um CTA principal + 2 atalhos com o mesmo texto. | Primário único ("Agendar demonstração" para o Web) e secundário "Entrar na lista dos apps". |
| 4 | "O que pouca gente tem" | Superlativo não comprovável. | "Diferenciais" ou "O que já vem pronto". |
| 5 | "Escolha um setor." | Instrução vaga. | "Clique em um setor para ver o que o Cerne faz ali." |
| 6 | Perfis ("Campo", "Gestor") | Títulos genéricos. | "Quem está no curral" / "Quem decide no escritório". |
| 7 | FAQ | 18 perguntas em lista única; 3 ainda "a validar" (disponível, teste, preço). | Agrupar (Produto · Fiscal e contador · Operação · Contratação), abrir as 3 mais buscadas, resolver as pendentes. |
| 8 | Repetição | "um só cadastro/sistema" ~7×; "115 relatórios" 5×. | Dizer uma vez no hero e uma na prova; variar nos módulos com o benefício específico. |
| 9 | Fiscal | Maior diferencial real (NF-e, CT-e, MDF-e, LCDPR, Domínio) fica numa célula do bento e no FAQ. | Bloco próprio com a linha "Emita a nota, feche o LCDPR e mande ao contador sem redigitar". |
| 10 | Edições | Badge "Em construção · em teste" correto e honesto. | Manter. Acrescentar o que o visitante ganha ao entrar na lista (acesso ao piloto, prioridade). |

**Tom por público (política da organização):** a LP fala com o dono/gestor. Para o público técnico (TI/contador), criar a página de apoio "Fiscal e integração com o Domínio".

---

## 8. SEO
### Hoje
- Título (63 caracteres) e descrição (~143) bons. `lang`, `og:locale`, `og:site_name`, `twitter:card` presentes.
- **Raiz vazia:** `<div id="root"></div>`. Medido: 87 bytes de `body` antes da hidratação. O conteúdo depende de JS.
- **Conteúdo abaixo do Hero só monta na 1ª interação (ou 6 s).** Rastreadores que não rolam podem indexar só Hero e Escopo (Googlebot renderiza JS, mas outros e as prévias sociais não). É o maior risco de SEO.
- Sem `<link rel="canonical">`, `og:url`, `twitter:title/description/image`, `robots.txt`, `sitemap.xml`, dados estruturados, `noscript`, `apple-touch-icon`, `manifest`.
- `og:image` aponta para `sistema-bg.webp` no R2 (WebP, tamanho livre): WhatsApp/LinkedIn/Facebook preferem JPG/PNG 1200×630 com URL estável. Sem texto na imagem.
- `wrangler.jsonc` com `not_found_handling: single-page-application`: qualquer URL inexistente devolve 200 (soft 404).
- H1 existe, mas com `opacity:0` na 1ª tela; bom para robô, ruim para o usuário (ver §2).

### Plano
1. **Pré-renderizar (SSG) a página inteira** com todo o texto no HTML (Vite SSG ou prerender no build); o chunk `Below` continua carregando sob demanda só para animação/mídia, não para o texto.
2. Meta completa: canonical, `og:url`, `og:image` 1200×630 JPG (com alt), `twitter:title/description/image`, `apple-touch-icon`, `theme-color` claro/escuro.
3. **JSON-LD:** `Organization` (GB Agritech), `SoftwareApplication` (Cerne Web: categoria `BusinessApplication`, `operatingSystem: Web`), `WebSite`. FAQPage: Google restringiu o rich result de FAQ a sites governamentais e de saúde, então o ganho é de entidade/semântica, não de rich snippet.
4. `robots.txt` (permitir tudo + sitemap), `sitemap.xml`, 404 real (HTTP 404 fora do `/`).
5. **Palavras-chave com intenção** (pesquisar volume antes): "ERP para fazenda", "software para pecuária de corte", "gestão de confinamento", "LCDPR", "emissão de NF-e produtor rural", "sistema para fazenda integrado ao Domínio". Usar nos H2/FAQ sem forçar.
6. **Fase 2 (maior retorno orgânico):** páginas próprias `/fiscal-produtor-rural` (LCDPR, NF-e, MDF-e, Domínio), `/gestao-confinamento`, `/pecuaria-de-corte`, `/lavoura`, `/gb-twin`. Uma única página cobre pouca intenção de busca.
7. `<noscript>` com o H1, lead e link de contato. Imagens com `alt` descritivos nas telas do bento (hoje `alt=""`, por serem decorativas; ok para a11y, mas perde indexação de imagem).
8. Medição: Search Console + analytics sem cookie (Plausible/Umami) + eventos de CTA e envio.

---

## 9. Performance
### O que já está bom (doc 16, preview local)
Lighthouse mobile 99, FCP 1,5 s, LCP 2,1 s, TBT 20-30 ms, CLS 0. Carga inicial 280 KB. Poster do hero como `<img fetchpriority="high">` + preload, quadros sob demanda, AVIF, `Below` em chunk, fonte com preload, `immutable` em `/assets/*`.

### Medido agora (build em `dist/`)
| Arquivo | Tamanho (bruto) | Observação |
|---|---|---|
| `index-*.js` | 371 KB | React + GSAP + ScrollTrigger + Lenis; inevitável para o hero. |
| **`art-*.js`** | **447 KB** | Maior chunk. É a arte da maquete (`figures/fazenda/art.ts`). Vem junto com `Below`, mesmo a seção estando a ~10.000 px. |
| `Below-*.js` | 52 KB | Ok. |
| CSS | 39 + 32 KB | Ok; `sections.css` poderia ser dividido por rota/seção. |
| Fonte | 32 KB + 15 KB | Latin com preload; `latin-ext` só se usada. |

### Melhorias
1. **Carregar `art` só quando a maquete chega perto** (`useNear` já existe): `lazy(() => import('FazendaCerne'))` dentro de `SystemSection`. Corta ~447 KB do tráfego inicial pós-interação.
2. **R2 `pub-*.r2.dev` não é endpoint de produção** (limitado e sem cache de borda). Domínio próprio no bucket (ex.: `cdn.cerne...`) + regra de cache (Cache Rules), `preconnect` ao domínio e `Cache-Control: immutable` nas pastas versionadas. Reexecutar PageSpeed no domínio final, não no preview.
3. **`_headers`:** hoje só cache. Acrescentar `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, CSP (com `connect-src` para o endpoint do form e o R2), `Cache-Control` do HTML curto (`max-age=0, must-revalidate`).
4. **Rolagem fixada:** 59% da página. Reduzir pins (Trailer sai, Problema ≤200%, Perfis ≤200%) melhora também o INP e a memória do scrub no celular.
5. **Scrub de quadros no mobile:** confirmar o consumo de memória do `ScrubCanvas` em Android de entrada (decodificar centenas de quadros). Fallback estático por `saveData`/`deviceMemory`.
6. **`width/height` nas imagens** (17 sem) e `fetchpriority="low"` nas abaixo da dobra.
7. **Limpeza do repositório:** `public/` tem 154 MB (`frames/perfis-v3` e `perfis-v4`). Remover versões antigas do git e do R2; o `drop-heavy-public` já protege o `dist`, mas o clone fica pesado.
8. **Vídeo `system-loop`:** manter `preload="none"` no Trailer, mas o do hero (tablet) também; conferir peso do `.webm`/`.mp4` e usar 720 p no mobile.
9. **Monitoramento:** web-vitals (LCP/INP/CLS reais) enviado ao analytics; Lighthouse CI no PR.

---

## 10. Cobertura: LP × frontend × banco
**Confirmado como real (front + schema):** multifazenda/multiempresa (`tenants`, `farms`, `account_farm`), permissões e logs (`roles`, `permissions`, `audits`, `user_activities`), 3 idiomas (270 arquivos por idioma), PWA (`vite-plugin-pwa`), fiscal (`nves`, `ctes`, `mdves`, `nfses`, `integration_dominios`, LCDPR em Relatórios), cotação por link (`request_quotations`), rastreio (`traceabilities`, `traceability_*`), balança (`module_weighings`, `PesagemRodoviaria`), conciliação OFX (`ofx_imports`), reprodução (`breeding_*`, `bull_seed_season`), frota (`equipments`, manutenção preventiva), pluviometria (`rainfalls`).

**Existe no produto e a LP não conta (candidatos, com tela no front):**
| Funcionalidade | Evidência no front | Onde encaixar |
|---|---|---|
| **Pastagem/pastejo e forragem** | `pages/Operacional/Pastagem`; tabelas `pastures`, `grazings`, `grazing_areas`, `pasture_*`, `fodders` | Pecuária (a maior parte do rebanho brasileiro é a pasto; a LP só fala de confinamento) |
| **Compra e venda de animais, contratos de venda, pedidos** | `CompraAnimais`, `ContratosVenda`, `Pedidos`, `Carregamento` | Pecuária/Financeiro |
| **Orçamento e previsto × realizado** | `Operacional/Budget`, `budgets`, `budget_*` | Financeiro (já citado só em chip) |
| **Planejamento de safra e do rebanho** | `Planejamentos`, `plannings`, `planning_livestock*` | Agricultura/Pecuária |
| **Nascimentos, perdas/mortes, marcação, inventário** | `Nascimentos`, `Perdas`/`DeathAnimals`, `Marcacao`, `Inventariado` | Pecuária (ciclo completo) |
| **Processamentos** | `Processamentos`, `processings` | A validar com produto |
| **Compartilhamento e exportação CSV** | `Integracoes/Compartilhamento` | Integrações |
| **Planos e termos** | `Configuracoes/Planos`, `plans`, `plan_*` | Preço/como começar (só se produto liberar) |
Regras de "não afirmar" do doc 17 §1 continuam valendo (IA, chat, integração direta SISBOV, Open Finance, modo offline, ABC Corte).

**Consistência de números:** "4 frentes" (Escopo) × "8 frentes" (bento) × "11 módulos" (Edições) × "10 painéis" (hero/bento; o front lista 11 dashboards, sem ABC Corte). Padronizar: usar sempre "11 módulos" e "8 frentes" com uma legenda que explique, ou um único número.

---

## 11. Roadmap priorizado
| P | Item | Esforço | Impacto |
|---|---|---|---|
| **P0** | Endpoint do form em produção + falha visível sem endpoint | S | Perda de leads |
| **P0** | Resolver 7 `.tbd`, WhatsApp, link da política de privacidade | S/M (depende do negócio) | Credibilidade/LGPD |
| **P0** | H1 + lead + CTA visíveis no quadro 0; `visibility:hidden` nos campos até a entrada | M | Conversão, a11y |
| **P0** | Tratar `location.hash` antes de montar `Below` | S | Campanhas e links |
| **P1** | Pré-render/SSG + canonical, OG 1200×630, JSON-LD, robots, sitemap, 404 real, noscript | M | SEO |
| **P1** | Skip link, pausa de vídeo, form (erro no checkbox, foco no 1º erro), alvos ≥24 px, inputs a 16 px, placeholder `#5f7166` | S/M | Acessibilidade |
| **P1** | Unificar CTAs e adicionar CTA sticky + WhatsApp | S | Conversão |
| **P1** | `lazy` da maquete (`art` 447 KB) + domínio/CDN para o R2 + cabeçalhos de segurança | M | Performance real |
| **P1** | Analytics sem cookie + eventos (CTA, envio, profundidade por seção) + UTM no payload | S/M | Otimizar com dado |
| **P2** | Reordenar e fundir seções (13 → 10): Escopo→Módulos, Confiança+Diferenciais, Perfis+Edições, Twin compacto, FAQ antes do contato | L | Clareza, menos rolagem |
| **P2** | Reduzir pins (Trailer sem pin; Problema/Perfis ≤200%) | M | UX, INP, memória |
| **P2** | Novos blocos: segurança/LGPD, como começar, para quem é, integrações (prova social adiada: não há material) | M/L (conteúdo do negócio) | Conversão |
| **P2** | Contraste do vidro por quadro + hero-hint | M | Acessibilidade |
| **P3** | Páginas de SEO por tema (Fiscal, Confinamento, Pecuária, Lavoura, GB Twin) | L | Tráfego orgânico |
| **P3** | Conteúdo: pastagem, compra/venda, orçamento, planejamento, nascimentos | M | Cobertura do produto |
| **P3** | Limpeza do repo (perfis-v3/v4, 154 MB), Lighthouse CI | S | Manutenção |

## 12. Verificação (como validar cada correção)
- **Build e tipos:** `npm run build` e `npm run lint`.
- **Acessibilidade:** axe DevTools e Lighthouse a11y em desktop e mobile; navegação só por teclado (Tab do header ao rodapé; foco visível e nada invisível focável); NVDA/VoiceOver nas seções com pin; teste com `prefers-reduced-motion`.
- **Contraste:** medir `getComputedStyle` + amostragem de pixel por quadro do vídeo nas fases de Perfis (3 fases × 3 telas).
- **W3C:** `validator.w3.org/nu` no HTML pré-renderizado.
- **SEO:** `curl` no HTML sem JS (texto presente), Rich Results Test, Facebook/LinkedIn Sharing Debugger, Search Console após publicar.
- **Performance:** PageSpeed no domínio final (mobile 4G) + `workbench/tools/perf-check.mjs`; WebPageTest em Android modesto para o scrub.
- **Conversão:** enviar lead de teste em produção, conferir o destino e o evento de analytics.

## 13. Execução aprovada: branch `audit/ux-seo-a11y-perf` (a partir de `copy/produto-real`)
Decisão do usuário: criar uma nova branch para a auditoria e aplicar nela os ajustes propostos. Sem push/PR (só commits locais), a não ser que peça. `workbench/_tmp/` (não rastreado) fica fora dos commits.

**Passos**
0. `git checkout -b audit/ux-seo-a11y-perf` a partir da branch atual.
1. Salvar este relatório em `workbench/docs/18-auditoria-ux-seo-performance.md` (e linkar no `workbench/docs/README.md`).
2. Aplicar, em commits pequenos por tema, **só o que não depende de decisão do negócio**:
   - **Acessibilidade (P1):** skip link + `id="main"`; `inert`/`visibility:hidden` nos campos do hero até a fase de entrada; botão Pausar/Reproduzir nos vídeos (Trailer e tablet do hero) e Trailer parado com `prefers-reduced-motion`; erro do consentimento ligado por `aria-describedby`, foco no 1º campo inválido ao enviar; alvos ≥24 px (rodapé/legais); inputs e selects a 16 px; placeholder `#5f7166`; `.btn-ghost` com borda ≥3:1; botão WhatsApp como `<button disabled>`; eyebrow `<h3>` → `<p>`; `hero-hint` legível; reforço do vidro/`text-shadow` em Perfis. (arquivos: `app.css`, `sections.css`, `Hero.tsx`, `HeroForm.tsx`, `Sections.tsx`, `Header.tsx`)
   - **Conversão (P0/P1):** H1, lead e CTA visíveis no quadro 0 (sem esperar o fim do pin; o form entra na fase final como hoje); CTA único coerente ("Agendar demonstração" primário) e CTA sticky após o hero; tratar `location.hash` montando `Below` antes de rolar; falhar o build de produção sem `VITE_FORM_ENDPOINT` (aviso explícito, sem derrubar o dev) e campos ocultos UTM/`origem` no payload. (arquivos: `Hero.tsx`, `App.tsx`, `Header.tsx`, `form.ts`, `vite.config.ts`)
   - **SEO (P1):** canonical, `og:url`, `twitter:title/description/image`, `apple-touch-icon`, JSON-LD (`Organization`, `SoftwareApplication`, `WebSite`), `robots.txt`, `sitemap.xml`, `<noscript>` com H1/lead/contato; `og:image` 1200×630 JPG gerado a partir de ativo existente. Pré-render do texto no HTML: avaliar `vite-ssg`/prerender no build e implementar se não exigir reescrever as seções; senão, entregar o `noscript` + JSON-LD e registrar a pendência. (arquivos: `index.html`, `public/`, `vite.config.ts`)
   - **Performance (P1):** `lazy` + `useNear` na maquete (`FazendaCerne`, chunk `art` 447 KB); `width/height` nas imagens sem dimensões; `preconnect` ao R2; `public/_headers` com `nosniff`, `Referrer-Policy`, `Permissions-Policy`, CSP e HTML sem cache longo. (arquivos: `Sections.tsx`, `index.html`, `public/_headers`)
   - **Layout/copy sem dependência externa (P2):** unificar rótulos de CTA; trocar "O que pouca gente tem" por "Diferenciais"; remover a "espinha" decorativa; agrupar o FAQ por tema e mover o FAQ para antes do Contato; reduzir os pins (Trailer sem pin; Problema e Perfis ≤200%); fundir Escopo em Módulos só se o `GroundSection` (emenda com o hero) puder ser simplificado sem quebrar a transição; unir Confiança + Diferenciais; Twin como faixa compacta. Itens de reordenação que mudem a emenda do hero ficam para um commit à parte, com screenshot antes/depois, e só entram se passarem na verificação visual.
   - **Cobertura do produto (P3):** acrescentar apenas o que tem tela no front: Pastagem/pastejo, compra e venda de animais/contratos, orçamento, planejamento, nascimentos/perdas, no bento e no FAQ, mantendo as regras de "não afirmar" do doc 17.
3. **Fora desta execução (dependem do negócio; deixar como estão e listar no relatório):** texto/etiquetas "a validar", número do WhatsApp, URL da política de privacidade, preço/fluxo de teste, promessa do "lançamento", prova social (sem material), seção "Como começar"/"Segurança" com conteúdo novo, páginas de SEO por tema. Nenhum texto sobre segurança, preço ou clientes será inventado.

**Verificação (por commit e ao final)**
- `npm run build` e `npm run lint` sem erro; tamanho dos chunks antes/depois (`art` fora do carregamento inicial).
- Preview da LP em 1440×900 e 390×844: `read_page` das seções, screenshots do quadro 0 (H1 e CTA visíveis), do fim do hero (form), Trailer, Perfis (contraste do vidro) e rodapé; navegação por Tab sem foco em elemento invisível; skip link funcional; vídeos pausam; `prefers-reduced-motion` emulado.
- Medição de contraste e alvos com o mesmo script usado na auditoria (placeholder ≥4,5; alvos ≥24 px).
- `curl`/`read` do HTML servido: meta, JSON-LD, canonical e `noscript` presentes; `/#contato` aberto direto rola até o form.
- `workbench/tools/perf-check.mjs` e `page.mjs` para regressão de carga e QA visual; Lighthouse local mobile ≥ 95 mantido.
- Resultado e pendências registrados em `workbench/docs/18-...md`; commits com a atribuição padrão.

---

## 14. Resultado da execução (branch `audit/ux-seo-a11y-perf`)

### Aplicado
| Tema | O que mudou | Arquivos |
|---|---|---|
| Primeira tela | H1, lead e CTA visíveis no quadro 0 (`hero-intro`, véu escuro, some nos primeiros pixels de rolagem); o título final vira `<p aria-hidden>` e o H1 real fica no intro. Em modo estático (movimento reduzido/saveData) o H1 fica no bloco final. Lead reescrito sem o jargão "cadastro". | `Hero.tsx`, `app.css` |
| Foco | Copy e form do hero com `visibility:hidden` até a fase (GSAP `autoAlpha`): nada invisível recebe Tab. | `Hero.tsx`, `app.css` |
| Âncoras | `Below` monta já na carga se houver `#hash` e rola até o alvo após o refresh do ScrollTrigger (testado: `/#contato` abre no form). | `App.tsx`, `Below.tsx` |
| CTA | CTA sticky "Agendar demonstração" depois do hero (some sobre o form); rótulos unificados ("Quero acesso antecipado" principal, "Agendar demonstração" atalho, "Entrar na lista de testes" nos apps). | `StickyCta.tsx`, `Sections.tsx` |
| A11y | Skip link e `main#main`; vídeo do Trailer com botão Pausar/Reproduzir, sem autoplay em movimento reduzido e com descrição para leitor de tela; erro do consentimento ligado por `aria-describedby`; foco no 1º campo inválido (hero e form completo); WhatsApp como `<button disabled>`; eyebrow `<h3>` virou "Diferenciais" de verdade; h2 do form do hero virou `<p>`; alvos do rodapé ≥24 px; inputs/selects a 16 px; placeholder `#5f7166`; borda do `btn-ghost` ≥3:1; vidro de Perfis mais firme; chip no "Role para conhecer". | `app.css`, `sections.css`, `HeroForm.tsx`, `Sections.tsx`, `tokens.css` |
| Leads | Sem `VITE_FORM_ENDPOINT` em produção o envio falha com erro visível (nunca finge sucesso) e o build avisa; UTM, referrer e página vão no payload. | `form.ts`, `vite.config.ts` |
| SEO | canonical/og:url/og:image absolutos via `VITE_SITE_URL` (tags saem se vazio), `og-cerne.jpg` 1200×630, `twitter:*`, `apple-touch-icon`, JSON-LD (Organization, SoftwareApplication, WebSite), `noscript`, `robots.txt` e `sitemap.xml` no build. | `index.html`, `vite.config.ts`, `public/` |
| Performance | Maquete (`art`, 447 KB) em `lazy` só perto da tela (fora do `Below`, que caiu de 52 para 45 KB); `width/height` nas telas; `preconnect` ao R2; `_headers` com nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options e HTML sem cache longo. | `Sections.tsx`, `index.html`, `public/_headers` |
| Estrutura | Ordem nova: Problema → Sistema (maquete + módulos + Diferenciais + Controle e segurança) → Trailer → Edições → Perfis → GB Twin → FAQ → Contato. Seção "Confiança" fundida em Sistema; "espinha" removida; FAQ agrupado em 4 temas (3 abertas); Trailer sem pin; pins de Problema (320→220%) e Perfis (480→280%) menores; Twin mais baixo. Rolagem fixada: de ~13.400 para ~11.000 px; página de 22.799 para 21.858 px (1440×900). | `Sections.tsx`, `Below.tsx`, `sections.css` |

### Não aplicado (decisão ou conteúdo do negócio)
- Etiquetas "a validar" (7), número do WhatsApp, URL da Política de Privacidade, preço e fluxo de teste, promessa do "lançamento".
- Prova social (sem material), seções novas de "Como começar", "Segurança/LGPD" e "Para quem é" (exigem conteúdo que não existe).
- Fusão do Escopo no bento (arrisca a emenda com o Hero), pré-render/SSG completo (exige reestruturar a hidratação; ficam `noscript` + JSON-LD), páginas de SEO por tema, domínio/CDN do R2 (infra), CSP completo (depende do domínio final do form), analytics e eventos (depende da ferramenta escolhida).
- Cobertura de produto (pastagem, compra/venda, orçamento, planejamento, nascimentos): fica para uma rodada de copy com validação do produto.
- Pausa do vídeo do tablet dentro do Hero (só aparece no fim do pin, mudo, sem áudio).

### Verificação feita
`tsc -b` e `vite build` sem erro (com e sem `VITE_SITE_URL`); no preview: H1/CTA visíveis no quadro 0 (desktop e 390 px), copy/form do hero em `visibility:hidden` antes da fase, skip link e `main#main`, ordem das seções, FAQ com 3 abertas, `/#contato` abrindo no form, Trailer sem pin com botão de vídeo e sticky CTA. Não rodados: Lighthouse no domínio final, axe/NVDA, validador W3C no HTML pré-renderizado.
