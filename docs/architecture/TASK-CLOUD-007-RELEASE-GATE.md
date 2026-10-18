# TASK-CLOUD-007 — Preparar verificação de aprovação da Preview

**Estado: VERIFICATION_PREPARED / VERCEL_GATE_BLOCKED.**

O fluxo `.github/workflows/preview-release-approval.yml` confere se o SHA ainda é a ponta da branch `preview/**` e se houve um run `push` bem-sucedido de `preview-readiness.yml` para o SHA exato.

**Ele não publica no Vercel, não possui segredos e não garante por si só que Previews antecipadas sejam bloqueadas.** A verificação manual pode exigir instalação do workflow na branch padrão antes de aparecer no menu do GitHub.

Para liberação automatizada verdadeira, é necessário acesso autorizado à configuração do projeto Vercel para impedir builds de Preview por push antes do CI. Só depois pode ser configurado um deploy controlado após validação (com escopo restrito, proteção e ambiente isolado). Isso requer revisão separada e testes negativos; não habilitar apenas o script antigo `Ignored Build Step` como substituto de CI.

A proteção atual de produção continua; não mesclar na main, não aplicar migrations nem acessar banco de produção.
