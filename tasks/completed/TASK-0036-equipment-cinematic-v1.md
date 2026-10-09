# TASK-0036 → Cinematic Equip Animation V1

ID: TASK-0036
TITLE: Cinematic Equip Animation V1
OBJECTIVE: Apresentação breve de equipar com foco central, recompensa real, voo ao anchor e confirmação.
PRIORITY: P1 High
STATUS: DONE
SCOPE: Autorização explícita do usuário em 2026-10-02 para implementação local completa: apresentação de Equipamentos, componentes/hook/CSS, configuração de raridade, leitura do modelo central de poder, testes e E2E, documentação e memória. Amplia a apresentação da TASK-0035. Perfil frontend autorizado também a escrever testes/e2e e documentação deste contrato.
OUT_OF_SCOPE: Supabase, Guilda, Auth, mecânicas de Jornada/Arena/Fuga, Baús/RNG, economia/balanceamento, Avatar Runtime, produção/integração de assets V2, ações externas, push/deploy e operações destrutivas.
DEPENDENCIES: TASK-0034 e TASK-0035; overlays reais continuam pendentes.
ASSIGNED_AGENT: Frontend local; QA pelo autor, sem subagentes.
REQUIRED_CONTEXT: GLOBAL_CONTEXT, CURRENT_STATE, WORKFLOW, RULES, SECURITY, frontend/coding/testing; módulos de Equipamentos, anchors, atributos e adapter de poder existente.
SECURITY_CONSIDERATIONS: Apresentação local sem dependências novas, rede ou credenciais. React codifica nomes; sem promoção de assets READY. Preservar trabalho não commitado e bytes dos PNGs.
ACCEPTANCE_CRITERIA:
- Máquina PREPARE → FOCUS → REWARD_REVEAL → FLY_TO_TARGET → EQUIP_CONFIRM → DONE; timers e portal limpos, commit uma única vez.
- Foco central com nome/raridade/slot, bônus reais, deltas de troca e poder pelo modelo existente; cinco raridades com tempos nas faixas solicitadas.
- Voo curvo do iconAsset para os seis anchors; halo/impacto sem mover o canvas corporal; overlay apenas pelo resolver aprovado.
- Escape/toque concluem, reduced motion usa fade/texto, remoção breve sem cerimônia, falhas liberam a interação.
- 390×844, 412×915, 768×1024, 1440×900 e 1920×1080 sem overflow; sem áudio ou símbolos ocultistas.
- Equipar/trocar/remover/save/atributos preservados; NEEDS_NEW_OVERLAY continua funcional sem ícone corporal.
TEST_PLAN: Unit/integration para estágios, raridades, deltas, seis slots, READY sintético, fallback, troca/remoção, skip, reduced motion e desmontagem; E2E com ambos corpos e viewports; lint/typecheck/build; inspeção visual e auditoria dos hashes preexistentes.
DEFINITION_OF_DONE: Gates aplicáveis PASS, aceite documentado, memória atualizada e preservação comprovada. Arte real V2 permanece pendente sem impedir esta entrega de UI.

## Validação intermediária

- Unit 40 arquivos/261 testes, lint, typecheck e build PASS. Primeiro unit timeout por concorrência excessiva: repetição com dois workers passou sem alterar testes de outros módulos.
- E2E inicial: 14 PASS, 6 FAIL por painel longo próximo à área do botão, 8 duplicações de viewport mobile omitidas (cobertas pelo projeto desktop). Correção de line-height e legibilidade em curso; não há aceite final nesta etapa.

## Evidências finais — 2026-10-02

- REWORK → ACTIVE → VALIDATING: timers de duração zero passaram a avançar sem tick extra; expectativas antigas atualizadas; line-height global de parágrafos isolado; respiro dos textos corrigido sem relaxar o limite dos testes.
- SELF VALIDATE / QA pelo autor: código, estados, commit único, cleanup, foco/Tab/Escape, separação UI/corpo, seis anchors e capturas reais revisados. Inspeção visual de comum e Extraordinário em mobile, tablet e desktop, nomes longos, ambos corpos, deltas negativos e slots pendentes. Sem revisão independente ou aceite de arte V2.
- UNIT / INTEGRATION PASS: `npm test -- --maxWorkers=2`, 40 arquivos / 261 testes. Cinco timelines completas dentro das faixas, central power +36 real, troca negativa/zero, seis slots, READY full-canvas sintético, cropped legado, fallback, troca/remoção, skip em cada estágio, reduced motion, falha e desmontagem. Suite inicial sob muitos workers teve um timeout de import de database; repetição controlada passou sem alterar esse módulo.
- E2E PASS: `npm run test:e2e -- tests/e2e/equipment-cinematic.spec.ts tests/e2e/equipment-animation-v2.spec.ts tests/e2e/hero-overlays.spec.ts`: 20 PASS / 8 skips intencionais de duplicação mobile. Todos os cinco viewports cobertos nos dois corpos; projeto touch cobre 390×844. 60 registros de revelação nas cinco raridades, mais fluxo de seis slots, impacto/destino semântico, swap, remover, teclado/toque, reduced motion, reload/save, attrs e base preservados. Nenhum cenário de aceite ausente.
- Capturas em `test-results/equipment-cinematic-*/{body}-{width}-{rarity}-reveal.png`, attachments `cinematic-measurements` e recorder de voo. Evidências locais ignoradas pelo Git. Snapshots estáticos desativam animações para inspecionar texto; movimento real/tempos/keyframes são medidos separadamente pelo recorder e máquina de estados.
- LINT PASS: `npm run lint`, sem warnings. TYPECHECK PASS: `npm run typecheck`, todos os workspaces/raiz. BUILD PASS: `npm run build`, 20 páginas. Vitest/build/E2E executados fora do sandbox após EPERM, dentro da autorização local; nenhuma instalação/dependência nova.
- SECURITY pelo autor: fluxo local transitório, nomes renderizados via React sem HTML arbitrário, zero secrets/serviços/permissões/configuração remota alterados. Security independente N/A por ausência de gatilhos técnicos; NO SECRETS PASS. Ações externas, produção e deploy não executados.
- PRESERVAÇÃO PASS: baseline de 122 arquivos preexistentes; seis edições autorizadas finais e 116 hashes restantes inalterados, incluindo 14 PNGs V1, CSS global, resolver/manifesto, Avatar Runtime, regras/save, game-engine e adapter de poder. Next-env restaurado aos bytes originais. Sem reset/checkout/clean/commit/push.
- ACCEPTANCE / DOCUMENTATION / NO KNOWN CRITICAL REGRESSIONS PASS: fluxo e durações, recompensa real, trocas, impacto/halo sem mover corpo, fallback, READY sintético, mobile/desktop, reduced motion, skip e performance atendidos. Relatório técnico com arquivos e recomendações em `docs/architecture/EQUIPMENT-CINEMATIC-V1.md`; memória atualizada no fechamento.
- Limitação mantida: oito IDs reais NEEDS_NEW_OVERLAY; nenhum READY ou arte V2 real produzido. Quatro protótipos femininos e aprovação humana por corpo continuam como tarefa futura, sem bloquear a cerimônia UI.
- Fechamento: memória atualizada, auditoria final 122/116/6 confirmada sem alteração inesperada (`test-results/task-0036-preservation.json`); contrato único movido para completed após o aceite.
