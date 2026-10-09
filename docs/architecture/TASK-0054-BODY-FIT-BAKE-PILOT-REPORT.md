# TASK-0054 — Offline Body-Fit Bake Pilot

**DONE / PILOT_COMPLETE / FIT_PASS / HUMAN_BODY_FIT_APPROVED / READY (staging)**. Carlos Faustino aprovou explicitamente o piloto para seu hash e referência female_short_moss_mediumHD. Runtime não ativado; aprovação não se estende aos outros15 ou variantes HD. QA visual/técnico pelo autor, não revisão independente. Um único piloto e um único transform escolhido; geração de arte por IA zero e outros targets processados zero.

## Referências e output

- Item: traveler-armor-uncommon; gender female.
- Source SOURCE_VISUAL_APPROVED preservada: assets-source/body-fit-v2-targets/armor_traveler_uncommon_female_v2.png. SHA-256 564e2a4ebeaf51c41fd32dd7dca311dcc6d9c7cb4015d579d4f3b7f9d98714d1.
- HD imutável: apps/web/public/assets/avatar/hd/female/female_short_moss_medium_hd.png. SHA-256 f260cb9b053b35c328025f1bc7ee602cbb30e57c71ba1f2238a4b1519685f460.
- Candidato: D:/rpg-jovem-cristao/build/task-0054-body-fit-bake/pilot/armor_traveler_uncommon_female_v2_baked.png.
- Output PNG RGBA1024×1536 full-canvas, alpha real; SHA-256 ebee2f026c2dd6aac6b47850c8412f243cdc20c51a36d6f91e2d6cf3b46c20cb. Cópia byte idêntica baked_overlay.png na raiz do review.
- Alpha: 1417832 pixels0, 155032 parciais, 0 pixels255. Interior majoritariamente próximo de253 herdado da source. Bounding box alpha≥128: 304,256,744,817; apenas diagnóstico, não prova fit.

## Transform de produção offline

| Campo | Valor exato |
|---|---:|
| translateX | 292.35352583693054 |
| translateY | 197.66887904548992 |
| scale uniforme | 0.4535947236075799 |
| rotation | 0° |

Convenção: origem no topo esquerdo do canvas nativo; x'=tx+s(cosθ x−sinθ y), y'=ty+s(sinθ x+cosθ y). Nunca scaleX/scaleY independentes. Rotation preferida0, limite±5° no pipeline. Translation e scale estimados por least-squares sobre9 correspondências, peso3 na cintura/.5 no neck e1 nos demais. Sem máscaras, recorte de equipamento, perspectiva, warp, deformação anatômica, alpha de avatar ou mudança de pixels do HD.

Bake por inverse sampling e interpolação bilinear com alpha premultiplicado para preservar bordas, em destino transparente fixo1024×1536. Encoder PNG fixo: compressionLevel9, palettefalse, progressivefalse, adaptiveFilteringfalse; Sharp0.35.4/libvips8.18.6 existentes. Reprodutibilidade byte a byte demonstrada no ambiente registrado; versões futuras exigem revalidar. O CLI vincula source/HD a hashes e aceita apenas o piloto autorizado, não batch.

Comando: node scripts/body-fit-bake.mjs build/task-0054-body-fit-bake/pilot-settings.json. Recria apenas o derivado staging. Se o hash baked mudar, a avaliação anterior é invalidada para FIT_VALIDATION_PENDING; não herda FIT_PASS/aprovação. Não ajustar este candidato novamente nesta etapa após FIT_PASS.

## Landmarks

Pixels nativos, left/right do observador (lado da tela), aproximação manual±12px no HD/±20px na roupa vazia. São proxies anatômicos visíveis, não medida de anatomia oculta ou certificação pixel-perfect. A fonte é uma ilustração vazia; cintura/pads/aberturas/tassets permitem correspondência. O aceite humano foi fornecido por Carlos para este output/hash e referência.

| Landmark | Source X,Y | HD X,Y | Projetado X,Y | Residual px |
|---|---|---|---|---:|
| neck_center | 513,252 | 520,302 | 525.05,311.97 | 11.18 |
| left_shoulder | 210,310 | 379,346 | 387.61,338.28 | 11.56 |
| right_shoulder | 813,312 | 657,352 | 661.13,339.19 | 13.46 |
| chest_center | 513,548 | 520,455 | 525.05,446.24 | 10.11 |
| left_armpit | 263,640 | 391,492 | 411.65,487.97 | 21.04 |
| right_armpit | 764,640 | 646,499 | 638.90,487.97 | 13.12 |
| waist_center | 514,873 | 531,579 | 525.50,593.66 | 15.65 |
| left_hip | 291,1120 | 421,705 | 424.35,705.69 | 3.42 |
| right_hip | 734,1120 | 646,711 | 625.29,705.69 | 21.38 |

## Fit visual do piloto

A composição nativa e50/50 mostram armadura vestida, com volume do peito, caps apoiados e cintura na região corporal adequada. Resíduos3.42–21.38px são diagnósticos de proxies e não foram usados como um gate automático de aprovação. A cintura tem deslocamento projetado~14.66px baixo/5.50px esquerdo; visualmente o cinto original central fica encoberto e o novo cinto segue a cintura. Carlos aprovou explicitamente cintura e aparência corporal geral nesta confirmação; os resíduos diagnósticos continuam registrados sem relabelar a medição. A gola alta envolve a base do pescoço e deixa rosto/queixo livres.

| Região | Resultado pelo autor | Observação |
|---|---|---|
| shoulders | PASS | Scaled shoulder caps follow native shoulder line with modest equipment bulk, no floating giant pauldrons. |
| chest | PASS | Curved ornamental plate volume aligns chest rather than extending through abdomen; original materials/cross retained. |
| armpits | PASS | Short shoulder/sleeve equipment overlays upper fabric coherently; open lower arm articulation, no forearm coverage. |
| waist | PASS | Source belt projects to native waist region; landmark residual15.7px, original central buckle covered by baked leather belt, no second waist displaced to hands. |
| hips | PASS | Tassets follow hip/tunic region, final bottom approx817; no inappropriate leg armor. |
| faceNeck | PASS | Face/chin clear; high source collar wraps neck base naturally without invading face. Not a requirement for all lower neck pixels to remain uncovered. |
| handsLegs | PASS | Both hands/forearms and lower legs/feet untouched; equipment restricted to upper body and hip tabs. |
| identity | PASS | Original source details preserved: green/cream/gold, cross, leaf ornament, leather belt and asymmetrical pouches; no parts removed or redrawn. |
| silhouette | PASS | In native combined evidence, reads as worn armor with chest curvature, shoulders and a coherent waist, rather than a giant inventory illustration. |

A análise técnica FIT_PASS recebeu agora HUMAN_BODY_FIT_APPROVED de Carlos Faustino e READY exclusivamente em staging. A avaliação é válida somente para este output/hash e female_short_moss_medium; os outros53 variantes/15 targets não foram compositados ou aprovados aqui.

## DEV lab e evidências

build/task-0054-body-fit-bake contém source.png/avatar_base.png (cópias byte a byte), baked_overlay.png, before.png, combined.png, overlay_50_50.png, alignment_guides.png, fit-metadata.json, fit-report.json, pilot-settings.json, review/index.html, asset-check.json e preservation-before/after.json. Evidence full-canvas1024×1536 sem screenshots com arredondamento de tamanho. Review apresenta sete vistas; Zoom35%/100% nativo; editor separado com X/Y/uniform scale/rotation/opacity/before-after/guides/reset/export metadata.

URL local: http://127.0.0.1:3109/build/task-0054-body-fit-bake/review/index.html. Editor usa transform SOMENTE no canvas de rascunho offline. A apresentação do baked usa top0/left0/width100%/height100%/transform:none, comprovada em seis viewports. Controles/export não mudam o hash do PNG baked nem escrevem runtime. Não há endpoint de gravação ou bake remoto. CLI local é etapa explícita de produção do derivado; qualquer alteração exige revisão nova.

## Checks

| Check | Resultado |
|---|---|
| Asset/fit receipt — node scripts/body-fit-bake-check.mjs | PASS: CRC/PNG RGBA/nativo/hashes/report vinculado/gate fechado/285preservados |
| Unit bake + validators | 23 PASS:8 bake e15 source/mapping/READY; inclui determinismo, source intacta, coordenadas, nonuniforme/hash falso rejeitados, fit antigo invalidado por hash novo |
| E2E Lab — playwright.body-fit-bake-lab.config.mjs | 2 PASS:7 vistas/6 viewports/zero transform no baked/controles/metadata export/reset/bytes inalterados |
| Isolamento — playwright.body-fit-bake-production.config.mjs | 2 PASS:5 rotas404 e lab recusa NODE_ENVproduction |
| Portal desktop — Missing artwork | 1 PASS:avatar fallback/equip/comparison |
| npm run lint | PASS |
| npm run typecheck | PASS |
| Build | N/A conforme contrato: nenhum TS/runtime de produção alterado; regressão sobre build vigente |
| Preservação | 285/285 SHA PASS,281 protegidos históricos+4 pilotos0053;54HD/16sources/V1/arquitetura/saves/IDs/sistemas intactos |
| Security | PASS pelo autor, docs/security/TASK-0054-body-fit-bake-review.md |

As falhas iniciais de teste foram corrigidas: tolerância de float para resultado analítico1e−16, identificação explícita dos selects e valor de slider com zero inicial. Nenhum ajuste do transform/PNG foi feito para passar os testes. Testes afetados repetidos com PASS. Nenhuma geração imagegen, instalação, Vercel/Supabase/migration, push/deploy ou alteração remota.

## Continuidade

Pipeline offline completo; tarefa DONE/PILOT_COMPLETE/FIT_PASS/HUMAN_BODY_FIT_APPROVED. READY1 somente em staging, aprovação corporal humana1, ativação0, outros15processados0. Fonte original mantém seu estado anterior; resultado novo é derivado staging, não substituição do original. TASK-0052B/0053 históricas não foram relabeladas.

Carlos já aprovou este piloto. A confirmação não autoriza processar os outros15. Em uma etapa futura autorizada, reutilizar o algoritmo/metadata/gates, mas definir landmarks e transform por item/gênero/source; não copiar scale0.45359 ou translation deste piloto indiscriminadamente. Não há prova de fit dos demais targets ou todos os HD por este único resultado. Cada derivado precisará de validação técnica/fit/revisão humana própria.

## 2026-10-08T07:35:44.885Z — Human Body-Fit Approval / READY

Carlos Faustino aprovou explicitamente ombros, peito, axilas, cintura, quadril, pescoço/rosto, mãos/braços livres, silhueta, proporção e aparência de armadura vestida. Aceite vinculado somente ao asset armor_traveler_uncommon_female_v2_baked.png, SHA ebee2f026c2dd6aac6b47850c8412f243cdc20c51a36d6f91e2d6cf3b46c20cb, avatar female_short_moss_mediumHD/female e SHA de avatar f260cb9b053b35c328025f1bc7ee602cbb30e57c71ba1f2238a4b1519685f460.

HUMAN_BODY_FIT_APPROVED / READY somente em staging; runtimePath null/runtimeActivated false. Gate técnico revalidado antes e depois: CRC/PNG/RGBA/1024×1536/alpha/hashes/FIT_PASS/mapping/preservação285 PASS;24 unit/2 E2E Lab/lint PASS nesta confirmação. Aprovação inválida para outro hash/metadata/avatar/gênero/item. Não muda gates/arquitetura/runtime nem presume aprovação dos outros15.

Receipt persistente docs/architecture/TASK-0054-HUMAN-BODY-FIT-APPROVAL.json; manifest docs/architecture/TASK-0054-BAKED-ASSET-MANIFEST.json, exatamente1 asset READY compatível apenas com female_short_moss_medium. Metadata bake permanece byte idêntica (8511d318ac79a28f3c0813e2225d0ae5e4cd9d89a9964a3ea4a6dd1db38317fc); flags antigas false nessa metadata são histórico mecânico pré-aceite, não status atual. Estado atual vem do receipt humano, fit-report e manifest aprovado separados. Nenhum rebake/source/HD/saves/IDs/mecânica/runtime/produção/remoto alterado.

TASK-0054 DONE / PILOT_COMPLETE / HUMAN_BODY_FIT_APPROVED. Outros15processados0. Próxima expansão só em escopo futuro explícito; não autorizada por esta confirmação.
