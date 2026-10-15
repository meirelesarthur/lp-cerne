# GOAL: Hero em alta fidelidade (Magnific + HyperFrames)

Status: **concluído em 2026-10-07** (ver `02-evolucao.md`). Checklist abaixo marcado; desvio: composição via script em vez de HyperFrames (ver `04-hero-storyboard.md`). Este documento é autossuficiente: ao retomar a sessão, leia-o e execute as etapas em ordem sem parar, atualizando o checklist.

## Objetivo
Entregar o **Hero funcional em código** da LP do Cerne (`lp-cerne/`, Vite + React + GSAP + Lenis), em GB Mode, com abertura cinematográfica presa ao scroll: pasto ao amanhecer → zoom → notebook na caminhonete → tela abre no Dashboard Visão Geral real do web. Estado final: texto à esquerda, form compacto à direita sobre o dashboard. O restante da página fica para o próximo goal.

## Decisões fechadas (2026-10-07)
| Tema | Decisão |
|---|---|
| Escopo | Hero funcional em código |
| Cena | Pasto ao amanhecer, gado Nelore ao fundo, notebook aberto sobre a capota de uma caminhonete |
| Técnica | Híbrido: Magnific gera imagens-chave e o vídeo campo → notebook; a tela do notebook recebe screenshot REAL do web (Visão Geral, GB Mode), composta no HyperFrames |
| Créditos Magnific | Livres, até concluir |
| Mobile | Vídeo vertical 9:16 separado, form abaixo do texto |
| Autonomia | Pode instalar dependências, subir servidores locais, logar com usuário mock, capturar telas, rodar renders e criar o projeto. NÃO publicar nada nem alterar os repositórios originais |
| Magnific | Registrado via `claude mcp add --transport http magnific https://mcp.magnific.com`. **Falta OAuth:** usuário autoriza em `/mcp` num terminal `claude` e retoma a sessão |

Insumos: `docs/01-contexto-e-decisoes.md` (fontes, paleta), `wireframe/v2.html` (estrutura e copy do Hero), skills `hyperframes`, `media-use`, `gsap-scrolltrigger`, `ui-ux-pro-max`.

## Etapas
### E0 Pré-requisitos
- [x] Confirmar ferramentas do Magnific disponíveis (ToolSearch "magnific"). Se não, parar e avisar o usuário; não usar outro gerador sem pedir.
- [x] `hyperframes doctor`, Node e ffmpeg disponíveis.

### E1 Captura da tela real
- [x] Subir o web (`GB-CERNE/04.Code/cerne`, `npm run dev`, :5173), logar com usuário mock, alternar para GB Mode.
- [x] Capturar `/dashboards/visao-geral` em 1920×1080 e 2560×1440 (sem barras do navegador), mais uma versão recortada para tela de notebook. Salvar em `assets/capture/`.
- [x] Conferir que nenhum dado real/sensível aparece (só mock).

### E2 Direção visual e keyframes (Magnific)
- [x] Escrever `docs/04-hero-storyboard.md`: 3 planos (K1 campo aberto, K2 aproximação à caminhonete, K3 close do notebook), duração total ~6 s, luz de amanhecer, paleta quente de fundo que transiciona para o verde escuro do GB Mode.
- [x] Gerar K1–K3 no Magnific (16:9, alta resolução), mantendo consistência de cena (mesma caminhonete, mesmo notebook, mesma luz). Gerar também a variante 9:16.
- [x] Revisar e refazer o que destoar. Salvar originais em `assets/gen/` e registrar prompts, modelo e seed em `docs/05-registro-geracoes.md`.

### E3 Vídeo de zoom (Magnific)
- [x] Gerar o vídeo campo → notebook a partir de K1→K3 (image-to-video), ~5–6 s, câmera dolly-in contínua, sem texto na imagem.
- [x] Validar: sem deformação do notebook, tela do notebook estável o bastante para receber composição. Refazer se necessário.

### E4 Composição (HyperFrames)
- [x] Projeto em `video/hero-a/`, `frame.md` com tokens GB Mode.
- [x] Rastrear/posicionar a tela do notebook (corner-pin) e compor o screenshot real com leve reflexo/brilho; ao fim do zoom, a tela preenche o quadro e o dashboard fica nítido.
- [x] Transição final para o fundo `#051008` (para o texto/form ficarem legíveis).
- [x] Renders: desktop 1920×1080, mobile 1080×1920, 24 fps. Rodar `hyperframes check` e snapshots.

### E5 Frames para o scroll
- [x] Extrair sequência WebP: desktop 1280w e mobile 720w, ~120 frames, q≈75, meta ≤ 6 MB por variante, mais poster do primeiro e do último quadro. Saída em `lp-cerne/public/frames/hero/{desktop,mobile}/`.

### E6 Implementação do Hero
- [x] Criar projeto Vite + React + TS em `lp-cerne/` (sem sobrescrever `docs/`, `wireframe/`, `assets/`).
- [x] Tokens GB Mode em `src/styles/tokens.css` (paleta do doc 01, fonte Outfit self-hosted).
- [x] `ScrubCanvas` (pré-carga progressiva, primeiro quadro imediato), ScrollTrigger com pin ~200vh, Lenis sincronizado.
- [x] Timeline: 0–70% vídeo; 70–100% texto (headline, lead, chip) entra à esquerda e form compacto à direita; barra de progresso e dica "Role para conhecer".
- [x] Header com logo (`Logo-white.svg` do web) e CTA que foca o form.
- [x] Form compacto (e-mail, WhatsApp, LGPD) com validação no blur, estados de carregando/sucesso/erro, endpoint configurável via `.env` (sem destino real definido: mock local).
- [x] `prefers-reduced-motion` e conexão lenta: poster final + conteúdo visível sem scrub. Mobile: layout em coluna, vídeo 9:16.

### E7 Qualidade
- [x] `npm run build` sem erros; Lighthouse mobile ≥ 85, LCP < 2,5 s.
- [x] Verificar scrub nos dois sentidos, 1440×900, 1920×1080 e 390×844; foco por teclado; contraste ≥ 4,5:1.
- [x] Capturar screenshots finais em `docs/shots/`.

### E8 Documentação
- [x] Atualizar `docs/02-evolucao.md` (marco "Hero alta fidelidade"), `docs/04-hero-storyboard.md`, `docs/05-registro-geracoes.md`, e um `lp-cerne/README.md` com como rodar e como regerar os frames.
- [x] Relatar ao usuário: o que ficou pronto, links dos arquivos, pendências.

## Critérios de pronto
1. O Hero abre com a cena do pasto e, rolando, o zoom chega ao notebook e ao dashboard real, com continuidade visual e sem cortes bruscos.
2. Texto e form ficam legíveis sobre o dashboard no estado final, em desktop e celular.
3. Peso do Hero ≤ 6 MB por variante; build e Lighthouse conforme E7.
4. Nada publicado; repositórios originais intactos; toda geração registrada em `05-registro-geracoes.md`.

## Riscos e tratamento
| Risco | Tratamento |
|---|---|
| Vídeo IA deforma o notebook | Gerar K3 como imagem limpa e compor a tela no HyperFrames; reduzir movimento; refazer |
| Inconsistência entre keyframes | Reusar K1 como referência nos prompts seguintes; descrever caminhonete e notebook de forma idêntica |
| Frames pesados | Reduzir quadros (96) ou resolução; WebP q 70 |
| Tela do notebook sem dados reais em GB Mode | Usar usuário mock do web; nunca dados de cliente |
| Magnific indisponível | Parar e avisar; não trocar de gerador sem aprovação |

## Como retomar
1. Autorizar o Magnific em `/mcp` num terminal `claude` e reabrir esta sessão (ou iniciar nova na pasta `lp-cerne`).
2. Pedir: "Execute o goal em `docs/03-goal-hero-alta-fidelidade.md`". A execução vai do E0 ao E8 sem pausas, marcando o checklist.
