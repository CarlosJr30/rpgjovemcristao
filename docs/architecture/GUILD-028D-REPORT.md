# GUILD-028D — pacote COMMUNITY-043B na PR #55

14/11/2026. **VALIDATING; integração preparada, CI do SHA novo pendente.** PR #55 continua OPEN/Draft. Base/head inicial remoto `e894b226f9b5669885f0e7bba72de8f856262f8a`; branch local de integração criada em fast-forward sobre esse SHA. Nenhuma migration remota, merge, ativação ou deployment foi executado.

- Integrados à branch de preparação: pacote PROD `packages/database/deployments/community043b` (10 arquivos), runner PostgreSQL já usado na GUILD-028C e relatórios GUILD-024/027/028A/028B/028C. Os originais permanecem intactos no worktree GUILD-024; nenhuma alteração alheia foi sobrescrita.
- Hashes finais dos SQLs PROD conferidos: fundação `47be11a66a089bd6eda0e224ab1cc2619a718c0bc01c1e5e47f8ce085bffa62f`; quotas de membership/link `3c3141ce281fce3a20584130ea25762601a8409eb3b54fc36cf47eeae6260a93`; quotas de pedidos `4553e9e02992d2faa564d0303f44ea694c005ac79fe3696e9702c3494f04a70e`. As três fontes TEST mantêm os Git blobs `a562923cbf42a1b96f90494ecdee6e84a5fd1e67`, `692a15aececb86eb0f2bff61a90ae59746ac864e` e `99188b48126fb12fd608de92fa5682eb03d4814a`.
- Reutilizadas sem repetição as evidências da GUILD-028C: 49 cenários PostgreSQL17.10 e 8 checks de preflight PASS. Nesta consolidação, preflight direcionado 8/8 PASS, sintaxe do runner e `git diff --check` PASS; verificação de padrões sensíveis no pacote PASS.
- Manifesto segue `status: blocked`, `migrations: []`; os três SQLs são candidatos validados, não liberados para execução. Os gates de recuperação PROD verificável e decisão de retenção do marcador continuam pendentes.

O CI existente `43605745124` cobre o SHA anterior, não esta consolidação. Aguardar CI obrigatório no novo commit/SHA antes de marcar DONE. PR55 deve permanecer Draft. Após CI, confirmar reconhecimento dos checks e atualizar a PR; a próxima tarefa ainda exige resolver os gates de recuperação/retention antes de qualquer DDL ou ativação.
