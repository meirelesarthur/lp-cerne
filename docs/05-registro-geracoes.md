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
