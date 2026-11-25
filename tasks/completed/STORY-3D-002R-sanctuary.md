# STORY-3D-002R — Novo Santuário 3D

Status: DONE

- Base: `b0322eb4b5ee2d2760b9cbc06069591bf4a13219`.
- Escopo executado: substituído somente o mapa inicial da Criação por cena Three.js; versão 2D permanece no fallback sem WebGL 2; transição usa o fluxo existente.
- Causa substituída: `CreationExplorerView` exibia o palco CSS 2D sempre que `dayIndex` era nulo; Three.js era carregado apenas no Dia 1.
- Verificação visual: navegador Chromium com WebGL 2/SwiftShader, desktop 1440×920 e Pixel 7 emulado. Capturas `build/story-3d-002r/santuario-desktop.png`, `santuario-mobile.png`, `dia-1-premium-desktop.png` e `dia-1-premium-mobile.png` (artefatos locais ignorados pelo Git).
- Comportamento: WASD e toque movimentam o avatar; portal abriu o Dia 1 Premium; fluxo desktop observou o marco, exibiu o desafio demonstrativo, retornou ao Santuário e abriu/fechou o Diário; fallback sem WebGL 2 e navegação acessível passaram.
- Checks: `npm run typecheck --workspace=@rpg/web` PASS; ESLint direcionado nos três módulos PASS; `npm run build --workspace=@rpg/web` PASS; `git diff --check` PASS.
- Segurança/escopo: cena local, sem alteração de autorização, Supabase, economia, Guilda, EBD ou Dia 1 Premium; nenhuma publicação/deployment. Fixtures locais temporárias de autenticação foram restauradas e removidas. `supabase/.temp/` preexistente foi preservado fora do commit.
- Revisão independente: não realizada; validação de QA pelo autor com evidência visual de navegador.
