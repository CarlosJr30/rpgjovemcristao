# RPG-COMMUNITY-043A — plano futuro de migrations e recuperação

**Plano somente documental. Nenhuma migration foi criada, aplicada ou preparada para execução.** A implementação de cada fase exige contrato e autorização próprios, preflight por ambiente e fluxo `.agent/RELEASE_POLICY.md`.

## Gates antes de qualquer migration 043

1. Integrar PR #53 normalmente e conferir migration version `20261113153902` e hash SQL `1f377a035c68cde8921909536820a2e8fe3cc8d9c6b4d3c8dafe8901c6609ad0`. Não executar novamente a migration ECONOMY-041 nem `db push` antes do alinhamento.
2. Capturar estado fresco de `main`, worktrees e branch/tag de backup; não basear trabalho novo automaticamente em tag de rollback.
3. Comparar os históricos de migrations TEST e PROD sem exigir listas iguais; confirmar aplicação real, versão, nome/manifesto e conteúdo de cada migration relevante.
4. Baseline read-only de schema, constraints, índices, políticas RLS, grants, definições/ACLs de RPC, dados anonimizados por contagem/hash, clientes e workers. Comparar TEST e PROD, sem transportar fixture.
5. Especificar recovery e contenção da migration concreta. Confirmar backup/restore disponível com referência e, quando exigido, ensaio restaurável; a leitura desta auditoria **não verificou** snapshot restaurável nem autorização de restore.
6. Fazer mudanças expand/contract: app antigo e novo convivem durante a expansão; não apagar nem renomear coluna/tabela em corte inicial. CI no SHA, instalação TEST, Preview/backend TEST e smoke autorizado precedem produção.

## Sequenciamento proposto

### 043B — diretório e entrada pública

- Adicionar metadados de visibilidade e política de entrada sem mudar a semântica dos registros existentes; valores existentes recebem comportamento privado/legacy até classificação revisada.
- Criar projeção autenticada allowlisted para diretório. Não conceder SELECT aberto nas tabelas base nem ampliar `guilds_select_member` para todos.
- Entrada pública cria pedido por Guilda/avatar com chave idempotente; aprovação revalida papel atual e alvo. Adesão imediata segue desligada até aprovação de quotas/abuso.
- Reusar unique `(guild_id, traveler_id)`, índice ativo não único e membership multiguild já publicados. Não recriar `guild_members_one_active_guild_per_traveler_idx`.
- Recovery: desabilitar descoberta/novos pedidos e voltar a modo privado; manter membership, pedidos e auditoria. Não apagar Guildas ou relações válidas.

### 043C — escola EBD independente

- Expansão aditiva com entidades account-level da proposta, privacidade default e papéis por escola/turma; nenhuma role derivada de Guilda ou avatar.
- Estudar a reusabilidade das estruturas atuais antes de alterar aulas: `guild_lessons.guild_id` e `ebd_class_private.classes.guild_id` são NOT NULL; respostas/presenças estão ligadas a traveler. Adicionar referências opcionais só após provar leitores/escritores em ambas versões.
- Se aulas existentes forem reutilizadas, adicionar `school_id` opcional; após código compatível, relaxar `guild_id` para admitir aulas escolares e garantir escopo exclusivo com constraint validada. Manter todas as aulas antigas com `guild_id`; sem UPDATE em massa para escola.
- Para respostas/presenças, permitir ator account-level sem apagar o ator traveler antigo, com exclusividade de identidade por registro. Migrar somente mapeamentos comprovados e aprovados; ambiguidades ficam legadas.
- Recovery: congelar apenas criação/cutover EBD novo; preservar leitor Guild-bound e dados legados. Não reverter por DROP/DELETE ou reconstruir tabelas históricas.

### 043D — missões cooperativas e eventos

- Separar definição, janela/instância, progresso por participante, prova/evento canônico e recibo/reference de recompensa, com `definition_version`, chave idempotente e origem Guilda.
- Ingerir eventos somente de authorities verificáveis; não aceitar callback cliente como conclusão. Decidir chave global anti-farm e regras de participação cross-Guilda antes da migration.
- Recompensa usa authority ECONOMY-041 e recibo canônico. A função legada `apply_guild_mission_reward` e tabela `guild_reward_claims` não provam por si sós dedupe entre missões e usam trilha antiga direta; não copiar seus grants para o fluxo novo.
- Recovery: pausar scheduler/claims novos e manter eventos/progresso/receipts append-only. Corrigir forward/containment aprovado, nunca apagar claim para repetir payout.

## Preservação e comparações

Antes/depois por ambiente: todas as Guildas e memberships, status/roles, convites/pedidos, missões/progress/attempts/claims, aulas/classes/activities/answers/attendance/history/reward_pending, índices/constraints e ACL/RLS. Comparar por ID e hashes agregados de campos estáveis, omitindo PII e conteúdo sensível de respostas; registrar deltas autorizados. Não usar só row counts quando há risco de troca de linhas.

Dados reais em TEST não são fixtures descartáveis. Não criar usuário/avatar, conceder recurso, editar membership, trocar papel ou inserir dados para alcançar um gate sem autorização específica. PROD não é ambiente de homologação.

## Procedimento de recuperação por fase

1. Suspender novas publicações e identificar SHA, deployment, migrations e instante inicial do problema.
2. Separar falha de aplicação, schema e dados; preservar logs/auditoria minimizados.
3. Confirmar deployment compatível com o schema atual antes de promover versão anterior. Rollback Vercel não desfaz migration ou transações.
4. Pausar somente feature/scheduler/entrada afetada por containment aprovado. Não desligar Auth/RLS nem grants globais.
5. Para schema aditivo, preferir fix forward ou containment reversível. Downgrade somente se plano específico provar perda zero e for autorizado.
6. Comparar dados, memberships, aulas, answers, attendance, eventos e claims após recuperação; validar login e funções essenciais em TEST e depois rotas/gates permitidos em PROD.
7. Reabrir publicação após causa corrigida, teste necessário e aprovação do gate.

**Limite de evidência:** listagens de migrations e leitura de catálogos nesta auditoria não comprovam backup PITR restaurável nem ensaio de restore. O relatório de cada migration deverá registrar identificador do backup e estado/ensaio efetivamente disponível, ou ficar bloqueado.
