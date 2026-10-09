# Persistência inicial de gameplay no Supabase

## Estado da entrega

O schema e a migration estão versionados em `packages/database`. A aplicação remota e o teste RLS com duas contas exigem acesso autenticado ao projeto Supabase; não podem ser feitos com a publishable key.

Migration de subida: `packages/database/migrations/0000_initial_supabase_gameplay.sql`.

Rollback destrutivo, somente para ambiente de desenvolvimento vazio: `packages/database/migrations/0000_initial_supabase_gameplay.down.sql`. O rollback remove as seis tabelas e todos os dados nelas; nunca deve ser executado sem backup e confirmação explícita.

## Modelo

| Tabela           | Responsabilidade                              | Ownership                    |
| ---------------- | --------------------------------------------- | ---------------------------- |
| `profiles`       | Perfil mínimo do usuário                      | `id = auth.uid()`            |
| `travelers`      | Identidade visual, XP, nível e Viajante ativo | `user_id = auth.uid()`       |
| `traveler_stats` | Somente atributos-base                        | Viajante pertence ao usuário |
| `wallets`        | Saldo de moedas                               | Viajante pertence ao usuário |
| `inventory`      | Posse e quantidade por `item_id` estático     | Viajante pertence ao usuário |
| `equipped_items` | Item por slot                                 | Viajante pertence ao usuário |

Relações usam `ON DELETE CASCADE` a partir de `auth.users` e `travelers`. `inventory` possui `UNIQUE(traveler_id, item_id)`, coerente com o catálogo atual sem instâncias distintas. A FK composta de `equipped_items` impede equipar um item que não pertence ao mesmo Viajante.

O slot local `amulet` é mantido no banco e corresponde ao rótulo visual “Medalhão”. Os demais slots são `helmet`, `armor`, `weapon`, `shield` e `boots`.

`travelers_user_id_idx` atende a listagem por conta, `inventory_traveler_id_idx` atende a mochila e o índice parcial `travelers_one_active_per_user_idx` garante no máximo um Viajante ativo por usuário.

## RLS e funções

RLS está ativada nas seis tabelas. As policies permitem somente as operações solicitadas ao papel `authenticated`; `anon` não recebe acesso. Tabelas filhas verificam ownership por `EXISTS` em `travelers`.

As funções abaixo usam `SECURITY INVOKER`, `search_path` vazio e permissão somente para `authenticated`:

- `create_traveler`: cria Viajante, stats, wallet, Botas iniciais e slot equipado na mesma transação;
- `set_active_traveler`: troca o Viajante ativo atomicamente;
- `add_coins` e `spend_coins`: atualizam saldo atomicamente; gasto exige saldo suficiente.

`set_updated_at` também é `SECURITY INVOKER` e atende `profiles`, `travelers`, `traveler_stats` e `wallets`.

## Auth e data layer

`apps/web/lib/supabase/auth.ts` centraliza `signUp`, `signIn`, `signOut` e `getSession`. `AuthProvider` mantém um único estado `loading`, `signedIn` ou `signedOut`, garante `profiles` no primeiro login e impede a UI do jogo de aparecer antes de resolver a sessão.

A rota `/auth` fornece somente a tela mínima de email/senha. Nenhuma senha é armazenada pela aplicação.

Repositories centrais ficam em `apps/web/lib/supabase/repositories`. Componentes de gameplay continuam chamando a camada de estado existente; não acessam Supabase diretamente.

## Estratégia de sincronização

Para uma conta autenticada:

1. resolver sessão;
2. carregar dados essenciais do Supabase;
3. reconstruir o `Traveler` local sem persistir atributos totais derivados;
4. preservar no mesmo navegador os campos locais fora deste schema;
5. atualizar o cache local pertencente àquela conta;
6. usar somente esse cache se a leitura online falhar.

Saves locais legados não são associados nem enviados automaticamente. `getLocalTravelerSnapshot` prepara uma cópia validada para um fluxo futuro de migração confirmada.

Mutações essenciais salvam primeiro no cache para não perder a ação do jogador e entram em uma fila online por Viajante. Falhas mostram “Não foi possível salvar online. Seus dados locais foram preservados.”. A fila serial evita reordenar escritas no mesmo navegador.

## Limitações deliberadas

- Jornada, Arena, quiz, devocional, minigame e progresso narrativo permanecem locais. A Guilda Supabase V1 está definida na migration `0001_guild_supabase_v1.sql` e em `GUILD-SUPABASE-V1.md`; só entra em vigor no projeto real depois da aplicação manual e validação RLS.
- Catálogo de itens continua estático; IDs desconhecidos do banco não são materializados na UI.
- XP, stats, inventário e updates diretos de wallet ainda são graváveis pelo cliente autenticado. Isso serve ao desenvolvimento cooperativo atual, não a uma economia competitiva. Recompensas relevantes devem migrar para comandos server-side autoritativos antes de PvP/ranking.
- Concorrência de XP/inventário entre dois navegadores usa última escrita. Moedas usam operações atômicas para adição/gasto.
- Quantidade existe no schema, mas o catálogo atual representa cada equipamento uma vez.

## Configuração manual do projeto

1. Aplicar a migration de subida no projeto correto pelo SQL Editor ou por uma conexão administrativa segura.
2. Em Authentication → URL Configuration, usar `http://localhost:3000` como Site URL local e adicionar `http://localhost:3000/auth` e `http://127.0.0.1:3000/auth` aos Redirect URLs.
3. Para produção, adicionar a URL real da Vercel e sua rota `/auth`; não inventar nem cadastrar um domínio antes de ele existir.
4. Na Vercel, cadastrar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` em Project Settings → Environment Variables.
5. Manter confirmação de e-mail habilitada para produção. Contas de teste devem ser criadas por fluxo controlado e removidas conforme a política do projeto.

## Teste RLS real obrigatório

Com duas contas de teste A e B:

1. A cria A1 e A2; B cria B1.
2. A confirma que lista apenas A1/A2.
3. Com a sessão A, tentar `SELECT` do ID de B1 deve retornar zero linhas.
4. Com a sessão A, tentar `UPDATE` de B1 deve afetar zero linhas.
5. Repetir de B contra A.
6. Confirmar XP, moedas, inventário e slots após reload e em outro navegador.

Sem essa evidência contra o projeto real, a tarefa permanece bloqueada para aceite final mesmo que schema, testes locais e build passem.
