# TASK-0088 — Baús e animações de revelação

Apresentação cinematográfica local implementada sobre o fluxo de Baús existente. A animação lê recompensas registradas; não sorteia, concede, equipa ou altera saldos. **Aceite integral BLOCKED** pelos gates econômicos/ambiente hospedado do projeto. Cartas de produto continuam ausentes; demonstração de carta usa somente fixtures isoladas. Nenhuma operação remota foi executada.

## 1. Branch e commit local

Branch `codex/chest-cinematic-reveal`, worktree `build/task-0088-chest-reveal/checkout`, base limpa `e24f8ed0712ff3b5f9392313194232e1efe044ed`, controle documental após runtime0087 validado `170beefd2b3fc79c7e2e780bf56a5b67cb1b7866`. Implementação local `ea0c07f214ee13824a43f14666c6132d51b10677`; commit posterior somente deste relatório e do contrato. HEAD final/hashes no recibo `build/task-0088-chest-reveal/final-receipt.json`, fora do versionamento. Não presumir publicação GitHub. Raiz e checkout0087 preservados; nenhuma main/merge/push/deploy/migration/dado real alterado.

## 2. Sistemas reaproveitados

ChestPanel/Mochila, chestCatalog, EQUIPMENT_CATALOG, assets registrados de baú/moedas/equipamentos, chestRepository.open/list/history e reloadOnlineTraveler. Nova consulta operation é somente leitura do mesmo ledger, filtrada por Traveler/open/operation_key, para retomar recibos fora da janela do histórico. RPCs e compras anteriores permanecem equivalentes por auditoria de fonte normalizada.

EquipmentStatBonuses, EquipmentArenaDetails, EquipmentComparison e EquipmentBibleDetails mantêm atributos efetivos, condições, arredondamentos, referências existentes e comparação de snapshots da0086. describeArenaAction fornece descrição/custo/nível/duração da carta, sem copiar fórmulas. AudioManager e catálogo de produção existentes preservam gesto/volume/mute. Sem engine, inventário, coleção, wallet, ledger, sistema de recompensas ou dependência novos.

## 3. Animações implementadas

Sequência: pronto → vibração/abertura650ms → subida/giro1000ms → centralização/pausa2000ms → virada/transição550ms → detalhes permanentes → próximo manual → resumo. A pausa acontece antes de mostrar a ficha; nenhum timer fecha a explicação. Carta gira no eixo vertical, mostra verso centralizado e vira. Equipamento sobe com giro suave, luz e partículas, para no centro e apresenta ficha.

Tampa articula recorte CSS da mesma imagem registrada, sem fingir existir asset aberto separado. Oito partículas fixas e brilho suave, sem flashes intensos/repetitivos. Efeitos usam transform/opacity; sem biblioteca de animação, loop JS por frame, canvas ou pacote de assets. Toque na cena/acelerar usa3×; Pular animação revela somente o prêmio atual. Alternativa estática e prefers-reduced-motion dispensam movimentos/esperas. Acelerar/pular não muda recibo, concessão ou ordem.

Modal em portal acima de HUD/menu, scroll próprio, controles48px, foco contido, Escape/fechar, devolução de foco quando o elemento anterior continua disponível, anúncios aria-live e rótulos além de cor. Próximo prêmio retorna ao topo. Fechar permite continuar pelo histórico; navegação é liberada e timers/scroll são restaurados.

## 4. Temas por raridade

| Raridade interna existente | Nome visual | Identidade da tela |
| --- | --- | --- |
| comum | Comum | Prata/cinza |
| incomum | Incomum | Verde |
| raro | Raro | Azul |
| épico | Épico | Roxo |
| lendário | Extraordinário, alias já usado pelo catálogo | Dourado |

Tema altera fundo da tela, halo, luz do baú, partículas, moldura, nome e acabamento do painel. Equipamento usa sua raridade real; moeda usa tema do baú sem receber raridade econômica própria. Não há mítica ou nova categoria econômica. Sons possuem pontos de integração por raridade, mas APPROVED_EFFECTS de produção está vazio: apresentação permanece silenciosa. Não foram baixados sons, criados arquivos sem licença ou reutilizados protótipos exclusivos da Arena. Homologação sonora é extensão posterior permitida pelo pedido, sem afirmar entrega de assinaturas sonoras distintas.

## 5. Cartas e equipamentos apresentados

Produto aceita somente moedas e equipamento realmente referenciado no registro legado open. Nomes/raridade/slot/arte/stats vêm do catálogo existente; campos desconhecidos, cartas ou schema estendido geram pendência de compatibilidade, sem inventar prêmio. O catálogo APPROVED_ARENA_CARDS permanece vazio. Contrato genérico de carta é exercitado exclusivamente por harness/fixtures em tests, com identificação explícita de demonstração e arte ainda não homologada; nenhuma carta falsa aparece como prêmio de produto.

Ficha de equipamento mostra nome, raridade, slot, +1 concedido pela operação, bônus e efeitos reais; comparação Atual/Novo/Diferença usa cálculo existente somente quando o item já está no inventário sincronizado. Caso contrário informa comparação pendente. Não adiciona item para simular posse e não equipa automaticamente. Parcela ofensiva/Poder não são prometidos como dano final fixo; caps/Defesa/condições/arredondamentos continuam descritos pela0086. Referências bíblicas são do componente anterior, sem texto narrativo novo. Novo/repetido e quantidade total não são estimados, pois o recibo não os fornece de modo confiável.

## 6. Persistência visual

Schema versionado por conta+Traveler: intent de abertura (UUID/tipo) e cursor (receiptId/operation_key/índice/quantos já apresentados/resumo). Não persiste recompensa, saldo, inventário ou token como prova de aquisição. Dados inválidos/quota são explícitos e preservados. Cursor é local e adulterável, sem sincronização entre aparelhos; só influencia leitura.

Reload consulta o mesmo registro do servidor antes de retomar o índice ou resumo. Batalha/Torre e outros checkpoints não são tocados. Histórico confirmado oferece Ver novamente sem nova RPC econômica. Se o storage visual estiver corrompido ou indisponível, uma leitura autenticada do histórico ainda permite rever em memória com aviso de que não pode salvar; bytes anteriores são preservados e nova abertura fica bloqueada. Nenhum descarte silencioso ou sorteio substituto.

## 7. Integração com recibos

Fluxo: intent durável → RPC open_chest existente → consulta do registro persistido exato → adapter validado → apresentação. A resposta isolada da RPC não é animada como prêmio confirmado; ledger ausente/incompatível ou falha de rede permanecem pendentes. Web Locks serializa conta/Traveler e ref evita duplo clique. Intent pendente impede nova identidade; reenvio é ação explícita que consulta primeiro e reutiliza o mesmo UUID se precisar chamar a RPC. Reload nunca reenvia automaticamente.

Recibo legado é objeto coins/itemId sem array ordenado. Adapter conserva ordem de apresentação definida coins→equipamento, já usada pelo painel anterior. Renderer consome a lista recebida sem reordenar. Múltiplas cartas/equipamentos/XP e identificação de duplicados precisarão de contrato homologado do servidor; não se inventa array ou XP no produto. Resumo contém apenas os prêmios do registro, diferenciados de pendência.

Modo offline legado sorteava no browser; o novo botão de abertura o bloqueia explicitamente e não chama openOwnedChest. Helpers/regras/saves legados continuam intactos, bem como compras existentes. Este é um gate de apresentação segura, sem mudar probabilidades/preços/saldos. Persistência visual não é transação distribuída nem substitui a idempotência/ownership do servidor. [Contrato visual e recuperação](TASK-0088-CHEST-RECEIPT-PRESENTATION.md).

## 8. Testes e resultados

Logs em `build/task-0088-chest-reveal/` ao lado do checkout; resultados/capturas em `checkout/build/task-0088-chest-reveal/`.

| Gate | Evidência |
| --- | --- |
| Unitários/integração/regressão | PASS:56testes/12arquivos, unit-visual-final.log, mais13rechecks UI PASS após ajuste final de faces/copy; adapter/negações, cursor/conta/Traveler/corrupção/quota, concorrência/retry/mesmo ID, pausa/virada/leitura manual, ordem/resumo, controles/reduced-motion/teclado, integração Mochila e regressões Baús/descritivos/equipamentos/Auth |
| Lint / TypeScript / build | PASS:lint-delivery.log, typecheck-delivery.log, build-face-final.log; compilação do produto com configuração pública sintética .invalid, gates de assets/áudio herdados preservados |
| Browser produto | SDK/DataAPI sintéticos com componentes reais:abertura confirmada/pausa2s/equipamento/comparação/reload/rever e abertura pendente/reload/consulta posterior, sem nova abertura econômica por animação |
| Browser carta | Harness isolado com renderer/descrições/storage reais, carta sintética explícita:subida/verso/virada/detalhes, cinco temas, reduced-motion/ordem/resumo/retomada, sem RPC/grant |
| Matriz/visual | PASS:9cenários,0falhas/skip/flaky/retry, e2e-face-final.log/browser-results.json; Chromium1440×900/320×740 e WebKit390×844; capturas de produto/comparação/resumo/pendência e carta/verso/temas inspecionadas; recheck de captura desktop1PASS em capture-recheck.log |
| Isolamento | production-fixture-scan.log após build final, sem marcadores de carta/harness no JS do produto |
| Preservação | scope-audit.json:engine/loot/probabilidades/economia/SQL/Auth/RLS/catálogos/Torre/contratos anteriores intocados; RPCs e compra equivalentes; raízes/refs/checkout0087 preservados |
| PostgreSQL/editorial bíblico | N/A:sem SQL/schema/RLS ou texto bíblico novo; referências existentes só reutilizadas |

QA e Security pelo autor, sem independência. Reworks preservados:lint inicial4erros/2avisos de refs/efeitos/img, corrigidos com eventos de efeito e callbacks; tipos iniciais já passavam. Primeiros34testes tiveram31PASS/3FAIL por cursor visual diferido, que podia perder índice ao fechar no mesmo frame; gravação tornou-se síncrona e34PASS, depois55PASS com regressões e56PASS após teste de histórico com storage corrompido. Browser inicial teve2PASS/1FAIL no harness por process ausente no Vite e foi interrompido antes de concluir a matriz; shim somente de teste corrigido,9PASS na rodada seguinte. Inspeção visual removeu descrição repetida/tipo técnico em inglês e ampliou captura da comparação; nova rodada final documentada no fechamento. Não ocultar falhas nem alegar teste físico/FPS/produção.

Apesar dos testes de fluxo positivos, a captura WebKit mostrou frente espelhada no lugar do verso durante holding. Correção CSS usa face estática explícita na pausa/detalhes e prefixo de backface WebKit; giro/virada continuam nas transições. Captura anterior preservada em webkit-before-face-fix.png;13testes UI, build final e matriz9PASS com asserção de orientação. Verso normalizado conferido visualmente; cinco temas rechecados com paint estabilizado (1browser desktop PASS extra). Não se declarou aceite visual apenas por9testes de fluxo passarem.

## 9. Arquivos alterados

Feature chest-reveal:adapter de recibos, máquina de estados, cursor/intent/locks, coordinator da RPC, renderer/CSS e quatro arquivos de testes. ChestPanel integra histórico/confirmação/retomada e substitui o modal antigo; Backpack passa identidade/chave. Repository recebe consulta somente leitura e teste de filtros. Teste Mochila atualizado conforme bloqueio de abertura local e fluxo confirmado. Playwright/config/harness/fixture próprios. Documentos0088:contrato visual, relatório, parecer de segurança, tarefa e memória. Lista completa e hashes no recibo final.

Nenhuma dependência/lockfile/engine/assets/áudio/SQL/rota/Auth/RLS/data/state/economia0078/Torre/contrato anterior alterados. next-env gerado pelo build é restaurado antes do commit.

## 10. Dependências de backend e limites

**Integral BLOCKED:** hardening/cutover e integração econômica0078, comprovação de RPC/ledger/ownership/isolamento/concorrência no ambiente hospedado, Auth/RLS e aparelhos reais. A estrutura existente de Baús oferece registro materializado, mas esta tarefa não executa ou valida banco remoto nem altera seu protocolo. Não declarar que segurança econômica global foi concluída por uma apresentação visual.

Cartas reais/arte/posse dependem de homologação e aquisição autorizadas, com futuro adapter de recibo. Pacote de som por raridade depende de assets/licenças aprovados; hooks silenciosos são a entrega atual prevista pelo pedido. Comparação depende da sincronização real do inventário. Nenhum XP/novo prêmio/raridade foi acrescentado. [Parecer de segurança](../security/TASK-0088-CHEST-REVEAL-SECURITY.md).

## 11. Checklist e status

Contrato único [TASK-0088](../../tasks/active/TASK-0088-chest-cinematic-reveal.md), implementação visual local testada e aceite integral BLOCKED. Vinte critérios do pedido mapeados na tarefa; gates e limitações explícitos. Memória raiz recebe somente uma entrada, preservando todos os bytes anteriores e os arquivos sujos do usuário. Commits locais, referências e evidências de preservação ficam no controle final/recibo.

Memória atualizada, prefixo conferido por comparação binária, SHA256 final `bdc5e825111430cc2dd0d8d30ef7f7e405ef5180c8389f382a657c0243bba9f4`. Root e refs locais permanecem iguais, checkout0087 continua limpo na base. Recibo registra hashes dos26arquivos da entrega, logs e capturas finais, sem segredos ou prêmio real.

## 12. Próxima etapa recomendada

Revisar o pacote local e resolver os gates econômicos/ambiente0078 por seu contrato vigente antes de publicação. Homologar cartas/aquisição/arte e o futuro contrato ordenado de prêmios antes de habilitar carta real. Homologar sons licenciados por raridade, depois validar percepção/performance em aparelhos reais. Não iniciar contexto09, PvP, novas recompensas ou geração de pacote de assets automaticamente. Sem operações remotas nesta entrega.
