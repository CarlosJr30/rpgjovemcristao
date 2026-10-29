# 010A.2 — contrato de compatibilidade para múltiplas Guildas

## Fechamento TEST — 29/10/2026

**As 15 interfaces foram homologadas no escopo público aplicável com dois UIDs Auth distintos.** Candidato `df9e0b7`, CI push40834498581/PR40834504087 success; Preview `mza53rgto` READY/TEST. Evidência por fase em [MULTIUSER-EVIDENCE](RPG-DEV-010A2-MULTIUSER-EVIDENCE.json), sem transformar prefixos de rodadas interrompidas em rodadas PASS. As 241 verificações independentes anteriores permanecem preservadas. As correções workspace VOLATILE e conflito PT409 fazem parte do contrato final; somente aprovação isolada não teria fechado esta homologação.

| # | Interface | Prova hospedada selecionada |
| --- | --- | --- |
|1|Criação antiga/escopada|Duas Guildas por líder; outra por segundo líder; replay/concorrência; criação legada indevida negada.|
|2|Índice/vínculos|Mesmo avatar simultaneamente em duas comunidades, dados antigos preservados; saída/remoção altera somente alvo.|
|3|Contexto/seleção|Seleção explícita, recarga e painéis EBD realmente prontos em Chromium/WebKit/toque emulado.|
|4|Pedido de entrada|Duas comunidades sem substituir vínculo, pedido/repetição concorrente e convite.|
|5|Revisão de pedido|Aprovação na comunidade correta; pedido/ator/escopo misturados negados.|
|6|Saída|Só comunidade selecionada, replay e histórico preservados; líder não sai; legado ambíguo negado.|
|7|Remoção|Só vínculo alvo, professor desse vínculo revogado; reentrada não restaura professor.|
|8|Listagem de membros|Comunidade própria explícita; outra liderança/Admin global sem vínculo negados; legado ambíguo negado.|
|9|Listagem de pedidos|Líder no escopo; membro/outra comunidade/legado ambíguo negados.|
|10|Contadores legados|Ambiguidade negada; nova interface deriva somente comunidade carregada.|
|11|Workspace EBD|Líder/professor em seu escopo; recarga e autorização; wrapper corrigido para locks em POST.|
|12|Comando EBD|Professor só na aula/comunidade atribuída; remoção/revogação imediata; disputa real HTTP409/PT409 preserva edição.|
|13|Resolução de liderança|Guardas exercitadas pelos convites/EBD/Guilda públicos; não há chamada direta privilegiada apresentada como fluxo público.|
|14|Convites comuns|Emissão/listagem/revogação escopadas, replay sem reexpor segredo; líder revogado perde poderes no mesmo JWT.|
|15|Aceite/helpers|Destinatário e comunidade verificados, convite pendente invalida com revogação; anônimo/alheio negados.|

Onze checks negativos adicionais das superfícies legadas passaram depois dos fluxos positivos. Permanecem os limites da evidência: mobile emulado, revisão pelo autor, ausência de teste físico e positivos de cartas antigas não ligados a esta entrega. Nenhuma recompensa, missão oficial ou chat foi habilitado. **PROD ainda BLOCKED** por gates próprios e designação administrativa não aprovada; ver [plano produtivo](RPG-DEV-010A2-PRODUCTION-PLAN.md). O restante descreve checkpoints históricos e a auditoria de implementação.

29/10/2026. **010A.2 implementada e instalada em TEST; homologação entre contas BLOCKED e publicação pendente.** Runtime atualf45e9ef/CI push40807345731 ePR40807354870 aprovados; migration TEST20261029014423 preservada, Preview5qvh4t0ht READY. Avatar original confirmado; usuário dispõe de dois avatares do mesmo login.241regressões reais independentes passaram com a conta Admin, sem positivos multiguild ou professor. Correção de seleção aguarda a resposta atualizada antes de validar a comunidade recém-criada. Faltam dois logins Auth distintos e os fluxos positivos multiguild hospedados; janelas diferentes da mesma identidade não comprovam esse gate. A migration adapta as interfaces conjuntamente antes de retirar o índice global de um vínculo. A fundação010A.1 e suas evidências permanecem preservadas. Ser Admin não substitui autorização explícita de liderança. O histórico abaixo descreve o baseline anterior.

## Resultado da auditoria das 15 interfaces

Tabela histórica de implementação: todas as linhas foram implementadas e cobertas por PostgreSQL isolado ou testes de cliente. O fechamento hospedado posterior está na tabela acima; não inferir execução de helpers privados pela API.

| # | Interface | Adaptação e limite |
| --- | --- | --- |
|1|`create_guild`|Exige autorização explícita ativa; cliente antigo só cria a primeira comunidade. Nova criação escopada usa ID/nonce persistentes e recibo auditado.|
|2|Índice de vínculo ativo|Retirada conjunta; unicidade Guilda/avatar preservada. Recuperação recusa perder vínculos múltiplos.|
|3|`getContext` / `getOwnJoinRequest`|Arrays próprios, escolha explícita quando múltiplos, sem `maybeSingle` global; respostas de contexto anterior descartadas.|
|4|`request_join_guild`|Duplicação verificada apenas na Guilda alvo; conserva outros vínculos e retorna pedido pendente idempotente.|
|5|`review_guild_join_request`|Líder da comunidade do pedido; nonce/revisão normal; outro escopo negado mesmo quando o líder administra ambos.|
|6|`leave_guild`|Legado recusa ambiguidade. Nova saída altera somente o vínculo indicado e seu grant de professor, sem apagar aulas/histórico.|
|7|`remove_guild_member`|Líder autorizado da Guilda explícita; não remove vínculos de outras comunidades nem outro líder.|
|8|`list_guild_members`|Leitura própria escopada; wrapper antigo exige alvo inequívoco.|
|9|`list_guild_join_requests`|Pedidos pendentes da comunidade administrada; legado exige Guilda inequívoca.|
|10|`guild_admin_stats`|Legado recusa múltiplos contextos; nova tela usa apenas dados carregados da Guilda selecionada.|
|11|`ebd_ops.workspace`|Sobrecarga Guilda explícita, projeção pedagógica existente e verificação do escopo recebido pelo cliente.|
|12|`ebd_ops.command`|Sobrecarga escopada; alvo aula/atividade/resposta deve pertencer à mesma Guilda; professor limitado à aula atribuída.|
|13|`guild_invite_private.leader_guild`|Sobrecarga explícita; mantém checagem do avatar próprio ativo, papel e revogação atual. Legado não escolhe arbitrariamente.|
|14|Criar/listar/revogar convite comum|Guilda explícita; emissão idempotente com segredo exposto uma vez; repetição devolve recibo sem token. Convite continua sete dias e pedido sujeito à aprovação, sem antecipar010B.|
|15|Validar/solicitar convite e helpers de liderança|Revogação consultada no banco; convite pendente de líder revogado deixa de valer. `is_guild_leader`, `can_lead_mission`, atores Guilda/EBD/chat revisados conjuntamente, sem liberar chat.|

Status antigo de governança permanece versão1 compatível; novo `guild_scoped_status` fornece versão2. Comandos serializam com revogação no lock administrativo e travam o avatar ativo antes da escrita. Seleção local é preferência vinculada à conta/avatar, nunca autorização. UI reconfirma permissões e remonta editores ao trocar Guilda; comandos pendentes bloqueiam troca de comunidade. Vínculos existentes de liderança continuam legítimos para administrar suas próprias comunidades, sem conceder criação adicional nem ignorar revogação explícita.

Professores usam o modelo publicado de autorização por Guilda/aula. Não há modelo novo de múltiplas classes nesta etapa. Seu aceite hospedado exige a segunda conta TEST normal; fixtures não comprovam esse gate.

## Mudanças que precisam entrar juntas

| Fronteira atual | Comportamento necessário |
| --- | --- |
|`create_guild` aceita qualquer proprietário sem vínculo|Exigir autorização de liderança explícita, ativa e verificada no servidor, além do avatar ativo próprio. Ser Admin não substitui o convite aceito. Serializar com revogação e garantir idempotência da criação.|
|`guild_members_one_active_guild_per_traveler_idx` limita todos os vínculos|Retirar somente quando os consumidores abaixo aceitarem escopo explícito; preservar unicidade por Guilda/avatar e todos os registros existentes.|
|`getContext`/`getOwnJoinRequest` usam `maybeSingle` global|Consultar vínculos/pedidos próprios e exigir seleção explícita da Guilda quando houver mais de uma. Troca de conta/avatar/Guilda invalida respostas e editores anteriores. Não selecionar arbitrariamente o primeiro vínculo.|
|`request_join_guild`/`review_guild_join_request` negam qualquer vínculo anterior|Negar duplicação somente na Guilda alvo; preservar os outros vínculos. Aprovação valida papel, estado e escopo da Guilda do pedido. Convite comum com autoentrada pertence à010B.|
|`leave_guild(uuid)` atualiza todos os vínculos não líderes|Nova operação exige Guilda alvo e altera somente esse vínculo. Interface antiga deve recusar ambiguidade; nenhuma saída em massa implícita. Líder continua sujeito à transferência confirmada.|
|`remove_guild_member(uuid,uuid)` pode atingir várias Guildas compartilhadas|Exigir Guilda alvo, líder autorizado nela e membro alvo nesse vínculo. Não remover outros vínculos, professores em outras classes ou histórico.|
|Listagens de membros/pedidos e contadores inferem Guilda|Novas interfaces com escopo explícito; wrappers antigos só continuam quando o alvo for inequívoco, com o mesmo isolamento.|
|`ebd_ops.workspace/command` selecionam uma Guilda pelo avatar|Sobrecargas com Guilda explícita, com verificação de identidade/vínculo/estado e de que aula/atividade/resposta pertence ao mesmo escopo. Não confiar apenas em um gerenciador que também atua em outra Guilda.|
|`guild_invite_private.leader_guild` infere Guilda|Não escolher Guilda arbitrariamente. Preparar escopo explícito para integração010B, sem habilitar convites econômicos ou nomear professores implicitamente.|
|Papel líder legado usado diretamente por funções/policies|Revisar todos os caminhos privilegiados: criar Guilda, gerir membros, emitir/revogar convites, nomear professor e editar/publicar/avaliar/presença. Revogação global precisa impedir o poder em todos esses caminhos, preservando vínculos/histórico e permissões independentes não revogadas. Não alegar que a flag010A.1 já cobre isso.|

O cliente encaminha o escopo; o servidor o valida. Não usar `user_metadata`, parâmetros de sessão alteráveis pelo cliente ou armazenamento local como autoridade. A seleção local serve somente à navegação, nunca concede acesso.

## Gates de implementação e recuperação

1. Guardas do baseline por ambiente/definição/ACL/índice e compatibilidade com a aplicação anterior. Nenhuma importação da PR12 ou18.
2. Transações com ordem de locks documentada e teste de criação concorrente/revogação enquanto aguarda. Replay não cria uma segunda Guilda.
3. Fixtures PostgreSQL isoladas: um avatar em duas Guildas, papel diferente por vínculo, saída/remoção/convite/aluno/professor isolados; ação ou resposta de outra Guilda rejeitada, inclusive quando o ator gerencia ambas. Inativos/anônimos/contas alheias negados.
4. Preservação de todos os vínculos/aulas/presenças/histórico anteriores, economia fechada, regressões de Guilda/EBD e demais módulos publicados.
5. Recuperação não pode recriar índice único se já houver mais de um vínculo ativo por avatar. Nesse estado, conter interfaces e usar versão compatível; jamais excluir vínculos para tornar o rollback possível. Ensaio deve provar essa recusa.
6. CI no SHA exato, Preview TEST, fluxo normal de criação/seleção/recarga e negações reais com sessão autorizada, seguido de comparação de dados/estruturas. Fixtures não substituem essas provas.

Admin inicial PROD não foi designado pelo usuário.010A.1 permanece TEST-only. Nenhum gate produtivo é dispensado por este contrato; não iniciar DDL/merge/deploy produtivo enquanto faltar configuração autorizada e homologação completa do incremento.
