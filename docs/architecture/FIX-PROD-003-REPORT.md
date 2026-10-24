# FIX-PROD-003 — Homologação e publicação

Estado final: **BLOCKED para produção**. Conferência em 23/10/2026, 23:20–23:25 BRT (24/10 UTC). Nenhum merge em main, deployment produtivo, migration produtiva ou promoção do Teste Chat A foi executado nesta tarefa.

## Resultado por etapa

| Etapa | Estado | Evidência e limite |
| --- | --- | --- |
| Código, testes locais e CI | DONE | Candidato `f9f7c36b440010a310e3254d5316e8d1cdaed796`, CI success do SHA exato. |
| Recuperação e migrations em testes | DONE | Snapshot do escopo afetado, seis testes PostgreSQL aprovados; quatro increments pendentes aplicados uma vez no projeto de testes. |
| Sete cartas / aquisição em testes | DONE | Sete ações distintas; aquisição por solicitação explícita; um recibo por conta, inclusive concorrência; definições remotas iguais ao manifesto após correção de encoding. Não é aprovação econômica de produção. |
| Equipar / desequipar / persistir | DONE | 23 verificações hospedadas com JWT real; atributos e persistência também exercitados no navegador. Sem perda ou duplicação de inventário. |
| Troca entre dois itens do mesmo slot / aparência integral | BLOCKED | Catálogo atual tem apenas um item por slot; contas novas possuem legitimamente apenas botas. Não houve grant de itens para fabricar o cenário. Overlays aprovados não cobrem todos os itens/corpos, inclusive a aparência do alvo Teste Chat A. |
| Arena — vitória, derrota, recibos e reconexão | DONE | Duas vitórias reais, derrota real, consumo único de carta, comando concorrente, CAS, persistência e proteção de recibos; 29 verificações na Preview final e seis verificações finais de recibos. |
| Arena — todos os efeitos / economia completa | BLOCKED | Quatro cartas exigem níveis 2/4/6/8; a conta de teste continua legitimamente nível 1. Efeitos de nível superior não foram aprovados como executados hospedados. Baús, revogação administrativa e recompensas de Guilda positivas não foram integralmente exercitados em hospedagem. |
| Torre — primeiro andar / progressão / derrota no segundo | DONE | Vitória legítima no andar 1, persistência da liberação do 2, derrota no 2, nova sessão preserva nextFloor=2. |
| Torre — sete andares / campeão / recompensas | BLOCKED | Andar 2 não vencido; 3–7 e campeão não executados. Contas legítimas novas são nível 1, sem equipamento/XP artificial. Contrato econômico da Torre permanece `tower-economy-unapproved`; até a vitória real do andar 1 paga zero e informa blocked. Não foi inventada uma tabela de prêmios. |
| Auth, RLS e autoridade econômica no escopo testado | DONE | Quatro logins reais; proteções de propriedade, DML e RPCs exercitadas; 17 batalhas fechadas; soma de recibos coincide com XP e moedas; zero crédito em derrota. Isso não reconcilia valores legados produtivos. |
| Guilda/EBD — permissões de contas de testes | DONE | 13 verificações reais de criação/adesão normais, administração restrita a líder, workspace EBD e rejeição de outro UID/Guilda. Não equivale a testar todas as funções pedagógicas de professor. |
| Teste Chat A — liderança | BLOCKED | UID autenticado da sessão produtiva não confirmado; ferramenta de acesso ao Chrome falha ao inicializar kernel assets. Nenhuma permissão alterada. |
| Preview | DONE | READY, SHA exato `f9f7c36`, backend exclusivo de testes, verificações reais executadas. |
| Publicação em produção | BLOCKED | Gates de Torre, recompensas, reconciliação legada, aparência e identidade/permissões do alvo ainda não cumpridos. Produção preservada. |

## Causas e correções

1. O candidato FIX-PROD-002 tinha o RPC de equipamentos apenas como proposta, sem aplicação hospedada. A migration incremental foi ensaiada e aplicada somente em testes, mantendo locks conta → Viajante → inventário, ownership, slots fixos, CAS, replay, bloqueio durante batalha e ACL restrita. Nenhuma quantidade, XP, moeda ou atributo-base é escrito por esse RPC.
2. Não existia uma ação explícita na interface para solicitar o evento starter existente. O botão novo chama exclusivamente o servidor; não distribui cartas em montagem de componente nem aceita definição, saldo ou resultado do cliente. O servidor verifica usuário real e emite um único recibo por conta.
3. Conflitos persistentes eram lançados com SQLSTATE `40001`. O teste hospedado reproduziu timeout e os logs repetiram `Equipment changed; reload`. Uma migration incremental troca exclusivamente esse literal por `PT409` nas duas funções identificadas; o servidor mantém HTTP 409. Auth, RLS, CAS e economia permanecem iguais. A causa é compatível com o [diagnóstico oficial do Supabase sobre repetição de transações](https://supabase.com/kb/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions).
4. REWORK do executor: a leitura inicial de SQL via PowerShell interpretou incorretamente os acentos das descrições. Conferência remota detectou divergência somente nesse campo. Uma migration nova, com transporte ASCII/escapes Unicode e guarda do estado anterior, reparou somente descrições; não se reescreveu nem reaplicou migration registrada. As sete definições remotas agora coincidem integralmente com o manifesto.
5. REWORK das fixtures: os nomes iniciais de teste continham números, aceitos pela criação SQL mas incompatíveis com o validador do domínio. Foram normalizados por edição autenticada permitida para `Homologacao ...`; somente os quatro Viajantes desta tarefa, sem alterar valores econômicos. Timeouts locais de testes WSL foram adequados a 30 s após falhas de harness; os seis testes finais passaram. Artefatos anteriores não foram apagados.

## Cartas e versões

Fonte: `arena-cards-2026-10-20.2`; regras: `arena-v2-measured-strike-003a.1`. Catálogo de teste: `arena-cards-2026-10-20.2-fixprod003-test`, aprovação restrita `FIX-PROD-003:TEST-ONLY:2026-10-23`; manifesto tem `productionApproval: false`.

| Carta | Ação | Nível mínimo | Foco |
| --- | --- | --- | --- |
| Ataque Simples | attack | 1 | 0 |
| Defesa | defend | 1 | 0 |
| Golpe do Caminho | special:path-strike | 2 | 2 |
| Guarda Perseverante | special:steadfast-guard | 4 | 2 |
| Discernimento | special:discernment | 6 | 2 |
| Passo do Peregrino | special:pilgrim-step | 8 | 3 |
| Golpe Medido | special:measured-strike | 1 | 1 |

Todas usam a raridade comum já congelada e um uso por carta por batalha; posse não é consumida. Golpe Medido preserva multiplicador ofensivo 1,15 e ganho de Foco zero. Nenhum parâmetro de balanceamento foi reduzido para vencer testes.

SHA256 do JSON de origem na ordem original: `ec5a22038ca372e57e9b64fc5883d3086a25db241b0d3f03e5c0e39d3437baf1`. SHA256 canônico com chaves ordenadas, igual entre fonte e remoto: `32ba6048d341dc2910b869d165930af7e0daf36a299e27e594d0e2cfc010b459`. JSONB ordena chaves de forma própria; não se compararam hashes de serializações diferentes como se fossem os mesmos bytes.

## Recuperação e migrations

Destino verificado: **`wkdvdzfkbwvhyjmamrsg` / rpgjovemcristao-test**, PG17, protocolo3. Antes: 17 migrations, quatro usuários Auth existentes, zero Viajantes/inventário/guildas/cartas, cinco definições de história. Snapshot local ignorado de 699042 bytes, SHA256 `a1a944b6a7dcbccc1ca994b0665d658f3060b811b49c266fc7ca61cb4d990f8c`, cobre 35 tabelas públicas/econômicas, 71 definições de funções e metadados/ACL/políticas/journal. Não contém backup completo de senhas/sessões do Auth e não habilita alterações em produção.

Restauração comparou dados das 35 tabelas e definições das 71 funções em clone PostgreSQL descartável e sem rede; verificou rollback atômico, guarda de destino, permissões, conflitos HTTP e restauração exata dos textos. Em falha, interromper e preservar journal/recibos; não resetar nem apagar aquisições posteriores.

| Arquivo local | Registro remoto UTC | Nome remoto |
| --- | --- | --- |
| `20261024001624_fix_prod_003_owned_equipment.sql` | 20261024002943 | fix_prod_003_owned_equipment |
| `20261024001803_fix_prod_003_test_catalog.sql` | 20261024002948 | fix_prod_003_test_catalog |
| `20261024003314_fix_prod_003_http_conflicts.sql` | 20261024004326 | fix_prod_003_http_conflicts |
| `20261024004111_fix_prod_003_catalog_text_encoding.sql` | 20261024021946 | fix_prod_003_catalog_text_encoding |

O MCP atribui timestamps de aplicação diferentes dos nomes locais; os quatro registros estão mapeados acima e não devem ser reaplicados. Catálogo e reparo textual exigem GUC de destino na mesma transação e jamais devem ser enviados indiscriminadamente a produção. A primeira migration é a proposta FIX-PROD-002 de SHA256 `522d71c44bd4e7cd37cf06271814897d2f115b1e747e768a1b6b563ddb2b939d`, preservada; correção posterior é incremental.

Depois dos testes: mesmos quatro usuários Auth e cinco histórias; quatro Viajantes novos de testes e duas Guildas criadas pelos RPCs normais. Nenhuma conta Auth foi criada ou apagada nesta tarefa; nenhum jogador real foi usado para gerar fixtures. RLS público permanece sem tabelas desprotegidas.

## Testes e recibos

- Unitários: 704 PASS / zero FAIL na suíte local final de código; opt-in não executados nessa suíte não foram contados como PASS. O CI final também aprovou testes, protocolo, lint, TypeScript e build. Recuperação PostgreSQL: **6 PASS**, execução separada. Os 37 testes PG anteriores do FIX-PROD-002 são histórico, não nova execução desta tarefa.
- Protocolo de publicação: 25 PASS. Lint, TypeScript e build PASS. Nenhuma dependência atualizada; instalação pelo lockfile.
- Auth: quatro contas preexistentes com senha, getUser, issuer/subject verificados; nenhuma claim SQL simulada substituiu os JWTs hospedados.
- Equipamentos/economia/RLS: **23 PASS** hospedados, incluindo concorrência, item não possuído, troca de UID, slot adulterado, CAS, replay, inventário/saldo preservados, DML/XP/crédito genérico/autoridade service negados ao navegador.
- Arena na Preview final: **29 PASS**; entrada com sete IDs distintos, deck duplicado/adulterado negado, nível/Foco validado, uma utilização por carta, conflito de comando, concorrência com somente um commit, resultado e reconexão.
- Navegador: **14 PASS** em Chromium1440 e WebKit390 na Preview inicial e repetidos na final. Login real, equipamentos/atributos/reload, aquisição explícita inicial, posse em sessão nova, sem erros de página ou overflow. Emulação WebKit não é aparelho físico. Nenhuma resposta de Auth/API/banco foi mockada; interceptação limitada ao cabeçalho de acesso à Preview, restrito à origem Vercel.
- Guilda/EBD: **13 PASS** com identidades reais, sem privilégios globais. Verificações finais de recibos: **6 PASS**, processo confirmado exit0; solicitações concorrentes contra batalhas já encerradas retornam 409, preservam saldo e cartas.

Estado final do banco: **17 batalhas, todas encerradas; duas vitórias de Arena, uma vitória de Torre e 14 derrotas; zero recibos duplicados; zero derrotas com crédito**. Conta de combate: nível1, **16 XP / 6 moedas**, exatamente a soma dos recibos. As vitórias não foram obtidas alterando seed, adversário, atributos ou resultado. Tentativas limitadas usaram ataques e Golpe Medido autorizados; não houve créditos manuais, edição de progresso ou reset de derrota.

| Evidência positiva | Batalha | Recibo | Resultado |
| --- | --- | --- | --- |
| Arena, primeira vitória | 193ddd7c-29f1-402b-85d6-24dd13fa6a56 | 35181f31-7ec6-4962-b192-90b55f832ee5 | 8 XP / 3 moedas |
| Arena, Preview final | 7a3f326b-c89d-4794-aa4e-443e311c063f | 6d6e58ec-4ae2-45a6-a516-082cf4047325 | 8 XP / 3 moedas |
| Torre, andar 1 | 296b5cf9-9255-4933-a4ec-81fecdf52d88 | fafaa8f6-29af-4ce6-bec3-374d37a0c0c9 | Vitória, libera andar2; prêmio blocked, 0/0 |
| Torre, derrota no andar2, Preview final | dc2a20c1-8f04-4b27-af56-ec50070ed157 | fd12d8e4-3514-4c31-b866-6af2feeb1881 | Derrota, mantém andar2; 0/0 |

QA e Security foram realizados pelo próprio autor, sem alegação de revisão independente. Advisors de segurança mantêm o mesmo baseline: 14 INFO de RLS sem policy em tabelas fechadas/privadas, 20 WARN de funções definer executáveis por authenticated e um WARN de proteção contra senhas vazadas. Não foram removidos controles para silenciar avisos. Referências de remediação: [RLS sem policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [funções definer](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Teste Chat A e preparação administrativa

Conta no cadastro: `78729453-8e04-478c-96ae-d37cead1bc8c`. Alvo ativo: `31b70059-deca-44c8-a6df-f21ea68b6e42`, nível50, 245016XP, membro. Homônimo antigo: `9b83ca7f-0154-4492-9ad3-1deedb7411f4`, nível1, líder. Mesma Guilda `c9041d27-28ee-41fa-9ae4-59043ee15143`. São dados cadastrais, não comprovação de UID autenticado. Alvo produtivo permanece economic_verified_at NULL.

Preparação preservada do FIX-PROD-002-HOMOLOGATION: validar getUser da sessão realmente autenticada e associação ativa; confirmar dono/ator administrativo autorizado e escopo dessa Guilda; registrar antes/depois dos dois IDs e decisão sobre liderança; preparar operação transacional auditável com recuperação e condições de concorrência; ensaiar o procedimento oficial antes de executar. O trigger existente não registra sozinho mudança apenas de role. Não há evidência de RPC oficial de transferência de liderança já homologado; não foi improvisado UPDATE produtivo nem apresentada auditoria inexistente. Não transferir XP/inventário entre avatares. Não conceder service_role à conta. Funções de líder/EBD do alvo seguem não executadas.

## GitHub, Vercel e produção

Worktree isolado `C:/Users/carlo/rpg-worktrees/fix-prod-003`, branch `codex/fix-prod-003`, base `aefb4f0`; root e worktrees anteriores preservados.

- [573a6d0 — aquisição explícita e homologação isolada](https://github.com/CarlosJr30/rpgjovemcristao/commit/573a6d0ded02f1b848f7e8dea8a6519c65ee057c), CI40045037108 success.
- [4453af3 — conflitos sem repetição](https://github.com/CarlosJr30/rpgjovemcristao/commit/4453af3710291aef43eb18bf6a4d42cd88efc0e7), CI40046162222 success.
- [f9f7c36 — reparo textual e candidato final](https://github.com/CarlosJr30/rpgjovemcristao/commit/f9f7c36b440010a310e3254d5316e8d1cdaed796), [CI40053526036 success](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40053526036), SHA exato.

Preview inicial `dpl_AEDM2HUft7VKkmdrohaBpr3DkZkr`/573a6d0 READY foi usada nos primeiros testes. Preview final **`dpl_C4FfjuYW47CKguqTPTkmWzLDJe9v` / READY / f9f7c36**, [abrir Preview](https://rpgjovemcristao-iqdt2cq9o-carlos-junior-s-projects.vercel.app). As duas configurações públicas e a chave somente de servidor estão restritas ao ambiente Preview da branch de testes; nenhuma variável de produção foi modificada. O segredo não foi exibido, enviado ao cliente ou versionado. MCP Vercel retornava 403; foi usada a CLI já autenticada, sem remover Deployment Protection.

Produção reconferida: [rpgjovemcristao-web-inky.vercel.app](https://rpgjovemcristao-web-inky.vercel.app), **READY**, deployment `dpl_H9aXo2mnhWvk2PD6BwQowpxeaiVv`, main/SHA `5edc93f5857b26a59b183e8abfb963110831f90c`. Smoke sem sessão: cinco rotas HTTP200, GET authority405, POST sem Auth401; isso não é teste autenticado de jogo em produção.

Supabase produtivo **`wspafhlbtlpabypzymjo`** preservado: protocolo3, quatro migrations, última20261023213654, 20 Viajantes, 37 linhas de inventário, 31 equipamentos, catálogo vazio, RPC de equipamentos ainda ausente e zero tabelas públicas sem RLS. Alvo mantém nível50/245016XP e reconciliação pendente. Nenhuma migration desta tarefa foi aplicada nesse projeto.

## Arquivos e evidências

Alterações publicadas: dois arquivos de `apps/web/features/arena-deck/authoritative-arena*`; `apps/web/lib/authority/server.ts` e teste; `packages/database/deployments/fixprod003/{README.md,catalog.test.ts,recovery.postgres.test.ts,test-catalog.json}`; quatro migrations listadas acima; contrato FIX-PROD-003. Arquivos gerados de Next foram restaurados; artefatos CLI não foram incluídos nos commits.

Evidências locais ignoradas: `C:/Users/carlo/rpg-worktrees/fix-prod-003/build/fix-prod-003/`, incluindo `real-auth.json`, `unit-conflicts.json`, `local-gates-conflicts.json`, `recovery-text-approved.json`, `hosted-equipment.json`, `guild-rls.json`, `hosted-battles-positive.json`, `hosted-victories*.json`, `hosted-arena.json`, `browser-first.json`, `browser.json`, `final-receipt-checks.json`, `final-receipt-process.json`, `catalog-remote-final.json`, `ci-final.json`, `preview.json`, `production-final.json`, `production-http.json` e screenshots. Credenciais próprias existentes continuam protegidas fora do Git; relatórios não contêm senha, access token ou chave privada.

## Condições de desbloqueio

1. Concluir progressão legítima e comprovar andares2–7/campeão com uma identidade elegível e dados reconciliados; não copiar valores do nível50 nem fabricar XP/itens para isso.
2. Homologar valores/fontes/limites e recibos das recompensas da Torre pelo contrato econômico aplicável antes de qualquer payout; executar os positivos e negativos correspondentes.
3. Executar efeitos das quatro cartas com nível superior, revogação e demais positivos econômicos obrigatórios ainda sem evidência hospedada.
4. Resolver aparência/overlays autorizados e cenário de troca real de equipamentos; validar o corpo do alvo sem ativar arte arquivada indevidamente.
5. Confirmar UID real da sessão Teste Chat A e concluir procedimento administrativo auditável de liderança/Guilda/EBD; reconciliar legado por evidência de origem, sem marcar saldo antigo como verificado automaticamente.
6. Somente depois, rever backup produtivo, migrations pendentes compatíveis, CI do candidato, Preview e todos os gates; publicar automaticamente se aprovados. Não há DEPLOY_COMPLETE nesta entrega.
