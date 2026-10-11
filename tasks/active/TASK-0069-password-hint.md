# TASK-0069 — Dica de senha no cadastro
ID: TASK-0069
TITLE: Orientação de senha e preferência permanente de publicação
OBJECTIVE: Mostrar o requisito real de senha antes do cadastro e publicar.
PRIORITY: P2 Normal
STATUS: ACTIVE
SCOPE: AuthScreen, estilo da dica, contexto global e contrato; validação e publicação no Vercel existente.
OUT_OF_SCOPE: Supabase/configuração, regras de senha, dados, dependências e trabalho anterior.
DEPENDENCIES: TASK-0068
ASSIGNED_AGENT: FRONTEND; QA/Security pelo autor.
REQUIRED_CONTEXT: GLOBAL_CONTEXT, CURRENT_STATE, WORKFLOW, RULES, SECURITY, frontend, RELEASE_POLICY.
SECURITY_CONSIDERATIONS: Não mudar validação ou Auth; não registrar senhas. Publicação seletiva.
ACCEPTANCE_CRITERIA:
- Dica visível no cadastro e associada ao campo por aria-describedby, sem impor requisitos fictícios.
- Login existente preservado, sem overflow móvel; produção READY e verificada.
- Orientação de sempre publicar alterações aprovadas persistida no contexto.
TEST_PLAN: Testes Auth existentes, lint/typecheck/build e navegador em320/390/660/1280px, local e público.
DEFINITION_OF_DONE: Gates aprovados, produção verificada e memória atualizada.

VALIDATION: Lint/typecheck/build PASS;6 testes Auth PASS;8 casos locais login/cadastro320/390/660/1280 PASS, dica visível e aria-describedby correto, sem overflow; captura390 revisada. Mídia209/727/8hash PASS. REWORK: dica movida para fora do label para preservar nome acessível Senha; typecheck repetido sequencialmente após disputa de geração Next com build. SECURITY: diff restrito, sem secrets/dados/alteração de requisitos de senha; revisão pelo autor. Evidências build/task-0069-password-hint. Publicação em andamento.
