# Avatar e Equipment Overlays V1 — auditoria HD

> **Estado vigente — 2026-10-02 / TASK-0034:** o usuário reprovou o encaixe corporal V1. Os oito IDs estão `NEEDS_NEW_OVERLAY`, sem aprovação corporal; os 14 PNGs permanecem preservados para UI/arquivo. Resultados técnicos abaixo são históricos e não representam aprovação visual humana. Ver [contrato Body-fit V2](EQUIPMENT-BODY-FIT-OVERLAYS-V2.md).


Data: 2026-10-01. TASK-0033. Base: [manifesto V1](EQUIPMENT-OVERLAY-ASSET-MANIFEST-V1.md).

Atualização 2026-10-02: os arquivos posteriormente disponibilizados foram integrados e aprovados. Consulte [integração V1 e medidas atuais](EQUIPMENT-OVERLAY-V1-INTEGRATION.md). Este documento preserva a auditoria anterior, feita quando os PNGs finais ainda estavam externos.

## Escopo e resultado

O usuário confirmou que os 14 PNGs finais ainda estão externos e orientou continuar apenas a auditoria HD. Nenhuma arte foi gerada, copiada, integrada ou marcada READY. Encaixe, alpha, nitidez dos equipamentos e performance do pacote não podem ser aprovados sem os arquivos.

Antes dessa orientação, foram aplicadas correções locais: image-rendering pixelated → auto em Avatar normal/pequeno, dimensões intrínsecas 512×768 no img e auto explícito na camada de equipamento. Nenhum layout ampliado ou registro de overlays modificado. As demais alterações posteriores são testes/documentação.

## Pipeline e causa de perda de qualidade

- Avatar e EquippedAvatar já usam img nativo com URLs locais PNG, sem Next/Image. Método mantido para preservar original/alpha sem conversão ou compressão adicional. Nenhuma otimização global desativada.
- Não há canvas intermediário. Dimensões percentuais dos overlays vêm do canvas lógico 512×768 e visualConfig, separadas da resolução da fonte.
- Pixelated era inadequado para esta ilustração. Comparação controlada reproduziu o CSS anterior na mesma imagem antes de restaurar auto. Inspeção pelo autor nos dois corpos, desktop DPR 2/mobile DPR 3: contornos menos serrilhados com auto. A interpolação suaviza; não cria detalhes novos nem elimina limitações da fonte.
- Nas telas Herói/Equipamentos, nenhum transform estático na imagem/ancestrais, proporção 2:3 e nenhum upscale CSS. Animação idle antiga está desativada nesses contextos.
- Overlays estáticos usam rotação no registro; scale do resolver modifica dimensões lógicas. O voo de equipar usa transform para animação até o tamanho final, sem definir o tamanho estático. Seu resultado visual com arte real permanece pendente.
- A fonte 512×768 é insuficiente para ocupar todos os pixels físicos em DPR elevado. Não atribuir esse déficit ao Next/Image ou a compressão que não ocorre nesse caminho.

## Medidas reais do Avatar

54 PNGs auditados, 27 por corpo, todos 512×768. **60 amostras**: dois corpos × duas telas × cinco viewports × três DPRs. Valores iguais para male/female.

Escala CSS = largura CSS / largura source. **Escala efetiva = largura CSS × DPR / largura source**; acima de 1 exige interpolação na grade física. A altura tem a mesma escala.

| Item / tela                     | Viewport       | Source resolution | CSS display size | Escala CSS | Effective scale DPR 1 / 2 / 3 | DPR   | Status                                |
| ------------------------------- | -------------- | ----------------- | ---------------- | ---------- | ----------------------------- | ----- | ------------------------------------- |
| Avatar Herói male/female        | 390×844        | 512×768           | 195×292,5        | 0,381×     | 0,381 / 0,762 / 1,143×        | 1/2/3 | Limitado DPR 3                        |
| Avatar Herói male/female        | 412×915        | 512×768           | 195×292,5        | 0,381×     | 0,381 / 0,762 / 1,143×        | 1/2/3 | Limitado DPR 3                        |
| Avatar Herói male/female        | 768×1024       | 512×768           | 210×315          | 0,410×     | 0,410 / 0,820 / 1,230×        | 1/2/3 | Limitado DPR 3                        |
| Avatar Herói male/female        | 1440×900       | 512×768           | 264×396          | 0,516×     | 0,516 / 1,031 / 1,547×        | 1/2/3 | Déficit pequeno DPR 2; limitado DPR 3 |
| Avatar Herói male/female        | 1920×1080      | 512×768           | 264×396          | 0,516×     | 0,516 / 1,031 / 1,547×        | 1/2/3 | Déficit pequeno DPR 2; limitado DPR 3 |
| Avatar Equipamentos male/female | Todas as cinco | 512×768           | 240×360          | 0,469×     | 0,469 / 0,938 / 1,406×        | 1/2/3 | Limitado DPR 3                        |

**Avatar Runtime HD recomendado: 1024×1536 com detalhe real**, mantendo pose, alpha e correspondência dos anchors. Não ampliar artificialmente as fontes existentes nem regenerar automaticamente. O máximo medido em DPR 3 requer 792×1188; 1024×1536 oferece margem. Manter o tamanho CSS separado da fonte. Um srcset 1×/2× futuro só deve ser registrado quando existirem as fontes correspondentes.

## Os 14 arquivos finais

Destino comum: apps/web/public/assets/equipment/overlays/v1/. Resoluções entre parênteses são planejadas pelo manifesto; não são medidas de arquivos existentes. CSS/escala/DPR reais dos overlays ausentes não são mensuráveis.

| Item / arquivo                           | Source resolution           | CSS display size | Effective scale | DPR         | Status            |
| ---------------------------------------- | --------------------------- | ---------------- | --------------- | ----------- | ----------------- |
| `armor_traveler_uncommon_female.png`     | Ausente (392×432 planejado) | N/A              | N/A             | Não testado | NEEDS_NEW_OVERLAY |
| `armor_traveler_uncommon_male.png`       | Ausente (416×440 planejado) | N/A              | N/A             | Não testado | NEEDS_NEW_OVERLAY |
| `armor_traveler_rare_female.png`         | Ausente (392×432 planejado) | N/A              | N/A             | Não testado | NEEDS_NEW_OVERLAY |
| `armor_traveler_rare_male.png`           | Ausente (416×440 planejado) | N/A              | N/A             | Não testado | NEEDS_NEW_OVERLAY |
| `sword_path_common.png`                  | Ausente (96×480 planejado)  | N/A              | N/A             | Não testado | NEEDS_NEW_OVERLAY |
| `sword_path_rare.png`                    | Ausente (96×480 planejado)  | N/A              | N/A             | Não testado | NEEDS_NEW_OVERLAY |
| `helmet_traveler_rare_female.png`        | Ausente (288×348 planejado) | N/A              | N/A             | Não testado | NEEDS_NEW_OVERLAY |
| `helmet_traveler_rare_male.png`          | Ausente (284×340 planejado) | N/A              | N/A             | Não testado | NEEDS_NEW_OVERLAY |
| `boots_traveler_common_left_female.png`  | Ausente (176×328 planejado) | N/A              | N/A             | Não testado | NEEDS_NEW_OVERLAY |
| `boots_traveler_common_right_female.png` | Ausente (232×328 planejado) | N/A              | N/A             | Não testado | NEEDS_NEW_OVERLAY |
| `boots_traveler_common_left_male.png`    | Ausente (216×332 planejado) | N/A              | N/A             | Não testado | NEEDS_NEW_OVERLAY |
| `boots_traveler_common_right_male.png`   | Ausente (256×332 planejado) | N/A              | N/A             | Não testado | NEEDS_NEW_OVERLAY |
| `shield_perseverance_rare.png`           | Ausente (216×304 planejado) | N/A              | N/A             | Não testado | NEEDS_NEW_OVERLAY |
| `medallion_path_rare.png`                | Ausente (88×144 planejado)  | N/A              | N/A             | Não testado | NEEDS_NEW_OVERLAY |

READY: nenhum. Pendentes: Couraças incomum/rara, espadas comum/rara, elmo, botas, escudo e medalhão (oito IDs). Ícones continuam exclusivos de UI.

## Regra HD para integração futura

visualConfig.size permanece em pixels lógicos, scale 1 inicial. Fonte 392×432 representa peça lógica 196×216. No Herói desktop, sua largura visual projetada é 196 × 264 / 512 = **101,06 CSS px**, altura 111,38. A escala efetiva em DPR 3 seria **0,773×**. A densidade 2× do manifesto se refere ao canvas lógico; não manda duplicar CSS.

Nas viewports medidas, todos os crops planejados 2× teriam escala efetiva máxima 0,773× em DPR 3 com scale 1, sem deformação. Isso é projeção matemática, não aprovação da arte. Se o canvas chegar a 512 CSS px, DPR 3 exigirá densidade 3×. Conferir fonte e tamanho real depois da calibração.

Integrar somente PNG RGBA dedicado e isolado, sem fundo/checkerboard/corpo. Calibrar via visualConfig male/female, anchors, registro e camadas centrais. Seguir checklist do manifesto para alpha, detalhe, contato das mãos/pés/torso, rosto e oclusão antes de READY. Não inserir URLs ausentes nem reaproveitar ícones no corpo.

## Performance

- Fontes atuais: 373.247–419.480 bytes por Avatar (aproximadamente 365–410 KiB); catálogo total 21.310.798 bytes. Decodificação RGBA 512×768 equivale a aproximadamente 1,5 MiB por imagem, sem outras estruturas do navegador.
- Resolver/componente renderizam Avatar atual e camadas dos itens equipados READY. Não há preload do catálogo inteiro de overlays. Atualmente nenhuma camada dedicada é solicitada porque todas estão indisponíveis.
- Não foi adicionado preload nem lazy-loading ao Avatar principal. Para camadas visíveis, preservar carregamento dos elementos renderizados. Preload futuro deve ser restrito a itens possuídos se uma medição justificar necessidade.
- Bytes, tempo de download, decodificação e memória das artes finais ainda desconhecidos. Não se afirma aprovação de performance do pacote. DPR foi emulado no Chromium/Edge local, sem benchmark em aparelhos físicos.

## Evidências e checks

- npm test: **37 arquivos / 204 testes PASS**, incluindo equipment-assets e equipment-overlays.
- npm run test:e2e -- tests/e2e/avatar-hd.spec.ts tests/e2e/hero-overlays.spec.ts: **5 PASS, 1 skip intencional**. Teste HD cria contextos DPR 1/2/3 e evita duplicação mobile. Regressão de equipar/Herói roda nos dois corpos, desktop/mobile.
- npm run lint / npm run typecheck / npm run build: **PASS**. Primeiras tentativas unit/build/E2E falharam por spawn EPERM; execuções autorizadas fora do sandbox passaram, sem instalação de dependências.
- Medidas em test-results/avatar-hd-Avatar-HD-native-PNG-CSS-geometry-and-DPR-audit-desktop/asset-audit.json (artefato local ignorado pelo Git). Quatro pares before-pixelated/after-auto no mesmo diretório: male/female em 1440 DPR 2 e 390 DPR 3, inspecionados pelo autor, sem revisão independente.
- 60 medições verificam source, auto, proporção, ausência de transform estático e nenhum ícone corporal.
- Patches localizados preservam trabalho anterior. Next-env regenerado pelo build foi restaurado aos bytes anteriores. Sem alterações de stats, Auth, backend ou gameplay.

Auditoria encerrada no escopo reduzido explicitamente pelo usuário. Integração/aprovação dos equipamentos permanece trabalho posterior após organização dos arquivos externos.
