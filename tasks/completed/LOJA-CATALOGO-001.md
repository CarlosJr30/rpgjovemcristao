# LOJA-CATALOGO-001 — catálogo existente da Loja

STATUS: DONE / DEPLOY_COMPLETE
SCOPE: Recuperar inventário main/PR12/branches/documentos; apresentar produtos existentes, origem e disponibilidade na Loja atual. Preservar quatro ofertas e handlers, carteira QA, dados oficiais, Auth/RLS/SQL. Sem novos produtos, preços, probabilidades, assets ou integração de PRs.
PROFILE: Frontend local; QA/Security pelo autor, sem independência.
ACCEPTANCE: Seis equipamentos/cinco baús classificados, sete cartas existentes sem venda; itens sem contrato não têm ação de compra. Layout320/390/desktop, preços e confirmação existentes preservados; CI e RELEASE_POLICY antes de publicação. Nenhuma migration/concessão necessária.
TEST_PLAN: Apenas testes Shop afetados, lint/tipos/build e CI obrigatório. Preview normal TEST somente leitura; PROD somente leitura e preservação. Reutilizar economia/Arena/Torre homologadas.
ACCEPTANCE_RESULT: Catálogo existente integrado sem novas vendas:6equip/5baús/7cartas;quatro ofertas preservadas.3unit Shop/lint/tipos/build/CI1113PASS74SKIP aprovados;PreviewTEST e retida/oficial320/390/desktop e6HTTP PASS. Merge1fb8367/dpl_4EDdVKrC7tNg3ELqgSEcvrn7sKtPREADY/PROD/alias.81PROD/7TESTexatos;zero migrations ou concessões. QA/Security pelo autor. Relatório LOJA-CATALOGO-001-REPORT.md/evidência própria, limites e falhas discriminados.
