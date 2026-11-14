# RPG-COMMUNITY-043B.1 — semântica proposta para quotas aprovadas

Resumo consolidado e decisões ainda necessárias: [COMMUNITY-043B.2 Final Decisions](RPG-COMMUNITY-043B2-FINAL-DECISIONS.md).

**Valores aprovados; enforcement não implementado.** A proposta fecha o comportamento técnico solicitado para planejamento. Os casos indicados como decisão de produto permanecem pendentes e não devem ser codificados por inferência.

## Valores e consumo proposto

| Quota aprovada | Aplicação server-side proposta | Ação que consome/libera a quota | Concorrência, retry e compatibilidade |
|---|---|---|---|
| 1 Guilda criada por conta | Agregar todos os avatares à identidade Auth da conta | Consome somente após commit de Guilda + membership líder + registro durável de criação. Erro antes do commit não consome. Arquivar/encerrar não libera nova criação. | Lock por conta e marcador único durável; replay igual devolve mesmo resultado; payload divergente falha. Exclusão/recuperação de Auth não pode apagar o marcador sem política aprovada. |
| Até 5 memberships ativas por avatar | Contar Guildas distintas nas quais o avatar tem vínculo ativo, qualquer papel | Entrada aprovada/convite aceito cria membership e consome; saída/remoção efetiva libera uma vaga. Pedido pendente não ocupa vaga. | Lock por avatar na criação da membership; convite não reserva vaga; aprovação revalida a contagem no commit. |
| Até 50 integrantes ativos por Guilda | Contar líder, colíder, moderador e membro ativos | Membership ativa consome; saída/remoção efetiva libera. Convite ou pedido não ocupa vaga. | Lock/capacidade da Guilda na aprovação; 50º permitido, 51º negado sem escrita parcial. |
| Até 10 links ativos por Guilda | Link ativo = emitido, não revogado e não expirado segundo relógio do servidor | Emissão confirmada consome um slot; revogação confirmada ou expiração natural libera. Falha não consome. | Lock por Guilda; replay de request id retorna o mesmo link; emissões concorrentes não excedem 10. O teto técnico atual já foi observado e deve ser reconfirmado no preflight. |
| Validade de até 30 dias para novos links | `expires_at` definido pelo banco UTC; não exceder 30×24 horas desde a emissão | Validade começa no commit da emissão; falha não cria janela. | Só links criados após a ativação recebem o limite novo. Links históricos preservam validade/status/uso sem reescrita; o limite técnico observado hoje é de até 7 dias. |
| Até 50 usos por link novo | **Proposta:** um uso é a criação confirmada de uma membership a partir de solicitação iniciada por link válido; abrir preview ou criar pedido não é uso final | Consome somente quando aprovação insere a membership. Pedido cancelado/rejeitado não consome; link revogado/expirado não aceita nova solicitação. Pedido já criado quando o link era válido pode ser analisado depois, sujeito à capacidade e ao limite no momento da aprovação. | Lock do link + Guilda na inserção; conferir membership/capacidade/usos no commit. Retry da aprovação retorna resultado existente. Política de revogação para pedidos já pendentes deve ser aprovada (ver pendências). |
| 20 convites individuais por Guilda em 24h | Janela móvel `[server_now - 24h, server_now)` | Consome quando emissão individual válida é gravada e confirmada. Revogar, expirar ou destinatário recusar depois não reembolsa emissão já realizada. | Chave idempotente e lock por Guilda; relógio UTC do banco. Replay não consome novamente. |
| 5 pedidos de entrada por conta em 24h | Somar avatares da mesma conta Auth em janela móvel de 24h | Consome ao persistir com sucesso um novo pedido pendente. Falha não consome; cancelamento ou rejeição posterior não devolve quota, pois o pedido foi confirmado e encaminhado. | Lock por conta; idempotência por chave/ator/alvo. Replays não contam. Escopo por conta não pode ser contornado com outro avatar. |
| 1 pedido pendente por avatar/Guilda | Reutilizar o índice parcial e estado pendente existentes | Consome ao persistir o primeiro pedido; liberação quando aprovado, rejeitado ou cancelado com estado terminal confirmado. | Constraint transacional; retry retorna o pedido existente. Não mudar pedidos históricos pendentes. |
| Cooldown 24h após rejeição | **Proposta:** por par avatar/Guilda, contando desde `rejected_at` gerado pelo servidor | Nova solicitação torna-se elegível em `rejected_at + 24h`; tentativas negadas não consomem a cota diária. | Timestamp e decisão na mesma transação; relógio do cliente ignorado. Confirmar este escopo (par, e não conta toda) antes do runtime. |
| Renomear no máximo 1 vez a cada 7 dias | **Proposta:** por Guilda, janela móvel desde último rename confirmado; nome de criação inicial não conta | Só mudança persistida e aceita consome. Erro, conflito ou replay não consome outra vez. | Lock/CAS por Guilda; aplicação de moderação/contenção não deve alterar silenciosamente o histórico de rename. |

## Regras transversais

- Limites são validados dentro da mesma transação que confirma a ação; nenhuma UI/cache decide elegibilidade.
- Contadores agregados de conta sempre usam o principal Auth obtido no servidor, não o avatar enviado.
- `request_id` vincula ator, ação e hash do payload. Mesma chave/payload devolve o resultado original; mesma chave com outro payload é recusada.
- Falha de autoridade, lock ou contador falha fechado. Nenhum fallback concede autorização.
- A remoção/saída libera apenas uma vaga ativa na Guilda/avatarescope aplicável; não apaga histórico, não reduz a cota vitalícia de criação e não muda outros vínculos.
- Nenhuma quota, papel, convite ou moderação emite moedas, XP, cartas, equipamento, baú ou recibo econômico. ECONOMY-041 permanece como autoridade separada.

## Convites anteriores à implantação

Links e convites legados conservam hash/token, expiração, status, revogação, consumos e pedidos associados. Não inferir usos antigos a partir da quantidade atual de membros, não preencher contadores retroativos e não invalidar/alongar links para encaixá-los no novo contrato. Nova emissão deve ser distinguível por versão/ponto de corte; se não for possível provar que um link é novo, encaminhá-lo pelo comportamento legado até expirar naturalmente. Quotas de emissão e pedidos passam a valer somente a partir do corte definido.

## Aprovação necessária antes de runtime

1. Confirmar que “50 usos” significa memberships efetivamente aprovadas (e não pedidos), e se revogar/expirar um link deve cancelar pedidos já criados sob sua validade.
2. Confirmar cooldown de rejeição por avatar/Guilda, e não por toda a conta.
3. Definir retenção do registro de criação para exclusão/recuperação da conta Auth, com revisão de privacidade/legal.
4. Confirmar que pedidos cancelados/rejeitados e convites revogados não reembolsam quotas já consumidas por uma ação confirmada.

Estes são detalhes de produto/privacidade ainda não aprovados; o documento não os converte em regra efetiva.
