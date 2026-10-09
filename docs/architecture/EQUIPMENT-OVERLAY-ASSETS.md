# Avatar e Equipment Overlays V2 — TASK-0031

> **Estado vigente — 2026-10-02 / TASK-0034:** o usuário reprovou o encaixe corporal V1. Os oito IDs estão `NEEDS_NEW_OVERLAY`, sem aprovação corporal; os 14 PNGs permanecem preservados para UI/arquivo. Resultados técnicos abaixo são históricos e não representam aprovação visual humana. Ver [contrato Body-fit V2](EQUIPMENT-BODY-FIT-OVERLAYS-V2.md).


Especificação de produção: [Equipment Overlay Asset Manifest V1](EQUIPMENT-OVERLAY-ASSET-MANIFEST-V1.md). Estado vigente em 2026-10-02: [integração V1](EQUIPMENT-OVERLAY-V1-INTEGRATION.md), com 14 PNGs e oito IDs visuais READY. A auditoria abaixo é o registro histórico da TASK-0031, anterior aos novos assets.

## Auditoria de assets — 2026-10-01

Existem somente seis PNGs de equipamentos em `apps/web/public/assets/equipment/`, todos **1254 × 1254, RGBA**. A inspeção visual confirmou ilustrações isoladas para cards, sem exportação corporal calibrada para os sprites male/female de **512 × 768**. Nenhum overlay dedicado está disponível ou foi produzido nesta tarefa.

| Slot                            | iconAsset existente (sob /assets/equipment/) | Diagnóstico                                                                                             | Compatibilidade corporal            | Qualidade         |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------------- |
| helmet                          | helmet/traveler_helmet_rare_icon.png         | Capuz isolado; interior opaco; exigia máscara artificial para mostrar rosto                             | Nenhum overlay male/female aprovado | NEEDS_NEW_OVERLAY |
| armor                           | armor/traveler_armor_rare_icon.png           | Túnica vazia com ombros, mangas e cachecol; era aplicada como adesivo de aproximadamente 281 px lógicos | Nenhum overlay male/female aprovado | NEEDS_NEW_OVERLAY |
| weapon                          | weapon/traveler_sword_rare_icon.png          | Ilustração de espada; ajuste anterior de cabo não constitui exportação corporal aprovada                | Nenhum overlay male/female aprovado | NEEDS_NEW_OVERLAY |
| shield                          | shield/traveler_shield_rare_icon.png         | Escudo frontal isolado, sem relação de oclusão com mão/braço                                            | Nenhum overlay male/female aprovado | NEEDS_NEW_OVERLAY |
| boots                           | boots/traveler_boots_common_icon.png         | Par em perspectiva de objeto; era dividido com clipPath e ocultação da canela por máscara               | Nenhum overlay male/female aprovado | NEEDS_NEW_OVERLAY |
| medallion (slot técnico amulet) | amulet/amulet_of_the_path_icon.png           | Medalhão com corrente truncada; o sprite base já traz ornamentos no peito                               | Nenhum overlay male/female aprovado | NEEDS_NEW_OVERLAY |

Causa removida: as configurações antigas usavam `icons.*` como arte corporal. A Couraça tinha tamanho-base 296 × 296 com escala .95/.94, sem respeitar a anatomia da roupa já pintada no sprite. Além disso, `status: ready` autorizava renderização mesmo quando `visualQuality` exigia nova arte. O voo de equipar tinha outro fallback de ícone até o corpo.

## Contrato visual e resolver

`equipmentAssets.ts` é a fonte única de `EquipmentDefinition` e do manifesto visual. Não altera o catálogo mecânico, inventário ou atributos.

- `iconAsset`: somente UI, cards, loja e inventário.
- `overlayAsset`: arte corporal dedicada, uma string ou mapa male/female; `null` quando ausente.
- `visualQuality`: apenas READY permite composição; disponibilidade efetiva vem do mesmo resolver usado pela UI.
- `visualConfig`: configuração base compartilhada com overrides male/female, incluindo anchor, x, y, scale, rotation, mirrorX explícito, zIndex, size e registration.
- `additionalOverlays`: peças independentes, como bota direita, planos da mão ou detalhes frontais. Não ativa slots novos.

Fluxo: `itemId → resolveEquipmentDefinition → resolveEquipmentVisual → camadas resolvidas`. A definição combina metadados visuais com a referência ao equipamento existente no catálogo. IDs legados do manifesto podem não ter entrada mecânica no catálogo; isso não cria novo item.

`equipmentAssetForItem`, `equipmentVisualForItem` e `equipmentOverlayForItem` são adaptadores do mesmo contrato. `equippedOverlayLayers` exige posse, ID equipado e slot correspondente, e ordena todas as peças. Não há switch por item no componente.

O resolver rejeita ícone atribuído explicitamente, inclusive ícone de outro slot, fontes externas, URL com query/hash, ausência de variante corporal/configuração e dimensões inválidas. Um par incompleto de botas é suprimido integralmente. Sem arte aprovada, o item permanece equipável, com ícone no card e atributos intactos, mas sem imagem nem voo até o corpo.

Exemplo de definição para **arte futura**, após inspeção e calibração:

```ts
{
  slot: 'weapon',
  iconAsset: '/assets/equipment/weapon/item_icon.png',
  overlayAsset: {
    male: '/assets/equipment/overlays/item_male.webp',
    female: '/assets/equipment/overlays/item_female.webp',
  },
  visualQuality: 'READY',
  visualConfig: {
    base: {
      anchor: 'rightHand',
      registration: { x: 0.25, y: 0.75 },
      size: { width: 100, height: 200 },
      x: 0, y: 0, scale: 1, rotation: 15,
      zIndex: EQUIPMENT_COMPOSITION_LAYERS.weapon,
    },
    female: { scale: 0.9, x: 2, y: -1 },
  },
}
```

Esses valores são conceituais e usados em fixtures de testes, sem arquivo de arte correspondente. Não são calibração de item de produção.

## Anchors e composição

Fonte: `bodyAnchors.ts`, coordenadas normalizadas no canvas 512 × 768.

| Anchor            | Male         | Female       |
| ----------------- | ------------ | ------------ |
| head              | (.500, .102) | (.496, .100) |
| torso             | (.500, .380) | (.496, .380) |
| chest             | (.500, .339) | (.496, .338) |
| rightHand         | (.762, .548) | (.752, .542) |
| leftHand          | (.242, .545) | (.251, .542) |
| leftFoot          | (.320, .933) | (.326, .925) |
| rightFoot         | (.690, .933) | (.686, .925) |
| back              | (.580, .380) | (.590, .380) |
| neck (preservado) | (.526, .197) | (.515, .202) |

Padrões semânticos de slot: elmo→head; Couraça→torso; arma→rightHand; escudo→leftHand; botas→leftFoot/rightFoot; medalhão→chest. A configuração pode selecionar a mão/lado apropriado ao item. Back prepara capa/mochila/acessórios sem ativar novos slots.

Ordem central em `EQUIPMENT_COMPOSITION_LAYERS`: background (-1), back (0), body (1), armor (2), boots (3), medallion (4), hands (5), weapon (6), shield (7), helmet (8), frontDetails (9), effects (10).

O sprite base é uma única imagem com roupas, capa, braços, cabelo, calçados e ornamentos já pintados. Esses planos não são inventados nem separados nesta tarefa. As camadas hands/frontDetails estão disponíveis para arte dedicada futura; zIndex sozinho não resolve oclusão dentro de um bitmap indivisível.

`resolveOverlayPlacement` aplica offsets e registro da fonte sobre o anchor. Rotação ocorre em `transformOrigin` correspondente ao registro, preservando o contato da empunhadura com a mão. O renderer converte a caixa lógica para percentuais de um container 2:3.

## Animações e legado consolidado

Somente overlay aprovado pode voar do card ao corpo, com proporção preservada e mesmo ponto de registro da camada final: 620 ms de transição e commit ao equipar após 660 ms. O anterior faz fade curto; a camada nova recebe brilho discreto. Movimento reduzido continua sem voo. Sem overlay, o item equipa diretamente, com feedback no card/slot e atributos.

O Avatar base é memoizado e mantém o mesmo nó durante equipar/trocar/desequipar. Removidos: `status` conflitante, arrays duplicados maleOverlay/femaleOverlay, calibrações artificiais de ícones, máscaras de elmo/botas, fallback de voo de ícone e quatro animações de overlay idênticas. Reexports de ícones em `avatarAssets.ts` foram mantidos porque ainda têm consumidores de UI.

## READY e pacote de arte pendente

**READY: nenhum equipamento.** Isso descreve o catálogo de arte auditado, não uma falha de equipar.

**NEEDS_NEW_OVERLAY:**

| ItemId                  | Item                   | Arte corporal futura                                                  |
| ----------------------- | ---------------------- | --------------------------------------------------------------------- |
| traveler-armor-uncommon | Couraça do Viajante    | Torso/ombros/cintura male/female; prioridade feminina                 |
| traveler-armor-rare     | Variante rara legada   | Arte própria ou reutilização explicitamente aprovada da Couraça       |
| traveler-helmet-rare    | Elmo do Viajante       | Abertura transparente e encaixe na testa/cabelo male/female           |
| traveler-boots          | Botas do Viajante      | Peças esquerda/direita compatíveis com a pose e cada pé               |
| traveler-sword-common   | Espada do Caminho      | Arte da variante comum com cabo registrado na mão                     |
| traveler-sword-rare     | Espada rara legada     | Arte/calibração corporal própria da variante rara                     |
| traveler-shield-rare    | Escudo da Perseverança | Planos adequados de braço/mão e escudo, por lado/corpo                |
| wisdom-amulet           | Medalhão do Caminho    | Corrente/peça alinhadas ao peito, sem competir com ornamentos da base |

Produzir PNG RGBA ou WebP com alpha, iluminação/perspectiva compatíveis e registro documentado. Exportações alinhadas podem usar canvas 1024 × 1536 (2× o lógico); peças recortadas devem declarar size e registration correspondentes. Não renomear/copiar os ícones como se fossem overlays. Inspecionar com a base feminina e masculina antes de marcar READY.

Caminhada, dano, vitória, oração e costas precisam de arte específica para cada pose antes de receber equipamentos nessas cenas. TASK-0031 não modifica essas cenas.

## Validação

Testes unitários/componentes usam definições dedicadas de teste para validar resolução de arte aprovada, variantes, registro/rotação, ordem, peças de botas, equipar, trocar, remover, fallback e não mutação de atributos. Fixtures não são assets READY de produção.

E2E valida o catálogo real com fallback nas configurações base, seis slots individuais e conjunto completo para male/female em 390×844, 768×1024 e 1440×900, além de contexto mobile real de 390×844. Confere geometria 2:3, imagem carregada, UI dos atributos, ícones nos cards, equipar/desequipar/trocar, reload e ausência de voo de ícone. Resultados e evidências finais ficam no contrato TASK-0031.
