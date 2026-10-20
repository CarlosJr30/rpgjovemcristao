# TASK-0088 — Baús e animações de revelação
ID: TASK-0088
TITLE: Apresentação cinematográfica de recompensas confirmadas (contexto08/09)
OBJECTIVE: Abrir visualmente o baú, apresentar cada prêmio, pausar2s antes dos detalhes e preservar a leitura/retomada sem conceder recursos pela animação.
PRIORITY: P2 Normal
STATUS: BLOCKED
SCOPE: Feature frontend chest-reveal (contrato/adapter, máquina de estados, checkpoint visual, modal/CSS/áudio), integração ChestPanel/Mochila, consulta somente leitura por operation_key no repository existente, testes/config/harness e docs/memória próprios. Orquestrador autoriza perfis Frontend/Architect/GameDesigner/QA/Security a esses caminhos específicos, incluindo testes colocados junto aos módulos.
OUT_OF_SCOPE: Engine/fórmulas/loot/preços/XP/moedas/economia0078, inventário/grants/SQL/Auth/RLS, cartas de produto, dependências/novos assets/overlays/downloads, main/merge/push/deploy/remoto/dados reais, outras funcionalidades/Torre/PvP/contexto09.
DEPENDENCIES: Base0087 limpa e24f8ed0712ff3b5f9392313194232e1efe044ed (controle após runtime170beef); histórico/RPC existentes e ambiente econômico0078 ainda condicionado; catálogo de cartas vazio.
ASSIGNED_AGENT: Autor assume Architect/Frontend/GameDesigner/QA/Security sem subagentes ou alegação de independência.
REQUIRED_CONTEXT: AGENTS/GLOBAL/CURRENT/WORKFLOW/RULES/SECURITY/perfis/skills selecionados, pedido08, ChestPanel/data/chests/use-journey/repository/SQL0002/contrato baús, descrições0086/comparação/arte/áudio existentes.
SECURITY_CONSIDERATIONS: Animação somente leitura, sem RNG/grant. Entrada de produto vem de chest_operations open validada por conta/Traveler/RLS/operation_key/ID/tipo/catálogo; persistência visual guarda IDs/índice/apresentados, nunca recompensa como prova. Intent persistida antes da RPC permite consultar o mesmo resultado após reload; nenhuma RPC automática ao retomar. Não repetir abertura incerta com ID novo. Histórico pode ser revisto sem RPC. Local legado não é autoridade e não será chamado pela nova abertura; bloqueio explícito, funções econômicas intactas.
ACCEPTANCE_CRITERIA:
- Abertura/luz/partículas/carta ou equipamento subindo/girando/centralização/pausa2s/virada/detalhes persistentes, temas só raridades existentes, sem flash repetitivo.
- Reutilizar assets/áudio aprovado/descritivos/comparação existentes. Sem arte de carta inventada no produto ou fórmula copiada.
- Prêmios em ordem, Próximo manual, resumo, acelerar/pular/estático/rever, teclado/foco/scroll móvel/reduced-motion.
- Confirmação distinta de pendência, reload/duplo clique/fechar/rever sem novo grant/sorteio. Contexto visual por conta+Traveler+recibo sem dados econômicos persistidos.
- Vinte critérios do pedido cobertos com testes direcionados, regressões, lint/tipos/build/browser/inspeção visual; docs/checklist/memória/commits locais e preservação.
TEST_PLAN: Adapter/recibos inválidos e isolamento, tempos/transições/duplo clique, checkpoint/retomada/summary, integração RPC→histórico→apresentação e falha pendente; regressão inventário/reward/controle de acesso; browser produto com SDK/DataAPI sintéticos + harness de carta separado, desktop1440/mobile320/WebKit390, scanJS sem fixtures. PostgreSQL N/A sem alteração SQL.
DEFINITION_OF_DONE: Evidência local dos critérios; integral BLOCKED enquanto autoridade/ambiente0078, cartas homologadas e validação hospedada/aparelhos/licenças de som por raridade não forem comprovados.

## Auditoria / decisões
- SQL0002 open_chest verifica ownership, lock da pilha, RNG no banco, grant/ledger na transação e chave open:UUID. Novo adapter usa registro persistido, não cria recibo paralelo. Histórico legado materializa coins e itemId, sem array ordenado; apresentação preserva ordem documentada coins→item do contrato atual. Arrays futuros exigem adapter homologado, preservando ordem fornecida.
- Adapter aceita somente equipamento do catálogo real. Não há carta/XP/consumível no retorno atual; componente de carta fica exercitado apenas por fixture isolada. Não estimar quantidade/duplicado com inventário anterior possivelmente obsoleto.
- Comparação real só se item está no inventário sincronizado; caso contrário sinaliza sincronização pendente. Valores/efeitos/referência existentes são reutilizados, sem equipar automaticamente.
- Raridades internas de equipamentos:comum/incomum/raro/épico/lendário, último com alias visual existente Extraordinário. Nenhuma mítica nova. Tema por prêmio; moedas herdam tier do baú, sem alegar raridade econômica da moeda.
- Arte de baú registrada é raster inteiro sem tampa separada: reutilizar imagem com recorte CSS para articular tampa, sem gerar pacote novo. Transform/opacity/partículas limitadas. Sons aprovados de produção estão vazios: hooks via AudioManager e preferências, silêncio seguro até catálogo licenciado, sem protótipos da Arena fora da Arena.
- Sessões de abertura são serializadas por conta/Traveler via Web Locks e intent durável. Checkpoint visual não é transação econômica nem prova de aquisição. Falha de storage bloqueia nova abertura, mas não esconde histórico confirmado; falha/reload consultam recibo antes de qualquer ação.

## Checklist
- [x] Auditoria/base/contrato/ownership
- [x] Contrato/adapter/estados/persistência visual
- [x] Cinemática/carta/equipamento/temas/acessibilidade
- [x] Integração confirmada/pendente/histórico
- [x] QA/Security/gates/relatório
- [ ] Memória/controle final dos commits
- [ ] Catálogo de cartas/autoridade hospedada/aparelhos/sons homologados

## Self validate / QA / Security

Revisões pelo autor, não independentes. Logs em build/task-0088-chest-reveal ao lado do checkout. Relatório de12itens:docs/architecture/TASK-0088-CHEST-CINEMATIC-REVEAL.md. Condição de desbloqueio integral:resolver gates econômicos/ambiente0078 e validação hospedada/Auth/RLS/aparelhos no contrato apropriado; cartas/aquisição/arte reais exigem homologação. Som licenciado por raridade permanece extensão posterior, com hooks silenciosos permitidos pelo pedido. Sem autorização implícita para remoto/backend/assets.

| Gate | Evidência |
| --- | --- |
| Unitários/integração/regressão | PASS:56testes/12arquivos, unit-visual-final.log;13rechecks UI PASS após ajuste de faces/copy, unit-ui-recheck.log |
| Lint / tipos | PASS:lint-delivery.log, typecheck-delivery.log |
| Build | PASS:build-face-final.log, configuração pública sintética .invalid; gates herdados de assets/áudio preservados |
| Browser / visual | PASS:9cenários,0falhas/skip/flaky/retry, e2e-face-final.log/browser-results.json; Chromium1440/320 e WebKit390. Recheck de captura desktop1PASS, capture-recheck.log. Verso WebKit normalizado e capturas de produto/equipamento/comparação/resumo/pendência/carta/temas inspecionadas |
| Fixtures / diff | PASS:scan JS final sem marcadores de carta/harness e git diff --check; nenhuma credencial real nos arquivos próprios |
| Segurança | Parecer TASK-0088-CHEST-REVEAL-SECURITY.md; renderer sem grant/RNG e leitura de recibo scoped; aceite econômico integral condicionado aos riscos herdados/ambiente0078 |
| Escopo/preservação | scope-audit.json:pacotes/engine/loot/SQL/Auth/RLS/catálogos/Torre/contratos anteriores sem diff, RPCs e compra equivalentes, root/refs/checkout0087 preservados |
| PostgreSQL / editorial | N/A:sem SQL/schema/RLS novo ou texto bíblico; referências anteriores apenas reutilizadas |

Reworks:lint de refs/efeitos e tag de imagem; primeiro unit31PASS/3FAIL em cursor diferido, gravação síncrona corrigiu perda de índice ao fechar rápido; rodada34PASS, regressões55PASS e teste extra de histórico/storage56PASS. Browser inicial2PASS/1FAIL por shim process ausente no harness Vite, rodada interrompida; correção somente de configuração e9PASS. Inspeção visual encontrou descrição repetida/tipo em inglês e, apesar dos gates de fluxo positivos, verso espelhado no WebKit. CSS usa faces estáticas explícitas na pausa/detalhes e prefixo WebKit, preservando giro/virada nas transições; capturas anteriores e logs preservados. Ensaio final de orientação e matriz9PASS; captura dos cinco temas rechecadas com paint estabilizado,1PASS extra, sem ampliar suítes. Não considerar só testes de fluxo como aceite visual.

## Aceite dos20critérios do pedido

| Critério | Evidência local |
| --- | --- |
|1.Abertura | renderer.test:ready/opening/rising; browser produto e harness |
|2.Pausa2s | fake timers:1999ms ainda holding,2000ms flipping; browser mede espera antes de revelar |
|3.Virada | estado flipping/depois details, verso normalizado por CSS e captura WebKit/Chromium |
|4.Equipamento | produto confirmado com Couraça; ficha/arte/stats; sem equipar |
|5.Raridades | cinco temas internos existentes, testes e capturas; sem mítica |
|6.Descrições | describeArenaAction e regressão0086; custo2/Foco/nível2/duração do Golpe sintético |
|7.Comparação | componente original/snapshots, Atual/Novo/Diferença; item ausente mostra pendência |
|8.Múltiplos | lista consumida em ordem; legado moedas→equipamento, fixture carta→equipamento→moedas |
|9.Resumo | lista final só do recibo e cursor.summary, sem incluir pendências |
|10.Próximo | manual e condicionado a details; revisão evita duplo avanço |
|11.Pular/acelerar | somente fase visual do prêmio atual, explicação sempre acessível |
|12.Movimento reduzido | media query/evento e modo estático, sem timers de movimento |
|13.Duplo clique | ref/WebLock/intent, duas chamadas concorrentes só uma RPC; tick/next duplicados negados |
|14.Reload | relê registro e cursor, mesma operação/índice; não reabre automaticamente |
|15.Confirmado/pendente | RPC isolada é ignorada para apresentação; ledger ausente/falso/estrangeiro/schema novo bloqueia |
|16.Sem grant no cliente | renderer/storage/máquina sem dependência econômica/RNG; animação/replay não chamam RPC; abertura offline nega helper legado |
|17.Sem carta falsa | adapter não produz carta, catálogo intocado/vazio; positivos só tests/fixtures/harness e scanJS |
|18.Desktop/celular | matriz acima, largura/tabela/controles/portal/HUD inspecionados; não aparelho físico |
|19.Regressão inventário/reward | testes chests/client/engine/repository, equipment/descriptions; fontes econômicas idênticas |
|20.Controle de acesso | consulta somente leitura por Traveler/open/key, nega linha estrangeira; testes Auth existentes; SQL/Auth/RLS intocados |

Provas locais/sintéticas não são crédito real, aquisição de carta, segurança global, sincronização entre aparelhos, licença sonora ou aceite de ambiente hospedado. Check necessário pendente não recebe PASS.
