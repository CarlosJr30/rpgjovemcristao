# TASK-0049D — Avatar HD Full Pack — Batch 3

**BATCH_3_COMPLETE / HUMAN_VISUAL_APPROVED.** Aprovação explícita de Carlos Faustino registrada em 2026-10-07T17:27:15.528Z; [receipts consolidados](task-0049-batch-3/HUMAN-VISUAL-APPROVAL.json) e individuais em receipts/{assetId}.json. Validação técnica BATCH_3_TECHNICALLY_COMPLETE preservada. Registro em 2026-10-07T17:04:51.907Z. Oito candidatos finais 13/13 PASS, 14 gerações, seis rejeições preservadas. Nenhum BLOCKED_PATTERN ou nono asset. Autorização de geração deste lote encerrada.

## 1. Oito assets selecionados

[BATCH_3_SELECTION](task-0049-batch-3/BATCH_3_SELECTION.json): primeiros oito PENDING_HD na fila oficial, sem pular. Pilotos, TASK-0049R e Batch 1/2 aprovados excluídos.

- male_long_moss_dark: gênero male; cabelo long; rosto precomposed; legacy face IDs 1/2/3 preserved, not independently selectable; legado `/assets/avatar/runtime/male/male_long_moss_dark.png`; hdPath planejado `/assets/avatar/hd/male/male_long_moss_dark_hd.png` (não publicado).
- male_long_blue_medium: gênero male; cabelo long; rosto precomposed; legacy face IDs 1/2/3 preserved, not independently selectable; legado `/assets/avatar/runtime/male/male_long_blue_medium.png`; hdPath planejado `/assets/avatar/hd/male/male_long_blue_medium_hd.png` (não publicado).
- male_long_moss_medium: gênero male; cabelo long; rosto precomposed; legacy face IDs 1/2/3 preserved, not independently selectable; legado `/assets/avatar/runtime/male/male_long_moss_medium.png`; hdPath planejado `/assets/avatar/hd/male/male_long_moss_medium_hd.png` (não publicado).
- male_long_ochre_dark: gênero male; cabelo long; rosto precomposed; legacy face IDs 1/2/3 preserved, not independently selectable; legado `/assets/avatar/runtime/male/male_long_ochre_dark.png`; hdPath planejado `/assets/avatar/hd/male/male_long_ochre_dark_hd.png` (não publicado).
- male_curly_moss_light: gênero male; cabelo curly; rosto precomposed; legacy face IDs 1/2/3 preserved, not independently selectable; legado `/assets/avatar/runtime/male/male_curly_moss_light.png`; hdPath planejado `/assets/avatar/hd/male/male_curly_moss_light_hd.png` (não publicado).
- male_long_ochre_medium: gênero male; cabelo long; rosto precomposed; legacy face IDs 1/2/3 preserved, not independently selectable; legado `/assets/avatar/runtime/male/male_long_ochre_medium.png`; hdPath planejado `/assets/avatar/hd/male/male_long_ochre_medium_hd.png` (não publicado).
- male_long_ochre_light: gênero male; cabelo long; rosto precomposed; legacy face IDs 1/2/3 preserved, not independently selectable; legado `/assets/avatar/runtime/male/male_long_ochre_light.png`; hdPath planejado `/assets/avatar/hd/male/male_long_ochre_light_hd.png` (não publicado).
- female_curly_blue_dark: gênero female; cabelo curly; rosto precomposed; legacy face IDs 1/2/3 preserved, not independently selectable; legado `/assets/avatar/runtime/female/female_curly_blue_dark.png`; hdPath planejado `/assets/avatar/hd/female/female_curly_blue_dark_hd.png` (não publicado).

## 2. Tentativas por asset

| Asset | Tentativas | Resultado por tentativa | Final |
|---|---:|---|---|
| male_long_moss_dark | 1 | 1: 13/13 | GEOMETRY_PASS |
| male_long_blue_medium | 2 | 1: 12/13; 2: 13/13 | GEOMETRY_PASS |
| male_long_moss_medium | 3 | 1: 9/13; 2: 8/13; 3: 13/13 | GEOMETRY_PASS |
| male_long_ochre_dark | 1 | 1: 13/13 | GEOMETRY_PASS |
| male_curly_moss_light | 1 | 1: 13/13 | GEOMETRY_PASS |
| male_long_ochre_medium | 2 | 1: 9/13; 2: 13/13 | GEOMETRY_PASS |
| male_long_ochre_light | 1 | 1: 13/13 | GEOMETRY_PASS |
| female_curly_blue_dark | 3 | 1: 10/13; 2: 6/13; 3: 13/13 | GEOMETRY_PASS |

## 3. Resultado 13/13

Todos os oito finais GEOMETRY_PASS. Gate alpha ≥128, sem relaxar tolerâncias: left/right/top/hairTop ±6; bottom/feetBaseline ±4; width/maxSilhouetteWidth ±12; height ±10; centerX/Y e alphaCentroidX/Y ±4. Alpha >0 e IoU são apenas diagnósticos; seus resultados preservados não substituem o gate ou o aceite humano.

## 4. Falhas/rejeições e correções

- male_long_blue_medium, tentativa 1: right 8 px (±6).
- male_long_moss_medium, tentativa 1: right 12 px (±6); width 15 px (±12); centerX 4.5 px (±4); maxSilhouetteWidth 15 px (±12).
- male_long_moss_medium, tentativa 2: bottom -16 px (±4); height -14 px (±10); centerY -9 px (±4); feetBaseline -16 px (±4); alphaCentroidY -7.0783 px (±4).
- male_long_ochre_medium, tentativa 1: right 16 px (±6); width 20 px (±12); centerX 6 px (±4); maxSilhouetteWidth 20 px (±12).
- female_curly_blue_dark, tentativa 1: left -7 px (±6); right 8 px (±6); width 15 px (±12).
- female_curly_blue_dark, tentativa 2: left -13 px (±6); bottom -10 px (±4); width 17 px (±12); centerX -4.5 px (±4); centerY -6.5 px (±4); feetBaseline -10 px (±4); alphaCentroidY -5.4792 px (±4).

Blue_medium tentativa 2 reforçou a borda direita da capa original. Moss_medium tentativa 2 reforçou laterais, mas pés subiram; tentativa 3 reforçou simultaneamente cabeça/solas e margem original. Ochre_medium tentativa 2 reforçou capa e pés. Female tentativa 2 reforçou limites próprios, mas falhou em lateral/pés/centros; tentativa 3 reforçou posição assimétrica original e solas. Todos os prompts registrados por tentativa. Terceiras tentativas ocorreram após mudança de conjunto de erros, com correções concretas; nenhum padrão quase idêntico repetido segundo o detector. Parada imediata no primeiro PASS; nenhum arquivo final transformado.

## 5. Deltas completos

Esperados calculados do próprio legado, incluindo centroides. Male long: topo 14, centro Y 764, pés 1514; male curly: topo 6, centro Y 760, pés 1514. Female curly: laterais 190/962, topo 8, centro 576/752, pés 1496. Nenhuma coordenada herdada de outra identidade. Tabelas arredondadas a quatro casas; JSON mantém precisão original.

### male_long_moss_dark

Tentativa 1: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 169 | -3 | ±6 | PASS |
| right | 932 | 936 | 4 | ±6 | PASS |
| top | 14 | 12 | -2 | ±6 | PASS |
| bottom | 1514 | 1514 | 0 | ±4 | PASS |
| width | 760 | 767 | 7 | ±12 | PASS |
| height | 1500 | 1502 | 2 | ±10 | PASS |
| centerX | 552 | 552.5 | 0.5 | ±4 | PASS |
| centerY | 764 | 763 | -1 | ±4 | PASS |
| feetBaseline | 1514 | 1514 | 0 | ±4 | PASS |
| hairTop | 14 | 12 | -2 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 765 | 7 | ±12 | PASS |
| alphaCentroidX | 527.5231 | 528.0376 | 0.5144 | ±4 | PASS |
| alphaCentroidY | 771.4205 | 771.6704 | 0.2499 | ±4 | PASS |

### male_long_blue_medium

Tentativa 1: REJECTED_GEOMETRY.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 169 | -3 | ±6 | PASS |
| right | 932 | 940 | 8 | ±6 | FAIL |
| top | 14 | 11 | -3 | ±6 | PASS |
| bottom | 1514 | 1515 | 1 | ±4 | PASS |
| width | 760 | 771 | 11 | ±12 | PASS |
| height | 1500 | 1504 | 4 | ±10 | PASS |
| centerX | 552 | 554.5 | 2.5 | ±4 | PASS |
| centerY | 764 | 763 | -1 | ±4 | PASS |
| feetBaseline | 1514 | 1515 | 1 | ±4 | PASS |
| hairTop | 14 | 11 | -3 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 768 | 10 | ±12 | PASS |
| alphaCentroidX | 527.5231 | 528.5643 | 1.0411 | ±4 | PASS |
| alphaCentroidY | 771.4205 | 773.8377 | 2.4172 | ±4 | PASS |

Tentativa 2: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 169 | -3 | ±6 | PASS |
| right | 932 | 933 | 1 | ±6 | PASS |
| top | 14 | 12 | -2 | ±6 | PASS |
| bottom | 1514 | 1514 | 0 | ±4 | PASS |
| width | 760 | 764 | 4 | ±12 | PASS |
| height | 1500 | 1502 | 2 | ±10 | PASS |
| centerX | 552 | 551 | -1 | ±4 | PASS |
| centerY | 764 | 763 | -1 | ±4 | PASS |
| feetBaseline | 1514 | 1514 | 0 | ±4 | PASS |
| hairTop | 14 | 12 | -2 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 762 | 4 | ±12 | PASS |
| alphaCentroidX | 527.5231 | 527.6415 | 0.1183 | ±4 | PASS |
| alphaCentroidY | 771.4205 | 772.1582 | 0.7377 | ±4 | PASS |

### male_long_moss_medium

Tentativa 1: REJECTED_GEOMETRY.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 169 | -3 | ±6 | PASS |
| right | 932 | 944 | 12 | ±6 | FAIL |
| top | 14 | 13 | -1 | ±6 | PASS |
| bottom | 1514 | 1515 | 1 | ±4 | PASS |
| width | 760 | 775 | 15 | ±12 | FAIL |
| height | 1500 | 1502 | 2 | ±10 | PASS |
| centerX | 552 | 556.5 | 4.5 | ±4 | FAIL |
| centerY | 764 | 764 | 0 | ±4 | PASS |
| feetBaseline | 1514 | 1515 | 1 | ±4 | PASS |
| hairTop | 14 | 13 | -1 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 773 | 15 | ±12 | FAIL |
| alphaCentroidX | 527.5231 | 530.2421 | 2.719 | ±4 | PASS |
| alphaCentroidY | 771.4205 | 773.2887 | 1.8682 | ±4 | PASS |

Tentativa 2: REJECTED_GEOMETRY.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 170 | -2 | ±6 | PASS |
| right | 932 | 932 | 0 | ±6 | PASS |
| top | 14 | 12 | -2 | ±6 | PASS |
| bottom | 1514 | 1498 | -16 | ±4 | FAIL |
| width | 760 | 762 | 2 | ±12 | PASS |
| height | 1500 | 1486 | -14 | ±10 | FAIL |
| centerX | 552 | 551 | -1 | ±4 | PASS |
| centerY | 764 | 755 | -9 | ±4 | FAIL |
| feetBaseline | 1514 | 1498 | -16 | ±4 | FAIL |
| hairTop | 14 | 12 | -2 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 759 | 1 | ±12 | PASS |
| alphaCentroidX | 527.5231 | 527.6595 | 0.1363 | ±4 | PASS |
| alphaCentroidY | 771.4205 | 764.3422 | -7.0783 | ±4 | FAIL |

Tentativa 3: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 170 | -2 | ±6 | PASS |
| right | 932 | 936 | 4 | ±6 | PASS |
| top | 14 | 13 | -1 | ±6 | PASS |
| bottom | 1514 | 1515 | 1 | ±4 | PASS |
| width | 760 | 766 | 6 | ±12 | PASS |
| height | 1500 | 1502 | 2 | ±10 | PASS |
| centerX | 552 | 553 | 1 | ±4 | PASS |
| centerY | 764 | 764 | 0 | ±4 | PASS |
| feetBaseline | 1514 | 1515 | 1 | ±4 | PASS |
| hairTop | 14 | 13 | -1 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 764 | 6 | ±12 | PASS |
| alphaCentroidX | 527.5231 | 529.0828 | 1.5597 | ±4 | PASS |
| alphaCentroidY | 771.4205 | 774.2594 | 2.8389 | ±4 | PASS |

### male_long_ochre_dark

Tentativa 1: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 169 | -3 | ±6 | PASS |
| right | 932 | 938 | 6 | ±6 | PASS |
| top | 14 | 13 | -1 | ±6 | PASS |
| bottom | 1514 | 1516 | 2 | ±4 | PASS |
| width | 760 | 769 | 9 | ±12 | PASS |
| height | 1500 | 1503 | 3 | ±10 | PASS |
| centerX | 552 | 553.5 | 1.5 | ±4 | PASS |
| centerY | 764 | 764.5 | 0.5 | ±4 | PASS |
| feetBaseline | 1514 | 1516 | 2 | ±4 | PASS |
| hairTop | 14 | 13 | -1 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 767 | 9 | ±12 | PASS |
| alphaCentroidX | 527.5231 | 528.0591 | 0.5359 | ±4 | PASS |
| alphaCentroidY | 771.4205 | 773.2659 | 1.8454 | ±4 | PASS |

### male_curly_moss_light

Tentativa 1: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 169 | -3 | ±6 | PASS |
| right | 932 | 935 | 3 | ±6 | PASS |
| top | 6 | 4 | -2 | ±6 | PASS |
| bottom | 1514 | 1514 | 0 | ±4 | PASS |
| width | 760 | 766 | 6 | ±12 | PASS |
| height | 1508 | 1510 | 2 | ±10 | PASS |
| centerX | 552 | 552 | 0 | ±4 | PASS |
| centerY | 760 | 759 | -1 | ±4 | PASS |
| feetBaseline | 1514 | 1514 | 0 | ±4 | PASS |
| hairTop | 6 | 4 | -2 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 764 | 6 | ±12 | PASS |
| alphaCentroidX | 527.5753 | 528.2204 | 0.6451 | ±4 | PASS |
| alphaCentroidY | 777.7582 | 778.9741 | 1.2159 | ±4 | PASS |

### male_long_ochre_medium

Tentativa 1: REJECTED_GEOMETRY.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 168 | -4 | ±6 | PASS |
| right | 932 | 948 | 16 | ±6 | FAIL |
| top | 14 | 11 | -3 | ±6 | PASS |
| bottom | 1514 | 1516 | 2 | ±4 | PASS |
| width | 760 | 780 | 20 | ±12 | FAIL |
| height | 1500 | 1505 | 5 | ±10 | PASS |
| centerX | 552 | 558 | 6 | ±4 | FAIL |
| centerY | 764 | 763.5 | -0.5 | ±4 | PASS |
| feetBaseline | 1514 | 1516 | 2 | ±4 | PASS |
| hairTop | 14 | 11 | -3 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 778 | 20 | ±12 | FAIL |
| alphaCentroidX | 527.5231 | 530.7559 | 3.2328 | ±4 | PASS |
| alphaCentroidY | 771.4205 | 773.4679 | 2.0474 | ±4 | PASS |

Tentativa 2: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 171 | -1 | ±6 | PASS |
| right | 932 | 935 | 3 | ±6 | PASS |
| top | 14 | 13 | -1 | ±6 | PASS |
| bottom | 1514 | 1515 | 1 | ±4 | PASS |
| width | 760 | 764 | 4 | ±12 | PASS |
| height | 1500 | 1502 | 2 | ±10 | PASS |
| centerX | 552 | 553 | 1 | ±4 | PASS |
| centerY | 764 | 764 | 0 | ±4 | PASS |
| feetBaseline | 1514 | 1515 | 1 | ±4 | PASS |
| hairTop | 14 | 13 | -1 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 761 | 3 | ±12 | PASS |
| alphaCentroidX | 527.5231 | 527.299 | -0.2242 | ±4 | PASS |
| alphaCentroidY | 771.4205 | 772.6849 | 1.2644 | ±4 | PASS |

### male_long_ochre_light

Tentativa 1: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 168 | -4 | ±6 | PASS |
| right | 932 | 938 | 6 | ±6 | PASS |
| top | 14 | 12 | -2 | ±6 | PASS |
| bottom | 1514 | 1515 | 1 | ±4 | PASS |
| width | 760 | 770 | 10 | ±12 | PASS |
| height | 1500 | 1503 | 3 | ±10 | PASS |
| centerX | 552 | 553 | 1 | ±4 | PASS |
| centerY | 764 | 763.5 | -0.5 | ±4 | PASS |
| feetBaseline | 1514 | 1515 | 1 | ±4 | PASS |
| hairTop | 14 | 12 | -2 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 769 | 11 | ±12 | PASS |
| alphaCentroidX | 527.5231 | 527.7762 | 0.253 | ±4 | PASS |
| alphaCentroidY | 771.4205 | 772.4183 | 0.9978 | ±4 | PASS |

### female_curly_blue_dark

Tentativa 1: REJECTED_GEOMETRY.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 190 | 183 | -7 | ±6 | FAIL |
| right | 962 | 970 | 8 | ±6 | FAIL |
| top | 8 | 9 | 1 | ±6 | PASS |
| bottom | 1496 | 1496 | 0 | ±4 | PASS |
| width | 772 | 787 | 15 | ±12 | FAIL |
| height | 1488 | 1487 | -1 | ±10 | PASS |
| centerX | 576 | 576.5 | 0.5 | ±4 | PASS |
| centerY | 752 | 752.5 | 0.5 | ±4 | PASS |
| feetBaseline | 1496 | 1496 | 0 | ±4 | PASS |
| hairTop | 8 | 9 | 1 | ±6 | PASS |
| maxSilhouetteWidth | 764 | 774 | 10 | ±12 | PASS |
| alphaCentroidX | 544.4302 | 545.6864 | 1.2562 | ±4 | PASS |
| alphaCentroidY | 752.3963 | 755.3982 | 3.0018 | ±4 | PASS |

Tentativa 2: REJECTED_GEOMETRY.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 190 | 177 | -13 | ±6 | FAIL |
| right | 962 | 966 | 4 | ±6 | PASS |
| top | 8 | 5 | -3 | ±6 | PASS |
| bottom | 1496 | 1486 | -10 | ±4 | FAIL |
| width | 772 | 789 | 17 | ±12 | FAIL |
| height | 1488 | 1481 | -7 | ±10 | PASS |
| centerX | 576 | 571.5 | -4.5 | ±4 | FAIL |
| centerY | 752 | 745.5 | -6.5 | ±4 | FAIL |
| feetBaseline | 1496 | 1486 | -10 | ±4 | FAIL |
| hairTop | 8 | 5 | -3 | ±6 | PASS |
| maxSilhouetteWidth | 764 | 774 | 10 | ±12 | PASS |
| alphaCentroidX | 544.4302 | 541.841 | -2.5892 | ±4 | PASS |
| alphaCentroidY | 752.3963 | 746.9171 | -5.4792 | ±4 | FAIL |

Tentativa 3: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 190 | 184 | -6 | ±6 | PASS |
| right | 962 | 968 | 6 | ±6 | PASS |
| top | 8 | 9 | 1 | ±6 | PASS |
| bottom | 1496 | 1497 | 1 | ±4 | PASS |
| width | 772 | 784 | 12 | ±12 | PASS |
| height | 1488 | 1488 | 0 | ±10 | PASS |
| centerX | 576 | 576 | 0 | ±4 | PASS |
| centerY | 752 | 753 | 1 | ±4 | PASS |
| feetBaseline | 1496 | 1497 | 1 | ±4 | PASS |
| hairTop | 8 | 9 | 1 | ±6 | PASS |
| maxSilhouetteWidth | 764 | 770 | 6 | ±12 | PASS |
| alphaCentroidX | 544.4302 | 545.6744 | 1.2442 | ±4 | PASS |
| alphaCentroidY | 752.3963 | 754.5869 | 2.1906 | ±4 | PASS |

## 6. SHA-256 finais

| Asset | SHA-256 | Bytes |
|---|---|---:|
| male_long_moss_dark | `561c0da9f89bb56bebd4584a6750c977e5819c1fb503e7703610bcd7659ca9a1` | 2215713 |
| male_long_blue_medium | `e390217b97a4bf6dbb54b42e2b7b043d98184901cf164ab42ff6b9af83ec01a4` | 2200236 |
| male_long_moss_medium | `7105d9b86cd74645d2a9ad7fb65954e9b4764b5dc7972d3cf8bcc543f69565d0` | 2147107 |
| male_long_ochre_dark | `3ccee1a98a598903d47b351e62f4b3af505123711158fe6601054ee5cd40d3ad` | 2197843 |
| male_curly_moss_light | `4134196166b8578f87e445a5d19fc32f940137dd007942b94c811af6e8749ec4` | 2265827 |
| male_long_ochre_medium | `bc0ab9ad75d36d038c20f352a3c50ec84eefe8bcd3910e7d7263c7bebd6ed285` | 2143431 |
| male_long_ochre_light | `e8548f8771dd172f55e456358ed99ed5423532cf1f0dfc3fb099451ba6ba2ad6` | 2208395 |
| female_curly_blue_dark | `c96e8b93f23e732ead9f0243f7d390293e20ab6c2187f0e260dbc190872591c2` | 2183745 |

[Receipts técnicos](task-0049-batch-3/TECHNICAL-RECEIPTS.json) vinculam finais, fontes e prompts. Hashes das 14 tentativas em attempts.json/validation.json. Receipts técnicos preservam a validação e agora referenciam o aceite humano separado; não concedem integração runtime ou direitos comerciais.

## 7. Dimensões e receita

Todos PNG nativos 1024×1536, assinatura válida. imagegen built-in: original individual + próprio guia nearest 2× + própria silhueta QA. Silhueta é referência visual; ferramenta não expõe seed, máscara dura ou ControlNet. Controle continua probabilístico e depende da medição posterior. Os finais são cópias byte-exatas da fonte gerada, sem resize, upscale simples/corretivo, stretch, warp, crop, deslocamento ou manipulação de alpha. Guias e previews achatados somente QA. Prompts exatos em build/task-0049-batch-3/prompts/.

## 8. Alpha

Transparência real comprovada em todos os finais:

| Asset | Pixels alpha 0 | Pixels alpha ≥128 | Alpha máximo |
|---|---:|---:|---:|
| male_long_moss_dark | 915240 | 624550 | 254 |
| male_long_blue_medium | 917864 | 623772 | 254 |
| male_long_moss_medium | 911497 | 626299 | 254 |
| male_long_ochre_dark | 912053 | 624364 | 254 |
| male_curly_moss_light | 914024 | 624532 | 254 |
| male_long_ochre_medium | 914283 | 623010 | 254 |
| male_long_ochre_light | 903140 | 628238 | 254 |
| female_curly_blue_dark | 948009 | 588639 | 254 |

Alpha máximo 254 preservado, sem normalização. Alpha >0 continua diagnóstico de pixels quase transparentes.

## 9. Status visual

Os oito HUMAN_VISUAL_APPROVED por Carlos Faustino, vinculados aos hashes da seção 6; approved=true significa aceite visual para DEV, não produção ou Body-Fit. Aprovados: identidade visual, rosto, cabelo, pose, silhueta, proporções, linha dos pés, enquadramento e aparência geral em relação ao legado. reviewedBy Carlos Faustino; reviewedAt 2026-10-07T17:27:15.528Z, horário real do registro. Precheck qualitativo técnico anterior preservado e separado do aceite humano.

## 10. Evidências

[Review local dos oito](../../build/task-0049-batch-3/review/index.html): quatro colunas e duas linhas em desktop, duas/uma coluna em telas menores; HD/legado/overlay/diff, slider e métricas por teclado. Cada build/task-0049-batch-3/{assetId}/ contém legacy_2x.png, hd_candidate.png, overlay_50_50.png, silhouette_difference.png e geometry_metrics.json. attempt-n preserva todas as tentativas. Previews QA, prompts, fontes/hashes, baseline, screenshots e resultados de validação também registrados. build é local e ignorado pelo git; receipts e documentação duráveis mantêm proveniência sem enviar imagens ao bundle.

## 11. Runtime DEV

LOCAL_DEV_REVIEW_ONLY na página estática local. Nenhum candidato novo integrado ao jogo, AvatarRuntime, public, catálogo, renderer ou bundle. hdPath é destino planejado. Fallback legado intacto.

## 12. Produção preservada

Jogo normal/produção continuam com legado e gates existentes. Zero ativação HD, push, deploy, Vercel, Supabase, migrations, destructive git ou instalações.

## 13. Body-Fit preservado

Nenhum overlay gerado/corrigido/promovido para READY; nenhum anchor alterado. Somente BODY_FIT_REVIEW_PENDING nos metadados dos oito.

## 14. Preservação por hash

463 arquivos protegidos intactos: 452 arquivos de apps/web, packages, scripts, tests e tools; candidato TASK-0049R; quatro Batch 1; seis Batch 2. Inclui 165 mídias públicas (163 legadas e dois pilotos). Runtime, renderer, anchors, IDs e saves preservados. Outros 44 itens da fila intactos (11 HUMAN_VISUAL_APPROVED + 33 PENDING_HD). Baseline desta rodada e queue.before em build/task-0049-batch-3.

## 15. Testes

- Geometry unit: 5/5 PASS.
- Asset validator: 14/14 PNGs PASS; oito finais 13/13 Geometry PASS e seis rejeições preservadas.
- Queue/batch validator: PASS — seleção oficial, limites, referências próprias, métricas recalculadas, byte-exatidão, nenhuma geração após PASS ou asset 9, sem public, 44 itens intactos.
- Review lab: 6/6 viewports PASS (390×844, 412×915, 844×390, 915×412, 1440×900, 1920×1080), oito candidatos, ratio 2:3/dimensões nativas, quatro modos, slider/métricas por teclado; sem overflow da página ou erros JS. Desktop e mobile inspecionados. É review local, não E2E de integração ao jogo.
- ESLint dos sete helpers PASS. Typecheck/build N/A: nenhum TS/runtime alterado. Sem suite global pesada.
- QA pelo autor, não independente; Security adicional N/A sem novo gatilho. Comandos reais em build/task-0049-batch-3/checks.json. Validação final da fila realizada na fase técnica.

Nesta confirmação somente documentos e metadados de aprovação foram atualizados, incluindo rótulos da revisão local. Consistência de JSON/status/receipts, oito hashes finais, 463 hashes protegidos e 44 itens não selecionados conferidos novamente. Métricas, PNGs, histórico e código executável intactos; testes anteriores mantidos, sem repetir suites. Lint/typecheck/build N/A nesta confirmação documental. QA estrutural pelo autor; Security adicional N/A sem novos gatilhos. Evidência: build/task-0049-batch-3/human-approval-verification.json.

## 16. Aprovação humana

Recebida aprovação individual explícita de Carlos Faustino para os oito candidatos e nove critérios da seção 9. Nenhuma pendência visual humana do Batch 3. O aceite não autoriza integração ao jogo/produção, promoção Body-Fit ou geração de Batch 4.

## 17. Quantidade restante

Fila: 33 PENDING_HD, zero VISUAL_REVIEW_PENDING, 19 HUMAN_VISUAL_APPROVED. Pilotos excluídos da fila. Acumulado: 31 gerações, 19 Geometry PASS e 12 rejeições; 19 candidatos aceitos visualmente, zero novo integrado ao runtime.

## 18. Recomendação para Batch 4

Aguardar nova instrução explícita de Batch 4; a revisão humana do Batch 3 foi aprovada. Manter ordem dos próximos PENDING_HD, referências/medidas próprias, mesmos limites e paradas por erro. Lote atual exigiu duas terceiras tentativas, incluindo o primeiro feminino; o método não garante PASS em uma chamada. Nenhuma geração automática dos 33 restantes.

## 19. Status final TASK-0049D

TASK-0049D DONE, resultado BATCH_3_COMPLETE / HUMAN_VISUAL_APPROVED, validação técnica BATCH_3_TECHNICALLY_COMPLETE preservada. Contrato tasks/completed/TASK-0049D-avatar-hd-full-pack-batch-3.md. TASK-0049 não DONE: 19 HUMAN_VISUAL_APPROVED na fila, zero VISUAL_REVIEW_PENDING, 33 PENDING_HD. Produção legada, Body-Fit sem READY, Batch 4 aguardando nova instrução. Zero geração nesta confirmação; sem push, deploy ou alterações remotas.
