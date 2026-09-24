> SUPERSEDED — histórico da TASK-0003. Não rege o produto atual. Ver [MVP vigente](../MVP.md), TASK-0006.

# Estrutura da campanha e recorte bíblico

Design v1, TASK-0003. Recorte: Neemias 2:11–18, preparação para reconstrução. Não iniciar toda a cronologia bíblica agora. Ordem desta demonstração acompanha o trecho escolhido; era é um rótulo editorial amplo, sem data absoluta ou alegação de cronologia universal.

## Hierarquia

Campaign C1 «Uma jornada para reconstruir» → Era A1 «Retorno e reconstrução» → Region R1 «Jerusalém» → Chapter CH1 «Preparar e cooperar» → Mission M1/M2/M3 → Encounter E1/E2/E3 → Boss em E3.

Campanha agrupa eras; cada era contém regiões; cada região, capítulos; cada capítulo, missões; cada missão, encontros ordenados. Boss é um papel opcional de Enemy dentro de Encounter, não um contêiner obrigatório após toda batalha. No slice há exatamente um encontro de combate por missão; cena e desafio são etapas anteriores. IDs estáveis e ordenação explícita permitem adicionar conteúdo depois, sem exigir editor genérico ou geração procedural.

## Missões

| Missão / pré-requisito | Narrativa e descoberta | Desafio FICTIONAL | Combate / concessão única |
| --- | --- | --- | --- |
| M1 «Observar o caminho» / personagem criado | N1 contextualiza inspeção; F1 apresenta o aprendiz e o pátio | Selecionar dois marcadores destacados de passagem obstruída em três pontos; em lista, selecionar os dois descritos como obstruídos; dica após erro | E1 Parceiro de treino; 100 XP + I2; nível 2 e M2 |
| M2 «Preparar em conjunto» / M1 concluída | N2 contextualiza convite à reconstrução; F2 mostra preparação fictícia | Ordenar Observar → Planejar → Distribuir materiais, com botões subir/descer ou toque; instrução mostra a sequência esperada | E2 Parceiro ágil; 100 XP, nenhum item; M3 |
| M3 «Prontos para começar» / M2 concluída | N3 contextualiza disposição para trabalhar; F3 apresenta treino final | Escolher entre iniciar sem combinar tarefas ou combinar tarefas; esta última conclui, outra oferece explicação e nova tentativa | E3 Instrutora do pátio, boss; 100 XP + I3; nível 3 e epílogo |

Desafios ensinam interação e preparação, sem afirmar que esses exercícios ocorreram na Bíblia. Não existe precisão temporal, arrastar obrigatório ou resposta doutrinária. Recompensa depende da conclusão das etapas, não da quantidade de erros. Objetivos e combate são validados no servidor. Nomes de inimigos, atributos e itens seguem [Batalha](../BATTLE-SYSTEM.md) e [Personagem](CHARACTER-SYSTEM-NEHEMIAH.md).

## Registro editorial por unidade

Textos N1–N3 abaixo são paráfrases próprias em português, não citações nem tradução bíblica oficial. Fonte de conferência: World English Bible, edição WEBP (inglês atualizado, 66 livros), [Neemias 2](https://ebible.org/engwebp/NEH02.htm), consultada em 2026-09-16. A [página da edição](https://worldenglish.bible/) identifica WEBP e declara o texto em domínio público; o nome da tradução identifica a fonte, não estes textos adaptados. Uma edição portuguesa para citações literais do produto ainda não foi escolhida; nenhuma citação literal portuguesa é aprovada aqui.

| ID | Texto/conteúdo definido | Classe | Origem e parecer |
| --- | --- | --- | --- |
| N1 | Neemias chegou a Jerusalém e, depois, saiu à noite para examinar os muros danificados. | CANONICAL | Paráfrase de Ne 2:11–15, WEBP; conferida, sem inserir jogador na inspeção |
| N2 | Neemias convidou o povo a reconstruir os muros de Jerusalém. | CANONICAL | Paráfrase de Ne 2:17, WEBP; conferida |
| N3 | Ao ouvir Neemias, eles se dispuseram a começar a reconstrução. | CANONICAL | Paráfrase de Ne 2:18, WEBP; conferida |
| T1 | Observar, preparar e cooperar orientam as atividades do capítulo. | INTERPRETATIVE | Leitura pedagógica de Ne 2:11–18; não é mandamento, sequência prescrita pelo texto ou consenso teológico |
| F1 | Um aprendiz criado pelo jogador chega a um pátio e participa de um treino. | FICTIONAL | Ponte de gameplay inventada; aprendiz não substitui Neemias nem integra o relato canônico |
| F2 | Ajudante fictício: «Vamos combinar como preparar os materiais?» Respostas: «Vamos observar primeiro» / «Quero ouvir o plano». | FICTIONAL | Diálogo original, ambas respostas levam ao mesmo desafio; nenhuma fala atribuída a personagem bíblico |
| F3 | Instrutora fictícia: «Pronto para o último treino?» Respostas: «Vamos começar» / «Vou revisar meus movimentos». A segunda abre ajuda e retorna à escolha. | FICTIONAL | Diálogo original do boss, sem fala divina ou bíblica inventada |
| F4 | Mapa estilizado, desafios, pátio, adversários, estatísticas, equipamentos e recompensas. | FICTIONAL | Sistemas inventados para interação; mapa não é reconstrução arqueológica |
| F5 | Epílogo: «Você terminou a preparação desta jornada. Seu treino está concluído.» | FICTIONAL | Encerra o arco do aprendiz; não afirma conclusão histórica do muro neste trecho |

Cada cena composta mantém os blocos separados, por exemplo N2 seguido de F2; não recebe rótulo CANONICAL global. Mostrar «Base bíblica — paráfrase, Ne 2:17», «Interpretação temática» ou «Ficção do jogo» junto ao conteúdo, sem depender de cor. Referência/fonte acessível sob demanda; etiqueta visível também durante aceleração. A campanha inteira é uma adaptação, não uma reconstituição literal.

## Limites editoriais

Não combater Neemias, povos, religiões ou inimigos históricos como representação de mal espiritual. Sem recompensas por fé, oração como poder de dano, falas de Deus inventadas, alteração do desfecho bíblico ou alegação de que treinos constam do texto. Derrota do jogador significa falha no treino; não fracasso espiritual. O recorte termina na preparação, não inclui a conclusão dos muros ou episódios posteriores.

Novas unidades precisam de classificação, referência/tradução quando canônicas, justificativa quando interpretativas/ficcionais e nova revisão BIBLICAL CONTENT. A aprovação presente vale apenas para N1–N3, T1 e F1–F5 definidos aqui. Roteiros ampliados, assets e edição portuguesa literal exigem revisão própria antes de publicação.

