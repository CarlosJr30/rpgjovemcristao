# RPG-LOJA-VISUAL-008 — vitrine da Loja

07/11/2026. **VALIDATING.** Base remota `151e698` (UI-007); branch isolada `codex/rpg-loja-visual-008`. A tela reutiliza os seis ícones de equipamento, a arte existente dos cinco baús, preços aprovados, confirmação/recibo e revelação da Mochila. Vitrine em três colunas desktop/uma no celular; categorias, raridade, origem, saldo e link da Mochila destacados. O backup `backup/arena-visual-006-aprovada-2026-11-07` não existe neste checkout; histórico Git aprovado preservado.

**Escopo:** artes ampliadas, fontes/status visíveis e descrições longas recolhidas. Compráveis permanecem somente Baú Comum40, Espada35, Couraça65 e Escudo115. Confirmação de compra continua no servidor e a animação de baú segue no fluxo publicado da Mochila. Sem novas artes, preços, probabilidades, transações, migrations ou alterações de dados.

Teste direcionado `shop.test.tsx`: **3/3 PASS**, incluindo preços, seis equipamentos/cinco baús, categorias, bloqueio de ofertas não aprovadas e ausência de envio durante filtro/cancelamento. Prettier e `git diff --check` PASS. CI obrigatório, Preview, conferência visual/aceite e publicação pendentes.
