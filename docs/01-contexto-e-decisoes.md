# Contexto e decisões

## Produto
Cerne: ERP agro web (disponível) com dois apps em construção/teste: **Administração** (gestor/escritório) e **Operação** (campo). Produto da GB Agritech. Os repositórios são protótipos fiéis ao que o sistema entrega.

## Fontes
| Item | Local |
|---|---|
| Web | `C:\Users\Arthur\Downloads\GB-CERNE\04.Code\cerne` (React/Vite/Tailwind; `npm run dev` :5173; GB Mode via `data-theme="gbMode"`) |
| App ADM | `C:\Users\Arthur\Desktop\cerne-app-administracao` (Flutter Web; build em `apps/mobile/build/site`) |
| App Operação | `C:\Users\Arthur\Desktop\cerne-app-operacao` (idem) |
| Marca | gbagritech.com.br (fundo `#061910`, texto `#E8F5EE`, Outfit) |
| Referência de estrutura | rockstargames.com/VI |
| Vídeos prévios (HyperFrames) | `…/cerne-app-administracao/videos/cerne-adm-showcase`, `…/cerne-app-operacao/video/cerne-showcase` |

## Paleta GB Mode (alta fidelidade)
canvas `#051008` · outer `#081a12` · surface `#0e2a1d` · borda `#1c3f2c` · texto `#e2f0e8` / muted `#7da893` · acento `#10b981` (hover `#059669`, destaque `#4ade80`). Tema claro: acento `#059669`. Fonte Outfit.

## Decisões
- Scroll com vídeo via frame-sequence em canvas (GSAP ScrollTrigger + Lenis); stack Vite + React + GSAP.
- CTA principal: lista de espera; atalhos: demonstração e WhatsApp.
- Marca "Cerne", assinada "uma solução GB Agritech". Não citar o nome do produto anterior.
- Copy honesta: apps são protótipos; offline, scanner SISBOV, hardware e backend dos apps só como "em desenvolvimento".
- Não herdar depoimentos/parcerias/selos de outro produto sem validação.
- Hero: abertura cinematográfica (~6 s: campo → zoom → notebook → dashboard), texto à esquerda e form compacto à direita.
- Form completo antes do FAQ; FAQ é a última seção.
- Trabalho em etapas, com aprovação a cada marco.
