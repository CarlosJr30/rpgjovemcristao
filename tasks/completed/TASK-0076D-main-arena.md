# TASK-0076D — Arena de Cartas como experiência principal
ID: TASK-0076D
TITLE: Retirar Arena clássica da interface principal
OBJECTIVE: Unificar entradas em /journey/arena sem novo motor, balanceamento ou caminho econômico.
PRIORITY: P1 High
STATUS: DONE
SCOPE: roteamento legacy, link da Arena, mensagem segura de falha online, manutenção dos testes de interface, testes dirigidos/config/build, relatório e memória.
OUT_OF_SCOPE: engines, recompensas/quantidades, SQL/RLS/0009/0010, dados reais, Supabase remoto, demo/Preview aprovado, credenciais, commit/push/deploy.
DEPENDENCIES: 0076/A/B/C preservadas; implantação econômica/backup 0076A continua pendente.
ASSIGNED_AGENT: autor Frontend/QA/Security; autorrevisão, sem subagentes.
REQUIRED_CONTEXT: rotas, navegação Jornada, CardArena, cliente econômico existente, testes pertinentes.
SECURITY_CONSIDERATIONS: somente fixtures sintéticas e rede externa bloqueada; erros online não criam batalha/pagamento local. Não usar ArenaDemo no jogo.
ACCEPTANCE_CRITERIA:
- Jornada/menus abrem Arena de Cartas; rota antiga redireciona e não há links para UI clássica.
- Personagem/equipamentos, 20 cartas/5 na mão/3 Energia, intenção, turno, vitória/derrota, retorno e CSS/animações preservados.
- Backend indisponível produz aviso e nenhum fallback, recompensa ou mutação do jogador.
- Build/lint/types e verificações dirigidas PASS; evidências locais e pendências claras.
TEST_PLAN: unitários de falha online com cliente econômico real e transporte sintético; E2E de navegação/cartas/resultados/mobile, build/lint/typecheck. Arquivar testes exclusivos da UI clássica retirada, preservando suas asserções como histórico; atualizar teste móvel compartilhado para o layout novo. Não executar suíte inteira/economia/PostgreSQL sem alteração SQL.
DEFINITION_OF_DONE: MAIN_ARENA_REPLACED_LOCALLY somente com gates aplicáveis PASS, QA física/produção explicitamente fora deste aceite.

## Autorização
Pedido atual autoriza runtime visual/roteamento/testes e suspende publicação permanente nesta tarefa. Não efetuar operação Git mutável. Documentação de fechamento 0076C e SQL-PARA-REVISAO já existentes devem permanecer intactos. Ownership Frontend estendido aos testes/config/documentação e mensagem de UI; nenhuma alteração no backend/SDK/economia autorizada ou necessária.

## Aceite ? 2026-10-17

MAIN_ARENA_REPLACED_LOCALLY. QA/Security por autorrevis?o: 3 unit?rios + 14 E2E + 1 matriz de 11 resolu??es PASS; build/lint/typecheck PASS. Arquivos protegidos/arquivos de testes hist?ricos comprovados por hash. Sem backend/SQL/engine/CSS/demo/remoto/Git mut?vel. Relat?rio: docs/architecture/TASK-0076D-MAIN-ARENA.md. Recibo: build/task-0076d-main-arena/acceptance.json. Valida??o f?sica e publica??o/economia remota n?o fazem parte deste aceite e continuam pendentes.
