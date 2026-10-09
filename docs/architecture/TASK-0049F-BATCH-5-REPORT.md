# TASK-0049F — Avatar HD Full Pack — Batch 5

**BATCH_5_COMPLETE / HUMAN_VISUAL_APPROVED.** Aprovação humana registrada em 2026-10-07T21:12:12.525Z. Registro real 2026-10-07T21:07:02.671Z. Oito finais 13/13 PASS, 13 gerações e 5 rejeições preservadas. Nenhum BLOCKED_PATTERN ou nono asset. Geração deste lote encerrada.

## 1. Oito assets selecionados

[Seleção oficial](task-0049-batch-5/BATCH_5_SELECTION.json): primeiros oito PENDING_HD, sem pular ou regenerar aprovados. Seis femininos curly e dois masculinos short; rosto precomposto preserva os IDs legados, sem seleção facial independente.

- male_short_moss_light: gênero male; cabelo short; legado `/assets/avatar/runtime/male/male_short_moss_light.png`; hdPath planejado `/assets/avatar/hd/male/male_short_moss_light_hd.png`, sem publicação.
- male_short_moss_dark: gênero male; cabelo short; legado `/assets/avatar/runtime/male/male_short_moss_dark.png`; hdPath planejado `/assets/avatar/hd/male/male_short_moss_dark_hd.png`, sem publicação.
- female_curly_ochre_dark: gênero female; cabelo curly; legado `/assets/avatar/runtime/female/female_curly_ochre_dark.png`; hdPath planejado `/assets/avatar/hd/female/female_curly_ochre_dark_hd.png`, sem publicação.
- female_curly_moss_medium: gênero female; cabelo curly; legado `/assets/avatar/runtime/female/female_curly_moss_medium.png`; hdPath planejado `/assets/avatar/hd/female/female_curly_moss_medium_hd.png`, sem publicação.
- female_curly_moss_light: gênero female; cabelo curly; legado `/assets/avatar/runtime/female/female_curly_moss_light.png`; hdPath planejado `/assets/avatar/hd/female/female_curly_moss_light_hd.png`, sem publicação.
- female_curly_moss_dark: gênero female; cabelo curly; legado `/assets/avatar/runtime/female/female_curly_moss_dark.png`; hdPath planejado `/assets/avatar/hd/female/female_curly_moss_dark_hd.png`, sem publicação.
- female_curly_ochre_medium: gênero female; cabelo curly; legado `/assets/avatar/runtime/female/female_curly_ochre_medium.png`; hdPath planejado `/assets/avatar/hd/female/female_curly_ochre_medium_hd.png`, sem publicação.
- female_curly_ochre_light: gênero female; cabelo curly; legado `/assets/avatar/runtime/female/female_curly_ochre_light.png`; hdPath planejado `/assets/avatar/hd/female/female_curly_ochre_light_hd.png`, sem publicação.

## 2. Tentativas por asset

| Asset | Tentativas | Resultado por tentativa | Final |
|---|---:|---|---|
| male_short_moss_light | 1 | 1: 13/13 | GEOMETRY_PASS |
| male_short_moss_dark | 2 | 1: 10/13; 2: 13/13 | GEOMETRY_PASS |
| female_curly_ochre_dark | 2 | 1: 10/13; 2: 13/13 | GEOMETRY_PASS |
| female_curly_moss_medium | 2 | 1: 11/13; 2: 13/13 | GEOMETRY_PASS |
| female_curly_moss_light | 1 | 1: 13/13 | GEOMETRY_PASS |
| female_curly_moss_dark | 2 | 1: 11/13; 2: 13/13 | GEOMETRY_PASS |
| female_curly_ochre_medium | 1 | 1: 13/13 | GEOMETRY_PASS |
| female_curly_ochre_light | 2 | 1: 10/13; 2: 13/13 | GEOMETRY_PASS |

## 3. Geometry 13/13

Oito finais GEOMETRY_PASS. Gate contorno alpha ≥128; alpha >0 e IoU diagnósticos. Tolerâncias preservadas: left/right/top/hairTop ±6; bottom/feetBaseline ±4; width/maxSilhouetteWidth ±12; height ±10; centerX/Y e alphaCentroidX/Y ±4. Todas recalculadas pelo validador sem relaxamento.

## 4. Rejeições

- male_short_moss_dark, tentativa 1: right 11 px (±6); width 15 px (±12); maxSilhouetteWidth 14 px (±12).
- female_curly_ochre_dark, tentativa 1: left -10 px (±6); right 11 px (±6); width 21 px (±12).
- female_curly_moss_medium, tentativa 1: left -9 px (±6); width 14 px (±12).
- female_curly_moss_dark, tentativa 1: right 9 px (±6); width 14 px (±12).
- female_curly_ochre_light, tentativa 1: left -8 px (±6); right 8 px (±6); width 16 px (±12).

Cinco primeiras tentativas rejeitadas por capa larga: male_moss_dark à direita; female_ochre_dark e female_ochre_light nas duas laterais; female_moss_medium à esquerda; female_moss_dark à direita. Segundas tentativas reforçaram os limites da própria capa, mantendo cabeça/corpo/pés nas coordenadas originais. Todas passaram; não houve terceira tentativa, repetição bloqueada ou geração após PASS. Prompts e PNGs rejeitados preservados.

## 5. Deltas completos

Calculados do próprio legado. Female curly: laterais 190/962, topo 8, pés 1496, centro 576/752. Male short: laterais 172/932, topo 2, pés 1514, centro 552/758. Centroides medidos individualmente; nenhum valor emprestado de outra identidade. Tabelas arredondadas a quatro casas; JSON preserva precisão integral e diagnóstico alpha >0.

### male_short_moss_light

Tentativa 1: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 169 | -3 | ±6 | PASS |
| right | 932 | 936 | 4 | ±6 | PASS |
| top | 2 | 1 | -1 | ±6 | PASS |
| bottom | 1514 | 1517 | 3 | ±4 | PASS |
| width | 760 | 767 | 7 | ±12 | PASS |
| height | 1512 | 1516 | 4 | ±10 | PASS |
| centerX | 552 | 552.5 | 0.5 | ±4 | PASS |
| centerY | 758 | 759 | 1 | ±4 | PASS |
| feetBaseline | 1514 | 1517 | 3 | ±4 | PASS |
| hairTop | 2 | 1 | -1 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 766 | 8 | ±12 | PASS |
| alphaCentroidX | 527.5016 | 527.8735 | 0.372 | ±4 | PASS |
| alphaCentroidY | 779.7495 | 780.1826 | 0.4331 | ±4 | PASS |

### male_short_moss_dark

Tentativa 1: REJECTED_GEOMETRY.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 168 | -4 | ±6 | PASS |
| right | 932 | 943 | 11 | ±6 | FAIL |
| top | 2 | 3 | 1 | ±6 | PASS |
| bottom | 1514 | 1517 | 3 | ±4 | PASS |
| width | 760 | 775 | 15 | ±12 | FAIL |
| height | 1512 | 1514 | 2 | ±10 | PASS |
| centerX | 552 | 555.5 | 3.5 | ±4 | PASS |
| centerY | 758 | 760 | 2 | ±4 | PASS |
| feetBaseline | 1514 | 1517 | 3 | ±4 | PASS |
| hairTop | 2 | 3 | 1 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 772 | 14 | ±12 | FAIL |
| alphaCentroidX | 527.5016 | 529.274 | 1.7725 | ±4 | PASS |
| alphaCentroidY | 779.7495 | 782.9719 | 3.2223 | ±4 | PASS |

Tentativa 2: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 172 | 171 | -1 | ±6 | PASS |
| right | 932 | 933 | 1 | ±6 | PASS |
| top | 2 | 2 | 0 | ±6 | PASS |
| bottom | 1514 | 1516 | 2 | ±4 | PASS |
| width | 760 | 762 | 2 | ±12 | PASS |
| height | 1512 | 1514 | 2 | ±10 | PASS |
| centerX | 552 | 552 | 0 | ±4 | PASS |
| centerY | 758 | 759 | 1 | ±4 | PASS |
| feetBaseline | 1514 | 1516 | 2 | ±4 | PASS |
| hairTop | 2 | 2 | 0 | ±6 | PASS |
| maxSilhouetteWidth | 758 | 760 | 2 | ±12 | PASS |
| alphaCentroidX | 527.5016 | 527.6421 | 0.1405 | ±4 | PASS |
| alphaCentroidY | 779.7495 | 781.5779 | 1.8284 | ±4 | PASS |

### female_curly_ochre_dark

Tentativa 1: REJECTED_GEOMETRY.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 190 | 180 | -10 | ±6 | FAIL |
| right | 962 | 973 | 11 | ±6 | FAIL |
| top | 8 | 8 | 0 | ±6 | PASS |
| bottom | 1496 | 1496 | 0 | ±4 | PASS |
| width | 772 | 793 | 21 | ±12 | FAIL |
| height | 1488 | 1488 | 0 | ±10 | PASS |
| centerX | 576 | 576.5 | 0.5 | ±4 | PASS |
| centerY | 752 | 752 | 0 | ±4 | PASS |
| feetBaseline | 1496 | 1496 | 0 | ±4 | PASS |
| hairTop | 8 | 8 | 0 | ±6 | PASS |
| maxSilhouetteWidth | 764 | 776 | 12 | ±12 | PASS |
| alphaCentroidX | 544.4302 | 546.1609 | 1.7307 | ±4 | PASS |
| alphaCentroidY | 752.3963 | 755.8926 | 3.4963 | ±4 | PASS |

Tentativa 2: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 190 | 190 | 0 | ±6 | PASS |
| right | 962 | 962 | 0 | ±6 | PASS |
| top | 8 | 9 | 1 | ±6 | PASS |
| bottom | 1496 | 1496 | 0 | ±4 | PASS |
| width | 772 | 772 | 0 | ±12 | PASS |
| height | 1488 | 1487 | -1 | ±10 | PASS |
| centerX | 576 | 576 | 0 | ±4 | PASS |
| centerY | 752 | 752.5 | 0.5 | ±4 | PASS |
| feetBaseline | 1496 | 1496 | 0 | ±4 | PASS |
| hairTop | 8 | 9 | 1 | ±6 | PASS |
| maxSilhouetteWidth | 764 | 763 | -1 | ±12 | PASS |
| alphaCentroidX | 544.4302 | 545.0783 | 0.6481 | ±4 | PASS |
| alphaCentroidY | 752.3963 | 751.7147 | -0.6817 | ±4 | PASS |

### female_curly_moss_medium

Tentativa 1: REJECTED_GEOMETRY.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 190 | 181 | -9 | ±6 | FAIL |
| right | 962 | 967 | 5 | ±6 | PASS |
| top | 8 | 8 | 0 | ±6 | PASS |
| bottom | 1496 | 1496 | 0 | ±4 | PASS |
| width | 772 | 786 | 14 | ±12 | FAIL |
| height | 1488 | 1488 | 0 | ±10 | PASS |
| centerX | 576 | 574 | -2 | ±4 | PASS |
| centerY | 752 | 752 | 0 | ±4 | PASS |
| feetBaseline | 1496 | 1496 | 0 | ±4 | PASS |
| hairTop | 8 | 8 | 0 | ±6 | PASS |
| maxSilhouetteWidth | 764 | 772 | 8 | ±12 | PASS |
| alphaCentroidX | 544.4302 | 544.4469 | 0.0167 | ±4 | PASS |
| alphaCentroidY | 752.3963 | 754.3218 | 1.9255 | ±4 | PASS |

Tentativa 2: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 190 | 185 | -5 | ±6 | PASS |
| right | 962 | 967 | 5 | ±6 | PASS |
| top | 8 | 9 | 1 | ±6 | PASS |
| bottom | 1496 | 1495 | -1 | ±4 | PASS |
| width | 772 | 782 | 10 | ±12 | PASS |
| height | 1488 | 1486 | -2 | ±10 | PASS |
| centerX | 576 | 576 | 0 | ±4 | PASS |
| centerY | 752 | 752 | 0 | ±4 | PASS |
| feetBaseline | 1496 | 1495 | -1 | ±4 | PASS |
| hairTop | 8 | 9 | 1 | ±6 | PASS |
| maxSilhouetteWidth | 764 | 770 | 6 | ±12 | PASS |
| alphaCentroidX | 544.4302 | 545.4842 | 1.054 | ±4 | PASS |
| alphaCentroidY | 752.3963 | 754.0068 | 1.6105 | ±4 | PASS |

### female_curly_moss_light

Tentativa 1: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 190 | 185 | -5 | ±6 | PASS |
| right | 962 | 965 | 3 | ±6 | PASS |
| top | 8 | 9 | 1 | ±6 | PASS |
| bottom | 1496 | 1497 | 1 | ±4 | PASS |
| width | 772 | 780 | 8 | ±12 | PASS |
| height | 1488 | 1488 | 0 | ±10 | PASS |
| centerX | 576 | 575 | -1 | ±4 | PASS |
| centerY | 752 | 753 | 1 | ±4 | PASS |
| feetBaseline | 1496 | 1497 | 1 | ±4 | PASS |
| hairTop | 8 | 9 | 1 | ±6 | PASS |
| maxSilhouetteWidth | 764 | 768 | 4 | ±12 | PASS |
| alphaCentroidX | 544.4302 | 545.0895 | 0.6593 | ±4 | PASS |
| alphaCentroidY | 752.3963 | 753.6703 | 1.2739 | ±4 | PASS |

### female_curly_moss_dark

Tentativa 1: REJECTED_GEOMETRY.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 190 | 185 | -5 | ±6 | PASS |
| right | 962 | 971 | 9 | ±6 | FAIL |
| top | 8 | 8 | 0 | ±6 | PASS |
| bottom | 1496 | 1497 | 1 | ±4 | PASS |
| width | 772 | 786 | 14 | ±12 | FAIL |
| height | 1488 | 1489 | 1 | ±10 | PASS |
| centerX | 576 | 578 | 2 | ±4 | PASS |
| centerY | 752 | 752.5 | 0.5 | ±4 | PASS |
| feetBaseline | 1496 | 1497 | 1 | ±4 | PASS |
| hairTop | 8 | 8 | 0 | ±6 | PASS |
| maxSilhouetteWidth | 764 | 774 | 10 | ±12 | PASS |
| alphaCentroidX | 544.4302 | 546.1797 | 1.7495 | ±4 | PASS |
| alphaCentroidY | 752.3963 | 753.9123 | 1.516 | ±4 | PASS |

Tentativa 2: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 190 | 188 | -2 | ±6 | PASS |
| right | 962 | 964 | 2 | ±6 | PASS |
| top | 8 | 8 | 0 | ±6 | PASS |
| bottom | 1496 | 1497 | 1 | ±4 | PASS |
| width | 772 | 776 | 4 | ±12 | PASS |
| height | 1488 | 1489 | 1 | ±10 | PASS |
| centerX | 576 | 576 | 0 | ±4 | PASS |
| centerY | 752 | 752.5 | 0.5 | ±4 | PASS |
| feetBaseline | 1496 | 1497 | 1 | ±4 | PASS |
| hairTop | 8 | 8 | 0 | ±6 | PASS |
| maxSilhouetteWidth | 764 | 766 | 2 | ±12 | PASS |
| alphaCentroidX | 544.4302 | 544.3472 | -0.083 | ±4 | PASS |
| alphaCentroidY | 752.3963 | 753.1884 | 0.792 | ±4 | PASS |

### female_curly_ochre_medium

Tentativa 1: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 190 | 186 | -4 | ±6 | PASS |
| right | 962 | 967 | 5 | ±6 | PASS |
| top | 8 | 8 | 0 | ±6 | PASS |
| bottom | 1496 | 1497 | 1 | ±4 | PASS |
| width | 772 | 781 | 9 | ±12 | PASS |
| height | 1488 | 1489 | 1 | ±10 | PASS |
| centerX | 576 | 576.5 | 0.5 | ±4 | PASS |
| centerY | 752 | 752.5 | 0.5 | ±4 | PASS |
| feetBaseline | 1496 | 1497 | 1 | ±4 | PASS |
| hairTop | 8 | 8 | 0 | ±6 | PASS |
| maxSilhouetteWidth | 764 | 769 | 5 | ±12 | PASS |
| alphaCentroidX | 544.4302 | 545.8865 | 1.4563 | ±4 | PASS |
| alphaCentroidY | 752.3963 | 753.8722 | 1.4759 | ±4 | PASS |

### female_curly_ochre_light

Tentativa 1: REJECTED_GEOMETRY.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 190 | 182 | -8 | ±6 | FAIL |
| right | 962 | 970 | 8 | ±6 | FAIL |
| top | 8 | 8 | 0 | ±6 | PASS |
| bottom | 1496 | 1496 | 0 | ±4 | PASS |
| width | 772 | 788 | 16 | ±12 | FAIL |
| height | 1488 | 1488 | 0 | ±10 | PASS |
| centerX | 576 | 576 | 0 | ±4 | PASS |
| centerY | 752 | 752 | 0 | ±4 | PASS |
| feetBaseline | 1496 | 1496 | 0 | ±4 | PASS |
| hairTop | 8 | 8 | 0 | ±6 | PASS |
| maxSilhouetteWidth | 764 | 772 | 8 | ±12 | PASS |
| alphaCentroidX | 544.4302 | 545.1967 | 0.7665 | ±4 | PASS |
| alphaCentroidY | 752.3963 | 754.9693 | 2.5729 | ±4 | PASS |

Tentativa 2: GEOMETRY_PASS.

| Métrica | Esperado HD | Medido HD | Delta px | Tolerância px | Resultado |
|---|---:|---:|---:|---:|---|
| left | 190 | 184 | -6 | ±6 | PASS |
| right | 962 | 968 | 6 | ±6 | PASS |
| top | 8 | 8 | 0 | ±6 | PASS |
| bottom | 1496 | 1498 | 2 | ±4 | PASS |
| width | 772 | 784 | 12 | ±12 | PASS |
| height | 1488 | 1490 | 2 | ±10 | PASS |
| centerX | 576 | 576 | 0 | ±4 | PASS |
| centerY | 752 | 753 | 1 | ±4 | PASS |
| feetBaseline | 1496 | 1498 | 2 | ±4 | PASS |
| hairTop | 8 | 8 | 0 | ±6 | PASS |
| maxSilhouetteWidth | 764 | 771 | 7 | ±12 | PASS |
| alphaCentroidX | 544.4302 | 544.2299 | -0.2003 | ±4 | PASS |
| alphaCentroidY | 752.3963 | 753.6289 | 1.2326 | ±4 | PASS |

## 6. SHA-256

| Asset | SHA-256 final | Bytes |
|---|---|---:|
| male_short_moss_light | `66f5dc34b6dc5c07c2a6dff581e60fa23f0e22bd10845c019bc2d42a8c365ce6` | 2213952 |
| male_short_moss_dark | `b32dafb858dac73b8a49f4d7275b1a30806948db11cb8e958f8e9adfb9f3866f` | 2148771 |
| female_curly_ochre_dark | `4bad1dcd741d745b2fa66202814470bd59af3a22faa14d12851471262fa4fa31` | 2071878 |
| female_curly_moss_medium | `facd724c6cfba397ae2e5808e6c2f70bd47e98fe8ad4ea89e8e369615dbac339` | 2136521 |
| female_curly_moss_light | `9a3429cbf48879a4dce7d3c864efb0a96e046824e608c715868d73c6add0574a` | 2154942 |
| female_curly_moss_dark | `8dc002903a6d817ed3e88bd074c2e4bdec29851012b2d54f59e395c217e4feef` | 2137504 |
| female_curly_ochre_medium | `e0a0f6ff69aef40fc9cbcf0655e18962397e851ad9c173056882744aed25df67` | 2173195 |
| female_curly_ochre_light | `ed613e15a51bbcdae2a0d57eaa29b768501e25c8df3a8f9977540760e5655fa9` | 2114670 |

[Receipts técnicos](task-0049-batch-5/TECHNICAL-RECEIPTS.json). Hashes das 13 tentativas em build/task-0049-batch-5/attempts.json e validation.json. Receipts técnicos agora vinculam a aprovação humana explícita, restrita a DEV-only; nenhuma aprovação de integração/produção ou declaração de direitos comerciais.

## 7. Dimensões e receita

Todos PNG nativos 1024×1536, assinatura válida. Prompt lock inclui preserve skin/hair tonal family from legacy e preserve overall lighting relationship from legacy. Built-in imagegen: original individual + próprio guia nearest 2× + própria silhueta alpha ≥128. Silhueta é referência visual; ferramenta não expõe seed, máscara dura ou ControlNet. Controle probabilístico, seguido de medição. Final byte-exato da fonte gerada: sem resize, upscale corretivo, stretch, warp, crop, deslocamento ou manipulação de alpha. Guias/previews/contact sheet transformados somente para QA.

## 8. Alpha

Transparência real comprovada; alpha máximo preservado, sem normalização.

| Asset | Pixels alpha 0 | Pixels alpha ≥128 | Alpha máximo |
|---|---:|---:|---:|
| male_short_moss_light | 915630 | 619045 | 254 |
| male_short_moss_dark | 924213 | 611690 | 254 |
| female_curly_ochre_dark | 956185 | 581597 | 254 |
| female_curly_moss_medium | 949191 | 589900 | 254 |
| female_curly_moss_light | 946201 | 587175 | 254 |
| female_curly_moss_dark | 947638 | 587593 | 254 |
| female_curly_ochre_medium | 941147 | 588205 | 254 |
| female_curly_ochre_light | 945478 | 593016 | 254 |

## 9. Status visual

Carlos Faustino aprovou explicitamente os oito candidatos e os dez critérios visuais, incluindo tonalidade/iluminação e aparência geral em relação ao legado. HUMAN_VISUAL_APPROVED, approved=true, reviewedBy=Carlos Faustino, reviewedAt=2026-10-07T21:12:12.525Z. Diferenças de realces/tons mencionadas no precheck foram avaliadas e aceitas pelo usuário; prechecks históricos preservados. [Receipt humano](task-0049-batch-5/HUMAN-VISUAL-APPROVAL.json) vincula oito hashes finais e receipts individuais. Sem aprovação de produção, integração runtime ou Body-Fit.

## 10. Evidências

[Review dos oito](../../build/task-0049-batch-5/review/index.html): quatro colunas/duas linhas desktop, duas/uma em telas menores; HD, legado 2×, overlay 50/50 e diff; slider/métricas por teclado. Cada build/task-0049-batch-5/{assetId}/ possui legacy_2x.png, hd_candidate.png, overlay_50_50.png, silhouette_difference.png e geometry_metrics.json. attempt-n preserva todas as tentativas. Prompts exatos, fontes/hashes, controles, baseline, queue.before, screenshot de seis viewports, contact sheet QA e validações registrados. build é local e ignorado pelo git; docs/receipts mantêm proveniência durável sem imagens no bundle.

## 11. Runtime DEV

LOCAL_DEV_REVIEW_ONLY: página estática local, sem integrar novos candidatos ao jogo/AvatarRuntime, public, catálogo, renderer ou bundle. hdPath apenas planejado. Fallback legado intacto.

## 12. Produção preservada

Jogo normal e produção usam legado/gates existentes. Nenhum push, deploy, Vercel, Supabase, migration, destructive git ou instalação.

## 13. Body-Fit preservado

Nenhum overlay gerado, corrigido ou promovido READY, nenhum anchor alterado. Apenas BODY_FIT_REVIEW_PENDING nos metadados dos oito.

## 14. Preservação

479 arquivos protegidos intactos por hash: 452 arquivos de apps/web, packages, scripts, tests e tools, candidato TASK-0049R e 4/6/8/8 candidatos Batch 1/2/3/4 aprovados. Inclui 165 mídias públicas: 163 legadas e dois pilotos. Runtime, renderer, anchors, IDs e saves preservados. Outros 44 itens da fila intactos (27 HUMAN_VISUAL_APPROVED + 17 PENDING_HD). Baseline/queue.before desta rodada preservados.

## 15. Testes

- Geometry unit: 5/5 PASS.
- Asset validator: 13/13 PNGs válidos; oito finais 13/13 e 5 rejeições geométricas preservadas.
- Queue/batch: PASS, ordem oficial, referências próprias, medidas recalculadas, byte-exatidão, limites/parada no PASS, nenhum nono asset/public, preservação 479 hashes e 44 itens.
- Review lab: 6/6 PASS, 390×844, 412×915, 844×390, 915×412, 1440×900, 1920×1080; oito candidatos, dimensões/ratio 2:3, quatro modos, controles por teclado, sem overflow/erro JS. Desktop/mobile inspecionados pelo autor. Review local, sem E2E de integração ao jogo.
- ESLint sete helpers PASS. Typecheck/build N/A: nenhum TS/runtime alterado; checks afetados conforme contrato. Security adicional N/A: assets locais sem auth, secrets, dependências, permissões ou serviços remotos alterados. QA pelo autor, não independente.
- Comandos/evidências reais em build/task-0049-batch-5/checks.json. Validação e consistência dos registros repetidas após atualização da fila.

## 16. Pendência humana

Nenhuma pendência visual deste lote. Carlos Faustino aprovou individualmente identidade, rosto, cabelo, pose, silhueta, proporções, pés, enquadramento, tonalidade/iluminação e aparência geral em relação ao legado dos oito candidatos.

## 17. Quantidade restante PENDING_HD

17 PENDING_HD; zero VISUAL_REVIEW_PENDING; 35 HUMAN_VISUAL_APPROVED. Pilotos fora da fila. Acumulado preservado: 57 gerações, 35 Geometry PASS e 22 rejeições. Zero novo integrado ao runtime; zero gerações nesta confirmação.

## 18. Recomendação para Batch 6

Aguardar nova instrução explícita para Batch 6. Manter ordem oficial, referências e medidas próprias, limites e safety stop. Nenhuma geração automática dos 17 restantes.

## 19. Status final TASK-0049F

TASK-0049F DONE: BATCH_5_COMPLETE / HUMAN_VISUAL_APPROVED. Contrato em tasks/completed/TASK-0049F-avatar-hd-full-pack-batch-5.md. TASK-0049 permanece VALIDATING e incompleta. DEV-only review, produção e fallback legado, Body-Fit sem READY. Sem Batch 6, push, deploy ou alterações remotas.

## Verificação da confirmação humana

Registro 2026-10-07T21:12:12.525Z. Conferência documental pelo autor: oito hashes finais, todos os PNGs do lote, 479 arquivos protegidos, 44 itens não selecionados e medidas geométricas preservados. Receipts/status/fila consistentes. Unit 5/5, assets 13/13, fila/batch PASS, lab 6/6 e lint PASS da fase técnica mantidos; nenhuma suite repetida. Lint/typecheck/build N/A nesta confirmação documental, sem código funcional alterado; Security adicional N/A. Evidência build/task-0049-batch-5/human-approval-verification.json.
