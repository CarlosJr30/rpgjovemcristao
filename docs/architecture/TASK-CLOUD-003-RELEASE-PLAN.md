# TASK-CLOUD-003 — Plano de release da Arena

**Entrega: RELEASE_PLAN_READY. Produção: BLOCKED.** Data: 2026-10-18.

O plano e a correção mínima estão disponíveis para revisão; não há autorização de implantação nesta entrega. Na preparação inicial não houve acesso a dados reais, migration remota, segredo configurado, push, alteração de main ou operação Vercel.

### Finalização no GitHub

O pedido posterior autoriza commit e push exclusivamente de `cloud/task-cloud-003-release-plan`. `apps/web/vercel.json` desativa deployments automáticos somente dessa branch com `git.deploymentEnabled`; não altera configurações remotas, main ou a branch de origem. Fontes da aplicação permanecem iguais aos hashes já aprovados: build e testes não são repetidos. O SHA definitivo é o commit Git que contém esta entrega; o manifesto não tenta incorporar o próprio SHA recursivamente. A produção continua BLOCKED.

## Origem e escopo

- Origem confirmada: `cloud/rpg-jovem-cristao-migration`, commit `38b766c5c1778d4c9eb637cd1c4521cafc8fa982`, árvore inicialmente limpa.
- Branch de trabalho: `cloud/task-cloud-003-release-plan`, criada da origem acima. HEAD preservado; alterações locais aguardam revisão/commit.
- Reutilizadas 0076A (autoridade econômica), B (mobile), C (demo isolada), D (Arena principal) e E (Jornada fictícia integrada). Nada foi reconstruído ou rebalanceado.
- Fonte do workflow: [CODEX-CLOUD-WORKSPACE](CODEX-CLOUD-WORKSPACE.md). Inventário/hash: [manifesto](TASK-CLOUD-003-RELEASE-MANIFEST.json).

## Estado da integração

| Item                | Evidência e limite                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Arena principal     | `app/journey/arena/page.tsx` escolhe `CardArenaScreen` no jogo normal; este usa `CardArena` e exige Viajante. Em Preview escolhe `ArenaDemo` com retorno à Jornada.                                                                                                                                                                                                                       |
| Navegação normal    | `JOURNEY_ROUTES.arena` e os menus desktop/mobile de `shell.tsx` apontam para `/journey/arena`; retorno aponta para `/journey`. A prova histórica 0076D cobre o fluxo com fixtures. Nesta máquina, a navegação normal no navegador está bloqueada por configuração pública Supabase ausente; não foi apresentada como aceite autenticado real.                                             |
| Arena antiga        | A página mantém `redirect('/journey/arena')`. O smoke normal Linux encontrou HTTP 200 com `NEXT_REDIRECT` no payload, sem header Location. Correção local em `proxy.ts` passa GET/HEAD diretamente a HTTP 307 antes da renderização/AuthProvider. Smoke final confirmou ambos; sem remoção do motor clássico interno ou mudança econômica.                                                |
| Demo sem recompensa | Apenas estado React em memória, sem callbacks de liquidação, moedas/XP persistidos ou inventário pessoal. Proxy Preview nega APIs/métodos persistentes; Providers está fora da árvore. CLOUD-002 comprovou zero gravação em Storage/IndexedDB e zero requisição externa nos quatro E2E. Isso não comprova operações autenticadas.                                                         |
| Mobile aprovado     | CSS/apresentação/engine/assets permanecem iguais à origem. 0076B documenta 20 layouts + 7 interações finais; CLOUD-002 executou toque/5 cartas/energia em 406×904 no Chromium Linux. Recibos privados antigos não estão neste checkout: os 27 casos históricos não foram reexecutados nem apresentados como resultados Linux atuais. POCO X7 físico, ergonomia e FPS continuam pendentes. |

Em `VERCEL_ENV=production`, `RPG_ARENA_DEMO=1` é ignorado. Uma Preview Vercel sempre seleciona a demonstração: seu sucesso não libera o jogo autenticado nem substitui um stage do backend normal.

## Protocolo econômico 2

O cliente autenticado usa `POST /api/economy`, runtime Node, com token validado por `getUser`. O servidor deriva combatentes, transcrição/replay, preços e transições da Jornada; identidade, quantidade, vencedor e snapshot econômicos do navegador não são autoridade. O SQL verifica propriedade, serializa por Viajante e conserva ledger/recibos para repetição e concorrência.

`server.ts` exige exatamente o número **2** de `economy_protocol_version`; protocolos 0/1/ausente ou RPC inexistente falham com 503. Sem segredo servidor, a rota também falha com 503/no-store. Não há fallback para `add_coins`, `spend_coins` ou crédito remoto baseado em save local. A simulação offline legítima permanece separada da economia online.

| Componente                                   | Dependência para publicação                                                                                                                              |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0009_reward_security_task0076a.sql`         | EXPAND: schema privado, autoridade/recibos e contratos de compatibilidade; protocolo 1. Mantém a exposição antiga, portanto não encerra SEC-ECONOMY-001. |
| Backend normal compatível                    | `/api/economy`, `lib/economy/*`, clientes/sync e engine do mesmo release; disponível e compilado em Linux local, sem comprovação de transporte remoto.   |
| `0010_reward_security_cutover_task0076a.sql` | CONTRACT integral/transacional: ACL/RLS/checkpoints/triggers e protocolo 2. Só após backup, manutenção/dreno e backend compatível.                       |
| Transporte real                              | Auth + PostgREST/RPC + duas contas QA autorizadas; isolamento, replay, concorrência e recursos canônicos ainda precisam de aceite remoto.                |

A prova PostgreSQL/atomicidade de 0076A é histórica e local/sintética; não é backup/restauração Supabase. Nenhum teste PostgreSQL foi iniciado agora: as conexões descartáveis não estão configuradas. Não houve execução vazia declarada PASS.

## Variáveis — somente nomes e presença

| Nome                                   | Finalidade                             | Máquina cloud nesta tarefa                      | Production, último registro de 2026-10-17                 |
| -------------------------------------- | -------------------------------------- | ----------------------------------------------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Projeto usado pelo cliente/verificador | Ausente no processo; nenhum .env local presente | Configurada historicamente; estado atual não reconfirmado |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Cliente público/Auth                   | Ausente no processo                             | Configurada historicamente; estado atual não reconfirmado |
| `SUPABASE_SERVICE_ROLE_KEY`            | Somente servidor, wrapper econômico    | Ausente no processo                             | Ausente historicamente; estado atual não reconfirmado     |

Inspeção restrita à presença e aos nomes dos bindings, sem leitura de valores/arquivos de credenciais. `DATABASE_URL` não é exigida pelo gateway; conexão operacional PostgreSQL para backup/migrations é requisito separado, do operador. Nenhum requisito ou segredo novo foi configurado. Não preencher segredos na conversa, no bundle, no manifesto ou em `NEXT_PUBLIC_*`. Variáveis públicas devem corresponder ao mesmo projeto do segredo servidor, a confirmar pelo operador sem divulgar valores.

## Supabase e Vercel: bloqueios precisos

O último preflight em [0076A](../security/TASK-0076A-REWARD-SECURITY.md) é de **2026-10-17**, não uma leitura remota atual. Os conectores remotos não estão disponíveis nesta sessão; não foram instalados nem substituídos por acesso a credenciais.

| Prioridade | Gate ainda não comprovado                                          | Condição de liberação futura                                                                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0         | **BACKUP_ACCESS_PENDING**; B0/restore real/RTO/RPO sem comprovação | Backup privado autorizado, procedência/hash, alvo Supabase compatível isolado, restauração e integridade ACL/RLS/recursos/recibos demonstradas; B1 preparado após EXPAND. Não inferir PITR/backup pelo plano contratado.               |
| P0         | Segurança econômica remota                                         | Reconfirmar catálogo/ACL e SEC-ECONOMY-001 por metadados; aprovar 0009/0010 separadamente. Último registro: schema/protocolo novo ausentes. Não reaplicar 0000–0008 pelo histórico parcial de migrations.                              |
| P0         | Manutenção e dreno globais não definidos                           | Mecanismo aprovado que trate chamadas diretas ao Supabase e abas antigas, responsáveis e duração medidos no ensaio. Página de manutenção Vercel ou protocolo 0 isoladamente não bastam. Nenhuma flag global fictícia existe no código. |
| P0         | Segredo servidor Production não comprovado                         | Responsável confirmar/configurar posteriormente por canal seguro sob autorização própria; esta tarefa não faz essa configuração.                                                                                                       |
| P0         | Backend público incompatível no último registro                    | Reconfirmar deployment/SHA/configuração; preparar artefato normal compatível em Linux, alvo Production sem promover domínio, e testar gates. Não aplicar 0010 sobre backend antigo.                                                    |
| P1         | Artefato final ainda sem identidade imutável                       | Revisar correção local, registrar commit/manifesto e novo build ID/hash. Não promover o build de demo nem o ZIP Windows histórico.                                                                                                     |
| P1         | Smoke remoto e aparelho                                            | Aprovar duas contas QA e suas mutações sintéticas; validar Auth/PostgREST/ledger real e POCO físico. Nada equivalente foi feito nesta tarefa.                                                                                          |

Vercel histórico: projeto `rpgjovemcristao-web`, raiz `apps/web`, deployment `dpl_CHxbJAphNzND5f8ZbFoR86fT98Yt`, SHA `0df878764f26f0501959031dd4aec4a77fb9308a`. Esse commit não contém `/api/economy`, confirmado no objeto Git local. A compatibilidade com 0010 isolada é negativa para esse snapshot; não se afirma que esse ainda seja o deployment ativo. O build atual Linux confirma compilação/empacotamento Node/Next, não execução em Vercel nem validade de suas variáveis.

## Arquivos necessários e fronteiras do pacote

Publicar futuramente o **checkout completo do release revisado**, respeitando o workspace npm e a raiz Vercel `apps/web`; não selecionar só a tela da Arena.

- Frontend/integração: páginas de Jornada/Arena/legacy/layout, `proxy.ts`, `arena-preview.ts`, `components/{card-arena,card-arena-presentation,arena-demo,journey-preview}`, CSS aprovado, screens, domínio/dados/persistência e assets versionados.
- Autoridade: `app/api/economy/route.ts`, `lib/economy/*`, `lib/supabase/online-sync.ts`, repositories e os produtores de Jornada/loja/baús/Guilda já integrados. Preservar remoção de crédito arbitrário.
- Workspace/build: `packages/game-engine` e seus exports, `packages/shared`, `packages/ui`, `packages/database` necessários aos imports, manifests/lockfile único, `.npmrc`, tsconfigs, `next.config.ts` e scripts/gates. Node 24 LTS/npm 11; sem substituir lockfile ou desligar verificações.
- Banco: **0009 e 0010 + snapshots/journal**, como propostas separadas para o operador; o build/deploy não as aplica. Arquivo vazio `packages/database/supabase/migrations/20261016041603_economy_authority_task0076.sql` não é migration de implantação.
- Excluir de artefatos/commits: .env locais, segredos, dumps/backups, caches, sessões, traces privados e cópias históricas `SQL-PARA-REVISAO`. Não usar standalone Windows como `vercel --prebuilt`; Linux standalone também não equivale a `.vercel/output`.

O manifesto identifica os arquivos alterados frente ao snapshot Production histórico, correções locais e hashes críticos. Não é uma allowlist para omitir dependências transitivas do checkout.

## Plano coordenado — somente para execução futura autorizada

1. **P0 — Fechar pré-requisitos.** Reconfirmar projeto/branch/SHA/deployment/variáveis por metadados; resolver backup/acesso/restore, manutenção/dreno, contas QA, responsáveis, recuperação e aceite físico. Revisar este diff, fixar commit/artefato e obter autorização específica de mudança. Parar se qualquer gate não for comprovado.
2. **B0 e ensaio.** Sob autorização própria, registrar snapshot/manifesto privados e restaurar em alvo isolado compatível. Validar recursos, progresso, recibos, Auth, ACL/RLS e recuperação; medir janela. Não criar exportação nem tocar jogadores por inferência.
3. **EXPAND 0009.** Operador autorizado executa somente o arquivo exato em transação, com parada em erro. Confirmar protocolo 1 e compatibilidade antiga; vulnerabilidade antiga ainda aberta. Não executar todas as migrations pendentes automaticamente.
4. **Stage compatível sem promoção.** Construir fontes fixadas em Linux com modo normal/Production e variáveis corretas; criar deployment Production sem atribuir domínio, conforme o anexo 0076A. Não usar Preview para validar operações reais, pois Preview é demo. Registrar target, commit, build/hash e acesso seguro ao smoke. Gate 1 deve negar economia com 503 enquanto banco estiver no protocolo 1; sem fallback. Preparar B1 pós-EXPAND/pré-CONTRACT.
5. **Janela e troca coordenada.** Somente com mecanismo global comprovado: suspender novas operações, drenar escritas/chamadas diretas e promover o artefato compatível. Exigir recarga de clientes antigos. Não deixar o backend antigo como única versão no cutover.
6. **CONTRACT 0010.** Operador autorizado executa o arquivo inteiro numa única invocação psql, `-X --single-transaction --set=ON_ERROR_STOP=1`; não executar seleção em autocommit nem supor atomicidade de outro runner. Confirmar protocolo exatamente 2, ACL/RLS/checkpoints/recibos antes de liberar. Ver [anexo operacional](../security/TASK-0076A-PREFLIGHT-COMMANDS.md), sem executar seus comandos nesta tarefa.
7. **Gate 2 e liberação.** Com contas QA e operações previamente autorizadas: Auth real e isolamento A/B, novo Viajante, Jornada→Arena→retorno, loja/baús/Guilda, replay/reload/resposta perdida/concorrência/quota com uma concessão, recusa de crédito direto/identidade adulterada e comparação canônica de recursos/recibos. Conferir UI mobile aprovada, logs sem valores sensíveis e artefato correto. Só liberar a janela após os resultados e aprovação humana.

### Recuperação e riscos

- Antes de CONTRACT: 0009 é aditiva; interromper avanço e manter/repor o release antigo implica reconhecer a exposição econômica anterior. Não apagar ledger/recibos.
- Erro em 0010: runner transacional deve reverter tudo; parar e comprovar retorno ao estado anterior antes de outra ação. Evidência histórica de fault injection não dispensa conferir o resultado do operador.
- Após CONTRACT confirmado: manter backend compatível/manutenção e corrigir para frente. **Não** promover backend antigo, reabrir grants vulneráveis, apagar ledger ou restaurar backup antigo sobre concessões posteriores.
- Protocolo 0 pausa somente o gateway, não todas as RPCs de baú/Guilda. Recuperação de desastre requer autorização e reconciliação próprias.
- Riscos adicionais: lock/espera durante 0010, abas antigas em chamadas diretas, credencial/projeto divergentes, build cacheado em modo Preview, falsa confiança em fixtures e falta de QA físico. Avisos DEV de dependências registrados em 0076 não foram reauditados; não são declarados corrigidos por esta tarefa.

## Validação econômica e reaproveitamento

| Evidência                      | Resultado                                                                                                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CLOUD-002, antes da alteração  | npm ci, lint, typecheck, build Preview Linux PASS; 32 unitários e 4 E2E PASS, no mesmo commit de origem. Fontes econômicas/visual inalteradas.                                                                |
| Testes econômicos desta tarefa | **45 PASS / 6 arquivos**, cobrindo autoridade, POST real com SDK simulado, cliente sem fallback, remoção de crédito arbitrário, liquidação online e indisponibilidade segura. Não é transporte Supabase real. |
| Correção de redirect           | **7 PASS**, incluindo dois casos novos GET/HEAD em local/Production e cinco testes existentes de isolamento Preview; POST normal permanece delegado.                                                          |
| Build normal Linux             | PASS; modo `RPG_ARENA_DEMO=0 VERCEL_ENV=production`, saída isolada `RPG_MOBILE_E2E=1`; API Node/Proxy, types e gates de mídia/HD/Body-Fit aprovados. Novo build após o ajuste no proxy.                       |
| Smoke standalone normal        | Cinco checks HTTP: Jornada200 sem marcador Preview, legado GET307/HEAD307, API GET405 e POST503/no-store sem configuração. Saída de fetch do servidor bloqueada; zero tentativa externa observada.            |
| Navegador do jogo normal       | **BLOCKED_MISSING_PUBLIC_CONFIG**: `Supabase environment variables are missing`, sem tráfego externo. Não se configura credencial nem se inventa fixture de produção para obter PASS.                         |
| Lint/tipos após correção       | ESLint e Prettier dos dois arquivos alterados PASS; typecheck de todos os workspaces/raiz PASS. Lint completo anterior reutilizado para o restante inalterado.                                                |
| Não executados                 | Supabase/PostgreSQL real nesta tarefa, restore/backup, smoke autenticado remoto, WebKit/Edge e POCO físico. Nenhuma suíte completa repetida.                                                                  |

Logs/recibos locais em `/workspace/.cloud-tools/cloud-003-*`; estes são evidências desta máquina, não blobs presumidos do GitHub. O manifesto traz hashes das evidências atuais. QA e Security pelo próprio autor, sem alegação de revisão independente. Alterações visuais, engine, balanceamento e migrations não são necessárias.

**Aceite:** plano revisável concluído; a produção continua bloqueada pelos gates enumerados. RELEASE_PLAN_READY não significa PRODUCTION_READY, REMOTE_PREFLIGHT_COMPLETE ou autorização para publicação.
