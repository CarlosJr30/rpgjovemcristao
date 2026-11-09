# RPG-CONTENT-040 — Ativação aprovada de catálogo

09/11/2026. **Implementação local validada; CI/TEST/Preview/PROD pendentes.** Escopo: ativar definições aprovadas de 33 cartas e 34 equipamentos. Nenhum item é concedido ou comprado por esta mudança.

- Reutiliza Arena V2, cartas oficiais, Loja, Mochila e autoridade de equipamento. As sete cartas originais e seis equipamentos atuais permanecem inalterados; os novos cards mantêm aquisição pendente sem fontes autorizadas. Equipamento continua exigindo posse e recibo válido. As 67 cópias de runtime são WebP otimizados (~12 MB no total); PNGs de proposta permanecem intactos na branch de arte.
- Pacote SQL aditivo separado para TEST e PROD, com guardas de projeto/escopo, protocolo, hash das sete cartas iniciais e funções existentes. Insere somente as 33 definições com `starter=false`; estende a allowlist de equipamento sem criar preço, oferta, concessão, inventário, recibo ou RPC público. Rollback verifica estado vazio e restaura as funções anteriores; não foi executado.
- Checks locais direcionados: 110 testes PASS; typecheck, lint direcionado, Prettier, `git diff --check` e build/gates de artefatos PASS. Nenhuma suíte geral, compra, concessão, Auth/RLS ou migração remota foi executada.
- Branch `codex/content-040-activation`, baseada diretamente em `main` `6c7b0c9`; commit `9658ec8`. Commits da ART-040 seguem preservados em sua branch original e não são incluídos nesta PR. Próximos gates: push, CI no SHA exato, aplicar somente pacote TEST, conferir Preview e depois executar o pacote PROD pelo fluxo de publicação.

Até esses gates, nada foi ativado remotamente. Sem publicação PROD, sem alterações em saldos, XP, inventários ou dados de jogadores. A posse/aquisição dos 33 cards e 34 equipamentos continua indisponível até aprovação e implementação de contratos econômicos próprios.\n
