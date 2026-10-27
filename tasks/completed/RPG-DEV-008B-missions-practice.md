# RPG-DEV-008B — Missões demonstrativas sem progressão

ID: RPG-DEV-008B
TITLE: Recuperar atividades existentes do Jardim sem persistência ou economia
OBJECTIVE: Leitura obrigatória, compreensão, oração opcional, reflexão, exploração e quiz existentes, claramente demonstrativos.
PRIORITY: P1 High
STATUS: DONE / DEPLOY_COMPLETE
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

## Aceite final em27/10/2026

Gates obrigatórios PASS:855unit/74SKIP, lint/tipos/build/protocolo25, CI64fbf1c e merge f4e8b828f71cf46f9620a6265ec4414d2a7f2f98 (40586736813). Preview177reais/36Missões; PROD158antes+158oficial, Chromium/WebKit390px emulado. Exercícios completos sóTEST; PROD consultas/abertura/reload, ativo50 autorizado. Auth/RLS/negações/economia403 e regressões preservadas.40TEST/38PROD hashes/contagens e estruturas iguais; semSQL/migration/concessões/progressão.58profile ignore-duplicates por rodada completa, sem mudança de hash. Rollback app008A preparado, não necessário. Oficial READY/dpl_3znajcb3iDY5Xq3DNRSqoL8p8UBu/alias exato/configuração restaurada. Relatório/evidência008B contêm URLs, CI, limitações e falhas do coletor. QA/Security/editorial pelo autor. Sem bloqueio críticoB; mobile não físico, cartas antigas hospedadas pendentes. Documentação isolada sem deploy adicional. Checkpoints abaixo são históricos.

Checkpoint posterior: baseA publicada/fechamento2b3ba50 reconciliados por merge normal, com resolução explícita dos menus/rotas/testes; nenhum arquivo da PR12 incluído. 855unit/74SKIP e lint/types PASS na base reconciliada. Browser local real do exercício36checks PASS nas duas engines, sem page errors/mutações REST além do perfil sintético. Sequência original recuperada, resultado/reload somente memória. Regressões adicionais em andamento; gates hospedados/CI/produção PENDING. O parágrafo abaixo preserva a primeira validação na base007.

Modo demonstrativo com callback explícito de estado; callback ausente é no-op, sem fallback à persistência legada. Composição limpa respostas, não exibe reflexão persistida e copia apenas progress para memória; fonte/economia intactas. Unidade integrada percorre leituras/checkpoint/reflexão/três objetivos/quiz/reinício, verifica updateTraveler não chamado/source idêntico; não é prova hospedada.

Base007:829unit PASS/74SKIP (124 arquivos/7 opt-in), lint/types/build PASS. Primeira suíte paralela teve timeout5000ms no scan de mídia existente, sem divergência de hashes; teste individual5PASS e suíte completa4workers PASS, sem alterar assertions/limites. Unitário inicial precisou polyfill showModal/close de jsdom conforme teste existente; tipos do teste corrigidos, sem runtimefix. QA/Security/React/editorial pelo autor. PostgreSQL N/A: zeroSQL/migration/autoridade nova. Browser local/Preview/CI/pós-deploy PENDING; candidato não aprovado para publicação neste checkpoint.
