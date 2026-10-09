# TASK-0060 ? Sincroniza??o GitHub para notebook

Prepara??o local conclu?da em 2026-10-09. Nenhum commit, push, deploy, instala??o ou altera??o no Supabase realizado. Index original vazio mantido. Nenhum arquivo preexistente apagado/descartado; c?digo e assets intactos.

## Git e invent?rio

- Branch: `main`; remoto: `https://github.com/CarlosJr30/rpgjovemcristao.git`.
- HEAD: `916c550` ? Integra Supabase e melhora Fuga da Serpente.
- `HEAD...origin/main`: 0 ? frente / 0 atr?s **da refer?ncia local**. N?o houve fetch nem confirma??o do estado atual do GitHub.
- Antes: 392 caminhos rastreados, 58 modificados, 2 removidos no working tree e 603 novos. As duas remo??es s?o os contratos TASK-0015/TASK-0016 em backlog, com correspondentes em active; n?o foram realizadas nesta tarefa.
- Depois: **59 modificados + 2 remo??es anteriores + 1560 novos = 1621 caminhos para o pr?ximo commit; checkout completo: 1950 arquivos existentes**. Invent?rio completo dos caminhos candidatos e mudan?as em `TASK-0060-GIT-INVENTORY.json`. Total inclui altera??es antigas e prepara??o atual; n?o significa aceite funcional de todas as tarefas anteriores.

## O que acompanha o projeto

- C?digo de Avatar, Body-Fit DEV, Equipment Portal, Arena, Guilda e Di?rio; testes, scripts, ferramentas, configs, packages, lockfile, migrations locais e documenta??o. Versionar migrations n?o as aplica no banco.
- 54 PNGs HD e seus cat?logos, manifests e recibos de aprova??o dur?veis. Preservar assets runtime hist?ricos, overlays V1 e demais packs p?blicos.
- `assets-source/`: fontes originais, incluindo 16 targets Body-Fit V2, fontes conceituais e seus manifests; `manifest.json` da raiz permanece inclu?vel.
- 950 artefatos offline em caminhos originais de `build/`, 548.553.006 bytes (~523,14 MiB). Allowlist exata em `.gitignore`, invent?rio com SHA-256 em `TASK-0060-PRESERVED-ARTIFACTS.json`. Inclui fontes geradas de bainha, candidatos/bakes hist?ricos e atuais, settings, fit metadata/reports, receipts, estados humanos e vistas corporais ?teis.
- Copiar um candidato n?o aprova a arte nem ativa runtime. TASK-0054 segue READY somente staging; gates pendentes/rework das demais tarefas continuam como registrados.
- `.gitattributes` impede convers?o de newline em `build/`, `assets-source/` e `docs/architecture/`, preservando bytes de metadata/receipts usados por SHA. C?digo preexistente n?o foi renormalizado.
- Fontes tipogr?ficas: nenhum arquivo TTF/OTF/WOFF/WOFF2 pr?prio encontrado. UI usa stacks locais Arial/Helvetica/Georgia/Times New Roman; nenhuma fonte externa necess?ria ao build inspecionado.

## O que continua ignorado

- `apps/web/.env.local`, `.env`, `.env.*` (exce??o apenas para `.env.example` vazio).
- `node_modules/`, `.npm-cache/` na raiz e nos workspaces, `.next/`, `*.tsbuildinfo`, `__pycache__/`, `*.py[cod]`, logs, `dist/`, coverage, Playwright reports e `test-results/`.
- `build/` permanece ignorado, salvo os 950 caminhos explicitamente auditados. Novos outputs n?o s?o liberados automaticamente. A c?pia de verifica??o em `build/task-0060-sync-audit/checkout/` e os invent?rios tempor?rios da auditoria ficam ignorados.
- Chaves e recipientes de credenciais listados em `.gitignore`; ?ndices RAG gerados permanecem locais.
- Capturas de regress?o/E2E, traces, resultados transit?rios e vistas mec?nicas duplicadas de fonte/avatar/alinhamento n?o seguem pelo Git. Nenhum desses arquivos foi apagado. Algumas galerias hist?ricas exigem regenerar vistas antes de navegar sem links ausentes; os bakes/fontes/metadados necess?rios permanecem preservados. O Git n?o ? backup de todas as evid?ncias locais.

## Tamanhos e Git LFS

- Nenhum candidato acima de 10 MiB. Maiores: `garden_background_day.png` (3.506.369 bytes), `act_01_journey_map.png` (3.458.691 bytes), `armor_traveler_rare_female_v2.png` fonte (3.098.323 bytes).
- LFS instalado localmente (3.7.1), mas n?o configurado nesta tarefa. N?o necess?rio para os tamanhos individuais atuais. O volume agregado ? cerca de 780 MiB antes da compress?o Git; crescimento/hist?rico de bin?rios pode justificar LFS em tarefa pr?pria antes de novos lotes.
- Arquivo grande ignorado: trace tempor?rio da Arena em `build/task-0040-evidence/e2e-states/` com 49.007.495 bytes (~46,74 MiB); caches npm cont?m arquivos at? 38.945.461 bytes (~37,14 MiB). Continuam fora do envio.

## Seguran?a e riscos

Revis?o pelo pr?prio autor, sem independ?ncia. Nenhum match de credencial encontrado nos textos candidatos ou nos 882 blobs textuais do hist?rico Git local alcan??vel. Padr?es incluem chaves privadas, tokens comuns, JWT, URLs com senha e atribui??es literais suspeitas. Sa?das registram somente caminhos/linhas/categorias; valores privados n?o s?o reproduzidos. `.env.local` n?o foi copiado nem lido em conte?do, e nenhum ambiente privado est? rastreado.

A varredura ? heur?stica: n?o prova aus?ncia absoluta de secrets, n?o analisa conte?do visual/esteganografia de bin?rios, reflogs/objetos inalcan??veis ou arquivos exclusivamente remotos. Repetir revis?o do diff ap?s staging; n?o usar `git add -f`. Conte?do gerado/review HTML foi tratado como dado, sem execut?-lo durante a revis?o de seguran?a.

Riscos residuais: volume de bin?rios aumenta tempo de clone/push; novas sa?das continuam ignoradas e precisam de revis?o; assets podem ter obriga??es de licen?a/uso j? existentes; refer?ncias hist?ricas absolutas descrevem a m?quina original e n?o s?o autoriza??o nem depend?ncia runtime. Browser storage/saves n?o se transferem pelo Git. Estado de Auth/banco depende do ambiente remoto existente; sincronizar o c?digo n?o confirma gates RLS/QA remotos pendentes.

## Reconstru??o no notebook

1. Instalar Node `>=24.16.0 <25` e npm `>=11.13.0 <12`; refer?ncia auditada: Node 24.16.0/npm 11.13.0.
2. Ap?s a publica??o, clonar o reposit?rio e entrar na raiz. Executar `npm ci` usando `package-lock.json` e `.npmrc` existentes (`ignore-scripts=true`). N?o copiar `node_modules`, `.next` ou caches.
3. Copiar `apps/web/.env.example` para `apps/web/.env.local` e preencher privadamente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` a partir da configura??o privada existente. N?o colocar service-role, senha de banco ou chave privada na aplica??o browser. Exemplo permanece com valores vazios.
4. `DATABASE_URL` existe apenas no exemplo da raiz para opera??es de banco deliberadamente autorizadas; n?o ? exigida para compilar esta aplica??o. N?o rodar migrations/push de banco ou mudar Supabase para sincronizar notebook.
5. Executar `npm run build`, `npm run lint`, `npm run typecheck`, `npm test` e `npm run dev` conforme necessidade. E2E atual usa Microsoft Edge (`msedge`) instalado e exige build antes de `npm run test:e2e`; n?o h? instala??o autom?tica de browser nesta tarefa.
6. Auth remota existente e saves sincronizados dependem da mesma configura??o privada e da conta correta. Saves exclusivos do navegador original precisam de exporta??o/backup pr?prio, fora do Git, se houver fluxo autorizado; n?o foram acessados aqui.

Verifica??o realizada: c?pia s? com arquivos inclu?veis no Git, sem `.env.local`, `npm run build` PASS (auditor de 54HD, compila??o, TypeScript e 20 p?ginas geradas). Depend?ncias da m?quina original foram reutilizadas por resolu??o Node; uma instala??o `npm ci` do zero n?o foi realizada nem simulada como PASS. Manifests de todos os workspaces correspondem ao lockfile. Verifica??es lint/unit/E2E globais n?o foram repetidas: somente configura??o Git/documenta??o foi alterada; revis?o estrutural/ignore/preserva??o e build atendem o risco desta tarefa. N?o houve acesso ao Supabase.

## Publica??o futura ? comandos revis?veis

Executar na raiz somente depois de revisar esta entrega. A lista NUL abaixo cont?m somente os caminhos de mudan?as auditados, incluindo as duas remo??es anteriores. Ela est? ignorada e pode ser recriada do invent?rio version?vel:

```powershell
$syncInventory = Get-Content -Raw docs/architecture/TASK-0060-GIT-INVENTORY.json | ConvertFrom-Json
New-Item -ItemType Directory -Force build/task-0060-sync-audit | Out-Null
$syncPaths = ($syncInventory.changes.path -join [char]0) + [char]0
[IO.File]::WriteAllBytes((Join-Path $PWD 'build/task-0060-sync-audit/publish-paths.txt'), [Text.Encoding]::UTF8.GetBytes($syncPaths))
git status --short --branch
git add --dry-run --pathspec-from-file=build/task-0060-sync-audit/publish-paths.txt --pathspec-file-nul
git add --pathspec-from-file=build/task-0060-sync-audit/publish-paths.txt --pathspec-file-nul
git diff --cached --stat
git diff --cached --name-status
git diff --cached -- . ':!package-lock.json'
```

Revisar tamb?m todos os novos assets/receipts e confirmar que n?o h? `.env.local`, credenciais, caches ou novos arquivos n?o auditados. Mudan?as ap?s a auditoria exigem revalidar conte?do/invent?rio. Se estiver seguro:

```powershell
git commit -m "Preserva projeto e assets para continuidade no notebook"
git fetch origin
git rev-list --left-right --count HEAD...origin/main
```

Prosseguir somente se o segundo n?mero (commits exclusivos do remoto) for zero. Caso contr?rio, conciliar o hist?rico em etapa pr?pria, preservando o commit local; nunca for?ar push ou resetar altera??es. Quando houver autoriza??o para publicar e a revis?o estiver completa:

```powershell
git push origin main
```

N?o executado nesta tarefa. Opcionalmente criar branch dedicada antes do staging/commit e publicar essa branch para revis?o. Ap?s push autorizado, validar em clone limpo no notebook. Configura??o privada deve ser recriada por canal seguro, sem copiar valores para documenta??o/chat/Git.
