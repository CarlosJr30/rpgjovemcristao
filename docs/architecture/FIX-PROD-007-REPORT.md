# FIX-PROD-007 — Avatar, Torre e publicação

Data: 24/10/2026. Estado geral: **BLOCKED para produção**. Aprovação da composição 3 recebida explicitamente; o estado pendente registrado no relatório006 é histórico e foi superado somente para esta couraça/corpo.

## Preparação e preservação

Lidos política de release, contexto/memória, relatório006, workflow/regras/segurança e perfis necessários. Base documental006 `60c5c85b353cdc73161d69b6ac3fb0da111d2254`; branch nova `codex/fix-prod-007` no checkout físico reutilizado `C:/Users/carlo/rpg-worktrees/fix-prod-005`. Branch006 e seus resultados, demais worktrees e alterações da raiz preservados. Conferência inicial remota: main `5edc93f5857b26a59b183e8abfb963110831f90c`,006 `60c5c85`; nenhum reset ou limpeza.

## Situação por item

| Item | Classificação | Evidência / limite |
| --- | --- | --- |
| Couraça, composição3 | DONE na implementação/local | Mesmo PNG, corpo exato aprovado, translateX−2.5%,scaleX1.05,origem superior esquerda; sem alterar outros itens. |
| Quatro composições anteriores | DONE | Registro original intacto, geometrias e hashes preservados; gate reconhece4PNGs/5composições. |
| Equipar/desequipar, atributos e recarga | DONE nos cenários locais executados | Componente real com fixture sintética, sem servidor/dados de jogador; desktopChromium1440/WebKit390. Equipamentos em API real serão classificados abaixo. |
| Troca por outro item do mesmo slot | BLOCKED | Catálogo homologado possui apenas um item por slot; rejeição de item não homologado continua correta. Não inventar aquisição/catálogo para passar. |
| Demais equipamentos no corpo alvo | BLOCKED | Sem aprovação visual específica; nenhuma ativação adicional. |
| Torre2–7/campeão/sequência/persistência | DONE em isolamento | Evidência006 válida e fontes do motor/fixture/testes/migrations inalteradas. Não são vitórias hospedadas. |
| Recompensas transacionais/idempotência | DONE em isolamento | Evidência006 preservada;36PG007 finaisPASS, incluindo autoridade/Auth/RLS e liquidação/rollback. |
| Economia16XP/6moedas | BLOCKED | Nova consulta produtiva confirma diferença e ausência de evento canônico comprobatório; nenhuma alteração de saldo. |
| Teste Chat A/liderança | BLOCKED | Identidade cadastral conferida; sessão autenticada inacessível por falha de kernelassets. Nenhuma promoção ou auditoria fictícia. |
| Celular físico | BLOCKED para esse cenário | Não disponível; WebKit390 é emulação. |
| GitHub/CI | DONE | Candidato `23f95ae02a332665405e63951e4dcb80a72061a9`, CI40098578298 success, job120885866134. |
| Preview | DONE nos cenários executados | READY no SHA23f95ae;18API/12navegadorPASS, sem mutações de jogo. Couraça no corpo alvo foi validada no componente real local; sessão desse jogador permanece inacessível. |
| Produção | BLOCKED | Sem promoção; gates econômicos/identidade e demais testes obrigatórios ainda impedem release. |

## Correção visual e arquivos

`equipmentBodyFitV3.ts` mantém exatamente as quatro entradas originais e exporta aprovação adicional vinculada a `female_long_blue_dark_hd.png`. `equipmentAssets.ts` seleciona a nova composição apenas para o item/gênero/corpo exatos, preservando posse, slot, aprovação e qualidade. Propaga o escopo selecionado à camada para evitar que o filtro de fallback compare com o corpo antigo. `avatar-runtime.tsx` aplica a transformação aprovada à camada completa responsiva, sem modificar a base ou PNG. Sem a couraça equipada/possuída não há camada; falha de imagem HD remove a composição antes do fallback.

Aprovação registrada em `FIX-PROD-007-HUMAN-COMPOSITION-APPROVAL.json`, com declaração literal do usuário e hashes de corpo/overlay. O gate `scripts/equipment-body-fit-v3-production-gate.mjs` conserva integralmente os checks das quatro aprovações anteriores e acrescenta a quinta composição vinculada ao registro novo. Nenhum rascunho imagegen006 foi ativado. Testes em `equipment-body-fit-v3.test.tsx` cobrem identidades permitidas/negadas, quatro geometrias antigas, nova transformação, posse/slot, atributos, recarga sintética e falha de decode.

## Torre e economia

Não repetir trabalho concluído: reutilizados os10PG determinísticos006 e `deterministic-floors.json`, pois `git diff cc64a52 HEAD` nos arquivos de motor/autoridade, migrations e fixture não contém mudança executável. Duas bases PostgreSQL17 descartáveis sem rede venceram1–7 legitimamente por comandos do motor, mesma seed offline e estados completos iguais exceto battleId. Rodadas2/1/1/2/2/2/3, dois campeões, progressão/persistência em nova conexão e sete claims únicos por réplica. Cada uma recebe somente na simulação430XP/215moedas/um baú épico fechado. Derrota/política falsa/replay/concorrência protegidos. Nenhum winner, progresso ou saldo hospedado foi forçado. Vitórias positivas hospedadas2–7/campeão continuam BLOCKED; os testes reais de leitura não as substituem.

Nova execução da consulta006 de reconciliação somente SELECT em produção: todos os cinco checkpoints de compra conferem1000269/1000089/999909/999729/999549. Última operação com recibo15/10/2026 19:52:08.117475Z, saldo esperado1006259, atual1006265;XP esperado245000, atual245016. Batalhas/claimsGuilda/eventosJornada/operaçõesJornada/EBD do alvo:zero. Logs antigos005 não possuem payload/recibo canônico suficiente. Estado `BLOCKED_MISSING_EVENT_PROVENANCE`,economic_verified_atNULL. Não criar ajustes ou certificar origem por coincidência numérica. Os16/6 existentes no ambiente de testes não provam a origem produtiva.

Teste hospedado conserva0claims da Torre e política `enabled=false/approved_atNULL`; função `arena_authority_v3` mantém gen_random_bytes, sem seed20261024. Créditos não homologados continuam bloqueados. Nenhuma migration nova/aplicada/repetida. TESTwkdvdzfkbwvhyjmamrsg22migrations/última20261024032756;PRODwspafhlbtlpabypzymjo4/última20261023213654. A diferença de journal005 para arquivo local é conhecida; não reaplicar.

## Identidade e liderança

Alvo ativo `31b70059-deca-44c8-a6df-f21ea68b6e42`, UID `78729453-8e04-478c-96ae-d37cead1bc8c`,nível50,245016XP/1006265moedas,membro da Guilda `c9041d27-28ee-41fa-9ae4-59043ee15143`. Antigo `9b83ca7f-0154-4492-9ad3-1deedb7411f4`,nível1,0XP/0moedas,líder,avatar inativo,mesmoUID/Guilda; preservado. Consulta cadastral não prova getUser da sessão. Nova tentativa do navegador conectado retornou `failed to write kernel assets`; nenhum cookie/token foi extraído. Aplicação administrativa de liderança e teste Guilda/EBD do alvo continuam BLOCKED; nenhum service_role/privilégio global concedido.

## Qualidade e publicação

Testes locais007:10testes específicos do avatarPASS; suíte completa727PASS/66SKIP;lintPASS;TypeScriptPASS;buildPASS;protocolo25PASS.66opt-ins não contam como PASS. Gate de build:4assets aprovados/5composições, nenhum pendente publicado. Navegador local com componente real: dois viewportsPASS, imagens carregadas, geometria exata, atributos/equipar/desequipar/recarga,sem overflow/erros. Capturas inspecionadas. Harness local precisou tratar URLs CSS como externas e substituir process.env pela configuração vazia de navegador; problema somente do empacotador isolado, sem mudança de código produtivo para contornar teste.

Rodada PostgreSQL007 inicial:29PASS/7FAIL, várias expirações no limite padrão5s e uma comparação de estado após timeout. Evidência preservada em postgres-initial.json/log. **Reexecução integral com30s/caso emaxWorkers1:36PASS/0FAIL**, evidência postgres-final.json/log. Inclui28casos de autoridade/Auth/RLS/economia/Arena e8de liquidação da Torre, concorrência e rollback. Nenhum SQL/assertion foi enfraquecido; a comparação de estado passou na execução sequencial sem timeout.

[Candidato GitHub](https://github.com/CarlosJr30/rpgjovemcristao/commit/23f95ae02a332665405e63951e4dcb80a72061a9), [CI40098578298 aprovado](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40098578298). Job de Preview automático do workflow foi skipped pela regra de branches; publicação escopada via CLI após CI, sem bypass. Variáveis da branch007 apontam exclusivamente ao banco de testes. Conector Vercel já não dispunha do escopo; CLI autenticada limitada ao projeto foi usada. Nenhuma configuração produtiva alterada.

Security/QA pelo autor, sem alegação de revisão independente. Advisor produtivo registra14informaçõesRLS-sem-policy,20avisosRPC SECURITYDEFINER e proteção de senha vazada desativada; registros preexistentes não foram classificados automaticamente como nova vulnerabilidade nem como teste aprovado. [ReferênciaRLS](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [referênciaRPC](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Não abrir permissões para eliminar avisos. Nenhuma dependência nova ou alteração Auth/RLS/economia.

## Conferência final da Preview e dos dados

**[Preview007 READY](https://rpgjovemcristao-d8vdfpfdw-carlos-junior-s-projects.vercel.app)**, dpl_832W4mCPLH5Gi8swgFQqtQHnmGSC, SHA exato23f95ae02a332665405e63951e4dcb80a72061a9.18checksAPI reaisPASS: getUser das duas contas de teste autorizadas preexistentes, sete cartas possuídas, retomada idêntica das derrotas históricas, recibos0XP/0moedas/0baús, progresso2/1 preservado, carteiras6/0 e negações semAuth/acesso cruzado/injeção de valor ou homologação. Nenhum starter, batalha, comando de progresso, equipar/trocar hospedado ou concessão executado.

12checks de navegador reaisPASS em Chromium1440/WebKit390: login, rota de equipamentos, botas/atributos preexistentes, persistência após reload, cartas e ausência de overflow/erro. A primeira execução teve11checksPASS e erro de página no WebKit; diagnósticos posteriores identificaram requisições antecipadas RSC com `due to access control checks` durante navegações completas do harness. O ajuste foi aguardar networkidle antes de trocar/recarregar rotas. A execução final teve12PASS/0FAIL e listas de erros vazias nos dois navegadores, sem suprimir erros, mockar respostas ou alterar o aplicativo. Isso indica interferência da navegação do harness nas requisições pendentes; não demonstra defeito de Auth/RLS do jogo. Rodadas iniciais e diagnóstico preservados em browser-initial.json,browser-second.json,browser-diagnostic.json ewebkit-errors-diagnostic.json. Nenhum teste inicial falho foi contado como PASS.

Equipar/desequipar no corpo aprovado e posição visual foram testados somente com fixture local do componente real, dois viewports; a Preview confirma os fluxos reais de leitura descritos, sem fabricar inventário nesse corpo ou alegar acesso à sessão de Teste Chat A. Troca entre itens distintos e celular físico não executados, BLOCKED nesses cenários. Simulação local não substitui evidência hospedada.

Hashes de travelers (excluindo apenas updated_at),wallets,inventory,chests,receipts,battles,equipment,stats conferem integralmente antes/depois dos testes hospedados:matchtrue.0claimsTorre/políticafalse preservados. Nenhuma migration executada, nenhuma alteração de jogo ou promoção de liderança. Configuração e Auth/RLS não foram desativadas.

Evidências privadas: `build/fix-prod-007/` contém logs unit/lint/typecheck/build/protocol,avatar-browser.json/capturas,postgres-initial/postgres-final,candidato/CI/Preview,preview-checks/process,browser e diagnóstico,game-data-before/game-data-preservation,reconciliation,migrations-test/prod,tower-policy,production-before/final. Resultados006 originais preservados. Revisão de diff/whitespace e ausência de secrets aprovadas pelo autor. Fechamento documental posterior não exige novo deploy artificial.

Produção reconferida remotamente ao final: **5edc93f / READY**, dpl_H9aXo2mnhWvk2PD6BwQowpxeaiVv, [URL produtiva](https://rpgjovemcristao-web-inky.vercel.app); GitHubmain no mesmo SHA. PRODstável:20Viajantes/37inventário/37recibos/0batalhas/245376XP/1006767moedas e0tabelas públicas semRLS. Alvo e antigo preservados. Sem release007 em produção, sem testes autenticados produtivos da versão007 e sem DEPLOY_COMPLETE.

Para desbloquear produção: comprovar proveniência16/6 e concluir homologação econômica/catálogo; disponibilizar sessão autenticada utilizável e processo administrativo auditado do alvo; concluir validações de equipamentos pendentes com itens homologados/adquiridos legitimamente e aprovações visuais específicas. Não liberar créditos nem modificar dados reais para substituir essas evidências. Teste físico somente quando aparelho disponível; emulação não equivale a execução física.
