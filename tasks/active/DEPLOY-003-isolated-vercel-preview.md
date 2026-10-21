# DEPLOY-003 — Preview isolada e autenticação real

ID: DEPLOY-003
TITLE: Publicar SHA consolidado no Vercel de testes e validar integração real
OBJECTIVE: Preview HTTPS no projeto autorizado, exclusivamente Supabase de testes, com CI do SHA exato e evidências de Auth/funcionalidades separadas.
PRIORITY: P1 High
STATUS: ACTIVE
SCOPE: Branch codex/deploy-preview-003/worktree build/deploy-003/checkout baseada no HEAD final002 ea00715cacafdd19ecc413da0845e0efcd61671c, ancestral do SHA001 aprovado cb66b6c4b87645cf5911a86b8b99943cc2d1664b. Autor assume DevOps/Backend/QA/Security, sem subagentes ou revisão independente. Autoriza scripts/testes/correções de integração demonstradas, docs/contrato próprios; push normal da branch isolada e CI, configuração e Preview somente Vercel rpgjovemcristao-test/prj_qKzjXMVXwiVpGlU66SoTA71mStXX/workspace carlos-junior-s-projects; Auth/callbacks/contas sintéticas somente Supabase wkdvdzfkbwvhyjmamrsg. Memória de controle raiz só prefixada.
OUT_OF_SCOPE: main/merge/produção Vercel rpgjovemcristao-web e Supabase wspafhlbtlpabypzymjo; outro workspace substituto, recursos pagos, homologação de cartas/prêmios artificiais, novo produto/funcionalidades, fabricação Auth via SQL, desligar RLS/confirmação/proteção de deployment, alterar CLOUD-007 ou contratos/locks/SQL históricos.
DEPENDENCIES: Recibos001/002 íntegros; identidade remota/journal17; ambiente Preview/server-only; contas confirmadas por mecanismo autorizado. Homologações não serão contornadas; aparelhos físicos são DEPLOY-004.
ASSIGNED_AGENT: Autor com perfis DevOps/Backend/QA/Security, sem independência.
REQUIRED_CONTEXT: AGENTS/GLOBAL_CONTEXT/CURRENT_STATE/WORKFLOW/RULES/SECURITY/ORCHESTRATOR/TOKEN_POLICY, recibos001/002, manifesto/journal002, quality.yml/scriptsCI/vercelconfig/ignores, skills Vercel/Supabase e perfis mínimos.
SECURITY_CONSIDERATIONS: Confirmar projeto+team+ambiente+SHA antes de mutação; nenhuma credencial no chat/log/Git; service_role somente server-side e somente de testes. Source e bundle sem segredos. Não alterar workflow/hook antigo para forçar elegibilidade. Não converter Preview em Production. Falha de identidade/permissão/segurança interrompe a parte afetada.
ACCEPTANCE_CRITERIA:
- 34worktrees anteriores/nove pendências raiz/refs/recibos002 preservados; base002 limpa/ancestralidade e fontes SQL conferidas.
- Branch própria revisada, sem segredos, push sem autodeploy indevido; CI próprio do SHA exato inclui qualidade/testes/lint/tipos/build/protocolo.
- Projeto Vercel ID/nome/workspace, Nextjs/appsweb/Node24/build/monorepo/proteção/Git/env isolados verificados.
- Variáveis URL/key publicável/APP_BASE_URL real/service_role server-only verificadas apenas no alvoPreview; sem placeholders.
- Sequência de origem/callbacks usa URL HTTPS real e escopo mínimo; descoberta seguida de configuração/redeployment somente se necessária conforme seção5 do pedido, convites fechados enquanto origem indefinida.
- Deployment HTTPS READY do SHA aprovado, sem produção; Auth/funcionalidades testados quando contas/configuração permitirem, bloqueios explícitos.
- Relatório13itens/checklist/recibo/memória distinguem DEPLOYMENT_READY, AUTH_HOSTED_PASS, FEATURE_HOSTED_PASS, PHYSICAL_PENDING e PRODUCT_RELEASE_BLOCKED.
TEST_PLAN:
- Auditoria Git/SQL/journal/identity e inspeção Vercel sem tocar produção.
- Revisão de diff/segredos/isolamento antes push; quality.yml/protocolo próprios após push, registrar SHA/run/jobs/resultados reais.
- Preview pronta: Chromiumdesktop/320px eWebKit390px, Auth/callback/session/avatar/Guilda/EBD/Story/Arena/Torre/baús/áudio/console/HTTP; sem fixture para homologação.
- Service_role fora do bundle, ACL/RLS e negativas econômicas conforme evidências002; sem repetir28PG por documentação/configuração apenas.
DEFINITION_OF_DONE: Gates aplicáveis comprovados; quaisquer limitações de Auth/credencial/aparelhos/homologação explicitadas, sem falsificar aceitação integral ou READY. Falha exige REWORK; dependência indisponível BLOCKED com condição de retomada. QA/Security pelo autor.

## Preflight local

Baseline34worktrees/nove pendências/refs/hashes de recibos salvo antes da criação do novo checkout. HEAD002 ea00715 limpo; recibo revalidation SHA256791fee43ea9442fb978815f71af5c60a1a32cd25bf679fe22da533c5717730c4 e ancestral001 conferidos. Branch003 criada sem importar alterações da raiz.001/002 não presumidos publicados. Nenhumruntime/dependência/asset/SQL histórico alterado.
