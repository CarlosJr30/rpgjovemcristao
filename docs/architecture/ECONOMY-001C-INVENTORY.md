# ECONOMY-001C — inventário e decisões de ativação

02/11/2026. Main86ae074/CImerge41452725336 success; oficial dpl_8iGErYZYufcMGx2KAJ1UdTdUqQ1p READY/production/PROD/alias confirmado. Auditoria somente leitura; nenhuma concessão, migration ou alteração de produção nesta etapa. Branch codex/economy-001c-chests preserva o fechamento Arena f268001.

| Sistema encontrado | Reutilização e falta real |
| --- | --- |
| Baús | `traveler_chests` guarda quantidade/origens; `chest_operations` registra grant/open/recibos. `economy_private.open_chest` já bloqueia pilha, sorteia no servidor e materializa resultado. Seus EXECUTEs e os wrappers públicos continuam fechados; não desbloquear a função antiga diretamente. Falta ponte restrita com sessão/elegibilidade/cotas globais e contenção própria. |
| Tipos/tabelas | Engine e SQL antigos têm comum, incomum, raro, épico e extraordinário; tabela abaixo. Existência no código não prova aprovação econômica atual. Raro/incomum/extraordinário continuam sem ativação neste primeiro incremento. |
| Fontes | 010C.1 já persiste `future_eligibility` por missão/Auth/avatar, categoria none/common/rare/epic, revisão e validação. `validation_history`, comandos e responsável/delegação atuais podem fundamentar decisão. Falta recibo global por Auth/evento, congelamento do enquadramento, cotas semana/mês/líder e revisão sem autoaprovação. Nenhum sucesso declarado pelo navegador servirá como prova. |
| Revelação | `features/chest-reveal`: abertura consulta ledger, retry reutiliza intenção, cursor visual separado do recibo; animação tem pausa2000ms e flip550ms, modo estático/redução de movimento e detalhes. Reutilizar; animação nunca concede recompensa. |
| Equipamentos | Catálogo e artes/slots já existem. Inventário canônico e representação visual preservados. PR12 segue draft61b7177; possui ponte própria de equipar somente TEST e bloqueios documentados. Não integrar PR inteira. Aquisição não implica liberar equipar ou alterar atributos. |
| Cartas | Sete definições PROD homologadas por001A; starter independente. SQL `economy_private.collection` exige recibo **card-starter** e quantidade1. Falta aceitar proveniência de baú com recibo/versionamento rigorosos, política para duplicatas e tabela de sorteio aprovada. O adaptador de revelação antigo aceita apenas moedas/equipamento; tipo visual de carta existe, não é concessão funcional. |
| Avatares legados | 20PROD não reconciliados: preservar saldos/níveis/posse, aplicar bloqueio somente às novas operações dependentes. Starter e consultas anteriores permanecem independentes. |

## D1 — tabelas existentes, ainda sem ativação001C

Fonte exata: `packages/game-engine/src/index.ts`, espelhada em `economy_private.open_chest` PROD.

| Baú | Resultado A | Resultado B |
| --- | --- | --- |
| Comum |80%:25moedas|20%:10moedas + Espada do Caminho (`traveler-sword-common`)|
| Épico |55%:190moedas|45%:70moedas + Elmo do Viajante (`traveler-helmet-rare`)|

**Decisão necessária:** homologar exatamente estas duas tabelas, inclusive valores de moedas e estes equipamentos existentes, ou manter moedas bloqueadas e definir uma tabela alternativa aprovada. Não remover moedas, aumentar chances ou inventar prêmio substituto silenciosamente. A raridade do baú não transforma o item: o Elmo continua raro. Não libera compras/Loja, outras fontes de moedas nem recompensas Arena/Torre.

Cartas não aparecem nessas tabelas. A aprovação do starter não aprova sorteio de cartas. Até decisão própria de conteúdo/chances/duplicatas, cartas por baú continuam bloqueadas; não emitir outro starter ou aproveitar QA privado.

## D2 — calendário das cotas, proposta para confirmação

Reutilizar o calendário de001B: semana segunda00h America/Sao_Paulo; usar data fixada da atividade/evento para enquadramento, sem retroativo anterior à ativação. Para cotas mensais, mês civil no mesmo fuso. Fixar identidade Auth do líder responsável pela autorização épica e identidade canônica do evento antes da primeira emissão; transferir responsabilidade/avatar não cria outra cota ou evento. Quantidades7/4/2 já foram autorizadas; esta proposta não as altera. Atividade sem data válida/enquadramento aprovado não gera crédito. XP1500 não entra na decisão de elegibilidade do baú.

**Decisões recebidas02/11/2026:** proprietário aprovou expressamente as duas tabelas legadas acima, incluindo moedas/equipamentos, e o calendário/vínculo propostos. Autorização limitada a este conteúdo, após TEST e gates. D1/D2 resolvidas para comuns/épicos; cartas por baú e demais tipos continuam separados/bloqueados.

## Preservação e limites

PR12/18/24/26 reconfirmadas abertas/draft nos mesmos SHAs. PROD19migrations; catálogo de cartas7; EXECUTE authenticated dos grants/open/purchase antigos negado. Sem modificação Auth/RLS, carteira/inventário/XP, instalação, arte nova ou teste de concessão. Uma consulta inicial mencionou tabela inexistente `public.items` e foi recusada antes de qualquer efeito; corrigida a consulta de catálogo para as definições reais. Equipamentos são catálogo em código/SQL, não aquela tabela. Nenhuma nova suíte ou Preview necessária para este inventário documental; gates runtime continuam pendentes.
