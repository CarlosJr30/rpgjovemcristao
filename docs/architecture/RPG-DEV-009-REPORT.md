# RPG-DEV-009 — Progressão persistente e desbloqueio

## Revisão editorial preparada — 28/10/2026

[Proposta completa de A Criação](../biblical/RPG-DEV-009-CREATION-EDITORIAL-PROPOSAL.md) organizada em decisões D1–D7, **todas PENDENTES**. Inclui textos completos das quatro cenas existentes, referências NVI, objetivo, leituras, sete respostas do mosaico, quatro associações de exploração propostas, seis perguntas com alternativas/gabaritos e justificativas, duas reflexões, oração opcional, dossiê de vídeo obrigatório, critérios cumulativos de conclusão e elegibilidade da história seguinte. “Definido no candidato” não significa aprovado; as três perguntas adicionais e o desafio contextual não estão implementados. Nenhum vídeo foi selecionado.

Trabalho técnico independente desta retomada: reconferida PR18 aberta/draft/não integrada em `c4c4d60b4e368b87177de51fa4fbbc4a4444cd36`; CI [push40664203865](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40664203865) e [PR40664211556](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40664211556) **success no SHA exato**. Preparada a matriz abaixo para os futuros emissores, sem escolher gabaritos/requisitos no código ou executar positivos artificiais. Não há mudança runtime, SQL, testes ou evidência009 aprovada nesta revisão documental; nenhum acesso/mutação de banco, merge ou deploy executado.

| Fronteira técnica independente do tema | Já comprovado no consumidor fechado | Gate futuro do emissor — não executado |
| --- | --- | --- |
|Identidade e isolamento|Auth não anônimo/dono/avatar ativo; alheio e anon negados|Desafio e envio vinculados à sessão, avatar e revisão; não confiar em user_metadata|
|Revisão e política|Evidência de revisão/política incompatível negada no PG isolado|Fixar contrato/gabarito no servidor; rejeitar desafio após alteração da revisão|
|Integridade da prova|Cliente não emite atestações privadas; kind de participação não substitui quiz|Validar conteúdo/evento real antes de emitir recibo; flags/score/ended livres não bastam|
|Nonce, validade e replay|Comando de conclusão exige UUID; idempotência/concorrência isoladas|Expiração e consumo atômico de desafio; replay de submissão/evento e assinatura do provedor quando aplicável|
|Privacidade|Consumidor não exige texto de reflexão|Participação sem texto pessoal; logs redigidos, sem payload devocional ou credenciais|
|Publicação e economia|Consumidor TEST fechado, sem concessões; dados preservados no fechamento anterior|Positivo normal hospedado após contrato aprovado; comparação de dados, recuperação e gates completos antes de qualquer proposta PROD|

Esta matriz é preparação de aceite técnico, **não implementação ou prova hospedada dos emissores**. Mantêm-se os32PG isolados,23API e244regressões anteriores, com suas falhas e limitações. Não repetidos testes funcionais para apenas editar Markdown; revisão estrutural/textual pelo autor conforme WORKFLOW. Não há aprovação editorial humana ou liberação de progressão/recompensas. A publicação permanece BLOCKED nos mesmos gates.

## Fechamento da etapa independente — 28/10/2026

**009A implementada e validada fechada em TEST. RPG-DEV-009 permanece BLOCKED para progressão oficial/publicação PROD.** Nenhuma aprovação editorial, conclusão ou recompensa foi fabricada. A proposta editorial está entregue separadamente, sem itens aprovados: [A Criação — proposta para revisão](../biblical/RPG-DEV-009-CREATION-EDITORIAL-PROPOSAL.md).

- [PR18](https://github.com/CarlosJr30/rpgjovemcristao/pull/18) aberta/draft, branch `codex/rpg-dev-009-progression`, candidato `f39a05dcd7431ddf785cab654ea3b51598a3c316`. CI [push40659891641](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40659891641) e [PR40659934208](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40659934208) **success no SHA exato**, qualidade, PG e RSC aprovados. Job automático de publicação por SHA foi SKIP pela condição de branch; não é declarado PASS.
- [Preview TEST](https://rpgjovemcristao-7r1bc745c-carlos-junior-s-projects.vercel.app), `dpl_5eE8NeY2RvvhWr5Cqjt1t2Sc9cme`, **READY / Preview / f39a05d**, backend TEST confirmado. Somente duas configurações públicas TEST acrescentadas à nova branch; proteção Vercel mantida. Conector Vercel recusou o escopo403; utilizada CLI já autenticada na mesma equipe/projeto, sem ampliar Trusted Sources ou alterar aliases.
- Migration única aplicada **somente TEST**, versão `20261028085900_rpg_dev_009a_progress_authority_test`, arquivo local `20261028012313`. TEST passou27→28 migrations e40→43 tabelas: as três novas são privadas, com cinco políticas fechadas, zero evidências e zero conclusões. PROD mantém8 migrations/38 tabelas, sem os endpoints009.
- Produção permanece008C, `c14fd5e560f6e4930e18a1e493a901dea2ba0ed0`, `dpl_8Pi4mXQUCaMcirqq5kLpXZdH9sRk`, **READY/production**, alias [oficial](https://rpgjovemcristao-web-inky.vercel.app) confirmado. autoAssignCustomDomains=true/SSO originais preservados. PR12 continua aberta/draft/não integrada em `61b7177`; nenhum merge009 ou deploy produtivo executado.

| Gate independente | Resultado real |
| --- | --- |
|Unitários / qualidade / protocolo|858 PASS /74 SKIP; lint/types/build e protocolo25 PASS, local e CI candidato.127 arquivos aprovados/7 opt-in omitidos.|
|PostgreSQL isolado|32 PASS; fixtures positivas de persistência, concorrência, idempotência/reconexão, sequência e recuperação. Não são prova hospedada ou aceite editorial.|
|Autoridade hospedada TEST|23 checks PASS pela sessão normal autorizada: dono/anon/alheio, cinco entradas fechadas, flags/score rejeitados, comando sem requisitos negado, replay/concorrência de comandos negados sem dados novos.|
|Regressões hospedadas|244 checks PASS agregados de partes identificadas; consultas, Jornada, Guilda/EBD conforme vínculo real,36 de Missões e43 do minigame. Chromium/WebKit, quatro contextos da mesma sessão em memória. Toque Chromium CDP e viewport WebKit390px são emulados, não aparelho físico.|
|Compatibilidade e segurança|95 funções/ACLs preexistentes TEST e39 policies idênticas;39 tabelas não relacionadas idênticas. Somente três colunas/constraint/trigger da projeção, três tabelas, cinco funções e USAGE mínimo de schema previstos. Sete comparações estruturais PASS.|
|Preservação final|40 conjuntos originais TEST e38 PROD com contagens/hashes iguais antes/depois e ao008C. Incluem todos os avatares, inventário, atributos, XP, moedas, equipamento, cartas, progresso e Guilda/EBD.92 funções/ACLs e39 policies PROD idênticas.|
|Conclusão positiva hospedada e desbloqueio oficial|**BLOCKED**: requisitos/editorial/vídeo e emissores reais ausentes. Não habilitados para fabricar prova.|

Evidência sanitizada: [RPG-DEV-009-TEST-EVIDENCE.json](RPG-DEV-009-TEST-EVIDENCE.json). Logs/falhas/capturas/snapshots privados em `build/rpg-dev-009`. Hash do snapshot e recuperação isolada registrados; compensação remota não foi necessária. O ensaio isolado testa recusa de recuperação quando há evidências/conclusões: não apagar progresso para voltar uma versão. Nenhum reset/histórico de migration removido.

### Proveniência e falhas preservadas

Os244 checks de regressão combinam Chromium aprovado na segunda rodada, consultas/Missões WebKit e toque Chromium em seguimento com espera das requisições antes de navegar/recarregar, e15 checks WebKit de engine isolada pelos controles normais. Não são244 novos casos exclusivos em relação à008C. As rodadas anteriores não foram integralmente PASS. Uma navegação para Terra Prometida ultrapassou5s; inspeção posterior encontrou a página correta. Duas rodadas WebKit registraram erros de fetch durante transições/recarga. A sincronização do coletor foi corrigida, sem modificar Auth/RLS/runtime, filtrar erros, relaxar assertions ou limites.

A rodada WebKit com consultas completas falhou na medição temporal de colisão; permanece FAIL no artefato. A execução isolada subsequente passou os mesmos15 checks sem alteração de engine/dificuldade/limites: posição inicial x90, parede x42.389 e posição parada x42.389, fora de obstáculo. Não se declara corrigida uma causa física não demonstrada; a evidência positiva é a execução isolada identificada. Os quatro contextos reutilizam a sessão normal, não quatro logins independentes.

Nos três contextos com monitor de requests,73 tentativas próprias de `profiles` ignore-duplicates e4 RPCs revisadas de leitura, sem requisição REST de mutação inesperada. O contexto isolado da engine registra erros/controles, sem esse monitor de requests; a preservação global de dados foi conferida separadamente depois de todos os contextos. Não declarar ausência absoluta de POST. Auth/refresh podem atualizar metadados normais de sessão, fora dos dados de jogo.

As negações por requisitos indisponíveis usam SQLSTATE55000, mapeado a HTTP500 pelo [PostgREST](https://docs.postgrest.org/en/stable/references/errors.html#http-status-codes). A primeira expectativa do coletor era HTTP400 e falhou; corrigida para HTTP500 **com código e mensagem exatos**, sem transformar resposta negativa em sucesso de conclusão. API nova não está integrada às demonstrações.

Advisors: deny-all RLS TEST16→19 INFO pelas três tabelas privadas intencionalmente fechadas; PROD14 INFO permanece.12 funções públicas definer WARN e proteção de senhas vazadas WARN legadas permanecem; não foram alteradas para forçar gates. Referências: [RLS deny-all](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [definer](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). QA/Security/editorial pelo autor, sem revisão independente alegada.

### Bloqueios e próximo passo mínimo

Faltam **aceite editorial humano versionado**, definição do vídeo obrigatório/licenças/acessibilidade e **emissores/verificadores reais** das atividades/quiz/vídeo e participação declarada. Depois desses contratos, implementar e homologar o fluxo positivo normal em TEST, incluindo conclusão, reload/reconexão e sequência sem economia. Fixtures locais e negações reais não substituem essa prova. Disponibilidade sequencial não equivale a aprovação da história seguinte. Legado existente exige contrato de reconciliação próprio.

Manter009A fechada em TEST e a PR18 em draft; não aplicar esta migration TEST-only em PROD.009B/C e publicação de progresso oficial continuam bloqueadas. Demonstrações008B/C, consultas008A/007, Auth/RLS/Guilda/EBD e PR12 preservados; Arena/Torre/Loja/economia não liberadas.52 caminhos do manifesto original sem divergência, sete worktrees preservados, sem novo recurso pago/dependência de produto/arte ou concessão de dados. Registro de fechamento é documental, sem deploy adicional artificial.

## 28/10/2026 — autoridade preparada; conclusões oficiais BLOCKED

O usuário confirmou ausência de homologação posterior de A Criação. Autorizou concluir a implementação e os testes independentes em TEST e preparar uma proposta separada, sem promover conteúdo, criar progresso ou conceder recompensas. Produção008C permanece a referência, sem migration/deploy009 ou merge da PR12.

Migration candidata `20261028012313_rpg_dev_009a_progress_authority_test.sql` rejeita o scope produtivo antes de executar DDL. Reutiliza `story_progress`, preservando o protocolo legado1, e acrescenta protocolo2 sem recibo econômico. Atestações privadas, revisão/política fixada, dono não anônimo/avatar ativo, bloqueio por viajante, transação, idempotência e ordem sequencial protegem a conclusão. Conteúdo predecessor retirado de homologação bloqueia a sequência. Legado existente exige reconciliação explícita; não é convertido.

As cinco políticas começam **fechadas**. Esta implementação consome atestações protegidas; **não implementa seus emissores**. `evidence_issuers_available=false`; não aceita flags, score, vitória ou texto devocional como prova. Leitura/reflexão são participação declarada, não prova de fé ou leitura humana. Vídeo continua requisito pendente. Nenhum fluxo positivo hospedado será fabricado com aprovação/evidência administrativa.

API pública INVOKER e funções privadas com search_path vazio. USAGE mínimo de `story_private` para authenticated é necessário ao wrapper; ACLs das tabelas privadas e funções legadas continuam negadas. Novas tabelas RLS deny-all, sem DML/SELECT para authenticated/anon/service_role. O service_role já pode inserir recibos **legados**; isso não permite emitir as novas atestações. Não se modifica essa capacidade preexistente ou autoridades econômicas.

**32 checks PostgreSQL isolados PASS**, incluindo os31 anteriores e revogação de requisito predecessor, concorrência de duas conexões, replay/reconexão, isolamento, dados legados e recuperação. Positivos usam somente fixtures sintéticas locais, não aprovação editorial ou prova hospedada. A primeira execução falhou por concatenação SQL na fixture; corrigida a fixture sem relaxar assertions. Lint, TypeScript, build e protocolo25 PASS. Novo job CI Windows executa a mesma suíte PG com binário fixado17.10 em build ignorado, sem dependência/lockfile de produto.

Recuperação em `packages/database/proposals/rpg-dev-009a-recovery.sql`: TEST somente, recusa remover evidências/conclusões/políticas aprovadas; em estado vazio restaura constraint, colunas e ACL anteriores. Roundtrip isolado aprovado. Snapshot privado de definições/ACLs/RLS/policies/defaults e contagens/hashes capturado antes de qualquer DDL:40TEST/38PROD idênticos ao fechamento008C. Compatibilidade com aplicação atual preserva seis campos explícitos de leitura; não há integração cliente de conclusão nesta etapa.

Sessão TEST normal confirmada em memória: conta autorizada, único avatar ativo nível1, sem credenciais exportadas. CI exato, migration TEST e validação hospedada ainda **PENDING** neste checkpoint. Nenhuma conclusão/recibo novo real existente. Produção não é destino desta migration.

Proposta independente para revisão: [A Criação — proposta editorial](../biblical/RPG-DEV-009-CREATION-EDITORIAL-PROPOSAL.md). Todos os itens de aceite estão desmarcados; perguntas adicionais são candidatas, não publicadas. Faltam aceite humano versionado, vídeo/licenças/acessibilidade e emissores/verificadores reais, seguidos do fluxo positivo hospedado. Essas pendências bloqueiam009B/C e qualquer publicação de progressão oficial.

## Histórico inicial

27/10/2026 — **ACTIVE / auditoria e implementação independente**. Branch codex/rpg-dev-009-progression criada da main c14fd5e; fechamento documental008C439567c incorporado, runtime idêntico à produção informada. Nenhuma publicação ou migration009 neste checkpoint. Worktrees/arquivos/assets e PR12 preservados.

## Fontes e contratos encontrados

- `travelers.journey_progress`: snapshot legado; não prova conclusão de story_definitions, vídeo ou recompensa. Manter sem conversão/mutação indevida.
- `public.story_progress`: projeção canônica de story_private.step_receipts. Leitura própria sob RLS, com finalização atual presa a vídeo/reward_receipt e a sete etapas fixas.
- `story_private.step_receipts` e `public.complete_story`: recibos/serialização por viajante/idempotência já desenvolvidos; função e constraints precisam ser auditadas contra definição remota. Autoridade de ingestão de evidências não é fornecida pelo workbook cliente.
- Workbook/Missões/Serpente publicados: demonstrações. Flags de visita/leitura/reflexão/vitória e score enviados do navegador não são evidência suficiente para conclusão oficial.

## Gates de conteúdo

Catálogo preserva nove mundos, cinco histórias de As Origens, sem inventar fases. Primeiro item Criação ainda candidato; parecer CONSOLIDATION-005 exige aceite editorial humano e vídeos/autorização/alternativas pendentes. Nenhum documento posterior presumido; solicitada sua referência enquanto continuam trabalhos técnicos. Requisito econômico deverá ser separado da finalização sem emitir receipt/XP/moeda fictício; vídeo ou outros requisitos não são descartados para forçar liberação.

## Estado por escopo

| Entrega | Estado neste checkpoint |
| --- | --- |
|009A — autoridade/persistência|Auditar contrato remoto e preparar validação segura sem economia; testes pendentes|
|009B — desbloqueio|Depende de009A e conteúdo aprovado, sem conclusão artificial da primeira história|
|009C — missões|minigame/autorrelatos seguem demonstrativos até haver verificador servidor; distinguir participação de prova|

Unitários/PG/API/Preview/produção009 ainda não executados; não são PASS/N/A. Próximos checkpoints registrarão arquitetura, testes reais/sintéticos, migrações/recuperação, commits/CI/PRs/URLs e bloqueios exatos. Produção008C deve permanecer funcionando durante qualquer bloqueio009.
