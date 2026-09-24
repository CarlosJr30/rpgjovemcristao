# ADR-0002 → Estado mínimo, concessão única e serialização por personagem

> TASK-0006 — ESCOPO DO ACEITE: princípios de estado mínimo, atomicidade, versões e idempotência permanecem aceitos. O acoplamento ao slice de Neemias está **SUPERSEDED** pelo produto **Gênesis 2–3 / O Jardim e a Escolha**. Concessão sem batalha, replay e aprovação comunitária exigem revisão dos contratos associados; lock de Character sozinho não resolve revogação de líder/comunidade. Ver [análise de impacto](../architecture/CENTRAL-DYNAMICS-IMPACT.md). Texto original preservado abaixo; não é autorização para schema ou implementação.

STATUS: accepted
DATE: 2026-09-16
TASK: TASK-0004

## CONTEXT

[ADR-0001](ADR-0001-technical-stack.md) define PostgreSQL/Drizzle, autoridade do servidor e transações, mas deixa a estratégia concreta de concorrência e persistência em aberto. MVP exige retomada exata de rodadas e comandos repetidos sem duplicar progresso.

## DECISION

Persistir XP e estado mínimo de missão/batalha; calcular nível, ficha, desbloqueios e PlayerProgress. Inventory é agregado lógico; Boss é papel de Enemy. Manter snapshots de participantes na tentativa, RewardGrant único por personagem/missão e OperationReceipt único por usuário/operação, com finalização na mesma transação.

Serializar mutações de cada personagem com lock de Character, versões esperadas e restrições únicas, conforme [DATABASE-RULES](../architecture/DATABASE-RULES.md). Conteúdo publicado referenciado permanece imutável; tentativas fixam versões de regras/conteúdo. Não introduzir event sourcing, histórico duplicado de turnos ou motor genérico de recompensas.

## ALTERNATIVES

- Persistir nível/stats/desbloqueios em tabelas próprias: mais escritas e estados divergentes sem benefício neste slice.
- Usar somente operation_id: outro ID ainda poderia duplicar prêmio; grant por missão protege o fato de negócio.
- Usar somente grant: não impede rodada ou equipamento repetidos; recibo cobre comandos em geral.
- Locks apenas de Battle ou otimista apenas por linha: permitem disputas entre missão, equipamento e inventário; exigiriam protocolo mais complexo.
- Event sourcing/replay de todos os turnos: armazenamento e operação desnecessários; snapshots e recibos atendem retomada.

## CONSEQUENCES

Menos dados derivados incoerentes, retomada determinística e protocolo comum entre módulos. Serialização por personagem limita paralelismo daquele jogador, aceitável para single-player por turnos. XP e snapshot de concessão exigem reconciliação; recibos precisam de política de retenção. Mudanças em conteúdo iniciado exigem plano futuro de revisão/migração. Accepted vale para modelagem; constraints, concorrência e segurança deverão ser verificadas na implementação autorizada.
