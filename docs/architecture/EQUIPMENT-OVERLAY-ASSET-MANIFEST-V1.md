# Equipment Overlay Asset Manifest V1

> **Estado vigente — 2026-10-02 / TASK-0034:** o usuário reprovou o encaixe corporal V1. Os oito IDs estão `NEEDS_NEW_OVERLAY`, sem aprovação corporal; os 14 PNGs permanecem preservados para UI/arquivo. Resultados técnicos abaixo são históricos e não representam aprovação visual humana. Ver [contrato Body-fit V2](EQUIPMENT-BODY-FIT-OVERLAYS-V2.md).


Data: 2026-10-01. Contrato: TASK-0032. Base técnica: [Equipment Overlays V2](EQUIPMENT-OVERLAY-ASSETS.md), concluída na TASK-0031.

Atualização 2026-10-02: os 14 PNGs foram integrados e os oito IDs visuais aprovados na TASK-0033. Consulte [integração e medidas reais](EQUIPMENT-OVERLAY-V1-INTEGRATION.md) para status/calibração vigente. As caixas abaixo preservam os envelopes originais de produção; não substituem a calibração final do runtime.

## Entrega de produção

**14 arquivos de arte para oito itemIds: 10 arquivos específicos de corpo e quatro compartilhados.** Uma imagem representa uma peça isolada; cada pé das botas é uma peça. Este manifesto registra a especificação documental da TASK-0032, quando todos os IDs estavam NEEDS_NEW_OVERLAY e nenhuma arte havia sido integrada. O aceite posterior e READY estão registrados no relatório da TASK-0033 acima.

Formato final V1: **PNG RGBA com transparência**. Um WebP com alpha pode substituir um PNG depois de validação equivalente, mediante atualização deste manifesto e do caminho no resolver; não entregar ambos como dois assets distintos. Sem spritesheets, posters, grids, personagem, corpo, mão, texto, cenário ou sombra projetada grande dentro do arquivo.

O manifesto documental é o pacote de integração. Não criar um segundo registro runtime `equipmentOverlayManifest.ts`: o registro executável existente é `equipmentAssets.ts`, e só receberá caminhos/configurações após a produção e aprovação da arte.

## Auditoria e fatos verificados

| Fonte local                                  | Resultado auditado                                                                                                                              |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/public/assets/avatar/runtime/`     | 54 PNGs: 27 male + 27 female, todos 512×768, 32 bits com alpha                                                                                  |
| `data/bodyAnchors.ts`                        | Canvas lógico 512×768; anchors normalizados distintos por corpo                                                                                 |
| `data/equipmentAssets.ts`                    | Oito IDs visuais pendentes; nenhum overlay dedicado aprovado; camadas centrais e registro/rotação já suportados                                 |
| `equipmentCatalog.ts` e `domain/traveler.ts` | Seis itens com nome/raridade mecânicos; dois IDs raros somente no manifesto visual legado                                                       |
| `journey.module.css`                         | Proporção do Avatar 2:3; largura nominal no Herói 195 px em 390×844, 210 px em 768×1024 e 264 px em 1440×900; prévia de equipamentos até 240 px |
| Sprites de referência                        | Roupa, capa/cachecol, cabelo, mãos, calçados e ornamentos já estão pintados em uma imagem indivisível                                           |
| PNGs em `assets/equipment/`                  | Seis ilustrações de inventário de 1254×1254, não overlays corporais; permanecem no lugar e servem como referência de identidade                 |

As dimensões de arquivos e os anchors são fatos lidos no projeto. As caixas de peça e rotações abaixo são **envelopes iniciais de produção**, definidos pela posição de cabeça, torso, mãos e pés nas sprites de referência. Não são medições de overlays existentes nem calibração visual aprovada. O artista deve desenhar sobre a referência em escala 1:1; refinamentos de contorno/registro serão anotados no aceite. Não alterar corpo/anchors para acomodar uma peça mal desenhada.

## Referências e estilo

Referências principais de encaixe, sem modificar as fontes:

- `apps/web/public/assets/avatar/runtime/female/female_short_moss_medium.png`
- `apps/web/public/assets/avatar/runtime/male/male_short_moss_medium.png`

Consultar também cabelo long/curly, roupas moss/ochre/blue e tons light/medium/dark dos mesmos corpos. A paleta ou o ícone de item orienta materiais, não define a silhueta corporal.

Direção: fantasia bíblica estilizada, semi-realista, 2D/2.5D, materiais naturais, verdes musgo, couro marrom, tecido cru e dourado envelhecido. Iluminação suave coerente com a base. Evitar sci-fi, neon, proporções de cartoon infantil, brilho mágico, auras, runas, talismãs, inscrições inventadas ou excesso de pedras luminosas. A raridade rara se expressa por acabamento e detalhes de material, sem mudar a anatomia nem transformar a peça em objeto mágico.

Classificação editorial: **FICTIONAL** para todas as peças; a inspiração de tema registrada no projeto é temática/interpretativa. Não apresentar nenhuma como relíquia histórica real, item descrito literalmente na Bíblia ou portador de proteção espiritual real. O nome técnico legado `wisdom-amulet` permanece, mas o nome público é Medalhão do Caminho. Não introduzir fontes, versículos, alegações históricas ou narrativas novas. Uma cruz discreta, se mantida como identidade visual existente, é decoração temática do jogo; não é selo mágico.

## Densidade, recorte e exportação

O padrão é **2 pixels exportados por pixel lógico**. O canvas de trabalho de referência equivale a **1024×1536** (2× os avatares 512×768). As peças finais são recortadas nos envelopes da tabela; não exportar 1024×1536 de vazio para cada espada/medalhão.

Exemplo: Couraça feminina ocupa uma caixa lógica de 196×216 e exporta 392×432. A configuração posterior usa `size: { width: 196, height: 216 }`, não 392×432, com `scale: 1` como ponto inicial. O arquivo de 2× fornece aproximadamente 3,88 pixels por CSS px na largura máxima atual do Herói; o recorte evita desperdício para peças pequenas. As 14 exportações somam **1.362.576 pixels**, contra 22.020.096 se cada peça ocupasse um canvas inteiro 1024×1536.

A proporção de cada peça é a razão da própria caixa, não necessariamente 2:3. A proporção 2:3 pertence ao Avatar composto. Não esticar a imagem para preencher um quadrado nem aplicar escala diferente em x/y para forçar adaptação corporal.

- Perfil de cor sRGB; alpha reto, bordas sem halo branco/preto; antialias limpo.
- Todo pixel exterior à peça deve ter alpha zero, inclusive janela do rosto e intervalos entre componentes.
- Prever cerca de 2 px lógicos de margem para antialias dentro da caixa, sem cortar pontas, gola ou sola. Se a silhueta exigir caixa maior, atualizar crop, resolução e registro juntos.
- Sombras de volume/material podem existir na peça. Não embutir sombra no chão, fundo, glow nem imagem da pessoa.
- Guardar o fonte em camadas fora do pacote runtime; entregável no projeto é uma imagem isolada por asset.
- Otimização de PNG deve preservar alpha, cor, proporção e ponto de registro; não usar cópia/renomeação do ícone como overlay.

## Inventário final e prioridade

Dentro de cada prioridade, produzir/avaliar primeiro female. Swords/shield/medallion são compartilhados e devem ser provados em ambos os corpos.

| Asset | Prioridade | itemId                    | Nome da peça                 | Slot técnico | Rarity  | Compatibilidade | Arquivo final                            |
| ----- | ---------- | ------------------------- | ---------------------------- | ------------ | ------- | --------------- | ---------------------------------------- |
| A01   | 1          | `traveler-armor-uncommon` | Couraça do Viajante          | armor        | incomum | female          | `armor_traveler_uncommon_female.png`     |
| A02   | 1          | `traveler-armor-uncommon` | Couraça do Viajante          | armor        | incomum | male            | `armor_traveler_uncommon_male.png`       |
| A03   | 2          | `traveler-armor-rare`     | Couraça do Viajante — rara¹  | armor        | raro¹   | female          | `armor_traveler_rare_female.png`         |
| A04   | 2          | `traveler-armor-rare`     | Couraça do Viajante — rara¹  | armor        | raro¹   | male            | `armor_traveler_rare_male.png`           |
| A05   | 3          | `traveler-sword-common`   | Espada do Caminho            | weapon       | comum   | male + female   | `sword_path_common.png`                  |
| A06   | 4          | `traveler-sword-rare`     | Espada do Caminho — rara¹    | weapon       | raro¹   | male + female   | `sword_path_rare.png`                    |
| A07   | 5          | `traveler-helmet-rare`    | Elmo do Viajante             | helmet       | raro    | female          | `helmet_traveler_rare_female.png`        |
| A08   | 5          | `traveler-helmet-rare`    | Elmo do Viajante             | helmet       | raro    | male            | `helmet_traveler_rare_male.png`          |
| A09   | 6          | `traveler-boots`          | Botas do Viajante — esquerda | boots        | comum   | female          | `boots_traveler_common_left_female.png`  |
| A10   | 6          | `traveler-boots`          | Botas do Viajante — direita  | boots        | comum   | female          | `boots_traveler_common_right_female.png` |
| A11   | 6          | `traveler-boots`          | Botas do Viajante — esquerda | boots        | comum   | male            | `boots_traveler_common_left_male.png`    |
| A12   | 6          | `traveler-boots`          | Botas do Viajante — direita  | boots        | comum   | male            | `boots_traveler_common_right_male.png`   |
| A13   | 7          | `traveler-shield-rare`    | Escudo da Perseverança       | shield       | raro    | male + female   | `shield_perseverance_rare.png`           |
| A14   | 8          | `wisdom-amulet`           | Medalhão do Caminho          | amulet       | raro    | male + female   | `medallion_path_rare.png`                |

¹ `traveler-armor-rare` e `traveler-sword-rare` existem no registro visual, mas não têm Equipment correspondente no catálogo mecânico atual. Nome e raridade apresentados aqui são **rótulos de produção** derivados da família e do sufixo do ID legado; não estabelecem nome oficial, stats, preço, loot ou inclusão de item novo.

## Compatibilidade male/female

| Família         | Decisão V1                    | Arquivos | Justificativa                                                                                                                      |
| --------------- | ----------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Couraça incomum | female + male                 | A01–A02  | Ombros, cavidades de braço, largura do tórax/cintura e recortes de cachecol/capa precisam seguir o corpo, sem deformar a peça      |
| Couraça rara    | female + male                 | A03–A04  | Mesma necessidade anatômica da incomum; material/ornamento raro mantém a própria identidade                                        |
| Espada comum    | Um arquivo para ambos         | A05      | Objeto rígido isolado; a mão muda de posição via anchor, sem mudar a anatomia do objeto                                            |
| Espada rara     | Um arquivo para ambos         | A06      | Mesma orientação/registro compartilhável; desenho raro separado da espada comum                                                    |
| Elmo            | female + male                 | A07–A08  | Contorno da cabeça/cabelo e janela do rosto exigem encaixe próprio; não mascarar depois um capuz de inventário                     |
| Botas           | Um arquivo por pé e por corpo | A09–A12  | Tornozelo, largura, ponta e perspectiva das botas pintadas na base diferem; não deformar um par único nem espelhar automaticamente |
| Escudo          | Um arquivo para ambos         | A13      | Objeto rígido lateral; posição por leftHand e configuração por corpo, sem mão embutida                                             |
| Medalhão        | Um arquivo para ambos         | A14      | Peça pequena sobre o peito; a posição é resolvida por chest, sem moldar o tórax                                                    |

Compartilhamento é a decisão de produção, não aprovação antecipada. Se um arquivo compartilhado não passar o aceite nos dois corpos sem deformação, revisar a especificação e justificar variantes antes de marcar READY. Não duplicar preventivamente uma fonte rígida apenas para trocar suas coordenadas.

## Geometria por arquivo

Coordenadas de caixa: **(x, y, width, height)** em pixels lógicos 512×768, origem no topo esquerdo. M = male; F = female. Para arte compartilhada, cada caixa se desloca pelo anchor de seu corpo, mantendo size.

`registration` é a fração da fonte recortada que toca o anchor e é também o pivô de rotação. As coordenadas não são do arquivo original inteiro. Tabelas usam seis casas decimais para orientar a integração.

| Asset | Anchor    | Caixa esperada antes da rotação                                | Exportação PNG | Proporção w:h | Registration (rx, ry) | Rotação inicial | zIndex |
| ----- | --------- | -------------------------------------------------------------- | -------------- | ------------- | --------------------- | --------------- | ------ |
| A01   | torso     | (156, 166, 196, 216)                                           | 392×432        | 49:54         | (0.499755, 0.582593)  | 0°              | 2      |
| A02   | torso     | (150, 166, 208, 220)                                           | 416×440        | 52:55         | (0.509615, 0.572000)  | 0°              | 2      |
| A03   | torso     | (156, 166, 196, 216)                                           | 392×432        | 49:54         | (0.499755, 0.582593)  | 0°              | 2      |
| A04   | torso     | (150, 166, 208, 220)                                           | 416×440        | 52:55         | (0.509615, 0.572000)  | 0°              | 2      |
| A05   | rightHand | M: (366.144, 216.864, 48, 240); F: (361.024, 212.256, 48, 240) | 96×480         | 1:5           | (0.500000, 0.850000)  | +28°            | 6      |
| A06   | rightHand | M: (366.144, 216.864, 48, 240); F: (361.024, 212.256, 48, 240) | 96×480         | 1:5           | (0.500000, 0.850000)  | +28°            | 6      |
| A07   | head      | (182, 0, 144, 174)                                             | 288×348        | 24:29         | (0.499667, 0.441379)  | 0°              | 8      |
| A08   | head      | (185, 0, 142, 170)                                             | 284×340        | 71:85         | (0.500000, 0.460800)  | 0°              | 8      |
| A09   | leftFoot  | (116, 584, 88, 164)                                            | 176×328        | 22:41         | (0.578545, 0.770732)  | 0°              | 3      |
| A10   | rightFoot | (308, 584, 116, 164)                                           | 232×328        | 29:41         | (0.372690, 0.770732)  | 0°              | 3      |
| A11   | leftFoot  | (108, 592, 108, 166)                                           | 216×332        | 54:83         | (0.517037, 0.750265)  | 0°              | 3      |
| A12   | rightFoot | (300, 592, 128, 166)                                           | 256×332        | 64:83         | (0.416250, 0.750265)  | 0°              | 3      |
| A13   | leftHand  | M: (48.304, 345.600, 108, 152); F: (52.912, 343.296, 108, 152) | 216×304        | 27:38         | (0.700000, 0.480000)  | -8°             | 7      |
| A14   | chest     | M: (234.000, 208.512, 44, 72); F: (231.952, 207.744, 44, 72)   | 88×144         | 11:18         | (0.500000, 0.720000)  | 0°              | 4      |

Todos os arquivos: frente/pose idle atual, iluminação coerente, peça isolada e fundo alpha zero. Orientação específica e oclusão de cada família estão nas seções seguintes e fazem parte do registro de cada asset da tabela.

A rotação positiva do renderer/CSS é horária. As caixas acima são anteriores à rotação: o footprint da espada em +28° será aproximadamente M (352,229)–(508,465) e F (347,225)–(503,460), mantendo a lâmina para fora do torso e dentro do canvas. O escudo em −8° ocupa aproximadamente M (39,342)–(167,508) e F (44,340)–(172,506). Conferir a silhueta real no aceite; estes envelopes incluem o retângulo transparente, não só os pixels opacos.

## Anchors do renderer

Os nomes left/right seguem os anchors atuais do projeto: `rightHand` fica à direita da imagem frontal e `leftHand` à esquerda. Não inferir lateralidade anatômica diferente, espelhar a base ou renomear anchors. O mesmo contrato vale para left/right dos arquivos de botas.

| Anchor           | Male normalizado / lógico         | Female normalizado / lógico       |
| ---------------- | --------------------------------- | --------------------------------- |
| head             | (.500, .102) / (256.000, 78.336)  | (.496, .100) / (253.952, 76.800)  |
| torso            | (.500, .380) / (256.000, 291.840) | (.496, .380) / (253.952, 291.840) |
| chest            | (.500, .339) / (256.000, 260.352) | (.496, .338) / (253.952, 259.584) |
| rightHand        | (.762, .548) / (390.144, 420.864) | (.752, .542) / (385.024, 416.256) |
| leftHand         | (.242, .545) / (123.904, 418.560) | (.251, .542) / (128.512, 416.256) |
| leftFoot         | (.320, .933) / (163.840, 716.544) | (.326, .925) / (166.912, 710.400) |
| rightFoot        | (.690, .933) / (353.280, 716.544) | (.686, .925) / (351.232, 710.400) |
| back (reservado) | (.580, .380) / (296.960, 291.840) | (.590, .380) / (302.080, 291.840) |

Neck permanece disponível no código, mas medalhão usa chest. Não há peça back nova neste pacote.

Fórmula de integração: `left = anchor.x + x − registration.x × width × scale` e equivalente em y. Ponto inicial x=0, y=0 e scale=1; male/female já usam seus próprios anchors. Ajustes após prova pertencem ao visualConfig do manifesto, sem deslocamentos hardcoded no componente ou alteração dos stats.

## Brief de Couraças — A01 a A04

Orientação: torso frontal da pose atual, pequenas assimetrias da perspectiva preservadas na própria arte. Anchor torso, rotation 0°, zIndex armor=2. Nenhum corpo, pescoço, braço, mão, calça, capa completa ou rosto acompanha a peça.

- **Ombros:** largura exterior dentro de 196 px lógicos female / 208 male. Gola/ombros acompanham a inclinação das sprites; tecido/placas envolvem o tórax. Não desenhar mangas com braços ocos grandes de ícone.
- **Peito:** plano frontal de tecido reforçado/couro com modelagem suave e neutra, sem sexualização. Janela superior deixa o cachecol existente visível; não colar um segundo cachecol sobre o primeiro.
- **Abdômen:** volume contínuo entre peito e cinto, dobras discretas coerentes com a postura e a iluminação. Não construir uma placa quadrada sobre a blusa.
- **Cintura:** estreitar acompanhando a base. A caixa vai até y=382 female / 386 male; o fim opaco deve respeitar cinto e cintura visíveis, sem túnica longa adicional ou avanço sobre as coxas.
- **Aberturas para braços:** alpha zero para pele/braços e espaços internos. Contorno precisa coincidir com as cavidades reais da blusa e deixar os braços visíveis, sem pintar pele para esconder erro.
- **Cachecol/capa:** o topo e as bordas da peça contornam os pixels existentes da capa/cachecol. Recortes transparentes devem deixar os trechos da base que precisam ficar à frente. Não desenhar capa nem corrigir o problema por opacity.
- **Material:** incomum — couro/tecido verde e cru, reforços simples; rara — acabamento mais trabalhado, costuras/metal dourado discreto. A geometria de encaixe não aumenta pela raridade.

Prioridade feminina aplicada antes da masculina em ambas as raridades. Se for impossível preservar capa/mãos/cabelo longo com os recortes da peça, reprovar a integração: a base indivisível pode precisar de um futuro pacote de planos próprios, que não está autorizado nem incluído nestes 14 arquivos.

## Brief de Espadas — A05 e A06

Orientação neutra de exportação: **lâmina aponta verticalmente para cima**, cabo abaixo da guarda; nenhuma rotação já pintada no arquivo. Uso: rightHand, lado direito da imagem de referência. Registro no centro da região de empunhadura em **(24,204)** lógicos dentro da fonte 48×240; no arquivo 96×480, **(48,408)**.

Aplicação inicial: +28° em torno desse registro; lâmina sobe para a direita e se afasta do torso, sem alcançar o rosto. As duas variantes usam o mesmo tamanho/orientação funcional; a comum tem acabamento contido e a rara material/detalhe próprio. Não usar a espada rara como substituta visual automática da comum.

O cabo deve tocar a região da palma indicada pelo anchor; guarda/lâmina não atravessam a pessoa. Deixar os dedos da base legíveis: contorno e pequenas áreas de transparência da peça na região de contato podem deixar o desenho existente aparecer, sem mão/pele embutida. Se o encaixe exigir pintar dedos, reprovar a fonte e revisar a composição futura; zIndex=6 sozinho não intercala uma mão que está pintada na mesma imagem do corpo.

## Brief de Elmos — A07 e A08

Interpretar a identidade do capuz/elmo de inventário como peça **vestível**: cavidade do rosto verdadeiramente transparente, sem interior escuro preenchendo a face. Exportar frontal já adaptado à respectiva cabeça; rotação 0°, head, zIndex helmet=8.

- Topo e laterais acompanham a testa/volume da cabeça dentro das caixas female 144×174 e male 142×170.
- Área de proteção do rosto na referência: aproximadamente female x=209–311, y=58–143; male x=211–313, y=60–145. Olhos, nariz, boca e expressão ficam visíveis. Esta é uma janela de projeto a conferir no desenho, não um recorte retangular rígido.
- Cabelo pode permanecer visível pela abertura e nas partes da base que saem sob o elmo. A peça deve cobrir volume incompatível nas bordas; não exportar cabelo ou rosto junto.
- Recortar a parte inferior para preservar o cachecol da base; não duplicar pescoço ou gola.
- Ordem: elmo acima da base/armadura; frontDetails=9 fica reservado se houver arte própria futura. Nenhuma nova camada de cabelo/pele será produzida neste pacote.
- Provar short, long e curly em cada corpo antes do aceite. Não usar máscara CSS para abrir o rosto de um ícone.

## Brief de Botas — A09 a A12

Arquivos independentes **left_boot e right_boot**, cada um desenhado na perspectiva do pé correspondente da sprite de seu corpo. Exportar a orientação final natural da pose idle: pontas seguem o pé e não apontam ambas para o mesmo lado. Rotação inicial 0°, zIndex boots=3; não espelhar um arquivo para fazer o outro.

As caixas recortadas cobrem a silhueta de calçado/cano apropriada, com contorno de sola compatível e alpha zero fora da bota. O cano termina na transição da calça, sem redesenhar perna/pele ou envolver coxa. Não criar uma sombra de chão nem recortar um PNG que contém um par completo.

Registration segue leftFoot/rightFoot do runtime. Esses anchors são pontos de encaixe existentes próximos à parte baixa do calçado; não devem ser confundidos com a posição anatômica do tornozelo. Conferir topo do cano e sola, não apenas o pivô.

Integração posterior: bota esquerda como overlay principal e direita em additionalOverlays; cada peça com asset/configuração próprios, ambos selecionados por corpo. Um par incompleto permanece indisponível. Validar contra as botas já pintadas na base para impedir bordas duplicadas ou sapato antigo exposto.

## Brief de Escudo — A13

Compartilhado para ambos, frontal com leve perspectiva de mão, lado esquerdo da imagem. Exportação neutra com eixo longo vertical, topo para cima. Registro em **(75.6,72.96)** lógicos dentro de 108×152; em 216×304, **(151.2,145.92)**. Aplicação inicial −8°, leftHand, zIndex shield=7.

O objeto ocupa principalmente a área exterior/lateral do braço e fica abaixo do ombro. Pode encobrir a região de contato e a borda externa do braço, mas não o torso central, peito/medalhão, rosto ou outro braço. Na posição inicial, sua borda interior fica aproximadamente em x=167 male / 172 female; ajustar o contorno real para que não esconda o corpo inteiro.

A empunhadura/contato segue o anchor e preserva dedos/pele da base por transparência apropriada da peça onde necessário. Não desenhar braço ou mão sobre o escudo; não criar uma falsa fotografia de pessoa atrás dele. Material verde e dourado sem aura ou gema emissiva. Se forem necessários planos frente/verso extras, revisá-los como novos assets em outra versão do manifesto; não escondê-los dentro de um poster ou spritesheet.

## Brief de Medalhão — A14

Nome público Medalhão do Caminho; slot técnico amulet; compartilhado. Anchor chest, zIndex medallion=4, frontal e rotação 0°. Fonte 44×72 lógicos, 88×144 exportados. Registration (.5,.72) fica sobre o ponto de peito.

Peça pequena e central, com volume de metal e cordão curto assentado no tecido, sem aura. Na largura de 264 CSS px do Avatar, a caixa inteira ocupa aproximadamente 22.7×37.1 CSS px; o pingente deve ser menor que a caixa, não um emblema gigante.

Topo do cordão chega perto da borda inferior do cachecol, mas não o atravessa. Respeitar o ornamento já pintado na base: desenhar/posicionar a peça para cobri-lo coerentemente ou preservar uma identidade única, sem dois pingentes conflitantes. Corpo opaco do pingente acima da Couraça (z4 > z2); nenhum cordão sobre olhos/rosto. Usar decoração geométrica simples de caminho/direção, sem símbolo supersticioso ou alegação de propriedade espiritual.

## Ordem de composição e limites de oclusão

Ordem já existente: background −1 → back 0 → body 1 → armor 2 → boots 3 → medallion 4 → hands 5 → weapon 6 → shield 7 → helmet 8 → frontDetails 9 → effects 10.

Os 14 arquivos ocupam somente armor, boots, medallion, weapon, shield e helmet. Nenhuma capa/mochila/acessório novo, nova mão, cabelo ou efeito é entregue. Camadas hands/frontDetails são reservas da arquitetura, não autorização para pintar corpo dentro de um asset de equipamento.

A base é indivisível. Colocar um arquivo abaixo de body o esconde atrás de toda a pessoa; acima de body o coloca também à frente dos pixels pintados de mãos, roupa, cabelo e cachecol. A arte deve ter silhueta e áreas de alpha coerentes com isso. Quando a física de oclusão exigir intercalar planos que a base não oferece, **reprovar e registrar o requisito de composição**, sem fingir correção por opacity ou embutir corpo.

## Destino de cada arquivo

Nenhum arquivo de arte existente será movido. A pasta de destino será criada durante a produção/integração autorizada, não nesta especificação.

| Asset | Destino relativo ao repositório                                                       | URL pública posterior                                                  |
| ----- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| A01   | `apps/web/public/assets/equipment/overlays/v1/armor_traveler_uncommon_female.png`     | `/assets/equipment/overlays/v1/armor_traveler_uncommon_female.png`     |
| A02   | `apps/web/public/assets/equipment/overlays/v1/armor_traveler_uncommon_male.png`       | `/assets/equipment/overlays/v1/armor_traveler_uncommon_male.png`       |
| A03   | `apps/web/public/assets/equipment/overlays/v1/armor_traveler_rare_female.png`         | `/assets/equipment/overlays/v1/armor_traveler_rare_female.png`         |
| A04   | `apps/web/public/assets/equipment/overlays/v1/armor_traveler_rare_male.png`           | `/assets/equipment/overlays/v1/armor_traveler_rare_male.png`           |
| A05   | `apps/web/public/assets/equipment/overlays/v1/sword_path_common.png`                  | `/assets/equipment/overlays/v1/sword_path_common.png`                  |
| A06   | `apps/web/public/assets/equipment/overlays/v1/sword_path_rare.png`                    | `/assets/equipment/overlays/v1/sword_path_rare.png`                    |
| A07   | `apps/web/public/assets/equipment/overlays/v1/helmet_traveler_rare_female.png`        | `/assets/equipment/overlays/v1/helmet_traveler_rare_female.png`        |
| A08   | `apps/web/public/assets/equipment/overlays/v1/helmet_traveler_rare_male.png`          | `/assets/equipment/overlays/v1/helmet_traveler_rare_male.png`          |
| A09   | `apps/web/public/assets/equipment/overlays/v1/boots_traveler_common_left_female.png`  | `/assets/equipment/overlays/v1/boots_traveler_common_left_female.png`  |
| A10   | `apps/web/public/assets/equipment/overlays/v1/boots_traveler_common_right_female.png` | `/assets/equipment/overlays/v1/boots_traveler_common_right_female.png` |
| A11   | `apps/web/public/assets/equipment/overlays/v1/boots_traveler_common_left_male.png`    | `/assets/equipment/overlays/v1/boots_traveler_common_left_male.png`    |
| A12   | `apps/web/public/assets/equipment/overlays/v1/boots_traveler_common_right_male.png`   | `/assets/equipment/overlays/v1/boots_traveler_common_right_male.png`   |
| A13   | `apps/web/public/assets/equipment/overlays/v1/shield_perseverance_rare.png`           | `/assets/equipment/overlays/v1/shield_perseverance_rare.png`           |
| A14   | `apps/web/public/assets/equipment/overlays/v1/medallion_path_rare.png`                | `/assets/equipment/overlays/v1/medallion_path_rare.png`                |

Nomes em snake_case, family/identidade/raridade + parte + body quando necessário. IDs de jogo não serão renomeados para combinar com os nomes dos PNGs.

## Pacote de entrega por asset e checklist de aprovação

Entregar o PNG final indicado na tabela e anotar metadados de dimensões, crop, registro, corpo, orientação e autoria/licença no registro de produção. A prova de composição com a base pode ser um artefato de revisão separado; não é o asset e não vai para a pasta runtime. Nunca incluir um grid/poster como substituto de uma peça.

Para **cada asset produzido**:

- [ ] Nome, itemId, parte/pé e destino correspondem à linha A01–A14, sem colisão de nomes.
- [ ] Uma imagem contém uma peça isolada; PNG/WebP realmente transparente e sRGB, sem fundo/quadriculado pintado.
- [ ] Sem corpo, mão, perna, rosto, cabelo embutido, cenário, texto ou watermark.
- [ ] Resolução 2× do crop lógico, proporção preservada, margens e bordas limpas; sem halo ou sombra externa exagerada.
- [ ] Ponto de registro toca o anchor correto; caixa, escala e rotação não produzem flutuação.
- [ ] Peças female/male encaixam no corpo indicado; fontes compartilhadas passam nos dois corpos sem esticar a silhueta.
- [ ] Elmo preserva face e passa em short/long/curly; Couraça envolve peito/abdômen/cintura e respeita aberturas de braço.
- [ ] Botas respeitam pé e calça; espada e escudo tocam a mão; dedos/roupa ficam legíveis sem atravessar o corpo.
- [ ] Cachecol/capa e medalhão têm oclusão correta na combinação completa.
- [ ] Materiais/paleta combinam com moss/ochre/blue e light/medium/dark; sem sci-fi/neon/efeitos mágicos.
- [ ] Classificação FICTIONAL/temática mantida; nenhuma relíquia ou alegação espiritual inventada.
- [ ] Funciona em 390×844, 768×1024 e 1440×900, isolado e no conjunto, preservando o Avatar 2:3.
- [ ] Prova feminina e masculina registrada; para os compartilhados, ambas são obrigatórias.
- [ ] Fonte tem autoria/licença de uso identificada; arquivo pode ser distribuído no projeto.
- [ ] Integração posterior utiliza overlayAsset dedicado, visualConfig e EQUIPMENT_COMPOSITION_LAYERS; iconAsset segue apenas na UI.
- [ ] Nenhuma regressão de equipar/desequipar/trocar/atributos; camada antiga desaparece e a base não pisca.
- [ ] Somente depois do aceite técnico e visual o item muda de NEEDS_NEW_OVERLAY para READY.

Aprovação é individual por arquivo e também por item completo: ambas as botas e a variante de corpo requerida precisam passar. Esta especificação concluída não substitui a aprovação da arte futura.
