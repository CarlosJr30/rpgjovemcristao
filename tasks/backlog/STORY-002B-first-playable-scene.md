# STORY-002B — Implementação do primeiro cenário jogável

ID: STORY-002B
TITLE: Santuário da Jornada + Área do Dia 1 (protótipo jogável)
PRIORITY: P1 High
STATUS: BACKLOG
OBJECTIVE: Implementar uma primeira experiência de exploração controlável, pequena e acessível com entrada pelo Santuário fictício e uma área do Dia 1, reutilizando os componentes atuais sem alterar conteúdo/economia.
SCOPE: Uma rota/composição para o Santuário e uma área 2D jogável “Dia 1 — Luz e trevas”; AvatarRuntime, objetivos, um desafio educacional com dados explicitamente aprovados, controles existentes, colisões estáticas simples, painel, transição/estado da demo e link ao Diário; CSS Modules responsivo; leitura dos estados canônicos quando disponíveis.
OUT_OF_SCOPE: As outras seis áreas; substituir a experiência Garden existente; mídia/assets novos; conceder XP, moedas, baús ou achievement; escrever diretamente progresso/evidência via cliente; schema/migrations/Supabase remoto; alterar Guildas, conteúdo/vídeo publicado, produção, deploy ou autenticação.
DEPENDENCIES: STORY-002-EXPLORATION.md; decisão de conteúdo/editorial do desafio/feedback usado; STORY-001A; contratos atuais de avatar, Auth, shell, exploração e progresso.
REQUIRED_CONTEXT: apps/web/features/journey/components/garden-exploration.tsx (só padrão visual/input); AvatarRuntime, RequireTraveler, storyRepository, useStoryProgress, origins-lessons.ts (candidate; não publicar sem revisão).
SECURITY_CONSIDERATIONS: Reusar o Viajante/Auth já verificado; não tratar IDs, localStorage nem estado React como prova. Nenhuma chamada de grant. Permitir passos canônicos apenas pelo backend aprovado.

## Critérios de aceite

- Santuário rotulado como cenário fictício do jogo; nenhum avatar de Deus ou alegação de local bíblico.
- Avatar existente é exibido e controlável sem nova engine/dependência/asset.
- WASD/setas e mouse em desktop; toque em chão e botão Interagir em mobile; lista semântica acessível replica os comandos e estados.
- Limites do cenário e obstáculo bloqueiam movimento no ponto e no trajeto; câmera fixa; sem rolagem horizontal a 360 px.
- Área Dia 1 possui objetivo claro, ponto de interesse, desafio revisável, feedback acessível e transição visual; tentativa pode ser refeita sem penalidade.
- Se extensão de evidência de área não estiver disponível, demo informa que a posição é temporária e não finge salvar prova/retomar entre dispositivos.
- Nenhuma mutação de economia, Guilda, conclusão canônica de história ou recibo econômico.
- Componentes novos são pequenos e reutilizados por cenário real; não refatorar Garden sem necessidade comprovada.

TEST_PLAN: Revisão direcionada de navegação e identidade; checagens de teclado/toque/leitor de tela, 360 px e desktop; colisão e pontos de interação; sem suites extensas. Testes só no código alterado conforme autorização de implementação vigente.
DEFINITION_OF_DONE: Protótipo jogável e revisável em ambiente autorizado, gates editoriais e de Auth atendidos, nenhum grant, risco de persistência claramente comunicado; release/deploy exige contrato ativo e autorização aplicável.
