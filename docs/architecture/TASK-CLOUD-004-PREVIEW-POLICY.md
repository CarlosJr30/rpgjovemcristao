# TASK-CLOUD-004 — Política de Preview (preparação)

## Objetivo
Permitir builds automáticos de Preview somente nas branches `preview/**`, mantendo `main` e Supabase inalterados.

## Estado
**PREPARED / VERCEL_CONFIGURATION_PENDING.** Criar o arquivo no GitHub não ativa esta regra no Vercel.

## Instalação futura (requer acesso autorizado ao projeto Vercel)
No projeto `rpgjovemcristao-web`, configure **Ignored Build Step** com:
```sh
node scripts/vercel-preview-branch-policy.mjs
```
Atenção: em **Ignored Build Step**, código de saída **0 ignora o build** e **1 permite o build**. Confirme que o diretório de trabalho do Vercel permite acessar `scripts/` (em monorepo com root directory `apps/web`, ajustar o caminho conforme o projeto).

## Comportamento
- Production: não altera o comportamento de build existente.
- Branches `preview/**`: permitem construir Preview.
- Branches `cloud/**` e `automation/**`: ignoram builds de Preview.
- Outras branches: ignoram builds de Preview.

## Limitação crítica
Esta política **não espera os testes do GitHub Actions**. O Vercel pode construir antes de os testes terminarem. Não tratar READY como aprovação. Para um bloqueio real, é preciso **desativar deploy automático de Preview no Vercel** e implantar via etapa controlada após CI, ou usar configuração de proteção equivalente, com acesso autorizado ao projeto.

## Segurança
Não adicionar segredos, não executar migrations, não liberar produção, não alterar a branch main. Não configurar a regra sem verificar o root directory e a ligação Git/Vercel.
