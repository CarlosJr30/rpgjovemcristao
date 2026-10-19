# TASK-0080 — Conta persistente e convite da Guilda

Branch isolada `codex/account-only-entry`, base main `5508514`. Nenhum push, merge em main, deploy ou alteração no Supabase remoto. Contrato TASK-0078 não alterado. Esta entrega prepara aplicação e SQL para revisão; não libera uso em produção.

Estado final: **BLOCKED para aceite completo**, com validação local aprovada. Dependências externas e limites de segurança estão no checklist do contrato TASK-0080.

Decisão posterior de Carlos: auditoria de dependências **DONE**, mantendo5P1/braces e4P2/esbuild visíveis e risco provisoriamente aceito para desenvolvimento/preparação isolada, não para produção irrestrita. Não repetir investigação sem fato novo. Bloqueios atuais são ambiente/autorização/aceite externo, não esses alertas aceitos para o preparo. [Plano rápido atualizado](TASK-0080-ISOLATED-VALIDATION-PLAN.md): CI de qualidade cobre branch0080, deploy CLOUD não; proposta de Preview separada e publicação manual do SHA aprovado, sem alterar automação. Nenhum novo teste/audit/push/deploy/migration remoto nesta decisão.

Continuação de segurança posterior ao commit17c6349: [parecer e classificação individual dos nove alertas DEV](../security/TASK-0080-SECURITY-AUDIT.md) e [plano de validação isolada, sem execução remota](TASK-0080-ISOLATED-VALIDATION-PLAN.md). Corrigidos replay de sessão não verificada e expiração após espera por lock, ambos reproduzidos antes da mudança. Nesta rodada40unitários direcionados/27E2E/integraçãoSQL com3subtestes/lint/tipos/build PASS; baseline470 abaixo é histórico preservado. Nenhuma dependência atualizada por ausência de correção compatível comprovada; produção audit0,5P1/4P2DEV ainda abertos. SQL continua local, com nova verificação temporal pós-lock. Sem divergências no código inicial desta retomada; diferenças novas limitadas às correções/testes/documentação.

## Entrada e persistência

A entrada oferece Entrar e Criar conta. A rota de convite abre a mesma autenticação existente. AuthProvider não aceita a escolha local antiga nem sessão anônima como conta cadastrada; páginas do jogo não são exibidas sem sessão. registerTraveler recusa criação sem usuário verificado. Supabase SDK, persistSession/autoRefreshToken, getSession/getUser, criação online e hidratação por usuário são reaproveitados. Não existe outro serviço de autenticação.

Cadastro com sessão segue direto ao avatar. Sem sessão, a interface informa cadastro recebido e orienta seguir as instruções do e-mail apenas se houver; não exige confirmação adicional nem modifica a configuração do servidor. Uma confirmação exigida pelo serviço continua obrigatória. O callback preserva o destino interno; o ambiente deverá permitir o callback /auth do seu domínio real conforme a configuração Auth já existente, sem ampliar permissões indiscriminadamente.

`next` aceita somente caminhos internos de Jornada ou `/guilda/convite/` com token de 64 caracteres hexadecimais. Protocolos, origens externas e loops para Auth são rejeitados. Após autenticação, usuários com avatar seguem ao convite. Sem avatar, a criação conserva o destino e retorna ao mesmo convite. O destino é apenas navegação, nunca autorização de ingresso.

## Convites

O painel de administração do líder oferece Convidar membros. O servidor valida Bearer com getUser e encaminha a identidade do usuário ao PostgREST usando a chave pública; não requer service_role. As funções privadas verificam conta não anônima, propriedade do avatar, liderança ativa e Guilda ativa, mesmo se a UI for contornada.

O banco gera 32 bytes criptograficamente aleatórios via pgcrypto. Persiste somente SHA-256 do token. Validade: sete dias, no máximo dez convites ativos por Guilda. O líder pode listar metadados e revogar; o token completo aparece somente na resposta de criação e no estado transitório do painel. Recarregar não recupera tokens antigos. A URL/QR contém somente o token limitado, sem IDs de usuários/Guilda, credenciais ou sessão.

O jogador autenticado vê o nome da Guilda e confirma se quer solicitar entrada. O resgate chama request_join_guild existente: cria/reutiliza pedido pending, não insere membro. A aprovação segue review_guild_join_request existente. Revogar bloqueia usos futuros do link; pedidos já enviados continuam na análise normal. Desativar/remover o líder ou a Guilda também invalida o convite. Bloqueios transacionais protegem a validação frente a alterações concorrentes; erros não são repetidos automaticamente.

Antes do login, o visitante vê nome da Guilda mediante token válido. A operação preview usa somente a chave pública e devolve uma lista explícita de dois campos: nome e validade. Não devolve IDs, membros, líder ou token. É a única operação acessível sem conta; não cria sessão, avatar, pedido ou associação. Conta e propriedade continuam obrigatórias para confirmar o pedido. Convites inválidos/expirados/revogados não revelam o nome, mas não impedem cadastro tradicional. A página Auth recebe next via searchParams do servidor para conservar a prévia durante o redirecionamento.

QR gerado localmente com qrcode1.5.4 MIT, sem serviço externo. WhatsApp abre somente por ação explícita do usuário, com link limitado e noreferrer/noopener. Nenhuma mensagem foi enviada pelo agente. Links de convite devem ser compartilhados somente com as pessoas pretendidas.

## Configuração e proteção do token

Definir APP_BASE_URL no servidor para a origem real do jogo. Não há fallback para Host, X-Forwarded-Host ou domínio fictício. Em produção: HTTPS, sem usuário/senha, caminho, query ou fragmento; localhost e domínios reservados de exemplo/teste são recusados. Em desenvolvimento, http://localhost:3000 é permitido. O arquivo .env.example contém somente nomes vazios.

Respostas do convite/API/Auth usam no-store/noindex; páginas enviam Referrer-Policy no-referrer. Diagnóstico Auth não registra query strings. Logging de requisições de desenvolvimento ignora caminhos de convite, API e query next. Nenhum log manual inclui token, sessão ou corpo da requisição. URLs ainda podem existir no histórico do navegador, no link compartilhado e nos logs de infraestrutura: antes de publicar, revisar acesso/retenção/redação desses logs no ambiente autorizado. Não foi alterada configuração de hospedagem ou analytics nesta tarefa.

## Dados locais antigos

Saves antigos não foram apagados nem enviados automaticamente ao servidor. Foram removidos apenas os caminhos que concediam acesso local; a flag legada não autentica. A seleção ativa de uma sessão online pode ser limpa pelo mecanismo existente de logout, preservando o conteúdo dos saves.

Personagens sem propriedade remota comprovada precisam de uma migração de produto separada, com vínculo explícito ao proprietário e validação dos dados. Não copiar moedas, XP, inventário, equipamentos ou progresso do navegador como autoridade. Não sobrescrever um avatar remoto com um save antigo. Nesta entrega não há migração de personagens, importação, exclusão ou mudança dessas regras.

## SQL proposto e reversão

Arquivo gerado pelo Supabase CLI2.121.0 e mantido no diretório de migrations existente: `packages/database/migrations/20261019054314_guild_link_invites.sql`. Independente de 0009/0010 econômicas; não executar um lote indiscriminado de migrations pendentes. A nova tabela fica em guild_invite_private com RLS e sem acesso direto; wrappers públicos são SECURITY INVOKER, funções privilegiadas ficam no schema privado com search_path vazio e verificações de identidade. O índice único do hash atende resolução; índice parcial por Guilda/expiração atende o limite/listagem.

Pré-condições: schema de Guildas existente de0000/0001, auth.users/is_anonymous, funções owns_traveler/request_join_guild/review_guild_join_request e pgcrypto instalado no schema extensions. A migration falha se as funções criptográficas não estiverem nesse namespace; não mover extensões de produção para fazê-la passar. Revisar o alvo e sua configuração antes de autorizar.

Aplicação hospedada NÃO EXECUTADA. Aprovação específica, alvo/backup/recuperação, revisão de ACL/roles e configuração APP_BASE_URL ainda necessários. A validação local usa apenas fixtures sintéticas e cópias exatas das funções de Guilda pertinentes; não prova configuração Auth/PostgREST hospedada.

Para desativar após uma aplicação futura, preservar tabela e pedidos existentes e revogar acesso aos novos wrappers mediante plano/aprovação específicos; não restaurar dumps antigos nem apagar membros/dados. Rollback do frontend não deve reintroduzir acesso local como alternativa.

## Testar localmente sem tocar no remoto

No checkout desta branch, com as versões Node/npm do package.json:

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm test -- --run
npm run lint
npm run typecheck
$env:RPG_MOBILE_E2E='1'
$env:NEXT_TELEMETRY_DISABLED='1'
$env:NEXT_PUBLIC_SUPABASE_URL='https://fixture.invalid'
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='sb_publishable_task0080_test_fixture_not_real'
npm run build
node node_modules/@playwright/test/cli.js test --config playwright.account-entry.config.ts
```

Os valores acima são fictícios exclusivos dos testes: nunca os configurar em produção. O E2E intercepta Auth/PostgREST/convites em memória e bloqueia rede externa. Cobre os clientes SDK reais e UI, sem criar usuário real. O servidor é loopback3181, inicia/encerra pelo Playwright e não reutiliza servidor preexistente. Não é teste físico da câmera nem teste hospedado entre aparelhos reais.

Teste SQL real, somente se o runtime/imagem local existentes estiverem disponíveis:

```powershell
node --test packages/database/tests/guild-link-invites.postgres.test.mjs
```

Requer WSL RPG-0078-Restore/Podman/imagem já presentes. Cria container exclusivo TASK-0080 sem rede, portas ou mounts de dados, em tmpfs/read-only; confirma label/isolamento antes de descartá-lo. Não usa o backup da TASK-0078 nem altera seu contrato/dados. Instâncias sem esse runtime devem preparar um alvo local equivalente por escopo próprio, sem converter ausência em PASS.

Para inspeção manual completa, usar um ambiente local/isolado autorizado com Auth e esta migration aplicada, configurar as duas variáveis públicas e APP_BASE_URL no canal local e executar npm run dev. Criar conta/Entrar; abrir um QR/link; criar avatar se necessário; conferir nome e confirmar pedido; revisar e aprovar no painel do líder. Não apontar esses passos de escrita ao projeto remoto de produção nesta fase.

## Evidências e limites

Logs/JSON/capturas privados em `build/task-0080-account-entry/` na raiz original e no build deste checkout. O contrato registra resultados finais. A primeira rodada E2E foi preservada com23PASS/1FAIL WebKit por navegação de documento que abortou prefetch RSC; a fixture passou a usar o link real Continuar jornada, mantendo a exigência de zero erros. Não houve filtro/retry/asserção removida. Uma verificação lint inicial rejeitou setState em efeito para mode; a lógica desnecessária foi removida.

Auditoria de dependências: qrcode/@types fixados; Next/eslint-config-next16.4.2 e overridesSharp0.35.5/source-map-js1.2.2 corrigem os achados críticos/altos de produção anteriores. Audit produção final0; nove alertas DEV conhecidos permanecem separados, sem downgrade especulativo. Nenhum código econômico foi importado da TASK-0078.

Resultado final: **470 unitários/71 arquivos, 27 E2E e 1 suíte PostgreSQL real PASS**, zero falhas/skips finais. Inclui prévia pública mínima, negação de mutações sem conta e recusa de criação por conta anônima. E2E em e2e-acceptance-final.log; revalidação de cadastro/QR após trava adicional em e2e-final-source.log. Lint/tipos/build PASS. O build usa configuração fictícia de testes e isolamento de artefatos, sem integração hospedada. Uma rodada intermediária teve24PASS/3FAIL por dois status acessíveis no painel; seletor corrigido para a região Convites da Guilda. A inclusão da prévia revelou outra falha real de navegação (24PASS/3FAIL); obtenção do token corrigida para searchParams da página Auth. Um timeout de importação com testes concorrentes deu468PASS/1FAIL; repetição sem carga paralela passou469 e, com o último teste novo,470, sem elevar timeout ou mudar asserções. Evidências anteriores preservadas. Capturas de cadastro, pedido pendente e QR desktop/mobile inspecionadas. Não foram repetidos testes/deployments CLOUD nem executada a suíte de gameplay legado inteira.

## Arquivos da entrega

- Autenticação/entrada: apps/web/app/providers.tsx e app/auth/page.tsx; features/auth/auth-screen.tsx e auth.module.css; lib/supabase/auth-context.tsx, auth.ts, auth-return.ts e client.ts.
- Avatar/retorno: features/journey/screens/create.tsx, home.tsx; components/shell.tsx; state/use-journey.ts (somente registerTraveler, sem mudança nas operações de progressão).
- Guilda: features/journey/components/online-guild-hub.tsx; features/guild-invites/invite-panel.tsx, invite-screen.tsx e invite-preview.tsx; lib/guild-invites/client.ts, contracts.ts, server.ts; app/api/guild-invites/route.ts; app/guilda/convite/[token]/page.tsx; lib/supabase/database.types.ts.
- Configuração/dependências: apps/web/.env.example, next.config.ts, package.json; package.json e package-lock.json da raiz.
- Testes: testes Auth/criação/registro/sessão existentes; novos auth-return.test.ts, guild-invites/server.test.ts, invite-panel.test.tsx; tests/e2e/quick-registration.spec.ts, supabase-auth.spec.ts; playwright.account-entry.config.ts; packages/database/tests/guild-link-invites.postgres.test.mjs.
- Banco proposto: packages/database/migrations/20261019054314_guild_link_invites.sql, somente local.
- Governança: contrato TASK-0080, este relatório e .agent/memory/CURRENT_STATE.md. Nenhuma edição no contrato TASK-0078 ou na automação CLOUD.

## Pendências de aceite

Aplicação remota da migration não autorizada; APP_BASE_URL real, callbacks e configuração Auth/PostgREST não verificados nesta branch; logs de infraestrutura devem proteger tokens de convite; nove alertas DEV pendentes. Autenticação hospedada, dois aparelhos reais e câmera não testados. O teste SQL comprova aprovação via função existente, não uma sessão hospedada do líder. Reavaliar estes pontos em ambiente isolado autorizado, com dados de teste próprios, antes de qualquer publicação.

Referências primárias: documentação instalada Next16.4.2 sobre Route Handlers/dynamic routes/logging; [Supabase signUp](https://supabase.com/docs/reference/javascript/auth-signup), [sessões](https://supabase.com/docs/guides/auth/sessions), [node-qrcode](https://github.com/soldair/node-qrcode).
