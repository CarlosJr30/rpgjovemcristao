# TASK-0013 → Passe incremental de imersão da Fase 1.1
ID: TASK-0013
TITLE: Passe incremental de imersão, jogabilidade e integração bíblica
OBJECTIVE: Refinar a Fase 1.1 conforme o contexto mestre, preservando fluxos já funcionais.
PRIORITY: P1 High
STATUS: REWORK
SCOPE: Fuga da Serpente, equipamento, códice, feedback, persistência vinculada e testes da Fase 1.1.
OUT_OF_SCOPE: redesign geral, novas fases, serviços, dependências e alteração das regras de Guilda.
DEPENDENCIES: TASK-0012 quanto ao balanceamento e limpeza local já executados.
ASSIGNED_AGENT: orquestrador assumindo perfis de frontend, game design, QA, Security e revisão bíblica localmente; revisões não independentes.
REQUIRED_CONTEXT: AGENTS.md, contexto global, estado, workflow, regras, segurança e arquivos afetados.
SECURITY_CONSIDERATIONS: validar saves locais, links externos seguros, sem enviar reflexão privada ou dados de Viajantes.
ACCEPTANCE_CRITERIA:
- Controles, colisão, escala, largura útil e mapa do minigame funcionam com tensão justa.
- Leitura, exploração, Devocional e Quiz mantêm os gates e feedback corretos.
- Equipamentos têm referência temática, link, apresentação e feedback; itens continuam fictícios.
- Códice registra itens descobertos sem duplicar recompensa nem quebrar saves anteriores.
- Guilda e limpeza local permanecem intactas.
TEST_PLAN:
- Inspeção seletiva, testes de movimento e rota, testes de persistência/quiz/equipamento, E2E dos fluxos pertinentes, lint/typecheck/build, playtest visual quando viável.
DEFINITION_OF_DONE: aceite comprovado, QA/Security/revisão bíblica registrados, memória atualizada.

## Evidências

Passe incremental implementado em 2026-09-23. `REWORK` indica que o aceite experiencial da partida completa ainda exige playtest manual.

- Motor: collider dos pés 8 × 5,5 → 6 × 4, movimento por eixo e mapa 24 × 14 mantidos; quatro trechos foram abertos para clareiras/rotas alternativas. Velocidade da Serpente e grace period já tinham sido ajustados na TASK-0012 (77% → 88% → 96%; 2,3 s; 1,35 s após dano).
- Cena: Avatar do minigame 42 × 62 → 32 × 47; terreno estático em canvas de cache, vegetação orgânica nova, rochas irregulares, água/ponte/landmarks preservados; efeitos de coleta agora viajam até a borda superior do canvas. Portal possui transição de 0,7 s LOCKED → ACTIVATING → OPEN. Sprites de Serpente alternam, Avatar customizado usa pose/sway/bob/impacto/vitória; `prefers-reduced-motion` aplicado. Visão completa do mapa dispensa câmera de acompanhamento nesta escala.
- Equipamentos: metadados temáticos por ID estável, três itens existentes com referências e links; `wisdom-amulet` renomeado visualmente para Medalhão com migração de saves; tela tem arte, detalhe bíblico, feedback e animação curta; Códice deriva descobertas do inventário. Slots sem item concreto permanecem temas para catálogo futuro. Overlay do Avatar ainda requer asset dedicado.
- Persistência e Security: equipar sincroniza `avatar.equippedItems`; parser valida inventário e referências equipadas; links externos usam `noopener noreferrer`; Códice não expõe reflexão privada. Guilda, Quiz, leitura e Devocional preservados. Parecer editorial ampliado em `docs/biblical/PHASE-1-1-CONTENT-REVIEW.md`.
- QA: lint PASS, typecheck PASS, Vitest 70/70 PASS, Playwright 14/14 PASS (desktop/mobile), build PASS. Inspeção visual das capturas desktop/mobile do início do minigame e da tela de equipamentos concluída. Simulação do motor percorre três Fragmentos e portal com vida restante.
- Pendente: playtest manual de partida completa, incluindo colisões em todas as rotas, dano/respawn, portal, vitória/derrota/replay e avaliação subjetiva de fluidez/diversão; sprites `walk_01`/`walk_02`, `hurt`, `victory` compatíveis com toda customização do Avatar; overlay dedicado de itens. Navegador integrado falhou no ambiente, então Playwright isolado foi usado para E2E. A TASK-0012 registra cópias temporárias de auditoria cuja remoção foi recusada pela revisão automática.

## Gates

BUILD PASS; LINT PASS; TYPECHECK PASS; UNIT TEST PASS (70/70); INTEGRATION/E2E PASS (14/14); DOCUMENTATION UPDATED PASS; NO SECRETS PASS; NO KNOWN CRITICAL REGRESSIONS PASS. QA visual do início desktop/mobile PASS, QA da partida completa PENDENTE. Security review pelo mesmo autor PASS para validação de saves, privacidade do Devocional e links externos, sem revisão independente. Revisão bíblica pelo mesmo autor PASS para as três referências de itens fictícios, registrada no parecer de conteúdo. ACCEPTANCE CRITERIA PENDENTE até o playtest completo e sprites finais.
