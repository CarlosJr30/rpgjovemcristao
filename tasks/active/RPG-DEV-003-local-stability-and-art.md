# RPG-DEV-003 — Diagnóstico local WebKit e propostas privadas

ID: RPG-DEV-003
TITLE: Investigar RSC localmente e preparar equipamentos para revisão
OBJECTIVE: Avançar a PR11 sem custos novos e preservar Guilda/EBD produtiva.
PRIORITY: P1 High
STATUS: BLOCKED
SCOPE: Diagnóstico/testes locais WebKit/RSC, correção somente de causa comprovada; propostas visuais e integração das quatro composições expressamente aprovadas por Carlos neste corpo (resposta: "Aprovar as quatro propostas neste corpo"), preservando as seis anteriores; investigação econômica somente leitura; documentação/memória na branch codex/rpg-dev-001. A ampliação do perfil Frontend/Assets cobre data/render/gate e testes dessa integração exata; não permite créditos, aquisição ou deploy produtivo.
OUT_OF_SCOPE: Outra PR; merge/deploy produtivo; recursos com cobrança; mudança Auth/CORS/RLS/proteção por hipótese; ajustes de saldo/recibos; integrar arte sem aprovação; alterar seis composições homologadas.
ASSIGNED_AGENT: Agente principal, perfis Frontend, QA, Security e Assets; sem subagentes e sem alegar revisão independente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT, CURRENT_STATE, RELEASE_POLICY, regras/segurança/workflow, RPG-DEV-002-REPORT e fontes mínimas recuperadas por cenário.
SECURITY_CONSIDERATIONS: Fixtures locais bloqueiam acesso externo, contas/credenciais produtivas não usadas nos testes. Arte privada fora de public/runtime. Economia sem escritas. Nenhuma cobrança/provisionamento autorizado.
ACCEPTANCE_CRITERIA:
- Matriz local controlada distingue navegação, prefetch e interceptação, registra HTTP/erros sem relaxar proteções.
- Quatro propostas visuais concretas revisadas pelo autor e apresentadas para decisão humana, sem integração.
- Preservar testes Arena/Torre, assets homologados e dados; investigar nova evidência econômica disponível sem forçar reconciliação.
- Testes afetados, lint/types/build e CI do SHA exato; mesma PR11 em rascunho.
- Relatório docs/architecture/RPG-DEV-003-REPORT.md e memória com DONE/BLOCKED/REWORK.
TEST_PLAN: WebKit/Chromium em Next local de produção com backend sintético fechado em loopback; controle de transporte/navegação/atraso RSC. Unitários/gates completos; reutilizar provas inalteradas Arena/Torre/PG, sem SKIP→PASS. Inspeção visual desktop/móvel e hashes.
DEFINITION_OF_DONE: Evidências e relatório persistidos, CI conferido, aprovação das artes explicitamente pendente quando aplicável. Bloqueios críticos mantêm produção intacta.

## Execução e aceite

DONE: quatro propostas aprovadas por Carlos e integradas exclusivamente no corpo female_long_blue_dark, recibo RPG-DEV-003-HUMAN-VISUAL-APPROVAL.json. Seis composições anteriores preservadas; somente dois PNGs novos e reaproveitamento das artes existentes de escudo/medalhão. Gate9hashes/10composições. Nenhuma concessão econômica.

SELF VALIDATE/QA pelo autor: 777unitPASS/74SKIP,18unitvisuais dedicadosPASS,4browserEquipPASS desktop/WebKit móvel; lint/types/build/protocolo25PASS. PG74 e seis cenários Arena/Torre anteriores reutilizados onde código/motor/SQL não mudaram. Capturas de integração desktop/móvel inspecionadas. Nova aprovação não é homologação de aquisição, variantes ou outros corpos.

WebKit: duas matrizes autenticadas locais com24fluxos cada; todos terminaram funcionalmente, mas nove execuções WebKit por matriz tiveram erroRSC durantegoto. Reproduzido também com HTTP nativo sem interceptação/Vercel. Controle público12fluxos sem sessão cancelouRSC sem erro; controle com rede estabilizada6fluxos/42checks sem erro. Causa interna ainda não isolada; não filtrar erros nem declarar estabilidade hospedada. Fontes/limites no relatório.

Security/React pelo autor: fontes/testes limitados, sem revisão independente alegada. Dados de Auth exclusivamente sintéticos em loopback. CORS do simulador só para origem local; produto/Supabase/Vercel inalterados. Oito datasets iguais em TEST e PROD, consultas só leitura. Arte scoped e propriedade/fallback validados. Nenhuma dependência, migration, recurso com cobrança, mudança de saldo ou privilégio.

BLOCKED: proveniência16XP6moedas continua sem recibo/evento contemporâneo; catálogo/aquisição/recompensas/hospedagem isolada pendentes. ProduçãoGuilda/EBD808433aREADY/7HTTPesperados preservados. PR11 permanece em rascunho. Commit técnicoc1ffbb6 e CI exato no relatório docs/architecture/RPG-DEV-003-REPORT.md; não há DEPLOY_COMPLETE. Não criar ambiente pago para eliminar bloqueio.
