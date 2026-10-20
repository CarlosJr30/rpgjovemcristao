# TASK-CONSOLIDATION-003A — Golpe Medido: implementação local

ID: TASK-CONSOLIDATION-003A
TITLE: Implementar e validar localmente Golpe Medido
OBJECTIVE: Sétima ação candidata nível1/Foco1/multiplicador1,15, sem alterar fórmulas globais, IA ou economia.
PRIORITY: P2 Normal
STATUS: BLOCKED
SCOPE: Branch codex/consolidation-seventh-card-003a, checkout build/task-consolidation-003a/checkout, base003 documental158493048d9da440942ef7c5024bef61bd8284b1 limpa. Tipos/index, arena-combat-v2, arena-deck, arena-card-catalog, arena-descriptions e testes pertinentes em packages/game-engine/src; testes de UI/Arena/deck/storage/Torre em apps/web/features/arena-deck e arena-tower, fixtures exclusivamente de teste; documentos003A em docs/architecture/game-design/security, este contrato movido de backlog para active, atualização necessária de seu link no design003, evidências e prefixo da memória raiz. Orquestrador autoriza perfis Architect/Game Designer/Backend/Frontend/QA/Security nestes caminhos, sem subagentes. Pedido003A autoriza runtime específico e substitui a limitação documental anterior deste contrato.
OUT_OF_SCOPE: Homologação/aquisição/concessão/starter/posse reais, economia0078/ledger/inventory/XP/moedas/baús/RPCs/SQL, autoridade004, parâmetros NPC/dificuldade/decisõesIA/fórmulas globais, novo botão/engine, Guilda/EBD/Story/contratos anteriores/arte/mídia/dependências, main/merge/push/deploy/fetch/Supabase/remoto/dados reais.
DEPENDENCIES: Aprovação explícita para implementação e balanceamento local recebida no pedido003A. Base003/recibo/HEAD limpo conferidos; produto ainda depende homologação/concessão/backend.
ASSIGNED_AGENT: Autor assume perfis e revisões QA/Security, sem independência alegada.
REQUIRED_CONTEXT: AGENTS raiz/apps-web, GLOBAL/CURRENT/WORKFLOW/RULES/SECURITY/TOKEN/ORCHESTRATOR e perfis/skills já selecionados; contrato003, proposta003A/design, ArenaV2/descrições/collection/storage/Torre. Guia local Next cliente/servidor já lido na003, mesma versão, reutilizado antes de testes no app.
SECURITY_CONSIDERATIONS: Produto só aceita cardId de deck válido, nunca ação direta/objeto de efeito; sintéticos somente testes. Nova ação será card-only, fora do loadout legado/IA. Dados locais não provam posse ou vitória oficial. Catálogo approved vazio e acquisition/starter bloqueados. RiscosP1 herdados não corrigidos nem aceitos.
ACCEPTANCE_CRITERIA:
- ID novo estável e sete ações propostas distintas, nenhuma approved/posse/concessão automática.
- Multiplicador1,15 no mesmo ponto de calculateDamage, custo1/piso1/sem geração, nível1, equipamentos/estados antigos preservados.
- Somente carta de deck válida, exatamente7, snapshot/round/owner/uso único/rejeição/duplo clique/reload/rematch/andar seguinte.
- Descrição/UI existentes exibem números derivados/condição/disponibilidade/uso, sem botão novo.
- Comparativos determinísticos iniciante/intermediário/avançado, defesa/piso/teto/equipamentos/descontos/arma e primeiros andares, com limites de equilíbrio explícitos.
- Regressões motor/IA/Arena/Torre, lint/tipos/build/scan/preservação e22critérios/relatório11itens/memória/commits locais.
TEST_PLAN: Primeiro capturar hash de trajetórias antigas antes da mudança; testes matemáticos/determinísticos/negações/descrições e sete propostas sintéticas; integração storage/UI/Torre/reload/uso/derrota/sem grants. Não testar carta nova via especial direto legado. QA local, lint/tipos/build e browser produto bloqueado; SQLnovoN/A sem PostgreSQL. Reusar Guilda/EBD/banco/baús inalterados.
DEFINITION_OF_DONE: IMPLEMENTATION_LOCAL_DONE só com critérios/checks comprovados; PRODUCT_RELEASE_BLOCKED por homologação/concessão/backend/P1, sem disponibilização. Registrar falhas/reworks e revisão do autor; memória e status preservam distinção.

## Contexto mínimo / decisões

Contrato original encontrado em BACKLOG e movido, sem duplicar ID. A autorização do anexo003A confirma candidato com nível1/custo1/multiplicador1,15 somente local. Baseline registra28worktrees e nove pendências raiz/sete0080 antes da nova branch. Sem rede/remoto.

Nova ação card-only será excluída do loadout legado padrão e explícito; IA mantém escolhas/slots antigos. Desconto existente tem piso1. Bônus tático e espada após Defender se aplicam como em qualquer ataque; reforço ativo da Espada específico de Golpe do Caminho permanece exclusivo dele. Modificador de potência da própria nova ação usa o mesmo limite já existente, sem novo gatilho/cooldown. Essas interações serão ensaiadas e relatadas.

REWORK registrado: rodada inicial37PASS/10FAIL. Oito falhas vinham da fixture antiga que enumerava todos os specials e cresceu para8cartas; manter seus quatro especiais legados+3básicos, usando as sete propostas apenas na nova fixture. Duas expectativas de dano sem guarda usavam oponenteguardian que escolheu Defender; cenário de cálculo puro usa oponente sem esse perfil, preservando testes específicos de guarda. Nenhuma fórmula ou IA relaxada. Hash das64trajetórias antigas já PASS na primeira rodada.

Ampliação mínima autorizada pelo orquestrador dentro do pedido: filtrar cardOnly nas enumerações dos componentes legados apps/web/features/journey/components/arena-specials.tsx, arena-unlock-notice.tsx e dev/arena-visual-lab.tsx, para não criar botão avulso/desbloqueio por nível da candidata. Acrescentar testes pertinentes de journey/arena-specials. Também fixtures/e2e próprios, modo somente teste no harness da Torre e playwright.consolidation-003a.config.ts para validar fluxo real dos componentes; sem rota/flag de produto nova. Skill React best-practices aplicada como checklist de hooks/props/acessibilidade/isolamento, sem refactor não relacionado.

## SELF VALIDATE / QA / SECURITY / ACEITE

IMPLEMENTATION_LOCAL_DONE / PRODUCT_RELEASE_BLOCKED. Golpe Medido card-only nível1/custo1/piso1/×1,15/sem ganhoFoco; IDarena-card-measured-strike. Sete propostas distintas, approved/fontes autorizadas vazios e starter/collection fechados. Fórmula global, IA/NPCs/economia/RPCs/SQL/0078 intactos. Desconto/potência/tática/espada-após-defesa mantidos; reforço ativo de Caminho não é ativado por Medido.

116casos/20arquivos PASS no recorte dirigido;11rechecks/3arquivos PASS após correção/movimento de testes e inclusão de27simulações, sem somar subconjuntos. Lint/tipos/build finais PASS.6E2E PASS/0falha/skip/flaky/retry:3produto bloqueado+3harness seven propostas/reloadUSADA/novoandar, Chromium1440/320/WebKit390. Scan254JS/0sintéticos, build948artefatos/8protótipos preservados. SQLnovoN/A, PostgreSQL não executado. Hash64trajetórias antigas idêntico à captura pré-mudança. Comparativo126linhas+27batalhas prova casos locais, não equilíbrio universal; limiar no andar3 mudou duas derrotas para vitórias, sem rebalancear.

REWORK adicional: lint apontou import inverso app no pacote engine; comparativo movido para apps/web/features/arena-tower. Tipos exigiram rows explícitas/findES2022/finishTower4argumentos; corrigidos somente ensaios. Logs iniciais e sucessivos preservados. QA/Security pelo autor, não independentes; skill React/fluxo e guia Next local aplicados no escopo. Nomes FICTIONAL sem Bíblia/arte nova. Sem nova dependência, fonte de aquisição, concessão, autoridade004, SQL ou remoto.

Relatório11itens/aceite22critérios docs/architecture/TASK-CONSOLIDATION-003A-REPORT.md, balanceamento docs/game-design/CONSOLIDATION-003A-BALANCE.md, parecer docs/security/CONSOLIDATION-003A-SECURITY.md. Memória/commits/hashes/28worktrees e pendências no recibo final build/task-consolidation-003a/final-receipt.json da raiz. Contrato fica BLOCKED por homologação/concessão/backend, distinto do aceite local concluído; próximo revisar limiares e tratar dependências em contratos próprios. Modelos recomendados Luna/Leve leitura/docs e GPT-6/Médio implementação/validação, sem troca automática ou delegação.
