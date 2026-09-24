# Estado atual

## Atualização 2026-09-24 — Arena dos Viajantes (TASK-0023, DONE)

- Nova rota `/journey/arena` e item Arena na navegação principal. O fluxo local permite selecionar o adversário, revisar snapshots, lutar por rodadas com Atacar/Defender/Focar/Habilidade, ver log/efeitos, concluir, receber resultado, voltar e repetir.
- `packages/game-engine` agora contém Battle Engine puro e determinístico por seed, `battleBalanceConfig`, poder de combate, HP, dano, Defesa, Sabedoria/iniciativa, Foco, snapshots e contratos de desafio assíncrono.
- Seis equipamentos existentes possuem efeitos mapeados. Histórico local guarda até 100 batalhas; vitória paga 8 XP e 3 moedas até três vezes por adversário/dia. Limpeza da Jornada remove também o histórico da Arena.
- Arena de treino aceita adversários do sistema e snapshots de outros Viajantes salvos no mesmo navegador. Não existe PvP real: o projeto segue sem autenticação, backend de aplicação ou banco compartilhado, e a UI informa essa limitação.
- QA: lint/typecheck/build PASS; 97 unitários PASS; suíte completa com 27 E2E PASS e 1 skip esperado; capturas desktop/mobile inspecionadas. Segurança revisada pelo próprio autor: persistência validada/limitada e nenhuma falsa autoridade remota.
- Documentação: `docs/architecture/ARENA-MVP.md`. Próxima expansão da Arena depende de backend autoritativo para desafios assíncronos reais.

## Atualização 2026-09-24 — atributos derivados reais (TASK-0022, DONE)

- A causa dos valores sempre em 1 era estrutural: `Traveler.attributes` guardava somente a base, itens só tinham `power`, equipar alterava IDs e a Hero imprimia a base. `data/attributes.ts` agora calcula base + equipamento + progressão configurada + temporário sem salvar o total.
- Atributos vigentes: Vida, Força, Defesa e Sabedoria, todos com base 1. Botas dão +1 Vida, Espada +2 Força, Elmo +1 Defesa; Couraça, Escudo e Medalhão também têm stats individuais. Configuração de nível existe e permanece vazia até balanceamento aprovado.
- Hero mostra total e origem; cards de Loja/Mochila/Equipamentos mostram bônus e comparação; equipar/desequipar informa a variação. Troca substitui o item do slot e dez ciclos não acumulam.
- Saves antigos são migrados, totais não são persistidos, reload/logout-login e dois Viajantes recalculam independentemente. Lint/typecheck/build PASS; 85 unitários e 24 E2E completos PASS; E2E final desktop/mobile PASS e capturas inspecionadas.

## Atualização 2026-09-24 — botas alinhadas por pé (TASK-0021, DONE)

- `leftBoot` e `rightBoot` usam recortes independentes do asset original, com registro na base de cada pé, offsets por corpo, escala masculina 0,84/feminina 0,82 e rotações opostas discretas. Nenhum asset foi recriado.
- Capturas masculina/feminina em prévia e Hero confirmam botas contidas nos pés, sem flutuar ou subir pela canela. Alinhamento relativo passou em desktop/mobile, zoom CSS 90/100/110%, resize e F5.
- Somente configuração das botas, testes correspondentes e documentação foram alterados; espada, elmo, layout e sistemas permaneceram intactos. Lint/typecheck/build, unitário dirigido e E2E dirigido PASS.

## Atualização 2026-09-24 — calibração frontal de equipamentos (TASK-0020, DONE)

- Sprites base 512 × 768 e caixas alpha auditados. `bodyAnchors.ts` define cabeça, pescoço, peito, mãos, pés e costas em frações do canvas, com valores próprios para masculino/feminino. Manifesto de equipamento centraliza registro, offset, escala, rotação, camada, máscara e qualidade visual por item.
- Espada registra a empunhadura na palma; botas menores foram baixadas e alinhadas individualmente a cada pé; elmo foi ajustado com rosto visível. Couraça, escudo e medalhão usam âncoras corporais. O voo termina na caixa da camada e o estado persistido troca após o fim da transição, sem deslocamento de chegada.
- Os PNGs 1254 × 1254 têm resolução suficiente nesta tela. Espada rara está READY para a pose frontal; espada comum e demais peças ainda pedem overlays dedicados para acabamento de mão, cabelo, ombro e calçado. Especificação e limites em `docs/architecture/EQUIPMENT-OVERLAY-ASSETS.md`.
- QA: lint/typecheck/build PASS, 80 testes unitários, 22 E2E completos e 4 dirigidos após o último ajuste PASS; capturas desktop/mobile, 360/390/1024 px e zoom CSS 90/100/110% inspecionadas. Reload, troca de Viajante e desequipar preservados. Security revisto pelo autor: URLs fechadas, sem mudança em save, autorização ou economia.
- A calibração cobre a pose frontal estática; arte por pose e zoom real do navegador não foram validados. TASK-0018/TASK-0014 continuam REWORK pelos próprios critérios da Fuga.

## Atualização 2026-09-24 — Herói com camadas frontais (TASK-0019, DONE)

- Sidebar verde escura é a navegação principal em todas as telas autenticadas; topo mantém HUD/perfil e mobile usa drawer. Herói foi centralizado, com Avatar maior, slots separados e seções inferiores mais espaçosas.
- `equipmentAssets.ts` centraliza ícones, camadas, tipos corporais, ordem, posições e âncoras em canvas lógico 512 × 768. `EquippedAvatar` lê inventário/equipped do Viajante e compõe os seis slots na pose frontal; elmo revela o rosto e botas usam metades do recorte sem esticar. Espada fica na mão, escudo no braço e medalhão no peito.
- A animação de ~620 ms termina na âncora do slot, com chegada própria por elmo/arma/escudo/botas, troca e remoção por fade; movimento reduzido respeitado. Não há novo campo de persistência. Reload, logout/login e troca de Viajante foram testados.
- Assets atuais: Avatar runtime 512 × 768 PNG RGBA; objetos 1254 × 1254 PNG RGBA. Resolução suficiente para o tamanho atual do Herói; `docs/architecture/EQUIPMENT-OVERLAY-ASSETS.md` especifica PNG/WebP transparentes 1024 × 1536 para arte dedicada, variantes e demais poses. Nenhum novo bitmap foi produzido nesta tarefa.
- QA final: lint/typecheck/build PASS, 79 unitários e 22 E2E desktop/mobile PASS. Capturas masculina/feminina do Herói e animação em Equipamentos inspecionadas. Security revisado pelo próprio autor: manifesto fechado de URLs, nenhum save/autorização alterado.
- TASK-0018 e TASK-0014 continuam REWORK pelo playtest completo da Fuga; overlays atuais são apenas para a pose frontal estática.

## Atualização 2026-09-24 — auditoria de sistemas visíveis (TASK-0018, REWORK)

- Auditoria inicial e posterior em `docs/architecture/VISIBLE-SYSTEMS-AUDIT.md`; links antes ocultos/incorretos corrigidos. Jornada, Herói, Loja, Mochila, Equipamentos, Coleção, Guilda e Diário acessíveis pela navegação desktop/mobile.
- Loja local com três ofertas, compra/saldo/posse persistentes e aviso de saldo insuficiente; seis equipamentos catalogados, cinco classes de raridade expostas, metadados bíblicos e animação de equipar de ~620 ms. Nenhum dos seis possui overlay corporal; UI e relatório explicitam a falta dos assets.
- HUD e Herói mostram XP, nível, meta e próximo marco; ganho de moeda/level up gera feedback. Nível 2 concede bônus real; marcos posteriores permanecem em preparação. Coleção mostra descobertos, silhuetas e segredos; conquistas não foram implementadas.
- Painel da Guilda oferece criação local de desafio, lição e missão, com tier central de recompensas, submissão, aprovação, resgate idempotente e progresso coletivo. Conteúdo é visto por outro Viajante da mesma Guilda após reload no mesmo navegador. Visão de Líder é simulação local sem autenticação nem compartilhamento remoto.
- QA: lint, typecheck, build (17 rotas), 76 testes unitários e 18 E2E desktop/mobile PASS. Capturas de Loja mobile, Guilda mobile e início da Fuga desktop inspecionadas. Security revisado pelo próprio autor: validação de campos/URL e isolamento por ID, com limite de autorização local documentado.
- TASK-0018 permanece REWORK porque o navegador integrado falhou e a Fuga não teve partida completa observada com todas as manobras solicitadas. TASK-0014 continua REWORK pelo mesmo playtest pendente.
- NEXT_ACTION: jogar a Fuga até vitória/derrota em desktop/mobile, observar corredor, curva, canto, diagonal, parede e reversão, corrigir qualquer travamento e anexar evidência. Depois, produzir overlays compatíveis e definir autoridade de servidor para Guilda em tarefas próprias.

## Atualização 2026-09-23 — RPG vivo, primeira entrega parcial (TASK-0014, REWORK)

- Retrato da Fuga agora deriva do sprite runtime do Viajante ativo, com recorte de cabeça de 26 px, collider separado, sombra, reação de coleta e proximidade. Avatar completo continua nas demais telas.
- XP de fase e Guilda usa curva central; nível 2 concede 10 moedas uma vez; tela do Herói/Home mostram progresso e próximos marcos. Nome da moeda centralizado. Saves legados recalculam nível por XP sem misturar Viajantes.
- Validação: lint/typecheck/build PASS; Vitest 73/73; Playwright 14/14 desktop/mobile. Capturas inspecionadas: desktop legível; mobile com câmera suave 1,45× e marcador maior. Navegador integrado não conectou; partida manual completa ainda pendente.
- Tarefas `TASK-0015`–`0017` registram loja/equipamentos, Guilda avançada e longevidade. Nenhum overlay de equipamento foi improvisado a partir dos ícones atuais.
- NEXT_ACTION: concluir partida completa da Fuga em desktop/mobile e avaliar game feel da câmera; depois executar as tarefas de economia/equipamentos, Guilda e longevidade.

PROJECT: RPG Jovem Cristão
CURRENT_PHASE: Fase 1.1 jogável com exploração, leitura, Devocional, perseguição, Quiz e gate da Guilda; Hero/equipamentos/mochila/diário locais
ACTIVE_TASK: TASK-0012, TASK-0013, TASK-0014 e TASK-0018 — qualidade da Fuga e sistemas visíveis (REWORK; ver tarefas ativas)
LAST_COMPLETED: TASK-0022 — tasks/completed/TASK-0022-real-attribute-system.md; atributos totais derivados de base/equipamento/progressão/temporário; lint/typecheck/build/test/E2E PASS
CURRENT_VERTICAL_SLICE: ATO I — AS ORIGENS / FASE 1.1 — O JARDIM E A ESCOLHA; Gênesis 2–3, fluxo local completo até o gate da Guilda
PRODUCT_SOURCE: docs/game-design/MVP.md; implementação temporária em docs/architecture/LOCAL-JOURNEY.md
LOCAL_RUNTIME: http://127.0.0.1:3000, servidor dev preexistente preservado; E2E isolado em 3108
SUPERSEDED: Neemias como início; classes iniciais; exclusão de Quiz; recomendação documental anterior de TASK-0008 substituída pelo pedido de implementação
BLOCKERS: revisão automática bloqueou exclusão das cópias de inspeção em %TEMP%; navegador integrado indisponível para playtest visual completo da Fuga da Serpente
KNOWN_ISSUES: storage local por origem sem conta/sincronização/autoridade de servidor; atributos 1 são protótipo; minigame ainda se beneficiará de sprites 3/4 dedicados e tiles orgânicos; riscos de privacidade/licença continuam pendentes
NEXT_ACTION: executar playtest manual da partida completa da Fuga da Serpente e produzir sprites dedicados às poses do Avatar/overlays antes de iniciar a Fase 1.2

## Atualização 2026-09-23 — Passe de imersão da Fase 1.1 (TASK-0013)

- Mapa do minigame recebeu clareiras e collider menor; Avatar renderizado 32 × 47; terreno/vegetação foram refinados, com novo sprite orgânico, cache de desenho e portal com transição de ativação. As velocidades 77%/88%/96%, grace period 2,3 s e invulnerabilidade 1,35 s vêm da TASK-0012.
- Equipamentos existentes ganharam referências temáticas verificadas, links bíblicos e Códice derivado do inventário. Medalhão do Caminho conserva ID `wisdom-amulet` com migração de nome. Equipar sincroniza o Avatar e mostra animação curta sem overlay impreciso.
- QA final: lint, typecheck e build PASS; Vitest 70/70 e Playwright desktop/mobile 14/14 PASS. Capturas do minigame e equipamentos inspecionadas. Aceite subjetivo de partida completa ainda pendente, registrado como REWORK na tarefa.

## Atualização 2026-09-23 — passe de qualidade da Fase 1.1

- Fluxo canônico agora inclui leitura obrigatória de Gênesis 2–3, confirmação do jogador, checkpoint objetivo, Contexto Bíblico e Devocional interativo antes da Missão.
- Três Fragmentos exigem desafios de cuidado, liberdade/limite e escolha/consequência; objetivos concluídos persistem e não duplicam recompensa.
- Quiz usa banco de 14 questões, 5 por tentativa, Fisher–Yates determinístico, gabarito por ID e posições corretas distribuídas.
- Fuga da Serpente recebeu collider menor nos pés, movimento por eixo, tolerância de quina, terreno orgânico, Avatar Runtime, Serpente animada, landmarks, efeitos e HUD compacto.
- Novos campos de leitura, Devocional, exploração e tentativa do Quiz têm migração não destrutiva e sobrevivem a reload/logout-login.
- Parecer editorial registrado em `docs/biblical/PHASE-1-1-CONTENT-REVIEW.md`; texto integral permanece no YouVersion externo.
- Validação: lint/typecheck/build aprovados; 67/67 testes aprovados. Playtest visual N/A nesta execução por falha ambiental do navegador integrado.

## Atualização 2026-09-23 — Fuga da Serpente flagship

- O desafio da Fase 1.1 usa agora `SnakeChaseGame`, com motor isolado para movimento, colisão e pathfinding BFS.
- Movimento arcade inclui aceleração/desaceleração, diagonal normalizada, wall sliding e tolerância simétrica nas quinas.
- Mapa fixo 24 × 14 possui três Fragmentos, seis maçãs opcionais, Escudo, Velocidade, Cura e portal ativado em 3/3.
- Serpente usa curva aproximada de 84% a 104% da velocidade do jogador, ciclo de pressão/respiro e ajuda opcional de -10% após duas derrotas.
- Três vidas, invulnerabilidade curta e checkpoints no último Fragmento evitam regressão injusta após impacto.
- Replay não avança a fase; somente “Continuar para o Quiz” chama a progressão após vitória.
- Áudio permanece em fallback silencioso, com eventos semânticos preparados; nenhum arquivo falso foi criado.
- Validação: lint/typecheck/build aprovados, suíte completa 52/52 e rota local HTTP 200. Playtest visual ficou N/A por indisponibilidade ambiental do navegador integrado.

## Atualização 2026-09-23 — Game feel do Jardim

- Intro e exploração da Fase 1.1 usam uma cena única com o background existente do Jardim.
- Hotspots centralizados: pedras, folhas e água; coleta continua persistida em `gardenExploredPoints`/`gardenFragments`.
- Avatar Runtime do Viajante se desloca visualmente até o hotspot selecionado.
- HUD, feedback de Fragmento de Sabedoria, conclusão 3/3, responsividade e `prefers-reduced-motion` adicionados.
- Contexto bíblico e etapas posteriores não foram alterados nesta tarefa.
- Validação: lint e typecheck aprovados; rota local respondeu HTTP 200.

## Correção 2026-09-23 — recuperação de múltiplos Viajantes

- Saves acima de 4 KB deixaram de ser classificados incorretamente como corrompidos.
- O limite defensivo do armazenamento local passou para 4 MiB; nenhum save é apagado pela correção.
- Teste com seis Viajantes e payload acima de 4 KB aprovado, preservando todos os perfis.

## Atualização 2026-09-23 — exploração RPG e loot do Jardim

- Exploração da Fase 1.1 agora aceita WASD, setas, clique/toque em destino e interação por E.
- Três fragmentos, dois grupos de moedas, dois baús, um segredo e dois microdesafios foram adicionados à cena.
- `Elmo do Viajante` raro usa asset existente e entra na mochila sem ser equipado automaticamente.
- Persistência ganhou `gardenOpenedChests`, `gardenCollectedLoot`, `gardenSecrets` e `gardenEvents`, com migração não destrutiva de saves antigos.
- Recompensas únicas não duplicam em replay; Amuleto do Caminho permanece recompensa da conclusão.
- Validação: lint/typecheck aprovados, 30 testes relevantes aprovados e rota local HTTP 200.

## Atualização 2026-09-23 — gate obrigatório da Guilda

- A conclusão da Fase 1.1 preserva o progresso, mas a fase seguinte depende de associação à Guilda, submissão, validação e processamento único da recompensa.
- Estados persistentes: locked, available, in-progress, submitted, awaiting-validation, revision-requested, approved, reward-available e completed.
- Hub `/journey/guild` inclui visão de jogador, simulação local de líder, ajuste/reenvio, Baú Épico da Célula e desafios especiais.
- Tiers Grande, Épica e Extraordinária usam configuração central em `guildRewards.ts`; recompensa tem proteção idempotente.
- Sem Guilda não existe fallback solo; o conteúdo concluído não é apagado.
- Documentos CORE-GAMEPLAY-LOOP, MISSION-SYSTEM, MVP e DECISIONS atualizados; DEC-020 superada pelo gate da DEC-033.
- Validação: lint/typecheck/build aprovados, suíte completa 43/43 e rota `/journey/guild` HTTP 200.
