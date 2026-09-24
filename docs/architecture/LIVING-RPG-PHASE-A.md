# RPG vivo — Fase A em execução

O pedido de RPG vivo foi dividido em `TASK-0014` (Fase A), `TASK-0015` (economia/equipamentos), `TASK-0016` (Guilda) e `TASK-0017` (longevidade). A Fase A reutiliza o save local e os ganhos de XP/moedas existentes. Nenhuma conta, loja ou autoridade de servidor foi introduzida.

## Progressão

`data/progression.ts` centraliza o nome da moeda, a curva cumulativa de XP (`100 × nível × (nível − 1)`), o teto provisório de nível 50 e os próximos marcos. As recompensas de fase e Guilda existentes passam por `addExperience`; cruzar o nível 2 concede 10 moedas uma única vez. Os demais marcos aparecem como **em preparação**, sem prometer funcionalidades inexistentes. XP representa apenas gameplay; a leitura bíblica, o devocional e a oração não o concedem.

`journey-storage.ts` recalcula o nível ao carregar saves anteriores, preservando XP, moedas e progresso de cada Viajante. O envelope local continua na versão 2; a migração é aditiva, sem apagar dados. O armazenamento local pode ser alterado pelo cliente e não serve como autoridade de economia ou Guilda em produção.

## Retrato da Fuga da Serpente

`getGameplayAvatarPortrait` usa o sprite runtime do Viajante ativo, determinado por tipo corporal, cabelo, roupa e tom de pele, e resolve uma região comum da cabeça. Os 54 sprites runtime auditados têm 512 × 768 pixels. O minigame desenha o recorte em marcador circular de 26 pixels; o Avatar completo continua nas outras telas. O recorte não altera os PNG originais. O collider segue em `PLAYER_COLLIDER_X = 6` e `PLAYER_COLLIDER_Y = 4`, independente dos 26 pixels visuais. Movimento por eixo, diagonal normalizada, wall sliding e perdão de quina permanecem na engine.

O marcador tem sombra, inclinação e respiração discretas, feedback de coleta e borda reativa à Serpente. Eventos de áudio continuam sem arquivos, inclusive o novo evento de power-up. A captura E2E desktop mostrou a cabeça reconhecível e separada das paredes. Em mobile, uma câmera suave de 1,45× segue o personagem dentro dos limites do mapa; a captura revisada mostrou o marcador maior, ainda sujeito a avaliação em partida completa antes do aceite de game feel.

## Pendências de assets e infraestrutura

Os arquivos atuais de equipamento são ícones de inventário, não overlays compatíveis com o corpo. A animação existente confirma equipar, mas não encaixa visualmente elmo/armadura/arma no Avatar; isso exige sprites de overlay por variante e fica em `TASK-0015`. O Mercador Itinerante, Loja da Guilda, Oficina, sets, novas lições, desafios coletivos e eventos ficam nas tarefas seguintes. A simulação local de líder não comprova autenticação ou autorização de um líder real.
