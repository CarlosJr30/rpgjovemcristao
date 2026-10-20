# TASK-0089 — Trilha sonora dinâmica e efeitos

Data: 2026-10-20. **Infraestrutura local PASS; aceite integral BLOCKED.** Revisão funcional, visual e de segurança pelo autor, sem independência. Contexto09/09 executado somente local.

## 1. Branch e commit local

Branch `codex/dynamic-game-audio`, checkout `build/task-0089-dynamic-audio/checkout`, base `760b269dbbe947bb4da00903d64d19280a9e38ce`, descendente do runtime0088 `ea0c07f214ee13824a43f14666c6132d51b10677`. Implementação validada: `a573cd12c0541524644c3cb552bfdbb28456f600`. Fechamento posterior apenas documental, sem alterar o runtime validado; HEAD final em `../final-receipt.json`. Memória de controle raiz atualizada por prefixo, com os bytes anteriores preservados integralmente. Nada enviado ao remoto, publicado, mesclado ou aplicado em banco.

## 2. Auditoria do AudioManager

Reutilizado `gameAudio`, a instância já existente de `AudioManager`. Já havia crossfade de 650 ms, duas mídias durante a transição, pool de quatro efeitos, preload sob demanda, fallback OGG/MP3, gesto confiável, preferências desativadas inicialmente e suspensão por aba. Faltavam contextos específicos, volume geral, opção consciente para estudo, prioridade do vídeo, cache musical limitado e proteção de reprodução assíncrona tardia. Esses pontos foram acrescentados à mesma classe; nenhuma biblioteca ou sistema paralelo foi criado.

Escopos musicais e retenções de vídeo são tokens liberados no cleanup. A rota base permanece atualizada sob um escopo e é restaurada ao sair. Foi corrigida a corrida em que uma rejeição antiga de retomada poderia pausar a nova faixa. Falhas e ausência de mídia não bloqueiam navegação ou combate.

## 3. Trilhas existentes e homologadas

`APPROVED_MUSIC` e `APPROVED_EFFECTS` continuam vazios e byte a byte preservados. Há oito OGG Suno Free históricos em `assets-source/arena-audio-prototype`: uma música e sete efeitos. Hashes conferidos contra política e recibos existentes; nenhuma cópia pública presente. São protótipos não comerciais da Arena DEV, sem aprovação comercial. Não foram promovidos à Torre, estudo ou produção. A auditoria local está em `../audio-provenance-audit.json`; a [proveniência](TASK-0089-AUDIO-CATALOG-AND-PROVENANCE.md) descreve os limites.

Não há identificação verificável das três referências musicais citadas com arquivos do repositório. Seus nomes não foram tratados como homologação.

## 4. Slots ainda sem arquivos

`audio-catalog.ts` prepara20 slots pendentes: os dez ambientes solicitados, com Guilda e EBD separados, mais os nove mundos. Cada slot contém ID, nome, contexto, path nulo, duração desconhecida, loop, volume, versão e aprovação pendente. O contrato exige fonte, autoria, licença, permissões, revisor, evidência e hash quando aprovado. O registro é planejamento; a cadeia existente de auditoria e `APPROVED_*` continua responsável por autorizar playback.

Cinco efeitos de baú pendentes: `chest_common`, `chest_uncommon`, `chest_rare`, `chest_epic`, `chest_extraordinary`. Contextos legados journey/quiz permanecem compatíveis e silenciosos sem binding aprovado. Não há URL fictícia nem arquivo ausente cadastrado como funcional.

## 5. Sistema de transições

Uma ambientação estável, com até duas mídias durante o crossfade de 650 ms existente; troca de contexto, fade-in/out, loop e pausa/retomada. Cache de até quatro elementos musicais e pool existente de quatro efeitos, sem carregar os nove mundos na entrada. Retornar ao mesmo contexto ou mudar apenas intensidade não reinicia a faixa. Retenção de vídeo preserva posição; mudança de contexto durante retenção/aba oculta escolhe a faixa atual ao retomar.

Torre e Campeão usam contextos `tower`/`boss`; intensidade cresce conservadoramente pelo nível já existente, modificando somente o ganho. Sem mídia homologada, ficam silenciosos. O slot `reward` prepara assinatura não repetitiva; os eventos semânticos de vitória/derrota já existentes continuam sendo o ponto de integração da conquista. Não foi inventada uma assinatura oficial.

## 6. Controles de volume e mute

Volume geral multiplica os volumes independentes de música e efeitos. Música, efeitos e silenciar tudo permanecem separados; preferências validadas e limitadas0–1 são persistidas na chave existente. Nova opção de música durante leitura/estudo desligada por padrão; oração, reflexão, quiz, Guilda e EBD silenciosos até opção explícita. Música de combate usa o mix existente abaixo dos efeitos importantes.

Controles têm rótulos, teclado, Escape e modal com rolagem em telas baixas. Mantidos feedbacks visuais de prêmio, dano, erro e status. Economia de dados do navegador, quando disponível, pausa música e efeitos sem apagar preferências. Sem Network Information API, demais controles continuam funcionando.

## 7. Integração com vídeo

`StoryVideoPanel` retém música enquanto o iframe autorizado está carregado. Fechar o vídeo ou desmontar o painel libera a retenção; retomada respeita mute, aba, estudo, economia de dados e contexto atual. Vídeo faltante/bloqueado não adquire retenção.

YouTube/Vimeo atuais não expõem aqui eventos de término confiáveis: o painel oferece “Fechar vídeo e retomar ambiente” e explica a pausa conservadora. Não simula `ended`, visualização, recibo, conclusão, recompensa ou antifraude. Critérios e implementação de progresso0081 preservados.

## 8. Sons de baús e raridades

O ponto preparado na0088 agora mapeia a raridade real do prêmio confirmado para o slot correspondente. O identificador interno `lendário` continua sendo a apresentação Extraordinário; nenhuma raridade mudou. Som segue revelação explícita, não montagem ou recarga em detalhes. Sem entrada no catálogo aprovado, o evento permanece silencioso. Estado visual, recibo, quantidade, aquisição e concessão não foram alterados.

## 9. Testes e resultados

| Gate | Evidência local | Resultado |
| --- | --- | --- |
| Unitários e regressões | `../regression-rework.log`:17 arquivos/104 testes | PASS |
| Integração real de revelação/raridade | `../chest-audio-final.log`:1arquivo/1teste cobrindo cinco raridades, montagem e recarga | PASS |
| Navegador | `../browser-initial.log` e `build/task-0089-dynamic-audio/browser-results.json`:6 cenários,0 falha/skip/retry | PASS |
| Lint/TypeScript | `../lint-final-delivery.log`, `../typecheck-delivery.log` | PASS |
| Build e isolamento | `../build-initial.log`:948 artefatos,0achado,8 hashes de protótipos preservados; gate de Avatar também PASS | PASS |
| Visual | Capturas produto/harness em Chromium1440×900, Chromium320×740 e WebKit390×844 | PASS, revisão pelo autor |
| Segurança/preservação | [parecer](../security/TASK-0089-AUDIO-SECURITY.md), `../scope-audit.json` e recibo final | Revisado, limites globais mantidos |
| PostgreSQL/editorial | Sem SQL ou narrativa bíblica alterados | N/A |

Matriz cobre produto com catálogo vazio e zero chamada nativa de play/zero request musical; harness usa o mesmo singleton com FakeMedia e bindings sintéticos somente no grafo de testes. Não produz nem toca arquivos musicais. Verifica volumes, transições, Torre/boss, vídeo, aba, dados, estudo e cinco raridades. Não comprova audição, duração real, encaixe audível do loop ou comportamento em aparelho físico.

Reworks preservados nos logs: expectativas antigas de menu e Guilda foram ajustadas à nova política de silêncio; duas tipagens do contador de teste foram corrigidas; teste herdado da Torre assumia vitória no primeiro ataque apesar da esquiva Ágil e agora aguarda resultado após comandos reais limitados. Fórmulas, RNG, NPCs e motor não mudaram. Regressão inicial101 PASS/1 FAIL; após correção104 PASS. Testes de promessa tardia e listener de economia de dados acrescentados. Nenhuma suíte extensa ou auditoria de dependências antiga foi repetida.

## 10. Arquivos alterados

- Runtime: `journey/audio/{audio-assets.ts,audio-manager.ts,audio-catalog.ts}`, `journey/hooks/use-game-audio.ts`, `journey/components/audio-settings.tsx`, `journey/screens/arena.tsx` (som somente), `story/{story-screen.tsx,video-panel.tsx}` (som somente), `chest-reveal/reveal.tsx` (mapeamento sonoro somente), sob `apps/web/features/`.
- Testes: `journey/{audio-manager.test.ts,game-audio-hook.test.tsx,dynamic-audio.test.ts,dynamic-audio-ui.test.tsx,dynamic-chest-audio.test.tsx}`, `arena-tower/integration.test.tsx`, `tests/e2e/dynamic-audio.spec.ts`, `tests/fixtures/dynamic-audio-harness/{index.html,main.tsx,style.css,vite.config.ts}`, `playwright.dynamic-audio.config.ts`.
- Documentação: este relatório, proveniência, parecer Security, [encerramento dos nove contextos](NINE-CONTEXTS-LOCAL-REVIEW.md), contrato ativo0089. Memória de controle raiz recebe somente prefixo, preservando o corpo anterior; não integra commit da branch raiz.

Não alterados: engine, economia/0078, SQL, Auth/RLS, regras/saves da Torre, baralho, contratos anteriores, aprovação/protótipos/assets/overlays, manifests/lockfile. Arquivo gerado `next-env.d.ts` restaurado antes do commit.

## 11. Pendências de áudio e licenças

BLOCKED para arquivos oficiais, identidade/autoria/direitos verificáveis, autorização de uso e redistribuição, aprovação individual, duração medida, masterização, volume percebido, loops sem cortes e audição em aparelhos reais. Nenhuma aprovação presumida ou fornecimento de arquivos autorizado por esta tarefa. Proteção do catálogo e silêncio atual são intencionais.

Permanecem os bloqueios herdados de conteúdo/vídeos0081, catálogo e aquisição legítimos0084, autoridade de combate/economia0078, ambientes isolados/Auth/RLS, migrações/cutover quando autorizados, riscos P1 já registrados e aceite físico. Não houve nova auditoria nem reclassificação de vulnerabilidades.

## 12. Checklist atualizado

| Critério obrigatório | Cobertura/evidência | Aceite local |
| --- | --- | --- |
| 1.Uma música por vez | Manager original e dynamic-audio; até duas no crossfade de 650 ms | PASS |
| 2.Transição entre ambientes | Rotas/cenas/Torre/boss e navegador | PASS |
| 3.Loop | FakeMedia e slot reward sem loop | PASS estrutural; audição pendente |
| 4.Fade-in/out | Timers originais e transições verificadas | PASS estrutural |
| 5.Preferências persistidas | Hidratação e reload no produto | PASS |
| 6.Volume | Master×música/efeitos×mix, slider teclado | PASS |
| 7.Mute separado | Unitários e produto | PASS |
| 8.Sem reinícios indevidos | Reuso/cache/mesma rota/intensidade | PASS |
| 9.Autoplay | Gesto isTrusted; produto sem mídia não chama play | PASS estrutural |
| 10.Falha/ausência | Factory/play rejeitados, catálogo vazio | PASS |
| 11.Vídeo priorizado | Retenção ao carregar iframe autorizado | PASS |
| 12.Retorno correto | Fechar/cleanup/aba/mute/contexto, promessa antiga | PASS |
| 13.Raridade real | ChestReveal cinco raridades, sem som na recarga | PASS |
| 14.Não aprovado silencioso | Catálogos vazios, produto0play/0request | PASS |
| 15.Combate preservado | Arena e três ações/regressões; engine intacta | PASS local |
| 16.Torre preservada | Storage/integration; sem concessão comum | PASS local |
| 17.Desktop/celular | Seis E2E e capturas/rolagem | PASS em emulação |
| 18.Carga limitada | Preload none, cache de 4, pool de 4, saveData/cleanup | PASS estrutural |
| 19.Sem áudio não licenciado no build | Gate948 artefatos,8 hashes e scan de fixtures | PASS |
| 20.Economia/recompensas preservadas | Escopo/diff e testes de recibo/abertura/sem grant | PASS local |

Infraestrutura e documentação locais concluídas. Mídia oficial, audição, aparelhos e dependências integrais continuam BLOCKED; não declarar DONE do jogo.

## 13. Próxima etapa recomendada

Encerrar a primeira rodada local dos nove contextos com o [consolidado](NINE-CONTEXTS-LOCAL-REVIEW.md). Em escopo posterior explicitamente autorizado, resolver catálogo/direitos e dependências de autoridade/ambiente/conteúdo; então realizar audição e aceite físico. Esta execução não inicia novas funcionalidades nem qualquer operação remota.
