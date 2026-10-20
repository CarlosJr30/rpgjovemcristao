# CONSOLIDATION-004 — revisão de segurança local

Autor assume QA e Security, sem revisão independente. Escopo: proposta SQL/protocolo3/serviço HTTP/cliente oficial/cutover legado. Não houve acesso a produção, operação remota, chaves, linhas reais, publicação ou concessão de propostas.

## Achado e correção

**P1 ECON-LEGACY reproduzido offline:** authenticated podia alterar XP, coins, stats, inventory e reivindicar baú de fase sem prova. Ensaio sintético aceitou XP99999/coins99999/itemfake/baú1, depois ROLLBACK. Identidade isolava contas, mas não a origem dos valores próprios.

CONTRACT004 revoga escritas de tabela **e ACLs de coluna**, inclusive ownership, exclusão, equipamento e histórico. Mantém SELECT com RLS e UPDATE cosmético. add_coins/spend_coins/claim_chest_reward/grant_traveler_chest e gateway antigo revogados; funções privadas antigas sem EXECUTE API. create_traveler mantém alocação fixa e auth.uid; chest usa lock/conta/ownership/reconciliação antes de operação antiga. Clientes retirados do envio de snapshots econômicos; adapters antigos negam sem rede. Aviso explícito de pausa na interface.

Correção é comprovável **no schema local com CONTRACT004 aplicado**. Arquivos pendentes0078, branches e produção não foram alterados; nenhum fechamento do risco remoto é alegado. Catálogo oficial permanece zero homologado e o SQL não inclui cartas. Banco sintético aprova somente IDs004-synthetic-card-* dentro da fixture descartável.

## Fronteiras

- HTTP aceita Bearer, verifica getUser no adapter de servidor e rejeita anônimos. Ownership é novamente conferido pelo SQL. IDs de usuário/papel não vêm do body. Payload tem chaves exatas, UUIDs, domínios e limite16KiB por stream; saída de erro genérica/no-store. Testes usam port de Auth sintético, não simulam aprovação de JWT hospedado.
- Credencial service_role exclusivamente em server-only/server.ts. Nenhum valor em fonte/env versionada/log. Client importa somente tipos do serviço. Backend só expõe collection/starter/start/command/resume/battle/tower; nenhum endpoint de setbalance/settle(won)/revogação administrativa. Nenhuma permissão especial se origina de user_metadata.
- Servidor lê contexto canônico, reconfirma igualdade sob lock e seleciona NPC/configuração estáveis. DB gera UUID/seed com pgcrypto. Congela catálogo/regras/equipamentos/atributos; TS usa o mesmo createArenaDeckBattle/resolveArenaCommand. Sem transcrição browser como prova. SQL de commit é service-only; não é avaliador do motor, confia no resultado do backend verificado.
- Locks por AuthUID depois Traveler em todas operaçõesv3; CAS/revisão, unicidade de sessão ativa, IDs de comando e recibo por batalha. A última rodada, consumo, XP, carteira, resultado e receipt são uma transação. Resultado terminado não aceita ação. GET lógico/resume não concede.
- Starter tranca conta; identity_key estável por AuthUID/programa, sete ações distintas de uma versão aprovada, provenance no inventário existente. Não considera quantity/metadata sem receipt e conta vinculados. Nova versão de catálogo não renova o programa. Revogação mantém item e história, exige motivo/reviewRef, registra receipt administrativo e bloqueia novas rodadas com coleção revogada.
- Legado tem economic_verified_atNULL; leituras preservadas, nenhum checkpoint/vitória local é convertido. Reconciliação deve validar origem e documentar mudanças antes de marca administrativa. Novas criações fixas têm marca no servidor. Não existe comando browser para preencher essa coluna.
- Tabelas novas/alteradas mantêm RLS; private sem SELECT direto; DEFINER search_path vazio e nomes qualificados. Sem SQL dinâmico com entrada do usuário. Schema/ACL reais do futuro alvo ainda precisam de inspeção: ensaio usa defaults restritivos.

## Matriz dos25riscos exigidos

| # | Risco | Evidência local |
| --- | --- | --- |
|1|XP direto|PG denies direct XP mutation|
|2|Moedas diretas|PG denies direct coins mutation|
|3|Baú livre|PG denies chests + legacy RPCs|
|4|Carta injetada|PG denies cards; coleção exige FK/receipt/account/catálogo|
|5|Outro usuário|PG ownership/leituras cruzadas/HTTP subject|
|6|Outro Traveler|PG traveler22 sem coleção e owner não alterável|
|7|RPC antiga|PG nega seis entradas públicas e EXECUTE privado indevido|
|8|Prêmio duplo|PG receipt único + comandos encerrados negados|
|9|Concorrência|PG sessões simultâneas starter/comandos/start/baús|
|10|Carta não possuída|PG start rejeita ID ausente|
|11|Deck inválido|PG seis/duplicado/IDs não possuídos|
|12|Carta usada|PG Medido único; consulta recupera USADA|
|13|Foco/nível|PG custo antes de Defender e Caminho abaixo do nível|
|14|Dano/vitória/seed|PG serviço rejeita chaves extras de início; boundary estrito de comando também não possui campos de resultado|
|15|Comando antigo|PG revisão/rodada/commandId repetidos não avançam|
|16|Encerrada|PG comando em resultado finished rejeitado|
|17|Pular andar|PG andar2antes1, andar1jáconcluído e andar8 negados|
|18|Derrota|PG derrota não avança/paga|
|19|Reload|PG consultas repetidas preservam recibo e saldos|
|20|Líder|PG autoaprovação negada, aprovação válida não liquida crédito pendente|
|21|Professor|PG aluno não concede próprio papel; gates0083 preservados|
|22|História|PG conta sem Guilda consulta conteúdo individual e não completa sem prova|
|23|Receipt privado|PG SELECT cruzado vazio + batalha privada negada|
|24|Leituras|PG mochila/cosméticos mantidos após revokes|
|25|Rollback|PG trigger falha após XP, sem saldo/round/receipt parcial; retry confirma|

Casos adicionais: starter com colisão reverte todos os itens/receipt, bônus antigo ao cruzar200XP, quota diária, revogação auditável, limiter HTTP e adapters sem rede. Logs finais e contagens no relatório; falhas iniciais de fixture não contam como PASS.

## Limites e bloqueios

Falta Supabase isolado, configuração/SQL/Auth/PostgREST reais autorizados, backupB1/reconciliação0078, homologação de catálogo/novas fontes/regras de prêmio da Torre, CI e fluxo entre aparelhos hospedados. Não há PvP, assinatura de save local ou antifraude contra administrador/comprometimento de credencial de servidor. Batalha congelada em rulesVersion incompatível ou coleção revogada fica bloqueada para revisão, preservada; não cancelar/compensar com grant genérico. Sem reset semanal nem política de identificar pessoas com contas Auth diferentes.

Risco residual da arquitetura: TSbackend é parte confiável e a chave de serviço autoriza persistir resultado; protegê-los e validar par schema/runtime em futura implantação é obrigatório. Correção local não substitui estes gates. Nenhuma proteção foi relaxada para obter testes verdes.
