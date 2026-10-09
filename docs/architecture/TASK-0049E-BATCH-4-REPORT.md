# TASK-0049E — Avatar HD Full Pack — Batch 4

**BATCH_4_COMPLETE / HUMAN_VISUAL_APPROVED.** Aprovação humana registrada em 2026-10-07T20:43:31.593Z. Registro real 2026-10-07T18:01:46.704Z. Oito finais 13/13 PASS, 13 gerações e 5 rejeições preservadas. Nenhum BLOCKED_PATTERN ou nono asset. Geração deste lote encerrada.

## 1. Oito assets selecionados

[Seleção oficial](task-0049-batch-4/BATCH_4_SELECTION.json): primeiros oito PENDING_HD, sem pular ou regenerar aprovados. Dois femininos curly e seis masculinos short; rosto precomposto preserva os IDs legados, sem seleção facial independente.

- female_curly_blue_light: gênero female; cabelo curly; legado `/assets/avatar/runtime/female/female_curly_blue_light.png`; hdPath planejado `/assets/avatar/hd/female/female_curly_blue_light_hd.png`, sem publicação.
- female_curly_blue_medium: gênero female; cabelo curly; legado `/assets/avatar/runtime/female/female_curly_blue_medium.png`; hdPath planejado `/assets/avatar/hd/female/female_curly_blue_medium_hd.png`, sem publicação.
- male_short_blue_light: gênero male; cabelo short; legado `/assets/avatar/runtime/male/male_short_blue_light.png`; hdPath planejado `/assets/avatar/hd/male/male_short_blue_light_hd.png`, sem publicação.
- male_short_blue_dark: gênero male; cabelo short; legado `/assets/avatar/runtime/male/male_short_blue_dark.png`; hdPath planejado `/assets/avatar/hd/male/male_short_blue_dark_hd.png`, sem publicação.
- male_short_blue_medium: gênero male; cabelo short; legado `/assets/avatar/runtime/male/male_short_blue_medium.png`; hdPath planejado `/assets/avatar/hd/male/male_short_blue_medium_hd.png`, sem publicação.
- male_short_ochre_medium: gênero male; cabelo short; legado `/assets/avatar/runtime/male/male_short_ochre_medium.png`; hdPath planejado `/assets/avatar/hd/male/male_short_ochre_medium_hd.png`, sem publicação.
- male_short_ochre_light: gênero male; cabelo short; legado `/assets/avatar/runtime/male/male_short_ochre_light.png`; hdPath planejado `/assets/avatar/hd/male/male_short_ochre_light_hd.png`, sem publicação.
- male_short_ochre_dark: gênero male; cabelo short; legado `/assets/avatar/runtime/male/male_short_ochre_dark.png`; hdPath planejado `/assets/avatar/hd/male/male_short_ochre_dark_hd.png`, sem publicação.

## 2. Tentativas por asset

| Asset | Tentativas | Resultado por tentativa | Final |
|---|---:|---|---|
| female_curly_blue_light | 2 | 1: 9/13; 2: 13/13 | GEOMETRY_PASS |
| female_curly_blue_medium | 2 | 1: 8/13; 2: 13/13 | GEOMETRY_PASS |
| male_short_blue_light | 1 | 1: 13/13 | GEOMETRY_PASS |
| male_short_blue_dark | 2 | 1: 10/13; 2: 13/13 | GEOMETRY_PASS |
| male_short_blue_medium | 2 | 1: 10/13; 2: 13/13 | GEOMETRY_PASS |
| male_short_ochre_medium | 1 | 1: 13/13 | GEOMETRY_PASS |
| male_short_ochre_light | 1 | 1: 13/13 | GEOMETRY_PASS |
| male_short_ochre_dark | 2 | 1: 10/13; 2: 13/13 | GEOMETRY_PASS |

## 3. Geometry 13/13

Oito finais GEOMETRY_PASS. Gate contorno alpha ≥128; alpha >0 e IoU diagnósticos. Tolerâncias preservadas: left/right/top/hairTop ±6; bottom/feetBaseline ±4; width/maxSilhouetteWidth ±12; height ±10; centerX/Y e alphaCentroidX/Y ±4. Todas recalculadas pelo validador sem relaxamento.

## 4. Rejeições

- female_curly_blue_light, tentativa 1: left -8 px (±6); right 12 px (±6); width 20 px (±12); maxSilhouetteWidth 14 px (±12).
- female_curly_blue_medium, tentativa 1: left -10 px (±6); right 22 px (±6); width 32 px (±12); centerX 6 px (±4); maxSilhouetteWidth 24 px (±12).
- male_short_blue_dark, tentativa 1: right 10 px (±6); width 13 px (±12); maxSilhouetteWidth 13 px (±12).
- male_short_blue_medium, tentativa 1: right 12 px (±6); width 17 px (±12); maxSilhouetteWidth 16 px (±12).
- male_short_ochre_dark, tentativa 1: right 12 px (±6); width 16 px (±12); maxSilhouetteWidth 16 px (±12).

Cinco primeiras tentativas rejeitadas por capa larga; female_medium também excedeu centerX. Segundas tentativas reforçaram os limites da própria capa, mantendo cabeça/corpo/pés nas coordenadas originais. Todas passaram; não houve terceira tentativa, repetição bloqueada ou geração após PASS. Prompts e PNGs rejeitados preservados.

## 5. Deltas completos

Calculados do próprio legado. Female curly: laterais 190/962, topo 8, pés 1496, centro 576/752. Male short: laterais 172/932, topo 2, pés 1514, centro 552/758. Centroides medidos individualmente; nenhum valor emprestado de outra identidade. Tabelas arredondadas a quatro casas; JSON preserva precisão integral e diagnóstico alpha >0.

### female_curly_blue_light

Tentativa 1: REJECTED_GEOMETRY.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 190 | 182 | -8 | ±6 | FAIL |
| right | 962 | 974 | 12 | ±6 | FAIL |
| top | 8 | 8 | 0 | ±6 | PASS |
| bottom | 1496 | 1498 | 2 | ±4 | PASS |
| width | 772 | 792 | 20 | ±12 | FAIL |
| height | 1488 | 1490 | 2 | ±10 | PASS |
| centerX | 576 | 578 | 2 | ±4 | PASS |
| centerY | 752 | 753 | 1 | ±4 | PASS |
| feetBaseline | 1496 | 1498 | 2 | ±4 | PASS |
| hairTop | 8 | 8 | 0 | ±6 | PASS |
| maxSilhouetteWidth | 764 | 778 | 14 | ±12 | FAIL |
| alphaCentroidX | 544.4302 | 545.7947 | 1.3645 | ±4 | PASS |
| alphaCentroidY | 752.3963 | 753.7126 | 1.3163 | ±4 | PASS |

Tentativa 2: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 190 | 184 | -6 | ±6 | PASS |
| right | 962 | 964 | 2 | ±6 | PASS |
| top | 8 | 8 | 0 | ±6 | PASS |
| bottom | 1496 | 1495 | -1 | ±4 | PASS |
| width | 772 | 780 | 8 | ±12 | PASS |
| height | 1488 | 1487 | -1 | ±10 | PASS |
| centerX | 576 | 574 | -2 | ±4 | PASS |
| centerY | 752 | 751.5 | -0.5 | ±4 | PASS |
| feetBaseline | 1496 | 1495 | -1 | ±4 | PASS |
| hairTop | 8 | 8 | 0 | ±6 | PASS |
| maxSilhouetteWidth | 764 | 768 | 4 | ±12 | PASS |
| alphaCentroidX | 544.4302 | 544.0934 | -0.3368 | ±4 | PASS |
| alphaCentroidY | 752.3963 | 752.4185 | 0.0221 | ±4 | PASS |

### female_curly_blue_medium

Tentativa 1: REJECTED_GEOMETRY.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 190 | 180 | -10 | ±6 | FAIL |
| right | 962 | 984 | 22 | ±6 | FAIL |
| top | 8 | 8 | 0 | ±6 | PASS |
| bottom | 1496 | 1496 | 0 | ±4 | PASS |
| width | 772 | 804 | 32 | ±12 | FAIL |
| height | 1488 | 1488 | 0 | ±10 | PASS |
| centerX | 576 | 582 | 6 | ±4 | FAIL |
| centerY | 752 | 752 | 0 | ±4 | PASS |
| feetBaseline | 1496 | 1496 | 0 | ±4 | PASS |
| hairTop | 8 | 8 | 0 | ±6 | PASS |
| maxSilhouetteWidth | 764 | 788 | 24 | ±12 | FAIL |
| alphaCentroidX | 544.4302 | 547.282 | 2.8518 | ±4 | PASS |
| alphaCentroidY | 752.3963 | 754.4013 | 2.005 | ±4 | PASS |

Tentativa 2: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 190 | 186 | -4 | ±6 | PASS |
| right | 962 | 966 | 4 | ±6 | PASS |
| top | 8 | 7 | -1 | ±6 | PASS |
| bottom | 1496 | 1496 | 0 | ±4 | PASS |
| width | 772 | 780 | 8 | ±12 | PASS |
| height | 1488 | 1489 | 1 | ±10 | PASS |
| centerX | 576 | 576 | 0 | ±4 | PASS |
| centerY | 752 | 751.5 | -0.5 | ±4 | PASS |
| feetBaseline | 1496 | 1496 | 0 | ±4 | PASS |
| hairTop | 8 | 7 | -1 | ±6 | PASS |
| maxSilhouetteWidth | 764 | 771 | 7 | ±12 | PASS |
| alphaCentroidX | 544.4302 | 545.7229 | 1.2928 | ±4 | PASS |
| alphaCentroidY | 752.3963 | 753.6875 | 1.2912 | ±4 | PASS |

### male_short_blue_light

Tentativa 1: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 169 | -3 | ±6 | PASS |
| right | 932 | 936 | 4 | ±6 | PASS |
| top | 2 | 1 | -1 | ±6 | PASS |
| bottom | 1514 | 1515 | 1 | ±4 | PASS |
| width | 760 | 767 | 7 | ±12 | PASS |
| height | 1512 | 1514 | 2 | ±10 | PASS |
| centerX | 552 | 552.5 | 0.5 | ±4 | PASS |
| centerY | 758 | 758 | 0 | ±4 | PASS |
| feetBaseline | 1514 | 1515 | 1 | ±4 | PASS |
| hairTop | 2 | 1 | -1 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 765 | 7 | ±12 | PASS |
| alphaCentroidX | 527.5016 | 528.2273 | 0.7257 | ±4 | PASS |
| alphaCentroidY | 779.7495 | 780.8261 | 1.0766 | ±4 | PASS |

### male_short_blue_dark

Tentativa 1: REJECTED_GEOMETRY.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 169 | -3 | ±6 | PASS |
| right | 932 | 942 | 10 | ±6 | FAIL |
| top | 2 | 1 | -1 | ±6 | PASS |
| bottom | 1514 | 1517 | 3 | ±4 | PASS |
| width | 760 | 773 | 13 | ±12 | FAIL |
| height | 1512 | 1516 | 4 | ±10 | PASS |
| centerX | 552 | 555.5 | 3.5 | ±4 | PASS |
| centerY | 758 | 759 | 1 | ±4 | PASS |
| feetBaseline | 1514 | 1517 | 3 | ±4 | PASS |
| hairTop | 2 | 1 | -1 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 771 | 13 | ±12 | FAIL |
| alphaCentroidX | 527.5016 | 529.4688 | 1.9672 | ±4 | PASS |
| alphaCentroidY | 779.7495 | 781.8133 | 2.0638 | ±4 | PASS |

Tentativa 2: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 170 | -2 | ±6 | PASS |
| right | 932 | 934 | 2 | ±6 | PASS |
| top | 2 | 3 | 1 | ±6 | PASS |
| bottom | 1514 | 1514 | 0 | ±4 | PASS |
| width | 760 | 764 | 4 | ±12 | PASS |
| height | 1512 | 1511 | -1 | ±10 | PASS |
| centerX | 552 | 552 | 0 | ±4 | PASS |
| centerY | 758 | 758.5 | 0.5 | ±4 | PASS |
| feetBaseline | 1514 | 1514 | 0 | ±4 | PASS |
| hairTop | 2 | 3 | 1 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 761 | 3 | ±12 | PASS |
| alphaCentroidX | 527.5016 | 527.6939 | 0.1924 | ±4 | PASS |
| alphaCentroidY | 779.7495 | 780.3869 | 0.6373 | ±4 | PASS |

### male_short_blue_medium

Tentativa 1: REJECTED_GEOMETRY.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 167 | -5 | ±6 | PASS |
| right | 932 | 944 | 12 | ±6 | FAIL |
| top | 2 | 2 | 0 | ±6 | PASS |
| bottom | 1514 | 1516 | 2 | ±4 | PASS |
| width | 760 | 777 | 17 | ±12 | FAIL |
| height | 1512 | 1514 | 2 | ±10 | PASS |
| centerX | 552 | 555.5 | 3.5 | ±4 | PASS |
| centerY | 758 | 759 | 1 | ±4 | PASS |
| feetBaseline | 1514 | 1516 | 2 | ±4 | PASS |
| hairTop | 2 | 2 | 0 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 774 | 16 | ±12 | FAIL |
| alphaCentroidX | 527.5016 | 528.6324 | 1.1308 | ±4 | PASS |
| alphaCentroidY | 779.7495 | 781.9086 | 2.159 | ±4 | PASS |

Tentativa 2: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 170 | -2 | ±6 | PASS |
| right | 932 | 934 | 2 | ±6 | PASS |
| top | 2 | 2 | 0 | ±6 | PASS |
| bottom | 1514 | 1515 | 1 | ±4 | PASS |
| width | 760 | 764 | 4 | ±12 | PASS |
| height | 1512 | 1513 | 1 | ±10 | PASS |
| centerX | 552 | 552 | 0 | ±4 | PASS |
| centerY | 758 | 758.5 | 0.5 | ±4 | PASS |
| feetBaseline | 1514 | 1515 | 1 | ±4 | PASS |
| hairTop | 2 | 2 | 0 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 763 | 5 | ±12 | PASS |
| alphaCentroidX | 527.5016 | 528.1559 | 0.6543 | ±4 | PASS |
| alphaCentroidY | 779.7495 | 780.2358 | 0.4863 | ±4 | PASS |

### male_short_ochre_medium

Tentativa 1: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 169 | -3 | ±6 | PASS |
| right | 932 | 936 | 4 | ±6 | PASS |
| top | 2 | 2 | 0 | ±6 | PASS |
| bottom | 1514 | 1514 | 0 | ±4 | PASS |
| width | 760 | 767 | 7 | ±12 | PASS |
| height | 1512 | 1512 | 0 | ±10 | PASS |
| centerX | 552 | 552.5 | 0.5 | ±4 | PASS |
| centerY | 758 | 758 | 0 | ±4 | PASS |
| feetBaseline | 1514 | 1514 | 0 | ±4 | PASS |
| hairTop | 2 | 2 | 0 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 765 | 7 | ±12 | PASS |
| alphaCentroidX | 527.5016 | 527.7285 | 0.2269 | ±4 | PASS |
| alphaCentroidY | 779.7495 | 780.1374 | 0.3879 | ±4 | PASS |

### male_short_ochre_light

Tentativa 1: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 170 | -2 | ±6 | PASS |
| right | 932 | 935 | 3 | ±6 | PASS |
| top | 2 | 2 | 0 | ±6 | PASS |
| bottom | 1514 | 1516 | 2 | ±4 | PASS |
| width | 760 | 765 | 5 | ±12 | PASS |
| height | 1512 | 1514 | 2 | ±10 | PASS |
| centerX | 552 | 552.5 | 0.5 | ±4 | PASS |
| centerY | 758 | 759 | 1 | ±4 | PASS |
| feetBaseline | 1514 | 1516 | 2 | ±4 | PASS |
| hairTop | 2 | 2 | 0 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 763 | 5 | ±12 | PASS |
| alphaCentroidX | 527.5016 | 527.4276 | -0.0739 | ±4 | PASS |
| alphaCentroidY | 779.7495 | 781.8314 | 2.0819 | ±4 | PASS |

### male_short_ochre_dark

Tentativa 1: REJECTED_GEOMETRY.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 168 | -4 | ±6 | PASS |
| right | 932 | 944 | 12 | ±6 | FAIL |
| top | 2 | 2 | 0 | ±6 | PASS |
| bottom | 1514 | 1518 | 4 | ±4 | PASS |
| width | 760 | 776 | 16 | ±12 | FAIL |
| height | 1512 | 1516 | 4 | ±10 | PASS |
| centerX | 552 | 556 | 4 | ±4 | PASS |
| centerY | 758 | 760 | 2 | ±4 | PASS |
| feetBaseline | 1514 | 1518 | 4 | ±4 | PASS |
| hairTop | 2 | 2 | 0 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 774 | 16 | ±12 | FAIL |
| alphaCentroidX | 527.5016 | 529.7771 | 2.2755 | ±4 | PASS |
| alphaCentroidY | 779.7495 | 783.2819 | 3.5323 | ±4 | PASS |

Tentativa 2: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 171 | -1 | ±6 | PASS |
| right | 932 | 933 | 1 | ±6 | PASS |
| top | 2 | 2 | 0 | ±6 | PASS |
| bottom | 1514 | 1515 | 1 | ±4 | PASS |
| width | 760 | 762 | 2 | ±12 | PASS |
| height | 1512 | 1513 | 1 | ±10 | PASS |
| centerX | 552 | 552 | 0 | ±4 | PASS |
| centerY | 758 | 758.5 | 0.5 | ±4 | PASS |
| feetBaseline | 1514 | 1515 | 1 | ±4 | PASS |
| hairTop | 2 | 2 | 0 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 759 | 1 | ±12 | PASS |
| alphaCentroidX | 527.5016 | 527.4714 | -0.0302 | ±4 | PASS |
| alphaCentroidY | 779.7495 | 780.2355 | 0.486 | ±4 | PASS |

## 6. SHA-256

| Asset | SHA-256 final | Bytes |
|---|---|---:|
| female_curly_blue_light | `8dc450bdcb0730fca04571c9628b7c21807b6f63800eebfe11e2813ab806d0ac` | 2144963 |
| female_curly_blue_medium | `69ee723023e71d7eceeabbf6ff529bddbb4b45edbb6b2b9c2a863a5b9d2d2201` | 2192738 |
| male_short_blue_light | `98b5e7c9d50151af6da95dd7a813f6f4304d7cd292a6c85ff7fa68b6e03bf302` | 2142625 |
| male_short_blue_dark | `8771935dcc7a529b5b0bfe958d6da38f70ef31c50f86655a97f2936eacadf8c3` | 2147071 |
| male_short_blue_medium | `6f732859e75bbdebb5b69120dc00e0d4342025cfed84a4106ab6d0ad9adaf224` | 2207923 |
| male_short_ochre_medium | `00d5d22f7dae0fdbce82555797b902f26c590abadc9ae5579e0b4ffb2ad16d18` | 2239610 |
| male_short_ochre_light | `15de9f313b5af24574854d16a85bec4be3569b29f502b578c2c0c3995a168d35` | 2174927 |
| male_short_ochre_dark | `b6b0c87a7fd62286fb17cc90e692a6cf09d8f06e031d7e0a3c1b38b841baaa94` | 2106497 |

[Receipts técnicos](task-0049-batch-4/TECHNICAL-RECEIPTS.json). Hashes das 13 tentativas em build/task-0049-batch-4/attempts.json e validation.json. Receipts técnicos agora vinculam a aprovação humana explícita, restrita a DEV-only; nenhuma aprovação de integração/produção ou declaração de direitos comerciais.

## 7. Dimensões e receita

Todos PNG nativos 1024×1536, assinatura válida. Built-in imagegen: original individual + próprio guia nearest 2× + própria silhueta alpha ≥128. Silhueta é referência visual; ferramenta não expõe seed, máscara dura ou ControlNet. Controle probabilístico, seguido de medição. Final byte-exato da fonte gerada: sem resize, upscale corretivo, stretch, warp, crop, deslocamento ou manipulação de alpha. Guias/previews/contact sheet transformados somente para QA.

## 8. Alpha

Transparência real comprovada; alpha máximo preservado, sem normalização.

| Asset | Pixels alpha 0 | Pixels alpha ≥128 | Alpha máximo |
|---|---:|---:|---:|
| female_curly_blue_light | 952027 | 587432 | 254 |
| female_curly_blue_medium | 947045 | 589953 | 254 |
| male_short_blue_light | 919810 | 618926 | 254 |
| male_short_blue_dark | 926300 | 613883 | 254 |
| male_short_blue_medium | 925690 | 616261 | 254 |
| male_short_ochre_medium | 920291 | 617425 | 254 |
| male_short_ochre_light | 920255 | 616722 | 254 |
| male_short_ochre_dark | 932431 | 609597 | 254 |

## 9. Status visual

Carlos Faustino aprovou explicitamente os oito candidatos nos dez critérios, incluindo tonalidade/iluminação em relação ao legado. HUMAN_VISUAL_APPROVED, approved=true, reviewedBy=Carlos Faustino, reviewedAt=2026-10-07T20:43:31.593Z. A observação preliminar de diferenças de tonalidade foi avaliada e aceita pelo usuário; prechecks históricos permanecem preservados. [Receipt humano](task-0049-batch-4/HUMAN-VISUAL-APPROVAL.json), com oito hashes finais e receipts individuais. Não concede aprovação de produção ou Body-Fit.

## 10. Evidências

[Review dos oito](../../build/task-0049-batch-4/review/index.html): quatro colunas/duas linhas desktop, duas/uma em telas menores; HD, legado 2×, overlay 50/50 e diff; slider/métricas por teclado. Cada build/task-0049-batch-4/{assetId}/ possui legacy_2x.png, hd_candidate.png, overlay_50_50.png, silhouette_difference.png e geometry_metrics.json. attempt-n preserva todas as tentativas. Prompts exatos, fontes/hashes, controles, baseline, queue.before, screenshot de seis viewports, contact sheet QA e validações registrados. build é local e ignorado pelo git; docs/receipts mantêm proveniência durável sem imagens no bundle.

## 11. Runtime DEV

LOCAL_DEV_REVIEW_ONLY: página estática local, sem integrar novos candidatos ao jogo/AvatarRuntime, public, catálogo, renderer ou bundle. hdPath apenas planejado. Fallback legado intacto.

## 12. Produção preservada

Jogo normal e produção usam legado/gates existentes. Nenhum push, deploy, Vercel, Supabase, migration, destructive git ou instalação.

## 13. Body-Fit preservado

Nenhum overlay gerado, corrigido ou promovido READY, nenhum anchor alterado. Apenas BODY_FIT_REVIEW_PENDING nos metadados dos oito.

## 14. Preservação

471 arquivos protegidos intactos por hash: 452 arquivos de apps/web, packages, scripts, tests e tools, candidato TASK-0049R e 4/6/8 candidatos Batch 1/2/3 aprovados. Inclui 165 mídias públicas: 163 legadas e dois pilotos. Runtime, renderer, anchors, IDs e saves preservados. Outros 44 itens da fila intactos (19 HUMAN_VISUAL_APPROVED + 25 PENDING_HD). Baseline/queue.before desta rodada preservados.

## 15. Testes

- Geometry unit: 5/5 PASS.
- Asset validator: 13/13 PNGs válidos; oito finais 13/13 e 5 rejeições geométricas preservadas.
- Queue/batch: PASS, ordem oficial, referências próprias, medidas recalculadas, byte-exatidão, limites/parada no PASS, nenhum nono asset/public, preservação 471 hashes e 44 itens.
- Review lab: 6/6 PASS, 390×844, 412×915, 844×390, 915×412, 1440×900, 1920×1080; oito candidatos, dimensões/ratio 2:3, quatro modos, controles por teclado, sem overflow/erro JS. Desktop/mobile inspecionados pelo autor. Review local, sem E2E de integração ao jogo.
- ESLint sete helpers PASS. Typecheck/build N/A: nenhum TS/runtime alterado; checks afetados conforme contrato. Security adicional N/A: assets locais sem auth, secrets, dependências, permissões ou serviços remotos alterados. QA pelo autor, não independente.
- Comandos/evidências reais em build/task-0049-batch-4/checks.json. Validação e consistência dos registros repetidas após atualização da fila.

## 16. Pendência humana

Nenhuma pendência de aprovação visual deste lote. Os oito candidatos foram aprovados individualmente por Carlos Faustino, incluindo identidade, rosto, cabelo, pose, silhueta, proporções, pés, enquadramento, tonalidade/iluminação e aparência geral.

## 17. Quantidade restante PENDING_HD

25 PENDING_HD; zero VISUAL_REVIEW_PENDING; 27 HUMAN_VISUAL_APPROVED. Pilotos fora da fila. Acumulado preservado: 44 gerações, 27 Geometry PASS, 17 rejeições. Zero novo integrado ao runtime. Nesta confirmação: zero gerações.

## 18. Recomendação para Batch 5

Aguardar nova instrução explícita para Batch 5. Manter ordem oficial, referências e medidas próprias, limites e paradas por padrão. Nenhuma geração automática dos 25 restantes.

## 19. Status final TASK-0049E

TASK-0049E DONE: BATCH_4_COMPLETE / HUMAN_VISUAL_APPROVED. Contrato em tasks/completed/TASK-0049E-avatar-hd-full-pack-batch-4.md. TASK-0049 permanece VALIDATING e incompleta. DEV-only review, produção legada, Body-Fit sem READY. Sem Batch 5, push, deploy ou alterações remotas.

## Verificação da confirmação humana

Registro 2026-10-07T20:43:31.593Z. Conferência documental pelo autor: oito hashes finais, todos os PNGs do lote, 471 arquivos protegidos, 44 itens não selecionados e medidas geométricas preservados. Receipts/status/fila consistentes. Unit 5/5, assets 13/13, queue/batch PASS, lab 6/6 e lint PASS da fase técnica mantidos; nenhuma suite repetida. Lint/typecheck/build N/A nesta confirmação documental, sem código funcional alterado. Security adicional N/A. Evidência build/task-0049-batch-4/human-approval-verification.json.
