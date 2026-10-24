# FIX-PROD-003 — Homologação e Publicação

ID: FIX-PROD-003
TITLE: Homologar equipamentos/cartas e validar combate hospedado antes da promoção
OBJECTIVE: Avançar a candidata aefb4f0 com validação real no Supabase de testes e Preview, preservando produção até todos os gates.
PRIORITY: P1 High
STATUS: ACTIVE
SCOPE: Revisão dos contratos congelados; recuperação apropriada ao escopo; migration incremental de equipamentos e homologação técnica do catálogo no projeto de testes; testes reais de Auth/RLS/economia/equipamentos/Arena/Torre com as contas de teste existentes; configuração exclusiva de Preview; preparação administrativa de liderança; código estritamente necessário, testes, documentação, GitHub/CI e publicação condicionada aos gates.
OUT_OF_SCOPE: Créditos manuais ou grant automático de cartas/prêmios para contornar controles; progressão fictícia de produção; concessão de service_role à conta; transferência de dados entre avatares; desativação de Auth/RLS/economia; dados reais alterados apenas para testes; exclusão/reset/recriação de tabelas/contas; ampliação silenciosa do escopo visual ou de balanceamento.
DEPENDENCIES: Acessos técnicos válidos; recuperação verificada antes de DDL; identidades reais de teste; homologação de catálogo/aquisição e recompensas; UID autenticado do Teste Chat A antes de qualquer alteração de liderança; gates reais da RELEASE_POLICY.
ASSIGNED_AGENT: Orquestrador assume Database/Backend/Frontend/DevOps/QA/Security/GameDesigner no escopo acima, sem subagentes. Autoriza-se ampliação desses perfis para os caminhos e operações estritamente descritos pelo pedido atual; uso apenas interno de configuração protegida já existente para as contas/projeto de teste, sem exibir credenciais.
REQUIRED_CONTEXT: RELEASE_POLICY; FIX-PROD-002-REPORT; DEPLOY-001/002-REPORT; catálogo congelado e contratos de Arena/Torre/economia; WORKFLOW/RULES/SECURITY/ORCHESTRATOR/TOKEN_POLICY e perfis necessários.
SECURITY_CONSIDERATIONS: Confirmar projetos e hashes; não presumir estado histórico; preservar snapshots/trabalhos; jamais versionar sessions/secrets. Homologação de teste não implica aprovação econômica de produção. Compensação/rollback deve preservar recibos e nunca reabrir grants legados.
ACCEPTANCE_CRITERIA:
- Equipamentos com JWT real, owner/slots/CAS/conflitos/conta/atributos/persistência e aparência validados, ou bloqueio explícito por corpo não aprovado.
- Sete definições distintas congeladas revisadas e catálogo de teste homologado; aquisição pelo evento autorizado existente, posse e proteção contra grants de browser.
- Arena completa somente DONE após batalha real autorizada hospedada; Torre somente DONE após sete andares/campeão/recompensas autorizadas com progresso persistido.
- Economia positiva/negativa, RLS/RPC/servidor/idempotência/concorrência/recibos reais sem crédito manual para forçar sucesso.
- Liderança somente após UID/IDs/associações confirmados e processo administrativo auditável; dados dos avatares preservados.
- CI do SHA exato, Preview READY e gates reais aprovados antes de qualquer SQL/deploy de produção; relatório FIX-PROD-003-REPORT com DONE/BLOCKED/REWORK por etapa.
TEST_PLAN:
- Reusar verificações já comprovadas e não afetadas; executar unit/integration/PG, Auth/RLS/econômicos/equipamentos/Arena/Torre/concorrência/navegador, lint/typecheck/build aplicáveis à alteração, distinguindo mocks de testes reais.
- Backup/recuperação do escopo incremental em clone isolado antes de aplicar somente migrations pendentes em testes; SQL produtivo proibido até validação hospedada.
DEFINITION_OF_DONE:
- Todos os gates e aceites observados, confirmação remota e memória/relatório atualizados; ausência de evidência obrigatória mantém BLOCKED, falha leva a REWORK.

## Diagnóstico inicial

- Fetch confirma main5edc93f e candidata remota aefb4f0. Vercel produção e Preview continuam READY nesses SHAs.
- Supabase testes wkdvdzfkbwvhyjmamrsg/rpgjovemcristao-test ACTIVE_HEALTHY, protocolo3,17migrations,0RLSoff,0Travelers/0inventory/0guilds/0catalog; quatro usuários confirmados não anônimos.
- Artefatos DEPLOY-003 contêm recibo de Auth real e configuração de teste/credenciais DPAPI próprias; serão verificadas por uso sem exibição de valores. Não inferir acesso ao Teste Chat A de produção a partir dessas contas isoladas.
- Controle do Chrome ainda falha ao inicializar kernel assets; não coletar sessões de perfis ou substituir Auth real por claims SQL simulados.
