# TASK-0102 — RPG-EQUIPMENT-FIX-014

ID: TASK-0102
STATUS: VALIDATING — reconhecimento aprovado e preparado; CI final pendente; smoke hospedado indisponível
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
- Reconhecimento aprovado para quatro tipos/quantidades exatos, conta/avatar e referências fixados; somente comando privado auditado, depois dos gates, sem inventário/recibos antigos alterados.
TEST_PLAN: SQL isolado e testes de repositório/componente afetados; lint/tipos/build e CI; real hospedado somente com sessão TEST legítima disponível, sem pedir novamente outra conta ao proprietário.
RELEASE_GATE: RELEASE_POLICY.md exige smoke real hospedado; SQL/fixtures não substituem. Sem escrita PROD ou publicação com gate pendente.
PRESERVATION: Backup Arena cdd4dcf, todos os worktrees/alterações anteriores e dados preservados.
APPROVAL: Proprietário respondeu Aprovar reconhecimento individual em 10/11/2026. Couraça1/Escudo1/Elmo4/Medalhão6 do ativo. Não pedir nova aprovação dessas quantidades nem autorização rotineira de publicação.
VALIDATION: 23unit novos/30afetados; 9PG de leitura e12PG de reconhecimento, mesmos cenários nos dois envelopes isolados. Primeiro CI e03dc574 success42880418054. SQL de suporte/contensão sem execução remota; gate hospedado ainda ausente.
