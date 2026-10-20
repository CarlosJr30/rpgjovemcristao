# TASK-0085 — Atacar, Defender, Cartas

Implementação local validada. A Arena normal possui somente **ATACAR — DEFENDER — CARTAS**; todo especial do jogador passa pelo ID de uma das sete cartas. **STATUS: BLOCKED para aceite integral**: catálogo/aquisição homologados e autoridade de combate/recompensa ainda ausentes. O catálogo continua vazio; não se desbloqueou treino real com cartas fictícias.

## 1. Branch e commit local

Branch `codex/arena-three-actions`, worktree `build/task-0085-arena-cards/checkout`. Base limpa `f5e716560022a1956e4fa13626fad4ea26b195ac`, descendente da implementação validada0084 `f254349130c7779413b4ae7d3e0438e766955b39`; diferença entre ambos era só quatro linhas de controle documental. Commit desta entrega registrado no controle final. Sem pressupor publicação no GitHub, sem push/deploy/merge/main ou remoto.

## 2. Auditoria dos especiais e equipamentos

| Efeito existente | Nível / Foco base | Reaproveitamento |
| --- | --- | --- |
| Golpe do Caminho | 2 / 2 | Multiplicador1,45 e arma, reforço automático e potência existentes |
| Guarda Perseverante | 4 / 2 | Guarda forte do próximo golpe e reforço automático do escudo |
| Discernimento | 6 / 2 | Sabedoria/próximo ataque, reforço do amuleto, intenção provável da IA |
| Passo do Peregrino | 8 / 3 | Mobilidade para evitar golpe, preservando esquiva das botas |

Foco0–3, inicial0, ataque/defesa+1; desconto existente de até1 e custo mínimo1 nos especiais, potência do Golpe limitada ao intervalo já vigente. Sem novo cooldown ou rebalanceamento. `arenaSpecials`, configuração, fórmulas e corpo de resolução/IA permanecem; extensão restringe entrada e valida consumo. IA continua escolhendo seus especiais pelo contrato legado, como antes; esta entrega não cria baralho do bot.

Itens ACTIVE no código são reforços automáticos da ação correspondente com usos/cooldowns existentes, não botões próprios. Espada após defesa, escudo, amuleto, botas automáticas e armadura passiva preservados. Incompatibilidade identificada antes da edição e registrada no contrato: não havia ativação independente de equipamento na Arena normal a converter. Copy agora explica reforço automático por ação/carta. Descrições numéricas completas não foram antecipadas da TASK-0086.

## 3. Interface simplificada

`ArenaBattleActions` reúne os três controles usados pela Arena real. CARTAS alterna painel das sete, com aria-expanded/controls; Escape fecha e devolve foco ao botão. Cartas não ficam expostas em paralelo desde o início. Painel mostra nome, descrição real do motor, custo de Foco ajustado ao snapshot, nível mínimo, Disponível/Indisponível/USADA e motivo legível: falta de Foco, nível, uso anterior, término ou confirmação pendente.

HP de ambos e medidores de Foco existentes permanecem em ArenaStage, sem segunda energia. Painel tem contraste próprio sobre Arena escura, largura móvel e order4 para aparecer depois dos três controles no layout flex da Shell, ocupando toda a linha em landscape. Resultado permite consultar cartas sem ativação. Aviso de nível anuncia requisito atingido e explica que adquirir/selecionar carta é necessário; não apresenta carta como concedida.

## 4. Especiais como efeitos de cartas

ArenaCard já referencia ações reais. Carta de especial executa o mesmo caminho interno e registra apenas seu ID como usado após aceite. Não existe catálogo novo nem conversão dos quatro efeitos em cartas possuídas. Posse vem do adapter0084; seleção/freeze só aceita sete funcionais e distintas. Nível e Foco são avaliados em cada uso. Loadout fixo legado não é um segundo seletor de poderes de jogador no produto: não impede carta válida e não atribui posse. Mantido somente para compatibilidade/IA.

## 5. Foco e integridade dos comandos

`ArenaProductAction` aceita ataque/defesa/cardID. `resolveArenaCommand` impõe isso também em runtime, exige deck e identidade/rodada atuais. Sem deck, o estado criado por fábrica legada não serve para comando de produto. `resolveArenaRound` preserva legado sem deck e bloqueia especial direto se houver deck; a capacidade de executar a ação de uma carta fica em função interna não exportada.

Carta ausente/usada, nível/Foco insuficientes, deck inválido, ID/rodada incorretos, ação desconhecida ou combate encerrado não avançam estado nem consomem ID. Básicos não gastam cartas. Não houve mudança nas fórmulas de dano, geração/limite de Foco, gatilhos de equipamento ou IA.

## 6. Sete cartas, persistência e compatibilidade

Preservados exactly7, ownership por Traveler, IDs únicos, snapshot copiado, usedIds, bloqueio de edição ativa, novo UUID/seed na revanche, Web Locks, replay e checkpoint antes de animar. Reload não devolve carta usada; duas abas têm só um vencedor na rodada. Histórico/intenções e comportamento econômico herdado permanecem.

Journal0084 só com ataque/defesa/cardID continua sem reescrever bytes durante load, mantendo identidade/usos. Journal contendo especial direto antigo fica **explicitamente bloqueado para migração**, inclusive se encerrado: load/save/begin/command/claim recusam sem apagar, converter ou substituir o registro. Não existe descarte automático nem botão de reset para driblar o bloqueio. Recuperação/migração desses registros é pendência própria; não se inventa retrospectivamente qual carta teria sido usada.

## 7. Testes e resultados

Evidências em `build/task-0085-arena-cards/` ao lado do checkout; browser-results/capturas ficam em `checkout/build/task-0085-arena-cards/`.

| Gate | Resultado e evidência |
| --- | --- |
| Unitários/componentes/regressões |68PASS/11 arquivos, `unit-final.log`:3ações, painel/teclado, custos/motivos, básicos,4efeitos, nível/Foco sem consumo, uso por ID,7preservadas, sem loadout paralelo, especial direto negado, gate legado, equipamentos, IA, replay/lock/concorrência/revanche, catálogo vazio e laboratório sem save |
| Integração ArenaExperience real | Loader de coleção sintético e apresentação mockada em teste de componente: produto vazio bloqueia; saved7 inicia, Cartas abre o painel, duplo clique consome uma vez, remount mantém identidade/uso |
| Browser produto |3PASS: coleção→Meu Baralho→Arena autenticados com SDK/DataAPI sintéticos, catálogo vazio bloqueia mesmo com metadata/40itens desconhecidos; nenhuma carta de teste no catálogo |
| Browser positivo isolado |3PASS: harness Vite exclusivo de tests/fixtures, controles/painel/meter+motor+storage reais; sete sintéticas com4efeitos, custo/falta1Foco, básicos não consomem, Escape, duas abas competem pelo mesmo especial, reload USADA, fechamento e revanche com nível insuficiente |
| Matriz E2E | Chromium1440×900/320×740 e WebKit390×844;6PASS/0FAIL/0SKIP/retry0, `e2e-final.log`; capturas de controle/uso/nível e produto vazio, sem overflow testado |
| Lint | PASS `lint-final.log` |
| TypeScript | PASS `typecheck-initial.log`, todos workspaces+raiz; build também verifica tipos do app após CSS/format |
| Build | PASS `build-final.log`, Next16.4.2, rotas existentes e gates herdados; nenhuma rota de fixture/lab |
| Isolamento de fixtures | PASS `production-fixture-scan.log`, sem fixture-special-/fixture-card-/títulos de harness em JS de produção |
| PostgreSQL / bíblico | N/A: nenhum SQL/schema/RLS/migration ou conteúdo bíblico novo |

QA/Security pelo autor, sem independência. Primeira rodada60testes teve55PASS/5FAIL em novas expectativas: quatro comparavam loadouts distintos intencionais; uma fixture de dano mínimo ocultava multiplicador. Rework ajustou comparação do snapshot e força da fixture sem mudar fórmula; oito novos testes engine passaram, depois68/68. A primeira chamada selecionou caminho de teste legado incorreto; rodada final inclui os caminhos reais arena-specials e arena-lab. Revisão visual tornou painel legível sobre fundo escuro e corrigiu contraste do medidor apenas no harness, sem alterar ArenaStage. Rodada browser repetida após ajuste visual da fixture; não se repetiu suíte extensa sem alteração.

## 8. Arquivos alterados

- Engine: `arena-combat-v2.ts` e novo `arena-product.test.ts`; arena-deck/index/fórmulas base intactos.
- Produto: novo `arena-deck/battle-actions.tsx`, `cards.module.css`, editor/painel, storage; ArenaExperience e aviso de nível.
- Testes: battle-actions, arena-integration e storage; fixture especial, novo harness HTML/TSX/CSS/Vite, Playwright/config próprios. Harness0084 recebe apenas tipo de comando estrito para continuar compilando.
- Documentos próprios: relatório, especificação de homologação, plano de autoridade, parecer Security e contrato0085. Memória raiz recebe entrada com corpo anterior preservado.
- Sem dependência/lockfile/asset/SQL/economia/AuthQR/Story/EBD/contratos0078/0080–0084 alterados. next-env gerado restaurado antes do commit.

## 9. Dependências e bloqueios

Não há cartas reais homologadas nem fonte de aquisição validada. Ausentes backend de combate/posse e recibos econômicos integrados. Estado local é adulterável, histórico diário não é autoridade; intenção de liquidação não corrige antifraude ou atomicidade econômica. **Achado P1 legado permanece aberto e bloqueia DONE integral.** Valores/concessões/XP/moedas/baús/tiers/anti-farm não foram modificados. Sem teste hospedado de Auth/RLS ou aparelhos físicos; sem sync entre aparelhos. Journal antigo com especial direto requer migração posterior preservando seu registro.

Correção compatível preparada em [plano de autoridade](TASK-0085-ARENA-AUTHORITY-PLAN.md), sem economia paralela/SQL/serviço ou mudanças da0078. Parecer: [Security0085](../security/TASK-0085-ARENA-SECURITY.md).

## 10. Especificação para cartas homologadas

[Contrato de homologação](TASK-0085-CARD-HOMOLOGATION.md): ID estável, nome, raridade, tipo, efeito real, nível, custo de Foco, fonte legítima e versão de balanceamento, além dos gates. Tabela de capacidades não é catálogo de cartas e não concede nenhuma delas.

## 11. Checklist e aceite

Contrato único em [TASK-0085](../../tasks/active/TASK-0085-arena-three-actions.md), com gates e pendências. Implementação local e checks executados PASS; revisão Security concluída com bloqueio P1 conhecido. Integral BLOCKED, não DONE. Alterações raiz/outros checkouts preservadas, sem commit na branch raiz/main, sem publicação/operação remota.

## 12. Próxima etapa recomendada

Homologar catálogo e aquisição legítima em tarefa própria, coordenando atributos/economia e a correção autoritativa já preparada, antes de habilitar cartas reais ou prêmios apoiados nesse combate. Contexto06 não iniciado automaticamente; revisão numérica depende de novo pedido. Não antecipar Torre/PvP ou servidor fora do contrato.
