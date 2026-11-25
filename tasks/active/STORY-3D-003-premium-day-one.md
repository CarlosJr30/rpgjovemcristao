# STORY-3D-003 — Polimento do Dia 1

Status: VALIDATING

- Escopo: mundo Three.js, avatar, câmera, iluminação e apresentação da pergunta do Dia 1. Base disponível: STORY-3D-001.
- Aceite: comparação visual antes/depois e fluxo do marco à pergunta em desktop e celular emulado. A paisagem mineral é cenário fictício do jogo, sem representar os acontecimentos dos dias posteriores.
- Preservar a navegação do Santuário e as regras de correção, tentativas, checkpoints, autorização e progressão. Entrega por commit local para avaliação.
- Verificação visual local: Chromium desktop e Pixel 7 emulado com WebGL via SwiftShader. Com Viajante sintético, entrar pelo portal, caminhar ou usar toque, acionar o marco, assistir à sequência e responder à pergunta. O formulário recebe foco ao abrir e o acerto permite avançar ao Dia 2.
- Evidências locais em `build/story-3d-003`. A Preview aguarda autorização específica. O teste local não mede o desempenho em aparelho físico e não grava checkpoints no Supabase.
- TypeScript do workspace web, ESLint direcionado e build da aplicação aprovados.
