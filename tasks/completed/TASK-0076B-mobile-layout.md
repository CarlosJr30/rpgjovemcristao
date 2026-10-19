# TASK-0076B — Enquadramento da Arena de Cartas mobile
ID: TASK-0076B
TITLE: Campo, personagens, mão e controles legíveis em mobile
OBJECTIVE: Corrigir layout da Arena de Cartas em vertical/horizontal sem alterar regras ou animações.
PRIORITY: P1 High
STATUS: DONE
SCOPE: card-arena.module.css, apresentação de card-arena.tsx/screens/card-arena.tsx se necessária; testes/config direcionados, build, capturas, relatório e memória.
OUT_OF_SCOPE: economia/engine, SQL/RLS/Supabase, saves reais, assets/arte, outros sistemas, commit/push/deploy, auditoria de segurança geral.
DEPENDENCIES: TASK-0076; TASK-0076A permanece separada e bloqueada para produção.
ASSIGNED_AGENT: autor nos perfis Frontend/QA; sem subagentes ou revisão independente.
REQUIRED_CONTEXT: componente/CSS Arena, shell e fixture local dos testes pertinentes.
SECURITY_CONSIDERATIONS: sessões sintéticas locais, rede externa bloqueada, nenhuma credencial ou conta real.
ACCEPTANCE_CRITERIA:
- Campo centralizado, ambos os corpos completos, cinco cartas utilizáveis, HP/Energia legíveis, controles acessíveis, sem rolagem horizontal.
- Vertical/horizontal, safe areas e estabilidade durante animações preservadas.
- Capturas antes/depois, toque/seleção/turno e build aprovados; QA física explicitamente pendente.
TEST_PLAN:
- Baseline visual do build anterior preservado, em cópia independente do artefato.
- Emulação CSS de POCO X7 aproximada (DPR/viewport real dependem do aparelho), demais larguras pequenas, horizontal, WebKit, texto ampliado e reduced motion.
- Playwright direcionado sem retries, lint/types/build pertinentes; sem auditorias de segurança/economia anteriores.
DEFINITION_OF_DONE:
- Verificações locais efetivas PASS, evidências/memória atualizadas; MOBILE_LAYOUT_VALIDATED não significa aprovação física/publicação.

## Autorização
Pedido atual autoriza esta nova TASK e o runtime visual indicado, superando a restrição anterior de não iniciar 0076B. Perfil Frontend assumido pelo autor; ownership estendido aos testes/config/relatório. Política permanente de publicação suspensa por restrição explícita atual. Não alterar contratos/recompensas/backend/SQL da 0076A. Evidências em build/task-0076b-mobile-layout/.


## Aceite e validação — 2026-10-17

DELIVERY: TASK-0076B — MOBILE_LAYOUT_VALIDATED (emulação local); PHYSICAL_QA_PENDING.
SELF VALIDATE / QA: PASS, autorrevisão Frontend/QA. 20 layouts reutilizados com equivalência comprovada do CSS fora do modal + sete fluxos finais PASS; build/types/lint PASS. Fonte única de resultados: docs/architecture/TASK-0076B-MOBILE-LAYOUT.md e build/task-0076b-mobile-layout/acceptance.json.
REWORK: cortes internos em texto ampliado, reserva de fileira vazia e empilhamento do modal corrigidos com falhas/evidências preservadas. Fixture lazy/cache de runtime e codificação de seletor corrigidos sem aumentar timeouts ou remover asserções. Cada falha levou a correção e validação dirigida antes de DONE.
BUILD PASS: produção local com gates existentes; build 4BO1YvGUii4J1D2LxmlgU.
LINT PASS / TYPECHECK PASS: testes/config direcionados; types da aplicação no build.
UNIT TEST N/A: somente CSS runtime, nenhuma lógica alterada.
INTEGRATION / ACCEPTANCE PASS: toque real em emulação, jogar/encerrar, rotação, corpos completos na pose inicial, HP alinhado, cartas acessíveis, ausência de overflow horizontal e safe areas emuladas. Rolagem vertical permanece deliberadamente disponível.
SECURITY N/A: nenhum gatilho de auth, dados, dependências, permissões ou infraestrutura alterado; fronteiras preservadas por comparação do baseline. Sem nova auditoria econômica.
DOCUMENTATION UPDATED / NO SECRETS / NO KNOWN CRITICAL REGRESSIONS: PASS dentro do escopo; rede externa bloqueada, apenas fixture sintética local. 19 keyframes e reduced-motion intactos.
PENDING: teste no POCO X7 físico conforme checklist do relatório; desempenho e ergonomia não alegados. TASK-0076A e todos seus bloqueios remotos preservados.
