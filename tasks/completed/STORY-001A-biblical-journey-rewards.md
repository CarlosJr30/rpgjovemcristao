# STORY-001A — Atualização oficial das recompensas da Jornada Bíblica

ID: STORY-001A
TITLE: Recompensas da Fase 1 — No Princípio de Tudo
STATUS: DOCUMENTAÇÃO CONCLUÍDA; integração/runtime BLOQUEADOS pelos gates abaixo
PROJECT: RPG Jovem Cristão
WORLD: Mundo 1 — As Origens (`world_id=origins`)
STORY: Fase 1 — No Princípio de Tudo (`story_id=creation`)
BIBLE_REFERENCE: Gênesis 1:1–2:3
SOURCE_OF_TRUTH: [Character System](../../docs/game-design/CHARACTER-SYSTEM.md), seção “Jornada Bíblica — Fase 1”
RELATED: [CORE-GAMEPLAY-LOOP](../../docs/game-design/CORE-GAMEPLAY-LOOP.md), [MVP](../../docs/game-design/MVP.md), [Economy-041 decisions](../../docs/architecture/RPG-ECONOMY-041-DECISIONS.md), [chest persistence contract](../../docs/architecture/CHESTS-SUPABASE-V1.md)

## Escopo preservado

Esta atualização trata somente dos valores e do contrato de concessão da Fase 1. Preserva a estrutura aprovada em STORY-001: sete missões da Criação, exploração do Viajante, desafio Harmonia da Criação, Quiz Bíblico de cinco perguntas, diário bíblico, vídeo obrigatório e avanço de fase. O avanço da história não exige aprovação de líder conforme a decisão específica desta fase; ver o conflito documental em “Gates”.

O registro existente `garden-choice` (Gênesis 3; adaptador legado e recompensa antiga) não é substituído, migrado nem somado silenciosamente a esta especificação. A nova identidade de conteúdo é `creation`, referência Gênesis 1:1–2:3.

## Recompensas aprovadas — teto da Fase 1

| Marco | XP | Moedas | Baús |
| --- | ---: | ---: | --- |
| Sete missões da Criação, em conjunto | 140 | 70 | — |
| Desafio Harmonia da Criação | 100 | 30 | 1 Comum |
| Quiz perfeito (5/5) | 60 | 0 | 1 Raro |
| Conclusão da Fase 1 | 200 | 100 | 1 Comum + 1 Épico |
| **Máximo total da Fase 1** | **500** | **200** | **4: 2 Comuns + 1 Raro + 1 Épico** |

A alocação individual dos 140 XP e 70 moedas entre as sete missões ainda não foi definida. Até decisão de conteúdo/balanceamento, tratar a premiação de missões como um único marco agregado após comprovação server-side das sete conclusões; não inventar uma divisão igual. Concluir com recompensa principal somente uma vez por identidade econômica elegível.

O Quiz pode ser repetido para aprendizagem. O bônus de 60 XP e o Baú Raro são concedidos uma única vez, apenas ao comprovar resultado perfeito 5/5. Tentativas futuras não repetem esse marco.

## Elegibilidade e prova

1. Cada prova é validada no servidor; o cliente não escolhe nem credita XP, moedas, baús ou resultado aleatório.
2. A conclusão do marco de fase exige os sete recibos de missão, o recibo do desafio, a conclusão do Quiz e a conclusão do vídeo obrigatório publicado.
3. O vídeo é evidência de conclusão do conteúdo, não uma concessão separada.
4. Provas e concessões são atômicas e auditáveis; falha, resposta perdida, retry, concorrência, duas abas ou reenvio da mesma intenção não podem duplicar patrimônio.
5. Replays mantêm progresso e não repetem recompensa principal. Nenhuma economia, XP, moedas, equipamento ou privilégio adicional é concedido por Guilda, aprovação comunitária ou diário/reflexão.
6. A identidade econômica deverá seguir Economy-041: um recibo por Auth + evento imutável, preservando o vínculo com o Viajante original. A implementação deve confirmar formalmente a definição de identidade aplicável a marcos de fase antes de criar o adaptador.
7. Revogação/despublicação afeta elegibilidade futura conforme regras versionadas; não apaga recibos históricos nem saldo já concedido.

## Chaves estáveis de concessão

Namespace de negócio proposto (não é ainda nome de endpoint, tabela ou migration):

- Missões agregadas: `story:creation:missions:all-seven:v1`, liberada somente depois das sete provas. Cada missão deverá ter um ID de conteúdo estável quando o conteúdo for definido; não criar IDs fictícios agora.
- Desafio: `story:creation:challenge:harmony-of-creation:v1`.
- Quiz perfeito: `story:creation:quiz:perfect-5-of-5:v1`.
- Conclusão: `story:creation:phase-completion:v1`.

A chave da operação de transporte pode mudar após falha; a chave de negócio acima permanece estável e única. Cada evento econômico da chave é processado uma vez; uma resposta repetida devolve o recibo anterior. Nunca usar uma chave nova para contornar uma duplicata. A conclusão não deve repetir as recompensas já concedidas nos marcos anteriores.

## Compatibilidade e integração auditadas

- **Baús — compatibilidade de tipo: PASS.** A persistência atual aceita Comum, Raro e Épico; Economy-041 contém as raridades e pools por raridade correspondentes. Não escolher a carta/equipamento nem prometer item específico: a abertura segue o sorteio servidor-side publicado.
- **Baús — prontidão de conteúdo/produção: BLOCKED.** O contrato Economy-041 falha fechado se pool ausente/inválido. O último estado auditado neste repositório registra os capítulos de Origens com `content_ready/video_ready/reward_ready=false`; é necessário confirmar estado atualizado e aprovação/publicação dos conteúdos antes de qualquer ativação. Não substituir baú por outra raridade ou item.
- **Economia — ajuste obrigatório.** A política imutável Economy-041 já define uma recompensa de mundo para `origins` de 30 moedas + 1 Baú Comum, sem XP. Empilhar o pagamento de mundo com os marcos desta fase ultrapassaria o teto aprovado de 200 moedas e quatro baús. Não alterar a regra global aprovada nem emitir ambos: antes de implementação, decidir e versionar se a política de mundo será absorvida/substituída por estas concessões ou se haverá outro enquadramento que preserve o teto; preservar recibos históricos e sem retroativos.
- **Adaptador atual — ajuste obrigatório.** O modelo `StoryReward` hoje comporta um único payload de prêmio por história e não representa esses quatro marcos. O adaptador de servidor precisa aceitar eventos distintos, totalização auditável e idempotência sem expor uma rota genérica de crédito ao cliente.
- **Gate de fase — conflito documental.** A regra específica aqui solicitada dispensa aprovação de líder para avançar na Jornada; CORE-GAMEPLAY-LOOP ainda estabelece gate de líder entre fases. Antes da implementação, registrar a precedência da exceção da Jornada e ajustar a fonte global em tarefa própria, sem remover gates de Guilda aplicáveis às atividades comunitárias.
- **Balanceamento — ajuste futuro.** Os objetivos de XP para as fases 2–6 permanecem metas de design (600/700/850/950/1200 XP); moedas e baús dessas fases não foram especificados. A distribuição por missão e a curva de progressão ainda precisam de validação de balanceamento. Os números não autorizam conceder essas recompensas agora.
- **Escopo de produto:** sem mudança em Guildas, aprovação comunitária, XP/moedas/baús de outros eventos, economia de PROD, Jornada Bíblica fora desta fase ou conteúdo canônico.

## Checklist de planejamento

- [x] Registrar exatamente o orçamento máximo da Fase 1 e sua composição.
- [x] Relacionar o contrato à identidade `origins/creation` e Gênesis 1:1–2:3.
- [x] Definir prova obrigatória, replay sem pagamento repetido e ausência de recompensa por reflexão/liderança.
- [x] Propor chaves de negócio estáveis e tratamento idempotente/concor­rente.
- [x] Conferir compatibilidade dos tipos de baú e registrar gate de pool/conteúdo.
- [x] Auditar divergência com o pagamento Economy-041 por mundo e com o gate geral de líder.
- [ ] Resolver os gates documentais e de política econômica antes de implementação.
- [ ] Confirmar conteúdo publicado e `content_ready/video_ready/reward_ready` antes de ativar claims.
- [ ] Implementar e verificar em tarefa futura; este registro não comprova funcionamento em runtime.

## Próxima tarefa

[STORY-002 — Exploração do Viajante](../backlog/STORY-002-viajante-exploration.md).
