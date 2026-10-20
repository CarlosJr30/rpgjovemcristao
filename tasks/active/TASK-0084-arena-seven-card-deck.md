# TASK-0084 — Baralho de sete cartas
ID: TASK-0084
TITLE: Meu Baralho — Arena (contexto04/09)
OBJECTIVE: Seleção de sete cartas possuídas, uso único no motor e retomada coerente do treino.
PRIORITY: P2 Normal
STATUS: BLOCKED
SCOPE: Contratos de cartas/deck no game-engine, integração estrita Arena/coleção, adapter de inventário existente, persistência local por conta/Traveler, testes, docs e memória próprios.
OUT_OF_SCOPE: main/merge/push/deploy/remoto/dados reais, economia/XP/moedas/chests/TASK0078, AuthQR/Story/EBD, novos especiais/balanceamento/cartas/raridades/concessões, Torre/PvP, dependências/assets/overlays.
DEPENDENCIES: Base bd9ee35 da TASK0083; catálogo homologado de cartas e aquisição/persistência autoritativa ainda inexistentes; futuro backend de combate.
ASSIGNED_AGENT: Autor assume Architect, Frontend, Backend, Game Designer, QA e Security; sem delegação/revisão independente. Orquestrador autoriza esses perfis nos caminhos do SCOPE.
REQUIRED_CONTEXT: AGENTS/GLOBAL/CURRENT/WORKFLOW/RULES/SECURITY e perfis/skills pertinentes já lidos; contratos0023/0040; Arena V2/index, inventoryRepository, traveler snapshot e arenaRepository.
SECURITY_CONSIDERATIONS: Ownership no adapter existente; nada de metadado local fabricando cartas; exactly7/IDs únicos e funcionais; snapshot congelado e revisão da batalha; armazenamento segregado, replay determinístico validado, falha fecha ações. Não alegar autoridade/antifraude de servidor.
ACCEPTANCE_CRITERIA:
- Coleção e editor responsivos com filtros, sete slots e contagem, sem autoaquisição; menos7 bloqueia iniciar.
- Motor rejeita carta não selecionada/usada, duplicidade e revisão/identidade errada; básicos/especiais/equipamentos preservados.
- Deck editável só entre batalhas; snapshot e consumo sobrevivem reload; nova identidade restaura uso; encerrado não aceita ações.
- Estado local não pode repetir liquidação ao recarregar; economia/fórmulas permanecem, limitação de autoridade explicitada.
- Testes40cartas sintéticas isoladas, identidades, fluxo/retomada/concorrência, responsividade; lint/tipos/build; relatório/checklist/memória.
TEST_PLAN: Engine, adapter/storage, UI/componentes, navegador desktop/móvel; regressões dirigidas especiais/equipamentos; PostgreSQL N/A se nenhuma tabela/SQL nova.
DEFINITION_OF_DONE: Gates comprovados; catálogo/aquisição/autoridade ausentes mantêm aceite integral BLOCKED.

## Auditoria / decisões mínimas
- Base0083 limpa conferida; branch codex/arena-seven-card-deck em build/task-0084-arena-deck/checkout. Pendências raiz e checkouts preservadas.
- Coleção atual é de equipamentos apresentados em cartões. Não existe catálogo ou posse de cartas jogáveis; não converter equipamentos nem quatro especiais em cartas concedidas.
- Arena V2 tem Foco0–3, ataque/defesa +1, quatro especiais por níveis2/4/6/8 e custos2/2/2/3. Especiais podem repetir conforme Foco; serão preservados até contexto05. Efeitos de equipamentos têm usos/cooldowns próprios e não consomem cartas.
- Integração de cartas referencia ações reais do motor, sem novas fórmulas/descrições inventadas. Catálogo homologado vazio em runtime; fixtures40 apenas testes. Inventário remoto existente fornece posse quando IDs homologados forem definidos; nenhuma metadata do cliente promove item a carta.
- Arena atual só persiste histórico, não combate ativo. Novo checkpoint local armazena identidade/snapshot/ações e reproduz motor para validar retomada; sem backend autoritativo, sem sincronização entre aparelhos ou prova de posse contra adulteração do browser.
- Sem SQL novo: contrato local de integração aproveita inventory, não cria inventário/Auth alternativos. Futuro catálogo/servidor/SQL exige contrato e autorização próprios.

## Checklist
- [x] Auditoria/base/contrato
- [x] Motor e invariantes
- [x] Coleção/editor/integração
- [x] Persistência/retomada/concorrência
- [x] QA/Security/checks
- [x] Relatório/memória/aceite local
- [ ] Catálogo/aquisição e backend autoritativos

## SELF VALIDATE / QA / SECURITY / ACCEPTANCE

Base local PASS, integral BLOCKED. Sem catálogo de cartas real: início de treino bloqueado por exatamente7, sem inventar ou conceder cartas. Produto autenticado testado com SDK/DataAPI simulados; positivo de40cartas somente em harness isolado e testes de componente, explicitamente diferenciados. QA/Security pelo autor, não independentes.

| Gate | Resultado / log |
| --- | --- |
| Unitários/componentes/regressão | PASS47/8arquivos, `unit-final.log` |
| Browser | PASS6/0fail/0skip/retry0, `e2e-final.log`:3app vazio +3harness positivo, Chromium1440/320 e WebKit390 |
| Build | PASS `build-final.log`, nova rota e gates herdados de assets intactos |
| Lint / TypeScript | PASS `lint-final.log` / `typecheck-final.log` |
| Visual/acessibilidade | Capturas reais de vazio/editor e fixture7/7/USADA inspecionadas; sem overflow testado, labels/foco/botões e título duplicado corrigido |
| PostgreSQL | N/A, sem SQL/schema/tabela/RLS/migration nova; nenhum backend remoto testado |
| Security | PASS revisão do diff local, limites de autoridade mantêm bloqueio integral; parecer próprio |
| Biblical | N/A, nenhuma narrativa/referência ou carta nova oficial; nomes de teste só em fixture |
| Preservação | Git compara AuthQR/Story/EBD/SQL/contratos0080–0083/0078/pacotes intactos; main/raiz/checkout0083 preservados. Scan de JS de produção não encontrou fixture-card-/título do harness |
| Docs/memória/secrets | Relatório/parecer/checklist atualizados; entrada na memória raiz preserva bytes anteriores; revisão de arquivos antes do commit |

Reworks: fixture matchMedia incompleta causou1FAIL/45PASS e erro de listener, corrigida (2PASS isolados, depois47PASS completos); identificador copiado no teste Auth detectado pelo TypeScript e corrigido; revisão visual removeu título duplicado; ciclo finalizado com coleção alterada coberto por teste adicional. Logs anteriores preservados em build/task-0084-arena-deck; sem falha final aberta nos checks executados.

Relatório de11 itens: [TASK-0084-ARENA-DECK](../../docs/architecture/TASK-0084-ARENA-DECK.md). Parecer: [TASK-0084-ARENA-DECK-SECURITY](../../docs/security/TASK-0084-ARENA-DECK-SECURITY.md). Não há transação econômica/posse autoritativa nova; não alegar antifraude ou sincronização entre aparelhos. Sem push/deploy/merge/main/produção/SQL remoto/dado real. Próximo catálogo/aquisição/servidor no escopo próprio; contexto05 não iniciado.

Commit local da implementação validada: `f254349130c7779413b4ae7d3e0438e766955b39`. Controle seguinte altera somente este contrato e o relatório. Memória raiz recebe entrada0084 preservando os bytes anteriores; sem nova suíte para estes metadados documentais.
