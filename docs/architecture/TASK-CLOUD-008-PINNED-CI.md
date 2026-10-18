# TASK-CLOUD-008 — Publicação por SHA e CI oficial

Estado: **ACTIVE / preparação e verificação**. Produção preservada.

## Commit imutável

O novo job `pinned-preview` depende do job de qualidade e solicita Vercel `POST /v13/deployments` com `gitSource.ref` **e** `gitSource.sha`. O SHA vem do contexto do push que executou o CI, não de uma leitura posterior da branch. O script confere a proveniência do run e o resultado do job para esse SHA, projeto/equipe/repositório/root, e o SHA real de cada resposta Vercel até READY. Isso permite que a branch avance enquanto o commit aprovado é publicado.

Somente Preview. Nenhuma passagem para production, nenhum parâmetro de ambiente controlado por texto livre, nenhum POST repetido automaticamente. Timeout/falha/SHA diferente encerra o job. Releases existentes com os mesmos metadados são inspecionados antes de criar outro deployment. Código Node nativo, sem instalação de dependências no job com credencial; secret somente no passo que acessa a API.

Fontes primárias: [schema oficial Vercel GitSource](https://github.com/vercel/sdk/blob/main/src/models/createdeploymentgitsource1.ts) (`sha` fixa o commit) e [segurança GitHub Actions](https://docs.github.com/en/actions/reference/security/secure-use). O hook anterior permanece no seu recorte CLOUD-007 até a migração validada; não é usado pelo novo job.

## Ativação protegida

Antes de ativar `RPG_PINNED_PREVIEW_ENABLED=true`, criar/conferir o ambiente GitHub `preview-deploy`, com aprovação de Carlos para o commit exato e política de branches restrita. O usuário configura `VERCEL_TOKEN` diretamente nos secrets desse ambiente, com escopo mínimo disponível e expiração; nenhum agente coleta/transporta esse valor do CLI para o GitHub. Não colocar o token em repository secrets ou na conversa. O ambiente Vercel destino permanece fixo Preview.

A verificação inicial encontrou somente `VERCEL_PREVIEW_DEPLOY_HOOK` no repositório; ambientes Preview/Production sem secrets/regras, main sem proteção. A automação por API não pode ser declarada ativa sem credencial/proteção e run real concluídos.

## CI oficial e proteção de merge

`quality.yml` cobre pushes e PRs de todas as branches, inclusive alterações documentais: não há path filter que deixe o check obrigatório eternamente pendente. Check estável: `Testes, lint, tipos e build`. Testes do protocolo de publicação por SHA são executados sem credenciais antes do lint/tipos/build.

Preparar PR separado originado de main com **somente** scripts/workflow/configuração/docs de CI. Não misturar os commits de jogo da branch CLOUD. Não fazer merge automático. Configurar a proteção de main com o check estável e atualização obrigatória da branch somente após o check existir no PR; preservar políticas existentes e não remover proteção nenhuma. Sem ativar deploy em main.

## Produção e rollback — plano, sem execução

1. Resolver os gates próprios de segurança/economia/migrações e comprovar backup/restauração; não confundir Preview memory-only com integração real.
2. Instalar o CI oficial por PR revisado, conferir os checks de merge e definir ambiente GitHub `production` com aprovador e branch main. Credencial de produção separada; não reutilizar automaticamente a de Preview.
3. Criar release de produção sem atribuir domínio, a partir do SHA aprovado e com ambiente de produção; validar Auth, dados e jornadas exigidos no contrato específico. Preview não é artefato de produção.
4. Após aceite final, promover o deployment de produção testado. Guardar os IDs anterior/novo, SHA e recibos. Não fazer rebuild durante a promoção.
5. Em regressão, rollback para o ID anterior já validado; conferir domínio/rotas/SHA/dados. Rollback de código não desfaz migrations, cujo plano exige tratamento próprio. Conferir a retomada de atribuição automática de domínios após rollback.

Estado atual da produção: main `0df878764f26f0501959031dd4aec4a77fb9308a`, deployment `dpl_CHxbJAphNzND5f8ZbFoR86fT98Yt`. Nenhuma etapa acima publica ou altera dados nesta tarefa.

## Evidências

Resultados dos testes locais, CI Linux, prova de branch avançada/SHA publicado, PR oficial, proteção e bloqueios serão registrados conforme observados. QA/Security pelo autor; sem revisão independente ou aceite físico presumido.

Primeiro CI Linux aprovado: run39102704343 para `0ae9dc2457e303dfb6dc252ba3ad3e6cdc75b00a`; job de qualidade PASS e deploy protegido SKIPPED por não estar ativado. O ambiente preview-deploy foi criado sem secrets, com CarlosJr30 como aprovador e branches codex/pinned-preview-ci e preview/* autorizadas. PR4 contém a proposta por SHA; PR5 contém somente o CI oficial, sem merge.

Esta atualização documental avança a branch após aprovação do commit anterior. A prova real deve solicitar o SHA anterior aprovado e conferir que a Vercel não publica esta nova ponta.

REWORK da prova inicial: a API retornou HTTP400 para `target: preview`; Preview é o padrão quando o campo é omitido, e a API aceita explicitamente production/staging/custom. Consultas após a tentativa confirmaram zero deployments para 0ae9dc2. Corrigido o pedido para omitir target, mantendo rejeição explícita de qualquer resposta de produção, projeto ou SHA incorreto. Teste de formato do pedido ampliado; CI da correção deve passar antes de nova prova. Nenhuma sugestão de publicar com --prod foi seguida.

Correção aprovada pelo CI real: run39102978491, SHA `6796845c89b039d64a53da1bb5376cfd2d87ebaa`, qualidade PASS. Esta segunda atualização documental avança a branch para testar a publicação desse SHA corrigido. Main protegida por PR/checks aprovados e branch atualizada; PR5 de CI oficial aprovado, ainda sem merge. Credencial protegida do novo deploy permanece pendente de configuração pelo usuário.
