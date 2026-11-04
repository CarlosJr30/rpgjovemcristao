# ECONOMY-CONTENT-001 — preparação da expansão

04/11/2026. **DONE para inventário e plano; expansão econômica PENDING de decisões.** Main remota confirmada em `1fb83679e075ba6aa550a1100d5d5481834552e7`, sem publicação posterior à PR34. Fechamento documental `fbce51b` preservado. Nenhuma alteração funcional, migration, nova PR, teste de navegador ou operação PROD nesta preparação.

## Prontidão encontrada

| Estado | Recursos e limite da constatação |
| --- | --- |
| Pronto e publicado | Sete cartas/starter manual, editor e combate; seis definições de equipamento; quatro ofertas40/35/65/115; baús comum/épico comunitários, recibos, sorteio e revelação; catálogo informativo PR34. Definição existente não significa aquisição liberada. |
| Desenvolvido, não integrado à aquisição pretendida | Apresentação/animação de carta em `RevealPrize`; adaptador produtivo aceita somente moedas/equipamento. Motor legado contém cinco baús, mas pontes atuais autorizam apenas os escopos publicados. |
| Concebido e aprovado, não implementado | **Nenhuma carta adicional ou nova oferta com aprovação produtiva localizada.** Golpe Medido era proposta histórica, hoje já integra as sete cartas; não é uma oitava carta. |
| Existente sem aprovação econômica completa | Tabelas de incomum/raro/extraordinário, valores legados90/180, outras fontes propostas para cartas e aquisição do Medalhão. Proposta de Calças/slot legs e variantes visuais não são equipamentos jogáveis aprovados. |
| Realmente ausente nas fontes consultadas | Fichas/aprovações de cartas adicionais, artes individuais de cartas aprovadas/mapeadas, preços/contratos de venda de cartas e novos baús; proveniência econômica de cartas fora do starter e política de duplicatas para essas fontes. |

## CONTENT-001A — cartas

Sete cartas **comuns**: Ataque Simples, Defesa, Golpe do Caminho, Guarda Perseverante, Discernimento, Passo do Peregrino e Golpe Medido. Efeitos/níveis/Foco permanecem no [manifesto001A](../../packages/database/deployments/economy001a/production-catalog.json), aprovado por `ECONOMY-001A:OWNER:2026-11-02`; somente `starter` é fonte autorizada.

Auditoria de branches da LOJA-CATALOGO-001 reutilizada: mesmo catálogo nas branches examinadas, incluindo PR12/18/24/26. CONSOLIDATION-003/003A descrevem as mesmas cartas. Sem arte individual aprovada/mapeada localizada (`art.approved:false`); moldura, verso e fixtures não são cartas novas.

**Integração mínima:** [editor](../../apps/web/features/arena-deck/editor.tsx) e [validador](../../packages/game-engine/src/arena-deck.ts) já permitem coleção maior e exigem sete cartas próprias distintas/uso único. `economy_private.collection` exige quantidade1, catálogo ativo/versionado e recibo `card-starter` da conta/avatar contendo o ID; inserir cartas diretamente não basta.

Faltam decisões editoriais das novas fichas, fonte/preço/probabilidades e duplicatas. Depois, estender a mesma leitura/ledger e o [adaptador de revelação](../../apps/web/features/chest-reveal/receipt.ts), com recibos/versionamento/revogação e atomicidade. A apresentação `card` já existe. Sem alterar starter, criar inventário/carteira ou expor concessão genérica; nenhuma extensão SQL executada.

## CONTENT-001B — baús

| Tipo existente | Preço de venda aprovado | Conteúdo/sorteio encontrado | Aquisição e dependências |
| --- | --- | --- | --- |
| Comum | **40** | **Aprovado:**80%25moedas;20%10moedas+Espada | Loja e atividade elegível; débito/grant/open/recibo já publicados. Sem integração pendente neste escopo. |
| Incomum | Nenhum;90 é legado | **Não homologado:**70%55moedas;30%20moedas+Couraça | Falta homologar conteúdo, preço, fonte/requisitos/cotas e ponte produtiva restrita. |
| Raro | Nenhum;180 é legado | **Não homologado:**65%105moedas;35%35moedas+Escudo | Mesmas dependências; mínimo3 do catálogo é legado, não nova autorização de compra. |
| Épico | Nenhum | **Aprovado:**55%190moedas;45%70moedas+Elmo raro | Atividade elegível publicada. Para vender: aprovar preço e regras de compra e integrar a fonte de compra às pontes/recibos existentes. |
| Extraordinário | Nenhum | **Não homologado:**50%360moedas;50%120moedas+Medalhão | Falta homologar conteúdo/fonte/requisitos/cotas; não habilitar progressão ou evento por inferência. |

Valores não homologados são **inventário, não aprovação**. Fonte: [motor legado](../../packages/game-engine/src/index.ts). Arte compartilhada e animações/temas existem; asset de cenário não cria um sexto tipo. Raridades preservadas; `lendário` tem apresentação Extraordinário.

Limites comunitários:7comuns/Auth/semana,4épicos/Auth/mês,2eventos épicos/Authlíder/mês; segunda00h/mês civil America/Sao_Paulo, data/líder/evento fixados, sem retroativos. **Não são cotas de compra.** Fonte/validador/posse/suspensão/recibo já são conferidos. Reutilizar débito/entrega/open/`chest_operations`; Loja atual só aceita comum. Contratos: [001C](ECONOMY-001C-INVENTORY.md) e [001C2](ECONOMY-001C2-PRODUCTION-PLAN.md).

## CONTENT-001C — equipamentos

| Equipamento existente | Raridade / bônus | Origem e pendência |
| --- | --- | --- |
| Botas do Viajante | Comum /+1Vida | Inicial; não colocar à venda. |
| Espada do Caminho | Comum /+2Força | Venda35 e loot comum aprovados; integração existente. |
| Couraça do Viajante | Incomum /+1Vida,+1Defesa | Venda65 aprovada; loot incomum ainda não homologado. |
| Escudo da Perseverança | Raro /+1Vida,+2Defesa | Venda115 aprovada; loot raro ainda não homologado. |
| Elmo do Viajante | Raro /+1Defesa | Loot épico aprovado e equipamento utilizável com recibo; sem preço/contrato de venda. |
| Medalhão do Caminho | Raro /+2Sabedoria | Definição/arte/efeito existentes; progressão prevista, sem aquisição produtiva homologada. Loot extraordinário também não aprovado. |

Fontes: [catálogo](../../apps/web/features/journey/data/equipmentCatalog.ts), [definições](../../apps/web/features/journey/domain/traveler.ts), assets e planos001C. PR12 possui os mesmos seis itens, não integrada. Variantes visuais/galerias DEV não criam produtos. `shop_private.equip` verifica recibo; futura fonte do Medalhão precisará desse reconhecimento.

## Próximo incremento e aceite

**Recomendado: CONTENT-001B, venda do épico.** Aprovar preço, requisitos/cotas de compra e relação com cotas comunitárias, mantendo conteúdo55/45. Depois, integrar somente essa oferta às autoridades/recibos existentes; TEST e gates antes de PROD, sem renovar QA. Cartas exigem primeiro decisão editorial; demais baús, aprovações da tabela. Não abrir três PRs.

Nenhum conteúdo novo inventado/liberado. A interface informativa já foi publicada na PR34; não há integração independente aprovada faltando que justifique alterar runtime agora.

Revisão documental/segurança pelo autor, sem independência. Código/SQL/assets/dependências intactos; [provas anteriores](LOJA-CATALOGO-001-REPORT.md) reutilizadas, não novos PASS. **Sem testes runtime/CI/deploy/migrations/concessões/operações PROD.** Nenhuma nova auditoria de banco alegada; Teste Chat A, orçamento/validade e PRs pendentes não tocados. Branch documental própria.
