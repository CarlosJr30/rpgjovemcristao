# TASK-0080 — Entrada somente por conta persistente

ID: TASK-0080
STATUS: BLOCKED
DEPENDENCY_AUDIT_STATUS: DONE
OBJECTIVE: Remover a entrada local/temporária e reutilizar Auth existente para login, cadastro, retorno ao avatar e convite pendente.
AUTHORIZATION: Pedido explícito de Carlos em 19/10/2026; implementação e testes locais, sem main/produção/Supabase remoto/deploy/operações destrutivas. Não alterar o contrato TASK-0078.
SCOPE: AuthScreen/AuthProvider/gate de páginas, textos da entrada/criação, trava da criação sem sessão, testes relacionados, documentação e memória desta tarefa. Autor assume Frontend/Backend/QA/Security, sem subagentes; ownership desses caminhos autorizado neste contrato. Reusar SDK, repositórios e hidratação existentes, sem outro sistema de Auth. Worktree isolado build/task-0080-account-entry/checkout, branch codex/account-only-entry a partir de main5508514; alterações preexistentes preservadas.
OUT_OF_SCOPE: Economia/XP/moedas/equipamentos/progressão, importação automática de saves antigos, schema/migrations remotas, configurações Auth, produção, push/deploy e contrato TASK-0078.
DEPENDENCIES: Configuração Auth existente; migration local de convites deverá ser revisada/aplicada em autorização remota separada antes de uso hospedado.
SECURITY_CONSIDERATIONS: Flags locais nunca concedem sessão; validar getSession/getUser/identidade/storage; destino de retorno somente interno validado; preservar dados legados sem promover saldo/progresso a autoridade remota; controles de confirmação de e-mail mantidos. Testes com transportes simulados não provam configuração hospedada.
ACCEPTANCE_CRITERIA:
- Entrada oferece Entrar/Criar conta e nenhum acesso local/temporário; rotas do jogo exigem sessão, inclusive com flag antiga.
- Cadastro/login/logout/novo login/reload reutilizam SDK e persistência existentes; avatar recuperado em contexto de navegador sem dados locais.
- Rota /guilda/convite/[token], geração pelo líder, QR/link WhatsApp, confirmação, token seguro com hash/expiração/revogação e validação no servidor; pedido de entrada continua sujeito à aprovação existente. Destino preservado após login/cadastro/avatar.
- Sem confirmação extra quando servidor retorna sessão; ausência de sessão não deve ser tratada como login confirmado nem desativar controles.
- Dados locais antigos preservados; necessidade/limite de migração documentados sem importação automática.
- Desktop/mobile, lint/tipos/build/testes pertinentes e revisão Security com evidências reais; sem alteração remota.
TEST_PLAN: Unitários Auth/tela/criação/sessão/retorno e cache; E2E SDK já existentes atualizados à política nova, desktop/mobile e contexto independente; testes negativos de flag antiga/redirect externo/falha de sessão. Nenhuma criação de usuário real/remoto. O plano inicial de reaproveitar dependências foi substituído pela instalação isolada autorizada na ampliação abaixo.
DEFINITION_OF_DONE: Todos os critérios comprovados; dependência sem evidência resulta BLOCKED, nunca DONE fictício.

## Auditoria inicial

Main possui Supabase persistSession/autoRefreshToken/detectSessionInUrl e hidratação por usuário; criação online usa RPC existente. A opção local existe em auth-screen, AuthProvider e registerTraveler; o gate global apenas aguarda loading e ainda deixa saves locais acessar páginas. QR/link/rota de convite não encontrados nos arquivos de aplicação/testes e na fonte cloud/rpg-jovem-cristao-migration; existem guild_invites no tipo de banco e request_join_guild, sem ponte QR na UI. Não inventar novo fluxo para preencher esse requisito. Dados legados têm saves e mapa de propriedade por conta; não importar automaticamente, pois incluem progresso/economia não comprovados pelo servidor.

## Ampliação expressa pelo usuário — 19/10/2026

Carlos esclareceu que QR é funcionalidade nova e autorizou implementá-la nesta branch isolada: /guilda/convite/[token], Convidar membros na administração, token aleatório seguro, QR/link compartilhável, retorno pós-Auth/avatar, confirmação com nome da guilda, validação servidor/expiração/revogação/permissões sem contornar aprovação. URL base vem de APP_BASE_URL validada; não confiar em Host. Mantidas proibições remotas/push/deploy. O trecho anterior de auditoria registra somente a ausência inicial, não limita este novo escopo autorizado.

Ownership ampliado a apps/web/app/guilda/convite/, app/api/guild-invites/, lib/guild-invites/, componente de convites inserido no painel existente, tipos de RPC, migration SQL nova e seus testes/documentação. Arquitetura: API autenticada com SDK público+Bearer e getUser; wrappers SQL invoker sobre funções em schema privado com checagem auth.uid/owns_traveler/liderança; tokens 256bits, somente hash persistido, validade7dias e máximo10convites ativos por Guilda. Resgate chama request_join_guild existente; nunca insere membro diretamente. Tabela privada/RLS/ACL sem leitura ou escrita direta. Nenhuma dependência das migrations econômicas 0009/0010.

Finalização: ownership inclui app/auth/page.tsx e invite-preview.tsx para mostrar a guilda antes do login conforme o pedido. Uma única operação pública preview (API/RPC) retorna somente nome/validade mediante token válido; nenhum ID/membro/líder é exposto. Os helpers internos continuam sem execução direta por anon; somente o wrapper de prévia e sua função limitada recebem permissão anon. Demais operações continuam com conta verificada. AuthPage obtém next por searchParams assíncrono do Next, evitando leitura defasada da URL durante a navegação.

Ferramentas/dependências necessárias autorizadas neste contrato dentro do novo escopo: qrcode1.5.4 MIT e @types/qrcode1.5.6 fixados após metadados oficiais, sem scripts de instalação; CLI Supabase em cache de ferramenta somente para gerar arquivo migration, sem login/projeto remoto. Instalação isolada nesta branch; não modificar node_modules de outro worktree. PostgreSQL existente via WSL/Podman em container descartável sem rede/portas, somente fixtures sintéticas, para testes reais de ACL/RLS/permissões/expiração/revogação/pedidos/aprovação. Nenhum backup real ou banco remoto será usado.

Auditoria de dependências ao adicionar o QR identificou vulnerabilidades preexistentes na base5508514: Next16.3.5 crítico, Sharp e source-map-js altos. Correções exatas recomendadas pelo audit e previamente validadas no projeto: Next/eslint-config-next16.4.2, overridesSharp0.35.5/source-map-js1.2.2. Ownership dos manifests/lockfile inclui exclusivamente QR e essas correções de segurança necessárias ao novo servidor/QR; sem alterações econômicas ou integração da TASK-0078. Repetir audit/build/testes. Não aplicar audit fix indiscriminado.

## Aceite local — 19/10/2026

SELF VALIDATE, QA e Security executados pelo autor; sem revisão independente. Continuação na mesma branch, sem novo contrato TASK-0078, sem push/deploy/merge/migration remota/conta real.

| Gate | Resultado e evidência |
| --- | --- |
| Unitários | PASS: 470 testes, 71 arquivos, zero falhas/skips; unit-final.log. Inclui dois testes novos de privacidade/negação de mutações da prévia e um de criação negada para conta anônima. |
| E2E | PASS: 27/27, zero falhas/skips/retries, e2e-acceptance-final.log, incluindo prévia antes do login. Desktop Chromium, mobile Chromium e WebKit. Seletor de revogação limitado à região Convites da Guilda. Revalidação de cadastro/QR após trava adicional de conta anônima: 6/6 PASS em e2e-final-source.log. |
| Revalidação visual | PASS: 3/3 testes do painel após removê-lo de dentro do banner e dar superfície própria; e2e-panel-visual-final.log/capturas browser-visual-final-artifacts. Demais 24 cenários reutilizados, sem repetição desnecessária. |
| PostgreSQL | PASS: 1 suíte real com fixtures sintéticas, isolamento sem rede/portas, SQL novo e funções existentes exatas; postgres-preview-final.log. Hash/ACL/RLS, prévia pública mínima, negação de mutações anon, permissões, limite, expiração, revogação, idempotência, pedido pending e aprovação normal comprovados. |
| Lint / tipos / build | PASS: lint-final-acceptance.log, types-final-source.log, build-final-source.log. Build local em modo de teste isolado com configuração pública fictícia; não prova integração hospedada. |
| Dependências | Audit produção: zero vulnerabilidades. Audit completo: nove DEV preexistentes, cinco altas/quatro moderadas; não resolvidas e impedem aceite Security global. Sem crítico. |
| Segurança local | Revisão do código e negativos PASS: getUser, conta não anônima, ownership/liderança no servidor, retorno interno, token 256bits/hash, validade7dias/revogação, no-store/no-referrer, erros genéricos, sem service_role e sem valores reais versionados. Logs da infraestrutura ainda exigem revisão externa. |
| Documentação / memória | Atualizadas; instruções, arquivos e limites em docs/architecture/TASK-0080-ACCOUNT-ENTRY-AND-INVITES.md. |

Logs ficam no diretório ignorado build/task-0080-account-entry da raiz original; JSON/capturas no build do checkout. Falhas iniciais preservadas: navegação WebKit na fixture (23PASS/1FAIL) e seletor ambíguo de status (24PASS/3FAIL). Corrigidos link de navegação da fixture e escopo do seletor, sem remover asserções, filtrar erros ou adicionar retries. Na adição da prévia: 468PASS/1FAIL por timeout5000ms em import de banco durante testes concorrentes; suíte repetida sem concorrência pesada, sem mudar timeout/asserções:469PASS. E2E detectou prévia ausente após redirect (24PASS/3FAIL); corrigida obtenção do token em AuthPage/searchParams. A suíte E2E completa de gameplay legado não foi executada; fixtures locais antigas precisam de adaptação à política de conta em trabalho próprio.

### Checklist

- [x] Remover botão/textos de entrada local nas telas de entrada/cadastro/avatar e negar flag antiga como sessão.
- [x] Reusar Supabase SDK para cadastro/login/logout/reentrada, sem confirmação extra de e-mail na UI.
- [x] Criar avatar somente com identidade verificada; recuperar avatar remoto em contexto sem saves transferidos, via transporte simulado.
- [x] Preservar saves legados e documentar futura migração com vínculo/validação, sem importação automática.
- [x] Gerar QR/link pelo líder, copiar/WhatsApp por ação do usuário, listar/revogar; origem validada sem Host.
- [x] Mostrar nome da guilda antes do login mediante token válido; retornar ao convite após Auth/avatar e confirmar pedido, sem ingresso automático.
- [x] Verificar expiração, convite inválido, permissões, duplicidade e aprovação normal em PostgreSQL local real.
- [x] Validar UI responsiva e navegação nos navegadores disponíveis; inspecionar capturas.
- [ ] Aplicar a migration isolada em alvo autorizado após revisão e plano de recuperação; expressamente proibido nesta sessão.
- [ ] Configurar APP_BASE_URL real e revisar callbacks Auth/PostgREST/ACL/logs no ambiente autorizado.
- [ ] Comprovar Auth hospedado, recuperação em dois aparelhos reais e leitura pela câmera; não equivalem a mocks/contextos separados.
- [x] Auditoria de dependências encerrada pelo usuário;9alertas preservados, risco provisoriamente aceito para desenvolvimento/preparo isolado.
- [ ] Completar aceite de segurança/funcional hospedado; encerramento da auditoria não libera produção.

### Condição de desbloqueio

Implementação local disponível para revisão, mas aceite global BLOCKED pelos itens acima. Nenhum DONE nem uso em produção autorizado por estes resultados. Próxima etapa: revisar o diff/SQL em ambiente isolado autorizado; tratar alertas DEV e obter evidências hospedadas antes de aprovar push/deploy/migration em fases próprias.

Git: alterações reunidas em commit somente local na branch codex/account-only-entry; SHA final no recibo ignorado build/task-0080-account-entry/final-acceptance.json da raiz original. Sem push/merge/deploy. Worktree sem upstream main para evitar envio acidental. Main remoto reconfirmado5508514828a455ccb0d1ee83d652c419e8643a49. Comparação automatizada confirma use-journey.ts idêntico fora de registerTraveler; sem mudança em código econômico, assets, migrations0009/0010, TASK-0078 ou workflows.

## Continuação autorizada — auditoria de segurança e preparo isolado

Pedido de Carlos em 19/10/2026: preservar17c6349, auditar diff/Auth/RLS/permissões/concorrência, reproduzir e corrigir somente defeitos demonstrados; analisar individualmente os nove alertas DEV e aplicar apenas correções compatíveis; preparar checklist remoto sem executá-lo. Ownership: fontes/testes Auth e convites já autorizados, migration local ainda não aplicada, testes SQL locais, manifests/lockfile apenas se correção segura comprovada, docs/security/ e plano de validação isolada, memória/este contrato. Autor assume Backend/Database/QA/Security; sem revisão independente ou subagentes. Não criar projeto/secret/configuração remota, acessar dados reais, fazer push/deploy/merge nem alterar TASK-0078/CLOUD/economia. Contrato permanece BLOCKED por aceite externo.

Auditoria inicial: checkout limpo na branch codex/account-only-entry/SHA17c63491540c9226779b50a2b303a819347e21a2, sem divergência do relatório. Uma migration nova20261019054314; wrappers invoker, tabela privada com RLS/ACL fechada, helpers definer/search_path vazio e prévia mínima. Audit atualizado confirma9DEV (5altos/4moderados), duas cadeias raiz (braces e esbuild), produção anteriormente0. Investigações: replay de INITIAL_SESSION após falha de getUser; comportamento de expiração após espera por lock; rastreio dos padrões glob e uso real do servidor esbuild. Não considerar hipótese como achado sem reprodução.

### Resultado desta continuação

**Concluído e comprovado:** revisão do commit/contrato/RLS/ACL/SQL, duas falhas Auth reproduzidas e corrigidas (AUTH-01), expiração durante espera por lock reproduzida e corrigida (SQL-01), testes de duas confirmações concorrentes, classificação dos9DEV individualmente. AUTH-01:6PASS/2FAIL antes e8PASS depois. SQL-01:parent/subteste FAIL antes (um defeito), integração ampliada parent+3subtestes PASS depois. Código econômico, permissões da aprovação existente e dependências/lockfile não alterados.

Validações finais desta rodada: **40 testes direcionados/6 arquivos PASS**, **27 E2E PASS/0retry**, **1 integração PostgreSQL +3 subtestes PASS (4 nós)**;0FAIL/0SKIP finais. Lint/tipos/build PASS. Logs security-unit-final.log, security-e2e.log, security-sql-final.log, security-lint.log, security-types.log, security-build.log no diretório ignorado da tarefa. O baseline470 anterior não foi executado inteiro de novo nem somado artificialmente aos40. E2E da entrada reexecutado pela alteração transversal do provider, sem refazer suíte geral de gameplay/CLOUD/deployments. Testes de transporte não equivalem a Auth hospedado.

**Preparado, não executado:** [parecer de segurança](../../docs/security/TASK-0080-SECURITY-AUDIT.md) e [checklist isolado](../../docs/architecture/TASK-0080-ISOLATED-VALIDATION-PLAN.md), incluindo gates pré-migration, identidade do alvo, variáveis por nome, callback, PostgREST, advisors, logs, recuperação e matriz de contas/aparelhos. Nova versão da migration ainda só local; receipt separado security-acceptance.json preserva evidência da entrega17c6349.

**Bloqueios:**5alertasP1 altos propagados de braces sem patch publicado compatível;4P2 moderados da cadeia esbuild (sem uso serve identificado). Sem correção segura demonstrada, manifests/lockfile permanecem iguais; audit atual9DEV/produção0. Downgrades sugeridos pelo audit não aplicados. Risco condicionalP1: create_traveler/políticas legadas não distinguem conta anônima; revisar Anonymous Sign-ins e controle servidor do alvo antes de permitir teste remoto. Nenhuma configuração Auth alterada. Exposição de logs e evidências hospedadas/físicas continuam pendentes.

**Pendente de autorização:** criar/configurar ambiente/contas, aplicar SQL, push ou preview; nenhuma dessas ações executada. Próximo: resolver cadeiaP1 com solução compatível e revisão, então autorizar separadamente preparo do alvo isolado e suas verificações. TASK-0080 permanece **BLOCKED**, sem DONE. QA/Security pelo autor, não independente. Commit17c6349 preservado e esta auditoria reunida em novo commit somente local, sem amend/merge/push.

### Etapa de dependências P1 — continuação de b71b205

Autorização atual: investigar/corrigir somente dependências com solução segura demonstrada; reavaliarP2 sem atualização automática; preservar scripts/lockfile, sem runtime/Supabase/produção/push/deploy. Ownership desta etapa limitado aos manifests/lockfile se necessário, testes de ferramentas e documentação/memória. Após análise não houve motivo para modificar manifests: config/plugin16.4.2 latest, fast-glob3.3.3 ainda usa micromatch4.0.8/braces3.0.3; sem braces corrigido publicado. Não aplicar downgrade14.2.35, alias/patch não revisado ou override que preserve o problema.

- [x] Branch/commits17c6349 e b71b205 preservados; checkout inicial limpo.
- [x] Árvore npm e cincoP1/ranges/alcance/correções analisados; representam um advisory propagado, sem reclassificação por ser DEV.
- [x] QuatroP2/esbuild reavaliados; estáveis mais recentes mantêm a cadeia, sem benefício compatível demonstrado para atualizá-la.
- [x] Audit renovado:5P1altos/4P2moderados/0críticos; produção0.
- [x] Plano isolado revisto e suficiente para revisão, com gates externos ainda fechados.
- [ ] Corrigir causaP1 com solução compatível publicada/revisada; nenhuma disponível comprovada nesta etapa.
- [ ] Aceites hospedados/físicos e demais gates do contrato, ainda pendentes.

Parecer detalhado atualizado em docs/security/TASK-0080-SECURITY-AUDIT.md. Sondagens locais limitadas não reproduziram RangeError nesteNode24; isso não invalida advisory/P1. Nenhum pacote instalado/alterado; npmci/lint/tipos/build/unitários/E2E/SQL não repetidos por ausência de mudança executável. Evidências anteriores reutilizadas sem inflar contagem; novos diagnósticos/recibo p1-* na pasta ignorada da tarefa. Correções Auth/SQL de b71b205 intactas. STATUS **BLOCKED**, não VALIDATING/DONE; não houve correção tentada que introduzisse REWORK. Próximo: solução upstream compatível ou revisão específica de alternativa, antes de qualquer execução remota. Commit novo somente documental/local, sem amend/merge/push.

## Encerramento da auditoria e preparo da Preview — decisão posterior de Carlos

Auditoria de dependências **DONE** por instrução explícita do usuário. Manter5P1/braces e4P2/esbuild nos relatórios, sem correção compatível comprovada e produção anteriormente0. Risco aceito provisoriamente para desenvolver/preparar ambiente isolado, nunca para produção irrestrita. Não reabrir investigação sem versão corrigida, novo advisory ou exposição alterada. Esta decisão supera o bloqueio histórico por dependências na preparação, sem fechar os alertas.

Pedido autoriza somente verificar requisitos e preparar configuração/proposta; não autoriza push/deploy/migration remota. Branch inicialmente limpa em b3f62ee, commits anteriores preservados. git ls-remote confirma branch0080 ainda ausente e main5508514. Workflow/scripts/vercel.json iguais à main; quality aceita todas as branches, mas pinned-preview exige preview/* ou codex/pinned-preview-ci, demo_eligible e alvo Vercel fixo. Checagem somente de elegibilidade resulta false para este HEAD. Logo CLOUD não publica esta branch nem serve como atalho para Auth/Supabase de teste. Nenhum workflow alterado, CI remoto desse SHA ainda pendente do push autorizado.

Consulta somente de metadados Supabase: nenhum projeto de teste RPG identificado entre os visíveis; projeto RPG de produção é o único ativo. Nenhuma consulta SQL/dado/Auth/configuração do projeto. Listagem Vercel pelo conector retornou403 no workspace; CLI não disponível nas localizações padrão verificadas. Existência/configuração de projeto Vercel isolado não confirmada; isso não autoriza usar o projeto existente como substituto.

Plano existente atualizado com o caminho mínimo: criar/configurar Supabase e Vercel separados após autorização, publicar branch0080 para quality, exigir CI verde do SHA candidato e então Preview manual desse SHA no projeto isolado. Sem alterar CLOUD ou criar branch de conveniência para burlar gates. Migration proposta mantém checksum2D536427D68281FBB72795315B2845BDF58EA4CA89160E4ECF6CA2F005E1CA37; aplicação remota proibida nesta etapa. Configuração mínima, exceção de risco e proposta estão no plano. Nenhuma suíte/audit repetida; somente leituras/checagens de branch, gates e metadados.

Estado: **implementação local concluída / aceite externo pendente**. AuditoriaDONE. TASK-0080 permanece BLOCKED apenas por ambiente/autorização/configuração e evidências externas ausentes, não pelos alertas provisoriamente aceitos. Próximo passo executável: obter autorização específica para criar/configurar os projetos isolados e publicar a branch para CI; aprovação da aplicação SQL e do deploy continuam explícitas. Nenhum recurso remoto, secret, conta, push/deploy/SQL criado/executado nesta sessão. Contrato TASK-0078/CLOUD/produção/main intactos.

## Execução autorizada de push/Preview — resultado BLOCKED_BACKEND

Carlos autorizou explicitamente push0080, CI, criação/configuração de projeto Vercel separado e somente Preview com recursos/credenciais de teste validados. Continua proibida qualquer alteração Supabase remoto, inclusive projeto/migration/conta, sem nova autorização. Esta autorização supera apenas as restrições anteriores correspondentes; não autoriza produção/main/TASK0078/CLOUD nem merge. Ownership desta rodada: Git0080, novo projeto Vercel, verificações não destrutivas e documentação/memória; sem mudança runtime/dependências/SQL.

- [x] Inicial codex/account-only-entry/HEAD1d8dd709992431842bccb1fec38e6562634649db/limpo; origin GitHub correto. Push explícito normal somente dessa branch, sem force/merge.
- [x] SHA remoto confirmado1d8dd709992431842bccb1fec38e6562634649db; main permanece5508514828a455ccb0d1ee83d652c419e8643a49.
- [x] CI39234610068 **SUCCESS**, quality118000548043SUCCESS (unitários/protocolo/lint/tipos/build); pinned-preview118001312952SKIPPED. Acompanhar por SHA, não presumir herança.
- [x] Projeto rpgjovemcristao-test criado/confirmado em team_FWD8MfZ9vARK8EBovoyTn9Ox, IDprj_qKzjXMVXwiVpGlU66SoTA71mStXX. Frameworknextjs/rootapps/web/Node24.x/buildnpmrunbuild/installlockraiz, SSOdeploymentTypeall. Sem vínculo Git/branch de produção, zero variáveis, zero deployments; não publica main nem antecipa pushdeploy. Nenhum projeto existente modificado.
- [x] ConectorVercel403; fallbackCLI64.0.2 já em cache funciona usando suas próprias credenciais no mesmo workspace. GETteste404→POSTprojeto autorizado→GETassertions e listdeploy0; sem instalar CLI nem copiar secrets.
- [x] Supabase: listagem somente de metadados reconfirma nenhum RPGteste identificado entre projetos visíveis; apenas RPGprodução ativo. Nenhum SQL/configuração/conta/projeto Supabase alterado.
- [ ] DeployPreview/READY/smoke remoto: **não executados** por falta de backend de teste validado. Código exige variáveis Supabase; getSupabasePublicConfig rejeita ausentes e AuthProvider registra listener via SDK antes do boot. Não há modo explícito de demonstração sem backend neste provider. Não inventar URL/chave, usar mocksE2E como backend hospedado ou restaurar acesso local.
- [ ] Auth real/aparelhos/câmera/convite/aprovação/expirado/revogado: pendentes do ambiente de teste e Preview.

Relatório docs/architecture/TASK-0080-PREVIEW-PUBLICATION-REPORT.md. Recibos ignorados vercel-test-project-created.json/vercel-test-project-verified.json/preview-publish-attempt.json. AuditoriaDONE preservada; nenhuma nova auditoria ou suíte local. **BLOCKED por backend**, não por CI nem por Vercel. Próxima autorização indispensável: criar/configurar Supabase separado com recursos de teste, baseline e migration revisados e contas fictícias em escopo explícito; ou fornecer identidade/configuração de um alvo de teste já pronto por canal seguro. Autorização Vercel/push atual persiste; não solicitar de novo para o mesmo escopo. Relatório/memória em commit local posterior, sem segundo push que repita CI só por documentação; SHA remoto aprovado acima permanece candidato.
