# Diagnóstico hospedado RPG-DEV-002

`protected-preview-probe.mjs` reproduz a matriz WebKit na Preview revisada do runtime `2d0132e`, backend TEST. Não habilita gameplay e não é correção do erro RSC.

Executar com Node 24 e Playwright já instalados, a partir da raiz. O processo precisa receber `VERCEL_OIDC_TOKEN` pelo login oficial/`vercel env run`, sem gravar tokens no disco. Fornecer por stdin um objeto com `origin` (a Preview explicitamente permitida no script), `transport` (`continue` ou `fetch`), `navigation` (`links` ou `goto`), `repeats` (1–10) e `account` (e-mail/senha de conta TEST autorizada, avatar ativo esperado em `active.name`). Não passar credenciais em argumentos, logs ou commits. Confirmar UID/TEST antes de executar. Não usar contas produtivas.

O fluxo verifica login, avatar, Guilda, EBD, reload, logout e negação da EBD após logout. As saídas em `build/rpg-dev-002/` omitem credenciais, valores dos cookies e parâmetros das URLs; não publicar traces de sessões. Qualquer erro de página reprova a execução, mesmo se os passos funcionais terminarem. Exit 1 significa que há um gate reprovado.

O helper `protected-preview-route.ts` é uma alternativa **experimental** para diagnóstico do transporte autenticado. Ele limita o token à origem exata, não segue redirects no fetch e repassa a resposta original sem acrescentar headers CORS. **Não resolveu a intermitência**: a repetição ampliada falhou em três de cinco execuções com navegação completa. Não o usar como alegação de estabilidade Safari, nem ignorar erros de prefetch para passar um gate.

A matriz local sem rede externa é `npx --no-install playwright test --config playwright.gameplay-isolated.config.ts`. Reutiliza as fixtures sintéticas da Arena/Torre e não inicia Next, banco hospedado ou contas reais. Não comprova execução hospedada, aquisição autorizada nem homologação do catálogo/economia.
