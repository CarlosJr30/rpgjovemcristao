# TASK-0035 → Animação de equipar V2

ID: TASK-0035
TITLE: Icon fly-to-anchor + body-fit reveal
OBJECTIVE: Recuperar voo visual de equipar sem movimentar overlays corporais.
PRIORITY: P1 High
STATUS: DONE
SCOPE: Autorização explícita do usuário em 2026-10-02 para apresentação de Equipamentos/Avatar, trajetória do clone iconAsset, anchors como destinos, CSS de fade/impacto, testes pertinentes, documentação e memória. Continuação do escopo Avatar/equipamentos da TASK-0031.
OUT_OF_SCOPE: Assets V2, aprovação READY, Supabase/Auth, Guilda, Jornada como mecânica, stats, inventário como regra/persistência, economia, Arena, Fuga e dependências.
DEPENDENCIES: TASK-0034 concluída; arte corporal V2 real ainda pendente.
ASSIGNED_AGENT: Perfil frontend local, QA pelo autor; sem subagentes.
REQUIRED_CONTEXT: GLOBAL_CONTEXT, CURRENT_STATE, WORKFLOW, RULES, SECURITY, frontend/coding/testing, EquipmentScreen, EquippedAvatar, bodyAnchors e CSS pertinentes.
SECURITY_CONSIDERATIONS: Representação transitória local, sem serviços/configuração/entrada remota; ícone nunca registrado como overlay corporal.
ACCEPTANCE_CRITERIA:
- Voo curvo do iconAsset para head/torso/rightHand/leftHand/centro dos pés/chest nos dois corpos.
- Impacto curto e reveal do overlay alinhado; full-canvas nunca viaja e nenhum ícone persiste no corpo.
- Aproximadamente 500–750ms, transform/opacity, dimensões medidas uma vez; trajetória limitada em mobile distante.
- Troca esconde camada anterior, não duplica; desequipar faz fade-out; reduced motion usa fade sem voo.
- NEEDS_NEW_OVERLAY permite voo/impacto, sem camada corporal falsa, com feedback verdadeiro.
- Trabalho e PNGs existentes preservados; testes, lint, typecheck, build e memória com evidências.
TEST_PLAN:
- Unit: destinos, limite móvel, fluxo temporizado, seis slots, full-canvas sintético, fallback, troca, desequipar, reduced motion, falha e desmontagem.
- E2E: 1440×900 e 390×844, seis slots, troca, desequipar, reduced motion e capturas/medidas reais. Assets reais permanecem pendentes; full-canvas validado por fixtures de contrato, sem alegar aprovação visual de arte.
DEFINITION_OF_DONE: Gates aplicáveis aprovados e memória/contrato atualizados; nenhuma fonte corporal real promovida para READY.

## Evidências e aceite — 2026-10-02

- SELF VALIDATE / QA pelo autor: revisados fluxo, geometria, portal, timers, CSS e separação entre ícone transitório e composição corporal. Capturas com voo visível nos dois corpos, desktop/mobile; base preservada. Sem revisão independente.
- UNIT / INTEGRATION PASS: `npm test`, 39 arquivos / 241 testes. Destinos por corpo, centro dos pés, bounds/arco, 740 ms, geometria inválida, full-canvas sintético, modo cropped, seis slots, fallback, troca/reduced motion, remover, falha e desmontagem.
- E2E PASS: `npm run test:e2e -- tests/e2e/equipment-animation-v2.spec.ts tests/e2e/hero-overlays.spec.ts`, 8/8 sem skip. Seis slots × dois corpos × 1440×900/390×844; troca, remover, reduced motion, feedback pendente, ícone nítido, 4 keyframes/560 ms, impacto em 440 ms, destino semântico/borda visível, save/stats/nó base preservados.
- Evidências ignoradas pelo Git: `test-results/equipment-animation-v2-*/{female,male}-icon-flight.png`, capturas reduced motion e attachment `icon-flight-measurements` com 24 registros. MutationObserver existe só nos testes para registrar clone no instante de criação.
- LINT PASS: `npm run lint`, sem warnings. TYPECHECK PASS: `npm run typecheck`, workspaces e raiz. BUILD PASS: `npm run build`, 20 páginas. Spawn EPERM inicial corrigido com execução autorizada fora do sandbox; nenhuma dependência instalada.
- Falhas intermediárias corrigidas: fixture de botas já equipada, query incompatible entre bibliotecas, inset 0px, seleção do Avatar ambígua com miniatura, leitura prematura do save, polling tardio sob carga e tipagem do recorder. Inspeção revelou endpoints fora da tela também no desktop; projeção ajustada sem mover Avatar.
- SECURITY: revisão local pelo autor; sem credenciais, Auth, entrada remota, infraestrutura ou permissões alteradas. Efeitos aria-hidden, sem foco/pointer; timer e portal limpos ao desmontar. Security independente N/A por ausência de gatilhos técnicos; NO SECRETS PASS.
- PRESERVAÇÃO PASS: baseline de 117 arquivos; seis edições autorizadas (renderer, CSS, testes, nota V2 e memória). 111 hashes restantes inalterados, incluindo 14 PNGs V1, manifesto/resolver e gameplay/stats/inventário. Next-env restaurado aos bytes originais. Sem reset/checkout/clean/commit.
- DOCUMENTATION / ACCEPTANCE / NO KNOWN CRITICAL REGRESSIONS PASS. Arquitetura em `docs/architecture/EQUIPMENT-ANIMATION-V2.md`; documento Body-fit atualizado. Memória atualizada.
- Limitação: nenhum overlay V2 real existe; o reveal full-canvas usa fixture sintética. Nenhum READY ou aceite artístico real. Quatro protótipos e aprovação humana por corpo seguem como etapa futura.
