# RPG-DEV-006 — Recuperar Herói e Equipamentos

ID: RPG-DEV-006
TITLE: Recuperar equipamentos existentes com confirmação exclusiva do servidor
OBJECTIVE: Reativar somente Herói/Equipamentos sobre a interface aprovada, reutilizando módulos, RPCs e artes homologadas.
PRIORITY: P1 High
STATUS: ACTIVE
SCOPE: Branch codex/rpg-dev-006 em worktree isolada, base main/produção1a82d2c; apps/web fronteiras de release, navegação, Herói/Equipamentos, sincronização; packages/database/supabase somente migrations mínimas necessárias de equipamento; testes/CI/relatório/memória e publicação conforme RELEASE_POLICY após todos os gates. Autorização explícita do usuário neste pedido. Autor assume Frontend/Backend/Database/QA/Security/DevOps, sem subagentes; amplia os caminhos dos perfis apenas neste escopo autorizado.
OUT_OF_SCOPE: Arena/Torre/Loja/História/compras/baús/recompensas; alterações de arte ou composição aprovada; saldos, itens artificiais PROD, reconciliação manual16XP6moedas; recursos pagos; alterações Auth/CORS/RLS para esconder falha; recriar sistemas existentes.
DEPENDENCIES: RPCs FIX-PROD existentes, inventário legítimo e confirmação do estado TEST/PROD. PR11 já integrada; abrir nova PR controlada.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE/WORKFLOW/RULES/SECURITY/RELEASE_POLICY; relatórios001–004/UI002 e encerramentoUI002; perfis Frontend/Backend/Database/QA/Security/DevOps; skillsSupabase/Vercel.
SECURITY_CONSIDERATIONS: propriedade por auth.uid no servidor; CAS/locks de equipamento; permissões mínimas, RLS ativa, sem escrita direta econômica; sessão/revisão no cliente; requests concorrentes e trocas de conta; isolamento TEST/PROD; nenhum secret versionado.
ACCEPTANCE_CRITERIA:
- Avatar HD, nome/nível/XP/atributos e composições aprovadas preservados, atualização e reload desktop/WebKit móvel.
- Equipar/desequipar/substituir item existente e ler atributos/inventário, somente após confirmação RPC e leitura do servidor.
- Sem duplicar/perder itens, acumular bônus ou operar equipamento alheio; concorrência e logout/login preservam sessão atual.
- Guilda/EBD/Auth e interface original intactos; rotas/APIs/ACLs fora do escopo negadas.
- Unitários/PostgreSQL/API/navegador/lint/types/build/CI executados; Preview TEST real e produção somente após gates completos.
TEST_PLAN: auditar RPC/migrations/dados em ambos ambientes; baseline agregado; regressões locais transacionais e cliente; matrizes reais desktop/WebKit com contas autorizadas, sem criar itens PROD; preservar16XP6moedas; verificar READY/SHA/backend/alias e pós-publicação. SKIP/não executado nunca PASS.
DEFINITION_OF_DONE: todos os critérios do escopo aprovados e release conferida remotamente; documentação/QA/Security pelo autor/memória atualizadas. Falha exige REWORK ou BLOCKED; produção preservada enquanto bloqueada.

INITIAL_STATE_2026_10_26: main1a82d2c e produção dpl_CJFBMXjTKfm7nRt76FL8BLJLM87M/READY conferidos; Supabase PROD wspafhlbtlpabypzymjo e TEST wkdvdzfkbwvhyjmamrsg ACTIVE_HEALTHY. PROD6 migrations, TEST24; owned_equipment somente TEST e bloqueado por release anterior; nenhuma mutação remota ou migration desta tarefa nesta etapa.
