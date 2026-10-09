# TASK-0014 → Fase A do RPG vivo e retrato da Fuga da Serpente
ID: TASK-0014
TITLE: Progressão inicial e retrato do Viajante no minigame
OBJECTIVE: Dar objetivo ao XP já ganho e substituir o corpo inteiro no minigame por um retrato do Viajante ativo, preservando os demais fluxos.
PRIORITY: P1 High
STATUS: REWORK
SCOPE: Resolver do retrato, desenho e controle da Fuga, tabela de níveis, concessão de XP existente, interface do Herói, testes pertinentes e memória.
OUT_OF_SCOPE: Loja, catálogo amplo de equipamentos, overlays sem assets, infraestrutura online e sistemas de Guilda avançados; registrar como fases posteriores do pedido.
DEPENDENCIES: TASK-0013 em REWORK; reutilizar estado atual sem sobrescrever trabalho local.
ASSIGNED_AGENT: Orquestrador atuando como frontend, game designer e QA locais.
REQUIRED_CONTEXT: Pedido anexado, estado atual, engine do minigame, traveler, persistência, recompensas e tela do Herói.
SECURITY_CONSIDERATIONS: Persistência local por Viajante, validação estrita e recompensas idempotentes; revisão do próprio autor.
ACCEPTANCE_CRITERIA:
- Retrato no minigame deriva da aparência ativa, ocupa menos espaço e preserva o Avatar completo nas outras telas.
- Colisor lógico continua independente da arte e movimento mantém wall sliding.
- XP existente eleva nível segundo configuração central e a tela indica o próximo desbloqueio.
- Saves anteriores e múltiplos Viajantes preservam dados após reload.
TEST_PLAN:
- Testes unitários de progressão, migração e engine; lint, typecheck, build; inspeção visual se navegador disponível.
DEFINITION_OF_DONE:
- Aceite demonstrado, gates aplicáveis registrados e memória atualizada.

## Evidências e revisão do próprio autor — 2026-09-23

- BUILD PASS: `npm run build` fora do sandbox; 15 páginas estáticas geradas. A primeira execução no sandbox compilou, mas falhou em `spawn EPERM` na etapa de TypeScript.
- LINT PASS e TYPECHECK PASS: `npm run lint` e `npm run typecheck`.
- UNIT TEST PASS: `npm test`, 73/73, incluindo nível, bônus único, retrato derivado e migração por Viajante. Vitest também exigiu execução fora do sandbox por `spawn EPERM`.
- INTEGRATION TEST PASS: `npm run test:e2e`, 14/14 em desktop e mobile; o teste do minigame inicia a perseguição sem erro de página.
- ACCEPTANCE CRITERIA REWORK: captura E2E desktop inspecionada; retrato reconhecível no corredor. Captura mobile revisada após câmera suave 1,45×, com marcador maior. Partida manual completa, curvas, derrota e vitória ainda sem avaliação subjetiva.
- SECURITY REVIEW PASS (autor, não independente): mudanças locais sem secrets, compra ou nova entrada externa; nível recalculado de XP e saves por Viajante testados. A persistência local não dá autoridade de produção.
- DOCUMENTATION UPDATED: `docs/architecture/LIVING-RPG-PHASE-A.md`; backlog `TASK-0015`–`0017`.
- NO SECRETS PASS: varredura dos arquivos de código alterados sem padrão de credencial; NO KNOWN CRITICAL REGRESSIONS PASS nos checks executados.

Condição de aceite pendente: jogar a Fuga em mobile e desktop até vitória/derrota, verificando curva, colisão, Serpente, pickups e portal. Manter REWORK até esse passe. Lint/typecheck/build e E2E 14/14 foram repetidos após a câmera; Vitest 73/73 após correção da soma entre moedas de recompensa e bônus do nível 2.

## Correção responsiva — 2026-09-27

- ROOT CAUSE: o buffer fixo `720 × 420` era reduzido por `width: 100%; height: auto`; o zoom móvel interno de `1,45×` não aumentava a área física do jogo.
- IMPLEMENTAÇÃO: buffer sincronizado ao tamanho CSS e DPR (máximo 2), viewport real para a câmera, limites iniciais corrigidos e perfis centralizados: portrait `1,5×`, landscape `1,25×`, tablet `1,4×`, desktop `1×`.
- LEGIBILIDADE: escala visual independente para Viajante/Serpente/pickups; colisores, movimento, regras, mapa, progressão e persistência não mudaram. HUD mobile compacto e touch 52 × 48 px.
- VISUAL QA PASS: capturas inspecionadas em 360 × 800, 390 × 844, 412 × 915, 844 × 390, 768 × 1024 e 1440 × 900. Mobile acompanha o Viajante sem mostrar o mapa inteiro; tablet/landscape adaptam; desktop mantém o enquadramento completo.
- AUTOMATED QA PASS: lint, typecheck, build (19 páginas), Vitest 145/145 e E2E responsivo. A execução agrupada dos E2E antigos encontrou quatro falhas anteriores ao minigame: helpers desatualizados não escolhem o modo local explícito e o botão de criação fica corretamente desabilitado.
- STATUS: REWORK mantido somente pela partida manual completa até vitória/derrota, pendência herdada; o aceite responsivo deste pedido está comprovado.
