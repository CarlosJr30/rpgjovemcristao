# TASK-CLOUD-006 — Controle de qualidade antes da Preview

Estado: **PREPARED_ONLY / VERCEL_GATE_NOT_ENABLED**.

O workflow `.github/workflows/preview-readiness.yml` executa testes, lint, typecheck e build e só libera o job de prontidão após sucesso. O job final NÃO publica nem configura o Vercel.

**Limitação:** o Vercel conectado ao GitHub pode iniciar e disponibilizar uma Preview assim que houver push. Um check do GitHub Actions NÃO bloqueia esse comportamento por si só.

Para garantir publicação somente após CI:
1. Confirmar o projeto e permissões de configuração Vercel.
2. Planejar desativação/ignorância dos builds automáticos nas branches que o CI controla, sem alterar Production.
3. Implementar deploy explicitamente pós-CI com autorização mínima, ou mecanismo equivalente de aprovação; verificar proteção das URLs.
4. Verificar em branch descartável que falha de CI gera **zero** novos deployments, e sucesso gera exatamente uma Preview, sem acesso ao banco real.
5. Não introduzir credenciais Vercel/Supabase no repositório; usar segredos restritos no sistema autorizado.

Não ativar `Ignored Build Step` atual antes da revisão: o filtro de branches proposto não aguarda CI e não oferece gate seguro.

Não alterar main, banco, secrets nem configurações remotas nesta tarefa.
