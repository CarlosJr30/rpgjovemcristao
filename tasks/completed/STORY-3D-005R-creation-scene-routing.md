# STORY-3D-005R → Corrigir carregamento real dos Dias 2 a 7 em 3D
ID: STORY-3D-005R
TITLE: Corrigir seleção e remontagem das cenas Three.js da Criação
OBJECTIVE: Encontrar a condição concreta que mantém Dias 2–7 no visual legado e corrigir o fluxo do explorador para montar a cena 3D correta em cada dia liberado.
PRIORITY: P1 High
STATUS: DONE
SCOPE: Rota do explorador da Criação, seleção e ciclo de vida do componente 3D, testes direcionados e evidência visual local dos Dias 1–7.
OUT_OF_SCOPE: Supabase e migrations, bypass de progresso remoto, gabaritos, RPCs, limites, economia, Guilda, EBD, vídeos, recompensas, main, merge e deployment.
DEPENDENCIES: STORY-3D-005 commit 190577a0a66bbccd092f588c79c1ad1c31ae9b94.
ASSIGNED_AGENT: Implementação pelo agente atual, sem delegação.
REQUIRED_CONTEXT: Pedido STORY-3D-005R; apps/web/features/story/creation-explorer.tsx; creation-days-3d.tsx; creation-days-world.ts; fixtures e testes existentes do explorador.
SECURITY_CONSIDERATIONS: Testar estados de progressão apenas localmente; não desbloquear dias no ambiente hospedado; não modificar persistência, autorização ou segredos.
ACCEPTANCE_CRITERIA:
- Causa concreta documentada com arquivo e condição reproduzível.
- Dia 1 Premium permanece inalterado; dias liberados 2–7 montam seus próprios cenários Three.js no fluxo normal.
- A entrada segue direta. O mapa 2D permanece disponível se WebGL 2 estiver indisponível ou se a cena do dia falhar.
- Transições desmontam cena anterior e preservam marcos, quiz, progressão, Diário e fallback.
- Capturas reais individuais dos sete dias geradas pelo explorador local com WebGL2.
TEST_PLAN:
- Testar seleção e transição de cena nos sete estados, incluindo fallback sem WebGL2.
- Exercitar progressão local via fluxo demonstrativo, sem fixtures/bypass hospedado.
- Verificar canvas, contexto WebGL 2, marcos, questionário e remontagem em Playwright, além de induzir perda de contexto para verificar a recuperação na próxima cena.
- Executar Vitest direcionado, TypeScript, ESLint direcionado, build e git diff --check.
DEFINITION_OF_DONE:
- Causa reproduzida, correção mínima implementada e aceite verificável com evidências.
- Gates aplicáveis PASS, documentação e memória atualizadas, commit local criado sem supabase/.temp/.
- Sem mudanças em Supabase, Production, main, economia, Guilda ou EBD.

## Diagnóstico e correção

O checkout já estava na branch `codex/story-3d-005-creation-days-2-to-7`, no SHA esperado `190577a0a66bbccd092f588c79c1ad1c31ae9b94`. Havia uma correção parcial do fallback, um teste inicial, uma rota temporária de navegador e uma alteração em `apps/web/AGENTS.md` fora do escopo. O contrato original da STORY-3D-005 está em `tasks/completed/`.

Em `creation-explorer.tsx`, `onUnavailable` dos dois renderizadores gravava o mesmo booleano `dayOneUnavailable`. A falha ao criar o renderizador ou a perda do contexto WebGL em qualquer dia desativava o 3D em toda a sessão do explorador. A progressão selecionava o próximo dia corretamente, mas o booleano impedia a montagem da cena correspondente. Dois testes executados contra `190577a` confirmaram o defeito nas transições 1 → 2 e 2 → 3 após falha gráfica.

O explorador registra a falha pelo número do dia. Quando WebGL 2 está disponível, cada dia seguinte tenta montar sua própria cena. O componente dos Dias 2–7 usa a chave do dia para desmontar o mundo anterior e iniciar câmera, controles e sequência com estado novo. A transição também limpa pedidos de marco da cena que saiu. O carregamento dinâmico e a seleção do primeiro dia pendente pelo progresso confirmado já estavam integrados.

## Validação local de 25/11/2026

- Vitest direcionado aprovado com 21 testes em três arquivos (`creation-explorer`, `creation-explorer-model` e rota de entrada). Dois casos novos demonstram a regressão no commit base e a recuperação no candidato. Os testes existentes exercitam a entrada direta, a retomada pelo primeiro dia pendente e as operações de checkpoint com repositório simulado.
- Playwright em Edge/Chromium com SwiftShader. O explorador da demonstração percorreu os sete dias e os nove marcos, abriu os desafios e chegou à Harmonia. Cada canvas desktop tinha WebGL 2 e o canvas anterior saiu do DOM a cada transição. Dia 2 e abertura do Diário também passaram em celular emulado de 390 × 844. Zero exceções de página ou requisições fora da origem local.
- O navegador induziu perda real de contexto via `WEBGL_lose_context` nos Dias 1 e 2. Em cada caso, o mapa 2D permitiu concluir o dia afetado e a cena seguinte montou em WebGL 2. Com suporte WebGL 2 desabilitado no navegador, os Dias 1 e 2 usaram o mapa 2D.
- Capturas locais em `build/story-3d-005r-evidence/day-{1..7}-desktop.png`, `day-2-mobile.png` e mosaico `days-2-7.png`. O relatório `verification.json` registra versão do contexto, dimensões e resultados. A rota temporária e a exceção do gate de autenticação foram retiradas da aplicação antes do build final.
- ESLint direcionado aos dois arquivos de código aprovado. QA e segurança revisados pelo próprio autor. A alteração da aplicação se limita ao estado React e ao ciclo de vida da cena. O harness respondeu apenas em loopback, com configuração fictícia. Nenhum backend foi acessado e o checkout retém `supabase/.temp/` fora do staging. Revisão bíblica inaplicável, pois cenários, narrativa e perguntas seguem os da base.
- TypeScript aprovado após retirar do cache de desenvolvimento os tipos gerados para a rota temporária já removida.
- `npm.cmd run build` e `git diff --check` aprovados. O manifesto de rotas do build contém o explorador público existente e exclui a rota temporária. Os gates de artefato existentes passaram.
- O defeito do fallback foi reproduzido localmente. O gatilho na sessão hospedada reportada segue sem verificação neste escopo local.
