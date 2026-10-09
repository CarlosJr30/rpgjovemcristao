# TASK-0024 → Correções da auditoria: Guilda, Arena e Fuga
ID: TASK-0024
TITLE: Correções da auditoria: Guilda, Arena e Fuga
OBJECTIVE: Corrigir os cinco problemas observáveis apontados na auditoria sem refazer os sistemas existentes.
PRIORITY: P1 High
STATUS: ACTIVE
SCOPE: painel local da Guilda, gate sem Guilda, apresentação de efeitos/poder na Arena, onboarding da Fuga, persistência e testes diretamente relacionados.
OUT_OF_SCOPE: backend multiusuário, autenticação, PvP remoto, reformulação visual geral, fases novas e alterações no fluxo canônico de aprovação.
DEPENDENCIES: TASK-0011, TASK-0018, TASK-0023.
ASSIGNED_AGENT: FRONTEND com integração autorizada aos módulos locais de domínio, engine e persistência requeridos pelo pedido.
REQUIRED_CONTEXT: contrato do usuário, estado atual, componentes Guilda/Arena/Fuga, Battle Engine e repositórios locais.
SECURITY_CONSIDERATIONS: simulação local identificada; códigos validados; URLs bíblicas restritas; nenhuma alegação de autoridade remota; dados persistidos limitados e validados.
ACCEPTANCE_CRITERIA:
- Modo Líder mostra criação, aprovações e conteúdo ativo com ações reais locais.
- Jogador sem Guilda pode entrar por código conhecido, criar Guilda de teste e entender o gate; aprovação continua obrigatória.
- Arena separa habilidade ativa, passiva e disparada, mostra cooldown/detalhes e explica Poder de Combate por componentes.
- Primeira Fuga explica objetivo, controles, fragmentos, Serpente, portal, respawn, maçãs e power-ups; tutorial não reaparece para o mesmo Viajante.
- Visual e fluxos existentes permanecem funcionais em desktop/mobile.
TEST_PLAN:
- Testes unitários para repositórios, gate, migração, poder e efeitos.
- E2E dos cinco fluxos corrigidos em desktop/mobile.
- Lint, typecheck, build e inspeção visual das telas principais.
DEFINITION_OF_DONE:
- Todos os critérios comprovados, gates registrados, memória atualizada e tarefa movida para `tasks/completed/`.
