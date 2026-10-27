# RPG-DEV-008C — Fuga da Serpente demonstrativa

ID: RPG-DEV-008C
TITLE: Recuperar minigame existente sem progressão ou economia
OBJECTIVE: Reutilizar Fuga da Serpente, arte e controles aprovados, com resultado/reinício apenas em memória.
PRIORITY: P1 High
STATUS: VALIDATING
SCOPE: Composição segura em apps/web/features/journey/screens, rota dedicada, testes pertinentes e documentação. Frontend/Game Designer/Biblical Content/QA/Security/DevOps assumidos pelo autor nos limites autorizados; sem delegação. GitHub/Preview/produção somente após RELEASE_POLICY e gates aprovados.
OUT_OF_SCOPE: Alterar engine/arte aprovada sem falha comprovada, recompensas, XP/moedas/itens/cartas, escrita de progresso/tutorial, completion RPC, equipamentos/PR12, Arena/Torre/Loja, novas histórias/minigames.
DEPENDENCIES: branch separada sobre main0357b44; reconciliar apenas008A/B aprovados em fluxo normal. Sem migration ou novos serviços/dependências de produto.
REQUIRED_CONTEXT: solicitação008, RELEASE_POLICY, PHASE-1-1-CONTENT-REVIEW, componente/engine/testes existentes de Serpente, relatório008A.
SECURITY_CONSIDERATIONS: Snapshot próprio fresco via Auth/RLS; tutorial/vitória/derrota/replay somente em memória, nenhuma mutação. Em PROD apenas conferências de leitura autorizadas; positivos interativos em TEST/isolado. Dados alheios inacessíveis. Fixtures não são prova hospedada.
ACCEPTANCE_CRITERIA:
- Movimento, colisões, labirinto, serpente, maçãs, vitória/derrota/reinício e controles desktop/celular preservados e validados.
- Rotular mecânica como ficção; maçãs não são identificação do fruto bíblico, jogador não muda o relato.
- Não avançar fases/missões, salvar tutorial ou conceder recompensas ao ganhar/rejogar.
- Preservar007/Guilda/EBD/11opções e economia bloqueada.
TEST_PLAN: unitários/engine/UI, lint/types/build/CI; Chromium/WebKit local e TEST real; Auth/RLS/hashes; conferência produtiva após gates. Não inventar teste físico a partir de emulação.
DEFINITION_OF_DONE: gates e aceite comprovados, relatório/memória atualizados; se falta crítica, BLOCKED sem alterar produção.

27/10/2026: preparação independente; componente SnakeChaseGame possui callbacks de tutorial/onComplete e estado próprio, sem acesso direto à persistência. A composição não usará callbacks legados da fase. Outros minigames de quatro histórias permanecem candidatos editoriais; não serão publicados como aprovados.

## SELF VALIDATE parcial

Na base007:65 testes direcionados PASS;828unit PASS/74SKIP (124 arquivos/7 opt-in) com4workers, lint/types PASS; buildNext real com backend sintético PASS. Timeout inicial5000ms no scan de mídia preservado; individual5PASS, sem alterar hashes/assertions/limites. Nenhuma mudança de engine/arte. Única adaptação no componente original é prop opcional de texto do botão final; default legado preservado, composição usa Encerrar demonstração.

Browser no bundle real local: **18 checks PASS**, Chromium desktop e WebKit390px; movimento por teclado, pausa, vitória real por controles normais seguindo métricas somente leitura do canvas, callback final sem progressão, nova partida, derrota real por perseguição/vidas, retry, saída e largura. Zero page errors ou chamadas REST de mutação além do bootstrap do perfil sintético. syntheticData=true/productionProof=false; não é sessão hospedada ou aparelho físico. Primeira rodada desktop passou9; móvel coletor encontrou findPath vazio ao já estar na célula-alvo, corrigida navegação do coletor sem alterar física/serpente/resultados; segunda rodada9+9 aprovada, primeira evidência preservada.

Provas de gestos móveis adicionais/Preview real/Auth/RLS/hashes/CI/gates produtivos ainda pendentes. Não publicado. PostgreSQL N/A: semSQL/migration/autoridade. QA/Security/React/Biblical Content pelo autor; mecânicas ficcionais e maçãs distintas do fruto visíveis, sem novas paráfrases bíblicas ou recompensas.
