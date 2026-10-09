# TASK-0049B — Avatar HD Full Pack — Batch 1

**BATCH_1_COMPLETE / HUMAN_VISUAL_APPROVED.** Validação técnica concluída em 2026-10-07T13:59:38.475Z: quatro identidades geradas em seis tentativas, todas com candidato final 13/13 PASS. Carlos Faustino aprovou explicitamente os quatro candidatos finais. O timestamp real do registro humano e os hashes aprovados constam em [HUMAN-VISUAL-APPROVAL.json](task-0049-batch-1/HUMAN-VISUAL-APPROVAL.json). Nenhuma nova geração nesta confirmação. TASK-0049B DONE; TASK-0049 continua incompleta, com 47 PENDING_HD aguardando futura instrução de lote.

## 1. Seleção oficial

[BATCH_1_SELECTION](task-0049-batch-1/BATCH_1_SELECTION.json): próximos quatro PENDING_HD, sem pular, excluindo pilotos e male_curly_blue_light.

- male_curly_blue_dark: gênero male; rosto precomposed; legacy face IDs 1/2/3 preserved, not independently selectable; cabelo curly; legado `/assets/avatar/runtime/male/male_curly_blue_dark.png`; hdPath planejado `/assets/avatar/hd/male/male_curly_blue_dark_hd.png` (não publicado).
- male_curly_blue_medium: gênero male; rosto precomposed; legacy face IDs 1/2/3 preserved, not independently selectable; cabelo curly; legado `/assets/avatar/runtime/male/male_curly_blue_medium.png`; hdPath planejado `/assets/avatar/hd/male/male_curly_blue_medium_hd.png` (não publicado).
- male_curly_moss_dark: gênero male; rosto precomposed; legacy face IDs 1/2/3 preserved, not independently selectable; cabelo curly; legado `/assets/avatar/runtime/male/male_curly_moss_dark.png`; hdPath planejado `/assets/avatar/hd/male/male_curly_moss_dark_hd.png` (não publicado).
- male_long_blue_light: gênero male; rosto precomposed; legacy face IDs 1/2/3 preserved, not independently selectable; cabelo long; legado `/assets/avatar/runtime/male/male_long_blue_light.png`; hdPath planejado `/assets/avatar/hd/male/male_long_blue_light_hd.png` (não publicado).

## 2–3. Tentativas e Geometry Lock

| Asset | Tentativas | Medidas por tentativa | Candidato final |
|---|---:|---|---|
| male_curly_blue_dark | 1 | 1: 13/13 | GEOMETRY_PASS / HUMAN_VISUAL_APPROVED |
| male_curly_blue_medium | 1 | 1: 13/13 | GEOMETRY_PASS / HUMAN_VISUAL_APPROVED |
| male_curly_moss_dark | 2 | 1: 12/13; 2: 13/13 | GEOMETRY_PASS / HUMAN_VISUAL_APPROVED |
| male_long_blue_light | 2 | 1: 9/13; 2: 13/13 | GEOMETRY_PASS / HUMAN_VISUAL_APPROVED |

Alpha ≥128 é o gate; alpha >0 é apenas diagnóstico e seus FAIL continuam nas evidências. Treze tolerâncias herdadas do auditor TASK-0048, sem relaxamento. Long hair possui topo 14 / centro Y 764, derivados de seu próprio legado; curly possui 6 / 760. Centroides também derivados individualmente.

## 4. Falhas e correções

- male_curly_moss_dark, tentativa 1: right +8 px (±6). Corrigido na tentativa 2 por reforço do contorno original no prompt, sem transformar o PNG.
- male_long_blue_light, tentativa 1: right +15 px (±6); width +20 px (±12); centerX +5 px (±4); maxSilhouetteWidth +19 px (±12). Corrigido na tentativa 2 por reforço do contorno original no prompt, sem transformar o PNG.

Falhas não repetiram o mesmo padrão em segunda tentativa; os dois candidatos corrigidos passaram. Geração encerrada individualmente no PASS.

## 5. Deltas completos de cada tentativa

### male_curly_blue_dark

Tentativa 1: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta | Tolerância | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 170 | -2 | ±6 | PASS |
| right | 932 | 937 | 5 | ±6 | PASS |
| top | 6 | 5 | -1 | ±6 | PASS |
| bottom | 1514 | 1516 | 2 | ±4 | PASS |
| width | 760 | 767 | 7 | ±12 | PASS |
| height | 1508 | 1511 | 3 | ±10 | PASS |
| centerX | 552 | 553.5 | 1.5 | ±4 | PASS |
| centerY | 760 | 760.5 | 0.5 | ±4 | PASS |
| feetBaseline | 1514 | 1516 | 2 | ±4 | PASS |
| hairTop | 6 | 5 | -1 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 766 | 8 | ±12 | PASS |
| alphaCentroidX | 527.5753 | 528.9976 | 1.4223 | ±4 | PASS |
| alphaCentroidY | 777.7582 | 779.3853 | 1.6271 | ±4 | PASS |

### male_curly_blue_medium

Tentativa 1: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta | Tolerância | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 171 | -1 | ±6 | PASS |
| right | 932 | 937 | 5 | ±6 | PASS |
| top | 6 | 5 | -1 | ±6 | PASS |
| bottom | 1514 | 1515 | 1 | ±4 | PASS |
| width | 760 | 766 | 6 | ±12 | PASS |
| height | 1508 | 1510 | 2 | ±10 | PASS |
| centerX | 552 | 554 | 2 | ±4 | PASS |
| centerY | 760 | 760 | 0 | ±4 | PASS |
| feetBaseline | 1514 | 1515 | 1 | ±4 | PASS |
| hairTop | 6 | 5 | -1 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 764 | 6 | ±12 | PASS |
| alphaCentroidX | 527.5753 | 528.6272 | 1.0519 | ±4 | PASS |
| alphaCentroidY | 777.7582 | 778.4605 | 0.7023 | ±4 | PASS |

### male_curly_moss_dark

Tentativa 1: REJECTED_GEOMETRY.

| Métrica | Esperado HD | Medido HD | Delta | Tolerância | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 169 | -3 | ±6 | PASS |
| right | 932 | 940 | 8 | ±6 | FAIL |
| top | 6 | 5 | -1 | ±6 | PASS |
| bottom | 1514 | 1513 | -1 | ±4 | PASS |
| width | 760 | 771 | 11 | ±12 | PASS |
| height | 1508 | 1508 | 0 | ±10 | PASS |
| centerX | 552 | 554.5 | 2.5 | ±4 | PASS |
| centerY | 760 | 759 | -1 | ±4 | PASS |
| feetBaseline | 1514 | 1513 | -1 | ±4 | PASS |
| hairTop | 6 | 5 | -1 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 769 | 11 | ±12 | PASS |
| alphaCentroidX | 527.5753 | 528.911 | 1.3357 | ±4 | PASS |
| alphaCentroidY | 777.7582 | 777.8561 | 0.0979 | ±4 | PASS |

Tentativa 2: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta | Tolerância | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 170 | -2 | ±6 | PASS |
| right | 932 | 933 | 1 | ±6 | PASS |
| top | 6 | 5 | -1 | ±6 | PASS |
| bottom | 1514 | 1513 | -1 | ±4 | PASS |
| width | 760 | 763 | 3 | ±12 | PASS |
| height | 1508 | 1508 | 0 | ±10 | PASS |
| centerX | 552 | 551.5 | -0.5 | ±4 | PASS |
| centerY | 760 | 759 | -1 | ±4 | PASS |
| feetBaseline | 1514 | 1513 | -1 | ±4 | PASS |
| hairTop | 6 | 5 | -1 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 760 | 2 | ±12 | PASS |
| alphaCentroidX | 527.5753 | 527.7123 | 0.137 | ±4 | PASS |
| alphaCentroidY | 777.7582 | 777.5023 | -0.2559 | ±4 | PASS |

### male_long_blue_light

Tentativa 1: REJECTED_GEOMETRY.

| Métrica | Esperado HD | Medido HD | Delta | Tolerância | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 167 | -5 | ±6 | PASS |
| right | 932 | 947 | 15 | ±6 | FAIL |
| top | 14 | 13 | -1 | ±6 | PASS |
| bottom | 1514 | 1511 | -3 | ±4 | PASS |
| width | 760 | 780 | 20 | ±12 | FAIL |
| height | 1500 | 1498 | -2 | ±10 | PASS |
| centerX | 552 | 557 | 5 | ±4 | FAIL |
| centerY | 764 | 762 | -2 | ±4 | PASS |
| feetBaseline | 1514 | 1511 | -3 | ±4 | PASS |
| hairTop | 14 | 13 | -1 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 777 | 19 | ±12 | FAIL |
| alphaCentroidX | 527.5231 | 529.1891 | 1.666 | ±4 | PASS |
| alphaCentroidY | 771.4205 | 770.6593 | -0.7612 | ±4 | PASS |

Tentativa 2: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta | Tolerância | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 169 | -3 | ±6 | PASS |
| right | 932 | 935 | 3 | ±6 | PASS |
| top | 14 | 13 | -1 | ±6 | PASS |
| bottom | 1514 | 1514 | 0 | ±4 | PASS |
| width | 760 | 766 | 6 | ±12 | PASS |
| height | 1500 | 1501 | 1 | ±10 | PASS |
| centerX | 552 | 552 | 0 | ±4 | PASS |
| centerY | 764 | 763.5 | -0.5 | ±4 | PASS |
| feetBaseline | 1514 | 1514 | 0 | ±4 | PASS |
| hairTop | 14 | 13 | -1 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 764 | 6 | ±12 | PASS |
| alphaCentroidX | 527.5231 | 528.5084 | 0.9852 | ±4 | PASS |
| alphaCentroidY | 771.4205 | 770.9102 | -0.5104 | ±4 | PASS |

## 6–8. Hashes, dimensões e alpha

- **male_curly_blue_dark**: tentativa 1; SHA-256 `5ff01c5eb2aa68a3fa0ba3c8d3722c21a92861c442a5db4fdc32884e8c9793ae`; 2192022 bytes; 1024×1536 PNG; 917067 pixels alpha 0, 621281 pixels alpha ≥128; alpha máximo 254; hash idêntico à fonte gerada. [PNG](../../build/task-0049-batch-1/male_curly_blue_dark/hd_candidate.png), [métricas](../../build/task-0049-batch-1/male_curly_blue_dark/geometry_metrics.json).
- **male_curly_blue_medium**: tentativa 1; SHA-256 `65d4233a10037109e5dac652e607b87d9a7856d2e30ba8511bd8ff52d2f40758`; 2193003 bytes; 1024×1536 PNG; 921957 pixels alpha 0, 617795 pixels alpha ≥128; alpha máximo 254; hash idêntico à fonte gerada. [PNG](../../build/task-0049-batch-1/male_curly_blue_medium/hd_candidate.png), [métricas](../../build/task-0049-batch-1/male_curly_blue_medium/geometry_metrics.json).
- **male_curly_moss_dark**: tentativa 2; SHA-256 `a414e8d6888aa147c9256a1cec04eac67c444a21d26ba0a09ff848a1feb6fd1c`; 2149056 bytes; 1024×1536 PNG; 925338 pixels alpha 0, 613257 pixels alpha ≥128; alpha máximo 254; hash idêntico à fonte gerada. [PNG](../../build/task-0049-batch-1/male_curly_moss_dark/hd_candidate.png), [métricas](../../build/task-0049-batch-1/male_curly_moss_dark/geometry_metrics.json).
- **male_long_blue_light**: tentativa 2; SHA-256 `d7b69134b6429fe3d305380d39adf2149ff955782afba17cc563f0aded780191`; 2203966 bytes; 1024×1536 PNG; 914770 pixels alpha 0, 622711 pixels alpha ≥128; alpha máximo 254; hash idêntico à fonte gerada. [PNG](../../build/task-0049-batch-1/male_long_blue_light/hd_candidate.png), [métricas](../../build/task-0049-batch-1/male_long_blue_light/geometry_metrics.json).

Todos os seis PNGs têm assinatura válida, transparência real e dimensões nativas 1024×1536. Alpha máximo 254 não foi normalizado para 255. Bytes finais foram copiados exatamente da ferramenta; não houve resize, upscale simples, stretch, warp, crop, offset ou cópia de alpha para forçar aceite. Rejeitados e hashes também constam em attempts.json e validation.json.

## 9. Status visual

Os quatro candidatos finais: GEOMETRY_PASS / HUMAN_VISUAL_APPROVED, approved=true somente no escopo visual e DEV-only. Carlos Faustino aprovou explicitamente identidade visual, rosto, cabelo, pose, silhueta, proporções, linha dos pés, enquadramento e aparência geral em relação ao legado. Receipts individuais em task-0049-batch-1/receipts/{assetId}.json e recibo consolidado vinculado acima. Tentativas rejeitadas continuam rejeitadas. O precheck técnico anterior foi realizado pelo agente; o aceite humano veio da confirmação do usuário, sem aprovação automática.

## 10. Evidências

[Review local dos quatro](../../build/task-0049-batch-1/review/index.html), quatro lado a lado em desktop, adaptado a mobile, modos HD/legado/overlay/diff e slider por teclado. Cada pasta build/task-0049-batch-1/{assetId}/ contém legacy_2x.png, hd_candidate.png, overlay_50_50.png, silhouette_difference.png e geometry_metrics.json. Cada attempt-n conserva a tentativa original. Prévia candidate_on_light_QA_ONLY.png e controles 2×/silhueta são somente QA. Prompts e referências exatos em build/task-0049-batch-1/prompts/. Ferramenta: imagegen built-in, sem CLI/API alternativo, seed ou máscara dura expostos. Somente referências da própria identidade foram fornecidas.

## 11. Runtime DEV

Disponíveis somente na página estática local de revisão e nos metadados da fila: LOCAL_DEV_REVIEW_ONLY. Nenhum novo asset em public, nenhuma edição de catálogo runtime, nenhum candidato integrado ao AvatarRuntime. Fallback e jogo normal continuam com as fontes existentes. Não declarar integração real ao jogo ou HD_READY no renderer.

## 12. Produção

Intacta por hash. Nenhuma ativação HD, alteração de gate, push, deploy, Vercel ou Supabase. hdPath na seleção é o destino planejado, não um arquivo público entregue nesta rodada.

## 13. Body-Fit

Intacto; zero overlay promovido. Somente BODY_FIT_REVIEW_PENDING registrado nos quatro itens da fila.

## 14. Preservação por hash

453 arquivos protegidos intactos: 452 arquivos de apps/web, packages, scripts, tests e tools mais o PNG aprovado male_curly_blue_light da TASK-0049R. Inclui 165 mídias públicas (163 legadas e dois pilotos). Renderer, runtime, anchors, IDs e saves sem alterações. Os 48 itens não selecionados da fila (47 PENDING_HD e o aprovado TASK-0049R) preservados exatamente. Baseline, queue.before e validation.json em build/task-0049-batch-1.

## 15. Testes e QA

- Geometry unit: 5/5 PASS.
- Asset validator: 6/6 PNGs PASS; quatro candidatos finais 13/13 Geometry PASS e duas tentativas rejeitadas mantidas como FAIL.
- Fila/batch validator: PASS, ordem oficial, limites, exclusões, nenhum asset 5, nenhuma geração após PASS, fontes corretas, evidências completas e preservação.
- Lab DEV: 6/6 viewports PASS (390×844, 412×915, 844×390, 915×412, 1440×900, 1920×1080), quatro candidatos, dimensão/ratio 2:3, quatro modos, slider e metrics por teclado, sem overflow de página ou erros JS. Desktop e mobile inspecionados visualmente. Não é E2E de integração ao jogo.
- ESLint dos sete helpers novos: PASS. Typecheck/build N/A: nenhum runtime ou TypeScript alterado; somente helpers JS QA e documentação. Suites globais não executadas.
- QA pelo autor; Security adicional N/A sem gatilhos novos. Comandos/resultados em build/task-0049-batch-1/checks.json.

Nesta confirmação foram alterados apenas documentos e metadados de aprovação. Consistência JSON/status/receipts e preservação dos hashes foram conferidas novamente; medidas e histórico de geração permanecem inalterados. Testes de runtime não foram repetidos. Lint, typecheck e build N/A nesta confirmação, pois nenhum código foi alterado. Evidência: build/task-0049-batch-1/human-approval-verification.json.

## 16. Aprovação humana

Recebida aprovação individual explícita de Carlos Faustino para os quatro candidatos listados, incluindo os nove critérios da seção 9. Não há pendência visual humana do Batch 1. Esta aprovação não autoriza Batch 2, integração ao runtime ou produção, nem promoção Body-Fit para READY.

## 17. Recomendação para Batch 2

Aguardar nova instrução de lote; o aceite visual do Batch 1 já está registrado. Selecionar os próximos PENDING_HD em ordem oficial, manter referência individual e guias, coordenadas próprias e paradas por erro. Não gerar automaticamente os 47 restantes. O controle visual continua probabilístico; PASS deste lote não dispensa validação por asset.

## 18. Estado final

TASK-0049B DONE, resultado BATCH_1_COMPLETE / HUMAN_VISUAL_APPROVED; validação técnica BATCH_1_TECHNICALLY_COMPLETE preservada. TASK-0049 não DONE: cinco candidatos HUMAN_VISUAL_APPROVED na fila (TASK-0049R mais estes quatro), além dos dois pilotos excluídos da fila, e 47 identidades PENDING_HD. Uso DEV-only em evidências locais; produção usando legado; Body-Fit sem READY; Batch 2 aguardando nova instrução. Sem push, deploy ou operações remotas.
