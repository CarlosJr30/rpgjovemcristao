# TASK-0087 — Torre dos 7 Desafios

Modo local demonstrativo implementado com a Arena existente. **Progresso oficial e recompensas continuam BLOCKED**, dependentes de catálogo/aquisição e servidor autoritativo. O produto mantém o catálogo vazio e não permite iniciar sem sete cartas homologadas/possuídas. Nenhum teste positivo significa aquisição real, vitória oficial ou prêmio concedido.

## 1. Branch e commit local

Branch `codex/arena-seven-challenge-tower`, worktree `build/task-0087-arena-tower/checkout`, base limpa `fc424ff58c704cb7794974c3055e708f6895fa3b`, apenas controle documental após runtime0086 validado `34dde31b25a6ff9ef373e88c8eff1b6132ca3820`. Commit da entrega no controle final. Anexo07 reenviado tem mesmo SHA256 do primeiro; tarefa continuada sem contrato/implementação duplicados. Sem presumir publicação GitHub, sem push/deploy/merge/main ou operações remotas.

## 2. Adversários e critérios de dificuldade

Configuração central em arena-tower/config.ts, definição `permanent-v1`. Todos são personagens ficcionais originais do jogo, sem referência canônica ou identidade/arte/áudio de terceiros. Valores pertencem somente à Torre, sem modificar Arena comum, fórmulas ou IA.

| Andar / adversário | Nível | Vida/Força/Defesa/Sabedoria | HP / Poder | Perfil e equipamentos (poder) |
| --- | --- | --- | --- | --- |
|1Recruta da Arena |1|2/1/1/1|32/77|Ágil, sem equipamentos |
|2Aprendiz de Guerreiro |2|3/2/1/2|38/143|Ofensivo, espada1 |
|3Combatente Experiente |6|4/3/2/3|44/268|Tático, amuleto1 |
|4Defensor da Arena |6|5/4/3/4|50/331|Guardiã, escudo2/armadura1 |
|5Guerreiro Veterano |8|6/5/4/5|56/428|Ofensivo, espada2/botas1/elmo1 |
|6Guardião Lendário |9|7/10/5/6|62/559|Guardiã, escudo3/armadura2/elmo2 |
|7Campeão da Torre |10|8/11/6/7|68/678|Tático, espada3/escudo3/armadura2/botas1/amuleto2/elmo2 |

Reutiliza efeitos existentes em snapshots de NPC, sem criar itens adquiríveis ou catálogo de cartas. Atributos de NPC já são totais; equipamentos adicionam seu poder/efeitos como no snapshot do motor, sem somar stats de inventário outra vez. Chefe supera o sexto em todos os atributos, HP, poder e parcela ofensiva.

Critérios: HP/poder/parcela ofensiva crescem estritamente; perfis introduzem pressão básica/esquiva, Golpe, Discernimento, alternância de defesa/Guarda, proteção da armadura, iniciativa e mobilidade. A IA reage ao estado comprometido de HP/Foco/guarda/rodada, incluindo consequência de golpes anteriores; não lê escolha futura do jogador. Perfil tático final combina preparação/defesa/ataque com os equipamentos existentes; não recebe regra exclusiva.

Calibração reproduzível:20sementes por andar, build sintética nível8 com Vida10/Força5/Defesa4/Sabedoria5, espada1/armadura1 e política Golpe quando disponível, senão Atacar, pelo contrato legado do motor apenas no benchmark. Não é carta concedida nem caminho de produto. Resultados em balance-final.log:

| Andar | Vitórias/20 | Rodadas médias | Dano recebido médio |
| --- | --- | --- | --- |
|1|20|3,35|2,3|
|2|20|3|6|
|3|20|4|5|
|4|20|8|16|
|5|11|7|76,7|
|6|0|10|80|
|7|0|5|80|

O ensaio inicial revelou o sexto mais fácil que o quinto: sua defesa reduzia a frequência ofensiva. Força6→9 ainda deixava a build vencer com4HP; Força10 torna a resposta compatível com a pressão pretendida (e o chefe mantém Força11superior). Somente parâmetros novos desta modalidade ajustados. Estratégias e arredondamentos explicam diferenças de rodadas/dano nos primeiros andares; não se promete dificuldade universal estritamente crescente para toda build, seed ou política. É calibração inicial testável, não balanceamento de cartas reais ou aceite de diversão por usuários; ajustes posteriores exigem evidência/contrato próprios.

## 3. Mapa

Rota `/journey/arena/tower`, link na Arena comum. Lista vertical de sete andares com nome, dificuldade/perfil, poder, atributos/HP/equipamentos consultáveis, estratégia, estado bloqueado/disponível/concluído **no treino local**, próxima ação e progresso `Torre local: X/7`. Primeira etapa disponível logicamente, mas botão bloqueado sem baralho válido. Próximas bloqueadas até vitória anterior; concluídas não podem ser usadas para farmar.

Chefe destacado com borda dourada, título e apresentação próprios. Botões48px, detalhes44px, contraste e foco, largura móvel. Mapa e combate indicam local; rótulo de rodada também mantém essa informação em layout compacto. Recompensa prevista permanece explicitamente pendente de homologação/servidor, sem valor inventado.

## 4. Fluxo de combate reaproveitado

TowerExperience configura um modo local tipado em **ArenaExperience**; reutiliza ArenaStage/FighterPortrait, apresentação/áudio existentes, snapshots, IA, atributos, descrições0086, histórico recente, Foco e controles0085. Não há segunda engine, IA alternativa, nova barra ou habilidades especiais extras. Combate continua ATACAR/DEFENDER/CARTAS. Prévia fixa o adversário correto; não oferece seleção arbitrária ou atalhos a outros andares.

Adapter `towerArenaSession` fornece load/begin/command e nega liquidação econômica. No término, ArenaExperience usa callback de registro da Torre em vez de claim/grant do treino comum; settle também recusa modo Torre por defesa adicional. Resultado e interface de rematch comuns permanecem no ramo normal. Na Torre, voltar ao mapa permite próxima etapa ou retry legítimo no andar atual; sem revanche por fora da ordem.

## 5. Baralho

Seleção vem do Meu Baralho existente, sem coleção paralela. Cada início valida sete cartas funcionais, distintas e possuídas fornecidas pelo adapter existente; cria UUID/seed novos e congela snapshot. Mão usada não muda durante combate. Na nova batalha todos os usos voltam, sem remover cartas da coleção. UI de edição inline não é oferecida pela Torre; seu adapter save recusa trocar o snapshot. Preparar outra seleção compartilhada não altera a mão congelada, e só passa a valer em nova batalha.

Factory do storage0084 instancia o mesmo replay/comandos/locks em namespace de batalha da Torre, mantendo prefixo/chaves e semântica do treino comum. Não copia/resetta journals antigos. Testes comuns de corrupção, catálogo, replay, Foco/nível, especiais diretos, uso único e duplicidade continuam.

## 6. Progressão, derrota e retomada

Checkpoint por `[conta,Traveler]`, versão de configuração e authority=`local-demo`: vitórias ordenadas vinculadas a floorId+battleId, resultado recente e ponteiro da batalha atual, revisão. Não há flag oficial `won`, saldo ou recibo econômico. Entrada exige próximo índice exato e snapshot canônico do NPC configurado. Comandos validam ponteiro/identidade, rodada e estado via motor existente; Web Locks serializam o checkpoint e os locks de batalha, com nomes distintos.

`finishTower` recebe só ID, relê/reproduz batalha encerrada e deriva vencedor; não aceita booleano de vitória, índice livre ou resultado do callback. Vitória acrescenta apenas o próximo recibo **local**; derrota só registra o resultado e mantém andares anteriores. Finalização repetida retorna estado já salvo sem nova escrita/progresso. Sétima encerra a Torre local; sem reset automático ou restart para farmar.

Salvar batalha e progresso são duas escritas locais, não transação distribuída. Se a primeira ocorreu e o vínculo falhou, o journal órfão é preservado e uma ação explícita recupera o ponteiro, sem contar vitória. Se a batalha terminou mas registro ficou pendente, reload mostra revisão/registro explícito; load nunca avança vitória automaticamente. Estado incompatível/corrupto ou coleção divergente gera bloqueio preservando bytes. Falhas não criam nova identidade nem descartam a batalha ativa.

Sair pelo botão ou fechar a página mantém último comando confirmado; retomar usa mesmo UUID/seed/snapshot/cartas usadas. Derrota permite nova identidade no mesmo andar, sem perder coleção, XP ou moedas. Progresso não atravessa conta/Traveler. Vitórias locais anteriores guardam IDs/ordem; transcrição completa persistida é a da batalha corrente/mais recente, sem alegar arquivo autoritativo de todas as rodadas passadas.

## 7. Campeão

Sétimo NPC tem maiores atributos/poder/HP, perfil tático e efeitos existentes. Prévia especial e resultado `Campeão superado no treino local!`; mapa termina em7/7com destaque e mensagem de que conquista oficial/prêmio de primeira conclusão não foram concedidos. Usa o fallback visual já aprovado para NPCs e identidade textual/destaque próprios, sem arte, overlay, música ou animação nova/violência gráfica.

## 8. Recompensas e limites

Nenhuma concessão na Torre: XP/moedas/baús/saldos/tiers/limites anti-farm/conquistas oficiais permanecem intactos. Abrir andar, vencer, recarregar ou repetir registro não chama updateTraveler, addGameplayReward, arenaRepository.add ou claim de treino comum. Teste de componente usa conta/Traveler ativos e spies para comprovar o gate; serviço claimSettlement semprefalse. UI separa resultado demonstrativo e recompensa não concedida.

Contrato futuro em [autoridade da Torre](TASK-0087-TOWER-AUTHORITY-CONTRACT.md): sessão/seed/snapshots/posse/resultados canônicos, ordem/idempotência, recibos e integração ao protocolo econômico da0078. Primeira conclusão/conquista e valores exigem homologação; nenhum novo ledger/grant. Semanal é apenas extensão documental por definição/instância de temporada futura, sem agendamentos/relógio/reset/premiação recorrente nesta tarefa.

## 9. Testes e evidências

Logs ao lado do checkout em `build/task-0087-arena-tower/`; capturas/resultados em `checkout/build/task-0087-arena-tower/`.

| Gate | Evidência |
| --- | --- |
| Unitários/integração/regressão |93PASS/16arquivos, unit-final.log:12novos em3arquivos e recorte Arena0084–0086; ordem/benchmarks, progressão7, derrota/retry, UUIDs/uso/reset, owner/Traveler, replay/resultado pendente, concorrência/duplicidade, quota/início órfão, corrupção e gate vazio; integração real sem payout mesmo com conta ativa |
| Dificuldade |3PASS config.test, balance-final.log,140combates sintéticos e cadências dos perfis reais; números acima, sem fórmula global nova |
| Browser produto |SDK/DataAPI sintéticos, link Arena→Torre, sete andares e gate sem cartas, nenhuma concessão |
| Browser positivo |Harness exclusivo de tests/fixtures com TowerExperience/ArenaExperience/Stage/motor/storage reais, baralho sintético; retoma mesma batalha, joga7, reset de cartas por UUID, chefe/final, reload e contas separadas, sem novas chaves econômicas |
| Matriz |PASS:6cenários,0falhas/skip/flaky/retry; Chromium1440×900/320×740 e WebKit390×844; e2e-final.log/browser-results.json, capturas de mapa produto/batalha/final local inspecionadas |
| Lint/tipos/build |PASS:lint-final.log, typecheck-final.log, build-final.log; rota Torre no build e gates herdados preservados |
| Isolamento |production-fixture-scan.log após build final; nenhum marcador de cartas/harness no JS de produto |
| Preservação |PASS:scope-audit.json, engine/IA/economia/catálogos/contratos anteriores sem diff; storage comum equivalente após remover factory/namespace e normalizar whitespace; settle idêntico fora da recusa explícita da Torre; refs/arquivos sujos da raiz e checkout0086 preservados |
| PostgreSQL / bíblico |N/A, sem SQL/schema/RLS/migration nem conteúdo bíblico novo; NPCs ficcionais originais |

QA/Security pelo autor, não independentes. Reworks: primeiro ensaio de perfis usava alvo que só defendia, mantendo guarda da IA e impedindo demonstrar Guarda forte; teste passou a atacar para exercitar o gatilho real. Benchmark revelou regressão de dificuldade no sexto, parâmetros da Torre calibrados acima. Teste de integração clicava antes de carregar deck, corrigido para aguardar botão habilitado. Tipos apontaram flatten de callback assíncrono de Web Locks e this da fixture, corrigidos sem alterar motor. Primeira rodada browser5PASS/1FAIL: edição do rótulo local durante Vite causou reload no cenário móvel; checkpoint ficou6/7/ativo sem vitória. Traces/logs preservados e rodada final executada com fontes estáveis. Não atribuir essa falha à progressão do produto ou declarar validação física/hospedada.

## 10. Arquivos alterados

Nova feature arena-tower (config, storage, screen/CSS e testes), rota tower/page.tsx. ArenaExperience recebe modo de sessão/callback/gate sem duplicar combate e link da Torre. Storage de baralho é factory com namespace preservando o contrato legado. Playwright/config/harness próprios. Documentos0087: relatório, contrato de autoridade/semanal, parecer de segurança, tarefa e memória. Sem package/lockfile/dependência/asset/SQL/engine/IA/AuthQR/Story/EBD/contrato anterior alterados; next-env gerado restaurado antes do commit.

## 11. Pendências e segurança

**Integral BLOCKED**: catálogo/aquisição legítima, backend autoritativo/sessões/recibos, integração econômica0078, Auth/RLS hospedados/aparelhos e aceite de balanceamento com cartas reais. UI não anuncia progresso demonstrativo como oficial. Checkpoints locais são adulteráveis/removíveis e não sincronizam entre aparelhos; replay/locks só garantem coerência cooperativa. P1 legado de autoridade/recompensa da Arena comum não é corrigido, mas Torre não usa seu payout. Plano0085 preservado. Parecer: [Security0087](../security/TASK-0087-TOWER-SECURITY.md).

## 12. Checklist/status

Contrato único [TASK-0087](../../tasks/active/TASK-0087-seven-challenge-tower.md) com evidências e20critérios cobertos. Implementação local testada; status integral BLOCKED. Sem main/merge/push/deploy/SQL/Supabase/dados reais. Memória raiz recebe só nova entrada preservando corpo anterior; nada em checkouts anteriores é editado, além da memória de controle da raiz exigida pelo workflow.

## 13. Próxima etapa

Homologar cartas/aquisição e autoridade por contrato próprio antes de habilitar Torre oficial/recompensas. Calibrar com builds/cartas aprovadas e usuários, mantendo evidências. Não iniciar contexto08, PvP, ranking, semanal, áudio ou animações automaticamente; sem publicação remota nesta entrega.
