# RPG-DEV-001 — Recuperação isolada após Guilda/EBD

ID: RPG-DEV-001
TITLE: Preparar equipamentos, Arena e Torre preservando Guilda/EBD
OBJECTIVE: Reproduzir e corrigir defeitos confirmados, produzir evidências e delimitar os bloqueios da futura liberação.
PRIORITY: P1 High
STATUS: VALIDATING
SCOPE: apps/web/features/journey, apps/web/lib/supabase, apps/web/lib/authority, testes/fixtures/configurações locais de teste, relatório e memória. Assets aprovados somente leitura. Investigação remota somente leitura nesta etapa.
OUT_OF_SCOPE: Desbloqueio produtivo, grants econômicos reais, promoção de jogadores, mudança de Auth/URLs/quotas, alteração das artes aprovadas, reset ou repetição de migrations.
DEPENDENCIES: RELEASE-EBD-001 publicado em 808433a; homologação econômica e catálogo ainda pendentes.
ASSIGNED_AGENT: Agente principal assumindo Frontend/Backend, QA e Security; revisões pelo autor, sem delegação ou independência alegada.
REQUIRED_CONTEXT: RELEASE_POLICY.md; RELEASE-EBD-001-REPORT.md (561d613); FIX-PROD-008-REPORT.md; fontes selecionadas conforme defeito.
SECURITY_CONSIDERATIONS: TEST também usa isolamento Guilda/EBD. Não revogar esse isolamento para viabilizar um teste. PostgreSQL descartável sem rede e fixtures sintéticas não comprovam execução hospedada real.

## Autorização e limites dos perfis

O usuário autorizou explicitamente desenvolvimento e testes runtime no pedido RPG-DEV-001. O agente principal registra a ampliação delimitada dos perfis locais para os caminhos acima, instalação apenas do lockfile já aprovado na nova worktree e uso dos conectores autenticados para inspeção do mesmo projeto. Não autoriza dependências novas nem mudança de escopo de produção.

ACCEPTANCE_CRITERIA:
- Confirmar main/produção/TEST, preservar worktrees e resultados anteriores.
- Corrigir apenas defeitos reproduzidos e testar regressões pertinentes.
- Preservar couraça 3, espada e demais composições homologadas.
- Separar prova isolada de prova hospedada, sem fabricar vitórias ou recibos.
- Relatar reconciliação 16 XP/6 moedas sem ajuste de saldo.
- Manter os módulos incompletos bloqueados em produção.

TEST_PLAN:
- Testes de regressão dos defeitos confirmados; unitários pertinentes e suite integral quando justificável.
- PostgreSQL isolado para contratos afetados; reutilizar determinísticos já aprovados quando código equivalente.
- Navegador desktop/móvel em fixture isolada e regressão da fronteira Guilda/EBD.
- Lint, TypeScript, build, assets e CI do candidato exato.
- Verificações remotas somente leitura de versão, RLS e economia.

DEFINITION_OF_DONE:
- Relatório RPG-DEV-001-REPORT.md, evidências, memória e status coerentes. Gates ausentes ou homologação indispensável mantêm BLOCKED, nunca PASS.

## Self validation / QA / Security pelo autor

Reproduzidas quatro falhas de concorrência antes da correção. Regressores finais 24 PASS; suite integral 764 PASS/74 SKIP; PG 17 PASS com timeout apropriado ao WSL, mesma assertividade; navegador de equipamento 2 PASS e fronteira release 4 PASS; lint/types/build e protocolo 25 PASS. Assets cinco PNGs/seis composições intactos. Sem DDL ou escrita em dados de jogo remotos. Revisão não independente. CI/Preview e inspeção hospedada pendentes nesta etapa; liberação de gameplay BLOCKED por homologação/economia/fluxos hospedados.
