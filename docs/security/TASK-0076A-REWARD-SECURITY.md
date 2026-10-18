# TASK-0076A — Segurança das recompensas

2026-10-17. Continuação da mesma TASK em `D:/rpg-jovem-cristao-combat-0076`, branch `feat/combat-card-system-v1-0076`, HEAD `0df878764f26f0501959031dd4aec4a77fb9308a`. SELF VALIDATE, QA e Security pelo autor, sem revisão independente.

**LOCAL_SECURITY_VALIDATED / REMOTE_APPROVAL_PENDING.** Contratos legados e PostgreSQL foram validados localmente. SEC-ECONOMY-001 continua aberto em produção até implantação autorizada. Nenhuma alteração remota, conta real/Chat A, commit, push, merge, deploy ou TASK-0076B nesta execução.

## Continuidade

### Backup e restauração — 2026-10-17 — BACKUP_ACCESS_PENDING

**Não há restauração real comprovada.** Não foi identificado backup previamente autorizado e acessível nos registros da TASK ou no diretório privado previsto `D:/TASK-0076A-BACKUP-PRIVADO` (inexistente). Isso não afirma inexistência de backups em locais não informados. Sem novo acesso a dados de produção, exportação ou restauração nesta etapa. Nenhum teste econômico repetido.

| Item | Resultado |
| --- | --- |
| Meio disponível | Docker existente com PostgreSQL/pg_dump/pg_dumpall/pg_restore **17.6**, executáveis conferidos; binários nativos/Supabase CLI ausentes do PATH. |
| Acesso de exportação | PGSERVICE/PGSERVICEFILE/PGPASSFILE, DATABASE_URL, URL operacional de migration e SUPABASE_ACCESS_TOKEN ausentes na sessão; arquivos libpq padrão não encontrados. Nenhum segredo aberto/configurado. Acesso por MCP SQL não equivale a pg_dump ou autorização para exportar usuários. |
| Backup de plataforma | Último preflight identificou organização Free; backup recuperável/PITR continua não confirmado. Não foi acionado restore_project nem coletado dado de conta. Dashboard/Management API são alternativas condicionadas a acesso existente/autorizado, não comprovadas nesta etapa. |
| PostgreSQL descartável | Container `rpg-task0076a-backup`, PostgreSQL 17.6, rede Docker interna, nenhuma porta publicada, raiz read-only, dados em tmpfs. Banco task0076a_restore criado vazio: **zero tabelas de aplicação**, sem Auth, supabase_vault indisponível. Container/rede descartados ao final. |
| Ensaio de restauração | **NOT_RUN**: nenhum backup real autorizado disponível. Preparação do banco vazio/versões não é backup nem validação de recuperação. Dados sintéticos não foram criados como substituto. |
| Integridade após restore | **NOT_RUN**: contagens de dados reais, schema/funções/RLS/ACL e equivalência econômica não podem ser validadas sem o arquivo real. Roteiro de verificação agregado/privado preparado, sem dados pessoais em relatório. |

Escopo requerido: auth.users e dependências Auth/profiles, personagens, XP/nível, wallets/moedas, stats/inventário/equipados, Jornada e reflexões, Guildas/membros/missões/progressos/claims/chat, baús/recibos e ledger privado se existente no checkpoint; schemas/tipos/sequências/FKs/triggers/funções/owners/RLS/ACL, mais roles sem passwords. Um archive pg_dump completo mantém o snapshot dos dados/definições; roles globais requerem conferência administrativa separada. [pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html) é o método lógico consistente proposto. Binários Storage e configuração/chaves externas não integram o archive; [limites dos backups Supabase](https://supabase.com/docs/guides/platform/backups) exigem recuperação separada desses elementos.

Método de restauração proposto: conferir autorização, ref, data/checkpoint, SHA-256, TOC e custódia do backup; preparar alvo isolado compatível com PostgreSQL/Supabase, Auth/Vault/extensões/owners, rede externa bloqueada, roles/TOC revisados; pg_restore transacional com exit-on-error, mantendo RLS/ACL/owners. Não eliminar objetos nem ignorar erros para conseguir PASS. O PostgreSQL básico preparado **não** possui todos os componentes Supabase; eles são pré-requisito adicional antes de carregar dados reais. Capacidade tmpfs de preparação não é dimensionamento de um backup ainda desconhecido.

[Comandos exatos e roteiro de integridade](TASK-0076A-PREFLIGHT-COMMANDS.md), seções B/C: exportação futura com pg_dump e pg_dumpall --no-role-passwords, preparação local efetivamente realizada, restauração por binários ou docker exec e SQL somente leitura para contagens/definições/permissões. Exportação e restore permanecem apenas propostos. Não copiar arquivos reais para build/, public/, ZIP da aplicação ou Git; usar armazenamento privado fora do repo com controle de acesso/criptografia. Somente metadados técnicos foram registrados em `build/task-0076a-reward-security/backup-restore-preparation/{access-check,local-preparation,cleanup,preservation}.json`.

Para desbloquear: indicar um **arquivo real existente em armazenamento privado**, sua procedência/autorização para ler e restaurar no clone, ref/checkpoint/hash e destino aprovado; ou autorizar separadamente futura exportação com conexão PostgreSQL existente e permissões suficientes de leitura completa/catálogo/roles, via canal seguro do operador. Não enviar passwords/tokens ou o dump à conversa. SUPABASE_SERVICE_ROLE_KEY não substitui senha/conexão PostgreSQL. Não criar grants ou resetar senhas para contornar a ausência de acesso nesta tarefa.

Recuperação: restaurar primeiro no clone, comparar contagens/valores/recibos e schema/funções/RLS/ACL com baseline do mesmo backup, testar isolamento de papéis em transações locais revertidas e medir tempo de recuperação. Restauração de produção exige autorização própria, alvo/horário e reconciliação de concessões posteriores. Nunca sobrescrever jogadores com backup antigo, apagar ledger ou reabrir grants como rollback automático. B0/B1 continuam pendentes; implantação 0009/0010 bloqueada.

QA/Security pelo autor: preparação e preservação registradas, sem independência alegada; aceite de backup/restore **não atendido**. Artefato backend anterior permanece intacto. Estado desta entrega: **BACKUP_ACCESS_PENDING**, não BACKUP_RESTORE_VALIDATED.

### Backend compatível — artefato local pronto — 2026-10-17

**BACKEND_ARTIFACT_READY / REMOTE_DEPLOY_BLOCKED.** Build de produção local e pacote standalone aprovados. Nada remoto foi consultado ou modificado nesta etapa; não remove os blockers do preflight abaixo.

| Entrega | Evidência |
| --- | --- |
| Build | `npm.cmd run build`, exit 0; Next 16.4.2/Node 24.16.0, TypeScript e gates existentes de áudio/54 Avatares/Body-Fit PASS. Saída isolada `.next/task-0062-mobile` pelo flag já existente, sem mudar gameplay. |
| Endpoint compilado | Manifesto e log incluem rota dinâmica `/api/economy`, runtime Node. |
| Gate de protocolo | 5 testes focados PASS: 0, 1, null, undefined e RPC inexistente/42883 retornam 503 sem qualquer RPC de crédito/compra. Seis testes fora do filtro não foram repetidos. Caminho de sucesso 2 e demais contratos reutilizam provas anteriores com runtime preservado. |
| Smoke do pacote | Servidor iniciado da cópia standalone em 127.0.0.1:3376 e encerrado: seis checks PASS (GET API 405, POST sem chave servidor 503/no-store, ambas Arenas 200, bundle estático 200, .env.local 404); zero fetch externo, bloqueado por guard local de teste. |
| Isolamento de segredo | 44 arquivos cliente compilados examinados: zero nome da chave servidor, segredo Supabase ou JWT service_role; nenhum .env no ZIP. Nenhuma chave servidor real usada/configurada. |
| Preservação | 272 arquivos protegidos de assets/CSS/engine/SQL idênticos ao baseline desta etapa; Arena de Cartas e runtime econômico inalterados. SQL/cópias para revisão intactos. |

Artefato: `TASK-0076A-backend-n24aUXvzxurgm54TslAPZ-win32-x64`, BUILD_ID `n24aUXvzxurgm54TslAPZ`, **206.052.568 bytes**. ZIP SHA-256 `e75e7011bc21cc1acaa544c5a42dbd25e8854181bfadb6c4d7635f9652eef6a5`. Base Git `0df878764f26f0501959031dd4aec4a77fb9308a` mais fontes locais sem commit; fingerprint de 559 arquivos de entrada `69e01b6df215c27c8df69e7ca30a2c313900837e8c77d5fa0e18bd152eb6c98d`. HEAD sozinho não identifica esse backend.

[Pacote ZIP](../../build/task-0076a-reward-security/backend-artifact-20261017/TASK-0076A-backend-n24aUXvzxurgm54TslAPZ-win32-x64.zip), [identificação/recibo](../../build/task-0076a-reward-security/backend-artifact-20261017/artifact-receipt.json) e [instruções](../../build/task-0076a-reward-security/backend-artifact-20261017/README.md). Diretório também contém build-result/log, protocol-tests, smoke, package-security, source/payload-manifest e preservation. ZIP com CRC e manifesto de conteúdo verificáveis.

**Limite de plataforma:** standalone executável Windows x64 com dependências nativas. Não é `.vercel/output` e não deve ser enviado como `vercel deploy --prebuilt`. Na publicação futura, reconstruir as fontes revisadas em Linux/Vercel Production, registrar novo ID/hash e repetir somente os checks necessários desse artefato remoto. Pacote local pronto não equivale a release público pronto nem comprova transporte Supabase real.

Requisitos do protocolo 2 preservados: `getUser(token)` autentica sujeito; ownership no SQL; whitelist HTTP recusa identidade/quantidades/state/rewardKey/vencedor como autoridade do navegador; servidor deriva Jornada/combate e preços/quantidades são canônicos. Recibos/revisões/locks SQL garantem repetição e transação. Get da versão exige exatamente número 2 e falha em RPC ausente/erro; nenhum fallback a add_coins/spend_coins/snapshot. Evidências anteriores 117 casos + revisão direcionada de 11 reutilizadas; não foram reexecutadas auditoria, PostgreSQL ou E2E gerais porque a lógica/SQL não mudou.

Variáveis necessárias, apenas nomes: **NEXT_PUBLIC_SUPABASE_URL**, **NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY**, **SUPABASE_SERVICE_ROLE_KEY**. As duas públicas locais preexistentes foram reutilizadas no build/smoke; segredo servidor ausente. Ausência do segredo em Production continua sendo blocker conforme último preflight, sem nova consulta remota. PORT/HOSTNAME opcionais para executar standalone; RPG_MOBILE_E2E foi usado só como isolamento de build. Não colocar segredo em NEXT_PUBLIC_ nem no pacote.

Arquivos alterados nesta etapa: `apps/web/next.config.ts` adiciona somente `output: 'standalone'`; `apps/web/lib/economy/server.test.ts` amplia casos de protocolo ausente; `apps/web/next-env.d.ts` foi regenerado pelo Next para os tipos do diretório isolado. Contrato, memória e este relatório atualizados; evidências/pacote gerados em build/. Sem alteração visual, econômica ou de migration. Lint direcionado PASS e TypeScript do build PASS. Autorrevisão QA/Security, sem independência alegada.

Publicação coordenada continua condicionada a: chave servidor via responsável/canal seguro, B0 e restauração isolada demonstrados, manutenção/dreno e contas QA aprovados. Ordem: B0/ensaio → 0009 EXPAND/protocolo 1 → stage Production reconstruído das fontes aprovadas, sem domínio → gate 1 + B1 → ativar janela e promover backend compatível → 0010 em uma transação psql com ON_ERROR_STOP → protocolo 2 + smoke de duas contas sintéticas → liberar. Enquanto protocolo 1/ausente, o novo gateway deve responder indisponível; não conceder crédito por caminho antigo. Abas antigas exigem reload. Falha de 0010 reverte sua transação; após sucesso, manter backend compatível/ACL/ledger e corrigir para frente. Mecanismo de manutenção global ainda pendente; o artefato não introduz uma flag fictícia de manutenção.

Aceite local do backend: PASS. Remoto: BLOCKED por pré-requisitos operacionais já documentados, incluindo build/stage Linux aprovado. Sem commit/push/deploy, contas reais, configuração de segredo ou Supabase remoto.

### Preflight de implantação — 2026-10-17 — BLOCKED

Consultas remotas exclusivamente de leitura, sem dados individuais de jogadores. Evidências em `build/task-0076a-reward-security/remote-preflight/production-readonly-evidence.json` e `public-runtime-binding.json`. Reutilizadas as 117 verificações e os 11 testes da revisão; nenhum teste/migration/backup/restore/deploy executado neste preflight. Revisão documental/operacional pelo autor, sem independência alegada.

**Produção confirmada:** Vercel `rpgjovemcristao-web`, projeto `prj_mG2ZSDaSc5i2Pz2uqKSlCzSGiVmG`, equipe `team_FWD8MfZ9vARK8EBovoyTn9Ox`, domínio `rpgjovemcristao-web-inky.vercel.app`. Deployment READY `dpl_CHxbJAphNzND5f8ZbFoR86fT98Yt`, main/SHA `0df878764f26f0501959031dd4aec4a77fb9308a`. URL pública configurada e JavaScript servido apontam ambos ao Supabase **RPGJOVEMCRISTAO / wspafhlbtlpabypzymjo**, ACTIVE_HEALTHY, sa-east-1, PostgreSQL 17.6 (build 17.6.1.166). Não foram divulgadas credenciais.

**Compatibilidade:** backend publicado não contém `/api/economy` no SHA confirmado e é **incompatível com 0010 isolada**. Banco sem economy_private, economy_authority ou economy_protocol_version. Oito assinaturas legadas, oito políticas a remover, colunas/papéis necessários existem. Histórico remoto lista somente traveler_journey_progress e duas migrations de chat; não usar esse histórico como justificativa para reaplicar 0000–0008. Backend local compatível com protocolo 2 já validado, ainda sem artefato remoto aprovado.

| Variável exigida no Vercel Production | Configurada |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Sim |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Sim |
| SUPABASE_SERVICE_ROLE_KEY (somente servidor) | **Não** |

Presença não prova validade da chave pública. Nenhum valor secreto lido, copiado ou configurado. MCP de variáveis retornou 403; CLI 64.0.2 com mesmo projeto/equipe confirmou metadados. Somente URL pública foi lida individualmente para obter ref. DATABASE_URL não é exigida pelo gateway RPC atual. Credenciais operacionais libpq/PGSERVICEFILE/PGPASSFILE são separadas do Vercel e não estão preparadas na sessão; nunca enviar para NEXT_PUBLIC_.

**Backup/ensaio:** organização Free; disponibilidade de backup recuperável/PITR não confirmada — não presumir backup automático. Proposta: um archive pg_dump consistente de todo o banco não sistêmico, sem remover ACL/owners/RLS, mais roles sem passwords em arquivo separado e manifesto/hash privado. Inclui saldos/stats/inventários/equipados/progresso/recibos, Guilda/chat e dependências Auth; schema privado novo quando existir. Nenhum grant, instalação de extensão, slot ou desligamento de RLS para exportar. Falha de acesso mantém bloqueio. A [documentação pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html) confirma snapshot consistente durante uso concorrente; roles globais precisam conferência própria. Export/restore não executados, conexão operacional e destino privado não confirmados. Ensaio precisa de alvo Supabase compatível isolado, rede externa bloqueada, TOC/roles revisados e validação de ACL/RLS/recursos/recibos/tempo de recuperação; PostgreSQL puro com auth.uid sintético não substitui isso. [Backups Supabase](https://supabase.com/docs/guides/platform/backups) não incluem binários de Storage.

**Ordem proposta, condicionada ao desbloqueio:** (1) aprovar artefato/segredo, conexões, manutenção e contas QA; B0 + ensaio; (2) EXPAND 0009 em transação, protocolo 1, cliente antigo ainda funciona/exposição antiga permanece; (3) stage do novo backend em Production sem domínio, confirmar gate 1; (4) backup B1 pós-EXPAND/pré-CONTRACT; (5) ativar janela, promover artefato compatível e drenar operações conforme mecanismo aprovado; (6) executar 0010 inteira por psql `-X --single-transaction --set=ON_ERROR_STOP=1`; (7) confirmar protocolo 2, RLS/ACL, smoke e só então liberar janela. Nunca aplicar 0010 à versão antiga sozinha. Duração da janela depende do ensaio, não há estimativa comprovada. Abas antigas exigem reload; uma página de manutenção no Vercel não impede chamadas diretas ao Supabase. Mecanismo global/dreno ainda não selecionado: **blocker operacional**, sem flag fictícia disponível no código.

**Recuperação:** erro de 0010 reverte transação (prova anterior preservada). Antes do CONTRACT confirmado, release anterior pode ser retomado com exposição antiga explicitamente reconhecida. Depois, manter manutenção/backend compatível e corrigir para frente; não reabrir ACL nem promover o backend antigo. Pausa protocolo 0 afeta só gateway, não Guilda/baús. Dump antigo não pode sobrescrever jogadores sem reconciliação e autorização de desastre específica.

**Pós-implantação, ainda não executado:** nomear duas contas sintéticas QA-0076A-A/B com sujeitos Auth registrados e autorização para recursos de teste; não Chat A. Confirmar login, novo personagem/starter e isolamento A/B; negar identidade/state/rewardKey/winner adulterados e escrita direta; validar Jornada e ambas Arenas, quota, loja/baús/Guilda em dados sintéticos; oito liquidações simultâneas/replay com uma concessão, resposta perdida/reload; verificar recibos/saldos antes/depois, sem logs de tokens ou dados reais. Operações positivas modificam somente essas contas e exigem autorização futura explícita. Valores/regras conforme tabelas deste relatório, sem novo balanceamento.

Comandos exatos e classificação **leitura remota / escrita privada local / mutação remota futura** no [anexo operacional](TASK-0076A-PREFLIGHT-COMMANDS.md). Não é uma autorização de execução. Backup, segredo, manutenção e release permanecem pendentes; risco econômico em produção continua aberto.

Checklist humano antes de autorizar mudança:

- [x] Confirmar projeto, domínio, deployment/SHA, Supabase ref e pré-condições de catálogo.
- [x] Fixar runner transacional com parada em erro; reutilizar prova real aprovada.
- [ ] Disponibilizar e validar chave servidor somente em Production, sem expor valor.
- [ ] Confirmar exportação/armazenamento privado, B0/B1, restore isolado e RTO/RPO aceitáveis.
- [ ] Aprovar artefato/hash novo, acesso de smoke, mecanismo/dreno e horário da manutenção, recuperação e responsáveis.
- [ ] Autorizar/identificar duas contas QA e suas mutações de teste, sem jogadores reais.
- [ ] Aprovar separadamente implantação 0009, promoção compatível e cutover 0010 após todos os itens anteriores.

**BLOCKED — preflight remoto incompleto.** Faltam segredo servidor, acesso/backup/restauração demonstrados e definição operacional de release/manutenção. A validação local anterior permanece válida; não usar REMOTE_PREFLIGHT_COMPLETE enquanto essas condições não estiverem confirmadas.

### Revisão direcionada dos quatro pontos — 2026-10-17

Revisão pelo autor; análise independente forneceu os quatro quesitos, não se alega nova revisão independente. **11 testes direcionados PASS (8 HTTP reais com transporte SDK simulado + 3 PostgreSQL reais)**; não repetidos os 117 anteriores. Lint e typecheck dos testes PASS. Nenhum defeito de SQL/runtime comprovado, portanto nenhum código de jogo ou migration alterado. Novos testes: `apps/web/lib/economy/route-review.test.ts` e `packages/database/src/reward-security-review.postgres.test.ts`.

| Ponto | Decisão | Evidência |
| --- | --- | --- |
| 1. Atomicidade de 0010 no mecanismo escolhido | **CORRIGIDO** — lacuna do plano/evidência | Mecanismo fixado: psql com `-X --single-transaction --set=ON_ERROR_STOP=1 --file`. Executável real PostgreSQL 17.6: falha depois das revogações e falha após a última instrução retornam exit 3 e restauram integralmente o snapshot de catálogo/dados; arquivo original retorna exit 0 e protocolo 2. Não depende do comentário SQL. |
| 2. POST/Jornada e resultado de batalha | **PASS** | Importada a função POST real, atravessando handleEconomy, createEconomyPort e transitionJourney. state/rewardKey/userId/p_user_id no corpo: 400 sem RPC; state/rewardKey/userId/coins na action: 422 sem commit; complete sem provas: 422. Comando legítimo deriva state/rewardKey/revisão do contexto SQL. won/winner/winnerId/result/xp recusados em ambos os modos; replay clássico deriva won no servidor. Replay de cartas anterior permanece coberto pela evidência preservada. |
| 3. Identidade e segredo | **PASS** | getUser recebe Bearer e fornece user.id; user_metadata malicioso não influencia p_user_id. Erro do provedor com user presente resulta 401 sem RPC. Cliente verificador usa chave pública e cliente DB separado usa segredo servidor, sem persistência de sessão. server-only e env sem NEXT_PUBLIC_; grafo relativo de 77 módulos cliente não alcança módulo/segredo; next.config sem exportação env desse valor. Resposta testada não contém token/segredo sintéticos. |
| 4. Wrappers versus 0000–0008 | **PASS** | pg_proc antes/depois: corpos prosrc movidos idênticos, mesmos nomes/tipos de parâmetros e retornos uuid/jsonb. Search_path vazio nas implementações e wrappers. Criação segue auth.uid/starter fixo, agora definer privado; wrappers públicos invoker. Compra/abertura privadas mantêm definer, chamam public.spend_coins/add_coins qualificadas como proprietário, mesmo após revogação aos clientes. Execução real confirma compra 40, abertura canônica, replay único, negação a outro dono/anon e às implementações privadas de baú; RLS ativo nas dez tabelas inspecionadas. |

**Mecanismo operacional escolhido para o passo 5 do plano abaixo:** executar 0010 inteira em uma invocação psql com as três opções obrigatórias; não dividir instruções em autocommit, não usar execução por seleção no editor SQL, nem presumir atomicidade de outra CLI/runner. Exemplo PowerShell para futura operação autorizada, com conexão fornecida por ambiente privado (não executado remotamente):

```powershell
psql -X --single-transaction --set=ON_ERROR_STOP=1 --dbname "$env:TASK_0076A_MIGRATION_DATABASE_URL" --file "packages/database/migrations/0010_reward_security_cutover_task0076a.sql"
if ($LASTEXITCODE -ne 0) { throw 'Cutover falhou; não liberar economia.' }
```

O teste usa o mesmo psql/opções via `docker exec -i`, `--file=-`, recebendo os bytes SQL completos; não simula o runner. A [documentação psql 17](https://www.postgresql.org/docs/17/app-psql.html#APP-PSQL-OPTION-SINGLE-TRANSACTION) especifica BEGIN/COMMIT e rollback em erro com ON_ERROR_STOP; isso foi confirmado por dois fault injections reais. O `BEGIN` interno de um bloco DO em 0010 é PL/pgSQL, não commit da migration. Nenhuma instrução de 0010 exige sair da transação. Escolher outro mecanismo invalida esta comprovação operacional e exige verificar esse mecanismo antes da implantação.

ACL confirmada de economy_authority: authenticated=false, anon=false, service_role=true. SQL recebe identidade e estado/resultado **do backend privilegiado**; não revalida token HTTP nem reexecuta gameplay dentro do banco. Essa fronteira é intencional: autenticação/derivação em server.ts/authority.ts/journey-authority.ts, ownership e atomicidade no SQL. Não expor o wrapper privilegiado a clientes nem publicar o segredo.

Referências legadas conferidas: create_traveler vem de 0000; open_chest/purchase_chest de 0002; busca em 0000–0008 não encontrou substituições posteriores dessas três assinaturas. SET SCHEMA preserva corpo/OID da implementação. Tabelas e auth.uid/owns_traveler/helpers estão explicitamente qualificados; teste com tabelas temporárias homônimas e search_path hostil não desvia criação. A implementação privada create_traveler é executável por authenticated para permitir wrapper invoker, mas continua derivando dono de auth.uid e alocação fixa. Não dá escrita livre a recursos; implementações privadas de baús não são executáveis por authenticated. RLS não foi desativado; bypass restrito ao corpo definer com validação própria.

Evidências desta revisão: `build/task-0076a-reward-security/review-four-points/{targeted-tests,route-final,postgres-evidence,preservation-security,checks,cleanup}.json`. Instância loopback `rpg-task0076a-review`, banco sintético `task0076a_review`, dados descartados ao final. SQLs originais e cópias SQL-PARA-REVISAO conservam os mesmos SHA-256; Arena, animações, economia e jogadores intactos. Limites anteriores mantidos: auth.uid sintético no PostgreSQL e SDK simulado no teste HTTP; sem transporte Supabase real ou nova compilação de bundle. Changelog/documentação pública consultados, sem projeto remoto. Estado permanece **LOCAL_SECURITY_VALIDATED / REMOTE_APPROVAL_PENDING**.

Reutilizados relatório anterior, resultados das 63 verificações e diagnóstico `TASK-0076-COMBAT-CARD-SECURITY.md`, sem repetir auditoria de produção. Relatório/fontes anteriores preservados em `build/task-0076a-reward-security/continuation-20261017/prior-source/`.

O defeito era escrita de recursos pelo próprio dono sem validar origem econômica: snapshot enviava XP/nível, inventário/atributos e diferenças livres de moedas; `add_coins` aceitava quantidade positiva arbitrária; `claim_chest_reward` aceitava fase sem comprovação. RLS por propriedade não resolvia a origem. Não foi demonstrado vazamento entre jogadores. Cartas de equipamento derivam do inventário; não há tabela adicional de cartas colecionáveis.

A primeira preparação retirou recursos do sync e criou autoridade de Arena de Cartas/loja. Faltavam produtores legados e PostgreSQL. Reprodução anterior com stub continua sendo apenas prova do contrato do cliente; agora o teste PostgreSQL reproduz escrita vulnerável no baseline descartável e comprova rejeição após cutover.

## Contratos e compatibilidade

`POST /api/economy` verifica token com `getUser`, propriedade e protocolo de banco 2. Não aceita identidade, quantidades, preços, atributos, vencedor ou snapshot econômico como autoridade do navegador. Módulo privilegiado `server-only`; nenhuma chave service_role no frontend ou credencial configurada nesta tarefa.

| Fluxo | Autoridade e proteção | Recompensas preservadas |
| --- | --- | --- |
| Jornada/exploração | Comandos conhecidos, checkpoints e respostas dos fragmentos/segredo; revisão otimista e fonte única no banco | Coletas 8/12, baús 10/18, canto 7, vento 5 moedas; elmo raro |
| Leitura/devocional | Abrir/confirmar capítulos, respostas da compreensão; reflexão limitada, sem nota espiritual | Sem recompensa avulsa; perguntas/textos preservados |
| Snake/Quiz | Replay de entradas da física; tentativa de Quiz emitida no servidor, respostas válidas e ordenadas | Regras e quantidades existentes; não aceita vitória/posição/vida/pontuação declaradas |
| Conclusão | Pré-requisitos, Snake e Quiz confirmados; fonte `phase:garden-choice` | 120 XP, 30 moedas, amuleto, baú comum. Jornada completa testada: 90 moedas/120 XP |
| Arena clássica | Batalha emitida, combatentes canônicos próprios/treinador, replay de ações básicas/especiais | 8 XP/3 moedas; quota conjunta com cartas: três vitórias premiadas por adversário/dia UTC |
| Arena de Cartas | Contrato anterior, replay terminal e recibo preservados | Mesma recompensa/quota, visual intacto |
| Loja/baús | Item/tipo conhecido, preço/loot SQL, lock e ID de operação | Loja 35/65/115; um débito/consumo por operação |
| Missões reais da Guilda | RPCs existentes, participação, claims e revisor autorizado | Tiers mantidos e testados; simulador local não concede recursos online |

Bônus existente de nível: 10 moedas ao cruzar 200 XP. Sem rebalanceamento. Fila do cliente mantém ID após resposta perdida ou falha de recarga; releitura canônica antes de sucesso. Offline conserva simulação local, sem converter diferenças de save em crédito remoto.

Snake grava entradas resolvidas por frame, sem mudar desenho ou física do canvas. Servidor reproduz equações existentes; assistência exige duas derrotas anteriores reproduzidas sem assistência. Limites: 60.000 frames totais e 8 MiB no comando Jornada; demais operações mantêm 262.144 bytes. Teste diferencial roda o componente real com RAF sintético e aceita sua prova no replay; somente desenho simulado. Não é prova de presença humana/ausência de bots.

## SQL definitivo proposto e permissões

1. `packages/database/migrations/0009_reward_security_task0076a.sql` — EXPAND. Schema `economy_private`, batalhas com modo, estado/revisões/recibos/fontes únicas de Jornada, funções privadas e wrapper service-only. Lock `FOR UPDATE` por Viajante; recursos, inventário, checkpoint, baú e recibo atômicos. Preserva contratos antigos durante preparação; protocolo 1.
2. `packages/database/migrations/0010_reward_security_cutover_task0076a.sql` — CONTRACT, **uma transação**. Lock nas seis tabelas públicas, congelamento único dos checkpoints legados, marcação de fontes já consumidas inclusive recibos antigos de fase, triggers de proteção e inicialização atômica dos novos Viajantes. Revoga escritas livres e publica protocolo 2 ao final. Não reescreve saldos/XP/inventários existentes.

Journal/snapshots 0009/0010 acompanham a proposta. Arquivo vazio preexistente `packages/database/supabase/migrations/20261016041603_economy_authority_task0076.sql` intacto e fora da implantação.

RLS continua ativo. Quatro tabelas privadas (`battles`, `journeys`, `journey_rewards`, `journey_operations`) sem acesso direto de PUBLIC/anon/authenticated/service_role. Definers com `search_path` vazio e ACL explícita. `economy_authority` executável apenas por service_role; USAGE no schema público explicitamente concedido para o wrapper. Não existe endpoint administrativo público.

CONTRACT revoga INSERT/UPDATE/DELETE de wallets/inventory/traveler_stats e INSERT/UPDATE amplos de travelers, incluindo grants por coluna, de PUBLIC/anon/authenticated. Remove políticas `wallets_insert_own`, `wallets_update_own`, `inventory_insert_own`, `inventory_update_own`, `inventory_delete_own`, `traveler_stats_insert_own`, `traveler_stats_update_own`, `travelers_insert_own`. Leituras próprias/demais políticas mantidas. UPDATE autenticado limitado a name, aparência, is_active e journey_progress; trigger restaura campos protegidos da autoridade privada. Criação via wrapper seguro. Revoga EXECUTE de add_coins/spend_coins para clientes. Assinatura antiga claim_chest_reward permanece, exigindo entitlement já verificado. Compra/abertura de baús mantêm assinaturas com locks; RPCs da Guilda mantêm controle próprio. SQL contém ACL completa das funções privadas.

## PostgreSQL real e concorrência

Docker Desktop existente e imagem em cache `postgres:17.6`; container descartável `rpg-task0076a-security`, somente `127.0.0.1:55476`. Bancos sintéticos `task0076a_security`/`task0076a_contracts`; PostgreSQL **17.6 Debian x86_64**. Harness exige loopback/nome descartável, segundo banco vazio; migrations 0000–0010 aplicadas de verdade. Nenhum teste de escrita em produção. Container descartado após verificações, evidências mantidas.

`continuation-20261017/postgres-final.json`: **11 testes PostgreSQL PASS**, mais 8 do adaptador servidor no mesmo comando. `postgres-evidence.json`:

- Jornada legítima completa: 90 moedas/120 XP, equipamentos previstos e um baú; replay não duplica. Recursos/checkpoints legados preservados, fonte paga não paga de novo; novo Viajante inicializado atomicamente.
- **8 chamadas de fase simultâneas, 8 waiters medidos em pg_stat_activity, 1 recibo novo, 7 respostas duplicadas, 120 XP totais.** Conexões independentes aguardam a mesma linha antes da liberação do lock.
- 8 liquidações simultâneas da mesma batalha, também 8 waiters: 8 XP/3 moedas uma vez. Batalhas extras clássicas/cartas respeitam quota conjunta de três; handler HTTP aceita replay canônico de ambos e rejeita XP adulterado.
- Dois IDs diferentes disputam a mesma fase: um conflito 40001, uma concessão; retry não duplica. Mesmo ID com payload alterado recusado (22023).
- Seis compras/aberturas concorrentes de baú: um débito/consumo. RLS/ACL negam escrita econômica, anônimo, acesso privado e outro jogador; flags públicas forjadas não liberam fase.
- Constraint sintética falha depois de crédito de XP/moedas e antes do inventário: recursos, estado e recibo revertidos integralmente. Sem constraint, operação conclui.
- Guilda: self-complete 80 XP/25 moedas/comum; aprovação great 240 XP/100 moedas/incomum mais bônus de nível 10; revisor errado, concessão privada e repetição recusados.
- EXPAND mantém cliente antigo. Erro proposital dentro de CONTRACT reverte dados/permissões/protocolo; aplicação seguinte mantém recursos e retorna protocolo 2.

Limites: grants/RLS/locks/transações executados no PostgreSQL real; auth.users/auth.uid são fixtures por sessão. Sem Supabase Auth/PostgREST/Realtime remoto. Token tem teste unitário; não equivale a aceite do transporte Supabase ou QA física.

## Verificações e preservação

**117 casos distintos PASS, 0 FAIL, 0 SKIP, 18 arquivos.** Consolidação pelo último resultado de cada arquivo: 31 anteriores reutilizados em fontes preservadas, 86 executados nesta continuação. Não são 117 novas execuções nem repetição dos 63 antigos. Cobertura inclui comandos, resposta perdida/cache, sessão, IDs herdados de protótipo, React leitura/devocional, física e SQL real.

Evidências em `build/task-0076a-reward-security/continuation-20261017/`: `validation-summary.json`, relatórios JSON por suíte, `postgres-evidence.json`, `preservation.json`, `arena-structure.json`, `client-preservation-security.json`. Lint direcionado `eslint ... --max-warnings=0`, `tsc --project build/task-0076a-reward-security/tsconfig.json --noEmit`, `git diff --check`: exit 0. Sem build/E2E geral por restrição expressa.

Falhas intermediárias conservadas: fixture SQL/ordem de inicialização, USAGE no schema em banco limpo, Path2D ausente no jsdom, Response de mock consumida. Corrigidas causas e reexecutados testes pertinentes; sem aumentar timeouts, remover asserções ou esconder falhas com retries. Revisão corrigiu IDs herdados constructor/__proto__/toString, com testes negativos.

Baseline de 2.529 arquivos; nenhum asset/CSS, dependência/lockfile ou motor preexistente alterado nesta continuação. Arena de Cartas com hash integral preservado; cinco blocos JSX da clássica idênticos. Perguntas extraídas com valores idênticos. Grafo de 77 módulos runtime relativos dos clientes revisados não alcança server.ts ou nome da chave service_role. A física do canvas recebeu apenas registro de prova.

Arquivos da continuação:

- `apps/web/lib/economy/{authority,client,server}.ts`, testes cliente/servidor; novos journey-authority.ts/test.ts.
- Jornada: state/use-journey.ts, screens phase.tsx/arena.tsx; componentes garden-exploration, bible-reading, devotional e snake-chase-game.
- Novos dados reading-comprehension.ts/snake-replay.ts; testes journey-action-queue, journey-online-contract e snake-proof.
- SQL 0009 atualizado, SQL 0010 e snapshot novos, journal; reward-security.integration.test.ts e novo reward-contracts.postgres.test.ts.
- Este relatório, mesmo contrato em tasks/active e CURRENT_STATE. Trabalho anterior da TASK-0076 preservado.

## Implantação futura, backup e jogadores conectados

1. Aprovação humana específica e preflight de schema/ACL/ambiente. Referência pública preexistente: projeto RPGJOVEMCRISTAO, ref `wspafhlbtlpabypzymjo`, `https://rpgjovemcristao-web-inky.vercel.app/`. Nenhuma nova consulta nesse alvo nesta continuação.
2. Backup consistente anterior de schema/funções/RLS/ACL/roles e travelers/progress, wallets, stats, inventory/equipped, chests/operations, Guilda/claims. Guardar privado fora do repo, registrar versão/horário e ensaiar restauração isolada. Backup de produção não realizado nesta tarefa local.
3. Aplicar somente EXPAND 0009 em transação. Cliente publicado antigo permanece funcional; **vulnerabilidade ainda aberta nessa etapa**. Não executar todas as pendentes automaticamente.
4. Preparar release frontend/servidor compatível e segredo somente no servidor; smoke isolado. Gateway recusa protocolo 1/ausente com 503, sem fallback vulnerável. Nada configurado/publicado nesta entrega.
5. Janela econômica curta coordenada: pausar novas entradas, drenar escritas antigas, preparar/promover release compatível e aplicar CONTRACT 0010 transacionalmente. Não aplicar CONTRACT mantendo apenas a versão publicada antiga. Liberar depois de protocolo 2 e smoke. Locks podem fazer escritas aguardarem; manutenção deve tratar essa janela.
6. Abas antigas precisam **recarregar**. Recursos confirmados são preservados; deltas arbitrários e batalha antiga sem recibo não são importados automaticamente. Conservar pendências para reconciliação autorizada por evidência, sem inventar crédito. Fase já paga não paga novamente. Não se pode manter indefinidamente crédito arbitrário e fechar a falha simultaneamente; não se promete continuidade econômica de abas antigas sem reload.
7. Pós-implantação autorizada: duas contas sintéticas reais com Auth/PostgREST; isolamento, RPC/update negativos, Jornada/ambas Arenas, loja/baús/Guilda, replay/concorrência/saldo único, novo personagem, reload e resposta perdida. Conferir protocolo, ACL/RLS/recibos, logs sem segredo e artefato/visual. Sem usar Chat A ou modificar jogadores reais.

## Rollback

Antes de CONTRACT: manter 0009 aditiva e release anterior; sem apagar tabelas/recibos. Protocolo 1 fecha gateway novo, contratos antigos continuam disponíveis com exposição antiga.

Falha durante CONTRACT: ROLLBACK da transação restaura protocolo/grants/checkpoints, comprovado com erro forçado real. Não continuar aplicação parcial.

Após CONTRACT confirmado: pausar gateway, drenar requisições, manter release compatível anterior ou manutenção econômica e corrigir para frente. **Não restaurar grants vulneráveis, apagar ledger ou sobrescrever jogadores com backup antigo.** Restauração de desastre exige reconciliação/autorização específica para não perder concessões posteriores.

SQL opcional de pausa somente do gateway, operador autorizado, sem endpoint público; não executado nesta entrega:

```sql
BEGIN;
CREATE OR REPLACE FUNCTION public.economy_protocol_version()
RETURNS integer LANGUAGE sql SECURITY INVOKER SET search_path=''
AS $$ SELECT 0 $$;
COMMIT;
```

ACL anterior da função permanece. Servidor testado recusa protocolos 0/1. Isso não desliga RPCs seguras existentes de baú/Guilda; coordenar separadamente se necessário. Retornar 2 só após validação. Não há down destrutivo automático que apague ledger ou reabra a falha.

## Riscos e aceite

Checkpoints históricos congelados não provam ausência de fraude anterior; não recalculamos punições/saldos/progressão. Bot pode produzir entradas válidas: proteção limita origem/quantidades/replay, sem alegar detecção humana. Observar CPU/latência de provas longas no ambiente autorizado. Auth/PostgREST reais, backup/restore real, rollout público e QA física pendentes da fase remota.

SELF VALIDATE, QA direcionado, Security e aceite locais: PASS nos limites descritos. Entrega **LOCAL_SECURITY_VALIDATED / REMOTE_APPROVAL_PENDING**, contrato VALIDATING até decisão humana de implantação. Produção não foi corrigida por esta entrega; relatório não autoriza efeito remoto.
