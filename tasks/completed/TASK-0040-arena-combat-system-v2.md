# TASK-0040 — Arena combat system V2
ID: TASK-0040
TITLE: Foco, especiais por nível, IA por perfil e apresentação tática da Arena
OBJECTIVE: Três escolhas principais compreensíveis, combate determinístico por perfil e apresentação expressiva compatível com saves.
PRIORITY: P1 High
STATUS: DONE
REWORK_BALANCE: Simulação com build do catálogo real falhou em Elias (zero vitórias/30 seeds usando básico/especial). Ajustar somente templates da Arena: Elias 3/4/2/4, Mara 5/2/5/3 e Noemi 4/3/3/8; preservar fórmula global. Reexecutar guardrail de dificuldade.
REWORK_E2E: Primeira rodada apontou timeout ao tentar clique de botão aria-disabled. Teste deve realizar tentativa intencional indisponível e verificar feedback/turno intacto; cliques disponíveis mantêm actionability normal. Reexecutar após build final com templates ajustados.
REWORK_E2E_RESULT: Última matriz móvel falhou em espera após KO apesar de trace confirmar resultado/salvamento correto. Corrida entre count() e isEnabled() tentava esperar botão já removido; substituir por leitura atômica do DOM, mantendo timeout/aceite. Aplicado também aos dois helpers legados de Arena; reexecutar matriz e gates nível 4/6.
REWORK: Primeira suíte dirigida 36 PASS/1 FAIL; cenário de identidade da IA guardiã não consumia guarda por manter jogador apenas defendendo. Validar sob ataques reais e reexecutar, sem retirar proteção persistente.
SCOPE: Autorização explícita do pedido TASK-0040 para runtime local reversível da Arena. Engine V2 em packages/game-engine/src, integração estrita em data/arena e screens/arena, apresentação/hook/CSS/áudio semântico da Arena, testes pertinentes, docs/game-design e docs/security, contrato e memória. Frontend/Game Designer/Backend/QA/Security assumidos pelo autor, sem subagentes. Orquestrador autoriza extensão dos perfis para engine, testes colocalizados e evidências locais build dentro do escopo concedido pelo usuário.
OUT_OF_SCOPE: Push/deploy/serviços/Supabase/RLS/migrations/exclusão/reset/clean, dependências novas, Guilda/Jornada/Fuga/Auth/economia global/narrativa bíblica, assets/aprovações TASK-0039. Recompensas e fórmulas centrais existentes permanecem.
DEPENDENCIES: TASK-0038; TASK-0039 continua BLOCKED, sem bloquear combate com fallback atual.
ASSIGNED_AGENT: Frontend/Game Designer/Backend/QA/Security pelo autor, sem revisão independente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE/WORKFLOW/RULES/SECURITY/TOKEN_POLICY/ORCHESTRATOR, perfis/skills seletivos, contrato atual e código/testes Arena/engine/progressão estrita; docs Next instaladas.
SECURITY_CONSIDERATIONS: Rejeitar habilidade/nível/custo/loadout inválidos no motor, RNG determinístico sem escolha futura, recursos limitados, sem estado novo obrigatório nos saves, sem mídias fictícias.
ACCEPTANCE_CRITERIA:
- Foco 0–3 configurável, Ataque e Defesa +1; redução próxima defesa; quatro especiais tipados, níveis 2/4/6/8 e loadout <=4, custo/nível validados.
- UI Ataque/Defender/Especiais, painel compacto/locks/feedback, HP/Foco legíveis; Avatar real/fallback e efeitos de equipamento preservados.
- Quatro IAs distintas sem ler escolha futura, dificuldade de treino e fórmula central mantida.
- Sequência antecipação/execução/impacto/recuperação, básico 500–800 ms, especial 1200–2000 ms, reduced motion, som semântico, resultado/recompensa/level-up/unlock reais.
- Unit, E2E dirigido quatro viewports, lint/typecheck/build PASS; saves/histórico atuais compatíveis; memória e relatório 27 itens atualizados.
TEST_PLAN:
- Foco/custo/unlock/efeitos/IA/resultados/entrada inválida/compatibilidade no motor; hook sequência/cleanup; UI e E2E níveis 1/2/4/6/8, defesas/esquiva/especiais, vitória/derrota/level-up/unlock, mobile/desktop/reduced motion.
- Baseline preservado em build/task-0040-baseline; QA/Security pelo autor e inspeção visual de capturas; next-env restaurado.
DEFINITION_OF_DONE: Todos os critérios comprovados e gates PASS; falhas REWORK, sem alegar mídia real ausente.

## Self validate / QA / Security
- Motor V2 separado, API legada/testes preservados; combate usa o cálculo central sem alterar economia/recompensas/progressão global. Catálogo especial/níveis/custos/loadout centralizados. Só templates de treino foram calibrados, ordem/IDs mantidos.
- 51 arquivos/315 unit PASS na fonte final de runtime. Guardrail: 30 seeds por adversário com build real de equipamentos; todos vencíveis sem atributos base fictícios. Limite do teste: essa política/build, não garantia universal de balanceamento/diversão humana.
- Hook percorre quatro fases, HP/Foco/buffs reais por evento, guarda prepara/consome no tempo correto, alvo esquiva e atacante continua golpe; cleanup/lock testados. UI/áudio sem mídia fictícia.
- Lint/typecheck/build finais PASS. Build 20 rotas; next-env restaurado byte a byte após typegen. Código sem dependências novas.
- E2E rodada anterior 19 PASS/1 skip preexistente. Após estados intermediários, 18 PASS/1 FAIL/1 skip: trace mostrou KO e resultado correto, helper sofreu corrida de locator. Rodada final inclui leitura atômica e dois casos extras de nível exato 4/6; resultado no aceite final abaixo.
- Capturas examinadas: impacto de especial mobile, Davi mobile e Noemi desktop; HUD/Avatar/números/ações sem sobreposição; Foco aumentado para >=12 px, verificado na matriz. Evidências em build/task-0040-evidence.
- QA/Security pelo autor, sem revisão independente. docs/security/ARENA-COMBAT-V2-REVIEW.md; relatório de 27 itens docs/game-design/ARENA-COMBAT-V2.md. Conteúdo bíblico N/A: nenhuma narrativa/referência nova, nomes e classificação mecânica/fictícia preservados.
- Assets/approvals/contrato TASK-0039 intocados e BLOCKED. Sem remoto, downloads, publish, Auth/Supabase/schema/Guilda/Jornada/Fuga/economia global ou operação destrutiva.

## Aceite final
- E2E final 24 selecionados: **23 PASS/1 skip** preexistente de teste exclusivo mobile no projeto desktop, nenhum retry/falha. Inclui níveis exatos 4/6 adicionais, 1/2/8, quatro oponentes/quatro viewports, guardas/esquiva/especiais/vitória/derrota/reload/level-up/unlock/reduced motion. Leitura atômica do botão após KO corrigiu a corrida diagnosticada em trace; não aumentado timeout nem alterado critério de vitória.
- 45 PNGs finais em build/task-0040-evidence/e2e-final; inspeção de level-up/unlock mobile adicional PASS. Limite: Edge/Playwright, sem dispositivo físico/Safari iOS ou teste humano de diversão.
- Unit 315, lint/typecheck/build PASS. Checks requeridos e aceitação cumpridos; documentação/memória atualizadas. QA/Security pelo autor, sem revisão independente; nenhum segredo ou regressão crítica conhecida.
- Preservação: 180 baseline, 170 hashes intactos/10 alterações autorizadas incluindo memória; zero inesperado. Dois arquivos anteriormente limpos (data/arena e arena.test) alterados no escopo. Next-env restaurado, assets intactos, outros contratos preservados.
