# TASK-0076A — Segurança das recompensas
ID: TASK-0076A
TITLE: Fronteira autoritativa da economia; preparação local
OBJECTIVE: Retirar concessões arbitrárias do cliente e preparar operações verificáveis e transacionais.
PRIORITY: P1 High
STATUS: BLOCKED
DELIVERY_STATE: BACKUP_ACCESS_PENDING
BACKEND_ARTIFACT_STATUS: BACKEND_ARTIFACT_READY / REMOTE_DEPLOY_BLOCKED
REMOTE_PREFLIGHT_STATUS: BLOCKED
BACKUP_RESTORE_STATUS: BACKUP_ACCESS_PENDING
SCOPE: apps/web/lib/economy/, app/api/economy, persistência online e repositories econômicos; integração de dados da Arena e compra (sem mudar markup, estilos ou animações); packages/database/; testes direcionados; este contrato, relatório único e memória.
OUT_OF_SCOPE: mudanças remotas, dados reais, commit/push/merge/deploy, dependências, UI/animações da Arena, Body-Fit, auditoria geral, tarefas paralelas.
DEPENDENCIES: TASK-0076 / SEC-ECONOMY-001
ASSIGNED_AGENT: autor nos perfis Backend, Database, QA e Security; sem subagentes ou revisão independente.
REQUIRED_CONTEXT: relatório e parecer TASK-0076; migrations e caminhos econômicos citados no relatório desta tarefa.
SECURITY_CONSIDERATIONS: identidade verificada no servidor; sem privilégios por nome/Chat A; nenhuma credencial em cliente, evidências ou código.
ACCEPTANCE_CRITERIA:
- Diagnóstico reproduzível isoladamente; bloqueio de escrita direta e crédito arbitrário preparado.
- Recompensas validadas no servidor, compra com preço canônico, isolamento, idempotência e atomicidade.
- Migração, incompatibilidades, backup/rollback e limitações apresentados antes de qualquer execução remota.
- TASK-0076 e arquivos preexistentes preservados; sem declarar produção corrigida.
TEST_PLAN:
- Unitários e segurança dos módulos alterados; lint dos arquivos alterados e menor typecheck disponível.
- PostgreSQL isolado para grants/RLS/transações se disponível; ausência será BLOCKED, nunca PASS fictício.
- Sem build/suíte E2E geral por restrição explícita do pedido.
DEFINITION_OF_DONE:
- Preparação local validada e limitações registradas; parada obrigatória antes de efeitos remotos.

## Autorização e delimitação
Pedido explícito anexo 55a466a3 autoriza correção local de aplicação e SQL. O orquestrador estende os contratos dos perfis às áreas acima, dentro desse pedido, sem delegação. A política permanente de publicação está suspensa nesta execução por instrução explícita do usuário.

## Baseline
Worktree existente feat/combat-card-system-v1-0076 preservado. Hashes locais em build/task-0076a-reward-security/baseline.json. Migration vazia preexistente 20261016041603_economy_authority_task0076.sql não será usada nem alterada.

## Resultado desta execução
### Preparação de backup e restauração
Resultado BACKUP_ACCESS_PENDING: nenhum arquivo real autorizado nos registros/armazenamento privado previsto, nenhum serviço libpq/credencial operacional configurado. Sem acesso a dados de produção ou exportação. Docker com pg_dump/pg_restore/pg_dumpall17.6 disponível; alvo vazio preparado em rede interna sem portas, raiz read-only/tmpfs, zero tabelas aplicação; Auth/Vault ausentes, não clone Supabase completo. Somente readiness/versões verificadas, nenhum restore/dado sintético/migration/teste econômico. Alvo/rede descartados. Relatório/anexo B/C atualizados com escopo, comandos, contagens/catálogos futuros e recuperação. Evidências backup-restore-preparation/. Integridade de dados reais NOT_RUN; status geral BLOCKED, sem BACKUP_RESTORE_VALIDATED. Desbloqueio: backup privado existente + autorização/procedência/ref/hash e alvo compatível, ou autorização separada de exportação com conexão segura existente e leitura completa; nunca pedir segredo na conversa. Artefato backend/SQL/runtime preservados.

Pedido vigente autoriza verificar meios/acesso já disponíveis, preparar PostgreSQL local descartável e restaurar somente backup real previamente autorizado e acessível. Sem backup identificado/autorizado, não acessar/exportar dados de produção. Perfis Database/DevOps/QA/Security pelo autor, sem delegação; ownership documental, comandos locais e evidência backup-restore-preparation/. Escopo inclui rede Docker interna e container vazio descartável, sem instalar dependências, segredos ou migrations. Não usar dados sintéticos como prova de recuperação. Nenhum dado de jogadores será consultado para contagens remotas nesta etapa sem backup autorizado.

### Preparação do artefato backend compatível
Resultado: BACKEND_ARTIFACT_READY / REMOTE_DEPLOY_BLOCKED. Build final produção standalone PASS/exit0 com TypeScript/gates completos. Cinco casos de gate protocolo PASS, seis fora do filtro deliberadamente; seis checks HTTP do pacote copiado PASS, zero fetch externo e processo encerrado. Lint direcionado PASS. SQL/lógica econômica e 272 protegidos/assets/engine preservados; reutilizadas provas anteriores sem rerun geral. Artefato TASK-0076A-backend-n24aUXvzxurgm54TslAPZ-win32-x64, 206052568 bytes, ZIP SHA256 e75e7011bc21cc1acaa544c5a42dbd25e8854181bfadb6c4d7635f9652eef6a5; fingerprint fonte69e01b6df215c27c8df69e7ca30a2c313900837e8c77d5fa0e18bd152eb6c98d. Windows x64/Node24, não Vercel prebuilt: reconstrução Linux/stage futura necessária. Arquivos de aplicação alterados só next.config output standalone, teste de gate e next-env gerado. Relatório/README/manifestos em backend-artifact-20261017/. QA/Security pelo autor PASS local; sem efeitos remotos. STATUS permanece BLOCKED para implantação: segredo Production/backup+restore/manutenção/dreno/QA autorizada e artefato Linux remoto ainda pendentes, sem autorização implícita.

Empacotamento portátil exige output standalone no Next; ownership estendido a essa opção em apps/web/next.config.ts. Primeiro build padrão isolado PASS; repetir build após a opção de empacotamento, mantendo todos os gates. Nenhuma mudança de regra econômica ou visual.
Pedido atual autoriza build de produção local e testes direcionados, superando exclusivamente a restrição anterior de não build. Mesmo ID, perfis Backend/DevOps/QA/Security pelo autor. Ownership inclui teste do gate de protocolo, documentação, evidências/empacotamento gerado em build/; runtime só se indispensável. Usar isolamento de build já existente RPG_MOBILE_E2E=1, que afeta apenas distDir/gates de artefato, sem alterar UI ou servidores anteriores. Sem chave servidor real nem nova configuração secreta; reaproveitar apenas configuração pública local preexistente. Não conectar Supabase remoto, executar migrations, publicar ou usar Git para commit/push. Evidências backend-artifact-20261017/. Prontidão do artefato não remove bloqueios remotos de backup/segredo/manutenção.

### Preflight remoto de implantação — somente leitura
Usuário autoriza confirmar produção/configuração e preparar backup/ensaio/rollout/recuperação/comandos, sem executar migrations, backup/restore, criação de segredos, contas, deploy ou Git. Perfis Database/DevOps/Security assumidos pelo autor, ownership documental e memória ampliado ao anexo docs/security/TASK-0076A-PREFLIGHT-COMMANDS.md. Nenhuma nova auditoria/teste extenso.

Produção confirmada por Vercel API/CLI e JS público: prj_mG2ZSDaSc5i2Pz2uqKSlCzSGiVmG, dpl_CHxbJAphNzND5f8ZbFoR86fT98Yt, SHA 0df8787; Supabase wspafhlbtlpabypzymjo/RPGJOVEMCRISTAO, PG17.6, organização Free. Backend publicado não contém API econômica nova e não é compatível com 0010 isolada. SQL apenas BEGIN READ ONLY/catálogos, sem dados individuais; pré-condições de funções/políticas/colunas presentes e protocolo novo ausente. Env metadata: duas públicas presentes; SUPABASE_SERVICE_ROLE_KEY ausente. MCP env403 resolvido por CLI com escopo explícito, sem pull de segredos.

SELF VALIDATE/Security documental: PASS quanto à leitura e preservação; aceite do preflight BLOCKED. Sem export credentials configuradas/prova de backup recuperável/ensaio e sem artefato novo/mecanismo de manutenção/dreno aprovados. Plano e comandos classificados no relatório/anexo; backup requer snapshot único + roles sem passwords; recuperação isolada de Supabase, não fixture. Reutilizadas 117+11 verificações, nenhuma reexecução. Nada remoto modificado. Validação local anterior mantida; não declarar REMOTE_PREFLIGHT_COMPLETE. Desbloqueio: comprovar os pré-requisitos acima e checklist humano, sem solicitar segredo na conversa nem inferir autorização de implantação.

### Revisão direcionada dos quatro pontos
Pedido atual autoriza revisar atomicidade no mecanismo escolhido, fronteira HTTP/Jornada, identidade/segredo e wrappers legados. Mesmo ID, sem investigação geral ou novas regras econômicas. Ownership inclui testes direcionados, plano operacional de implantação e relatório/memória; SQL/runtime somente se houver defeito comprovado. PostgreSQL local descartável autorizado. Selecionados perfis Backend/Database/QA/Security, assumidos pelo autor, sem delegação. Evidências em build/task-0076a-reward-security/review-four-points/. Não repetir as 117 verificações nem executar E2E geral ou serviços remotos.

Resultado: ponto 1 CORRIGIDO (lacuna operacional/documental, agora psql -X --single-transaction --set=ON_ERROR_STOP=1 comprovado com duas falhas reais e aplicação original); pontos 2/3/4 PASS. 11 casos direcionados distintos PASS: oito atravessam POST/porta/transition reais com SDK simulado; três em PostgreSQL 17.6 real verificam rollback/catálogo, corpos/assinaturas/search_path/ACL/RLS e chamadas legadas após revogações. Lint/typecheck direcionados PASS; fixture nova recebeu timestamp explícito após typecheck apontar argumento ausente, sem mudança runtime. Nenhum defeito de SQL ou código de jogo reproduzido; migrations/cópias e Arena preservadas. Relatório único atualizado com comando exato e limites da evidência. SELF VALIDATE/QA/Security pelo autor PASS, sem independência; sem repetir as 117, E2E/build geral ou efeito remoto. Estado de entrega permanece LOCAL_SECURITY_VALIDATED / REMOTE_APPROVAL_PENDING e contrato VALIDATING.

### Continuação autorizada em 2026-10-17
Mesmo contrato/ID. Usuário autoriza concluir os produtores legados, Jornada/exploração/Quiz/devocional/Arena clássica, testes PostgreSQL reais e concorrência em instância exclusivamente local e descartável. Ownership do autor estendido aos módulos desses fluxos e harness correspondente; sem mudança visual da Arena, balanceamento ou dados reais. Inicialização do Docker existente e container PostgreSQL descartável incluídas no escopo de teste, sem instalar dependências. Sem subagentes, nova TASK, commit/push/merge/deploy ou efeitos remotos. Resultados e fontes anteriores preservados em build/task-0076a-reward-security/continuation-20261017/.

### Aceite da continuação
LOCAL_SECURITY_VALIDATED / REMOTE_APPROVAL_PENDING. SELF VALIDATE, QA e Security locais PASS pelo autor, sem independência. 117 casos distintos PASS/0 FAIL/0 SKIP em 18 arquivos (31 resultados anteriores reutilizados, 86 executados nesta continuação); 11 casos reais PostgreSQL 17.6, dados sintéticos em Docker exclusivamente loopback. Oito chamadas simultâneas de fase e de batalha com oito waiters medidos, concessão única; concorrência de IDs distintos, baús, rollback de falha intermediária e do cutover, RLS/ACL/isolamento, Guilda e compatibilidade antigas/novas aprovados. Lint/typecheck direcionados e diff-check exit 0. Sem build/E2E geral por restrição expressa.

Contratos sem valores livres para Jornada/exploração/leitura/devocional/Snake/Quiz/fase e Arena clássica; modo local preservado. Duas migrations propostas, 0009 EXPAND e 0010 CONTRACT, com protocolo para coordenar release e proteção de checkpoints. Relatório único contém permissões, backup, rollout, rollback e consequências das abas antigas. Arena de Cartas hash idêntico à continuação, JSX clássico idêntico; assets/CSS/lockfile preservados. Evidências em continuation-20261017/validation-summary.json e postgres-evidence.json. Limites: auth.uid sintético no banco real, sem transporte Supabase remoto ou QA física; produção SEC-ECONOMY-001 continua aberta até implantação autorizada. Estado VALIDATING, sem DONE remoto ou autorização implícita. Histórico anterior abaixo superado apenas quanto aos bloqueios locais resolvidos.

### Preparação anterior — histórico
LOCAL_SECURITY_FIX_PREPARED / REMOTE_APPROVAL_PENDING — preparação parcial, não aceite integral. Relatório único: docs/security/TASK-0076A-REWARD-SECURITY.md.

- Autor: SELF VALIDATE, QA e Security, sem independência alegada.
- 63 casos distintos PASS, 0 FAIL, 1 SQL SKIP; lint e typecheck direcionados PASS, exit 0. Evidências em build/task-0076a-reward-security/validation-summary.json; testes SQL reais/concorrência não validados.
- Nova fronteira para Arena de Cartas/compra; proposta de revogação de escritas e crédito livre, recibo transacional e lock de baús. Sem mudança de JSX/estilo/animações da Arena.
- REWORK de compatibilidade: fontes de recompensa do Jardim/fase/Arena clássica/simuladores locais ainda não possuem contratos autoritativos; créditos genéricos online passam a ser recusados. Não aplicar a migration à versão publicada atual nem declarar preservação integral desses fluxos.
- BLOCKED por PostgreSQL descartável ausente e critérios de compatibilidade acima. Próximo: concluir contratos faltantes e SQL/concorrência/missões isolados, revisar proposta concreta; depois aprovação remota específica e cutover coordenado. Nada remoto, commit/push/merge/deploy ou dependência alterado.
- BUILD/E2E geral não executados por restrição expressa do usuário. Nenhum aceite físico/público inferido.
