# Diagnóstico hospedado RPG-DEV-002

`protected-preview-probe.mjs` reproduz a matriz WebKit na Preview revisada do runtime `2d0132e`, backend TEST. Não habilita gameplay e não é correção do erro RSC.

Executar com Node 24 e Playwright já instalados, a partir da raiz. O processo precisa receber `VERCEL_OIDC_TOKEN` pelo login oficial/`vercel env run`, sem gravar tokens no disco. Fornecer por stdin um objeto com `origin` (a Preview explicitamente permitida no script), `transport` (`continue` ou `fetch`), `navigation` (`links` ou `goto`), `repeats` (1–10) e `account` (e-mail/senha de conta TEST autorizada, avatar ativo esperado em `active.name`). Não passar credenciais em argumentos, logs ou commits. Confirmar UID/TEST antes de executar. Não usar contas produtivas.

O fluxo verifica login, avatar, Guilda, EBD, reload, logout e negação da EBD após logout. As saídas em `build/rpg-dev-002/` omitem credenciais, valores dos cookies e parâmetros das URLs; não publicar traces de sessões. Qualquer erro de página reprova a execução, mesmo se os passos funcionais terminarem. Exit 1 significa que há um gate reprovado.

O helper `protected-preview-route.ts` é uma alternativa **experimental** para diagnóstico do transporte autenticado. Ele limita o token à origem exata, não segue redirects no fetch e repassa a resposta original sem acrescentar headers CORS. **Não resolveu a intermitência**: a repetição ampliada falhou em três de cinco execuções com navegação completa. Não o usar como alegação de estabilidade Safari, nem ignorar erros de prefetch para passar um gate.

A matriz local sem rede externa é `npx --no-install playwright test --config playwright.gameplay-isolated.config.ts`. Reutiliza as fixtures sintéticas da Arena/Torre e não inicia Next, banco hospedado ou contas reais. Não comprova execução hospedada, aquisição autorizada nem homologação do catálogo/economia.

## RPG-DEV-003 — controles locais

Iniciar o Next **de produção local** na pasta `apps/web` com bind `127.0.0.1`, porta 3199. A matriz é `node tests/hosted/local-webkit-rsc-probe.mjs`: Chromium/WebKit, três réplicas por célula, links/goto e controles de transporte/prefetch. Build com URL pública sintética `https://fixture.invalid`, nenhuma chave real. O backend é interceptado por uma fixture que aborta tráfego externo. Não executar sobre dev server, Preview ou banco real.

Para retirar toda interceptação do navegador, compilar localmente com `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3202` e chave sintética. Executar a matriz com `--native-backend`: o simulador HTTP nasce somente em `127.0.0.1:3202` e responde dados sintéticos, com origem CORS explícita `http://127.0.0.1:3199`. Essa configuração pertence ao simulador; não modifica CORS/Auth da aplicação ou Supabase. A célula `fixture-only` nesse modo não instala nenhuma rota Playwright. `--settled-only` compara seis fluxos completos aguardando a rede estabilizar antes de navegação/reload/logout. Nenhuma dessas provas substitui autenticação/RLS hospedadas.

`node tests/hosted/native-rsc-cancellation-probe.mjs` é um controle público, sem sessão nem interceptação do navegador. Um proxy somente GET e rotas públicas, em `127.0.0.1:3201`, atrasa RSC em 1,5 s e registra cancelamentos no servidor. Não altera o Next nem o produto. Os processos temporários encerram seus servidores ao terminar normalmente.

**Resultado diagnóstico não é gate PASS:** os scripts registram separadamente `functionalPassed` e `errorFree`. Exit 0 significa apenas que a coleta/fluxos funcionais terminaram; erros RSC registrados continuam reprovando estabilidade. Não filtrar esses erros nem publicar gameplay por causa do exit code. Todas as saídas em `build/rpg-dev-003/` são privadas, sem tokens reais. `--smoke` reduz a coleta a um fluxo por navegador para validar a montagem da fixture.
