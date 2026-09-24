# TASK-0019 → Herói com camadas visuais e navegação lateral

ID: TASK-0019
TITLE: Refinar Herói, overlays de equipamentos e layout principal
OBJECTIVE: Fazer itens compatíveis permanecerem visualmente no Avatar após equipar, com navegação lateral única e tela do Herói mais legível, preservando saves e sistemas existentes.
PRIORITY: P1 High
STATUS: DONE
SCOPE: Auditar assets/Avatar/UI; manifesto central de ícones e overlays, posições e z-index; renderização dos overlays compatíveis; animação de equipar até o slot corporal; sidebar verde no Shell; simplificação/centralização do Herói; responsividade; testes e documentação dos assets pendentes.
OUT_OF_SCOPE: Alteração da economia/XP/Guilda, novos itens, mudança de save, overlays forçados a partir de recortes incompatíveis, produção de centenas de assets.
DEPENDENCIES: TASK-0018, sem alterar seus limites de autorização local ou playtest da Fuga.
ASSIGNED_AGENT: Orquestrador atuando como Frontend/QA e revisão Security pelo mesmo autor.
REQUIRED_CONTEXT: Pedido anexado, Avatar/runtime assets, Hero, Equipment, Shell, CSS, traveler/equipped, storage e E2E existentes.
SECURITY_CONSIDERATIONS: Assets apenas locais; URLs selecionadas de manifesto fechado; nenhum dado de equipamento de save usado para formar caminho arbitrário. Não alterar autorização ou persistência.
ACCEPTANCE_CRITERIA:
- Navegação principal única na sidebar verde em desktop, com drawer acessível em mobile; topo reduzido ao HUD e conta.
- Herói centralizado, Avatar protagonista, slots separados, imagens proporcionais; sem perda de XP/moedas/links.
- Para itens com recorte compatível, overlay corporal usa manifesto por item/body type com camada e âncora, aparece após equipar e após reload/troca de Viajante; some ao desequipar.
- Animação visível termina na âncora corporal; movimento reduzido respeitado.
- Itens incompatíveis constam no manifesto/documento como pendentes, com especificação para produção.
TEST_PLAN:
- Inspeção visual desktop/mobile do Herói, Equipamentos e ao menos espada, elmo e botas ou registro explícito de asset incompatível.
- Testes de resolver, equipar/desequipar e reload/troca de Viajante; suíte E2E existente; lint/typecheck/build.
DEFINITION_OF_DONE:
- Gates aplicáveis, aceite visual com evidência e memória atualizada; lacunas de asset sem falsa conclusão.

## Validação de 2026-09-24

| Gate | Resultado | Evidência |
| --- | --- | --- |
| BUILD | PASS | `npm run build` final, 17 rotas |
| LINT | PASS | `npm run lint` |
| TYPECHECK | PASS | `npm run typecheck` |
| UNIT TEST | PASS | `npm test`, 14 arquivos / 79 testes; resolver, posse e isolamento por Viajante |
| INTEGRATION / E2E | PASS | `npm run test:e2e`, 22/22 desktop/mobile; compra, equipar, reload, troca de Viajante, desequipar, corpo feminino, Guilda/Jornada |
| QA VISUAL | PASS | Capturas E2E inspecionadas: Herói masculino com seis camadas, feminino com elmo/espada/escudo/botas e voo do item no painel de Equipamentos. Ajustados rosto do elmo e distância dos cards. Revisão pelo próprio autor. |
| SECURITY REVIEW | PASS | Revisão pelo próprio autor: URLs fechadas no manifesto, só itens possuídos/equipados são renderizados, sem mudança no save ou autorização; busca dirigida não encontrou secrets novos. |
| DOCUMENTATION | PASS | `docs/architecture/EQUIPMENT-OVERLAY-ASSETS.md` especifica manifesto, posição, qualidade, limites e assets futuros. |
| NO KNOWN CRITICAL REGRESSIONS | PASS | Suítes completas aprovadas e rotas existentes preservadas. |
| ACCEPTANCE | PASS | Sidebar única, drawer mobile, Herói central, seis overlays frontais persistentes e animação ancorada. |

LIMITES: overlays foram compostos a partir dos recortes PNG existentes apenas na pose frontal estática. Artes dedicadas de alta definição para outras poses, variantes comuns/raras distintas e encaixe refinado estão especificadas no documento de assets. TASK-0018 continua REWORK para o playtest completo da Fuga; esta tarefa não o altera.
