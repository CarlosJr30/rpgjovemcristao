# MVP e fontes oficiais de design

Atualizado pela TASK-0007, 2026-09-17. Nova dinâmica oficial; especificação documental, sem autorização de implementação.

GENESIS 2-3 / O JARDIM E A ESCOLHA -> CURRENT VERTICAL SLICE.
NEHEMIAH VERTICAL SLICE -> SUPERSEDED.

O [MVP anterior](history/MVP-NEHEMIAH.md) é histórico. Suas três missões lineares, combates obrigatórios, exclusão de moedas, consulta sem replay e números de balanceamento não definem o novo MVP. O sistema de batalha permanece disponível para contexto apropriado.

## Fontes de verdade

| Assunto | Fonte oficial única |
| --- | --- |
| GAME VISION | [Projeto](../../projects/RPG-JOVEM-CRISTAO.md) |
| CORE GAMEPLAY LOOP | [Loop](CORE-GAMEPLAY-LOOP.md) |
| MISSION SYSTEM | [Missões e comunidade](MISSION-SYSTEM.md), categorias e fluxos |
| QUIZ BÍBLICO | [Quiz](QUIZ-SYSTEM.md), consulta, resultados e replay |
| CONTRATO DE FASE | [Loop](CORE-GAMEPLAY-LOOP.md), quatro pilares e ordem flexível |
| PERSONAGEM E ATRIBUTOS / PROGRESSION & REWARDS | [Personagem](CHARACTER-SYSTEM.md) |
| BIBLICAL CONTENT RULES | [Integridade bíblica](../biblical/README.md) |
| MINIGAME / GREAT CHALLENGE RULES | [Campanha](CAMPAIGN-STRUCTURE.md), regra dos grandes desafios |
| COMMUNITY / LEADER CONCEPT | [Missões e comunidade](MISSION-SYSTEM.md), papéis e acesso |
| CODEX / COLLECTION SYSTEM | [Codex](CODEX-COLLECTION.md) |

Este índice delimita o recorte; regras são mantidas nas fontes acima, não copiadas aqui. Documentos históricos não têm precedência sobre elas. [Impacto técnico](../architecture/CENTRAL-DYNAMICS-IMPACT.md) identifica o que revisar na modelagem antes de implementação.

## O que está fechado e o que falta

Fechados: início em Gênesis, identidade da fase 1.1, leis de experiência/conteúdo, categorias de missão, separação do acesso comunitário, funções de progressão e obrigação de grande desafio; Viajante sem classe, quatro atributos provisórios, Quiz por fase e direção macro em oito atos, conforme as fontes acima. São regras de produto, não promessa de que todos os sistemas estarão implementados no primeiro protótipo.

Pendente de especificação do slice: roteiro e enquadramento do jogador, mapa/exploração, objetivos, desafio exato e dificuldade, checkpoints, curva de XP, economia, catálogo e utilidades, entradas iniciais do Codex, duração e critérios detalhados de playtest. Criação sem classes, base comum e atributos seguem a decisão vigente em [personagem](CHARACTER-SYSTEM.md); não são mais pendência de escolha de classes. Quiz exige detalhar banco, critérios de conclusão, pontuação e limites de bônus, sem valores finais aqui.

Comunidade/liderança participam obrigatoriamente do gate entre fases: o conteúdo da fase pode ser concluído sem vínculo, mas a fase seguinte só é liberada após associação, desafio final, submissão e validação objetiva. Não existe fallback solo automático. Desafios especiais continuam opcionais e usam tiers centrais de recompensa. Auth/RBAC reais permanecem pendentes; criação de personagem e associação à igreja continuam processos separados.

Fora desta tarefa: código, dependências, schema/migrations/banco, autenticação/RBAC, integrações externas, minigames executáveis, monetização, Bíblia/Codex completos e cronologia integral.

## Gates futuros

Público de design: jovens iniciantes em RPG. Piloto adulto continua hipótese, sem aprovação operacional; público, privacidade/contas, retenção/exclusão e tradução/licença precisam ser fechados antes de cadastro/publicação. Não coletar dados comunitários até políticas e autorização estarem prontas.

Aceite documental não comprova diversão, performance, acessibilidade ou segurança de software. Slice detalhado precisará mostrar jornada completa, exploração significativa, desafio testável, replay opcional, rótulos editoriais e controles em 360 px; depois requer playtest/testes em tarefa autorizada.
