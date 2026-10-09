# TASK-0049B — Avatar HD Full Pack — Batch 1

ID: TASK-0049B
STATUS: DONE
OUTCOME: BATCH_1_COMPLETE
TECHNICAL_STATUS: BATCH_1_TECHNICALLY_COMPLETE
VISUAL_STATUS: HUMAN_VISUAL_APPROVED
PRIORITY: P2 Normal
OBJECTIVE: Gerar somente os quatro próximos PENDING_HD da fila oficial usando o método aprovado na TASK-0049R, sem transformar os PNGs finais.
SCOPE: seleção ordenada, geração nativa de quatro identidades (até três tentativas cada), guias QA individuais, validators e revisão DEV local, fila, documentação e memória.
OUT_OF_SCOPE: quinto asset ou posterior, aprovação humana automática, runtime de produção, Body-Fit, pilotos, candidato aprovado TASK-0049R, mídias legadas, renderer, anchors, IDs, saves, push, deploy, Vercel, Supabase, migrações e instalações.
DEPENDENCIES: TASK-0049R GEOMETRY_METHOD_VALIDATED / HUMAN_VISUAL_APPROVED.
ASSIGNED_AGENT: principal assume Frontend/QA; revisão técnica pelo autor, não independente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE, WORKFLOW/RULES/SECURITY, fila oficial, receita e prompts TASK-0049R, imagegen skill e auditor geométrico existente.
SECURITY_CONSIDERATIONS: arquivos locais e laboratório estático sem dados privados, secrets, serviços remotos ou alteração de permissões. Gate de produção intacto.
ACCEPTANCE_CRITERIA:
- Próximos quatro PENDING_HD sem pular itens; exclusão dos dois pilotos e male_curly_blue_light aprovado.
- PNG nativo 1024×1536 com alpha real, copiado byte a byte; sem resize, crop, stretch, warp, offset ou transplante de alpha final.
- Referências estruturais do próprio legado; coordenadas calculadas individualmente. Pilotos/método aprovados orientam acabamento sem introduzir geometria de outra identidade.
- Geometry Lock 13/13 com alpha ≥128 e tolerâncias existentes; alpha >0 apenas diagnóstico.
- Até três tentativas por identidade, parar no PASS. Duas falhas com padrão semelhante exigem mudança concreta antes de terceira tentativa; caso contrário BLOCKED_PATTERN_FOR_ASSET.
- Dois assets BLOCKED_PATTERN_FOR_ASSET encerram imediatamente o lote: BATCH_BLOCKED_PATTERN.
- Candidatos GEOMETRY_PASS ficam VISUAL_REVIEW_PENDING, nunca HUMAN_VISUAL_APPROVED sem Carlos.
- Evidências completas e review/index.html para os quatro; nenhum asset público novo ou mudança no jogo normal.
- Preservar por hash fontes/runtime, 163 mídias legadas, dois pilotos e candidato aprovado TASK-0049R.
TEST_PLAN: geometry unit, asset validator, fila/batch validator, laboratório DEV nos seis viewports, lint dos helpers novos; typecheck/build N/A se nenhum runtime/TS mudar.
DEFINITION_OF_DONE: lote tecnicamente completo, evidências e checks aplicáveis reais, memória atualizada e revisão humana explícita dos quatro registrada. A confirmação humana atual conclui somente Batch 1; TASK-0049 não fica DONE e Batch 2 não está autorizado.

## Autorização e execução

O usuário autorizou este lote de quatro em 2026-10-07. A aprovação da TASK-0049R não se estende aos novos candidatos. Evidências em build/task-0049-batch-1/{assetId}/; seleção em docs/architecture/task-0049-batch-1/BATCH_1_SELECTION.json. Uso DEV nesta rodada: página estática de revisão local, sem integração ao runtime.

## SELF VALIDATE / QA / ACCEPTANCE

- Quatro selecionados em ordem oficial; tentativas 1, 1, 2, 2; seis PNGs e quatro finais 13/13 Geometry PASS. Duas rejeições preservadas. Nenhum BLOCKED_PATTERN.
- Prompts/refpaths registrados, final byte-exato; nenhuma mídia pública/runtime alterado. Carlos Faustino aprovou explicitamente os quatro candidatos finais: identidade visual, rosto, cabelo, pose, silhueta, proporções, linha dos pés, enquadramento e aparência geral em relação ao legado.
- Unit 5/5, asset 6/6, fila/batch PASS, review DEV 6/6 viewports, ESLint sete helpers PASS. Typecheck/build N/A: sem TS/runtime alterado.
- Preservação 453 hashes PASS; 48 itens não selecionados intactos. QA pelo autor, não independente. Security adicional N/A, sem novo gatilho.
- Critérios técnicos PASS; revisão humana PASS por confirmação explícita do usuário. TASK-0049B DONE / BATCH_1_COMPLETE / HUMAN_VISUAL_APPROVED. TASK-0049 continua incompleta.
- Receipts: docs/architecture/task-0049-batch-1/HUMAN-VISUAL-APPROVAL.json e receipts/{assetId}.json, com reviewer, timestamp real de registro e hash individual.
- Esta confirmação atualiza somente documentação e metadados; zero geração, zero alteração de código/runtime. QA estrutural e consistência pelo autor; preservação por hash reconferida. Testes de geração anteriores não repetidos; lint/typecheck/build N/A nesta confirmação documental. Security adicional N/A, sem novo gatilho.
- DEV-only em evidências/review local; produção usa legado e Body-Fit não recebe READY. Batch 2 exige nova instrução.
- Relatório: docs/architecture/TASK-0049B-BATCH-1-REPORT.md; review build/task-0049-batch-1/review/index.html.
