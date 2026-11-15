# COMMUNITY-043B — pacote PROD (bloqueado)

**GUILD-035C — plano vigente de seis operações.** Os parágrafos abaixo da nota são histórico dos planos anteriores. O seletor agora exige exatamente as cinco fontes anteriores intactas e o complemento `sql/community_retention_v1.sql.in`, versão reservada `20261115170001`, na posição 6. Ordem/hashes estão fixados em `production-package.json` e `preflight.mjs`. Não basta alterar status: manifesto permanece blocked/migrations=[]. Nenhuma operação ativa criação ou instala automaticamente pg_cron.

O complemento separa marcador/replay da auditoria, trata exclusão/recuperação e liderança, restringe desidentificação aos eventos abrangidos e prepara limpeza/alertas de servidor. Após uma instalação futura autorizada, o operador privado deverá conferir pg_cron e executar `community_retention_private.install_schedule()` com alvo PROD explícito. Sem job correto e heartbeat recente, capacidade/criação negam. Contrato, ressalvas de Auth/privacidade e plano futuro: [GUILD-035C-CONTRACT](../../../../docs/architecture/GUILD-035C-CONTRACT.md). A exceção GUILD-035 não prova recuperação e não dispensa revisão de privacidade. Não executar SQL remoto a partir deste documento.

Validação dirigida do complemento: `node tests/hosted/community-retention-postgres.mjs` (19 checks) e `node tests/hosted/community-043b-capability-postgres.mjs --production-package --retention` (14 checks, incluindo instalação conjunta). Exigem PostgreSQL descartável e driver pg existentes. Scheduler representado por fixture SQL; não equivale a worker pg_cron hospedado. `node --test packages/database/deployments/community043b/preflight.test.mjs` valida as seis fontes e a recusa de execução remota pelo manifesto bloqueado.

GUILD-031G: o seletor agora exige cinco operações com paths, hashes e versões fixados no código, alvo PROD e scope `guild-ebd-001`. Os complementos têm versões reservadas `20261115150001`/`20261115150002` (sem colisão na consulta PROD de 15/11; reconferir imediatamente antes de instalar). O manifesto continua blocked/migrations=[]; quando autorizado, a lista deverá conter exatamente `{order,version,path,sha256}` para os cinco passos. A CLI aceita `production <project> <releaseScope> <historyFile>`; historyFile é um array JSON das versões obtidas por leitura remota, incluindo ECONOMY041. GUC/argumentos não provam identidade da conexão. O seletor valida e lista arquivos, não aplica SQL: o envelope transacional/registro remoto ainda deve ser operado pelo procedimento revisado. A lista não admite ECONOMY041 nem reaplicação dos cinco passos. Esta nota substitui as descrições históricas abaixo sobre o seletor limitado a três arquivos.

GUILD-031C: `sql/community_own_guild_capability.sql.in` é um complemento local de leitura, fora da seleção de migrations. Depende da fundação guardada do ambiente correto e deverá ser instalado na mesma transação/pacote revisado, após ela; não tem instalação remota autorizada. Reutiliza `community_actor`, sem copiar sua autorização de ambiente, e responde somente `{version:1,available:boolean}`. Nega capacidade para conta já criadora ou cinco memberships. O wrapper INVOKER e o helper privado de leitura só são executáveis por authenticated; anon/service_role não recebem EXECUTE. A submissão continua revalidada pela autoridade transacional. Não basta consultar capacidade para garantir uma criação futura sob concorrência.

Validação local dirigida: `node tests/hosted/community-043b-capability-postgres.mjs`, com `RPG_POSTGRES_BIN` e driver `pg` existentes (ou `RPG_PG_MODULE` explícito). Exercita as duas fundações em PostgreSQL descartável, 22 checks, sem endpoints remotos. Os três SQLs originais e seus hashes não mudaram; manifesto continua bloqueado.

Este diretório é o único futuro ponto de entrada para uma implantação específica de COMMUNITY-043B em produção. As fontes TEST continuam em `supabase/migrations` sem alterações; elas não devem ser reaplicadas nem encaminhadas a PROD.

## Seleção de ambiente

- Não usar `supabase db push` a partir da raiz do repositório para esta entrega: a pasta compartilhada contém arquivos de vários ambientes e o CLI tentaria aplicar todas as versões ainda pendentes.
- Produção deverá usar um pacote isolado e uma lista explícita de SQL PROD em `production-package.json`, com projeto fixo `wspafhlbtlpabypzymjo` e preflight local antes da revisão/aplicação manual controlada.
- A referência oficial do CLI confirma que `db push --remote` aplica as migrations locais pendentes do diretório do projeto; o package workflow, não um push geral do checkout misto, deve ser o único caminho para esta entrega. O CLI atual distingue alvo local e `--remote`, então o preflight também exige target explícito.
- O pacote permanece `blocked`. Há três rascunhos SQL em `sql/`, registrados apenas em `candidateMigrations`; a lista de publicação `migrations` continua vazia. O preflight recusa a seleção enquanto o pacote estiver bloqueado.
- Não mudar o status para `ready` até existir SQL PROD próprio, hash fixado, ordem revisada e ensaio integral em PostgreSQL descartável com snapshot/restore isolado. O preflight não substitui aprovação, backup/restore, CI ou a política de release.

## Ordem de dependência planejada

1. Fundação de criação controlada, com `community_creation_enabled=false` e `community_environment='disabled'` em PROD.
2. Capacidade/memberships e limites de links, preservando integralmente convites históricos e ACLs atuais.
3. Quotas de solicitação de entrada, sem reescrever registros existentes.

Os rascunhos GUILD-028B foram executados na GUILD-028C em PostgreSQL17.10 descartável, com 49 checks registrados em `validation-summary.json`. Seus bytes foram preservados; comentários de geração dos SQLs ainda descrevem o estado anterior à execução. `community_creation_enabled` nasce `false`; triggers novos retornam sem impor quotas enquanto o controle estiver fechado, e convites novos continuam sem versão COMMUNITY nesse estado. Ativação permanece fora deste pacote.

`node packages/database/deployments/community043b/render.mjs` reproduz os rascunhos localmente após conferir os blobs Git das fontes. A guarda SQL combina operador postgres, projeto declarado em GUC e release scope; o GUC é uma declaração do operador, não uma prova independente da identidade do servidor. A futura operação deverá também verificar o destino da conexão. Arquivos são drafts de revisão, não migrations remotas aprovadas; CLI/registro e CI do pacote final ainda pendentes.

Ensaio PostgreSQL local: disponibilizar `RPG_POSTGRES_BIN` com PostgreSQL17 Windows e `RPG_POSTGRES_TOOL_ROOT` com o driver `pg@8.23.0`; executar `node tests/hosted/community-043b-production-postgres.mjs`. O runner reutiliza a baseline sintética/versionada de governança, inicia somente loopback, encerra o servidor em `finally` e registra evidência após todos os cenários. Não usa conexões Supabase. Rerenderizar SQL invalida o estado de execução no manifesto; repetir o ensaio após qualquer mudança de bytes. A recuperação local vazia testada não é backup/restore PROD, e Auth/JWT no ensaio são fixtures.

## Verificação local

Na raiz do repositório, validar o pacote sem conexão ao Supabase:

```powershell
node --test packages/database/deployments/community043b/preflight.test.mjs
node packages/database/deployments/community043b/preflight.mjs production wspafhlbtlpabypzymjo
```

Enquanto o manifesto estiver `blocked`, o segundo comando deve terminar com erro `COMMUNITY-043B production package is blocked`; isso é esperado e não acessa o banco. Quando um pacote validado estiver pronto, a mesma verificação deve listar somente os três SQL versionados e conferir seus SHA-256. Esses comandos não aplicam migrations.

## GUILD-031E.2 — sequência consolidada (bloqueada)

`production-package.json` fixa os três SQLs em `candidateMigrations` e os dois complementos em `supplementalInstallations`, com SHA-256 e dependência do passo anterior. Os complementos são operações de instalação versionadas, sem cópias divergentes dos templates. Não são comandos de ativação. O seletor atual continua recusando o pacote; não basta trocar `status` para publicar cinco passos: o executor/lista aprovada deverá contemplar os complementos e o registro remoto antes da liberação.

Ordem única:
1. Fundação PROD (`candidateMigrations[0]`).
2. Quotas de membros e links (`candidateMigrations[1]`).
3. Quotas de solicitações (`candidateMigrations[2]`).
4. `sql/community_own_guild_capability.sql.in`, versão `community-own-guild-capability-v1`.
5. `packages/database/proposals/community-043b-production-control-v1.sql.in`, versão `community-production-control-v1`.

O passo 4 herda a guarda da fundação: nunca executar isoladamente, somente dentro da transação PROD revisada, após 1–3. O passo 5 exige postgres sem identidade de jogador, projeto declarado, scope correto, controles desligados e dependências presentes. Ambos têm ACLs explícitas; somente authenticated lê capacidade, somente postgres opera o controle. A capacidade não concede permissão: a criação revalida ownership, sessão e quotas. `createScoped` é preservado. Links/QR usam os fluxos atuais; não há endpoint novo de convites individuais.

Antes da instalação futura: comprovar recuperação com restore isolado e aprovar retenção; conferir conexão real PROD independentemente do GUC; confirmar CI exato, hashes e baseline; obter liberação explícita do manifesto. Alocar versões remotas distintas e conferir o histórico sem reaplicar ECONOMY-041. Revisar um envelope transacional único com limites de lock/tempo e os GUCs exigidos por cada etapa; os BEGIN/COMMIT internos dos três arquivos devem ser tratados explicitamente pelo executor revisado, nunca por db push geral. Qualquer erro deve abortar o envelope inteiro. O ensaio local usa esse envelope sobre dados sintéticos, não prova recuperação PROD.

Após instalar e registrar exclusivamente os cinco passos: verificar funções/ACL/RLS, controles desligados e invariantes dos registros históricos. Integrar código aprovado pelo fluxo normal e confirmar deployment/SHA. Só depois executar controle privado autorizado com UUID novo, revisão/estado anterior lidos, operador e referência de aprovação. Nunca alterar writes_enabled antigo para compensar bloqueios. Conferir criação e convites com conta autorizada; isso cria registros legítimos de teste e exige gate próprio. Conter incidente com a operação privada inversa e CAS, preservando Guildas, convites e ledger; não apagar histórico. Rollback de código não desfaz SQL nem transações.

Validação adicional: `node tests/hosted/community-043b-capability-postgres.mjs --production-package` (12 checks de integração dos cinco passos, PostgreSQL17.10 descartável). Reutilizar 49 cenários dos SQLs originais, 16 do controle e 22 da capacidade do SHA anterior quando seus hashes forem idênticos. Recuperação PROD BLOCKED; retenção PENDING; manifesto blocked/migrations=[]; nenhuma instalação remota autorizada nesta etapa.
