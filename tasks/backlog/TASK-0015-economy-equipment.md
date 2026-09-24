# TASK-0015 → Economia, lojas e Arsenal do Viajante
ID: TASK-0015
TITLE: Economia funcional e equipamentos extensíveis
OBJECTIVE: Criar gasto de moedas, compra, catálogo de equipamentos, raridades e overlays compatíveis com o Avatar.
PRIORITY: P1 High
STATUS: BACKLOG
SCOPE: Loja do Viajante, estoque local extensível do Mercador e Loja da Guilda, raridades e loot configurados, catálogo escalável, dados bíblicos por item, conjuntos, venda/desmonte, Oficina limitada, Códice e animação ao equipar com assets aprovados.
OUT_OF_SCOPE: Servidor em tempo real e arte improvisada; registrar OVERLAY PENDENTE para itens sem asset correto.
DEPENDENCIES: TASK-0014; assets específicos de overlays para aceite visual dessa parte.
ASSIGNED_AGENT: Orquestrador com frontend, backend, game designer, conteúdo bíblico, QA e Security locais.
REQUIRED_CONTEXT: Pedido anexado seções 5–22, schemas de equipamento, Avatar runtime, persistência, dados bíblicos e telas de inventário.
SECURITY_CONSIDERATIONS: Validar compras, saldo, duplicatas e propriedade do item na fronteira; simulação local não fornece autoridade de servidor.
ACCEPTANCE_CRITERIA:
- Comprar reduz moedas uma vez e inclui item correto somente no Viajante ativo; saldo insuficiente impede compra.
- Configurações centrais cobrem raridade, preço, loot e upgrades finitos; melhores itens dependem de exploração/desafio.
- Cada item criado tem inspiração bíblica documentada e botão para abrir a referência, sem alegar poder espiritual.
- Equipar e trocar preservam a composição visual onde houver overlay compatível; demais itens exibem OVERLAY PENDENTE sem sobreposição ruim.
TEST_PLAN:
- Testes de transação, persistência e isolamento; revisão bíblica dos itens, QA visual e checks do workflow.
DEFINITION_OF_DONE:
- Critérios e gates aplicáveis aprovados, memória atualizada.
