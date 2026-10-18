# CI oficial — proposta TASK-CLOUD-008

Este PR parte de main e inclui somente o workflow de qualidade, a exclusão do deploy automático da própria branch de revisão e esta documentação. Não inclui Arena, economia, migrations ou outras alterações do jogo. Não faz deploy por GitHub Actions nem recebe secrets.

O workflow executa testes, lint, tipos e build em pushes/PRs de todas as branches. Ações fixadas por SHA e permissão contents:read; checkout sem credenciais persistidas. Nenhum path filter: mudanças documentais também produzem o check obrigatório, evitando PRs permanentemente pendentes.

Check estável para proteção de main: `Testes, lint, tipos e build`, emitido pelo GitHub Actions. Instalar a regra após comprovar o check no PR: exigir PR e check aprovado, branch atualizada e sem force-push/exclusão. Uma única conta mantenedora não precisa de aprovação de outra pessoa para mesclar, mas não deve ignorar CI. Proteger administradores também se aplica à regra.

Não mesclar automaticamente. Main/produção permanecem no SHA anterior até revisão e autorização da instalação; a integração Git/Vercel atual pode criar um deployment de Production quando main mudar. Esse comportamento deve ser considerado antes do merge. A exceção em vercel.json só bloqueia a branch `codex/official-quality-ci` e não muda main nem outras branches.

A publicação de Preview por SHA é proposta separada no PR da branch codex/pinned-preview-ci. Depende do ambiente protegido preview-deploy e de VERCEL_TOKEN configurado diretamente pelo usuário. Não instalar secrets neste workflow de qualidade.

Produção: preparar release por SHA em deployment de produção sem domínio, validar e promover após aceite específico. Guardar o deployment anterior para rollback; código não reverte migrations. Nenhuma dessas operações é executada por este PR.
