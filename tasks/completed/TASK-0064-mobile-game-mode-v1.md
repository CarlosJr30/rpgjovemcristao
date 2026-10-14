# TASK-0064 — Mobile Game Mode V1

ID: TASK-0064
TITLE: Mobile Game Mode V1
OBJECTIVE: Reorganizar as telas existentes para uma experiência de jogo mobile, com provas visuais e desktop preservado.
PRIORITY: P0 Critical
STATUS: DONE
ACCEPTANCE_SCOPE: Somente local; nenhuma publicação ou validação física realizada. Teste POCO X7 e disponibilização/publicação específica pendentes.
SCOPE: Apresentação em apps/web; scripts e testes locais de QA; evidências em build/task-0064-mobile-game-mode; documentação, checklist e memória. Download de navegadores Playwright somente para a matriz autorizada, sem dependências npm novas. Publicação existente somente como baseline de leitura.
OUT_OF_SCOPE: Commit/push/deploy, alterações remotas, Supabase/auth/persistência, IDs/saves/economia/progressão, engines, assets originais, Body-Fit, catálogos/licenças/isolamento de áudio.
DEPENDENCIES: TASK-0062 e release TASK-0063 90aa0fc821b2856f03f114698e5e9e8b8b040a3d; validação física e publicação futura separadas.
ASSIGNED_AGENT: Autor com perfis FRONTEND, QA e SECURITY; sem revisão independente alegada.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE/WORKFLOW/RULES/SECURITY; frontend e suas skills; implementação selecionada das telas.
SECURITY_CONSIDERATIONS: Browser de QA descartável, dados sintéticos, tráfego externo bloqueado exceto baseline público; nenhum login real nem alteração de serviço. Preservar mudanças locais 0059/0063.
ACCEPTANCE_CRITERIA:
- Shell mobile compacto, atividade prioritária, navegação acessível e safe areas, sem escalonamento global.
- Home, Equipamentos, Arena, minigame, Guilda, Diário, login/criação utilizáveis nas 11 dimensões contratadas.
- Comparação antes/depois incluindo área útil, Avatar, combate, ações, CLS e screenshots inspecionados.
- Android Chrome e WebKit emulados; limites de teclado/notch/dispositivo físico explicitados.
- Gates relevantes e desktop sem regressões críticas; arquivos protegidos preservados.
TEST_PLAN: Baseline antes de runtime edits; matriz visual e interações; unitários afetados; lint/typecheck/build; isolamento de produção e hashes; QA/Security pelo autor.
DEFINITION_OF_DONE: Conclusão local somente com provas visuais e gates; publicação e aceite físico permanecem separados conforme pedido. Nenhum DONE inventado diante de falha.

## Execução

- 2026-10-10: contrato registrado; HEAD/main 90aa0fc; alterações anteriores preservadas. Diagnóstico e baseline em andamento.
- 2026-10-10 ACTIVE → VALIDATING → REWORK → ACTIVE: baseline e implementação; falhas de prioridade das ações em 320×568, proporção de Equipamentos, overflow WebKit, media query/coletores e download duplicado Guilda corrigidos. Histórico detalhado e resultados originais preservados no relatório/evidências.
- 2026-10-10 VALIDATING → REWORK → ACTIVE: redução do tráfego dos ícones de Equipamentos; tentativa lazy/defer insuficiente, miniaturas via otimizador Next existente. Atributos JSX duplicados corrigidos; cenário de arte ausente inclui URLs otimizadas, sem afrouxar assertions.
- 2026-10-10 VALIDATING → DONE local: 67 unitários distintos/13 arquivos; 63 E2E PASS/1 SKIP mobile intencional no desktop; 231 observações por motor/11 dimensões, zero overflow/erros/HUD sobreposto; lint/typecheck/build PASS, público209/artefatos726/8 SHA/54 HD. Segurança HTTP25 PASS; preservação do baseline2017 e HEAD sem mudanças inesperadas. QA/Security pelo autor.
- Relatório: docs/architecture/TASK-0064-MOBILE-GAME-MODE-REPORT.md. Galeria: build/task-0064-mobile-game-mode/review/index.html; resumo/aceite/preservação/performance e logs na mesma raiz. Desktop e interação inspecionados, sem equivalência pixel a pixel ou certificação WCAG.
- Physical QA: POCO X7 informado pelo usuário; SO/navegador/teclado/notch reais não confirmados. Roteiro preparado, nenhum PASS físico. Publicação atual continua TASK-0063; nenhum commit/push/deploy novo. Não iniciar PWA/engine/assets ou outra tarefa automaticamente.
