# GUILD-035C — contrato técnico de retenção da criação

Decisão de produto: GUILD-035-RETENTION-DECISION.md, sem alteração do prazo aprovado. Implementação exclusivamente local; instalação, agendamento, merge e ativação remotos não autorizados nesta execução. Revisão de privacidade PENDING.

## Escopo e dados

A sexta operação `community_retention_v1.sql.in`, versão 20261115170001, depende das cinco operações anteriores. Elas permanecem intactas. O manifesto continua blocked/migrations=[]. A instalação fecha a criação; não instala automaticamente extensão ou job remoto.

O marcador é privado: HMAC-SHA256 do UUID Auth com segredo aleatório de 32 bytes gerado no banco, segregado em tabela privada. Mantém apenas pseudônimo e início da exclusão. Vínculos privados auxiliares associam Guildas/eventos abrangidos, antigo líder durante recuperação e replay por HMAC de request/payload. Nenhum email, telefone, documento ou dispositivo. Todas as tabelas novas têm RLS, sem grants a anon/authenticated/service_role. Funções operacionais são postgres-only. As RPCs públicas e suas ACLs permanecem as existentes.

Novas criações e a capacidade consultam o marcador, não o ledger. Captura transacional de inserção da Guilda mantém uma criação por conta também nos comandos antigos. Backfill considera autoria existente e eventos guild_create, sem alterar os registros. Replay continua privado e idempotente, por conta, sob a mesma trava 1010/1 usada pela governança. Novos eventos de auditoria não recebem UUID Auth nem request_id/payload hash do cliente.

## Exclusão, recuperação e liderança

O evento autoritativo é auth.users.deleted_at; BEFORE UPDATE/DELETE registra a janela usando tempo de servidor, sem prolongá-la por repetição. O tratamento de hard-delete é transacional: FKs de outros domínios podem continuar impedindo a exclusão física. Não foram alteradas indiscriminadamente e a falha reverte também os efeitos COMMUNITY. Este pacote não é um serviço geral de eliminação Auth/economia.

Guildas abrangidas permanecem existentes/ativas, com os mesmos membros e convites. O antigo líder perde a ponte operacional e passa a membro, sem expulsão. A ponte recuperável fica somente no vínculo privado. Se o líder atual pertencer a outra conta, ele é preservado. Recuperação dentro da janela exige o mesmo UUID Auth, conta confirmada/não anônima/não suspensa, avatar ativo e membership ainda compatível; restaura apenas o líder anterior se a posição continuar vazia. Não promove outro usuário nem sobrescreve liderança regularizada.

Após o limite não há recuperação automática: o trigger rejeita limpar deleted_at de identidade expirada, inclusive depois da eliminação do marcador. **Impacto a revisar expressamente em privacidade/Auth:** esse limite de restauração de identidade é aplicado às transições Auth deleted_at→NULL, não apenas às contas que ainda têm marcador; sem manter um novo tombstone além do prazo, não é possível reconhecer indefinidamente quais identidades já o tiveram. Não há endpoint de bypass ou associação de conta nova. Eventual recuperação excepcional requer contrato separado; não usar email ou dispositivo para vincular contas. Uma conta nova elegível é independente.

## Eliminação abrangida e auditoria

A limpeza elimina marcador, vínculos, replay e antigo líder recuperável. Anula created_by_user_id apenas se ainda pertencer ao pseudônimo em expiração; não apaga Guilda nem transfere liderança. Guildas sem líder ficam sem gestão até regularização pela autoridade existente.

Eventos guild_create abrangidos mantêm id, ação e data. UUID Auth é anulado, request_id/resource_id substituídos por UUIDs sem vínculo, hash por valor aleatório e result removido. Permissão privada exige o id exato, a transação atual e a linha final exata; o trigger original permanece e nega todos os outros UPDATE/DELETE. Outras ações administrativas permanecem byte a byte, inclusive suas referências Auth e regras próprias. Não há permissão de redigir auditoria para jogador.

Também remove actor_traveler_id e metadata somente dos eventos guild_created de guild_activity_log ligados ao criador abrangido. Mantém o evento e sua Guilda; não edita eventos de participação, recompensa, missão ou outras ações. O teste usa o trigger original de captura para comprovar que a referência criada automaticamente foi removida.

Isto é desidentificação dos vínculos abrangidos, **não anonimização integral**: membros/avatares, conteúdo de nomes, datas, outros históricos e backups podem permitir correlação e têm políticas próprias. Não alegar eliminação integral de dados pessoais. Parecer deve considerar ids/datas preservados e cópias anteriores.

## Agendamento, falhas e retenção legal

`install_schedule()` é privado, identifica PROD/scope e requer pg_cron disponível; não cria extensão nem usa credencial no navegador. Instala comando fixo `SELECT community_retention_private.tick()` a cada minuto, no banco atual, executado por postgres. O job é idempotente pelo nome. `operational()` exige job ativo exato e heartbeat recente; criação e capacidade negam enquanto faltar.

A varredura vence a janela em 29 dias 23h58, margem de dois minutos dentro do máximo aprovado de 30 dias. Recuperação usa o mesmo limite. Falhas fazem rollback do subbloco, registram somente SQLSTATE/horário, emitem WARNING sem dados pessoais e fecham a criação. Sucesso posterior não reabre a funcionalidade automaticamente. Saúde/avisos devem ser monitorados pelo operador; não foi enviado email nem contratado serviço. Indisponibilidade prolongada do banco/agendador pode impedir eliminação no prazo: exige resposta operacional, não é corrigida apenas por negar novas criações. Instalação/monitoramento real de pg_cron continuam gates remotos; fixtures SQL não os comprovam.

Retenção legal exige registro privado por operador de referência específica e prazo de revisão. Não é concedida automaticamente. Revisões vencidas geram WARNING; não apagar evidência legal automaticamente. A revisão de privacidade deve definir procedimento/responsável e autorização dessas retenções.

## Publicação futura

1. Concluir revisão Auth/privacidade e resposta operacional aos alertas.
2. Exigir CI do SHA final e revisar pacote/recuperação sob a exceção GUILD-035, sem BACKUP_VERIFIED.
3. Liberar explicitamente manifesto e executar seis operações na transação controlada, com versões/hashes conferidos.
4. Confirmar cron existente/compatível e executar somente a instalação privada do job; verificar heartbeat/ACL/RLS e estado fechado.
5. Seguir Preview, integração e ativação conforme requisitos aplicáveis. Não substituir smoke real por estes testes sintéticos.
