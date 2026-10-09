# TASK-0048 — Avatar HD Asset Pack V1

ID: TASK-0048
STATUS: PILOT_COMPLETE
PRIORITY: P2 Normal
OBJECTIVE: Auditar 54 fontes, produzir e integrar somente dois pilotos de arte nativa 1024×1536, mantendo rollback legado.
SCOPE: pack visual avatar, resolver central e fallback, testes pertinentes, inventário, documentação e memória. Dois pilotos male/female short_moss_medium; demais 52 não autorizados nesta etapa; dependem de escopo futuro explícito.
OUT_OF_SCOPE: upscale, segundo compositor, saves/IDs/domínio/mecânicas/economia, aprovação automática Body-Fit, instalação, deploy/push/Supabase real.
DEPENDENCIES: TASK-0047
ASSIGNED_AGENT: agente principal assumindo Frontend/QA/Security; revisões pelo autor, não independentes.
REQUIRED_CONTEXT: GLOBAL_CONTEXT, CURRENT_STATE, WORKFLOW/RULES/SECURITY, AVATAR-RUNTIME-HD-V1 e inventário físico, skill imagegen.
SECURITY_CONSIDERATIONS: fontes locais permitidas, sem secrets ou serviços de dados reais; geração de somente dois assets explicitamente no escopo do pedido.
ACCEPTANCE_CRITERIA:
- 54 identidades preservadas e auditadas; legados intactos.
- Dois pilotos nativos 1024×1536, transparentes, mesma identidade/pose/framing, sem upscale.
- Resolver único HD validado → legado → procedural, equipamentos mantêm gate.
- Compatibilidade, seis viewports e DPR1/2/3 com evidência, sem promoção automática READY.
- Unit >=104; E2E >=52; lint/typecheck/build PASS.
- PILOT_COMPLETE somente após evidência; nunca DONE nesta fase. Aprovação humana exigida antes de produzir demais 52.
TEST_PLAN: auditoria física/dimensões/alpha/hash/bytes; testes do resolver e falhas; suites TASK-0047 e piloto; QA visual e DPR; preservação por hash.
DEFINITION_OF_DONE: nesta fase aceite do piloto e memória atualizada; pacote integral exige 54 arquivos produzidos/validados e aprovação prévia dos pilotos.

## REWORK-1 — estado atual: PILOT_COMPLETE

Dois pilotos HD_READY passaram Geometry Lock alpha ≥128 (critério confirmado pelo usuário); alpha >0 é diagnóstico e seus FAIL permanecem registrados. Artes nativas1024×1536 copiadas sem transformação final. Aprovação visual humana dos DOIS pilotos: HUMAN_VISUAL_APPROVED por Carlos Faustino, registrada em 2026-10-07T12:46:52.119Z. Identidade, pose, silhueta, proporções, linha dos pés, enquadramento e aparência geral do legado aprovados explicitamente. Nenhum outro52gerado, nunca DONE nesta fase.

Runtime real e cinco modos DEV aprovados; produção/jogo normal permanecem legados. Laboratório Next isolado: node scripts/avatar-hd-pilot-lab.mjs, http://127.0.0.1:3112. Override recusa production mesmo com flag. Renderer/anchors/Body-Fit/save/domínio inalterados. 16comparações de overlays V1 apenas QA; zero READY/aprovações Body-Fit.

Unit109PASS; E2E56PASS (49produção+3Vite+4NextHD),19skips históricos; lint/typecheck/buildPASS. DPR180amostras lab+84telas reais, trêsDPR. QA/Security pelo autor, não independentes. Sem instalação/push/deploy/Supabase real. [Medidas, deltas, tolerâncias, fontes, diferenças e evidências](../../docs/architecture/AVATAR-HD-PILOT-GEOMETRY-LOCK-REWORK-1.md).

Aceite final: PILOT_COMPLETE, uso restrito DEV. Os outros52assets permanecem PENDING_HD e sua geração não está autorizada. Nenhuma promoção de overlays Body-Fit para READY; sem push/deploy/alterações remotas. TASK permanece em active por não ser DONE do pack integral.

## Histórico anterior — REWORK (não descreve os pilotos atuais)

## Execução

- Selecionados os dois defaults short/moss/medium, corpo masculino e feminino; correspondem às opções reais de criação. Face ID legado é preservado mas não é layer independente.
- Não existe aprovação humana dos novos pilotos ainda. Nenhuma produção em massa autorizada antes dessa aprovação.

## SELF VALIDATE / QA / Acceptance

- Dois arquivos reais PNG RGBA nativos1024×1536, sem upscale/resize; built-in imagegen + referências locais. Masculino2231509bytes; feminino2229012bytes. Geometria FAIL, ambos REJECTED para jogo normal. Masculino baseline +2px lógicos; feminino +17.5px, direita +11.5px; centro visual/silhueta também variam. Iterações de desenho não preservaram exatamente o contrato.
- Resolver/catalog mínimo único; somente VALIDATED pode ativar HD normalmente. DEV opt-in inspeciona candidatos no lab existente; bypass recusado em produção. Falha/dimensões físicas inválidas→legado→procedural; trocar fonte recupera. Não há segunda composição nem caminhos HD em telas.
- Auditoria54originais/52PENDING_HD/2REJECTED/0VALIDATED; tabela completa no relatório e inventário com origem/hash/dimensões/alpha/bytes.
- Unit13arquivos/104PASS (93anteriores+11novos). Comando/log: build/task-0048-evidence/unit.log. Testa status/paths/dimensões/produção/readonly/recuperação/equipamento e regressão Arena/Snake/Home/Create/Shell.
- E2E49produçãoPASS/19skips históricos de duplicação/mobile +3DEV=52PASS. Produção: seis specs avatar-runtime/equipment-portal/equipment-cinematic/arena-v2/avatar-hd/arena-lab-production. DEV: playwright.avatar-runtime-lab.config.ts. Logs e capturas em build/task-0048-evidence.
- Lint PASS; typecheck PASS após REWORK de import absoluto no teste browser; build PASS/20rotas. Logs lint/typecheck/build e typecheck-rework.log preservados. next-env restaurado e tsc direto revalidado ao encerrar.
- DPR180amostras candidatas (2corpos×5modos×6viewports×3DPR), fontes1024×1536, ratio/contain/auto/overflow PASS; visual mais detalhado mas encaixe não aprovado. Testes de fontes quebradas/dimensão incorreta/legacy/procedural/recuperação PASS. Legado DPR em produção ampliado com dois landscapes, sem reduzir nenhum viewport anterior.
- Telas do jogo/reload/troca/identidade/mechanics/save verificadas com legados; candidatos HD apenas nos cinco modos de lab e portrait estrutural. NÃO afirmar HD validado em todas as telas/minigame nem Body-Fit real.
- Zero overlays reais READY/aprovados;14V1arquivados e8definições NEEDS_NEW_OVERLAY preservados. Planos7e anchors/gates intactos; fixtures sintéticas testam composição mas não aprovam arte/fitting. Nenhum offset para disfarçar geometria.
- QA e Security pelo autor, não independentes. Security docs/security/AVATAR-HD-ASSET-PACK-V1-REVIEW.md. Sem instalação/push/deploy/Supabase real.
- ACCEPTANCE: FAIL somente nos requisitos visuais/alinhamento e consequente integração HD real em telas/Body-Fit. Código/checks PASS não permitem PILOT_COMPLETE. Arquivos legados/IDs/saves mantidos.
- Preservação final SHA-256PASS:591baseline/582intactos/9edições autorizadas+6novos;163mídias legadas intactas, zero missing/unexpected. Config raiz revisada separadamente. next-env restaurado e tsc direto web/raizPASS; Herói dev3000HTTP200.

## Próxima ação exata

Obter/redesenhar duas artes nativas1024×1536 com mesma silhueta/proporções/framing/posição/baseline/centro visual dos originais; auditar e validar visualmente, integrar pelo catálogo único e verificar telas/minigame/Body-Fit real e DPR. Marcar PILOT_COMPLETE somente com esse aceite. Antes dos52restantes obter aprovação humana explícita dos DOIS pilotos. DONE somente após54produzidos/validados. Nenhuma flexibilização do requisito de enquadramento foi presumida.

## REWORK-1 — Geometry Lock (contrato ativo)

STATUS_ROUND: PILOT_COMPLETE
SCOPE_ROUND: medir PNG legado e HD, QA programático (legado normalizado ×2 somente em evidências), tabelas/deltas/tolerâncias, gerar apenas os dois pilotos usando referências legadas. Intermediários em build/task-0048-evidence/geometry; publicar vencedor no diretório HD somente após validação. Atualizar relatórios/inventário/memória e executar checks existentes.
OUT_OF_SCOPE_ROUND: transformação geométrica do asset final, crop/stretch/warp, offsets/alteração do runtime para compensação, produção global ou outros52, READY automático, domínio/gameplay.
TOLERANCES_ROUND: baseline±2px lógico; centroX/Y±2px lógico; topo±3px; laterais±3px cada. Contorno alpha >=128 como critério geométrico, alpha >0 somente diagnóstico, conforme confirmação explícita do usuário. Silhueta/anatomia/pose incompatíveis reprovam mesmo com bbox PASS. Dimensão1024×1536/alpha/clipping/revisão visual exigidos.
TEST_PLAN_ROUND: Unit>=104; E2E>=52; lint/typecheck/buildPASS. Gates runtime real/DPR/Body-Fit posteriores somente com dois geometry locks aprovados. QA pelo autor não equivale à aprovação humana do usuário.
