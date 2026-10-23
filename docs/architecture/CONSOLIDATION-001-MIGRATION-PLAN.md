# Consolidação001 — ordem SQL e execução futura

**Preparado; não aplicado remotamente.** Nenhum journal, schema ou proposta anterior foi editado. Teste cumulativo local em `packages/database/tests/consolidation-001.postgres.test.mjs` aplica os arquivos reais, sem reescrever DDL, em PostgreSQL17 descartável, offline, sem portas/mounts/bind ou pull de imagem. Auth/users/JWT/grants são fixtures: isso não certifica configuração Supabase hospedada.

## Ordem e proveniência

1. Reconhecer schema efetivo do alvo de teste autorizado e verificar extensões `pgcrypto` em `extensions`, funções digest/gen_random_bytes, papéis gerenciados, auth.users/is_anonymous, auth.uid/auth.jwt e publication Realtime. Não criar imitações de Auth em Supabase: somente o teste offline cria stubs.
2. Baseline registrado Drizzle: `0000_initial_supabase_gameplay` → `0001_guild_supabase_v1` → `0002_traveler_chests` → `0003_guild_mission_chest_rewards` → `0004_guild_leader_panel` → `0005_guild_lessons_and_schedule` → `0006_traveler_journey_progress` → `0007_guild_chat` → `0008_guild_chat_commit_order`. Se já aplicado, verificar hashes/estrutura e não reaplicar.
3. `20261019054314_guild_link_invites.sql` da0080: arquivo versionado gerado por CLI, **fora do `_journal.json` Drizzle**. Exige baseline Guilda e pgcrypto; proteger aplicação por transação/manifesto aprovado. Nenhuma prova de aplicação remota nesta consolidação.
4. Proposta0081 `task0081-story-progress.sql`: exige Traveler/Auth, independente de Guilda/EBD; publica somente definições/progresso próprio e mantém recibos privados; flags conteúdo/vídeo/recompensa começam false.
5. Proposta0082 `task0082-guild-missions.sql`: exige baseline0000–0008 e QR0080; versiona público/tentativas/decisões e corta mutations antigos de missão. Não paga XP/moedas/baús.
6. Proposta0083 `task0083-guild-ebd.sql`: exige0082; amplia lessons, permissões/atividades/respostas/presença/histórico/pendências, conserva funções públicas invoker e implementações privadas; corta editores antigos.

0081 pode ser instalada independentemente de0082/83; a ordem acima é a sequência cumulativa **efetivamente testada**. 0084–0089 não acrescentam SQL. Os arquivos econômicos0009/0010 pendentes na raiz e alterações não versionadas0080 não foram importados ou tratados como aplicados. Não acrescentar entradas ao journal para fingir aplicação de propostas. Em execução futura, escolher e revisar explicitamente a cadeia de histórico Supabase/Drizzle e gerar migrações registradas segundo as ferramentas aprovadas, mantendo conteúdo/hash do pacote revisado.

O manifesto gerado pelo teste em `build/task-consolidation-001/sql-manifest.json`, dentro deste checkout, contém13 arquivos em ordem, SHA256 e indicação de presença no journal. É registro de teste, não comando de aplicação. Congelar novamente os hashes do SHA que for efetivamente aprovado para remoto.

## Constraints, isolamento e cutover

| Fronteira | Conferência local e exigência no alvo |
| --- | --- |
| Conta/ownership | `create_traveler` e leitura por user_id existentes; UI0080 não aceita conta anônima, mas baseline requer gate de Anonymous Sign-ins/configuração. Não aceitar role enviado pelo cliente como verdade |
| Convite | Token aleatório/hash, schema privado, limites de validade, ownership/líder atual; wrappers públicos invoker, preview anônima limitada ao nome/validade; sem SELECT da tabela de tokens pelo cliente |
| História | Story/progress RLS owner-only, recibos privados, restrições de revisão/etapas, lock e conclusão idempotente sem crédito; dependências falsas negam concluir mesmo sendo líder |
| Missão | Público/versão/request_id/revisão, isolamento de Guilda/participante, rejeição/motivo, anti-autoaprovação e lock; tabelas de attempts/progress não recebem mutations diretas do cliente |
| EBD | Professor por Guilda/aula e permissões; resposta/gabarito/grants privados, presença auditada, pendência única; outro ator/conta anônima/membro sem papel são negados |
| Cutover | Onze assinaturas antigas de mission/lesson verificadas sem EXECUTE para anon/authenticated após0082/83. Novas RPCs preservam ACLs esperadas; não religar API antiga para contornar erro de frontend |
| Economia | Baseline permite UPDATE próprio de XP/wallet, confirmado em transação com rollback. Cutover0082/83 não é hardening global. Antes de expor economia, revisar também inventory/stats/equipped/chests e RPCs de concessão, não apenas UI |

RLS e grants são controles diferentes: ambos devem ser verificados no PostgREST real, com JWT/roles reais e schema privado fora da exposição. `SECURITY DEFINER` exige ownership/identidade/search_path e ACL revistos; não adicionar definer para solucionar “permission denied”. Enumerações e listas de objetos devem vir do schema efetivo. Os testes confirmam a coexistência no baseline versionado, não equivalência com uma instância externa desconhecida.

## Plano de execução, sem execução neste contexto

- Antes do DDL: autorização por projeto/ref, snapshot/backup do alvo de teste, estado dos dois históricos, checksum e lista de objetos/roles/ACL/políticas, nenhuma conta/dado real, fronteiras de produção conferidas.
- Implantar apenas módulos aprovados para o escopo de Preview; Guilda/EBD podem operar com recompensa pendente. Se não instalados, mantê-los indisponíveis com mensagem clara, sem dados de demonstração.
- Tratar cada pacote com transação controlada e registro de sucesso; arquivos0081–0083 já contêm BEGIN/COMMIT. O0080 não contém wrapper próprio: o teste provou rollback antes do commit e reaplicou em transação. Falha interrompe o pacote; não reaplicar CREATE não idempotente sem reconciliar o estado.
- Rever dependências e compatibilidade da API antes de remover acesso antigo. Importação histórica conserva apenas prova real; não inventar nota, aula ou recibo para satisfazer constraint.
- Realizar leitura pós-DDL de RLS/ACL/functions/constraints/índices/rows migradas e testes negativos reais; advisors oficiais somente quando autorizados. Congelar SHA/schema/env e coletar recibo redigido.

## Rollback não destrutivo

Antes do commit, falha de transação desfaz o pacote; o teste de QR confirma esse comportamento. Depois do commit, suspender o acesso ao módulo afetado e preservar todas as linhas/provas/recibos e logs redigidos. Preferir correção futura incremental revisada. Não executar arquivos `.down.sql` de outros módulos, DROP TABLE/coluna ou restauração por cima de dados para voltar o frontend.

Não voltar automaticamente ao frontend antigo após0082/83: seus editores foram revogados justamente para impedir bypass/duplicidade. Manter ACLs restritas e páginas indisponíveis enquanto a compatibilidade é corrigida. Restauração de backup isolado só por plano específico que preserve novas evidências e demonstre ausência de perda; não misturar rollback de schema com concessão de prêmio.

## Resultado local e limite

Sete nós PostgreSQL PASS (pai+seis cenários), incluindo coexistência0080/81/82/83, identidades cruzadas, ACL/cutover, dependências de Story e diagnóstico econômico herdado. O diagnóstico é reprodução de risco, **não aceite de segurança**. Nenhuma recompensa real foi concedida; fixture econômica foi revertida e invariantes comparados. Os testes isolados históricos permanecem evidência reutilizada para concorrência/expiração/tentativas; não foram repetidos integralmente.
