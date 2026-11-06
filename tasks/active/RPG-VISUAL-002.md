# RPG-VISUAL-002 — ilustrações das cartas oficiais
ID: RPG-VISUAL-002
STATUS: BLOCKED — as sete propostas foram geradas; aprovação explícita do proprietário necessária antes da integração
OBJECTIVE: Criar somente as sete ilustrações ausentes e, após aprovação explícita, mapeá-las no editor de baralho e na mão da Arena existentes.
PRIORITY: P2 Normal
SCOPE: Assets raster propostos em `assets-source/proposed/rpg-visual-002/`, manifesto de correspondência e integração visual nos componentes atuais após aprovação. Nenhuma alteração de regra ou dado.
OUT_OF_SCOPE: Cartas/regras/efeitos novos, mecânicas, catálogo econômico, Auth/RLS/SQL, Arena/Torre além da apresentação das cartas, compra, recompensas e publicação de arte não aprovada.
DEPENDENCIES: Aprovação das sete artes pelo proprietário antes de integração/runtime/Preview/deploy.
ASSIGNED_AGENT: Frontend + assets visuais
REQUIRED_CONTEXT: RPG-VISUAL-001 report; arena-card-catalog.ts; DeckEditor/BattleCards; approved-visual-assets.ts; artes aprovadas de arena/personagens/equipamentos.
SECURITY_CONSIDERATIONS: Não há dados pessoais nem mudanças de segurança; não enviar assets a terceiros. Usar geração de imagem disponível. Não declarar arte gerada como aprovada.
ACCEPTANCE_CRITERIA:
- Inventário demonstra que as sete definições canônicas não têm ilustração aprovada.
- Sete imagens propostas correspondem uma a uma aos IDs canônicos, sem texto embutido, nova carta ou alteração de regra.
- Após aprovação, a mesma arte é usada no Baralho e Arena; foco, estado USADA e informações oficiais permanecem.
- Nenhum asset pendente chega ao runtime/publicação sem aprovação explícita.
TEST_PLAN:
- Antes da integração: revisar visualmente os sete outputs e verificar nomes/arquivos/hash do mapeamento.
- Após aprovação: apenas testes direcionados de associação das imagens, estado de carta e layout em 320/390/desktop, mais gates obrigatórios do CI.
DEFINITION_OF_DONE: Aprovação explícita, integração visual, gates aplicáveis aprovados, relatório curto e memória atualizada. Até a aprovação, manter status ACTIVE/BLOCKED aguardando resposta; nenhuma publicação.
