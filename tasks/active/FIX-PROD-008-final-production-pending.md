# FIX-PROD-008 — Pendências finais de produção
ID: FIX-PROD-008
STATUS: BLOCKED
PRIORITY: P1
OBJECTIVE: Investigar bloqueios restantes007 e executar somente correções e validações sustentadas por evidência.
SCOPE: Auditoria somente leitura de recibos/eventos/identidade/catálogo; verificar acesso autenticado e mecanismo administrativo; revisar peças existentes sem ativar artes não aprovadas; fluxos hospedados autorizados sem concessões artificiais; relatório, memória, GitHub/CI e release após gates completos.
OUT_OF_SCOPE: Ajustes econômicos manuais, inventário fabricado, nova homologação implícita, alterações do avatar antigo, bypass Auth/RLS ou reset de produção.
ASSIGNED_AGENT: Principal, assumindo Database, Frontend, QA, Security e operação; sem subagentes ou revisão independente.
DEPENDENCIES: RELEASE_POLICY.md; FIX-PROD-007-REPORT.md;23f95ae/ccfa523 confirmados; sessão alvo e evidência econômica para ações dependentes.
ACCEPTANCE_CRITERIA:
- Origem16XP/6moedas comprovada ou BLOCKED com rastreabilidade; nenhum saldo alterado.
- Identidade e processo administrativo comprovados antes de liderança; preservar avatar antigo.
- Cinco composições preservadas; outras peças/troca/persistência e fluxos hospedados classificados por execução real.
- Não repetir simulações válidas; GitHub/CI e ambientes conferidos; nenhuma promoção com gate pendente.
TEST_PLAN: SELECTs em ambientes explicitamente identificados; inspeção dos contratos/artefatos; testes afetados ou reutilização comprovada; conferência Preview/produção e CI exato; revisão documental/segurança pelo autor.
SECURITY_CONSIDERATIONS: Não ler perfis/cookies/tokens do Chrome; não extrair secrets; dados reais somente leitura; logs sanitizados.
DEFINITION_OF_DONE: Todos os critérios comprovados e docs/architecture/FIX-PROD-008-REPORT.md/memória atualizados; pendências indispensáveis mantêm BLOCKED.

## Fechamento
- DONE: preparação/commits/ambientes e cinco composições preservados; gate213arquivosPASS. QA/Security documental pelo autor, sem revisão independente.
- DONE no cenário real executado:16checks Torre2 na Preview23f95ae;derrota legítima rodada7,batalha90c11431-9190-433d-91c2-f1fb2972fffc/reciboafee9700-f7c1-4ef1-9d46-aaa963737d08;0XP/0moedas/0baús,progresso2,reconexão/replay conferidos. Parou na primeira derrota.
- DONE: hashes dos oito conjuntos anteriores iguais, excluindo somente a nova batalha/recibo autorizadosTEST.21batalhas23recibos16XP6moedas0claims/políticafalse;nenhuma escritaPROD.
- BLOCKED: origem16/6 produtivos não comprovada,apesar de hipótese de2treinos8/3;liderança semgetUser por kernelassets;vitórias hospedadas2–7/campeão e troca positiva sem segundo item homologado.
- REWORK: elmo/escudo/botas/medalhão NEEDS_NEW_OVERLAY. Espada: usuário respondeu “Requer ajuste na espada”; proposta não aprovada para esse corpo. Solicitado detalhamento do ajuste; sem ativação. Couraça3 e quatro composições anteriores intactas.
- Sem runtime/migration/DDL/dependência nova;testes007 válidos727unit/36PG/18API/12browser/lint/types/build/protocolo25 e10PG006 preservados,sem nova execução alegada.
- Preview00723f95aeREADY,CI40098578298success;ccfa523CI40099363235success. Produção/main5edc93fREADY preservados. SemDEPLOY_COMPLETE.
- Relatório: docs/architecture/FIX-PROD-008-REPORT.md; evidências privadas build/fix-prod-008. Pendências e condições de desbloqueio detalhadas no relatório.
