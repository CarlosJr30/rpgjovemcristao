# TASK-0055 — Body-Fit V2 offline bake dos 15 restantes

Atualizado: 2026-10-08T23:47:33.260Z. Status: **DONE / BAKE_BATCH_COMPLETE / FIT_VALIDATION_COMPLETE**. Este status conclui somente o processamento/avaliação offline; não conclui integração runtime, aprovação humana nem rework das artes.

| Contagem | Total |
| --- | ---: |
| processed | 15 |
| TECHNICALLY_VALIDATED | 15 |
| MAPPED | 15 |
| MAPPING_ERROR | 0 |
| FIT_PASS | 5 |
| NEEDS_REWORK | 10 |
| HUMAN_BODY_FIT_REVIEW_PENDING | 5 |
| FIT_VALIDATION_PENDING | 0 |
| HUMAN_BODY_FIT_APPROVED | 0 |
| READY | 0 |
| runtimeActivated | 0 |

Os 5 FIT_PASS são candidatos técnicos **HUMAN_BODY_FIT_REVIEW_PENDING**. Carlos não aprovou nenhum dos15 nesta task. Os10 NEEDS_REWORK permanecem bloqueados para READY. O piloto TASK-0054 não foi reprocessado nem modificado.

## Referências por gênero

Feminino: female_short_moss_medium HD, SHA f260cb9b053b35c328025f1bc7ee602cbb30e57c71ba1f2238a4b1519685f460;7 targets,2 PASS e5 rework. Masculino: male_short_moss_medium HD, SHA b182c2e29b512b337891716a413ab7efaad737e23c6354779fae17fe19b8af34;8 targets,3 PASS e5 rework. Sem compatibilidade cross-gender ou validação das54 variantes.

## Transforms e SHA-256 por target

Transform x=tx+scale*x; y=ty+scale*y em canvas nativo. Rotation0° em todos; nenhuma escala independente/warp/máscara. Valores de resumo arredondados abaixo; precisão integral em metadata/manifest.

| Target | Avatar | Fit | tx | ty | Uniform scale | SHA-256 baked |
| --- | --- | --- | ---: | ---: | ---: | --- |
| armor_traveler_uncommon_male_v2 | male_short_moss_medium | FIT_PASS | 273.094238 | 214.180000 | 0.472208636 | 8ece1c5d4daad2b4b7b0a6d673eb3ad6e2d16a9bcc888082ee33a2bd71c928c2 |
| armor_traveler_rare_female_v2 | female_short_moss_medium | FIT_PASS | 295.623293 | 230.033625 | 0.446930504 | 58be3d1d95eeab11ac0a38d67f06ad88383d018e3720502d31dada7a9f2fc833 |
| armor_traveler_rare_male_v2 | male_short_moss_medium | FIT_PASS | 274.247723 | 216.149349 | 0.467768085 | cc96ad925b3c298a0e85f2cfeda2f1171130d83f6bd7c71080e1b43c87e7f0dd |
| helmet_traveler_rare_female_v2 | female_short_moss_medium | NEEDS_REWORK | 336.144077 | -39.215713 | 0.351899721 | 8ab265af7625024d18b9bce371aea993eaa378c4d641127930228882813144ef |
| helmet_traveler_rare_male_v2 | male_short_moss_medium | NEEDS_REWORK | 338.655237 | -27.816669 | 0.331986787 | 8fbbdf7afc106525713572b897edef3a3782eeb860eb40bab7606199c75c184e |
| boots_traveler_common_female_v2 | female_short_moss_medium | NEEDS_REWORK | 214.315310 | 742.423972 | 0.590524853 | ae56dd6d0b8e3d3dbbc126f7863736281cf2271734d434122733f1b14fc91dd6 |
| boots_traveler_common_male_v2 | male_short_moss_medium | NEEDS_REWORK | 198.255118 | 692.084154 | 0.616580716 | e0f392c934da8376e9ee4d5b54e31be1de1f2ab65dc3cb102bf8fce17a7c6049 |
| sword_path_common_female_v2 | female_short_moss_medium | NEEDS_REWORK | 141.514434 | 669.149634 | 0.443763666 | 2ce38d3ac68ac259cffa59e6067eefc2272486691d0eedd2a531d17ed4360d11 |
| sword_path_common_male_v2 | male_short_moss_medium | NEEDS_REWORK | 107.086078 | 288.209289 | 0.425791518 | 4b7c2c3f6b1798413b1bc7c1c8d700a09cca5e5ab0301ac027276dd0396050e8 |
| sword_path_rare_female_v2 | female_short_moss_medium | NEEDS_REWORK | 0.031302 | 690.372257 | 0.450602680 | b15f0d965098256c51557c3c00418b1bfe5bfb29260475c912f176ddad736965 |
| sword_path_rare_male_v2 | male_short_moss_medium | NEEDS_REWORK | -11.705468 | 695.113072 | 0.449996723 | 283f40926d2c012ed8517c8c8187b2f49a7a7f71b78939b1efe9b27851ffd09f |
| shield_perseverance_rare_female_v2 | female_short_moss_medium | FIT_PASS | 618.035209 | 492.110357 | 0.325726838 | 1d0392230985f18b22ff043083af121fb9f276d526a3e8ecf4b9c93135dabe02 |
| shield_perseverance_rare_male_v2 | male_short_moss_medium | FIT_PASS | 621.862171 | 501.736309 | 0.333974554 | bf0785671741851d4e64402984309cfc30ff80313da98cf453b3e3a57b40e2a6 |
| medallion_path_rare_female_v2 | female_short_moss_medium | NEEDS_REWORK | 448.331206 | 301.973670 | 0.140042471 | 74b84cdd74af6fb1d3df91c6fbf6f32e6cd05b08a5cd940d7ffb8bdf9f594f77 |
| medallion_path_rare_male_v2 | male_short_moss_medium | NEEDS_REWORK | 432.043370 | 303.033320 | 0.151979669 | c51e2652cd4d8b69f583beb59a8efd2d8c159d2e15506b090c2cf281fb1e0996 |

Todos PNG RGBA1024×1536, full-canvas e alpha real. Source original/cópia e referência vinculadas por SHA. Validade técnica não prova fit: os elmos têm clipping da coroa e a bota masculina clipping marginal; continuam NEEDS_REWORK.

## Resultado por slot

| Slot | Processados | FIT_PASS | NEEDS_REWORK |
| --- | ---: | ---: | ---: |
| armor | 3 | 3 | 0 |
| helmet | 2 | 0 | 2 |
| boots | 2 | 0 | 2 |
| weapon | 4 | 0 | 4 |
| shield | 2 | 2 | 0 |
| amulet | 2 | 0 | 2 |

Armor: ombros/peito/cintura/quadril alinhados com leitura de vestimenta, braços livres; roupa base residual nas laterais explicitada. Shield: oclusão frontal de mão/antebraço e rosto livre, mas tira traseira é invisível e não certificada. Helmet: recuperar a ponta cortada exige revisão da proporção/abertura, sem invadir olhos. Boots: altura/separação dos pés incompatíveis para um único scale; pés originais duplicados e baseline desviada. Sword: aproximação do cabo não produz pega com dedos abertos; comum masculina também cruza o tronco. Medallion: pingente centralizado, porém corrente entregue cortada termina abruptamente sobre cachecol; não aprovado como colar vestido.

## Review e evidências

[Review local](../../build/task-0055-body-fit-bake/review/index.html) (arquivo estático independente, pode ser aberto localmente; lab durante E2E em127.0.0.1:3109). Filtros gênero/slot/FIT_PASS/NEEDS_REWORK, oito vistas e zoom nativo. Não é rota de produção.

Cada diretório build/task-0055-body-fit-bake/{assetId}/ contém source.png, avatar_base.png, baked_overlay.png, {assetId}_baked.png, combined.png, overlay_50_50.png, alignment_guides.png, before.png, fit-metadata.json, fit-report.json, receipt.json e asset-check.json. Medalhões também têm armor_overlap.png (feminino usa piloto existente, masculino usa candidato não aprovado; diagnóstico de posição, não aprovação de conjunto). Nenhum PNG de origem foi corrigido.

[Manifest persistente com hashes, transforms, landmarks e receipts](TASK-0055-BAKED-ASSET-MANIFEST.json); [checks](TASK-0055-FINAL-CHECKS.json).

## Avaliação individual / landmarks

Coordenadas são observações visuais aproximadas (±12px HD,±20px source). Objetivos para ponta/ângulo de lâmina, extensão de escudo e janela facial não são anatomia escondida comprovada. Centros de pega traseira de escudo são proxies; resíduos não substituem inspeção. Nenhum transform do piloto foi lido/reutilizado.

### armor_traveler_uncommon_male_v2 — FIT_PASS

Avatar: male_short_moss_medium; metadata SHA 36a4c07153e3af3f1d98f73f973b7427a9527b7b00714161d78c7cf720ca2bf3; source SHA 7172c482d49902d1c268a98c3b5339950f7e5340c6c4e0e54bdbea42ffe80b32.

Peitoral, ombros e cinto acompanham a anatomia masculina; braços e mãos permanecem livres. Base mantém pequenos trechos da roupa/pochete original nas laterais; composição de camadas, sem alteração da base. Landmarks aproximados têm resíduos locais, registrados na metadata; não é encaixe pixel-perfect nem validação das demais variantes.

Regiões: {"neck_face":"PASS","shoulders":"PASS","chest":"PASS","armpits":"PASS","waist":"PASS","hips":"PASS","free_hands_forearms":"PASS","proportion":"PASS"}.

Diagnósticos: resíduo máximo 30.02px; pixels source alpha≥128 projetados fora do canvas 0; baseline delta N/Apx.

| Landmark | Source x,y | HD / objetivo x,y | Weight | Tipo | Resíduo px |
| --- | --- | --- | ---: | --- | ---: |
| neck | 514,205 | 510,303 | 0.5 | anatomical garment proxy | 9.87 |
| left_shoulder | 208,270 | 366,355 | 1 | anatomical garment proxy | 14.34 |
| right_shoulder | 815,270 | 646,355 | 1 | anatomical garment proxy | 17.89 |
| chest | 514,510 | 510,470 | 1 | anatomical garment proxy | 16.08 |
| left_armpit | 263,635 | 380,500 | 1 | anatomical garment proxy | 22.26 |
| right_armpit | 763,635 | 643,505 | 1 | anatomical garment proxy | 13.19 |
| waist | 504,865 | 518,620 | 3 | anatomical garment proxy | 7.40 |
| left_hip | 294,1110 | 395,735 | 1 | anatomical garment proxy | 17.25 |
| right_hip | 735,1110 | 650,735 | 1 | anatomical garment proxy | 30.02 |

Recomendação: Sem regeneração obrigatória no candidato técnico; Carlos deve revisar este hash no avatar indicado antes de qualquer READY.

[Evidência combinada](../../build/task-0055-body-fit-bake/armor_traveler_uncommon_male_v2/combined.png) · [50/50](../../build/task-0055-body-fit-bake/armor_traveler_uncommon_male_v2/overlay_50_50.png) · [Guides](../../build/task-0055-body-fit-bake/armor_traveler_uncommon_male_v2/alignment_guides.png) · [Metadata](../../build/task-0055-body-fit-bake/armor_traveler_uncommon_male_v2/fit-metadata.json) · [Fit report](../../build/task-0055-body-fit-bake/armor_traveler_uncommon_male_v2/fit-report.json).

### armor_traveler_rare_female_v2 — FIT_PASS

Avatar: female_short_moss_medium; metadata SHA ebaaa78b79aa1d780d8ab3f8dae17067eb91e84f497bce4aedfb6b6c66a40afc; source SHA dffb2c8c352f6b4ccd17049479d4d76917cac711c346c9ab685e57ac0434b209.

Peitoral feminino acompanha o tronco; cintura e saia têm leitura de armadura vestida. Base mantém pequenos trechos da roupa/pochete original nas laterais; composição de camadas, sem alteração da base. Landmarks aproximados têm resíduos locais, registrados na metadata; não é encaixe pixel-perfect nem validação das demais variantes.

Regiões: {"neck_face":"PASS","shoulders":"PASS","chest":"PASS","armpits":"PASS","waist":"PASS","hips":"PASS","free_hands_forearms":"PASS","proportion":"PASS"}.

Diagnósticos: resíduo máximo 33.22px; pixels source alpha≥128 projetados fora do canvas 0; baseline delta N/Apx.

| Landmark | Source x,y | HD / objetivo x,y | Weight | Tipo | Resíduo px |
| --- | --- | --- | ---: | --- | ---: |
| neck | 514,95 | 520,302 | 0.5 | anatomical garment proxy | 29.99 |
| left_shoulder | 201,293 | 379,346 | 1 | anatomical garment proxy | 16.32 |
| right_shoulder | 821,294 | 657,352 | 1 | anatomical garment proxy | 10.94 |
| chest | 514,430 | 520,455 | 1 | anatomical garment proxy | 33.22 |
| left_armpit | 275,603 | 391,492 | 1 | anatomical garment proxy | 28.54 |
| right_armpit | 750,603 | 646,499 | 1 | anatomical garment proxy | 15.19 |
| waist | 514,775 | 531,579 | 3 | anatomical garment proxy | 6.22 |
| left_hip | 288,1095 | 421,705 | 1 | anatomical garment proxy | 14.80 |
| right_hip | 742,1095 | 646,711 | 1 | anatomical garment proxy | 20.56 |

Recomendação: Sem regeneração obrigatória no candidato técnico; Carlos deve revisar este hash no avatar indicado antes de qualquer READY.

[Evidência combinada](../../build/task-0055-body-fit-bake/armor_traveler_rare_female_v2/combined.png) · [50/50](../../build/task-0055-body-fit-bake/armor_traveler_rare_female_v2/overlay_50_50.png) · [Guides](../../build/task-0055-body-fit-bake/armor_traveler_rare_female_v2/alignment_guides.png) · [Metadata](../../build/task-0055-body-fit-bake/armor_traveler_rare_female_v2/fit-metadata.json) · [Fit report](../../build/task-0055-body-fit-bake/armor_traveler_rare_female_v2/fit-report.json).

### armor_traveler_rare_male_v2 — FIT_PASS

Avatar: male_short_moss_medium; metadata SHA a5100fab263fb88b2393455626dc8a9214832b70e15f8560a05ddb354a39e995; source SHA fb36c83cce93fc31b4871af4ea9e14597c5f7c5bb5167e2287c0928c96975e0f.

Peitoral, ombros e cinto acompanham a anatomia masculina; braços e mãos permanecem livres. Base mantém pequenos trechos da roupa/pochete original nas laterais; composição de camadas, sem alteração da base. Landmarks aproximados têm resíduos locais, registrados na metadata; não é encaixe pixel-perfect nem validação das demais variantes.

Regiões: {"neck_face":"PASS","shoulders":"PASS","chest":"PASS","armpits":"PASS","waist":"PASS","hips":"PASS","free_hands_forearms":"PASS","proportion":"PASS"}.

Diagnósticos: resíduo máximo 32.87px; pixels source alpha≥128 projetados fora do canvas 0; baseline delta N/Apx.

| Landmark | Source x,y | HD / objetivo x,y | Weight | Tipo | Resíduo px |
| --- | --- | --- | ---: | --- | ---: |
| neck | 514,148 | 510,303 | 0.5 | anatomical garment proxy | 18.23 |
| left_shoulder | 200,293 | 366,355 | 1 | anatomical garment proxy | 2.54 |
| right_shoulder | 826,294 | 646,355 | 1 | anatomical garment proxy | 14.68 |
| chest | 514,505 | 510,470 | 1 | anatomical garment proxy | 18.24 |
| left_armpit | 272,660 | 380,500 | 1 | anatomical garment proxy | 32.87 |
| right_armpit | 747,660 | 643,505 | 1 | anatomical garment proxy | 27.73 |
| waist | 516,832 | 518,620 | 3 | anatomical garment proxy | 14.86 |
| left_hip | 280,1140 | 395,735 | 1 | anatomical garment proxy | 17.66 |
| right_hip | 742,1140 | 650,735 | 1 | anatomical garment proxy | 32.08 |

Recomendação: Sem regeneração obrigatória no candidato técnico; Carlos deve revisar este hash no avatar indicado antes de qualquer READY.

[Evidência combinada](../../build/task-0055-body-fit-bake/armor_traveler_rare_male_v2/combined.png) · [50/50](../../build/task-0055-body-fit-bake/armor_traveler_rare_male_v2/overlay_50_50.png) · [Guides](../../build/task-0055-body-fit-bake/armor_traveler_rare_male_v2/alignment_guides.png) · [Metadata](../../build/task-0055-body-fit-bake/armor_traveler_rare_male_v2/fit-metadata.json) · [Fit report](../../build/task-0055-body-fit-bake/armor_traveler_rare_male_v2/fit-report.json).

### helmet_traveler_rare_female_v2 — NEEDS_REWORK

Avatar: female_short_moss_medium; metadata SHA b299a3e9b04c4690d8fe45a17f3ffbe8b16d0fe9295e1ccdf86889494d56f840; source SHA 49a8a293aafae600a9e5bb4feddbf17b0a68572b6c8876aaab3ea22d4804d037.

A ponta da coroa sai do limite superior 0 do canvas e foi cortada pelo bake full-canvas. A abertura enquadra o rosto, mas as bordas frontais encostam na linha das sobrancelhas/olhos; cabelos da base continuam aparecendo lateralmente. Descer o elmo para recuperar a coroa agrava o contato com olhos; escala uniforme não resolve simultaneamente altura, têmporas e abertura.

Regiões: {"crown":"FAIL_CANVAS_CLIPPING","hairline":"NEEDS_REVIEW","temples":"NEEDS_REWORK","eyes_face":"NEEDS_REWORK","proportion":"NEEDS_REWORK"}.

Diagnósticos: resíduo máximo 31.84px; pixels source alpha≥128 projetados fora do canvas 2715; baseline delta N/Apx.

| Landmark | Source x,y | HD / objetivo x,y | Weight | Tipo | Resíduo px |
| --- | --- | --- | ---: | --- | ---: |
| crown | 514,55 | 520,4 | 1 | anatomical garment proxy | 24.05 |
| hairline | 513,514 | 520,110 | 1 | anatomical garment proxy | 31.84 |
| left_temple | 296,590 | 430,172 | 3 | anatomical garment proxy | 10.92 |
| right_temple | 735,590 | 602,172 | 3 | anatomical garment proxy | 8.06 |
| head_center | 514,575 | 520,151 | 0.5 | anatomical garment proxy | 12.49 |
| face_clearance | 514,752 | 520,210 | 0.5 | face-window placement goal | 15.70 |

Recomendação: Regenerar elmo sobre a referência HD female_short_moss_medium em canvas1024x1536, com coroa totalmente dentro do topo e abertura facial mais alta/larga; manter metal acima das sobrancelhas e olhos/nariz/boca livres. Encurtar altura da coroa e redesenhar abertura, sem deformar o avatar.

[Evidência combinada](../../build/task-0055-body-fit-bake/helmet_traveler_rare_female_v2/combined.png) · [50/50](../../build/task-0055-body-fit-bake/helmet_traveler_rare_female_v2/overlay_50_50.png) · [Guides](../../build/task-0055-body-fit-bake/helmet_traveler_rare_female_v2/alignment_guides.png) · [Metadata](../../build/task-0055-body-fit-bake/helmet_traveler_rare_female_v2/fit-metadata.json) · [Fit report](../../build/task-0055-body-fit-bake/helmet_traveler_rare_female_v2/fit-report.json).

### helmet_traveler_rare_male_v2 — NEEDS_REWORK

Avatar: male_short_moss_medium; metadata SHA 2fce428e648a1fd171b1b7d6c9f6be6da321dafda6e033dd5b7f10fd375cd4c5; source SHA c5e5a15cfeaa19c3ebff002480fa5f0c1b93b914c7c5604cc3b3d51d079590da.

A ponta da coroa sai do limite superior 0 do canvas e foi cortada pelo bake full-canvas. A abertura enquadra o rosto, mas as bordas frontais encostam na linha das sobrancelhas/olhos; cabelos da base continuam aparecendo lateralmente. Descer o elmo para recuperar a coroa agrava o contato com olhos; escala uniforme não resolve simultaneamente altura, têmporas e abertura.

Regiões: {"crown":"FAIL_CANVAS_CLIPPING","hairline":"NEEDS_REVIEW","temples":"NEEDS_REWORK","eyes_face":"NEEDS_REWORK","proportion":"NEEDS_REWORK"}.

Diagnósticos: resíduo máximo 38.16px; pixels source alpha≥128 projetados fora do canvas 4150; baseline delta N/Apx.

| Landmark | Source x,y | HD / objetivo x,y | Weight | Tipo | Resíduo px |
| --- | --- | --- | ---: | --- | ---: |
| crown | 512,15 | 510,3 | 1 | anatomical garment proxy | 25.87 |
| hairline | 512,530 | 510,110 | 1 | anatomical garment proxy | 38.16 |
| left_temple | 302,583 | 428,169 | 3 | anatomical garment proxy | 11.39 |
| right_temple | 728,582 | 590,169 | 3 | anatomical garment proxy | 10.31 |
| head_center | 513,567 | 510,151 | 0.5 | anatomical garment proxy | 9.48 |
| face_clearance | 513,735 | 510,209 | 0.5 | face-window placement goal | 7.27 |

Recomendação: Regenerar elmo sobre a referência HD male_short_moss_medium em canvas1024x1536, com coroa totalmente dentro do topo e abertura facial mais alta/larga; manter metal acima das sobrancelhas e olhos/nariz/boca livres. Encurtar altura da coroa e redesenhar abertura, sem deformar o avatar.

[Evidência combinada](../../build/task-0055-body-fit-bake/helmet_traveler_rare_male_v2/combined.png) · [50/50](../../build/task-0055-body-fit-bake/helmet_traveler_rare_male_v2/overlay_50_50.png) · [Guides](../../build/task-0055-body-fit-bake/helmet_traveler_rare_male_v2/alignment_guides.png) · [Metadata](../../build/task-0055-body-fit-bake/helmet_traveler_rare_male_v2/fit-metadata.json) · [Fit report](../../build/task-0055-body-fit-bake/helmet_traveler_rare_male_v2/fit-report.json).

### boots_traveler_common_female_v2 — NEEDS_REWORK

Avatar: female_short_moss_medium; metadata SHA b09a4f7e77bdd550402dff41f9626476a70d628a6ced3ea463b2ac757bf749f0; source SHA dfc523cddaf71075163b30f3d92f80b7c6d723d013ada40d18b70de1dbd52277.

O transform comum ao par aproxima a baseline, mas os pés não coincidem com a abertura da pose HD. Botas originais continuam aparecendo externamente como pés/calcanhares duplicados; novos canos sobem excessivamente para o joelho. Separação horizontal do par e altura vertical exigem escalas diferentes; splitting/non-uniform scale não autorizados.

Regiões: {"ankles":"FAIL","feet":"FAIL_DOUBLE_FOOT","baseline":"FAIL","occlusion":"FAIL_ORIGINAL_BOOTS_VISIBLE","proportion":"FAIL_PAIR_SPACING_HEIGHT"}.

Diagnósticos: resíduo máximo 186.77px; pixels source alpha≥128 projetados fora do canvas 0; baseline delta 19px.

| Landmark | Source x,y | HD / objetivo x,y | Weight | Tipo | Resíduo px |
| --- | --- | --- | ---: | --- | ---: |
| left_ankle | 340,1040 | 345,1300 | 1 | anatomical garment proxy | 90.07 |
| right_ankle | 683,1040 | 687,1300 | 1 | anatomical garment proxy | 89.50 |
| left_foot | 244,1195 | 290,1443 | 1 | anatomical garment proxy | 68.59 |
| right_foot | 791,1195 | 742,1443 | 1 | anatomical garment proxy | 60.79 |
| left_baseline | 228,1299 | 290,1495 | 2 | anatomical garment proxy | 60.72 |
| right_baseline | 790,1299 | 744,1495 | 2 | anatomical garment proxy | 64.82 |
| left_cuff | 330,383 | 365,1150 | 0.5 | anatomical garment proxy | 186.71 |
| right_cuff | 693,383 | 668,1150 | 0.5 | anatomical garment proxy | 186.77 |

Recomendação: Regenerar o par vestido diretamente sobre female_short_moss_medium usando os landmarks de tornozelo/pé/baseline registrados. Exportar somente as botas em full-canvas; cobrir os dois pés originais com as mesmas direções e distância. Não entregar par de inventário; não dividir/reescala cada pé para forçar fit.

[Evidência combinada](../../build/task-0055-body-fit-bake/boots_traveler_common_female_v2/combined.png) · [50/50](../../build/task-0055-body-fit-bake/boots_traveler_common_female_v2/overlay_50_50.png) · [Guides](../../build/task-0055-body-fit-bake/boots_traveler_common_female_v2/alignment_guides.png) · [Metadata](../../build/task-0055-body-fit-bake/boots_traveler_common_female_v2/fit-metadata.json) · [Fit report](../../build/task-0055-body-fit-bake/boots_traveler_common_female_v2/fit-report.json).

### boots_traveler_common_male_v2 — NEEDS_REWORK

Avatar: male_short_moss_medium; metadata SHA cd6228a3938d03c6dbc95366ed066c1da372f661106a48d7da4e0bb152977bce; source SHA bbfb5cfb3045181340daaedb5bdd87600190af8f11963de72f08ef9608fa8371.

O transform comum ao par aproxima a baseline, mas os pés não coincidem com a abertura da pose HD. Botas originais continuam aparecendo externamente como pés/calcanhares duplicados; novos canos sobem excessivamente para o joelho. Separação horizontal do par e altura vertical exigem escalas diferentes; splitting/non-uniform scale não autorizados.

Regiões: {"ankles":"FAIL","feet":"FAIL_DOUBLE_FOOT","baseline":"FAIL","occlusion":"FAIL_ORIGINAL_BOOTS_VISIBLE","proportion":"FAIL_PAIR_SPACING_HEIGHT"}.

Diagnósticos: resíduo máximo 206.30px; pixels source alpha≥128 projetados fora do canvas 80; baseline delta 22px.

| Landmark | Source x,y | HD / objetivo x,y | Weight | Tipo | Resíduo px |
| --- | --- | --- | ---: | --- | ---: |
| left_ankle | 325,1070 | 327,1310 | 1 | anatomical garment proxy | 82.96 |
| right_ankle | 703,1070 | 699,1310 | 1 | anatomical garment proxy | 79.23 |
| left_foot | 229,1270 | 260,1458 | 1 | anatomical garment proxy | 81.28 |
| right_foot | 799,1270 | 769,1458 | 1 | anatomical garment proxy | 79.96 |
| left_baseline | 220,1366 | 260,1513 | 2 | anatomical garment proxy | 76.92 |
| right_baseline | 800,1366 | 769,1513 | 2 | anatomical garment proxy | 80.36 |
| left_cuff | 313,413 | 356,1150 | 0.5 | anatomical garment proxy | 206.30 |
| right_cuff | 711,413 | 669,1150 | 0.5 | anatomical garment proxy | 205.83 |

Recomendação: Regenerar o par vestido diretamente sobre male_short_moss_medium usando os landmarks de tornozelo/pé/baseline registrados. Exportar somente as botas em full-canvas; cobrir os dois pés originais com as mesmas direções e distância. Não entregar par de inventário; não dividir/reescala cada pé para forçar fit.

[Evidência combinada](../../build/task-0055-body-fit-bake/boots_traveler_common_male_v2/combined.png) · [50/50](../../build/task-0055-body-fit-bake/boots_traveler_common_male_v2/overlay_50_50.png) · [Guides](../../build/task-0055-body-fit-bake/boots_traveler_common_male_v2/alignment_guides.png) · [Metadata](../../build/task-0055-body-fit-bake/boots_traveler_common_male_v2/fit-metadata.json) · [Fit report](../../build/task-0055-body-fit-bake/boots_traveler_common_male_v2/fit-report.json).

### sword_path_common_female_v2 — NEEDS_REWORK

Avatar: female_short_moss_medium; metadata SHA ef99090d8ec2b57702be2aa76cfac384f47427529e0c57b9760f83f38eeea97f; source SHA 03e3edbcf9572fae0cafc46b0a02eda045cbcdfe855dfcdf808e4aa8a5401d29.

Centro do cabo foi aproximado da mão esquerda da tela; dedos continuam abertos na pose HD. Overlay único desenha cabo sobre a mão sem a oclusão necessária dos dedos; arma parece sobreposta/solta. Lâmina diagonal atravessa a região da perna; posição coincide com o cabo mas não estabelece pega.

Regiões: {"hand_center":"ALIGNED_PROXY_ONLY","grip":"FAIL_OPEN_HAND","wrist":"NEEDS_REWORK","blade_angle":"PLACEMENT_ONLY","blade_extent":"IN_CANVAS","occlusion":"FAIL_HANDLE_IN_FRONT_OF_FINGERS"}.

Diagnósticos: resíduo máximo 31.61px; pixels source alpha≥128 projetados fora do canvas 0; baseline delta N/Apx; ângulo da lâmina 57.07° (atan2 da raiz até ponta em coordenadas imagem; rotação bake0).

| Landmark | Source x,y | HD / objetivo x,y | Weight | Tipo | Resíduo px |
| --- | --- | --- | ---: | --- | ---: |
| hand_center_grip | 205,300 | 231,803 | 8 | grip to screen-left hand anatomy | 1.65 |
| grip_guard | 269,403 | 260,851 | 1 | anatomical garment proxy | 3.14 |
| wrist_clearance | 165,225 | 240,750 | 0.5 | pommel/wrist clearance goal, hand remains unchanged | 31.61 |
| blade_root | 337,559 | 293,919 | 0.5 | blade placement goal | 2.64 |
| blade_extent | 940,1490 | 557,1330 | 0.5 | blade tip placement goal | 1.69 |

Recomendação: Regenerar espada na orientação e posição da mão de female_short_moss_medium, com cabo desenhado para a pose existente e oclusão transparente específica dos dedos/área da mão. Não redesenhar mãos/HD nem adicionar máscara runtime. Se a mão aberta impedir uma pega convincente sem mudar a base, manter NEEDS_REWORK e registrar a limitação, sem promoção.

[Evidência combinada](../../build/task-0055-body-fit-bake/sword_path_common_female_v2/combined.png) · [50/50](../../build/task-0055-body-fit-bake/sword_path_common_female_v2/overlay_50_50.png) · [Guides](../../build/task-0055-body-fit-bake/sword_path_common_female_v2/alignment_guides.png) · [Metadata](../../build/task-0055-body-fit-bake/sword_path_common_female_v2/fit-metadata.json) · [Fit report](../../build/task-0055-body-fit-bake/sword_path_common_female_v2/fit-report.json).

### sword_path_common_male_v2 — NEEDS_REWORK

Avatar: male_short_moss_medium; metadata SHA 3750e9326ad41cd961cfcef54e4d753d5f4921c95159400a9498320151d794db; source SHA ef4ca354506a7da6a9c80dcbb2b4d5388af7d11bef98fce9a81d8de6b40e8818.

Centro do cabo foi aproximado da mão esquerda da tela; dedos continuam abertos na pose HD. Overlay único desenha cabo sobre a mão sem a oclusão necessária dos dedos; arma parece sobreposta/solta. Lâmina diagonal sobe atravessando o tronco e termina próxima do pescoço; rotação ≤5° não reorienta a arte suficientemente.

Regiões: {"hand_center":"ALIGNED_PROXY_ONLY","grip":"FAIL_OPEN_HAND","wrist":"NEEDS_REWORK","blade_angle":"FAIL_TORSO_CROSSING","blade_extent":"IN_CANVAS","occlusion":"FAIL_HANDLE_IN_FRONT_OF_FINGERS"}.

Diagnósticos: resíduo máximo 84.39px; pixels source alpha≥128 projetados fora do canvas 0; baseline delta N/Apx; ângulo da lâmina -59.41° (atan2 da raiz até ponta em coordenadas imagem; rotação bake0).

| Landmark | Source x,y | HD / objetivo x,y | Weight | Tipo | Resíduo px |
| --- | --- | --- | ---: | --- | ---: |
| hand_center_grip | 265,1235 | 218,819 | 8 | grip to screen-left hand anatomy | 5.30 |
| grip_guard | 333,1115 | 247,766 | 1 | anatomical garment proxy | 3.57 |
| wrist_clearance | 200,1340 | 225,781 | 0.5 | pommel/wrist clearance goal | 84.39 |
| blade_root | 469,919 | 305,680 | 0.5 | blade placement goal | 1.85 |
| blade_extent | 985,46 | 530,300 | 0.5 | blade tip placement goal | 8.55 |

Recomendação: Regenerar espada na orientação e posição da mão de male_short_moss_medium, com cabo desenhado para a pose existente e oclusão transparente específica dos dedos/área da mão. Não redesenhar mãos/HD nem adicionar máscara runtime. Se a mão aberta impedir uma pega convincente sem mudar a base, manter NEEDS_REWORK e registrar a limitação, sem promoção.

[Evidência combinada](../../build/task-0055-body-fit-bake/sword_path_common_male_v2/combined.png) · [50/50](../../build/task-0055-body-fit-bake/sword_path_common_male_v2/overlay_50_50.png) · [Guides](../../build/task-0055-body-fit-bake/sword_path_common_male_v2/alignment_guides.png) · [Metadata](../../build/task-0055-body-fit-bake/sword_path_common_male_v2/fit-metadata.json) · [Fit report](../../build/task-0055-body-fit-bake/sword_path_common_male_v2/fit-report.json).

### sword_path_rare_female_v2 — NEEDS_REWORK

Avatar: female_short_moss_medium; metadata SHA 24ceef9120b3e92d10f22f0ed34136e0a3bbc55523a07b42687e7ffd9629e406; source SHA 5b445879d181b54e7a4f22761f63602cce83b15341255df8409d5b6b2f8a6ab8.

Centro do cabo foi aproximado da mão esquerda da tela; dedos continuam abertos na pose HD. Overlay único desenha cabo sobre a mão sem a oclusão necessária dos dedos; arma parece sobreposta/solta. Lâmina vertical fica em espaço lateral, porém a guarda/cabo ainda não reproduzem pega natural.

Regiões: {"hand_center":"ALIGNED_PROXY_ONLY","grip":"FAIL_OPEN_HAND","wrist":"NEEDS_REWORK","blade_angle":"PLACEMENT_ONLY","blade_extent":"IN_CANVAS","occlusion":"FAIL_HANDLE_IN_FRONT_OF_FINGERS"}.

Diagnósticos: resíduo máximo 3.82px; pixels source alpha≥128 projetados fora do canvas 0; baseline delta N/Apx; ângulo da lâmina 90.00° (atan2 da raiz até ponta em coordenadas imagem; rotação bake0).

| Landmark | Source x,y | HD / objetivo x,y | Weight | Tipo | Resíduo px |
| --- | --- | --- | ---: | --- | ---: |
| hand_center_grip | 513,250 | 231,803 | 8 | grip to screen-left hand anatomy | 0.19 |
| grip_guard | 513,350 | 231,848 | 1 | anatomical garment proxy | 0.21 |
| wrist_clearance | 513,145 | 235,756 | 0.5 | pommel/wrist clearance goal | 3.82 |
| blade_root | 513,580 | 231,952 | 0.5 | blade placement goal | 0.34 |
| blade_extent | 513,1515 | 231,1373 | 0.5 | blade tip placement goal | 0.19 |

Recomendação: Regenerar espada na orientação e posição da mão de female_short_moss_medium, com cabo desenhado para a pose existente e oclusão transparente específica dos dedos/área da mão. Não redesenhar mãos/HD nem adicionar máscara runtime. Se a mão aberta impedir uma pega convincente sem mudar a base, manter NEEDS_REWORK e registrar a limitação, sem promoção.

[Evidência combinada](../../build/task-0055-body-fit-bake/sword_path_rare_female_v2/combined.png) · [50/50](../../build/task-0055-body-fit-bake/sword_path_rare_female_v2/overlay_50_50.png) · [Guides](../../build/task-0055-body-fit-bake/sword_path_rare_female_v2/alignment_guides.png) · [Metadata](../../build/task-0055-body-fit-bake/sword_path_rare_female_v2/fit-metadata.json) · [Fit report](../../build/task-0055-body-fit-bake/sword_path_rare_female_v2/fit-report.json).

### sword_path_rare_male_v2 — NEEDS_REWORK

Avatar: male_short_moss_medium; metadata SHA 84675aab6d4f9e54b6ab91e481b740b4a6472600c6be7f19d1639872b18ca474; source SHA 89676a2f0f5b8ce73e25e6088ff52979115a11a091bbf25ce810b3c8488c96cb.

Centro do cabo foi aproximado da mão esquerda da tela; dedos continuam abertos na pose HD. Overlay único desenha cabo sobre a mão sem a oclusão necessária dos dedos; arma parece sobreposta/solta. Lâmina vertical fica em espaço lateral, porém a guarda/cabo ainda não reproduzem pega natural.

Regiões: {"hand_center":"ALIGNED_PROXY_ONLY","grip":"FAIL_OPEN_HAND","wrist":"NEEDS_REWORK","blade_angle":"PLACEMENT_ONLY","blade_extent":"IN_CANVAS","occlusion":"FAIL_HANDLE_IN_FRONT_OF_FINGERS"}.

Diagnósticos: resíduo máximo 6.12px; pixels source alpha≥128 projetados fora do canvas 0; baseline delta N/Apx; ângulo da lâmina 90.13° (atan2 da raiz até ponta em coordenadas imagem; rotação bake0).

| Landmark | Source x,y | HD / objetivo x,y | Weight | Tipo | Resíduo px |
| --- | --- | --- | ---: | --- | ---: |
| hand_center_grip | 511,275 | 218,819 | 8 | grip to screen-left hand anatomy | 0.28 |
| grip_guard | 512,393 | 218,872 | 1 | anatomical garment proxy | 0.69 |
| wrist_clearance | 511,151 | 224,761 | 0.5 | pommel/wrist clearance goal | 6.12 |
| blade_root | 512,622 | 218,975 | 0.5 | blade placement goal | 0.69 |
| blade_extent | 510,1518 | 218,1378 | 0.5 | blade tip placement goal | 0.29 |

Recomendação: Regenerar espada na orientação e posição da mão de male_short_moss_medium, com cabo desenhado para a pose existente e oclusão transparente específica dos dedos/área da mão. Não redesenhar mãos/HD nem adicionar máscara runtime. Se a mão aberta impedir uma pega convincente sem mudar a base, manter NEEDS_REWORK e registrar a limitação, sem promoção.

[Evidência combinada](../../build/task-0055-body-fit-bake/sword_path_rare_male_v2/combined.png) · [50/50](../../build/task-0055-body-fit-bake/sword_path_rare_male_v2/overlay_50_50.png) · [Guides](../../build/task-0055-body-fit-bake/sword_path_rare_male_v2/alignment_guides.png) · [Metadata](../../build/task-0055-body-fit-bake/sword_path_rare_male_v2/fit-metadata.json) · [Fit report](../../build/task-0055-body-fit-bake/sword_path_rare_male_v2/fit-report.json).

### shield_perseverance_rare_female_v2 — FIT_PASS

Avatar: female_short_moss_medium; metadata SHA 33d379d9e37714ef664ee2364f915455fe5262dd684d1061213ae1b1db26f0d3; source SHA 2722949386d675b27337dfe67a295b7be217dd17881a68a84b84800a0dbeb117.

Escudo ocupa região do antebraço direito da tela, oclui mão/bracelete frontalmente e mantém rosto livre. Contorno lateral e ponta inferior ficam dentro do canvas, com proporção coerente com o avatar. Montagem/pega traseira não está visível na source: alinhamento do antebraço é proxy visual; Carlos precisa confirmar leitura de escudo portado.

Regiões: {"hand_forearm":"PASS_FRONT_OCCLUSION_PROXY","torso_clearance":"PASS","face_clearance":"PASS","lateral_extent":"PASS","proportion":"PASS"}.

Diagnósticos: resíduo máximo 0.63px; pixels source alpha≥128 projetados fora do canvas 0; baseline delta N/Apx.

| Landmark | Source x,y | HD / objetivo x,y | Weight | Tipo | Resíduo px |
| --- | --- | --- | ---: | --- | ---: |
| hand_forearm | 512,700 | 785,720 | 3 | rear mounting proxy, hidden strap unverified | 0.23 |
| torso_clearance | 100,650 | 650,704 | 1 | inner edge placement goal | 0.63 |
| face_clearance | 512,24 | 785,500 | 1 | top placement goal below face | 0.21 |
| lateral_extent | 922,650 | 918,704 | 1 | outer edge placement goal | 0.39 |
| shield_tip | 512,1498 | 785,980 | 1 | lower extent placement goal | 0.20 |

Recomendação: Sem regeneração obrigatória no candidato técnico; revisão humana deve confirmar porte/oclusão no hash e avatar indicados, sem presumir tira traseira ou compatibilidade geral.

[Evidência combinada](../../build/task-0055-body-fit-bake/shield_perseverance_rare_female_v2/combined.png) · [50/50](../../build/task-0055-body-fit-bake/shield_perseverance_rare_female_v2/overlay_50_50.png) · [Guides](../../build/task-0055-body-fit-bake/shield_perseverance_rare_female_v2/alignment_guides.png) · [Metadata](../../build/task-0055-body-fit-bake/shield_perseverance_rare_female_v2/fit-metadata.json) · [Fit report](../../build/task-0055-body-fit-bake/shield_perseverance_rare_female_v2/fit-report.json).

### shield_perseverance_rare_male_v2 — FIT_PASS

Avatar: male_short_moss_medium; metadata SHA a8ba409dc9fd4f870688cee7210c6ad270d92dce8f374ca1b414764650724030; source SHA 94632b12aeb02547dfd98453f58f7cf40c3d143c1bfcc9b19bae19f75244809d.

Escudo ocupa região do antebraço direito da tela, oclui mão/bracelete frontalmente e mantém rosto livre. Contorno lateral e ponta inferior ficam dentro do canvas, com proporção coerente com o avatar. Montagem/pega traseira não está visível na source: alinhamento do antebraço é proxy visual; Carlos precisa confirmar leitura de escudo portado.

Regiões: {"hand_forearm":"PASS_FRONT_OCCLUSION_PROXY","torso_clearance":"PASS","face_clearance":"PASS","lateral_extent":"PASS","proportion":"PASS"}.

Diagnósticos: resíduo máximo 3.98px; pixels source alpha≥128 projetados fora do canvas 0; baseline delta N/Apx.

| Landmark | Source x,y | HD / objetivo x,y | Weight | Tipo | Resíduo px |
| --- | --- | --- | ---: | --- | ---: |
| hand_forearm | 512,713 | 793,739 | 3 | rear mounting proxy, hidden strap unverified | 0.87 |
| torso_clearance | 75,653 | 650,719 | 1 | inner edge placement goal | 3.20 |
| face_clearance | 512,24 | 793,510 | 1 | top placement goal below face | 0.29 |
| lateral_extent | 949,653 | 935,719 | 1 | outer edge placement goal | 3.89 |
| shield_tip | 512,1489 | 793,1003 | 1 | lower extent placement goal | 3.98 |

Recomendação: Sem regeneração obrigatória no candidato técnico; revisão humana deve confirmar porte/oclusão no hash e avatar indicados, sem presumir tira traseira ou compatibilidade geral.

[Evidência combinada](../../build/task-0055-body-fit-bake/shield_perseverance_rare_male_v2/combined.png) · [50/50](../../build/task-0055-body-fit-bake/shield_perseverance_rare_male_v2/overlay_50_50.png) · [Guides](../../build/task-0055-body-fit-bake/shield_perseverance_rare_male_v2/alignment_guides.png) · [Metadata](../../build/task-0055-body-fit-bake/shield_perseverance_rare_male_v2/fit-metadata.json) · [Fit report](../../build/task-0055-body-fit-bake/shield_perseverance_rare_male_v2/fit-report.json).

### medallion_path_rare_female_v2 — NEEDS_REWORK

Avatar: female_short_moss_medium; metadata SHA 8cc2fb11fbc520e259c58f7594533be330b42de463583d5b878f00b7165c745d; source SHA d4b114d305cb89901878a145f4c69745bcfd9c2b7683a7a123158758609e41f7.

Pingente fica centralizado no peito, acima da cintura, e a sobreposição com armadura foi composta como diagnóstico. Source tem as duas extremidades da corrente cortadas na borda superior; o bake deixa terminações abruptas visíveis sobre o cachecol/pescoço. Sem corrente fechada/continuação ou desenho de oclusão no PNG, não é possível certificar aparência de colar vestido.

Regiões: {"chest_center":"PASS","pendant_bottom":"PASS","armor_overlap":"PASS_PLACEMENT_ONLY","neck_attachment":"FAIL_CLIPPED_CHAIN","occlusion":"FAIL_CHAIN_ENDS"}.

Diagnósticos: resíduo máximo 0.21px; pixels source alpha≥128 projetados fora do canvas 0; baseline delta N/Apx.

| Landmark | Source x,y | HD / objetivo x,y | Weight | Tipo | Resíduo px |
| --- | --- | --- | ---: | --- | ---: |
| neck_center | 512,0 | 520,302 | 2 | open chain center at source top, neck attachment placement goal | 0.04 |
| left_chain | 155,0 | 470,302 | 2 | clipped chain endpoint | 0.05 |
| right_chain | 868,0 | 570,302 | 2 | clipped chain endpoint | 0.11 |
| chest_center | 512,880 | 520,425 | 1 | anatomical garment proxy | 0.21 |
| pendant_bottom | 512,1435 | 520,503 | 1 | anatomical garment proxy | 0.07 |
| armor_overlap | 512,1200 | 520,470 | 0.5 | pendant over breastplate placement goal | 0.04 |

Recomendação: Regenerar corrente completa no pescoço de female_short_moss_medium com terminação/oclusão desenhada para o cachecol ou colar da referência, sem segmentos abruptamente cortados. Preservar escala e posição do pingente registradas como boa aproximação; testar novamente base e armor overlap. Não esconder falha com máscara ou alteração da base/runtime.

[Evidência combinada](../../build/task-0055-body-fit-bake/medallion_path_rare_female_v2/combined.png) · [50/50](../../build/task-0055-body-fit-bake/medallion_path_rare_female_v2/overlay_50_50.png) · [Guides](../../build/task-0055-body-fit-bake/medallion_path_rare_female_v2/alignment_guides.png) · [Metadata](../../build/task-0055-body-fit-bake/medallion_path_rare_female_v2/fit-metadata.json) · [Fit report](../../build/task-0055-body-fit-bake/medallion_path_rare_female_v2/fit-report.json).

### medallion_path_rare_male_v2 — NEEDS_REWORK

Avatar: male_short_moss_medium; metadata SHA 410068b0a524ce820ff70fef841300c275e0474c5b2f40a95bed7d112da4513f; source SHA 2ef82d3b22ad557019f41529d6c7dcd155c641142f5012ac2dbf7b9bb58a4b8e.

Pingente fica centralizado no peito, acima da cintura, e a sobreposição com armadura foi composta como diagnóstico. Source tem as duas extremidades da corrente cortadas na borda superior; o bake deixa terminações abruptas visíveis sobre o cachecol/pescoço. Sem corrente fechada/continuação ou desenho de oclusão no PNG, não é possível certificar aparência de colar vestido.

Regiões: {"chest_center":"PASS","pendant_bottom":"PASS","armor_overlap":"PASS_PLACEMENT_ONLY","neck_attachment":"FAIL_CLIPPED_CHAIN","occlusion":"FAIL_CHAIN_ENDS"}.

Diagnósticos: resíduo máximo 1.38px; pixels source alpha≥128 projetados fora do canvas 0; baseline delta N/Apx.

| Landmark | Source x,y | HD / objetivo x,y | Weight | Tipo | Resíduo px |
| --- | --- | --- | ---: | --- | ---: |
| neck_center | 511,0 | 510,303 | 2 | open chain center at source top, neck attachment placement goal | 0.30 |
| left_chain | 202,0 | 463,303 | 2 | clipped chain endpoint | 0.26 |
| right_chain | 827,0 | 557,303 | 2 | clipped chain endpoint | 0.73 |
| chest_center | 512,890 | 510,438 | 1 | anatomical garment proxy | 0.33 |
| pendant_bottom | 512,1433 | 510,522 | 1 | anatomical garment proxy | 1.19 |
| armor_overlap | 512,1180 | 510,481 | 0.5 | pendant over breastplate placement goal | 1.38 |

Recomendação: Regenerar corrente completa no pescoço de male_short_moss_medium com terminação/oclusão desenhada para o cachecol ou colar da referência, sem segmentos abruptamente cortados. Preservar escala e posição do pingente registradas como boa aproximação; testar novamente base e armor overlap. Não esconder falha com máscara ou alteração da base/runtime.

[Evidência combinada](../../build/task-0055-body-fit-bake/medallion_path_rare_male_v2/combined.png) · [50/50](../../build/task-0055-body-fit-bake/medallion_path_rare_male_v2/overlay_50_50.png) · [Guides](../../build/task-0055-body-fit-bake/medallion_path_rare_male_v2/alignment_guides.png) · [Metadata](../../build/task-0055-body-fit-bake/medallion_path_rare_male_v2/fit-metadata.json) · [Fit report](../../build/task-0055-body-fit-bake/medallion_path_rare_male_v2/fit-report.json).

## Preservação / QA / Security / testes

315/315 arquivos protegidos PASS por SHA, incluindo piloto e metadata/receipts/evidências TASK-0054,54 HD,16 fontes,V1,arquitetura/anchors/IDs/sistemas/persistência. Save real do usuário não foi acessado nem migrado; regressão usa contextos Playwright isolados em3108, sem tocar origem127.0.0.1:3000. Piloto SHA ebee2f026c2dd6aac6b47850c8412f243cdc20c51a36d6f91e2d6cf3b46c20cb, READY somente staging, runtimePath null.

Validator bake/asset PASS15; unit44 PASS (inclui determinismo dos15 e rejeição de source/piloto/gênero inválidos, PNG vazio, gate humano); lab2E2E PASS6 viewports/8vistas/filtros/zoom e somente leitura; Portal7E2E PASS6viewports/equip/filter/compare/fallback; lint PASS; typecheck PASS. Build N/A pelo contrato explícito: nenhuma alteração TS/runtime. QA e Security pelo próprio autor, sem revisão independente alegada. Checks e receipts com timestamps reais.

Zero READY/aceite humano/ativação dos15, novo imagegen/instalação/remoto/push/deploy/Supabase/migration. Próximo passo: Carlos revisa os5 hashes candidatos; os10 reworks precisam de novo escopo e fonte refeita quando necessária, depois novo bake/validação. Esta task não executou regeneração nem integração.
