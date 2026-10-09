# TASK-0043 — Guild Experience V2
ID: TASK-0043
TITLE: Salão da Guilda, missões e experiência do líder
OBJECTIVE: Melhorar apresentação/UX da Guilda existente preservando domínio, privacidade, recompensas e persistência.
PRIORITY: P1 High
STATUS: DONE
SCOPE: Autorização explícita do usuário no pedido TASK-0043: componentes/telas/data de apresentação/CSS Guilda, testes unit/E2E, documentação e memória. Autor assume perfis Frontend/QA/Security localmente, sem delegação. Configuração/evidência de testes locais isolados permitida; nenhum serviço externo.
OUT_OF_SCOPE: Arena/combate/inventário/equipamentos/saves/auth/Supabase/repositórios/migrations/economia/narrativa; geração de mídia, ferramentas novas, publicação, deploy/push/Git destrutivo.
DEPENDENCIES: Guilda existente local/online; TASK-0037 filtros de validade; AudioManager existente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE/WORKFLOW/RULES/SECURITY/TOKEN_POLICY/ORCHESTRATOR, perfis Frontend/QA/Security e skills locais; telas/componentes/filtros/recompensas/testes Guilda.
SECURITY_CONSIDERATIONS: Somente dados já disponíveis; sem expor Auth/diário/reflexões nem buscar informações adicionais. Não modificar regras de aprovação; sem assets fictícios/aprovados, novos áudios ou reutilização Arena.
ACCEPTANCE_CRITERIA:
- Identidade acolhedora, líder/participação e contadores reais com alcance explícito; estados legíveis e recompensas reais.
- Disponíveis somente publicadas/ativas/vigentes/realizáveis/não concluídas; pendências e histórico separados.
- Pendências prioritárias, revisão com dados existentes, aprovação/feedback e idempotência preservados.
- Seis viewports, teclado/foco/reduced motion, sem overflow horizontal; testes/checks pertinentes PASS.
- NEEDS_NEW_ASSET com caminhos/dimensões/transparência/função, sem gerar/carregar ausentes.
TEST_PLAN: Unit filtros/componentes/ações e online via repositories mockados, sem Supabase real; E2E local fluxo completo, matriz seis viewports, screenshots/inspeção, lint/typecheck/build. Não afirmar cobertura visual online autenticada por unit.
DEFINITION_OF_DONE: Aceite local/testes/QA/Security pelo autor com evidências reais, docs e memória atualizadas; não afirmar validação remota.

## Inspeção
- GuildHub local e OnlineGuildHub autenticado; GuildManageScreen reaproveita esses fluxos. GuildContentBoard publica/envia/aprova/resgata conteúdo local. Domínio e repositories ficam intactos.
- Filtros existentes em guildPlayerVisibility; relógio reavalia prazo. Aprovação local permite revisão; online usa reviewWithGuidance e fila prioriza journey_gate. Recompensas vêm de guildMissionRewards/PHASE_GUILD_REWARD/tabelas especiais.
- Baseline de hashes: build/task-0043-evidence/baseline.json. Mudanças anteriores extensas preservadas.

## Aceite — 2026-10-05
- SELF VALIDATE/QA pelo autor: unit 7 arquivos/27 PASS; E2E Guilda 10 PASS (desktop/mobile), matriz jogador/líder nos seis viewports; abertura por teclado, seções, prazos, collectiveTarget, aprovação, XP/moedas/baú reais uma vez, reload/histórico e reduced motion. Lint/typecheck/build PASS, 20 rotas. Logs/screenshots em build/task-0043-evidence.
- GuildHero/CSS compartilhados e neutral emblem, hierarquia/cards/details/estados/recompensas; fila local antes da criação; online revisão com bloqueio concorrente e feedback. Guardas de filtro, regras e repositories originais intactos. Datas inválidas continuam fechadas pelo filtro original.
- REWORK: rótulo de painel mantido para compatibilidade; teste E2E de baú corrigido para mapa por chestType. Falhas intermediárias não são PASS.
- Security pelo autor PASS local, não independente; sem novo achado alto/crítico. Nenhum acesso/escrita/validação visual autenticada ou teste RLS remoto. Áudio guildApproval só pela infraestrutura existente, sem novo catálogo/áudio. Arena Suno Free continua protótipo não comercial e comercial bloqueado.
- Arquitetura/relatório: docs/architecture/GUILD-EXPERIENCE-V2.md; segurança: docs/security/GUILD-EXPERIENCE-V2-REVIEW.md. Seis NEEDS_NEW_ASSET em inventário tipado, sem geração/loader/READY; fallback CSS plenamente utilizável.
- ACCEPTANCE: implementação e testes locais PASS, DONE para escopo desta TASK. Assets futuros/aprovação estética humana e validação remota prévia permanecem pendências explícitas. Memória atualizada; preservação de hashes em build/task-0043-evidence/preservation.json. Nenhuma alteração inesperada/removida no baseline, sem publicação/install/deploy/push/Git destrutivo.
