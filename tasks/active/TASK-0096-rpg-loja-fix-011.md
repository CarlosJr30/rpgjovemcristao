# TASK-0096 — RPG-LOJA-FIX-011
STATUS: VALIDATING
OBJECTIVE: Recuperar baús pagos e integrar compra/abertura/revelação existentes.
SCOPE: Shop, ChestPanel, revelação, cliente e correção mínima de seleção de fonte no abridor existente; testes diretamente afetados e publicação normal após gates.
AUTHORIZATION: Pedido explícito de08/11/2026. A autoridade FIFO não resolve o defeito comprovado, exigindo substituir somente shop_private.open; sem nova carteira/inventário, fonte, preço, saldo QA ou privilégio.
ROLES: Autor em Frontend/Database/QA/Security; sem revisão independente.
EVIDENCE: Duas compras oficiais40+40 ainda fechadas, pilha comum502 com500legados antes. QA9960/um comum separados e preservados. Nenhuma compra ou abertura de reprodução em PROD.
PRESERVATION: Motor/Arena/Torre/backup, Auth/RLS/ACLs, níveis/XP/itens/validade QA e demais jogadores.
VALIDATION:13PG TEST e os mesmos13 no envelope PROD isolado PASS; recuperação da definição anterior preserva recibos/dados. Testes direcionados/qualidade em andamento. Fluxo real TEST e CI ainda obrigatórios.
ACCEPTANCE: Consumir apenas fonte comprovada, retry estável sem novo débito, animação6,5s/skip/Continuar, histórico recolhido, recuperação disponível, desktop/mobile e dados preservados.
