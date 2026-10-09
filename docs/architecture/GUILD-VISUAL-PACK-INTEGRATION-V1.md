# TASK-0044 — Guild Visual Pack Integration V1

## 1–3. Assets físicos, dimensões e hashes

Todos **VALIDATED / HUMAN_APPROVED / INTEGRATED**. Leitura real por Sharp: extensão/formato coincidentes, dimensões exatas, decode completo failOn=warning e stats PASS; três PNG com alpha não opaco, três WebP opacos. Bytes originais não editados/convertidos. Evidência: build/task-0044-evidence/physical-validation.json.

| Arquivo | Dimensões | Transparência | SHA-256 |
| --- | --- | --- | --- |
| guild_hall.webp | 1920×1080 | Opaco | b467a75dc1cfbcdefe9b81b0b2f729ab62d1535bf9cd8967a34d154481ff2b9d |
| guild_hall_mobile.webp | 960×1280 | Opaco | b9542d6a5025f3a10f9e81c5717aee808438a80557bc34856cb63b8967e086af |
| guild_banner_neutral.png | 512×768 | Alpha real | 6ae520dfbff59f665bd594fc140561d042e58da4f035023fc7a313825c8c3c54 |
| guild_mission_parchment.png | 768×1024 | Alpha real | 88a57d9cc19b0df3e8de04ccd76217de5aa051fafb7ebe60aaa86ab0d47f4a15 |
| guild_leader_table.webp | 1600×600 | Opaco | 212c13d32b03b5411381d7978cea3686701a9d7c8ab4baa85b1a2b8cb192fcb0 |
| guild_reward_chest.png | 512×512 | Alpha real | bb426e6859540734f689f92b6eb66c96e0bc6ade419a5d94e322ea159e93e897 |

Raiz física: apps/web/public/assets/world/guild. Receipts: reviewedBy Carlos Faustino, author OpenAI image generation via ChatGPT, presentationApproved=true, licenseId=original, licenseSource=Original asset generated for RPG Jovem Cristão. reviewedAt real da execução: 2026-10-06T04:13:54.861Z; aprovação fornecida explicitamente pelo usuário nesta TASK.

## 4. Arquivos de código alterados

Sob apps/web/features/journey:
- components/guild-artwork.tsx (novo); guild-hero.tsx; guild-reward-summary.tsx; guild-content-board.tsx; online-guild-hub.tsx; guild-experience.module.css.
- screens/guild-hub.tsx; data/audiovisualAssets.ts; data/approved-visual-assets.ts; data/guildExperienceAssets.ts.
- guild-visual-pack.test.tsx (novo).

Também scripts/audiovisual-pack.mjs, tests/e2e/guild-experience-v2.spec.ts, docs/architecture/audiovisual-pack-v1.json e audiovisual-pack-approvals.json; este relatório, revisão Security, contrato e memória. Nenhum repository/domínio/filtro/economia/save/Auth/migration/Supabase/Arena/áudio editado.

## 5–6. Uso e composição

| Asset | Uso | Fit / crop |
| --- | --- | --- |
| Salão desktop | GuildHall compartilhado local/online; cena superior emoldura hero | cover, center 35%; área até 740px com fade ao fundo CSS |
| Salão mobile | source do picture até 760px | cover, center 25%; área 700px, arquivo desktop não solicitado no teste mobile |
| Banner | Ao lado do nome no GuildHero; sem cobrir texto | contain, 80×120 desktop / 44×66 mobile; não é botão; inicial CSS retorna em erro |
| Pergaminho | Camada decorativa de cards de conteúdo local e MissionCard online | cover central, opacidade 0,14, clipped pelo próprio card; HTML independente |
| Mesa do líder | Faixa local antes da fila e fundo contextual do hero de gestão online | cover center 55%; 130px local, opacidade 0,22 no hero online |
| Baú | Recompensa aprovada, cards especiais épicos/extraordinários ou concluídos | contain 76×76, condicionado a chestQuantity>0 e contexto; não aparece no card comum disponível |

Padding inicial da cena 150–240px conserva área de salão visível sem tornar o fundo dominante. Sem blur/saturação artificial ou edição dos arquivos. Cards/hero conservam superfícies legíveis. Texto/status/foco continuam HTML; imagens decorativas alt vazio e pointer-events none. Reduced motion anterior preservado; não foi adicionada animação obrigatória.

GuildArtwork usa next/image com dimensões intrínsecas e unoptimized para manter bytes/formato aprovados sem derivar versões; lazy loading nas decorações. GuildHall usa picture responsivo nativo, alta prioridade para a cena atual. Total entregue aproximadamente 3,27 MiB, cacheável; sem recursos Guilda em rota não Guilda no E2E. Falha individual remove decoração; falha do salão devolve CSS e padding anteriores, sem retry ou bloqueio de ações.

## 7–9. Pipeline, auditor e escrita

VisualSlot ampliado somente para cinco bindings Guilda; salão inclui mobileSrc, logo seis arquivos físicos. Manifesto/receipts completos; inventário da TASK-0043 atualizado para VALIDATED.

- `node scripts/audiovisual-pack.mjs --visual-only --write`: **PASS / exit 0**, 12 visuais VALIDATED (seis Arena preservados + seis Guilda), três portais antigos MISSING. Somente catálogo visual escrito; nenhum catálogo/receipt de áudio reclassificado.
- `node scripts/audiovisual-pack.mjs`: **exit 1** esperado por oito áudios Suno Free rejeitados pela licença de produção. Doze visuais VALIDATED, demais assets não entregues MISSING. Auditor global não é apresentado como PASS.
- Flag visual-only usa o mesmo auditPack, os mesmos gates físicos/hash/licença/revisão e toda a categoria visual. Não relaxa allowlist nem omite reprovação visual. Escrita global não executada; --write visual não modifica APPROVED_MUSIC/EFFECTS.

Evidências: visual-audit.json/log e global-audit.json/log em build/task-0044-evidence. Suno Free da Arena permanece exclusivamente protótipo não comercial; lançamento comercial bloqueado conforme TASK-0042.

## 10–14. Checks finais

| Check | Resultado |
| --- | --- |
| Unit | 7 arquivos / **26 PASS** |
| E2E Guilda | **14 PASS**: 12 regressão/integração + 2 nomes longos/carregamento fora da Guilda |
| Lint | **PASS**, zero avisos |
| Typecheck | **PASS** |
| Build | **PASS**, 20 rotas |

Unit: imagem responsiva/fallback preserva conteúdo, falha decorativa, baú condicionado, auditor real e receipt revogada bloqueada; Guilda online/filtros/relógio/hero/pipeline/PackArtwork existentes. E2E: source/naturalWidth/object-fit, mobile sem desktop, banner/cards/mesa/baú, falha total de imagens com envio/aprovação, teclado/reduced motion, filtros/publicação/recompensa uma vez/histórico/reload.

## 15. Capturas e QA visual

390×844, 412×915, 844×390, 915×412, 1440×900, 1920×1080. Capturas Player/Leader em todos; aprovação e fallback desktop/mobile; nomes longos 390/1440. Arquivos em build/task-0044-evidence/e2e-final e long-name-e2e. Inspeção visual dos seis tamanhos: composição/crop, contraste, alinhamento, banner/mesa/pergaminho sem bloquear CTA, ausência de overflow e consistência. Sem teste físico Safari/iOS ou sessão online autenticada; E2E usa Guilda local e storage isolado, online validado por unit mockado.

## 16. REWORK e correções

Lint inicial apontou img decorativo direto e aria-hidden indevido no picture. Corrigidos com next/image e alt vazio; sem desativar regra. Teste unit ajustado para comparar pathname real porque next/image normaliza URL em jsdom. Rodadas falhas não contadas PASS. Não foi encontrado bug de domínio, não houve correção de economia/workflow.

## 17–18. Pendências e status

**DONE para integração/aceite técnico local.** Sem pendência bloqueante dos seis visuais. Revisão humana da composição final é opcional; aprovação dos assets já foi fornecida. Validação remota anterior da Guilda/Supabase e bloqueio comercial do áudio Suno Free continuam fora do escopo e não foram resolvidos por esta integração. Não houve push/deploy/publicação/install/geração de mídia.

QA/Security pelo próprio autor, não independentes. Baseline/preservação em build/task-0044-evidence; originais e mudanças prévias preservados. Contrato único em tasks/completed/TASK-0044-guild-visual-pack-integration-v1.md.
