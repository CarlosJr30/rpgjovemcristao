# TASK-0076D — Arena principal

Estado: **MAIN_ARENA_REPLACED_LOCALLY** — 2026-10-17. Aceite exclusivamente local; nenhuma publicação realizada.

## Integração

A rota principal `/journey/arena` já renderizava a Arena de Cartas da TASK-0076. Os menus da Jornada já apontavam para essa rota. Foram retiradas as duas entradas restantes da interface clássica: o link “Arena clássica” no cabeçalho e a renderização de `/journey/arena/legacy`. Essa URL agora redireciona temporariamente (307) para `/journey/arena`, preservando favoritos antigos. A navegação de retorno continua na Jornada.

O motor antigo permanece em `apps/web/features/journey/screens/arena.tsx`, sem importação pelas rotas da aplicação. Nenhum segundo motor foi criado. Personagem, equipamentos, intenção inimiga, baralho de 20 cartas, mão de cinco, três pontos de energia, turnos e resultados foram preservados. CSS mobile e seus 19 keyframes permanecem byte a byte iguais ao baseline.

## Arquivos desta tarefa

- Runtime: `apps/web/app/journey/arena/legacy/page.tsx` e `apps/web/features/journey/components/card-arena.tsx`.
- Testes: novo `apps/web/features/journey/card-arena-unavailable.test.tsx`, novo `tests/e2e/main-arena-0076d.spec.ts`, atualização de `tests/e2e/arena.spec.ts` e do trecho da Arena em `tests/e2e/mobile-game-mode.spec.ts`.
- Configuração: `playwright.main-arena-0076d.config.ts` e sua inclusão no `tsconfig.json`.
- Histórico: os testes exclusivos da interface retirada foram preservados byte a byte em `tests/retired-ui/arena-classic.spec.ts` e `arena-v2.spec.ts`, com README explicativo; deixaram a seleção ativa de E2E. O novo teste de entrada ocupa `tests/e2e/arena.spec.ts`. Testes do motor antigo continuam preservados.
- Documentação: este relatório, contrato concluído `tasks/completed/TASK-0076D-main-arena.md` e memória atual. Alterações documentais preexistentes da TASK-0076C foram preservadas.

## Verificação

**18 casos passaram:** três unitários, 14 E2E e uma matriz compartilhada que cobre 11 resoluções. Os E2E finais tiveram zero falhas, skips e retries.

Os 14 E2E cobrem entrada real pelo menu da Jornada, preservação do personagem/equipamentos e retorno, redirecionamento legado, uso por toque, energia e encerramento de turno. Validam 406×904, 904×406 e 320×568 em Chromium e WebKit, personagens completos no campo, HP legível, cinco cartas e ausência de overflow horizontal. Dois testes existentes de combate foram reutilizados sem alteração: vitória com crédito legítimo uma única vez e derrota com reinício. A matriz compartilhada adaptada passou em 11 tamanhos, de 320×568 a 1920×1080.

Build de produção local, lint e typecheck completos: **PASS**. As últimas adaptações de configuração/teste também passaram em ESLint direcionado e TypeScript raiz. Uma falha inicial de tipagem no teste novo foi corrigida removendo uma opção não suportada da API de teste; a seleção inicial vazia da matriz foi corrigida no filtro explícito. Logs anteriores permanecem disponíveis; nenhuma asserção foi removida para mascarar falha e nenhum timeout foi ampliado para isso.

Recibos: `build/task-0076d-main-arena/{build-result,unavailable-tests,main-final-tests,shared-mobile-final-tests,preservation,acceptance}.json`, além dos logs de build/lint/typecheck. [Galeria de evidências locais](../../build/task-0076d-main-arena/review/index.html): entrada pela Jornada, três layouts e vitória. Capturas completas incluem rolagem vertical; não se afirma que toda a tela cabe sem rolar.

Comandos executados: `npm.cmd run build` (build local isolado com `RPG_MOBILE_E2E=1`, `RPG_ARENA_DEMO=0`); `node node_modules/vitest/vitest.mjs run apps/web/features/journey/card-arena-unavailable.test.tsx`; `node node_modules/@playwright/test/cli.js test --config playwright.main-arena-0076d.config.ts`; matriz com `TASK_0076D_SHARED=1`, `TASK_0076D_RUN=shared-mobile-final` e `--project=android`; `npm.cmd run lint`; `npm.cmd run typecheck`. O Playwright usa exclusivamente o pacote standalone copiado para `build/task-0076d-main-arena/runtime` em loopback 127.0.0.1:3375. `VERCEL_ENV=production` nesse processo simula o modo local e não publica nada.

## Segurança e limites

O início online continua usando o cliente econômico existente. Falhas HTTP 401, 503 e de rede agora exibem aviso explícito de impossibilidade de validação segura. Os três testes exercitam o cliente real com transporte sintético e comprovam que não há início local, alteração do personagem ou escrita de sessão/batalha. São provas do tratamento de falhas, não validação contra Supabase real.

Backend, engine, balanceamento, recompensas, migrations 0009/0010, RLS e demo da Preview não mudaram. Recompensas locais legítimas preexistentes foram preservadas; fixtures descartáveis não representam jogadores reais. Não houve acesso remoto, commit, push ou deploy. HEAD permanece `3616f491026d23caf476d64321b92dfac3c06173`; índice Git sem alterações.

A Preview aprovada continua na versão anterior, isolada de demonstração. Production permanece fora do escopo. Publicação futura do jogo autenticado depende das pendências da TASK-0076A: backup/restauração real, backend/protocolo 2 e implantação coordenada sob aprovação própria. Nenhum fallback econômico antigo foi introduzido. Ergonomia, FPS e validação no POCO X7 físico continuam pendentes.

QA e Security: autorrevisão local com evidências, sem revisor independente. Aceite comprovado para substituição local da interface; não implica aprovação econômica remota ou física.
