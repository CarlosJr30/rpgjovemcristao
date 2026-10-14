# TASK-0074 — Equipment Body-Fit V3
ID: TASK-0074
TITLE: Auditoria corporal, galeria de aprovação e UX mobile de equipamentos
OBJECTIVE: Revalidar candidatos e aprovações exatas, entregar revisão corporal segura e melhorar Equipment Portal com integração estritamente condicional e publicação das melhorias independentes aprovadas.
PRIORITY: P1 High
STATUS: VALIDATING
CURRENT_REQUEST: 14/10/2026 — auditoria completa técnica/visual/funcional dos sete FIT_PASS pendentes, capturas/ZIP, sem clicar em decisões humanas; testes públicos e publicação apenas de correções seguras autorizadas. Pausa anterior revogada por este pedido explícito; nenhuma nova aprovação corporal concedida.
SCOPE: Auditoria física/receipts/checklists/resolvedores/atributos existentes; galeria local mobile privada e drafts de decisão rastreáveis; UX Portal/preview/comparação, integração condicional de candidatos já aprovados após compatibilidade; QA/evidências/docs, commit/push normal e projeto Vercel existente após gates. Usuário autorizou explicitamente no anexo de14/10/2026.
OUT_OF_SCOPE: Aprovar pelo usuário, generalizar aprovação a variantes, fontes/54HD imutáveis, candidatos sem aprovação em runtime/produção, SQL/Supabase/Auth/RLS/saves/regras/economia/itens novos/licenças, áudios restritos, DEV/review público, force/reset/exclusões/novo projeto/env remoto.
DEPENDENCIES: main9c709c93ec94af998b9cb05030db8ce405637fec (TASK0073 publicada e chat integrado externamente); receipts0054–0059; gate de decisão corporal humana para cada candidato.
ASSIGNED_AGENT: Agente principal assume FRONTEND/QA/SECURITY/DEVOPS, sem subagentes nem revisão independente. Recomendação de modelo no anexo não comprova mudança do runtime.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE, WORKFLOW/RULES/SECURITY/ORCHESTRATOR/TOKEN_POLICY, perfis e skills pertinentes, checklist/receipts/manifests/catálogo/Avatar/Portal/testes afetados.
SECURITY_CONSIDERATIONS: Worktree D:/rpg-jovem-cristao-task-0074 / feat/equipment-body-fit-v3-0074; original55bae817 e encerramento0073 preservados. Galeria offline/local sem rota pública, secrets ou administração fictícia; decisões locais são drafts até confirmação explícita do usuário. Nenhum serviço de banco alterado.
ACCEPTANCE_CRITERIA:
- Inventário físico16targets/54HD/catálogo6itens revalidado, com SHA, transparência, Avatar, camada, FIT, humano/staging/runtime/compatibilidade separados.
- Galeria de revisão antes/depois, corpo/partes/zoom/mobile/controles e decisão exata exportável, sem aprovação presumida nem exposição pública.
- Portal legível nas11dimensões; equipar/desequipar/comparar/atributos/persistência existentes corretos, sem novo balanceamento.
- Integração corporal somente de candidato/Avatar/hash com aprovação válida e compatibilidade comprovada; faltantes mantêm apresentação atual.
- Lint/types/unit/E2E/build/segurança/preservação pertinentes PASS; melhorias independentes publicadas em projeto existente READY/SHA/URL/8áudios404 quando houver.
TEST_PLAN: Baseline físico/Git e UI antes; unit de resolvedor/atributos/fallback/render/persistência;11dimensões Android/WebKit/desktop; Portal e regressões Home/Arena/Jornada/chat; carregamento sob demanda/CLS/requests/bytes; galeria offline/exclusão do build/rotas404; publicação e smoke público.
DEFINITION_OF_DONE: REVIEW_READY com galeria/evidências/decisão humana pendente; PARTIAL_DEPLOY_COMPLETE se melhorias independentes publicadas e candidatos pendentes inativos. DEPLOY_COMPLETE somente integrações aprovadas publicadas; PHYSICAL_QA_APPROVED apenas confirmação real do usuário. QA/Security identificados como pelo autor.

## Estado inicial
- Fetch confirma main9c709c9, branch isolada criada desse commit; workspace original não resetado/checkout/descartado.
- Histórico de checklist0059:16targets,8FIT_PASS,1NEEDS_REWORK,7NEEDS_NEW_ART,1humana/READY staging,0runtimeV2. Revalidar por bytes/receipts, não assumir números históricos.
- Receipt0054 limita aprovação a armor_traveler_uncommon_female_v2_baked / SHAebee2f… / Avatarfemale_short_moss_medium. Runtime ainda não ativado; não extrapolar para outras53identidades.

## Aceite técnico / checkpoint anterior à publicação
- Auditoria física16/54/6 sem divergência;8FIT_PASS/1REWORK/7NEW_ART/1humana anterior/7pendentes. Fonte/bake/receipt da Couraça feminina intactos, uma integração local estritamente vinculada;7pendentes runtime/produção0.
- Galeria somente offline privada:11dimensões×Chromium/WebKit,16decodes em cada dimensão, hashes incorporados iguais, navegação/zoom real/pan/corpo inteiro/teclado/targets44px/zero requests e decisões PASS. Referência muda por target; não há seleção arbitrária que extrapole aprovação.
- Inspeção individual dos7 e10pares estáticos com30capturas adicionais. Mãos/rosto preservados nas armaduras/espadas; fixação dos escudos ambígua na vista frontal e combinações pedem decisão humana. Nenhum PNG corrigido, nenhuma aprovação/READY inferida.
- QA447unit/68files;133E2E distintos aceitos:80regressões +23provador +30Home/atributos (25na rodada principal,5WebKit rechecados), onze skips exclusivamente redundância/desktop mobile. Rodada finalprovador23PASS/10skip após ajuste do corpo inteiro. Chat10fixtures PASS, não chat autenticado real. Lint/types/build20rotas/210públicos/728mídias/54HD/8SHA eHTTP/51privados404 PASS. Preservação2.435baseline sem mudança inesperada. QA/Security pelo autor.
- REWORK corrigiu labelZoom, zoom mobile/enquadramento/pan da galeria, preview corpo inteiro, seletores320WebKit e sincronização de testes legados. WebKit Windows omite links no Tab padrão; foco do skip explicitamente verificado, botões por Tab. Sem alterar appHome/Auth/Serpente/câmera/swipe/saves/atributos/catálogo/DB.
- ZIP privado verificado por hash/entradas, sem secret/env/dados reais/54HD duplicados. Código público/metadata selecionados; gallery/ZIP/PNGs pendentes nunca entram no deploy. Próximo: commit/push normal, READY/SHA/produção e PARTIAL_DEPLOY_COMPLETE; human review/POCO permanecem pendentes.
