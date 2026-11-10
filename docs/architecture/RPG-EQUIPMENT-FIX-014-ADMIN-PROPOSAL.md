# FIX-014 — reconhecimento administrativo individual proposto

**Não ativado.** A FIX-010 aprovou moedas/XP e manteve `legacyReceiptsAuthoritative=false`; essa aprovação não ratifica automaticamente equipamentos. A TASK-0077 alocou seis itens ao perfil administrativo, conforme auditoria histórica FIX-PROD-004. O original privado não foi localizado nesta máquina; reaproveita-se o registro histórico do hash conferido. O ledger atual confirma três Elmos e cinco Medalhões adicionais pela fonte `task-0076-admin-test-profile`, sem `account_id`/`identity_key` antigos.

Proposta mínima: ratificar o uso dos quatro tipos bloqueados abaixo como equipamento administrativo de teste do **Teste Chat A ativo**, fingerprint `0738159004791aa13c3664cc940c24a4`, vinculado exclusivamente à conta fingerprint `7882153ca018491f7ffe725a3b18ee2e`.

| Item existente | Alocação administrativa documentada | Drops históricos referenciados | Quantidade a reconhecer |
| --- | ---: | ---: | ---: |
| Couraça do Viajante | 1 | 0 | 1 |
| Escudo da Perseverança | 1 | 0 | 1 |
| Elmo do Viajante | 1 | 3 | 4 |
| Medalhão do Caminho | 1 | 5 | 6 |

Botas e Espada continuam utilizando suas fontes já reconhecidas; não precisam de exceção adicional. Existem duas Espadas posteriores com recibos oficiais, além da unidade administrativa anterior. Não se reconhecerá uma fonte administrativa para outros jogadores ou itens.

Mecanismo proposto para revisão: quatro reconhecimentos atuais, imutáveis e de valor monetário zero no **ledger existente `chest_operations`**, com tipo próprio de reconhecimento, conta/avatar/item/quantidade, aprovação atual e referências aos oito registros antigos por ID e hash. Esses registros declararão sua natureza administrativa, sem simular compra, drop oficial ou data antiga. A autoridade de Equipar aceitaria somente essa decisão específica e continuaria exigindo posse real, sessão, avatar ativo, slot, nível, CAS e ausência de combate. Compras/recompensas normais conservariam os recibos oficiais exigidos.

A execução privada exigiria o snapshot aprovado sob locks e recusaria divergência, homônimo, outro proprietário, outro item, quantidade diferente ou replay incompatível. Sem EXECUTE público para reconhecer fontes, sem preenchimento retroativo dos recibos antigos, sem INSERT/UPDATE de inventário/equipamento/carteira/XP. O recibo financeiro FIX-010 serve apenas para conferir a identidade previamente reconciliada.

**Decisão indispensável:** ratificar expressamente essas quatro quantidades como origem administrativa individual para uso em equipamentos. Os dados são preservados enquanto a decisão não chega. A decisão não substitui o gate hospedado exigido pela RELEASE_POLICY.md.

[Manifesto sanitizado de referências e hashes](RPG-EQUIPMENT-FIX-014-EVIDENCE.json). Nenhum SQL de ativação administrativa foi executado ou incluído no pacote de leitura.
