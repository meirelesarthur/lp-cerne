# Animações e performance (2026-10-13)

## Como as animações estão construídas
| Seção | Técnica | Custo |
|---|---|---|
| Hero | sequência de quadros num `<canvas>` (scrub) + still em alta + DOM (app rolando, vídeo em loop) | o maior peso da página; carrega em lotes, 1º quadro imediato |
| Escopo (2ª) | imagem fixa (`sticky`) + véu verde por scroll | 1 imagem (~1,4 MB desktop / 0,7 MB mobile), só após o 1º scroll |
| Problema | 3 camadas que convergem no painel (transform por scroll) | só CSS/transform |
| Trailer | seção fixada; o scroll escolhe o capítulo e o vídeo pula para ele | 1 vídeo (1,2 MB MP4 / 1,1 MB WebM), toca só visível |
| Sistema | parallax leve das telas dentro das molduras | transform; imagens só após o 1º scroll |
| Perfis | seção fixada; os 4 passos acendem e a linha se preenche | só CSS/transform |
| Demais | revelação em cascata ao entrar na tela | transform + opacity, uma vez |

Regras seguidas: só `transform`/`opacity` animados (sem layout), um único Lenis sincronizado ao ScrollTrigger, pins com `refreshPriority` na ordem da página, mídia abaixo da dobra só após o primeiro scroll, `prefers-reduced-motion` desliga scrub/pins/parallax e mostra estados finais.

## Qualidade do Hero (o "salto" ao chegar no tablet)
Causa: a sequência rodava em 1280 px (WebP q66) e, no fim, era trocada pelo still de 2560 px, que ainda recebe zoom de 1,25×.

Teste (9 quadros do clip, fidelidade SSIM comparada a 1920 px):
| Formato | KB/quadro | 160 quadros | SSIM |
|---|---|---|---|
| WebP 1280 q66 (base) | 49 | 8,1 MB | 0,954 |
| WebP 1920 q62 | 80 | 13,1 MB | 0,970 |
| AVIF 1920 q50 | 72 | 11,8 MB | 0,977 |
| AVIF 1920 q60 | 101 | 16,5 MB | 0,984 |
| AVIF 1600 q60 | 79 | 12,9 MB | 0,978 |

Decisão: **versão HD adaptativa** em AVIF 1920 px q50 com 128 quadros (~9,4 MB). Só é usada quando a tela tem ≥ 1600 px reais, a conexão é 4G ou melhor, não há economia de dados e o navegador decodifica AVIF. Os demais continuam no WebP 1280 px (8,5 MB). Os quadros são decodificados na carga (`img.decode()`), assim o desenho no scroll não trava. 128 quadros cobrem 55% de um pin de 420vh: ~16 px de scroll por quadro, imperceptível com o scrub suavizado.

## Mobile
O plano vertical veio do Magnific em 720p (608×1080). Para subir a qualidade no celular seria preciso regerar o clip vertical em 1080p (Seedance 2.5, 10 s ≈ 7.900 créditos). Recomendo só se o teste em aparelhos reais mostrar perda perceptível.

## Propostas para mais seções "vivas" (próximos passos)
| Ideia | Seção | Como | Custo/peso |
|---|---|---|---|
| Do campo ao escritório | Perfis | Clip contínuo do Magnific: peão no curral com o celular (app Operação) → câmera atravessa até o gestor no escritório vendo o resultado no notebook; scrub igual ao Hero, telas compostas | ~9,5 mil créditos (1080p, 12 s) + ~5 MB em quadros |
| Mergulho na tela | Trailer | Abertura com zoom do tablet gigante para dentro da tela, emendando no vídeo do sistema | sem geração (reaproveita o still final) |
| Planilha que vira painel | Problema | Trocar as camadas desenhadas por fotos reais (planilha impressa, caderno de campo, celular com WhatsApp) que se dissolvem no painel | 3 imagens (~300 créditos) |
| Mapa vivo | Sistema | Loop curto (HyperFrames) do mapa de talhões/currais acendendo, no lugar do print estático da célula maior | sem créditos; ~0,6 MB |
| Drone sobrevoando | Escopo | Loop de 4–6 s do drone cruzando a plantação fixa (vídeo com fundo transparente) | ~3–4 mil créditos |

Orçamento de peso sugerido por seção abaixo da dobra: até 1,5 MB, carregado só quando a seção estiver a uma tela de distância.
