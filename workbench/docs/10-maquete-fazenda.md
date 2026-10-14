# Maquete isométrica: Fazenda no Cerne (2026-10-14)

Branch `isometric`. Substitui o piloto do "Eixo do Cerne" (feedback: estética abstrata demais, o cliente não reconheceria a fazenda). Feita com a skill **Anatomy** (MIT; kit em `tools/iso/kit/` e `src/figures/iso/`).

## O que mostra
Uma maquete de fazenda sobre um bloco de terra, na seção **05 · Sistema** ("Seis frentes. Um só cadastro."), acima do bento:

| Setor | O que está desenhado | O que anima sozinho |
|---|---|---|
| Sede | escritório em corte: gestor na mesa olhando um painel na parede com 4 blocos (Plantação, Confinamento, Estoque, Financeiro) | contadores sobem e piscam quando chega um pulso |
| Confinamento | 3 currais com gado Nelore, bebedouros, cocho de concreto | caminhão de trato enche o cocho curral a curral; o gado come; o cocho esvazia |
| Estoque | galpão de insumos, sacaria, 2 silos, fábrica de ração, moega de carga | caminhão carrega na moega (saída de ração) |
| Plantação | talhão de milho formado e talhão 2 em plantio | trator planta faixa a faixa; ao fim do talhão, nova safra |

Cada operação (saída de estoque, trato registrado, plantio apontado) solta um **pulso** que viaja até o bloco do setor no painel da sede. Todo evento também soma em Financeiro, porque toda operação gera custo.

## Interação
- **Desktop:** etiquetas clicáveis sobre cada setor, mais abas abaixo da figura. Ao escolher um setor, os outros recuam (opacidade) e o painel abaixo mostra o módulo do Cerne: texto, tópicos, onde o dado nasce (app de Operação/Web) e a tela real do sistema (`/screens/*.webp`).
- **Mobile:** a mesma arte, mas a "câmera" (viewBox) voa até o setor tocado. "Visão geral" volta para a maquete inteira.
- **Movimento reduzido:** cena parada e coerente (meio talhão plantado, cocho tratado, painel com números), sem pulsos.

## Peso e desempenho (medido)
| Item | Valor |
|---|---|
| Arte (chunk sob demanda, ~1 tela antes da seção) | 446 KB brutos · **69 KB gzip** |
| Bundle principal | +~2 KB gzip (componente + laço) |
| Nós SVG | ~2.900 |
| Animação (Chrome headless, sem throttle) | 60 fps, nenhum quadro > 20 ms; o laço para fora da tela |

Para comparar: os quadros do Hero somam 8–9 MB. O espaço da figura fica reservado por `aspect-ratio`, sem CLS.

## Arquivos
- `tools/iso/fazenda/build.mjs`: geometria, materiais (cores) e ordem de pintura. Gera `src/figures/fazenda/art.ts` e `materials.css`.
- `src/figures/fazenda/live.ts`: caminhão, trator, cocho, faixas plantadas, pulsos, contadores, câmera do mobile.
- `src/figures/fazenda/model.ts`: textos de cada setor (mesma copy da seção Sistema).
- `src/figures/fazenda/FazendaCerne.tsx` + `fazenda.css` + `panel.css`: card, etiquetas, abas e painel.
- `tools/iso/harness/`: bancada só com a figura.

Regerar a arte: `node tools/iso/fazenda/build.mjs`

## Pendências
- Testar em celular real e com CPU lenta.
- Validar com o time os textos "onde o dado nasce" e as telas escolhidas para cada setor.
- Plantação não tem tela real do Cerne no `/screens`; hoje mostra só tópicos.
