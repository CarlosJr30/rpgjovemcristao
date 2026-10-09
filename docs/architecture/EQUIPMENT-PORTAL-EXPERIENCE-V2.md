# Equipment Portal Experience V2 — TASK-0045

Escopo autorizado: refinamento local da experiência existente de equipamentos. Não cria itens, mídias, aprovações Body-Fit, regras de economia, formato de save ou fórmulas. Sem publicação.

## Estrutura e apresentação

- `screens/equipment.tsx` continua coordenando `equipItem`/`unequipSlot`, `useEquipmentCinematic`, `EquippedAvatar` e o evento semântico `gameAudio.playEffect('equipment')`.
- `components/equipment-portal.module.css` contém a composição isolada: moldura arquitetônica clara, iluminação quente por CSS, pedestal, verde/dourado, avatar com proporção 2:3, poder atual e contador real dos seis slots.
- Seis slots existentes mostram nome, item ou estado vazio, raridade de apresentação, bônus reais e ação de escolher/trocar. `aria-pressed`, descrição do item e foco visível; targets >=44px.
- Inventário permanece separado por slot, com filtros locais Todos do slot/Equipáveis/Equipados e raridade. Valores não alteram o save. Cards mostram estado textual, bônus, referência/link bíblicos já existentes e indicação discreta do visual pendente.
- `components/equipment-comparison.tsx` usa `details/summary` nativos, com tabela Atual/Novo/Diferença. Poder vem exclusivamente de `equipmentReward` → `travelerBattleSnapshot`; atributos vêm de `calculateTotalAttributes` e delta existente. Inclui ganhos, perdas e zero, sem depender de cor. Poder do item é identificado separadamente do poder total.
- Feedback de equipar e desequipar mostra poder antes → depois e diferença assinada; atributos e estado continuam sendo derivados do modelo central.

## Preservação e fallback

Hooks, cinematic, commits e tempos existentes permanecem: 1600/1800/2000/2200/2400ms, reduced motion e saída de 120ms. Nenhum círculo ou efeito mágico novo foi criado. A captura de origem continua usando o ícone do card; destino usa o mesmo corpo do avatar. QA confirmou corte do painel de recompensa em landscape baixo (844×390, bottom 427px): apenas o texto passa a ocupar uma coluna lateral, com fade já existente, sem mudar ícone, voo, duração ou commit. Os bounds finais são verificados nos dois landscapes solicitados.

Body-Fit V2, manifests, âncoras, ordem de camadas, READY e aprovações humanas não mudam. Itens pendentes continuam equipáveis e mantêm bônus; nenhum ícone é aplicado como overlay. Testes de renderer/resolver cobrem READY com fixtures isoladas; não aprovam arte real. O catálogo atual mantém a indisponibilidade visual anterior.

Erro dos ícones decorativos os oculta, preservando nome, bônus, tabela e ações. O avatar continua usando seu fallback procedural existente. Nenhum áudio novo ou som Arena reutilizado; som de equipamentos somente se disponível no catálogo existente.

## QA e evidências

Unit: 8 arquivos/83 PASS. E2E novo do portal: 9 PASS/5 duplicações mobile ignoradas; regressões 23 PASS/13 skipped, total 32 PASS/18 skipped. Lint/typecheck exit 0; build exit 0/20 rotas. Resultados e aceite final no contrato concluído da tarefa. Preservação de 163 mídias e todos os arquivos fora do escopo PASS; next-env restaurado ao baseline e tsc web/root rechecados. Evidências locais: `build/task-0045-evidence/` (logs, baseline, preservação e screenshots). QA e revisão de segurança realizadas pelo autor, sem alegação de independência. Sessões E2E usam armazenamento descartável, autenticação local e servidor de testes 3108; não alteram dados reais do navegador 3000. Servidor dev retomado em 127.0.0.1:3000; GET de equipamentos HTTP 200.

Matriz: 390×844, 412×915, 844×390, 915×412, 1440×900, 1920×1080. Cobrir avatar, slot/equip, poder/atributos, filtros, tabela, keyboard/foco, reduced, links existentes, persistência, imagens ausentes e cinematic. Não interpretar testes históricos V1 intencionalmente desabilitados como aprovação de novos overlays.

## NEEDS_NEW_ASSET

Não há asset bloqueante: a moldura, superfície dos slots, emblema de poder e pedestal estão resolvidos por CSS e ícones existentes. Nenhum arquivo ou registro READY criado.

Possível melhoria artística futura, opcional: `equipment_portal_background.webp` e variante `equipment_portal_mobile.webp`, ambos **NEEDS_NEW_ASSET**, para uma cena arquitetônica de arsenal com área central livre. Somente produzir após uma tarefa/autorização própria e repetir os gates de mídia. Não há justificativa atual para gerar frames de raridade/slot ou emblema separados.

Pendências externas preservadas: Body-Fit real precisa da aprovação humana prevista na tarefa própria; áudio Arena Suno Free permanece restrito a protótipo não comercial e bloqueado para produção comercial. Nenhuma delas é alterada ou resolvida artificialmente por esta UI.

## Arquivos da entrega

- Alterados: `apps/web/features/journey/screens/equipment.tsx`, `apps/web/features/journey/components/equipment-cinematic.module.css`, `.agent/memory/CURRENT_STATE.md`.
- Novos: `apps/web/features/journey/components/equipment-comparison.tsx`, `apps/web/features/journey/components/equipment-portal.module.css`, `apps/web/features/journey/equipment-portal.test.tsx`, `tests/e2e/equipment-portal.spec.ts`.
- Documentação: este relatório, `docs/security/EQUIPMENT-PORTAL-EXPERIENCE-V2-REVIEW.md`, `tasks/completed/TASK-0045-equipment-portal-experience-v2.md` (contrato único movido de active).
- Logs/capturas/scripts auxiliares de evidência em `build/task-0045-evidence/`, sem mudança em ferramentas/dependências do projeto.

Estado final: **TASK-0045 DONE local**. Nenhuma publicação realizada.
