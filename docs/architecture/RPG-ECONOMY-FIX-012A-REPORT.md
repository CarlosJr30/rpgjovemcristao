# RPG-ECONOMY-FIX-012A — vitrine da Loja

10/11/2026. **Validação local PASS; PR/CI/Preview pendentes.** Incremento separado da PR #46, baseado em `origin/main` `4d5a64e`. A PR #46 em `d97d8ae` permanece intacta.

- A rota autenticada da Loja agora mantém o catálogo visível durante consulta, bloqueio ou falha de leitura. Mensagens curtas indicam análise do histórico ou indisponibilidade.
- Compra, consulta/recuperação de operação e abertura de baú permanecem desabilitadas até a leitura canônica existente confirmar `enabled` e `balanceVerified`. Estados autorizados mantêm o fluxo atual.
- Nenhuma RPC de ativação, migration, mudança em Auth/RLS, saldo, item, recibo ou dado de jogador entrou neste recorte. A restauração individual dos legados permanece pendente na PR #46.
- Validação local: `shop.test.tsx` **9/9 PASS**; ESLint, Prettier, TypeScript do workspace web e `git diff --check` PASS. Dependências reutilizadas por junction existente, sem instalação. Build e gates abrangentes serão confirmados no CI obrigatório do SHA da PR.

**Pendente:** commit/PR, CI exato, Preview TEST e smoke autenticado somente de leitura. Não publicar antes desses gates.
