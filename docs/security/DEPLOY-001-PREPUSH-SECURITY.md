# DEPLOY-001 — auditoria antes do push

2026-10-20. Autor assume DevOps/QA/Security, sem independência. Fonte: fechamento006 limpo8a470d20558c993f5f954bbc6a67776c9f583823 e main remota5508514828a455ccb0d1ee83d652c419e8643a49 consultada por ls-remote/fetch restrito. Nenhuma leitura/configuração de Supabase/Vercel.

| Gate | Evidência antes do push |
| --- | --- |
| Identidade/ancestralidade | Recibo006/hashes12arquivos conferidos; 17HEADs de0080–0089 e001–006/003A ancestrais; main0commits exclusivos. Não há merge/cherry-pick necessário |
| Preservação | Snapshot32worktrees/HEADs/status/dirty hashes e nove pendências raiz; checkout isolado, sem importar alterações não versionadas0080/0078/raiz |
| Histórico publicado | 38commits da consolidação além da main,335paths;455blobs únicos novos de texto escaneados, inclusive versões intermediárias. Zero chave privada/token de provedor/URL com credencial/JWTservice_role encontrado. Nomes de variáveis e fixtures declaradamente sintéticas não são credenciais reais |
| Paths e dados | Nenhum novo .env real/cache/node_modules/.next/.vercel/backup de jogadores/asset binário no intervalo; arquivos build históricos curados já pertencem à main, não se adicionam logs/recibos/traces locais. Fixtures/réplicas de atores somente nos ensaios, sem endpoint de demonstração inseguro |
| Produto e mídia | Autoridade004 e conteúdo005/integração006 mantidos. Zero carta/vídeo/áudio homologado inventado; gate969artefatos/8hashes e scan263JS/213públicos006 reutilizados porque runtime idêntico |
| Workflow | quality.yml idêntico à main, contents:read, checkout persist-credentials:false e actions pinadas. Job quality executa instalação/testes/lint/tipos/build sem secret ou deploy. Nenhum env sensível impresso/adicionado |
| CLOUD-007 | Gatilho e script de publicação intactos. pinned-preview só pode rodar em preview/* ou codex/pinned-preview-ci e exige outros gates. codex/deploy-consolidated-001 não satisfaz a expressão; demo-isolation também retorna eligible=false |
| Integração Git Vercel | apps/web/vercel.json preservado e idêntico à main: git.deploymentEnabled com **false/maintrue. A branch não-main está excluída. Nenhuma mudança de configuração de projeto ou deploy solicitada |
| Inventário GitHub | API lista quality e dois workflows históricos. preview-policy-check.yml/preview-readiness.yml não existem na main ou na branch publicada (404/conferência de tree); eventos efetivamente observados serão registrados por SHA após push |
| Escopo remoto | Somente branch refs/heads/codex/deploy-consolidated-001 por push normal, sem force/merge/main/release. Sem criação de PR que acione automação extra, sem dispatch de deploy/SQL/configuração de serviços |

Scanner focado não é garantia universal nem nova auditoria de dependências. Inspeção dos paths/código de risco e evidência006 complementam a busca de padrões. Sem achado alto/crítico conhecido no intervalo auditado. Dados do usuário sobre o Supabase teste são encaminhamento, não alegação de ambiente verificado/aplicado.

Preflight:687unit/componentPASS,28PGopt-in ignorados como já configurado;25protocolosPASS. Não se altera skip/teste para passar. CI hospedado ainda deve confirmar o SHA novo; local não é CI_APPROVED. Ausência de publicação automática deve ser observada também no resultado do job pinned-preview e statuses/deployments do SHA.
