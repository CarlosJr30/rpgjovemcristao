# STORY-002 — Exploração do Viajante

ID: STORY-002
TITLE: Especificação técnica e visual da exploração da Fase 1
PRIORITY: P1 High
STATUS: DONE — especificação documental concluída
SCOPE: Contrato de cenário para o Mundo 1, Fase 1; auditoria de reutilização; Santuário fictício; sete áreas; controles, colisões, pontos de interesse, acessibilidade, progresso, checkpoints, persistência e interfaces de componentes.
OUT_OF_SCOPE: Implementar runtime, criar conteúdo bíblico/asset, alterar banco remoto, aplicar migrations, fazer grants, mudar economia/Guildas ou publicar/deploy.
DEPENDENCIES: STORY-001A; TASK-0081 e TASK-0073; fontes oficiais CORE-GAMEPLAY-LOOP, CHARACTER-SYSTEM e RPG-ECONOMY-041.
ARTIFACT: [STORY-002 — Contrato técnico e visual](../../docs/game-design/STORY-002-EXPLORATION.md)
NEXT: [STORY-002B — Implementação do primeiro cenário jogável](../backlog/STORY-002B-first-playable-scene.md)

## Resultado e checklist

- [x] Auditar avatar, exploração 2D existente, catálogos, progresso, persistência, navegação e Diário.
- [x] Definir Santuário como espaço fictício e listar o fluxo visual de sete símbolos/áreas.
- [x] Especificar cada área: cenário, objetivo, interação, desafio, evidência, checkpoint e próxima transição.
- [x] Definir desktop/mobile, câmera fixa, colisões simples e alternativa acessível ao mapa.
- [x] Reutilizar Next.js/React, CSS Modules e AvatarRuntime; nenhuma engine, dependência ou asset novo.
- [x] Distinguir progresso Auth/Traveler no servidor de save local por dispositivo.
- [x] Registrar que o esquema atual não prova as sete áreas individualmente; persistência cross-device por área fica bloqueada até contrato de backend revisado.
- [x] Preservar 500 XP, 200 moedas, 2 Baús Comuns, 1 Raro e 1 Épico sem conceder nada; manter as quatro chaves de STORY-001A.
- [x] Manter bloqueio da recompensa de mundo Economy-041, ativação de conteúdo e pools.
- [x] Registrar STORY-002B como próximo trabalho.

## Validação e limites

Revisão documental direcionada do commit-base `c27b608f59e2c6ce25897b886b3d0f4b494bcaa4`. Não foram executadas suites, testes de runtime ou chamadas ao Supabase. Sem mudança de código, schema, mídia, Auth, economy, PROD ou deploy. Auto-revisão documental: PASS; revisão bíblica/editorial independente: PENDING antes de publicar conteúdo. Nenhum teste ou estado de persistência foi declarado PASS sem execução.
