# Ajustes v3.3 (2026-10-15)

## Hero e copy de lançamento
- Removida a etiqueta "Cerne Web disponível · Apps em breve".
- CTA principal: "Quero acesso antecipado" (header, form do Hero e form completo). Título do form: "Seja um dos primeiros a usar o Cerne"; subtítulo: "Receba acesso na primeira hora do lançamento." Sucesso: "Seu acesso está reservado."
- Seção do form completo: eyebrow "Acesso antecipado", título "Esteja entre os primeiros a usar o Cerne."
- Botões e demais "pílulas" grandes dos botões passam a raio de 20 px (`.btn`), para casar com o sistema.

## O que o Cerne cobre
- Cards e fatos em vidro de verdade (gradiente translúcido, blur 22 px + brilho), texto escuro para manter o contraste sobre a foto.
- Foto da plantação única, sem trocar de imagem no meio: `workbench/video/hero-a/ground_v5.py` refaz `ground.webp` (desktop e mobile) escolhendo em P2 a altura em que o espaçamento das fileiras é igual ao do rodapé de P1, alinhando as fileiras, igualando a cor (LAB) e fundindo numa zona longa, sem neblina. Os chãos antigos estão em `workbench/assets/backup/`.
- A foto fica nítida atrás de todos os cards e só depois esmaece até o fundo claro; 80vh de respiro para o esmaecer terminar.

## Ponto de partida → virada
Animação: a dor sai; o mockup dos três produtos surge desfocado; planilha, caderno e conversa voam para dentro da tela do notebook e somem; um pulso verde dispara sobre a tela e o mockup fica nítido; entram o título e os selos.

## Sistema: maquete isométrica em tela cheia
- Sem o card branco e sem o painel lateral fixo. A maquete ocupa a seção (min 100svh); o título fica sobreposto no canto e some quando um setor está aberto.
- Ao clicar num setor (ou numa etiqueta), abre um cartão de vidro com o texto, chips e "onde acontece", do lado oposto ao setor (Confinamento e Sede abrem à esquerda). Navegação rápida entre setores no próprio cartão. No celular a câmera voa até o setor e o cartão vem embaixo.
- Arte enriquecida em `workbench/tools/iso/fazenda/build.mjs` (cópia anterior em `workbench/assets/backup/fazenda-build-v1.mjs`): tela maior (1200×660), chão externo, serra de morros ao fundo e nas laterais, 10 talhões vizinhos, 14 árvores externas, gado refeito (4 patas com casco, rabo, orelhas, focinho, manchas) e bezerros.
- Bundle da arte: 190 KB gzip (antes ~70 KB), baixado só quando a seção está a ~1 tela.
- Pendência: os morros ainda são cúpulas simples; dá para refinar (sombreamento por distância, vegetação).

## Bento
- Removido o filete verde no topo dos cartões.

## Verificação
Capturas em desktop (1440×900) e celular (390×844); `npm run build` ok; lint sem avisos novos. Scripts: `workbench/tools/{seam,fade-check,fly-check,farm-shot,iso-shot}.mjs`.

## Correções (mesmo dia)
- **Emenda duplicada no Hero:** o manifesto da versão HD (`desktop-hd/manifest.json`) ainda tinha as medidas do chão antigo, então a imagem nova saía esticada e repetia o curral e o drone. Agora ele é sincronizado (e `ground_v5.py` passou a atualizá-lo junto).
- **Maquete:** as montanhas, talhões, árvores externas e o gado refeito foram retirados (perspectiva estranha); voltou a arte original (360 KB gzip->~70 KB). Ficaram o layout em tela cheia e os cartões de vidro. Ao fundo, uma foto suave da lavoura (`public/frames/sistema-bg.webp`, 86 KB) sob um véu claro. A versão enriquecida está guardada em git (commit 7819a98) e o gerador anterior em `workbench/assets/backup/fazenda-build-v1.mjs`.

## Fundo da maquete (2026-10-15, rodada 3)
Foto trocada por uma ilustração gerada no Magnific no estilo da própria maquete (seedream-5-pro, 16:9 2k, referência de estilo = render da maquete). 3 opções (300 créditos); escolhida a 1 (`workbench/assets/gen-v5/bg-1.png`, as outras em bg-2 e bg-3). Servida em `public/frames/sistema-bg.webp` (162 KB), sem desfoque e com véu só nas pontas para fundir com a página; título com halo claro para manter a leitura.

## Hero mobile em HD (2026-10-16)
- O clipe mobile tinha só 608×1080 (o do desktop, 1920×1080). Ampliado no Magnific (Precision, 1k, 1080 px de largura; 4.297 créditos) → `workbench/assets/gen-v2/clip-mobile-v2-1080.mp4` (1080×1918, 241 quadros).
- `build_v2.py mobile` agora usa esse clipe e gera também `public/frames/hero/mobile-hd/` (AVIF 1080 px, 112 quadros, 7,3 MB). A versão leve (`mobile`, 608 px, 5,2 MB) continua para rede fraca/sem AVIF e fornece o poster.
- `Hero.tsx`: no celular usa `mobile-hd` quando a tela tem ≥ 700 px reais (largura × densidade, limitada a 2×), sem economia de dados, rede 4G e suporte a AVIF; senão `mobile`. O chão (`ground.webp`) é o mesmo nas duas e `ground_v5.py` mantém os manifestos em sincronia.
- Backup do mobile anterior: `workbench/assets/backup/hero-mobile-v3/`.

## Maquete isométrica no celular
Faixa rolável 150% mais larga que a tela (arrasta para os lados), etiquetas maiores e sempre visíveis; tocar num setor centraliza nele e abre o cartão embaixo. Sem o zoom de câmera que cortava o setor.

## Console
A imagem do mockup do Ponto de partida passa a existir desde o início (a animação não encontrava o alvo); avisos "GSAP target not found" dos demais trechos (Hero e mídia adiada) silenciados em `lib/scroll.ts`.

## Rodada mobile 2 (2026-10-16)
- **Escopo no celular:** a foto do chão cobria só 578 de 844 px da tela, então o fim aparecia. `ground_v5.py mobile` estica o rodapé da plantação de forma progressiva até a imagem ter ~4,1× a largura (4428 px), e a imagem ganhou máscara de transparência no rodapé (nunca uma borda seca).
- **Sistema:** clicar/tocar fora da maquete e do cartão volta ao estado inicial (desktop e celular). Maquete menor no celular (128% da largura) e fundo 9:16 próprio (`public/frames/sistema-bg-mobile.webp`, 107 KB; geradas 2 opções, 200 créditos, escolhida a 2; originais em `workbench/assets/gen-v5/bgm-*.png`).
