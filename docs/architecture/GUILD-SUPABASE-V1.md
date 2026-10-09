# Guilda/Célula Supabase V1

## Estado

A implementação, migration e rollback estão versionados. A migration `0001_guild_supabase_v1.sql` **não foi aplicada automaticamente** ao projeto Supabase real. O aceite remoto exige aplicação administrativa e teste com duas contas.

Usuários autenticados usam Supabase como fonte principal da Guilda. O fluxo anterior em `localStorage` permanece apenas no modo local explicitamente selecionado e não é enviado ao banco silenciosamente.

## Modelo

| Tabela                   | Responsabilidade                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `guilds`                 | Identidade, descrição, criador, líder atual e estado da Guilda                            |
| `guild_members`          | Vínculo do Traveler, papel e estado; índice parcial garante uma Guilda ativa por Traveler |
| `guild_invites`          | Base preparada para convites dirigidos; UI completa fica para uma etapa futura            |
| `guild_join_requests`    | Pedidos de entrada e decisão objetiva do líder                                            |
| `guild_missions`         | Missões, modo de conclusão, tier, janela temporal e metadata pequena para extensões       |
| `guild_mission_progress` | Início, submissão, aprovação/rejeição e claim por membro                                  |
| `guild_reward_claims`    | Ledger imutável/idempotente por missão e Traveler                                         |

Roles suportadas pelo banco: `leader`, `co_leader`, `moderator` e `member`. A V1 cria e autoriza administrativamente apenas `leader` e `member`; os outros valores reservam evolução sem conceder poderes implícitos.

Estados de membership: `active`, `pending`, `left`, `removed`. Estados de missão: `draft`, `published`, `closed`, `cancelled`. Estados de progresso: `available`, `started`, `pending_approval`, `completed`, `rejected`.

Tipos aceitos incluem `journey_gate` e `collective_challenge`, mas a V1 não desbloqueia automaticamente a Jornada nem implementa placar coletivo.

## Autorização e RLS

Todas as sete tabelas têm RLS. O browser autenticado recebe somente `SELECT`; não recebe `INSERT`, `UPDATE` ou `DELETE` direto nelas.

As policies permitem:

- ler Guilda e membros somente quando o usuário possui um Traveler membro ativo daquela Guilda;
- ler pedidos quando o Traveler pertence ao usuário ou quando o usuário é líder daquela Guilda;
- membros ativos lerem somente missões publicadas; líder também pode ler drafts;
- membro ler o próprio progresso; líder ler o progresso da própria Guilda;
- claims visíveis somente ao beneficiário ou líder correspondente.

Ownership nunca depende apenas do `traveler_id` recebido: helpers verificam `travelers.user_id = auth.uid()`.

Helpers de policy e RPCs usam `SECURITY DEFINER` somente porque precisam atravessar RLS ou concluir transações multi-tabela. Todos usam `search_path = ''`, argumentos tipados, revogação de `PUBLIC`/`anon` e grants explícitos. `apply_guild_mission_reward` não é executável pelo papel `authenticated`.

## Fluxos

### Criação e entrada

1. `create_guild` valida ownership e ausência de membership ativa.
2. Cria Guilda e membership `leader` na mesma transação.
3. Outro membro envia `request_join_guild` usando o UUID exato.
4. `review_guild_join_request` exige Traveler líder pertencente ao usuário; ao aceitar, cria membership ativa.
5. O índice `guild_members_one_active_guild_per_traveler_idx` impede duas Guildas ativas inclusive sob concorrência.

### Missão

1. Líder cria draft ou publica via `create_guild_mission`.
2. Missão recebe apenas `reward_tier`; não existem `customXp`/`customCoins`.
3. Membro inicia via `start_guild_mission`.
4. `submit_guild_mission`:
   - `self_complete`: conclui e processa recompensa na mesma transação;
   - `leader_approval`: move para `pending_approval`.
5. `review_guild_mission` aprova e recompensa, ou rejeita permitindo nova tentativa.

Notas são opcionais, limitadas a 500 caracteres e descritas na UI como evidência objetiva da atividade. Não existe campo de fé, espiritualidade, oração, foto, áudio, localização ou Diário.

## Recompensas

A fonte compartilhada no app é `guildMissionRewards` em `@rpg/game-engine`:

| Tier            |  XP | Moedas | Baú          | Quantidade |
| --------------- | --: | -----: | ------------ | ---------: |
| `normal`        |  80 |     25 | Comum        |          1 |
| `great`         | 240 |    100 | Incomum      |          1 |
| `epic`          | 480 |    220 | Raro         |          1 |
| `extraordinary` | 720 |    360 | Épico        |          1 |

Baú Extraordinário não é concedido por Missões da Guilda. Ele permanece reservado para eventos, chefões, conquistas e conteúdo excepcional futuro.

Os mesmos valores estão fechados no SQL. O browser envia somente o tier durante a criação. No processamento, `guild_reward_claims` possui `UNIQUE(mission_id, traveler_id)`; `INSERT ... ON CONFLICT DO NOTHING` decide se XP, moedas e Baú podem ser aplicados. O grant reutiliza `grant_traveler_chest` com a chave `guild_mission:{missionId}:{travelerId}` na mesma transação. Repetição, F5 ou corrida concorrente não duplicam a recompensa.

## Data layer e UI

- `guild-repository.ts`: contexto, criação, pedidos, decisão, saída e listagem mínima de membros.
- `guild-mission-repository.ts`: listagem, criação/publicação, início, submissão, review e painel de progresso.
- `OnlineGuildHub`: estados loading/error/sem Guilda/pedido pendente, abas Visão geral/Missões/Membros, formulário do líder, cards do membro e aprovações.
- `GuildHub`: escolhe `OnlineGuildHub` somente quando Auth está `signedIn`; modo local preserva a implementação anterior.

Nenhum componente React chama o cliente Supabase diretamente.

## Aplicar no Supabase real

1. Confirmar backup e projeto correto.
2. Aplicar primeiro `0000_initial_supabase_gameplay.sql` se ainda não estiver aplicado.
3. Garantir que `0001_guild_supabase_v1.sql` e `0002_traveler_chests.sql` estão aplicadas. A aplicação da `0002` foi confirmada pelo usuário em 2026-09-30.
4. Aplicar `packages/database/migrations/0003_guild_mission_chest_rewards.sql`, que substitui somente `apply_guild_mission_reward` e não altera tabelas nem RLS.
5. Não executar arquivos `.down.sql` em produção sem um plano explícito de rollback.
6. Atualizar/recarregar o schema cache do PostgREST se necessário.
7. Executar o roteiro real abaixo com duas contas e Travelers distintos.

## Aceite real obrigatório

1. Conta A cria Guilda com Traveler A1; confirmar A1 `leader`.
2. Conta B, Traveler B1, envia request pelo UUID; A aceita.
3. B não consegue executar `create_guild_mission`; A cria draft e publica.
4. B visualiza published, inicia e conclui uma `self_complete`; conferir XP/wallet/Baú e claim único.
5. Repetir request/submit/F5 e confirmar que XP, moedas e Baú não duplicam.
6. Criar missão `leader_approval`; B envia, A rejeita, B reinicia/reenvia e A aprova; confirmar que nada foi concedido antes da aprovação.
7. Criar Guilda C com outra conta/contexto e confirmar que A/B não leem nem alteram tabelas de C.
8. Tentar IDs de Traveler alheio em todas as RPCs; esperar erro/zero acesso.
9. Reabrir em outro navegador e confirmar Guilda, membros, missões, progresso e Baú remotos.
10. Confirmar os quatro mapeamentos e que nenhuma Missão concede Baú Extraordinário.

Sem essas evidências, o código pode passar QA local, mas a entrega remota não deve ser marcada como aceita no projeto real.
