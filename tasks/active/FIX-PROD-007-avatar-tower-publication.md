# FIX-PROD-007 — Avatar, Torre e publicação
ID: FIX-PROD-007
STATUS: BLOCKED
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

## Evidências de fechamento
- DONE: Composição3 integrada para corpo exato; quatro composições/PNGs anteriores preservados.10testesavatar,727unitPASS/66SKIP,lint/types/build/protocolo25PASS,36PG finaisPASS. QA/Security pelo autor.
- DONE nos cenários executados: GitHub23f95ae02a332665405e63951e4dcb80a72061a9,CI40098578298success;PreviewREADYdpl_832W4mCPLH5Gi8swgFQqtQHnmGSC,18API/12browserPASS. Rodadas iniciaisPG/WebKitfalhas preservadas e corrigida sincronização do harness; nenhuma negação econômica enfraquecida.
- DONE em isolamento: reutilizados10PG006/deterministic-floors,duas réplicas1–7/dois campeões/430XP215moedas1épico por réplica; fontes inalteradas,não prova hospedada.
- BLOCKED: reconciliação16XP/6moedas sem evento canônico; créditosTorre false; sessão alvo inacessível por kernelassets e liderança não executada; demais peças/troca positiva/celular físico sem evidência disponível.
- Dados:8hashes de conjuntos de jogo antes/depois iguais,nenhuma migration aplicada/repetida,sem concessões. Produção/main5edc93fREADY intactos,semDEPLOY_COMPLETE.
- Relatório completo: docs/architecture/FIX-PROD-007-REPORT.md; caminhos privados build/fix-prod-007. Aprovação humana nova registrada em FIX-PROD-007-HUMAN-COMPOSITION-APPROVAL.json; pendência histórica006 superada somente para a couraça aprovada.
