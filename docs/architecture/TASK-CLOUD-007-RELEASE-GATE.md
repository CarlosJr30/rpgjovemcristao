# TASK-CLOUD-007 — Preparar verificação de aprovação da Preview

**Estado: VALIDATING / testes de aceite da automação em andamento.**

## Continuação — 2026-10-18

Projeto/equipe/root/productionBranch e hook confirmados pelo CLI autenticado: `rpgjovemcristao-web`, `apps/web`, produção `main`, hook `Preview após testes` para `cloud/preview-release-gate-007`. Secret `VERCEL_PREVIEW_DEPLOY_HOOK` presente no GitHub; variável `RPG_PREVIEW_HOOK_ENABLED` inicialmente ausente. Nenhum valor secreto lido/exibido. O run `39100060401` validou código mas pulou o hook; Vercel publicou diretamente o mesmo SHA, confirmando a lacuna anterior.

Correção em validação: `apps/web/vercel.json` desabilita deployments por push somente da branch controlada e preserva a exclusão de CLOUD-003. O workflow mantém `needs: validate`, branch/evento exatos, rechecagem da ponta remota e variável de liberação. Ações fixadas por SHA oficial; secret somente no passo de POST, em job sem checkout/instalação. URL deve apontar ao projeto autorizado e nunca é registrada ou passada nos argumentos do processo curl. POST sem retry; reexecuções do mesmo run não publicam, evitando duplicação quando a resposta anterior foi ambígua.

Aceite exige: (1) canário intencional vermelho com job hook skipped e zero deployments; (2) remoção do canário, CI aprovado, uma Preview READY, SHA/horários/isolamento conferidos; (3) main/produção preservadas. Não confundir POST aceito com deployment READY. Resultados finais serão registrados após a execução, sem deploy documental adicional.

Limite operacional: Deploy Hook é vinculado à branch e resolve sua ponta no disparo, não aceita pinagem de SHA. Não enviar outro commit durante a liberação; rechecagem evita código que já mudou e verificação posterior do deployment confirma o SHA efetivo. Corridas posteriores ao check permanecem uma limitação do mecanismo e não são garantia criptográfica de release por SHA. A política automática neste recorte cobre somente `cloud/preview-release-gate-007`; demais previews conservam seu comportamento atual. Reexecução deliberada requer primeiro conferir o estado na Vercel, depois novo push revisado ou operação manual específica.

Contrato: `tasks/active/TASK-CLOUD-007-preview-automation.md`. Teste físico mobile segue pendente e esta tarefa não libera a Arena/economia em produção.

## Registro anterior — preservado como histórico

**Estado anterior: VERIFICATION_PREPARED / VERCEL_GATE_BLOCKED.**

O fluxo `.github/workflows/preview-release-approval.yml` confere se o SHA ainda é a ponta da branch `preview/**` e se houve um run `push` bem-sucedido de `preview-readiness.yml` para o SHA exato.

**Ele não publica no Vercel, não possui segredos e não garante por si só que Previews antecipadas sejam bloqueadas.** A verificação manual pode exigir instalação do workflow na branch padrão antes de aparecer no menu do GitHub.

Para liberação automatizada verdadeira, é necessário acesso autorizado à configuração do projeto Vercel para impedir builds de Preview por push antes do CI. Só depois pode ser configurado um deploy controlado após validação (com escopo restrito, proteção e ambiente isolado). Isso requer revisão separada e testes negativos; não habilitar apenas o script antigo `Ignored Build Step` como substituto de CI.

A proteção atual de produção continua; não mesclar na main, não aplicar migrations nem acessar banco de produção.
