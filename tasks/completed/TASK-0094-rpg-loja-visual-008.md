# TASK-0094 — RPG-LOJA-VISUAL-008: vitrine medieval da Loja
ID: TASK-0094
TITLE: Transformar visualmente a Loja reutilizando os produtos existentes
OBJECTIVE: Apresentar os seis equipamentos e cinco tipos de baú existentes em uma vitrine medieval responsiva, preservando preços, fontes, transações e bloqueios publicados.
PRIORITY: P2 Normal
STATUS: DONE
SCOPE: apps/web/features/journey/screens/shop.tsx, shop.module.css, teste direcionado e relatório.
OUT_OF_SCOPE: Auth, RLS, SQL, migrations, catálogo/valores econômicos, saldos, XP, inventários, recibos, loot, probabilidades, Arena, Torre, contas/dados e novas artes/produtos.
DEPENDENCIES: Main 151e698c7569339dc83c95ba926e14e8d305b5b3; catálogos e regras publicados em LOJA-CATALOGO-001 / ECONOMY-001C.2.
ASSIGNED_AGENT: Frontend (autor)
SECURITY_CONSIDERATIONS: Apresentação apenas. Preservados confirmação/servidor e bloqueio das ofertas não aprovadas. Sem escrita econômica ou alteração de configuração.
ACCEPTANCE_CRITERIA:
- Vitrine responsiva mostra seis equipamentos e cinco baús com artes existentes.
- Somente Baú Comum 40, Espada 35, Couraça 65 e Escudo 115 têm oferta.
- Mochila e fluxos de compra/recibo/revelação existentes foram preservados.
- Nenhuma regra, preço ou dado persistido alterado.
VALIDATION:
- shop.test.tsx: 3/3 PASS; Prettier e git diff --check PASS.
- CI candidato 817f3a57e79e63cc387aa2fa7b0e3bf5e1116026, run 42368859127 success; todos os gates obrigatórios PASS. O job condicional Preview SKIP não foi tratado como PASS.
- Preview READY no SHA candidato. O proprietário relatou que não conseguia acessá-la e autorizou explicitamente publicar em PROD; o aceite visual autenticado na Preview não ocorreu.
- Após merge normal, deployment dpl_FKJjKBg8wH8yxHb4pwGMVdAfMSw3 READY/production no merge d0e30e069f568467686f02ad9260c1ed1041df4f; alias oficial confirmado e /journey/shop HTTP200.
DEFINITION_OF_DONE:
- Implementação e gates concluídos; merge normal e produção confirmada.
- Relatório/memória atualizados; contrato arquivado em tasks/completed/.
- Sem migration ou alteração de dados/economia.
