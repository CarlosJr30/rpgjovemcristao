# 010A.2 — proposta de Administrador Geral PROD

**AGUARDA APROVAÇÃO DO PROPRIETÁRIO. Nenhuma concessão foi executada.**

Proposta `010A-PROD-ADMIN-20261029`. Destino: somente a conta PROD existente apresentada pelo proprietário e confirmada pelo login normal na janela oficial, com avatar ativo nível50. Identidade fixada pelo fingerprint SHA-256 do UID, prefixo **51f8f162f5bf**; UID completo, avatar e nonce estão no registro local ignorado `build/rpg-dev-010a2/prod-admin-designation-proposal.json`, sem senha/token/cookie. O nível identifica o avatar conferido e não concede privilégio. Avatar antigo nível1 excluído do ensaio.

| Permissão proposta | Poder concedido |
| --- | --- |
|`admins.manage`|Gerenciar concessões/revogações de administradores pelas operações protegidas, preservando a regra do último administrador.|
|`leadership.manage`|Emitir e revogar autorizações individuais de liderança; a identidade destinatária ainda precisa aceitar normalmente.|
|`guilds.read`|Consultar o resumo administrativo das comunidades pela interface autorizada.|
|`audit.read`|Consultar a auditoria administrativa permitida.|

O grant não cria conta/herói/comunidade, não concede liderança automaticamente e não permite ler inventário, carteira, progresso ou dados de outro jogador ignorando RLS. Não concede XP, moedas, itens, cartas, baús ou recompensas. Nenhuma conta TEST será promovida por inferência.

Operação proposta: depois da aprovação expressa e da renovação dos gates, aplicar somente as duas migrations PROD próprias; confirmar fundação vazia e controles; usar o bootstrap privado owner-only, sem JWT de cliente, com UID/avatar reconferidos, quatro permissões acima, motivo/referência da aprovação e nonce fixados. Efeito esperado do bootstrap: uma concessão administrativa e um registro imutável de auditoria. Dados de jogo preservados. Escritas de gestão começam contidas; ativação exige gates CI/READY/SHA/segurança próprios. Nenhum link de autenticação ou JWT será gerado.

Evidências para revisão: pacote técnico `f606e5a9230ddb8cdac6536b15fc7d0770670b91`, CI [push40845009558](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40845009558) e [PR40845018213](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40845018213) success;927unit PASS/74SKIP,131PG isolados (45+61+25),lint/tipos/build/protocolo25 PASS. [Preview TEST](https://rpgjovemcristao-jtnhfa1sy-carlos-junior-s-projects.vercel.app) READY/SHA exato,52 checks finais reais/duas engines, além da homologação multiguild preservada. Mobile emulado. Preflight PROD19 somente leitura PASS,38 conjuntos e estrutura preservados; recuperação/containment ensaiados sem descartar vínculos. QA/Security pelo autor.

Esta aprovação é necessária pelo **item6 do pedido vigente**, que exige submeter concessões ainda não autorizadas ao proprietário; a designação anterior era somente TEST. Login normal confirma a candidatura e não substitui aprovação. A [política de release](../../.agent/RELEASE_POLICY.md) proíbe privilégios sem autorização válida. A autorização permanente de publicação já existe e não está sendo solicitada novamente.

Para aprovar a concessão específica, o proprietário pode responder: **“Aprovo a proposta 010A-PROD-ADMIN-20261029 para a conta PROD autenticada, com as quatro permissões descritas.”** Uma alteração de conta/permissões exige nova proposta; silêncio não é aprovação.

Enquanto faltar essa aprovação, manter PROD008C intacta, PR19 draft e PR12/18 independentes. Depois da aprovação, ainda executar/confirmar os gates remotos de DDL, merge normal, Vercel READY, SHA, domínio oficial e pós-publicação. Não declarar DEPLOY_COMPLETE antecipadamente. Após emissão de estado, recuperação usa contenção preservadora e aplicação compatível; não apaga grants, auditoria ou vínculos multiguild. [Plano detalhado](RPG-DEV-010A2-PRODUCTION-PLAN.md) e [evidência](RPG-DEV-010A2-PRODUCTION-PREPARATION-EVIDENCE.json).
