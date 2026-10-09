# Cinematic Equip Animation V1 — TASK-0036

Autorização local explícita do usuário em 2026-10-02. Este documento substitui a apresentação da TASK-0035; o contrato corporal da TASK-0034 permanece vigente.

## Arquitetura e estágios

- `data/equipmentCinematic.ts`: configuração central por raridade, recompensa/deltas reais e geometria de UI.
- `hooks/use-equipment-cinematic.ts`: sessão com estado explícito, timer cancelável, geração que invalida callbacks anteriores e confirmação exatamente uma vez. `onStage` é extensão opcional; não há áudio ou integração com Baús.
- `components/equipment-equip-cinematic.tsx`: portal reutilizável no body, apresentação, teclado/toque e foco. Recebe dados e callback; não chama a store.
- `components/equipment-cinematic.module.css`: estilos isolados e ordem explícita backdrop → luz → ícone → recompensa/controle → impacto. Não altera o CSS global do jogo.
- `screens/equipment.tsx`: integra a sessão às operações existentes de equipar/desequipar, ao resolver e ao feedback próximo ao Avatar.

| Estágio | Comportamento |
| --- | --- |
| PREPARE | Captura origem/destino e inicia fade da camada anterior; clone é exclusivamente iconAsset. |
| FOCUS | Ícone sai do card e cresce discretamente até o centro real do viewport; fundo recebe scrim. |
| REWARD_REVEAL | Nome, raridade escrita, slot, bônus, poder real e comparação aparecem com fade/slide. |
| FLY_TO_TARGET | Nova captura única do destino; clone reduz e segue curva ao anchor/borda visível. |
| EQUIP_CONFIRM | Operação existente confirma uma única vez; overlay aprovado aparece alinhado, impacto, halo e slot/check. |
| DONE | Portal desaparece, interação liberada; sessão é descartada após 600 ms. Feedback visual desaparece em 900 ms. |

Escape, botão ou toque no foco concluem imediatamente. Se a operação falhar, o portal é limpo, a camada anterior volta e o status informa a falha. Desmontar cancela timers e não equipa depois de sair. Tab fica no botão de concluir durante a cena; foco anterior é restaurado sem rolagem. O status existente anuncia a confirmação; efeitos decorativos são aria-hidden.

## Raridades e tempos

Valores de apresentação apenas. `lendário` permanece no catálogo/saves e é apresentado como **Extraordinário**.

| Raridade | Total ms | Prepare / foco / recompensa / voo / confirmação ms | Escala | Partículas | Diferença visual |
| --- | ---: | --- | ---: | ---: | --- |
| Comum | 760 | 40 / 160 / 220 / 220 / 120 | 1,00 | 0 | Dourado neutro, halo discreto, impacto leve. |
| Incomum | 860 | 40 / 180 / 260 / 240 / 140 | 1,03 | 3 | Verde suave, anel e pequenas partículas. |
| Raro | 1020 | 40 / 220 / 320 / 260 / 180 | 1,06 | 5 | Verde/dourado, halo e pulso mais presentes. |
| Épico | 1220 | 40 / 280 / 400 / 280 / 220 | 1,09 | 8 | Halo maior, partículas e linhas de luz suaves. |
| Extraordinário | 1440 | 40 / 320 / 520 / 300 / 260 | 1,12 | 12 | Pausa de revelação maior, luz/radiação discreta, impacto mais forte. |

Glow e impactStrength também são centrais e crescentes. Partículas têm posições determinísticas; não alteram RNG. Sem flashes rápidos, runas, símbolos ocultistas ou áudio.

## Stats e poder reais

`equipmentReward` usa `equipmentSwapDelta`/`calculateTotalAttributes` e o adapter existente `travelerBattleSnapshot`, que já utiliza `calculateCombatPower` do game-engine. O adapter é somente lido; Arena e balanceamento não são alterados.

Poder: nível × 20 + Vida × 12 + Força × 12 + Defesa × 11 + Sabedoria × 10 + soma do power dos itens × 6 + efeitos distintos × 6, com os arredondamentos/clamps existentes. A cena mostra **poderDepois − poderAntes**, não o power isolado do item nem a soma de seus stats. Exemplo real: Espada do Caminho em slot vazio ganha 36 poder (+2 Força = 24, item = 6, efeito existente = 6).

Troca mostra item substituído, bônus do novo item e deltas positivos/negativos/zero calculados sobre a composição completa. Uma troca sintética de Força 6/power 5 para Força 2/power 1, sem efeitos, exibe −4 Força e −72 poder. Nenhuma fórmula, atributo, equipamento, save ou regra de inventário foi alterada.

## Body-fit, fallback e remoção

`iconAsset` existe somente na UI. O clone nunca entra no container corporal. `overlayAsset` é resolvido independentemente após confirmação. Full-canvas READY com aprovação por corpo usa inset 0/100% sem translate/scale/offset; o canvas inteiro nunca viaja. Camada anterior desvanece antes da troca; não se renderizam dois overlays completos no mesmo slot.

Todos os oito IDs reais continuam `NEEDS_NEW_OVERLAY`. A cena ocorre normalmente, o item é equipado/persistido e os atributos funcionam; nenhum ícone corporal é fabricado. O status informa a pendência. READY/full-canvas é validado com fixtures sintéticas, sem alegar que arte real existe ou foi aprovada.

Desequipar usa fade de 120 ms e feedback de atributos/slot, sem cerimônia longa ou voo reverso. A base do Avatar e os outros slots permanecem.

## Mobile, reduced motion e performance

- Viewports de aceite: 390×844, 412×915, 768×1024, 1440×900 e 1920×1080; ambos corpos. Ícone central 96 px mobile/136 px demais; escala máxima 1,12. Painel limitado à largura visível, nomes quebram linha, controle respeita safe-area. Alturas pequenas têm painel rolável sem mover o Avatar.
- Reduced motion: prepare/fade 120 ms, recompensa 320 ms e confirmação 120 ms (560 ms); estágios de foco/voo têm duração zero, sem zoom, partículas, impacto ou halo. Nome, stats e conclusão permanecem acessíveis.
- Movimento principal usa transform/opacity; halo/raios/background são estáticos e apenas sua opacidade/escala anima. Partículas limitadas a 12; sem bibliotecas novas, física ou canvas por frame.
- Layout medido uma vez no prepare (origem + destino) e uma vez na entrada do voo (destino). Sem RAF/layout reads por frame. Anchors existentes por corpo: head, torso, rightHand, leftHand, centro dos pés, chest. Fora da tela, chegada é projetada à borda visível; nenhum autoscroll.
- Timers de sessão, feedback e remoção são limpos ao desmontar. Saltar invalida a sequência antiga; nova ação durante DONE não herda sua geometria.

## Arquivos e evidências

Novos: este documento, contrato TASK-0036, data/equipmentCinematic, hook, componente/CSS, `equipment-cinematic.test.tsx` e `tests/e2e/equipment-cinematic.spec.ts`. Ajustados: EquipmentScreen, testes de overlays, E2E de animação/hero, nota histórica V2 e CURRENT_STATE. PNGs, resolver/manifesto, Avatar Runtime, game-engine, adapter de Arena e persistência preservados.

Resultados finais e gates estão no contrato [TASK-0036](../../tasks/completed/TASK-0036-equipment-cinematic-v1.md). Capturas e medidas do navegador ficam em `test-results/` (ignorado pelo Git); QA realizada pelo autor, sem revisão independente.

## Próximas melhorias

Produzir e aprovar os quatro protótipos corporais V2 da TASK-0034 antes de READY; depois avaliar a cerimônia com arte real. Uma futura tarefa poderá usar o mesmo componente/callback para recompensas de Baús ou áudio quando houver infraestrutura. Esta entrega não integra esses sistemas nem produz arte.
