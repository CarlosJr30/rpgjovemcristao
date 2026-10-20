# TASK-CONSOLIDATION-001 — Integração geral e preparação da Preview isolada

ID: TASK-CONSOLIDATION-001
TITLE: Consolidar ancestralidade0080–0089 e preparar caminho mínimo de Preview segura
OBJECTIVE: Reunir somente implementações locais aprovadas, verificar integrações cruzadas e preparar gates operacionais sem tocar produção/remoto.
PRIORITY: P1 High
STATUS: BLOCKED
SCOPE: Branch/worktree próprios codex/consolidation-preview-001 em build/task-consolidation-001/checkout, base auditada6a683f4b690e54c19a56aaaf41e89861faa6e510. Novos testes/config/fixtures de consolidação, incluindo packages/database/tests/consolidation-001.postgres.test.mjs, scripts locais de inspeção/teste sem operação remota, docs/architecture e docs/security próprios, contrato/checklist e prefixo de memória raiz. Orquestrador assume Architect/DevOps/Full-stack/QA/Security, sem subagentes; permite leitura seletiva das fronteiras Auth/Story/Guilda/EBD/Arena/Torre/Baús/Áudio/SQL/CI. Correção runtime somente após falha de integração reproduzida e registro dos caminhos/causa neste contrato, dentro do pedido.
OUT_OF_SCOPE: Push/deploy/fetch/merge/cherry-pick automático/main/remoto/Supabase real/migration remota/dados reais/recursos pagos/serviços/dependências novas, economia0078 fora de contrato, conteúdo/cartas/mídia/overlays novos, enfraquecimento de segurança, retomada de auditoria de dependências encerrada, edição de contratos anteriores ou importação de pendências não versionadas.
DEPENDENCIES: Todos os HEADs0080–0089 são ancestrais da base;0081–0089 limpos. Checkout0080 tem sete arquivos pendentes que ficam preservados e não incorporados. Estado hospedado atual não confirmado neste contexto sem autorização remota. Catálogos de cartas/música/efeitos vazios; conteúdo, autoridade e gates econômicos anteriores persistem por funcionalidade.
ASSIGNED_AGENT: Autor assume perfis necessários, QA/Security pelo autor sem independência.
REQUIRED_CONTEXT: Pedido consolidação01, AGENTS/GLOBAL/CURRENT/WORKFLOW/ORCHESTRATOR/RULES/SECURITY/TOKEN_POLICY, perfis/skills locais selecionados, recibos/ancestralidade e fronteiras estritamente necessárias. Skills Supabase/Bootstrap orientam plano; nenhuma operação externa, provisionamento ou instalação inferida dessas skills está autorizada.
SECURITY_CONSIDERATIONS: Testes locais com SDK/DataAPI e identidades sintéticas não comprovam Auth/RLS hospedados. Não usar produção nem apresentar mocks/recibos locais como autoridade. Revisar superfícies legadas de concessão, isolamento Guilda/EBD, convites e catálogo/fixtures. Logs sem credenciais. Classificar P0–P3 pelo impacto e delimitar gates por funcionalidade.
ACCEPTANCE_CRITERIA:
- Ancestralidade, HEAD documental/implementação, status e divergência main registrados; nada reaplicado desnecessariamente.
- Integrações cruzadas positivas/negativas verificadas com evidências novas e reutilizadas distinguidas; correções apenas se reproduzidas.
- Propostas SQL/journal/ordem/constraints/RLS/RPC/cutover/rollback revisados; teste PostgreSQL cumulativo local se necessário, sem aplicar SQL remoto.
- Matriz P0–P3 e escopo mínimo de Preview segura explicitam o que funciona sem recompensa, fica pendente ou exige autoridade/desabilitação.
- Checklist Supabase/Vercel/env/APP_BASE_URL/Auth/RLS/CI/SHA/proteção/Git/hook preparado, sem remoto.
- Lint/tipos/build/testes pertinentes e Security; relatório12 itens, memória preservada, commits locais e recibo verificável.
TEST_PLAN: Reutilizar recibos0080–0089; novos cenários browser de navegação/identidade e fronteiras cruzadas em desktop/mobile, sem repetir todas as suítes. Unitários selecionados de permissões/posse/recibos/conclusão/áudio. PostgreSQL cumulativo offline para propostas0080–0083 e ACL/cutover se a auditoria mostrar risco não coberto pelas execuções isoladas anteriores. Lint/TypeScript/build, scan de fixtures/protótipos/secrets e auditoria de paths/refs/hashes/preservação.
DEFINITION_OF_DONE: Escopo local completo e comprovado, sem gate obrigatório local falho. Se preparação puder ser aceita com bloqueios externos explícitos, distinguir essa entrega local da disponibilização da Preview. Qualquer impedimento de segurança/integração não resolvido mantém BLOCKED/REWORK com condição concreta. Nenhuma publicação ou equivalência de teste simulado com hospedado.

## Contexto mínimo e plano

- Objetivo: primeira Preview consolidada com máximo de funcionalidades seguras e indisponibilidades explícitas.
- Estado: base6a683f4 inclui0080–0089 e CI herdado; main é ancestral,30 commits adiante; sete pendências0080 e nove paths sujos raiz preservados por hashes fora da branch.
- Próximo: auditar fronteiras e SQL/CI efetivos, selecionar mínimo de testes cruzados e definir gate de disponibilidade por superfície.
- Aceite: relatório com12 itens e checklist preparado, evidências novas reais, gates externos delimitados, checkout próprio limpo e zero operações remotas.

## REWORK autorizado — links Guilda/EBD no cabeçalho

Inspeção da captura `visual-review/guild-mobile.png` reproduziu sobreposição vertical dos links de membros0082 e Escola Bíblica0083. Links inline têm padding/borda de botão, mas não reservam a altura mínima no fluxo de linhas/parágrafo. Orquestrador autoriza somente `apps/web/features/guild-missions/panel.module.css` para dispor esses links do hero sem sobreposição, e assertion geométrica em `tests/e2e/guild-panel.spec.ts`. Não alterar JSX/ações/permissões/SQL/recompensas. Reproduzir teste de bounding boxes antes da correção, build e repetir Guilda/EBD nos três navegadores após correção; inspecionar capturas móveis. Isso é falha de integração visual comprovada, não nova funcionalidade.

## Validação e transições

ACTIVE→VALIDATING→REWORK→ACTIVE→VALIDATING→BLOCKED. Reworks do ensaio: propriedade guildId em vez de guild_id no teste SQL; lista chest_operations vazia em vez de null na fixture; porta3183 compatível com contexto secundário herdado Guilda; query Story concluída antes da navegação; percurso de UI usa links/menu, evitando descarregar frame com prefetch WebKit pendente. Os erros coletados continuam sendo exigidos como lista vazia, sem filtro para ocultar falha. Pequena alteração no teste Story existente permite sincronização explícita, sem tocar progressão.

Falha runtime comprovada: sobreposição de links do hero Guilda/EBD, reproduzida em teste geométrico antes (FAIL). Somente CSS do hero corrigido para inline-flex/altura reservada. Depois seis E2E Guilda/EBD PASS, incluindo caixas sem interseção e alvos44 px; capturas320/390 inspecionadas após correção.

SELF VALIDATE/QA novos:102 testes/15 arquivos direcionados PASS;25protocoloCI PASS/eligible=false;7 nós PostgreSQL cumulativos PASS,13 arquivos reais em ordem. Matriz21 cenários distintos:19 PASS/2 FAIL de cancelamentos WebKit no ciclo completo, Story1 PASS no recheck e percurso final3 PASS; rechecks6Guilda/EBD após CSS PASS. Não somar rechecks como cenários novos nem afirmar uma execução única21/21. Chromium1440/320 e WebKit390. Lint/tipos/build finais PASS; isolamento protótipos948 artefatos/0achado/8 hashes preservados. Testes históricos0080–0089 e auditoria DEV reutilizados, não repetidos integralmente.

Security pelo autor: revisão em docs/security/CONSOLIDATION-001-SECURITY.md. Banco offline nega outro ator/anônimo/permissão EBD e mantém cutover de11 assinaturas antigas. Diagnóstico reproduz XP/saldo próprios mutáveis no baseline, com rollback; P1 herdado não corrigido nem aceito. Nenhum secret/env/serviço/dependência/mídia/recompensa nova. Narrativa editorial N/A. PostgreSQL é local sintético, não confirmação de JWT/RLS hospedados.

## Aceite e checklist

- [x] Ancestralidade0080–0089 e main, HEADs/status/intervalos e sete pendências0080 auditados.
- [x] Worktree própria; nenhuma reaplicação de commits ou importação de trabalho pendente.
- [x] Integrações cruzadas, falha visual, correção mínima, regressões e gates locais documentados.
- [x] Ordem SQL/journal/cutover/rollback revisados e testados cumulativamente; nenhuma migration alterada/aplicada remotamente.
- [x] Relatório12 itens, matriz P0–P3, escopo mínimo e checklist ambiente/env/CI/Vercel preparados.
- [x] QA/Security pelo autor, limitações e evidências novas/reutilizadas diferenciadas.
- [ ] Ambiente externo comprovado, superfície econômica segura/availability e autorização para Preview; permanece BLOCKED.

Relatório: docs/architecture/TASK-CONSOLIDATION-001-REPORT.md; suportes CONSOLIDATION-001-{ANCESTRY,MIGRATION-PLAN,PREVIEW-PLAN}.md. Recibo final/auditorias/logs ignorados em build/task-consolidation-001/. Memória de controle raiz recebe somente prefixo, mantendo o corpo anterior. Commit/HEAD final registrados no fechamento, sem outro teste amplo por mudança documental.

Condição de desbloqueio: autorização específica para inspeção de metadados dos recursos exclusivos de teste, identificação/configuração de backend apropriado, contrato para negar superfícies econômicas não autoritativas e evidências Auth/RLS/cutover reais. Cartas, áudio e conclusão de Story podem permanecer indisponíveis sem bloquear módulos não econômicos seguros; APIs mutáveis não ficam seguras por esconder UI. Nenhum push/deploy/fetch/merge/remoto/main/0078/produção/dado real foi modificado. Não iniciar consolidação02 por inferência.

## Fechamento

Implementação local `e9e74ee1a93d12a1ff44cfbec1f2082a4dc6772e`. Memória raiz recebeu prefixo com corpo anterior preservado byte a byte. Follow-up somente neste contrato e relatório; runtime/testes/SQL/config não alterados após os gates. Recibo final com HEAD/checkout limpo/hashes em build/task-consolidation-001/final-receipt.json. Pedido explícito002 recebido durante o fechamento autoriza a continuação no escopo próprio, sem repetir os seis cenários ou os gates desta entrega; não muda retroativamente os limites001.
