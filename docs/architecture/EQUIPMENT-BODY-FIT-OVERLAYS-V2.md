# Equipment Body-fit Overlays V2

Arquitetura estabelecida: TASK-0034, autorizado pelo usuário em 2026-10-02.
Extensão vigente: TASK-0051, Body-Fit sobre HD aprovado, sem geração de mídia.

## Reprovação V1

O usuário reprovou a composição corporal V1. Elmo sem encaixe natural,
botas coladas, espada pequena/deslocada e divergências de perspectiva e
silhueta são problemas de produção contra o corpo real. PNG com detalhe e
alpha corretos não comprova encaixe visual. A inspeção automatizada e a
avaliação anterior pelo autor não equivalem à aprovação humana do usuário.

V1 produz peças isoladas com crop; anchors/registration e offsets x/y/scale
tentam encaixá-las depois sobre um Avatar precomposto, que já contém roupas,
cabelo, mãos e pés. Esses ajustes não corrigem perspectiva, anatomia ou a
oclusão da roupa pintada na base. V2 exige desenhar contra a base real.

## Preservação e fallback

- Os 14 PNGs V1 permanecem intactos em `apps/web/public/assets/equipment/overlays/v1/`.
- As oito definições passam a `NEEDS_NEW_OVERLAY`, sem aprovação corporal e sem camadas no Avatar.
- `overlayAsset` e calibração V1 ficam arquivados; compatibilidade cropped permanece funcional para fontes realmente aprovadas.
- `iconAssetHighQuality` referencia as fontes V1 para uso futuro em UI, selecionando variante de corpo quando houver. Não há migração de telas nesta tarefa; botas V1 continuam com peças esquerda/direita arquivadas, sem fabricar um ícone composto.
- `iconAsset` continua sendo inventário/cards/UI. Nunca é inferido como camada corporal.
- Item sem overlay aprovado continua equipável, com atributos, card e feedback de camada pendente. Não aparece no corpo. Catálogo, stats, economia e persistência não mudam.

## Contrato full-canvas

| Propriedade   | V1 cropped                                 | V2 body-fit                                                    |
| ------------- | ------------------------------------------ | -------------------------------------------------------------- |
| `overlayMode` | `cropped` ou omitido por compatibilidade   | `full-canvas` explícito                                        |
| Fonte         | crop individual, tamanho variável          | PNG transparente **1024×1536**                                 |
| Coordenadas   | anchor + registration + x/y/scale/rotation | mesmas coordenadas e enquadramento da base                     |
| Configuração  | `visualConfig` base + male/female          | `fullCanvasConfig.sourceSize` e `zIndex`; `visualConfig: null` |
| Renderer      | caixa proporcional ao canvas lógico        | absolute, inset 0, width 100%, height 100%                     |
| Aprovação     | humana por corpo                           | humana por corpo                                               |

O canvas lógico permanece **512×768**, aspect ratio 2:3, com CSS proporcional
ao container existente. Fonte 1024×1536 representa 2× do canvas lógico;
não vira 1024 CSS px. A demanda HiDPI depende do tamanho CSS e DPR; não é
garantia ilimitada de detalhe. Desde TASK-0050, a base normal é HD aprovado
1024×1536, com fallback legado 512×768. TASK-0051 preserva ambas as fontes;
novos overlays devem ser desenhados contra a base HD atual.

`EquipmentOverlayDefinition` declara o modo e a fonte. `FullCanvasOverlayConfig`
contém somente tamanho de produção e plano de composição. O resolver valida
1024×1536 declarados, zIndex finito, fonte local PNG e variante corporal.
`ResolvedOverlayLayer.overlayMode` dirige o renderer. Sua geometria lógica
neutra (canvas, 0/0, 512×768) mantém a interface legada; não é calibração de
encaixe. O ramo full-canvas ignora visualConfig, não aplica left/top,
transform, rotation, mirror ou transformOrigin.

Male/female usam `overlayAsset` com variantes; uma variante ausente não usa
automaticamente a outra. Fonte compartilhada é permitida apenas se seu
encaixe for aprovado nos dois corpos. Um único PNG V2 pode conter as duas
botas. `additionalOverlays` continua disponível para planos independentes;
um conjunto incompleto não é composto parcialmente.

Ordem central preservada: body 1, armor 2, boots 3, medallion 4, hands 5,
weapon 6, shield 7, helmet 8, frontDetails 9, effects 10. Planos abaixo do
corpo continuam possíveis. A base indivisível limita oclusão: arte deve
considerar roupa/mãos/cabelo já pintados; full-canvas sozinho não cria recortes.

## Aprovação obrigatória

`visualQuality: READY` sozinho não permite renderizar. O resolver também exige
`bodyOverlayApproval[bodyType] === APPROVED_BY_USER`. Registrar esse valor
somente após aprovação visual explícita do usuário para a fonte, variante
corporal e composição efetivamente avaliadas. Mudança de arte/enquadramento
exige revogar aprovação e nova revisão. Não é permissão de segurança: é gate
editorial de configuração. Nenhuma entrada de produção possui aprovação agora.

Metadados sozinhos não comprovam dimensões/alpha nem existência física.
TASK-0051 também remove full-canvas cuja dimensão decodificada real diverge
de 1024×1536, assim como fontes com erro de carregamento. Antes de integrar uma fonte real: verificar arquivo presente,
header/dimensões/alpha transparente, proporção, carregamento, slots isolados e
combinação sobre a base real em Herói/Equipamentos. Só depois da revisão
humana por corpo registrar READY. Fixtures aprovadas nos testes são sintéticas
e não autorizam assets reais. Não integrar caminhos inexistentes como READY.

## Animação

Atualização TASK-0035: [animação híbrida V2](EQUIPMENT-ANIMATION-V2.md) substitui o fluxo descrito abaixo. Um clone temporário de iconAsset viaja pela UI por 440 ms, recebe impacto de 120 ms e desaparece; o overlay real revela no lugar por 180 ms. Isso vale também para cropped e fallback pendente, mantendo o gate humano e a proibição de usar ícones como camadas corporais. O texto seguinte registra a preparação histórica da TASK-0034.

Para full-canvas, equipar atualiza o estado e aplica o efeito existente de
chegada (fade/brilho) na camada final alinhada. Não faz voar a partir do card
um canvas quase vazio em miniatura. O voo cropped de 660 ms permanece
compatível para arte aprovada nesse modo. Trocar/desequipar preserva a base
memoizada e não duplica camadas. Movimento reduzido permanece respeitado
pelos estilos existentes.

## Primeiro protótipo: quatro fontes femininas

Somente especificação, **nenhum arquivo produzido ou integrado** nesta tarefa.
Destino futuro: `apps/web/public/assets/equipment/overlays/v2/`.

| Arquivo                                 | Exigência de encaixe                                     |
| --------------------------------------- | -------------------------------------------------------- |
| `armor_traveler_uncommon_female_v2.png` | ombros, tórax, cintura, braços e roupa existente         |
| `helmet_traveler_rare_female_v2.png`    | cabeça/direção real, cabelo e rosto claramente visível   |
| `boots_traveler_common_female_v2.png`   | ambas as botas na posição dos pés, sem deslocar silhueta |
| `sword_path_common_female_v2.png`       | perspectiva corporal, cabo coincidente com a mão         |

Todos: PNG transparente 1024×1536, mesmos enquadramento/pose/coordenadas do
Avatar feminino real, sem crop posterior. Usar a base real como referência,
mas exportar somente pixels do equipamento; não incluir corpo nem fundo.
O overlay deve encaixar em 100% sem correção artificial de offsets.
Revisar cabelo curto/longo/cacheado e composição conjunta; não encobrir rosto
nem deixar duplicação visual da roupa original sem avaliação humana.

Após aprovação visual desses quatro pelo usuário, avaliar produção restante,
inclusive variantes masculinas, Couraça rara, escudo junto ao braço/mão e
medalhão pequeno sobre o tórax. Não produzir 14 V2 antecipadamente.

## Validação desta preparação

Testes unitários verificam aprovação por corpo, fallback, fontes ausentes,
dimensão declarada inválida, full-canvas sem transformação, botas em uma
camada, ordenação e compatibilidade cropped, equipar/desequipar e base
preservada. Testes reais V1 verificam 14 arquivos com alpha intactos e a
ausência corporal após reprovação; E2E exercita ambos os corpos, cinco
viewports e DPR 1/2/3, UI, atributos, persistência e ausência de requests V1
corporais. A prévia V1 antiga foi desativada com motivo explícito.

Resultados finais estão no contrato TASK-0034. Não existe QA visual V2 real
sem os quatro protótipos; testes de arquitetura não substituem esse aceite.

## TASK-0051 — extensão HD e estado atual

Nenhum PNG V2 encontrado. Oito definições continuam NEEDS_NEW_OVERLAY,
zero READY, seis itens mecânicos atuais e duas definições raras arquivadas.
[BODY_FIT_CURRENT_STATE](BODY_FIT_CURRENT_STATE.md) registra ambos os gêneros;
[NEEDS_NEW_BODY_FIT_ASSET](NEEDS_NEW_BODY_FIT_ASSET.md) lista 16 alvos com
landmarks, prioridade, referência HD e hashes reais no JSON companheiro.
P0 são os quatro protótipos femininos; demais fases aguardam seu aceite.

Resolver aceita somente o namespace local `/assets/equipment/overlays/`, sem
traversal, query/hash ou aliases codificados. Ícones permanecem UI/cinematic.
Gate READY + APPROVED_BY_USER por gênero permanece; nenhum foi promovido.
Ordem global e anchors históricos preservados, sem recalibração sobre legado.

Lab exclusivamente Vite DEV em `/tools/arena-lab/`, painel Body-Fit V2:
54 identidades HD, gênero/item, liga/desliga, comparação sem/com, zoom 50–200%,
divisão deslizante 50/50, silhueta e guias. Mobile empilha a comparação;
zoom pode exigir scroll interno. Nenhum save ou aprovação é gravado.
Bounding box/baseline por identidade medidos em alpha ≥128; alpha >0 é
diagnóstico. Anchors magenta são históricos indicativos, não landmarks
anatômicos HD validados. Grip, hairline, ombros, cintura e tornozelos exigem
medição/revisão da composição quando houver arte.

Cabelo, roupa e mãos estão pré-compostos na base. Helmet deve considerar
curto/longo/cacheado, preservando rosto e cabelo sem edição da base. Se a
arte não conseguir oclusão correta, produzir planos dedicados compatíveis
com `additionalOverlays` e camada `frontDetails`, com nova revisão humana;
não fabricar recorte de cabelo. Sword pode exigir peça da mão em plano
frontal para empunhadura correta; plano hands 5 abaixo de weapon 6 sozinho
não resolve essa oclusão. Não alterar a ordem global sem arte/evidência.

Auditoria HD permanente continua verificando 54 PNGs/hashes/receipts em
cada build. A baseline histórica de código TASK-0050 agora é opcional via
`--preservation-task-0050`; não deve congelar tarefas autorizadas posteriores.
TASK-0051 usa baseline própria de 182 arquivos protegidos no auditor
`node scripts/body-fit-v2-audit.mjs`. Evidências TASK-0050 não são sobrescritas.

Estado: BODY_FIT_ARCHITECTURE_VALIDATED / ASSET_GENERATION_REQUIRED.
TASK-0051 não DONE; alinhamento visual real bloqueado por arte ausente.
