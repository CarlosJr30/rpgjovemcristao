# GUILD-028A — pacote organizado para GUILD-028B

14/11/2026. **DONE local; publicação bloqueada.** Branch `codex/guild-024-prod-preparation`, HEAD `e894b226f9b5669885f0e7bba72de8f856262f8a` (candidato PR #55). Nenhum SQL foi criado/aplicado; manifesto segue `blocked`.

- Pacote preservado em `packages/database/deployments/community043b`; `sql/` agora identifica seu uso exclusivo PROD, a ordem 1→2→3 e dependências. Pasta não contém SQL executável.
- Manifesto e preflight conferidos. O preflight requer target/projeto PROD explícitos, pacote `ready`, três nomes e ordem fixos, caminhos dentro de `sql/` e SHA-256 correspondente. Arquivos TEST não podem ser selecionados.
- Integridade: `git hash-object` corresponde aos blobs no HEAD para os três SQL TEST; diferenças em bytes sem filtros decorrem de CRLF/LF. Os hashes estão preservados no manifesto.
- Validação: testes direcionados **5/5 PASS**; execução local do preflight com target PROD permanece bloqueada pelo estado do manifesto (esperado); `git diff --check` e whitespace PASS. Sem testes extensos, migration ou CI novo.

## Entrada para GUILD-028B

O Sol precisa: (1) dos três SQL TEST originais e hashes no manifesto; (2) deste diretório/ordem e do preflight; (3) baseline PROD `wspafhlbtlpabypzymjo`, `release_scope=guild-ebd-001`, PostgreSQL 17, helper de convite interno e flags COMMUNITY ausentes; (4) contratos e guardas de RLS/ACL documentados em GUILD-027. O SQL PROD deve ser derivado com guardas específicas PROD e feature off por padrão, preservando as assinaturas/ACLs existentes. Validar cadeia completa em PostgreSQL descartável e atualizar SHA-256/manifests; não alterar fontes TEST.

Pendências anteriores à liberação continuam: backup/restore PROD verificável e decisão de retenção do marcador de criação. PR #55 não foi modificada ou integrada; PROD/TEST não foram alterados.
