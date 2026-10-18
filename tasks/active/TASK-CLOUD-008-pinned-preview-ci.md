# TASK-CLOUD-008 — Release por SHA e preparação do CI oficial

ID: TASK-CLOUD-008
OBJECTIVE: Publicar exatamente o commit aprovado e preparar CI em branches/PRs, checks de merge e plano de produção/rollback, sem publicar produção.
PRIORITY: P1 High
STATUS: ACTIVE
SCOPE: .github/workflows, scripts/ci, apps/web/vercel.json, documentação/contrato/memória; worktrees isolados, branches codex/, PRs revisáveis sem merge; Preview no projeto/equipe já existentes, somente após validação. Inspeção de metadados de credenciais e regras; configurações de CI dentro do plano vigente. DEVOPS/QA/SECURITY assumidos pelo orquestrador e ampliados explicitamente apenas a esse recorte, conforme pedido do usuário.
OUT_OF_SCOPE: Deploy/merge em produção ou main, Supabase/SQL/dados reais, jogo/arte/balanceamento, coletar ou transportar tokens pessoais para CI, novos serviços/dependências sem necessidade demonstrada. Preservar o fluxo CLOUD-007 até haver substituto validado.
DEPENDENCIES: CLOUD-007 concluída; eventual autenticação de deploy configurada pelo usuário no ambiente protegido do GitHub.
ASSIGNED_AGENT: Orquestrador assume DEVOPS/QA/SECURITY, revisão pelo autor, sem independência.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE/WORKFLOW/RULES/SECURITY; CLOUD-007; skills vercel:deployments-cicd/vercel-cli.
SECURITY_CONSIDERATIONS: SHA imutável, destino Preview fixo, validação de fonte e resultado, sem retry de POST, credenciais só no job autorizado sem execução do código do PR; Actions fixadas por SHA; forks sem secrets. Nenhum token em arquivo/log/prompt. Credenciais novas de CI devem ser configuradas diretamente pelo usuário, conforme a skill.
ACCEPTANCE_CRITERIA:
- API de deploy aceita SHA fixo; HEAD da branch pode avançar sem trocar o commit publicado.
- Falha/ausência de validação e divergência de SHA/target impedem publicação/aceite.
- Workflow oficial de qualidade cobre branches/PRs, com check estável para proteção de main, preparado em PR separado de main sem código de jogo.
- Plano de instalação dos checks e de produção/rollback concreto; nada publicado em produção.
- Código/config testados, CI real e Preview verificados quando credenciais disponíveis; pendências explícitas sem declarar ativação não comprovada.
TEST_PLAN: Testes de concorrência, destino errado, failure/timeout/duplicação; YAML/permissões/secret scan; CI Linux no GitHub; Preview SHA/READY/isolamento; inspeção de preservação de produção.
DEFINITION_OF_DONE: Critérios comprovados, QA/Security pelo autor, documentação e memória atualizadas. Falha gera REWORK; credencial/permissão indispensável ausente gera BLOCKED com desbloqueio preciso.
