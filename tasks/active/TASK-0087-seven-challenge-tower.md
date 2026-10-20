# TASK-0087 — Torre dos 7 Desafios
ID: TASK-0087
TITLE: Sete andares com Arena existente e progresso local separado do oficial (contexto07/09)
OBJECTIVE: Torre ordenada, retomável e sem concessão econômica ou conquista oficial baseada no cliente.
PRIORITY: P2 Normal
STATUS: BLOCKED
SCOPE: Configuração de adversários, mapa/tela/rota Torre, adapter de sessão para ArenaExperience, namespace do storage Arena existente, progressão local por conta/Traveler, contratos de autoridade futura, testes/docs/memória próprios.
OUT_OF_SCOPE: Fórmulas/globais/IA/economia/TASK0078, catálogo/aquisição falsa, grants/XP/moedas/baús/conquista oficial, backend/SQL/Supabase, dependências/assets/overlays, main/merge/push/deploy/remoto/dados reais, contratos anteriores, PvP/ranking/semana/reset/animações08.
DEPENDENCIES: Base0086 limpa fc424ff (só docs após runtime34dde31b25a6ff9ef373e88c8eff1b6132ca3820); catálogo/posse legítima e backend/recibos pendentes.
ASSIGNED_AGENT: Autor assume Architect, Frontend, Backend, Game Designer, QA e Security no SCOPE, sem subagentes ou revisão independente.
REQUIRED_CONTEXT: AGENTS/GLOBAL/CURRENT/WORKFLOW/RULES/SECURITY/perfis/skills já lidos; pedido07 e contrato/relatório0086; ArenaExperience/V2/Stage/storage/IA/recompensa/snapshot/deck.
SECURITY_CONSIDERATIONS: Vitória local nunca oficial. API recebe comandos/IDs e deriva resultado por replay, não flag win; validates ordem/identidade/revisão/owner/snapshot. Nenhum caminho da Torre chama grant/claim de treino comum. Catálogo vazio bloqueia produto, fixtures só testes; local permanece adulterável.
ACCEPTANCE_CRITERIA:
- Sete adversários/configs e CP/HP/estratégias progressivos; mapa responsivo e chefe distinto sem regra nova.
- Reutilizar ArenaExperience/Stage/engine/IA/7cartas/3ações/Foco/equipamentos/descrições/histórico; batalha nova por andar e reset de usos apenas na nova identidade.
- Vitória libera só próximo; derrota mantém; duplicidade/stale negados; conta/Traveler isolados; checkpoint/reload sem auto-vitória nem nova recompensa.
- Toda UI identifica progresso demonstrativo/local e recompensas não concedidas; oficial exige servidor. Catálogo vazio preservado.
- Testes dos20critérios do pedido, regressão comum, lint/tipos/build/browser, docs/checklist/memória e aceite com provas.
TEST_PLAN: Config/benchmarks, serviço/ordem/resultado/concorrência/isolamento/corrupção/retomada/deck; integração ArenaExperience sem payout na Torre; browser produto vazio + harness positivo isolado desktop1440/mobile320/WebKit390; equivalência motor/economia. PostgreSQL N/A sem SQL.
DEFINITION_OF_DONE: Checks locais comprovados; integral BLOCKED por catálogo/backend/autoridade e aparelhos reais ausentes.

## Auditoria e decisões prévias
- MotorV2 sem mudanças:4perfis (Ágil, Ofensivo, Guardiã, Tático), decisões sobre estado comprometido, Foco0–3/especiais2/4/6/8/equipamentos. Resposta pela postura/vida/Foco/round existentes; não ler intenção futura do jogador.
- ArenaExperience já reúne visual/apresentação/persistência/payout de treino. Integrar modo local tipado, sem duplicar resolvedor e com branch que nunca liquida treino comum; revisar esse gate por teste com conta ativa.
- Storage/replay existente será instanciado em namespace de batalha da Torre, preservando chave legada. Progresso separado é checkpoint de modalidade, não inventário/carteira. Seleção vem do baralho existente; snapshot ativo é imutável.
- Resultado deriva de batalha encerrada replayada; interrupção entre salvar batalha e progresso deixa resultado pendente para confirmação explícita. Não converter flag local em recibo oficial. Sem reset/descarte silencioso.
- Configs da Torre são novos parâmetros autorizados somente desta modalidade, sem rebalancear Arena comum; usar perfis/gatilhos/equipamentos atuais e validar dificuldade por métricas/ensaios, sem prometer ordem universal para toda build.
- Chefe usa perfil tático e equipamentos existentes, nome/apresentação originais; sem asset/áudio novo ou violência gráfica. Arquitetura semanal só documental, sem relógio/reset automático.

## Checklist
- [x] Auditoria/base/contrato
- [x] Configuração e critérios de dificuldade
- [x] Mapa/Arena/chefe
- [x] Checkpoints/derrota/retomada/isolamento
- [x] Recompensas negadas/contrato oficial futuro
- [x] QA/Security/checks/relatório
- [x] Memória/controle final dos commits
- [ ] Catálogo/aquisição/backend autoritativo

## Self validate / QA / Security / aceite

Implementação demonstrativa local PASS; aceite integral BLOCKED. Autor realizou as revisões, sem independência. Logs preservados em build/task-0087-arena-tower ao lado do checkout; relatório de13itens em docs/architecture/TASK-0087-SEVEN-CHALLENGE-TOWER.md. Condição de desbloqueio: catálogo e aquisição homologados, autoridade/recibos e integração econômica0078 sob contrato próprio, validação hospedada e aparelhos reais. Sem autorização implícita para executar essas dependências.

| Gate | Resultado e prova |
| --- | --- |
| Unitário/integração/regressão | PASS:93testes/16arquivos, unit-final.log;12novos/3arquivos |
| Browser | PASS:6cenários,0falhas/skip/flaky/retry; Chromium1440×900/320×740 e WebKit390×844, e2e-final.log/browser-results.json |
| Visual | PASS no ambiente sintético: mapas do produto, batalha e final local; capturas desktop/mobile inspecionadas. Não é aparelho físico |
| Lint / tipos / build | PASS:lint-final.log, typecheck-final.log, build-final.log; rota Torre presente |
| Fixtures fora do produto | PASS:production-fixture-scan.log sobre JS compilado final |
| Escopo/compatibilidade | PASS:scope-audit.json; storage legado equivalente normalizado fora da factory, settle comum idêntico exceto recusa Torre, engine/pacotes/SQL/economia/contratos anteriores sem diff |
| Preservação | PASS:refs raiz/main/origin local e checkout0086 limpo intactos; hashes dos arquivos sujos do usuário preservados |
| Diff / secrets | PASS:git diff --check e revisão dos arquivos próprios, sem padrões de segredo real; só configuração pública sintética |
| Security | Revisão concluída, sem nova concessão oficial na Torre; aceite integral BLOCKED pela autoridade ausente e P1 herdado da Arena comum. Parecer TASK-0087-TOWER-SECURITY.md |
| PostgreSQL / editorial bíblico | N/A:sem SQL/RLS/schema ou texto bíblico; NPCs ficcionais originais |

Falhas levaram a REWORK antes desta rodada: fixture de cadência só defendia; benchmark detectou sexto mais fácil e exigiu calibrar apenas NPCs novos; espera da coleção no teste de componente; tipos de Web Locks/this da fixture. Primeiro browser5PASS/1FAIL teve reload Vite causado por edição concorrente do autor; checkpoint6/7/ativo preservado, fontes congeladas e rodada final6PASS. Detalhes e logs no relatório, sem ocultar falhas ou alegar validação remota.

## Aceite dos20critérios do pedido

| Critério | Evidência local |
| --- | --- |
|1.Ordem dos sete | config.test.ts, lista nominal e IDs únicos |
|2.Dificuldade | HP/poder/ofensiva crescentes, cadências reais e140combates/20sementes por andar; calibração inicial limitada à build documentada |
|3.Primeiro disponível | integração do mapa e browser real; entrada depende de sete cartas legítimas |
|4.Futuros bloqueados | integração/browser e rejeição de begin fora da ordem |
|5.Vitória libera só próximo | storage7vitórias, integração ArenaExperience e browser completo |
|6.Derrota mantém andar | storage.test.ts preserva vitória anterior e permite retry |
|7.Não duplica progresso | comandos concorrentes/finalização repetida, revisão única |
|8.IDs diferentes | storage e browser comprovam7UUIDs distintos e retry novo |
|9.Sete cartas preservadas | contrato de deck/snapshot e regressões arena-deck/product |
|10.Usos restaurados por batalha | storage e browser verificam0/7→1/7 em cada nova identidade |
|11.Sem repetir carta | rejeição no storage/motor e botãoUSADA no browser |
|12.Foco/nível | arena-deck.test.ts e arena-product.test.ts, carta rejeitada sem consumo |
|13.Equipamentos | regressões de equivalência do resolvedor/product/descriptions, snapshots NPC reais |
|14.Reload sem vitória automática | resultado pendente e recuperação órfã no storage; browser retoma mesmo UUID |
|15.Conta/Traveler isolados | storage verifica ambas identidades; browser troca contaA/B |
|16.Chefe encerra | storage7/7 e apresentação/final no browser |
|17.Sem recompensa não autoritativa | spies com conta ativa, claim=false e chaves sem economia no browser |
|18.Catálogo vazio | integração e browser do produto bloqueiam, sem carta fictícia |
|19.Desktop/celular | três projetos acima, inspeção visual e largura sem overflow |
|20.Arena comum | recorte de regressão93PASS e auditoria do algoritmo storage/settle |

São provas do modo local e do bloqueio oficial, não aceite de posse/combate/recompensa autoritativos ou balanceamento com cartas reais. Nenhum gate pendente é tratado como PASS.

## Controle final local

Implementação:170beefd2b3fc79c7e2e780bf56a5b67cb1b7866, branch codex/arena-seven-challenge-tower. Commit posterior altera somente este contrato e o relatório para registrar evidências. Memória de controle raiz atualizada por prefixo; todos os bytes anteriores preservados, SHA256 final0e6fb1e5e3b8aed676db0e2c08d6b25efe8c488b60994a472dbb41866b3dae1b. Recibo com HEAD final, hashes e resultados em build/task-0087-arena-tower/final-receipt.json, fora do versionamento. Status integral BLOCKED; implementação local PASS, nenhum push/deploy/merge/main/remoto executado.
