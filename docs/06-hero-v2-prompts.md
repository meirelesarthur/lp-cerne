# Hero v2: prompts para o Magnific

> Atualização 2026-10-08: o modelo de co-criação foi trocado por geração autônoma (teto de 20 mil créditos). O que foi de fato gerado, com custos e escolhas, está em `05-registro-geracoes.md`.

Fluxo: você gera no Magnific, marca cada criativo aprovado com o status **Approved** e a tag **`hero-v2`**, e me avisa no chat ("aprovei K0"). Eu busco por `status=approved` + tag `hero-v2`, baixo e sigo. Nada é usado sem estar aprovado.

## Regras para todos os prompts (plano contínuo, sem cortes)
- Uma única câmera, um único movimento: **afasta e sobe** (crane/pull-back). Nada de corte, dissolve, crossfade, morph, whip pan.
- Mesma luz em tudo: nascer do sol, contraluz dourado quente, neblina leve.
- Mesmo fazendeiro em todos os quadros: brasileiro, ~40 anos, pele morena, cabelo curto escuro, barba rala; **polo verde social** (verde-escuro), **calça jeans**, **botina de trabalho suja de terra vermelha** (nunca limpa).
- Confinamento **sem teto**, poucos lotes, tudo belíssimo e bem cuidado, **Nelores** belos. Ao lado, uma **plantação de soja enorme** em linhas. **Morros baixos do Espírito Santo** ao fundo.
- **Drone agrícola** (quadricóptero branco com detalhes verdes, sem logos) **mapeando a soja**, visível durante todo o afastamento.
- Telas de tablet = **magenta liso `#FF00FF`**, sem reflexo, sem texto, sem ícones (eu coloco o sistema por cima).
- Sem texto, logotipos ou marcas d'água em nenhuma imagem.
- Modelo sugerido (imagens): **Seedream 5 Pro, 2k, 16:9** (ou Nano Banana Pro). Para consistência, **use o K anterior como referência de imagem**. Depois, repita em **9:16** para o mobile.
- Modelo (vídeo): **Seedance 2.5, 1080p, sem efeitos sonoros**.

Ordem de geração: **K0 → K1 → K2 → K3** (cada um com o anterior como referência). Gere 2 a 4 variações de cada e aprove a melhor.

---

## K0: ombro do fazendeiro com o tablet (primeiro quadro)
**Referências:** nenhuma.
```
Cinematic photograph, over-the-shoulder shot: the camera sits just behind and slightly above the right shoulder of a Brazilian farmer, about 40 years old, tanned skin, short dark hair, light stubble. Only his shoulder, ear and the side of his face are visible in the left foreground. He wears a dark green short-sleeve smart-casual polo shirt. He holds a modern 11-inch tablet horizontally in landscape orientation with both weathered hands; the tablet fills about 60 percent of the frame, thin black bezel, the screen is a perfectly flat uniform solid magenta (#FF00FF) rectangle with no reflections, no icons, no text, no logo. Behind the tablet, softly out of focus: an open-air cattle feedlot without any roof, a few tidy beautifully maintained pens with clean feed bunks, a handful of beautiful white Nelore cattle, low rolling green hills of Espirito Santo Brazil in morning haze. Sunrise backlight, warm golden rim light on his shoulder, shallow depth of field, photorealistic, 35mm lens, no text, no watermark.
```
**Aprovar se:** tablet horizontal, tela magenta perfeitamente lisa e retangular, mãos naturais, polo verde, nada de roça com teto.

## K1: atrás das costas do fazendeiro, o confinamento à frente
**Referência:** K0 (imagem).
```
Same scene, same farmer, same sunrise light. The camera has pulled back and moved behind him: a medium shot from about three meters behind and slightly above, seeing his back and right side. Same dark green short-sleeve smart-casual polo shirt, blue jeans with a little dust, leather work boots caked with red Brazilian mud (dirty, lived-in, not clean). He stands on a dirt path at the edge of the feedlot, holding the horizontal tablet at chest height (only its edge visible). In front of him: an open-air cattle feedlot with no roof, five tidy pens with clean concrete feed bunks, beautiful white Nelore cattle, everything immaculate and well kept. On the right a huge soybean field in neat green rows runs toward low rolling hills. Golden sunrise backlight, light mist, photorealistic cinematic, 35mm, no text, no watermark.
```
**Aprovar se:** botina visivelmente suja de terra, mesmo rosto/roupa de K0, lotes sem teto e impecáveis.

## K2: afastando e subindo, fazenda e soja com o drone mapeando
**Referência:** K1.
```
Same scene, same sunrise light, same farmer now small in the lower part of the frame seen from behind. The camera has risen high in a smooth crane move: wide elevated view of the whole farm. In the lower third, the open-air feedlot without roof with tidy pens and white Nelore cattle; to the right, a very large soybean field with perfect green rows reaching the foot of low rolling hills of Espirito Santo Brazil. Over the soybean field a white agricultural drone with green details and four rotors, no logos, flies low mapping the crop, clearly visible. Sun rising behind the hills, soft mist in the valleys, big sky with thin clouds above. Photorealistic cinematic, no text, no watermark.
```
**Aprovar se:** o drone está nítido e plausível sobre a soja, hills baixos, lotes ainda reconhecíveis.

## K3: último quadro, fazenda como rodapé, tablet gigante saindo das montanhas
**Referência:** K2.
```
Same scene and light, camera now very high and steady. Composition: the farm (feedlot with tidy pens, white Nelore cattle, huge soybean field, a small white agricultural drone mapping the crop) forms only the bottom quarter of the frame like a footer; in the middle, the low rolling hills of Espirito Santo Brazil in warm haze; the upper half is open sunrise sky with soft clouds. From behind the ridge of the hills a gigantic modern tablet in landscape orientation rises, far larger than the hills, about 60 percent of it above the ridge, thin black bezel, the screen is a perfectly flat uniform solid magenta (#FF00FF) rectangle without reflections, text or icons, soft atmospheric haze at its base, subtle warm glow on its edges. Photorealistic cinematic, no text, no watermark.
```
**Aprovar se:** o tablet é grande, horizontal, de tela magenta lisa, emergindo atrás da crista; céu livre em cima.

---

## Vídeo, Plano A (preferido): um único clip contínuo
**Modelo:** Seedance 2.5 · **Start frame:** K0 · **End frame:** K3 · **Duração:** 15 a 18 s · 16:9 · 1080p · sem sons.
```
One single continuous real-camera shot, no cuts, no dissolves, no crossfades, no morphing. We start over the right shoulder of a Brazilian farmer in a dark green polo shirt holding a landscape tablet with a flat magenta screen. The camera glides smoothly backward and upward in one crane pull-back: it passes over his shoulder and moves behind his back, revealing his blue jeans and dirty work boots caked with red mud, then the open-air roofless cattle feedlot with tidy pens and beautiful white Nelore cattle. It keeps rising and pulling back, revealing a huge soybean field where a white agricultural drone with green details flies low mapping the crop, and the low rolling hills of Espirito Santo at sunrise. The camera settles high and steady with the farm as the bottom footer of the frame, hills in the middle and open sky above, and from behind the hills a gigantic landscape tablet with a flat magenta screen slowly rises. Constant smooth camera speed, golden sunrise backlight, light mist, photorealistic, no text, no logos, no people other than the farmer.
```
**Aprovar se:** sem corte aparente, rosto/roupa estáveis, drone presente durante todo o afastamento, tablet gigante emergindo sem deformar.

## Vídeo, Plano B (se o Plano A perder fidelidade no meio): 3 clips encadeados
O **end frame de um clip é exatamente a mesma imagem do start frame do próximo**. Mesma velocidade de câmera nas emendas. Seedance 2.5 · 5 s cada · 16:9 · 1080p · sem sons.

**B1: K0 → K1**
```
One single continuous real-camera shot, no cuts, no dissolve, no crossfade, no morphing. The camera starts over the right shoulder of the farmer looking at his landscape tablet and glides smoothly backward and around his shoulder to settle behind his back, revealing his dirty work boots and the roofless feedlot ahead. Constant smooth speed that continues at the end of the shot. Golden sunrise, photorealistic, no text.
```
**B2: K1 → K2**
```
One single continuous real-camera shot, no cuts, no dissolve, no crossfade, no morphing. The camera keeps gliding backward and rises in a smooth crane move over the farmer, revealing the whole farm: the roofless feedlot with tidy pens and white Nelore cattle, the huge soybean field and a white agricultural drone with green details mapping the crop, low rolling hills at sunrise. Same camera speed as the previous shot, photorealistic, no text.
```
**B3: K2 → K3**
```
One single continuous real-camera shot, no cuts, no dissolve, no crossfade, no morphing. The camera keeps rising and slows to a steady high frame: the farm becomes the bottom footer of the frame, hills in the middle, open sunrise sky above, the drone still mapping the soybeans. From behind the ridge of the hills a gigantic landscape tablet with a flat magenta screen slowly rises. Photorealistic, no text.
```

## Versão mobile (9:16)
Repita K0 a K3 e o clip com **as mesmas descrições**, trocando só a proporção para **9:16** e acrescentando ao fim de cada prompt de imagem: `vertical composition, the subject centered, key elements stacked top to bottom`. No K3 vertical: fazenda no rodapé, morros no meio, tablet gigante no terço superior, céu acima dele.

## O que eu faço em paralelo enquanto você gera
Vídeo do sistema para a tela do tablet gigante (HyperFrames), captura do web em modo claro com as duas barras recolhidas (tela que entra no tablet da mão), script de rastreio da tela e a nova Hero em tema claro.
