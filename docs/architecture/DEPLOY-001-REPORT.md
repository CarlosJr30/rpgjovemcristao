# DEPLOY-001 — publicação isolada e CI por SHA

2026-10-20. Consolidação publicada exclusivamente no GitHub; nenhum deploy, SQL/configuração Supabase/Vercel, merge/main ou recurso pago. QA/Security pelo autor, sem independência. CI remoto novo é distinguido da evidência local006.

## 1. Branch local e remota

`codex/deploy-consolidated-001` local e `origin/codex/deploy-consolidated-001` remoto, checkout `D:/rpg-jovem-cristao/build/deploy-001/checkout`. Base006 limpa8a470d20558c993f5f954bbc6a67776c9f583823, recibo006 conferido, sem reconstrução/merge/cherry-pick. Snapshot32worktrees protege pendências/HEADs; main/checkouts anteriores preservados, memória raiz somente prefixada com bytes anteriores intactos.

## 2. SHA publicado e prova

Primeiro SHA publicado: `e6b0508852f0b5d10db0570538129fcb4259066e`, somente três documentosDEPLOY-001 sobre a base. [CI novo aprovado desse SHA](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/39534510529), tentativa1. Não há correção runtime ou de testes entre006 e esta publicação.

Este encerramento acrescenta apenas documentação. **O SHA documental final só recebe CI_APPROVED após sua própria execução do Actions**, nunca pelo resultado anterior. SHA completo final/run/job/status/URL e correspondência ls-remote ficam no recibo local `D:/rpg-jovem-cristao/build/deploy-001/final-receipt.json`; não criar commit recursivo só para inserir seu próprio hash. O recibo é evidência local ignorada, não credencial, e a página Actions identifica o SHA remoto exato.

## 3. Comparação com main e ancestralidade

Fetch apenas refs/heads/main→refs/audit/deploy-001-main, sem atualizar main/origin-main. Main remota consultada: `5508514828a455ccb0d1ee83d652c419e8643a49`;0commits exclusivos dela e38commits exclusivos da consolidação006,39após preparaçãoDEPLOY-001 e40após este encerramento documental. Main local0df878764f26f0501959031dd4aec4a77fb9308a e origin/main em cache preservadas. A diferença entre main local e remota já é ancestral da consolidação; nenhuma correção exclusiva faltante de segurança/UI/CI identificada.

Confirmados via merge-base --is-ancestor os17HEADs de0080–0089 e001–006/003A, incluindo commits documentais; também conferidas individualmente implementações0080–0089 e correção de segurança0080b71b205. Implementações001e9e74ee/00270aa7e1/003c165111/003Acd43a49/0041ce9523/005ac9db0d/006dcedd100 presentes. Relatórios anteriores preservados. Sem conflito, alteração não versionada ou pendência importada da raiz/0080/0078.

## 4. Workflows disparados e gates

Workflow existente `.github/workflows/quality.yml` / **RPG — qualidade do código**, evento push, branch isolada, SHA exato. Job quality executa checkout pinado, Node24.16.0/npm11.13.0, npmci, Vitest,25testes de protocoloCI, isolamento, lint, TypeScript e build. Nenhuma modificação no workflow ou no gatilho/scriptCLOUD-007.

Inventário GitHub enumera ainda preview-policy-check.yml e preview-readiness.yml históricos. Ambos paths estão ausentes da main/branch atual (tree e GET404); a execução observada por SHA é quality, não se presumem novos runs daqueles workflows. Nenhum PR/release/dispatch de deploy criado.

## 5. Links do Actions

[Run inicial39534510529](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/39534510529), [job quality119007928640](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/39534510529/job/119007928640). As URLs do encerramento são registradas no recibo após verificar a execução do novo SHA. A busca é restrita ao head_sha/branch/eventpush e valida os campos devolvidos, sem confundir CI de main, PR ou outro commit.

## 6. Resultado do CI

Primeira publicação **CI_APPROVED**, qualitysuccess e pinned-previewskipped, sem statuses/deployments associados. Gates individuais e logs foram inspecionados; não apenas a cor geral da execução. O gate do fechamento documental continua dependente de sua própria execução até o recibo final comprovar statuscompleted/conclusionsuccess e passos obrigatórios aprovados. Se isso falhar ou não for observável, manter BLOCKED/REWORK, sem inferir aprovação deste SHA.

## 7. Testes aprovados, limites e falhas

| Evidência | Resultado |
| --- | --- |
| Preflight novo, npm test -- --run local |687PASS,28PGopt-in ignorados;109arquivosPASS/1ignorado |
| Novo Actions inicial, mesmo comando |687PASS,28PGopt-in ignorados;109arquivosPASS/1ignorado |
| Protocolo de publicação local e Actions |25PASS/0falha/0skip; inclui invariantes de SHA/alvo/negação de publicação |
| Isolamento da demonstração |eligible=false, conteúdo consolidado não é demo elegível |
| Lint/TypeScript/build novos no Actions |Todos passos success; compile/gates Avatar e BodyFit,969artefatos/0achados/8hashes de áudio |
| Reuso local006 |111unit/component e21E2E, lint/tipos/build/segurança e visual já documentados; NÃO são nova execução E2E no Actions |

Sem defeito novo introduzido na consolidação reproduzido no CI inicial, sem teste desativado ou proteção relaxada.28PostgreSQL exigem RPG_LOCAL_PG=1 já antes deste pedido; não executados automaticamente no workflow existente. Evidência28PG004 é offline histórica, não aprovação do banco remoto. Unitários incluem componentes/integrações e negativas de Auth/autoridade/posse/Guilda/EBD; este workflow não executa Playwright ou teste hosted/físico. Logs e contagens finais do segundo run devem confirmar os mesmos gates no recibo.

Rework somente do script de auditoria local: tabela0080 usa hashes curtos e inclui correção de segurança; parser foi ajustado para resolver ambos via Git em vez de assumir duas entradas de40caracteres. Não é falha do produto ou do Actions.

## 8. Ausência de deploy automático

Quality sem secrets/deploy. pinned-preview exige branchpreview/* ou codex/pinned-preview-ci além de outros gates; a branch publicada não corresponde, mesmo se variável de habilitação estivesse true. Demo-isolationfalse é uma segunda negação. Vercel Git: apps/web/vercel.json idêntico à main, deploymentEnabled**false/maintrue. CLOUD-007 não alterada.

Observação inicial: job Previewskipped, listas de statuses e deployments do SHA vazias. Verificar novamente no SHA documental final. Nenhum endpoint Vercel/Supabase acionado; somente metadados Git/GitHub/Actions e push da branch autorizada. Não modificar configuração remota para fabricar o resultado.

## 9. Arquivos alterados e auditoria

Nenhum arquivo runtime/teste/workflow/dependência/asset/SQL/env alteradoDEPLOY-001. Apenas contrato próprio (active→completed após aceite do primeiro run, condicionado ao gate final), [parecer prepush](../security/DEPLOY-001-PREPUSH-SECURITY.md), [checklist/encaminhamento](DEPLOY-001-HANDOFF-CHECKLIST.md) e este relatório. O estado final, paths/hashes e preservação estão no scope-audit.json/recibo locais; a memória de controle raiz não integra push da branch raiz.

Auditoria do diff consolidado:335paths em relação à main,455blobs únicos novos de texto examinados incluindo versões intermediárias, nenhum padrão de segredo encontrado. .env.example continua vazio; nenhum novo asset, cache, backup de jogador, log/trace/recibo privado adicionado. Build histórico curado herdado da main preservado. Scan/gates006 complementam revisão de fixtures e mídias; sem alegação de auditoria universal ou dependências reavaliadas. [Parecer](../security/DEPLOY-001-PREPUSH-SECURITY.md).

## 10. Bloqueios restantes

CI aprovado não implica Preview, banco migrado ou jogo integral pronto. Supabase teste rpgjovemcristao-test/refwkdvdzfkbwvhyjmamrsg/sa-east-1 foi informado pelo usuário como criado e sem migrations; não foi consultado/configurado. Produção excluída. Permanecem migrações/ACL/Auth/RLS/protocolo3/reconciliação e JWTs reais; Vercelteste/env/HTTPS/origem/CI-SHA-deployment; editorial/vídeo/provaStory, cartas/posse e áudio homologados; ações/recompensas ainda pausadas e testes entre aparelhos.

## 11. Checklist atualizado

Pré-push/ancestralidade/integridade/ausência de deploy e primeiro CI completos. Encerramento final somente quando branch remota/HEAD/checkout limpo corresponderem ao novo run aprovado.32worktrees prévios/main/pendências preservados, bytes de memória anteriores intactos. [ChecklistDEPLOY-001 e DEPLOY-002–005](DEPLOY-001-HANDOFF-CHECKLIST.md) distingue etapas concluídas de encaminhamento não executado.

## 12. Próxima etapa

Depois de CI_APPROVED do fechamento: preparar e obter escopo próprioDEPLOY-002 para o Supabase de testes já informado, revisar alvo/hashes/ordem/backup/recuperação e só executar alterações autorizadas. SeguemDEPLOY-003Vercelteste,004físico e005produção em contratos separados. Não antecipar SQL, env, deploy ou merge a partir deste resultado. URL de Actions/branch não é URL jogável.
