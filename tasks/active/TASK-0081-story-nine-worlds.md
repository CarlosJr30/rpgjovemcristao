# TASK-0081 — Modo História: nove mundos e progresso individual
ID: TASK-0081
TITLE: Modo História — contexto 01/09
OBJECTIVE: Auditar e preparar a campanha de nove mundos, validar As Origens e retirar o gate narrativo da Guilda.
PRIORITY: P2 Normal
STATUS: BLOCKED
SCOPE: Catálogo e motor de histórias, mapa/detalhes responsivos, adaptação do Jardim existente, contrato de progresso oficial e SQL proposto localmente, testes, documentação e memória desta tarefa.
OUT_OF_SCOPE: main, merge, push, deploy, produção, migrations remotas, contratos TASK-0078/0080, economia, login/QR, novos assets/dependências, conteúdo bíblico em massa.
DEPENDENCIES: TASK-0080 (autenticação existente reutilizada; aceite hospedado não herdado); TASK-0078 (integração econômica futura).
ASSIGNED_AGENT: Autor assume Architect, Frontend, Backend, Game Designer, Biblical Content, QA e Security; sem delegação nem revisão independente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT, CURRENT_STATE, WORKFLOW, RULES, SECURITY, perfis/skills seletivos e auditoria do Jardim.
SECURITY_CONSIDERATIONS: Estado oficial separado de saves adulteráveis; somente servidor atesta etapas/conclusão/recompensa. RLS por Viajante/conta. Vídeos sem origem/licença não liberam conclusão.
ACCEPTANCE_CRITERIA:
- Nove mundos ordenados; cinco histórias configuradas em As Origens, preservando garden-choice e rotas antigas.
- Mapa/detalhes responsivos e reutilizáveis, porcentagens e estados reais, retorno/revisita e próximo passo.
- Nenhuma dependência narrativa da aprovação do líder; regras específicas da Guilda preservadas.
- Vídeo obrigatório modelado sem links/licenças inventados; ausência/indisponibilidade não conclui.
- Contrato de persistência por identidade existente; cliente não escreve conclusão nem recompensa; idempotência e ordem testadas.
- Conteúdos novos incompletos explicitamente preparados, sem atividades fictícias para aparentar conclusão.
- Testes direcionados, lint, tipos e build; limites e dependências registrados.
TEST_PLAN:
- Unitários: ordem, acesso, requisitos, vídeo, replay, isolamento e regressões do Jardim/Guilda afetadas.
- PostgreSQL sintético local: RLS/ACL, negação de fraude, requisitos, ordem e idempotência.
- Browser local: mapa → mundo → história, erro de persistência, viewports móveis/desktop e teclado.
DEFINITION_OF_DONE: Aceite comprovado e gates aplicáveis PASS; dependências indispensáveis não satisfeitas mantêm BLOCKED, sem afirmar campanha jogável completa.

## Contexto mínimo e decisões
- Origem local: 99fb2c0, codex/account-only-entry. Inclui autenticação/QR existentes e correções de segurança já commitadas; não inclui arquivos locais pendentes da TASK-0080.
- Worktree: build/task-0081-story-worlds/checkout; branch codex/story-nine-worlds. Outros checkouts preservados.
- Auditoria: campanha anterior com oito atos; uma fase garden-choice, Gênesis 2–3, exploração, leitura, devocional, Fuga da Serpente e quiz existentes. Map/Act/Spotlight/Phase direcionavam à Guilda. Progresso legado é controlável pelo cliente e não pode comprovar a nova conclusão oficial.
- Autorização do orquestrador: ampliar perfis selecionados para apps/web, packages/database/proposals e tests, docs/architecture, docs/biblical, docs/security, tests e memória desta tarefa, estritamente dentro do pedido local do usuário.
- Risco/dependência: nenhum vídeo autorizado foi fornecido; quatro capítulos e atestação de atividades ainda precisam de conteúdo/integração. Não reabrir auditoria de dependências encerrada da TASK-0080.

## Checklist
- [x] Contexto/estado/perfis lidos e auditoria inicial
- [x] Base/branch/worktree isolados
- [x] Catálogo e progressão
- [x] UI e reaproveitamento do Jardim
- [x] Persistência/segurança local
- [x] QA e revisão bíblica/segurança pelo autor
- [x] Controle de aceite local, relatório e memória
- [ ] Aceite integral: vídeos/conteúdo/atestação/recompensa e ambiente hospedado

## SELF VALIDATE / QA / SECURITY / ACCEPTANCE CHECK

Autor assume os perfis; não houve revisão independente. Relatório: [TASK-0081-STORY-WORLDS](../../docs/architecture/TASK-0081-STORY-WORLDS.md). Pareceres editorial e Security próprios vinculados nele.

| Gate | Resultado e evidência |
| --- | --- |
| UNIT | PASS: 100/100, 11 arquivos; `unit-final.log`; inclui teste do quiz real chegando ao vídeo sem concessão local, histórico, ordem, isolamento e reentrada |
| INTEGRATION SQL | PASS: 11 nós/10 cenários + teste pai, 0 fail/skip em PG17 sintético; `postgres-first.log`; RLS/ACL, duas confirmações concorrentes, requisitos e recibo único |
| BROWSER | PASS: 9/9 mapa/mundo/história + 3/3 regressão cadastro/login/recuperação; Chromium 1440×900 e 320×740, WebKit 390×844; `e2e-final.log`, `e2e-registration-rework.log` |
| VISUAL | PASS local: capturas mapa desktop, As Origens 320px e história/Jardim desktop inspecionadas; teclado e overflow testados; aparelho físico pendente |
| LINT / TYPECHECK / BUILD | PASS: `lint-acceptance.log`, `typecheck-acceptance.log`, `build-final.log`; ESLint direcionado final de teste de registro incluído no recibo |
| SECURITY | PASS no diff local, com limites explícitos; sem nova dependência/secret/efeito remoto; hosted e integração econômica não validados |
| BIBLICAL | PASS para títulos/referências e classificação do catálogo; conteúdo novo completo/vídeos não aprovados |
| DOCUMENTATION / MEMORY | Atualizados nesta tarefa; outros contratos preservados |
| ACCEPTANCE INTEGRAL | BLOCKED: vídeos autorizados, conteúdo dos quatro capítulos, validador de etapas e recibos econômicos, migration/schema revisados e ambiente hospedado/aparelhos |

Falhas iniciais preservadas: 6 testes de Diário (expectativa antiga e ordem de leitura corrigidas); build por junction fora do root resolvido com cópia local das dependências existentes; 3 seletores ambíguos com o anunciador Next corrigidos; tentativa de regressão com config antiga apontou dist inexistente; WebKit detectou navegações documentais abortando prefetch, corrigidas usando links reais do menu. Estado passou por REWORK; checks finais acima não têm falhas.

Nada de push, deploy, merge, produção, nova migration registrada ou alteração de main. Proposta SQL não ativa nenhum capítulo e não modifica economia. O contexto 02/09 não foi iniciado. Próximo passo: resolver dependências do Mundo 1 e integração segura no mesmo contrato, mediante o escopo/autorização apropriados; não confundir preparo local com campanha completa.

Commit local da implementação: `35c589896c9118312dfa0f9a0461e807960cdb38`. Controle subsequente altera somente este contrato e o relatório. Worktree local limpo após o registro final; nenhuma publicação autorizada/executada neste pedido.
