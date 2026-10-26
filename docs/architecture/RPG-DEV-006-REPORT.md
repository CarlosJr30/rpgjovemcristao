# RPG-DEV-006 — Recuperação de Herói e Equipamentos

Data: 26/10/2026. **BLOCKED para merge/publicação produtiva. Implementação recuperada e validada em Preview TEST.** Branch isolada `codex/rpg-dev-006`, [PR12 em rascunho](https://github.com/CarlosJr30/rpgjovemcristao/pull/12), base de produção `1a82d2c058b40b37ae4ae79b82c085bb3488c02b`. A troca entre variantes oficiais continua BLOCKED por orientação expressa do usuário; não existe segunda variante homologada. Nenhuma liberação de Arena, Torre, Loja, História, compras, baús ou recompensas faz parte desta tarefa.

## Estado inicial confirmado

Main/GitHub e URL oficial https://rpgjovemcristao-web-inky.vercel.app continuam em `1a82d2c`, deployment `dpl_CJFBMXjTKfm7nRt76FL8BLJLM87M`, production/READY. Encerramento UI-RESTORE-002 preservado em branch documental `codex/ui-restore-002-release-report`, commit `d98ef98`; PR11 já integrada. Esta tarefa exige nova PR, sem reabrir ou sobrescrever a anterior.

Supabase PROD `wspafhlbtlpabypzymjo` e TEST `wkdvdzfkbwvhyjmamrsg` ACTIVE_HEALTHY. No início, PROD tinha seis migrations e TEST24. O RPC `set_owned_equipment` existia somente em TEST, com SQLSTATE PT409 e EXECUTE revogado pelo lançamento parcial. Seu corpo foi comparado com o candidato restaurado e coincide, sem alterar regras de propriedade, catálogo ou bloqueio por combate. RLS/ACLs e avisos de segurança foram inspecionados. As 13 colunas exigidas pelo RPC coincidem entre ambientes; não há triggers de usuário em inventory/equipped_items. A migration nova foi aplicada somente em TEST, conforme detalhado abaixo.

Lidos RPG-DEV-001–004, UI-RESTORE-002 e política de release. O código existente é a fonte da recuperação; nenhuma reimplementação de inventário, compositor, atributos, autoridade ou sincronização. Baselines privados por contagem/hash de 36 conjuntos em cada ambiente capturados antes de qualquer mudança de banco desta tarefa.

## Recuperação no candidato

- Menu original passa a liberar somente Equipamentos além de Herói/Guilda/EBD, mantendo onze opções e sete módulos Em desenvolvimento. `GAMEPLAY_ENABLED=false`; autoridade econômica geral continua negada.
- Herói conserva o mesmo `AvatarRuntime`, HD, layout, atributos, slots e composições aprovadas. Acrescentado acesso ao gerenciador existente. A investigação confirmou que o compositor já estava conectado: não foi substituído nem redesenhado.
- Rota de Equipamentos reutiliza integralmente `EquipmentScreen`, dentro do shell original e acesso autenticado. A variante publicada sempre usa `changeOnlineEquipment`, inclusive se a sessão desaparecer; não recorre a equipar/desequipar localmente.
- Confirmação RPC e leitura fresca continuam precedendo atualização de avatar/atributos. Inventário é somente lido; o RPC muda apenas a seleção de item já pertencente ao ator. O cliente reconhece conflitos PT409 e preserva os controles anteriores de sessão/revisão.
- Migration nova, gerada pela CLI: `20261026122539_rpg_dev_006_owned_equipment.sql`. Reutiliza somente as duas funções de equipamento FIX-PROD-003, com PT409; abre EXECUTE somente para authenticated, sem liberar escrita direta, catálogo de teste, Arena ou outras migrations pendentes. O nome do perfil passa a `hero-equipment-006`. Exige baseline Guilda/EBD e protocolo3; não altera dados.

## Testes e resultados

| Gate | Resultado |
| --- | --- |
| Unitários direcionados | 43 PASS. |
| Unitários integrais | Rodada final local: **806 PASS /86 SKIP**. Preserva a referência de787 testes; não houve exclusão de casos. Os12 PG novos são opt-in e foram executados separadamente. Os demais testes PG históricos não foram reexecutados nesta tarefa nem convertidos de SKIP em PASS. |
| PostgreSQL isolado | **29 casos distintos PASS**: nove de equipamento anteriores, oito Guilda/EBD e12 novos. O banco descartável sem rede cobre RPC ausente/preparado, propriedade, CAS/PT409, concorrência, rollback, recuperação das funções/ACLs e troca sintética. |
| Lint | PASS na revisão final, incluindo o novo validador API. |
| TypeScript | PASS após remover opção Testing Library incompatível com os tipos. A falha inicial está preservada. |
| Build | PASS, incluindo nove PNGs/dez composições e isolamento de áudio. |
| Protocolo CI | 25 PASS. |
| Navegador local real da aplicação | 24/24 fluxos RSC sem erros, 134 checks UI em desktop/WebKit390/320/paisagem e48 checks Guilda/líder PASS. |
| Composições em navegador isolado | Quatro testes PASS, desktop/WebKit móvel, equipar/desequipar, variante explicitamente sintética, atributos e reload; nove PNGs/dez composições preservados. Não comprova troca real hospedada. |
| CI do runtime816918e | [Push40325785800](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40325785800) e [PR40325988694](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40325988694) success na primeira tentativa; incluem reprodução nativa,63 cenários corrigidos e aplicação/UI. A atualização posterior de testes/documentação está nos Checks daPR12, sem novo runtime. |
| API real TEST | **39/39 PASS**, três contas existentes com botas: equipar/desequipar, resposta perdida/idempotência, concorrência,409, ator alheio, slot errado, variante inexistente e escrita direta negada. Seleções/inventário/atributos/XP/saldos restaurados e conferidos. |
| Navegador real Preview | Duas matrizes consecutivas de **199/199 PASS**, três perfis em Chromium desktop/WebKit móvel: Auth, Herói,11 opções,7 inertes, Equipamentos/RPC/atributos/reload, Guilda/gestão/EBD, negativas econômicas e logout. Zero erros de página, DOM ou console. |
| Composições reais hospedadas TEST | **162/162 PASS**, três corpos aprovados × desktop/WebKit: seis slots por corpo, autoridade RPC, atributos, camadas compatíveis, remoção e reload. Fixture temporária de seis itens existentes no catálogo, exclusivamente TEST; não prova aquisição nem variante oficial nova. |
| Assets hospedados | **16/16 hashes PASS**: nove PNGs, três corpos e quatro artes da Guilda. |
| Produção | Somente leituras, READY/main/alias1a82d2c;36/36 conjuntos iguais ao baseline. Nenhuma migration, transferência, seleção de equipamento, mudança de avatar, merge ou deploy produtivo006. |

Os números de matrizes contam asserções, não casos unitários. QA/Security/React/DevOps pelo próprio autor, sem revisão independente. WebKit móvel é emulação; nenhum teste físico é declarado PASS.

## Falhas preservadas e correções dos ensaios

O build inicial falhou porque Turbopack não aceita dependências ligadas a outra worktree fora da raiz. Resolvido com instalação local reproduzível do mesmo lockfile, sem atualização de dependências. Limpeza pelo próprio npm removeu somente o cache criado nesta tarefa após falta de espaço; arquivos, artes e trabalhos anteriores foram preservados.

A primeira matriz UI teve timeout de cinco segundos antes de confirmar a chegada à EBD em320px, sem erro de página ou console. Adicionado `waitForURL` do destino antes da assertion de conteúdo, sem desativar prefetch, aumentar timeout das assertions ou filtrar erros. A matriz integral seguinte passou; falha inicial preservada em `local-rsc-ui.log`. Não se apresenta uma barreira de navegação do teste como correção de transporte do produto.

A primeira matriz hospedada de equipamento teve5/6 fluxos aprovados; WebKit/líder expirou ao clicar no menu durante a navegação anterior. Home e Herói já contêm o mesmo nome do Viajante; o seletor de título não demonstrava o commit da rota. O helper agora exige a URL observada no link antes da próxima ação. É uma correção de sincronização do ensaio, sem mudança do produto/prefetch/CORS. A matriz seguinte e a rodada após a limpeza passaram199/199, sem erros suprimidos.

No ensaio adicional de composições, duas expectativas do autor estavam incorretas: sabedoria atribuída ao elmo e uma camada por item para botas. Corrigidas lendo os bônus do catálogo existente e exigindo o par de camadas aprovado. Uma preparação inicial também excedeu a espera de cinco segundos; a captura já mostrava o título carregado. O bootstrap passou a aguardar explicitamente o mesmo título dentro do limite de ação do ensaio. Nenhuma arte/composição/atributo de produto foi alterado para obterPASS. A rodada final passou162/162; resultados FAIL anteriores estão em arquivos distintos.

## Troca entre espadas — isolamento e limite

O usuário confirmou que **não possui segunda variante oficial homologada** e autorizou uma segunda espada sintética somente no ambiente isolado. Reutilizada `offline-sword-alternate`, já existente no laboratório loopback, sem recriar o catálogo. Os quatro testes de navegador verificam troca da espada original para a sintética, força+2 versus+4, inventário idêntico, reload e remoção sem bônus acumulado.

O novo teste PostgreSQL acrescenta essa correspondência somente à função dentro do banco descartável sem rede; não grava a variante em nenhuma migration, catálogo publicado ou Supabase. Duas requisições concorrentes com o mesmo estado esperado resultam em uma confirmação e um conflito; quantidades permanecem2:2, um slot único, replay idempotente e recuperação do baseline. **Isso não homologa uma variante real. Troca hospedada oficial: BLOCKED** até existir segunda variante oficial.

## Teste Chat A em produção — somente leitura

Após a orientação específica do usuário, a consulta filtrou exclusivamente o avatar ativo de nível50, não o antigo de nível1:

- UID: `78729453-8e04-478c-96ae-d37cead1bc8c`.
- Avatar: `31b70059-deca-44c8-a6df-f21ea68b6e42`, Teste Chat A, ativo, nível50.
- XP245016; moedas1006265; `economic_verified_at=NULL`.
- Inventário: couraça1, botas1, elmo4, escudo1, espada1 e medalhão6; seis slots selecionados. Nenhum item transferido ou concedido.
- Conta Auth não anônima, cinco sessões existentes no momento da leitura. A consulta MCP executou como `postgres`, com `auth.uid()=NULL`: **não é prova de sessão de cliente autenticada ou de RLS desse cliente**.

O conector de navegador falhou antes de listar abas (`failed to write kernel assets`, erro de caminho), inclusive após reset. Não foi possível obter `getUser()` de uma sessão de Teste Chat A; esse gate está **BLOCKED por acesso indisponível**, sem usar senhas/tokens em texto ou contornar Auth. Não foram feitas alterações de equipamento/aparência/progresso em PROD. As contas dedicadas produtivas anteriores, sem itens, foram apenas inspecionadas; não substituíram a conta indicada.

## Migrations, dados e segurança

Migration local `20261026122539_rpg_dev_006_owned_equipment.sql`, aplicada **somente em TEST** como `20261026125946/rpg_dev_006_owned_equipment`, após CI. As36 contagens/hashes eram iguais imediatamente antes/depois da migration. TEST agora tem25 migrations; PROD continua com seis e sem o RPC owned instalado. Não aplicar automaticamente as antigas migrations de catálogo/Torre ou todas as pendências para habilitar equipamentos.

TEST libera somente o novo par de funções para authenticated. Anon/service_role continuam sem EXECUTE; escrita direta em inventory/equipped_items e autoridade Arena permanecem negadas. RLS não foi alterada. Recuperação das duas formas de baseline foi testada no PostgreSQL isolado; definições/ACLs anteriores e scripts restritos de recuperação estão preservados privadamente. Nenhum rollback de dados foi necessário.

Para a prova visual, seis itens dos IDs já existentes no catálogo foram inseridos temporariamente **somente em um avatar auxiliar vazio, zeroXP/zero moedas, de uma conta dedicada TEST**. Não é o avatar antigo de Teste Chat A. Seleções e três aparências existentes foram exercitadas pelas APIs/RPCs normais, sem novas artes. Ao final: aparência/estado lógico do auxiliar, avatar ativo original e seleção vazia conferidos; removidos somente os seis UUIDs de inventário criados por este ensaio, sob guardas de ator/quantidade/ausência de equipamento. Nenhum item original removido.

Preservação final: PROD36/36 conjuntos idênticos. Em TEST,34/36 hashes íntegros idênticos, inclusive inventory, wallets, stats e AuthIDs; travelers/equipped_items refletem timestamps normais das trocas/seleções. Contagens voltaram ao baseline, aparências/seleções/progresso conferidos nos fluxos. Não alegar hash integral de todo TEST inalterado nem restaurar timestamps por SQL para produzir igualdade artificial.

A Preview inicialmente não tinha URL Supabase para esta branch; o gate detectou a ausência. Tentativas anteriores ao push receberam `branch_not_found`. Depois do push, somente `NEXT_PUBLIC_SUPABASE_URL` e a chave pública foram configuradas em Preview/codex/rpg-dev-006; backend efetivo TEST confirmado por login e hosts reais, sem secret privilegiado público. Proteções Vercel e envPROD preservados.

Advisories mantêm INFO de RLS sem policy/deny-all e WARN de funções definer/autenticação e proteção de senha vazada. O RPC interno definer tem search_path vazio, auth.uid/propriedade/locks e wrapper público invoker; a permissão revisada é intencional, sem bypass de RLS para o cliente. Referências: [definer](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [RLS](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Nenhuma dessas proteções foi relaxada para passar testes.

O delta legado de **16 XP / 6 moedas continua sem proveniência**, sem ajuste manual nem alteração de `economic_verified_at`. Não é necessário reconciliar saldos para selecionar um equipamento já possuído; compras e recompensas permanecem negadas.

## Commit, Preview e produção

Runtime/Preview: `816918e40cf06ae77b9ff442cb46460d1e7e25d5`, deployment `dpl_4eEKvoZbhbHLeovGYeKBRBsz6x7g`, **READY/Preview/TEST/SHA exato**, https://rpgjovemcristao-ki24ajeu7-carlos-junior-s-projects.vercel.app . Deployment Protection mantida; automação usa OIDC apenas para essa origem. Capturas reais: [desktop/celular](../reviews/RPG-DEV-006/README.md). Nove PNGs/dez composições aprovadas e demais corpos fora dessa combinação continuam com os limites visuais existentes, sem arte forçada.

A atualização posterior contém somente testes/evidências/documentação, inclusive o caso sintético solicitado; não muda código da aplicação, packages ou a migration do runtime816918e. O arquivo adicional sob apps é exclusivamente o teste PostgreSQL. [Checks atuais da PR12](https://github.com/CarlosJr30/rpgjovemcristao/pull/12/checks) registram o CI por SHA da atualização. Não confundir o SHA documental/de testes com o SHA servido pela Preview; não criar outro deployment apenas para documentar o mesmo artefato.

Produção preservada: https://rpgjovemcristao-web-inky.vercel.app — `1a82d2c058b40b37ae4ae79b82c085bb3488c02b`, `dpl_CJFBMXjTKfm7nRt76FL8BLJLM87M`, **production/READY**, alias/main conferidos. Sem merge/publicação006, migration PROD, recursos pagos ou gameplay fora do escopo. Guilda/EBD permanecem na versão aprovada.

Arquivos alterados: release-scope, menu/shell, link do Santuário, rota/variante do EquipmentScreen, tratamento PT409, testes unitários/PG/fronteiras/browser, migration restrita, contrato/relatório/memória. Nenhuma arte, catálogo, atributo econômico, lockfile ou implementação Guilda/EBD/Auth foi modificada. Evidências privadas em `build/rpg-dev-006/`.

## Pendências e condição de desbloqueio

1. Segunda variante oficial homologada para validar troca hospedada sem extrapolar o laboratório sintético.
2. Acesso normal à sessão autenticada de Teste Chat A para confirmação UID/avatar pelo cliente, preservando a instrução de somente leitura em PROD. Não pedir token/senha no chat.
3. Quando esses gates estiverem aprovados, revalidar candidato/CI/Preview e seguir RELEASE_POLICY para migration PROD estritamente necessária, merge normal, deployment existente em espera, conferência e promoção segura. Não integrar esta PR enquanto os bloqueios persistirem.

**Aceite: BLOCKED, não DONE nem DEPLOY_COMPLETE006.** Implementação, Preview e testes concluídos não equivalem à homologação da variante oficial ou à autorização de modificar dados produtivos. [Evidências agregadas](RPG-DEV-006-EVIDENCE.json).
