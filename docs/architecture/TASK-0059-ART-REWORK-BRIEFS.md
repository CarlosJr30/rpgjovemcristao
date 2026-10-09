# TASK-0059 — briefs após diagnóstico local

Nenhuma geração externa realizada. São requisitos de fontes futuras, não assets disponíveis ou aprovados. Relatórios por tentativa em `build/task-0059-equipment-recovery/recovery/`. Cada nova fonte precisa de procedência, SHA físico, bake próprio e revisão; não copiar coordenadas ou declarar READY.

| Target | Dependência | Requisito da próxima fonte |
|---|---|---|
| boots_traveler_common_female_v2 | NEEDS_NEW_FOOTWEAR_ART | Botas esquerda/direita desenhadas na pose exata dos pés do HD feminino. Tornozelos/solas com contorno suficiente para substituir calçado original sem ultrapassar perna. Fornecer planos front/back e mapa localizado de substituição com fundo/anatomia legítimos, sem buracos nem duplicação; HD original preservado. |
| boots_traveler_common_male_v2 | Método feminino ainda inválido | Nenhuma nova derivação masculina. Após validar solução feminina, fonte própria para pose masculina; não reaproveitar cegamente máscara/escala. |
| helmet_traveler_rare_female_v2 | NEEDS_NEW_HEADWEAR_ART | Casco adequado à silhueta do cabelo feminino existente, margem superior do canvas, abertura facial deixando ambos os olhos/testa legíveis. Planos de aba frontal/lateral e oclusão local do equipamento. Não apagar ou redesenhar cabelo do HD. |
| helmet_traveler_rare_male_v2 | NEEDS_NEW_HEADWEAR_ART | Casco próprio para cabelo volumoso masculino; proporção da coroa separada da abertura do rosto no desenho da fonte. Sem bico metálico sobre olhos/nariz. Canvas RGBA1024×1536 e margem real da coroa. |
| medallion_path_rare_female_v2 | NEEDS_NEW_CHAIN_ART | Corrente completa acima do pingente, sem extremidades cortadas no canvas; segmentos legíveis emergindo sob cachecol/gola com trajetória de suspensão coerente. Pingente integral, sem parecer broche. Preparar oclusão para armaduras comum/raras, sem pressupor compatibilidade. |
| medallion_path_rare_male_v2 | NEEDS_NEW_CHAIN_ART | Corrente completa e comprimento específico para gola masculina; topo do pingente nunca cortado pelo cachecol. Definir ligação de ambos os lados atrás do pescoço e segmentos visíveis no peito/armadura. |
| sword_path_rare_female_v2 | NEEDS_NEW_SHEATH_ART | Bainha própria para lâmina/ricasso e guarda ornamental feminina. Boca deve ocultar a lâmina e respeitar largura da base; suporte conecta ao cinto sem atravessar guarda. Evitar fragmentos desconectados que reapareçam após o antebraço. Preservar cabo/guarda originais; ajustar planos e desenho da suspensão, não deformar metal. |
| sword_path_rare_male_v2 | NEEDS_NEW_SHEATH_ART | Bainha própria para lâmina rara masculina e sua guarda larga; comprimento e boca compatíveis, suspensões no cinto masculino. Planos de oclusão específicos do braço/mão; não presumir máscara feminina adequada. |

Botas femininas: duas abordagens diferentes encerradas. A) Registro uniforme independente por pé manteve contornos originais duplicados. B) Remoção localizada em base derivada cobriu apenas90,03% dos51.373pixels removidos;5.124pixels ficaram sem cobertura, além de resíduos. Não repetir esse método com as mesmas fontes. Não usar preenchimento cinza como anatomia ou fundo do Avatar.

Elmos: reduzir uniformemente evita corte da coroa, mas não resolve simultaneamente casco, cabelo e janela facial. Medalhões: esconder extremidades não cria continuidade de corrente. Espadas raras: o diagnóstico local demonstra dependência de desenho/planos da bainha, não falta de rotação runtime.

Espada comum masculina: candidato `c-split-suspension-mouth` passou revisão técnica no HD masculino de referência. Suspensão atrás do cabo e boca na frente da lâmina; não significa aprovação de Carlos, READY, compatibilidade universal ou cobertura dos54HD.

Calças: nenhuma fonte ou candidato disponível; combinações Calças+botas/armadura não testadas. A proposta técnica especifica contrato futuro antes de produzir assets ou ativar slot.
