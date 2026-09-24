# TASK-0018 → Auditoria e sistemas visíveis
ID: TASK-0018
TITLE: Auditar e conectar à interface os sistemas principais do RPG vivo
OBJECTIVE: Entregar uma trilha navegável e verificável para progressão, economia, equipamento e conteúdo local da Guilda, sem declarar mock ou schema como funcionalidade pronta.
PRIORITY: P1 High
STATUS: REWORK
SCOPE: Auditoria de UI/rotas/persistência; correção de navegação; loja local mínima com compra persistente; feedback de nível/moedas; raridades e Códice; animação visível de equipar; painel local de desafio/lição/missão; testes de fluxo e documentação honesta.
OUT_OF_SCOPE: Autorização real de líder, sincronização remota, produção de overlays inexistentes e catálogo de centenas de itens.
DEPENDENCIES: Estado atual de TASK-0014 a TASK-0017. O pedido vigente autoriza antecipar versões visíveis dos sistemas previstos; manter os contratos anteriores para expansão posterior.
ASSIGNED_AGENT: Orquestrador atuando nos perfis frontend, backend local, game design, QA e Security.
REQUIRED_CONTEXT: Pedido anexado, `.agent/memory/CURRENT_STATE.md`, rotas, stores, traveler, storage, GuildHub, Avatar, assets e testes E2E.
SECURITY_CONSIDERATIONS: Conteúdo do líder é entrada não confiável; validação de tamanho/URL, separação por Guilda e Viajante, sem alegar autenticação real. Transações de moeda e recompensas não podem duplicar.
ACCEPTANCE_CRITERIA:
- Matriz registra IMPLEMENTADA, PARCIAL e NÃO IMPLEMENTADA por fluxo observável.
- Jornada → Loja → compra → Mochila → Equipamentos funciona após reload e mantém saldo/inventário por Viajante.
- XP, nível, próxima meta, moeda e feedback de ganhos aparecem na interface; tela comunica recursos ainda em preparação.
- Guilda oferece ações visíveis de desafio, lição e missão em simulação local, com conteúdo persistido e acessível a outro Viajante da mesma Guilda no navegador.
- Minigame mostra retrato ativo, collider independente e evidência visual do fluxo em execução.
- Equipamento sem overlay comunica essa ausência; não usa ícone como overlay corporal.
TEST_PLAN:
- Unitário: compra/saldo/isolamento/migração; Guilda compartilhada por ID e validação; movimento e progressão.
- E2E desktop/mobile: navegação e compra; criação/visualização de conteúdo da Guilda; reload; captura do minigame.
- Lint, typecheck, build, revisão Security e inspeção visual das capturas.
DEFINITION_OF_DONE:
- Gates e critérios atendidos, relatório de antes/agora e memória atualizada. Itens sem asset ou autoridade real marcados como pendência explícita.

## Validação de 2026-09-24

| Check | Resultado | Evidência / limite |
| --- | --- | --- |
| BUILD | PASS | `npm run build`, 17 rotas |
| LINT | PASS | `npm run lint` |
| TYPECHECK | PASS | `npm run typecheck` |
| UNIT TEST | PASS | `npm test`, 13 arquivos/76 testes |
| INTEGRATION / E2E | PASS | `npm run test:e2e`, 18/18 em desktop/mobile; compra, guilda, reload e captura da Fuga |
| QA VISUAL | PARCIAL | Capturas de Loja, Guilda e início da Fuga inspecionadas; navegador integrado indisponível e partida inteira não observada |
| SECURITY REVIEW | PASS com limite | Revisão pelo próprio autor: entradas da Guilda têm limites, URL `bible.com` restrita, dados por ID de Guilda, texto renderizado pelo React; aprovação local sem autenticação real não serve para produção |
| DOCUMENTATION | PASS | `docs/architecture/VISIBLE-SYSTEMS-AUDIT.md` com matriz antes/agora e dependências |
| NO SECRETS | PASS | Mudanças não adicionam credenciais ou configuração secreta |
| NO KNOWN CRITICAL REGRESSIONS | PASS | Suíte unitária, build e E2E completos aprovados |
| ACCEPTANCE | PARCIAL | Fluxos visíveis e persistentes atendidos; não há evidência da partida completa e manobras da Fuga solicitadas pelo usuário |

REWORK: executar playtest completo da Fuga em desktop/mobile, confirmando corredor reto, curva de 90°, canto interno, diagonal, parede e mudança rápida de direção. Registrar resultado visual e corrigir travamentos, se houver. Os overlays seguem dependentes de assets compatíveis e a autorização real do Líder depende de backend/contas; ambos foram explicitados como limites do protótipo, sem afirmar conclusão.
