# Auditoria inicial de funcionalidades visíveis — 2026-09-24

**Atualização posterior:** TASK-0019 adicionou overlays frontais para os seis equipamentos atuais. O estado abaixo documenta a auditoria de TASK-0018; consulte [Camadas de equipamentos do Herói](EQUIPMENT-OVERLAY-ASSETS.md) para o estado visual atual, limites de pose e especificação de assets dedicados.

Critério: **IMPLEMENTADA** exige caminho natural pela interface, ação utilizável e persistência após reload. **PARCIAL** cobre fluxos incompletos. **NÃO IMPLEMENTADA** indica ausência de fluxo real. Esta matriz registra o estado **antes das correções de TASK-0018**; o relatório final da tarefa deve informar o estado posterior com evidências.

| Funcionalidade | Status inicial | Arquivo / fluxo real | Ligada à UI? | Funciona? | Ação necessária |
| --- | --- | --- | --- | --- | --- |
| Retrato na Fuga | IMPLEMENTADA | `snake-chase-game.tsx`, `gameplayAvatarPortrait.ts` | Sim, após chegar à fase | Sim no início E2E; partida completa pendente | Playtest de curvas, vitória e derrota |
| Collider/wall sliding | PARCIAL | `snake-game-engine.ts` | Motor do minigame | Testes de engine passam; game feel pendente | Validar em execução prolongada |
| XP e nível | PARCIAL | `progression.ts`, `phase.tsx`, `use-journey.ts`, Home/Herói | Sim | Ganho e nível persistem; feedback de level up ausente | Mostrar subida e meta claramente |
| Moedas | PARCIAL | `traveler.ts`, exploração, recompensas, Shell | Sim | Ganha e persiste; não gasta | Criar loja e feedback de ganho |
| Loja | NÃO IMPLEMENTADA | Sem rota ou componente | Não | Não | Rota, navegação, catálogo e compra |
| Equipamentos | PARCIAL | `equipment.tsx`, `backpack.tsx` | Sim | Equipar persiste; três itens reais apenas | Itens acessíveis e raridades |
| Animação ao equipar | PARCIAL | `equipment.tsx`, CSS de pulso | Sim | Pulso; ícone não viaja até Avatar | Criar deslocamento visível |
| Overlay permanente | NÃO IMPLEMENTADA | `avatar.tsx` só usa sprite de corpo inteiro | Não | Não | Assets próprios e resolver; comunicar pendência |
| Guilda e desafio | PARCIAL | `guild-hub.tsx`, `use-journey.ts` | Sim | Simulação local cria desafio só no Viajante ativo | Campos completos e conteúdo por Guilda |
| Lição da célula | NÃO IMPLEMENTADA | Sem tipo/formulário | Não | Não | Formulário, persistência e leitura |
| Missão da célula | NÃO IMPLEMENTADA | Sem tipo/formulário | Não | Não | Formulário, persistência e leitura |
| Missão coletiva | NÃO IMPLEMENTADA | `collectiveTarget` sempre `null` | Não | Não | Progresso real por Guilda |
| Códice/coleção | PARCIAL | `diary.tsx` lista inventário | Sim, via Diário | Descobertos visíveis; sem contagem/silhuetas | Criar visão de coleção |
| Navegação | PARCIAL | `shell.tsx` | Sim | Links “Herói” e “Mochila” apontam para mapa; duplicados | Corrigir links e adicionar Loja/Coleção |
| Persistência local | PARCIAL | `journey-storage.ts` | Sim | Viajantes separados; conteúdo de Guilda não é compartilhado | Testar reload/isolamento e conteúdo local da Guilda |
| Flags/mocks | PARCIAL | `use-journey.ts` contém `if (false)`; Guilda é simulação | Em parte | Não há feature flag bloqueando Loja; ela inexiste | Remover ramo morto e rotular limites da simulação |

Assets: há ícones de seis slots e sprites completos do Avatar; não há PNG de overlay compatível. `packages/game-engine` e `packages/database` não controlam o fluxo local atual da Fuga, economia ou Guilda.

## Estado após TASK-0018 — 2026-09-24

O critério de **IMPLEMENTADA** continua sendo uso pela interface e persistência após reload. **PARCIAL** indica que o fluxo existe, mas ainda não satisfaz toda a experiência solicitada. A simulação local da Guilda não equivale a autenticação ou sincronização entre dispositivos.

| Funcionalidade | Agora | Evidência observável / onde testar | Limite ou próxima ação |
| --- | --- | --- | --- |
| Retrato na Fuga | PARCIAL | Fase 1.1 → Fuga; captura E2E mostra cabeça pequena do Viajante ativo, derivada do sprite runtime | Partida completa manual ainda não verificada |
| Collider e wall sliding | PARCIAL | `snake-game-engine.ts`, testes de motor para eixo X/Y, diagonal e colisão; cena da Fuga capturada | Confirmar sensação de controle em corredor, curva, canto e parede por partida completa |
| XP e nível | PARCIAL | Jornada/Herói mostram nível, XP, barra, XP restante e próximo marco; missão aprovada concede XP e feedback de nível; reload confirmado | Só o bônus do nível 2 é desbloqueio real; marcos posteriores estão em preparação |
| Moedas | IMPLEMENTADA | HUD, Mochila e Loja exibem saldo; recompensas exibem ganho; compra debita e persiste | Economia é local, sem autoridade de servidor |
| Loja | IMPLEMENTADA | Navegação → Loja → Comprar → Mochila; 3 ofertas com preço, raridade, referência bíblica e saldo insuficiente | Catálogo inicial pequeno, intencional |
| Equipamentos | PARCIAL | Mochila/Equipamentos; itens obtidos por jogo e compra; 6 itens catalogados, 3 ofertas; equipar persiste | Não há item jogável épico/lendário nem overlays corporais |
| Animação de equipar | IMPLEMENTADA | Equipamentos → Equipar; ícone viaja do card ao Avatar por ~620 ms, com efeito de chegada; captura E2E | Movimento reduzido aplica o item sem voo |
| Overlay permanente | NÃO IMPLEMENTADA | Equipamentos exibe ícone, slot equipado e aviso explícito | Faltam overlays PNG compatíveis com as poses do Avatar |
| Guilda e painel do Líder | PARCIAL | Guilda → alternar para visão de Líder; formulários e aprovações visíveis; conteúdo local por ID de Guilda | Qualquer Viajante pode ativar a visão local; requer autenticação/autorização real antes de multiusuário |
| Criar desafio | PARCIAL | Líder → Criar Desafio; membro da mesma Guilda vê, envia, recebe aprovação/recompensa; teste E2E | Compartilhamento só no mesmo navegador/origem |
| Criar lição | PARCIAL | Líder → Criar Lição; campos bíblicos, perguntas, atividade e data; outro membro lê após reload | Compartilhamento só no mesmo navegador/origem |
| Criar missão | PARCIAL | Líder → Criar Missão; membro vê, envia, obtém aprovação e recompensa uma vez; teste E2E | Compartilhamento só no mesmo navegador/origem |
| Missão coletiva | PARCIAL | Desafio coletivo 2 participantes: aprovação de um membro mostra 1/2 e barra no painel | Não há servidor nem eventos globais entre navegadores |
| Códice/coleção | PARCIAL | Navegação → Coleção; equipamentos descobertos, silhuetas, raridades e segredos do Jardim | Conquistas, centenas de itens e novos tipos de descoberta ainda em preparação |
| Navegação | IMPLEMENTADA | Barra principal: Jornada, Missões, Herói, Loja, Mochila, Equipamentos, Coleção, Guilda e Diário, também no mobile | — |
| Persistência local | PARCIAL | E2E desktop/mobile: compra, saldo, equipamento, XP, nível, lição, missão e desafio após reload; inventários de dois Viajantes isolados | Sem sincronização entre dispositivos; conteúdo da Guilda usa armazenamento da origem |
| Flags e mocks | PARCIAL | Removido ramo `if (false)`; Loja/Coleção/Guilda acessíveis; dados de compra/recompensa vêm dos saves | Painel de Líder e aprovação são simulação local, identificada na interface |

### Evidência de validação

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS, 13 arquivos e 76 testes.
- `npm run build`: PASS, 17 rotas.
- `npm run test:e2e`: PASS, 18 testes desktop/mobile. Cobrem compra, reload, isolamento de Viajantes, equipar, coleção e conteúdo/aprovação/recompensa da Guilda; a Fuga é capturada no começo.
- Capturas E2E inspecionadas: Loja mobile, painel da Guilda mobile e Fuga desktop. O navegador integrado não conectou nesta sessão; a captura da Fuga não comprova a partida completa nem todas as manobras pedidas.

### Assets de overlay ausentes

**OVERLAY NÃO DISPONÍVEL:** Botas do Viajante; Elmo do Viajante; Medalhão do Caminho; Espada do Caminho; Couraça do Viajante; Escudo da Perseverança. Existem ícones de slot e sprites de corpo inteiro, mas nenhum desses seis itens possui camada corporal alinhada às poses do Avatar. O slot, o ícone e o estado equipado continuam persistidos.
