# RELEASE-EBD-001 — lançamento inicial de Guilda e EBD

Atualizado em 24/10/2026, com rechecagem às 16h10–16h15 (Brasília). **Estado geral: BLOCKED para produção; Preview READY.**

## Resultado e ambientes

O candidato implementa o lançamento parcial autorizado: Auth, criação/seleção de avatar, Guilda e EBD. Combate, cartas, economia, loja, baús, mutações de equipamentos e História ficam indisponíveis por navegação, rotas/API e permissões do banco. O código e os dados desses módulos foram preservados. Isso descreve o candidato em testes, não uma funcionalidade já liberada em produção.

| Item | Estado | Evidência / limite |
| --- | --- | --- |
| Implementação do lançamento parcial | DONE | Commits `9cc4b73`, `6403416` e `23391b5`; testes abaixo |
| GitHub e CI do candidato runtime | DONE | SHA `23391b514a8b4cddbe7945ed0dfb343fc70d4a39`, CI [40121574829](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40121574829) success |
| Preview | DONE | READY, `dpl_ALfghjQxopcwRozMx4D4CEast7JR`, SHA exato conferido |
| Recuperação completa de acesso | BLOCKED | Pedido atual recebe HTTP 429 `over_email_send_rate_limit`; troca de senha e novo login ainda sem prova positiva |
| Destinos Auth de produção | BLOCKED | Leitura do CLI e probe negativo confirmam URLs de Preview no projeto PROD; nenhuma URL foi alterada nesta rechecagem |
| Migrations de produção | BLOCKED | Não aplicadas; dependem dos gates anteriores e conferência final de compatibilidade/backup |
| Publicação e testes pós-deploy em produção | BLOCKED | Não executados; nenhum merge/promoção produtiva nesta entrega |

- Branch: `codex/release-ebd-001`; [PR #10 em rascunho](https://github.com/CarlosJr30/rpgjovemcristao/pull/10).
- Preview estável: <https://rpgjovemcristao-ebd001-preview.vercel.app>.
- Preview imutável: <https://rpgjovemcristao-d8lu9apks-carlos-junior-s-projects.vercel.app>.
- Produção conferida remotamente: <https://rpgjovemcristao-web-inky.vercel.app>, READY, `dpl_H9aXo2mnhWvk2PD6BwQowpxeaiVv`, SHA `5edc93f5857b26a59b183e8abfb963110831f90c`. `origin/main` permanece nesse SHA.
- TEST: Supabase `wkdvdzfkbwvhyjmamrsg`. PROD: `wspafhlbtlpabypzymjo`. A Preview usa TEST; nenhuma variável de produção foi substituída pelo banco de testes.

## Causas e correções

1. **DONE — Dependências de economia:** o shell anterior expunha módulos fora do lançamento e o cadastro de avatar criava itens iniciais. O novo shell oferece apenas avatar/Guilda/EBD; criação de avatar passa a gerar nível 1, XP/moedas zero e nenhum item/baú ou liderança automática. ACLs bloqueiam RPCs econômicas e escritas diretas. Dados existentes continuam disponíveis para hidratação autorizada, sem permitir operações econômicas.
2. **DONE — Recompensas EBD:** formulários deixam de oferecer recompensas; o comando rejeita `rewardTier` não vazio e um trigger impede novos créditos pendentes. A aprendizagem, avaliações e presença continuam funcionando. Nenhum saldo/recibo antigo foi reescrito.
3. **DONE — Seleção de avatar:** o primeiro isolamento removeu a permissão de coluna necessária ao RPC invoker `set_active_traveler`. O teste real detectou o problema; migration separada devolveu somente `UPDATE(is_active)`, mantendo RLS de titularidade e negando XP, nível e proprietário. Correção validada antes de prosseguir.
4. **DONE — Legibilidade:** conteúdo EBD herdava fundo escuro incompatível com textos escuros; o wrapper recebeu fundo claro e a regra de labels foi limitada ao cartão, corrigindo também a seleção móvel indevidamente visível no desktop. Capturas finais desktop/móvel inspecionadas; contraste e largura validados.
5. **DONE — Configuração Auth de TEST:** o CLI autenticado comprovou `site_url=http://localhost:3000` e `additional_redirect_urls=[]`. Foram alterados exclusivamente esses dois campos para a Preview e seus callbacks `/auth` e `/auth/recover`. O diff posterior retorna zero alterações declaradas pendentes. Confirmação de e-mail, MFA e limites de envio permaneceram iguais. Nenhuma configuração Auth de PROD foi alterada.
6. **BLOCKED — Recuperação:** houve entrega real de e-mail antes da correção das URLs. O pedido do app envia o destino correto, porém novas solicitações retornam 429. A prova negativa com token deliberadamente inválido, sem cache, agora redireciona para a Preview `/auth/recover`; ela comprova configuração/destino e rejeição do token, não recuperação bem-sucedida.

## Testes e evidências

Evidências locais privadas em `build/release-ebd-001/`; contêm fixtures e metadados necessários à execução e não foram publicadas no Git. Credenciais permanecem em DPAPI; tokens, links de confirmação/recuperação e sessões não integram o relatório nem o histórico versionado.

| Gate | Estado | Resultado real |
| --- | --- | --- |
| Unitários | DONE | 756 PASS; 74 SKIP explicitamente não aprovados; `unit.log` |
| PostgreSQL isolado | DONE | 8 PASS: titularidade/seleção, criação sem grants econômicos, negações, Guilda/EBD e restauração; `postgres-recovery.log` |
| Navegador local desktop/móvel | DONE | 14 PASS; mocks isolados, sem alegar execução hospedada; `browser-local.log` |
| API hospedada com contas autorizadas TEST | DONE | 75 checks PASS; `hosted-api.json` |
| Fluxo hospedado completo Guilda/EBD | DONE | 35 checks PASS no SHA `6403416`, antes da correção exclusiva de apresentação; `hosted-browser-6403416.json` |
| Smoke hospedado do candidato final | DONE | 25 checks PASS no SHA `23391b5`; `hosted-browser.json` |
| Cadastro confirmado/login/avatar/logout | DONE | Confirmação real pelo provedor e 6 checks de UI no candidato final; `signup-login.json`, `auth-browser-initial.json` |
| Recuperação por e-mail e nova senha | BLOCKED | Pedido inicial entregue; pedido atual 429. Callback/troca de senha/login posterior sem PASS; `auth-recovery-provider-error.json`, `auth-browser-finish.json` |
| Lint, TypeScript e build | DONE | PASS; `lint.log`, `typecheck.log`, `build.log` |
| Protocolo de release | DONE | 25 PASS; `protocol.log` |
| Preservação de mídia aprovada | DONE | Gate 5 PNGs/6 composições PASS; couraça 3 e empunhadura aprovada preservadas; nenhuma nova arte |
| Desktop e viewport móvel | DONE | Contas reais, largura 390, presença/agenda/histórico, QR decodificado dos pixels do SVG; capturas finais inspecionadas |
| Celular físico | BLOCKED | Dispositivo conectado indisponível; emulação não é teste físico e não foi declarada como tal |
| CI do SHA runtime exato | DONE | Run 40121574829 success; não equivale a CI de eventual merge futuro |
| Produção pós-release | BLOCKED | Release não promovido; testes produtivos desse candidato não executados |

Os testes hospedados cobrem: criação explícita de Guilda; convite e QR real; solicitação e aprovação; designação de professor pelo líder; rascunho/edição/publicação; acesso do aluno; questionário e reenvio idempotente; atividades; agenda, presença e histórico após reconexão; isolamento entre Guildas; negações para aluno/terceiros/anon; rotas excluídas e API de autoridade 403; RPCs econômicas e alterações diretas de saldos/papéis negadas; logout e proteção da EBD.

### Limites e falhas registrados

- A primeira tentativa real de recuperação após corrigir a configuração reutilizou o token do e-mail anterior, alterando somente o parâmetro de destino para a URL agora autorizada. Chegou à proteção da Vercel antes da tela de senha; **FAIL**, sem alteração de senha. Não se trata de prova de recuperação nem de um novo e-mail com URL correta.
- O harness privado foi ajustado para seguir explicitamente o `Location` real do Supabase e aplicar OIDC somente ao domínio da Preview. Sintaxe validada; o cenário corrigido ainda não foi executado com novo token. Proteção Vercel não foi desativada; nenhum token foi persistido para contornar o teste.
- Retentativa normal posterior à correção de URLs também retornou `429 / over_email_send_rate_limit`. Não houve aumento de quota, desativação de confirmação, confirmação administrativa ou link administrativo artificial. Não se presume horário de liberação da quota.
- Nomes sintéticos de quatro fixtures recém-criadas continham dígitos, incompatíveis com a validação existente do cliente; somente essas fixtures próprias foram renomeadas pelo fluxo de atualização autorizado. Isso corrigiu o harness, sem alterar regras de nomes ou jogadores reais.
- Falhas iniciais do harness relativas a resposta void HTTP 204, ambiente público ausente e leitura de SVG como PNG foram corrigidas; os resultados finais acima correspondem às execuções válidas, sem reclassificar falhas anteriores como PASS.

## Banco, migrations e preservação

| Arquivo local | Registro remoto TEST | PROD |
| --- | --- | --- |
| `20261024151503_release_ebd_001_isolation.sql` | `20261024154422 release_ebd_001_isolation` | Não aplicada |
| `20261024154319_release_ebd_001_avatar_selection.sql` | `20261024155038 release_ebd_001_avatar_selection` | Não aplicada |

- **DONE:** 41 hashes de tabelas exatamente preservados antes/depois de cada DDL em TEST, inclusive `auth.users`; `migration-preservation.json` e `selection-migration-preservation.json`. Nenhuma migration anterior foi reaplicada.
- **DONE:** plano de recuperação estrutural gera definições e permissões efetivas de funções/tabelas/colunas/default ACL. Sua restauração foi executada e validada no PostgreSQL isolado, preservando dados/saldos. Fixture versionada: `tests/fixtures/release-ebd-recovery.sql`.
- **DONE preparação / BLOCKED execução PROD:** captura somente leitura das definições/ACL de PROD preparada em `prod-recovery-prepared.sql` (40.184 bytes), não executada. É backup estrutural para a alteração proposta; não é um dump completo dos jogadores. Atualizar captura/compatibilidade e baseline antes de eventual escrita produtiva.
- **DONE:** dependências essenciais existem em PROD: schemas `economy_private`/`ebd_ops`, tabela de recompensa pendente, RPCs EBD/convite/seleção. Isso não substitui validação completa da futura aplicação produtiva.
- **DONE:** PROD mantém quatro registros de migrations, último `20261023213654`; TEST mantém os registros prévios e os dois novos. Não executar `db push` indiscriminado: versões locais/remotas históricas exigem comparação por conteúdo e finalidade.
- **DONE:** consulta final somente leitura em PROD: 20 avatares, 245.376 XP, 1.006.767 moedas, 37 registros de inventário, zero tabelas públicas sem RLS e `release_scope()` ainda ausente. Produção permanece na versão anterior.
- **DONE:** novos avatares de teste não receberam XP, moedas, inventário, equipamentos, baús ou privilégios automáticos. Avatares ativos originais das quatro contas preexistentes foram restaurados pelo RPC oficial após os testes; não houve alteração manual de progresso.
- Advisors TEST: zero RLS desativada; avisos existentes de proteção contra senhas vazadas e funções definer foram registrados. Não foram removidos controles para suprimir alertas.

## Liderança e escopo futuro

- **DONE:** fluxo explícito de criar Guilda e assumir sua liderança, aprovar membros e autorizar professor validado com fixtures próprias; não há liderança automática no cadastro.
- **BLOCKED:** promoção do Teste Chat A não executada. Avatar ativo nível 50 permanece membro; avatar antigo nível 1 permanece preservado. Nenhum privilégio global ou `service_role` foi concedido à conta. A sessão autenticada alvo/processo administrativo desse caso ainda não foram comprovados. Essa pendência não é requisito para conceder liderança automática nesta release.
- **DONE isolamento / BLOCKED homologação futura:** Arena, Torre, cartas, economia, loja, baús, equipamentos econômicos e História permanecem bloqueados no candidato. Os 16 XP/6 moedas legados continuam sem origem comprovada, sem ajuste; não são usados para conceder créditos e não bloqueiam isoladamente este lançamento parcial.

## Arquivos e revisão

Mudanças desta release concentram-se em `apps/web/features/release-ebd/`, recuperação/Auth, páginas públicas e Guilda/EBD, `apps/web/proxy.ts`, API de autoridade, `apps/web/lib/release-scope*`, duas migrations, testes PG/e2e e fixture de recuperação. O PR inclui o histórico anterior aprovado de FIX-PROD, preservado e isolado; não implica liberar seus módulos.

QA e Security executados pelo próprio autor, sem alegação de revisão independente. Auth, RLS e autoridade continuam obrigatórios. Nenhum teste SKIP, simulado, não executado ou falho foi considerado PASS. **Acceptance check: BLOCKED. Não há DEPLOY_COMPLETE.**

Próximo gate: obter novo e-mail pelo fluxo normal quando o provedor aceitar, confirmar seu destino e executar callback/troca de senha/login com preservação do avatar, usando o harness corrigido. Somente após os gates obrigatórios: fluxo normal de PR/CI do SHA exato, conferência de recuperação/migrations/ambiente PROD, publicação e verificação real posterior. Não promover a Preview conectada a TEST como produção.

## Rechecagem solicitada — 24/10, 16h10–16h15 (Brasília)

**BLOCKED — recuperação:** uma nova solicitação normal pela UI recebeu novamente HTTP 429, código `over_email_send_rate_limit`, no projeto TEST. Não foram aumentados limites, alteradas URLs, gerados links administrativos ou repetidos envios em ciclo. Callback, atualização de senha e novo login não foram executados novamente, pois não houve novo e-mail aceito. Resultados anteriores foram preservados, inclusive as falhas; não há novo PASS de recuperação.

**DONE — gates independentes preparados:**

- CI do commit documental `a1cee133d9899f3239dd1151275f1150eddf980e` aprovado tanto no push ([40124054032](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40124054032)) quanto no PR ([40124057714](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40124057714)). CI runtime `23391b5` e testes anteriores continuam válidos: nenhuma alteração de runtime, teste, arte, dependência ou migration nesta rechecagem.
- Comparação somente leitura do recorte Guilda/EBD: 273 colunas e 37 políticas iguais em TEST e PROD; 24 assinaturas de funções presentes nos dois ambientes. Onze diferenças de hash eram exclusivamente finais de linha, confirmadas comparando as definições; duas diferenças funcionais são as substituições intencionais da release (`economy_private.create_traveler` e `public.guild_ebd_command`). Nenhuma divergência funcional inesperada nesse recorte. Isso não equivale a execução da migration ou teste hospedado produtivo.
- Preview runtime `23391b5` e produção `5edc93f` novamente READY nos mesmos deployments. Branch e `origin/main` conferidos; PR permanece em rascunho, sem merge. Worktrees e arquivos preexistentes preservados.
- Configuração TEST consultada sem escrita: zero diferenças nos campos declarados de Site URL/redirects. Nenhum `config push` foi executado nesta rodada.

**BLOCKED — novo achado em Auth PROD:** o projeto `wspafhlbtlpabypzymjo` atualmente informa Site URL `https://rpgjovemcristao-ebd001-preview.vercel.app`, com redirects `/auth` e `/auth/recover` dessa mesma Preview. Uma requisição negativa, sem conta e com token deliberadamente inválido, direcionada ao backend PROD e solicitando o callback produtivo, retornou 303 para a raiz da Preview, `otp_expired`, com cabeçalho `sb-project-ref` de PROD e cache DYNAMIC. Confirma a configuração efetiva, sem comprovar autenticação positiva nem alterar conta. A origem/quando esses valores foram configurados não foi determinada; nenhuma alteração produtiva foi feita pelo agente nesta rodada.

O destino de Auth PROD precisa corresponder ao domínio produtivo antes do lançamento. A instrução vigente determina não alterar novamente URLs; portanto, nenhuma correção de URLs foi aplicada. Essa pendência é separada do limite de envio em TEST e não desaparece quando o e-mail de teste for liberado.

### O que falta exatamente para liberar Guilda e EBD

1. **BLOCKED:** envio normal de recuperação aceito em TEST; novo e-mail com destino correto; callback real na Preview; atualização da senha, logout/novo login e preservação do mesmo avatar. Usar o harness corrigido e registrar os resultados, sem reutilizar token consumido nem alterar quotas.
2. **BLOCKED:** resolver a configuração Auth PROD que aponta para Preview e validar destinos/recuperação de produção. Permanece sem escrita enquanto vigorar a instrução de não alterar URLs e os gates obrigatórios não passarem.
3. **Pendente, preparado:** revisão final do SHA/CI e fluxo normal de PR/merge. Confirmar CI do SHA efetivamente destinado à produção, respeitando proteções e sem bypass; o CI de um SHA anterior não substitui essa conferência.
4. **Pendente, preparado:** atualizar baseline/backup estrutural e verificar migrations remotas novamente imediatamente antes da aplicação. Aplicar somente as duas migrations da release, ainda ausentes em PROD, por finalidade/conteúdo; não reaplicar o histórico TEST. Validar ACL, Auth, RLS e hashes dos dados depois, com recuperação disponível.
5. **Pendente, preparado:** confirmar variáveis do build produtivo apontando para PROD, acompanhar o deploy normal do SHA aprovado e conferir READY/aliases. A Preview ligada a TEST não deve ser promovida como se fosse o build produtivo.
6. **Pendente:** testes reais pós-deploy de Auth/avatar/Guilda/EBD, isolamento entre Guildas e negações de rotas/APIs econômicas, usando somente contas autorizadas. Confirmar preservação dos dados e registrar URL/SHA/resultado antes de declarar publicação concluída.

Celular físico segue indisponível; os testes móveis já executados são identificados como emulação. Arena/Torre/economia/História e a promoção específica do Teste Chat A continuam fora dos requisitos deste lançamento parcial, desde que seu isolamento permaneça comprovado. Não se exige repetir os testes já aprovados sem mudança ou evidência nova de regressão.

Evidências adicionais privadas: `build/release-ebd-001/recheck-20261024-1910/` (`ci-docs.json`, `compatibility.json`, `auth-prod-inspection.json`, `auth-prod-probe.json`, diffs Auth somente leitura e snapshots dos deployments). **Estado final: BLOCKED; nenhuma migration, mudança de URL/limite ou publicação produtiva nesta rodada.**
