# Pacote audiovisual V1 — TASK-0038

Preparação técnica local, Arena primeiro. Nenhuma mídia nova foi entregue, baixada ou gerada. As mudanças desta tarefa não ativam áudio nem substituem arte enquanto os arquivos físicos e suas aprovações estiverem ausentes.

## Relatório dos 17 itens

1. **AudioManager:** singleton existente preservado. Sete contextos, vinte efeitos, volumes independentes, mute e preferências separadas dos saves. Gesto confiável desbloqueia reprodução; recusa de autoplay é absorvida. Fade/crossfade de 650 ms, dois players de música e quatro de efeitos. Troca de Shell preserva reprodução e fade; saída definitiva e página oculta suspendem. Fallback MP3 local opcional, inclusive para OGG incompatível; recusa de gesto não dispara fallback.
2. **Áudios presentes:** zero faixas e zero efeitos do pacote. Catálogos gerados permanecem vazios. Testes usam doubles de mídia e fixtures sintéticas temporárias, sem registrá-las no runtime.
3. **Áudios ausentes:** os sete OGG de música e os vinte OGG de efeitos estão discriminados abaixo e no manifesto. Masters WAV e fallbacks MP3 opcionais também não foram entregues.
4. **Bindings:** UI por interação em botões/links; ganho real de recompensa/nível no Shell; abertura de baú; confirmação de equipamento; objetivo de exploração; aprovação/recompensa da Guilda. Arena: ataque, defesa, foco, esquiva, impacto após 120 ms quando há dano positivo e resultado real. Fuga: aproximação (distância visual existente <75, intervalo mínimo de quatro segundos), ataque, impacto, três pickups, portal, vitória e derrota. Não se inventam crítico/cura ou novos eventos de progressão.
5. **Arena:** slot de cenário atrás do campo/HUD; retratos associados aos quatro IDs estáveis dos treinos. Cenário ausente mantém CSS; retrato ausente/falho mantém monograma, viajante mantém Avatar equipado. ID desconhecido não recebe retrato de outro oponente. Cenário aceita variante mobile; retrato usa contain para preservar corpo inteiro. HUD/ações/motor/recompensas preservados.
6. **Jornada/Home:** contexto journey; progressos/CTA reais preservados. Portais Arena, Guilda, Equipamentos e Diário recebem slots opcionais, sem URLs ausentes. Jardim mantém arte local existente e contexto exploration.
7. **Fuga:** contexto snake e efeitos vinculados a eventos existentes. Aproximação adiciona somente emissão de áudio, sem alterar distância de ataque, velocidade, colisão, vidas ou balanceamento.
8. **Guilda:** contexto guild, slot futuro do portal; operações e bindings existentes preservados, sem backend novo.
9. **Devocional:** contexto devotional na etapa reflection; música discreta destinada à leitura, sem novos efeitos ou conteúdo bíblico.
10. **Quiz:** contexto quiz; seleção usa UI; conclusão real mantém transição/efeito de vitória existentes. Sem alteração de perguntas, pontuação ou progressão.
11. **Visuais presentes:** Avatar/equipamentos existentes, ícones SVG e arte local do Jardim permanecem, respeitando os status anteriores dos overlays. Nenhum dos oito visuais novos do pacote está presente.
12. **Visuais pendentes:** oito principais e quatro variantes de cenário, Avatar HD e quatro protótipos body-fit descritos abaixo. Nenhum overlay mudou para READY.
13. **Arquivos:** AudioManager/assets aprovados, use-game-audio, use-battle-presentation, snake-chase-game, arena, journey-spotlight, journey.module.css; novos PackArtwork/audiovisualAssets/catálogos vazios; cinco arquivos de testes (três novos e dois ampliados); scripts/audiovisual-pack.mjs; dois JSONs, este relatório, revisão Security, contrato e CURRENT_STATE. Mudanças anteriores foram preservadas contra baseline de 165 arquivos.
14. **Testes:** evidências e resultados finais serão registrados no aceite abaixo. Limite: nenhum áudio real pôde ser ouvido/decodificado e nenhuma arte futura pôde ser aprovada visualmente. E2E em Edge/Playwright, sem alegar dispositivo físico ou Safari iOS.
15. **Lint:** execução final registrada no aceite.
16. **Typecheck:** execução final registrada no aceite.
17. **Build:** execução final registrada no aceite.

## AUDIOS_PENDENTES

Runtime esperado em `apps/web/public/assets/audio/music/`. Os nomes abaixo são especificação de entrega, não URLs registradas.

| Contexto | Arquivo | Direção |
| --- | --- | --- |
| Home/Jornada | journey_ambient.ogg | Descoberta, esperança, aventura/mistério leve; cordas, flauta, percussão leve, natureza; evitar medieval genérico. |
| Jardim | garden_exploration.ogg | Natureza, beleza, tranquilidade; flauta, cordas suaves, ambiente natural, pads discretos. |
| Fuga | serpent_chase.ogg | Tensão/urgência/movimento sem terror; pulso crescente, percussão leve, cordas tensas. |
| Arena | arena_training.ogg | Coragem/treino/energia; percussão forte, cordas, metais suaves, sem guerra sombria. |
| Guilda | guild_community.ogg | Comunidade/acolhimento/união, leve e quente. |
| Devocional | devotional_reflection.ogg | Reflexão respeitosa, muito discreta; nunca competir com leitura. |
| Quiz | quiz_focus.ogg | Foco/curiosidade/concentração, ritmo leve. |

Música: master WAV fora do runtime, OGG e MP3 opcional, 44,1/48 kHz, stereo, loop limpo de 60–120 s, sem clipping/volume excessivo/dinâmica abrupta. Revisão humana de loop, níveis e escuta necessária.

Efeitos esperados em `audio/effects/`, todos `.ogg`:

`ui_select`, `arena_attack`, `arena_defense`, `arena_focus`, `arena_dodge`, `reward_receive`, `level_up`, `chest_open`, `equipment_confirm`, `objective_complete`, `guild_approval`, `serpent_near`, `serpent_attack`, `player_hit`, `pickup_light`, `pickup_fragment`, `pickup_powerup`, `portal_open`, `victory`, `defeat`.

Curtos e claros, ideal 0,1–2 s (validador exige duração positiva <=2 s), 44,1/48 kHz mono/stereo. Ataque rápido, defesa metálica/macia, foco suave, esquiva whoosh, recompensa brilho, nível memorável, equipamento elegante, baú abertura/brilho, serpente ameaça leve sem horror. Volumes equilibrados entre os arquivos.

## ASSETS_VISUAIS_PENDENTES

| Entrega | Pasta relativa a public/assets | Resolução |
| --- | --- | --- |
| arena_training_courtyard.webp | world/arena | 1920×1080; variante `_960.webp` 960×540 |
| arena_davi/elias/mara/noemi.png | characters/arena | Cada um 1024×1536, transparente, 2:3 |
| guild_community_hall.webp | world/guild | 1600×900; `_800.webp` 800×450 |
| equipment_workbench.webp | world/equipment | 1200×900; `_600.webp` 600×450 |
| diary_parchment_scene.webp | world/diary | 1200×900; `_600.webp` 600×450 |

Arena: luz quente de treino, piso legível, centro livre, personagens destacados, espaço para HUD em desktop/mobile. Oponentes: fantasia bíblica semi-realista estilizada, linguagem dos Avatares, pose de combate, identidades próprias, sem aparência moderna/excesso medieval europeu. Guilda acolhedora, encontro e propósito. Equipamentos: oficina/arsenal/preparação/aventura. Diário: pergaminho, luz e espaço livre para texto. Revisar recortes/contraste nas cinco larguras antes de aprovar arte.

Avatar HD: futura entrega 1024×1536, mantendo exatamente anatomia, enquadramento, perspectiva e identidade das referências atuais. Registrar referência/hash, comparar sobreposição full-canvas e seis slots, ambos corpos, antes de qualquer substituição. Nenhum redesenho ou upscale nesta tarefa.

Body-fit V2 permanece pendente: `armor_traveler_uncommon_female_v2.png`, `helmet_traveler_rare_female_v2.png`, `boots_traveler_common_female_v2.png`, `sword_path_common_female_v2.png`. Cada PNG 1024×1536 transparente full-canvas, referência exata obrigatória; aprovação visual humana por corpo antes de READY. O validador deste pacote não registra overlays nem altera seus status.

## Entrega, revisão e registro futuros

1. Entregar fisicamente somente mídia própria/licenciada nas pastas do manifesto `audiovisual-pack-v1.json`. Não baixar mídia aleatória. Manter WAV mestre e prova da licença na documentação de origem; WAV não entra automaticamente no catálogo.
2. Para cada arquivo e variante, registrar em `audiovisual-pack-approvals.json` uma entrada por nome relativo: `sha256` real (Get-FileHash -Algorithm SHA256), `licenseId` (`original`, `CC0-1.0` ou `CC-BY-4.0`), `licenseSource`, `author`, `reviewedBy`, `reviewedAt` ISO e `presentationApproved: true`. Áudio exige também `noClippingApproved`, `levelApproved`; música exige `loopApproved`. Recibos só após inspeção/audição humana, nunca preencher automaticamente com valores fictícios.
3. Executar `node scripts/audiovisual-pack.mjs`: audit sem alterar catálogos; relatório em `build/task-0038-evidence/asset-audit.json`. Arquivos ausentes são MISSING, inválidos REJECTED. Exige hash, origem/licença/revisão, arquivos locais <=10 MiB, dimensões/transparência reais, assinatura/stream/duração de áudio. Decodificação de áudio usa **ffprobe local**, não instalado nesta sessão; áudio entregue sem decoder disponível é rejeitado. Nenhuma instalação implícita.
4. Só com audit aprovado, executar `node scripts/audiovisual-pack.mjs --write` para registrar exclusivamente arquivos existentes aprovados nos dois catálogos tipados. MP3/variante mobile ausentes são omitidos; qualquer rejeição impede a escrita. Fallback MP3 é validado pelo mesmo gate. A aprovação é um recibo humano verificável pelo hash, não prova automática de direitos ou qualidade artística.
5. Executar unit/lint/typecheck/build e E2E; audicionar em navegador após gesto, testar fades/mute/volumes/mobile/reload/falhas. Rever campos de licença/atribuição conforme os termos da entrega antes de publicação. Revisão manual de paleta, pose e semântica não é substituída pelo validador. Não publicar nesta tarefa.

## Aceite

DONE para preparação técnica. Relatório de mídia atual: 35 principais MISSING, zero registrados, zero rejeitados. Variantes/masters/MP3 permanecem pendentes; não entram no relatório de principais enquanto seus primários estiverem ausentes.

- Unit completo: `npm test -- --maxWorkers=2`, **49 arquivos/292 testes PASS**. Conferência final dos cinco testes alterados: **18/18 PASS** após ajustes de lint/typecheck.
- `npm run lint`: **PASS**, zero warnings. `npm run typecheck`: **PASS**, todos os workspaces e raiz. `npm run build`: **PASS**, 20 rotas estáticas.
- `npm run test:e2e -- tests/e2e/immersion-sprint.spec.ts tests/e2e/arena.spec.ts tests/e2e/snake-responsive.spec.ts --reporter=list`: **17 PASS/1 skip** preexistente (teste exclusivo mobile pulado no projeto desktop). Sem novos skips/retries/falhas. Matriz 390×844, 412×915, 768×1024, 1440×900, 1920×1080; áudio/reload, Arena, reduced motion, Fuga/input e saídas.
- Evidências: 111 PNGs e audit em `build/task-0038-evidence`. Inspeção visual pelo autor: batalha mobile, Arena desktop e Home mobile; sem clipping/overlap ou erro de fallback observado. Não é aprovação das artes futuras.
- QA e Security **PASS pelo próprio autor**, sem revisão independente. Critérios de aceitação atendidos para a preparação autorizada; conteúdo bíblico N/A, sem mudanças narrativas.
- Preservação: baseline de 165 arquivos preexistentes; 154 intactos, 11 edições autorizadas (incluindo memória), zero divergência inesperada. `next-env.d.ts` restaurado byte a byte. Sem alteração em outros estados de tarefas.
