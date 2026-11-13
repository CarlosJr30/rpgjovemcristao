# RPG-COMMUNITY-043B — modelo e compatibilidade

**Contrato conceitual; não é DDL, migration ou aprovação de alteração de schema.** Usa a auditoria 043A e o snapshot remoto de PROD consultado em 13/11/2026.

## Modelo existente relevante

| Relação/autoridade | Campos/garantias observados | Uso e limite |
| --- | --- | --- |
| `public.guilds` | `id`, `name`, `description`, `created_by_user_id`, `leader_traveler_id`, `status`, timestamps; PK em `id`, índice em `leader_traveler_id`; RLS | Sem coluna de visibilidade ou política de entrada. Leitura atual não é diretório público. |
| `public.guild_members` | `guild_id`, `traveler_id`, `role`, `status`, timestamps; UNIQUE `(guild_id, traveler_id)`; papéis leader/co_leader/moderator/member | Participação multiguild: índice ativo `(traveler_id,guild_id)` **não único**. O antigo índice único por avatar foi removido em 010A.2 e não deve ser restaurado. |
| `public.guild_join_requests` | guild/avatar, status, revisão e timestamps; índice único parcial para uma solicitação pendente por `(guild_id, traveler_id)` | Reutilizar para pedidos do diretório se o contrato provar estados, retenção, replay e revisão atuais. Não criar segunda fila de membership. |
| `public.guild_invites` | convites por avatar alvo, emissor, status e expiração | Reutilizar apenas para convite direcionado, com política/estados compatíveis. |
| `guild_invite_private.link_invites` | guild, líder, `token_hash`, criação/expiração/revogação; limite atual 10 ativos/Guilda e 7 dias | Token bruto só retorna na emissão; preview mínimo; request autenticado cria pedido pendente. Sem contador de uso/consumo explícito. Não tratar como uso único sem alteração futura aprovada. |
| Governança `guild_admin_private.*` | grants/admin, liderança autorizada, revogação, controle de writes e audit append-only | Autoridade global de liderança/Admin distinta do papel local em `guild_members`; não reutilizar como autorização obrigatória para o D1 comum. |
| Escopo multiguild | `guild_scoped_contexts`, `guild_scoped_command`, `guild_scoped_members/requests` e `GuildScope` | Contexto é escolhido explicitamente se há mais de uma Guilda. Comando deve nomear guild alvo; ainda há APIs legadas com inferência. |
| Missões | `guild_missions`, progress/attempts/claims/activity; claims com chave antiga missão/avatar | Não mudar em 043B. A autoridade e dedupe cross-Guilda serão tratadas em 043D. |
| EBD | `guild_lessons`, `guild_activities`, respostas/presenças e `guild_ebd_teachers`; `ebd_class_private.classes` | Guild-bound, com `guild_id NOT NULL` em aulas/classes e actors traveller. Preservar legado; mudança account-level é 043C. |

Os schemas PROD/TEST consultados têm colunas compatíveis nas relações de Guilda/EBD comparadas, mas históricos e dados diferem. Não copiar fixtures, aplicar migrations de um ambiente no outro ou inferir que igualdade de colunas significa igualdade de ACL/RLS ou dados.

## Extensão conceitual para 043B

Reusar as entidades atuais; avaliar adição **aditiva** dos seguintes atributos em `guilds` depois de fresh-read e contrato de migration:

- `visibility`: público ou privado, com default seguro para registros antigos (privado até classificação aprovada).
- `join_policy`: Guilda pública exige solicitação/aprovação; Guilda privada exige convite válido. Autoentrada pública não está aprovada.
- `directory` utiliza view/projeção autenticada e allowlist, e não amplia leitura de tabela base.
- Campos opcionais de emblema/public copy só se já houver catálogo/validação segura; não criar URL de imagem arbitrária sem plano de moderação.
- Membership continua sendo a fonte única de papéis e estado; nenhum cache/seleção de Guilda é autoridade.
- Criação inclui request ID idempotente associado a conta e payload; Guilda e vínculo inicial do líder são atômicos. A quota usa conta Auth para evitar contorno por avatar, além de considerar estado por Guilda/avatar.
- Convite mantém hash de token, Guilda, emissor, expiração e revogação; quota aprovada para novos links exige contador de até 50 usos, consumo/replay atômicos e compatibilidade sem mutação dos convites existentes.
- Alterações de visibilidade, política, liderança, membership e moderação registram evento minimizado no log existente ou authority aprovada, sem copiar PII/tokens.

### Limites e quotas aprovados

O contrato de produto aprovado define: uma Guilda criada por conta; até cinco memberships por avatar; até 50 integrantes por Guilda; entrada pública somente por pedido aprovado; entrada privada somente por convite; participação em várias Guildas; e liderança local do criador elegível apenas na Guilda criada. A implementação futura deve contar por identidade canônica da conta quando o limite é de conta. Para os 50 integrantes, contar todas as memberships ativas, incluindo líder, colíder e moderadores; reservar capacidade/serializar inclusão para não ultrapassar o máximo.

Quotas aprovadas: até 10 links ativos/Guilda; validade máxima de 30 dias; até 50 usos por link; até 20 convites individuais/Guilda em janela móvel de 24h; até 5 solicitações/conta em janela móvel de 24h; uma pendência/avatar/Guilda; espera de 24h após rejeição; renomeação uma vez a cada 7 dias. Uma pendência por avatar/Guilda já é garantida por índice parcial e deve ser reutilizada. Contadores/janelas e semântica de uso ainda requerem contrato técnico, proteção contra concorrência/replay e idempotência antes da implementação. A capacidade de 50 integrantes prevalece sobre usos de convite.

Compatibilidade aprovada: preservar convites existentes e seus hashes, validade/expiração e estado; não apagá-los, revogá-los ou encurtá-los para adequar às quotas novas. Como links atuais expiram em até 7 dias, deixá-los expirar sob seus termos; aplicar validade de até 30 dias e contador de 50 usos a novos links emitidos após a implementação. Não recalcular convites ou pedidos históricos. A quota de 10 ativos continua sem invalidar os convites existentes.

Para a regra de uma criação por conta, não depender apenas da existência de Guildas ativas: o mecanismo futuro deve impedir recriação abusiva após arquivamento/exclusão, sem apagar o histórico nem coletar PII desnecessária. O contrato operacional deve decidir retenção e recuperação da conta antes da migration.

Diretrizes aprovadas de moderação: líder gerencia a Guilda, aprova solicitações, administra membros/missões e designa responsáveis dentro das permissões autorizadas; colíder auxilia em missões, convites e membros conforme delegação, sem remover o líder nem receber autoridade global; moderador analisa denúncias locais e aplica ações autorizadas auditáveis; Administração global atua em casos graves/recursos e contenção via autoridade própria, sem herdar liderança. A matriz técnica por operação continua pendente antes de RPC/RLS. Nada disso concede recompensas ou altera ECONOMY-041.

Diretrizes aprovadas de proteção de menores: privacidade por padrão, dados mínimos, diretório sem identificação pessoal dos membros, denúncia/bloqueio, contenção, moderação de nomes/descrições, revisão do chat, sem mensagens privadas irrestritas adulto-menor, proteção contra assédio/aliciamento/exposição de dados, políticas de retenção/acesso/exclusão e responsáveis reais antes da abertura pública. Não inferir idade por avatar. A aprovação não equivale a homologação jurídica/operacional; consentimento/representação por faixa etária, detalhes de retenção, equipe e procedimento continuam pendentes. Metas 72h/24h/imediato dependem de capacidade comprovada e não são SLA vigente.

Este modelo não define nome de coluna, tipo SQL, tabela, enum, índice ou RPC final. Não executar backfill em massa; se precisar classificar registros, usar default privado compatível, sem alterar memberships/convites.

## Compatibilidade de API e clientes

1. API nova de diretório retorna apenas campos públicos e versão do contrato; campos privados jamais são incluídos por `to_jsonb(guilds)`.
2. Todos os writes novos recebem `p_actor`, `p_guild` e `p_request`, e verificam sessão, avatar ativo/ownership, `guild_id`, status e papel dentro do comando servidor.
3. No início, manter RPCs/clientes legados funcionando com suas restrições. Antes de estender um wrapper, comparar assinatura, corpo, owner, search path e ACL TEST/PROD; não trocar semantics para clientes antigos silenciosamente.
4. MultiGuild seleção usa o id selecionado somente como alvo; o backend revalida membership. Invalidar requisições e cache ao trocar conta/avatar/Guilda.
5. A política atual de criação limitada à liderança global deve permanecer até a nova autoridade de criação comum estar instalada e testada; não liberar `create_guild` diretamente por UI ou grant mais amplo.
6. `guild_reward_claims` e a função econômica legada não são compatíveis automaticamente com receipts ECONOMY-041; 043B não muda pagamentos.
7. EBD continua Guild-bound. Nunca preencher `school_id`, transferir aluno ou herdar role nesse pacote.

## Ordem de mudança futura

Após PR #53 integrada e migrations alinhadas: (a) definir semântica técnica/compatibilidade das quotas e matriz por ação para as políticas aprovadas; (b) migration expand com defaults seguros e sem alteração de relações existentes; (c) novos RPC/projection e cliente compatível; (d) testes de isolamento/concorrência; (e) TEST/Preview e comparação de dados; (f) publicação Git normal; (g) remoção/contração só em tarefa posterior. Contenção deverá fechar descoberta e novas entradas sem apagar memberships, pedidos, convites, Guildas ou logs.
# Fundação técnica 043B.1

As semânticas propostas para as quotas aprovadas e o tratamento de links novos versus existentes estão em [043B.1 Quotas](RPG-COMMUNITY-043B1-QUOTAS.md); compatibilidade de Guildas, memberships, convites, missões e EBD e recuperação estão em [043B.1 Compatibilidade](RPG-COMMUNITY-043B1-COMPATIBILITY.md). Nada aqui altera esquema ou dados.
