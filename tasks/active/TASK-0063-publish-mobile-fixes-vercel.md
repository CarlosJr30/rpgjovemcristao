# TASK-0063 — Publicar correções mobile no Vercel

ID: TASK-0063
TITLE: Publicar correções mobile verificadas da TASK-0062 no projeto Vercel existente
OBJECTIVE: Commit, push normal e publicação efetivamente verificada, condicionados aos gates de segurança, QA e build.
PRIORITY: P1 High
STATUS: VALIDATING
SCOPE: Auditoria Git/produção, seleção do diff0062, testes, documentação/checklist/memória; commit `fix: improve mobile RPG experience`, push origin/main e deploy somente após todos os gates PASS. Projeto existente prj_mG2ZSDaSc5i2Pz2uqKSlCzSGiVmG; domínio rpgjovemcristao-web-inky.vercel.app. Autorização explícita do usuário nesta solicitação substitui os limites documentais da fundação apenas nesse escopo.
OUT_OF_SCOPE: Force push/reset/rebase/descarte; novos projetos; Supabase/banco/migrations; licenças presumidas, aprovação Body-Fit, ativação V2, geração/alteração de assets ou gameplay; publicação de arquivos privados ou áudios restritos.
DEPENDENCIES: TASK-0062 DONE local; áudio restrito excluído fisicamente da distribuição no rework. Gate comercial TASK-0042 continua não atendido para eventual áudio de produção, sem impedir release que o exclui. Acesso efetivo ao projeto/configuração atual confirmado por CLI63.1.2. Alterações locais da TASK-0059 são independentes e não foram staged/publicadas.
ASSIGNED_AGENT: Codex, assumindo localmente os perfis DevOps/QA/Security, revisão pelo autor sem independência.
REQUIRED_CONTEXT: .agent/GLOBAL_CONTEXT.md; .agent/memory/CURRENT_STATE.md; WORKFLOW/RULES/SECURITY; relatório0062; TASK-0042; manifests/receipts audiovisuais; configuração Next; projeto/deployment Vercel existentes.
SECURITY_CONSIDERATIONS: Achado inicial de distribuição física de SunoFree corrigido por relocação para fonte privada, gates e prova física/HTTP. Receipts/licenças preservadas; ambiente privado excluído do plano. Nenhum valor real de ambiente exibido; nenhuma escrita em serviço externo.
ACCEPTANCE_CRITERIA:
- Gates de licença/exclusão física, privacidade, isolamento DEV/Body-Fit, testes, lint, typecheck e build PASS antes de commit/push/deploy.
- Somente diff mobile verificado e documentação pertinente, sem trabalho0059 misturado.
- Remoto sem divergência, projeto existente/configuração confirmados, publicação READY do hash novo e smoke publicado mobile/desktop comprovados.
TEST_PLAN:
- Auditar manifests/hashes e arquivos servidos diretamente no build de produção, antes dos gates de release.
- Se PASS, executar testes relevantes0062/lint/typecheck/build; revisar index/secrets e remoto; publicar e testar Home/Jornada/login/Equipamentos/Arena sem alterar Supabase real.
DEFINITION_OF_DONE:
- Todos os critérios satisfeitos, deployment novo verificado, relatório/checklist/memória atualizados. Somente então DEPLOY_COMPLETE/DONE.

## Retomada de publicação — 2026-10-10

Gates repetidos aceitos:unit56/12 arquivos, lint/typecheck/build e build do snapshot staged sem.env PASS;209 arquivospublic/723 artefato/8SHA/54HD PASS; oitoURLs404. DEV5 distintos e produção33 distintos/5skips após dois followups sequenciais PASS. Erros de JSON/target do navegador nas primeiras execuções preservados no relatório, sem modificação do runtime ou relaxamento dos testes. Index133 caminhos/zero achados;16 registros de trabalho excluído preservados. Commit/push/deploy aguardam somente revisão final e execução autorizada; nãoDONE até READY e verificação publicada.

O usuário autorizou novamente commit, push normal e deploy após gates, informando CLI63.1.2 autenticado. Consulta real pelo CLI confirmou projeto prj_mG2ZSDaSc5i2Pz2uqKSlCzSGiVmG, equipe carlos-junior-s-projects, root apps/web, framework nextjs, Node24.x, linkGitHub CarlosJr30/rpgjovemcristao e productionBranch main. git fetch origin PASS; HEAD/origin/main204ba56fc8b0ded2a4d99310818094210ddbbea2, divergência0/0. Bloqueio de acesso anterior resolvido pelo CLI; conector permanece independente. Gates de release solicitados novamente, seleção de dependências e inspeção staged/snapshot em execução. Nenhum commit/push/deploy executado neste checkpoint. Revisão por autor, sem independência. Não gerar deploy duplicado caso o push inicie integraçãoGit.

## Histórico — rework local aceito, publicação bloqueada em 2026-10-10

SELF_VALIDATE/QA/SECURITY: PASS no escopo local, pelo autor sem independência. Oito originais relocados byte a byte para assets-source/arena-audio-prototype; gate público209 arquivos e artefato723 arquivos sem achados; oito URLs antigas404. DEV5 casos distintos PASS, encerramento automático1 followup PASS; produção33 casos distintos aceitos após followup/5 skips planejados; unit73 distintos/12 arquivos. Lint/typecheck/build PASS;54 HD e estado Body-Fit preservados. Falhas/reworks intermediários e limitações registrados no relatório e rework-qa-summary.json, sem inventar execução única limpa.

ACCEPTANCE_CHECK: parcial. Nenhum commit/push/deploy; index vazio; main/HEAD/origin/main e consulta fresca GitHub204ba56fc8b0ded2a4d99310818094210ddbbea2. Plano revisável release-plan.json exclui trabalho0059 e arquivos privados. Atualizações de memória/checklist locais; tarefa permanece emactive/BLOCKED, nãoDONE.

BLOCKER: consultas detalhadas get_project e list_deployment_files sob team_FWD8MfZ9vARK8EBovoyTn9Ox continuamHTTP403 mesmo após reconexão confirmada pelo usuário; CLI Vercel autenticado indisponível. Root Directory/configuração atual de productionBranch e artefato remoto não comprovados. Push suspenso pois pode iniciar deploy automático com configuração incerta.

UNBLOCK_CONDITION_CURRENT: acesso efetivo pelo conector/CLI à equipe carlos-junior-s-projects e ao projeto existente prj_mG2ZSDaSc5i2Pz2uqKSlCzSGiVmG; confirmar configuração/ambiente, revisar index/remoto antes do commit/push normal, acompanhar READY do novo hash e validar publicação/artefatos/URLs. Não solicitar ou expor tokens. Build local fictício QA não pode ser enviado comoprebuilt de produção. Não repetir testes comprovados sem alteração que os invalide. Fontes/receipts continuam não comerciais; nenhuma autorização humana Body-Fit inferida.

## Histórico — evidência e bloqueio de 2026-10-09, notebook

Auditoria HTTP registrada em 2026-10-10T00:59:49.590Z (2026-10-09, America/Sao_Paulo): oito arquivos de áudio rastreados retornam200/audio/ogg; SHA256 dos bytes servidos iguais aos originais e às receipts; licença SUNO_FREE_NON_COMMERCIAL, commercialProductionApproved=false em todos. Security FAIL. Catálogos APPROVED_MUSIC/EFFECTS vazios e guarda DEV existentes não impedem acesso direto aos arquivos public. Quatro rotas DEV/galerias/fontes privadas retornam404.

Servidor temporário loopback3163 iniciado com o build de produção já comprovado da0062, BUILD_ID8Ys4Y6xfgGeDMgWu2OsMl, cache isolado .next/task-0062-mobile. Nenhum build novo executado nesta0063; nenhum ambiente real de Supabase utilizado. O primeiro comando de inicialização via script raiz não encaminhou corretamente --port e falhou sem iniciar servidor; comando direto ao workspace iniciou corretamente. Servidor encerrado após a inspeção.

Branchmain, HEAD/origin/main/consulta fresca GitHub204ba56fc8b0ded2a4d99310818094210ddbbea2, divergência0/0; index vazio. Vercel projeto e deployment antigo READY confirmados por consultas autenticadas somente leitura: dpl_CrF9BZkNNpstBhG1nS7b1wiQERrZ, sourcegit/main, mesmo hash204ba56, alias pretendido. Frameworknextjs; variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY presentes emProduction (valores não mostrados nem validados funcionalmente). Root Directory e configuração atual da branch de produção não expostas nas respostas consultadas; permanecem pendentes, sem presumir apps/web.

QA nesta0063: isolamentoHTTP FAIL para oito áudios e PASS para quatro rotasDEV. Security pelo autor FAIL. Novas execuções de unit/E2E mobile/lint/typecheck/build, revisão final de secrets/index, commit/push e smoke do novo deployment NÃO EXECUTADAS, pois o usuário exige interromper publicação quando um gate falha. Evidência0062 anterior é histórica e não substitui gates desta release. Nenhum arquivo publicado/commit criado/configuração externa alterada; sem teste físico.

UNBLOCK_CONDITION: Garantir exclusão física dos oito áudios restritos do artefato público de produção, preservando originais para protótipo, ou substituí-los futuramente por arte com licença comercial válida e novos gates. Validar artefato final e HTTP404 dos arquivos restritos, além dos demais gates. Apenas silenciar catálogo ou ocultar URLs não resolve. Não modificar licenças/receipts para simular aprovação. Depois retomar esta mesma TASK; não há necessidade de criar outra.

EVIDENCE: docs/architecture/TASK-0063-VERCEL-PUBLISH-REPORT.md; docs/security/TASK-0063-PRODUCTION-REVIEW.md; build/task-0063-deployment-audit/production-isolation.json e inventários locais (ignorados pelo Git).

## Rework autorizado — continuidade da mesma TASK

O usuário autorizou explicitamente isolamento físico, preservação das fontes e hashes, mudanças no fluxo DEV/build, gates/testes e posterior commit/push/publicação condicionada a todos os checks. O bloqueio anterior acima é histórico e não foi removido. Escopo adicional: assets-source/arena-audio-prototype (relocação byte a byte dos oito originais), scripts de isolamento/servidor DEV, package.json do app, next.config.ts, testes afetados, manifest de localização e documentação0063. Nenhuma nova TASK criada. Estratégia: servidor auxiliar somente no fluxo npm run dev, fontes fora depublic, sem cópias temporárias públicas; gate de mídia obrigatório antes de nextbuild/nextstart, inclusive chamada direta ao Next pelo config, e inspeção física de artefatos após build.

Checkpoint inicial do rework: hashes das oito fontes conferidos com receipts; inventário rework-preservation-before.json e PROTOTYPE-AUDIO-ISOLATION-V1.json. Gitmain/remoto204ba56 continuam sem divergência. A consulta detalhada de configuraçãoVercel sob team_FWD8MfZ9vARK8EBovoyTn9Ox retornou403; sem CLI local disponível. Acesso necessário para confirmar Root Directory/branch/artefatos remotos solicitado ao usuário; implementação e validação locais independentes seguem autorizadas. Nenhum push enquanto houver configuração incerta.
