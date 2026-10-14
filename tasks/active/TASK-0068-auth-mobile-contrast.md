# TASK-0068 — Legibilidade dos botões de acesso
ID: TASK-0068
TITLE: Corrigir contraste dos botões secundários de entrada e cadastro
OBJECTIVE: Tornar legíveis as opções de cadastro e acesso local mostradas na captura do usuário.
PRIORITY: P1 High
STATUS: ACTIVE
SCOPE: CSS da tela Auth; validação em navegador; documentação e publicação no Vercel existente conforme RELEASE_POLICY.
OUT_OF_SCOPE: Supabase, autenticação, dados, progresso, dependências e alterações anteriores.
DEPENDENCIES: TASK-0067 publicada
ASSIGNED_AGENT: FRONTEND; QA/Security pelo autor, sem revisão independente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT, CURRENT_STATE, WORKFLOW, RULES, SECURITY, TOKEN_POLICY, frontend, RELEASE_POLICY.
SECURITY_CONSIDERATIONS: Alteração exclusiva de cor; revisar diff e staging seletivo, sem dados ou credenciais.
ACCEPTANCE_CRITERIA:
- Botões secundários com contraste WCAG >=4.5:1 nas telas de login e cadastro em celular e desktop.
- Sem overflow horizontal; opções continuam acionáveis.
- Publicação READY e validação pública.
TEST_PLAN:
- Navegador real automatizado, estilos computados, contraste e navegação login/cadastro em 320,390,660 e1280px.
- Lint, typecheck e build.
DEFINITION_OF_DONE:
- Gates aprovados, deploy verificado e memória atualizada; aparelho físico validado pelo usuário.

VALIDATION: Lint/typecheck/build PASS; gates mídia209/727 e8hash preservados;8 casos login/cadastro320/390/660/1280 PASS; contraste11,67:1 e14,34:1; captura390 revisada. UNIT/INTEGRATION N/A: somente cor CSS, comportamento exercitado no navegador sem alterar Auth. SECURITY: autor revisou diff de uma linha, sem dados/secrets/dependências. Evidências build/task-0068-auth-contrast. Publicação em andamento.
