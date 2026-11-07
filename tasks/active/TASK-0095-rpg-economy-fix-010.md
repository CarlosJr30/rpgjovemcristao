# TASK-0095 — RPG-ECONOMY-FIX-010
ID: TASK-0095
TITLE: Auditar e preparar reconciliação individual do Teste Chat A
OBJECTIVE: Regularizar o avatar ativo sem promover saldo sem proveniência nem alterar outros jogadores, preservando a autoridade QA existente.
PRIORITY: P1 High
STATUS: BLOCKED
SCOPE: Auditoria PROD somente leitura, consulta das autoridades/recibos existentes, preparação individual, documentação/evidência; correção apenas de defeito comprovado.
OUT_OF_SCOPE: Aprovar valores por inferência, UPDATE direto de verificação, novas carteiras/inventários/compras, alterações de contas/XP/saldos/itens/validade, homônimo e outros jogadores, publicação enquanto bloqueado.
ASSIGNED_AGENT: Autor atuando em Database/QA/Security nos limites expressos do pedido; sem delegação.
DEPENDENCIES: Main d0e30e069f568467686f02ad9260c1ed1041df4f; FIX-PROD-004/006; ECONOMY-QA-002; decisão explícita sobre base legada.
REQUIRED_CONTEXT: .agent/GLOBAL_CONTEXT.md, CURRENT_STATE.md, WORKFLOW.md, RULES.md, SECURITY.md; perfis Database/Security; skill Supabase.
SECURITY_CONSIDERATIONS: Consultas BEGIN READ ONLY; conta e avatar ativos conferidos por vínculo Auth/política, sem simular sessão. Nenhuma escrita em nome do proprietário. Starter e fonte QA independentes dos saldos legados.
ACCEPTANCE_CRITERIA:
- Origem de moedas/XP/itens classificada sem certificar coincidências.
- Proposta individual auditável pronta antes de pedir decisão; sem alterações financeiras até aprovação específica.
- Treino QA e homônimo preservados; nenhum mecanismo novo de compra.
- Não publicar/declarar resolvido enquanto autoridade oficial bloqueada.
RESULTS:
- Identidade e homônimo confirmados; perfil QA 9960/recibos coerentes/validade original.
- Starter sete cartas legítimas; 34 recibos legados não autoritativos, delta16XP/6moedas sem origem.
- Guarda oficial NULL e saldo reconhecido0; não há reconciliador de escrita publicado.
- Plano/única decisão no relatório RPG-ECONOMY-FIX-010-REPORT.md.
VALIDATION: SQL de leitura real e inspeção da fronteira/ACLs. Evidências anteriores reaproveitadas. Sem runtime alterado, portanto sem nova suíte geral, CI ou deploy.
DEFINITION_OF_DONE: Após decisão explícita, suporte limitado ao checkpoint implementado/validado se aprovado, gates econômicos/recuperação, aplicação/preservação e publicação confirmadas. Até lá manter BLOCKED.
UNBLOCK_CONDITION: Decidir sobre reconhecer os valores legados atuais como base administrativa individual, sem declarar falsa proveniência de ganhos. Aprovação QA prévia não substitui esta decisão.
