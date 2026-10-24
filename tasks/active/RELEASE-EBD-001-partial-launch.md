# RELEASE-EBD-001 — Lançamento inicial de Guilda e EBD
ID: RELEASE-EBD-001
STATUS: ACTIVE
PRIORITY: P1
OBJECTIVE: Publicar Auth/avatar/Guilda/EBD com isolamento efetivo de combate,economia,cartas e História.
SCOPE: Frontend e navegação,rotas/API,Auth/recuperação,repositórios; migration aditiva de isolamento/ACL/RLS e integração EBD sem créditos; testes unitários/PG/browser/API; GitHub/CI,TEST/Preview e produção somente após gates. Usuário autoriza explicitamente o runtime e release parcial; bloqueios dos módulos excluídos não impedem release se isolados.
OUT_OF_SCOPE: Apagar dados/código,reset,concessões econômicas,elevação automática de líderes,ativar módulos excluídos ou alterar permissões globais do jogador.
ASSIGNED_AGENT: Principal assumindo Backend/Frontend/Database/QA/Security/DevOps;sem subagentes ou revisão independente.
DEPENDENCIES: RELEASE_POLICY.md,FIX-PROD-008-REPORT.md,basea2a3aef,produção5edc93f;validar dependências e fluxos Auth com contas autorizadas.
ACCEPTANCE_CRITERIA:
- Cadastro/login/logout/recuperação e criação/seleção de avatar funcionam com autenticação real.
- Guilda/QR/entrada/aprovação/papéis/EBD/aulas/atividades/quiz/agenda/presença/histórico validados com isolamento entre Guildas.
- Rotas e chamadas diretas de módulos excluídos bloqueadas no app e banco;dados preservados,Auth/RLS/autoridade mantidos.
- CI do SHA exato,backup/recuperação,migrations somente necessárias,PreviewREADY/fluxos reais e produçãoREADY conferidos;gate obrigatório não executado é BLOCKED.
TEST_PLAN: Mapa de dependências/ACL/RLS;PG isolado e restauração;contas de testes autorizadas;API/browserdesktop/móvel;unit/lint/types/build/CI;comparação de dados e migrations antes/depois;conferência remota.
SECURITY_CONSIDERATIONS: Sem leitura de perfis/cookies;secrets somente armazenamento apropriado;menor privilégio e bloqueios no servidor,SQL e UI;evitar grants/novas recompensas inclusive em EBD.
DEFINITION_OF_DONE: Gates acima comprovados,docs/architecture/RELEASE-EBD-001-REPORT.md e memória atualizados. Falha crítica mantém produção intacta.
