# TASK-0076E — Preview integrada da Arena

Estado final: **TASK-0076E — INTEGRATED_PREVIEW_READY**, comprovado em 2026-10-17.

## Escopo e isolamento

Reutiliza a integração 0076D e a demonstração 0076C. Em Preview, `/journey` exibe uma entrada fictícia explicitamente identificada, com link para `/journey/arena`; essa rota renderiza a ArenaDemo existente com retorno à Jornada. `/journey/arena/legacy` mantém o redirecionamento307 aprovado para a rota principal. `/arena-demo` permanece disponível. Nenhum segundo motor ou balanceamento novo.

A Jornada demonstrada é somente a navegação para o combate, não o mapa completo nem progresso de jogador. Viajante/treinadores são fictícios, batalha apenas em memória, recarga/retorno descartam o estado. Não há moedas, XP, equipamento, inventário ou progresso persistente. Os cenários de vitória/derrota são os ensaios visuais já aprovados na 0076C.

A seleção do ambiente é exclusivamente server-side (`VERCEL_ENV=preview`; switch local nunca ativa em Production). Providers/AuthProvider continua fora da árvore Preview. Proxy permite somente as páginas acima e assets, nega APIs e métodos diferentes de GET/HEAD, e redireciona áreas reais para a Jornada fictícia. CSP mantém conexões na própria origem, sem formulários/frames. Nenhuma alteração em RLS/autenticação normal e nenhum acesso Supabase.

As operações reais `journey-action`, início/liquidação de combate, compra de equipamento e concessão de recompensas dependem do backend autenticado e protocolo econômico2. Não são habilitadas nesta Preview. Backup/restauração e rollout econômico0076A continuam pendentes; a demonstração não contorna esses gates.

## Arquivos

Novos: `journey-preview.tsx`, `playwright.integrated-preview-0076e.config.ts`, este relatório e contrato0076E. Atualizados: páginas `app/journey/page.tsx` e `app/journey/arena/page.tsx`, retorno opcional em `arena-demo.tsx`, `proxy.ts`, testes de isolamento e suite Preview existente, `tsconfig.json` e memória. Inclui as fontes/testes e fechamento documental previamente aprovados0076D e o fechamento documental0076C, que ainda estavam locais antes deste commit. Cópias `SQL-PARA-REVISAO` e artefatos privados permanecem locais.

CSS mobile/19keyframes, engine, apresentação dos lutadores/cartas, recompensas e migrations0009/0010 não alterados. O modo normal conserva a integração0076D quando a decisão Preview é falsa.

## Validação e recuperação

Build de produção local em modo Preview, lint e typecheck completos PASS. Cinco unitários de isolamento PASS. E2E dirigidos verificam Jornada→Arena→retorno, legado307, cinco cartas/energia3, toque/jogar/turno, reload, diálogos, três resoluções móveis e bloqueio econômico. Armadilhas em Storage/IndexedDB e rede externa exigem zero gravações/tentativas externas e preservação de sentinela sintética. Uma falha inicial no teste de Location relativo foi corrigida passando a base à API URL, preservando a asserção307/destino; logs originais mantidos, sem retries nem timeout ampliado.

Comandos: `npm.cmd run build` com `RPG_MOBILE_E2E=1`, `RPG_ARENA_DEMO=1`, `VERCEL_ENV=preview`; `node node_modules/vitest/vitest.mjs run apps/web/lib/arena-preview.test.ts`; `node node_modules/@playwright/test/cli.js test --config playwright.integrated-preview-0076e.config.ts`; `npm.cmd run lint`; `npm.cmd run typecheck`. Runtime local copiado para `build/task-0076e-integrated-preview/runtime`, loopback3377. O config aceita apenas hostname único Preview e recusa o hostname conhecido de Production. Traces HTTPS desativados; OIDC efêmero injetado somente na origem correta, sem gravar token. Não usar `vercel curl`, que gerou bypass permanente na0076C.

Publicação por push exclusivo em `preview/task-0076e-integrated-arena`, integração Git existente, sem merge/promoção/domínio/segredos. Conferir deployment targetPreview/commit/READY e HTTPS antes de aceitar. Recuperação: não promover nada; manter Production anterior e registrar eventual Preview como não aprovada. Nenhuma migration acompanha o deploy.

Baseline por leitura: projeto `prj_mG2ZSDaSc5i2Pz2uqKSlCzSGiVmG`, raiz `apps/web`, Production/main em `0df878764f26f0501959031dd4aec4a77fb9308a`, deployment `dpl_CHxbJAphNzND5f8ZbFoR86fT98Yt`; aliases e proteção registrados em `build/task-0076e-integrated-preview/production-before.json`.

QA/Security: autorrevisão, sem alegação de independência. Evidências privadas em `build/task-0076e-integrated-preview/`. POCO X7 físico, ergonomia e FPS pendentes. Proteção Vercel permanece ativa e pode exigir login do proprietário; nenhuma conta do jogo é necessária.

## Publicação e aceite efetivos

- URL da Jornada: https://rpgjovemcristao-lsv5dc8yq-carlos-junior-s-projects.vercel.app/journey
- Arena principal: https://rpgjovemcristao-lsv5dc8yq-carlos-junior-s-projects.vercel.app/journey/arena
- Deployment: `dpl_2mtUz82NvJyqkidmtsNo86BxXTqA`, **READY**, target **preview**, Next.js. A publicação foi gerada automaticamente pelo push da branch.
- Branch: `preview/task-0076e-integrated-arena`; commit `40e843c1cf7defb661294bac0b646b09d8c4bf81`.
- **29 casos PASS**: cinco unitários, 16 E2E locais Chromium/WebKit e oito E2E HTTPS reais Chromium; zero falhas/skips/retries na validação final. Quatro verificações HTTP adicionais comprovaram `/journey`, `/journey/arena`, `/arena-demo` (200/marcador/CSP) e `/journey/arena/legacy` (307). APIs e POSTs econômicos403 confirmados sobre o deployment real antes dos handlers.
- Nos testes HTTPS: três resoluções, toque nas cinco cartas, energia3, jogar/turno, rotação/reload, diálogos de vitória/derrota, Jornada→Arena→retorno e legado307. Zero escrita em Storage/IndexedDB, zero tentativa de conexão externa, nenhuma alteração de sentinela sintética. Traces remotos desligados; nenhuma credencial gravada nas evidências. Verificação dos35 bundles JS locais detectou zero credencial privilegiada.
- Production posterior idêntica ao baseline: deployment `dpl_CHxbJAphNzND5f8ZbFoR86fT98Yt`, SHA/main `0df878764f26f0501959031dd4aec4a77fb9308a`, três aliases e proteção iguais. `main` remoto e SHA da branch Preview conferidos após os testes. Nenhuma alteração Supabase, migration, usuário ou segredo de Production. Preview0076C não foi substituída nem promovida.
- Recibos: `deployment.json`, `https-proof.json`, `local-final-tests.json`, `remote-ready-tests.json`, `production-before.json`, `production-after.json`, `preservation.json`, `browser-bundle-security.json`, `commit-review.json` e `acceptance.json`. [Galeria local e HTTPS](../../build/task-0076e-integrated-preview/review/index.html).

No POCO X7, abrir a Jornada, autenticar-se no Vercel se solicitado, tocar em “Entrar na Arena de Cartas”, iniciar demonstração, jogar cartas/encerrar turno e girar o aparelho. Usar os cenários visuais para vitória/derrota e “Voltar à Jornada” para retornar. Reentrar/recarregar deve descartar a batalha. Não usar uma conta real do jogo.

Este fechamento de evidências/memória/contrato fica local após o commit publicado, evitando novo build apenas documental. A aplicação remota corresponde exatamente ao commit acima. READY refere-se somente à Preview fictícia integrada; mapa completo, progresso, equipamentos pessoais e economia autenticada não estão liberados. Pendências0076A e QA física permanecem.
