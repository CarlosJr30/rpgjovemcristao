# DEPLOY-003 — publicação e gates da Preview isolada

Autorização explícita do usuário em 2026-10-21. Base002 ea00715cacafdd19ecc413da0845e0efcd61671c, anterior001 cb66b6c4b87645cf5911a86b8b99943cc2d1664b/CI39534907721 preservados. Branch própria codex/deploy-preview-003;34worktrees e nove pendências raiz protegidos por snapshot. Nenhuma funcionalidade refeita.

## Identidades e acesso

- Vercel exclusivamente rpgjovemcristao-test/prj_qKzjXMVXwiVpGlU66SoTA71mStXX, team_FWD8MfZ9vARK8EBovoyTn9Ox/carlos-junior-s-projects, Hobby. MCP retorna403 para esse scope; fallback CLIoficial64.0.2 já autenticada confirmou acesso ao mesmo projeto/workspace, sem substituição de destino.
- Inspeção CLI e API filtrada concordam: Nextjs, rootDirectoryapps/web, Node24.x, buildnpmrunbuild, installnpmci--prefix../..--no-audit--no-fund. Gitlinknull, deploys0, env0 antes da configuração; proteçãoSSOall preservada. Não conectar Git nem desativar proteção.
- Supabase exclusivamente wkdvdzfkbwvhyjmamrsg/rpgjovemcristao-test, orgxwyyrzctzharutyqysch, sa-east-1, ACTIVE_HEALTHY.17journals esperados002; nenhuma reaplicaçãoSQL ou alteração de produção.
- Produção Vercelrpgjovemcristao-web/Supabasewspafhlbtlpabypzymjo/main não são destinos de consulta de dados ou mutação.

## SHA e proteção de publicação

Push normal somente da nova branch, depois de diff/segredos/ancestralidade/isolamento revisados. quality.yml roda em todasbranches; pinned-preview exige preview/* ou codex/pinned-preview-ci, mais demoeligibility e variável própria. Esta branch não satisfaz o gate; não alterar scripts/CLOUD-007 para contornar. apps/web/vercel.json nega autodeployGit de todasbranches exceto main, e o projeto de testes está desconectado doGit. Não fazer merge ou movermain.

CI próprio deve aprovar SHA exato da publicação: testes/lint/tipos/build/protocolo de isolamento. Publicação manual autorizada003 por CLI/API no mesmo projeto deve usar fonte imutável desse SHA, com proveniência registrada; não atribuir a metadata de commit valor de prova sem conferir a fonte. Não reutilizar o hook antigo baseado emHEAD.

.vercel e envs locais ficam ignorados. O link explícito ao projeto gera contexto local; não inspecionar nem publicar valoresOIDC/auth deCLI. Nenhum.env com valores entra noGit. Dependências, SQL/locks antigos, assets/runtime e workflows existentes permanecem intocados.

## Ambiente e origem

VariáveisPreview: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, APP_BASE_URL e SUPABASE_SERVICE_ROLE_KEY. Backendcred somente server-side/Secret, nunca NEXT_PUBLIC ou relatório/log. Chave publicável é do mesmo ref. Não copiar dado/chave de produção nem inventar valor para o build.

A URL real do primeiro deployment ainda não existe. A seção5 do pedido autoriza descoberta/configuração seguida de novo deployment quando necessário: primeiro contexto de descoberta isolado, convites continuam fechados semAPP_BASE_URL; depois URLHTTPS real→configuração deAPP_BASE_URL/callbacks mínimos→deployment final aprovado. Essa sequência só pode ocorrer após os demais gates críticos, sem promoverPreview. Se não houver configuração server-only/proveniência/CI adequada, parar a parte de deploy e registrar bloqueio, sem publicar versão artificial.

Não usar hostname de requisição para gerar convites. inviteBaseURL existente falha fechado em produção semAPP_BASE_URL válida. Site URL e callbacks devem usar origem real, com caminhos específicos da aplicação; não adicionar wildcard amplo, domínio fictício ou localhost público. Confirmemail permanece ativo, anonymousoff. Não fabricar identidade confirmada viaSQL. Contas sintéticas precisam de emails controlados e mecanismo legítimo de criação/confirmação.

## Validação e limites

28+5PG/31SQL/16HTTP e revisão002 são evidência anterior, não Auth positivo. Após READY: desktopChromium/320px eWebKit390px, Auth real/JWT/avatar, Guilda/EBD/Story/Arena/Torre/baús/áudio/console/HTTP; nenhuma carta/prêmio/fixture para destravarproduto. Service_role fora do bundle; fontes/segredos econfigisolamento revisados. Não desligar proteção para testes; usar acesso autorizado.

Relatório/recibo final fora de autorreferência devem separar DEPLOYMENT_READY, AUTH_HOSTED_PASS, FEATURE_HOSTED_PASS, PHYSICAL_PENDING e PRODUCT_RELEASE_BLOCKED. Aparelhos físicos pertencem004. QA/Security pelo autor, sem independência. Falha ou falta de evidência não viraPASS/DONE.
