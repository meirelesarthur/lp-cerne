# Storyboard do Hero (~6 s)

Cena única, luz de amanhecer, câmera em dolly-in contínuo. A paleta parte de âmbar/verde-pasto quente e escurece até `#051008` (GB Mode) no fim, para o texto e o form ficarem legíveis.

| Plano | Tempo | Câmera | Conteúdo |
|---|---|---|---|
| K1 campo aberto | 0,0–2,0 s | plano geral, leve aproximação | pasto com neblina, gado Nelore ao fundo, caminhonete branca à esquerda do centro, sol baixo |
| K2 aproximação | 2,0–4,0 s | dolly-in até a caçamba/capota | caminhonete em plano médio; notebook aberto sobre a capota, tela ainda de lado |
| K3 close | 4,0–5,2 s | push-in até a tela | notebook preenche ~70% do quadro; tela recebe o screenshot real |
| Final | 5,2–6,0 s | tela preenche o quadro | Dashboard Visão Geral (GB Mode) nítido; fundo escurece para `#051008` |

Regras de consistência: mesma caminhonete (branca, cabine dupla, sem logos), mesmo notebook (prata, tampa sem logo), mesma luz (sol baixo à direita, contraluz quente). Sem texto nem pessoas nas imagens geradas.

Mobile: variante 9:16 com a mesma sequência, enquadramento vertical centrado na caminhonete.

Composição: o Magnific entrega imagens-chave e o vídeo de zoom; a tela do notebook é composta (corner-pin) no HyperFrames com o screenshot real de `assets/capture/`.

## Como foi produzido (desvio do plano)
A composição final foi feita em script (`video/hero-a/build.py`, Python + Pillow + ffmpeg) em vez de um projeto HyperFrames. Como o último quadro de cada clip é uma tela frontal e estática, bastou posicionar o screenshot nesse retângulo (sem tracking ao longo do vídeo): a tela acende, o quadro dá zoom até o dashboard e o fundo escurece para `#051008`. Duração final: ~10,6 s de quadros (8,1 s do Magnific + 2,5 s de composição), mapeados em 120 quadros no scroll. Se quiser a composição no HyperFrames (para render de vídeo publicável), o retângulo medido está documentado em `build.py`.

Mobile: o dashboard termina menor que o quadro (≈ 470 px de 608) para não ser cortado pelo `cover` do canvas; o form fica abaixo e o texto acima.
