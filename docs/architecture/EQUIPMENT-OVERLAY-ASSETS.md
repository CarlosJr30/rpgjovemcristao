# Calibração frontal de equipamentos — 2026-09-24

## Referência medida

- Os sprites frontais de Avatar têm canvas PNG RGBA **512 × 768 px**. A caixa de pixels visíveis (alpha > 16) no exemplar masculino é `(85,1)–(466,757)` e no feminino `(94,1)–(481,748)`. O canvas permanece fixo como referência.
- A composição no Herói mede **264 × 396 CSS px** no desktop e **195 × 292,5 CSS px** no mobile, preservando 2:3. Cada coordenada de overlay é convertida para percentual do mesmo container.
- Os seis objetos fonte são PNG RGBA transparentes **1254 × 1254 px**, maiores que seu uso visual máximo atual (cerca de 281 px lógicos para a couraça). Nenhum requer mais resolução para esta tela; a pendência é de desenho, perspectiva e separação de planos.
- O Avatar base já traz cabelo, roupa, capa, calçado e peça no peito. A composição atual cobre somente a **pose frontal estática** de Herói/Equipamentos.

## Âncoras normalizadas

Fonte única: `apps/web/features/journey/data/bodyAnchors.ts`. Os números são frações de largura/altura do canvas, não da página.

| Âncora | Masculino `(x, y)` | Feminino `(x, y)` |
| --- | --- | --- |
| head | `(0.500, 0.102)` | `(0.496, 0.100)` |
| neck | `(0.526, 0.197)` | `(0.515, 0.202)` |
| chest | `(0.500, 0.339)` | `(0.496, 0.338)` |
| rightHand | `(0.762, 0.548)` | `(0.752, 0.542)` |
| leftHand | `(0.242, 0.545)` | `(0.251, 0.542)` |
| leftFoot | `(0.320, 0.933)` | `(0.326, 0.925)` |
| rightFoot | `(0.690, 0.933)` | `(0.686, 0.925)` |
| back | `(0.580, 0.380)` | `(0.590, 0.380)` |

`equipmentAssets.ts` centraliza, por peça e corpo, `anchor`, ponto de registro dentro da imagem, `offset`, `size`, `scale`, `rotation`, `zIndex`, recorte e máscara. `resolveOverlayPlacement` calcula a caixa final. Na espada, o registro `(0.28, 0.73)` marca a empunhadura, que cai na âncora `rightHand` com desvio vertical de apenas 1–2 px lógicos. As botas registram cada metade na base de `leftFoot` e `rightFoot`, em `(0.25, 0.88)` e `(0.75, 0.88)`: base 200 px × escala masculina `0.84` e feminina `0.82`, com rotações independentes `-2°/+2°` e `-1.5°/+1.5°`. O elmo usa escala `0.94` e máscara para mostrar o rosto. Escudo gira `-7°`; medalhão usa base 57 px × escala `0.84`/`0.82`.

Camadas atuais: Avatar base → couraça (`z5`) → botas/medalhão (`z6`) → espada (`z7`) → escudo (`z8`) → elmo (`z9`). A arte base não contém camadas separadas de mão/cabelo para intercalação perfeita. `iconAsset` e `overlayAsset` são campos independentes, embora algumas entradas apontem ao mesmo PNG de alta resolução; o tamanho do card não determina o do overlay.

O voo de equipar usa a **mesma caixa, ângulo, recorte e máscara** da camada persistente. Cada metade das botas voa para seu próprio pé. A transição dura 620 ms e o estado persistido é alterado após 660 ms, para a imagem chegar antes da troca; a camada nova só suaviza opacidade. O resolver ainda exige item possuído, equipado e `status: ready`. Nenhum campo de save foi acrescentado. Movimento reduzido continua respeitado.

## Classificação visual por item

`status: ready` significa que a camada é exibida hoje; `visualQuality` indica se a arte é final. Nenhum item está em `NEEDS_HIGHER_RESOLUTION` ou `NEEDS_POSITION_ADJUSTMENT` após este passe.

| Item | Qualidade | Resultado frontal e pendência de arte |
| --- | --- | --- |
| Espada do Caminho (comum) | `NEEDS_NEW_OVERLAY` | Cabo na palma após calibração; usa a mesma ilustração da espada rara, inadequada para identidade da versão comum. |
| Espada rara | `READY` | Cabo na palma e lâmina diagonal na pose frontal atual. Nova pose exigirá outra projeção. |
| Botas do Viajante | `NEEDS_NEW_OVERLAY` | Menores, baixas e alinhadas por pé; a fonte é um par único recortado e mascarado, sobre sapatos já desenhados. |
| Elmo do Viajante | `NEEDS_NEW_OVERLAY` | Centrado e rosto livre; a abertura é simulada por máscara, com bordas e cabelo dependentes do sprite base. |
| Couraça comum/rara | `NEEDS_NEW_OVERLAY` | Torso alinhado; a fonte não separa ombros, mangas e roupa base por planos. |
| Escudo da Perseverança | `NEEDS_NEW_OVERLAY` | Alinhado à mão esquerda, com ângulo ajustado; falta separar frente e verso da mão. |
| Medalhão do Caminho | `NEEDS_NEW_OVERLAY` | Pequeno no pescoço/peito; compete com peça já pintada no corpo base. |

## Arte dedicada necessária

Os arquivos abaixo **ainda não existem**. Para cada corpo, exportar overlay frontal no canvas transparente **1024 × 1536 px** (2× o sprite lógico), alinhado ao Avatar correspondente, com bordas limpas, iluminação e perspectiva compatíveis. PNG RGBA ou WebP com alpha após revisão visual. A troca da fonte pode ocorrer no manifesto sem mover o Avatar ou alterar o save.

| Prioridade | Arquivo sugerido com `{body}` = `male`/`female` | Requisito |
| --- | --- | --- |
| Alta | `equipment/overlays/weapon_sword_path_common_{body}.webp` | Variante comum própria; cabo registrado na mão direita. |
| Alta | `equipment/overlays/boots_traveler_left_{body}.webp` e `...right_{body}.webp` | Botas independentes, sem máscara para remover canela, desenhadas para cada pé. |
| Alta | `equipment/overlays/helmet_traveler_{body}.webp` | Abertura realmente transparente, contorno de cabelo/testa próprio. |
| Média | `equipment/overlays/armor_traveler_{body}.webp` | Torso, ombros e mangas ajustados à roupa base. |
| Média | `equipment/overlays/shield_perseverance_{body}.webp` | Frente e trás da mão/escudo em subcamadas. |
| Baixa | `equipment/overlays/medallion_path_{body}.webp` | Corrente/peça alinhadas sem duplicar o ornamento da base. |

Caminhada, dano, vitória, oração e costas exigem arte por pose antes de aplicar equipamentos nessas cenas. A cabeça da Fuga da Serpente continua usando o retrato runtime, sem estes overlays corporais.

## Verificação

As capturas E2E foram inspecionadas em desktop e mobile para corpo masculino com seis slots e feminino com espada, escudo, elmo e botas. Espada, botas e elmo foram comparados visualmente com as capturas anteriores. Playwright cobriu 90%, 100% e 110% de `zoom` CSS, larguras 360/390/1024 px, reload, isolamento entre Viajantes e desequipar. O zoom CSS testa o redimensionamento do container; não equivale integralmente ao controle de zoom da interface do navegador. A checagem é visual da pose frontal, não uma prova de encaixe em animações ou em todos os cabelos/roupas possíveis.
