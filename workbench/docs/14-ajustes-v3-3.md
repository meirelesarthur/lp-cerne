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
