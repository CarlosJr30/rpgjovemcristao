# TASK-0076B — Arena de Cartas mobile

Estado: **TASK-0076B — MOBILE_LAYOUT_VALIDATED**, em emulação local. **PHYSICAL_QA_PENDING** para POCO X7. Data: 2026-10-17. Autor: perfis Frontend/QA; autorrevisão, sem revisão independente.

## Problemas comprovados e correções

- Cabeçalhos com alturas diferentes desalinhavam barras de vida e personagens. Linhas intrínsecas compartilhadas por `subgrid`, com alinhamento alternativo por margem, mantêm os dois lados nivelados.
- Em 320 px, a mão caía em três fileiras (2+2+1). Agora usa três colunas e duas fileiras; toque amplia cada carta. Custos, nomes e valores permanecem disponíveis. Texto a 200% recebe quebra de palavras sem corte interno nas cartas.
- Em horizontal, campo e mão ficavam empilhados. Durante a batalha, passam a ocupar duas colunas; energia, intenção e encerramento têm posições explícitas.
- Ao reduzir a mão para duas cartas, o botão saltava aproximadamente 14,67 px. As duas fileiras agora compartilham altura, incluindo a fileira vazia; o espaço das mensagens de indisponibilidade fica reservado.
- A camada isolada da Arena permitia que o cabeçalho interceptasse o botão de fechar a carta. A regra `.page:has(.veil)` libera o empilhamento do modal enquanto ele está aberto. O teste força o cabeçalho visível e fecha por toque, sem `force`.
- Margens laterais e inferiores respeitam `env(safe-area-inset-*)`, inclusive abaixo de 370 px; o modal também respeita topo/laterais/base e permite rolagem interna. Botões principais mobile têm mínimo de 48 px.

Não foi reproduzido corte dos corpos na pose inicial nem overflow horizontal no baseline de três telas; esses comportamentos foram preservados e verificados na matriz ampliada. Rolagem **vertical** continua necessária, especialmente em telas baixas e com texto ampliado. Cinco cartas ficam na mão e são acessíveis; não há promessa de todos os elementos caberem simultaneamente no viewport.

## Evidências e testes

[Comparação antes/depois](../../build/task-0076b-mobile-layout/review/index.html): capturas integrais reais em 406×904, 904×406 e 320×568 CSS px, com fixture/seed iguais. Os arquivos originais anteriores continuam preservados.

| Verificação | Resultado e evidência |
| --- | --- |
| Layout | 20 PASS: 320×568, 360×740, 393×873, 406×904, seus horizontais, 768×1024 e 1280×800; Chromium/Edge com toque e WebKit. `validated-tests.json`, somente casos `layout`. |
| Interações finais | 7 PASS: ampliar/jogar, energia, encerrar turno, rotação, texto a 200%/movimento reduzido, mão 5→2/energia zero e safe areas. `review-tests.json`. |
| Safe areas | CDP com topo 24, direita 36, base 20 e esquerda 28 CSS px; verificação de limites e toque real no fechamento em 904×406/320×568, com cabeçalho visível. Chromium somente; WebKit não oferece CDP. |
| Build de produção | PASS, incluindo types da aplicação e gates existentes de áudio, 54 HD e Body-Fit. Build ID `4BO1YvGUii4J1D2LxmlgU`; `build.log` e `build-result.json`. |
| Lint e types dos testes/config | PASS, `lint.log` e `typecheck.log`; projeto de tipos isolado em `build/.../tsconfig.json`. |
| Preservação | 2.537 arquivos do baseline comparados: somente CSS runtime alterado antes da atualização documental; 19 blocos de keyframes e regra reduced-motion idênticos. `preservation.json`. |

Evidências em `build/task-0076b-mobile-layout/`; [aceite consolidado](../../build/task-0076b-mobile-layout/acceptance.json) referencia 27 casos aprovados, sem retries. O último ajuste só afeta a página com modal aberto: comparação dos CSS compilados comprova que todo o restante é idêntico (`layout-reuse-proof.json`). Por isso os 20 casos de geometria foram reutilizados e os sete fluxos afetados executados novamente.

Histórico preservado: fixture inicial aguardava imagens lazy de painéis fechados; corrigida para aguardar imagens do campo. Houve falha real de corte interno com texto ampliado, cache antigo na cópia de teste, deslocamento ao esvaziar a segunda fileira e interceptação do fechamento pelo cabeçalho. Houve também erro de codificação no seletor de um teste novo, corrigido com escapes Unicode. Relatórios/trace anteriores permanecem disponíveis. A execução `validated-tests.json` contém 26 PASS e um FAIL de modal, posteriormente corrigido e coberto pelos sete PASS finais; não é apresentada como execução integral verde. Nenhum timeout aumentado ou asserção removida.

## Arquivos e escopo

Runtime: `apps/web/features/journey/components/card-arena.module.css` somente. Novos: `playwright.arena-mobile-0076b.config.ts`, `tests/e2e/card-arena-mobile-0076b.spec.ts`, este relatório e contrato `tasks/completed/TASK-0076B-mobile-layout.md`. Memória atualizada em `.agent/memory/CURRENT_STATE.md`. Capturas, cópias locais de runtime e recibos ficam em `build/`, ignorado pelo Git.

Componente TSX, engine, animações/keyframes, assets, economia, migrations, RLS e demais sistemas sem alterações nesta TASK. Fixture sintética em modo local; requisições externas bloqueadas nos testes. Sem acesso Supabase, contas reais, commit, push ou deploy. Security específico de auth/economia: N/A, fronteiras inalteradas; auditorias anteriores não repetidas. Unitários econômicos: N/A, nenhuma lógica alterada.

## Reprodução local

PowerShell, na raiz deste workspace; comandos abaixo modificam somente build/arquivos locais. Após um build novo, sempre preparar uma cópia nova; não sobrepor runtimes com cache de páginas.

```powershell
$env:RPG_MOBILE_E2E='1'
$env:NEXT_TELEMETRY_DISABLED='1'
npm.cmd run build
# Parar aqui se o build falhar.
node build/task-0076b-mobile-layout/prepare-runtime.cjs novo-ensaio
$env:TASK_0076B_STAGE='after'
$env:TASK_0076B_RUNTIME='novo-ensaio'
$env:TASK_0076B_RUN='novo-ensaio'
node node_modules/@playwright/test/cli.js test --config playwright.arena-mobile-0076b.config.ts
node node_modules/eslint/bin/eslint.js playwright.arena-mobile-0076b.config.ts tests/e2e/card-arena-mobile-0076b.spec.ts --max-warnings=0
node node_modules/typescript/bin/tsc --noEmit --project build/task-0076b-mobile-layout/tsconfig.json
```

`RPG_MOBILE_E2E=1` usa o diretório de build isolado preexistente; não muda regras da Arena. O preparador exclui `.env*` e cache de páginas e recusa destino existente. Para repetir apenas fluxos, acrescentar `--grep 'touch selection|large text|safe area|hand shrinks'` à chamada Node direta; evitar o wrapper `.cmd` com pipes no filtro.

## Validação física pendente

A [especificação oficial POCO X7](https://www.po.co/global/product/poco-x7/specs/) informa 1220×2712 pixels físicos. 406×904/DPR 3 é aproximação de teste; viewport/DPR reais dependem das configurações do aparelho. No POCO X7, conferir barras do navegador expandidas/recolhidas, navegação por gestos, recorte da câmera, texto do sistema, cinco cartas por toque, jogar três cartas até energia zero, encerrar turno e girar com modal aberto. Não foram comprovados desempenho/FPS, conforto do polegar ou safe areas físicas. Nenhuma publicação está autorizada por este aceite local. Os bloqueios de produção/backup da TASK-0076A permanecem vigentes.
