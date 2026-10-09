# TASK-0049H — Avatar HD Final 3 Rework

ID: TASK-0049H
STATUS: DONE
OUTCOME: FINAL_3_COMPLETE
VISUAL_STATUS: HUMAN_VISUAL_APPROVED
PRIORITY: P2 Normal
OBJECTIVE: Resolver somente female_short_ochre_dark, female_short_moss_light e female_short_moss_dark, nesta ordem.
SCOPE: hipótese de causa, controles próprios, geração PNG nativa, auditoria/evidências/review DEV, fila/receipts/docs/memória e checks afetados.
OUT_OF_SCOPE: qualquer outra identidade; aceite humano automático; jogo normal/public/runtime/produção; Body-Fit/overlays/anchors/manifests; IDs/saves; push/deploy/Vercel/Supabase/migrations/destructive git/instalações.
DEPENDENCIES: TASK-0049G parcial HUMAN_VISUAL_APPROVED,49 aprovados+2pilotos preservados.
ASSIGNED_AGENT: principal assume Frontend/QA no escopo expressamente autorizado; sem subagentes, QA pelo autor e não independente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE, WORKFLOW/ORCHESTRATOR/TOKEN_POLICY/RULES/SECURITY; Frontend/QA; contrato do usuário, fila, G duas rejeições ochre_dark e short aprovados; skill imagegen.
SECURITY_CONSIDERATIONS: somente assets/review local, sem auth/secrets/dependências/permissões/serviços remotos alterados; Security adicional N/A sem gatilho.
ACCEPTANCE_CRITERIA:
- Exatamente três autorizados, na ordem ochre_dark/moss_light/moss_dark; não regenerar aprovados.
- Antes da nova tentativa ochre_dark, revisar duas tentativas G, métricas repetidas e short aprovados/legado específico; hipótese documentada. Referências secundárias somente estilo/tom, nenhuma geometria emprestada.
- Referências/medidas próprias; prompt lock pose/corpo/pés/cabeça/silhueta/enquadramento/identidade/rosto/cabelo/roupa/família tonal/iluminação; full body/alpha real.
- PNG nativo1024×1536 byte-exato; nenhuma transformação corretiva do candidato.
- Alpha≥128 gate13medidas, tolerâncias inalteradas; alpha>0 diagnóstico.
- Até4tentativas por identidade nesta rodada, stop primeiroPASS. Repetição consecutiva exige mudança concreta ou BLOCKED_FINAL_GEOMETRY. Bloqueio individual não impede dois moss (nova autorização supersede parada globalG apenas para estes3).
- Precheck pelo agente, sem HUMAN_VISUAL_APPROVED; todosPASS VISUAL_REVIEW_PENDING.
- Evidências cinco arquivos por gerado, todas rejeições preservadas, review3lado a lado com legado individual.
- Preservação por hash163legadas,2pilotos,49aprovados/R/Batches e fontes/runtime/renderer/anchors/IDs/saves. DEV/review somente, produção/fallback legado; Body-Fit semREADY.
TEST_PLAN: geometry unit, asset/queue validator, review lab seis viewports/teclado, lint código local; typecheck/build N/A salvo TS/runtime alterado.
DEFINITION_OF_DONE: três13/13→TECHNICALLY_COMPLETE/VALIDATING aguardando aprovação humana; falha→REWORK/BLOCKED_FINAL_GEOMETRY exato. Filas/evidências/receipts/docs/memória atualizadas. TASK-0049 nãoDONE antes dos3aceites humanos e demais gates.

## Autorização

Anexo TASK-0049H autoriza somente estas3identidades, até4tentativas por asset nesta rodada. Sem outras gerações, remotos ou promoção Body-Fit/produção. PNGs e evidências anteriores permanecem íntegros.

## SELF VALIDATE / QA / ACCEPTANCE

2026-10-07T23:33:52.336Z: TASK-0049H TECHNICALLY_COMPLETE/VISUAL_REVIEW_PENDING. IDs female_short_ochre_dark, female_short_moss_light, female_short_moss_dark. TentativasH1/1/2,4gerações,1rejeição,3finais13/13. Ochre_darkGduasrejeições preservadas; hipótese de expansão local da capa, novo contorno sobre próprio2×, primeiraHpassou. Fila49HUMAN_VISUAL_APPROVED+3VISUAL_REVIEW_PENDING,0PENDING_HD,0BLOCKED_PATTERNativo. 815hashes e49itens aprovados preservados. DEV-only review, produção/fallback legado, Body-Fit semREADY. Carlos deve revisar3; TASK-0049 nãoDONE, geração encerrada. Relatório docs/architecture/TASK-0049H-FINAL-3-REWORK-REPORT.md; receipts docs/architecture/task-0049-final-3-rework/TECHNICAL-RECEIPTS.json; review build/task-0049-final-3-rework/review/index.html.

Unitgeometry5/5,safety4/4,assets4/4,filaPASS,lab6/6,lint8PASS. Typecheck/build/Security adicionalN/A conforme escopo. QA pelo autor, nãoindependente; precheck qualitativo sem aprovação humana. Aceite técnicoPASS, humanoPENDING.

## Aceite final vigente — confirmação humana explícita

2026-10-07T23:40:29.685Z: Carlos Faustino aprovou os três candidatos finais e os dez critérios visuais. TASK-0049H FINAL_3_COMPLETE / HUMAN_VISUAL_APPROVED / DONE. TASK-0049 DONE no escopo do pack DEV. Fila: 52 HUMAN_VISUAL_APPROVED, 0 VISUAL_REVIEW_PENDING, 0 PENDING_HD, 0 BLOCKED_PATTERN ativo. Dois pilotos aprovados fora da fila: 54 identidades aprovadas no total. HD continua DEV-only/review local; produção/fallback continua legado; Body-Fit continua pendente, sem READY. Nenhuma integração ou geração nova, push, deploy ou alteração remota. Aprovação vinculada aos três hashes em docs/architecture/task-0049-final-3-rework/HUMAN-VISUAL-APPROVAL.json.

Conferência documental pelo autor: JSON/receipts/status, hashes e preservação dos outros 49 registros; evidência build/task-0049-final-3-rework/human-approval-verification.json. QA estrutural pelo autor, não independente. Checks técnicos anteriores preservados (geometry 5/5, detector 4/4, assets 4/4, lab 6/6, lint 8 PASS; TASK-0049 inicial E2E 4/4, typecheck/build PASS). Nesta confirmação lint/typecheck/build/unit/E2E N/A: somente metadados e textos, nenhum código runtime, imagem ou geometria alterados. Security adicional N/A: sem secrets/auth/dependências/permissões/infra alterados.

Escopo desta confirmação: registrar aceite humano/documentação e encerrar contratos; sem geração/runtime/produção/Body-Fit. Instruções e estados anteriores nesta tarefa são históricos.
