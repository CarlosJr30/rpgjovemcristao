# RPG-LOJA-FIX-011 — baús comprados

08/11/2026. **VALIDATING; PROD preservada.** Auditoria encontrou duas compras oficiais de40moedas, recibos válidos e pilha comum502: as fontes novas estavam atrás de500baús legados. Nenhuma abertura posterior. Um baú privado QA e9960moedas permanecem separados, com validade original.

A correção reutiliza o abridor existente e escolhe somente origem com recibo próprio aprovado e ainda não consumido, preservando os legados. Uma substituição de função é necessária porque o FIFO publicado não consegue resolver essa situação. Instalação não altera linhas; recuperação restaura a definição anterior sem apagar recibos.

Loja: confirmação→abertura automática idempotente→modal existente6,5s→recompensa confirmada→Continuar. Falha mantém o baú e a mesma abertura, sem recomprar. Ajuda oferece recuperação de baú guardado; históricos da Mochila recolhidos, registros no servidor intactos. O adaptador reconhece a versão de catálogo já emitida nos recibos produtivos.

13checksPG em cada envelope isolado PASS (mesmos casos, não26distintos). Testes direcionados e CI em andamento. Sem compra, abertura, concessão, mudança de saldo/validade ou migration remota. Gates pendentes: CI exato, suporte/fluxo real TEST e Preview, pacote/gates PROD. Revisão pelo autor, sem independência. Não DONE/DEPLOY_COMPLETE.
