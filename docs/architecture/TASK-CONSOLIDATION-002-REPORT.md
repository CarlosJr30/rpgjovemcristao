# TASK-CONSOLIDATION-002 — entrega local e gates da Preview

Data: 2026-10-20. **Preparação local DONE; avanço remoto BLOCKED.** Contrato mantido em tasks/active enquanto faltam projeto isolado, resolução do P1 e autorizações. Nenhuma publicação hospedada concluída. QA/Security pelo autor, não independentes.

## 1. Fechamento da CONSOLIDATION-001

Branch `codex/consolidation-preview-001`, implementação `e9e74ee1a93d12a1ff44cfbec1f2082a4dc6772e`, HEAD final `a0c6639791476d167ca48d5bd76a487ed481cfad`, checkout limpo e recibo SHA256 `abc0cae9207b82ddf7d80a851ed0af7a5f4e44a33882cbc42a72966cc38d97a5`. [Relatório 001](TASK-CONSOLIDATION-001-REPORT.md) e [ancestralidade](CONSOLIDATION-001-ANCESTRY.md) presentes: 0080–89 em sequência, sem merges/reaplicação. Correção CSS dos links sobrepostos no painel Guilda integrada e confirmada por geometria/capturas/testes. Root, main, pendências e protótipos preservados. A 002 parte exatamente desse HEAD limpo.

## 2. Branch e commits locais da 002

Branch `codex/consolidation-supabase-002`, checkout `D:/rpg-jovem-cristao/build/task-consolidation-002/checkout`. Base `a0c6639791476d167ca48d5bd76a487ed481cfad`. Implementação e planos no commit `70aa7e15a9441119b6fcbb68f429d80fc71b3cdd`; fechamento posterior somente documental. O HEAD final e estado limpo ficam no recibo `D:/rpg-jovem-cristao/build/task-consolidation-002/final-receipt.json`. Sem push, fetch, merge, main ou deploy.

Memória raiz atualizada por prefixo com bytes anteriores preservados: SHA256 anterior `3a7f80aced5d2f2c2627f066d706c478aa0e991c1b20e9a263fb7d198887b184`, novo `75e7bd84c2dd4c82a4c935eca130363e9899973f819baa2faee6174aad604180`. Auditoria focada PASS em 11 arquivos novos; root/main/origin/main, HEAD/estado da 001, tarefas 0080–89, nove pendências da raiz (exceto prefixo autorizado de memória) e sete arquivos 0080 preservados. O ZIP contém exatamente os 16 arquivos verificados e o SQL read-only coincide com a consulta de catálogo executada no teste.

## 3. Mapa das migrations

[Mapa e recuperação](CONSOLIDATION-002-MIGRATION-PACKAGE.md) e [lock completo](../../packages/database/reviewed/consolidation-002.lock.json): nove migrations baseline do journal, QR 0080 fora dele e três propostas 0081–83 não registradas, nessa ordem. Catálogo offline completo: 32 tabelas com RLS, 227 constraints, 77 índices, 39 policies, 73 funções (55 DEFINER) e 44 grants de tabela de API. [Inspeção read-only](../../packages/database/reviewed/consolidation-002.inspect.sql) reproduz o levantamento. Nenhum DDL/journal antigo, arquivo econômico pendente ou ID foi modificado.

## 4. Pacote local validado

Empacotador/validador em [scripts/database](../../scripts/database/prepare-test-db-package.mjs), sem modo remoto. Pacote de 16 arquivos, 13 SQL, ID `85cf7ba4c743f74f0f1561d6862e953d713b112820c783698e116fda38555591`. ZIP local `D:/rpg-jovem-cristao/build/task-consolidation-002/db-package-85cf7ba4.zip`, SHA256 `25c3bac35aeddf236c8db394daf3d6cea9fec60c0bc31afcad78c637042f67b6`. Rejeita divergência de fonte/saída, extra SQL, traversal e junction; não apaga nem sobrescreve pacote divergente. Não é pacote liberado para hosted.

## 5. PostgreSQL, RLS e validação

| Evidência nova | Resultado |
| --- | --- |
| `node --test scripts/database/prepare-test-db-package.test.mjs` | 3 PASS; determinismo, integridade e recusas; log package-unit-links-final.log |
| `node --test packages/database/tests/consolidation-002.postgres.test.mjs` | 7 nós PASS, pai + 6 cenários; log postgres-package-rework.log |
| Lint dos três MJS novos | PASS; log lint-package-links-final.log |
| Package/ZIP/catalog/scope/preservação/diff/secrets focados | Conferidos no recibo/auditoria finais |

Banco offline limpo PostgreSQL 17.6.1.166, defaults restritivos, cópias reais dos 13 SQL, duas Guildas/sete identidades sintéticas. Cobriu instalação, grants/roles sem administração, dados privados, QR sem promoção, missão/avaliação sem crédito, EBD/professor/publicação/resposta/presença/pendência, isolamento e Story individual recusada sem recibo. Aula sintética é fixture do teste, nunca seed do pacote. Container sem rede/portas/binds, sem pull e encerrado pelo teste.

Logs iniciais preservam falhas e reworks: contenção do root do pacote corrigida; ensaio de missão passou a iniciar antes de submeter, negativa QR reconhece “Invite unavailable” e gabarito é verificado oculto antes da resposta/visível após conclusão, conforme contrato. Nenhum SQL do produto alterado. Revisão final acrescentou teste negativo de junction de saída.

Reuso válido da 001: 102 testes unitários selecionados, 25 do protocolo CI (elegibilidade continua false), 7 nós PostgreSQL, cobertura de 21 casos browser por última evidência aplicável, incluindo os seis rechecks finais Guilda/EBD; lint, TypeScript, build, isolamento de 948 artefatos e oito protótipos intactos. Não é nova execução integral 21/21. Não repetir esses gates: app/TS/env/runtime/dependências/mídia estão idênticos. Lint novo limitado aos MJS adicionados. Sem alegação de CI remoto ou teste hosted.

## 6. Plano Supabase isolado

[Ambiente/Auth/custos](CONSOLIDATION-002-ENVIRONMENT-AND-AUTH.md) e [plano JSON](CONSOLIDATION-002-REMOTE-PLAN.json). Inventário autorizado encontrou produção RPG e dois produtos inativos, nenhum RPG de teste. Proposta de projeto novo/vazio `rpgjovemcristao-test`, organização `CarlosJr30's Org`, região São Paulo/sa-east-1, Free, sem cópia de produção, branch, upgrade ou add-on. Ref do alvo ainda nulo; schema/Auth de produção não foram consultados para compensar a ausência.

## 7. Custos e configurações

Usuário escolheu a organização somente para cotação. `get_cost` retornou amount 0, recurrence monthly, type project; não retornou moeda. Cotação repetida ao usuário e registrada; nenhuma criação autorizada. Plano Free e limites oficiais citados no documento de ambiente: dois ativos, 500MB, pausa por inatividade e sem backup automático. Disponibilidade não inferida pela contagem. Auth normal e confirmação de e-mail mantidas, Anonymous Sign-ins desligado no futuro alvo, caixas/SMTP revisados antes de testadores externos. Origem HTTPS/callback/APP_BASE_URL permanecem pendentes de URL real, sem valores inventados ou produção.

## 8. Vercel de testes

Confirmado por GET somente do teste: `prj_qKzjXMVXwiVpGlU66SoTA71mStXX`, equipe `team_FWD8MfZ9vARK8EBovoyTn9Ox`, Next.js, root apps/web, Node24.x, build npm run build e instalação npm ci --prefix ../.. --no-audit --no-fund. SSO em todos os deployments; sem env, Git vinculado ou deployment. MCP403 registrado; CLI existente fez fallback GET no mesmo alvo, sem repetir o erro ou ler credenciais. Não existe URL jogável confirmada. CLOUD-007/pinned-preview antigo intactos e não elegíveis para este alvo/branch.

## 9. Bloqueios reais

- Projeto Supabase isolado ainda não criado/identificado; falta verificar ACL/config/históricos/REST/JWT reais após autorização.
- **P1 ECON-LEGACY:** escrita própria de carteira/XP e superfícies de concessão herdadas; não corrigidas fora da 0078. UI/proteção Vercel não impedem chamadas diretas à API.
- Ausência de origem HTTPS real, Auth/e-mail/env de teste configurados e teste de sessões entre dispositivos com conta não anônima.
- SHA ainda sem push/CI remoto e método de publicação aprovado para o projeto de teste. Sem autorização de deploy.
- Conteúdo/vídeo/recibos de Story, catálogo/aquisição, autoridade da Torre e mídia licenciada continuam pendentes por funcionalidade; podem aparecer indisponíveis, sem concessão alternativa insegura.

## 10. Operações que precisam de autorização específica

1. Criar **somente** projeto vazio com nome/organização/região/plano/cotação acima, sem extras; então comprovar isolamento pelo novo ref/host.
2. Ler metadata/config do alvo isolado, reconciliar históricos e aprovar estratégia de registro/aplicação dos 13 SQL e recuperação. SQL remoto não autorizado aqui. Resolver o gate econômico no contrato próprio antes da exposição pretendida.
3. Configurar Auth/callbacks/caixas ou SMTP e env exclusivamente de teste, com origem real revisada. Não copiar segredo/config de produção.
4. Autorizar push do SHA escolhido, obter CI, selecionar método/projectId/proteção e autorizar publicação; verificar READY, URL e fluxo hospedado somente depois. Não chamar hook antigo.

## 11. Checklist atualizado

- [x] 001 fechada, limpa, base/ancestralidade/recibo/correção conferidos.
- [x] Ordem/hashes/proveniência/journal e catálogo completo mapeados.
- [x] Pacote instalado primeiro em banco local descartável; integridade e negativas testadas.
- [x] RLS/ACL/DEFINER/legados/dependências e recuperação registrados; P1 preservado como bloqueio.
- [x] Metadados Supabase/Vercel e cotação específica consultados no escopo autorizado.
- [x] Plano de Auth/env/callback/CI/proteção e operações revisáveis documentados.
- [x] Evidências/gates reutilizados sem repetição desnecessária; reworks registrados.
- [x] Revisões do autor e controle de preservação/commits/memória registrados no fechamento.
- [ ] Projeto/ref/host de teste isolado existente e comprovado.
- [ ] Gate econômico resolvido para o perfil exposto; migrations/config remotas autorizadas e executadas.
- [ ] Auth real, CI do SHA, publicação e fluxo hospedado aprovados e verificados.

## 12. Próximo passo executável

Revisar a proposta concreta e autorizar **somente a criação do projeto vazio** `rpgjovemcristao-test`, `CarlosJr30's Org` (`xwyyrzctzharutyqysch`), `sa-east-1`, Free, cotação zero mensal de 2026-10-20, sem upgrade/add-ons/cópia de produção. Após eventual criação, conferir separação e preparar autorização seguinte de SQL/Auth/env com o gate P1 tratado. Nenhuma autorização foi inferida da resposta sobre cotação. Relatório de publicação continua BLOCKED.
