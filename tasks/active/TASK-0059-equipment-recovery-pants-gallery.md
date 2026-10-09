# TASK-0059 — Equipment Body-Fit Recovery, Pants Design & Rarity Gallery V1

## Contrato vigente — substitui somente a preparação abaixo

ID: TASK-0059
TITLE: Auditoria, galeria por raridade, proposta Calças e recuperação Body-Fit
OBJECTIVE: Executar fases1–13 do pedido atual, com checkpoints e evidências reais, sem reiniciar tarefas históricas.
PRIORITY: P2 Normal
STATUS: ACTIVE
SCOPE: scripts/testes/configs/ferramentas DEV, staging build/task-0059-equipment-recovery, checklist/catalog JSON, proposta Calças, derivados offline de fontes locais, compatibilidade, evidências e memória. Escopo explicitamente autorizado também para documentação/scripts fora dos diretórios dos perfis locais.
OUT_OF_SCOPE: Novas artes externas, alterações de54HD/sources/pilotos/FIT_PASS sem defeito confirmado, runtime/saves/IDs/catálogos/economia/fórmulas/schema/combate; slot Calças ativo, READY sem aprovação explícita, push/deploy/Supabase/migrations/install/destrutivos.
DEPENDENCIES: Histórico TASK0051–0058/DEC037/pipeline offline. Aprovação humana0058 bloqueia só sua promoção, não as fases independentes autorizadas neste pedido.
ASSIGNED_AGENT: Codex, perfis frontend/QA/security locais; sem delegação ou revisão independente.
ACCEPTANCE_CRITERIA:
- Inventário físico e hashes, estado real dos16targets e distinção técnica/humana/runtime.
- Galeria DEV Arsenal do Viajante por cinco raridades com atributos reais, filtros, categorias distintas e estados vazios.
- Proposta completa Pernas/Calças, sem runtime ou valores fictícios.
- Botas: piloto feminino, até duas abordagens diferentes, parada local documentada se falhar; masculino não processado sem método validado.
- Revisão e derivados pertinentes de elmos/medalhões/três espadas usando apenas recursos locais; classificação honesta e briefs quando faltar arte.
- FIT_PASS antigos mantidos e disponíveis; compatibilidade apenas de candidatos físicos, combinações não testadas não promovidas.
- Checkpoint consolidado por fase, gates e preservação; nenhuma aprovação humana presumida.
TEST_PLAN: Integridade/PNG/alpha/SHA/manifests/bake/controles; DEV/filtros/acessibilidade/BodyFit; Portal/cinematic/reduced motion/persistência/fallback; seis viewports solicitados, lint/typecheck; build somente se produção alterada.
DEFINITION_OF_DONE: Aceite real e checks aplicáveis, memória atualizada. Falhas locais registradas e outras fases concluídas; resultado consolidado sem DONE artificial com encaixe ainda reprovado.

## Preparação histórica anterior — não é contrato de execução vigente

O pedido atual amplia e autoriza execução local independente do gate humano0058. Texto da preparação prévia preservado abaixo como histórico do mesmo ID, sem duplicar task.

ID: TASK-0059
TITLE: Bainhas próprias para common male e rare female/male
OBJECTIVE: Produzir e validar três overlays embainhados independentes, conforme DEC-037, após contratar a execução futura.
PRIORITY: P2 Normal
STATUS: BACKLOG
SCOPE: Nesta preparação, somente este contrato documental. Execução futura proposta: fontes próprias, suspensão compatível com cada cinto, transform uniforme individual, bake offline, evidências, FIT_PASS e revisão corporal humana por hash.
TARGETS:

- sword_path_common_male_v2
- sword_path_rare_female_v2
- sword_path_rare_male_v2
OUT_OF_SCOPE: Execução/geração nesta confirmação; copiar automaticamente source/transform/máscara do piloto; substituir originais/HD; alterações runtime/cinematic/combate/saves/IDs/economia; READY automático; push/deploy/Supabase/migrations/instalações/serviços pagos/operações destrutivas.
DEPENDENCIES: TASK-0058 revisão corporal explícita do piloto; DEC-037; pipeline TASK-0054/0055/0056; diagnóstico TASK-0057; autorização posterior de execução com escopo e ferramenta definidos.
ASSIGNED_AGENT: Perfil frontend/arte Body-Fit, QA e Security quando aplicáveis; nenhum subagente ou execução registrado automaticamente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE/WORKFLOW/RULES/SECURITY; relatórios e manifests0057/0058; fontes dos três targets, HD de referência correspondente e pipeline existente.
SECURITY_CONSIDERATIONS: Apenas preparação local documental autorizada agora. Futuras fontes auditadas por existência física/PNG/SHA; sem secrets/dados pessoais/saves em prompts; staging separado e referências originais imutáveis.
ACCEPTANCE_CRITERIA:

- Cada target tem bainha própria cobrindo inteiramente a lâmina e suporte real conectado ao seu cinto.
- Cabo para cima/ponta para baixo, posição lateral, proporção e profundidade adequadas, sem flutuação ou cruzamento grave de pernas/mão/bolsa.
- Transform, máscara justificada quando necessária, metadata e evidências individuais; nenhuma deformação anatômica.
- PNG RGBA1024×1536 full-canvas transparente, bake offline sem corretivos no runtime.
- FIT_PASS independente por target/hash, separado de NEEDS_REWORK e revisão humana; revisão explícita de Carlos necessária antes de READY apenas em staging.
- 54HD/fontes originais/piloto0058/armadura aprovada/candidatos anteriores/runtime/saves/IDs/sistemas preservados por hash.
TEST_PLAN:

- Integridade PNG/alpha/dimensões/SHA/reprodução do bake e preservação por target.
- Review de Avatar original/source/bainha/overlay/composição/cintura/suporte/antes×depois/guias/relatório de encaixe.
- Viewports390×844,412×915,844×390,915×412,1440×900,1920×1080.
- Regressões relacionadas de Body-Fit Lab/Equipment Portal/reduced motion conforme alterações futuras; lint/typecheck e build quando aplicáveis. Não repetir suites globais por mera documentação.
DEFINITION_OF_DONE:

- Contrato de execução autorizado, resultado individual comprovado e gates técnicos/humanos documentados, memória atualizada; falhas reais exigem REWORK/BLOCKED.
- Nenhum resultado presente: três targets não processados, FIT_PASS/READY/aprovação humana não atribuídos por este contrato.
PREPARATION_RESULT: Contrato futuro preparado; execução não iniciada. Aguardar confirmação humana do piloto e solicitação posterior de execução.
