# Impacto técnico da dinâmica central

TASK-0006, atualizada pela TASK-0007 em 2026-09-17. Análise documental; não constitui schema, migração, contrato de API ou autorização de implementação.

## Precedência e escopo

**NEHEMIAH VERTICAL SLICE → SUPERSEDED. GENESIS 2–3 / O JARDIM E A ESCOLHA → CURRENT VERTICAL SLICE.**

As fontes de produto atuais são [MVP](../game-design/MVP.md), [campanha](../game-design/CAMPAIGN-STRUCTURE.md), [loop](../game-design/CORE-GAMEPLAY-LOOP.md), [missões](../game-design/MISSION-SYSTEM.md) e [personagem/progressão](../game-design/CHARACTER-SYSTEM.md). Este documento registra consequências técnicas, sem duplicar suas regras. [DATA-MODEL](DATA-MODEL.md) e [DATABASE-RULES](DATABASE-RULES.md) conservam o desenho anterior como histórico técnico; seus acoplamentos ao slice Neemias não devem orientar implementação nova sem revisão explícita.

O bootstrap local existente continua útil e não muda nesta tarefa. Não existe implementação de gameplay/persistência a migrar. Valores antigos de XP, nível máximo, slots, capacidade e catálogo não se tornam balanceamento de Gênesis por herança.

## Decisões preservadas

Preservar [stack aprovada](TECH-STACK.md), monólito modular, separação entre identidade e personagem, engine sem acesso ao banco, aplicação transacional e persistência PostgreSQL/Drizzle. A UI envia intenções; o servidor valida acesso, condições, resultados e concessões. Conteúdo editorial é separado do estado do jogador e fixa versões por tentativa.

Preservar concessão de negócio única e recibo de transporte como proteções diferentes: trocar operation_id não autoriza novo prêmio. Progresso, XP, moeda, posse e descoberta concedidos pela mesma conclusão precisam confirmar atomicamente. A idempotência se aplica tanto ao resultado automático como à aprovação comunitária. Locks/versões e restrições continuam necessários; o protocolo exato de autorização comunitária ainda deve ser modelado. Classificação/proveniência por unidade e referências bíblicas permanecem adequadas.

## Incompatibilidades e trabalho posterior

| Área | Desenho anterior e incompatibilidade | Revisão técnica necessária, sem implementação nesta tarefa |
| --- | --- | --- |
| MVP e campanha | Sequência M1→M2→M3 de Neemias, encontros E1/E2/E3 e prêmios I1/I2/I3 | Substituir conteúdo inicial por fase 1.1 de Gênesis; definir objetivos e aceite do novo slice antes de modelar catálogo. Não criar toda a cronologia |
| Character | Stats e limiares 0/100/300 centrados em combate; level até 3 | Manter identidade do personagem separada da conta e do vínculo comunitário; revisar evolução, desbloqueios e atributos conforme desafios aprovados. Criação sem classe/especialização e atributos provisórios definidos em CHARACTER-SYSTEM; valores e fórmulas pendentes |
| Mission | chapter_id obrigatório, challenge_spec único e exatamente um Encounter por missão | Representar categoria e verificador automático/comunitário; distinguir missão de fase principal e seus objetivos. Revisar associação de missões comunitárias à campanha; não forçar atividade comunitária a possuir encontro ou capítulo fictício |
| MissionProgress | AVAILABLE/ACTIVE/COMPLETED; etapas NARRATIVE/CHALLENGE/BATTLE fixas | Suportar sequência variável validada pelo servidor, submissão pendente, recusa e reenvio conforme design. Recusa não significa apagar histórico ou impedir nova submissão permitida |
| Concorrência de progresso | Uma ACTIVE global e bloqueio de equipamento durante qualquer ACTIVE | Distinguir execução interativa de espera por aprovação. Pendência comunitária não pode bloquear campanha solo, equipamento ou todo o acesso ao jogo. Redefinir limites de simultaneidade sem abandonar locks/versões |
| Reward e RewardGrant | Um Reward por missão; apenas XP e zero/um item; battle_id obrigatório e UNIQUE | Desacoplar concessão de batalha: conclusão automática sem combate e aprovação de líder também são origens válidas. Modelar moeda, descoberta e itens apenas nas cardinalidades necessárias. Preservar rastreabilidade da origem e unicidade de cada direito a recompensa |
| Replay | COMPLETED terminal; replay confundido com histórico detalhado de BattleTurn | Preservar conclusão principal e seu prêmio único, com tentativas posteriores e objetivos opcionais separados. Distinguir revisitar fase de gravar/reproduzir turnos. Definir chave única de descoberta/objetivo; replay não reativa pagamento principal |
| Equipamentos e itens | Bônus attack/defense e slots HAND/PROTECTION apenas | Permitir efeitos limitados e validados por tipo de desafio/exploração e aparência. Não antecipar linguagem genérica de efeitos. Item nunca autoriza alterar evento canônico; recalcular snapshots conforme tentativa |
| Moedas | Nenhum saldo ou concessão de moeda previsto | Modelar entradas/saídas autorizadas e invariantes de saldo não negativo, concorrência e idempotência. Separar economia interna de qualquer monetização; custo e balanceamento pendentes |
| Leader approval | Todas as escritas/recibos presumem User dono do Character | Separar ator que decide, personagem beneficiário, comunidade, atribuição e submissão vigente. Líder autorizado atua em escopo limitado; não recebe ownership do personagem nem autorização geral de editar XP. Reautorizar também no retry e no commit |
| Church/community | Não há entidade de comunidade, associação ou delegação de liderança | Modelar vínculo opcional e escopo de PLAYER/LEADER/ADMIN, entrada/saída/revogação e acesso mínimo. Não confundir papel autodeclarado com permissão. Conta/personagem e acesso solo independem de aprovação de igreja |
| Codex | ContentUnit/BiblicalReference existem; descoberta individual não existe | Reutilizar proveniência e referência editorial, separar entrada compartilhada de descoberta por personagem. Garantir descoberta única e contadores derivados; não copiar tradução integral protegida nem criar entrada como item de combate artificial |
| Minigames/grandes desafios | Apenas challenge_spec e Battle retomável | Separar definição aprovada, tentativa e resultado verificável por tipo. Definir persistência, pausa, retry, falha e critérios mobile/acessibilidade individualmente. Não construir plataforma genérica de minigames antes do primeiro desafio |
| Battle | Vitória conclui obrigatoriamente toda missão; exatamente dois participantes | Manter sistema documentado disponível somente para encontros apropriados. Battle é uma modalidade possível, não requisito de fase nem origem universal de prêmio. Regras de duas entidades e snapshots valem somente para a modalidade que as aprovar |

## Fronteiras e autorização a detalhar

Missões coordenam objetivos e conclusão; cada modalidade valida resultados sob regras aprovadas; progressão aplica concessões oficiais; comunidade confirma somente a realização da atividade atribuída. O líder não avalia fé, oração ou santidade e não define valores livres de recompensa. Conteúdo/Codex provêm definições e referências, sem depender de identidade ou de Battle para existir. Evitar dependência circular: a aplicação coordena módulos; minigame ou comunidade não escrevem diretamente saldo/inventário.

Uma aprovação futura deverá conferir vínculo e permissão atuais do ator na comunidade correta, atribuição ao beneficiário e submissão ainda pendente. Aprovação e recusa concorrentes não podem ambas confirmar. Reenvio cria uma nova submissão identificável, de modo que decisão atrasada da anterior não afete a atual. A decisão válida e a progressão correspondente formam uma unidade atômica; falha não deixa aprovação paga parcialmente. Autoaprovação deve ser negada por padrão. Escopo administrativo, delegação e revogação exigem contrato antes de RBAC.

O lock de Character protege o beneficiário, mas sozinho não serializa revogação de liderança/associação. A revisão técnica deverá definir uma ordem de locks/versões para essas relações e decisão, prevenindo aprovação após revogação e deadlocks; não estender cegamente a ordem antiga. OperationReceipt precisa distinguir ator e alvo, com leitura autorizada do resultado mínimo, sem abrir consulta irrestrita ao personagem. Evitar coleta de relatos devocionais, fotos, dados de terceiros ou evidências íntimas por padrão; retenção, público e licença continuam pendências anteriores à operação.

## Alternativas e critério de escolha

Reaproveitar Battle como envelope de todo desafio é rejeitado: exigiria inimigos/vitórias artificiais e manteria a concessão presa ao combate. Criar microserviços, workflow engine universal ou tabelas para cada mecânica concebível também é desnecessário. Preferir ampliar o monólito apenas após definir o primeiro desafio e os fluxos mínimos, com contratos pequenos por modalidade e coordenação transacional comum. O detalhamento físico fica para tarefa autorizada posterior, com atualização de ADR quando houver decisão técnica suficiente.

## Parecer e validação documental

ARCHITECT: viável como evolução do monólito atual, condicionado à revisão explícita dos contratos acima antes de implementar gameplay. Não exige troca de stack. Evidência: inspeção das entidades, etapas, FKs, índices e transações de DATA-MODEL/DATABASE-RULES e ADR-0002; nenhum schema/código alterado nesta revisão.

Revisão de mesa: conclusão sem Battle requer remover dependência obrigatória do grant; jogador sem igreja conserva campanha solo; pendência comunitária não ocupa bloqueio global; recusa/reenvio precisa identidade de submissão; aprovações concorrentes concedem uma vez; falha de desafio não concede prêmio e permite retry definido; replay conserva prêmio principal único e pode acrescentar descoberta inédita. São critérios futuros de teste, não testes executados. Mobile, diversão e acessibilidade real dependem de protótipo/playtest; revisão documental não os comprova.

## Impactos das decisões pós-TASK-0006 — TASK-0007

Regras de produto vêm de [personagem](../game-design/CHARACTER-SYSTEM.md), [Quiz](../game-design/QUIZ-SYSTEM.md), [contrato de fase](../game-design/CORE-GAMEPLAY-LOOP.md) e [campanha](../game-design/CAMPAIGN-STRUCTURE.md). Esta tabela delimita trabalho futuro; não altera schema nem o modelo histórico da TASK-0004.

| Área | Impacto futuro e limite |
| --- | --- |
| Character | Base única, nível inicial e identidade Viajante; não exigir classe ou especialização; nome provisório não deve determinar regras |
| Criação de personagem | Separar identidade visual de autenticação e vínculo comunitário; validar nome/avatar permitido no servidor; cosmético não concede stats |
| Atributos | Revisar CharacterStats para Vigor, Percepção, Destreza e Sabedoria; stats antigos de combate não são equivalência aprovada. Definir cálculo/base/crescimento versionados, sem números agora |
| Progressão | Derivar evolução de regras publicadas; possíveis talentos/build exigem design posterior, sem árvore antecipada. Score do Quiz não altera Sabedoria diretamente por inferência |
| Equipamentos | Mapear efeitos limitados aos atributos/desafios aprovados e distinguir utilidade de aparência; snapshot por tentativa e validação de posse preservados |
| Banco/modelo de dados | Revisão futura deve representar definição editorial, tentativa, resultado e direito a prêmio separadamente; não escolher tabelas/colunas físicas nesta tarefa. Preservar ownership, versões e atomicidade |
| Quiz | Banco por fase e dificuldade, alternativas/gabarito/explicação/referência versionados; sorteio fixado na tentativa; validação autoritativa. Não enviar gabarito antecipadamente como autoridade de pontuação; consulta bíblica é permitida |
| Phase/Mission | Fase contém os quatro pilares e ordem flexível; Quiz é componente próprio, não exige Battle nem conversão em missão comunitária. Mapear atos/fases à hierarquia técnica depois do slice; pré-requisitos e critério de conclusão ainda pendentes |
| Reward | Ampliar origens para Quiz sem battle_id obrigatório; distinguir primeira conclusão, eventual bônus limitado por recorde e descoberta única. Serializar recorde/concessão concorrentes e definir unicidade de negócio; versões/dificuldades não podem reiniciar farming |
| Codex | Quiz pode originar colecionável/entrada conforme condição publicada; descoberta idempotente, referência e proveniência compartilhadas, sem duplicar conteúdo bíblico. Informação essencial continua livre |
| UI | Criação com nome/avatar/cosméticos; ficha de atributos com significado mecânico; telas distinguem história/reflexão/Quiz/desafio; alternativas, feedback, referência, melhor resultado e replay acessíveis. Consulta sem rótulo de trapaça ou desconto |
| Leaderboard | Ranking é apenas evolução futura na stack, não existe sistema aprovado/implementado. Se adotado, definir comparação entre bancos/dificuldades/versões, privacidade e visibilidade; nunca ranquear fé, reflexão, Sabedoria espiritual ou penalizar consulta |
| Autosave | Preservar versão, perguntas sorteadas, ordem e respostas confirmadas/cursor da mesma tentativa; retomar sem novo sorteio. Resultado, melhor recorde e concessão atômicos/idempotentes; resposta perdida recupera recibo. Definir checkpoint e retenção mínimos, sem guardar reflexões pessoais |

Revisão de segurança documental: cliente informa intenção, nunca pontuação/prêmio final; acesso restrito ao personagem autorizado e revalidação no retry. Consulta bíblica legítima não é fraude. Exposição pública de resultados, retenção, fornecedor externo e licença continuam gates futuros, sem novo acesso ou serviço autorizado.
