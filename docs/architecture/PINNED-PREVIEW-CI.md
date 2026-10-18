# Preview por SHA no CI oficial

O workflow `quality.yml` valida todos os pushes e PRs: testes do jogo, protocolo Node, lint, tipos e build. Main exige PR atualizado e o check de qualidade do GitHub Actions. Nenhum segredo fica disponível ao job de qualidade ou a PRs/forks.

Push em `preview/*` (ou na branch histórica `codex/pinned-preview-ci`) pode publicar somente com `RPG_PINNED_PREVIEW_ENABLED=true`, primeira tentativa, qualidade aprovada e os seis blobs de isolamento da demo já revisados em `9e501ea` intactos. O job seguinte usa o ambiente protegido `preview-deploy` e seu `VERCEL_TOKEN`, configurado diretamente pelo responsável. A revisão desse ambiente continua obrigatória; a autorização desta instalação não aprova futuras alterações de produto.

O gate local verifica blobs Git canônicos, sem depender de finais de linha. O publicador repete a verificação pela árvore GitHub do SHA exato antes de consultar/publicar na Vercel. Árvores incompletas, arquivos alterados, ausentes ou symlinks são rejeitados. Isso preserva a fronteira revisada; mudanças adicionais ainda precisam de revisão antes de liberar o ambiente. Novas versões dessa fronteira exigem revisão de segurança e atualização explícita da lista. Código normal de main não é uma demo elegível e não publica Preview por esse caminho.

A API recebe `gitSource.sha` e `ref`, confirma repositório/projeto/equipe e qualidade do mesmo SHA, permite no máximo um POST e verifica o SHA real até READY. Timeout/falha exige inspeção do deployment existente; reruns não geram publicação. Não usar o antigo hook que resolve apenas a ponta da branch como substituto deste protocolo.

`apps/web/vercel.json` bloqueia deploy Git direto com `**: false` e mantém `main: true`. A política acompanha branches que incorporarem esse arquivo; branches históricas sem atualização conservam sua própria configuração. A integração de PR em main pode iniciar o deployment Production Git existente, após os checks obrigatórios do PR. Não há token de produção no workflow.

## Operação e recuperação

1. Atualizar a branch de trabalho com o CI/configuração oficial e executar a qualidade. Para Preview, usar a demo isolada revisada em uma branch `preview/*`.
2. Conferir SHA, isolamento e resultado de qualidade antes de aprovar `preview-deploy`. Aguardar READY e conferir SHA efetivo e rotas da demo. A aprovação autoriza código executável com uma credencial; não aprovar automaticamente futuras mudanças sem revisão.
3. Para suspender novos Previews, definir `RPG_PINNED_PREVIEW_ENABLED=false`; manter ambiente e proteções. Para interromper um run em andamento, cancelar esse run; a flag não revoga um job já iniciado.
4. Se o POST tiver resultado incerto, inspecionar a Vercel antes de qualquer nova execução. Não repetir o POST cegamente.
5. Para reverter configuração de main, abrir PR de reversão e passar os mesmos checks. Recuperação urgente de Production deve usar deployment anterior conhecido e autorização aplicável; não executar rollback destrutivo como teste.

Aceite desta instalação: testes negativos do protocolo e isolamento, CI de PR/main, demonstração real publicada pelo runner com SHA exato e smoke HTTPS, produção com runtime preservado e rotas públicas verificadas. Recibos ficam em `build/` privado. QA/Security pelo próprio autor, sem alegar revisão independente. Nenhum teste desta instalação libera novas funcionalidades de jogo ou alterações de banco.
