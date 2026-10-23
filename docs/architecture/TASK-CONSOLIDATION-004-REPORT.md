# TASK-CONSOLIDATION-004 — autoridade econômica local

2026-10-20. **Segurança local implementada e demonstrada; integração hospedada, homologação e publicação BLOCKED.** QA/Security pelo autor, sem independência alegada. Nenhuma operação remota executada.

## 1. Branch e commit

Branch codex/consolidation-economy-authority-004, checkout D:/rpg-jovem-cristao/build/task-consolidation-004/checkout. Base003A limpa7f3e52b885caa6ae4a222f80e4f199b0290ea16e, implementação anteriorcd43a49b6c33fad953ce45ae8e93e772947444b3 e recibo003A conferidos. Implementação004 no commit1ce9523793f003e50ec528e12538c52a0feda209; fechamento posterior somente documental. HEAD final/hashes/estado limpo no recibo da raiz build/task-consolidation-004/final-receipt.json. Sem merge/fetch/push/main/deploy.

## 2–3. Auditoria e reprodução do P1

Baseline002 aplicado em PostgreSQL17.6.1.166 descartável sem rede/portas/binds, imagem já existente pull=never. Reproduzidos UPDATE próprio de XP99999/carteira99999, inserção de itemfake e claim de baú de fase sem evidência. Ensaio faz ROLLBACK e compara a linha/carteira originais após migrations: dados preservados, apenas economic_verified_atNULL acrescentado. RLS de ownership sozinho não impedia valores econômicos autodeclarados.

TASK0078 auditada no contrato raiz e checkout4b63c905d26132f42d84be26e19eda76f9166a23: fonte tem ledger, contexto/preços/recompensas e replay de transcrição, mas não rodadas persistidas nem sete cartas com provenance. EXPAND0009 reaproveitado sem alteração de instruções; CONTRACT0010 não foi aplicado/importado como cutover vigente. [Diferença e proposta precisa de revisão](CONSOLIDATION-004-CUTOVER.md). Contrato/pendências0078 intactos.

## 4–5. Correções e superfícies bloqueadas

Revogadas escritas de tabela e coluna em Traveler/XP/level/owner, wallet, stats, inventory, equipped, baús e históricos. SELECT próprio e edição cosmética continuam. RPCs genéricas antigas e gateway econômico/transcrição revogados; service_role somente no novo domínio privado. Clients não enviam snapshots econômicos; adapters antigos negam sem rede e a UI explica as pausas.

Jardim/recompensas locais, shop/troca de equipamento legados e exclusão de Traveler ficam explicitamente pausados online. Campos e saves antigos preservados. Contas/Travelers legados exigem reconciliação antes de usar valores como snapshot oficial ou comprar/abrir baú; novos Travelers têm alocação fixa existente confiável no servidor. Guilda/EBD mantêm approval/pending/permissões0082/0083; Story mantém gates individuais0081. Nenhum liquidante genérico novo nesses domínios.

## 6. Posse legítima de cartas

Catálogo privado aprovado/versionado vazio no SQL. Sete propostas003A permanecem propostas. Inventário existente ganha FK de aquisição/versão e revogação, ligados ao chest_operations existente e à conta/Traveler. Quantity/metadata/equipamento locais não comprovam posse. Coleção consultável pelo backend, isolada entre contas/Travelers; client oficial não importa saves locais.

Starter preparado uma vez por AuthUID/programa estável arena-starter-v1, independentemente de requestId/Traveler/revisão de catálogo. Trava conta, requer sete ações distintas aprovadas de uma versão, registra receipt e sete itens atomicamente. Só fixtures descartáveis contêm aprovação sintética, com IDs004-synthetic-card-*. Não há concessão real ou homologaçao automática. Revogação administrativa sem endpoint browser exige motivo/reviewRef, conserva histórico e invalida elegibilidade inclusive de rodada futura de batalha ativa.

## 7. Combate no servidor

[service.ts](../../apps/web/lib/authority/service.ts) valida entradas exatas e reaproveita createArenaDeckBattle/resolveArenaCommand. [Adapter server-only](../../apps/web/lib/authority/server.ts) verifica getUser, recusa anônimo, usa credencial exclusivamente de servidor e exige protocolo3. [POST /api/authority](../../apps/web/app/api/authority/route.ts) retorna erros genéricos/no-store, stream máximo16KiB e jamais aceita owner/HP/seed/winner/dano final.

DB lê/reconfirma contexto sob lock, gera UUID/seed, congela catálogo/regras/atributos/equipamentos e guarda estado/revisão/commands/commandIds no battles0078 existente. Uma batalha ativa por Traveler. Cada comando exige identidade, rodada/revisão, sete cartas legítimas e regras compatíveis; motor valida Foco/nível/uso único. Commit CAS une round/card/result/receipt/economia. Não há engine ou economia paralela.

## 8. Arena e Torre

Telas autenticadas agora usam [AuthoritativeArena](../../apps/web/features/arena-deck/authoritative-arena.tsx), com deck, treino NPC, Atacar/Defender/Cartas e retomada por consulta. UI só apresenta estado confirmado, reutiliza palco/descrições/animações/AudioManager; novo resultado consulta saldo, nunca altera coins/XP local para enviá-los. Ausência de credencial/protocolo bloqueia explicitamente, sem fallback.

Torre preserva sete NPCs/config permanente; backend exige andar próximo derivado de vitória canônica, derrota mantém andar, consultas/reload não premiam. Receipt registra resultado e prêmio blocked; nenhuma economia de Torre foi inventada. Checkpoints e modos demonstrativos anteriores permanecem separados e preservados, sem conversão oficial.

## 9. Idempotência e atomicidade

Starter: identity_key único por conta/programa. Start: requestId+digest ligado ao Traveler, duplicata igual recupera batalha, diferente conflita. Rodada: revisão/commandId, concorrentes deixam uma transição. Resultado: operation_key battle:UUID único, transação da última rodada junto ao crédito/receipt. Replay de ação encerrada ou commandId aceito nunca avança. Consulta/resume apenas lê.

Treino mantém8XP/3moedas, quota3vitórias por NPC/Traveler/diaUTC e bônus10ao cruzar200XP; bônus também aparece em levelBonusCoins do receipt sem mudar coins3 base. Baús mantêm preços/RNG/loot, com lock antes da leitura de duplicata. Falhas forçadas após UPDATE XP e em starter não deixam round/consumo/itens/saldo/receipt parcial; retry recupera. Prêmios sem regra/prova suficiente ficam bloqueados.

## 10. Migrations locais

[Lock004](../../packages/database/reviewed/consolidation-004.lock.json) referencia lock002 e hashes normalizados dos dois SQL: [EXPAND0078](../../packages/database/proposals/consolidation004-expand0078.sql) → [CONTRACT004](../../packages/database/proposals/consolidation004-authority.sql). Treze SQL002 originais/journal imutáveis. Teste verifica hashes antes de aplicar em banco vazio. Nenhum registro remoto/Drizzle de aplicação, down destrutivo ou tentativa de aplicar em alvo desconhecido. Ambientes já em0010 exigem revisão de compatibilidade própria.

## 11. Testes e resultados

| Gate | Evidência nova |
| --- | --- |
|PostgreSQL + serviço TS + boundary HTTP|**28PASS**, postgres-receipts-final.log, baseline13SQL+2propostas, identidades sintéticas, Auth port de teste; zero skip nesta execução opt-in RPG_LOCAL_PG=1|
|Unidade/integração/engine/cliente|**77PASS/11arquivos**, unit-initial.log; guards/adapters/UI intent/reload/engine/catalog/Foco/uso único/Torre/receipts/cache. Não somar rechecks como casos novos|
|Lint|Completo PASS/lint-final.log; arquivos de ensaio posteriores PASS/lint-rechecks.log|
|TypeScript|Completo PASS/typecheck-final.log; testes adicionados e raiz PASS/typecheck-test-rechecks.log; build final também verifica app|
|Build Production|PASS/build-final.log, env exclusivamente sintética.invalid, API incluída;963artefatos/0achado/8protótipos intactos|
|Browser produto|**3PASS**, browser-initial.log,0falha/skip/flaky/retry, Chromium1440/320 e WebKit390; Auth browser sintético, API real503semcredencial, saves preservados e sem overflow|
|Artefato|260JS/44JS públicos,0marcadores de fixture; nome da credencial ausente dos JS públicos. production-fixture-scan.json no build desta tarefa|
|QA/Security|Autor, [parecer e matriz25riscos](../security/CONSOLIDATION-004-SECURITY.md); captura WebKit inspecionada, sem alegar aparelho físico/avaliação independente|

Fluxo positivo local demonstrado por HTTP handler/serviçoTS→RPC com service_role de ensaio→PostgreSQL→resposta; UI positiva exercitada com transport sintético. Browser real comprova fronteira de indisponibilidade503 e ausência de fallback. **Não** é uma sessão completa positiva em Supabase/PostgREST/Auth hospedados.

Reworks conservados: import de fixture; nomes sintéticos inválidos/contagem Story; expectativa ignorava vida+1das botas; narrowing/phase React e assinaturas de teste. Rodadas19PASS/7FAIL e25PASS/1FAIL mantidas nos logs; corrigidos ensaios/contratos de tipo, sem enfraquecer fórmulas/ACLs. Revisão posterior acrescentou revogação com reviewRef, rollbackstarter e descrição explícita do bônus no receipt, com nova rodada28PASS sobre SQL congelado final.

## 12. Arquivos e preservação

Novos: duas propostas/lockSQL; serviço/adapter/client/guards/API e ensaios próprios; componente oficial; fixtures PG/browser, spec/config Playwright; relatório/cutover/parecer/contrato. Alterados: consumidores Arena/Torre, editor com mensagem de confirmação configurável, shellaviso, guards de estado, sync/repositórios e testes de adapters. Relação exata/hashes na auditoria e recibo final; next-env gerado restaurado após checks.

29worktrees anteriores, root/main/origin/main, nove arquivos pendentes raiz/sete0080, receipt003A e fonte0078 preservados por baseline e auditoria. Nenhum motor/NPC/balanceamento/asset/lockfile/dependência/contrato anterior alterado. Dependências copiadas com links@rpg próprios, sem instalação/upgrade. Memória raiz recebe só prefixo, mantendo bytes anteriores.

## 13. Dependências abertas

Supabase isolado ausente, SQL/config/Auth remotos não autorizados, aprovação real de catálogo/fontes/balanceamento pendente, reconciliação/backupB1/cutover0078 não executados, regras de prêmio Torre/Guilda/EBD/Story pendentes, CI e sessão entre aparelhos hospedados não validados. Nenhum push/publicação executado. Serviço de teste não usa chave real e não afirma JWT/ACL de produção validados.

## 14. Checklist e classificação

- [x] ECON-LEGACY reproduzido e corrigido no schema local com negativas reais.
- [x] Posse/starter/revogação, servidor por rodada, integração Arena/Torre e recibos atômicos implementados.
- [x]25riscos cobertos, concorrência/rollback/reload/legado testados, QA/Security/gates locais aprovados.
- [x] SQL revisável congelado, proposta de impacto0078 e recuperação explícitas, arquivos/refs/saves preservados.
- [x] Catálogo oficial bloqueado; zero proposta concedida ou promovida; nenhum dado/serviço remoto.
- [x] Segurança local: IMPLEMENTADA; funcionalidade sintética: DEMONSTRADA.
- [ ] Integração hospedada: BLOCKED.
- [ ] Homologação do catálogo/fontes: BLOCKED.
- [ ] Publicação: NÃO EXECUTADA/NÃO AUTORIZADA.

## 15. Próximo passo executável

Fechar commit/recibo004 limpo e preservar esta base. CONSOLIDATION005 recebida durante validação pode seguir em worktree própria para Mundo1/vídeos, sem alterar esta economia. Para futuro ambiente oficial, revisar proposta de cutover0078/reconciliação e homologação antes de solicitar operações remotas específicas; não executar qualquer recurso/SQL/deploy automaticamente.
