# TASK-0026 → Schema Supabase, Auth e persistência online inicial

ID: TASK-0026
TITLE: Schema Supabase, Auth e persistência online inicial
OBJECTIVE: Criar e aplicar o primeiro schema real com RLS e integrar Auth/persistência online gradual dos dados essenciais, preservando localStorage como fallback sem migração automática.
PRIORITY: P1 High
STATUS: ACTIVE
SCOPE: `packages/database` (schema e migrations); `apps/web/lib/supabase` (Auth, tipos, repositories e sync); UI mínima de Auth; integração de bootstrap e dual-write nos fluxos existentes; testes, documentação, memória e este contrato.
OUT_OF_SCOPE: persistência online de Guilda, Arena, Jornada completa, quiz, devocional, minigame, ranking, eventos e migração automática de saves locais existentes; catálogo de equipamentos no banco; redesign.
DEPENDENCIES: TASK-0025.
ASSIGNED_AGENT: DATABASE como responsável pelo schema/migration, com integração FRONTEND autorizada para Auth e data layer; QA e Security revisados pelo próprio autor.
REQUIRED_CONTEXT: pedido do usuário; contexto/estado globais; Drizzle atual; modelo `Traveler`; repositório local; cliente Supabase; documentação local das versões instaladas.
SECURITY_CONSIDERATIONS: RLS obrigatória em todas as tabelas; ownership por `auth.uid()`; nenhuma chave privilegiada no cliente; funções `SECURITY INVOKER`; erros redigidos; dados de dois usuários isolados; migrations aplicadas somente ao projeto explicitamente configurado.
ACCEPTANCE_CRITERIA:

- Migrations versionadas criam `profiles`, `travelers`, `traveler_stats`, `wallets`, `inventory` e `equipped_items`, com FKs, checks, índices e rollback documentado.
- Drizzle permanece fonte do schema e a migration inclui RLS/policies explícitas, triggers de `updated_at` e operações atômicas necessárias.
- Auth email/password oferece `signUp`, `signIn`, `signOut`, `getSession`, estado único e UI mínima, garantindo profile no primeiro login.
- Repositories centrais cobrem travelers, stats, wallets, inventory e equipados; nenhuma chamada Supabase é espalhada em componentes de jogo.
- Usuário autenticado carrega primeiro do Supabase, atualiza cache local e usa cache próprio como fallback sem enviar saves legados automaticamente.
- Criação e mutações essenciais sincronizam Supabase e cache; falhas online preservam dados locais e geram mensagem não destrutiva.
- XP, moedas, inventário e equipamentos persistem por Viajante e reaparecem em outro navegador.
- RLS real impede SELECT e UPDATE entre dois usuários.
- Lint, typecheck, testes e build passam; nenhuma regressão crítica conhecida.
- Uma conta autenticada pode criar e recuperar vários Viajantes sem apagar os existentes; cada agregado remoto permanece isolado por `traveler_id`.
- Com mais de um Viajante, o login/F5 apresenta seleção explícita em vez de entrar automaticamente no primeiro; o `is_active` remoto pode ser destacado, mas a troca continua disponível.
- Criar ou selecionar um Viajante atualiza o ativo por `set_active_traveler`; somente um registro da conta permanece ativo.
- A rota de criação permite continuar com o atual ou abrir o formulário para criar outro sem apagar dados.
- Trocar de Viajante limpa somente a seleção local e preserva a sessão Supabase; sair da conta é uma ação separada e explicitamente chama `signOut`.
- Login com zero Viajantes segue para criação; login com um ou mais sempre apresenta seleção/continuação e a opção de criar outro.

TEST_PLAN:

- Gerar migration pelo Drizzle e revisar SQL/rollback.
- Testes unitários dos repositories, mapeamento, ownership, fallback, múltiplos Viajantes e erros.
- Aplicar migration no projeto Supabase configurado e testar dois usuários reais com credenciais efêmeras, sem registrar seus valores.
- Validar fluxo Auth → criar Viajante → mutar XP/moedas/inventário/equipamento → reload/novo contexto.
- Executar lint, typecheck, suíte de testes e build; revisar diff, dependências e secrets.

DEFINITION_OF_DONE:

- Todos os critérios comprovados; QA/Security documentados; tarefa concluída somente após schema e RLS reais validados.

## Ajuste visual do modal de troca — 2026-09-27

- Somente `apps/web/features/journey/journey.module.css` foi alterado nesta correção. O modal mantém handlers, navegação e Auth intactos.
- Cancelar usa fundo transparente/claro, borda e texto verde; Trocar Viajante usa fundo dourado, texto escuro, hover mais forte, foco visível e disabled legível. Ambos usam 48 px de altura e 154 px de largura.
- Lint/build PASS; teste do Shell 2/2 e E2E dirigido desktop/mobile 2/2 PASS.

## Correção da separação Viajante/conta — 2026-09-27

- Auditoria confirmou que o antigo botão “Sair” chamava `logout()` em `use-journey.ts`; essa função chamava `signOutOnline()` e somente depois `journeyRepository.logout()`, produzindo corretamente o evento Supabase `SIGNED_OUT`, mas com semântica errada para troca de personagem.
- `journeyRepository.logout()` foi renomeado para `clearActiveTraveler()`. `switchTraveler()` usa apenas essa operação, preserva os saves e nunca importa/chama Auth. `signOutAccount()` chama explicitamente Supabase `signOut`, limpa o ativo local após sucesso e leva a `/auth`.
- O cabeçalho substituiu “Sair” por ações distintas: “Trocar Viajante”, “Criar novo Viajante” e, apenas em sessão autenticada, “Sair da conta”. A confirmação de troca informa que a conta continuará conectada.
- `hydrateOnlineTravelers` agora sempre limpa o ativo local após recuperar a conta, inclusive com um único Traveler. A Home redireciona autenticado sem Travelers para `/journey/create`; com um ou mais exibe “Escolha seu Viajante” e a opção de criar outro.
- UNIT PASS: 29 arquivos/144 testes completos; 21/21 focados cobrem troca sem `signOut`, logout da conta com `signOut`, menu, zero/um/múltiplos Travelers, criação autenticada e alteração do ativo. E2E dirigido desktop/mobile 6/6 PASS. Lint, typecheck, build de 19 rotas e `git diff --check` PASS.
- SECURITY REVIEW pelo próprio autor: a troca reduz privilégio/efeito ao limpar somente chaves locais do ativo; logout de conta permanece explícito; nenhum token, credencial ou detalhe de sessão foi adicionado. Sem achado crítico/alto.
- Nenhum schema, migration, RLS, RPC, Guilda, Arena, Jornada narrativa, Quiz ou minigame foi alterado.
- Aceite real pendente: Computer Use retornou `apps=[]`, `browsers=[]` e Edge indisponível. Não foi possível observar a conta atual, criar `TesteWorkLocal`, confirmar as RPCs reais ou capturar `SIGNED_IN`/`SIGNED_OUT`. A tarefa permanece `ACTIVE`.

## Múltiplos Viajantes por conta — 2026-09-27

- O guard de `/journey/create` não encerra mais o fluxo quando existe um Viajante: oferece continuar com o atual ou abrir o mesmo formulário para criar outro, sem apagar o primeiro.
- `hydrateOnlineTravelers` recupera todos os agregados por `traveler_id`. Com um ou mais registros, encerra a seleção local ativa e apresenta escolha explícita; com zero, a Home segue para criação. O `is_active` remoto é apenas destacado e nenhum registro é escolhido implicitamente.
- A criação autenticada chama `create_traveler`, confirma traveler/stats/wallet/inventory/equipados, chama `set_active_traveler`, atualiza cache/ownership e inicia o novo Viajante. A troca aguarda `set_active_traveler` antes de mudar a sessão/cache local.
- Nenhum schema, migration, RLS ou SQL foi alterado nesta extensão. Arena, Guilda, Jornada, Quiz e minigame não receberam mudança comportamental.
- UNIT PASS: 27 arquivos/137 testes; focados 14/14. E2E focado Auth/criação/múltiplos Viajantes desktop+mobile 6/6 PASS. Lint, typecheck, build de 19 rotas e `git diff --check` PASS.
- A suíte E2E completa foi tentada, mas cenários legados que acessam criação sem login nem modo local explícito expiraram antes do fluxo afetado; o conjunto pertinente usa o contrato atual e passou.
- SECURITY REVIEW pelo próprio autor: seleção limitada aos IDs remotos da conta e ao ownership do cache; troca remota confirmada antes da troca local; nenhuma credencial, token ou chave adicionada; nenhum achado crítico/alto.
- Aceite remoto continua pendente: Computer Use retornou `apps=[]`, `browsers=[]`, IAB indisponível e Chrome indisponível. Não foi possível criar `TesteWorkLocal` na conta atual nem confirmar duas linhas reais, F5, storage isolado ou isolamento de dados no Supabase. A tarefa permanece `ACTIVE`.

## Evidências — 2026-09-26

- Drizzle schema: 6 tabelas, RLS/policies, checks, FKs e índices modelados em `packages/database/src/schema.ts`.
- Migration versionada: `0000_initial_supabase_gameplay.sql`, snapshot/journal Drizzle e rollback explícito. `drizzle-kit check`: PASS.
- Data layer: Auth central, estado único, UI `/auth`, repositories por agregado, bootstrap remoto-first, cache associado ao usuário e fila de dual-write com erro não destrutivo.
- UNIT TEST PASS: 22 arquivos e 116 testes; 10 testes focados de schema/migration/repositories/ownership.
- E2E PASS local: suíte preexistente terminou com exit code 0 em 34 casos; Auth dirigido desktop/mobile 2/2 PASS.
- LINT PASS, TYPECHECK PASS em todos os workspaces e BUILD PASS com 19 rotas.
- NO SECRETS: `.env.local` continua ignorado/não rastreado; nenhuma credencial privilegiada adicionada.
- SECURITY REVIEW PARTIAL PASS: revisão estática sem achado crítico/alto; as seis tabelas e quatro RPCs negam acesso anônimo real com HTTP 401 / PostgreSQL `42501`. O teste de isolamento entre duas sessões autenticadas continua pendente.

## Validação remota pós-migration — 2026-09-26

- A migration foi aplicada manualmente pelo usuário no Supabase Dashboard. Diagnóstico real pelo endpoint Auth retornou HTTP 200.
- Probes REST anônimos em `profiles`, `travelers`, `traveler_stats`, `wallets`, `inventory` e `equipped_items` retornaram HTTP 401 / PostgreSQL `42501`; nenhuma tabela retornou `PGRST205`. Isso confirma a presença das relações e a negação ao papel anônimo.
- Probes não graváveis de `create_traveler`, `set_active_traveler`, `add_coins` e `spend_coins` retornaram HTTP 401 / PostgreSQL `42501`; nenhuma RPC retornou `PGRST202` com sua assinatura correta.
- RLS: a migration aplicada habilita RLS explicitamente nas seis tabelas e define policies por ownership; o comportamento remoto anônimo está protegido. A confirmação de isolamento entre usuários autenticados permanece no próximo teste manual.
- QA repetido após a aplicação: lint PASS; typecheck PASS; 22 arquivos/116 testes unitários PASS; build PASS com 19 rotas; E2E `/auth` desktop/mobile 2/2 PASS; Drizzle check PASS.
- A validação solicitada está concluída sem alteração de implementação. A tarefa permanece `VALIDATING` apenas até o fluxo manual com conta real, persistência após F5/outro navegador e isolamento entre duas contas.

## REWORK da criação remota — 2026-09-26

- Falha real reportada: `travelers` permaneceu vazia após a UI informar criação concluída. A tarefa voltou a `ACTIVE`.
- Causa no fluxo: `registerTraveler` persistia/iniciava localmente, disparava a sincronização remota sem `await` e navegava imediatamente; a fila convertia qualquer erro em fallback depois de a UI já ter apresentado sucesso.
- Correção: com sessão Supabase real, `registerTraveler` agora aguarda `createOnlineTraveler`; a função chama a RPC atômica `create_traveler`, valida o ID retornado, lê o traveler/stats/wallet/inventory/equipados remotos e somente então atualiza cache e sessão ativa. Sem sessão, o fluxo local permanece.
- Falha remota não inicia a jornada como sincronizada: preserva cache separado pelo `session.user.id` e retorna `Não foi possível salvar online. Dados mantidos localmente.`. Em desenvolvimento, logs redigidos mostram presença de usuário, início/sucesso/erro e ID retornado, sem token ou chave.
- Segurança: `user_id` não é enviado pelo cliente; a RPC continua usando `auth.uid()`, `SECURITY INVOKER`, grants de `authenticated` e RLS existentes. Nenhum SQL, migration ou policy foi alterado.
- QA local: lint PASS; typecheck PASS; 22 arquivos/119 testes PASS; build PASS com 19 rotas; E2E dirigido Auth/falha de gravação desktop/mobile 4/4 PASS.
- Validação real ainda pendente: não há credencial de teste configurada, e a skill de computador não disponibilizou Chrome, Edge nem navegador integrado. Nenhum usuário fictício foi criado. É necessário repetir a criação autenticada `TesteSupabase` em uma sessão real e confirmar traveler/stats/wallet, F5, segundo navegador e isolamento entre contas antes de DONE.

## REWORK persistente — remoção total do falso sucesso autenticado

- Novo resultado manual confirmou que a UI ainda entrou no jogo sem linha em `public.travelers`.
- Causa residual identificada no código: `registerTraveler` tratava `getSession() === null` como usuário anônimo mesmo quando o contexto da UI estava `signedIn`; além disso, o `catch` de `createOnlineTraveler` ainda gravava o objeto no cache local. Ambos permitiam sucesso local sem confirmação remota.
- Correção: a tela passa o UUID esperado do contexto autenticado; `registerTraveler` valida novamente `getSession()` e `getUser()` pelo mesmo cliente singleton e exige igualdade dos três IDs. Sessão ausente/inconsistente aborta antes da RPC e não grava localmente.
- O `catch` da criação autenticada não salva, não marca ownership e não inicia sessão. RPC, traveler, stats ou wallet ausentes retornam erro visível e bloqueiam navegação. Fallback local existe apenas quando não há sessão nem expectativa autenticada.
- Logs somente em desenvolvimento agora incluem presença/UUID do usuário, início e payload da RPC sem segredo, data e erro estruturado (`code`, `message`, `details`, `hint`, `status` quando disponível). Detalhes seguros também aparecem junto à mensagem de erro em desenvolvimento.
- Assinatura preservada: `public.create_traveler(uuid, text, text, text, text, text, text) returns uuid`, `SECURITY INVOKER`, `authenticated` com EXECUTE, owner obtido por `auth.uid()`; o cliente não envia `user_id`.
- QA: lint PASS; typecheck PASS; build PASS com 19 rotas; 23 arquivos/122 testes PASS; testes dirigidos de sessão/RPC/cache 11/11 PASS; E2E Auth/falso sucesso desktop/mobile 4/4 PASS.
- Aceite remoto segue pendente: a skill de computador voltou a reportar zero navegadores/sessões disponíveis e não há credencial de teste configurada. Nenhum usuário fictício foi criado. Não marcar DONE antes do teste `TestePersistenciaReal` no banco, F5, outra sessão e RLS entre usuários.

## REWORK Auth — login visual sem sessão

- Evidência manual: após o login visual, a criação registrou `[AUTH] user present: false` e `user id: null`; portanto, a falha ocorre antes da RPC e nenhum SQL/RLS foi alterado.
- Causa raiz: a tela `/auth` navegava quando `signInWithPassword` não retornava `error`, sem exigir `data.user` e `data.session` nem revalidar a persistência. Isso permitia sair da tela de login sem sessão utilizável pelo restante do app.
- Auditoria encontrou exatamente uma chamada `createClient`, centralizada em `getSupabaseBrowserClient`; `/auth`, AuthProvider, repositories e sync já usam o mesmo singleton. Não havia clientes A/B distintos.
- Cliente agora declara `persistSession: true`, `autoRefreshToken: true` e `detectSessionInUrl: true`, sem storage customizado. O login exige user/session, revalida `getSession()` + `getUser()` no mesmo singleton, confirma apenas a presença da chave de sessão e só então navega.
- AuthProvider central agora expõe `status`, `session`, `user`, `isAuthenticated` e ação explícita `continueLocally`. Bootstrap valida session/user, serializa `INITIAL_SESSION` e demais eventos atrás da leitura inicial, mantém o gate em loading e atualiza `TOKEN_REFRESHED` sem reidratação duplicada.
- Modo local não é mais inferido por ausência/loading. “Continuar somente neste navegador” virou ação explícita e persistida; criação local exige estado `local`. Estado `signedOut` direciona para `/auth`.
- Logs de desenvolvimento: `[AUTH SIGNIN]` registra erro redigido e presença de user/session; `SUPABASE SESSION STORAGE PRESENT` registra somente booleano; `[AUTH BOOT]` e `[AUTH STATE]` não exibem tokens.
- QA: lint PASS; typecheck PASS; build PASS com 19 rotas; 26 arquivos/129 testes PASS; 9/9 testes focados de singleton/login/bootstrap/F5 lógico/modo local; E2E Auth e falha local desktop/mobile 4/4 PASS.
- Aceite real continua pendente: a skill de computador ainda reporta zero navegadores/sessões. É necessário repetir login e comprovar no console `session/user/storage = true`, navegação, F5 e nova aba antes de declarar Auth corrigido.

## Diagnóstico do `SIGNED_OUT` automático — 2026-09-27

- Evidência manual recebida: `signIn` retorna user/session, a sessão está no storage e ocorre `SIGNED_IN`; em seguida o SDK emite `SIGNED_OUT` sem clique. Não existe `signOut` oculto e banco/RLS/RPC permanecem fora desta correção.
- A implementação instalada de `@supabase/auth-js` 2.117.2 foi auditada: `getUser()` chama `GET /auth/v1/user` e, especificamente para `AuthSessionMissingError`/`session_not_found`, executa `_removeSession()` e emite `SIGNED_OUT`. `getSession()` também remove uma sessão estruturalmente inválida; refresh não remove token ainda válido em falha proativa.
- O par URL/chave pública local foi validado de forma redigida: URL HTTPS sem path, chave no formato publishable e `GET /auth/v1/settings` HTTP 200. Configuração básica URL/chave incorreta ficou descartada.
- Instrumentação segura adicionada ao cliente: sequência de `signIn`, `getSession`, `getUser`, eventos, criação de múltiplos clientes e requests Auth (`/user` e `/token`) com status/código/mensagem; tokens, senha, headers e bodies não são registrados. Logs existentes foram preservados.
- Validação da instrumentação: testes focados 6/6 PASS, typecheck PASS, lint PASS e `git diff --check` sem erro de whitespace. O Vitest precisou de execução aprovada fora do sandbox após `spawn EPERM` do esbuild.
- Bloqueio de evidência: Computer Use retornou inventário vazio e tanto IAB quanto Chrome indisponíveis. Falta uma nova execução autenticada para capturar qual status/erro precede `SIGNED_OUT`; nenhuma correção comportamental foi aplicada sem essa evidência e a tarefa continua `ACTIVE`.

## Correção do guard da criação — 2026-09-27

- Nova evidência manual confirmou Auth íntegro: `SIGNED_IN`, `getSession`, `GET /auth/v1/user` HTTP 200, `getUser` e storage válidos, sem novo `SIGNED_OUT`. O defeito restante estava na apresentação/guarda da tela de criação.
- Causa na tela: o texto agrupava todo estado diferente de `signedIn`/`local` no aviso de signed-out; assim, `loading` aparecia falsamente como “Entre em uma conta…” e o botão replicava uma lista negativa de estados em vez do contrato de autorização explícito.
- `CreateScreen` agora deriva `canCreateTraveler` exclusivamente de `auth.status === 'signedIn' || auth.status === 'local'`. `loading` mostra “Verificando sessão…”, online passa o UUID do `AuthContext` a `registerTraveler`, local explícito passa `null` e signed-out passa `undefined`/permanece bloqueado.
- Log de desenvolvimento `[CREATE SCREEN AUTH]` registra somente `authLoading`, status e presença booleana de session/user, `isAuthenticated` e modo local; nenhum token é impresso. Sessão online continua removendo qualquer flag local residual no Provider.
- UNIT PASS: 27 arquivos/134 testes completos; focados do guard/registro/provider 10/10. Cobertura nova confirma loading sem erro falso, autenticado sem travelers habilitado/online, local explícito habilitado/local, signed-out bloqueado, F5 lógico e flag local residual ignorada após sessão online.
- E2E PASS: Auth/guard/local explícito 4/4 em desktop e mobile; criação local chegou a `/journey/intro`. Lint, typecheck, build de 19 rotas e `git diff --check` PASS.
- SECURITY REVIEW pelo próprio autor: logs sem credenciais/tokens, online tem prioridade, ausência/falha de sessão não ativa fallback local e nenhum banco/RLS/RPC foi alterado. Sem achado crítico/alto.
- Aceite online real pendente: Computer Use continua com `apps=[]` e `browsers=[]`. Ainda é necessário criar `TesteSupabaseFinal` numa sessão real e confirmar `AUTH USER PRESENT: true`, execução da RPC e linhas em `travelers`, `traveler_stats` e `wallets` antes de DONE.
