# TASK-0031 → Avatar e overlays visuais de equipamentos
ID: TASK-0031
TITLE: Corrigir e estruturar a composição visual de equipamentos no Avatar
OBJECTIVE: Implementar composição corporal correta e extensível para equipamentos equipados, sem reaproveitar ícones de UI como overlays.
PRIORITY: P1 High
STATUS: DONE
SCOPE: Componentes e módulos de Avatar/Equipamentos necessários para assets e overlays, anchors semânticos, resolver central, configuração male/female, Couraça, botas, arma, escudo, medalhão e fallback seguro para itens sem overlay. A autorização abrange implementação visual/estrutural e testes diretamente relacionados.
OUT_OF_SCOPE: Arena, Guilda, Supabase, Auth, Jornada (progressão e conteúdo), Fuga da Serpente, economia, balanceamento, conteúdo bíblico, alterações de atributos/bônus, novos serviços ou dependências.
DEPENDENCIES: Nenhuma para a implementação visual local; overlays dedicados ausentes permanecem NEEDS_NEW_OVERLAY até que assets apropriados estejam disponíveis.
ASSIGNED_AGENT: Perfil frontend, com QA e Security locais conforme gatilhos; revisões não independentes devem ser identificadas.
REQUIRED_CONTEXT: AGENTS.md, `.agent/GLOBAL_CONTEXT.md`, `.agent/memory/CURRENT_STATE.md`, `.agent/WORKFLOW.md`, `.agent/RULES.md`, `.agent/SECURITY.md`, componentes e catálogo de Avatar/Equipamentos, assets e testes diretamente afetados.
SECURITY_CONSIDERATIONS: Escopo visual sem mudança de Auth, autorização, persistência remota ou dados pessoais. Preservar validação e ownership existentes; sem secrets.
ACCEPTANCE_CRITERIA:
- `iconAsset` é usado somente em inventário, loja, cards e UI; `overlayAsset` é a única fonte de camada corporal.
- É proibido usar automaticamente `iconAsset` como overlay. Sem overlay apropriado, item continua equipável, aparece no card, mantém atributos e não aparece sobre o corpo; qualidade pode ser NEEDS_NEW_OVERLAY.
- Um resolver central relaciona item, slot, ícone, overlay e configuração, sem lógica por `itemId` espalhada no componente de Avatar.
- Anchors semânticos cobrem head, torso, leftHand, rightHand, leftFoot, rightFoot, chest e back; ficam preparados capa, mochila e acessórios sem ativar slots novos.
- Configuração por item aceita anchor, posição, escala, rotação e z-index, com diferenças male/female sem duplicar componente.
- Conforme o pedido de implementação de 2026-10-01, Couraça usa overlay corporal real alinhado ao torso quando disponível; sem essa arte, não aparece no corpo, permanece funcional e é NEEDS_NEW_OVERLAY. Feminino e masculino são inspecionados.
- Quando houver arte dedicada válida, botas usam composição compatível com cada pé; arma e escudo acompanham mão/braço; medalhão usa chest e oclusão correta. Sem arte, aplica-se o fallback seguro em cada slot, sem fabricar novos assets.
- A ordem de camadas é explícita e evita oclusões incorretas; troca/equipar/desequipar não pisca o Avatar base e preserva feedback curto.
- Não há deformação do Avatar em 390×844, 768×1024 e 1440×900.
- Vida, Força, Defesa, Sabedoria e seus cálculos permanecem inalterados.
TEST_PLAN:
- Testes do resolver: assets, fallback sem overlay, body type, slot e ausência de fallback para iconAsset.
- Testes de equipar, desequipar e trocar item, sem alteração de atributos fora das regras existentes.
- Inspeção visual feminina e masculina sem equipamento e com elmo, Couraça, botas, medalhão, arma, escudo e combinação completa; viewports 390×844, 768×1024 e 1440×900.
- Registrar comandos e evidências reais de lint, typecheck, build e testes pertinentes; QA visual é obrigatório por envolver composição e responsividade.
DEFINITION_OF_DONE: Critérios observáveis aceitos; testes e gates aplicáveis registrados com evidências, limitações e revisão de Security pelo autor quando aplicável; nenhuma regressão crítica conhecida; documentação e memória atualizadas.

## Autorização e limites

Em 2026-10-01, o usuário autorizou explicitamente a implementação visual/estrutural de Avatar e overlays descrita neste contrato. Esta autorização constitui exceção específica à fase documental registrada em `AGENTS.md` e `.agent/RULES.md`. Ela não autoriza áreas listadas em OUT_OF_SCOPE nem substitui as permissões técnicas do ambiente.

Assets apropriados ainda ausentes devem ser registrados como `NEEDS_NEW_OVERLAY`; não improvisar camadas corporais usando ícones de inventário.

## Implementação e aceite — 2026-10-01

O pedido de implementação aceita explicitamente fallback sem camada corporal quando a arte dedicada não existe. DONE comprova a arquitetura e esse fallback; não significa que novas peças de arte tenham sido produzidas ou aprovadas.

- Auditoria: seis PNGs RGBA 1254×1254, todos ilustrações de UI. Couraça, capuz, botas, espada, escudo e medalhão inspecionados, além dos sprites male/female 512×768. Nenhum overlay corporal dedicado válido encontrado; READY: nenhum. Oito IDs visuais são NEEDS_NEW_OVERLAY, listados em `docs/architecture/EQUIPMENT-OVERLAY-ASSETS.md`.
- Causa removida: ícones usados como corpo, `status: ready` conflitante com qualidade e voo de ícone como fallback. Couraça continua equipada e concedendo seus bônus, sem imagem adicional sobre o torso; rosto/cintura e roupa da base ficam preservados.
- Novo contrato: EquipmentDefinition central relaciona catálogo mecânico existente e metadados de arte, sem mudar atributos/inventário. OverlayAsset e visualConfig podem variar male/female; base compartilhada com overrides evita arrays duplicados. Resolver exige qualidade READY e arte/config válidas e rejeita atribuições de ícones.
- Anchors: torso acrescentado aos demais anchors centralizados. Medalhão usa chest; arma/escudo têm mão/lado configurável; botas permitem peças independentes em leftFoot/rightFoot. Registration também é o centro de rotação, preservando o contato com a mão.
- Composição: back fica atrás da base; armor, boots, medallion, hands, weapon, shield, helmet, frontDetails e effects têm ordem central. Planos já pintados na base não são inventados. Camadas são ordenadas pelo resolver e dimensionadas em percentuais 2:3.
- Interação: sem arte, equipar é direto e o feedback anuncia a pendência. Arte dedicada pode voar por 620 ms, com commit em 660 ms, proporção/registro preservados e fade do anterior. Base memoizada mantém seu nó. Movimento reduzido respeitado.
- Legado removido/consolidado: calibrações de icons.*, máscaras artificiais de botas/elmo, fallback de voo, status conflitante, maleOverlay/femaleOverlay duplicados e quatro animações idênticas. Reexports de UI mantidos por terem consumidores reais.
- Escopo: nenhuma alteração manual em mecânica, banco, inventário, atributos, Auth, Supabase, Guilda, Arena, Fuga, economia ou narrativa. Sem reset/checkout/clean, dependência ou asset novo. Alterações preexistentes em CSS e memória receberam somente edições localizadas relacionadas a esta tarefa.

## SELF VALIDATE e QA (pelo próprio autor)

| Gate | Resultado e evidência |
| --- | --- |
| UNIT/COMPONENT | PASS — `npm run test`: 37 arquivos / 204 testes. Rodada final dirigida: equipment-assets, equipment-overlays e attributes, 3 arquivos / 20 testes PASS. |
| INTEGRATION/E2E | PASS — `npm run test:e2e -- tests/e2e/hero-overlays.spec.ts`: 4/4 desktop/mobile, 20,5 s. |
| QA VISUAL | PASS — inspeção das matrizes male/female: base, seis slots individuais e conjunto completo em 390×844, 768×1024, 1440×900; páginas completas também inspecionadas. Contexto mobile real em 390×844 coberto. Proporção 2:3, imagem carregada e ausência de overflow verificadas. |
| ATRIBUTOS | PASS — testes não mutacionais e E2E dos valores reais: conjunto completo Vida 4, Força 3, Defesa 5, Sabedoria 3, sem modificar cálculo. Equipar/desequipar, troca, reload e ausência de voo de ícone comprovados. |
| LINT | PASS — `npm run lint`, zero warnings; ESLint dos arquivos alterados repetido após corrigir consultas dos testes, PASS. |
| TYPECHECK | PASS — `npm run typecheck` em todos os workspaces e raiz. |
| BUILD | PASS — `npm run build`, 20 páginas geradas. Vitest/build exigiram execução autorizada fora do sandbox após spawn EPERM. |
| DIFF | PASS — `git diff --check` dos arquivos runtime/documentação desta tarefa; a linha em branco no fim da memória era preexistente e permanece fora dessa prova. |
| SECURITY | PASS pelo autor — somente configuração estática local de arte; fontes externas/ícones bloqueados no resolver; sem secrets, novos acessos, dependências ou mudança de controles de identidade/ownership. Nenhum achado crítico/alto identificado neste escopo. |
| BIBLICAL CONTENT | N/A — sem edição narrativa ou bíblica. |
| DOCUMENTATION / ACCEPTANCE | PASS — contrato, auditoria, pacote de arte e memória atualizados; fallback autorizado em todos os slots, sem regressão crítica conhecida no escopo validado. |

Falhas tratadas: consultas Testing Library usavam `exact` não suportado pelo tipo; corrigidas e typecheck repetido. Primeira rodada E2E confundia a imagem principal com o retrato do cabeçalho na última consulta; seletor limitado ao compositor e 4/4 repetidos com sucesso. Nenhuma falha foi omitida ou marcada PASS sem nova evidência.

Evidências locais geradas pelo E2E em `test-results/hero-overlays-*-desktop/` e `test-results/hero-overlays-*-mobile/`; matrizes inspecionadas em `test-results/task0031-female-matrix.png` e `test-results/task0031-male-matrix.png`. Arte real ausente continua sendo uma pendência do próximo pacote de arte, sem autorizar ícones no corpo nem fingir validação de encaixe de overlays inexistentes.

## Arquivos da implementação

- `apps/web/features/journey/data/equipmentAssets.ts`
- `apps/web/features/journey/data/bodyAnchors.ts`
- `apps/web/features/journey/components/equipped-avatar.tsx`
- `apps/web/features/journey/screens/equipment.tsx`
- `apps/web/features/journey/journey.module.css` (somente bloco de composição/animações)
- `apps/web/features/journey/equipment-assets.test.ts`
- `apps/web/features/journey/equipment-overlays.test.tsx`
- `apps/web/features/journey/testing/equipment-overlay-fixtures.ts` (somente definições de teste, sem bitmap)
- `tests/e2e/hero-overlays.spec.ts`
- `docs/architecture/EQUIPMENT-OVERLAY-ASSETS.md`
- Este contrato e `.agent/memory/CURRENT_STATE.md`.
