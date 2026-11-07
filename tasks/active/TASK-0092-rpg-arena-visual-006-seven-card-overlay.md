# TASK-0092 — RPG-ARENA-VISUAL-006

ID: TASK-0092
TITLE: Sete cartas sobre o cenário compartilhado Arena/Torre
OBJECTIVE: Exibir a mão em leque no desktop e navegação móvel dentro do combate, com ampliação e confirmação existentes.
STATUS: VALIDATING
PRIORITY: P2 Normal
SCOPE: BattleCards, ArenaBattleActions, composição local/AuthoritativeArena, CSS, testes afetados e relatório. Continuação da PR38/head6abd701; VISUAL004/005 ainda não publicadas.
OUT_OF_SCOPE: Motor, IA, dados, Auth/RLS, SQL, economia, inventário, concessões, novos assets e dependências.
ASSIGNED_AGENT: Codex — perfil frontend; QA/React/Security pelo autor, sem independência.
DEPENDENCIES: TASK-0090/0091 preservadas; pedido explícito VISUAL006 substitui paginação desktop de três cartas.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE/WORKFLOW/RULES/SECURITY/RELEASE_POLICY, pedido anexado, componentes e testes diretamente afetados.
SECURITY_CONSIDERATIONS: Preservar foco, Escape, bloqueio durante confirmação, uma ação e movimento reduzido; nenhuma autoridade nova.
ACCEPTANCE_CRITERIA:

- Sete cartas simultâneas em leque sobre os personagens no desktop; seletor móvel horizontal sobre o palco, sem deslocamento do documento.
- Seleção amplia arte e dados verdadeiros; Voltar permite trocar; somente Usar carta envia uma ação.
- Animação 1500/2000/2000/1000ms, Pular, estado USADA e teclado preservados.
- Composição aplicada a treino local e modo com servidor, compartilhada com Torre.
  TEST_PLAN:
- Somente testes dos componentes/composição alterados, captura real 320/390/desktop e gates obrigatórios do CI.
- 22 casos direcionados únicos PASS nas partes identificadas; capturas Chromium 1365/390/320 de componentes reais com fixture local. Sem prova de Auth hospedada; CI e Preview ainda pendentes.
- Retorno de foco corrigido após remoção de inert. Adapter visual do modo com servidor retorna confirmação booleana e conecta Pular ao hook existente; mock antigo da assinatura play corrigido. Motor/transporte/permissões preservados.
- Preview TEST com acesso oficial temporário; fluxo autenticado e publicação conforme RELEASE_POLICY. Sem combate completo/compras/baús.
  DEFINITION_OF_DONE:
- Critérios comprovados, CI e Preview aprovados; publicação normal confirmada ou bloqueio real documentado; memória atualizada.
