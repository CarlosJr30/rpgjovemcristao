# RPG-ARENA-VISUAL-003 — pop-up cinematográfico das cartas
ID: RPG-ARENA-VISUAL-003
STATUS: ACTIVE
OBJECTIVE: Melhorar a seleção/uso das cartas na Arena e Torre compartilhando os componentes existentes, com confirmação explícita e apresentação cinematográfica de 6,5 s sem alterar o motor.
PRIORITY: P2 Normal
SCOPE: `apps/web/features/arena-deck/battle-actions.tsx`, `editor.tsx`, `cards.module.css`, testes diretamente afetados, hook de apresentação de batalha e integração existente em `apps/web/features/journey/screens/arena.tsx`; relatório breve em `docs/architecture/RPG-ARENA-VISUAL-003-REPORT.md`.
OUT_OF_SCOPE: Motor, IA, regras/efeitos/custos, Torre e seus andares, economia, Auth, RLS, SQL, inventário, dados de jogadores, artes novas, recompensas e fluxos de compra.
DEPENDENCIES: main atual `3dbc9d6`; ilustrações oficiais integradas em RPG-VISUAL-002.
ASSIGNED_AGENT: Frontend.
REQUIRED_CONTEXT: Solicitação RPG-ARENA-VISUAL-003; `.agent/RELEASE_POLICY.md`; `BattleCards`, `ArenaBattleActions`, `ArenaExperience`, `useBattlePresentation`, catálogo canônico e ilustrações aprovadas.
SECURITY_CONSIDERATIONS: Sem mudança de autoridade/dados. Confirmação chama o comando existente uma única vez; resultado e disponibilidade continuam derivados do motor. Pular a apresentação encerra apenas temporizadores visuais e confirma o estado já processado.
ACCEPTANCE_CRITERIA:
- Baralho de sete cartas fica recolhido durante batalha; botão informa quantidade atualmente disponível e abre seletor compacto com arte existente.
- Selecionar abre pop-up com ilustração, nome, custo e efeito canônico; Voltar não envia ação e mantém o estado da batalha.
- “Usar carta” chama o comando existente uma vez; erros não simulam sucesso e controles recuperam-se com orientação.
- Apresentação tem etapas visuais de 1,5 + 2 + 2 + 1 s, opção de pular e `prefers-reduced-motion`; motor processa uma vez e é a única fonte do resultado.
- Carta utilizada fica marcada pelo estado real do motor; não há reutilização nem duplicação da confirmação.
- Arena e Torre reutilizam a integração compartilhada; sem alteração de motor, economia, dados ou sete andares.
- Pop-up funciona por teclado, tem foco acessível, adapta-se a 320/390/desktop e não cria rolagem horizontal da página.
TEST_PLAN:
- Testes focados dos estados seletor/preview/voltar/confirmar, chamada única, falha, pular e movimento reduzido.
- Teste mínimo existente do hook para garantir skip chama conclusão uma vez e aplica estado confirmado; nenhum combate/economia remotos repetidos.
- Executar lint/tipos/build e CI obrigatório; Preview focada somente na Arena/Torre visual e larguras necessárias.
DEFINITION_OF_DONE: Critérios aceitos, gates aplicáveis PASS, branch/PR/merge/deployment oficial verificados, relatório breve e memória atualizados. Não tratar SKIP como PASS.

PROGRESS:
- Implementação compartilhada concluída localmente; regras e motor intactos.
- CI inicial encontrou três testes afetados pela seleção/confirmacão explícita; atualizados para manter as assertions do motor e exigir o novo fluxo.
- 24 testes direcionados em cinco arquivos, ESLint, TypeScript, build, Prettier e diff check passaram.
- Duas tentativas iniciais de Preview falharam por falta de insumos do gate de build. O pacote agora inclui somente os três arquivos estritamente requeridos em `build/`; o dry-run confirmou a seleção.
- CI no SHA de empacotamento e Preview autenticada/visual ainda pendentes; merge e produção somente depois desses gates.
