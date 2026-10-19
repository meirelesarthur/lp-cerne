# 17 · Copy da LP × produto real (2026-10-16)

## Contexto
O zip `GB.Cerne.FrontEnd-20261015-1438.zip` traz o frontend atual do Cerne Web. O mapeamento foi feito em `src/config/v2/navigationTree.ts`, no `router` e em `src/pages/*`. A comparação é com a copy implementada em `lp-cerne`: `Hero`, `GroundSection`, `Sections`, `model.ts` e `index.html`.

Conclusão: **a LP vende pouco o que o produto já tem e promete coisas que o produto não mostra.** O Cerne Web tem:
- 11 módulos e cerca de 150 funcionalidades;
- **115 relatórios**, com PDF e Excel;
- **11 dashboards**;
- um módulo fiscal completo.

A LP fala de 4 a 6 frentes e trata o fiscal como "[a validar]".

## 1. Riscos: o que a LP afirma e o código não confirma
| Afirmação na LP | Onde | Situação no frontend | Ação |
|---|---|---|---|
| "Trato diário e leitura de cocho" no Cerne Web | bento 01 (Trato e cocho), maquete Confinamento, `GroundSection` card 2 | **Não existe no web.** Foi removido de propósito por decisão de produto (`RecentActivities/recent-activity-type.ts`) | Atribuir só ao app Operação (em teste), se for o caso. No web, trocar por "Mapa de confinamento, dietas, batidas e fases de alimentação" |
| Bento 06: "Custos do confinamento", "Desempenho de lotes" | `Sections.tsx` bento | Estão no menu, mas sem página dedicada (placeholder) | Trocar por dashboards reais: Pecuária de Corte, Financeiro, Suprimentos, Pluviômetro |
| Trailer cap. 04 "Custos do confinamento" | `Sections.tsx` Trailer | Mesmo caso | Usar "Custo de produção COE × COT" (Visão geral) ou "Custeio por lote" (relatório) |
| "O ERP completo" | Edições | Ok em amplitude, mas genérico | Trocar por prova numérica (ver §3) |
| Nota interna "Depoimentos… só entram com material real…" aparece publicada | Confiança | Vazamento de nota interna | Remover |
| Consentimento LGPD cita uma Política de Privacidade sem link | Form | Risco de conformidade | Link obrigatório antes de publicar |
| "Primeira hora do lançamento" e "Cerne Web disponível" ao mesmo tempo | Hero / Form / FAQ | Contradição | Ver §4: definir se o lançamento é dos apps ou do web |
| CTA do GB Twin envia o interesse "todos" | GB Twin | Rastreio de lead | `data-interest="gb-twin"` |

**Não afirmar:**
- IA, assistente ou MCP: são restos do projeto "Rank".
- Chat ou tickets.
- Integração direta com SISBOV: hoje só existem relatórios.
- Open Finance ou bancos nomeados.
- Modo offline.

## 2. Pontos fortes reais que a LP não usa (ordem de impacto comercial)
1. **Fiscal do produtor rural:** NF-e, CT-e (manifestação), MDF-e, DF-e, NFS-e recebidas, **LCDPR**, partida dobrada, exportação para o **Domínio** (folha, bancário, pagar/receber, NFS-e). Hoje a LP marca esse módulo como "[a validar]". É o maior ganho imediato.
2. **115 relatórios, 11 dashboards, PDF/Excel com a marca do cliente.** Prova concreta contra "planilha paralela".
3. **Custo e margem de verdade:**
   - COE × COT;
   - margem operacional;
   - DRE e DRE anual;
   - custeio por lote, animal, área e módulo;
   - previsto × realizado;
   - rateio por centro de custo.
4. **Pecuária de ciclo completo:**
   - reprodução com IATF, FIV e monta natural, estação de monta, receptoras e registro genealógico;
   - GMD e @/mês;
   - ~~Programa ABC Corte~~ (fora da v1: funcionalidade imatura, não citar na LP);
   - relatórios SISBOV.
5. **Suprimentos com governança:**
   - solicitação → cotação → autorização → compra → recebimento;
   - SLA/ANS e Savings;
   - **fornecedor responde a cotação por link/WhatsApp**;
   - ranking de fornecedores.
6. **Balança rodoviária integrada:** captura automática do peso e NF-e direto da pesagem.
7. **Rastreabilidade com página pública ao consumidor** (`/rastreio`) e site da fazenda.
8. **Pluviometria com previsão do tempo e janela de aplicação.**
9. **Financeiro conciliado:**
   - OFX e conciliação;
   - congelamento de meses;
   - contratos com certificado digital;
   - orçamento importado de .xlsx.
10. **Governança:**
    - multi-fazenda e multi-empresa;
    - perfis e permissões por ação;
    - autorizadores;
    - logs e atividades recentes;
    - 3 idiomas;
    - app instalável (PWA).

## 3. Propostas de copy por seção (antes → depois)

**Meta / OG** (`index.html`)
- Title: "Cerne | ERP para o agro" → **"Cerne | ERP da fazenda: pecuária, lavoura, fiscal e financeiro"**
- Description: "Rebanho, lavoura, suprimentos, fiscal e financeiro num só sistema. 115 relatórios, NF-e, MDF-e e LCDPR, custo por lote e por talhão."
- Adicionar `og:title/description/image` e canonical.

**Hero**
- H1 mantido: "Do campo ao financeiro, num só sistema." É forte.
- Lead → **"Rebanho, lavoura, compras, estoque, fiscal e financeiro da sua fazenda no mesmo cadastro, com custo por lote e por talhão sem planilha paralela."**
- Abaixo do lead, uma linha de prova: **"115 relatórios · 10 painéis · NF-e, MDF-e e LCDPR"**.

**02 Escopo (GroundSection)**
- H2 "Tudo da fazenda em uma visão só." → **"Uma fazenda, um cadastro, nenhuma planilha paralela."**
- Card "Rebanho e confinamento":
  - antes: "Lotes, currais, dieta, trato e leitura de cocho."
  - depois: **"Do nascimento à venda: reprodução (IATF/FIV), pesagens, sanitário e mapa de confinamento."**
- Novo card **"Lavoura"**: "Safra, talhões no mapa, apontamentos, romaneio e balança integrada."
- Fato Fiscal (tirar "[a validar]"): **"NF-e, CT-e, MDF-e e LCDPR emitidos de dentro da operação, com exportação para o Domínio."**

**03 Problema → virada**
- Manter a dramatização. A dor 03 "Resultado por lote… só no fechamento" casa com a prova.
- Lead da virada → **"Cada nota, pesagem e compra entra uma vez e já aparece no custo, no estoque e no DRE."**

**04 Trailer**
- Capítulo 04 → **"Custo de produção: COE × COT e margem operacional da safra."**
- ~~Capítulo 05 com o Programa ABC Corte~~: descartado, o ABC Corte não sai na v1.

**05 Bento: "Seis frentes" → "Oito frentes. Um só cadastro."**
- Adicionar **Fiscal** (NF-e · CT-e · MDF-e · LCDPR · Domínio).
- Adicionar **Frota e pessoal** (manutenção preventiva, abastecimento, apuração mensal, OS).
- Pecuária: itens → Mapa de confinamento · Reprodução IATF/FIV · Pesagem e GMD · SISBOV (relatórios).
- Suprimentos: acrescentar **"Cotação respondida pelo fornecedor via link"** e **"SLA de compras"**.
- Financeiro: Contas a pagar/receber · Conciliação OFX · DRE · Previsto × realizado.
- Dashboards e relatórios: **"115 relatórios em PDF e Excel e 10 painéis prontos"**. Trocar a lista pelos painéis reais.

**Maquete (model.ts)**
- Confinamento: tirar "trato diário/leitura de cocho" do Web e deixar "Mapa de confinamento, dietas, batidas, pesagem e sanitário". O trato fica como "pelo app Operação (em teste)", se confirmado.
- Plantação: "Rastreabilidade" → **"Rastreabilidade com página pública para o seu comprador"**.
- Estoque: acrescentar "e a balança registra a pesagem do caminhão direto no sistema".

**Nova faixa curta "Diferenciais"** (entre o Bento e Edições, 4 itens com prova)
1. Rastreio público do produto.
2. Balança → NF-e.
3. Cotação pelo fornecedor via WhatsApp.
4. Custo e margem por lote (COE, COT e margem operacional por lote e talhão). Substitui o Programa ABC Corte, que não sai na v1.

**Edições**
- Cerne Web: "O ERP completo…" → **"Disponível hoje no navegador: 11 módulos, 115 relatórios, fiscal e financeiro integrados. Instalável como app."**

**Confiança**
- Remover a nota interna.
- Usar uma prova de produto enquanto não há depoimentos:
  - "Multi-fazenda e multi-empresa";
  - "Permissões por ação e aprovação de compras";
  - "Histórico de cada alteração (logs)";
  - "Exporta para o seu contador (Domínio)".
- H2 sugerido: **"Controle de quem faz o quê, em cada fazenda."**

**FAQ: perguntas novas**
- "Emite nota fiscal?" → sim: NF-e, CT-e, MDF-e e LCDPR.
- "Meu contador usa Domínio, integra?" → exportação de bancário, folha, pagar/receber e NFS-e.
- "Tenho mais de uma fazenda/CNPJ?" → multi-fazenda e multi-empresa.
- "Funciona no celular?" → web instalável; apps de campo em teste.

## 4. Decisões para validar com produto/comercial antes de editar
1. O trato diário e a leitura de cocho existem no **app Operação**? Se não, sai de toda a LP.
2. O que é "lançamento" se o Web já está disponível (CTA "acesso antecipado" vs "agendar demonstração")?
3. Os números 115 relatórios, 10 painéis e 3 idiomas podem ser publicados? Confirmar os itens com placeholder. (Eram 11 painéis; caiu para 10 porque o painel do Programa ABC Corte não sai na v1.)
4. A emissão fiscal está em produção para clientes (certificado A1, SEFAZ)?
5. O rastreio público e a balança estão liberados comercialmente?

## Execução (aplicada na branch `copy/produto-real`)
0. Criar a branch `copy/produto-real` a partir de `main` e fazer todo o trabalho nela, com commit ao final. Push e PR só se pedido.
   Defaults para as decisões do §4 até haver validação:
   - (1) trato e cocho ficam só como app Operação (em teste) e saem das afirmações do Web;
   - (2) mantém "acesso antecipado" e reforça "Agendar demonstração" para o Web já disponível;
   - (3) números publicados como "115 relatórios" e "10 painéis";
   - (4) e (5) fiscal, rastreio e balança são afirmados como funcionalidades do Web.
1. Salvar esta análise em `workbench/docs/15-copy-vs-produto.md`, seguindo a numeração atual dos docs.
2. Aplicar a copy aprovada:
   - `index.html` (meta + OG);
   - `src/components/Hero.tsx` (lead + linha de prova);
   - `src/components/GroundSection.tsx` (cards/fatos);
   - `src/components/Sections.tsx` (Trailer, bento, Edições, Confiança, FAQ, `data-interest` do GB Twin);
   - `src/figures/fazenda/model.ts` (setores).
   - Os itens dependentes do §4 entram só se forem confirmados.
3. Verificação:
   - `npm run build`;
   - `preview_start` da LP e leitura das seções com `read_page`;
   - screenshots desktop e mobile (390) para checar se os textos maiores quebram layout (bento de 8 cards, linha de prova do Hero);
   - QA com `workbench/tools/page.mjs`.
