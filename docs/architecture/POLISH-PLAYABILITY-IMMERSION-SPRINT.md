# TASK-0037 — Polish, playability & immersion

Pedido autorizado em 2026-10-04; execução e revisão local em 2026-10-05. Trabalho reversível, sem commit/push/deploy, instalação, conta real ou alteração remota. QA e Security realizados pelo autor, sem revisão independente. Resultados finais dos gates são registrados no contrato da tarefa.

## 1. Causa do problema mobile

O layout landscape anterior terminava em 900 px: 915×412 caía no arranjo portrait, com os controles fora do viewport. A auditoria reproduziu bottom 665,86 px para uma área visível de 446 px. Os handlers não capturavam o pointer e compartilhavam estados de entrada, permitindo que a soltura de um dedo anulasse outro. Fullscreen era solicitado ao documentElement. O bloqueio de toque no body ampliava a interferência fora do mapa.

## 2. Solução da Fuga

Landscape cobre até 1024 px. HUD, mapa, direcional e ações ocupam áreas próprias; safe areas são aplicadas nos quatro lados, com viewport-fit=cover. Targets do direcional/ações têm pelo menos 48 px, sem blur. Teclado e cada pointer possuem fontes independentes; pointer capture mantém hold, slide troca direção e release/cancel/lost capture removem somente o dedo correspondente. Blur/visibilidade limpam entrada e velocidade. O bloqueio de gesto fica na superfície de jogo e controles; tutorial pode rolar.

Fullscreen pertence ao contêiner da Fuga; há tratamento de indisponibilidade, arranjo landscape próprio e saída apenas do fullscreen pertencente ao jogo. Navegação é restaurada ao sair. A matriz usa hit testing dos centros, CDP touch real do navegador, hold, slide, dois dedos, liberação individual, cancelamento, fullscreen e saída em 390×844, 844×390, 412×915 e 915×412. Não equivale a teste em aparelho físico ou Safari iOS; safe-area-inset do emulador normalmente é zero.

## 3. Mudanças da Arena

O cenário existente ganhou iluminação radial quente/verde e scrim mais leve. Avatares permanecem sem filtro de brilho global; HUD usa fundo verde escuro opaco e texto claro. Atacante avança, alvo reage e recebe o número flutuante; câmera e slash são discretos. Avanço desktop 18 px/mobile 7 px; câmera decorativa desligada no mobile. Reduced motion remove o movimento e preserva a informação.

Adversários de treino sem sprite próprio conservam o monograma existente. Retratos dedicados estão na lista de arte pendente; cópias locais de Viajantes usam seu Avatar real.

## 4. Golpes e feedback reais

A apresentação adapta somente o log produzido pelo motor. Cada evento informa participante, alvo, ação e valor: dano surge no defensor e sua vida cai durante esse evento. Defesa, foco e esquiva têm feedback próprio. Golpe do Caminho, Guarda Perseverante e Discernimento conservam nomes e efeitos atuais; Passo do Peregrino mantém seu disparo automático e log. Eventos são ordenados em 550/650 ms (450 ms com reduced motion), ações ficam travadas e resultado/recompensa só se apresentam ao finalizar a sequência. Clique duplo não processa outra rodada. Timers são limpos ao sair.

O motor atual não fornece crítico ou cura; esses resultados não foram inventados. Log, RNG, dano, recompensas e habilidade permanecem autoritativos e preservados.

## 5. Regra da Guilda jogador

Disponíveis contém apenas conteúdo publicado/ativo, vigente e realizável, com tentativa nova, em andamento ou ajuste solicitado. Missões futuras, expiradas, encerradas, arquivadas e estados desconhecidos ficam fora dessa lista. Concluídas ficam em Histórico; envios e recompensas aguardando aprovação ficam na área própria. Histórico/aprovações continuam acessíveis depois do vencimento. Data local sem horário inclui o dia inteiro; timestamp remoto/especial vence exatamente no instante definido. Datas inválidas falham fechadas.

O relógio reavalia no próximo limite de agenda, em até 60 s e ao recuperar foco/visibilidade. Abrange missões online, conteúdo local e desafios especiais legados. Lista principal vazia recebe orientação acolhedora. Painel do líder conserva sua gestão. Filtragem visual não substitui RLS ou autorização remota; não foram alteradas.

## 6. Duração final dos equipamentos

| Raridade | Prepare | Focus | Reveal | Voo | Confirmação | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Comum | 40 | 280 | 810 | 320 | 150 | 1600 ms |
| Incomum | 40 | 320 | 930 | 360 | 150 | 1800 ms |
| Raro | 40 | 360 | 1050 | 400 | 150 | 2000 ms |
| Épico | 40 | 400 | 1190 | 420 | 150 | 2200 ms |
| Lendário/Extraordinário | 40 | 440 | 1330 | 440 | 150 | 2400 ms |

Arquitetura TASK-0036 preservada: PREPARE → FOCUS → REWARD_REVEAL → FLY_TO_TARGET → EQUIP_CONFIRM → DONE. Nome/raridade/item precedem os bônus; stats surgem nos últimos 350 ms do reveal. Toque/Escape continuam concluindo uma vez. Reduced motion continua em 560 ms. Ícone voa; corpo permanece imóvel; nenhuma arte corporal pendente foi aprovada.

## 7. Layout e identidade de aventura

Home com Viajante e Jornada apresentam Ato I, fase existente, referência bíblica, objetivo atual, progresso real e CTA para Jardim/Guilda conforme o gate. Portais de Arena, Guilda, Equipamentos e Diário dão identidade às áreas. Navegação usa dez SVGs nativos leves. Tons de pergaminho, verde natural, ouro e luz do Jardim substituem superfícies neutras nas áreas atingidas.

Cartas e equipamentos têm distinção de raridade; Mochila usa iconAsset real com lazy loading. Cabeçalho mobile usa duas linhas para manter marca, áudio 48 px, perfil e troca de Viajante dentro do viewport. Texto e conteúdo bíblico existente permanecem preservados.

## 8. Animações e microinterações

Chegada de área em fade de 220 ms, hover/press curto em botões/cards, feedback de objetivos, Quiz e recompensa, aviso de XP/moedas e destaque de subida de nível. Interação por teclado possui foco visível; reduced motion desliga decoração. A transição de área usa somente opacidade para preservar o posicionamento fixed do minigame.

## 9. Arquitetura de áudio

AudioManager central, criado de forma lazy, com catálogo tipado separado para músicas e efeitos. Música/Efeitos on/off, volumes independentes, mute e preferências validadas em chave própria de localStorage, sem mudar save. Liberação por gesto confiável; reprodução rejeitada não bloqueia o jogo. Fades/crossfade 650 ms, até dois players de música e quatro efeitos reutilizáveis. Pausa e limpeza de fades ao ocultar a aba/sair da Shell; listeners removidos e retomada ao voltar.

Contextos: jornada, exploração, Fuga, Arena, Guilda, devocional e Quiz. Hooks semânticos para UI, golpes, defesa, foco, esquiva, objetivos, recompensa, nível, Baú, equipamento e aprovação. Modal com foco contido/restaurado, Escape e sliders acessíveis. Catálogo aceita exclusivamente assets locais registrados e com licença documentada.

## 10. Músicas disponíveis

Nenhuma. Busca por mp3/ogg/wav/m4a/aac/flac não encontrou arquivos de áudio no projeto. MUSIC_ASSETS e SOUND_ASSETS estão vazios; nenhuma URL fictícia foi registrada e nenhuma requisição de áudio ocorre. A mensagem do modal explica que trilhas/sons estão em preparação. Testes de fades utilizam mídias falsas controladas, sem alegar validação auditiva de arquivos reais.

## 11. AUDIOS_PENDENTES

Nomes abaixo são sugestões para produção futura, **não caminhos registrados no runtime**. Registrar somente após arquivo existir, licença/atribuição estarem documentadas e audição/aprovação humana. Música: master WAV 44,1/48 kHz, entrega Ogg/MP3 estéreo em loop limpo, 60–120 s, volume consistente, sem picos abruptos. Efeitos: master WAV, entrega Ogg/MP3, 0,1–2 s, mono quando adequado, sem loop.

| Arquivo proposto | Contexto/finalidade | Direção |
| --- | --- | --- |
| journey_ambient.ogg | Home/Jornada | Descoberta acolhedora, cordas/flauta discretas |
| garden_exploration.ogg | Jardim | Natureza, exploração calma |
| serpent_chase.ogg | Fuga | Pulso/tensão leve, sem susto agressivo |
| arena_training.ogg | Arena | Energia respeitosa de treino |
| guild_community.ogg | Guilda | Comunidade e acolhimento |
| devotional_reflection.ogg | Devocional | Atmosfera contemplativa sem distrair leitura |
| quiz_focus.ogg | Quiz | Concentração suave |

| Arquivo(s) proposto(s) | Eventos semânticos reais |
| --- | --- |
| ui_select.ogg | Botões e navegação |
| arena_attack.ogg, arena_defense.ogg, arena_focus.ogg, arena_dodge.ogg | Ataque, defesa, foco, esquiva |
| reward_receive.ogg, level_up.ogg | Recompensa e nível |
| chest_open.ogg, equipment_confirm.ogg | Baú e confirmação de equipamento |
| objective_complete.ogg, guild_approval.ogg | Objetivo e aprovação |
| serpent_near.ogg, serpent_attack.ogg, player_hit.ogg | Proximidade, ataque da Serpente e impacto |
| pickup_light.ogg, pickup_fragment.ogg, pickup_powerup.ogg | Coletas já existentes |
| portal_open.ogg, victory.ogg, defeat.ogg | Portal e resultado |

## 12. ASSETS_VISUAIS_PENDENTES

As artes atuais do Jardim são reais e reutilizadas. Não houve geração, download ou integração de nova arte. Assets abaixo são recomendações futuras; toda nova arte exige produção e aceite próprios, estilo fantasia bíblica natural, sem aparência de dashboard ou UI pintada.

| Nome proposto | Finalidade/tela | Aspecto | Resolução recomendada |
| --- | --- | --- | --- |
| arena_training_courtyard.webp | Cenário específico da Arena; área central livre e piso legível | 16:9 | 1920×1080; variante 960×540 |
| arena_davi.png, arena_elias.png, arena_mara.png, arena_noemi.png | Retratos dos quatro adversários de treino existentes; substituir monogramas após aprovação | 2:3, transparente | 1024×1536, mesma perspectiva dos Avatares |
| guild_community_hall.webp | Banner e portal da Guilda; acolhimento/comunidade | 16:9 | 1600×900; variante 800×450 |
| equipment_workbench.webp | Portal de Equipamentos, sem substituir ícones | 4:3 | 1200×900; variante 600×450 |
| diary_parchment_scene.webp | Vinheta do Diário com espaço para texto | 4:3 | 1200×900; variante 600×450 |
| Avatar Runtime HD (mesmas variantes atuais) | Maior detalhe em DPR 2/3; conservar anatomia/perspectiva | 2:3 | 1024×1536 |
| armor_traveler_uncommon_female_v2.png | Protótipo corporal Couraça feminina | 2:3, transparente full-canvas | 1024×1536 |
| helmet_traveler_rare_female_v2.png | Protótipo corporal elmo feminino | 2:3, transparente full-canvas | 1024×1536 |
| boots_traveler_common_female_v2.png | Protótipo corporal botas femininas | 2:3, transparente full-canvas | 1024×1536 |
| sword_path_common_female_v2.png | Protótipo corporal espada feminina | 2:3, transparente full-canvas | 1024×1536 |

Os quatro protótipos e o restante do pacote V2 seguem [EQUIPMENT-BODY-FIT-OVERLAYS-V2.md](EQUIPMENT-BODY-FIT-OVERLAYS-V2.md). Oito IDs reais continuam NEEDS_NEW_OVERLAY. V1 rejeitada não foi reintroduzida. Ícones UI não viram overlays corporais.

## 13. Desktop

Matriz 768×1024, 1440×900 e 1920×1080 cobre Home/Jornada/Arena/Guilda/Equipamentos/Mochila/Diário, navegação, modal de áudio, dois corpos e cinco raridades. Capturas e medições ficam em test-results, copiadas para build/task-0037-evidence ao fechar. A inspeção humana pelo autor complementa asserts; não é revisão independente.

## 14. Mobile, acessibilidade e performance

Matriz 390×844/412×915 e quatro orientações da Fuga, com touch/CDP, sem overflow, ações acessíveis, reduced motion, teclado e recuperação de navegação. Teste adicional existente em 360 px. WebP derivados do Jardim: dia 1600 ≈427 KiB/800 ≈145 KiB; tensão 1600 ≈284 KiB/800 ≈97 KiB. Fontes PNG intactas; withoutEnlargement evita inventar resolução. CSS seleciona 800 px no mobile. Sem vídeos, dependências, filtros globais pesados ou loops decorativos de partículas. Não foi medido FPS em aparelho físico; não se afirma performance auditada em iOS real.

Links de leitura do Diário escurecidos após inspeção. Rodada final da matriz passou 2/2, verificando contraste mínimo 4,5:1 contra os dois extremos reais do gradiente nas cinco larguras. Captura atualizada inspecionada.

## 15. Arquivos alterados nesta tarefa

O git status contém trabalho anterior de várias tarefas; **não é a lista desta entrega**. Baseline de 130 arquivos preexistentes em build/task-0037-baseline/hashes.json permite conferir preservação. Arquivos da TASK-0037:

- app/globals.css e app/layout.tsx: tokens/foco/touch/viewport.
- journey/journey.module.css: responsividade Fuga/cabeçalho, Arena e design compartilhado.
- components/snake-chase-game.tsx e novo snake-input.ts.
- components/guild-content-board.tsx, online-guild-hub.tsx; screens/guild-hub.tsx; novos data/guildPlayerVisibility.ts e hooks/use-guild-clock.ts.
- screens/arena.tsx; novos data/battlePresentation.ts e hooks/use-battle-presentation.ts.
- data/equipmentCinematic.ts, components/equipment-equip-cinematic.tsx e equipment-cinematic.module.css; screens/equipment.tsx.
- components/shell.tsx; screens/home.tsx, map.tsx, backpack.tsx e shop.tsx; novos journey-icon.tsx e journey-spotlight.tsx.
- components/chest-panel.tsx, garden-exploration.tsx e screens/phase.tsx: conexões semânticas de efeitos/objetivos existentes.
- Novos audio/audio-assets.ts, audio/audio-manager.ts, hooks/use-game-audio.ts e components/audio-settings.tsx.
- Quatro WebPs em public/assets/world/garden.
- Unit: novos snake-input, guild-player-visibility, guild-clock, battle-presentation, battle-presentation-hook e audio-manager; ajustes online-guild-hub e equipment-cinematic pertinentes.
- E2E: novo immersion-sprint.spec.ts; ajustes snake-responsive.spec.ts/home.spec.ts/arena.spec.ts/attributes.spec.ts/audit-corrections.spec.ts, inclusive preparação explícita do modo local em testes legados e texto atual do tutorial.
- Este relatório, revisão Security, contrato TASK-0037 e CURRENT_STATE. next-env.d.ts restaurado aos bytes anteriores após gerar build/types.

Todos os paths de runtime acima são relativos a apps/web/features/journey, salvo app e public. Motores, saves, Auth, RLS, migrations, dependências e originais PNG permanecem fora das alterações desta tarefa.

Lista exata: [manifesto de 53 arquivos e preservação](../../build/task-0037-evidence/preservation.json). Dos 130 arquivos preexistentes, 112 mantêm o hash e 18 possuem apenas as edições autorizadas desta tarefa; nenhuma divergência inesperada. next-env.d.ts restaurado. O manifesto distingue esta entrega do restante do working tree.

## 16. Testes

Unit final: `npm test -- --maxWorkers=2`, 46 arquivos/282 testes PASS. A limitação de workers evita timeout de importação do teste de migration durante concorrência; o teste existente foi preservado.

E2E completo: `npm run test:e2e` executou 92 casos: 72 PASS, quatro FAIL e 16 skips. Os quatro failures eram a sincronização do loop legado de Arena com o fim da apresentação e a expectativa de mensagem transitória da Fuga. Corrigidos os testes, `npm run test:e2e -- --last-failed` passou 4/4. Portanto, **76 casos aplicáveis validados**, sem falha pendente; não se declara que a primeira rodada passou integralmente. Rodada dirigida final de matriz/Fuga: 14/14 PASS, com capturas arquivadas.

Os 16 skips são explícitos: quatro prévias de arte V1 rejeitada (dois corpos × dois projetos); oito duplicações mobile da matriz de cinematic já coberta em desktop; uma auditoria Avatar HD duplicada, uma auditoria V1/DPR duplicada, um playthrough exclusivo mobile e um teste de legibilidade da Arena exclusivo mobile. Nenhum caso novo da TASK-0037 foi pulado. E2E utiliza Edge/Chromium local, não contas reais.

## 17. Lint

`npm run lint`: PASS, sem warnings do ESLint.

## 18. Typecheck

`npm run typecheck`: PASS em web/database/game-engine/shared/ui e raiz.

## 19. Build

`npm run build`: PASS, 20 páginas estáticas geradas, incluindo a limpeza de áudio ao sair da Shell. Sem publicação.
