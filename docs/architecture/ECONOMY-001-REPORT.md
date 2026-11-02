# ECONOMY-001 — recuperação por incrementos

02/11/2026. **ACTIVE /001A em auditoria; nenhuma concessão ou alteração econômica remota.** Publicação anterior002 fechada: main43647ef/dpl_E3c29592vaGXsECXZXZKnaNHXUdq READY/PROD/alias, CI41369820010success e dados/ACLs preservados; registro650fb4c. Branch própria codex/economy-001a-cards, PR12/18/24 abertas/draft nos mesmos SHAs.

**001A implementada localmente:** proprietário aprovou expressamente o catálogo e starter descritos na proposta, sem valores/efeitos/raridades/níveis novos. Migration candidata somenteTEST20261102010000 acrescenta dois wrappers restritos; reutiliza arena_authority_v3 sem alterar corpo/ACL, não concede seu EXECUTE a clientes/service_role. Sessão real existente, conta confirmada/não anônima/não banida/não excluída, avatar próprio ativo, catálogo congelado e locks protegem a solicitação. Botão/confirmar em Meu Baralho, leitura real depois do recibo; nunca concede em mount/login e não transfere pacote entre avatares.

Validação: **22PG isolados anteriores +2novos de revogação durante espera +2novos de identidade**, em partes identificadas; CI executará os26 juntos. **41unitários direcionados PASS**, recheck9(interface/editor) inclui5já contados, não somar novamente. Lint/tipos/build/protocolo25 PASS nos checkpoints; ajustes finais de texto/limpeza de efeito serão cobertos pelo CI exato. Sem suíte geral local repetida. Definições remotasTEST iguais ao manifesto. Nenhuma migration ou claim remota executada; CI, migrationTEST, Preview e aquisição normalTEST ainda pendentes. Pacote produtivo próprio somente após homologaçãoTEST.

| Componente existente | Reutilização / dependência concreta |
| --- | --- |
| Cartas/inventário | economy_private.collection e get_owned_cards exigem inventário/recibo card-starter/conta/versão válidos; não aceitar QA como economia. |
| Starter | arena_authority_v3 já emite sete cartas por solicitação explícita, identidade arena-starter-v1 por conta, lock e recibo; não por login. Executável somente postgres em TEST/PROD; falta ponte restrita ao ator autenticado. |
| Catálogo | Sete definições TEST aprovadas; manifesto productionApproval=false, aprovação FIX-PROD-003:TEST-ONLY. PROD vazio. Não promover silenciosamente a aprovação. [Proposta concreta001A](ECONOMY-001A-CATALOG-PROPOSAL.md). |
| XP/moedas | Autoridade/base_authority e progressão existentes;20avataresPROD não reconciliados, TEST0. Starter precede o gate de reconciliação e não modifica saldos; compras/batalhas econômicas não serão desbloqueadas por essa ponte. |
| Guilda/EBD | Elegibilidade publicada sem emissão e limites010D preparados; falta ligar recibos canônicos/limites globais1500XP/semana e50presença aos eventos verificados. Não usar RPC legado livre como autoridade. |
| Baús/equipamentos/Loja | Sorteios/recibos/animações e catálogo legado existentes; catálogo homologado, quotas e fonte autorizada precisam ser auditados por001C. PR12 não integrada; Loja permanece fechada. |
| História/Torre oficiais | PR18 fechada para conclusões; política econômica da Torre não aprovada. Não remunerar demonstrações ou inventar prêmios. |

TEST42migrations/7cartasstarter/2recibos históricos; PROD17migrations/0cartas/0recibosstarter/semarena_qa_private. Definições/ACLs atuais conferidas somente por leitura. Próximo: ponte mínima TEST ao starter já existente, autenticação/posse/idempotência/replay entre avatares e recuperação; nenhum gate antigo será refeito sem mudança relevante. Aprovação produtiva do catálogo separada, sem valores novos. XP/baús/Loja/settlement continuam bloqueados. QA/Security pelo autor, sem independência.
