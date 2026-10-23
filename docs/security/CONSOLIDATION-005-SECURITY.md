# CONSOLIDATION-005 — segurança e fronteiras do Modo História

Revisão pelo autor, sem independência. Escopo exclusivamente local sobre004 fechada. Nenhuma economia/combate/Auth/SQL/serviço remoto alterado, nenhuma mídia/dependência instalada. Conteúdo é candidato à revisão editorial e vídeos reais continuam ausentes.

## Autoridade preservada

Progresso oficial continua em useStoryProgress/storyRepository/progression0081, com dados emitidos pelo backend e confirmação protegida existente. O caderno não escreve story_progress, step_receipts ou campos de conclusão/recompensa. Não chama complete_story, gateway econômico, carteira, inventário ou claims. Os gates004 permanecem intactos; conteúdo candidate não habilita o botão de conclusão oficial.

Experiências de exploração/leitura/associação/quiz/reflexão geram somente eventos de caderno locais, escopados por AuthUID/Traveler/story/revision. Replay valida forma, IDs e ordem didática; campos estranhos, flags de vídeo/XP/receipt e texto de reflexão são rejeitados. Isso evita promoção acidental, não cria antifraude contra um usuário que controla seu navegador. Sequências locais podem ser adulteradas; **nunca são prova oficial**. A interface explica o limite e não desbloqueia a história seguinte por esse caderno.

Cache de caderno é independente do save legado e não substitui motor oficial de progressão. Troca de identidade/revisão não exibe o caderno anterior; registro incompatível/corrompido é preservado e produz erro. Duplicata de visita não cresce o registro; escrita com snapshot antigo de outra aba é recusada. localStorage não é banco transacional distribuído: não alegar sincronização entre aparelhos ou exclusão mútua completa. Nenhuma corrida local pode pagar prêmio, pois esse caminho não existe.

Reflexão não recebe nota ou julgamento espiritual. Rascunho opcional só vive no estado da tela e é descartado ao continuar/sair; não é salvo no caderno, enviado ao líder ou usado como justificativa de crédito. Eventos guardam apenas a pausa pessoal, demonstrativa. Dados locais não são descritos como criptografados ou protegidos de alguém com acesso ao dispositivo.

## Vídeo e áudio

Entrada de catálogo exige fonte/autoria/termos/evidência/incorporação/revisão/duração/acessibilidade. Cinco vídeos missing/pending sem URL. Não existe SDK/player de terceiro carregado no produto atual. URLs nativas só HTTPS sem credencial; embeds futuros usam allowlist de provedor/ID. Não aceitar URL fornecida pelo jogador como aprovação.

Adapter HTML5 preparado para fonte/legenda autorizadas observa play/pause/error/ended. Somente ended com duração/posição compatíveis mostra “término observado”; evento e propriedades são adulteráveis. Não escreve prova oficial nem recompensa. YouTube/Vimeo permanecem sem player até adapter/API apropriados; verificação none, autorização/editorial pendente, URL inválida ou falha de mídia não liberam nada. Não há botão “Assisti”, timeout que conceda conclusão ou substituição automática do vídeo.

AudioManager0089 é reutilizado, sem alteração no mixer: holdMusic durante reprodução; pause/end/error/close/unmount liberam retenção. Mute e volume geral aplicados à narração. Regras de confirmação não dependem da sincronização de áudio.

## Matriz dos20riscos do pedido

| # | Critério | Evidência |
| --- | --- | --- |
|1|Cinco histórias|workbook.test percorre cinco conteúdos completos até vídeo obrigatório|
|2|Ordem/desbloqueio|progression.test preservado + status oficial locked mesmo com caderno realizado|
|3|Leitura obrigatória|Reducer rejeita confirm sem open e atividade antes das leituras; UI testa disabled|
|4|Atividades|Um componente de associação para Criação/Caim/Noé/Babel; respostas inválidas não avançam|
|5|Minigames|Serpente existente reutilizada por callback; regressões de motor/mapa/controles e UI|
|6|Quiz|Embaralhamento existente reutilizado, posições corretas distintas, tentativa errada não libera|
|7|Reflexão|Sem nota espiritual; teste assegura rascunho não persistido|
|8|Vídeo obrigatório|Etapa final do caderno permanece video; story real não conclui|
|9|Só abrir|Teste do player não observa fim ao abrir/iniciar|
|10|Indisponível|Player não carrega ou apresenta falha e mantém pendência|
|11|Sem API|none bloqueia e YouTube/Vimeo sem adapter não fingem término|
|12|Reload|Caderno retoma por escopo, sem emitir receipt ou complete|
|13|Sem líder|Progresso individual0081 preservado, caderno não consulta Guilda|
|14|Identidade|Escopo AuthUID/Traveler/revisão + testes de troca de conta/hook oficial|
|15|Duplicidade|Visita repetida não duplica; stale aba negada; nenhum novo caminho de pagamento|
|16|Sem prêmio local|Eventos não possuem XP/coins/receipt/completed_at; valores do Traveler preservados|
|17|Mobile/desktop|Browser nos três projetos e capturas, resultados no relatório|
|18|AudioManager|Testes hold/release/pause/end/error/close/unmount/mute|
|19|Regressão Jardim|phase-progress/phase-video-gate/snake-engine/snake-game UI preservados|
|20|Classificação|Paráfrases candidatas/atividade FICTIONAL visíveis, sem oficialização de narrativa/vídeo inventados|

## Bloqueios e aceite

Faltam edição/link/revisão editorial final por unidade, candidato de vídeo com licença/incorporação/legendas adequadas, adapter/prova de término autorizados, backend de atestação das etapas e recibo econômico de Story, Supabase isolado e teste hospedado/CI/publicação autorizados. Nenhum gate de licença ou vídeo foi removido. Não há mudança nas migrations ou nos controles da004; PostgreSQL novo N/A neste recorte, evidências004 da fronteira econômica permanecem referenciadas sem repeti-las.

Aceite técnico local se limita à prévia educativa/caderno/adapters testados e às negações; não equivale a história oficialmente concluível, prova antifraude de vídeo ou conteúdo homologado para publicação.
