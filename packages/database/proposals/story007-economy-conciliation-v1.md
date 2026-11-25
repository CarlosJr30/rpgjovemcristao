# STORY-007 — Proposta `creation-phase-economy-v1`

**Estado:** proposta local para revisão; não implementada, publicada ou aplicada.
**Escopo:** conciliar o evento `world:origins` do Economy-041 com as concessões já aprovadas pelo STORY-001A, sem alterar as quatro chaves de negócio.

## Regra proposta

A Fase 1 passa a ser o único fluxo pagador para o conteúdo novo `origins/creation`. O prêmio de mundo Economy-041 (30 moedas + 1 Baú Comum) não é emitido como evento adicional para esta fase. A versão `creation-phase-economy-v1` faz o roteador de claims absorver esse evento no marco de conclusão já existente `story:creation:phase-completion:v1`.

| Marco STORY-001A     | Sem prêmio anterior de Origens                  | Se a mesma conta já recebeu o prêmio Economy-041 de Origens                                       |
| -------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Sete missões         | 140 XP + 70 moedas                              | Igual                                                                                             |
| Harmonia             | 100 XP + 30 moedas + 1 Baú Comum                | Igual                                                                                             |
| Quiz perfeito        | 60 XP + 1 Baú Raro                              | Igual                                                                                             |
| Conclusão da fase    | 200 XP + 100 moedas + 1 Baú Comum + 1 Baú Épico | 200 XP + 70 moedas + 1 Baú Épico                                                                  |
| Total efetivo máximo | 500 XP + 200 moedas + 4 baús                    | 500 XP + 200 moedas + 4 baús, contando o prêmio histórico de Origens como 30 moedas + 1 Baú Comum |

Se o prêmio de mundo já foi creditado, seu recibo e saldo são preservados; a conciliação reduz apenas o payload futuro de conclusão pelo valor e baú já recebidos. Se ainda não foi creditado, o roteador bloqueia o evento de mundo separado e a conclusão usa o payload integral do STORY-001A. Não há reversão, recálculo de recibos, duplicação nem concessão retroativa.

## Identidade, atomicidade e idempotência

- A elegibilidade e a consulta de recibos Economy-041 usam a conta Auth e a identidade econômica já definida no contrato 041, com vínculo ao Viajante original. Não transferir prêmio entre contas ou Viajantes.
- A primeira concessão grava, na mesma transação, a chave estável do STORY-001A, a versão `creation-phase-economy-v1`, o valor conciliado, a referência do eventual recibo `world:origins` e a operação de baú. Retry retorna o recibo existente.
- O roteador de `world:origins` deve recusar um segundo crédito separado sob esta política. Um lock por Auth/evento serializa claims concorrentes. Deduplicar antes de conferir e gravar todos os efeitos na mesma transação.
- A composição efetiva nunca ultrapassa 500 XP, 200 moedas ou quatro baús por conta para esta fase. Os baús continuam usando pools e sorteios server-side Economy-041; ausência de pool falha fechado sem débito ou consumo.
- Não migrar o registro legado `garden-choice`, não somar seu prêmio às chaves de `creation`, e não usar esse registro como prova das missões.

## Gatilhos que continuam bloqueando qualquer concessão

Esta proposta não muda `economy041-chest-v1` nem ativa uma claim. A ativação requer política aprovada, conteúdo editorial publicado, sete recibos de checkpoint server-side, Harmonia, resultado qualificável de quiz, prova de vídeo autorizada e validada, requisitos canônicos de fase, pools prontos e teste isolado da transação conciliada. O contrato `story:creation:phase-completion:v1` não pode emitir antes desses gates.

## Revisões necessárias antes da implementação

1. Revisão independente de Economia confirmar que o crédito antigo de Origens pode ser abatido somente do payload futuro de conclusão sem violar o tratamento histórico de recibos 041.
2. Revisão de Segurança aprovar lock, consulta por Auth/evento, tratamento de replays e transação de claim.
3. Confirmar a semântica do evento `world:origins` no ambiente TEST e reconciliar todas as fontes históricas antes de migrar o roteador.
4. Converter para migration numerada usando o fluxo de Supabase somente depois das revisões; testar TEST com cópia sintética e sem contas reais; nenhuma aplicação remota está autorizada por esta proposta.
