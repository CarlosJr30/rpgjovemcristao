# RPG-DEV-006 — Recuperação de Herói e Equipamentos

Data: 26/10/2026. **ACTIVE / em validação; produção preservada.** Branch isolada `codex/rpg-dev-006`, base `1a82d2c058b40b37ae4ae79b82c085bb3488c02b`. Nenhuma liberação de Arena, Torre, Loja, História, compras, baús ou recompensas faz parte desta tarefa.

## Estado inicial confirmado

Main/GitHub e URL oficial https://rpgjovemcristao-web-inky.vercel.app continuam em `1a82d2c`, deployment `dpl_CJFBMXjTKfm7nRt76FL8BLJLM87M`, production/READY. Encerramento UI-RESTORE-002 preservado em branch documental `codex/ui-restore-002-release-report`, commit `d98ef98`; PR11 já integrada. Esta tarefa exige nova PR, sem reabrir ou sobrescrever a anterior.

Supabase PROD `wspafhlbtlpabypzymjo` e TEST `wkdvdzfkbwvhyjmamrsg` ACTIVE_HEALTHY. PROD seis migrations, TEST 24. O RPC `set_owned_equipment` existe somente em TEST, com SQLSTATE PT409 e EXECUTE revogado pelo lançamento parcial. Seu corpo foi comparado com o candidato restaurado e coincide, sem alterar regras de propriedade, catálogo ou bloqueio por combate. RLS/ACLs e avisos de segurança foram inspecionados; mudanças Auth/RLS não são usadas para mascarar falhas.

Lidos RPG-DEV-001–004, UI-RESTORE-002 e política de release. O código existente é a fonte da recuperação; nenhuma reimplementação de inventário, compositor, atributos, autoridade ou sincronização. Baselines privados por contagem/hash de 36 conjuntos em cada ambiente capturados antes de qualquer mudança de banco desta tarefa.

## Recuperação no candidato

- Menu original passa a liberar somente Equipamentos além de Herói/Guilda/EBD, mantendo onze opções e sete módulos Em desenvolvimento. `GAMEPLAY_ENABLED=false`; autoridade econômica geral continua negada.
- Herói conserva o mesmo `AvatarRuntime`, HD, layout, atributos, slots e composições aprovadas. Acrescentado acesso ao gerenciador existente. A investigação confirmou que o compositor já estava conectado: não foi substituído nem redesenhado.
- Rota de Equipamentos reutiliza integralmente `EquipmentScreen`, dentro do shell original e acesso autenticado. A variante publicada sempre usa `changeOnlineEquipment`, inclusive se a sessão desaparecer; não recorre a equipar/desequipar localmente.
- Confirmação RPC e leitura fresca continuam precedendo atualização de avatar/atributos. Inventário é somente lido; o RPC muda apenas a seleção de item já pertencente ao ator. O cliente reconhece conflitos PT409 e preserva os controles anteriores de sessão/revisão.
- Migration nova, gerada pela CLI: `20261026122539_rpg_dev_006_owned_equipment.sql`. Reutiliza somente as duas funções de equipamento FIX-PROD-003, com PT409; abre EXECUTE somente para authenticated, sem liberar escrita direta, catálogo de teste, Arena ou outras migrations pendentes. O nome do perfil passa a `hero-equipment-006`. Exige baseline Guilda/EBD e protocolo3; não altera dados.

## Gates executados até agora

| Gate | Resultado |
| --- | --- |
| Unitários direcionados | 43 PASS. |
| Unitários integrais | Rodada final: 806 PASS / 84 SKIP. Dez novos PG são opt-in e foram executados separadamente; SKIP não é PASS implícito. |
| PostgreSQL isolado | 27 casos distintos PASS: nove equipamento anteriores, oito Guilda/EBD e dez novos cobrindo RPC ausente/preparado, concorrência, rollback, negações, recuperação das funções/ACLs e preservação. Os dez novos passaram na rodada final separada. |
| Lint | PASS na revisão final, incluindo o novo validador API. |
| TypeScript | PASS após remover opção Testing Library incompatível com os tipos. A falha inicial está preservada. |
| Build | PASS, incluindo nove PNGs/dez composições e isolamento de áudio. |
| Protocolo CI | 25 PASS. |
| Navegador local real da aplicação | 24/24 fluxos RSC sem erros, 134 checks UI em desktop/WebKit390/320/paisagem e48 checks Guilda/líder PASS. |
| Composições em navegador isolado | Quatro testes PASS, desktop/WebKit móvel, equipar/desequipar, variante explicitamente sintética, atributos e reload; nove PNGs/dez composições preservados. Não comprova troca real hospedada. |
| CI remoto, Preview e API positiva | Pendentes; não classificados PASS. |

O build inicial falhou porque Turbopack não aceita dependências ligadas a outra worktree fora da raiz. Resolvido com instalação local reproduzível do mesmo lockfile, sem atualização de dependências. Limpeza pelo próprio npm removeu somente o cache criado nesta tarefa após falta de espaço; arquivos, artes e trabalhos anteriores foram preservados.

A primeira matriz UI teve timeout de cinco segundos antes de confirmar a chegada à EBD em320px, sem erro de página ou console. Adicionado `waitForURL` do destino antes da assertion de conteúdo, sem desativar prefetch, aumentar timeout das assertions ou filtrar erros. A matriz integral seguinte passou; falha inicial preservada em `local-rsc-ui.log`. Não se apresenta uma barreira de navegação do teste como correção de transporte do produto.

## Limitações de aceite já encontradas

O catálogo preservado tem **um item por slot**; não existe segunda variante legítima para provar troca entre dois itens do mesmo tipo. TEST contém somente botas como equipamento e cartas de teste que permanecem bloqueadas. Não criar variantes, artes ou aquisição artificial para fabricar PASS. A troca sintética local anterior não substitui homologação real.

As três contas produtivas dedicadas existentes foram inspecionadas por login normal/leituras RLS e **nenhuma possui equipamento**, inclusive os avatares alternativos. Nenhum item foi concedido. Um teste positivo pós-publicação exigiria uma conta autorizada com itens legítimos e acesso disponível, sem alterar dados de outros jogadores apenas para testar. A investigação de acesso ainda não está concluída.

A Preview nova inicialmente não tinha `NEXT_PUBLIC_SUPABASE_URL` para esta branch; o gate detectou a ausência antes de qualquer chamada de banco. Configuração será exclusiva da branch Preview/TEST, sem alterar produção. Uma tentativa API de configuração falhou e não foi apresentada como aplicada.

O delta legado de **16 XP / 6 moedas continua sem proveniência**, sem ajuste manual nem alteração de `economic_verified_at`. Não é necessário reconciliar saldos para selecionar um equipamento já possuído; compras e recompensas permanecem negadas.

## Entrega e publicação

Commit/CI/URL Preview: pendentes. Nenhuma migration remota, merge ou promoção produtiva nesta etapa. Produção permanece no baseline confirmado. QA/Security/React/DevOps pelo próprio autor, sem revisão independente ou teste físico alegado. O aceite só será DONE após todos os gates do escopo; faltas críticas exigem BLOCKED/REWORK, mantendo produção intacta.

Arquivos alterados: release-scope, menu/shell, link do Santuário, rota/variante do EquipmentScreen, tratamento PT409, testes unitários/PG/fronteiras/browser, migration restrita, contrato/relatório/memória. Nenhuma arte, catálogo, atributo econômico, lockfile ou implementação Guilda/EBD/Auth foi modificada. Evidências privadas em `build/rpg-dev-006/`.
