# TASK-0102 — RPG-EQUIPMENT-FIX-014

ID: TASK-0102
STATUS: VALIDATING — CI e proposta administrativa pendentes; smoke hospedado indisponível
OBJECTIVE: Distinguir posse de autorização, informar recusas reais e preparar reconhecimento individual de proveniência administrativa comprovada.
SCOPE: Leitura autenticada de elegibilidade reutilizando o gate publicado; equipamentos/repositório/preview existentes; testes afetados; proposta individual auditável no ledger existente.
OUT_OF_SCOPE: Concessões, compras, operações em jogadores PROD, mudanças de carteira/XP/inventário/itens/recibos antigos, Auth/RLS, Arena/Torre, Loja/Mochila e expansão.
BASE: origin/main 97e4abb649c764f07ad675900dc3379135fe0134. Worktree 013 e seus três documentos locais preservados.
ASSIGNED_AGENT: Autor, perfis backend/database/UI limitados ao escopo autorizado pelo proprietário; QA/Security pelo autor, sem independência.
ACCEPTANCE_CRITERIA:
- Interface só confirma origem quando lida da autoridade; posse isolada não habilita Equipar.
- Recusas conhecidas têm mensagens específicas; falha de rede/schema não vira autorização nem recusa de origem.
- Consulta e operação usam o mesmo predicado de proveniência; verificações de posse, sessão, slot, nível, CAS e batalha preservadas.
- Treino privado e desequipar mantêm sua autoridade própria.
- Reconhecimento administrativo é proposto por conta/avatar/itens/quantidades/evidências exatos; não ativa a fonte sem a decisão necessária.
TEST_PLAN: SQL isolado e testes de repositório/componente afetados; lint/tipos/build e CI; real hospedado somente com sessão TEST legítima disponível, sem pedir novamente outra conta ao proprietário.
RELEASE_GATE: RELEASE_POLICY.md exige smoke real hospedado; SQL/fixtures não substituem. Sem escrita PROD ou publicação com gate pendente.
PRESERVATION: Backup Arena cdd4dcf, todos os worktrees/alterações anteriores e dados preservados.
