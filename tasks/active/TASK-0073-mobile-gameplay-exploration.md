# TASK-0073 — Mobile gameplay e exploração UX V1
ID: TASK-0073
TITLE: Corrigir apresentação mobile da Fuga da Serpente, exploração e enigmas
OBJECTIVE: Implementar correções mobile-first, validar visualmente e publicar a versão aprovada no Vercel existente, preservando domínio, dados e desktop.
PRIORITY: P0
STATUS: VALIDATING
SCOPE: Apresentação/interação de Serpente, HUD/tutorial/pausa/fullscreen e exploração/enigmas; testes/screenshots/performance; documentação/segurança/preservação; commit/push normal e produção após gates. Autorização explícita no texto anexado de14/10/2026.
OUT_OF_SCOPE: SQL/Supabase/Auth/RLS/migrations, alterar saves/economia/regras/quiz/conteúdo bíblico/assets, ativar Body-Fit pendente, áudios Suno Free em produção, secrets, force/reset/exclusão, novo projeto Vercel.
DEPENDENCIES: main remoto2d4fe22 (PR#1 integrado externamente); TASK0066. Aceite físico POCO X7 separado de emulação.
ASSIGNED_AGENT: Agente principal assume FRONTEND/QA/SECURITY/DEVOPS, sem subagentes/revisão independente. Modelo/esforço solicitados no contrato do usuário não comprovam troca do runtime do agente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE, WORKFLOW/RULES/SECURITY, perfis e skills pertinentes,0066, fontes reais e harnesses afetados.
SECURITY_CONSIDERATIONS: Worktree separado preserva arquivos pendentes0072B; nenhuma alteração remota de banco. QA local com saves sintéticos em contextos descartáveis, sem credenciais em evidências. Assets e módulos protegidos conferidos por hash/Git.
ACCEPTANCE_CRITERIA:
- HUD legível sem truncamento, introdução simples/tutorial2etapas, mapa/câmera/swipe/buffer/regras preservados, fullscreen opcional e safeareas.
- Mapa mobile sem nomes sobrepostos, seleção por toque e painel único acessível, enigmas legíveis/respostas preservadas/foco restaurado.
- Matriz11viewports, Android/WebKit quando disponíveis, visual antes/depois e desktop preservado; sem alegar teste físico.
- Unit/E2E/lint/typecheck/build/segurança/preservação aprovados; commit/push/hash/produçãoREADY/smoke públicos comprovados, sem deployduplicado.
TEST_PLAN: Capturas antes/depois dos fluxos reais em contextos de teste; testes proporcionais de controles/paineis/quiz/persistência e regressões críticas; publicação e oito404áudios.
DEFINITION_OF_DONE: DEPLOY_COMPLETE após READY/hash/smoke; PHYSICAL_QA_APPROVED somente com confirmação do usuário. Checklist/memória/relatório atualizados, bloqueios não tratados como PASS.

## Auditoria inicial
- Fetch confirmou merge externo do PR#1 na main2d4fe22. Não inferir que esse merge comprova aceite real0072B, que permanece pendente nos registros locais anteriores.
- Worktree D:/rpg-jovem-cristao-task-0073, branch fix/mobile-gameplay-exploration-0073, criado de origin/main. Workspace original55bae81 e mudanças documentais0072B preservados.
- Dependências existentes reutilizadas via junction node_modules; configuração privada local copiada somente para arquivo ignorado, sem leitura/log/versionamento de valores. Nenhuma instalação de dependência nova.
- Anexo recebido contém somente texto; prints físicos não presentes nesse diretório. Baseline será capturado na interface real local/emulada.
- Baseline66capturas em11viewports via Edge/Chromium, sem erroJS/overflow. Turbopack não aceita junction de dependências externo: cópia local dos mesmos módulos existentes e links@rpg internos, sem versões/lockfile alterados. WebKit26.6+FFmpeg/Winldd oficiais do Playwright preparados no cache de ferramentas para QA, sem bibliotecas runtime adicionadas ao app.

## Validação local

Intro curta, tutorial2etapas, status curto/completo na pausa, painel contextual nativo único, pontos numerados, respostas parciais e quiz legível implementados. Inspeção final do build detectou fontes/ellipsis herdados no HUD e levou a correção/repetição dos gates afetados. Loop de render/input, câmera/swipe/engine, assets, Auth/chat/repositories/saves/banco preservados por SHA e comparação do loop.

Lint/typecheck/build20rotas/54HD/209públicos/727artefatos/8SHA PASS;443unit/67arquivos PASS.60E2E PASS no primeiro final; revisão de tipografia adicionou3casos texto200% e a execução63 está em andamento.41regressões Home/Arena/Guilda/Auth PASS;1skip desktop de teste exclusivo mobile. HTTP local28checks PASS:7rotas200,8áudios404,8fontes404,5DEV404;18scripts frontend sem service role privada, bundle chat presente. Testes/capturas emulados, sem dados reais nem aceite físico.

Aceite funcional final:63E2E PASS,12rechecks painel/zoom PASS,2vitórias Android/WebKit e2touch nativo/câmera em4orientações PASS.108casos distintos aceitos sem inflar rechecks;41regressões e1skip somente desktop do caso mobile Arena. Chat10checks com fixtures PASS, bundle/código preservados; aceite real de duas contas0072B continua pendente. Capturas143por engine do build final; WebKit aguarda prefetch antes de navegação/fechamento para eliminar cancelamentos artificiais do coletor.

CLI autenticado, equipe/projeto/repo/main confirmados. Publicação pendente de fechamento visual, staging e push normal. Relatório docs/architecture/TASK-0073-MOBILE-GAMEPLAY-EXPLORATION-REPORT.md; parecer docs/security/TASK-0073-MOBILE-PRODUCTION-REVIEW.md; checklist docs/architecture/PROJECT-VALIDATION-CHECKLIST.md.
