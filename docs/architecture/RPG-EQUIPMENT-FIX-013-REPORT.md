# RPG-EQUIPMENT-FIX-013 — reativar equipamentos legítimos

10/11/2026. **VALIDATING; sem commit, PR ou alteração remota.** Worktree isolado `codex/rpg-equipment-fix-013`, base `ee66c344ca2bb9a93ac592d83460f88bb549d2e6`. Backup Arena aprovado e checkout principal preservados.

**Causa comprovada no wrapper:** `shop_private.equip` exigia `chest_operations` sempre que equipava (`p_item` definido), mas botas iniciais vêm do fluxo de criação e o Amuleto/Elmo antigos têm proveniência registrada por `journey_rewards` + metadado do inventário. Desequipar não passa por esse gate de aquisição, explicando a diferença observada. Logs não associam a negação a um item específico; não afirmo que a espada comprada recentemente falhou por essa causa, pois o wrapper já reconhece recibos de compra/abertura da Loja.

A migração proposta só substitui o corpo desse wrapper. Mantém a lista existente de 40 IDs, slots e ACLs, delegando posse, nível, sessão/avatar, batalha, compare-and-set e upsert ao helper inalterado. Exceções de proveniência limitadas às botas iniciais e às duas recompensas históricas exatas, sempre exigindo posse no inventário; os demais itens continuam exigindo recibo canônico associado à conta e ao avatar. Nenhuma alteração de Auth/RLS, saldos, XP, inventário, recibos ou dados de jogador.

**Checks locais direcionados:** envelopes isolados PostgreSQL TEST (`ECONOMY_001C_ISOLATED_PASS`, 4 checks) e PROD (15 checks) aprovados, incluindo equipar/trocar slot, desequipar/re-equipar, replay/CAS, fontes legítimas, negativas, invariantes de saldo/XP/inventário/recibos e recuperação exata do wrapper/ACL. ESLint e Prettier dos dois testes alterados PASS; dependências reutilizadas por junction temporário, removido; nenhuma instalação. Revisão SQL/segurança pelo autor, sem revisão independente.

**Pendente obrigatório:** CI no SHA candidato, aplicar somente a migração TEST após CI, Preview READY e smoke autenticado TEST com item já possuído. Não comprar, conceder ou combater. Sem esse smoke, RELEASE_POLICY.md bloqueia a migration PROD e a publicação. Nada foi aplicado remotamente; não declarar correção comprovada em produção.
