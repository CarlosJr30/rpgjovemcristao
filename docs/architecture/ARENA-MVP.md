# Arena dos Viajantes — MVP local

Implementação da `TASK-0023`. A Arena é uma mecânica fictícia de treino. Atributos medem somente gameplay e não representam fé, espiritualidade ou valor pessoal.

## Arquitetura

- `packages/game-engine`: motor puro e determinístico. Não acessa DOM, storage nem modelos mutáveis da Jornada.
- `features/journey/data/arena.ts`: transforma o Viajante e seus equipamentos equipados em `BattleParticipantSnapshot`.
- `features/journey/screens/arena.tsx`: lobby, pré-batalha, batalha, resultado e ações do jogador.
- `features/journey/persistence/arena-storage.ts`: histórico local limitado a 100 registros e contagem anti-farm.
- `BattleChallengeContract`: contrato preparado para desafio assíncrono com snapshots, seed e estados `pending`, `ready`, `in_progress`, `finished` e `cancelled`.

O snapshot guarda nível, atributos totais, equipamentos, efeitos e poder no começo do duelo. Mudanças posteriores no Viajante não alteram aquela batalha.

## Balanceamento central

Todos os números ficam em `battleBalanceConfig`.

- HP máximo: `20 + Vida × 6`.
- Dano ofensivo: `3 + Força × 2,2 + poder dos equipamentos × 0,18`.
- Redução: `Defesa × 1,15`, com dano final mínimo de 1.
- Defender: multiplica o dano por `0,5`; o Escudo da Perseverança usa `0,25`; a Couraça melhora a redução em mais 15% ao defender.
- Sabedoria: contribui com `Sabedoria × 2` para iniciativa, somada a variação seeded de -2 a +2. Também aumenta o multiplicador de Foco.
- Foco: prepara a próxima ação com multiplicador entre `1,18` e `1,55`, conforme Sabedoria.
- Matchmaking local: faixa sugerida de ±10%, com mínimo de 25 pontos.

## Efeitos implementados

| Equipamento | Trigger | Efeito |
| --- | --- | --- |
| Espada do Caminho | `onAttack` | Golpe ativo de uso único; atacar depois de Defender recebe bônus. |
| Escudo da Perseverança | `onDefend` | Guarda ativa de uso único com redução forte. |
| Botas do Viajante | `onLowHealth` | Evita uma vez o golpe que deixaria a vida baixa. |
| Medalhão do Caminho | `onFocus` | Foco ampliado, duas utilizações e cooldown de duas rodadas. |
| Elmo do Viajante | `onRoundStart` | +1 de iniciativa. |
| Couraça do Viajante | `onDefend` | Redução adicional ao Defender. |

## Recompensas e anti-farm

Vitória de treino concede 8 XP e 3 moedas nas três primeiras vitórias do dia contra o mesmo adversário. Depois, o duelo continua disponível sem recompensa. Derrota não concede recurso. O controle é local e serve apenas ao MVP.

## Auditoria de infraestrutura

O projeto não possui backend de aplicação ativo, autenticação, contas remotas nem banco compartilhado. `apps/api` está reservado, e a Jornada usa `localStorage`. Por isso:

- Viajantes salvos no mesmo navegador podem ser selecionados como snapshots de treino controlados pelo sistema.
- Não existe envio, aceite ou resolução real de desafio remoto.
- Recompensas locais não são seguras para competição.

Para PvP assíncrono real ainda são necessários identidade autenticada, persistência compartilhada, autorização por recurso, fila de desafios, execução/validação server-side do motor, idempotência transacional, rate limit e auditoria de recompensas.

## Teste manual

1. Crie ou entre em um Viajante.
2. Abra **Arena** na navegação.
3. Use **Buscar adversário próximo** ou escolha um adversário.
4. Confira os snapshots na pré-batalha e inicie.
5. Alterne entre Atacar, Defender, Focar e Habilidade quando disponível.
6. Confira HP, buffs, efeitos e log por rodada.
7. Termine o duelo, confira estatísticas/recompensa e volte à Arena.
8. Recarregue a página e confirme o histórico.
