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
