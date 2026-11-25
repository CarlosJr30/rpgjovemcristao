# STORY-3D-005 → Mundo 1: Criação completa em 3D
ID: STORY-3D-005
TITLE: Mundo 1 — Dias 2 a 7 em 3D
OBJECTIVE: Implementar em uma tarefa consolidada os seis dias restantes do Mundo 1 como explorações 3D jogáveis, com cenários e sequências específicos, mantendo o Dia 1 Premium.
PRIORITY: P1 High
STATUS: DONE
SCOPE: Cena compartilhada e infraestrutura estritamente necessárias para os Dias 2–7, carregamento sob demanda, interações de marco, cinematics e desafios com contratos atuais, fluxo direto sem Santuário, interface de exploração, acessibilidade, fallback WebGL 2, testes direcionados, captura visual desktop/mobile, typecheck, lint, build, memória e documentação desta tarefa.
OUT_OF_SCOPE: Supabase TEST/PROD, migrations, gabaritos e perguntas oficiais, autorização, RLS, RPCs, limites de tentativas, persistência/checkpoints, vídeo e recompensas, Guilda, EBD, economia, main, merge e deploy.
DEPENDENCIES: Base aprovada 2ec1a6af1325a05575c547531810b9e830d27b48; STORY-3D-004 em codex/story-3d-002r-sanctuary.
ASSIGNED_AGENT: implementação principal pelo agente atual, sem delegação.
REQUIRED_CONTEXT: apps/web/features/story/creation-day-one.tsx e creation-day-one-world.ts; apps/web/features/story/creation-explorer.tsx; conteúdo dos sete dias e contratos existentes; pedido do proprietário nesta conversa.
SECURITY_CONSIDERATIONS: Não aceitar respostas nem progresso como oficiais no cliente. Reutilizar os fluxos remotos existentes sem alterar contratos. Nenhuma alteração de ambiente ou backend autorizada.
ACCEPTANCE_CRITERIA:
- Dias 2 a 7 possuem ambientes 3D distintos, com movimento, interação no marco, sequência narrativa e desafio existente.
- Dia 1 Premium mantém comportamento e visual aprovados.
- A entrada permanece direta, sem Santuário.
- Sete dias, nove marcos, Diário, Harmonia e gates de vídeo/recompensas permanecem conforme contratos atuais.
- Cenas carregam sob demanda, recursos Three.js são descartados e fallback sem WebGL 2 é acessível.
- Capturas reais documentam cada dia em desktop e uma verificação mobile representativa.
TEST_PLAN:
- Vitest direcionado para carregamento dos dias, marcos, desafios, progressão e regressão do Dia 1.
- Verificação Playwright local desktop/mobile com canvas WebGL2, movimento, cinematics, perguntas, Diário e rota direta.
- TypeScript, ESLint direcionado, build de produção e git diff --check.
DEFINITION_OF_DONE:
- Critérios de aceite verificados com evidências registradas.
- Checks QA e segurança aplicáveis aprovados. Sem alteração remota, deployment ou inclusão de supabase/.temp/.
- Relatório final e memória atualizados. Commit local na branch isolada.

## SELF VALIDATION — 2026-11-25

- Vitest: `npx.cmd vitest run apps/web/features/story/creation-explorer.test.tsx` — PASS, 14/14.
- Playwright local com Microsoft Edge/WebGL 2: Dias 2–7 percorridos sequencialmente em desktop 1440×1000; Dia 2 verificado com movimento por teclado, proximidade, tecla E e cinematic; interação com marcos, perguntas e avanço; mobile 390×844 com controle touch. Sem page errors. PASS. Evidências: `build/story-3d-005-evidence/creation-day-{2..7}-desktop.png` e `creation-day-2-mobile.png`.
- ESLint direcionado (`creation-explorer.tsx`, `creation-days-3d.tsx`, `creation-days-world.ts`) — PASS.
- `npm.cmd run typecheck --workspace=@rpg/web` — PASS.
- `npm.cmd run build` — PASS; build de produção concluído e gates de artefato existentes passaram.
- `git diff --check` — PASS; Git avisou que converterá LF para CRLF em `creation-explorer.tsx`, sem erro de whitespace.
- Conteúdo: revisão pelo agente de implementação no papel BIBLICAL CONTENT, sem independência autor/revisor. Referências NVI e classificação de paráfrases/ficção registradas em `docs/biblical/STORY-3D-005-CREATION-DAYS-2-7-REVIEW.md`; sem citação integral, licença permanece com os titulares.
- Segurança/progressão: reaproveitado o submit existente; nenhuma alteração a autorização, RPC, limites, respostas/gabaritos, checkpoints, Harmonia, vídeo ou recompensa. O harness local não conectou Supabase; rota e bypass de autenticação temporários foram removidos após as capturas.
- Banco/economia/ambiente: nenhuma operação econômica, Supabase, migration, deploy ou publicação executada. `supabase/.temp/` fora do staging.
- Alterações limitadas ao fluxo de exploração, nova cena/motor 3D, revisão bíblica e contrato. Dia 1 Premium, Guilda e EBD não foram modificados.
