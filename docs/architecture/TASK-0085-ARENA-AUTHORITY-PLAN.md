# TASK-0085 — Correção compatível preparada para autoridade da Arena

**Proposta local, não executada. Bloqueio P1 para concessões apoiadas em combate local.** Não cria economia, endpoint, SQL, tabela, serviço, saldo ou grant. Não modifica o contrato da TASK-0078 nem aplica seu cutover pendente.

## Evidência e limite

`arena-deck/storage.ts` valida estrutura e reproduz comandos com snapshots armazenados no navegador; esses snapshots e o histórico não têm assinatura ou emissor confiável. `ArenaExperience.settle` usa winnerId do resultado local, `arenaRepository.rewardedToday` lê histórico local e `addGameplayReward` aplica a regra legada. Um cliente que controla snapshots/histórico pode manipular força, adversário, resultado e contagem diária. Web Locks, ID/rodada, replay e intenção de liquidação resolvem consistência cooperativa; não estabelecem autenticidade contra DevTools/exclusão/adulteração.

Reprodução conceitual somente em fixture isolada: selecionar sete cartas sintéticas, iniciar, modificar atributos/seed no journal dentro dos limites estruturais e executar um comando válido. Replay usa os valores adulterados. Não executar isso com conta/dado real. Não se testou exploração remota ou concessão persistente hospedada. No produto atual o catálogo vazio bloqueia iniciar; esse gate evita habilitar cartas reais nesta entrega, mas não corrige a fronteira econômica legada.

## Integração futura, sem economia paralela

| Fronteira | Correção necessária |
| --- | --- |
| Iniciar | Servidor verifica sessão não anônima/ownership do Traveler, posse com aquisição autorizada, catálogo/revisão, exactly7/IDs únicos, adversário autorizado e ausência de sessão ativa. Servidor escolhe UUID/seed e lê nível/atributos/equipamentos canônicos; não aceita snapshots do cliente como verdade |
| Comandar | Cliente envia sessão, rodada esperada, chave idempotente e ataque/defesa/cardID. Servidor recarrega sessão e valida o mesmo contrato de três ações, custo/nível/uso único; persiste resultado e consumo atomicamente com lock/versão |
| Retomar | Consultar sessão pela conta/Traveler, sem aceitar log local como prova. Nova identidade só ao encerrar/revanche; migração preserva o registro incompatível e expõe estado pendente |
| Encerrar | Resultado é derivado de comandos aceitos e snapshots canônicos do servidor; uma conclusão por sessão. Cliente não envia winnerId, XP, moedas, tier ou alegação de vitória como autoridade |
| Recompensar | Adaptar a conclusão validada ao protocolo econômico/ledger/recibos já preparado na TASK-0078. Reusar cálculo e limites existentes; checagem diária e idempotência atômicas no servidor. Nenhum segundo mecanismo de crédito |
| Mostrar resultado | UI lê recibo confirmado, pendente ou negado. Repetição/reload retorna o mesmo recibo; queda não pode duplicar nem perder crédito por uma flag local irreversível |
| Legado | Journals/históricos locais continuam dados locais; nunca importá-los como vitória premiável, posse, contagem diária oficial ou saldo confiável |

Contrato de adapter a acordar com0078: entrada = referência a sessão/conclusão validada pelo backend, identidade resolvida no servidor e chave de idempotência; saída = recibo econômico existente ou pendência/negação. A assinatura concreta depende do protocolo vigente aprovado no cutover. Nenhuma nova função de grant é implementada nesta tarefa.

## Aceite para remover o bloqueio

- Definir ambiente isolado e autorização próprios antes de recurso remoto, SQL ou configuração.
- Demonstrar Auth/ownership/RLS reais, inventário com origem autorizada e rejeição de snapshots/IDs/resultado/saldos fabricados.
- Concorrência entre abas/aparelhos: mesmo comando e conclusão retornam mesmo resultado/recibo; não duplicam turno, consumo, prêmio ou limite diário.
- Reproduzir adulteração local e comprovar ausência de concessão no servidor; testes de rollback/retry, cutoff entre versões e migração sem apagar estados.
- Preservar fórmulas, XP/moedas/baús/tiers e limites anti-farm existentes, com comparação de regressão. Revisão Security e gates próprios da TASK-0078 antes de disponibilizar economia remota.

Até esses gates, não alegar servidor autoritativo, antifraude, PvP seguro, sincronização real ou prêmio remoto validado. Esta entrega mantém o bloqueio do catálogo e documenta a correção; não resolve o achado P1 por documentação.
