# RPG-COMMUNITY-043B — guildas públicas

**Planejamento técnico; não implementado.** Consulta realizada em 13/11/2026. Este documento complementa [o contrato 043](RPG-COMMUNITY-043-CONTRACT.md) e os documentos [043A: fundação](RPG-COMMUNITY-043A-FOUNDATION.md), [permissões](RPG-COMMUNITY-043A-PERMISSIONS.md), [modelo](RPG-COMMUNITY-043A-DATA-MODEL.md), [migrações](RPG-COMMUNITY-043A-MIGRATION-PLAN.md) e [decisões](RPG-COMMUNITY-043A-DECISIONS.md). Não os substitui.

## Escopo aprovado

Planejar criação de Guilda por conta autenticada elegível, descoberta em diretório autenticado, solicitação e aprovação de entrada, convites privados e seleção explícita entre várias Guildas. A liderança criada é local à Guilda; não concede administração global.

### Limites de produto aprovados

- Uma Guilda criada por conta; até cinco Guildas por avatar; até 50 integrantes por Guilda.
- Guilda pública recebe novos membros somente após pedido aprovado; Guilda privada exige convite.
- Um jogador pode participar de várias Guildas. O criador elegível lidera somente a Guilda que criou.
- Estes limites são decisões de produto, não prova de suporte no runtime atual. O limite de integrantes deve ser contado e reservado atomicamente pelo servidor; a futura especificação de capacidade explicitará se cargos de liderança entram no total.

As quotas complementares foram aprovadas, mas ainda não implementadas: até 10 links ativos por Guilda, links novos válidos por no máximo 30 dias e até 50 usos, até 20 convites individuais/Guilda em janela móvel de 24h, até 5 solicitações/conta em janela móvel de 24h, uma pendência por avatar/Guilda, espera de 24h após rejeição e renomeação a cada 7 dias. A capacidade de 50 integrantes prevalece sobre usos de convite. Preservar convites existentes segundo seus termos/expiração originais; aplicar as regras novas a novas emissões. Todas exigem enforcement atômico no servidor. Ver [decisões e compatibilidade](RPG-COMMUNITY-043B-OPEN-DECISIONS.md).

Ficam fora desta fase: autonomia/estrutura da EBD (043C), missões cooperativas e pagamentos (043D), chat global/DM, recompensas livres, migração de dados de alunos e qualquer mudança em Auth/RLS nesta execução. O chat atual permanece restrito à Guilda.

### Proteção de menores e operação

As diretrizes de privacidade por padrão, dados mínimos, nomes seguros/moderáveis, diretório sem lista pessoal, denúncia/bloqueio acessíveis e contenção de conteúdo foram aprovadas para o planejamento. Não ampliar chat ou contato antes da revisão do chat atual, dos controles contra assédio/aliciamento, de política de retenção/exclusão, de responsável e capacidade de moderação, e da revisão jurídica de LGPD e regras aplicáveis a crianças/adolescentes. Não inferir idade por avatar ou nível. Prazos de triagem de 72h/24h e encaminhamento imediato são metas propostas condicionadas à capacidade, não SLA garantido.

## Diagnóstico do estado real

Evidências combinadas: checkout `724f0e76e2e519e21e369cfdd24e334d1a7f6a9a`, schemas PROD/TEST consultados somente para leitura em 13/11/2026, histórico remoto de migrations, código e migrations versionados. Snapshot não contém leitura de dados pessoais nem prova de comportamento de cada cliente/browser.

| Área | Publicado e confirmado | Ausente ou ainda não aprovado |
| --- | --- | --- |
| Guildas e membros | PROD tem `guilds`/`guild_members`, RLS ativo; papéis `leader`, `co_leader`, `moderator`, `member`. Unicidade é por `(guild_id, traveler_id)`; índice de ativos por `(traveler_id, guild_id)` é não único. Multiguild está suportada. | Diretório público allowlisted e campos de visibilidade/política de entrada. Não restaurar o antigo índice de uma Guilda ativa por avatar. |
| Criação/liderança | `public.create_guild` existe e é `SECURITY DEFINER`, `search_path=''`, executável por `authenticated` (não `anon`). A implementação atual revalida conta/avatar ativo e escrita habilitada, mas `require_creation` ainda exige autorização global explícita de liderança. Criação e membership de líder são transacionais no comando scoped. | O requisito de liderança administrativa global conflita com D1 aprovado para 043B: qualquer conta autenticada elegível deve poder criar Guilda comum. A futura autoridade precisa separar elegibilidade/limite de criação da autorização global de liderança. |
| Entrada | `guild_join_requests` e revisão de líder existem; há unicidade parcial de um pedido `pending` por Guilda/avatar. Membership continua sendo criado somente após aprovação. | Solicitação pelo diretório público, políticas pública/privada e quotas aprovadas ainda precisam de implementação e enforcement server-side. |
| Convites | Convite direcionado e `guild_invite_private.link_invites` publicados. Link guarda hash do token, validade máxima técnica atual de 7 dias, revogação e limite técnico de 10 ativos por Guilda. Fluxo cria pedido pendente. | Quota aprovada: 10 ativos, validade até 30 dias e 50 usos em novos links. Falta implementar contador/consumo atômico e rollout compatível. Links existentes mantêm expiração original e não são revogados/encurtados; replay idempotente. QR é a apresentação do mesmo link. |
| Escopo ativo | `guild_scoped_contexts`, `guild_scoped_command` e `GuildScope` consultam contextos do servidor; com várias Guildas exigem escolha explícita. Comandos scoped recebem `guild_id`. | Algumas APIs antigas ainda inferem contexto ou recebem somente traveler. Migrar chamadas do fluxo novo para API explicitamente scoped, sem inferir permissão pelo estado do cliente. |
| RLS/RPC | RLS ativo nas tabelas consultadas. `guilds_select_member` só deixa membros ativos lerem a Guilda. RPCs scoped públicas são wrappers `SECURITY INVOKER`; autoridades internas privadas usam `SECURITY DEFINER` e checagens próprias. | Abrir SELECT da tabela `guilds` não é solução aceitável para o diretório. Expor somente projeção autenticada e allowlisted por autoridade revisada. |
| Missões/economia | Missões, tentativas, claims e progressos existem; `guild_reward_claims` tem unicidade antiga por missão/avatar. ECONOMY-041 está aplicada. | Nenhuma recompensa nova de Guilda deve reutilizar automaticamente `apply_guild_mission_reward`; eventos/deduplicação/recibos pertencem a 043D e requerem autoridade canônica ECONOMY-041. |
| EBD | Aulas, atividades e professores ligados à Guilda existem. `guild_lessons.guild_id` e `ebd_class_private.classes.guild_id` são obrigatórios; respostas/presenças usam traveler. | EBD escolar independente, `school_id`/escola, identidade account-level e consentimento pertencem exclusivamente à 043C. Não inferir matrícula ou papel escolar de membership. |

### Classificação do trabalho

- **Publicado em PROD:** funcionalidades acima, conferidas no catálogo remoto; a PR #53, relacionada à referência de migration da ECONOMY-041, está aberta e não altera runtime.
- **Código neste SHA/branch:** base publicada no SHA acima; arquivos 043B deste pacote são documentos. Nenhum código, policy ou migration 043B foi encontrado na alteração documental.
- **Proposta/documentação:** os cinco documentos 043A e os cinco 043B deste pacote. Eles não são prova de grants, comportamento remoto nem implementação das decisões e quotas aprovadas.
- **Ausente:** diretório autenticado, política pública/privada explícita, entrada pública via diretório e self-service geral de criação conforme D1.

## Fluxos futuros

### A — Criar Guilda

Conta autenticada → escolher avatar próprio ativo → preencher nome, descrição e visibilidade/política → confirmar. Servidor valida identidade, elegibilidade, uma criação por conta e as cotas aprovadas; usa request ID idempotente e serialização/conflito transacional; cria `guilds` e membership `leader` na mesma transação. Resposta perdida/replay devolve o mesmo resultado sem criar duas Guildas. Nenhum papel global é criado. O caminho atual baseado em `leader_authorizations` não satisfaz sozinho o D1 e deve ser adaptado somente em contrato/runtime futuro.

### B — Encontrar uma Guilda pública

Conta autenticada → diretório paginado/pesquisável → projeção de campos públicos permitidos → abrir detalhe mínimo → solicitar entrada. Solicitação é idempotente por request e Guilda/avatar. O líder atual da Guilda recebe o pedido e aprova/rejeita via comando scoped; a aprovação verifica novamente que a Guilda permite entrada, o pedido está pendente, o ator é líder vigente, o avatar pertence à conta e há capacidade dentro do limite de 50. Membership só nasce no servidor após aprovação.

### C — Guilda privada / QR e link

Líder escolhe uma Guilda → emite link/QR por autoridade existente ou adaptada → compartilha → convidado autentica-se e escolhe avatar próprio → servidor valida hash, Guilda, expiração, revogação, uso, convite e capacidade; entrada privada ocorre somente mediante convite e membership nunca ultrapassa o limite de 50. O comportamento atual cria pedido pendente; qualquer mudança futura dessa semântica exige aprovação. Consumo concorrente tem resultado único. Token bruto não vai a logs, listagens nem diretório; a prévia permanece mínima.

### D — Múltiplas Guildas

Usuário escolhe uma Guilda ativa na interface. Cada leitura/escrita inclui a Guilda alvo e o servidor confere membership/papel atual. Trocar contexto invalida dados/cache/seleção pendentes da Guilda anterior; isso não muda outros vínculos, progressos ou aulas. “Guilda ativa” é seleção de navegação, não papel nem autorização.

### E — Líder e adolescentes

Líder administra apenas sua Guilda, convites e pedidos conforme matriz final. Desafios/missões podem reutilizar os contratos atuais, mas não recebem novos prêmios automáticos nesta fase. UX deve evitar diretórios de membros, exposição de dados escolares e contato não moderado. Elegibilidade de menores para criar/liderar e comunicação ainda exigem decisão de segurança/privacidade.

## Proposta conceitual

Reutilizar `guilds`, `guild_members`, `guild_join_requests`, convites e comandos de governança. A extensão futura deve, se os preflights confirmarem, acrescentar metadados aditivos de `visibility` e `join_policy` à Guilda e uma projeção/função de diretório autenticada com campos allowlisted (`id` opaco, nome, emblema se houver, descrição moderada e contagem somente se aprovada). Não expor tabela base, roster, autor/conta, convites, pedidos, atividade, progresso ou escola.

Valores existentes precisam de classificação compatível — comportamento privado e sem alteração automática de membership é a opção segura recomendada. O contrato de implementação deverá definir defaults/backfill sem UPDATE amplo, concorrência, `created_by_user_id`, request key, auditoria mínima e compatibilidade com clientes antigos. Isto não é DDL nem autorização para alterar dados.

## Sequência futura

1. Integrar PR #53 normalmente e validar a migration ECONOMY-041 local `20261113153902` contra PROD, sem reaplicá-la.
2. Fazer fresh-read do schema, funções/ACL, policies e branches; revisar as decisões 043B ainda pendentes.
3. Fechar semântica técnica das quotas aprovadas, matriz de permissões por operação, compatibilidade de convites/dados e plano de recuperação; resolver as condições jurídicas e operacionais de proteção de menores.
4. Em tarefa autorizada: implementar aditivamente, revisar segurança/RLS/RPC, gates CI no SHA, migration TEST, Preview/backend TEST e smoke autenticado dos fluxos novos.
5. Só após os gates da RELEASE_POLICY.md, migration aprovada em PROD e deployment Git normal; comparar dados e permissões e conferir rotas.

O relatório completo de segurança está em [043B-SECURITY](RPG-COMMUNITY-043B-SECURITY.md); modelo/compatibilidade em [043B-DATA-CONTRACT](RPG-COMMUNITY-043B-DATA-CONTRACT.md); aceite futuro em [043B-ACCEPTANCE](RPG-COMMUNITY-043B-ACCEPTANCE.md); decisões em [043B-OPEN-DECISIONS](RPG-COMMUNITY-043B-OPEN-DECISIONS.md).

Detalhamento documental 043B.1: [matriz técnica de permissões](RPG-COMMUNITY-043B1-PERMISSION-MATRIX.md), [contrato de criação](RPG-COMMUNITY-043B1-CREATION-CONTRACT.md), [semântica proposta das quotas](RPG-COMMUNITY-043B1-QUOTAS.md), [compatibilidade e recuperação](RPG-COMMUNITY-043B1-COMPATIBILITY.md) e [plano de testes](RPG-COMMUNITY-043B1-TEST-PLAN.md). Estes documentos não autorizam runtime, migrations ou publicação.
