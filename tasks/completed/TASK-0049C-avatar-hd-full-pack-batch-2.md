# TASK-0049C — Avatar HD Full Pack — Batch 2

ID: TASK-0049C
STATUS: DONE
OUTCOME: BATCH_2_COMPLETE
VISUAL_STATUS: HUMAN_VISUAL_APPROVED
PRIORITY: P2 Normal
OBJECTIVE: Gerar somente os próximos seis PENDING_HD da fila oficial com o método aprovado, sem transformar PNGs finais.
SCOPE: seleção ordenada de seis identidades, até três tentativas por identidade, guias e silhuetas próprias, geração nativa, validators, review DEV, fila/status, documentação e memória.
OUT_OF_SCOPE: sétimo asset ou posterior, aprovação humana automática, produção/bundle/runtime/catalog/renderer/anchors/IDs/saves, Body-Fit/READY, 163 mídias legadas, pilotos e cinco candidatos aprovados, push/deploy/Vercel/Supabase/migrações/instalações.
DEPENDENCIES: TASK-0049R e TASK-0049B HUMAN_VISUAL_APPROVED.
ASSIGNED_AGENT: principal assume Frontend/QA no escopo autorizado; revisão técnica pelo autor, não independente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE; WORKFLOW/RULES/SECURITY; fila, receipts aprovados, receita/prompts/helpers Batch 1, auditor Geometry Lock e skill imagegen.
SECURITY_CONSIDERATIONS: imagens locais e review estático; nenhum secret, auth, dado remoto, dependência ou permissão alterada. Sem arquivo público novo.
ACCEPTANCE_CRITERIA:
- Seleção dos primeiros seis PENDING_HD, excluindo pilotos, TASK-0049R e Batch 1 aprovado; BATCH_2_SELECTION registrado.
- Referências somente da própria identidade: original, guia 2× e silhueta QA. Coordenadas individuais e prompt lock de pose/corpo/pés/cabeça/framing/rosto/cabelo/roupa, com proibição de reinterpretar ou reposicionar.
- PNG nativo 1024×1536 alpha real; bytes finais idênticos à ferramenta. Nenhuma manipulação final para encaixar geometria.
- Geometry Lock 13/13 com alpha ≥128 e tolerâncias existentes; alpha >0 diagnóstico.
- Até três tentativas, parar no primeiro PASS. Duas falhas semelhantes → BLOCKED_PATTERN_FOR_ASSET; terceira só com mudança concreta. Dois assets com esse bloqueio param imediatamente o lote → BATCH_2_BLOCKED_PATTERN.
- GEOMETRY_PASS / VISUAL_REVIEW_PENDING; precheck automático qualitativo apenas de gênero/cabelo/corpo inteiro/transparência/artefatos, sem aceite humano.
- Evidências por asset e review/index.html prático para os seis, inclusive estado honesto de não gerados se parada antecipada.
- DEV/review somente, fallback e produção usando legado; Body-Fit apenas BODY_FIT_REVIEW_PENDING.
- Hashes dos 163 legados, dois pilotos, TASK-0049R, quatro Batch 1 e fontes/runtime/renderer/anchors/IDs/saves preservados.
TEST_PLAN: geometry unit, asset validator, queue/batch validator, review lab seis viewports, lint dos helpers; typecheck/build N/A se nenhum TS/runtime mudar.
DEFINITION_OF_DONE: checks técnicos proporcionais aprovados e evidências preservadas; aceite humano explícito dos seis registrado em receipts; memória/fila/documentação atualizadas; BATCH_2_COMPLETE / HUMAN_VISUAL_APPROVED. TASK-0049 não DONE; sem produção/Body-Fit/Batch 3.

## Autorização

Solicitação vigente autoriza somente este lote de seis. Imagens e helpers QA em build/task-0049-batch-2; documentação em docs/architecture/task-0049-batch-2. Sem integração a runtime/produção, geração de asset 7, alterações nos aprovados ou serviços remotos. Os perfis Frontend/QA são assumidos pelo autor dentro desse escopo; sem subagentes.

## SELF VALIDATE / QA / ACCEPTANCE — histórico da fase técnica

- Seis selecionados na ordem oficial; tentativas 1/1/2/1/1/1, sete PNGs; seis finais 13/13 PASS e primeira tentativa ochre_light 11/13 rejeitada preservada. Nenhum BLOCKED_PATTERN ou asset 7.
- Final byte-exato, PNG nativo 1024×1536 alpha real; referências somente próprias. Precheck qualitativo pelo autor, sem aprovação humana.
- Unit 5/5, asset 7/7, fila/batch PASS, review seis viewports PASS, ESLint sete helpers PASS. Typecheck/build N/A sem TS/runtime alterado.
- Preservação 457 hashes e 46 itens não selecionados PASS. Runtime/produção/Body-Fit intactos; zero integração nova. QA pelo autor; Security adicional N/A.
- Aceite técnico comprovado; aceite visual humano PENDING. TASK-0049 não DONE; Batch 3 requer nova instrução após revisão.
- Relatório docs/architecture/TASK-0049C-BATCH-2-REPORT.md; receipts docs/architecture/task-0049-batch-2/TECHNICAL-RECEIPTS.json; review build/task-0049-batch-2/review/index.html.

## Aprovação humana / aceite final

- Carlos Faustino aprovou explicitamente os seis candidatos e os nove critérios visuais. Registro 2026-10-07T16:33:08.337Z, hashes finais vinculados em docs/architecture/task-0049-batch-2/HUMAN-VISUAL-APPROVAL.json e receipts individuais.
- HUMAN_VISUAL_APPROVED para os seis; BATCH_2_COMPLETE. Evidência técnica anterior preservada, nenhuma geração ou modificação de PNG/métricas.
- Conferência documental pelo autor: receipts/status consistentes, seis hashes finais e 457 arquivos protegidos intactos, 46 itens não selecionados preservados. Suites anteriores mantidas; lint/typecheck/build N/A sem código alterado. Security adicional N/A sem novo gatilho.
- DEV-only; produção segue legado, Body-Fit sem READY. TASK-0049 não DONE; Batch 3 requer nova instrução.
- Todos os critérios do lote atendidos: TASK-0049C DONE. Contrato movido para tasks/completed sem duplicação. Verificação em build/task-0049-batch-2/human-approval-verification.json.
