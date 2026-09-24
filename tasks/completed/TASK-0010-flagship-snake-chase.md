# TASK-0010 — Fuga da Serpente flagship
ID: TASK-0010
TITLE: Transformar Fuga da Serpente em perseguição arcade flagship
OBJECTIVE: Entregar minigame fluido, justo, legível, responsivo e integrado à progressão da Fase 1.1.
PRIORITY: P1 High
STATUS: DONE
SCOPE: Motor e interface da Fuga da Serpente, integração challenge → quiz, estilos e testes diretamente relacionados.
OUT_OF_SCOPE: Avatar, sessão, equipamentos, Guilda, demais etapas da Jornada, recompensas persistentes e novos assets.
DEPENDENCIES: TASK-0009
ASSIGNED_AGENT: FRONTEND, com critérios de GAME DESIGNER e validação QA pelo próprio autor.
REQUIRED_CONTEXT: Solicitação flagship do usuário; apps/web/features/journey/components; phase.tsx; journey.module.css; assets/minigame.
SECURITY_CONSIDERATIONS: Sem novos dados, rede, autenticação ou dependências. Revisão do próprio autor: nenhum secret ou nova superfície de entrada/rede adicionada.
ACCEPTANCE_CRITERIA:
- PASS — Movimento tem aceleração, desaceleração, diagonal normalizada, wall sliding e tolerância simétrica de canto.
- PASS — Mapa deliberado contém três Fragmentos, rotas alternativas, power-ups fixos e portal final.
- PASS — Serpente usa BFS no grid, curva de pressão, três vidas e checkpoint seguro no último Fragmento.
- PASS — Vitória, derrota, replay e assistência após duas derrotas são claros; somente “Continuar para o Quiz” avança a fase.
- PASS — Interface responsiva usa assets existentes, respeita reduced motion e mantém fallback silencioso para áudio.
TEST_PLAN:
- PASS — `npm run lint`.
- PASS — `npm run typecheck`.
- PASS — `npm test`: 8 arquivos, 52 testes.
- PASS — `npm run build`: build Next.js e 15 páginas estáticas geradas.
- PASS — Rota local da fase respondeu HTTP 200 e todos os 15 assets usados foram encontrados.
- PASS — Simulação determinística percorreu os três Fragmentos e o portal com vidas restantes; mapa integralmente conectado.
- N/A — Playtest visual no navegador integrado: conexão indisponível por falha ambiental antes de abrir a aplicação.
SELF_VALIDATE:
- A primeira simulação revelou derrota antes do segundo Fragmento; REWORK aplicado com checkpoint por Fragmento.
- A segunda simulação passou, junto a colisão por 180 frames, wall sliding e progressão de velocidade/assistência.
- Nenhuma alteração em Avatar, sessão, equipamentos, Guilda ou recompensas persistentes.
DEFINITION_OF_DONE:
- Aceite automatizável atendido, checks aprovados, limitação visual registrada e memória atualizada.
