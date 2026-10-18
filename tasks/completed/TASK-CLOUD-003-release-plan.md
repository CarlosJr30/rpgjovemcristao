# TASK-CLOUD-003 — Preparação da Arena para produção

ID: TASK-CLOUD-003
TITLE: Preparar plano coordenado da Arena de Cartas e protocolo econômico 2
OBJECTIVE: Entregar RELEASE_PLAN_READY com gates e bloqueios explícitos, sem implantar.
PRIORITY: P2 Normal
STATUS: DONE — RELEASE_PLAN_READY; implantação Production BLOCKED
SCOPE: Inspeção de 0076A/B/C/D/E, testes locais direcionados, relatório/plano e memória; correções indispensáveis somente se comprovadas.
OUT_OF_SCOPE: Supabase remoto, dados reais, segredos, migrations remotas, publicação, main, balanceamento, visual e novas funcionalidades.
DEPENDENCIES: TASK-CLOUD-002 validada em Linux; evidências históricas 0076A/B/C/D/E.
ASSIGNED_AGENT: Agente principal, perfis operação/backend/QA/security; revisão pelo autor.
REQUIRED_CONTEXT: AGENTS.md; CODEX-CLOUD-WORKSPACE.md; TASK-0076A-REWARD-SECURITY.md; TASK-0076A-PREFLIGHT-COMMANDS.md; relatórios 0076B/D/E.
SECURITY_CONSIDERATIONS: Falhar fechado sem protocolo 2; nunca reativar crédito arbitrário; inspecionar somente presença de variáveis; distinguir evidência local de estado remoto histórico.
ACCEPTANCE_CRITERIA:

- Identificar branch/SHA de origem e preservar fontes aprovadas.
- Documentar integração normal, demo sem recompensas e limites do aceite mobile.
- Inventariar release, protocolo, variáveis e blockers de Supabase/Vercel.
- Definir gates de publicação/recuperação coordenadas sem executá-los.
- Executar somente validações direcionadas necessárias e registrar limites reais.
  TEST_PLAN:
- Reutilizar lint/types/build Preview e quatro E2E Linux da CLOUD-002 se runtime idêntico.
- Executar contratos econômicos/recusa segura e testes locais pertinentes.
- Compilar modo normal Linux somente se necessário para diferenciar o artefato Preview.
- Conferir diff final: apenas documentação; revisão QA/security pelo autor.
  DEFINITION_OF_DONE:
- Relatório RELEASE_PLAN_READY revisável na branch de trabalho.
- Prontidão de produção bloqueada enquanto os gates remotos/humanos não forem comprovados.
- Memória, resultados e limitações atualizados; nenhuma ação externa de escrita.

## Resultado e aceite

- Origem cloud/rpg-jovem-cristao-migration/38b766c confirmada; branch de trabalho cloud/task-cloud-003-release-plan, sem main/push/deploy.
- Relatório em docs/architecture/TASK-CLOUD-003-RELEASE-PLAN.md e manifesto correspondente; fontes completas, gates e recuperação coordenada identificados.
- Correção indispensável: proxy normal redireciona GET/HEAD legacy307 antes da renderização. Antes: HTTP200/NEXT_REDIRECT sem Location; depois: GET/HEAD307 no standalone Linux. Preview e POST normal preservados.
- SELF VALIDATE: 45 testes econômicos/6 arquivos PASS; 7 testes de isolamento/redirect PASS; build normal Linux e typecheck completos PASS; ESLint/Prettier dos arquivos alterados PASS. Lint completo e quatro E2E Preview da CLOUD-002 reutilizados para fontes inalteradas; sem suíte completa repetida.
- Smoke normal: Jornada200 sem marcador demo, GET/HEAD legacy307, API GET405/POST503 no-store sem configuração; nenhum fetch externo. Navegação normal do navegador BLOCKED_MISSING_PUBLIC_CONFIG, documentada sem falso PASS.
- SECURITY/QA pelo autor, não independentes. Nenhum secret lido/configurado, migration executada, dado real modificado, alteração visual/balanceamento ou fallback inseguro.
- PostgreSQL/backup/restore/Supabase/Auth remoto/POCO físico NOT_RUN nesta tarefa. Evidências históricas não foram convertidas em leitura remota atual.
- Aceite da entrega documental e correção local: PASS. BLOCKED para produção: backup/restauração, manutenção/dreno, segredo servidor, stage normal compatível, smoke remoto/contas QA, físico e aprovação de release. DONE refere-se ao plano, não resolve os gates das TASK-0076/0076A.

## Finalização Git autorizada posteriormente

- Commit/push restritos a cloud/task-cloud-003-release-plan; main e cloud/rpg-jovem-cristao-migration preservadas.
- Revisar conteúdo e hashes antes de versionar; não incluir logs, backups, arquivos de ambiente ou credenciais.
- apps/web/vercel.json desativa deployments automáticos somente para esta branch; nenhum deploy é solicitado.
- Código igual ao previamente testado; não repetir build/testes. Resolver o SHA desta entrega pelo Git e verificar o mesmo SHA na ref remota.
