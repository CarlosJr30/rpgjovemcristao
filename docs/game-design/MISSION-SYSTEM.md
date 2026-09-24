# Sistema de missões e comunidade

Fonte oficial de MISSION SYSTEM e COMMUNITY / LEADER CONCEPT, TASK-0006. Regras conceituais; nenhum RBAC implementado.

## Categorias

| Categoria | Realização e verificação | Papel na jornada |
| --- | --- | --- |
| IN-GAME | Exploração, descoberta, puzzle, interação e objetivos; sistema verifica eventos e condições oficiais no servidor | Sustenta progressão principal e objetivos opcionais |
| REAL-WORLD / COMMUNITY | Atividade prática fora do jogo ou na comunidade; política de verificação explícita por missão, exigindo líder autorizado no desafio final de fase | O desafio final é gate obrigatório entre fases; desafios especiais permanecem opcionais |

Cada definição informa objetivo observável, categoria, pré-requisitos, critério de conclusão, verificador, prêmio previsto e elegibilidade de repetição. Não usar declarações de fé, qualidade de oração ou santidade como critérios. Atividade prática pode incentivar cooperação e serviço sem classificar valor espiritual. Missão externa sem líder somente usa política explicitamente aprovada para ela; autodeclaração não equivale a validação automática de algo fora do jogo.

## Fluxo automático

Disponível → em andamento → objetivos verificados → concluída com concessão atômica. Cliente pede ações; servidor verifica cumprimento. Eventos forjados, pré-requisitos ausentes e comandos repetidos não completam nem pagam missão. Replay cria tentativa sem apagar a conclusão principal; ver [loop](CORE-GAMEPLAY-LOOP.md).

## Fluxo com líder

ATRIBUÍDA → JOGADOR REALIZA → SOLICITA CONCLUSÃO → PENDENTE → LÍDER ANALISA → APROVADA / RECUSADA → SISTEMA PROCESSA PROGRESSÃO.

Realização fora do jogo não é fato comprovado pelo clique do jogador. Solicitação registra apenas o necessário para identificar missão, jogador e vínculo autorizado; sem foto, localização, contatos ou relato devocional obrigatório.

- PENDENTE: nenhuma concessão; jogador segue jogando outras atividades.
- APROVADA: confirmação do cumprimento objetivo. Sistema valida autorização e elegibilidade, registra decisão, conclusão e prêmio único atomicamente. Líder não escolhe quantidade de XP/moedas.
- RECUSADA: sem prêmio e sem perda do progresso anterior; motivo objetivo e respeitoso, visível ao solicitante e responsáveis autorizados. Corrigir/realizar novamente e reenviar cria nova revisão identificável, sem sobrescrever histórico.
- Reenvio enquanto pendente não cria solicitações paralelas. Duas decisões concorrentes: somente a primeira válida confirma; a outra recebe conflito. Repetir aprovação ou trocar ID do comando não repaga.
- Falha antes do commit não deixa aprovação paga parcialmente; resposta perdida recupera recibo. Mudança de regra não altera prêmio de solicitação em curso implicitamente.
- Sem líder disponível, vínculo removido ou permissão revogada: solicitação não é aprovada por fallback automático. O conteúdo da fase concluída permanece acessível, mas a fase seguinte continua bloqueada. Reatribuição a outro líder exige autorização atual na mesma comunidade.

Correções de decisão já confirmada exigirão política administrativa e trilha próprias; não implementar estorno nem editar concessão silenciosamente. Recusa/cancelamento não significa falha espiritual.

## PLAYER, LEADER e ADMIN

| Papel conceitual | Escopo permitido futuramente | Limite |
| --- | --- | --- |
| PLAYER | Jogar e acompanhar/solicitar suas missões | Não aprova sua própria realização nem se promove a líder |
| LEADER | Ver pendências e atividades autorizadas da comunidade, aprovar/recusar critérios objetivos | Sem acesso global, credenciais, reflexões privadas ou ajuste livre de recompensas |
| ADMIN | Administrar aspectos explicitamente autorizados de comunidades e permissões | Não recebe acesso irrestrito por título; ações sensíveis exigem autorização e auditoria |

Conta, personagem e vínculo com igreja são processos separados. O vínculo não é necessário para criar personagem ou concluir o conteúdo da primeira fase, mas passa a ser obrigatório no gate entre fases. Convite/adesão, verificação de liderança, eventual multiplicidade de vínculos e revogação precisam de autorização real antes de operação. Uma permissão sempre inclui ação e comunidade; papel autodeclarado não tem autoridade. Quem também joga não aprova a própria missão; outro líder autorizado deve analisar.

Leitura e decisão verificam sessão, comunidade, vínculo atual e escopo no servidor, inclusive após revogação e ao consultar recibos. Solicitação conserva comunidade de origem; mudar vínculo não transfere dados para outra igreja. Negar acesso entre comunidades sem revelar existência/detalhes de membros. Listas mínimas e paginadas; sem ranking de práticas espirituais ou exposição pública de recusas.

Associação religiosa e atividades comunitárias demandam tratamento cuidadoso de privacidade. Coletar somente o necessário; sem denominação, prova de fé, confissão ou conteúdo de oração. Antes de operar: fechar público, visibilidade, retenção/exclusão, convites, abuso e responsáveis. Política de dados não é declarada resolvida por este design.

## Progressão comunitária

Prêmios seguem [progressão](CHARACTER-SYSTEM.md). O desafio final aprovado concede uma recompensa única definida pelo sistema e libera a próxima fase; o líder nunca escolhe números livres. Desafios especiais são opcionais, usam tiers centrais GRANDE, ÉPICA e EXTRAORDINÁRIA e não substituem o gate. Prática espiritual não tem multiplicador, ranking ou preço moral.

## Desafios especiais

Líder autorizado pode publicar desafios opcionais para toda a Guilda, grupo selecionado ou jogador específico. Cada definição registra ID único, título, descrição, categoria, público, criador, criação, prazo opcional, tier e estado. O líder escolhe somente o tier; XP, moedas, raridades permitidas e quantidade de itens vêm de `specialChallengeRewardTables`. Submissão e validação são individuais, salvo futura meta coletiva explicitamente configurada. Concessão usa `challengeId + travelerId` e `rewardClaimed`, impedindo pagamento repetido após reload, reconexão ou nova abertura da tela.
