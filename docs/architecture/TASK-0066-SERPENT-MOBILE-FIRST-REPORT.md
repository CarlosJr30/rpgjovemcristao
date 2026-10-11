# TASK-0066 — Fuga da Serpente Mobile-First V2

STATUS: READY_FOR_RELEASE — gates locais PASS; GitHub/Vercel/verificação pública ainda pendentes.

## Arquitetura e qualidade

| Item solicitado | Resultado |
| --- | --- |
| 1. Causa raiz | Escala `min(width/864,height/504)` para exibir o mapa inteiro; todos os perfis com `cameraFollow=false`, câmera zerada por frame e stage portrait limitado a 12/7. |
| 2. Arquitetura anterior | Mundo lógico e colisões já separados, mas apresentação sempre ajustada ao mapa completo. Fullscreen ampliava o contêiner sem ampliar adequadamente células/personagem. |
| 3. Nova arquitetura | Câmera/escala em `snake-camera.ts`, gesto/intenção em `snake-swipe.ts`, apresentação mobile em módulo CSS. Engine existente preservada. |
| 4. Câmera | Até 1024px, acompanha jogador com suavização exponencial, fica limitada ao mundo 864×504, centraliza quando os limites permitem; reduced motion imediato. Desktop conserva mapa integral. |
| 5. Escala/viewport | Célula-alvo 40–48 CSS px, podendo crescer para preencher uma viewport alta sem espaço fora do mundo. Aspect ratio lógico preservado. Em 390×844 com direcional aberto: célula ~15,5→47,8px, cabeça ~13,4→41,4px, campo ~25,4→75,0% da viewport, 8×13,5 células visíveis; overflow 0. |
| 6. Swipe | Pointer capture na área do canvas; limiar configurável 24 CSS px, eixo dominante, diagonal vira um comando, pequenos toques ignorados, um ponteiro ativo, segmentos sucessivos sem levantar o dedo, deduplicação/cancel seguros. `touch-action:none` somente nas superfícies interativas. |
| 7. Buffer | Intenção 0,65s no relógio existente; curva usa passagem física válida; nenhuma posição é derivada do toque. Cancel/reinício/saída/pausa/respawn limpam input. Troca de eixo ou reversão interrompe a velocidade residual do swipe; teclado/direcional conservam entrada original. |
| 8. Alternativas | Direcional recolhível com quatro alvos ≥48px, teclado existente, canvas focável, foco visível, pausa/saída e ações superiores ≥44px. HUD/objetivo permanecem separados do campo. |
| 9. Fullscreen | Fullscreen API real em Chromium, recálculo do backing/câmera, mudança real de viewport portrait/landscape via CDP; WebKit Windows apresentou fallback e manteve modo dedicado. Fullscreen opcional. PNGs capturados no tamanho CSS real, sem edição de imagens. |
| 10. Portrait | 320×568, 360×800, 375×812, 390×844, 412×915, 430×932; modo dedicado 100dvh com safe areas. Campo ocupa espaço restante; shell secundário ocultado durante a partida. |
| 11. Landscape/desktop | 844×390, 915×412, tablet 768×1024, desktop 1440×900 e 1920×1080. Câmera mobile, HUD compacto e controles alternativos; desktop conserva mundo completo e teclado. |
| 12. Performance | Terreno/Path2D reutilizados; fundo/terreno recortados à câmera, pickups/partículas fora da região visível dispensados; sprites tratados/resampleados uma vez em memória até 256px, PNGs originais intactos. DPR ≤2 e adaptação para 1 após dez frames mobile persistentemente >42ms; somente resolução interna. Canvas isolado para reduzir composição com bordas/sombras. React HUD ~10Hz, diagnóstico DOM ~10Hz; nenhuma engine ou dificuldade substituída. |
| 13–17. Unit/E2E/lint/types/build | Resultados e versões aceitas em `build/task-0066-serpent-mobile-first/local-gates.json`; falhas históricas e followups separados. Snapshot selecionado sem `.env`, dependências existentes reutilizadas. QA local usa variáveis públicas fictícias, não serve como prebuilt de deploy. |
| 18. Segurança | Público/artefatos/fontes restritas/rotas DEV/staging auditados; relatório específico em `docs/security/TASK-0066-PRODUCTION-REVIEW.md`. Nenhuma licença ou aprovação humana concedida. |
| 19. Arquivos | Quinze caminhos selecionados no `release-plan.json`, listados abaixo. |
| 20. Preservação | Baseline SHA256 de 2036 arquivos anteriores. Engine, mapa, velocidades, colisões, rewards/progressão, Supabase/auth/saves/economia/IDs, Arena/Guilda/Diário/Equipment Portal, 54 Avatares HD, Body-Fit, catálogos e licenças preservados. Trabalho0059/0063/0065 e documentos compartilhados permanecem locais, fora da seleção. |
| 21–23. Commit/push/hash | PENDENTE — preencher somente após confirmação GitHub; mensagem autorizada `feat: add mobile camera and swipe controls to serpent game`. Sem force push/reset/rebase. |
| 24–26. Vercel | PENDENTE — projeto existente `carlos-junior-s-projects/rpgjovemcristao-web`, ID `prj_mG2ZSDaSc5i2Pz2uqKSlCzSGiVmG`, GitHub/main/apps/web/Next.js/Node24.x reconfirmados. Acompanhar automático, sem duplicação manual. Produção: https://rpgjovemcristao-web-inky.vercel.app/. |
| 27. Evidências | Galeria local `build/task-0066-serpent-mobile-first/review/index.html`; PNGs antes/depois nos dois engines, fullscreen, câmara/inputs/11 dimensões, logs, traces de DOM/rede, métricas e registros de preservação/segurança. Galeria fora da publicação. |
| 28. Físico | POCO X7 pendente do usuário. Sistema, versão do navegador, barras/notch, teclado físico/virtual, aquecimento/bateria/fluidez e latência de hardware não medidos. Sem alegação de Safari real, dispositivo físico, autenticação real ou WCAG integral. |
| 29. Status final | ACTIVE até GitHub/Vercel/produção comprovados. DEPLOY_COMPLETE somente depois dos gates públicos. |

## Arquivos selecionados

- `apps/web/features/journey/components/snake-chase-game.tsx`
- `apps/web/features/journey/components/snake-camera.ts`
- `apps/web/features/journey/components/snake-swipe.ts`
- `apps/web/features/journey/components/snake-mobile.module.css`
- `apps/web/features/journey/snake-chase-game.test.tsx`
- `apps/web/features/journey/snake-mobile.test.ts`
- `tests/e2e/serpent-mobile-v2.spec.ts`
- `tests/e2e/snake-responsive.spec.ts`
- `playwright.serpent-mobile.config.ts`
- `scripts/serpent-mobile-release.mjs`
- `.agent/GLOBAL_CONTEXT.md`
- `.agent/RELEASE_POLICY.md`
- `tasks/active/TASK-0066-serpent-mobile-first-v2.md`
- `docs/architecture/TASK-0066-SERPENT-MOBILE-FIRST-REPORT.md`
- `docs/security/TASK-0066-PRODUCTION-REVIEW.md`

## Falhas, reworks e limites

Baseline WebKit teve prefetch cancelado ao navegar e medição antes do ResizeObserver; coletor passou a aguardar imagens/backing store e reiniciar na mesma página. Dois erros de tipos em fixtures foram corrigidos, logs preservados. Swipe recusava curva legal por exigir alinhamento ao centro: corrigido com gate físico `isBlocked` e caso unitário de borda. HUD passou a publicar a última perda de vida mesmo antes de completar o intervalo de 100ms.

Fullscreen automatizado exigiu aguardar entrada real; `page.setViewportSize` não redimensiona uma janela Chromium fullscreen, então orientação utiliza `Emulation.setDeviceMetricsOverride`. A captura direta usa o recorte CSS real, pois o viewport armazenado pelo Playwright fica antigo. Protocolos/capturas incorretos constam nos logs anteriores e não contam como aceite.

WebKit Windows com DPR3 apresentou rasterização/composição lenta, inclusive sem trace e sem blur de sprites. A hipótese inicial de trace foi descartada por comparação controlada. Reduzir backing e recortar fontes não resolveu isoladamente; composição do canvas foi isolada e capturas contínuas do trace foram dispensadas, preservando PNGs explícitos/DOM/rede. Métricas reais estão em `performance-android.json` e `performance-webkit-mobile.json`; não representam hardware POCO/iPhone. Não ocultar o limite de performance do WebKit emulado. Os timeouts originais de derrota permanecem nos registros de rework.

Android usa eventos touch nativos CDP; WebKit usa PointerEvents gerados pelo mouse com captura real e cancel sintético. Teclado e quatro direções são exercitados. Tempos de gesto distinguem duração da automação e PointerEvent→diagnóstico renderizado a10Hz; não são latência física touch→display. Profiling sem carga controlada de CPU/rede, amostra curta de RAF, heap apenas Chromium, CLS indisponível onde a API não existe.

Fixtures descartáveis de browser simulam progresso local necessário para alcançar o minigame; nenhum save do usuário ou conta real é editado. Serviços externos bloqueados nos novos testes. Build/publicação reutilizam isolamento comercial existente; 8 áudios Suno Free continuam somente em fonte não publicável.

QA/Security realizados pelo autor, sem revisão independente. Fluxo permanente documentado: implementar → testar → segurança → commit → push normal → Vercel → verificar produção → teste físico pelo usuário. Encerramento documental ficará local após verificação real, sem deploy extra apenas para documentação.

Referências primárias: [Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) para capture/cancel e [Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API) para detecção/fallback. Next.js consultado na documentação instalada16.3.5. Próxima ação: usuário validar a versão efetivamente publicada no POCO X7; não iniciar outra TASK automaticamente.

## Gates locais aprovados

35 unitários em4arquivos e25E2E distintos/zero skips PASS: dez cenários mobile,11dimensões nos três perfis, native touch em4orientações, playthrough/vitória nos dois engines e9regressões Jornada. Lint/typecheck/build finais PASS;20páginas estáticas; prebuild209/artefatos727/8SHA/54HD preservados. HTTP32 PASS;8áudios/8fontes/DEV/galerias404. Evidência: local-gates.json e arquivos associados. Falhas anteriores preservadas e substituídas no aceite somente pelos casos afetados comprovados.

Android RAF~60FPS/p95~16,7ms/CLS0/DPR2; WebKit Windows~15FPS/p95~73ms/CLS indisponível/DPR1 adaptado; perfil emulado, sem throttle e amostra curta após2s de aquecimento. WebKit permanece uma limitação de performance de ambiente, sem alegar fluidez iOS real. Derrota passou em~60s sem ampliar o timeout90s; Android~30s. Landscape com direcional aberto ocupa~54,1% em844×390 e~56,8% em915×412; default fechado/fullscreen aproveita ainda mais espaço.

Rework adicional: asserts passaram a exigir explicitamente quatro controles presentes. Identificada área landscape<50% com direcional aberto; corrigida com HUD de quatro colunas. Navegação desktop conserva scroll normal até os controles. Antes/depois da publicação e hashes finais serão registrados somente após execução.
