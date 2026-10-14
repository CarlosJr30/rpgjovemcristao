# TASK-0066 — Fuga da Serpente Mobile-First V2

ID: TASK-0066
TITLE: Câmera mobile, swipe, buffer, modo dedicado e publicação
OBJECTIVE: Ampliar a área real do labirinto no celular, preservar as regras e publicar no Vercel existente para teste físico POCO X7.
PRIORITY: P1 High
STATUS: ACTIVE
SCOPE: Apresentação SnakeChaseGame, módulos de câmera/gestos/buffer, CSS próprio, testes/QA/scripts, contrato/relatório/memória/checklist/política de release; commit e push normal main, deploy automático no projeto existente e validação pública.
OUT_OF_SCOPE: Engine e regras de colisão/perseguição/recompensas/progressão/mapa, Supabase/auth/saves/economia/IDs/Arena/Guilda/Diário/Equipamentos/HD/Body-Fit/catálogos/licenças; instalação de dependências, Git destrutivo, novo projeto Vercel/domínio/plano, novas artes.
DEPENDENCIES: TASK-0065 DEPLOY_COMPLETE, main 428ece99fb5d0779a142cfbf092caea0aeb31b2a.
ASSIGNED_AGENT: Autor com perfis FRONTEND/QA/DEVOPS/SECURITY. Orquestrador registra ampliação desses perfis para os caminhos e operações expressamente autorizados pelo usuário nesta TASK; sem subagentes ou revisão independente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE/WORKFLOW/RULES/SECURITY/ORCHESTRATOR/TOKEN_POLICY, perfis/skills pertinentes, SnakeChaseGame/input/engine e testes, documentação Next local e Pointer/Fullscreen primárias.
SECURITY_CONSIDERATIONS: Baseline SHA antes das alterações, staging seletivo/snapshot sem .env, mídia/segredos/DEV/Body-Fit revisados, QA com fixtures locais descartáveis e serviços externos bloqueados. Original de áudio restrito preservado fora da distribuição.
ACCEPTANCE_CRITERIA:
- Células mobile ≥32 CSS px e câmera limitada ao mundo; avatar reconhecível, mapa ocupa a superfície, desktop mantém visão integral.
- Swipe cardinal/dominante, curto ignorado, cancel seguro, dedo contínuo sem duplicatas; curva válida com buffer curto sem atravessar parede.
- Teclado/direcional preservados; pausa/saída/reinício limpam estado transitório; vitória/derrota e regras permanecem.
- Modo dedicado portrait/landscape, fullscreen real ou fallback, safe areas e reduced motion.
- 11 dimensões contratadas, Android/WebKit quando disponíveis, métricas/antes-depois e QA pertinente sem falhas bloqueantes.
- Lint/types/build/segurança/preservação PASS; main sem divergência, hash remoto igual, Vercel READY/commit correto e validação pública (8 áudios404/DEV404).
- Relatório29itens, checklist/memória/política permanente; teste físico explicitamente pendente do usuário.
TEST_PLAN: Unit de câmera/gesto/buffer/colisão e UI; E2E swipe/teclado/botões/cancel/pausa/câmera/mapa/11dimensões/fullscreen/vitória/derrota; regressões Jornada; métricas de escala/área/latência/performance em ambiente emulado. Build isolado com dependências existentes; sem usar artefato fictício prebuilt no Vercel.
DEFINITION_OF_DONE: DEPLOY_COMPLETE somente após GitHub/hash/Vercel/produção comprovados. Falhas exigem REWORK com histórico preservado. Teste físico segue ao release, sem ser inventado pelo autor.

## Execução

- Diagnóstico: render profiles com cameraFollow=false, escala min(width/864,height/504) e câmera zerada em cada render; portrait restringe stage à proporção12/7. Fullscreen amplia contêiner, mas continua ajustando o mapa integral. Motor usa coordenadas lógicas independentes e moveWithCollision; velocidades/dificuldade mobile já existentes serão preservadas.
- Baseline capturado em build/task-0066-serpent-mobile-first/preservation-before.json antes de alterar código/documentação anterior. Gitfetch origin PASS, main sem divergência, index vazio. Trabalho0059/0063/0065 preservado e separado desta seleção.
- REWORK de QA: baseline WebKit registrou prefetch cancelado ao navegar e medição anterior ao resize; coletor passou a reiniciar na mesma página e aguardar backing store/escala; baseline11dimensões passou no followup sem remover assertions. Typecheck detectou dois erros de tipos exclusivos de fixtures novas, corrigidos; logs de falha preservados. Lint/types/build então PASS209/727/8SHA/54HD.
- REWORK de gameplay: layouts11dimensões Android/WebKit PASS, mas swipe encontrou curva legal recusada junto à parede pela exigência de alinhamento ao centro. Intent passa a usar isBlocked no caminho físico; novo caso regressivo de borda, sem alterar engine/colisão/velocidades. Publicação permanece suspensa até unitários/E2E/gates afetados passarem.
- REWORK de performance: WebKit Windows registrou 7–9 FPS e timeout de derrota; hipóteses de trace/blur foram testadas e insuficientes. Profiling preservado. Implementados DPR adaptativo somente na apresentação, recorte de terreno/fundo visível e cache reduzido de sprites renderizados, sem alterar PNGs. Gates e E2E afetados devem passar antes do release.
- QA mobile: dez casos Android/WebKit passaram após isolamento de composição; derrota WebKit completou dentro de90s, sem aumentar timeout nem alterar relógio/engine. P95 de RAF WebKit Windows~73ms ainda é limitação de emulação, Android~16,7ms. Reversão swipe remove velocidade residual contrária para melhorar resposta; repetir casos de input e gates afetados. Desktop/legados/playthrough e staging ainda pendentes.
- QA com quatro botões explicitamente presentes identificou mapa landscape abaixo de50% quando direcional aberto. HUD landscape passa a quatro colunas, preservando objetivo/valores. Asserts desktop permitem scroll normal até os controles; coletores não alternam uma preferência já aberta inadvertidamente. Falhas originais mantidas; repetir layouts/QA afetados antes de publicar.
- Reversão de swipe e playthrough3fragmentos/portal/vitória/reset/saída PASS Android/WebKit; desktop11viewports e native touch hold/slide/multifinger/cancel/fullscreen/saída em4 orientações PASS. Lint/types/build finalHUD PASS209/727/8SHA. Snapshot/runtime sem.env; antes/depois/artefatos fora do release. Falhas landscape e asserts desktop originais preservados, layoutfollowup em andamento.

- QA_LOCAL_ACCEPTED:35unit/4arquivos,25E2E distintos/0skips,lint/typecheck/build20rotas,209públicos/727artefatos/8SHA/54HD e32HTTP PASS. Gitmain/origin428ece99fb5d0779a142cfbf092caea0aeb31b2a sem divergência; release15caminhos. Commit/push/Vercel/verificação pública pendentes, testePOCO X7 não realizado.
