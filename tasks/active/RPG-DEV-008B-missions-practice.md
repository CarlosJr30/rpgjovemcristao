# RPG-DEV-008B — Missões demonstrativas sem progressão

ID: RPG-DEV-008B
TITLE: Recuperar atividades existentes do Jardim sem persistência ou economia
OBJECTIVE: Leitura obrigatória, compreensão, oração opcional, reflexão, exploração e quiz existentes, claramente demonstrativos.
PRIORITY: P1 High
STATUS: VALIDATING
SCOPE: apps/web componentes legados com modo demonstrativo/injeção de estado em memória, nova composição de Missões, rota controlada/menu, testes/docs/memória/CI/Preview/publicação conforme RELEASE_POLICY. Autor assume Frontend/Backend/Game Designer/Biblical Content/QA/Security/DevOps nos limites explícitos; não há delegação.
OUT_OF_SCOPE: Escritas de progresso/XP/moedas/itens/cartas, equipamentos/PR12, Guilda/EBD, novos roteiros, histórias candidatas não homologadas, minigame ainda separado em008C, migrations.
DEPENDENCIES: base main0357b44; manter008A/PR15 em branch separada e reconciliar somente alterações aprovadas no fluxo normal.
REQUIRED_CONTEXT: solicitação008, RELEASE_POLICY, parecer PHASE-1-1-CONTENT-REVIEW, componentes e testes existentes, relatório008A no worktree próprio.
SECURITY_CONSIDERATIONS: Auth/RLS originais, snapshot próprio fresco, estado demonstrativo apenas em memória descartado ao sair/recarregar/trocar identidade. Proibir callbacks legados de persistência em modo demonstração; esconder/conter todas as concessões da exploração. PROD somente consultas autorizadas, exercícios reais em TEST; sem recursos pagos.
ACCEPTANCE_CRITERIA:
- Recuperar visual e conteúdo aprovado do Jardim; não publicar quatro cadernos candidatos como homologados.
- Leitura/objetivos/checkpoint/quiz validados localmente, sem gabarito espiritual ou recompensa.
- Progresso oficial permanece inalterado; reexecução/reload não fabrica conclusão.
- Missões individuais independentes da Guilda; preservar funcionalidades e permissions007/Guilda/EBD.
- Todos os gates técnicos/Preview/Auth/RLS/preservação/CI antes de merge e pós-deploy.
TEST_PLAN: unitários e integração de atividades/negações, lint/types/build/CI, Chromium/WebKit desktop/celular, API/hash hospedados; fixtures não são prova hospedada; PostgreSQL N/A se não houver SQL ou mudança de autoridade.
DEFINITION_OF_DONE: critérios/gates aplicáveis comprovados e documentação/memória atualizadas; falha REWORK, dependência crítica BLOCKED; não declarar deploy sem conferência remota.

Preparação em27/10/2026: branch própria codex/rpg-dev-008b-missions, worktree separado sobre main; sem alterações remotas ou liberaçãoB. Autoridade complete_story exige recibos/vídeo/recompensa e EXECUTE está bloqueado; não será concedido. Alternativa demonstrativa explicitamente autorizada pelo usuário.

## SELF VALIDATE parcial

Modo demonstrativo com callback explícito de estado; callback ausente é no-op, sem fallback à persistência legada. Composição limpa respostas, não exibe reflexão persistida e copia apenas progress para memória; fonte/economia intactas. Unidade integrada percorre leituras/checkpoint/reflexão/três objetivos/quiz/reinício, verifica updateTraveler não chamado/source idêntico; não é prova hospedada.

Base007:829unit PASS/74SKIP (124 arquivos/7 opt-in), lint/types/build PASS. Primeira suíte paralela teve timeout5000ms no scan de mídia existente, sem divergência de hashes; teste individual5PASS e suíte completa4workers PASS, sem alterar assertions/limites. Unitário inicial precisou polyfill showModal/close de jsdom conforme teste existente; tipos do teste corrigidos, sem runtimefix. QA/Security/React/editorial pelo autor. PostgreSQL N/A: zeroSQL/migration/autoridade nova. Browser local/Preview/CI/pós-deploy PENDING; candidato não aprovado para publicação neste checkpoint.
