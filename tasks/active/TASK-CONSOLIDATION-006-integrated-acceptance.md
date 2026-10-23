# TASK-CONSOLIDATION-006 — Áudio e aceite integrado local

ID: TASK-CONSOLIDATION-006
TITLE: Verificação integrada e preparação para testes reais
OBJECTIVE: Auditar áudio existente, executar recorte cross-feature, corrigir apenas defeitos reproduzidos e entregar pacote de aceite hospedado/físico.
PRIORITY: P1 High
STATUS: BLOCKED
SCOPE: Branch codex/consolidation-integrated-acceptance-006, base limpa 74bedbc175ced34a651ceb632f555a4da53a6b47. AudioManager existente e seus testes, testes isolados em apps/web e tests, configuração Playwright própria, documentação 006 e prefixo de memória de controle raiz. Qualquer correção runtime deve ter reprodução e permanecer na apresentação/áudio.
OUT_OF_SCOPE: Remoto de qualquer espécie, main/merge/push/deploy, SQL, produção/dados reais, Auth/economia/combate/0078, dependências, criação ou aprovação de mídia/cartas, redesign, contratos anteriores.
DEPENDENCIES: CONSOLIDATION-001/002/003/003A/004/005 e TASK-0089 presentes por ancestralidade. Aceite hospedado depende dos bloqueios documentados.
ASSIGNED_AGENT: Autor assume localmente Frontend, QA e Security; sem revisão independente ou subagentes.
REQUIRED_CONTEXT: AGENTS, GLOBAL_CONTEXT, CURRENT_STATE, WORKFLOW, RULES, SECURITY, TOKEN_POLICY, perfis/skills Frontend/QA/Security, relatórios 001–005/003A/0089 e guias locais Next pertinentes.
SECURITY_CONSIDERATIONS: Preservar identidade real obrigatória, ausência de concessão browser, gates de mídia/posse/vídeo, isolamento de fixtures e silêncio sem aprovação. Nenhuma chamada a serviços remotos.
ACCEPTANCE_CRITERIA:
- 31 worktrees prévios, refs e pendências preservados; branch isolada sobre a 005.
- Áudio/rotas/cenas/vídeo/raridades verificados com testes e limites explícitos; zero mídia homologada inventada.
- Recorte integrado Auth/Story/Guilda/EBD/Arena/Torre/baús e matriz Chromium1440/320/WebKit390, distinguindo evidência nova/reutilizada/mocks e execução física pendente.
- Defeitos reproduzidos corrigidos sem mudar regras, concessões ou autorização.
- Gates pertinentes e revisão de segurança pelo autor registrados, sem declarar hosted concluído.
- Checklist de integração, bloqueios P0–P3, guia de Preview e matriz hospedada/física entregues; memória atualizada.
TEST_PLAN:
- Unitários de áudio, vídeo, baús e fronteiras afetadas; testes existentes de domínios integrados selecionados por risco.
- Browser do produto com Auth/DataAPI sintéticos somente interceptados nos testes; API indisponível e estados protegidos sem fallback. Mídia positiva somente FakeMedia/fixture isolada.
- Lint, tipos, build, gate de protótipos, inspeção de bundles/assets/segredos/fixtures e diff/preservação.
- Não repetir PostgreSQL/SQL inalterados; referenciar evidência 004.
DEFINITION_OF_DONE: Aceite local comprovado e evidências registradas. IMPLEMENTATION_LOCAL_DONE não significa Preview ou jogo integral DONE; contrato permanece BLOCKED para dependências hosted/físicas.

## Registro

2026-10-20: contrato ativo antes de alterações de código. Snapshot baseline.json protege 31 worktrees, nove pendências e recibo005; sete implementações ancestrais confirmadas. Sem operação remota. Dependências serão copiadas do cache local da 005, sem instalação.

REWORK: audio-before.log reproduz 1 FAIL no retorno menu falho → jardim válido → menu falho: jardim não é pausado. Correção mínima reutiliza fadeMusicOut ao selecionar fonte já falha, preservando supressão de novas tentativas. Não altera catálogo ou política de aprovação. Revalidação dirigida pendente.

Escopo de apresentação confirmado pelo orquestrador dentro do pedido006: browser-final.log reproduz ausência do link Torre na Arena autenticada (presente apenas no componente legado). Autor Frontend pode acrescentar navegação existente entre Arena/Torre em features/arena-deck/authoritative-arena.tsx, sem alterar comandos, posse, economia ou estado004. Teste cross-feature conserva a asserção de navegação. Falha WebKit inicial coincide com unload de prefetch ao usar goto; percurso passa a links da UI, sem filtrar pageerror. Ambos os traces e JSONs preservados fora do outputDir do runner.

## Aceite e gates

REWORK → ACTIVE → VALIDATING: destinos musicais falhos passam a encerrar faixa anterior; navegação autenticada Arena/Torre restaurada sem mudança de comandos. Recheck3PASS e rodada final21E2EPASS,0falha/skip/flaky/retry;111casos unit/component distintos PASS. SELF VALIDATE/QA/Security pelo autor, sem independência. Lint completo e recortes finais PASS; TypeScript completo final PASS; build final PASS,969artefatos/0achados/8hashes de protótipos. Scan263JS/213arquivos públicos,0fixtures/nome de credencial servidor ausente dos44JS públicos. Revisão visual320/390 confirma áudio/Guilda/Torre/EBD sem sobreposição observada.

SQL/engine/Auth/autoridade/economia/mídia/dependências/contratos anteriores inalterados; PostgreSQL novo N/A para o diff, reutilizados28PG004 e evidência002. Editorial novo N/A por conteúdo005 inalterado. Next-env gerado restaurado, servidor3183 encerrado. Preservação/links/diff/secrets/memória no scope-audit.json e recibo final.

IMPLEMENTATION_LOCAL_DONE comprovado; aceite hospedado/físico e publicação BLOCKED por ambiente/cutover/CI/URL, homologações de conteúdo/vídeo/cartas/áudio e matriz real. Não mover para completed nem declarar Preview concluída. [Relatório12itens](../../docs/architecture/TASK-CONSOLIDATION-006-REPORT.md), [checklist](../../docs/architecture/CONSOLIDATION-006-INTEGRATION-CHECKLIST.md), [bloqueios](../../docs/architecture/CONSOLIDATION-006-BLOCKERS.md), [guia](../../docs/architecture/CONSOLIDATION-006-PREVIEW-GUIDE.md), [matriz](../../docs/architecture/CONSOLIDATION-006-HOSTED-PHYSICAL-MATRIX.md), [Security](../../docs/security/CONSOLIDATION-006-SECURITY.md).
