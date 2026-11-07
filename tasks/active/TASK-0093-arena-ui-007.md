# TASK-0093 — Arena UI: reduzir avisos de treino
ID: TASK-0093
TITLE: Remover bloco redundante de treinamento da área principal da Arena
OBJECTIVE: Manter Arena visualmente limpa, com controle QA de treino discreto e acessível no menu.
PRIORITY: P2 Normal
STATUS: VALIDATING
SCOPE: TrainingQAControls, posição de montagem no Shell, estilo mínimo do menu e testes diretamente afetados.
OUT_OF_SCOPE: Arena/Torre/motor/cartas/IA/economia/Auth/RLS/dados/validades, mudanças de responsividade do conteúdo principal, backup aprovado.
DEPENDENCIES: Base publicada VISUAL-006 no origin/main cdd4dcf.
ASSIGNED_AGENT: Codex — perfil frontend; QA/React pelo autor.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE/WORKFLOW/RULES/SECURITY/RELEASE_POLICY; provider, shell e testes afetados.
SECURITY_CONSIDERATIONS: Ativação continua restrita ao binding designado pelo servidor; não exibir saldo privado, orçamento ou data de validade na tela principal.
ACCEPTANCE_CRITERIA:
- Bloco de treino e explicações/links redundantes somem da área principal da Arena.
- Ativação/desativação QA permanece disponível de modo recolhido no menu quando houver designação válida.
- Nenhum saldo, validade, conta ou outro dado é alterado.
- CSS e estrutura responsiva mobile existentes permanecem intactos; apenas o bloco pedido sai da área principal, sem espaço reservado.
TEST_PLAN:
- Provider/Shell focados: 9 testes PASS; controle no menu, recolhível, ativação/saída intactas, sem saldo/validade no bloco.
- ESLint e diff check PASS; CI, Preview e conferência desktop/mobile pendentes.
- Verificação visual dirigida desktop/mobile e gates obrigatórios do CI; sem Arena, compra ou transação econômica.
DEFINITION_OF_DONE:
- Critérios comprovados, testes focados e CI obrigatório aprovados, Preview conferida, publicação pelo fluxo normal, relatório e memória atualizados.
