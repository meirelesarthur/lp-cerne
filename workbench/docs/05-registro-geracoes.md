# Registro de gerações (Magnific)

Todas as gerações do Hero. Originais em `assets/gen/`. Modelo de imagem: Seedream 5 Pro (2k). Modelo de vídeo: Seedance 2.5.

| Arquivo | Tipo | Modelo | Seed | Referência | Resultado |
|---|---|---|---|---|---|
| K1-a.png | imagem 16:9 | seedream-5-pro | 4210 | — | descartada (caminhonete menor) |
| K1-b.png | imagem 16:9 | seedream-5-pro | 4211 (idx 1) | — | **escolhida** (K1) |
| K2-a.png | imagem 16:9 | seedream-5-pro | 4211 | K1-b | **escolhida** (K2) |
| K2-b.png | imagem 16:9 | seedream-5-pro | 4211 | K1-b | alternativa |
| K3-a.png | imagem 16:9 | seedream-5-pro | 4212 | K1-b | **escolhida** (K3, tela preta lisa) |
| K3-b.png | imagem 16:9 | seedream-5-pro | 4212 | K1-b | alternativa |
| K1/K2/K3-9x16.png | imagens 9:16 | seedream-5-pro | 4220–4222 | K1-b, K2-a, K3-a | escolhidas (mobile) |
| clip1.mp4 | vídeo 16:9 4 s 1080p | seedance-pro-2.5 | 4301 | start K1-b, end K2-a | usado |
| clip2.mp4 | vídeo 16:9 4 s 1080p | seedance-pro-2.5 | 4302 | start K2-a, end K3-a | usado |
| clip1-mobile-v1-ghost.mp4 | vídeo 9:16 4 s | seedance-pro-2.5 | 4311 | K1-9x16 → K2-9x16 | descartado (dupla exposição da caminhonete por volta de 2 s) |
| clip1-mobile.mp4 | vídeo 9:16 5 s | seedance-pro-2.5 | 4313 | K1-9x16 → K2-9x16 | usado (prompt reforçado: sem dissolve/crossfade) |
| clip2-mobile.mp4 | vídeo 9:16 4 s | seedance-pro-2.5 | 4312 | K2-9x16 → K3-9x16 | usado |

`base.mp4` (desktop, 8,1 s) e `base-mobile.mp4` (mobile) são as concatenações dos clips usados (ffmpeg, 24 fps). Custo aproximado: 8 imagens x 100 + 5 vídeos x 3.160 a 3.950 créditos.

## Prompts
- **K1**: foto cinematográfica, pasto brasileiro ao amanhecer com neblina, gado Nelore branco ao fundo, caminhonete branca cabine dupla (sem logos) à esquerda do centro, contraluz quente, sem pessoas e sem texto.
- **K2**: mesma cena, plano médio baixo à frente da caminhonete, notebook prata aberto sobre o capô com a tela preta voltada à câmera.
- **K3**: close frontal do notebook sobre o capô, tela preta lisa ocupando ~70% do quadro (para o corner-pin).
- **Vídeo**: dolly-in contínuo, sem cortes, notebook e caminhonete rígidos, sem pessoas e sem texto.

---

# Hero v2 (2026-10-08): ombro do fazendeiro → fazenda → tablet gigante

Gerado sozinho, com teto de 20.000 créditos. **Gasto real: 14.730 créditos** (saldo 228.767 → 214.037). Originais em `assets/gen-v2/`. Todos os usados estão no Magnific com a tag **hero-v2** e status **Approved**.

| Arquivo | Tipo | Modelo | Seed | Referência | Créditos | Resultado |
|---|---|---|---|---|---|---|
| K0-a.png | imagem 16:9 2k | seedream-5-pro | 5100 | — | 100 | **escolhida**: ombro + tablet horizontal (tela magenta), lotes sem teto, Nelores, soja, morros |
| K0-b.png | imagem 16:9 2k | seedream-5-pro | 5101 | — | 100 | descartada: galpão coberto ao fundo |
| K3-a.png | imagem 16:9 2k | seedream-5-pro | 5130 | K0-a | 100 | descartada: confinamento coberto |
| K3-b.png | imagem 16:9 2k | seedream-5-pro | 5131 | K0-a | 100 | **escolhida**: tablet gigante centralizado saindo dos morros, fazenda no rodapé, drone na soja |
| (extensão do K3) | outpaint 9:16 | expand (ideogram) | — | K3-b | 50 | descartada: baixa resolução e texto espúrio impresso |
| P-plantacao.png | imagem 16:9 2k | seedream-5-pro | 5140 | K3-b | 100 | usada: perspectiva da plantação (emenda com a 2ª seção) |
| clip-v2.mp4 | vídeo 16:9 12 s 1080p | seedance-pro-2.5 | 5200 | start K0-a, end K3-b | 9.480 | **usado** (um único plano contínuo) |
| K0-9x16.png | imagem 9:16 2k | seedream-5-pro | 5160 | K0-a | 100 | usada (mobile) |
| K3-9x16.png | imagem 9:16 2k | seedream-5-pro | 5161 | K3-b | 100 | usada (mobile) |
| P2-plantacao-9x16.png | imagem 9:16 2k | seedream-5-pro | 5170 | P-plantacao | 100 | usada: plantação próxima (fundo fixo da 2ª seção) |
| clip-mobile-v2.mp4 | vídeo 9:16 10 s 720p | seedance-pro-2.5 | 5210 | start K0-9x16, end K3-9x16 | 4.400 | **usado** (contínuo, drone visível o tempo todo) |

**Pendência visual conhecida (desktop):** entre 4 e 6 s do clip 16:9 aparece uma faixa coberta (parece telhado/painel) na borda esquerda dos lotes. Refazer o clip custaria 9.480 créditos e estouraria o teto; o mobile não tem esse problema.

Prompts completos: `docs/06-hero-v2-prompts.md` (o do clip contínuo foi usado quase literalmente; o K3 pediu o tablet centralizado com ~45% da largura).

---

# Perfis v1 (2026-10-13): "do campo ao escritório"

Gasto: **8.500 créditos** (saldo 214.037 → 205.537). Originais em `assets/gen-v3/`. Usados com a tag **perfis-v1** + Approved.

| Arquivo | Tipo | Modelo | Seed | Referência | Créditos | Resultado |
|---|---|---|---|---|---|---|
| A-a/A-b.png | imagem 16:9 2k | seedream-5-pro | 6100 | K0 (Hero) | 200 | descartadas: lotes com cobertura vistos pela janela |
| A2-a.png | imagem 16:9 2k | seedream-5-pro | 6110 | K0 | 100 | alternativa |
| A2-b.png | imagem 16:9 2k | seedream-5-pro | 6111 | K0 | 100 | **escolhida (fim)**: gestor no escritório claro, notebook magenta, lotes abertos pela janela |
| B-a.png | imagem 16:9 2k | seedream-5-pro | 6120 | K3 (Hero) | 100 | alternativa (névoa, cocho) |
| B-b.png | imagem 16:9 2k | seedream-5-pro | 6121 | K3 | 100 | **escolhida (início)**: vaqueiro com celular magenta junto ao cocho, Nelores, céu aberto |
| clip-campo.mp4 | vídeo 16:9 10 s 1080p | seedance-pro-2.5 | 6200 | start B-b, end A2-b | 7.900 | **usado**: um plano contínuo, a câmera acompanha o vaqueiro até o escritório e entra pela janela |

Telas compostas: app Operação real (build web, login de demonstração, OS #2198 "Vacinação — Lote 12") no celular; painel real de Pecuária de Corte (web, modo claro, barras recolhidas) no notebook. A tela "Lista de OS" do web não foi usada porque ainda está como "será implementada em breve".

# Perfis v2 (2026-10-13): campo → fazenda inteira → escritório, em tela cheia

Teto combinado: 20 mil créditos. Gasto real: **17.675 créditos** (saldo 205.537 → 187.862). A soma estimada era 16.400 (6 imagens × 100 + 2 vídeos × 7.900); a diferença de 1.275 aparece no saldo e não foi detalhada pela API. Originais em `assets/gen-v4/`. Usados com a tag **perfis-v2** + Approved. A v1 (`assets/gen-v3/clip-campo.mp4`) saiu da página.

| Arquivo | Tipo | Modelo | Seed | Referência | Créditos | Resultado |
|---|---|---|---|---|---|---|
| A-a.png | imagem 16:9 2k | seedream-5-pro | 7100 | K3 (Hero) | 100 | **escolhida (início)**: vaqueiro na leitura de cocho, celular magenta grande, Nelores, confinamento sem cobertura |
| A-b.png | imagem 16:9 2k | seedream-5-pro | 7101 | K3 | 100 | alternativa (celular pequeno demais) |
| B-a | imagem 16:9 2k | seedream-5-pro | 7200 | K3 | 100 | não usada |
| B-b.png | imagem 16:9 2k | seedream-5-pro | 7201 | K3 | 100 | **escolhida (meio)**: aérea com confinamento aberto, armazém, silos, prédio administrativo, caminhão carregando, soja e morros com névoa |
| C-a.png | imagem 16:9 2k | seedream-5-pro | 7300 | K3 | 100 | alternativa |
| C-b.png | imagem 16:9 2k | seedream-5-pro | 7301 | K3 | 100 | **escolhida (fim)**: escritório amplo, parede de vidro para silos com bitrem carregando e currais |
| clip-1.mp4 | vídeo 16:9 10 s 1080p | seedance-pro-2.5 | — | start A-a, end B-b | 7.900 | **usado**: a câmera segura no celular e sobe até a vista da fazenda inteira |
| clip-2.mp4 | vídeo 16:9 10 s 1080p | seedance-pro-2.5 | — | start B-b, end C-b | 7.900 | **usado**: desce sobre os currais, passa pelo armazém, entra pela fachada de vidro e chega ao gestor |

Montagem (`video/hero-a/build_perfis.py`): os dois clipes viram um plano de 20 s (a emenda descarta o quadro repetido). Telas compostas: OS #2198 "Vacinação — Lote 12" do app Operação no celular; painel de Pecuária de Corte no notebook. No celular, o recorte vertical acompanha o aparelho em foco.

## Mocks com telas reais (2026-10-14)
Cenas com tela em magenta chapado (chroma key), geradas em `seedream-5-pro`, 3:2, 2k (2496×1664), 100 créditos cada. Total: 500 créditos (saldo 187.862 → 187.362).

| Arquivo | Uso | Prompt (resumo) | Resultado |
|---|---|---|---|
| `assets/gen-mocks/tablet-key-A.png`, `tablet-key-B.png` | Tablet no campo (2 candidatas) | mãos segurando tablet rugged em landscape na soja, pôr do sol, tela magenta, dedos só nas laterais | **B escolhida**: tela grande e inteira, mãos fora da tela |
| `assets/gen-mocks/devices-1.png` a `devices-3.png` | Notebook + 2 celulares (3 candidatas) | estúdio fundo branco, notebook à esquerda e dois celulares de frente, afastados, telas magenta, pill da câmera | **2 escolhida**; a 3 cortava o notebook, a 1 deixava os aparelhos pequenos |

### Rodada 3: aparelhos juntos e sobrepostos (2026-10-14)
`assets/gen-mocks/devices-v3-1.png` a `devices-v3-3.png`: seedream-5-pro, 3:2, 2k, 100 créditos cada (300 no total; saldo 187.362 → 187.062). Prompt: notebook à esquerda, dois celulares de frente à direita, agrupados; o da esquerda à frente do canto inferior direito do notebook, o da direita um pouco atrás, ~10% escondido; telas magenta e pill da câmera. **v3-1 escolhida**: a que menos tampa a tela do notebook.

### Rodada 4: mocks 9:16 para banner impresso (2026-10-14)
Saldo 187.062 → 183.112 (3.950 créditos no total: 14 imagens a 100 e 2 upscales).
- `assets/gen-mocks/desk-1..5.png`, `field-1..5.png` (seedream-5-pro, 9:16, 2k = 1440×2560): cenas com tela magenta. Os aparelhos saíram na metade de baixo.
- `desk-6/7.png` e `field-6/7.png`: variações "câmera mais afastada" usando a candidata 2 como imagem de referência; funcionou e levou os aparelhos ao terço inferior. **Escolhidas: desk-6 e field-6.**
- Upscale 2x (Magnific Precision "photo", balanced): `desk-final-up.png` e `field-final-up.png`, 2880×5120.

### Rodada 5: notebook e apps no campo, 16:9 para impressão (2026-10-15)
Saldo 177.112 → 174.962 (2.150 créditos: 8 imagens a 100 e 1 upscale 4x a 1.350).
- `assets/gen-mocks/field16-1..4.png` (seedream-5-pro, 16:9, "4k" = 2560×1440): mesa de madeira na beira da lavoura de soja, pôr do sol, mesmo arranjo da v3 com telas magenta. Aparelhos saíram grandes demais (metade da cena).
- `field16-5..8.png`: variação "câmera mais afastada, grupo inteiro no terço direito" com a candidata 2 como referência. **Escolhida: field16-6** (notebook começa em 67,6% da largura).
- Upscale 4x (Magnific Precision sublime, balanced): `field16-6-up4x.jpg`, 10240×5760.

### Rodada 6: notebook e apps no campo, 9:16 para impressão (2026-10-15)
Saldo 174.962 → 173.212 (1.750 créditos: 4 imagens a 100 e 1 upscale 4x a 1.350).
- `assets/gen-mocks/field916-1..4.png` (seedream-5-pro, 9:16, "4k" = 1440×2560), com a cena 16:9 escolhida (field16-6) como referência: mesma mesa, mesmos aparelhos e arranjo, grupo centralizado na parte de baixo, lavoura e céu livres em cima. **Escolhida: field916-3** (grupo inteiro com margem dos dois lados e mesa inteira).
- Upscale 4x (Magnific Precision sublime, balanced): `field916-3-up4x.jpg`, 5760×10240.

### Rodada 7: notebook + celular em fundo branco, 16:9 para impressão (2026-10-15)
Saldo 173.212 → 171.462 (1.750 créditos: 4 imagens a 100 e 1 upscale 4x a 1.350).
- `assets/gen-mocks/duo-1..4.png` (seedream-5-pro, 16:9, "4k" = 2560×1440): estúdio, fundo branco, notebook de frente e um celular em pé ao lado, sem sobreposição, sem mãos, telas magenta. **Escolhida: duo-4** (aparelhos maiores e centralizados).
- Upscale 4x (Magnific Precision sublime, balanced): `duo-4-up4x.jpg`, 10240×5760. Fundo levado a branco puro com `assets/mocks/whiten_bg.py` → `duo-4-up4x-branco.png`.

### Rodada 8: fundos das frentes dos cartões de visita, 16:9 (2026-10-16)
Saldo 166.615 → 166.215 (400 créditos: 4 imagens a 100).
- seedream-5-pro, 16:9, 2k (2560×1440), sem texto, a partir das referências de cartão enviadas pelo Arthur.
- GB Agritech: amanhecer aéreo, sol no terço superior direito sobre a serra, neblina nos vales, lavoura em linhas e matas escuras. **Escolhida: variação 2** → `print/cartoes/assets/fundo-agritech.jpg`.
- GB Consult: colinas verdes com neblina, serras azuladas ao fundo, árvores à direita, céu creme. **Escolhida: variação 1** → `print/cartoes/assets/fundo-consult.jpg`.

## Rodada Perfis: homem pisando no cocho (2026-10-16)
Problema: no começo do plano do Perfis (clip-1), o segundo homem ao fundo estava em cima do cocho (quebra o realismo).
- Edição do quadro-chave A-a (Ideogram precise edit, 80 créditos cada): mover o homem para o chão não funcionou (a geometria o mantém no cocho em 3/3); **remover o homem** funcionou (`workbench/assets/gen-v5/Aa-rm-1..3.png`, escolhida a 1).
- Regerar o clipe a partir do quadro novo (Seedance 2.5, 7.900 e 9.480 créditos): o homem sumiu, mas os dois clipes ganharam dupla exposição na transição (armazém fantasma no céu aos ~2 s; gado translúcido aos 3,4-6 s) → descartados (`clip-1-novo.mp4`, `clip-1-novo2.mp4`).
- Caminho adotado: editar o clipe ORIGINAL (`clip-1-antigo.mp4`) com Runway Aleph 2 (video_modify, 5.850 créditos), removendo só o homem do cocho. Resultado pendente.
- **Resultado:** `clip-1-editado.mp4` (Aleph 2) aprovado e usado como `assets/gen-v4/clip-1.mp4` (original em `clip-1-antigo.mp4`). Quadros do Perfis regerados (desktop-hd 11,5 MB, desktop 5,0 MB, mobile 3,9 MB) e reenviados ao R2. Backup dos quadros anteriores em `workbench/assets/backup/perfis-v3/`. A dissolução em ~3,4-4,4 s (gado translúcido, armazém no céu) já existia no clipe original e permanece.
