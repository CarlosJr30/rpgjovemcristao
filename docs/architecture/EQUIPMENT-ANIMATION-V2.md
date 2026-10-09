# Equipment animation V2 — TASK-0035

> Histórico: a apresentação desta tarefa foi substituída pela [Cinematic Equip Animation V1 — TASK-0036](EQUIPMENT-CINEMATIC-V1.md). Os tempos e o fluxo abaixo descrevem a entrega anterior; o contrato de separar iconAsset/overlayAsset continua vigente.

Autorização explícita do usuário em 2026-10-02. A distinção obrigatória é:
**o ícone viaja pela UI; o overlay corporal aparece alinhado no Avatar**.

## Sequência

1. Capturar uma vez sourceRect do ícone do card e targetRect do canvas do Avatar.
2. Desvanecer a camada anterior em 120 ms e bloquear ações de equipar/remover durante a transição.
3. Criar clone temporário de `iconAsset` em portal no `document.body`, fora da composição corporal.
4. Voo curvo de 440 ms com ease-out e escala discreta 1 → 1,06 → 0,55.
5. Impacto dourado discreto durante 120 ms; clone desvanece e é removido.
6. Chamar a operação de equipar existente e revelar a camada resolvida em 180 ms: opacity 0 → 1. Duração normal total 740 ms.

Nenhum PNG corporal, cropped ou full-canvas, é usado pelo voo. Nenhum ícone
é persistido como camada. A classe de pose que transformava o container do
Avatar deixa de ser aplicada durante equipar. Full-canvas conserva inset 0,
100% e ausência de transform/offsets de encaixe durante todo o fluxo.

## Destinos e geometria

`data/equipmentAnimation.ts` centraliza tempos e geometria transitória. Usa
os mesmos `BODY_ANCHORS` por corpo: head, torso, rightHand, leftHand e chest;
botas chegam ao ponto médio dos dois pés. Anchors servem à animação UI e
não calibram o desenho V2. Male/female usam suas medidas correspondentes.

O clone nunca excede 80 px por eixo. O arco máximo é 64 px em desktop e 28 px em mobile. Uma origem fora do viewport também é projetada para a borda, mantendo o percurso visível. O ponto intermediário curva para dentro junto às bordas. Quando o Avatar está
fora do viewport, a chegada é projetada para sua borda visível,
indicando a direção do Avatar sem rolar a página nem alongar a animação.
O overlay real permanece no container original. Não há recálculo por frame,
física, layout thrashing, filtro de blur ou escala do corpo. Flight/impact
animam apenas transform/opacity; box-shadow/background do impacto são fixos.

## Troca, remoção e acessibilidade

A camada antiga recebe fade-out; a nova só entra após o impacto, sem duas
camadas completas simultâneas. Desequipar aplica fade-out de 120 ms antes
da operação existente; não faz voar de volta o equipamento inteiro.

Com `prefers-reduced-motion: reduce`, não há clone nem impacto; uma troca primeiro desvanece a camada anterior por 120 ms. A camada
usa somente fade curto de opacidade, sem escala/translação. Efeitos
temporários são aria-hidden, não recebem foco e não interceptam ponteiros;
status existente comunica o resultado. Falha ao equipar remove o clone e
informa que o item não está disponível. Desmontagem cancela o timer e o
portal, sem equipar tardiamente após sair da tela.

## Fallback e limites

`NEEDS_NEW_OVERLAY` executa voo/impacto e a operação existente normalmente;
nenhuma camada aparece e o feedback continua indicando pendência corporal.
Não houve promoção READY, alteração de arte, inventário como regra,
persistência, stats ou economia. O gate humano da TASK-0034 continua vigente.

Arte V2 real ainda ausente: alinhamento e reveal são cobertos por fixtures
sintéticas de contrato, que não autorizam produção. E2E usa os ícones reais
e fallback real nos seis slots, ambos os corpos, desktop 1440×900/mobile
390×844, troca, remoção e reduced motion. Detalhe/encaixe da futura arte
precisa da aprovação humana antes de READY. Resultados e evidências finais
estão em TASK-0035.
