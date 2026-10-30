# 010A.2 — proposta de Administrador Geral PROD

**APROVADA E EXECUTADA para a identidade fixada; aplicação publicada e conferida.** Resposta explícita do proprietário `call_bb28579e0ad24170ba5c52aac708fc7b`,29/10/2026. Bootstrap owner-only criou uma concessão ativa com as quatro permissões e um evento imutável;27checks pré-grant/28pós-grant no mesmoJWT PASS, inclusive RLS alheia. Dados de jogo preservados; nenhuma liderança automática. Merge994fe9d/CI40852856242success/deploymentdpl_BdKmqu1JYDH845BKoGH1qXiQTsTeREADY/production/aliasoficial confirmados;62checksUI e28API após publicação PASS. Gestão ativada por operação protegida após gates,controletrue/rev2,economia negada. [Fechamento](RPG-DEV-010A-REPORT.md) e [evidência](RPG-DEV-010A2-RELEASE-EVIDENCE.json). O texto abaixo é histórico do contrato aprovado e não autoriza repetição para outra identidade.

Proposta `010A-PROD-ADMIN-20261029`. Destino: somente a conta PROD existente apresentada pelo proprietário e confirmada pelo login normal na janela oficial, com avatar ativo nível50. Identidade fixada pelo fingerprint SHA-256 do UID, prefixo **51f8f162f5bf**; UID completo, avatar e nonce estão no registro local ignorado `build/rpg-dev-010a2/prod-admin-designation-proposal.json`, sem senha/token/cookie. O nível identifica o avatar conferido e não concede privilégio. Avatar antigo nível1 excluído do ensaio.

| Permissão proposta | Poder concedido |
| --- | --- |
|`admins.manage`|Gerenciar concessões/revogações de administradores pelas operações protegidas, preservando a regra do último administrador.|
|`leadership.manage`|Emitir e revogar autorizações individuais de liderança; a identidade destinatária ainda precisa aceitar normalmente.|
|`guilds.read`|Consultar o resumo administrativo das comunidades pela interface autorizada.|
|`audit.read`|Consultar a auditoria administrativa permitida.|

O grant não cria conta/herói/comunidade, não concede liderança automaticamente e não permite ler inventário, carteira, progresso ou dados de outro jogador ignorando RLS. Não concede XP, moedas, itens, cartas, baús ou recompensas. Nenhuma conta TEST será promovida por inferência.

Operação proposta: depois da aprovação expressa e da renovação dos gates, aplicar somente as duas migrations PROD próprias; confirmar fundação vazia e controles; usar o bootstrap privado owner-only, sem JWT de cliente, com UID/avatar reconferidos, quatro permissões acima, motivo/referência da aprovação e nonce fixados. Efeito esperado do bootstrap: uma concessão administrativa e um registro imutável de auditoria. Dados de jogo preservados. Escritas de gestão começam contidas; ativação exige gates CI/READY/SHA/segurança próprios. Nenhum link de autenticação ou JWT será gerado.

Evidências para revisão: pacote técnico `7abca21dfa5c29973a1e768d17767af00a45a27b`, CI [push40847640704](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40847640704) e [PR40847651864](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40847651864) success;927unit PASS/74SKIP,132PG isolados (45+61+26),lint/tipos/build/protocolo25 PASS. [Preview TEST](https://rpgjovemcristao-jm1pteqzt-carlos-junior-s-projects.vercel.app) READY/SHA exato,52 checks finais reais/duas engines, além da homologação multiguild preservada. Mobile emulado. Preflight PROD19 somente leitura PASS,38 conjuntos e estrutura preservados; recuperação/containment ensaiados sem descartar vínculos. QA/Security pelo autor.

Esta aprovação é necessária pelo **item6 do pedido vigente**, que exige submeter concessões ainda não autorizadas ao proprietário; a designação anterior era somente TEST. Login normal confirma a candidatura e não substitui aprovação. A [política de release](../../.agent/RELEASE_POLICY.md) proíbe privilégios sem autorização válida. A autorização permanente de publicação já existe e não está sendo solicitada novamente.

Para aprovar a concessão específica, o proprietário pode responder: **“Aprovo a proposta 010A-PROD-ADMIN-20261029 para a conta PROD autenticada, com as quatro permissões descritas.”** Uma alteração de conta/permissões exige nova proposta; silêncio não é aprovação.

Enquanto faltar essa aprovação, manter PROD008C intacta, PR19 draft e PR12/18 independentes. Depois da aprovação, ainda executar/confirmar os gates remotos de DDL, merge normal, Vercel READY, SHA, domínio oficial e pós-publicação. Não declarar DEPLOY_COMPLETE antecipadamente. Após emissão de estado, recuperação usa contenção preservadora e aplicação compatível; não apaga grants, auditoria ou vínculos multiguild. [Plano detalhado](RPG-DEV-010A2-PRODUCTION-PLAN.md) e [evidência](RPG-DEV-010A2-PRODUCTION-PREPARATION-EVIDENCE.json).
