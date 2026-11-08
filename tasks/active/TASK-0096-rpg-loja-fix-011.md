# TASK-0096 — RPG-LOJA-FIX-011
STATUS: VALIDATING — transações hospedadas TEST dispensadas expressamente pelo proprietário; demais gates mantidos
OBJECTIVE: Recuperar baús pagos e integrar compra/abertura/revelação existentes.
SCOPE: Shop, ChestPanel, revelação, cliente e correção mínima de seleção de fonte no abridor existente; testes diretamente afetados e publicação normal após gates.
AUTHORIZATION: Pedido explícito de08/11/2026. A autoridade FIFO não resolve o defeito comprovado, exigindo substituir somente shop_private.open; sem nova carteira/inventário, fonte, preço, saldo QA ou privilégio.
ROLES: Autor em Frontend/Database/QA/Security; sem revisão independente.
EVIDENCE: Duas compras oficiais40+40 ainda fechadas, pilha comum502 com500legados antes. QA9960/um comum separados e preservados. Nenhuma compra ou abertura de reprodução em PROD.
PRESERVATION: Motor/Arena/Torre/backup, Auth/RLS/ACLs, níveis/XP/itens/validade QA e demais jogadores.
VALIDATION:13PG TEST e os mesmos13 no envelope PROD isolado PASS; restauração preserva recibos/dados. Testes direcionados/tipos/lint PASS. CI push42468089490 ePR42468107566 success no candidatoa3f3343,1129PASS74SKIP; Preview condicionalSKIP. PR42draft. Previewdpl_3qUQhRPjMw1onP3rUGV8hKbDy7GZREADY/TEST. Migration somenteTEST20261108094902:90conjuntos idênticos, apenas um corpo de função alterado com ACL anterior. Produção intocada. Login normal em janela já aberta necessário; fluxo real TEST pendente, sem dispensa ou prova sintética promovida a real.
ACCEPTANCE: Consumir apenas fonte comprovada, retry estável sem novo débito, animação6,5s/skip/Continuar, histórico recolhido, recuperação disponível, desktop/mobile e dados preservados.
OWNER_DECISION: Após login normal Admin TEST confirmado, proprietário não tem acesso à outra conta com55moedas e baú existente; autorizou “pode pular esses testes”. Positivos transacionais hospedados SKIP, não PASS; sem criar saldo/avatar. Demais controles e CI obrigatórios preservados. Modal fixture1365/390/320 PASS, não prova hospedada. Pacote PROD próprio e navegação Ver na Mochila preparados; CI final pendente.
