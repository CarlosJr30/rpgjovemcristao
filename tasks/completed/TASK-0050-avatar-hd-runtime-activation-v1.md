# TASK-0050 — Avatar HD Runtime Activation V1

ID: TASK-0050
STATUS: DONE
PRIORITY: P2 Normal
OBJECTIVE: Preferir os 54 avatares HD aprovados (52 da fila +2 pilotos) no runtime normal, inclusive build local de produção, preservando fallback legado.
SCOPE: catálogo/manifest aprovado, cópia byte-exata dos PNGs existentes para public, resolver central, carregamento de imagens/retratos, consumidores e testes/evidências/documentação local.
OUT_OF_SCOPE: geração de imagens; Body-Fit/anchors/manifests/READY; combate/mechanics/economia/XP; saves/IDs/auth/conteúdo bíblico; dependências; remotos/push/deploy/Vercel/Supabase/migrations/destructive git.
DEPENDENCIES: TASK-0049 DONE, dois pilotos TASK-0048 HUMAN_VISUAL_APPROVED.
ASSIGNED_AGENT: agente principal assume Frontend/QA; sem delegação. Revisão do autor, não independente.
REQUIRED_CONTEXT: governança, Frontend/QA e skills locais; contrato anexado TASK-0050; resolver/runtime/retrato, fila e receipts aprovados.
SECURITY_CONSIDERATIONS: paths locais allowlisted, approval vinculada ao hash; sem auth/secrets/permissões/dependências/infra alterados. Revisão estrutural pelo autor, sem serviço externo.
ACCEPTANCE_CRITERIA:
- Auditoria antes da ativação e AVATAR_HD_RUNTIME_CONSUMERS com modos/origem/fallback.
- HD HUMAN_VISUAL_APPROVED em todos os consumidores normais; só imagem necessária, sem preload global.
- Ausente/corrompido/dimensão incorreta retorna legado; falha dupla mantém último fallback procedural existente.
- Todas52+2 resolvíveis, hash/approval/path/IDs sem duplicidade; imagens finais byte-exatas.
- Saves antigos/novos, male/female, três cabelos, tons/roupas/IDs preservados.
- Equipamentos/Arena/minigame/Guilda/Diário via resolver central, regras e Body-Fit intactos.
- QA seis viewports e representativos; performance real, requests/cache/CLS/LCP e limites registrados.
- Unit/E2E/lint/typecheck/build PASS; produção local HD/fallback e lab DEV indisponível.
TEST_PLAN: auditoria/catalog hashes/preservação; unit de resolver/renderer/portrait; E2E normal/switch/reload/fallback/saves/equipment/arena/minigame/seis viewports; regressões pertinentes; lint/typecheck/build; inspeção screenshots/performance.
DEFINITION_OF_DONE: todos os critérios com evidência PASS, ausência de regressão crítica/Body-Fit, docs e memória atualizadas; DONE não autoriza deploy.

## Autorização

Contrato anexado TASK-0050 autoriza explicitamente ações locais reversíveis e uso HD no build de produção após gates. Supersede DEV-only anterior para runtime aprovado; receipts/históricos de geração permanecem íntegros. Proibidos remotos, nova arte, alteração Body-Fit e saves.

## SELF VALIDATE / QA / ACCEPTANCE FINAL

TASK-0050 DONE. Runtime normal e build local de produção usam HD HUMAN_VISUAL_APPROVED: 54 identidades (52 da fila + 2 pilotos), sem pendências visuais ou bloqueios geométricos ativos. Catálogo central com hashes e receipts reais; 52 cópias PNG byte-exatas e dois pilotos preservados. Fallback legado → procedural, incluindo retrato com crop proporcional. Saves, IDs, engine, regras, Body-Fit, anchors e manifests preservados; nenhum READY promovido. Nenhum push, deploy ou serviço remoto.

Audit PASS: 800/815 arquivos preservados; 15 alterações autorizadas de runtime, testes, build e tipos gerados. Todas as imagens, legados e Body-Fit intactos. Unit global: 62 arquivos / 393 testes PASS; arquivo final: 14/14 PASS com dois novos casos. E2E produção: 44 PASS e 16 skips previstos por projeto/viewport; build final: 6/6 PASS; lab: 3/3 PASS nos cinco modos, seis viewports e DPR 1/2/3. Lint, typecheck e build PASS. QA pelo autor, não independente. Performance: 48 amostras pareadas, LCP HD 120–408 ms no hardware local, canvas igual ao legado e uma identidade por página, sem preload do pacote. CLS global do Shell e layout estreito da Arena também reproduzidos com legado; permanecem para etapa própria. Celular físico/rede limitada não medidos.

Aceite funcional e gates PASS; relatório de 26 itens e final-checks vinculam comandos e evidências. Security adicional N/A: sem auth, secrets, dependências, permissões ou infra alterados; paths e aprovação auditados pelo autor. Receipts humanos anteriores preservados; ativação autorizada separadamente pela TASK-0050 no manifest e fila. Limites de medição e questões de layout preexistentes registrados, sem alegar revisão independente ou performance global perfeita.
