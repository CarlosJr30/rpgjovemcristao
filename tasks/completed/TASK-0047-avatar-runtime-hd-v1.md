# TASK-0047 → Avatar Runtime HD V1
ID: TASK-0047
TITLE: Avatar Runtime HD V1
OBJECTIVE: Pipeline central consistente, HD-ready, Body-Fit V2 e saves compatíveis sem fabricar HD.
PRIORITY: P2 Normal
STATUS: DONE
SCOPE: Autorização explícita TASK-0047: avatar runtime/helpers/adapters e integrações visuais mínimas, extensão do Visual Lab DEV existente, testes/evidências/documentação. Autor assume Architecture/Frontend/QA/Security sem delegação.
OUT_OF_SCOPE: Assets novos/upscale, IDs/schema/save, combate/economia/progressão, Auth/Supabase/migrations, regras/manifests/aprovação Body-Fit, itens/conteúdo bíblico, instalações/push/deploy/publicação.
DEPENDENCIES: TASK-0046 DONE local; Avatar e Body-Fit V2 existentes.
REQUIRED_CONTEXT: Governança mínima, Avatar/EquippedAvatar/avatarAssets/gameplayAvatarPortrait, Traveler/Create/Shell/Home/Garden/Arena/Equipment, Body-Fit resolver/tests, Visual Lab existente.
SECURITY_CONSIDERATIONS: Asset URLs locais allowlist, identidade somente leitura, fallback seguro; lab DEV sem persistência/produção; QA/Security pelo autor, não independentes.
ACCEPTANCE_CRITERIA:
- Auditoria física e CURRENT_AVATAR_PIPELINE antes de editar runtime; inventário honesto 82 fontes.
- AvatarRuntime central com canvas lógico 512x768, alvo HD 1024x1536; tamanhos pelo mesmo pipeline, ordem central existente; overlays somente resolver READY+aprovação por corpo.
- Compatibilidade sem renomear IDs nem mutar save; seis rostos legados e seis cabelos preservados/inventariados. Face IDs historicamente inativos não passam a substituir identidade com recortes incompatíveis.
- Herói/Equipamentos/Arena/miniaturas/Jornada e retrato canvas usam mesmo resolver; animações/cinematic/reduced intactos.
- Fallback recupera ao mudar fonte e falha de overlay não quebra avatar. Lab existente estendido para combinações/variantes sem expor em produção.
- Unit/E2E/QA seis viewports/lint/typecheck/build PASS; memória/docs/pendências honestas, sem alegar HD físico inexistente.
TEST_PLAN: Identidades 2x3x3x3, face/hair IDs legados, saves, aprovação/ausência/falha/recuperação, variantes/retrato; E2E integração Arena/Equipment/Jornada e Visual Lab matriz/six viewport; hashes baseline/82 avatar PNG/163 mídias.
DEFINITION_OF_DONE: Todos gates aplicáveis e aceite comprovados. Falha → REWORK. Runtime HD-ready pode concluir com substituições físicas explicitamente pendentes, pois geração é proibida.

REWORK: Teste novo inicialmente sem ambiente jsdom e com expectativa incorreta de tom padrão; corrigidos e suite repetida PASS. E2E DPR antigo encontrou Herói com 684px de largura: seletor novo full tinha especificidade igual e sobrepunha width264 da tela. Corrigido com largura padrão de baixa especificidade/max512 lógico, mantendo tamanhos das telas. Seletores legados data-body-type reservados a composição full; metadata data-avatar-body-type vale em todas variantes, preservando testes/targets de cinematic. Nova execução dos checks de geometria/integração obrigatória.

RESULT: AvatarRuntime/resolveAvatarIdentity/resolveAvatarRuntime centrais. Adapters antigos compatíveis; Shell/Home/Intro/Garden/Arena e retrato canvas pelo mesmo pipeline; Equipment/Herói usam adapter consolidado, sem refatorar layout/cinematic. Canvas512x768/alvo1024x1536; body indivisível + ordem Body-Fit existente, sem fake face/HD/READY. Fallback por fonte recupera, imagem de overlay quebrada é removida sem alterar mecânica; base em fallback não recebe overlays de outro corpo. Miniaturas decorativas quando nome já consta.
SELF_VALIDATE: Auditoria sharp de 82 PNG e 54 hashes runtime únicos; corpo/face/cabelo/estado/máscara/canvas/cache/motion/uso mapeados antes da alteração no CURRENT_AVATAR_PIPELINE. Unit 12 arquivos/93 PASS; E2E produção 49 PASS/19 skips duplicados ou projeto mobile do teste DPR +lab DEV 1 PASS =50 PASS. Lint/typecheck/build PASS/20 rotas. Next-env restaurado exatamente, tsc web/raiz direto PASS; rota Herói no dev3000 HTTP200. Logs build/task-0047-evidence.
QA_GATE: PASS pelo autor, não independente. Todos os 54 assets carregam no lab, 18 combinações corpo/cabelo/face ID +cinco modos +roupa/pele; seis viewports requeridos no lab e Equipment/Arena/fallback. DPR 1/2/3 em ambos corpos/Herói/Equipment; proporção 2:3/contain/auto/sem extrapolar fonte. Full body/face/hair/clipping/teclado/toque/cinematic/cinco raridades/ataques/hit/dodge/special/reduced/cleanup/save considerados. Não existe Body-Fit real aprovado; unit READY full-canvas com fixture sintética, não aprovação humana.
SECURITY_GATE: PASS pelo autor, não independente. Resolver local/allowlist/gate existente/nenhuma gravação; lab DEV com zero localStorage, produção404 e ausência no bundle. Security docs/security/AVATAR-RUNTIME-HD-V1-REVIEW.md. Conteúdo bíblico N/A inalterado.
ACCEPTANCE_CHECK: Critérios runtime comprovados; gates/reexecução do REWORK PASS. IDs/domínio/save/rules/Body-Fit/manifests/mídia íntegros por SHA-256; docs/memória atualizadas antes de DONE.
NEEDS_NEW_AVATAR_ASSET: Inventário docs/architecture/avatar-runtime-hd-v1-assets.json: 54 substituições nativas 1024x1536 HIGH por identidade, 14 layers independentes MEDIUM condicionais a contrato modular futuro. Cada entrada tem nome/categoria/gênero/resolução/alpha/finalidade/prioridade/referência/motivo. Nenhum asset gerado/upscaled; zero READY_HD.
PENDING: Pack HD físico, faces independentes e Body-Fit real/oclusão de capacete exigem arte/canvas/alinhamento/revisão específica futuros. IDs de face legados preservados mas não alteravam rosto antigo; continua assim por compatibilidade. Nenhuma pendência bloqueante do runtime autorizado. Sem push/deploy/Vercel/Supabase/migration/instalação/mídia externa.
REPORT: docs/architecture/AVATAR-RUNTIME-HD-V1.md.
PRESERVATION: PASS; baseline 578 arquivos, 568 íntegros, 10 alterações autorizadas e 12 novos autorizados nas áreas auditadas. 163 mídias/82 avatar PNG íntegros; zero perdas/divergências inesperadas. Dois arquivos de config Playwright da raiz revisados separadamente. Sem bloqueio de aceite do runtime local; arte HD real continua pendente.
