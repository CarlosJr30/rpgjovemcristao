# TASK-0087 — Contrato futuro de autoridade e extensão semanal

Proposta documental, não backend executável. Nenhum endpoint, SQL, serviço, prêmio, tier ou carteira é criado. A Torre atual usa somente checkpoints **local-demo**, adulteráveis pelo cliente e sem concessão econômica/conquista oficial. Catálogo vazio bloqueia produto; fixtures positivas não representam aquisição legítima.

## Sessão oficial

Servidor deve resolver conta/Traveler com Auth não anônima/ownership, definição versionada da Torre, modo e instância de temporada; ler catálogo/posse com origem autorizada, selecionar sete IDs únicos e funcionais e congelar atributos/nível/equipamentos canônicos. Adversário/andar/seed/UUID vêm do servidor. Não aceitar snapshots, flags de vitória, índice liberado, saldo ou transcrição locais como autoridade.

| Operação futura | Entrada mínima do cliente | Validação/resultado exigidos no servidor |
| --- | --- | --- |
| Consultar Torre | Identificador da definição/instância | Sessão autenticada; progresso derivado de recibos oficiais; isolamento conta/Traveler; nenhuma importação automática dos checkpoints locais |
| Iniciar andar | Andar esperado, seleção de7, chave idempotente | Andar exatamente próximo após vitórias oficiais anteriores, sem sessão ativa concorrente; posse/catálogo/versão, snapshot/seed/ID canônicos; rejeitar replay/stale |
| Comandar | battleSessionId, rodada/versão esperada, chave idempotente, attack/defend/cardID | Mesmo ArenaV2 e regras de nível/Foco/uso único; lock/versão, persistir rodada+consumo atomicamente; rejeitar special:* direto e legado sem deck |
| Retomar | Referência à sessão | Recarregar snapshot/rodadas confirmados no servidor, sem aceitar novo resultado do browser. Se migração incompatível, preservar sessão e bloquear explicitamente |
| Concluir andar | Referência à sessão terminada, chave idempotente | Resolver resultado a partir do histórico canônico; vitória libera só próximo. Derrota mantém o atual; não desconta recursos/cartas. Duplicata retorna mesmo recibo e estado |
| Recompensar | Referência à conclusão validada | Usar protocolo/ledger/recibos econômicos existentes da TASK-0078. Valores, baús, tiers e limites são definidos por homologação própria, não por esta tarefa |

Identidades dos futuros recibos devem vincular conta, Traveler, towerDefinitionVersion, mode, seasonInstanceId, floorId, battleSessionId, resultado canônico e revisão do servidor. Interface deve distinguir `pending`, `confirmed` e `rejected` para recompensa; vitória oficial registrada e prêmio efetivamente concedido são fatos diferentes.

Unicidade necessária: conclusão por battleSessionId; progresso oficial por Traveler+instância+andar; primeira conclusão por Traveler+instância conforme política econômica vigente. Repetir uma vitória não duplica andar, XP, moedas, baú, conquista ou prêmio de primeira conclusão. Não criar segundo caminho de grant. Transação/recibo do backend e retry idempotente devem cobrir falhas entre conclusão e economia; flags locais não substituem esse contrato.

## Aceite de autoridade

- Ambiente isolado e autorização próprios antes de SQL/recurso/configuração remotos.
- Auth/RLS/ownership/posse e revogação testados com duas contas/Travelers reais de teste e aparelhos, sem dado de produção.
- Cliente malicioso enviando resultado, vitória, seed, atributos, índice futuro ou recibo fabricados não progride oficialmente nem recebe recurso.
- Concorrência entre abas/aparelhos e repetição de comandos/conclusões preservam exatamente uma transição/recibo, inclusive após queda, timeout ou migração.
- Regressões mantêm fórmulas/IA/custos/usos e economia; gates da0078 atendidos antes de conceder prêmios. Checkpoint local existente nunca é convertido em conquista oficial.

## Torre semanal — extensão futura

Atualmente há somente configuração `permanent-v1`; não há relógio de temporada, agendamento, reset, recorrência, ranking ou premiação semanal. Futura instância semanal deve ter identidade e janela resolvidas no servidor, associadas à definição versionada, separadas do progresso permanente. Não apagar/converter o permanente quando uma semana terminar; manter recibos de temporadas passadas e regras de cutoff/retry. Reset de flag ou relógio do navegador não inicia temporada nem habilita prêmio. A futura tarefa deve aprovar configuração/economia e migração próprias antes de implementar serviços.

Dependências: catálogo/aquisição, backend de combate e integração econômica0078; plano autoritativo0085 permanece válido. Este contrato não modifica tarefas anteriores nem autoriza operação remota.
