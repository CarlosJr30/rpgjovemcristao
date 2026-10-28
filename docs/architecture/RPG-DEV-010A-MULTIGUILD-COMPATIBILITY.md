# 010A.2 — contrato de compatibilidade para múltiplas Guildas

28/10/2026. **Preparação técnica; não implementada ou publicada.** A fundação010A.1 não remove o índice de uma Guilda ativa nem transforma Admin em líder. As definições remotas atuais de15 interfaces pertinentes foram separadas para revisão privada, preservando as respectivas ACLs. Nenhuma alteração remota nesta preparação.

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
