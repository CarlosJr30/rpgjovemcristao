# TASK-0049 — Avatar HD Full Asset Pack V1 — DONE

2026-10-07T23:40:29.685Z: Carlos Faustino aprovou os três candidatos finais e os dez critérios visuais. TASK-0049H FINAL_3_COMPLETE / HUMAN_VISUAL_APPROVED / DONE. TASK-0049 DONE no escopo do pack DEV. Fila: 52 HUMAN_VISUAL_APPROVED, 0 VISUAL_REVIEW_PENDING, 0 PENDING_HD, 0 BLOCKED_PATTERN ativo. Dois pilotos aprovados fora da fila: 54 identidades aprovadas no total. HD continua DEV-only/review local; produção/fallback continua legado; Body-Fit continua pendente, sem READY. Nenhuma integração ou geração nova, push, deploy ou alteração remota. Aprovação vinculada aos três hashes em docs/architecture/task-0049-final-3-rework/HUMAN-VISUAL-APPROVAL.json.

Conferência documental pelo autor: JSON/receipts/status, hashes e preservação dos outros 49 registros; evidência build/task-0049-final-3-rework/human-approval-verification.json. QA estrutural pelo autor, não independente. Checks técnicos anteriores preservados (geometry 5/5, detector 4/4, assets 4/4, lab 6/6, lint 8 PASS; TASK-0049 inicial E2E 4/4, typecheck/build PASS). Nesta confirmação lint/typecheck/build/unit/E2E N/A: somente metadados e textos, nenhum código runtime, imagem ou geometria alterados. Security adicional N/A: sem secrets/auth/dependências/permissões/infra alterados.

Relatório final: [TASK-0049H](TASK-0049H-FINAL-3-REWORK-REPORT.md). Receipts por lote e todos os históricos/rejeições permanecem preservados.

## Histórico da execução inicial — supersedido por R e batches B–H


**Status: BLOCKED_PATTERN.** A fila de 52 foi conferida, mas nenhuma geração passou Geometry Lock; a geração foi interrompida no primeiro avatar depois de duas tentativas consecutivas repetirem falhas fortes de geometria, como exige a regra de batching da task.

## Fila

52 identidades únicas, 52 paths HD únicos, zero duplicatas, zero pilotos na fila. Sexo, rosto pré-composto, cabelo, combinação roupa/tom de pele, path legado, path HD, status e prioridade em [AVATAR-HD-GENERATION-QUEUE.json](AVATAR-HD-GENERATION-QUEUE.json). Dois PNGs de tentativa foram gerados para 1 identidade; aceitos no catálogo/runtime: 0. male_curly_blue_light está REJECTED_GEOMETRY após 2 tentativas. Outros51 permanecem PENDING_HD; visual pending/approved: 0/0, pois ainda não foram gerados nem enviados para revisão.

## Tentativas do primeiro item

| tentativa | Dimensão PNG | Alpha real | Geometry Lock alpha ≥128 | falhas relevantes | IoU diagnóstico |
|---|---|---|---|---|---:|
| 1 | 1024×1536 | sim | FAIL | direita +14; pés −26; largura +15; centro X +6,5; centro Y −15; 9 métricas falharam | 0,9085 |
| 2 | 1024×1536 | sim | FAIL | esquerda −8; direita +13; pés −25; largura +21; centro Y −12,5; 10 métricas falharam | 0,8970 |

Pixels residuais alpha>0 foram registrados apenas como diagnóstico, conforme TASK-0048. Nenhum arquivo gerado foi copiado ao catálogo público. As duas imagens e overlays/diferenças existem apenas no diretório QA do item. A última medição está também nos nomes QA legacy_2x, hd_attempt_2_rejected, overlay_50_50_attempt_2, silhouette_difference_attempt_2 e geometry_metrics_attempt_2. A tentativa1 também alterou visivelmente o comprimento do cabelo cacheado; nenhuma aprovação visual foi presumida.

## Hashes/proveniência

- Tentativa 1: SHA-256 `966ff2e9988b89db3352e4f5a2d8073ba036b1f140ab8680f33b63f7481a52f2`, 2176608 bytes; prompt completo e metadados em geometry/male_curly_blue_light/final-metrics.json e em [prompts.json](../../build/task-0049-evidence/prompts.json).
- Tentativa 2: SHA-256 `6b3ed4c9b9cd9a0b2aca6f799163d8d85af8a54cf359e8af474d1220b09f29ee`, 2142807 bytes; prompt completo e metadados em geometry/male_curly_blue_light/rework2-metrics.json e em [prompts.json](../../build/task-0049-evidence/prompts.json).

Produzidas pelo imagegen built-in com fundo transparente solicitado e imagem legada como alvo, mais piloto masculino aprovado somente como referência de acabamento. Não se aplicou resize, crop, warp ou stretch. A fonte foi gerada nativamente e preservada byte a byte no diretório de evidências; rejeitada do runtime.

## Gates e preservação

- Runtime DEV: pilotos continuam DEV-only; nenhum dos 52 foi catalogado/ativado. O laboratório continua apto apenas para os dois pilotos anteriores.
- Produção: legado preservado; renderer, bundle e configuração de ativação não mudaram nesta task.
- Body-Fit: zero alteração/promoção READY.
- IDs, saves, anchors e 163 mídias legadas preservados por hashes da baseline TASK-0048; ambos pilotos preservados. [Evidência](../task-0049-evidence/preservation.json).
- Unit do auditor 5/5 PASS; E2E do piloto DEV 4/4 PASS; ESLint do auditor PASS; typecheck completo (workspaces + raiz) PASS e revalidação web/raiz após restaurar next-env PASS; build Next 20 rotas PASS. E2E confirma os dois pilotos e os modos reais existentes; não exercita 51 assets ainda não gerados. Logs de comando/resultados: build/task-0049-evidence/final-checks.json.
- Pendência humana: os 52 novos assets não foram enviados para aprovação; o usuário não aprovou qualquer imagem deste lote.

## Desbloqueio

Retomar somente após ajustar a abordagem de geração para respeitar a geometria pixel a pixel do legado, validar um novo candidato no mesmo gate alpha≥128 e evitar o padrão repetido de linha dos pés e largura. Não relaxar tolerâncias, não adaptar runtime e não usar legado ampliado como asset.
