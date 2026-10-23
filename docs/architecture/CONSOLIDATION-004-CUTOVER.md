# CONSOLIDATION-004 — cutover local e proposta de revisão0078

Proposta LOCAL de 2026-10-20. Não aprova operação remota ou revisão silenciosa da TASK-0078. Seu contrato original e checkout4b63c905d26132f42d84be26e19eda76f9166a23 permanecem intactos.

## Diferença precisa em relação à0078

1. Reusar **verbatim**0009 do checkout0078 como proposals/consolidation004-expand0078.sql, após os13SQL revisados002. Mesmo ledger economy_private.battles, wallet, inventory, chest_operations e guild_reward_claims. Não aplicar0010 na sequência: o CONTRACT desta proposta é consolidation004-authority.sql. Os caminhos são alternativas de rollout, não migrations cumulativas intercambiáveis.
2. Protocolo2/transcrição integral passa a protocolo3/rodada persistida com CAS. O novo servidor não chama economy_authority legado; EXECUTE revogado inclusive service_role. Contexto/preços/XP8/moedas3/limite3porNPC/diaUTC e bônus10ao cruzar200XP reaproveitados. Motor/IA/NPCs/fórmulas não mudam.
3. Nenhum checkpoint browser migra para journeys/recompensa validada. Legacy XP/wallet/stats/inventory/equipped/journey_progress/recibos permanecem sem alteração. economic_verified_at=NULL exige reconciliação revisada antes de iniciar combate/comprar/abrir baú. Novos Travelers criados pela alocação fixa existente recebem marca no servidor. Não preencher essa coluna automaticamente em legado.
4. Cliente só salva campos cosméticos. Jornada antiga permanece local e sem crédito online; compras/trocas de equipamentos antigas pausadas explicitamente. API de excluir Traveler suspensa para preservar recibos/identidade. Guilda/EBD usam seus comandos0082/0083, mantendo aprovação/permissões e recompensa pendente. Story continua individual com gates0081, sem crédito novo.
5. Baús mantêm loot/RNG/preços existentes, sob lock do Traveler e receipt estável; exigem reconciliação e conta não anônima. A assinatura claim_chest_reward antiga fica revogada e consumidor mostra pausa. Animação só apresenta recibo confirmado; v1 continua compatível e operações novas têm tipo próprio/chest_typeNULL, excluídas dos filtros de aberturas.
6. Inventário recebe provenance de carta por FK ao ledger existente; catálogo privado vazio, versionado e com referência de aprovação. Somente starter autorizado é fonte implementada. Fontes futuras (baú/missão/jornada) continuam bloqueadas; nenhuma conversão de equipamento. Revogação é operação administrativa sem endpoint browser, preserva item/recibo original e registra motivo/recibo novo.
7. Starter uma vez por AuthUID/programa arena-starter-v1, não por Traveler, requestId ou revisão de catálogo. account_id e identity_key no ledger conservam vínculo. Exclusão de Traveler não é permitida ao cliente. Não se promete identificar uma pessoa que cria novas identidades Auth; eventual política anti-múltiplas-contas requer contrato próprio. Reabrir sessão/Traveler da mesma conta não concede novamente.

## Ordem e disponibilidade

Somente banco descartável nesta tarefa: baseline002 congelado → EXPAND0078 importado → CONTRACT004 transacional. Não registrar no Drizzle como aplicado nem editar lock002/journal. Ambientes com0010 já aplicado exigem plano distinto de compatibilidade, não reaplicação cega.

Antes de rollout futuro: identificar novo ref/host isolado; comparar históricos e hashes; revisar backupB1/restauração/janela/dreno; revisar reconciliação de origem dos valores legados; implantar cliente/protocolo3 compatíveis; executar SQL autorizado na janela; comprovar ACL/Auth/PostgREST e testes entre contas/dispositivos. Nenhuma chave/env remota é lida ou configurada aqui. Ausência de chave ou protocolo3 produz503, nunca fallback premiável.

Cada alteração de protocolo exige par cliente/servidor/schema compatível. Publicar cliente novo em banco antigo deixa APIs oficiais indisponíveis e economia antiga pausada: comportamento explícito, ainda inadequado para promoção pública sem janela coordenada. Não ligar a release policy geral durante este pedido sem remoto.

## Contratos por domínio

| Domínio | Prova / chave | Concessão e recuperação |
| --- | --- | --- |
| Arena treino | Auth/owner, catálogo/receipt, snapshot do DB, NPC fixo, engine por rodada; battleUUID |8XP/3moedas,3vitórias/NPC/Traveler/diaUTC; recibo battle:UUID na mesma transação da última rodada. Consultar batalha após timeout, sem reenviar resultado |
| Torre permanente | Auth/owner + vitória canônica por permanent-v1/andar/batalha |Andar seguinte só após vitória; derrota não avança. XP/moedas/baú/conquista bloqueados até regra homologada; recibo registra resultado e prêmio blocked |
| Starter | catálogo homologado7ações distintas, AuthUID/programa estável |7itens no inventário + recibo único na mesma transação; conta trava concessões simultâneas entre Travelers. Repetir retorna o mesmo recibo |
| Baús | Pilha existente autorizada, preço/loot server-side; Traveler+open/purchase:UUID |Locks antes da busca de duplicata, débito/pilha/loot/recibo atômicos. Consultar chest_operations antes de nova abertura após timeout |
| Guilda |Comandos0082, evidência e aprovação de líder diferente do autor |Approval persiste e não equivale a pagamento. guild_reward_claims antigo preservado; novo crédito bloqueado até contrato de liquidação por attempt/revision |
| EBD |Comandos0083, professor/escopo ativo, presença/resposta aprovada |guild_ebd_reward_pending preservado; sem executor genérico de crédito. Eventual liquidação deve chavear lesson/atividade/revisão/Traveler |
| História |step_receipts privados0081, conta/Traveler individual, conteúdo/revisão/gates |Sem prova econômica autorizada não completa/recompensa; nenhum requisito de Guilda introduzido |
| Jardim legado |Checkpoint browser sem autenticidade |Leitura preservada, concessão congelada. Não ligar journey-commit0078 até revisar transições e reconciliação separadamente |

## Falhas e recuperação

Falha antes do COMMIT reverte estado/consumo/XP/moedas/inventory/recibo juntos. Comando concorrente usa mesma revisão: um confirma, outro recebe conflito e deve consultar. Comando já aceito ou batalha encerrada nunca avança de novo. Consulta/resume/reload não liquida nem concede. Start requestId estável permite recuperar a mesma batalha; payload diferente com mesma chave é conflito. Uma batalha ativa por Traveler evita dupla sessão econômica. Batalhas antigas ficam armazenadas, sem conversão.

Após commit de schema problemático: colocar cliente em manutenção, preservar registros e investigar/forward-fix transacional. Não executar down destrutivo, apagar recibos ou restaurar grants antigos. SnapshotB1/restauração real/compensações exigem autorização e revisão próprias; testes desta tarefa não representam validação de backup real ou Auth remoto.
