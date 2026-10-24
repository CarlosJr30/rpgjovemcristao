# Torre: proposta econômica FIX-PROD-004

Fonte: resposta explícita do usuário no FIX-PROD-004. Estado **PROPOSED / NOT HOMOLOGATED**. Não aplicar SQL de concessão nem modificar o servidor hospedado para liberar estes valores.

| Andar | XP | Moedas | Baú |
| --- | --- | --- | --- |
| 1 | 20 | 10 | — |
| 2 | 30 | 15 | — |
| 3 | 40 | 20 | — |
| 4 | 50 | 25 | — |
| 5 | 60 | 30 | — |
| 6 | 80 | 40 | — |
| 7 | 150 | 75 | 1 épico |

Orçamento máximo de uma conclusão: **430 XP, 215 moedas e um baú épico fechado**. O baú não é aberto nem seu loot antecipado. Derrota, batalha não encerrada, salto de andar e repetição não concedem prêmios.

Escopo proposto acompanha o progresso oficial atual: conta proprietária + Viajante + versão da Torre + andar. A identidade de primeira vitória deve ser estável entre batalhas e versões da tabela de valores; não usar battleId como único identificador de elegibilidade. BattleId, conta, ator, versão da política, resultado e recibo devem permanecer vinculados para auditoria. A homologação final deve confirmar esse escopo por Viajante e a política de versões/compensação antes de liberar créditos.

Contrato futuro de persistência: primeira vitória e concessão devem compartilhar transação, lock e identidade única. Vitória canônica encerrada, propriedade real, catálogo/posse homologados, economia reconciliada e política homologada são pré-condições. Uma requisição do browser nunca escolhe valor, resultado, conta, estado aprovado ou direito de primeira vitória. Conflito concorrente não pode repetir XP/moedas/baú. Recompensa pendente é distinta de prêmio já pago: não tratar o recibo `blocked` antigo como quitação e não fazer backfill automático de vitórias anteriores.

Antes da homologação: decidir tratamento dos resultados já existentes, ensaiar recuperação, implementar integração transacional/recibo único, testar commit concorrente e rollback entre moeda/XP/baú/recibo, revogação de posse, falha de conexão, isolamento de conta e repetição. Os testes do modelo isolado não provam essas propriedades do banco; nenhum grant real foi implementado.

`tower-rewards.proposal.ts` é um modelo executável apenas de revisão, fora dos exports/runtime, com `creditsEnabled=false` e grant sempre zero, inclusive em primeiro triunfo e campeão. Nenhuma chave ou parâmetro permite homologá-lo pelo cliente. Sua saída hypothetical serve somente aos testes/planejamento. A homologação não foi solicitada como etapa final porque os gates da Torre, legado e visual continuam pendentes.
