# TASK-0049E — Avatar HD Full Pack — Batch 4

ID: TASK-0049E
STATUS: DONE
OUTCOME: BATCH_4_COMPLETE
VISUAL_STATUS: HUMAN_VISUAL_APPROVED
PRIORITY: P2 Normal
OBJECTIVE: Gerar somente os próximos oito PENDING_HD em ordem oficial, usando a receita aprovada por identidade.
SCOPE: seleção/controles próprios, geração nativa, Geometry Lock, evidências/review DEV, fila/receipts/docs/memória, checks proporcionais.
OUT_OF_SCOPE: nono asset; aprovação humana automática; runtime/public/produção/bundle/renderer/anchors/IDs/saves; Body-Fit READY/overlays; alterar legados/aprovados; push/deploy/remotos/Vercel/Supabase/migrations/destructive git/instalações.
DEPENDENCIES: pilotos TASK-0048; método TASK-0049R; Batch 1/2/3 HUMAN_VISUAL_APPROVED.
ASSIGNED_AGENT: principal assume Frontend/QA nos limites autorizados, sem subagentes. QA pelo autor, não independente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE, WORKFLOW/RULES/SECURITY/TOKEN_POLICY; perfis Frontend/QA; fila/receipts; receita e helpers Batch 3; auditor Geometry Lock; skill imagegen.
SECURITY_CONSIDERATIONS: assets locais e review estático; nenhum secret/auth/dado remoto/dependência/config/permissão alterado. Security adicional N/A sem novos gatilhos.
ACCEPTANCE_CRITERIA:
- BATCH_4_SELECTION: exatamente primeiros oito PENDING_HD, sem pular ou regenerar aprovados.
- Legado individual + próprio guia nearest 2× + própria silhueta QA; referências e coordenadas somente da identidade selecionada.
- Prompt lock: mesma identidade/rosto/cabelo/pose/corpo/pés/cabeça/silhueta/roupa/enquadramento, sem zoom/crop/câmera/reinterpretação/reposicionamento; corpo inteiro e transparência.
- PNG nativo 1024×1536 alpha real, final byte-exato; nenhuma transformação corretiva ou manipulação de alpha.
- Geometry Lock 13/13 pelo contorno alpha ≥128, mesmas tolerâncias; alpha >0 diagnóstico.
- Máximo três tentativas por asset, parar no primeiro PASS. Duas falhas quase iguais → BLOCKED_PATTERN_FOR_ASSET; terceira exige mudança concreta. Dois assets com padrão bloqueado → interromper imediatamente, BATCH_4_BLOCKED_PATTERN.
- Precheck qualitativo de gênero/rosto/cabelo/corpo/mãos/pernas/transparência/artefatos, sem aceite humano; finais PASS VISUAL_REVIEW_PENDING.
- Evidências de todas as tentativas e cinco arquivos esperados por gerado; review dos oito, estados honestos em eventual interrupção.
- Somente DEV/review local; produção/fallback legado. Body-Fit/anchors intactos, sem READY.
- Preservação por hash: 163 mídias legadas, dois pilotos, TASK-0049R, Batch 1/2/3 e fontes/runtime/renderer/anchors/IDs/saves.
TEST_PLAN: geometry unit; asset/queue/batch validator; review lab seis viewports; lint dos helpers. Typecheck/build N/A sem TS/runtime alterado. Sem suite global pesada.
DEFINITION_OF_DONE: resultado técnico COMPLETE/PARTIAL/BLOCKED honesto, checks/evidências reais, fila/docs/memória atualizadas. Aceite humano separado e TASK-0049 não DONE.

## Autorização

Solicitação TASK-0049E autoriza somente estas oito identidades, QA em build/task-0049-batch-4 e documentação em docs/architecture/task-0049-batch-4. Nenhuma integração, geração posterior, Body-Fit ou operação remota. imagegen built-in, sem CLI alternativo ou seed/máscara dura expostos.

## SELF VALIDATE / QA / ACCEPTANCE — histórico técnico

2026-10-07T18:01:46.704Z: BATCH_4_TECHNICALLY_COMPLETE / VISUAL_REVIEW_PENDING. IDs: female_curly_blue_light, female_curly_blue_medium, male_short_blue_light, male_short_blue_dark, male_short_blue_medium, male_short_ochre_medium, male_short_ochre_light, male_short_ochre_dark. Tentativas 2/2/1/2/2/1/1/2; 13 gerações, 5 rejeições preservadas, oito finais 13/13. Sem BLOCKED_PATTERN/nono asset. 19 HUMAN_VISUAL_APPROVED, oito VISUAL_REVIEW_PENDING, 25 PENDING_HD. Somente review DEV local, produção/fallback legado e Body-Fit sem READY. TASK-0049 incompleta. Carlos deve revisar individualmente; Batch 5 exige nova instrução. Relatório docs/architecture/TASK-0049E-BATCH-4-REPORT.md; receipts docs/architecture/task-0049-batch-4/TECHNICAL-RECEIPTS.json; review build/task-0049-batch-4/review/index.html.

Unit 5/5, assets 13/13, fila/batch PASS, lab seis viewports PASS, lint sete helpers PASS. 471 hashes e 44 itens não selecionados intactos. Typecheck/build N/A sem runtime/TS alterado. QA pelo autor, não independente; Security adicional N/A. Precheck qualitativo e tonalidades documentados sem aceite humano. Aceite técnico PASS; humano PENDING.

## Aprovação humana / aceite final

Carlos Faustino aprovou explicitamente os oito candidatos e dez critérios, incluindo tonalidade/iluminação em relação ao legado. Registro real 2026-10-07T20:43:31.593Z; oito hashes vinculados em docs/architecture/task-0049-batch-4/HUMAN-VISUAL-APPROVAL.json e receipts individuais. BATCH_4_COMPLETE / HUMAN_VISUAL_APPROVED. Fila: 27 HUMAN_VISUAL_APPROVED, zero VISUAL_REVIEW_PENDING, 25 PENDING_HD. Produção/fallback legado, somente review DEV, Body-Fit sem READY. TASK-0049 continua VALIDATING, incompleta. Batch 5 exige nova instrução. Zero gerações nesta confirmação; sem push/deploy/remotos.

- Aceite técnico e humano PASS; oito candidatos aprovados, sem alterar PNGs, medidas ou tolerâncias. Evidência anterior preservada: tentativas 2/2/1/2/2/1/1/2, 13 gerações e cinco rejeições.
- Conferência de receipts/status, oito hashes, todos os PNGs do lote, 471 arquivos protegidos e 44 itens não selecionados. QA documental pelo autor, não independente. Security adicional N/A. Suites anteriores mantidas; lint/typecheck/build N/A sem alteração de código funcional.
- TASK-0049E DONE, contrato movido sem duplicação. Relatório docs/architecture/TASK-0049E-BATCH-4-REPORT.md; verificação build/task-0049-batch-4/human-approval-verification.json.
