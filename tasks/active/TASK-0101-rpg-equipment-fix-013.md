# TASK-0101 — RPG-EQUIPMENT-FIX-013: reequipar itens autorizados

ID: TASK-0101
TITLE: Corrigir o gate de proveniência do RPC publicado de equipamento
OBJECTIVE: Permitir reequipar itens legitimamente possuídos e autorizados, sem afrouxar validação econômica ou duplicar atributos.
PRIORITY: P1 High
STATUS: VALIDATING
SCOPE: Substituição restrita do corpo de `shop_private.equip`, testes PostgreSQL isolados, migração e recuperação exatas, relatório.
OUT_OF_SCOPE: Saldo/XP/inventário/recibos; novos equipamentos ou expansão; Auth/RLS/ACL; Arena/Torre; compras, concessões ou ajustes de dados de jogadores.
DEPENDENCIES: origin/main `ee66c344ca2bb9a93ac592d83460f88bb549d2e6`; ECONOMY-001C.2; RELEASE_POLICY.md.
ASSIGNED_AGENT: Database + backend (autor); QA/Security self-review.
REQUIRED_CONTEXT: `online-equipment.ts`; `equipment-repository.ts`; migração publicada `20261103045303`; logs agregados 2026-11-10; skill Supabase.
SECURITY_CONSIDERATIONS: A função publicada só testava `chest_operations` para `p_item`, embora botas iniciais venham de `create_traveler` e o Amuleto/Elmo antigos tenham registro em `journey_rewards` e `inventory.metadata`. Conservar ator, avatar ativo e próprio, sessão, posse/quantidade, slot/ID, recibo associado a conta/avatar, batalha ativa e CAS no helper inalterado. Sem autorização genérica, expansão adicional, Auth/RLS/ACL ou escrita em dados reais.
ACCEPTANCE_CRITERIA:
- Equipar, desequipar, re-equipar e substituir o valor de slot existente por item legitimamente possuído.
- Botas iniciais e as duas recompensas históricas só passam com inventário e fonte histórica exata; demais itens exigem recibo canônico existente.
- Negar item ausente, fonte/conta/avatar incorretos, slot/ID inválido, avatar legado sem verificação, sessão inválida e acesso anon/service_role.
- Carteira, XP/atributos base, quantidade de inventário e recibos não mudam ao trocar equipamento; sem duplicação de bônus.
- Preservar whitelist previamente publicada de 40 IDs sem ampliar autoridade efetiva do helper.
- Nenhuma migration PROD ou publicação sem CI exato, migration/Preview TEST e smoke autenticado obrigatório.
TEST_PLAN:
- Envelopes PostgreSQL isolados TEST e PROD para botas iniciais, espada com recibo de abertura, recompensas históricas, troca/replay, CAS, negativas e invariantes; rollback valida corpo e ACL originais.
- Lint/format dos testes alterados, checks obrigatórios do CI e Preview.
- Smoke autenticado TEST: uma operação equipar, desequipar e re-equipar com item já possuído legitimamente, sem compra, concessão, batalha ou alteração econômica.
- Não repetir compras, baús, Arena/Torre ou homologações econômicas anteriores.
DEFINITION_OF_DONE:
- A causa permanece precisamente delimitada: o gate de recibos não reconhece as fontes iniciais/históricas; os logs não identificam o item específico negado, portanto não atribuir a falha a uma transação individual.
- Migrations isoladas, teste real TEST, CI e recuperação aprovados.
- PR integrada normalmente, migration própria PROD aplicada e deployment READY no SHA integrado, seguido de verificações somente leitura.
- Relatório e memória atualizados. Se smoke ou segurança não passar, manter PROD intacta e registrar BLOCKED.
