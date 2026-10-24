# FIX-PROD-003 — Homologação e Publicação

ID: FIX-PROD-003
TITLE: Homologar equipamentos/cartas e validar combate hospedado antes da promoção
OBJECTIVE: Avançar a candidata aefb4f0 com validação real no Supabase de testes e Preview, preservando produção até todos os gates.
PRIORITY: P1 High
STATUS: BLOCKED
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

## Aceite final — 23/10/2026

DONE: candidato runtime f9f7c36b440010a310e3254d5316e8d1cdaed796 no GitHub; CI40053526036 success; Preview dpl_C4FfjuYW47CKguqTPTkmWzLDJe9v READY no SHA exato. Quatro migrations aplicadas uma vez somente em wkdvdzfkbwvhyjmamrsg; catálogo remoto sete definições igual ao manifesto. Snapshot/recuperação verificados, 6 testes PG PASS; 704 unit PASS, protocolo25/lint/types/build PASS; Auth real4, equipamentos23, Guilda/EBD13, Arena29, navegador14 e recibos finais6 verificações PASS. QA/Security pelo autor, sem revisão independente alegada.

Combate real: 17 batalhas encerradas, duas vitórias Arena (16XP/6moedas no total), vitória Torre1 e liberação persistida Torre2, 14 derrotas sem créditos. Recibos somam exatamente o saldo; zero duplicados; replay concorrente e reconexão validados. Nenhum crédito manual, seed forçado, progresso fabricado ou exclusão de derrota.

REWORK resolvido: SQLSTATE40001 em conflitos persistentes causava repetição PostgREST; migration incremental PT409 e mapeamento HTTP409. Leitura PowerShell alterou acentos de descrições; migration incremental test-only restaurou exatamente o manifesto sem mudar itens/posse/recibos. Fixtures com nomes numéricos foram corrigidas apenas nas próprias contas de teste, sem alterações econômicas. Timeouts de harness PG e encoding dos arquivos locais foram corrigidos; evidências anteriores preservadas.

BLOCKED: vitória Torre2, andares3–7/campeão e recompensas da Torre ainda sem contrato homologado; quatro cartas de nível superior não exercitadas em hospedagem; demais positivos econômicos incompletos; aparência e troca real entre dois itens do mesmo slot sem catálogo/posse elegível; UID autenticado e processo auditável do Teste Chat A não confirmados; legado produtivo não reconciliado. Não remover controles para liberar gates.

Produção preservada: main5edc93f, dpl_H9aXo2mnhWvk2PD6BwQowpxeaiVv READY; wspafhlbtlpabypzymjo protocolo3,4migrations/última20261023213654,20Travelers/37inventory/31equipped/0catalog/0RLSoff. Nenhuma escrita/migration/promoção nesta tarefa. Relatório: docs/architecture/FIX-PROD-003-REPORT.md. Condição de retomada: cumprir os cenários bloqueados por meios autorizados e revisar todos os gates antes de produção.
