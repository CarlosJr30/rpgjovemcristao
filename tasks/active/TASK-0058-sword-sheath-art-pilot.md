# TASK-0058 — Sword Sheath Art & Body-Fit Pilot V1

ID: TASK-0058
TITLE: Uma bainha piloto para sword_path_common_female_v2
OBJECTIVE: Gerar arte de bainha/suspensão, preservar espada e Avatar e validar encaixe offline específico.
PRIORITY: P2 Normal
STATUS: BLOCKED
SCOPE: Um único piloto; source/baked/review em build/task-0058-sword-sheath-pilot; ferramentas locais, testes e documentação próprios.
OUT_OF_SCOPE: Outras três espadas, alterações dos originais/HD/runtime/saves/IDs, READY sem confirmação humana explícita, instalação, serviços pagos, push/deploy/Supabase.
DEPENDENCIES: TASK-0054/0055 pipeline; TASK-0056 histórico; TASK-0057/DEC-037 diagnóstico e regra de repouso.
ASSIGNED_AGENT: Codex, perfis frontend/QA/security assumidos localmente, sem delegação ou revisão independente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT, CURRENT_STATE, WORKFLOW, RULES, SECURITY, TOKEN_POLICY; relatório/manifest0057; NEEDS_NEW_BODY_FIT_ASSET; skill imagegen.
SECURITY_CONSIDERATIONS: Gerador integrado autorizado somente para referências artísticas do piloto; nenhum secret/dado pessoal/save; staging, sem ativação ou operação remota de projeto.
ACCEPTANCE_CRITERIA:
- Espada existente, lâmina totalmente coberta, cabo para cima e ponta para baixo.
- Suspensão física no cinto/quadril, profundidade coerente, mãos/bolsa/pernas livres.
- HD e fontes/históricos idênticos por SHA; RGBA1024×1536 full-canvas transparente.
- Evidências das dez vistas, metadata por hash e QA nos seis viewports.
- FIT_PASS técnico separado de HUMAN_BODY_FIT_REVIEW_PENDING; READY e aprovação humana false.
TEST_PLAN:
- PNG/CRC/alpha/dimensões/SHA e determinismo do bake.
- Review e Body-Fit Lab; Equipment Portal/reduced motion; lint/typecheck.
- Build dispensado se produção não mudar, conforme contrato do usuário.
- Snapshot de preservação e inspeção visual própria de composição/zoom/suporte.
DEFINITION_OF_DONE:
- Não mover para DONE automaticamente: resultado PILOT_TECHNICALLY_COMPLETE/FIT_PASS/HUMAN_BODY_FIT_REVIEW_PENDING, ou REWORK/NEEDS_REWORK, ou BLOCKED/AWAITING_SHEATH_SOURCE_ART.
- Atualizar memória, status e relatório com critérios reais e limites.

RESULT: PILOT_TECHNICALLY_COMPLETE / FIT_PASS / HUMAN_BODY_FIT_REVIEW_PENDING
SELF_VALIDATE: PNG/CRC/decode/alpha/SHA e reprodução dos três bakes PASS; cinco testes unitários PASS; referências e1.078 arquivos intactos incluindo54HD. Inspeção de corpo inteiro, suporte, guarda/mão, fundo claro/escuro e desktop/mobile pelo autor.
QA: 2review/BodyFitLab e9Portal/reduced motion PASS, seis viewports exatos; lint/typecheck PASS; build N/A porque nenhuma produção foi alterada, conforme contrato. Revisão pelo autor, sem independência.
SECURITY: PASS pelo autor; gerador integrado autorizado somente para uma bainha piloto, sem secrets/saves/serviço extra/install/Supabase/push/deploy.
ACCEPTANCE: critérios técnicos cumpridos para female_short_moss_medium e SHA735000c62ddaee5214cfb895deae17685a1f2e1c0c642f3557e09879d90524f2; aprovação corporal específica de Carlos pendente. FIT_PASS1/NEEDS_REWORK0 por target; duas tentativas rejeitadas preservadas. READY/humanapproved/runtime0.
EVIDENCE: docs/architecture/TASK-0058-SWORD-SHEATH-PILOT-REPORT.md; TASK-0058-SHEATH-PILOT-MANIFEST.json; build/task-0058-sword-sheath-pilot/review/index.html; baked/attempt-03/fit-report.json e receipt.json.
NEXT: Carlos revisar este hash/Avatar; nenhuma execução das outras três ou ativação inferida. Não DONE.

HUMAN_APPROVAL_GATE: BLOCKED / HUMAN_BODY_FIT_REVIEW_PENDING. Pedido posterior autoriza documentação e eventual READY somente em staging após confirmação explícita, mas não contém essa confirmação. Nenhuma aprovação de Carlos encontrada na conversa ou registros inspecionados. FIT_PASS técnico mantido, humanBodyFitApproved/READY/runtime false.
HASH_CHECK: 2026-10-09T01:20:11Z (08/10 local), SHA físico igual ao informado, manifest e receipt; PNG RGBA1024×1536/CRC/decode/alpha PASS, Avatar e vínculos de receipt/metadata/fit-report conferidos;1.078/1.078 protegidos intactos. Sem testes globais repetidos: somente verificação documental/estrutural e de integridade pelo autor.
APPROVAL_RECEIPT: build/task-0058-sword-sheath-pilot/baked/attempt-03/human-approval-receipt.json, registro de gate pendente, não recibo de aprovação concedida. Receipt técnico e candidatos históricos preservados.
UNBLOCK_CONDITION: Confirmação visual explícita de Carlos para target sword_path_common_female_v2, Avatar female_short_moss_medium_hd e SHA indicado, abrangendo proporção/fixação/quadril/cabo e guarda/direção/profundidade e oclusão/ausência de flutuação/aparência geral. Conferir novamente o hash antes de registrar HUMAN_BODY_FIT_APPROVED e READY somente em staging.
FUTURE_TASK: TASK-0059 preparada somente em backlog; execução das outras três não autorizada nesta confirmação.
