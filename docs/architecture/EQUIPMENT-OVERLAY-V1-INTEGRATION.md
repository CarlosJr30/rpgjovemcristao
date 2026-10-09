# Equipment Overlays V1 — integração e aceite visual

> **Estado vigente — 2026-10-02 / TASK-0034:** o usuário reprovou o encaixe corporal V1. Os oito IDs estão `NEEDS_NEW_OVERLAY`, sem aprovação corporal; os 14 PNGs permanecem preservados para UI/arquivo. Resultados técnicos abaixo são históricos e não representam aprovação visual humana. Ver [contrato Body-fit V2](EQUIPMENT-BODY-FIT-OVERLAYS-V2.md).


Data: 2026-10-02. Contrato: TASK-0033 reaberta. Referências: [manifesto de produção](EQUIPMENT-OVERLAY-ASSET-MANIFEST-V1.md), [arquitetura](EQUIPMENT-OVERLAY-ASSETS.md), [auditoria HD anterior](EQUIPMENT-OVERLAY-HD-AUDIT-V1.md).

## Resultado

**14/14 PNGs encontrados, reconhecidos, conectados e aprovados; oito IDs visuais READY.** Nenhuma peça ficou pendente de ajuste após a última calibração. IconAsset, catálogo mecânico, stats e persistência foram preservados. O runtime continua com um arquivo por asset, sem sheets, recortes CSS ou ícones corporais.

Destino físico comum: `apps/web/public/assets/equipment/overlays/v1/`. URLs: `/assets/equipment/overlays/v1/<arquivo>`. Os PNGs externos foram lidos sem modificar seus bytes. Dimensões conferem com o manifesto; PNG 8 bits RGBA, alpha real, pixels transparentes e opacos/semiópacos. Inspeção individual das 14 fontes não encontrou fundo, checkerboard, personagem ou moldura incorporados. Não foram geradas ou retocadas imagens nesta tarefa.

## Relatório visual por arquivo

DISPLAY SIZE é a caixa CSS sem rotação, medida no Herói com canvas **264×396** em 1440×900/1920×1080. Bounds rotacionados diferem da caixa de layout, sem esticar o arquivo. Medidas arredondadas a duas casas. Mãos/torso/pés usam anchors específicos de cada corpo mesmo com fonte compartilhada.

| ITEM / arquivo                           | itemId                    | GENDER      | ANCHOR    | SOURCE SIZE | DISPLAY SIZE CSS | STATUS | OBSERVAÇÃO                                                  |
| ---------------------------------------- | ------------------------- | ----------- | --------- | ----------- | ---------------- | ------ | ----------------------------------------------------------- |
| `armor_traveler_uncommon_female.png`     | `traveler-armor-uncommon` | female      | torso     | 392×432     | 126,33×139,22    | READY  | Encaixe ajustado por corpo; roupa base permanece sob a peça |
| `armor_traveler_uncommon_male.png`       | `traveler-armor-uncommon` | male        | torso     | 416×440     | 123,33×130,44    | READY  | Encaixe ajustado por corpo; roupa base permanece sob a peça |
| `armor_traveler_rare_female.png`         | `traveler-armor-rare`     | female      | torso     | 392×432     | 116,22×128,08    | READY  | Encaixe ajustado por corpo; roupa base permanece sob a peça |
| `armor_traveler_rare_male.png`           | `traveler-armor-rare`     | male        | torso     | 416×440     | 117,97×124,78    | READY  | Encaixe ajustado por corpo; roupa base permanece sob a peça |
| `sword_path_common.png`                  | `traveler-sword-common`   | female/male | rightHand | 96×480      | 28,45×142,31     | READY  | Cabo registrado na mão; rotação +28°                        |
| `sword_path_rare.png`                    | `traveler-sword-rare`     | female/male | rightHand | 96×480      | 28,45×142,31     | READY  | Cabo registrado na mão; rotação +28°                        |
| `helmet_traveler_rare_female.png`        | `traveler-helmet-rare`    | female      | head      | 288×348     | 74,25×89,72      | READY  | Abertura de rosto real; três cabelos conferidos             |
| `helmet_traveler_rare_male.png`          | `traveler-helmet-rare`    | male        | head      | 284×340     | 73,22×87,66      | READY  | Abertura de rosto real; três cabelos conferidos             |
| `boots_traveler_common_left_female.png`  | `traveler-boots`          | female      | leftFoot  | 176×328     | 51,56×96,09      | READY  | Espelhamento explícito; contato com o pé                    |
| `boots_traveler_common_left_male.png`    | `traveler-boots`          | male        | leftFoot  | 216×332     | 61,25×94,14      | READY  | Espelhamento explícito; contato com o pé                    |
| `boots_traveler_common_right_female.png` | `traveler-boots`          | female      | rightFoot | 232×328     | 59,81×84,56      | READY  | Espelhamento explícito; contato com o pé                    |
| `boots_traveler_common_right_male.png`   | `traveler-boots`          | male        | rightFoot | 256×332     | 72,59×94,14      | READY  | Orientação original; contato com o pé                       |
| `shield_perseverance_rare.png`           | `traveler-shield-rare`    | female/male | leftHand  | 216×304     | 55,69×78,36      | READY  | Contato no punho; rotação −8°                               |
| `medallion_path_rare.png`                | `wisdom-amulet`           | female/male | chest     | 88×144      | 11,34×18,56      | READY  | Pequeno; camada 4 acima da armadura 2                       |

`traveler-armor-rare` e `traveler-sword-rare` já existiam no registro visual, mas continuam sem entrada Equipment no catálogo mecânico. A integração não criou itens, nomes oficiais, stats, loot ou ofertas. Esses dois IDs foram exercidos por posse simulada em saves locais isolados para validar suas peças; seu acesso normal no gameplay não foi ampliado.

## Calibração centralizada

Fonte única: `apps/web/features/journey/data/equipmentAssets.ts`. Configuração base + overrides female/male, sem offsets por item nos componentes. Canvas lógico permanece 512×768, separado da resolução do arquivo. Scale é uniforme e atua nas dimensões lógicas; nenhum transform scale positivo amplia o overlay estático. MirrorX é uma opção booleana explícita, sem deformação nem duplicação de fonte.

| Família         | female                                                               | male                                                                             |
| --------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Couraça incomum | size 196×216, scale 1,25; registro (0,499755; 0,582593)              | size 208×220, scale 1,15; registro (0,509615; 0,572)                             |
| Couraça rara    | size 196×216, scale 1,15; mesmo registro                             | size 208×220, scale 1,10; mesmo registro                                         |
| Espadas         | size 48×240, scale 1,15, registro (0,5; 0,705), +28°                 | Mesma fonte/config; rightHand próprio                                            |
| Elmo            | size 144×174, registro (0,499667; 0,63)                              | size 142×170, registro (0,5; 0,555)                                              |
| Bota esquerda   | size 100×186,36, registro (0,5; 0,633), x −14, y 0, scale 1, mirrorX | size 108×166, registro (0,5; 0,58), x −15, y −14, scale 1,10, mirrorX            |
| Bota direita    | size 116×164, registro (0,5; 0,74), x +15, y 0, scale 1, mirrorX     | size 128×166, registro (0,5; 0,78), x +17, y +6, scale 1,10, orientação original |
| Escudo          | size 108×152, registro (0,7; 0,48), −8°                              | Mesma fonte/config; leftHand próprio                                             |
| Medalhão        | size 22×36, registro (0,5; 0,6)                                      | Mesma fonte/config; chest próprio                                                |

Os PNGs de espada têm cabo perto de y=339 numa fonte de 480; manter o registro 0,85 do brief deixaria a mão afastada. Foi ajustado para 0,705. Os elmos foram elevados pelo registro, para posicionar a abertura sobre os olhos/rosto; a coroa pode ultrapassar o topo do canvas lógico sem cortar a face. Três cabelos foram inspecionados em cada corpo.

As botas vieram em orientações distintas. MirrorX foi definido somente para esquerda female/male e direita female; a direita male mantém sua fonte original. A inspeção em DPR 3 revelou sobra do calçado pintado na base masculina; a última calibração ampliou uniformemente o par masculino em 10% e ajustou x/y para cobrir essa sobra sem upscale físico. Não houve edição de alpha, máscara artificial, junção das duas botas ou ocultação do corpo inteiro.

Camadas preservadas: corpo 1, armor 2, boots 3, medalhão 4, weapon 6, shield 7, helmet 8. A base é um bitmap indivisível, com roupas/capa/mãos já pintadas; roupa e tecido ao redor das peças continuam visíveis. Não se afirma interposição de um plano de mãos/cabelo inexistente. A inspeção aprovou contato, rosto legível e composição sem peça flutuante nas poses conferidas.

## HD: fonte versus display

Mantido **img nativo** para servir o PNG original, sem Next/Image, conversão, compressão adicional ou canvas intermediário. Image-rendering auto preservado. Tamanho estático vem da configuração e do layout; transform só rotaciona/espelha. Durante o voo, escala animada conecta a caixa do card ao tamanho final da peça, preservando proporção, registro, rotação e espelhamento.

Escala efetiva = CSS width × DPR / source width. Acima de 1 exige upscale na grade física. O teste mediu **840 amostras de overlays** (dois corpos, combos comum/raro, Herói/Equipamentos, cinco viewports, DPR 1/2/3, sete camadas por combo), cobrindo os 14 arquivos reais.

| Arquivo                                  | Herói 390/412 CSS | Herói 1440/1920 CSS | Equipamentos CSS (canvas 240×360) | Maior escala efetiva, DPR 3 |
| ---------------------------------------- | ----------------- | ------------------- | --------------------------------- | --------------------------- |
| `armor_traveler_uncommon_female.png`     | 93,30×102,83      | 126,33×139,22       | 114,84×126,56                     | 0,967×                      |
| `armor_traveler_uncommon_male.png`       | 91,09×96,34       | 123,33×130,44       | 112,13×118,59                     | 0,889×                      |
| `armor_traveler_rare_female.png`         | 85,84×94,59       | 116,22×128,08       | 105,66×116,44                     | 0,889×                      |
| `armor_traveler_rare_male.png`           | 87,14×92,16       | 117,97×124,78       | 107,25×113,44                     | 0,851×                      |
| `sword_path_common.png`                  | 21,02×105,11      | 28,45×142,31        | 25,88×129,38                      | 0,889×                      |
| `sword_path_rare.png`                    | 21,02×105,11      | 28,45×142,31        | 25,88×129,38                      | 0,889×                      |
| `helmet_traveler_rare_female.png`        | 54,84×66,27       | 74,25×89,72         | 67,50×81,56                       | 0,773×                      |
| `helmet_traveler_rare_male.png`          | 54,08×64,73       | 73,22×87,66         | 66,56×79,69                       | 0,773×                      |
| `boots_traveler_common_left_female.png`  | 38,08×70,97       | 51,56×96,09         | 46,88×87,34                       | 0,879×                      |
| `boots_traveler_common_left_male.png`    | 45,23×69,53       | 61,25×94,14         | 55,69×85,59                       | 0,851×                      |
| `boots_traveler_common_right_female.png` | 44,17×62,45       | 59,81×84,56         | 54,38×76,88                       | 0,773×                      |
| `boots_traveler_common_right_male.png`   | 53,63×69,53       | 72,59×94,14         | 66,00×85,59                       | 0,851×                      |
| `shield_perseverance_rare.png`           | 41,13×57,89       | 55,69×78,36         | 50,63×71,25                       | 0,773×                      |
| `medallion_path_rare.png`                | 8,38×13,70        | 11,34×18,56         | 10,31×16,88                       | 0,387×                      |

Em 768×1024 o canvas do Herói mede 210×315, com valores intermediários. Em DPR 1/2 a demanda é menor que a coluna DPR 3. **Máximo medido: 0,967×**, Couraça incomum feminina; nenhum overlay estático precisa de upscale físico nessas telas/DPRs. A proporção das fontes é preservada; o teste admite somente o arredondamento de layout do navegador até 1/32 CSS px. Inspeção das capturas não identificou blur perceptível causado por upscale dos equipamentos.

A matriz mede o renderer real. O teste separado de calibração injeta candidatos apenas no DOM isolado para revisão antes da promoção; ele não é usado como prova de funcionamento do produto.

## Avatar base e performance

O Avatar permanece **512×768**, sem regeneração. A auditoria da base foi repetida em 60 amostras, explicitamente sem equipamentos (as botas iniciais agora já possuem camadas). Herói: 195×292,5 mobile, 210×315 tablet, 264×396 desktop; Equipamentos 240×360. Não há upscale CSS, mas desktop DPR 2 exige 1,031× e desktop DPR 3 exige 1,547× da fonte. A base pode parecer mais suave que o equipamento em alta densidade.

**Avatar Runtime HD recomendado: 1024×1536 com detalhe real**, preservando pose/anchors. Esse trabalho é futuro e não foi executado. Detalhes extremamente pequenos continuam limitados pelo tamanho CSS visual, mesmo com fonte suficiente.

Pacote V1: **1.683.137 bytes** para os 14 PNGs. Um combo completo usa sete arquivos: aproximadamente 610–736 kB de overlays por corpo/variante, antes do cache, mais a base. O componente só renderiza camadas dos itens possuídos/equipados e aprovados; não foi adicionado preload do catálogo HD inteiro. PNGs não foram recomprimidos. Não se afirma benchmark de rede, LCP ou teste em aparelho físico: DPR é emulado em Edge/Chromium local.

## Animação, troca e atributos

- Card continua com iconAsset; voo e composição usam overlayAsset V1.
- Boots gera dois voos/duas camadas independentes, com orientações mantidas na transição.
- E2E equipa/desequipa os seis slots nos dois corpos, verifica voos dedicados, remoção e persistência após reload.
- Troca de espada comum/raridade visual substitui somente a camada do slot, sem duplicação e mantendo o nó da imagem base conectado.
- Unitários verificam snapshot do Traveler, inventário, equipamento e bônus antes/depois do resolver. E2E compara totais com os mesmos dados de catálogo, sem alterar mecânica ou stats. Os fixtures de raridade visual usam cópias em save de teste; não alteram catálogo/loja.

## Evidências, testes e aceite

| Check                            | Resultado                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Arquivos/alpha/dimensões         | PASS: 14 fontes físicas; decoder PNG RGBA valida dimensões e transparência; inspeção individual das fontes                                        |
| UNIT / ASSET RESOLVER / OVERLAYS | PASS: npm test, 38 arquivos / 220 testes                                                                                                          |
| E2E relevante                    | PASS: 8 testes / 4 skips intencionais; hero-overlays, equipment-v1-hd, avatar-hd e equipment-v1-calibration                                       |
| LINT                             | PASS: npm run lint                                                                                                                                |
| TYPECHECK                        | PASS: npm run typecheck                                                                                                                           |
| BUILD                            | PASS: npm run build                                                                                                                               |
| SELF VALIDATE / QA               | PASS pelo autor; sem revisão independente                                                                                                         |
| Security                         | N/A técnico: sem auth/backend/dependências/serviço externo; revisão local pelo autor, NO SECRETS                                                  |
| Aceite                           | PASS: todos os oito IDs visuais READY; nenhuma peça pendente                                                                                      |
| Preservação                      | PASS: 99 hashes preexistentes fora das edições autorizadas inalterados, incluindo os 14 PNGs; next-env restaurado aos bytes anteriores após build |

Falhas intermediárias de testes foram resolvidas: nome de fixture com dígito rejeitado na criação; auditoria antiga de base que presumiu ausência de botas; tolerância de razão de aspecto menor que a quantização CSS. A inspeção visual também levou à revisão das botas masculinas. Resultados acima pertencem à última calibração/testes, não às tentativas anteriores.

Artefatos locais (ignorados pelo Git) em `test-results/`:

- `equipment-v1-hd-V1-actual--c47da-es-DPR1-2-3-and-both-bodies-desktop/v1-asset-audit.json`: 840 registros e capturas por corpo/viewport/DPR.
- `avatar-hd-Avatar-HD-native-PNG-CSS-geometry-and-DPR-audit-desktop/asset-audit.json`: 60 registros da base.
- `hero-overlays-*/`: base, seis slots, variantes raras, combo completo, páginas e fluxos desktop/mobile.
- `equipment-v1-calibration-*/`: peças individuais/combos e elmos com três cabelos.

Exemplos finais: [female desktop DPR 3](../../test-results/equipment-v1-hd-V1-actual--c47da-es-DPR1-2-3-and-both-bodies-desktop/female-1440-dpr3.png), [male desktop DPR 3](../../test-results/equipment-v1-hd-V1-actual--c47da-es-DPR1-2-3-and-both-bodies-desktop/male-1440-dpr3.png).

Ação manual restante para a integração: **nenhuma**. Os PNGs já estão no destino e são servidos pelo app. Avatar HD e eventual inclusão mecânica dos dois IDs raros são trabalhos futuros distintos, não executados nem autorizados por esta entrega. Nenhum commit/reset/checkout/clean foi executado.
