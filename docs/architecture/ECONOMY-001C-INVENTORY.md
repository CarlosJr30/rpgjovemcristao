# ECONOMY-001C — inventário e decisões de ativação

03/11 — **D3/D4 APROVADAS:** preços TEST40/35/65/115 e orçamento QA único255, no avatar dedicado QA Loja de conta TEST existente/confirmada, criado pelo fluxo normal. As propostas abaixo passaram a aprovadas somente nesse escopo; não autorizam preços/compras PROD. Nenhuma concessão QA executada até este checkpoint. Cartas à venda e outros baús continuam sem aprovação.

## Retomada03/11/2026 e complemento da Loja

PR31draft/head4b60cc1, árvore rastreada limpa e todos os commits enviados. CIpush41463034000/PR41463046594 success:1077unit/74SKIP,PG/RSC/qualidade. Migration **somenteTEST20261102144048** (arquivo20261102135323) aplicada em02/11;83tabelas/225rotinas/45migrations.80dados anteriores e218rotinas/ACLs preservados; apenas2triggers e1índice previstos em objetos antigos. Previewf1rb6akbt/READY/TEST. QA normal/preflight/negativas/Mochila vazia1365/390/320 PASS nas partes identificadas; nenhum evento, grant ou abertura001C. Positivos entre contas continuam pendentes; janelas anteriores fechadas. Relato de login humano anterior não substitui nova validação Auth. PROD/main86ae074 preservados; não houve merge/publicação001C.

O complemento autoriza recuperar a Loja no mesmo escopo, inicialmente TEST, sem pagamentos reais nem mistura automática de PRs. Catálogo/UI de Loja e compra de baús/equipamentos existem; autoridade genérica e rotas seguem fechadas. O preço continua decisão do servidor. Venda de cartas não tem tabela localizada.

| Oferta legada | Preço existente | Proposta de primeiro ensaio TEST |
| --- | ---: | --- |
| Baú comum |40|Reutilizar compra/abertura e loot comum já aprovado; falta integrar débito/proveniência ao novo escopo. |
| Espada do Caminho |35|Reutilizar item, arte/slot e compra existentes; recibo/idempotência da ponte precisam ser completados. |
| Couraça do Viajante |65|Mesmo contrato, sem alteração de atributos ou raridade. |
| Escudo da Perseverança |115|Mesmo contrato; equipar exige sua autoridade própria TEST. |
| Incomum/raro |90/180|Preços existentes, mas conteúdo não homologado nesta etapa: compras bloqueadas. |
| Épico/extraordinário |Não compráveis|Preservar regra; não criar preço. |
| Sete cartas existentes |Sem preço de venda localizado|Starter independente; compras de cartas bloqueadas até tabela aprovada. |

**D3 proposta de preços TEST:** validar somente40/35/65/115 acima, sem presumir aprovação produtiva. Nenhum novo valor/preço/sorteio criado.

**D4 proposta de fonte QA:**255moedas (40+35+65+115), uma concessão limitada e auditada para um único avatar dedicado “QA Loja”, criado pelo fluxo normal em uma conta QA TEST existente e confirmada. Confirmar identidade/avatar antes da escrita. Proveniência QA separada e reconhecível, sem importação para PROD, reconciliação de legados, XP, itens ou cartas artificiais. É orçamento de ensaio, não regra econômica de jogadores. A integração deverá preservar o saldo canônico e distinguir essa fonte dos créditos oficiais; falha nos invariantes impede concessão. Sem liberação produtiva de compras ou preços por inferência.

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
