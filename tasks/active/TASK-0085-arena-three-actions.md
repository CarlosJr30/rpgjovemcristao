# TASK-0085 — Arena: Atacar, Defender, Cartas
ID: TASK-0085
TITLE: Simplificação da Arena e integração dos especiais (contexto05/09)
OBJECTIVE: Canal único de especiais pelas sete cartas, preservando motor, Foco e equipamentos.
PRIORITY: P2 Normal
STATUS: BLOCKED
SCOPE: arena-combat-v2 e contratos de comando, UI Arena/arena-deck, replay local e compatibilidade, testes direcionados, especificação de homologação, parecer e memória próprios.
OUT_OF_SCOPE: main/merge/push/deploy/remoto/SQL/dados reais; economia e contratos0078/0080–0084, catálogo/concessões fictícias, aquisição, dependências/assets, Torre/PvP, rebalanceamento/cooldown novo, descrições numéricas0086.
DEPENDENCIES: Runtime0084 f254349130c7779413b4ae7d3e0438e766955b39; base f5e716560022a1956e4fa13626fad4ea26b195ac difere só em docs. Catálogo/aquisição e autoridade de servidor futuros.
ASSIGNED_AGENT: Autor assume Architect, Game Designer, Frontend, Backend, QA e Security, sem delegação ou revisão independente. Orquestração autoriza somente os caminhos do SCOPE.
REQUIRED_CONTEXT: AGENTS/GLOBAL/CURRENT/WORKFLOW/RULES/SECURITY/TOKEN/ORCHESTRATOR e perfis/skills pertinentes já lidos; pedido05, contrato/relatório0084; ArenaExperience, ArenaStage, ArenaV2 e storage.
SECURITY_CONSIDERATIONS: Comandos de produto negam especiais diretos e batalha sem deck; posse/snapshot/nível/Foco/uso único; replay legado incompatível bloqueado explicitamente sem apagar dados. Estado local não prova combate ou prêmio remoto.
ACCEPTANCE_CRITERIA:
- Somente três ações principais; Cartas abre sete definições congeladas com efeito/custo/disponibilidade/motivo.
- Especial de jogador no produto somente por carta própria do deck, com nível/Foco e consumo após aceite; básicos não consomem cartas.
- API rejeita especial direto/sem deck/rodada ou ID errado/encerrado; preservar IA e interfaces legadas separadas.
- Preservar7/posse/lock/reload/duplicidade/revanche; incompatibilidade antiga explícita preserva bytes.
- Catálogo continua vazio; fixtures só testes. Equipamentos/fórmulas/economia intactos.
- Testes direcionados, lint/tipos/build, desktop/mobile, homologação futura, segurança/checklist/memória com evidências.
TEST_PLAN: Unitários motor/UI/storage, regressões IA/equipamentos; componente Arena real com loader de teste; E2E produto vazio e harness isolado em Chromium1440/320 e WebKit390; scan de bundles/escopo. PostgreSQL N/A sem SQL.
DEFINITION_OF_DONE: Gates locais comprovados. Integral BLOCKED enquanto faltarem catálogo/aquisição e autoridade de servidor; sem alegação de antifraude ou publicação.

## Auditoria anterior à alteração
- Quatro especiais existentes: níveis2/4/6/8, custos2/2/2/3; Foco0–3 e básicos+1. Modificadores de custo/potência preservados.
- Equipamentos rotulados ACTIVE no motor são reforços automáticos da ação correspondente (espada/guarda/discernimento), com usos/cooldowns existentes; botas automáticas em pouca vida e armadura passiva. Nenhum botão ativo de equipamento na Arena normal; não alterar esses gatilhos.
- API0084 aceita especiais diretos. Compatibilidade legada deve ficar fora dos comandos de produto. Loadout legado não representa posse de carta.
- Journal0084 pode conter especiais diretos: não reinterpretar como carta nem reiniciar; bloquear explicitamente e preservar registro. Transcrições só básico/cartas podem continuar se semanticamente compatíveis.
- Catálogo vazio permanece bloqueando combate real. Recompensa local legada aceita estado controlado pelo cliente: bloqueio de segurança integral conhecido; preparar desenho de correção compatível, sem mudar concessões/valores/anti-farm.

## Checklist
- [x] Pedido/base/auditoria/contrato
- [x] Motor/comandos e compatibilidade
- [x] UI e custos/motivos
- [x] QA/Security/checks executados, com bloqueio de autoridade documentado
- [x] Homologação/correção futura/relatório
- [ ] Memória e aceite
- [ ] Catálogo/aquisição/backend autoritativo

## SELF VALIDATE / QA / SECURITY / ACCEPTANCE

Implementação local validada. Integral BLOCKED por catálogo/aquisição ausentes, P1 legado de autoridade econômica e migração posterior dos journals com especial direto. Não declarar DONE ou segurança de concessão remota. QA/Security pelo autor, sem revisão independente.

| Gate | Resultado / evidência |
| --- | --- |
| Unitários/componentes/regressões | PASS68/11 arquivos, unit-final.log; quatro especiais, três controles, foco/nível/custo/uso, equipamento/IA,7/reload/duplicidade/rematch, bloqueio de comandos/legado, replay incompatível com bytes preservados |
| Browser | PASS6/0fail/0skip/retry0, e2e-final.log;3produto autenticado vazio +3harness positivo isolado; Chromium1440/320 e WebKit390, duas abas e revanche |
| Lint / TypeScript / build | PASS lint-final.log / typecheck-initial.log / build-final.log; build também verifica tipos do app após ajustes visuais |
| Visual/acessibilidade | Capturas de produto vazio/controle/usada/nível inspecionadas; sem overflow testado, teclado/Escape/foco e estados acessíveis; dispositivos físicos pendentes |
| Security | Revisão concluída: comando direto corrigido, fixtures isoladas, sem secrets/novas dependências. P1 de confiança em combate/recompensa local OPEN e impede aceite integral; plano compatível preparado, não implementado |
| Preservação | scope-audit.json: paths protegidos sem diff, corpo de combate e settle idênticos à base; root/main/origin local e checkout0084 preservados; production-fixture-scan.log sem marcadores no JS |
| SQL / bíblico | N/A, sem SQL/schema/RLS/conteúdo bíblico novo; sem operação remota ou dados reais |
| Documentação | Relatório12itens, homologação futura e plano autoritativo próprios; contratos0078/0080–0084 intactos |

Reworks: primeira seleção unit usou um caminho de teste legado inexistente, corrigido na rodada68. Primeiros60testes:55PASS/5FAIL; quatro expectativas comparavam snapshots com loadout distinto intencional, uma fixture em dano mínimo não expunha multiplicador. Corrigidos apenas os dados/expectativas de teste; engine8PASS, rodada final68PASS. Revisão visual ajustou contraste/ordem do painel de produto e contraste/Arial apenas no harness; browser6PASS repetido após essa alteração. Logs iniciais preservados.

Produto real permanece bloqueado sem sete cartas homologadas/possuídas, sem inventar aquisição. Básicos preservam regras e especiais do jogador só passam por carta válida; IA/lab legados continuam separados. Journal antigo com special:* não é apagado nem refeito: load/save/begin/command/claim recusam explicitamente, preservando registro até migração própria. No state só básico/cartas, load não reescreve bytes.

Relatório: [TASK-0085-ARENA-THREE-ACTIONS](../../docs/architecture/TASK-0085-ARENA-THREE-ACTIONS.md). [Homologação](../../docs/architecture/TASK-0085-CARD-HOMOLOGATION.md), [plano de correção compatível](../../docs/architecture/TASK-0085-ARENA-AUTHORITY-PLAN.md), [parecer Security](../../docs/security/TASK-0085-ARENA-SECURITY.md).

Próximo: catálogo/aquisição legítima e autoridade integrados à economia existente em tarefa própria. Nenhum push/deploy/merge/main/Supabase/SQL remoto/dado real; contexto06 não iniciado.
