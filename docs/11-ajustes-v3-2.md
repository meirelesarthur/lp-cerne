# Ajustes v3.2 (2026-10-14)

## 1. Fim do Escopo ("O que o Cerne cobre")
- Removida a lâmina verde-acinzentada dos três fatos. Eles agora são cartões claros em vidro, no mesmo estilo dos de cima, com uma barra de acento verde à esquerda.
- A própria foto da fazenda continua esmaecendo até o fundo claro (véu em `GroundSection`), começando um pouco mais tarde para o título seguir legível. O respiro até a próxima seção foi encurtado (`.ground-fade` 20vh → 4vh).

## 2. Ponto de partida → virada (`ProblemSection`)
- Desktop (≥961 px, ≥600 px de altura, sem movimento reduzido): palco fixo (pin, +240%) em duas etapas.
  - **A, a dor:** planilha, caderno e conversa se aproximam e se sobrepõem conforme o scroll.
  - **B, a virada:** a etapa A sai por completo e entra "O Cerne junta tudo em um lugar." com o mockup dos três produtos em grande (notebook com o Visão Geral, celular Administração com Rebanho e confinamento, celular Operação com a OS aberta), mais três selos: Cerne Web (disponível), Administração e Operação (em teste).
- Celular e movimento reduzido: sem pin; os blocos ficam empilhados (planilha, caderno e conversa em coluna, depois o mockup).
- Imagem: `public/mocks/cerne-produtos-{1400,2400}.webp`, derivada de `assets/mocks/out/mock-notebook-e-apps-v3-4000.png` com o fundo normalizado para branco (ajuste de plano nas bordas) e recorte; o CSS usa `mix-blend-mode: multiply`, então o fundo da imagem se funde ao da seção (diferença medida: 1 a 3 níveis).

## 3. Sistema ("Seis frentes. Um só cadastro.")
Interpretei "sessão do sistema de funcionamento" como esta seção (o bento). Mudanças: numeração 01–06 e selo de categoria; funcionalidades reais do menu do web em cada cartão (mapa de currais, dieta e batelada, romaneios, livro caixa, depreciações etc.); nota no cartão Cadastros; textura de pontos e brilho suaves no fundo, com máscara que esmaece nas pontas; barra de acento no topo dos cartões; e a "espinha" final ligando as seis frentes ao cadastro único.

## QA
`tools/sections-qa.mjs <w> <h> <rótulo>` captura Escopo, Problema (pontos reais do pin) e Sistema em `docs/shots/v4/`. Build e lint sem erros novos.
