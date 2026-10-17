# COMBAT CARD SYSTEM V1

TASK-0076 · revisão de 15/10/2026 · implementação local em validação; publicação não presumida.

## Contrato de combate

A Arena principal usa um motor puro e determinístico, independente do React. A experiência anterior permanece em `/journey/arena/legacy`, com motor, assets e pipeline Body-Fit preservados. A nova experiência está em `/journey/arena` e não utiliza nome de jogador, saldo especial nem qualquer privilégio do Chat A.

Cada duelo cria 20 instâncias únicas de cartas: Golpe Rápido ×3; Golpe Poderoso, Ataque Preciso e Defesa Firme ×2 cada; e uma cópia de cada um dos outros onze tipos. Há 15 tipos no total. Todas as cartas básicas e os três especiais de treinamento fazem parte deste baralho inicial autorizado; nenhum baú, compra ou monetização é exigido. Não há coleção persistente de cartas de ação nem consumo de itens de inventário nesta versão.

A semente inicial embaralha o baralho com Fisher–Yates e PRNG determinístico. Resolução de dano, intenções e efeitos não usa sorteio. A mesma configuração, semente e sequência de comandos produz o mesmo resultado. O navegador gera apenas o ID do duelo e a semente; não existe endpoint novo de concessão.

## Ciclo de turno

1. O jogador começa com cinco cartas, três de Energia e um de Foco (dois se possui Botas equipadas).
2. A intenção do adversário é visível. O jogador pode selecionar/ampliar uma carta, consultar custo/efeito e confirmar a jogada por toque ou teclado.
3. Cada jogada valida fase, revisão esperada, presença da instância, Energia e Foco antes de clonar o estado e aplicar os efeitos. A carta utilizada sai da mão e entra no descarte temporário.
4. **Cartas não usadas permanecem na mão ao encerrar o turno.** Não se compra uma mão nova. Energia não usada é perdida; não acumula.
5. O adversário executa uma ação anunciada. Seu Bloqueio anterior expira no começo dessa ação; nova Defesa protege contra o próximo turno do jogador.
6. Se ninguém chegou a zero de Vida, o jogador recebe três de Energia e um de Foco, limitado a seis. Seu Bloqueio e Contra-ataque anteriores expiram. Compra apenas o número de cartas necessário para completar cinco.
7. Quando a pilha de compra esvazia, o descarte é reembaralhado. As 20 instâncias são conservadas entre mão, compra e descarte.

Preparação compra somente uma carta após pagar uma Energia e respeita a mão máxima. Nenhuma carta gera Energia. Recuperação de Foco custa zero, não compra cartas e também vai ao descarte. Mesmo se uma instância reaparecer por reembaralhamento, a energia finita e a ausência de compra gratuita impedem ciclos infinitos de compra. Revisões antigas e duplicação do mesmo comando são rejeitadas.

Há limite defensivo de transcrição de 2.000 comandos por treino, para não aceitar saves ilimitados. Ao se aproximar do limite, novas jogadas são recusadas e permanece a opção de encerrar sem recompensa e iniciar outro duelo. Não se elege vencedor por Vida percentual nem por animação: vitória/derrota ocorre quando uma Vida chega a zero. Encerrar voluntariamente põe a Vida do jogador em zero e concede derrota sem recompensa.

## Ações e efeitos

| Categoria | Tipos | Regra principal |
| --- | --- | --- |
| Ataque | Golpe Rápido, Golpe Poderoso, Ataque Preciso | Custos 1/2/1; dano baseado no cálculo existente de Força, Defesa e poder dos equipamentos. Preciso ignora Defesa, preservando Bloqueio |
| Defesa | Defesa Firme, Postura Protetora, Contra-ataque | Bloqueio temporário; Postura enfraquece a próxima ação inimiga; Contra-ataque devolve até quatro do dano bloqueado |
| Fé / atitude de treino | Coragem, Esperança, Perseverança | Próximo ataque fortalecido; recomposição de Vida; Bloqueio e Foco |
| Tática | Preparação, Concentração, Recuperação de Foco | Compra limitada, preparação ofensiva e Foco, sem gerar Energia |
| Especial | Golpe Heroico, Proteção Radiante, Investida do Viajante | Energia e Foco como custos; impacto forte, Bloqueio ou combinação de ataque e defesa |

Os valores de cada carta ficam no catálogo tipado `COMBAT_CARDS`. Dano real reutiliza `calculateDamage`, somando o ajuste da carta (dano nominal −3), bônus preparado e efeito aplicável. O Bloqueio absorve dano antes da Vida. Preparação ofensiva é consumida por um ataque; limitada a20. Vida, Bloqueio, Foco e dano têm limites; cura não ultrapassa Vida máxima. Esperança cura até5 mais um por três pontos de Sabedoria. Bloqueio é limitado a99. Enfraquecimento reduz em3 a próxima ação ofensiva e expira na ação adversária, inclusive se ela defender/preparar.

Contra-ataque só ocorre se o Viajante sobreviver ao golpe recebido. Um golpe letal encerra a luta como derrota; não permite que um retorno póstumo gere vitória com Vida zero. O histórico informa os valores efetivamente recebidos de Bloqueio/Foco, considerando equipamentos e limites.

Não foram alterados os atributos básicos, catálogo jogável, curva de XP, nível máximo ou recompensa global. Os números das cartas são balanceamento específico desta experiência de treinamento V1.

## Equipamentos como cartas e identidade fixa

Os seis equipamentos jogáveis mantêm IDs, raridades, quantidades, slots e valores. O painel mostra cartas dos equipamentos efetivamente vestidos no Portal. As categorias futuras são metadados extensíveis: espada, couraça, elmo, escudo, botas, medalhão, calças, luvas e acessório. Nenhum slot persistente foi acrescentado nem foram criados450itens.

O snapshot usa os atributos derivados existentes e é fixado ao iniciar o duelo; trocar itens no Portal afeta o próximo duelo. Efeitos suportados do jogador: Espada +1 por ataque; Escudo e Couraça +1 de Bloqueio por carta que concede Bloqueio; Botas +1 de Foco inicial; Medalhão +1 de Foco por carta que concede Foco; Elmo reduz dano anunciado em1, respeitando o mínimo1. O pipeline legado continua separado; a nova apresentação usa a opção existente `AvatarRuntime showEquipment={false}`, sem modificar o save, anatomia ou PNG.

As cartas de equipamento usam molduras, símbolos e texto originais em CSS. Nenhuma arte rara/piloto pendente é liberada. Retratos de treino e Avatar HD reutilizam os assets já elegíveis. Os oito áudios Suno Free permanecem isolados.

## Adversários e conteúdo

Há quatro treinadores fictícios existentes, com perfis ágil, ofensivo, guardião e tático. Padrões determinísticos alternam ataque leve, ataque pesado, Defesa, Preparação e Especial. A intenção informa dano antes do Bloqueio ou quantidade preparada. Especial sem Foco suficiente é anunciado como Preparação; o efeito não diverge da intenção após a confirmação do turno. Golpes ficam gradualmente mais intensos após dez turnos, regra local de treinamento para evitar defesa indefinida.

**Classificação editorial: FICTIONAL.** Os nomes dos treinadores não os identificam como personagens bíblicos históricos. Fé, Coragem, Esperança e Perseverança são atitudes simbolizadas em treino; não medem espiritualidade nem controlam milagres. O brilho de Proteção Radiante é efeito visual fictício. Não há citação bíblica nova, versículo inventado, chefe bíblico ou cânone reinterpretado. Revisão editorial feita pelo próprio autor, sem independência alegada.

## Persistência e recompensas

O save versionado de treino é isolado por ID da conta (ou modo local) e UUID do Viajante. Armazena configuração inicial e comandos; ao carregar, o motor reproduz a transcrição. HP, dano, Energia e vencedor não são aceitos de campos calculados fornecidos pelo storage. Transcrições malformadas, estrangeiras ou excessivas são recusadas; o save principal do RPG não é apagado.

A sincronização entre abas usa Web Locks e revisão esperada. Sem suporte a esse mecanismo, a interface falha de forma explícita e não concede recompensa. Cada ação é persistida antes de atualizar a tela; o estado lógico é aplicado antes do término visual. Um comando repetido não joga novamente a mesma carta nem resolve duas ações inimigas.

Recompensas mantêm o contrato existente: vitória8XP/3moedas, até três por adversário por dia no histórico local; derrota e limite diário rendem zero. Reserva persistente e registro conservador no histórico precedem o crédito. Falha de gravação ou aplicação não é exibida como recompensa concedida. Reserva interrompida não é repetida: pode exigir recuperação manual, uma limitação preferida a duplicar créditos. Esse limite e a reserva são locais ao navegador e não se apresentam como antifraude de servidor.

**Limitação de segurança preexistente:** o banco permite ao authenticated escrever no próprio saldo/XP/inventário e chamar crédito sem validar origem. A operação Chat A registrou SEC-0076-01 (contrato corrigido TASK-0077). Esta Arena não corrige nem amplia essa política e não acrescenta endpoint, service role ou privilégio. Esse achado alto continua bloqueando aceite geral de segurança/publicação, conforme governança; não executar migração nem alteração remota para contorná-lo. Recompensa online usa a sincronização existente e não promete confirmação do servidor apenas porque houve gravação local.

## Apresentação, animação e acessibilidade

Componentes consomem estado/eventos do motor; não calculam dano em callbacks de animação. Entrada, idle, preparação/avanço, golpes, reação, Bloqueio, Contra-ataque, especiais, cura, vitória e derrota usam transform/opacity. Cartas entram na mão, ampliam em diálogo, avançam para o campo e seguem para descarte animado. Energia e números são atualizados no estado lógico imediatamente. Rastros, faíscas, poeira, luz e câmera são procedurais e moderados; não existe vídeo gerado nem nova arte externa.

Reduced motion desativa movimento e partículas, mantendo informação e comandos. Botões aceitam toque, mouse, Enter e Espaço; diálogo tem nome, fechamento por Escape e contenção de Tab. Áreas seguras e rolagem vertical atendem telas menores; não é obrigatório arrastar cartas. Matriz inclui portrait/landscape e texto200%. Automação mobile não é aprovação física do POCO X7; manter PHYSICAL_QA_PENDING.

60FPS é meta, não promessa. Não foi realizada medição física de CPU/GPU no POCO. Capturas de frames e testes funcionais não comprovam taxa de quadros. Assets cinematográficos de alto nível não foram gerados: a entrega usa os retratos disponíveis e movimento procedural.

## Arquitetura e futura Guilda

- `packages/game-engine/src/combat-card-system.ts`: estado, catálogo, turnos, energia, baralho, efeitos, IA e replay puros.
- `card-arena-storage.ts`: fronteira versionada de persistência e revisão.
- `card-arena-reward.ts`: reserva e liquidação do resultado com valores existentes.
- `card-arena.tsx` e módulo CSS: seleção, diálogo, palco, eventos e animações.
- Arena clássica permanece independente para reversão e comparação.

Snapshots, categorias de carta e comandos tipados podem servir a futuros papéis de ataque, defesa e suporte. Chefões cooperativos precisam de contrato separado de estado compartilhado, participação por dias, idempotência no servidor e recompensas coletivas ajustadas ao tamanho da Guilda. Nada disso foi persistido ou apresentado como funcional nesta versão.

## Validação

Motor e integração: 21 testes novos (13 do motor e oito de persistência/recompensa); suíte completa com 473 testes em 70 arquivos aprovada. Regressão E2E ampliada: 226 PASS, zero falhas e dois skips exclusivos de casos mobile no desktop, em 228 casos, sem retries. Build otimizado, lint e typecheck passaram; gates preservam 54 Avatares, quatro bindings Body-Fit e oito áudios restritos. A rodada focada do artefato final passou12/12 nos três navegadores, incluindo Energia animada e reduced motion. Resultados, screenshots, build IDs e bloqueios ficam em [TASK-0076-COMBAT-CARD-REPORT.md](TASK-0076-COMBAT-CARD-REPORT.md). A implementação permanece local; Security bloqueado não autoriza inferir deploy ou DONE.
