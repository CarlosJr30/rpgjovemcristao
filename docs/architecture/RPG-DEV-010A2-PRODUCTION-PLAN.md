# 010A.2 — preparação produtiva e recuperação

## Execução concluída — 29/10/2026

**DONE/DEPLOY_COMPLETE do escopo publicado**,conforme [relatório](RPG-DEV-010A-REPORT.md)/[evidência](RPG-DEV-010A2-RELEASE-EVIDENCE.json). Aprovação expressa da proposta010A-PROD-ADMIN-20261029 recebida antes da concessão. Preflight/snapshot renovados,27API prégrant/28pósgrantPASS;somente duas migrationsPRODpróprias93830/93912 aplicadas (arquivos82857/82907).44tabelas/145funções/39policies;38conjuntos anteriores intactos. UmAdmin ativo4perms+um evento de auditoria,sem liderança automática.

PR19merge994fe9d/CI40852856242success,GitdeploymentexistenteBdKmqu1JYDH845BKoGH1qXiQTsTeREADY/production/backendPROD. Domínio retido008C durante62UI/12anon/5checks ativação;apósgates,promovido mesmoartefato econfirmados62UI+28API+17HTTP oficiais/38PROD49TESTpreservados. AutoAssigntrue/SSOoriginal restaurados. GestãoativadaporDMLprotegido controletrue/rev2,sem migration extraou permissões econômicas. Nenhum reset,compensação destrutiva ou criação de dados produtivos para testes.

**Não reaplicar a fundação/bootstrap.** Existe estado emitido: grant/auditoria. Recuperação futura aplicável é contenção preservadora e aplicação compatível com vínculos multiguild,sem remover dados/histórico ou restaurar cegamente o índice global. Os26PG isolados validam os dois caminhos,masnão se executouDROP/restore como testePROD. Plano e propostas anteriores abaixo são registros da sequência autorizada, não nova autorização para repetir a concessão.

## Pacote produtivo independente — 29/10/2026

Guard final validado no pacote `7abca21dfa5c29973a1e768d17767af00a45a27b`, CIpush40847640704/PR40847651864 success:927unit/74SKIP,132PGisolados/qualidade/RSC/protocolo25. Previewjm1pteqzt/dpl_Bm3vxkPmmBM8R2M5DcPajEk2JMm8 READY/TEST/SHAexato,52checks reais finais PASS,49TEST38PROD iguais. O conector atribui a versão remota automaticamente; segundo arquivo confere nome exato `rpg_dev_010a_governance_production`, nove registros e39 definições/ACLs/donos, sem supor timestamp remoto.26PG do pacote aceitam versão atribuída e recusam nome alheio. Versões locais82857/82907 permanecem não aplicadas; mapear versões remotas e hashes quando executadas, sem renomear/apagar histórico. Este fechamento supersede f606 abaixo. Proposta administrativa continua não aprovada.

**PREPARADO / aplicação PROD BLOCKED.** Homologação multiguild TEST concluída com dois logins normais, mantendo falhas e limites no relatório. Não há concessão Admin PROD autorizada. O novo pacote e o ensaio abaixo substituem os bloqueios históricos de geração descritos ao final; nenhum arquivo TEST-only será aplicado em produção.

| Ordem | Artefato próprio | Condição |
| --- | --- | --- |
|1|`20261029082857_rpg_dev_010a_governance_production.sql`|Owner SQL, Auth sem sujeito, scope PROD/protocolo3, oito migrations e baseline de 100 funções/ACLs/donos conferidos. Cria fundação vazia; não chama bootstrap.|
|2|`20261029082907_rpg_dev_010a2_multiguild_production.sql`|Fundação produtiva vazia registrada, nove migrations, 39 definições/ACLs/donos esperados; adapta interfaces conjuntamente. Escritas começam contidas.|
|3|`rpg-dev-010a-production-bootstrap.sql`|Template protegido, **não autorizado**. Exige aprovação humana explícita, UID/avatar ativos verificados novamente, motivo/referência e nonce. Só quatro permissões propostas; não concede liderança.|
|4|`rpg-dev-010a-production-activate.sql`|Template posterior ao CI/READY/SHA exatos, segurança e Admin aprovado; valida hashes finais corrigidos e mantém economia bloqueada. Execução deve ser rastreada/versionada.|

As duas migrations foram criadas pela CLI2.122.0 e revisadas como arquivos próprios: novos guards correspondem ao baseline produtivo renovado, sem importar arquivos TEST-only durante execução. As rotinas de negócio preservam a implementação homologada; 68 definições/ACLs instaladas são iguais às finais TEST, incluindo workspace VOLATILE e oito PT409 desde a instalação inicial. Das 145 funções resultantes no ensaio, 77 produtivas anteriores permanecem exatas. Não importar009, Equipamentos ou toda a fila de migrations. Nenhum UID, e-mail ou bootstrap executável está embutido nas migrations.

Ensaio reproduzível: `node tests/hosted/rpg-dev-010a-production-postgres.mjs`, **25 checks PASS**, PostgreSQL17.10 em loopback com contas/dados sintéticos. Valida guardas de ambiente/history/ACL, fundação e compatibilidade, zero Admin implícito mesmo com líder nível50, RLS/negações, paridade das 68 funções, preservação dos grants/policies/tabelas anteriores, recuperação exata e contenção depois de múltiplos vínculos. Integra o job PostgreSQL do CI. Não é prova hospedada PROD.

O primeiro ensaio detectou que dez corpos legados PROD retêm CRLF, enquanto o baseline TEST usava LF. Guards e recuperação agora usam as definições PROD reais, sem normalizar seu hash. JSON com escapes explícitos preserva esses bytes na restauração. Erros anteriores de contrato do coletor (`memberships` versus `guilds`, assinatura econômica e tipo ACL) foram corrigidos após inspeção, sem relaxar a proteção; execuções interrompidas não são PASS. Clusters/logs privados foram preservados e encerrados.

### Preflight e designação ainda pendentes

- Dados:38 conjuntos PROD idênticos ao baseline008C, inclusive após login e consultas preliminares;49 TEST iguais ao fechamento multiguild. Estrutura PROD100 funções/38 tabelas/39 policies, oito migrations, schema administrativo ausente. Snapshot renovado privado; repetir imediatamente antes de qualquer DDL.
- Vercel:008C/c14fd5e, `dpl_8Pi4mXQUCaMcirqq5kLpXZdH9sRk`, READY/production/alias oficial; autoAssign=true e proteção original mantidos.
- Identidade: candidato existente identificado por login normal apenas para proposta. A sessão anterior retornou403, “Session from session_id claim in JWT does not exist”, sem token expirado; falha preservada. Após novo login normal na janela limpa, **19 checks PROD somente leitura PASS**: Auth confirmado, avatar ativo50, leituras próprias, cinco conjuntos alheios e avatar invisíveis, anonimato e cinco rotas bloqueadas. Um POST preexistente de perfil próprio ignore-duplicates, zero escrita inesperada;38 hashes e estrutura novamente idênticos depois. Sem reset administrativo, sessão copiada, avatar antigo selecionado ou grant.
- Aprovação: após restabelecer e conferir a identidade, apresentar ao proprietário uma proposta fixada ao UID dessa sessão, com `admins.manage`, `leadership.manage`, `guilds.read`, `audit.read`. Explicar que permite gerenciar administradores, autorizar líderes e consultar resumo/auditoria; não concede liderança de uma comunidade ou acesso a dados de jogo alheios. O login e o nível50 não autorizam essa concessão.
- CI do pacote `f606e5a`: push40845009558/PR40845018213 success,927unit/74SKIP,131PG/qualidade/protocolo25/RSC PASS. Preview `jtnhfa1sy`,dpl_CJ1ykwWfCFyxmjxdmrCdta3x5T1m READY/SHAexato/TEST,52 checks reais finais Chromium/WebKit PASS;24profileignoredups/30RPCleitura,zeroerros/escritasinesperadas e49TEST/38PROD iguais. Primeira rota legada incorreta do coletor preservada como falha, não convertida em PASS. CI df9/203regressões e positivos multiguild preservados, árvore runtime idêntica. [Proposta administrativa separada](RPG-DEV-010A-PROD-ADMIN-PROPOSAL.md) ainda não aprovada.

### Sequência produtiva condicionada

1. Fechar CI exato, revisão QA/Security e sessão normal atual; obter aprovação explícita da concessão proposta. A política permanente já autoriza publicação após gates; essa aprovação é de privilégio, exigida pelo item6 do usuário, não uma confirmação rotineira de deploy.
2. Renovar baseline/snapshot, confirmar migrations8 e todos os grants/negações/recuperação. Aplicar somente os dois arquivos PROD aprovados em transações separadas. Na falha, parar e registrar estado real.
3. Conferir zero Admin inicial, Auth/RLS/ACL, leitura compatível dos vínculos existentes e hashes. Bootstrap somente do UID aprovado, com nonce/referência, preservando auditoria. Não criar Guildas/aulas/membros produtivos para fabricar testes.
4. Seguir PR/merge normal e deployment Git existente retido, com domínio008C preservado durante validação. Revalidar backend PROD/READY/SHA, consultas/escopos existentes, regressões e negações; só então considerar ativação protegida. Não promover Preview TEST.
5. Promover o mesmo artefato quando os gates passarem, restaurar configuração original, conferir domínio/READY/SHA/backend e repetir verificações após publicação. Não declarar DEPLOY_COMPLETE antes disso.

### Recuperação própria, sem apagar vínculos

- Falha só na fundação vazia: `rpg-dev-010a-production-foundation-recovery-empty.sql`, em transação. Recusa se compatibilidade instalada ou se grants/auditoria/convites já existem.
- Pacote completo ainda vazio: `rpg-dev-010a-production-recovery-empty.sql`, em transação; recusa qualquer grant/auditoria/revogação ou múltiplos vínculos ativos. Restaura exatamente definições/ACLs/índice anteriores, sem apagar dados de jogadores ou histórico de migrations. Uma compensação remota deve ter registro próprio.
- Depois de bootstrap, convites, auditoria ou múltiplos vínculos: **rollback destrutivo recusado**. `rpg-dev-010a-production-containment.sql` usa o mesmo lock das escritas e desliga somente gestão; mantém leituras, seleção, vínculos/aulas/auditoria e dados de jogo. Usar aplicação compatível com multiguild; não restaurar cegamente o cliente antigo/índice global.

Nenhum desses templates foi executado em PROD. Publicação, DDL, bootstrap e ativação permanecem bloqueados enquanto faltar gate crítico. QA/Security pelo autor, sem revisão independente. Sem010B obrigatório, economia, recurso pago ou alterações nas PR12/18.

## Histórico anterior — checkpoints superados somente onde explicitado acima

28/10/2026. **Plano, não migration aprovada. PROD preservada em008C.** A homologação TEST com dois logins distintos não foi concluída. O usuário designou Administração Geral somente TEST; nenhum UID PROD foi designado. Esses gates impedem preparar/aplicar DDL produtiva definitiva ou integrar a PR19. Não reutilizar migrations TEST-only alterando apenas o guard de ambiente.

## Antes de qualquer DDL produtiva

Retomada29/10: segunda identidade TEST criada/confirmada/autenticada normalmente e baseline renovado; criação de duas Guildas passou. A homologação ainda não terminou: workspace EBD falhou405/25006 no wrapperSTABLE. Ajuste adicional TEST-only20261029063610 em validação. Nenhum pacote PROD será gerado/aplicado antes de retestar essa fronteira e os fluxos restantes. A classificação VOLATILE apenas alinha POST às rotinas existentes que adquirem locks; não concede DML, poderes econômicos ou acesso de outro ator.

Recuperação deste ajuste TEST: transação e guardas de definição/ambiente antes do ALTER, comparações de corpo/ACL/dono/search_path e probe de restauração estrutural em subtransação. Se o preflight divergir, interromper sem aplicar. Depois de vínculos emitidos, nunca executar recuperação vazia010A.2 ou recriar o índice global; preservar todos os dados. Para falha posterior de segurança, usar contenção já preparada de comandos e, se necessário, negar EXECUTE apenas do novo wrapper escopado, com compensação versionada/rastreável. Restaurar STABLE repõe a falha conhecida e serve só ao ensaio estrutural isolado, não como alegação de recuperação funcional. PROD008C não depende desse wrapper ausente em produção e permanece intacta.

1. Concluir os fluxos positivos e negativos hospedados com duas identidades Auth TEST distintas: múltiplas Guildas, membros/professores, convites/revogação, saída/remoção, seleção/recarga, concorrência/idempotência e regressões. Preservar também todas as falhas e baselines anteriores.
2. Confirmar designação administrativa produtiva explícita e identidade por login normal, além das operações produtivas legítimas autorizadas para conferência. A autorização histórica de consulta de Teste Chat A não concede gestão administrativa ou criação de comunidades para fabricar testes.
3. Conferir main/PR19/SHA e CI, projeto/raiz/ambiente Vercel, backend PROD, migrations e compatibilidade com a aplicação publicada. Renovar snapshot de funções/ACLs/RLS/policies/defaults/índices e dados, com hashes/contagens antes de executar qualquer alteração.
4. Somente após homologação completa, gerar migrations produtivas próprias e versionadas pela CLI: fundação protegida compatível com o baseline PROD real, sem grant inicial inferido; depois compatibilidade multiguild com guardas específicas, permissões mínimas e escrita inicialmente contida. Ensaiar esse pacote e sua recuperação sobre PostgreSQL isolado correspondente ao baseline PROD.
5. Não importar SQL009/Equipamentos/PR12/18 ou migrations remotas TEST não pertencentes ao pacote. Não remover o índice de uma Guilda isoladamente. Não conceder DML geral, poderes econômicos ou contorno de RLS.

## Implantação futura, condicionada aos gates

Manter o domínio no artefato008C durante DDL compatível e build Git retido. A escrita nova permanece contida até a versão que entende Guilda explícita estar READY e os testes autorizados de Auth/RLS/consulta/configuração aprovados. A ativação deve ser explícita, auditada e posterior aos gates, sem fabricar Guildas, membros, aulas ou recompensas produtivos.

Conferir o mesmo artefato após promoção: READY/SHA/backend/alias, Guilda e EBD próprias, troca/recarga de contexto, negações entre usuários, regressões dos módulos publicados, hashes de dados e estruturas. Conferência de abertura posterior ao deploy não substitui a homologação positiva obrigatória em TEST nem a configuração administrativa autorizada antes da implantação.

## Recuperação sem perda de vínculos

- **Estado ainda compatível com unicidade:** compensação específica pode restaurar definições/ACLs/índice anteriores somente depois de provar ausência de múltiplos vínculos e de registros novos que seriam descartados. Preservar fundação, grants, convites e auditorias emitidas. Não apagar histórico de migrations.
- **Estado com múltiplos vínculos ou auditoria nova:** recusar rollback destrutivo. Conter comandos pelo controle privado após o mesmo lock usado pelas escritas; conservar leituras/seleção e usar aplicação compatível com múltiplos vínculos. Não excluir participações ou reativar cegamente a unicidade para acomodar uma aplicação antiga.
- **Falha de segurança/compatibilidade:** interromper promoção. Registrar estado real, compensação rastreável e nova verificação. Restaurar dados de jogadores ou apagar progresso não é procedimento de teste.

Os ensaios TEST/isolados de recuperação vazia e contenção estão aprovados, mas não provam este futuro pacote produtivo ainda não gerado. Não declarar PROD_READY, DONE ou DEPLOY_COMPLETE. Não há novo recurso pago, DDL, merge, deploy, concessão ou alteração produtiva neste plano.

Nota ao histórico: o pacote próprio já foi gerado e seu ensaio independente está no fechamento superior. O harness usa somente uma tabela sintética de histórico local para repetir cenários; nenhuma remoção de histórico é autorizada em PROD. Após uma compensação real, preparar nova versão com baseline/histórico renovados, sem reaplicar cegamente estas versões ou apagar registros para fazer o guard aceitar.
