# TASK-0067 → Cadastro rápido e retomada online
ID: TASK-0067
TITLE: Cadastro rápido
OBJECTIVE: Cadastro nome/e-mail/senha, sessão real, heróis prontos e progresso recuperado automaticamente.
PRIORITY: P1 High
STATUS: VALIDATING
SCOPE: Auth/creação/retomada em apps/web, persistência incremental de progresso em travelers, testes, documentação e publicação conforme RELEASE_POLICY.
OUT_OF_SCOPE: Apagar ou substituir dados existentes, desativar RLS, simular confirmação, novas dependências, alterar gameplay/recompensas/autorização de Guilda.
DEPENDENCIES: Confirm email desativado no painel para teste real sem confirmação.
ASSIGNED_AGENT: Orquestrador assume Frontend, Backend, Database, QA e Security; sem delegação e sem revisão independente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT, CURRENT_STATE (cabeçalho), WORKFLOW, RULES, SECURITY, perfis/skills pertinentes e fontes Auth/create/online-sync.
AUTHORIZATION: Solicitação vigente autoriza runtime Auth/avatar/progresso e Supabase existente; extensão dos perfis Backend/Database a apps/web/lib/supabase e migração aditiva, dentro desse pedido. Política permanente autoriza publicação após gates.
SECURITY_CONSIDERATIONS: Sessão verificada pelo Supabase; RLS de propriedade preservada; metadata somente apresentação; progress JSON não concede autoridade de servidor. Nunca registrar credenciais.
ACCEPTANCE_CRITERIA:
- Cadastro retorna sessão verdadeira e encaminha a criação; falta de sessão mostra erro honesto.
- Personagens prontos, personalização opcional, avatar confirmado no Supabase antes de abrir primeira missão.
- Retorno recupera herói ativo/progresso; troca de Viajante e todos os perfis continuam disponíveis.
- Mobile, mensagens simples e preservação de dados/controles comprovados.
- Configurações manuais identificadas; fluxo completo testado e publicação verificada.
TEST_PLAN:
- Unitários Auth/create/sync/repositories; lint/typecheck/build.
- E2E desktop/mobile cadastro/avatar/primeira missão/login/reload/retorno e negativos.
- Supabase real: configuração pública, cadastro novo de teste sem enviar e-mail, RLS e recuperação; nenhum usuário existente alterado.
- Fingerprint de colunas anteriores e contagem antes/depois da migração.
DEFINITION_OF_DONE:
- Gates e aceite comprovados, publicação verificada e memória atualizada; bloqueio real registrado sem alegar DONE.

## Evidências — 2026-10-11
- Implementado cadastro com sessão/getUser/getSession, 3 heróis prontos, personalização opcional, primeira missão direta, auto-retomada e checkpoints remotos validados. Modo local e seletor explícito preservados.
- Migração aditiva aplicada via MCP: 20261011141155_traveler_journey_progress. CLI Supabase ausente; arquivo local segue convenção 0006 do repositório; não instalar CLI nem reaplicar artefatos como migrações distintas.
- SELF VALIDATE/QA pelo autor: typecheck/lint/build PASS, 367 testes Journey/Supabase PASS, 13 Auth/create finais PASS, 14 E2E desktop/mobile finais PASS/zero skips. 5 dimensões mobile/landscape com capturas, zero overflow. Gates 209 públicos/727 artefatos/8 hashes/54 HD PASS.
- REWORKs preservados: expectativas anteriores não contemplavam auto-retomada, fase explorável sem heading e alert do Next; teste móvel de troca atualizado para menu do perfil. Primeiro check real exigia resposta 200 vazia para anônimo, corrigido para aceitar 401/403 também. Reexecuções PASS.
- Carlos desativou Confirm email; script online real comprovou cadastro com login imediato, avatar/progresso salvos, novo contexto de browser/login, reload e acesso anônimo negado. Nenhuma confirmação simulada.
- Baseline 5 usuários/7 avatares; migração preservou ambos e fingerprint cc911ad950b5433688968b0988d600ce. QA real adicionou 2 contas/avatares, preservados; 7 avatares originais ainda com mesmo hash. RLS authenticated mostrou próprios6/outros0. Advisors mesmos avisos preexistentes25+1; sem novos controles desativados.
- Documentação em docs/architecture/QUICK-REGISTRATION.md e docs/security/TASK-0067-REVIEW.md. Logs/capturas locais em build/task-0067-quick-registration.
- Segurança revisada pelo autor: PASS no diff; sem revisão independente. RELEASE ainda pendente de commit/push/deploy/verificação pública; teste físico cabe ao usuário.
