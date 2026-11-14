# RPG-COMMUNITY-043A — fundação técnica

**Estado: auditoria documental concluída para revisão do proprietário.** Este pacote descreve o estado observado e propõe a fundação para 043B–043E. Não autoriza código de runtime, migrations, SQL de alteração, escrita remota, mudança de Auth/RLS, release ou publicação.

## Escopo e proveniência

Auditoria realizada em 13/11/2026 sobre o checkout documental baseado em `origin/main` `724f0e76e2e519e21e369cfdd24e334d1a7f6a9a`, os contratos e migrations versionados e leitura de catálogos no Supabase TEST (`wkdvdzfkbwvhyjmamrsg`) e PROD (`wspafhlbtlpabypzymjo`). As instâncias foram consultadas sem ler conteúdo pessoal e sem executar escrita. Contagens de linhas podem mudar e não são invariantes.

Registro histórico da preparação original: o worktree principal tinha alterações independentes e não foi modificado; naquela etapa, a branch `docs/rpg-community-043-contract` continha o contrato 043 e os cinco documentos 043A, ainda sem commit/PR. A continuação atual está registrada no parágrafo final deste documento.

**Dependência:** PR #53 está aberta, pronta para revisão (não draft), head `c98638aecec0ff37db1ad3b933b3dbc12992d036`, base `724f0e76e2e519e21e369cfdd24e334d1a7f6a9a`. Os checks de qualidade/build, PostgreSQL e RSC/móvel retornam success; os checks condicionais de Preview aparecem como skipped. PROD registra a migration `20261113153902 / economy_041_production`; `origin/main` ainda guarda o arquivo com versão `20261111063736`. A PR renomeia o arquivo e ajusta manifesto/documentação. O blob SQL anterior e o da PR têm ambos SHA-256 `1f377a035c68cde8921909536820a2e8fe3cc8d9c6b4d3c8dafe8901c6609ad0`. A PR não foi integrada; integrá-la e conferir o histórico é precondição para qualquer migration futura. Não reaplicar essa migration. A tag de backup `backup/rpg-equipment-fix-014-aprovado-2026-11-11` continua apontando ao commit aprovado `3cfa561ab4cd76d86e89e9757d31ad3e11d504e1` e foi preservada.

## Estado auditado

| Área | Código/migrations locais | TEST e PROD observados | Compatibilidade e risco |
| --- | --- | --- | --- |
| Guildas e membros | `guilds`, `guild_members`, RPCs de criação, entrada, governança e escopo | Ambas têm as tabelas com colunas compatíveis; RLS ativo. `guild_members` mantém unicidade `(guild_id, traveler_id)` e índice parcial **não único** por `(traveler_id, guild_id)` para ativos. | Multiguild está no schema atual. A migration inicial tinha índice único parcial de um vínculo ativo global por avatar; 010A.2 o removeu. Não recriá-lo em rollback nem deduplicar/remover vínculos. |
| Descoberta/entrada | Convites direcionados, convites por link, solicitações e estados existentes | `guilds` não tem `visibility` nem `join_policy`; policy observada `guilds_select_member` é para membros autenticados. Solicitações têm índice único de um pendente por Guilda/avatar. | Não há diretório público implementado. A tabela e policy atuais não podem ser abertas para criar descoberta pública; usar projeção allowlisted e autoridade separada. |
| Missões e recompensas | `guild_missions`, `guild_mission_progress`, `guild_mission_attempts`, `guild_reward_claims`, atividade/histórico | Estrutura equivalente nos dois ambientes; RLS ativo. Migrations TEST/PROD e conteúdo diferem. | Claims legados usam unicidade por missão/avatar. `apply_guild_mission_reward` contém valores históricos de XP/moedas e concessão de baú; não é autoridade automaticamente compatível com ECONOMY-041 nem prova de deduplicação do mesmo evento entre missões/Guildas. Não conectar novos grants sem contrato/recibo canônico. |
| EBD | `guild_lessons`, atividades, respostas, presença, histórico, professores; `ebd_class_private.classes`; funções `ebd_ops`/wrappers | PROD e TEST têm tabelas/colunas Guild-bound compatíveis; registros diferem. `guild_lessons.guild_id` e `ebd_class_private.classes.guild_id` são obrigatórios. Aulas, respostas e presenças existentes referenciam `traveler_id`; não foi encontrada entidade `ebd_schools` nem coluna `school_id` nessas estruturas. | EBD atual depende de Guilda/avatar. Torná-la independente requer expansão compatível e identidade account-level; não é somente UI nem conversão de papéis. Não mover nem reinterpretar registros legados em massa. |
| Auth/RLS/RPC | Policies e RPCs em schemas `public`, `ebd_ops`, `ebd_class_private` e schemas privados | Todas as tabelas públicas consultadas de Guilda/EBD têm RLS. Exemplos de policies autenticadas são leituras por participante/membro; a policy de `guilds` é member-only. RPCs observadas incluem `create_guild` (SECURITY DEFINER, EXECUTE authenticated, anon negado) e wrappers scoped/EBD authenticated; há funções internas sem EXECUTE público. | Este snapshot não substitui revisão de cada corpo, ACL, ownership, search_path e policy no SHA da futura migration. Não ampliar grants nem usar `SECURITY DEFINER` como atalho. |
| Chat/moderação | Feature e tabelas existentes de chat da Guilda, leitura, denúncias e log de moderação | Tabelas de chat existem nos dois ambientes; RLS ativo. | O contrato não cria chat global, DM nem contato irrestrito entre menores. Preservar chat Guild-bound existente e seus controles; conferir moderação/denúncia antes de abrir mais descoberta. |

### Matriz de compatibilidade

| Fluxo atual | Mudança planejada | Tabelas/RPCs no escopo | Risco/dependência | Teste e recuperação a exigir |
| --- | --- | --- | --- | --- |
| Criar Guilda exige papel de líder local e avatar | Manter fluxo transacional/idempotente; avaliar elegibilidade sem criar privilégio global | `guilds`, `guild_members`, `create_guild` | RPC existente é SECURITY DEFINER; auditar corpo/ownership/ACL no SHA atual antes de extensão | Criação concorrente/replay e avatar alheio negado; conter novas criações sem apagar Guildas |
| Entrada por convite/solicitação | Separar descoberta de membership; política pública/privada e aprovação local explícitas | `guild_invites`, link invites privados, `guild_join_requests`, scoped command | Token enumeration, revogação atrasada, duplicação entre Guildas | Aceite/expiração/revogação/replay e negação fora do alvo; voltar descoberta a privada mantendo pedidos/histórico |
| Um avatar em várias Guildas | Preservar modelo e APIs com alvo explícito; eliminar inferência de Guilda por “primeira ativa” | `guild_members`, `guild_scoped_contexts`, `guild_scoped_command`, funções antigas `leave_guild` e `request_join_guild` | API legada pode ser ambígua quando ator tem vários vínculos | Avatar em duas Guildas, papéis diferentes, ação/saída isolada; não restaurar índice single-Guilda no rollback |
| Missões e claims | Usar evento canônico versionado, dedupe cross-Guilda e autoridade ECONOMY-041 | `guild_missions`, `guild_mission_progress`, `guild_mission_attempts`, `guild_reward_claims`, `apply_guild_mission_reward` | Recompensa legada pode duplicar ou contornar recibo/ledger 041 | Replays, evento repetido em duas Guildas e participante duplicado; pausar scheduler/claim novo sem apagar recibos |
| Aulas, turmas e papéis EBD Guild-bound | Adicionar escopo escolar independente em fases; preservar traveler/IDs e leitor Guild antigo | `guild_lessons`, `ebd_class_private.classes`, `guild_ebd_*`, `ebd_ops.*`, wrappers de classes/aulas | Campos `guild_id NOT NULL`, atores traveler-only, respostas de menores; exige D10–D14 e mapa de dados | Conta sem avatar, legado não mapeado, professor de outra turma; congelar somente criação/cutover EBD novo |
| Conteúdo escolar associado à Guilda | Tornar link explícito, consentido e revogável, sem herança de papel ou matrícula | nova relação conceitual `ebd_guild_links`; roles escolares; `guild_members` | Exposição indireta do roster escolar | Revogar link e provar que não há cruzamento de dados ou matrícula entre domínios; desativar link preservando ambas as entidades |

### Migrations e diferença entre ambientes

O histórico PROD observado inclui os incrementos de Guilda/EBD 010A.2, 010B, 010B.3, 010C.1/010C.2 e ECONOMY-041. TEST inclui bootstrap histórico, versões TEST correspondentes e migrations de fixtures/QA da ECONOMY-041. Os históricos **não são iguais por desenho**; não copiar a lista de um ambiente ao outro. Os schemas de tabelas Guilda/EBD listadas e `ebd_class_private.classes` tiveram nomes/colunas compatíveis na comparação, embora dados, versões registradas e algumas áreas não relacionadas difiram.

Os relatórios locais têm proveniências distintas: `RELEASE-EBD-001-REPORT.md` registra release inicial DONE; `RPG-DEV-010A-MULTIGUILD-COMPATIBILITY.md` descreve a expansão multiguild; relatórios 010B/010C registram fases publicadas e checkpoints históricos separados. O status do banco foi conferido diretamente nesta auditoria; o conteúdo de um relatório antigo, sozinho, não prova schema atual.

## Arquitetura proposta

- **GUILD:** múltiplos vínculos por avatar, com cada comando nomeando `guild_id` e servidor revalidando vínculo/papel/estado atuais. Expor diretório autenticado por campos allowlisted, sem enumerar membros, convites privados ou solicitações.
- **Missões:** eventos e janelas versionados pelo servidor; progresso verificável e idempotente. Valores continuam sob ECONOMY-041. A deduplicação precisa ocorrer pelo evento canônico, não apenas por missão.
- **EBD:** escola e papéis ligados a conta Auth, sem Guilda/avatar obrigatório para escola/turma/aluno/professor. Preservar trilha legada em `traveler_id`; cada registro novo terá identidade account-level inequívoca.
- **Vínculo GUILD–EBD:** associação explicitamente consentida, revogável e sem herança de papel, matrícula ou dados pessoais.
- **Interface:** reaproveitar `guild-governance`, `guild-missions`, `guild-challenges`, `guild-ebd` e navegação existentes quando compatível. Mudança de escopo não pode deixar estado/cache da Guilda anterior visível após trocar conta, avatar ou Guilda.

## Fases futuras e critérios de saída

1. **043A — fundação (este pacote):** auditoria, matrizes, modelo, decisões e recuperação revisados. DONE documental não é autorização de runtime.
2. **043B — Guildas públicas/multiguild:** primeiro integrar e verificar PR #53; aprovar diretório, política de entrada, quotas e papéis; migration aditiva própria; testar isolamento por Guilda, transições e recuperação.
3. **043C — EBD independente:** mapa legado revisável, escola account-level, API por escopo e consentimento; migration aditiva; não transferir ownership ou papéis antigos automaticamente.
4. **043D — missões cooperativas:** fontes de evento, anti-farm, critérios de participantes e recompensa/recibo aprovados; não abrir concessão genérica.
5. **043E — consolidação e expansão:** moderação, retenção, telemetria, acessibilidade e remoção de compatibilidade só em tarefa posterior aprovada.

Cada fase tem contrato próprio e aceite próprio. Antes de release: esquema e migration efetivos TEST/PROD comparados, CI exato, RLS/ACL/RPC avaliados, Preview/backend TEST e fluxos hospedados necessários, preservação verificada e plano de contenção/recovery adequado.

## Riscos e pendências

- Diretório público muda o perfil de enumeração; autenticação e projection allowlist são necessárias, mesmo que nome/descrição já existam.
- EBD lida com dados escolares de menores; revisão jurídica/privacidade é gate antes de abertura ampla, não inferida neste documento.
- A recompensa Guilda legada é um caminho distinto da authority ECONOMY-041. Dedupe cross-Guilda e origem verificável faltam para missões cooperativas novas.
- As quotas globais para criação, convites, memberships e solicitações não foram comprovadas como contratos numéricos. Limites existentes locais (unicidade por vínculo/solicitação e limites de campos) não substituem rate limiting/quotas de abuso.
- A consulta de schema é snapshot somente leitura e não revisou individualmente todos os corpos de RPC, dados pessoais, restore de backup, logs, tráfego ou comportamentos de produção.

## Validação e aceite

Artefatos: os cinco documentos 043A neste diretório; contrato-mãe 043 preservado. `git diff --check` executado ao concluir. Nenhum CI, teste funcional, migration, escrita remota, aplicação, merge, PR ou deployment foi realizado nesta etapa. Revisão de segurança documental pelo autor, sem auditor independente nem parecer jurídico.

043A fica pronto para aprovação documental. 043B/043C não começam por implicação; decisões marcadas como pendentes devem ser ratificadas, e a PR #53 deve ser integrada pelo fluxo normal antes de migrations futuras.
# Continuação documental

A matriz detalhada para Guildas públicas e o contrato técnico de criação foram preparados na [COMMUNITY-043B.1](RPG-COMMUNITY-043B1-CREATION-CONTRACT.md). A fundação 043A permanece planejamento; a continuação não altera permissões, banco ou runtime.

**Atualização documental posterior:** os cinco documentos 043A/043B existentes e os contratos técnicos B1 estão sendo preservados na branch `docs/rpg-community-043b1-foundation` para revisão por PR, sem merge. O estado/branch descrito acima é histórico da preparação original; nesta continuação, o preflight confirmou PR #53 aberta e CI `43458777891` concluído com sucesso no candidato informado. PR #53 deve ser integrada e seu alinhamento conferido antes de qualquer migration futura. Nenhuma operação remota decorre desta atualização.
