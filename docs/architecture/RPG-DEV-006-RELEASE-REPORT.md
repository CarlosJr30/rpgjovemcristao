# RPG-DEV-006 — Publicação de Herói e equipamentos possuídos

26/10/2026. **BLOCKED para equipar/desequipar: falta caminho autorizado para a conferência positiva após o deploy em PROD.** Esse teste é posterior à implantação, não um requisito de teste positivo na versão antiga. Evidências TEST preservadas; segunda variante fora do escopo; alternativa mínima somente leitura descrita na seção final. Nenhuma migration, merge ou publicação produtiva nesta revisão.

Baseline reconfirmado: main/produção `1a82d2c058b40b37ae4ae79b82c085bb3488c02b`, deployment `dpl_CJFBMXjTKfm7nRt76FL8BLJLM87M`, READY. PR12 head `0da8facf04c1a5742ea5ac4ad406117de1850523`, CIpush40332648483/PR40332657990success. PreviewTEST runtime `816918e40cf06ae77b9ff442cb46460d1e7e25d5` READY e aplicativo idêntico ao head; somente testes/docs posteriores. Nenhum runtime novo é necessário para reduzir o escopo: RPC aceita somente os seis IDs existentes, um por slot.

Evidências existentes preservadas:806unitPASS86SKIP,29PGdistintosPASS,lint/types/build/protocolo25PASS;24RSC/134UI/48Guilda,4browserisolados,39API/duasrodadas199browser/162visuaishospedados/16hashesPASS. O teste sintético não homologa variante real. Nenhum desses resultados é apresentado como teste produtivo novo.

Gates desta execução: confirmar estado/CI/SHA/env; repetir API/Preview no escopo; Auth/getUser/RLS/propriedade reais em contas dedicadas PROD, sem criar itens; baseline agregado de dados e schema/ACLs; recuperação da única migration testada offline; aplicar somente006 emPROD; reter aliases antes do merge; aguardar CI do merge e deploymentprodutivo automático, sem build duplicado; validar staging com backendPROD; promover e verificar rotas/fluxos/data preservation; restaurar autoAssignCustomDomains. Falha crítica interrompe os passos seguintes e usa a recuperação aplicável.

TesteChatA/nível50 continua em leitura, sem usar o avatar antigo ou modificar equipamento/progresso. A identidade dessa conta por sessão cliente ficou indisponível anteriormente; Auth/RLS do sistema será validado com getUser, contas dedicadas existentes e negativas reais, sem tratar SQL administrativo como login. Nenhuma autorização para inventar itens, saldos ou recompensas PROD.

Migration necessária: `supabase/migrations/20261026122539_rpg_dev_006_owned_equipment.sql`, já aplicada TEST como20261026125946. Não aplicar migrations antigas de catálogo/Torre ou todas as pendências. Sem alteração de Auth/CORS/RLS; apenas RPCs privados/públicos revisados e marcador de escopo. Recuperação: restaurar a aplicação1a82d2c; revogar/remover somente o par owned instalado e restaurar release_scope anterior, preservando dados. QA/Security/DevOps pelo autor, sem independência ou teste físico alegados.

Resultados finais, commit de merge, migrations remotas, URLs e limitações serão registrados ao concluir os gates. Relatório inicial e falhas preservadas em RPG-DEV-006-REPORT.md e evidências adjacentes. Sem recursos pagos.

## Retomada no notebook

26/10/2026. **VALIDATING / aguardando autenticação real nas contas dedicadas. Não publicado.** A autorização permanece restrita a Herói, atributos, equipamentos já possuídos, equipar/desequipar e persistência; segunda variante oficial não é gate deste lançamento.

### Sincronização e preservação

- Repositório original encontrado na `main` local `8270e3d289889f7fa76b3849e7e4c69462845068`. `git fetch origin` concluído; `origin/main` atual em `1a82d2c058b40b37ae4ae79b82c085bb3488c02b`, 112 commits à frente dessa cópia local. Não houve pull ou checkout sobre as alterações existentes.
- Preservados 52 caminhos locais, incluindo exclusões e arquivos ainda não versionados, em backup privado no Git comum (`notebook-preservation-rpg-dev-006-20261026-141017`), com cópias conferidas por SHA256 e patches de worktree/index. Conferência posterior: 52 caminhos, zero divergências. Nenhum reset, clean, descarte ou force push.
- Criada worktree irmã `rpgjovemcristao-rpg-dev-006`, branch local `codex/rpg-dev-006` rastreando a remota. Último commit recuperado: `62f1eeea9d8599d5bb737743e4b1bf9774e28808` (`docs: authorize owned equipment release without variant swaps`), posterior ao `0da8fac` informado. PR12 aberta/draft/mergeable, sem merge.
- Aplicação, packages, migration e lockfile continuam equivalentes ao runtime da Preview `816918e40cf06ae77b9ff442cb46460d1e7e25d5`; a alteração posterior sob apps é somente teste PostgreSQL. Nenhuma funcionalidade foi recriada. Instalação local reproduzível por `npm ci`, preservando lockfile e `ignore-scripts=true`; Node24.20.0/npm11.19.0 atendem aos intervalos do projeto.

### Novas validações

| Gate | Resultado nesta retomada |
| --- | --- |
| CI do candidato62f1eee | Push [40350421261](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40350421261) e PR [40350428962](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40350428962) success. Ambos incluem qualidade e reprodução/contraste RSC. Job condicional de publicação de demonstração SKIP; não é deploy deste produto. |
| Unitários | **806 PASS /86 SKIP** na rodada com dois workers. Rodada inicial:804PASS/2FAIL por timeout de5000ms em editor de deck e verificação de áudio. Falha preservada; repetição integral sem alterar testes/timeouts passou. Não foi correção do produto. |
| Lint / TypeScript / build | PASS. Build valida nove PNGs/dez composições, oito hashes de áudio preservados e isolamento do artefato sem achados. |
| Protocolo de publicação |25/25 PASS. |
| Navegador isolado |4/4 PASS, Chromium desktop/WebKit móvel, configuração existente `playwright.rpg-dev-004.config.ts`; estado, composição aprovada, inventário, atributos e persistência. Não equivale a Auth/RLS hospedados. |
| PostgreSQL isolado |29 resultados anteriores reutilizados, mesma migration e mesmo código. Não reexecutados: este notebook não possui WSL nem a distribuição/Podman da fixture. Não instalar infraestrutura nem converter os86SKIP em PASS. |
| HTTP produção |11/11 respostas esperadas: `/`, Auth, Jornada, Herói, Guilda e EBD200; Equipamentos, Arena, Loja, Mochila e Coleção403 no baseline ainda publicado. Não comprova login nem operação autenticada. |
| TEST/PROD reais |Inspeções somente leitura de schema, migrations, ACLs, integridade e dados. Nenhuma escrita administrativa de teste. Repetição de API/navegador autenticados ainda pendente de login. |

Logs privados em `build/rpg-dev-006/notebook/`; nenhum estado de sessão, senha ou token foi versionado. `next-env.d.ts` gerado pelos comandos foi restaurado ao conteúdo/terminadores originais. QA/Security/DevOps pelo autor, sem independência ou aparelho físico alegados.

### Supabase e preservação

PROD `wspafhlbtlpabypzymjo` e TEST `wkdvdzfkbwvhyjmamrsg` ACTIVE_HEALTHY/protocolo3. PROD mantém seis migrations, escopo `guild-ebd-001`, funções owned ausentes. TEST mantém25 migrations e escopo `hero-equipment-006`; migration006 existente como `20261026125946/rpg_dev_006_owned_equipment`. **Nenhuma migration aplicada nesta retomada.**

Inspeção de permissões: wrapper público invoker, função interna definer com `search_path` vazio e EXECUTE somente authenticated em TEST; anon/service_role sem EXECUTE. Em ambos, anon/authenticated não possuem INSERT/UPDATE/DELETE diretos em inventory, equipped_items, wallets ou traveler_stats. Zero tabelas public/economy_private sem RLS, zero slots duplicados, zero seleções sem inventário legítimo. Estas são inspeções administrativas; não substituem os testes negativos pela sessão cliente.

Baselines agregados de38 conjuntos PROD e40 TEST, cobrindo tabelas public/economy_private e schemas privados da Guilda/história: antes/depois desta investigação, **38/38 PROD e40/40 TEST iguais em contagem e hash**. PROD continua com24 avatares/24 carteiras/37 registros de inventário/31 seleções. TEST12/12/18/4. Baseline privado em `build/rpg-dev-006/notebook/database-baseline.json`; não inclui passwords ou sessões Auth.

Teste Chat A reconfirmado somente por leitura administrativa: UID `78729453-8e04-478c-96ae-d37cead1bc8c`, avatar ativo `31b70059-deca-44c8-a6df-f21ea68b6e42`, nível50, XP245016, moedas1006265, `economic_verified_at=NULL`. Os seis IDs selecionados possuem inventário correspondente: medalhão6, couraça1, botas1, elmo4, escudo1, espada1. Avatar antigo preservado; nenhuma seleção, item, aparência, XP ou saldo dessa conta foi alterado. Identidade pela sessão autenticada particular continua indisponível; o delta16XP/6moedas permanece sem reconciliação.

Advisors mantêm os avisos existentes de funções Guilda definer e [proteção contra senhas vazadas desativada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), além de [RLS sem policy/negação padrão](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). Não foram alterados Auth/RLS/permissões para contornar gates.

### Vercel e gates ainda pendentes

Projeto e equipe conferidos: `prj_mG2ZSDaSc5i2Pz2uqKSlCzSGiVmG`, `team_FWD8MfZ9vARK8EBovoyTn9Ox`, raiz apps/web, Next.js/Node24.x, integração Git/main. O conector retornou403 para a equipe; usada CLI63.1.2 já autenticada no mesmo escopo, sem mudança das proteções. `autoAssignCustomDomains=true` preservado; nenhum alias retido/modificado antes dos gates.

Preview: https://rpgjovemcristao-ki24ajeu7-carlos-junior-s-projects.vercel.app — `dpl_4eEKvoZbhbHLeovGYeKBRBsz6x7g`, READY, gitSource/branch/SHA816918e confirmados. Ambiente da branch obtido em memória pelo comando oficial `vercel env run`, com backend TEST validado antes de abrir o navegador. Nenhuma variável foi modificada ou credencial impressa.

Produção: https://rpgjovemcristao-web-inky.vercel.app — `dpl_CJFBMXjTKfm7nRt76FL8BLJLM87M`, production/READY, baseline `1a82d2c`. Os dez scripts públicos carregados por Auth/Jornada foram inspecionados em memória: único host Supabase encontrado `wspafhlbtlpabypzymjo.supabase.co`, sem TEST. Herói/Guilda/EBD preservados; Equipamentos ainda bloqueado nesta versão. **Sem merge, migration ou deploy PROD006.** Não promover a Preview TEST.

Usuário escolheu autenticação manual em navegador local separado. Janela TEST aberta, sem uso do perfil pessoal ou arquivo persistido de sessão. Enquanto não houver login validado por `/auth/v1/user`, os ensaios reais permanecem pendentes. Contas dedicadas PROD também precisarão de acesso normal; não gerar magic links administrativos, redefinir senhas, criar itens ou usar a conta pessoal para suprir a fixture.

### Recuperação antes da migration PROD

Plano atualizado, **não executado**: reconfirmar SHA/CI/backend e capturar baseline imediatamente antes da alteração; guardar definições/ACLs originais de release_scope e ausência das duas funções owned. Baseline atual: release_scope SQL invoker/IMMUTABLE/search_path vazio retornando `guild-ebd-001`, EXECUTE postgres/anon/authenticated/service_role; MD5 da definição `5fa53382dafc3862552c2345b047e0ab`. Migration candidata exclusiva: `20261026122539_rpg_dev_006_owned_equipment.sql`, sem alterações em tabelas/dados/RLS.

Após todos os gates, aplicar somente essa migration em transação e conferir dados/ACLs. Em falha, interromper as etapas seguintes: manter/restaurar aplicação `1a82d2c`/deployment atual; conferir que as funções correspondem exatamente à006 antes de revogar/remover o wrapper público e a implementação privada; restaurar a definição/ACL original de release_scope e recarregar o schema PostgREST. Não restaurar tabelas, timestamps, saldos ou inventário para forçar igualdade. Revalidar hashes e negações. Os29 ensaios anteriores incluem recuperação dos dois baselines e são evidência reutilizada, não novo teste de recuperação neste notebook.

Próximo passo autorizado: autenticar contas dedicadas, repetir API/Preview e confirmar Auth/RLS reais; depois revisar preservação/recuperação, aplicar apenas006 PROD, seguir merge normal/CI do merge, build produtivo com backendPROD, READY/alias e testes reais pós-publicação. Qualquer gate crítico pendente impede esses passos. A ausência da segunda variante oficial permanece fora deste lançamento.

## Investigação do login TEST — orientação posterior

O usuário determinou continuar na PR12, investigar a falha de login, executar testes independentes e **não alterar produção** nesta etapa. Essa restrição suspende as etapas produtivas do plano acima. Registro da retomada enviado normalmente em `67960277fb4c647cd9343777a5b79297d60ee8f0`; CI push40369341535 e PR40369348632 concluídos com sucesso, incluindo qualidade e RSC. Sem novo artefato de aplicação ou deploy documental.

Causa confirmada pelo usuário: tentativa com a conta de produção na Preview conectada a TEST. Antes do novo cadastro, não havia em TEST o UID produtivo de Teste Chat A nem um usuário com o mesmo e-mail normalizado; comparação por fingerprint sem expor o endereço. TEST tinha cinco usuários próprios, todos confirmados, não anônimos e sem banimento ativo. O backend da Preview estava correto; nenhum reparo de CORS, chave, RLS ou código de senha foi necessário.

Logs Auth TEST entre17:10–17:35UTC registraram14 respostas400/`invalid_credentials` emPOST/token/password e uma resposta200 emPOST/recover. O identificador/referer desses logs não permite atribuir cada linha à conta individual; o diagnóstico combina ausência da identidade em TEST com a confirmação expressa do usuário sobre a conta tentada. O200 da recuperação não comprova existência de cadastro, coerente com a mensagem antienumeração do formulário. Não foram capturados passwords, tokens, cabeçalhos de autorização ou e-mails.

GET público `/auth/v1/settings` validado pelo ambiente da branch: HTTP200, provedor e-mail habilitado, cadastro permitido, confirmação de e-mail exigida, telefone/anônimo desabilitados. Usuário escolheu **Criar conta TEST pelo formulário**. Formulário normal aberto na Preview protegida; POST/signup200 observado sem registrar corpo. Novo UID TEST `575d92d9-2e5b-4fdc-8e02-3a4a096285a9`, distinto de PROD; criação e confirmação de e-mail verificadas somente por leitura. Nenhuma cópia de conta, hash de senha, token ou dados de produção; nenhum reset administrativo ou relaxamento de Auth. Usuário orientado a entrar com a nova senha no formulário de login e aguardar antes de criar herói.

Validação independente adicional: **24/24 testes de Auth/client/env/context/return PASS** em cinco arquivos, sem mudança de código ou timeout. Estes casos já fazem parte dos806 unitários integrais; não são830 casos distintos. A nova conta não autoriza conceder equipamentos ou modificar os demais jogadores.

Preservação após o cadastro manual:39/40 conjuntos de dados TEST continuam idênticos ao baseline desta retomada; a única diferença é `public.profiles`, de4 para5 linhas, pelo perfil do novo cadastro autorizado. Inventário, seleções, carteiras, atributos e viajantes anteriores mantêm os mesmos hashes; nenhum herói ou equipamento foi criado para suprir o ensaio. O38/38PROD e40/40TEST informado acima corresponde ao checkpoint anterior ao cadastro, não é uma alegação de TEST integralmente inalterado depois dele.

### Login concluído e aceite desta investigação

**AUTH_LOGIN_GATE PASS:13/13 verificações reais.** POST/token e GET/user200 observados pelo navegador; UID TEST575d92d9-2e5b-4fdc-8e02-3a4a096285a9 confirmado por `/auth/v1/user` com a sessão do cliente, não apenas por SELECT. Conta não anônima, e-mail confirmado, UID distinto de PROD. A aplicação reconhece a conta conectada e preserva a sessão após reload. WebKit390px reutiliza em memória a mesma sessão verificada e passa reconhecimento/reload; não é um segundo login por senha nem aparelho físico.

Leitura dos próprios viajantes permitida (zero registros). Inventário do viajante alheio real TEST não retorna linhas sob RLS; RPC de equipamento para esse viajante retorna403, sem alterar a seleção. Zero erros de página nos dois navegadores; nenhum viajante criado. Resultado sanitizado em [RPG-DEV-006-LOGIN-EVIDENCE.json](RPG-DEV-006-LOGIN-EVIDENCE.json); nenhum e-mail, senha, token, cookie ou estado exportado de sessão no artefato.

Conferência final após os testes reais:38/38datasetsPROD idênticos ao baseline desta retomada; emTEST39/40 idênticos, somente o novo perfil autorizado. Inventário, moedas, XP, atributos e seleções de todos os avatares anteriores preservados. Nenhuma migration aplicada, alias/proteção/variável modificada, merge ou deploy realizado. Nova conta TEST separada criada pelo usuário; não houve cópia de identidade ou credenciais PROD.

O bloqueio de login relatado está resolvido sem mudança do código de autenticação. **RPG-DEV-006 continua VALIDATING, não DONE/DEPLOY_COMPLETE**: a nova conta não possui avatar nem itens para repetir o fluxo positivo de Herói/Equipamentos; não usar os13 checks Auth como se fossem os39API/199browser/162composições anteriores. Esses resultados anteriores continuam distintos e reutilizáveis pelo runtime idêntico. Não conceder itens para preencher a fixture. Publicação permanece suspensa pela instrução posterior de não alterar produção, com PR12draft e produção1a82d2c preservadas.

## Continuação — herói, fixture e gate produtivo

O pedido seguinte retomou a publicação condicional após todos os gates, autorizou criar o herói TEST pelo fluxo normal e manteve a proibição de modificar Teste Chat A/outros jogadores PROD, inventar itens ou ampliar permissões. **CI final de f7755e759aae2a4d82b02b8e787ce64fe0f703d2 confirmado:** [push40372556555](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40372556555) e [PR40372565962](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40372565962) success, qualidade e RSC. Jobs condicionais de demonstração SKIP; não representam publicação deste RPG.

Herói `5558c6a7-2faf-4b6f-901f-bfc980c5c687`, da nova conta TEST `575d92d9-2e5b-4fdc-8e02-3a4a096285a9`, criado por formulário/RPC normal, nome Herói TEST Equipamentos. Conferidos nível1,XP0,moedas0,quatro atributos base1,zero inventory/zero equipped_items. A função efetiva create_traveler foi lida antes: cria somente traveler/stats/wallet; cadastro e criação não receberam equipamentos automáticos.

A sessão indicada como conta TEST existente era novamente a conta nova, sem itens. O usuário então autorizou expressamente **reutilizar a fixture temporária TEST neste herói**: seis IDs oficiais existentes,uma unidade de cada,preparação separada do cadastro,sem catálogo/permissões/saldos/PROD alterados. Seis UUIDs de inventory registrados, guardas de UID/avatar/XP/moedas/inventário vazio; a limpeza exige os mesmos UUIDs,quantidade1,marker da fixture e nenhuma seleção remanescente. Reaplicações controladas durante o rework usaram os mesmos UUIDs; cada rodada terminou com limpeza. Nenhum item foi oferecido como aquisição legítima/permanente.

| Nova evidência real TEST | Resultado e limites |
| --- | --- |
| API |16 checksPASS: itens possuídos,equipar/desequipar,retry de resposta perdida,concorrência de requests idênticos,PT409 com revisão obsoleta,ator alheio/slot errado/item desconhecido negados,escrita direta negada,estado/inventário/stats/wallet/progresso preservados. Não é troca entre duas variantes oficiais. |
| Navegador funcional |Seis slots×Chromium desktop/WebKit390px: equipar,atributos derivados corretos,reload,desequipar sem acúmulo.19assertionsfuncionais por navegador; não somar como novos testes unitários. |
| Visual compatível |Quatro composições: espada/couraça×Chromium/WebKit,baseHD1024×1536 e overlay decodificados,reload,remoção e atributos conferidos. [Capturas](../reviews/RPG-DEV-006/notebook). |
| Limites visuais preservados |Neste corpo male_short_moss_medium_hd,botas/elmo/escudo/medalhão informam camada indisponível. Esses quatro overlays não são declarados PASS visual; atributos/seleção/persistência passaram. Nenhuma nova arte ou composição forçada. |
| Pós-limpeza |7checksPASS:inventário/seleção vazios,Herói base1/reload,sem card/bônus residual,item oficial não possuído negado e5rotas403 (Arena,Torre,Loja,Mochila,Coleção). |
| Preservação |Zero UUIDs temporários residuais. Novo herói continua1/0XP/0moedas/base1/0itens/0seleções.38/38conjuntosPROD e40/40conjuntosdepreexistentesTEST idênticos ao checkpoint desta continuação,excluindo só as três novas linhas traveler/stats/wallet autorizadas. |

Inspeção visual encontrou capturas iniciais antes do carregamento da base. A nova rodada com assertion de5s também falhou no WebKit após persistência do elmo. FAILs preservados privadamente; a seleção restante foi removida pelo RPC normal antes da limpeza dos seis UUIDs. O coletor final espera `HTMLImageElement.decode`, com limite de30s para o recurso, em vez de capturar após apenas título/atributos. Decodificação observada4,1–4,6s; quatro capturas finais revisadas com base/camada presentes. Nenhum código de produto, timeout funcional, CORS, Auth, RLS ou erro de página foi alterado/suprimido para passar. Não é prova de performance Safari físico.

Evidência sanitizada: [RPG-DEV-006-CONTINUATION-EVIDENCE.json](RPG-DEV-006-CONTINUATION-EVIDENCE.json). Os806unitários,29PGisolados,39API/199browser/162composições históricos continuam evidências distintas; a suítePG não foi reexecutada no notebook sem WSL. Sem alterações de aplicação,packages,migration,lockfile,catálogo ou assets aprovados.

**Recuperação revisada antes de qualquer alteração produtiva:** PROD segue com6migrations,scopeguild-ebd-001/protocolo3,ambos ownedRPC ausentes e hash da definição release_scope `5fa53382dafc3862552c2345b047e0ab`, compatível com o braço ausente já verificado nos29PG anteriores. Migration candidata006 permanece idêntica ao runtime816918e e à aplicada TEST. Restaurar aplicação1a82d2c; remover somente wrapper/implementação owned006 depois de conferir suas definições; restaurar release_scope/ACL originais,recarregar schema e comparar hashes. Não regravar inventário,saldos,XP,atributos ou timestamps de jogadores. Snapshot/backup deverá ser renovado imediatamente antes da eventual aplicação; não foi necessária recuperação remota nesta etapa.

**Bloqueio restante de publicação:** usuário informou que há conta QA PROD,mas sem itens. Falta uma conta exclusiva de QA PROD com equipamentos legítimos e acesso normal para testar o fluxo positivo real após a publicação. TEST não equivale a esse gate. Não conceder itens emPROD,não operar Teste Chat A/outros jogadores,não relaxar permissões/nem declarar o fluxo positivo PASS com inventário vazio. Enquanto faltar essa condição,manter PR12draft,sem merge,migration ou deployprodutivo. Nenhuma migration foi aplicada nesta continuação; nenhuma variável,alias ou proteção foi alterada. A ausência da segunda variante continua fora do lançamento.

**Aceite: BLOCKED para publicação, não DONE/DEPLOY_COMPLETE.** QA/Security/DevOps pelo autor,sem independência ou teste físico alegados. Produção1a82d2c preservada; PreviewTEST816918e reutilizada,sem deployment artificial para documentos.

## Revisão da ordem dos gates e do menor escopo seguro

Revisão de 26/10/2026 solicitada após `4ece325`. CI final de 4ece325 aprovado em push 40380276568 e PR 40380283203 (qualidade e RSC); jobs condicionais de demonstração não equivalem a publicação do RPG. Esta seção substitui a interpretação anterior de que o teste positivo em PROD teria de ocorrer antes do deploy. Não altera o escopo aprovado nem dispensa verificações.

### Antes e depois da implantação

A [RELEASE_POLICY](../../.agent/RELEASE_POLICY.md) exige testes reais dos fluxos críticos na Preview antes da promoção (Vercel 3–4) e conferência de rotas/fluxos aplicáveis após a publicação (Vercel 5–6). Portanto, **o teste positivo em PROD é uma conferência após a implantação**, com recuperação preparada, e não uma pré-condição impossível de executar na versão antiga, que ainda bloqueia Equipamentos. As evidências positivas TEST já aprovadas são o gate anterior ao deploy. Não exigir segunda variante oficial nem repetir toda a matriz TEST em PROD.

| Momento | Evidência necessária | Estado |
| --- | --- | --- |
| Antes da migration | CI do candidato; Preview TEST e fluxos reais; RPC/ACL/Auth/RLS; compatibilidade e recuperação; ausência de regressão crítica | Evidências TEST preservadas; CI e auditoria desta revisão registrados no JSON abaixo. |
| Imediatamente antes da alteração PROD | Snapshot das definições/ACLs/ausência das funções, registro das migrations, baseline de dados e destino exato | Procedimento preparado; renovar somente se a publicação puder avançar. |
| Após migration, antes de seguir | Somente 006 aplicada em transação, scope/protocolo/ACLs corretos, RLS e dados preservados | Não executado; nenhuma migration aplicada nesta revisão. |
| Após deploy produtivo | READY/SHA/backend/alias; login normal QA; negativos Auth/RLS; um ciclo positivo com equipamento legítimo já possuído e preservação | Planejado, não executado. A conta QA PROD informada está sem itens. |

**Evidência exata ainda indisponível para concluir o lançamento de escrita:** sessão normal de conta QA PROD autorizada, com ao menos um equipamento legítimo já possuído, que permita demonstrar RPC real de equipar, atributos derivados, reload, desequipar e recuperação da seleção funcional original; sem mudar inventário, XP, moedas ou atributos base. Um único item existente em um slot basta para essa conferência mínima de integração produtiva; não é exigida segunda variante nem fixture produtiva de seis itens.

Isso não exige o resultado antes do deploy, mas exige que haja um caminho autorizado para produzir o resultado depois dele. No estado conhecido, não existe esse caminho: a QA PROD tem zero itens; Teste Chat A e outros jogadores estão protegidos; concessão, transferência ou criação de itens para fabricar o teste estão vedadas. SQL como postgres, chamada de desequipar já vazio, negação de item ausente e resultado TEST não comprovam o ciclo positivo produtivo. Publicar para deixar esse check obrigatório previsivelmente inexequível não satisfaz a política. **Mantido BLOCKED para o lançamento com mutação de equipamentos**, sem tratar a indisponibilidade como falha observada do produto.

### Revisão técnica e risco de regressão

- Migration exclusiva `20261026122539_rpg_dev_006_owned_equipment.sql`: não executar o conjunto de pendências. Exige baseline Guilda/EBD e protocolo 3; não concede itens nem altera tabelas, RLS, Auth, wallet, XP, atributos base ou catálogo. Dados de jogadores não são alvo do DDL.
- RPC: wrapper público INVOKER; implementação DEFINER no schema privado, search_path vazio, auth.uid obrigatório, conta não anônima e propriedade conferidas no servidor. Somente seis IDs oficiais existentes por slot, posse positiva sem card_receipt; locks conta→viajante→inventário/equipamento, replay idempotente, CAS/PT409 e trava de combate preservados. EXECUTE apenas authenticated; anon e service_role negados. Escrita direta econômica continua negada.
- Compatibilidade reconfirmada por leitura: ambos ambientes têm as mesmas dez colunas diretamente usadas nas duas tabelas e no vínculo de dono; PK por viajante/slot, FK para posse e enumeração de slots iguais, zero triggers de usuário em inventory/equipped_items. As colunas adicionais usadas no RPC já estavam incluídas na revisão anterior de 13 colunas.
- PROD: seis migrations, scope guild-ebd-001, protocolo 3 e ambas as funções owned ausentes. TEST: 25 migrations, scope hero-equipment-006, funções com os mesmos hashes revisados. Nenhuma tabela public/economy_private sem RLS; nenhuma seleção sem posse; escritas diretas inventory/equipped_items/traveler_stats/wallets negadas a anon/authenticated.
- Auth: os 13 checks reais TEST e regressões aprovadas continuam preservados; sessão SQL administrativa não é prova de login cliente PROD. Não modificar senha, claims, políticas ou proteção de deployment para concluir ensaio.
- Compositor: manter apenas camadas homologadas. Neste corpo, espada/couraça têm capturas aprovadas; botas/elmo/escudo/medalhão apresentam aviso de camada pendente e mantêm atributos confirmados. Não inventar arte, sobrepor camada de outro corpo nem declarar esses quatro overlays aprovados.
- Regressões residuais: deploy com backend incorreto, cache de schema do RPC, respostas atrasadas após troca de sessão, concorrência e leitura após RPC. TEST já cobre propriedade, CAS/retry e sessão; verificar backend/READY, negar ações indevidas e observar erros no pós-deploy continua necessário. Um rollback de código/DDL não desfaz legitimamente seleções feitas por jogadores.
- Advisors atuais: mesmos avisos de arquitetura existente (RLS ativa sem política nos acessos negados por padrão; funções DEFINER legadas da Guilda) e proteção de senhas vazadas desabilitada. Nenhum ajuste dessas áreas nesta entrega. Referências de [execução de DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [RLS sem política](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) e [senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Não são prova de novos privilégios ou de aprovação integral de segurança da plataforma.

**Recuperação:** manter aplicação atual 1a82d2c como destino de recuperação. Se a migration falhar, abortar a transação e não seguir. Se qualquer conferência após migration/deploy falhar, interromper o avanço e restaurar o aplicativo pelo fluxo normal; conferir hash/identidade antes de revogar/remover apenas o wrapper e a implementação 006 e restaurar definição/ACL original de release_scope, recarregando PostgREST. Não apagar migrations registradas nem reescrever tabelas/timestamps de jogadores para forçar igualdade; eventual compensação deve ser rastreável. A restauração de DDL/ACL nos baselines ausente/preparado foi exercitada nos 29 casos PostgreSQL anteriores; não se alega nova execução no notebook sem WSL. O snapshot de metadados é proporcional à migration sem DML, não um backup completo novo dos dados de jogadores.

Preservação reconfirmada nesta revisão: 38/38 conjuntos PROD e 40/40 TEST iguais ao checkpoint pós-fixture, excluídas somente as três linhas autorizadas do novo herói TEST. Herói TEST segue nível 1/XP 0/inventário e slots vazios. Nenhum teste positivo reexecutado, fixture reaplicada, secret coletado ou jogador PROD operado.

### Menor escopo seguro proposto

Alternativa concreta: **Herói e consulta dos equipamentos/atributos existentes, somente leitura**; ações de equipar/desequipar continuam indisponíveis, sem aplicar a migration 006 nem expor o owned RPC em PROD. Sem novas artes, catálogo ou permissões econômicas. Herói já está publicado na versão 1a82d2c; uma consulta adicional só se justifica se trouxer valor observável e tiver um candidato próprio revisado e validado. Isso não conclui nem pode ser anunciado como liberação de equipar/desequipar. Esta revisão apenas propõe a alternativa pedida; não modifica silenciosamente o candidato de escrita da PR #12.

Arena, Torre, Loja, Mochila, Coleção, Diário e demais recursos fora da allowlist atual continuam bloqueados. RPG-DEV-007 será preparado em branch própria, somente contrato/plano; não abrir suas rotas na PR #12.

Evidência atual: [RPG-DEV-006-GATE-REVIEW.json](RPG-DEV-006-GATE-REVIEW.json). Os arquivos de evidência TEST e as capturas anteriores permanecem intactos. QA/Security/Database/DevOps pelo autor, sem revisão independente alegada.
