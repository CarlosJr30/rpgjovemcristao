# DEPLOY-001 — branch consolidada e CI por SHA

ID: DEPLOY-001
TITLE: Publicação controlada da integração no GitHub
OBJECTIVE: Publicar somente codex/deploy-consolidated-001 e comprovar CI do SHA exato, sem deploy ou configuração de serviços.
PRIORITY: P1 High
STATUS: VALIDATING
SCOPE: Worktree build/deploy-001/checkout sobre fechamento006 limpo8a470d20558c993f5f954bbc6a67776c9f583823. Autor assume DevOps/QA/Security; orquestrador autoriza documentação própria em tasks/docs e correções mínimas de falhas comprovadas do CI no código/ensaios pertinentes. Push normal exclusivamente refs/heads/codex/deploy-consolidated-001; leituras Git/GitHub necessárias e observação Actions. Memória raiz somente prefixada.
OUT_OF_SCOPE: Main/merge/force-push/release/deploy, mudanças no gatilho CLOUD-007, configuração Supabase/Vercel/env remota, SQL remoto, dados reais, concessões/homologações, dependências ou implementação de funcionalidades.
DEPENDENCIES: TASK-0080–0089 e CONSOLIDATION-001–006/003A ancestrais; recibo006 conferido. Supabase de teste wkdvdzfkbwvhyjmamrsg/sa-east-1 informado pelo usuário, sem migrations e sem consulta/configuração nesta tarefa.
ASSIGNED_AGENT: DevOps/QA/Security pelo autor, sem independência ou subagentes.
REQUIRED_CONTEXT: AGENTS, GLOBAL_CONTEXT, CURRENT_STATE, WORKFLOW/RULES/SECURITY, perfil/skill DevOps e parecer de segurança, recibo006, ancestralidade001, quality.yml, scripts/ci e apps/web/vercel.json.
SECURITY_CONSIDERATIONS: Auditoria de todos os objetos novos em relação à main remota, ausência de secrets/dados reais/fixtures de produto, escopo de push único, gatilhos de deploy negados e config Git Vercel não-main desabilitada. Não imprimir credenciais; Actions quality sem secrets.
ACCEPTANCE_CRITERIA:
- Recibo006/hashes e ancestralidade das implementações/documentação confirmados; pendências/checkouts preservados.
- Main remota consultada e comparada, sem sobrescrever refs/main ou commits exclusivos.
- Ausência de deploy automático demonstrada antes do push; CLOUD-007 intocado.
- Branch remota exata por push sem force; checkout limpo, SHA remoto igual ao revisado.
- CI observável com gates obrigatórios PASS para o mesmo SHA; falha implica REWORK, ausência de confirmação BLOCKED.
- Relatório12itens/checklist/próximas DEPLOY-002–005 e memória atualizados, separando local006 de CI novo.
TEST_PLAN:
- Preflight do conteúdo e protocolo CI; executar o comando unitário completo do workflow e reusar lint/tipos/build006 se runtime permanecer igual.
- GitHub Actions existente: npm ci, testes, protocolo/isolamento, lint, tipos, build. Registrar run/job/steps/SHA/URL e pinned-preview skipped.
- Confirmar remote main invariável e somente branch autorizada publicada; nenhum endpoint de deploy/configuração/SQL acionado.
DEFINITION_OF_DONE: DONE / CI_APPROVED somente com CI confirmado do SHA publicado; manter gate pendente em VALIDATING/REWORK/BLOCKED quando aplicável. Testes hospedados e produção continuam fora deste contrato.

## Preparação

Snapshot32worktrees/nove pendências/recibo006 antes do trabalho. Fetch apenas refs/heads/main para refs/audit/deploy-001-main, sem atualizar main/origin-main. Main remota5508514828a455ccb0d1ee83d652c419e8643a49 é ancestral da006 (0commits exclusivos). Nenhuma implementação a reconstruir. Skill deployments-cicd aplicada para revisão de gatilhos e limites; proibição expressa de deploy prevalece sobre política geral.

Prepush: 17 HEADs0080–0089/consolidações confirmados ancestrais; 38 commits exclusivos da integração antes dos documentos DEPLOY-001, 335 caminhos diferentes da main, 455 blobs novos de texto auditados em todo o intervalo, nenhum segredo encontrado/novo asset. Workflow/config Vercel idênticos à main remota: quality sem secrets; pinned-preview nega esta branch por expressão explícita; isolamento retorna eligible=false; git.deploymentEnabled **false/maintrue. GitHub enumera três workflows históricos, mas os outros dois paths estão ausentes da main e desta branch; não se presume que serão disparados.

Preflight local: npm test -- --run = 687PASS/28opt-inPGskip em109arquivos aprovados/1ignorado; 25testes scripts/ci PASS. Sem alteração de runtime, gates lint/tipos/build/E2E006 reutilizados localmente; novo CI remoto obrigatório ainda pendente. [Parecer](../../docs/security/DEPLOY-001-PREPUSH-SECURITY.md), [encaminhamento](../../docs/architecture/DEPLOY-001-HANDOFF-CHECKLIST.md). Recebido ref de teste do usuário como dado, sem leitura/configuração Supabase ou Vercel.
