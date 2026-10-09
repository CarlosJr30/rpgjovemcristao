# TASK-0049F — Avatar HD Full Pack — Batch 5

ID: TASK-0049F
STATUS: DONE
OUTCOME: BATCH_5_COMPLETE
VISUAL_STATUS: HUMAN_VISUAL_APPROVED
PRIORITY: P2 Normal
OBJECTIVE: Gerar somente os próximos oito PENDING_HD em ordem oficial, usando a receita aprovada por identidade.
SCOPE: seleção/controles próprios, geração nativa, Geometry Lock, evidências/review DEV, fila/receipts/docs/memória, checks proporcionais.
OUT_OF_SCOPE: nono asset; aprovação humana automática; runtime/public/produção/bundle/renderer/anchors/IDs/saves; Body-Fit READY/overlays; alterar legados/aprovados; push/deploy/remotos/Vercel/Supabase/migrations/destructive git/instalações.
DEPENDENCIES: pilotos TASK-0048; método TASK-0049R; Batch 1/2/3/4 HUMAN_VISUAL_APPROVED.
ASSIGNED_AGENT: principal assume Frontend/QA nos limites autorizados, sem subagentes. QA pelo autor, não independente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE, WORKFLOW/RULES/SECURITY/TOKEN_POLICY; perfis Frontend/QA; fila/receipts; receita e helpers Batch 3; auditor Geometry Lock; skill imagegen.
SECURITY_CONSIDERATIONS: assets locais e review estático; nenhum secret/auth/dado remoto/dependência/config/permissão alterado. Security adicional N/A sem novos gatilhos.
ACCEPTANCE_CRITERIA:
- BATCH_5_SELECTION: exatamente primeiros oito PENDING_HD, sem pular ou regenerar aprovados.
- Legado individual + próprio guia nearest 2× + própria silhueta QA; referências e coordenadas somente da identidade selecionada.
- Prompt lock: preservar família tonal de pele/cabelo e relação de iluminação do legado; mesma identidade/rosto/cabelo/pose/corpo/pés/cabeça/silhueta/roupa/enquadramento, sem zoom/crop/câmera/reinterpretação/reposicionamento; corpo inteiro e transparência.
- PNG nativo 1024×1536 alpha real, final byte-exato; nenhuma transformação corretiva ou manipulação de alpha.
- Geometry Lock 13/13 pelo contorno alpha ≥128, mesmas tolerâncias; alpha >0 diagnóstico.
- Máximo três tentativas por asset, parar no primeiro PASS. Duas falhas quase iguais → BLOCKED_PATTERN_FOR_ASSET; terceira exige mudança concreta. Dois assets com padrão bloqueado → interromper imediatamente, BATCH_5_BLOCKED_PATTERN.
- Precheck qualitativo de gênero/rosto/cabelo/tonalidade coerente com legado/corpo/mãos/pernas/transparência/artefatos, sem aceite humano; finais PASS VISUAL_REVIEW_PENDING.
- Evidências de todas as tentativas e cinco arquivos esperados por gerado; review dos oito, estados honestos em eventual interrupção.
- Somente DEV/review local; produção/fallback legado. Body-Fit/anchors intactos, sem READY.
- Preservação por hash: 163 mídias legadas, dois pilotos, TASK-0049R, Batch 1/2/3/4 e fontes/runtime/renderer/anchors/IDs/saves.
TEST_PLAN: geometry unit; asset/queue/batch validator; review lab seis viewports; lint dos helpers. Typecheck/build N/A sem TS/runtime alterado. Sem suite global pesada.
DEFINITION_OF_DONE: resultado técnico COMPLETE/PARTIAL/BLOCKED honesto, checks/evidências reais, fila/docs/memória atualizadas. Aceite humano separado e TASK-0049 não DONE.

## Autorização

Solicitação TASK-0049F autoriza somente estas oito identidades, QA em build/task-0049-batch-5 e documentação em docs/architecture/task-0049-batch-5. Nenhuma integração, geração posterior, Body-Fit ou operação remota. imagegen built-in, sem CLI alternativo ou seed/máscara dura expostos.


## Contrato vigente / Batch 5

Autorização explícita no anexo TASK-0049F. Selecionar primeiros oito dos 25 PENDING_HD, sem regenerar 27 aprovados. Preservar 163 legadas, dois pilotos, R e Batches 1–4. Máximo três tentativas, parar no primeiro PASS; duas ocorrências de BLOCKED_PATTERN_FOR_ASSET interrompem o lote imediatamente. Body-Fit/manifests/anchors intactos. Resultado técnico BATCH_5_TECHNICALLY_COMPLETE/PARTIAL/BLOCKED_PATTERN, aceite humano separado. Não gerar Batch 6. Sem subagentes; perfis Frontend/QA assumidos pelo autor.

## SELF VALIDATE / QA / ACCEPTANCE — histórico técnico

2026-10-07T21:07:02.671Z: BATCH_5_TECHNICALLY_COMPLETE / VISUAL_REVIEW_PENDING. IDs: male_short_moss_light, male_short_moss_dark, female_curly_ochre_dark, female_curly_moss_medium, female_curly_moss_light, female_curly_moss_dark, female_curly_ochre_medium, female_curly_ochre_light. Tentativas 1/2/2/2/1/2/1/2; 13 gerações, 5 rejeições preservadas, oito finais 13/13. Sem BLOCKED_PATTERN/nono asset. 27 HUMAN_VISUAL_APPROVED, oito VISUAL_REVIEW_PENDING, 17 PENDING_HD. Somente review DEV local, produção/fallback legado e Body-Fit sem READY. TASK-0049 incompleta. Carlos deve revisar individualmente; Batch 6 exige nova instrução. Relatório docs/architecture/TASK-0049F-BATCH-5-REPORT.md; receipts docs/architecture/task-0049-batch-5/TECHNICAL-RECEIPTS.json; review build/task-0049-batch-5/review/index.html.

Unit 5/5, assets 13/13, fila/batch PASS, lab seis viewports PASS, lint sete helpers PASS. 479 hashes e 44 itens não selecionados intactos. Typecheck/build N/A sem runtime/TS alterado. QA pelo autor, não independente; Security adicional N/A. Precheck qualitativo e tonalidades documentados sem aceite humano. Aceite técnico PASS; humano PENDING.

## Aprovação humana / aceite final

Carlos Faustino aprovou explicitamente os oito candidatos e os dez critérios, incluindo tonalidade/iluminação e aparência geral em relação ao legado. Registro real 2026-10-07T21:12:12.525Z; oito hashes vinculados em docs/architecture/task-0049-batch-5/HUMAN-VISUAL-APPROVAL.json e receipts individuais. BATCH_5_COMPLETE / HUMAN_VISUAL_APPROVED. Fila: 35 HUMAN_VISUAL_APPROVED, zero VISUAL_REVIEW_PENDING, 17 PENDING_HD. Produção/fallback legado, somente review DEV, Body-Fit sem READY. TASK-0049 continua VALIDATING, incompleta. Batch 6 exige nova instrução. Zero gerações nesta confirmação; sem push/deploy/remotos.

- Aceite técnico e humano PASS. Evidência anterior preservada: tentativas 1/2/2/2/1/2/1/2, 13 gerações, cinco rejeições, oito finais 13/13. Nenhum PNG, medida ou tolerância alterado.
- Conferência de receipts/status, oito hashes finais, todos os PNGs do lote, 479 arquivos protegidos e 44 itens não selecionados. QA documental pelo autor, não independente; Security adicional N/A. Suites anteriores mantidas; lint/typecheck/build N/A sem alteração de código funcional.
- TASK-0049F DONE, contrato movido sem duplicação. Relatório docs/architecture/TASK-0049F-BATCH-5-REPORT.md; verificação build/task-0049-batch-5/human-approval-verification.json.
