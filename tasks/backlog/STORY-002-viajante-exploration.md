# STORY-002 — Exploração do Viajante

ID: STORY-002
TITLE: Definir a exploração do Viajante na Jornada Bíblica
PRIORITY: P1 — próximo item após STORY-001A
STATUS: BACKLOG
OBJECTIVE: Especificar uma experiência de exploração significativa e acessível para o Viajante na fase inicial, compatível com a narrativa bíblica aprovada e os contratos existentes.
SCOPE: Definir o espaço explorável, objetivos legíveis, pistas e descobertas opcionais, navegação/retomada, distinção entre progresso de história e exploração, e como a exploração se integra às sete missões sem alterar os fatos canônicos.
OUT_OF_SCOPE: Implementar frontend/runtime, adicionar mídia ou assets, publicar conteúdo ou vídeo, conceder recompensas, alterar Guildas/economia, ou abrir gates em bancos remotos.
DEPENDENCIES: STORY-001A (contrato de recompensa e gates); STORY-001/definição narrativa aprovada; TASK-0081 (catálogo e progresso server-side existentes); CORE-GAMEPLAY-LOOP e MISSION-SYSTEM.
REQUIRED_CONTEXT: Fase 1 “No Princípio de Tudo”, Gênesis 1:1–2:3; Viajante; pesquisa de exploração e checkpoints já existentes no repositório.

## Regras de design

- Preservar exploração opcional sem exigir 100% de descobertas para concluir a fase.
- Não avaliar fé ou qualidade de reflexão; nenhuma descoberta exige resposta espiritual.
- Manter acesso ao conteúdo principal independente de Guilda/líder, conforme a exceção da Jornada Bíblica.
- Não criar segredos, colecionáveis, itens ou recompensas sem aprovação de conteúdo/economia.
- Definir alternativa em lista e controles acessíveis para mapa/navegação em telas pequenas.

## Critérios de aceite

- Entregar mapa/diagrama simples ou descrição espacial e lista de nós/áreas, rotas e pontos de interesse.
- Para cada ponto, indicar finalidade (história, missão, contexto bíblico ou opcional) e prova de conclusão, sem confundir visita com conclusão de missão.
- Explicar orientação, retorno ao objetivo, checkpoint e comportamento após recarregar ou trocar de dispositivo.
- Indicar descobertas opcionais e critérios de conclusão sem inventar prêmios; encaminhar quaisquer lacunas de catálogo como decisão explícita.
- Revisar consistência bíblica/editorial e acessibilidade (teclado, toque, foco, leitor de tela, alternativa ao mapa).
- Registrar dependências e impactos em STORY-001A antes de implementação.

TEST_PLAN: Revisão documental direcionada; validar consistência com o loop, catálogo/progresso e acessibilidade. Não executar testes extensos ou chamadas de economia nesta etapa.
DEFINITION_OF_DONE: Especificação de exploração revisável e aprovada, sem implementação, mídia, publicação ou novas concessões.
