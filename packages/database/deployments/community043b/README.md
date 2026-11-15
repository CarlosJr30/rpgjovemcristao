# COMMUNITY-043B — pacote PROD (bloqueado)

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
