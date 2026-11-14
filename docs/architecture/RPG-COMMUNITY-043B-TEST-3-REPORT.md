# COMMUNITY-043B-TEST-3 — prontidão técnica para homologação

14/11/2026. **Preparação local concluída; homologação ainda BLOCKED.** Nenhuma migration remota, ativação, deployment, merge ou escrita em TEST/PROD foi executada. PR #55 e os relatórios/evidências anteriores foram preservados.

## Preview isolada

Preparado um verificador separado do gate da demo da Arena, sem editar sua autorização. Fixa PR #55/SHA, CI de primeira tentativa, repositório/time/projeto Vercel TEST, raiz `apps/web`, host, SSO e variáveis Preview apenas na branch COMMUNITY; rejeita backend/flags PROD, variáveis sensíveis Preview sem escopo de branch, configuração incompleta, inventário truncado, SHA incorreto e deployment duplicado ou sem marcador. Consulta Vercel e GitHub somente por GET. **Não cria deployments via API/CLI:** exige exatamente uma Preview criada pela integração Git nativa e falha se ela não existir. O workflow é `workflow_dispatch` em `main`, sob o ambiente protegido `community-test-preview` e variável de habilitação; nenhum dispatch foi executado.

O projeto fixo `rpgjovemcristao-test`/`prj_qKzjXMVXwiVpGlU66SoTA71mStXX` está com SSO habilitado. A leitura anterior não confirmou link Git/root e encontrou três variáveis de backend Preview sem branch explícita; ainda não confirmou as variáveis COMMUNITY de TEST. Portanto o preflight intencionalmente falha até o projeto ter link/root fixos e variáveis estritamente isoladas, além de uma deployment Git única do SHA exato. Não alteramos essa configuração.

## Ativação privada TEST

Adicionado pacote versionado não migration `packages/database/proposals/community-043b-test-control-v1.sql.in`. Guarda instalação no projeto TEST conhecido, no `release_scope` esperado e com a fundação 043B presente, estado inicial fechado, além de negar instalação repetida. A função de propósito único só pode ser executada pelo papel `postgres`; usa lock transacional, estado/revisão compare-and-set, operação UUID idempotente, nega no-op/conflito, registra antes/depois e identificador técnico da sessão/transação em tabela privada com RLS, grants revogados e trigger imutável. Só altera os dois campos COMMUNITY e nunca `writes_enabled`, contas ou registros de jogadores. A aplicação remota desta proposta **não está autorizada nesta etapa**.

Limite importante: a referência de aprovação e o rótulo do operador são campos auditáveis declarados, não uma validação criptográfica do GitHub pelo banco. O operador autorizado deve conferir a aprovação no ambiente protegido e a identidade do projeto no Dashboard Supabase imediatamente antes de executar o SQL; o banco, sozinho, não prova o project ref. O pacote também falha em PROD enquanto a fundação TEST-only não estiver instalada, mas a seleção explícita do projeto no Dashboard continua precondição obrigatória.

Contenção: desativar pela mesma operação versionada, com nova UUID e revisão/estado atuais esperados. Preservar a auditoria e todas as Guildas/memberships. Se CAS ou contexto falhar, parar e reavaliar; não fazer `UPDATE` manual nem executar o recovery vazio após qualquer criação. A reversão do controle não reverte uma Guilda criada.

## Recuperação e conta

Backup/PITR TEST continua **não comprovado**. O conector disponível não expõe a cobertura nem um ponto de recuperação verificável; nenhum restore foi feito. Checklist futuro: no projeto TEST correto, abrir Supabase Dashboard → **Database → Backups** e **Point in Time**; registrar plano/tipo, backup mais recente ou estado PITR, janela recuperável mais antiga/mais nova e caminho/tela de restauração. Não confirmar a etapa de restore. Se a página não apresentar backup aplicável/janela válida, interromper antes de DDL. A documentação oficial informa que restore torna o projeto inacessível durante o processo e que backups de banco não incluem Storage: [Supabase Database Backups](https://supabase.com/docs/guides/platform/backups).

A conta TEST acessível do `Herói TEST Equipamentos` já consumiu a quota de criação. Não apagar Guildas, ledger ou conta. O smoke requer um operador legitimamente autorizado, com login normal, que controle um avatar TEST existente que ainda satisfaça a elegibilidade de primeira criação após revalidação. Não foi disponibilizado tal acesso nesta tarefa.

## Integração e validação

Sequência futura preservada: #53 → conferir migration ECONOMY-041 já registrada e deployment automático → #54 → conferir main/deployment → sincronizar #55 com main e rodar CI no SHA novo. Depois, confirmar backup/PITR, comparar histórico TEST, instalar as três migrations TEST na ordem aprovada, revisar RLS/ACL/baselines, ativar apenas via operação versionada, aguardar a Preview Git nativa e fazer um único smoke autenticado (criar, replay do mesmo request, negar segunda Guilda), preservando a Guilda e o ledger. Não promover antes desses gates; cada merge em `main` pode disparar o deploy Vercel automático, sem deployment manual duplicado.

Validação local desta preparação: **52 testes Node direcionados PASS**, incluindo negativas do gate original e do verificador separado; harness PostgreSQL descartável da operação TEST PASS; `node --check`, Prettier nos arquivos novos e `git diff --check` PASS. O primeiro teste novo falhou porque o fixture positivo não continha uma deployment Git; fixture corrigida e conjunto reexecutado PASS. O harness usou `pg` 8.23.0 já existente com versão igual à lockfile, sem instalar dependências. CI para o novo SHA ainda depende de persistir/publicar o commit da branch; nenhum CI ou gate é inferido como PASS nesta execução.

**Estado:** PRs #53/#54 preservadas abertas; #55 permanece Draft, sem merge. Preview, migrations e ativação TEST não executadas. Teste autenticado não realizado; TEST não aprovado; PROD inalterada; não DEPLOY_COMPLETE. QA/Security foi revisão própria, sem independência.
