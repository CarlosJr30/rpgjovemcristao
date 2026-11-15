# GUILD-036 — Auth corrigido; pg_cron real TEST verificado

15/11/2026. Publicação BLOCKED por revisão formal de privacidade. Proprietário confirmou nesta execução que não existe responsável designado, parecer ou aprovação sobre desidentificação e menores. Não presumir aprovação nem pedir autorização rotineira de publicação novamente.

## Correção e validação

Sexta operação 20261115170001 corrigida; cinco fontes anteriores preservadas. deleteUser é irreversível. Login e recuperação normal de senha de conta existente não mudam marcador/liderança. O trigger COMMUNITY não restaura Auth, marcador ou líder e não bloqueia genericamente deleted_at→NULL. Não guarda ponte de recuperação. Ao receber exclusão abrangida, congela liderança e executa desidentificação na mesma transação, pois a finalidade de recuperação não existe. Só obrigação legal específica documentada conserva marcador. Falha da limpeza aborta a operação, sem confirmar exclusão parcial. Outros FKs podem impedir hard-delete; não foram removidos.

O helper privado sweep exige current_user postgres/scope e ACL privada; o trigger Auth SECURITY DEFINER pode chamá-lo sem conceder EXECUTE ao serviço Auth ou jogador. Validado também com SESSION AUTHORIZATION de serviço sintético distinto. Não associa conta nova por email/dispositivo nem reconstrói identidade. Auditoria não abrangida, Guildas, membros e convites preservados. Não alegar anonimização integral.

21 testes locais direcionados PASS, 14 checks do pacote conjunto PASS, 12 preflight PASS. Sem repetição das suítes gerais locais. Nova falha do script de adaptação de testes foi corrigida antes de executar; nenhum resultado dessa tentativa contado PASS. Hash/manifesto/preflight atualizados, manifesto blocked/migrations=[]. A versão da sexta operação é mantida porque nunca foi aplicada remotamente.

## Execução real pg_cron1.6.4

Projeto exclusivamente TEST wkdvdzfkbwvhyjmamrsg/scope hero-equipment-006. Confirmados 1.6.4 disponível e preload pg_cron; extensão instalada com autorização GUILD-036. Probe isolado guild036_probe sem dados pessoais ou consultas/escritas nas tabelas da aplicação. Jobs1/2 executados autonomamente por postgres no banco postgres, comando fixo, a cada minuto. authenticated sem USAGE/EXECUTE nos probes.

- Primeiro tick efetivo 17:07:00Z: heartbeat e consumo da linha sintética.
- Falha injetada executada 17:09:00Z: rollback preservou uma linha, heartbeat NULL, contador de falhas1. job_run_details marcou succeeded porque a exceção foi tratada: saúde da aplicação é check indispensável.
- Job principal pausado; watchdog executou 17:11:00Z e registrou alert=true/enabled=false sem identificadores.
- Job reativado sem falha: execuções17:13/17:14Z restauraram heartbeat e payloadRows0, sem reabrir a flag de contenção.
- Remoção confirmada: zero jobs de probe e schema inexistente. Extensão1.6.4 e auditoria job_run_details preservadas. Operações TEST registradas: 20261115170653 criação, 20261115171038 monitor e 20261115171458 remoção. Nenhuma migration COMMUNITY instalada no TEST ou PROD.

Evidência: packages/database/deployments/community043b/guild036-cron-test-evidence.json. É prova de worker/contrato/isolamento de probe no serviço TEST, não smoke de criação de Guilda nem execução da autoridade PROD.

## Operação e privacidade

Monitoramento preparado: tick+watchdog privados por minuto; monitor_status() entrega só heartbeat, horários/SQLSTATE, contagem de pendências/eliminações e disponibilidade. Watchdog fecha criação quando o job para/saúde falha e emite WARNING. Responsável operacional de referência: proprietário/operador do projeto Carlos; precisa observar Dashboard/Postgres logs e monitor_status por canal independente do navegador dos jogadores. Não foi enviada mensagem externa nem criada credencial. Indisponibilidade do worker também interrompe o watchdog: não prometer alerta externo autônomo ou prazo durante outage. Novas exclusões são desidentificadas transacionalmente ou falham, sem deixar uma janela fictícia de recuperação; cron é contingência para backlog/revisão legal. Após incidente: corrigir causa, executar sweep/tick privado, conferir contagens/ausência de vínculos abrangidos e saúde; só depois reativar por CAS autorizado. Não apagar histórico.

Encaminhamento de privacidade preparado, não enviado: finalidade/minimização HMAC; teto30dias sem retenção sem finalidade; Auth irreversível; desidentificação limitada de autoria/eventos e outros históricos/cópias; menores, transparência e direitos; retenções legais documentadas; falhas e resposta operacional. Responsável competente e fundamento/parecer não existem ainda, conforme resposta do proprietário. Esse requisito impede liberar manifesto, aplicar PROD, integrar PR55 ou ativar. CI final deve referir-se ao novo SHA, não ao ae57e15 anterior.
