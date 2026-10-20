# TASK-0088 — Contrato de apresentação de recibos de Baús

Contrato frontend local, sem SQL/API econômica nova ou mudança na TASK-0078. A apresentação não é uma fonte de aquisição.

## Entrada de produto

O fluxo online já existente usa open_chest(Traveler,tier,UUID). SQL0002 verifica ownership, bloqueia a pilha, sorteia no banco e registra concessão/resultado em chest_operations na mesma transação. Esta tarefa não altera essa implementação, seus valores, grants ou probabilidades. Sua publicação/hardening e validação hospedada continuam condicionadas aos gates econômicos do projeto.

O novo fluxo grava somente intent visual (UUID e tipo) antes de chamar a RPC existente. Depois lê a linha open pelo Traveler e operation_key=open:UUID no repository autenticado existente; não anima a resposta isolada da RPC como se fosse recibo. Adapter valida identidade/shape/tipo/operação/catálogo e produz RevealReceipt somente em memória. Validação de shape não é assinatura, autenticação ou prova de dados locais; autorização permanece no servidor/RLS existente.

Recibo legado contém coins e itemId, sem array ordenado, XP ou cartas. Adapter mantém ordem de apresentação definida coins→equipamento, já usada pela UI anterior, e ignora itemName para usar nome/catálogo canônicos. Não calcula quantidades/duplicidade com inventário anterior obsoleto. Campos extras, cartão/XP/item não homologado ou registro incompatível bloqueiam a apresentação como pendência, sem alterar dados. A moeda usa o tema do tier do baú, sem ganhar raridade econômica própria; equipamento usa sua raridade de catálogo.

O contrato genérico de apresentação aceita uma lista ordenada de prêmios, consumida sem reordenação. Carta existe nesse contrato apenas para demonstração isolada; o adapter de produto não pode gerá-la. APPROVED_ARENA_CARDS permanece vazio. Uma futura versão de recibo com múltiplas cartas/equipamentos ou XP precisará de adapter homologado que preserve a ordem explícita do servidor, posse, catálogo e quantidade. Não inferir novos prêmios deste contrato visual.

## Estados e temporização

ready → opening650ms → rising1000ms → holding2000ms → flipping550ms → details. Somente ação manual avança ao próximo prêmio (rising ou details em modo estático) e ao summary. A revisão do estado nega eventos/ticks duplicados do mesmo frame. A pausa acontece com o prêmio centralizado antes da virada; details não tem prazo de expiração. Pular revela somente o prêmio atual; acelerar/toque usa velocidade3× sem saltar sua explicação. Reduced-motion ou escolha estática dispensam tempos e movimentos. Não há reset econômico, novo UUID de abertura ou sorteio nessas transições.

Baú/artes existentes, tampa por recorte da mesma imagem raster e animação CSS de transform/opacity; oito partículas fixas por revelação. Carta usa perspectiva, giro vertical, verso e virada; equipamento usa giro suave e ficha. Não se produz arte inédita de carta como prêmio. Temas: comum/prata, incomum/verde, raro/azul, épico/roxo e lendário/dourado com alias de catálogo Extraordinário. Não há raridade mítica.

Reutiliza EquipmentArenaDetails, EquipmentStatBonuses, EquipmentComparison, EquipmentBibleDetails e describeArenaAction da0086. Comparação exige item já sincronizado no inventário; ausência é explicitamente pendente, sem inventar posse para simular. Nenhum equip automático. Referências bíblicas vêm integralmente do componente anterior, sem narrativa nova. Identificação de novo/repetido não é fornecida pelo recibo atual.

## Persistência e recuperação

Chave local versionada por tupla conta+Traveler. Guarda apenas intent e cursor (receiptId,operationKey,index,seen,summary), até2KB. Não guarda lista de prêmios, valores, inventário, saldo ou tokens. Cursor registra quantidade de índices consecutivos apresentados; índice atual e resumo são restaurados apenas depois de reler o registro de servidor. Alterar/remover cursor só afeta apresentação, nunca posse. Cursor é local, não sincronizado entre aparelhos.

Web Locks serializa intents por conta/Traveler; ref protege clique rápido na mesma tela. Intent pendente impede iniciar outra identidade. Recarregar apenas consulta o registro exato, inclusive fora da janela de20linhas do histórico. Reenviar é ação explícita: primeiro consulta o ledger e, se ausente, reutiliza a mesma operação idempotente da RPC; não cria ID novo. Falhas antes/depois do commit econômico ficam pendentes, sem alegar concessão pelo retorno visual. Fechar/rever/retomar/resumo não chamam abertura.

Persistência visual não é transação distribuída com backend. Quota/corrupção são mensagens explícitas, sem apagar dados; indisponibilidade impede nova intent. Fechar após um prêmio salva o cursor antes de sua próxima apresentação. Histórico remoto continua legível mesmo sem storage visual: relê o registro autenticado e usa cursor somente em memória, avisando que não pode salvar. Falhas de sincronização do inventário não devem emitir outra abertura. Estado local de outras modalidades/contratos não é reescrito. Local legado de loot fica preservado em código/testes; o novo botão de abertura recusa modo offline em vez de chamar RNG/grant local.

## Áudio e acessibilidade

Hooks por raridade usam apenas catálogo de produção aprovado e AudioManager existente, incluindo gesto permitido/volume/mute. Catálogo aprovado de sons está vazio: entrega silenciosa, sem fingir assinatura por raridade, downloads ou protótipos da Arena. Assets/licenças próprios podem ser homologados depois. Não há áudio antes de interação do jogador, nem playback ao retomar detalhes.

Modal em portal acima do HUD, scroll próprio, bloqueio/restauração do scroll da página, foco contido, Escape/fechar e retorno de foco. Botões48px, rótulos além de cor, anúncio aria-live, detalhes permanentes e acesso estático. Timers cancelados ao sair; próximo prêmio retorna ao topo. Nenhum flash intenso/repetitivo ou animação de layout pesada. Browser emulado não comprova FPS/aparelho físico.

## Limites de aceite

Ensaios locais com SDK/DataAPI sintéticos e componentes reais não comprovam RPC/SQL/grants/Auth/RLS hospedados, crédito ou aquisição real. Não corrigir/alterar economia0078 ou backend fora do contrato. Oficial/cartas/hardening/ambiente/aparelhos e áudio licenciado continuam dependências separadas. Testes/resultado final no relatório TASK-0088-CHEST-CINEMATIC-REVEAL.md.
