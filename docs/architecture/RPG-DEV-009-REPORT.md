# RPG-DEV-009 — Progressão persistente e desbloqueio

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
