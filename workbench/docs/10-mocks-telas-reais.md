# Mocks com telas reais (2026-10-14)

Os 3 mocks gerados por IA tiveram a tela substituída por capturas reais do Cerne, em perspectiva, com máscara, reflexo e saída em 4000 px (2560 px em JPG para web).

| Mock | Cena | Tela aplicada | Arquivo |
|---|---|---|---|
| 1 | Notebook na mesa, janela com fazenda | Web, Visão Geral em GB Mode | `assets/mocks/out/mock-notebook-mesa-*` |
| 1b | Mesma cena do notebook | Web, dashboard Financeiro em modo claro (recorte 16:10) | `assets/mocks/out/mock-notebook-mesa-claro-*` |
| 2 | Tablet no campo (soja) | Web, Financeiro (modo claro, recorte 4:3) | `assets/mocks/out/mock-tablet-campo-*` |
| 2b | Mesma cena do tablet | Twin 3D, Censo de copas (mapa do pivô, print enviado por Arthur), recortado em 1272×900 sem a barra lateral esquerda | `assets/mocks/out/mock-tablet-campo-twin-*` |
| 3 | Notebook + 2 celulares, fundo branco | Notebook: Visão Geral (claro). Celular da frente: app Administração, Fazendas > Visão geral. Celular de trás: app Operação, Ordens de serviço | `assets/mocks/out/mock-notebook-e-apps-*` |

## Como foi feito
- Originais em `assets/mocks/src/` (mock1 a mock3). O mock 3 tinha transparência; foi composto sobre branco.
- Cantos de cada tela medidos nos originais (`Q` em `compose.py`); homografia com OpenCV, máscara com cantos arredondados nos celulares, barra de status (9:41) e ilha dinâmica redesenhadas, brilho de vidro suave por cena.
- No mock 3 o celular da frente tem uma silhueta que impede o notebook e o outro celular de pintarem sobre a moldura.
- Capturas novas: `assets/capture/app/adm-0{1,2}.png` (app Administração, `tools/capture-adm.mjs`, build local em :5191) e `assets/capture/visao-geral-2560x1600.png` (GB Mode, 16:10, `tools/capture-gb-1600.mjs`).
- Regerar: `python assets/mocks/compose.py all` (ou `m1`, `m2`, `m3`).

## Limites e pendências
- O fundo (cena, mãos, moldura) continua sendo o da IA em 2000 px, ampliado 2x. Telas ficam nítidas em 4000 px, o resto é suave. Para nitidez total, passar os originais por upscale (ex.: Magnific `images_upscale`) e recompor.
- Dados das telas são de demonstração (fazenda Bom Gosto, usuário mock); apps são protótipos.
- O mock 2 tem duas versões: Financeiro do Cerne e Twin 3D (a do print enviado; fonte em `assets/capture/twin-censo-copas.png`, 1600×900, então o texto da tela fica um pouco mais macio que nos demais).

## Atualização: v2 por chroma key (2026-10-14)
Problemas da v1: o print cobria a mão no tablet, e no mock 3 os celulares se sobrepunham ao notebook e entre si. A solução foi gerar cenas novas com as telas em magenta chapado e usar a própria cor como máscara. Mãos, cantos arredondados e o recorte da câmera do celular ficam intactos; o print é projetado no retângulo exato de cada tela.

| Mock | Arquivo | Telas |
|---|---|---|
| Tablet no campo | `out/mock-tablet-campo-twin-completo-*` | Twin 3D, Censo de copas, print inteiro (com barra lateral) |
| Notebook e apps | `out/mock-notebook-e-apps-v2-*` (cena inteira) e `...-v2-16x9-*` (recorte 16:9) | Notebook: Visão Geral (claro). Celular 1 (Administração): Rebanho e confinamento, aba Mapa. Celular 2 (Operação): OS #2198 aberta (Detalhes) |

Scripts: `assets/mocks/compose_key.py` (uma tela) e `compose_multi.py` (várias telas; ordem esquerda→direita = notebook, celular 1, celular 2). Capturas novas: `assets/capture/app/adm-confinamento-mapa.png` (`tools/capture-adm-confinamento2.mjs`) e `op-03.png` (OS aberta).

Observações:
- O painel Rebanho e confinamento, aba Visão geral, renderiza ícones "?" de ajuda enormes sobre os textos no build web do app Administração; por isso foi usada a aba Mapa, que sai limpa. Vale corrigir no app.
- As versões anteriores (`mock-notebook-e-apps-*`, `mock-tablet-campo-twin-*`) continuam na pasta, mas as v2 substituem.

## Atualização: notebook e apps juntos (v3, 2026-10-14)
Pedido: aparelhos mais unidos e sobrepostos (estilo da referência), ainda retos, com o celular da frente por cima sem borda estranha; app Administração na Visão geral de Rebanho e confinamento.

- Arquivos: `out/mock-notebook-e-apps-v3-*` (3:2) e `out/mock-notebook-e-apps-v3-16x9-*`.
- Cena nova (`assets/gen-mocks/devices-v3-1.png`): celular da frente sobrepõe o canto do notebook; o outro fica atrás, ~10% escondido. `compose_multi2.py` trata a sobreposição: a moldura de quem está na frente fica intacta (a máscara é a cor), e as bordas escondidas da tela de trás são deduzidas das visíveis e da proporção da tela.
- Tela do app Administração: Rebanho e confinamento, aba **Visão geral**.

### Atenção: ícones "?" do app Administração
No build web do app Administração, os ícones de ajuda (`AppHelpButton`, `lib/ui/help_button.dart`) aparecem com ~33 dp em vez dos 16 dp previstos (`AppSize.iconSm`) e se sobrepõem aos rótulos dos KPIs. Aparece em qualquer resolução. Não foi possível corrigir o app (o SDK Flutter não está instalado em `C:lutter`), então a captura foi retocada por `tools/retouch_adm_confinamento.py`: remove o traço do ícone e reconstrói só os rótulos que ele cobria ("Custo médio/kg", "GMD médio", "Ocupação e desempenho" e o valor "1.49 kg/dia") com a fonte do app (Outfit SemiBold, tamanho calibrado em rótulos intactos). Nenhum número ou texto foi alterado. Arquivo: `assets/capture/app/adm-confinamento-vg-limpo.png` (original em `adm-confinamento-vg.png`).

## Atualização: mocks 9:16 para banner impresso (2026-10-14)
Pedido: banner grande impresso, imagem 9:16 com os aparelhos no terço inferior e o topo livre (imagem para receber degradê); mão não pode ser coberta pela tela.

| Mock | Arquivo (2880×5120) | Telas | Posição dos aparelhos (altura da imagem) |
|---|---|---|---|
| Notebook na mesa | `assets/mocks/out/mock-notebook-mesa-claro-9x16-2880x5120.png` | Financeiro (modo claro, 16:10) | tela do notebook de ~64% a ~82%; mesa, caneca e caderno até ~98% |
| Tablet no campo | `assets/mocks/out/mock-tablet-campo-9x16-2880x5120.png` | Twin 3D, Censo de copas (sem a barra lateral esquerda) | tela do tablet de ~67% a ~87%; mãos até o rodapé |

- Os 60% superiores são cena livre (janela com a fazenda e silos; céu e soja) para receber o degradê.
- Cenas geradas com tela magenta (chroma key), ampliadas 2x no Magnific antes da composição; a tela é aplicada em resolução total (`compose_key.py`, `OUTW=2880`, `--despill-global` tira o reflexo magenta da mesa, das mãos e da moldura). Como a máscara é a própria cor, a mão nunca é coberta.
- Para banners maiores que ~48×87 cm a 150 dpi, ampliar mais (4x dá ~5760×10240) e recompor com os mesmos scripts.
- Os prints têm limite de resolução próprio (Visão geral 2560 px, Twin 1600 px): se o banner for muito grande, recapturar em 4K, principalmente o Twin.
