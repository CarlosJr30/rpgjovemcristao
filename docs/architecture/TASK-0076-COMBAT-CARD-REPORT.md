# TASK-0076 — Combat Card System V1

Status: **LOCAL_FUNCTIONAL_PASS / PUBLICAÇÃO BLOCKED**. Este relatório não declara entrega técnica em produção nem aprovação física no POCO X7. QA, Security e revisão editorial foram executados pelo próprio autor; não houve revisor independente.

## Nova Arena e regras entregues localmente

`/journey/arena` oferece Duelo de Cartas; a experiência clássica permanece em `/journey/arena/legacy`. A integração é incremental, com alteração de rota reversível e sem apagar o motor anterior.

- Baralho de 20 cópias, 15 tipos, mão de até cinco, três de Energia por turno, Foco limitado a seis.
- Ataque, Defesa, Fé como atitude de treino, Tática e Especial; as 15 cartas solicitadas estão no catálogo. Cópias adicionais de Golpe Rápido, Golpe Poderoso, Ataque Preciso e Defesa Firme completam o baralho.
- Cartas não usadas ficam na mão. Compra apenas até cinco no começo do turno; descarte temporário reembaralhado. Nenhuma carta gera Energia ou consome coleção permanente.
- Quatro treinadores fictícios existentes, com padrões distintos e intenção anunciada. Dano, cura, Bloqueio, enfraquecimento, preparação e Contra-ataque são resolvidos pelo motor puro.
- Vitória/derrota por Vida zero; nova tentativa cria outro ID. Concessão voluntária encerra sem recompensa.
- Recompensa existente de 8 XP e 3 moedas, até três vitórias por treinador/dia no navegador, compartilhando a quota da Arena clássica. Reserva precede o crédito; repetição de clique, callback e reload não repete o crédito no fluxo testado.
- Save de batalha separado por conta/modo local e Viajante, transcrição reproduzida, revisão esperada e Web Locks entre abas. Nenhum endpoint, nova tabela ou concessão administrativa foi criado.

As regras completas e limites estão em [COMBAT-CARD-SYSTEM-V1.md](COMBAT-CARD-SYSTEM-V1.md).

## Visual, animações e mobile

O palco mantém Viajante HD à esquerda e treinador à direita; Vida, Bloqueio, Foco, Energia e intenção são legíveis. Os seis equipamentos atuais aparecem como cartas com seus IDs, bônus e efeitos preservados. O Avatar usa `showEquipment={false}` somente na nova experiência. Nove categorias futuras são metadados, sem novos slots persistentes ou 450 itens.

Movimento 2D procedural entregue: entrada, idle, preparação e avanço do ataque, golpe comum e pesado distintos, reação ao dano, defesa, Contra-ataque, cura/Foco, especiais, vitória e derrota. Cartas entram na mão, ampliam em diálogo, avançam/ativam e descartam; o indicador de Energia reage à mudança. Rastros, faíscas, poeira, luz e tremor moderado complementam os retratos licenciados existentes. Resultado lógico não aguarda o término visual.

Não foram produzidos novos rigs, vídeo, arte cinematográfica externa ou trilha. Essa apresentação procedural não é uma animação esquelética inédita. Reduced motion desliga movimentos/partículas, preservando estado e comandos. Não houve medição física de FPS ou garantia de 60 FPS.

Matriz da Arena: 320×568, 360×800, 390×844, 412×915, 430×932, 768×1024, 844×390, 915×412 e 1440×900, em Android/Edge, WebKit mobile e Chrome desktop; texto 200%, teclado, foco/Escape/Tab, toque sem arrastar e ausência de overflow lateral. O aceite físico permanece **PHYSICAL_QA_PENDING**.

Capturas privadas selecionadas e manifesto de hashes estão em `build/task-0076-combat-card-system/review/`, com `index.html`, `REPORT.md`, `acceptance.json` e `SHA256.json`. Nenhuma captura é evidência de um POCO físico ou de conta real. A revisão jogável local fica em http://127.0.0.1:3176/journey/arena; use o fluxo normal de modo local e um Viajante sintético. Esse endereço funciona apenas neste computador.

## Defeitos encontrados e correções

| Achado | Causa / correção | Evidência |
| --- | --- | --- |
| Pés do treinador cortados em três projetos | Wrapper herdado impunha altura maior que o ator. A nova Arena renderiza o retrato elegível em wrapper próprio com `object-fit: contain`; componente legado intacto | Asserções geométricas dos dois personagens e screenshots da matriz |
| Navegação/reload desktop travando em cadeia | Next 16.3.5 vinculava resposta interna de imagem ao socket da primeira requisição. Uma interrupção podia prender a promise compartilhada da variante WebP; PNG ou outra largura respondiam | Diagnóstico: mesma imagem WebP32 sem resposta, PNG32/WebP64/128 válidos; Sharp isolado35ms; traces preservados |
| Atualização 16.3.8 insuficiente para esse defeito | Inspeção da versão instalada ainda mostrou o socket compartilhado. Next/eslint-config-next 16.4.2 contém a correção; sem desativar otimização | Código instalado conferido e seis abortos locais com recuperação 200, em `image-abort-probe.json` |
| Advisories de dependências de produção | Atualizações exatas de Next/eslint-config-next, Sharp 0.35.5 e source-map-js 1.2.2 | `dependency-audit-production-utf8.json`: zero vulnerabilidades |
| Expectativas obsoletas de Arena e corridas das asserções novas | Testes clássicos seguem o link/rota legado. Novos testes aguardam revisão/fase real; seletor de navegação distingue menu desktop/mobile | Sem retirar asserções, aumentar timeout ou adicionar retries |
| Vitória póstuma no Contra-ataque | O retorno podia ocorrer depois de dano letal ao jogador. Agora exige sobrevivência; Vida zero encerra como derrota | Novo unitário força ambos com1Vida e golpe letal bloqueado parcialmente |
| Histórico omitindo bônus/limites | Registrava o valor base de Bloqueio/Foco da carta. Agora registra o ganho efetivo, com os equipamentos e caps | Asserção de oito de Bloqueio para carta de sete mais Escudo; seis efeitos testados |

O mecanismo do otimizador está documentado no [PR oficial Next #98168](https://github.com/vercel/next.js/pull/98168) e na [issue #96538](https://github.com/vercel/next.js/issues/96538). A reprodução local é consistente com esse mecanismo; não se atribui automaticamente a ele as 14 falhas históricas da TASK-0075.

A primeira suíte desta tarefa foi mantida: **165 PASS / 19 FAIL / 2 skips**, em 186 casos, exit1. Três falhas eram geometria nova; as demais afetavam navegação/imagens desktop. Um início intermediário sem `BUILD_ID` ocorreu antes de terminar o build e não executou casos; foi erro de ordenação da validação, preservado como diagnóstico. Um probe inicialmente usou query de imagem recusada por padrão (400); foi corrigido para larguras válidas sem relaxar a política.

## Resultados dos gates

Evidências ficam no diretório privado `build/task-0076-combat-card-system/`. A regressão ampliada encerrou com exit0, zero flaky/erros globais. O último build inclui a correção de Contra-ataque letal, os valores do histórico e o acabamento de Energia/aviso do Portal; a rodada focada da nova Arena valida esse artefato após a regressão ampliada. Os build IDs são registrados separadamente, sem somar repetições como casos distintos.

| Gate | Resultado atual | Evidência |
| --- | --- | --- |
| Motor e persistência | PASS, 21 testes novos | 13 motor + 8 integração |
| Unitários completos | PASS, 473 testes / 70 arquivos | `unit-review.log` |
| Lint / typecheck / build | PASS no artefato final, todos exit0 | `local-release-gates.json` e logs `*-release.log` |
| E2E ampliado | PASS, 226 aprovados / 2 skips / 0 falhas | `combat-patched-full.json` / log, 228 casos, exit0 |
| E2E da nova Arena no artefato final | PASS, 12/12, zero skips/falhas/flaky/erros globais, exit0 | `combat-final-review.json` / log; Android, WebKit mobile e Chrome |
| Artefato, credenciais e mídia | PASS no build final | `artifact-audit.json`, 44 chunks, 23 traces sem arquivos privados, 14 URLs404 incluindo oito áudios |
| Interrupção do otimizador | PASS, 6/6 respostas200 | `image-abort-probe.json` |
| Dependências de produção | PASS, zero avisos conhecidos | `dependency-audit-production-utf8.json` |
| Dependências incluindo DEV | OPEN, 5 altas e 4 moderadas transitivas | `dependency-audit-final-utf8.json`; detalhe no parecer Security |
| Integridade econômica remota | **BLOCKED / HIGH** | SEC-ECONOMY-001, metadados SELECT sem exploração |
| Chat com duas contas reais / POCO físico | Não executados nesta tarefa | Fixtures/regressão não equivalem a esse aceite |
| Publicação desta Arena | **BLOCKED** | Nenhum commit, push, merge ou deploy novo |

Build IDs locais: regressão ampliada `Nf95tBSfZMoK9v4YnpQFu`; revisão final `bILwBD8VFYseJWcV7Je7x`. Esses IDs do Next não são SHAs Git nem deployments Vercel. Os 12 testes finais repetem casos da Arena; não são somados aos 226 como cobertura distinta. Os dois skips são casos mobile no projeto desktop.

Comandos executados: `npm test -- --maxWorkers=2`, `npm run lint`, `npm run typecheck`, `npm run build`, Playwright com `playwright.combat-card.config.ts` (workers2/retries0), `node scripts/combat-card-image-abort-probe.mjs`, `node scripts/combat-card-artifact-audit.mjs`, `npm audit --omit=dev --json` e `npm audit --json`. Typecheck/build preservaram os bytes de `next-env.d.ts`. As rodadas Playwright controlam o servidor e exigem a porta3176 livre; o servidor de revisão foi iniciado depois de concluí-las, ligado somente a127.0.0.1.

A seleção ampliada contém15arquivos: Arena clássica e V2, atributos, baús, combate por cartas, Diário, pares Body-Fit aprovados, Portal, exploração/quiz, experiência da Guilda, Home/Loja/Mochila, isolamento de mídia, modo mobile, playthrough da Serpente e formulário/Auth local. Chat também passou nos unitários de UI/repositório existentes; não foi testado Realtime com duas contas reais nesta tarefa. A galeria privada foi aberta em Chrome headless em390×844/1440×900:6/6imagens, alt text, ausência de overflow e9/9hashes conferidos (`review-validation.json`).

## Arquivos de implementação e integração

| Grupo | Arquivos principais |
| --- | --- |
| Motor novo e export | `packages/game-engine/src/combat-card-system.ts`, teste correspondente e uma exportação em `src/index.ts` |
| Interface e movimento | `apps/web/features/journey/components/card-arena.tsx`, `card-arena.module.css`, `screens/card-arena.tsx` |
| Persistência e resultado | `persistence/card-arena-storage.ts`, `data/card-arena-reward.ts`, `card-arena-persistence.test.ts`; extensão compatível de `persistence/arena-storage.ts` |
| Rotas | `apps/web/app/journey/arena/page.tsx`, nova `arena/legacy/page.tsx` |
| QA | `tests/e2e/combat-card-system.spec.ts`, três arquivos legados com destino explícito, `playwright.combat-card.config.ts`, inclusão no `tsconfig.json`, dois scripts de auditoria local |
| Dependências | `apps/web/package.json`, `package.json`, `package-lock.json` |
| Documentação e estado | Arquitetura, este relatório, parecer Security, Checklist MestreV3.0, link no checklist histórico, contrato ativo e memória; ponteiro também atualizado no workspace original |

Não há migration necessária ou aplicada nesta implementação local. A correção do bloqueio econômico é um pré-requisito remoto separado e ainda não foi implementada.

## Preservação e segurança

Home, login/cadastro, Loja, inventário, Portal, Guilda/chat, Jornada, quiz e Serpente mantêm seus contratos. A câmera/swipe TASK-0066, mídia, saves existentes, economia global, 54 Avatares HD, quatro bindings Body-Fit e recibos foram preservados. Os testes usam fixtures locais sintéticas; não consomem os recursos do Chat A nem usam dados de jogadores.

Não houve alteração de Supabase, Auth, RLS, migrations, dados reais, variáveis remotas ou Deployment Protection. Consulta remota foi somente SELECT de metadados. Nenhuma service role foi adicionada; configuração local ignorada contém apenas as variáveis públicas existentes. Galerias privadas e os oito áudios restritos não são expostos pelo artefato.

O [parecer de segurança](../security/TASK-0076-COMBAT-CARD-SECURITY.md) registra **SEC-ECONOMY-001**: authenticated pode escrever nos próprios recursos e executar crédito arbitrário sem comprovar a recompensa. RLS isola proprietários, mas não valida origem econômica. Locks/replay locais não fecham isso e não são apresentados como antifraude de servidor. Uma reserva interrompida também pode exigir recuperação manual, sem repetição de crédito incerto.

Esse achado alto impede publicar conforme `.agent/SECURITY.md` e §14 do pedido. A correção exige desenhar recompensa autoritativa, ledger idempotente e contratos específicos de escrita; a restrição do anexo impede alterar as políticas/migrations remotas nesta tarefa. Também permanecem advisories DEV, incluindo `braces` sem patch publicado. Não houve aceitação de risco presumida.

## Git, deployment e continuidade

- Worktree: `D:/rpg-jovem-cristao-combat-0076`.
- Branch: `feat/combat-card-system-v1-0076`.
- HEAD local e main remota reconfirmados: `0df878764f26f0501959031dd4aec4a77fb9308a`.
- Mudanças da Arena permanecem locais; não existe SHA de commit desta implementação. Sem push ou merge.
- Produção anterior reconfirmada via CLI/API: `dpl_CHxbJAphNzND5f8ZbFoR86fT98Yt`, **READY**, `main`, SHA `0df878764f26f0501959031dd4aec4a77fb9308a`.
- URL existente: https://rpgjovemcristao-web-inky.vercel.app/. Ela **não contém esta nova Arena** e não é apresentada como publicação da TASK-0076.
- Baseline público anterior: Home, Auth, Jornada, Arena, Equipamentos e Guilda responderam200; oito áudios restritos responderam404. `production-baseline-http.json` registra somente HTTP sem mutação; isso não prova sessão autenticada, Realtime ou aceite funcional do novo combate.
- Não existe Deployment ID, READY/SHA ou smoke público da nova Arena. Um novo deploy não foi criado para contornar o gate.
- [Checklist Mestre V3.0](MASTER-CHECKLIST-V3.0.md), contrato e memória acompanham o estado real.

Próxima etapa necessária para publicação: resolver o contrato de integridade econômica com autorização específica para a mudança remota, revisar os advisories DEV e repetir os gates aplicáveis. Só então commit/push/integração normal, deployment automático no projeto existente, confirmação de SHA/READY e smoke público. O teste no POCO X7 continua pendente até existir uma publicação aprovada.
