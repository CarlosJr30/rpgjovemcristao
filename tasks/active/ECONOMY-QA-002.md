# ECONOMY-QA-002 — treino no Teste Chat A existente

STATUS: BLOCKED — proposta entregue; execução econômica aguarda aprovação específica.
PRIORITY: P2
OBJECTIVE: Propor isolamento de treino para a conta/avatar PROD existentes, sem alterar dados nesta etapa.
AUTHORIZATION: Pedido de03/11/2026 autoriza inspeção somente leitura e proposta primeiro; proíbe concessão/mudança PROD antes de aprovação do mecanismo.
SCOPE: Leitura da sessão normal Auth, vínculo/avatar e fontes existentes; docs/architecture/ECONOMY-QA-002-PROPOSAL.md, contrato e memória. Perfis Architecture/Database/Security assumidos pelo autor, sem subagentes ou revisão independente.
OUT_OF_SCOPE: Runtime, migration, orçamento, reconciliação, criação de conta/avatar, testes gerais, deploy, integração de outras PRs.
EVIDENCE: Auth normal atual confirmado; fingerprint51f8f162f5bf, avatarativo Teste Chat A nível50/XP245016/fingerprint1ef91a760179/economic_verified_at ausente. Zero cartas com recibo/zero starter; dados e hashes privados em build/economy-qa-002/read-only-evidence.json. Nenhum segredo registrado.
FINDINGS: QAshopTEST exige avatar novo e altera public.wallets; inadequado para importar. PRODshop exige saldo/recibos canônicos, não basta alterar economic_verified_at. Proposta separa também inventário, baús, recibos e equipamentos QA; dados legados continuam intactos e sem certificação artificial.
ACCEPTANCE: Proposta concreta com10.000QA únicos/sete dias, autorização por conta/avatar, idempotência, não transferência, starter explícito separado, plano de contenção e gates mínimos. Documento revisado contra código existente.
VALIDATION: Leitura/inspeção estrutural e revisão documental/segurança pelo autor. Build/lint/unit/PG/browserfuncional N/A: nenhum código alterado. Nenhuma homologação prévia refeita. Sem alteração remota ou moeda emitida.
NEXT: Aprovação explícita do mecanismo documentado antes de qualquer implementação/ativação econômica. Orçamento e validade são propostas, não decisões presumidas.
