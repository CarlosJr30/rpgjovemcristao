# UI-MOBILE-001 — restaurar interface original do RPG

ID: UI-MOBILE-001
TITLE: Recuperar o visual anterior ao RELEASE-EBD-001 com menu móvel funcional
OBJECTIVE: Restaurar layout/cabeçalho/paleta/navegação/apresentação do avatar, preservando os sistemas e fronteiras atuais; entregar capturas antes/depois para aprovação visual.
PRIORITY: P1 High
STATUS: VALIDATING
SCOPE: Mesma PR11/branch codex/rpg-dev-001, base1b65cba; apresentação em apps/web/features/release-ebd e componentes/estilos originais da Jornada; menu original com Guilda/EBD e somente rotas autorizadas; testes, screenshots, relatório/CI/memória. Referência inicial5edc93f, primeiro pai de808433a (pré-lançamento). Reutilizar artes/componentes atuais sem reverter aprovações ou o patchRSC005.
OUT_OF_SCOPE: Publicação produtiva/merge antes da aprovação visual explícita; reativar economia/Arena/Torre/História/equipamentos ou outras rotas bloqueadas; modificar cadastro/Auth/RLS/CORS/proteções/migrations/dados/regras/recompensas; novas dependências ou recursos pagos; reverter commits integralmente.
DEPENDENCIES: PR11 e evidênciasRPG-DEV-005; RELEASE_POLICY; aprovação visual do usuário antes de produção.
ASSIGNED_AGENT: Agente principal assume Frontend/QA/Security/DevOps localmente, sem delegação. Escopo ampliado somente para apresentação, ensaios e operação GitHub/Preview já existente quando necessária para revisão; nenhuma alteração administrativa de backend.
REQUIRED_CONTEXT: Contexto/memória/WORKFLOW/ORCHESTRATOR/TOKEN_POLICY/RULES/SECURITY/RELEASE_POLICY; perfisFrontend/QA/Security e skills locais; guiasNext locais; trechos5edc93f→808433a e fontesUI atuais.
SECURITY_CONSIDERATIONS: isReleasedPath/GAMEPLAY_ENABLED=false/proxy e autoridade servidor imutáveis. Links bloqueados não viram navegação ativa/prefetch. Capturas com dados sintéticos em loopback; não modificar dados de jogadores para demonstrar visual. Segredos nunca em screenshots/logs/commits.
ACCEPTANCE_CRITERIA:

- Fonte histórica identificada, com distinção entre restauração visual e sistemas antigos não autorizados.
- Cabeçalho/paleta/sidebar/identidade/avatar originais recuperados; Guilda/EBD integradas ao menu, home sem grade de botões grandes/links dispersos.
- Menu móvel abre/fecha/navega com toque/teclado/foco, sem overflow horizontal, em retrato/paisagem; rotas proibidas permanecem protegidas e sem links ativos.
- Cadastro/login/recuperação/seleção/logout/Guilda/EBD usam os sistemas atuais; progresso/dados/economia/migrations intactos.
- Testes afetados/integral, lint/types/build/CI e regressãoRSC preservados, evidências reais identificadas.
- Capturas antes/depois desktop/móvel e relatório disponíveis para aprovação; não declarar aceite visual sem resposta humana.
  TEST_PLAN: Baseline da aplicação completa em loopback com Auth/API sintéticos existentes; capturas equivalentes antes/depois. Unitários de navegação permitida/ações/estados; browserChromium/WebKit móvel/retrato/paisagem/teclado/touch; negativasHTTP nas rotas/economia e patchRSC; suíte integral/lint/types/build/protocolo/CI. RevisãoQA/Security pelo autor e inspeção visual das capturas.
  DEFINITION_OF_DONE: Implementação e validações aprovadas, aprovação visual registrada e publicação posterior conforme política/gates aplicáveis. Até aprovação: VALIDATING/PENDING_VISUAL_APPROVAL com produção inalterada, evidências e memória atualizadas; falhas técnicas exigem REWORK.

INITIAL_STATE: Worktree limpa em1b65cba178bb2156f70c737a31b00f25a5babfdc, PR11aberta/draft/base808433a. 798PASS74SKIP anteriores; patchNextRSC005 e aprovações9PNGs/10composições existentes preservados. RootD possui alterações anteriores alheias que não serão sobrescritas.
