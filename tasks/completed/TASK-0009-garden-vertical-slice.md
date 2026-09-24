# TASK-0009 — Vertical slice jogável: O Jardim e a Escolha
ID: TASK-0009
TITLE: Overworld e Fase 1.1 jogável
STATUS: DONE
SCOPE: mapa, fluxo local da fase 1.1, minigame, quiz, recompensa e replay.
OUT_OF_SCOPE: Fase 1.2, backend, auth, banco, APIs e engine pesada.
ACCEPTANCE_CRITERIA:
- Overworld com regiões, caminhos, viajante/HUD e névoa nos Atos II–VIII.
- Abertura, contexto, reflexão, exploração, minigame, Quiz, recompensa e retorno ao mapa.
- XP/moedas/recompensa principal concedidos uma vez; replay preserva progresso.
- Conteúdo Gênesis 2–3 rotulado CANÔNICO/INTERPRETATIVO e referência por resposta.
VALIDATION:
- npm run lint PASS
- npm run typecheck PASS
- npm test -- --run PASS
- npm run build PASS
- QA manual: fluxo local implementado nas rotas existentes; mobile usa grid responsivo.
SECURITY: sem secrets, rede de produção, conta ou dados pessoais adicionais; consulta bíblica é apenas aviso local.
LIMITATIONS: minigame usa canvas 2D leve; persistência segue localStorage temporário; E2E legado cobre fluxo geral, não a solução completa do labirinto.
PROGRESSION: desafios da Guilda e visão local de líder adicionados; nível 2 exige XP 200, fase concluída e desafio aprovado.
