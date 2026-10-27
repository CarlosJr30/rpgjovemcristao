# RPG-DEV-008 — Recuperação do Modo História

ID: RPG-DEV-008
TITLE: Recuperar Jornada, Missões e minigames em entregas progressivas
OBJECTIVE: Recuperar conteúdo existente com consulta de progresso persistido e atividades sem economia.
PRIORITY: P1 High
STATUS: ACTIVE
SCOPE: 008A mapa/mundos/fases/progresso somente leitura; 008B atividades existentes, sem persistência até autoridade aprovada; 008C Fuga da Serpente e minigames existentes aprovados, sem recompensas. Auditoria, implementação delimitada em apps/web, testes, documentação, GitHub/Preview/produção conforme RELEASE_POLICY.
OUT_OF_SCOPE: Equipamentos/PR #12, Arena, Torre, Loja, aquisição, baús, XP/moedas/recompensas, novas histórias, alteração de jogadores para testes.
DEPENDENCIES: main 0357b444e191e60ae3d95b58f0ea9b80ff72ad89, RPG-DEV-007 publicado. Branch documental 007 preservada separadamente.
ASSIGNED_AGENT: autor assume Orchestrator, Frontend, Backend, Database, Game Designer, Biblical Content, QA, Security e DevOps nos limites deste contrato; não há delegação/revisão independente. Database autorizado a preparar migration mínima em supabase/migrations e ensaio isolado: somente SELECT authenticated na tabela story_progress existente, condicionado à RLS/policy de dono exatas. Sem novas escritas, políticas ou funções.
REQUIRED_CONTEXT: .agent/{GLOBAL_CONTEXT,WORKFLOW,RULES,SECURITY,RELEASE_POLICY}.md; memória; relatório final 007 no worktree preservado; catálogo e componentes existentes; perfis e skills seletivos.
SECURITY_CONSIDERATIONS: Auth/RLS e isolamento por conta/avatar; consulta fresca sem cache como autoridade; nenhuma concessão. Teste Chat A apenas leitura no avatar ativo nível 50 autorizado anteriormente; demais atividades em TEST ou isolado. Preservar os três worktrees anteriores e todos os dados. Sem novos recursos pagos/dependências de produto.
ACCEPTANCE_CRITERIA:
- Preservar nove mundos e cronologia existente, distinguir preparado/indisponível de concluído.
- Consulta somente de progresso persistido próprio, sem promover progresso local ou fabricar conclusão.
- Missões individuais independentes da aprovação da Guilda; desafios da Guilda preservados.
- Atividades sem autoridade validada explicitamente demonstrativas, sem escrita ou recompensa.
- Menu original de onze opções e visual existente; desktop/celular, teclado, carregamento/erro/vazio.
- Gates de cada entrega independentes; produção somente após gates obrigatórios aprovados.
TEST_PLAN:
- Unitários relevantes/integrados, lint/types/build, protocolo e CI no SHA candidato.
- PostgreSQL/API pertinentes, Auth/RLS/isolar conta/avatar, hashes/contagens antes/depois.
- Chromium/WebKit local e Preview real, preservar falhas e distinguir fixtures de prova hospedada.
- Regressão 007, Herói/Guilda/EBD, rotas bloqueadas e ausência de operações econômicas.
- Verificar ambiente, compatibilidade, recuperação antes de qualquer DDL/merge; confirmar deploy e fluxos oficiais depois.
DEFINITION_OF_DONE:
- Aceite e QA/Security pelo autor comprovados, relatório/evidências/memória atualizados; não converter PENDING/SKIP em PASS.

## Preparação — 27/10/2026

Main remoto 0357b44 confirmado. PR #12 open/draft, head 61b7177, não integrada. Novo worktree/branch codex/rpg-dev-008a-journey sobre main atualizado; worktrees anteriores preservados. PROD tem 7 migrations e TEST 26; nenhuma aplicada nesta tarefa. Alias oficial aponta para dpl_9fGNqsrMoZe3D6qSFQWQdy4Byu8N, conforme fechamento 007. Auditoria em andamento; nenhum gate runtime aprovado ainda.

## SELF VALIDATE / QA / SECURITY — 008A

851 unitários PASS / 74 SKIP; lint/types/build PASS; protocolo25 PASS; PG isolado16 PASS (inclui recuperação). Browser sintético24 RSC/222 UI/48 Guilda PASS; primeira falha WebKit de fetch preservada e reexecução identificada, sem alteração de assertions/Auth/CORS. QA/Security/React/editorial pelo autor. Parecer e limites no relatório008; sem revisão independente. Hashes38PROD/40TEST iguais a007; manifesto52/0 divergências. Sessão normal autorizada PROD/ativo50 confirmada, sem avatar antigo. Migration SELECT-only preparada/isolada, não aplicada remotamente. CI/Preview real e gates produtivos PENDING; 008B/C em auditoria, não liberados.

## ACEITE 008A — DONE / DEPLOY_COMPLETE

PR15/candidato4a6ed0f/merge bd9dcb7373fcee2f22fd62e952aa25f9558beb0a; CI push40485830229/PR40485867782/main40488432305 success. TEST migration20261027101252/PROD20261027102522 somente SELECT sob RLS existente; recuperação ensaiada antes. Preview141checks reais, API PROD12antes/13depois, UI PROD150antes/150após promoção PASS. Deployment dpl_95c8SJGkM4hUJggpTpX76ER338ga READY/production/alias oficial exato. autoAssignCustomDomains true restaurado, proteções mantidas. Hashes38PROD/40TEST iguais ao baseline;75funções/39policies e demais estruturas preservadas exceto grant aprovado. Evidência008A e relatório vinculados. Não se infere positivo hospedado de progresso canônico vazio nem aparelho físico de WebKit.

Tarefa agregadora permanece ACTIVE para008B/C em worktrees/branches próprios; não há liberação de atividades/economia/PR12 por008A. Revisão documental deste fechamento pelo autor; sem deploy adicional de documentação.
