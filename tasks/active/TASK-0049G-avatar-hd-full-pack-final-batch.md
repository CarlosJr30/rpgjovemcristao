# TASK-0049G — Avatar HD Full Pack — Final Batch

ID: TASK-0049G
STATUS: REWORK
OUTCOME: FINAL_BATCH_BLOCKED_PATTERN
VISUAL_STATUS: HUMAN_VISUAL_APPROVED (14 valid candidates)
BLOCKED_ASSETS: female_short_ochre_dark
NOT_GENERATED: female_short_moss_light, female_short_moss_dark
PRIORITY: P2 Normal
OBJECTIVE: Gerar somente todos os17 PENDING_HD atuais, preservando identidade/geometria e aprovados anteriores.
SCOPE: seleção final, controles próprios, geração nativa, auditoria e evidências/review DEV, fila/receipts/docs/memória e checks afetados.
OUT_OF_SCOPE: qualquer identidade fora dos17; regenerar aprovados; aceite humano automático; jogo normal/public/runtime/produção/bundle; Body-Fit/manifests/anchors/overlays; IDs/saves; push/deploy/Vercel/Supabase/migrations/destructive git/instalação.
DEPENDENCIES: pilotos TASK-0048; método TASK-0049R; Batches1–5 HUMAN_VISUAL_APPROVED.
ASSIGNED_AGENT: principal assume Frontend/QA no escopo autorizado; sem subagentes. QA pelo autor, não independente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE, WORKFLOW/ORCHESTRATOR/RULES/SECURITY/TOKEN_POLICY; perfis Frontend/QA; fila, receita/helpers anteriores e auditor; skill imagegen.
SECURITY_CONSIDERATIONS: assets locais e review estático; sem secrets/auth/dependências/permissões/dados remotos. Security adicional N/A sem novo gatilho.
ACCEPTANCE_CRITERIA:
- Exatamente17 PENDING_HD atuais; parar antes de geração se divergência. FINAL_BATCH_SELECTION com id/gender/face/hair/legacyPath/hdPath/queuePosition, ordem oficial.
- Original individual + próprio guia nearest2x + própria silhueta; nenhuma referência/coordenada herdada. Mesmo personagem com maior definição.
- Prompt lock: mesma pose/corpo/pés/cabeça/silhueta/enquadramento/identidade/rosto/cabelo/roupa; família tonal de pele/cabelo e relação de iluminação do legado; sem zoom/crop/câmera/reposicionamento; full body/alpha real.
- PNG nativo1024x1536 byte-exato da geração; nenhuma transformação/manipulação corretiva.
- Gate alpha>=128:13 métricas, pés/base±4, centros/centroides±4, topo/hairTop/laterais±6, largura/maxrow±12, altura±10. Alpha>0 somente diagnóstico.
- Máximo3 tentativas, parar primeiro PASS. Duas falhas quase iguais: BLOCKED_PATTERN_FOR_ASSET; insistência exige mudança concreta. Dois assets com ocorrência: interromper todos os restantes, FINAL_BATCH_BLOCKED_PATTERN. Falha isolada permite continuar sem segundo padrão bloqueado.
- Precheck qualitativo gênero/rosto/cabelo/corpo/mãos/pernas/alpha/tonalidade/artefatos; nenhum HUMAN_VISUAL_APPROVED; PASS VISUAL_REVIEW_PENDING.
- Preservar rejeições; cinco evidências por gerado; review dos17 com comparação/overlay/diff/métricas/filtro gênero e estados honestos em parada parcial.
- DEV/review somente; produção e fallback legado, sem bundle novo. Body-Fit integralmente preservado, somente metadata BODY_FIT_REVIEW_PENDING.
- Preservar hashes163 legadas,2 pilotos,R,Batches1–5 e fontes/runtime/renderer/anchors/IDs/saves.
TEST_PLAN: geometry unit; assets/queue/final-batch validator; review lab seis viewports, filtros/teclado/estados; lint helpers. Typecheck/build somente TS/runtime alterado. Sem suite global pesada.
DEFINITION_OF_DONE: resultado técnico COMPLETE/PARTIAL/BLOCKED honesto, evidências/checks e fila/docs/memória atualizados; aceite humano separado. TASK-0049 não DONE até17 Geometry+human review,52+2pilotos contabilizados,fila zero pending,preservação/runtime seguro.

## Autorização vigente

Anexo TASK-0049G autoriza todos e somente os17 restantes. Nenhuma aprovação em nome de Carlos Faustino. FINAL_BATCH_TECHNICALLY_COMPLETE se17PASS; parcial registra bloqueados/pending honestamente. Não ativar produção, não gerar identidades extras. Built-in imagegen sem seed/máscara dura expostos; silhueta é guia visual probabilístico, seguido de auditoria.

## SELF VALIDATE / QA / ACCEPTANCE

2026-10-07T22:00:46.470Z: TASK-0049G FINAL_BATCH_BLOCKED_PATTERN; 17 selecionados, 25 gerações, 11 rejeições preservadas, 14 finais 13/13 VISUAL_REVIEW_PENDING, female_short_ochre_dark BLOCKED_PATTERN_FOR_ASSET (10/13), female_short_moss_light/dark não gerados PENDING_HD. Duas ocorrências cumulativas: long_ochre_light recuperado após terceira com mudança concreta; short_ochre_dark repetiu right/width, mesmo com left adicional. Parada global sem geração posterior. Fila52=35HVA+14VISUAL+1BLOCKED+2PENDING, mais2pilotos fora da fila. DEV/review somente; produção/fallback legado, Body-Fit sem READY. TASK-0049 incompleta/nãoDONE. Relatório docs/architecture/TASK-0049G-FINAL-BATCH-REPORT.md; receipts docs/architecture/task-0049-final-batch/TECHNICAL-RECEIPTS.json; review build/task-0049-final-batch/review/index.html. Retomada exige mudança concreta e nova instrução; Carlos deve revisar14válidos.

Geometry unit5/5, safety unit4/4, assets25/25, fila/trava PASS, lab6/6 e lint9arquivos PASS. 487hashes e35itens fora da seleção intactos. Geometry integral17: INCOMPLETO, não marcarDONE. QA pelo autor, não independente; Security adicional N/A; typecheck/build N/A sem TS/runtime. Precheck qualitativo sem aprovação em nome de Carlos.

## Human Visual Approval — Final Batch Partial

2026-10-07T23:07:36.485Z: Carlos Faustino aprovou explicitamente os14candidatos válidos da TASK-0049G em todos os10critérios, incluindo tonalidade/iluminação. HUMAN_VISUAL_APPROVED vinculado aos14hashes finais. Fila52:49 HUMAN_VISUAL_APPROVED,0 VISUAL_REVIEW_PENDING,2 PENDING_HD,1 BLOCKED_PATTERN_FOR_ASSET. Pilotos2 fora da fila (51aprovados contando pilotos). female_short_ochre_dark permanece bloqueado; female_short_moss_light/dark não gerados. FINAL_BATCH_BLOCKED_PATTERN/REWORK permanece; parcial aprovado não encerra a TASK-0049. DEV-only review, produção/fallback legado, Body-Fit semREADY. Zero novas gerações/correções, sem push/deploy/remotos. Aprovação docs/architecture/task-0049-final-batch/HUMAN-VISUAL-APPROVAL.json.

Aprovação humana completa apenas dos14válidos; aceite geométrico integral do lote permanece incompleto. Revisão documental pelo autor, sem suite global repetida. Métricas, PNGs e três estados excluídos preservados.
