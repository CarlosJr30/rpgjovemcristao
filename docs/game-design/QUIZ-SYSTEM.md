# Quiz Bíblico

Fonte oficial do Quiz, TASK-0007. Especificação de produto; nenhuma implementação, pergunta final, schema ou integração aprovada.

## Papel e capacidades

Toda fase principal deve possuir um Quiz Bíblico sobre conhecimento objetivo do conteúdo bíblico apresentado naquela fase. Pode pontuar gameplay; não mede fé nem substitui reflexão ou grande desafio. A distinção dos quatro pilares e o contrato de fase estão no [loop](CORE-GAMEPLAY-LOOP.md).

O sistema deverá suportar banco de perguntas por fase, seleção aleatória por tentativa, alternativas, resposta correta, explicação após resposta, referência bíblica, pontuação, melhor resultado, repetição, dificuldade e prevenção de farming infinito de XP. Modelo inicial recomendado: aproximadamente **10 perguntas por tentativa**, selecionadas de um banco maior por fase. Quantidade configurável pelo design, não constante permanente; tamanho final do banco e política de sorteio ainda pendentes.

Obrigatoriedade de presença na fase não define nota mínima de aprovação. Critério de conclusão, relação com desbloqueio, dificuldade e cálculo de pontos precisam de especificação posterior; não inferir bloqueio por desempenho nem exigir acerto perfeito.

## Consulta e conteúdo

O jogador pode consultar a Bíblia durante o Quiz. A ação conceitual **“Abrir na Bíblia”** apresenta a referência correspondente. Consultar não retira pontos, aplica penalidade, impede recompensa ou constitui trapaça. Incentivar consulta em caso de dúvida é objetivo do sistema.

Integração externa depende de decisão técnica e licenciamento; não selecionar provedor, API ou deep link aqui. Perguntas, respostas e explicações seguem os gates de [conteúdo bíblico](../biblical/README.md); não converter interpretação controversa em resposta objetiva obrigatória nem avaliar experiências espirituais pessoais.

## Recompensas e replay

Possibilidades: XP de gameplay, moedas, conquistas, colecionáveis, objetivos de conclusão e bônus por desempenho. XP representa somente progressão no jogo, conforme [personagem](CHARACTER-SYSTEM.md). Nenhum valor numérico final é definido.

Modelo conceitual: primeira conclusão concede recompensa principal; melhoria de recorde pode conceder bônus; repetições ilimitadas não duplicam indefinidamente recompensas. Replay preserva conclusão e melhor resultado anterior quando a nova pontuação for menor. Consultar a Bíblia mantém a mesma elegibilidade de pontos, recorde e prêmio.

Antes de implementar, definir critérios limitados de bônus e uma política com teto finito de concessões/XP por objetivo, incluindo mudanças de dificuldade e versões do conteúdo. Uma tentativa nova, perguntas diferentes ou novo ID de operação não criam por si só um novo direito a prêmio. Melhorias infinitas, reset de recorde ou troca de dificuldade não podem reabrir a recompensa principal. Política exata, comparabilidade de resultados, valores e limites permanecem pendentes.

## Cenários de aceite futuro

- Consulta à referência durante tentativa: nenhum desconto de pontos ou prêmio.
- Erro: explicação objetiva e referência, sem julgamento espiritual.
- Repetição com nota menor: mantém melhor resultado e conclusão, sem novo prêmio principal.
- Melhoria de recorde: bônus somente se houver regra limitada publicada; sem regra, nenhum bônus presumido.
- Retry/reconexão: conserva perguntas e estado confirmado da tentativa; não sorteia novamente para explorar a retomada nem duplica concessão.

Pontuação é conhecimento objetivo no jogo; não equivale ao atributo Sabedoria nem à maturidade cristã. Tempos, acessibilidade, checkpoints e testes reais serão detalhados em tarefa futura.
