# RPG-LOJA-VISUAL-008 — vitrine da Loja

07/11/2026. **DONE / DEPLOY_COMPLETE.** A Loja usa uma vitrine medieval responsiva sobre os componentes e dados existentes: seis equipamentos e cinco baús, artes ampliadas, raridade/origem, saldo e acesso à Mochila. Compras continuam limitadas ao Baú Comum (40), Espada (35), Couraça (65) e Escudo (115) moedas. Confirmações, recibos, inventário e abertura na Mochila não foram alterados.

- Teste direcionado shop.test.tsx: **3/3 PASS**; Prettier e git diff --check PASS. CI obrigatório do candidato 817f3a57e79e63cc387aa2fa7b0e3bf5e1116026: run **42368859127 success**, incluindo testes, lint, TypeScript, build, PostgreSQL e RSC/mobile. Job condicional de Preview SKIP, não PASS.
- Preview dpl_9T9TghvPiQpBrxFeUfBazWhFapgG, READY no SHA candidato. O proprietário informou que não conseguiu acessá-la e autorizou explicitamente a publicação em produção. **Não houve inspeção visual autenticada do proprietário na Preview**; essa limitação não é registrada como teste visual PASS.
- PR #40 integrada pelo fluxo normal; merge **d0e30e069f568467686f02ad9260c1ed1041df4f**. Produção Vercel **dpl_FKJjKBg8wH8yxHb4pwGMVdAfMSw3**, READY/production no SHA do merge, alias rpgjovemcristao-web-inky.vercel.app confirmado. A rota oficial /journey/shop respondeu HTTP 200.
- Sem migration, alteração de Auth/RLS, transação, compra, abertura de baú, concessão ou escrita de dados. Economia, preços e ofertas não mudaram.

O backup backup/arena-visual-006-aprovada-2026-11-07 não estava presente no checkout isolado; nenhum backup ou histórico aprovado foi alterado. Layout móvel foi coberto pelos gates RSC/mobile; sem teste em aparelho físico.
