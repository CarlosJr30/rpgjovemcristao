# TASK-0084 — Meu Baralho — Arena

Implementação local preparada e testada; **aceite integral BLOCKED** pelo catálogo/aquisição de cartas e backend autoritativo ausentes. O jogo não recebe cartas de teste. Novas batalhas de treino exigem sete cartas homologadas e possuídas; na base auditada não há nenhuma, portanto o início fica bloqueado com orientação explícita. Esse bloqueio cumpre a regra de sete e não é apresentado como treino já disponível com cartas reais.

## 1. Branch e base

Worktree `build/task-0084-arena-deck/checkout`, branch `codex/arena-seven-card-deck`, base limpa `bd9ee35dc7b3a4fac9081d043330b3cf1b493415` da TASK-0083. Ancestralidade0080–0083 preservada. Não se presumiu publicação no GitHub. Commit local registrado no controle final; sem push/merge/deploy/remoto.

## 2. Auditoria e reaproveitamento

Reutiliza ArenaExperience, ArenaStage, apresentação/áudio, snapshots de atributos/equipamentos, IA/perfis, cálculo de dano, Foco, especiais, anti-farm e histórico existentes. `createArenaBattle` permanece compatível com a engine/labs legados; a entrada de produto usa `createArenaDeckBattle`, que exige sete. Futuras modalidades devem consumir esse contrato, sem novo motor. Torre/PvP não foram implementados.

O inventário atual e a coleção exibem **equipamentos em cartões visuais**, não entidades de cartas jogáveis. A auditoria não encontrou catálogo/posse funcional de cartas de combate. Nenhum equipamento virou carta. Não se copiou a branch de combate0076 nem arquivos pendentes de outros checkouts.

| Especial existente | Nível / custo base | Compatibilidade |
| --- | --- | --- |
| Golpe do Caminho | 2 / 2 Foco | Ataque forte e modificadores da arma preservados |
| Guarda Perseverante | 4 / 2 Foco | Guarda do próximo golpe preservada |
| Discernimento | 6 / 2 Foco | Próximo ataque/leitura da IA preservados |
| Passo do Peregrino | 8 / 3 Foco | Mobilidade preservada |

Foco0–3; ataque/defesa geram1; descontos/modificadores e até4 slots especiais continuam. Especiais fixos podem repetir se houver Foco e nível; o combate já tem limite30 rodadas. Efeitos de equipamentos conservam usos/cooldowns e passivos. Essa coexistência com sete cartas é explícita: básicos/especiais não consomem carta; usar uma carta consome seu ID e executa uma ação existente. Simplificação/remapeamento final dos especiais pertence ao contexto05, não foi antecipado.

## 3. Coleção e montagem

Rota `/journey/arena/deck` e entradas em Arena/Coleção. Mantém a coleção de equipamentos existente. Editor mostra posse, nome, raridade, tipo, descrição derivada do cálculo/ação real, filtro por raridade/tipo, sete posições, remover/substituir, estado no baralho e contador7/7. Salvar só aceita sete IDs diferentes, funcionais e presentes na coleção fornecida. Uma quantidade>1 no inventário não permite repetir o mesmo ID.

`APPROVED_ARENA_CARDS` está vazio intencionalmente. O adapter consulta `inventoryRepository.getInventory` da conta/Viajante atuais e cruza item_id/quantidade positiva com catálogo homologado. Metadata, desenho de equipamento e cache local não criam cartas ou efeitos. Cards com action=null são exibidos como efeito indisponível e não entram no baralho. Nenhuma raridade/probabilidade/valor de carta foi alterado; as definições sintéticas de40 cartas ficam exclusivamente em testes.

Descrições reutilizam ações e especiais reais; não adotam os números exemplificativos do pedido como balanceamento. O contrato mapeia cartas para ações já implementadas, sem criar poderes adicionais. Futuro conteúdo precisa de aprovação e de efeitos fiéis ao motor.

## 4. Uso único no motor

`freezeArenaDeck` copia as sete definições para um snapshot por batalha e registra ownerId/usedIds. `resolveArenaRound` entende card:id, rejeita carta ausente/usada/deck inválido ou encerrado e executa a mesma ação existente; só confirma consumo se o turno foi aceito. Custo/nível de um especial continuam validados. Carta nunca é removida do inventário.

`resolveArenaCommand` exige identidade e rodada esperadas. Comandos atrasados/duplicados não avançam a rodada. O serviço local usa Web Locks por conta+Viajante e relê o checkpoint dentro do lock; duas abas disputando a mesma rodada têm um vencedor e uma rejeição. A UI também bloqueia cliques durante confirmação/apresentação. Isso protege coerência no navegador cooperativo, não é antifraude de servidor.

## 5. Persistência e ciclo

Armazenamento próprio de estado da Arena, não um novo inventário: uma chave versionada por `[Auth user ID, Traveler ID]`, com seleção, identidade/seed, snapshots, definições congeladas, transcrição de ações e intenção de liquidação. Limite256KB, até30 comandos e validação estrutural. Replay usa o motor real, nunca aceita um contador de usadas informado pela UI.

Cada rodada é salva **antes da animação**. Reload durante apresentação retoma o turno já confirmado, com mesmo ID/seed/cartas usadas. Editar/salvar outro baralho ou começar outra batalha enquanto ativo é negado também no serviço. Escrita recusada/quota/ausência de Web Locks fecha a ação; corrupção ou divergência da coleção/catálogo ativo não reinicia o combate silenciosamente.

Combate encerrado não aceita ações. Seu snapshot histórico pode conter carta que deixou de ser possuída; isso não impede substituir o baralho para a próxima batalha. Um teste cobre esse caso. Toda revanche usa novo UUID/seed e sete usos disponíveis. Para a futura Torre, cada adversário deverá chamar a mesma fábrica com nova identidade; não existe Torre nesta entrega.

Liquidação: funções/valores econômicos existentes não foram alterados. Há uma intenção persistida antes de chamar o fluxo legado; reload de resultado não executa concessão novamente. Trocar conta/Viajante antes da liquidação impede crédito em outra identidade. Falha/saída nessa janela pode deixar recompensa sem confirmação, exibida como pendente; não se faz retry automático. Persistência local e recompensa legada não formam transação distribuída nem recibo econômico autoritativo. Nenhum novo grant ou carteira foi criado. Não usar esse checkpoint como prova de prêmio remoto.

## 6. Testes e evidências

Logs em `build/task-0084-arena-deck/`, fora do versionamento.

| Gate | Evidência |
| --- | --- |
| Unitários/componentes/regressões | 47PASS/8 arquivos, `unit-final.log`:40cartas, menos7, posse/duplicidade, recuperação, consumo, comando stale, concorrência, nova batalha, lock, contas/avatares, corrupção/quota, catálogo mudado, substituição após encerrar; regressões de especiais/equipamentos/Arena |
| Integração real de componente | ArenaExperience com loader sintético e apresentação mockada: vazio bloqueia; deck7 inicia, duplo clique consome uma vez, remount mantém ID/consumo |
| Browser do produto | Auth/SDK/DataAPI simulados: coleção → Meu Baralho → Arena; catálogo vazio bloqueia salvar/iniciar, mesmo com40 inventários sintéticos e metadata sugerindo carta |
| Browser positivo isolado | Harness Vite somente em tests/fixtures; componentes+motor+storage reais,40cartas sintéticas;7/7, filtros, usados/reload, duas abas, contas separadas, encerramento/revanche |
| Matriz visual | Chromium1440×900 e320×740, WebKit390×844; duas modalidades por projeto, seis cenários. Capturas inspecionadas, sem overflow nos testes; não representa dispositivo físico |
| Browser final | PASS6/0FAIL/0SKIP/retry0, `e2e-final.log`;3app vazio e3harness positivo, sem fingir40cartas no produto |
| Lint/tipos/build | PASS `lint-final.log`, `typecheck-final.log`, `build-final.log`; nova rota no build; assets/gates herdados intactos |
| PostgreSQL | N/A: sem SQL/tabela/política/migration nova; não se aplicou ou testou schema remoto |

QA/Security pelo autor, sem independência. Rework inicial: fake de matchMedia não tinha listeners, causando1FAIL/45PASS/1erro; corrigido, integração2PASS e rodada47PASS. Typecheck detectou nome copiado só na fixture de Auth; corrigido. Revisão visual removeu título duplicado. Revisão do ciclo adicionou substituição de carta após encerrar, mantendo transcrição histórica. Evidências iniciais preservadas; nenhuma suíte extensa imutável repetida.

Scan de JS de produção não encontrou IDs fixture-card- nem o título do harness. Git confirma arquivos de AuthQR/Story/EBD/SQL/contratos anteriores/pacotes intactos; next-env gerado restaurado. Recibo final fora do versionamento registra hashes de fontes/logs, refs e preservação da memória.

## 7. SQL e posse autoritativa

**Nenhum SQL novo.** O pedido permite contrato quando não há coleção persistente funcional. O adapter reaproveita inventory/Travelers/Auth e não escreve inventário. RLS/ACL e aquisição precisam ser validadas no backend autorizado antes de homologar cartas reais. O inventário legado, editável pelos seus fluxos existentes, não comprova sozinho aquisição econômica válida; esta tarefa não endurece ou redesenha as escritas/economia da TASK-0078.

Persistência de baralho e combate nesta versão é local, sem sync entre aparelhos. Backend futuro deve validar conta/Traveler, posse originada de concessão autorizada, catálogo/revisão, exactly7/únicos, versão ativa e consumo/transação de recompensa. Nenhum ID, atributo ou recibo enviado pelo browser deve virar verdade de combate no servidor sem validação.

## 8. Arquivos alterados

- Game engine: arena-deck.ts e teste; extensão pequena de arena-combat-v2.ts e BattleState/exports no index.
- Feature arena-deck: adapter, storage/replay, editor/mão, tela e testes próprios.
- Nova rota; integração estrita em screens/arena.tsx e link em screens/collection.tsx.
- Playwright próprio, fixture40 e harness isolado, sem import no catálogo de produto.
- Este relatório, parecer de segurança, contrato e memória de controle. Sem asset/dependência/lockfile/SQL/AuthQR/Story/EBD alterado.

## 9. Pendências

Catálogo de cartas aprovado, IDs e vínculo com concessões legítimas no inventário; efeitos não presentes precisam de contrato próprio. Persistência/sessões de combate autoritativas e recibos econômicos dependem de backend/escopo e TASK-0078, sem mudar seu contrato nesta tarefa. Teste de Auth real, RLS/posse e dispositivos pendente; nenhuma consulta a dados reais foi feita. Estado local não resiste a DevTools/modificação direta, exclusão do storage ou cliente malicioso; não alegar PvP seguro.

## 10. Checklist/status

Ver [contrato](../../tasks/active/TASK-0084-arena-seven-card-deck.md). Base local funcional comprovada com fixtures; produto real mantém gate sem cartas. Integral **BLOCKED**, não DONE. Sem push/deploy/merge/main/migration remota/produção ou recursos com custo. Relatórios/contratos0080–0083,0078 e arquivos de EBD/Story preservados.

## 11. Próximo passo

Consolidar catálogo/aquisição e desenho autoritativo no escopo apropriado antes de habilitar cartas reais. Contexto05 poderá simplificar os especiais sob nova instrução explícita, usando os conflitos registrados. Não iniciar05, Torre, PvP ou animações08 automaticamente. Não publicar nem modificar serviço remoto nesta tarefa.

Controle final: implementação validada no commit local `f254349130c7779413b4ae7d3e0438e766955b39`. Commit seguinte altera somente este relatório e o contrato. Memória de controle raiz atualizada com preservação do corpo anterior; recibo `build/task-0084-arena-deck/final-receipt.json` registra fontes/logs/refs e checkout limpo. Nenhuma publicação remota.
