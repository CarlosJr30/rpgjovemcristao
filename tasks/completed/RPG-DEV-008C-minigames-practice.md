# RPG-DEV-008C — Fuga da Serpente demonstrativa

ID: RPG-DEV-008C
TITLE: Recuperar minigame existente sem progressão ou economia
OBJECTIVE: Reutilizar Fuga da Serpente, arte e controles aprovados, com resultado/reinício apenas em memória.
PRIORITY: P1 High
STATUS: DONE
SCOPE: Composição segura em apps/web/features/journey/screens, rota dedicada, testes pertinentes e documentação. Frontend/Game Designer/Biblical Content/QA/Security/DevOps assumidos pelo autor nos limites autorizados; sem delegação. GitHub/Preview/produção somente após RELEASE_POLICY e gates aprovados.
OUT_OF_SCOPE: Alterar engine/arte aprovada sem falha comprovada, recompensas, XP/moedas/itens/cartas, escrita de progresso/tutorial, completion RPC, equipamentos/PR12, Arena/Torre/Loja, novas histórias/minigames.
DEPENDENCIES: branch própria reconciliada por merge normal com008B publicada em f4e8b82 e registro documental c7e90b7. PR12 não incluída. Sem migration ou novos serviços/dependências de produto.
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

## ACEITE FINAL — DONE / DEPLOY_COMPLETE27/10/2026

PR17/candidato8f14949db19df76b8dc2878ec502483bf8a318d1/merge c14fd5e560f6e4930e18a1e493a901dea2ba0ed0; CI push40591880684/PR40591887605/main40595207248 success.858unit PASS/74SKIP, lint/tipos/build/protocolo25 PASS;21direcionados incluídos,24RSC/222UI/48Guilda sintéticos.31checks locais preservados;43superset (13desktop/15WebKit/15Chromiumtoque) PASS. Engine/arte/dificuldade originais, fragmentos/cristais confirmados pelo usuário, sem nova coleta de maçãs.

Preview TEST READY/exatoSHA/dpl_9N7B5kzHtCevad2G8G4DDNJichis:241checks reais PASS (231UI/API e10finais retomados),43Serpente/36Missões/Auth/RLS/isolamento/Guilda/EBD/consultas e bloqueios. Falhas de coletor/CI antigo preservadas no relatório, sem chamar rodadas interrompidas PASS ou alterar runtime/asserções/limites para ocultá-las. Mobile emulado, não físico; mesma sessão normal reutilizada em memória.73profile ignore-duplicates e4RPCs revisadas de leitura, sem escrita inesperada. Partidas completas sóTEST.

PROD dpl_8Pi4mXQUCaMcirqq5kLpXZdH9sRk/READY/production/merge exato, alias oficial https://rpgjovemcristao-web-inky.vercel.app confirmado após promoção do mesmo artefato.179checks antes+179oficial PASS, Chromium/WebKit: leituras/abertura/reload somente, ativo50 autorizado confirmado, sem antigo1.70profile ignore-duplicates e8RPCs revisadas de leitura por rodada produtiva, hashes iguais.40TEST/38PROD e estruturas idênticos;75funções/39policies PROD e24funções privadas Guilda/EBD adicionais preservadas. Nenhuma migration/SQL, progressão, XP/moedas/itens/cartas concedidos ou recompensa econômica. Auth/RLS/bloqueios/PR12 independentes.

Recuperação app008B preparada antes de merge, domínio retido atéCImerge/179checks; reversão não necessária. autoAssign true/proteções restauradas, sem rebuild/deploy duplicado. QA/Security/React/conteúdo pelo autor, sem independência. Evidência RPG-DEV-008C-RELEASE-EVIDENCE.json e relatório008 contêm hashes/URLs/CI/proveniência/limitações; avisos legados e cartas TEST antigas pendentes sem fabricar prova. Sem bloqueio críticoC. Documentação final isolada não exige deploy. Checkpoints seguintes são históricos, substituídos por este aceite.

## Homologação e publicação autorizadas — retomada27/10/2026

Usuário autoriza concluir CI/Preview TEST/fluxos reais/segurança/produção/conferência conforme RELEASE_POLICY, preservando engine/arte/dificuldade e PR12. Confirma posteriormente publicar a versão existente com fragmentos/cristais, pois esta engine não contém maçãs. Não fabricar esse teste nem inserir outra coleta. Manter858unit/74SKIP e31checks locais anteriores como evidências preservadas; acrescentar colisões/coletas e saída/reload na validação hospedada, sem instrumentar ou alterar runtime. PROD somente consultas e abertura/reload autorizados no ativo50; positivos interativos completos em TEST. Nenhuma migration necessária. Estado VALIDATING; nenhuma evidência remota pendente vira PASS.

Complemento local43checks PASS (13desktop/15WebKit/15Chromiumtoque), mantendo31anteriores +12segurança:colisão/pontuação local/saída/reload.21unitários direcionados/lint/types/buildNext PASS. Apenas aviso de cristais e link de Missões atualizados; engine/arte/dificuldade intactas. CI4ca8081 pushsuccess/PRtentativa2success, primeira pré-condição RSC não atingida preservada. Novo candidato atualizado exige CI/Preview reais antes de merge. Baselines40TEST/38PROD/estruturas renovados iguais008B;0migrationC. QA/Security/React/conteúdo pelo autor.

## Preparação após008B — validada localmente, NÃO PUBLICADA

27/10/2026. Merge de base b324baeee81c2209f3110fda1b8c5d5def86ad7c preserva as duas demonstrações, menu11/8links/3bloqueios e adiciona somente a rota exata de Serpente na candidata. Conflitos resolvidos explicitamente em read-only/release-scope/teste, sem broadening de economia ou autoridades. Engine/arte originais; somente prop opcional de rótulo final no componente legado. QA/Security/React/Biblical Content pelo autor.

**858unit PASS/74SKIP**,127arquivos/7opt-in omitidos, lint/types e buildNext PASS. Primeira suíte4workers:857PASS/1FAIL/74SKIP por timeout5000ms na importação do adaptador database não alterado. Teste isolado2PASS e suíte completa1worker858PASS sem mudar código, mocks, assertions ou limites. Primeira falha preservada em build/rpg-dev-008c/unit-after-008b.log.

**31checks de navegador repetidos na baseB PASS**, Chromium desktop9/WebKit390px11/Chromium390px11; vitória/derrota/replay/pausa/saída, movimento e liberação dos controles. WebKit usa PointerEvents com mouse capturado no viewport móvel; Chromium usa toque CDP emulado touchStart/hold/touchEnd. O rótulo android-emulated não representa aparelho/Android real. Zero page errors/mutações inesperadas fora do perfil sintético. Captura móvel inspecionada; pontuação é estado local da engine, não XP/moedas. Evidências anteriores preservadas em build/rpg-dev-008c-before-008b. syntheticData=true/productionProof=false, sem teste físico ou hospedado inferido.

Entrega atual é **preparação em PR draft**, não aceite/publicação008C. Próximos gates: CI exato; Preview com backend TEST e sessão normal autorizada, fluxo real/isolamento/hashes antes/depois; revisar regressões007/008A/B/Guilda/EBD e segurança; renovar baseline/configuração/plano de reversão para008B antes de eventual merge/deploy normal; conferir produção apenas por leituras autorizadas e promover só após gates. Sem migration prevista, concessões, escrita de tutorial/progresso ou recurso pago. CI/Preview/PROD008C continuam pendentes; produção segue008B. Esta solicitação não libera008C.

Checkpoint posterior na base008A:854unit PASS/74SKIP, lint/types/buildNext PASS. Browser local **31checks PASS**, Chromium desktop9, WebKit390px11 e Chromium390px11. PointerEvents WebKit via mouse capturado em viewport móvel; Chromium usa CDP touchStart/hold/touchEnd com toque emulado. Deslocamento real e liberação do direcional verificados, além de vitória/derrota/retry. Zero page errors/escritas inesperadas. Tudo syntheticData=true/productionProof=false, sem aparelho físico ou sessão hospedada. Coletor passou a selecionar direcional pela viewport, pois maxTouchPoints WebKit era0; sem mudar engine/physics ou resultados. Evidências anteriores preservadas. Após008B publicada, reconciliar a base e revalidar; não liberar008C nesta etapa. Demais gates hospedados/CI/publicação PENDING.

Na base007:65 testes direcionados PASS;828unit PASS/74SKIP (124 arquivos/7 opt-in) com4workers, lint/types PASS; buildNext real com backend sintético PASS. Timeout inicial5000ms no scan de mídia preservado; individual5PASS, sem alterar hashes/assertions/limites. Nenhuma mudança de engine/arte. Única adaptação no componente original é prop opcional de texto do botão final; default legado preservado, composição usa Encerrar demonstração.

Browser no bundle real local: **18 checks PASS**, Chromium desktop e WebKit390px; movimento por teclado, pausa, vitória real por controles normais seguindo métricas somente leitura do canvas, callback final sem progressão, nova partida, derrota real por perseguição/vidas, retry, saída e largura. Zero page errors ou chamadas REST de mutação além do bootstrap do perfil sintético. syntheticData=true/productionProof=false; não é sessão hospedada ou aparelho físico. Primeira rodada desktop passou9; móvel coletor encontrou findPath vazio ao já estar na célula-alvo, corrigida navegação do coletor sem alterar física/serpente/resultados; segunda rodada9+9 aprovada, primeira evidência preservada.

Provas de gestos móveis adicionais/Preview real/Auth/RLS/hashes/CI/gates produtivos ainda pendentes. Não publicado. PostgreSQL N/A: semSQL/migration/autoridade. QA/Security/React/Biblical Content pelo autor; mecânicas ficcionais e maçãs distintas do fruto visíveis, sem novas paráfrases bíblicas ou recompensas.
