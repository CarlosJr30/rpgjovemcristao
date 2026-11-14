# RPG-COMMUNITY-043A — matriz de permissões

**Proposta para aprovação; não representa grants ou policies implementadas.** A autorização sempre é verificada no servidor para o objeto e escopo solicitado. A UI e o papel enviado pelo cliente não concedem acesso.

## Invariantes

1. Identidade de sessão vem de Auth. Para ações que exigem avatar, o servidor confirma que `traveler_id` pertence à conta e está ativo.
2. Cada operação GUILD inclui o `guild_id` alvo. Cada operação EBD inclui `school_id` e, quando aplicável, `class_id`. Contexto salvo na interface não é autoridade.
3. Papéis global, Guilda, escola e turma são independentes. Nenhuma criação de Guilda concede Admin global ou papel EBD.
4. Privacidade padrão: conteúdo interno somente a participantes com vínculo ativo. Suspensão, saída, remoção e revogação têm efeito no próximo pedido, sem aguardar expiração de JWT.
5. `service_role` e funções privilegiadas não são APIs de cliente. RPC privilegiada fica privada, com identidade/ownership/escopo revalidado, ACL explícita e trilha minimizada.

## GUILD

| Ação | Visitante/anônimo | Membro | Moderador | Colíder | Líder | Admin global |
| --- | --- | --- | --- | --- | --- | --- |
| Consultar diretório público allowlisted | Negado | Permitido | Permitido | Permitido | Permitido | Por ferramenta separada/auditada |
| Ver detalhes/membros internos | Negado | Vínculo ativo, dados mínimos | Igual | Igual | Igual | Sem acesso implícito; ferramenta global auditada |
| Solicitar entrada/aceitar convite próprio | Negado | Permitido por Guilda alvo | Igual | Igual | Igual | Não herda poder local |
| Rever pedido/aceitar membro | Negado | Negado | Somente se permissão específica for aprovada | Conforme delegação aprovada | Sim, na própria Guilda | Somente fluxo global separado |
| Denunciar/atender denúncia | Negado | Pode denunciar e bloquear | Pode tratar fila local delimitada | Igual ou delegado | Sim, escopo local | Fluxo global com auditoria |
| Criar/editar missão | Negado | Participa; não define prêmio | Não por padrão | Conforme delegação aprovada | Sim, dentro de objetivos/tier permitidos | Não cria missão como líder por inferência |
| Aprovar conclusão/recompensa | Negado | Submete prova | Não por padrão | Somente função autorizada e prova permitida | Revisa somente conclusões não verificáveis | Não pode bypassar a autoridade ECONOMY-041 |
| Conceder recursos/alterar saldo | Negado | Negado | Negado | Negado | Negado | Apenas autoridade econômica já aprovada; nunca grant manual por papel |
| Atribuir/remover papéis locais | Negado | Negado | Negado | Papéis inferiores apenas se aprovado | Sim, dentro da própria Guilda; sem Admin global | Ferramenta independente; sem se tornar líder local |
| Transferir liderança/arquivar | Negado | Negado | Negado | Não por padrão | Sim, operação atômica e auditada | Somente processo administrativo separado |

**Estado atual:** papéis persistidos em `guild_members.role` incluem `leader`, `co_leader`, `moderator`, `member`; vínculo é único por `(guild_id, traveler_id)`. A migração multiguild removeu a unicidade global de Guilda ativa por avatar. A matrix acima é proposta e não homologa ações específicas atuais de cada papel.

## EBD independente

| Ação | Sem vínculo | Aluno | Professor designado | Responsável/gestor escolar | Líder de Guilda | Admin global |
| --- | --- | --- | --- | --- | --- | --- |
| Descobrir/solicitar escola | Dados públicos mínimos, se publicados | Igual | Igual | Igual | Sem acesso privilegiado | Ferramenta auditada |
| Criar escola/turma | Conta Auth elegível, sem avatar/Guilda | Não | Não por consequência do cargo | Sim se proprietário/responsável | Não por ser líder | Não vira responsável automaticamente |
| Matricular/gerir turma | Negado | Somente própria matrícula | Ações delegadas em turma designada | Sim no escopo próprio | Negado | Só ferramenta separada |
| Criar/publicar aula/atividade | Negado | Negado | Atribuição ativa e turma autorizada | Sim se responsabilidade permitir | Negado salvo papel EBD explícito | Não herda papel EBD |
| Responder quiz/ver própria devolutiva | Negado | Próprias respostas, no período e estado autorizados | Não lê respostas de outros sem finalidade aprovada | Leitura agregada mínima se aprovada | Negado | Somente suporte auditado |
| Corrigir resposta/marcar presença | Negado | Negado | Turma designada e ação registrada | Conforme delegação aprovada | Negado | Ferramenta separada |
| Ver lista/histórico de terceiros | Negado | Negado | Apenas alunos da turma e dados necessários | Somente escolas/turmas sob responsabilidade | Negado | Acesso mínimo auditado |
| Emitir XP/moedas/itens | Negado | Negado | Negado | Negado | Negado | Negado por este contrato |

Papéis EBD serão associados a contas Auth e, quando necessário, restringidos à turma. Não derivar papel escolar do papel Guilda, avatar, cargo global ou link GUILD–EBD. Professores atuais em `guild_ebd_teachers` continuam limitados à regra Guild-bound até mudança aprovada.

## Escrita, auditoria e abuso

- Aprovação de pedido, convite, mudança de papel e transferência usa operação server-side idempotente, escopo explícito e auditoria com payload minimizado.
- Revisão manual não transforma prova livre em evento econômico; tier e grant continuam sob ECONOMY-041. Membro, professor ou líder não escolhe XP, moedas, raridade ou quantidade.
- Convite contém token não enumerável, expiração, revogação, limite de uso e chave de replay. Listas nunca retornam token secreto.
- Diretório, pedidos e conteúdo privado não distinguem “não existe” de “existe mas não autorizado” por códigos/tempo de resposta exploráveis.
- Suspensão de líder/moderador revoga capacidades imediatamente. Remover um vínculo não remove vínculos em outras Guildas nem matrícula escolar independente.
- Controles de rate limit, denúncia, bloqueio e resposta a abuso precisam ser aprovados antes de diretório amplo; nenhum SLA é presumido aqui.

## Testes de autorização futuros

Para cada papel: ator próprio e alheio; Guilda/escola/turma alvo e outra; sessão revogada/troca de avatar; membership suspenso; replay concorrente; convidado expirado/revogado; Admin sem papel local; líder sem papel EBD; professor sem acesso a outra turma. Confirmar leitura e escrita por rota real, RPC, RLS e ACL. Estes cenários são gates futuros, não testes executados nesta entrega.
