# Figura isométrica: Eixo do Cerne (piloto, 2026-10-13)

Branch `isometric`. Feita com a skill **Anatomy** (Claude Code, licença MIT; kit copiado em `tools/iso/kit/` e `src/figures/iso/`).

## A ideia
"Um só cadastro" desenhado como objeto: uma **rodela de tronco** cujo miolo escuro é o **cerne**. Dele sobe um **eixo** com um mostrador no topo. Três cabos ligam o eixo ao **notebook (Cerne Web)**, ao **tablet (Cerne Administração)** e ao **celular robusto junto à cerca do curral (Cerne Operação)**.

O que se mexe e o que significa:
- O ciclo é o mesmo da seção Perfis: Web cria a OS → Operação recebe → Operação aponta → Administração avalia.
- Clicar no aparelho da vez (ou no botão do passo) manda um pulso pelo cabo até o eixo. O ponteiro gira para quem age em seguida, e o pulso volta pelos três cabos ao mesmo tempo. Cada tela só se atualiza quando o pulso chega: as três mostram o mesmo estado porque leem o mesmo cadastro.
- Clicar fora da vez avisa de quem é a vez. Sem interação, um tour automático percorre o ciclo e pausa quando o mouse está sobre a figura.

## Desktop × mobile
| | Desktop (≥ 720 px) | Mobile (< 720 px) |
|---|---|---|
| Composição | rodela larga, aparelhos em volta do eixo | "tronco" vertical: o eixo alto leva dois aparelhos em braços, o celular fica no chão |
| Interação principal | clicar no aparelho da vez | tocar nos botões grandes dos 4 passos |
| Arte (gzip) | 31,5 KB | 29,1 KB |

Só a composição do aparelho é baixada. O download começa quando a seção chega a ~1 tela de distância, e o espaço já fica reservado por `aspect-ratio`, sem layout shift.

## Peso e desempenho (medido)
| Item | Valor |
|---|---|
| Arte desktop / mobile | 137 / 138 KB brutos · 31,5 / 29,1 KB gzip (chunk separado) |
| Bundle principal | +10 KB brutos (~3 KB gzip): componente, laço e modelo |
| Nós SVG na tela | ~550 (o relógio da página de referência tem ~4.800) |
| Laço de animação | 59 fps no tour (Chrome headless, sem throttle); para quando sai da tela ou fica parado |
| Checagem de pontas de linha da skill (`lines`) | 0 pontas soltas nas duas composições |

Para comparar: os quadros do Hero somam 8–9 MB. A figura cabe com folga no orçamento de 1,5 MB por seção (doc 09).

Acessibilidade: o SVG tem `aria-label` descrevendo o objeto, o palco é focável (Enter avança com o aparelho da vez), as mudanças de passo são anunciadas por `aria-live`, e os botões dos passos usam `aria-current`. Com `prefers-reduced-motion`, sem tour nem pulsos: o estado muda na hora.

## Arquivos
- `tools/iso/cerne/build.mjs`: geometria (desktop e mobile). Gera `src/figures/cerne/art.*.ts` e páginas de conferência em `tools/iso/cerne/out/`.
- `src/figures/cerne/model.ts`: passos da OS, textos do readout.
- `src/figures/cerne/live.ts`: laço de animação (ponteiro, pulsos, telas, tour).
- `src/figures/cerne/CerneAxle.tsx` + `cerne.css`: card, passos clicáveis, carregamento sob demanda.
- `tools/iso/harness/`: bancada com só a figura (`npx vite build tools/iso/harness --config vite.config.ts --base ./`).

Regerar a arte depois de mexer na geometria:
```
node tools/iso/cerne/build.mjs
```

## Pendências / próximos passos
- Validar em aparelho real com CPU lenta (o teste foi sem throttle).
- O texto das telas e os rótulos "em construção" seguem as regras de copy (doc 08). Revisar se os nomes dos passos batem com o produto.
- Possíveis extras: um pulso que "acende" o cerne quando grava; mostrar o mesmo eixo na seção Perfis no lugar da linha do fluxo.
