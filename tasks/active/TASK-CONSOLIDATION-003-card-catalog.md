# TASK-CONSOLIDATION-003 — Catálogo e aquisição legítima de cartas

ID: TASK-CONSOLIDATION-003
TITLE: Preparar catálogo tipado dos efeitos reais e gates de aquisição
OBJECTIVE: Dar identidade estável e fichas verificáveis às cartas propostas, preparando aquisição/posse compatíveis sem fabricar a sétima carta ou conceder itens.
PRIORITY: P1 High
STATUS: BLOCKED
SCOPE: Branch codex/consolidation-card-catalog-003 em build/task-consolidation-003/checkout, base documental002 26db2abf0ce087b074a6b03e6c3e4e9929f480ee limpa. packages/game-engine/src/arena-card-catalog.ts e teste próprio, export no index.ts e lista compartilhada de ações já existentes em arena-deck.ts; integração fail-closed e testes em apps/web/features/arena-deck/collection.ts; testes de compatibilidade de recibos em apps/web/features/chest-reveal/receipt.test.ts; documentação própria em docs/architecture, docs/game-design e docs/security; proposta/contrato BACKLOG da sétima ação, evidências locais/checklist e prefixo da memória raiz. Autor assume Architect/Game Designer/Backend/Database/QA/Security, sem subagentes. Orquestrador amplia os perfis somente para os caminhos runtime aqui listados, conforme autorização explícita do pedido003.
OUT_OF_SCOPE: Implementar nova ação ou fórmula global, homologar aquisição ainda sem servidor, concessão inicial/real, nova carteira/inventário/ledger paralelo, alteração0078/SQL/journal/contratos anteriores/Auth/UI/assets/dependências, habilitar Arena/Torre/combate autoritativo, main/merge/push/deploy/Supabase/SQL/rede remotos/dados reais.
DEPENDENCIES: TASK0084–88 e homologação0085 lidos; ArenaV2/descrições0086/inventory/chest_operations auditados; sete efeitos homologáveis e aquisição/autoridade ainda ausentes. Preparação002 completa não autoriza operações remotas003.
ASSIGNED_AGENT: Autor nos perfis selecionados; QA/Security pelo autor, sem independência alegada.
REQUIRED_CONTEXT: AGENTS/GLOBAL/CURRENT/WORKFLOW/RULES/SECURITY/TOKEN/ORCHESTRATOR, contratos0084–88, homologação0085, seis ações reais/constantes/descrições, collection/receipt/inventory/baús e fontes/pendências das recompensas.
SECURITY_CONSIDERATIONS: Definição de carta não prova posse. Metadata/row do inventário manipulável pelo cliente não é recibo oficial. Zero cartas liberadas até homologação, protocolo econômico e backend aprovados. Catálogo não executa efeitos recebidos do browser, não concede nada e não declara combate autoritativo. Não reduzir nível/custo para simular starter viável.
ACCEPTANCE_CRITERIA:
- Seis fichas com IDs estáveis/únicos, raridade suportada, status explícito, parâmetros/nível/Foco/descrições derivados do motor, versão e aquisição/arte pendentes.
- Catálogo aprovado vazio e entradas propostas recusadas no produto; sem sétima carta duplicada. Proposta separada de extensão mínima, não implementada.
- Aquisição/recibo/starter/duplicatas/ownership e recuperação especificados sobre inventory e ledger existentes, sem fonte paralela ou concessão pelo cliente.
- Compatibilidade da engine/deck/uso único/revanche/nível/Foco/snapshot/Torre/revelação verificada com fixtures identificadas e gates reais fechados.
- Testes direcionados, lint/tipos/build, escopo/preservação/no-secrets, parecer/relatório13itens/checklist/memória/commits locais.
TEST_PLAN: Catálogo/readiness/descritivos/efeitos reais e rejeições; integração collection com inventário forjado negado; recibos legados sem cartas e versão estendida rejeitada; regressões engine/deck/storage/Arena/Torre/reveal. PostgreSQL N/A se não houver SQL novo; não reexecutar banco002 sem mudança. Lint/tipos/build exigidos pelo pedido; browser/UI antigos reutilizados se nenhum TSX/CSS/interface mudar.
DEFINITION_OF_DONE: Preparação local validada com evidências; integral BLOCKED se faltar homologação/sétima ação/aquisição/backend. Propostas não contam como funcionalidades concedidas. Gates/falhas/status/memória e próximos passos concretos registrados.

## Contexto mínimo / decisão inicial

002 confirmada no HEAD documental26db2ab limpo, implementação70aa7e1 e recibo verificado. Root contém nove pendências, 0080 sete; snapshot de27worktrees/refs/hashes em build/task-consolidation-003/baseline.json da raiz. Branch criada sem merge/reaplicação.

MotorV2 aceita apenas attack/defend/quatro special. Não reutilizar focus/equipment de engine legada/lab, gatilhos automáticos, skins ou IDs duplicados como sétimo efeito. Baú legado confirma moedas/itemId de equipamento por chest_operations; não contém cartas. Inventário legado aceita escrita própria e não prova origem econômica de carta. Novos jogadores nível1 só têm os dois básicos utilizáveis; não dizer que possuir as seis propostas resolve sete cartas utilizáveis ou desbloqueia a Arena.

Preparar seis propostas e plano revisável de extensão/recibos, sem ativar concessões. Nenhuma alteração de esquema necessária à ficha/catalogação nesta fase; SQL executável da concessão depende do protocolo/cutover aprovado e fica fora da implementação atual, com especificação de constraints/ACL/idempotência documentada. Não criar DDL inerte ou inventário paralelo para encobrir esse bloqueio.

## SELF VALIDATE / QA / SECURITY / ACEITE

Preparação local PASS, integral BLOCKED. Seis fichas estáveis propostas,14casos de catálogo dentro de119testes/19arquivos PASS; approved vazio e zero grants. Fontes/tipos/raridades/descritivos/versões explícitos, parâmetros derivados do motor. Seis efeitos reais não fecham sete; proposta003A/Golpe Medido é BACKLOG sem runtime. Nível1 só permite duas propostas atuais; starter/posse/recibos idempotentes positivos continuam pendentes.

Loader oficial não usa inventory manipulável como prova; exige conta/Traveler e retorna coleção indisponível. Adapter legado recusa IDs reservados; recibo v1 não produz carta, cards/schemaVersion2/IDs propostos recusados. Motor/Torre/loot/economia/Auth/SQL/contratos anteriores intactos. Nenhuma autoridade de batalha ou concessão nova alegada.

QA/Security necessários por comportamento executável/integração/posse; revisões do autor, sem independência. Lint/tipos/build PASS;3browserPASS Chromium1440/320/WebKit390,0falha/skip/flaky/retry; produção254JS/0marcadores sintéticos e gate948artefatos/8protótipos preservados. SQLnovoN/A, catálogo não exige esquema; plano define constraints/ACL/RLS/locks/recuperação para backend futuro. Nomes de mecânicas FICTIONAL sem referência canônica/arte nova, sem TSX/CSS alterados. Não reexecutados PostgreSQL002 ou Guilda/EBD001.

Sem falha de testes nesta rodada. Dependências existentes copiadas sem instalação/upgrade e links @rpg próprios. next-env gerado teve duas importações routes/root-params restauradas ao baseline após validação; fora do commit. Config de browser somente em build ignorado, porta3199, produto sintético .invalid; sem Vite/harness positivo repetido.

apps/web/AGENTS.md encontrado na conferência final, após as primeiras edições; revisão complementar do guia local Next Server and Client Components confirmou módulo puro no grafo cliente existente, sem server-only/Node/secrets/I/O de grant e sem nova API Next. Nenhuma alteração adicional necessária; ordem tardia da leitura registrada no relatório.

Relatório13itens/aceite20critérios em docs/architecture/TASK-CONSOLIDATION-003-REPORT.md; design e proposta em docs/game-design/CONSOLIDATION-003-CARDS-AND-SEVENTH-EFFECT.md; aquisição/recibos em docs/architecture/CONSOLIDATION-003-ACQUISITION-AND-RECEIPTS.md; parecer docs/security/CONSOLIDATION-003-CARD-SECURITY.md. Commits, memória e auditoria de preservação no fechamento/recibo final em build/task-consolidation-003/final-receipt.json da raiz.

Bloqueios: sétima ação/homologação completa, aquisição/ledger/cutover0078, autoridade004, ambiente/CI/publicação. Próximo revisar proposta003A e perfil starter; nenhum recurso remoto, main/push/merge/deploy/SQL/dado real autorizado ou executado. Modelo recomendado Luna/Leve leitura/documentação, GPT-6/Médio para contratos/integração/validação; nenhuma troca automática alegada. Autor assumiu perfis/skills locais de Architecture/Game Design/Backend/Database/QA/Security e verificação de fluxo no limite local, sem delegação.
