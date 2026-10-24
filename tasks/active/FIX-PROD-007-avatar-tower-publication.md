# FIX-PROD-007 — Avatar, Torre e publicação
ID: FIX-PROD-007
STATUS: ACTIVE
PRIORITY: P1
OBJECTIVE: Integrar a composição 3 aprovada, preservar quatro composições e validar publicação com evidência real.
SCOPE: Resolver e renderizar couraça no corpo female_long_blue_dark exato; registro de aprovação, gate e testes; investigação somente leitura; GitHub/CI e Preview autorizados pelo usuário. Torre006 isolada reutilizada quando válida.
OUT_OF_SCOPE: Outras artes, concessões reais, homologação econômica implícita, ajustes de saldo, bypass Auth/RLS, promoção sem identidade comprovada.
ASSIGNED_AGENT: Agente principal assumindo Frontend, QA, Security e operação, sem revisão independente.
DEPENDENCIES: FIX-PROD-006, RELEASE_POLICY.md; produção bloqueada até todos os gates.
SECURITY_CONSIDERATIONS: Escopo visual por identidade exata, propriedade e fallback preservados; dados reais somente leitura.
ACCEPTANCE_CRITERIA:
- Composição 3 do corpo aprovado e quatro composições anteriores preservadas; desktop/mobile, atributos/persistência e negações testados.
- Torre, economia e liderança classificados com evidências e limitações; nenhuma simulação tratada como execução hospedada.
- Unit/PG/API/browser/lint/types/build/CI e Preview no SHA exato; produção somente após gates completos.
TEST_PLAN: Regressões do resolver/componente, navegador local e hospedado, suíte completa, PG006 válido, conferência remota e preservação de dados.
DEFINITION_OF_DONE: Aceite comprovado, relatório docs/architecture/FIX-PROD-007-REPORT.md e memória atualizados. Bloqueios mantêm STATUS BLOCKED.
