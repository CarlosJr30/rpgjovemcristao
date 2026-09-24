> SUPERSEDED — histórico da TASK-0003. Não rege o produto atual. Ver [MVP vigente](../MVP.md), TASK-0006.

# MVP → Uma jornada para reconstruir

Design v1, 2026-09-16, TASK-0003. Especificação documental, sem software implementado. Compatível com [ADR-0001](../../adr/ADR-0001-technical-stack.md).

## Experiência e público

Vertical slice single-player web em português: criar conta, entrar, criar personagem, explorar um mapa com três nós, acompanhar pequenas cenas, resolver desafios, vencer treinos por turnos, receber itens/XP, subir de nível e retomar o progresso salvo. O encerramento da terceira missão conclui uma pequena história; não depende de conteúdo futuro para fazer sentido.

Público de design: jovens iniciantes em RPG, com linguagem simples e sem violência gráfica. Hipótese operacional para o primeiro piloto: adultos de 18 anos ou mais, sem cadastro de menores nesta primeira exposição. Isso delimita o piloto, não redefine o público futuro nem constitui classificação indicativa ou avaliação jurídica. Política de idade, retenção, exclusão/recuperação de conta e tradução editorial em português precisam ser fechadas antes de abrir cadastro real. Não coletar data de nascimento completa para personalizar gameplay.

Meta a validar em playtest futuro: 20–30 minutos na primeira jornada, missões de 5–8 minutos e pausas livres. Estes tempos e o balanceamento são hipóteses, não resultados medidos.

## IN MVP

| Área | Limite fechado |
| --- | --- |
| Identidade | Cadastro por e-mail/senha, login/logout, sessões persistidas via Better Auth; fluxos de verificação e recuperação definidos antes da exposição pública |
| Personagem | Um por conta, pseudônimo privado e retrato padrão; níveis 1–3, quatro atributos, uma habilidade |
| Campanha | Uma campanha, uma era, uma região, um capítulo e três missões lineares; início em Neemias como recorte de demonstração |
| Conteúdo | Três cenas breves de contexto, três desafios simples e três batalhas: dois adversários de treino e um boss instrutor fictício |
| Interação | Mapa por nós com prévia/estado, diálogo curto com identificação editorial, escolha sem ramificação permanente |
| Combate | 1 contra 1, rodadas sem cronômetro, atacar/defender/habilidade; sem aleatoriedade |
| Progressão | XP fixo, dois aumentos de nível, recompensas únicas, desbloqueio linear |
| Itens | Três itens únicos, dois slots de equipamento e inventário com quatro espaços; sem consumíveis |
| Persistência | Autosave confirmado pelo servidor a cada transição; retomada de cena, desafio e batalha; uma missão ativa |
| Acesso | Desktop/celular, toque/teclado, texto redimensionável, movimento reduzido e alternativa em lista ao mapa |

## OUT OF MVP

Social, chat, guildas, ranking, PvP, cooperação, monetização, moedas, lojas, crafting, loot aleatório, raridades, classes, talentos, múltiplos personagens, árvore de habilidades, quests diárias, conquistas, temporadas, mundo aberto, movimento contínuo, engine gráfica, áudio obrigatório, assets gerados nesta tarefa, editor/CMS, múltiplas eras jogáveis, tradução integral da Bíblia, PWA/offline e cadastro de menores no piloto.

## Fontes de verdade

- [Loop e persistência](CORE-GAMEPLAY-LOOP-NEHEMIAH.md): estados, retomada e conclusão.
- [Personagem](CHARACTER-SYSTEM-NEHEMIAH.md): números de progressão, catálogo e equipamento.
- [Batalha](../BATTLE-SYSTEM.md): ações, fórmulas, adversários e exemplos.
- [Campanha](CAMPAIGN-STRUCTURE-NEHEMIAH.md): missões e proveniência editorial.

## Arquitetura e segurança de design

React/DOM apresenta mapa, cenas, ficha e batalha. Next recebe intenções HTTP; aplicação verifica sessão, propriedade e pré-requisitos; engine TypeScript calcula regras; persistência Drizzle/PostgreSQL confirma uma transação antes da resposta. Better Auth cuida de identidade, não autoriza recompensas. Nenhum novo serviço, pacote ou ADR é necessário. Um boss é um inimigo com padrão próprio, não um subsistema.

O servidor decide dano, resultado, XP, nível, loot, posse e desbloqueio. Cliente informa apenas intenção, recurso, versão esperada e identificador da operação. Rejeitar campos econômicos e comandos inválidos. Aplicar os controles da [stack](../../architecture/TECH-STACK.md): autorização por dono em toda leitura/mutação, CSRF/origem, cookies seguros, validação de entrada, rate limiting, respostas privadas sem cache compartilhado, logs mínimos e sem secrets.

Coletar apenas identidade necessária à conta, pseudônimo, progresso e registros operacionais mínimos; sem localização, contatos, denominação religiosa ou perfil público. Pseudônimo não precisa ser único entre contas. Política de retenção e atendimento de exclusão deve incluir backups e logs antes do piloto; não se afirma conformidade legal nesta entrega.

## Aceite futuro do produto

1. Conta nova chega à M1; conta existente retoma o estado oficial. Criar personagem duas vezes não gera duplicata.
2. M1 → nível 2 e M2; M2 → M3; M3 → nível 3 e epílogo. Cada concessão ocorre uma única vez.
3. Fechar a aba durante uma batalha e entrar novamente preserva a última rodada confirmada.
4. Repetir comando, perder resposta ou usar duas abas não duplica ações, XP ou itens; dono de outra conta não acessa o recurso.
5. Derrota permite nova tentativa gratuita; nenhuma resposta de desafio produz bloqueio permanente.
6. Em viewport de 360 px, mapa/lista, controles e textos funcionam sem rolagem horizontal; foco visível, alvos de toque de pelo menos 44 px, estados não dependem só de cor e resultados são anunciáveis por leitor de tela.
7. Toda cena revela sua classificação e referência quando aplicável; nenhum treino é apresentado como acontecimento bíblico.

Aceite desta tarefa é a coerência e completude da especificação. Aceite de software, acessibilidade real, diversão, desempenho e segurança implementada exigem desenvolvimento/testes futuros autorizados.

