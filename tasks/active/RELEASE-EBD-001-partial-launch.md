# RELEASE-EBD-001 — Lançamento inicial de Guilda e EBD
ID: RELEASE-EBD-001
STATUS: BLOCKED
PRIORITY: P1
OBJECTIVE: Publicar Auth/avatar/Guilda/EBD com isolamento efetivo de combate,economia,cartas e História.
SCOPE: Frontend e navegação,rotas/API,Auth/recuperação,repositórios; migration aditiva de isolamento/ACL/RLS e integração EBD sem créditos; testes unitários/PG/browser/API; GitHub/CI,TEST/Preview e produção somente após gates. Usuário autoriza explicitamente o runtime e release parcial; bloqueios dos módulos excluídos não impedem release se isolados.
OUT_OF_SCOPE: Apagar dados/código,reset,concessões econômicas,elevação automática de líderes,ativar módulos excluídos ou alterar permissões globais do jogador.
ASSIGNED_AGENT: Principal assumindo Backend/Frontend/Database/QA/Security/DevOps;sem subagentes ou revisão independente.
DEPENDENCIES: RELEASE_POLICY.md,FIX-PROD-008-REPORT.md,basea2a3aef,produção5edc93f;validar dependências e fluxos Auth com contas autorizadas.
ACCEPTANCE_CRITERIA:
- Cadastro/login/logout/recuperação e criação/seleção de avatar funcionam com autenticação real.
- Guilda/QR/entrada/aprovação/papéis/EBD/aulas/atividades/quiz/agenda/presença/histórico validados com isolamento entre Guildas.
- Rotas e chamadas diretas de módulos excluídos bloqueadas no app e banco;dados preservados,Auth/RLS/autoridade mantidos.
- CI do SHA exato,backup/recuperação,migrations somente necessárias,PreviewREADY/fluxos reais e produçãoREADY conferidos;gate obrigatório não executado é BLOCKED.
TEST_PLAN: Mapa de dependências/ACL/RLS;PG isolado e restauração;contas de testes autorizadas;API/browserdesktop/móvel;unit/lint/types/build/CI;comparação de dados e migrations antes/depois;conferência remota.
SECURITY_CONSIDERATIONS: Sem leitura de perfis/cookies;secrets somente armazenamento apropriado;menor privilégio e bloqueios no servidor,SQL e UI;evitar grants/novas recompensas inclusive em EBD.
DEFINITION_OF_DONE: Gates acima comprovados,docs/architecture/RELEASE-EBD-001-REPORT.md e memória atualizados. Falha crítica mantém produção intacta.

VALIDATION_2026_10_24: Runtime23391b5/CI40121574829success;756unitPASS74SKIP,8PGPASS,14browserlocalPASS,75APIrealPASS,35browserreal6403416PASS,25smokefinalPASS,6AuthcadastroPASS;lint/types/build/protocolo25PASS. QA/Security pelo autor,sem revisão independente. Duas migrations somente TEST,41hashes preservados por DDL,restauração estruturalPGPASS. AuthTESTURLcorrigida pelo CLI em somente2campos;confirmação/MFA/limites preservados.
BLOCKER: Recuperação completa ainda sem PASS: pedido normal429over_email_send_rate_limit; tentativa de callback anterior parou na proteçãoVercel. Harness privado corrigido,sintaxePASS,fluxo positivo com novo token não executado. Celular físico indisponível,emulação claramente distinguida. Sem merge/migration/deployPROD.
ACCEPTANCE_CHECK: BLOCKED. Produção/main5edc93fREADYintactos;Preview23391b5READY. Reabrir execução quando novo e-mail normal for aceito e validar senha/login/avatarantes dos gates produtivos. Relatório docs/architecture/RELEASE-EBD-001-REPORT.md.

RECHECK_2026_10_24_1610_BRT: Novo pedidoUI429over_email_send_rate_limit;sem alterar URLs/limites,sem novo callback/senha/login. CIa1cee13push40124054032/PR40124057714success. Compatibilidade recorteGuildaEBD:273colunas37políticasiguais24funçõespresentes;11diferençasapenasfimdelinha,2substituiçõesintencionaisrelease,0divergênciasfuncionaisinesperadas. Leitura CLI/probe negativoPROD confirmamSiteURL/redirects apontandoPreview:novoBLOCKED independente do429,sem escrita/origem atribuída. Plano dos6gatesrestantes detalhado no relatório;produção/main5edc93fREADY,Preview23391b5READY. QA/Security pelo autor;sem runtime/migration nova/testes aprovados repetidos.

AUTH_PROD_AUTHORIZATION_2026_10_24: Usuário autoriza corrigir exclusivamenteSiteURL/RedirectURLsPROD após confirmarprojeto/domínio/plano;preservarlegítimos/excluirTEST,semcontas/senhas/quotas/tokens,semmerge/deploy. DestinoPRODwspafhlbtlpabypzymjo,TESTwkdvdzfkbwvhyjmamrsg separado;origemHTTPS200TLSVercelverified https://rpgjovemcristao-web-inky.vercel.app. Snapshot/doiscampos/plano privado build/release-ebd-001/auth-prod-fix-20261024. EstadoBLOCKED de release não impede esta correçãoAuth explicitamente autorizada;demaisgates mantidos.

AUTH_PROD_RESULT_2026_10_24: DONEconfiguraçãoautorizada:SiteURLorigemoficial e redirects/auth,/auth/recoversomentePROD;zerooutroslegítimosna lista anterior,doisTESTremovidos. CLIpush0;diffremoto0updates/7camposnãodeclaradosiguais;TESTURLsinalteradas. Hashauth.users9linhas e baseline20avatares245376XP1006767moedas37inventárioiguais. Probesinválidos303confirmamdestinoPRODe rejeiçãodePreview,nãoprovaAuthpositiva. ÚniconovopedidoTEST429;sem senhas/contas/quotas/tokens alterados. Sem merge/migration/deploy;aplicaçãoPROD5edc93fREADY. ReleaseBLOCKEDpelarecuperação completa/gatesposteriores,restrição vigente preserva senhas. QA/Security pelo autor;relatórioatualizado/evidênciasauth-prod-fix-20261024.
