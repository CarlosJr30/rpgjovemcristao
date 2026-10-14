# TASK-0070 — Esclarecer requisitos de senha
ID: TASK-0070
TITLE: Dica explícita de requisitos e sugestões de senha
OBJECTIVE: Informar mínimo de 8 caracteres e ausência de quantidade obrigatória de maiúsculas, números e símbolos.
PRIORITY: P2 Normal
STATUS: ACTIVE
SCOPE: Texto da dica AuthScreen, validação e publicação no Vercel existente.
OUT_OF_SCOPE: Regras de validação, Supabase, dados, estilos, dependências e trabalho anterior.
DEPENDENCIES: TASK-0069
ASSIGNED_AGENT: FRONTEND; QA/Security pelo autor.
REQUIRED_CONTEXT: GLOBAL_CONTEXT, CURRENT_STATE, WORKFLOW, RULES, SECURITY, frontend, RELEASE_POLICY.
SECURITY_CONSIDERATIONS: Somente texto; preservar requisito atual, acessibilidade e dados; diff seletivo sem secrets.
ACCEPTANCE_CRITERIA: Dica explícita, legível no celular, sem overflow; publicação READY/hash/alias e verificação pública.
TEST_PLAN: Testes Auth existentes e build; navegador login/cadastro320/390/660/1280 local e público.
DEFINITION_OF_DONE: Aceite comprovado, gates aplicáveis e memória atualizada.

VALIDATION: Build e TypeScript interno PASS; eslint arquivo alterado PASS;6 testes Auth PASS;8 casos navegador local320/390/660/1280 login/cadastro PASS, dica explícita e acessível semoverflow. Gates mídia209/727/8hash PASS. Security/QA pelo autor: diff somente texto e contrato, sem secrets/dados/regras novas. Integração remota N/A: nenhuma fronteira alterada. Evidências build/task-0070-password-hint-clarity.
