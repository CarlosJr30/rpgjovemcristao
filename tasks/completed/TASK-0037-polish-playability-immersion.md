# TASK-0037 — Polish, playability & immersion sprint
ID: TASK-0037
TITLE: Jogabilidade mobile, apresentação da Arena, Guilda e imersão
OBJECTIVE: Corrigir a Fuga mobile antes do passe visual e tornar a experiência de RPG legível e imersiva.
PRIORITY: P0 Critical (Fuga); P1 Guilda/Arena; P2 equipamentos; P3 visual/áudio
STATUS: DONE
SCOPE: Autorização explícita do pedido de 2026-10-04. Alterações locais reversíveis em apps/web/features/journey, apps/web/app/globals.css, testes unitários e tests/e2e pertinentes, documentação em docs/architecture e docs/security, contrato e memória. Orquestrador assume Frontend, QA e Security localmente; extensão dos perfis para testes colocalizados e documentação. Contrato ativo registra o runtime solicitado, supersedindo o limite documental/TASK-0031 exclusivamente neste escopo.
OUT_OF_SCOPE: Push/deploy, dependências novas, serviços externos, migrations/RLS reais, Auth, Supabase, saves, economia, progressão, balanceamento, novas habilidades ou arte corporal READY. Preservar todo trabalho preexistente.
ASSET_SCOPE: Derivados WebP otimizados dos dois backgrounds existentes em apps/web/public/assets/world/garden, sem modificar PNGs originais ou produzir nova arte.
VIEWPORT_SCOPE: Metadado viewport-fit=cover em apps/web/app/layout.tsx para safe areas iPhone, preservando zoom acessível.
DEPENDENCIES: TASK-0036 (arquitetura da cerimônia preservada); assets existentes e infraestrutura de testes local.
ASSIGNED_AGENT: Frontend; QA e Security pelo próprio autor, sem revisão independente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT, CURRENT_STATE, WORKFLOW, ORCHESTRATOR, TOKEN_POLICY, RULES, SECURITY, perfis/skills Frontend/QA/Security e arquivos específicos dos módulos.
SECURITY_CONSIDERATIONS: Preferências de áudio validadas e limitadas; catálogo fechado de assets locais; filtragem da Guilda é apresentação e não substitui autorização remota; nenhuma conexão externa nova.
ACCEPTANCE_CRITERIA:
- Fuga: mapa/HUD/controles separados, targets >=48 px, safe areas, quatro orientações 390×844/844×390/412×915/915×412, hold/release/cancel/troca rápida/multitouch/fullscreen/sair, navegação restaurada.
- Guilda jogador: disponíveis publicadas, vigentes e realizáveis; concluídas em Histórico separado; pendentes de aprovação em área própria; estado vazio acolhedor; líder preservado.
- Arena: cenário/avatares/HUD visíveis; cada evento real apresenta atacante, alvo, ação/efeito e valor; movimento/impacto/câmera sutis com redução mobile e reduced motion.
- Equipamentos: comum 1.6 s, incomum 1.8 s, raro 2.0 s, épico 2.2 s, extraordinário 2.4 s; Escape/toque/reduced motion e arquitetura TASK-0036 preservados.
- Design: arte existente, Jornada/missão/campanha/progresso/CTA claros, navegação/cards/transições/microinterações/recompensas com identidade de aventura; legibilidade e performance mobile.
- Áudio: manager central, música/efeitos/volume/mute/persistência/fades/crossfade/contextos e ativação por gesto; nenhum path fictício; listar assets pendentes.
- Responsividade: 390×844, 412×915, 768×1024, 1440×900, 1920×1080; focus/touch/contraste/reduced motion.
TEST_PLAN:
- Testes direcionados após cada módulo; no final unit, E2E, lint, typecheck, build.
- E2E local sem contas reais; medições de não sobreposição, interações e capturas inspecionadas. Registrar limites de emulação versus aparelho físico.
- Hashes de alterações preexistentes em build/task-0037-baseline/hashes.json (fora da pasta limpa pelo Playwright); somente alterações autorizadas podem divergir.
DEFINITION_OF_DONE:
- Critérios verificáveis e gates PASS, relatório com 19 itens do pedido e assets pendentes, memória/status atualizados; falha exige REWORK.

## Evidências
- Baseline inicial registrada antes da primeira edição; sem reset/clean ou ação externa.
- Auditoria inicial: handlers touch sem pointer capture e sem isolamento entre teclado/pointers; fullscreen no documentElement; breakpoint landscape <=900 px exclui 915×412. Medições e validação seguem na execução.
- QA intermediário: unit 280 PASS; Fuga/áudio/Guilda/Arena e cinematic desktop PASS. Matriz detectou overflow no cabeçalho mobile após inclusão do áudio. REWORK com layout em duas linhas, preservando perfil, troca de Viajante e target de áudio 48 px; gates finais serão repetidos.
- Rework concluído: overflow corrigido e matriz nova PASS desktop/mobile; E2E completo revelou fixtures legadas sem modo local, texto de tutorial obsoleto e loop de Arena que tentava clicar antes de terminar a última apresentação. Preparações corrigidas, loop aguarda reabilitação ou resultado. Mensagem inicial da Serpente é transitória: teste aceita o surgimento ou a perseguição vigente. Sem alterar Auth/motor/preparo.
- SELF VALIDATE final: build/lint/typecheck PASS; unit 46 arquivos/282 testes PASS. E2E completo em consolidação; não marcar DONE até os gates abaixo.

## Aceite final — 2026-10-05

- BUILD PASS: `npm run build`, 20 páginas estáticas; último build inclui contraste do Diário e limpeza de áudio.
- LINT PASS: `npm run lint`, zero warnings ESLint, após ajustes finais de testes.
- TYPECHECK PASS: `npm run typecheck`, todos os workspaces e raiz.
- UNIT/INTEGRATION PASS: `npm test -- --maxWorkers=2`, 46 arquivos/282 testes; inclui input independente, filas de combate/HP/unmount, validade/agenda/histórico Guilda, cinematic e audio/fades/persistência.
- E2E PASS consolidado: suíte completa 92 casos, 72 PASS/4 FAIL/16 skips; corrigidos os quatro casos, `--last-failed` 4/4 PASS. Total 76 aplicáveis validados; primeira execução não foi integralmente verde. Nova matriz/Fuga 14/14 PASS; último contraste/matriz 2/2 PASS. Nenhum failure pendente.
- Skips N/A justificados: quatro prévias V1 rejeitadas, oito duplicações mobile de cinematic, duas auditorias DPR duplicadas e dois casos exclusivos desktop/mobile. Nenhum teste TASK-0037 pulado.
- QA PASS pelo autor: hit testing e touch/CDP nas quatro orientações, fullscreen real do navegador/saída, playthrough existente vencedor, matriz de sete telas × cinco viewports nos dois projetos; capturas, cinco contact sheets e inspeções detalhadas de Home/Arena/Histórico/áudio/Diário/Fuga. E2E usa Edge Chromium; aparelho físico/iOS e FPS físico não testados nem alegados.
- ACCEPTANCE PASS: critérios acima atendidos localmente. Áudio/arte futura explicitamente previstos pelo pedido como pendências de produção; catálogos vazios/overlays NEEDS_NEW_OVERLAY conservados, sem falso aceite visual ou playback fictício. Sem novas mecânicas, conteúdo bíblico, campanhas, economia ou regras de progressão.
- SECURITY REVIEW PASS pelo autor: docs/security/POLISH-PLAYABILITY-IMMERSION-REVIEW.md; sem achado crítico/alto no escopo. Nenhum novo aceite remoto de RLS/Guilda/Auth.
- DOCUMENTATION/MEMORY PASS: relatório de 19 itens, AUDIOS_PENDENTES e ASSETS_VISUAIS_PENDENTES em docs/architecture/POLISH-PLAYABILITY-IMMERSION-SPRINT.md; CURRENT_STATE atualizado.
- NO SECRETS PASS: revisão/scan de assinaturas no conjunto da tarefa, sem env/credencial expostos.
- PRESERVATION PASS: build/task-0037-evidence/preservation.json, 130 arquivos preexistentes, 112 hashes iguais e 18 edições autorizadas; zero divergência inesperada, 14 PNGs preexistentes intactos, next-env restaurado. Manifesto separa os 53 arquivos desta entrega dos demais trabalhos não commitados.
- `git diff --check` PASS com configuração normal do repositório. Não normalizar arquivos anteriores para contornar avisos de CRLF.
- EVIDENCE: build/task-0037-evidence/final-matrix (inclui última matriz com contraste), legacy-retry e contrast-final; cópias fora da pasta limpa pelo Playwright. Scripts locais de QA/preservação também nessa pasta ignorada.
- NO KNOWN CRITICAL REGRESSIONS PASS no escopo local testado. Sem push/deploy/conta real/migration/RLS/dependência/serviço externo; tarefas remotas anteriores conservam BLOCKED/REWORK.
- NEXT_ACTION: produzir/licenciar/aprovar os áudios e artes listados; overlays V2 exigem aprovação humana por corpo em tarefa própria. Esta entrega técnica/visual local está concluída.
