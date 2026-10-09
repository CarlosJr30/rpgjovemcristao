# ROOT_CAUSE_HYPOTHESIS — TASK-0049R

Hipóteses, não causas comprovadas:

1. Referências concorrentes em resoluções/composições diferentes favoreceram o piloto curto/pele média em vez do alvo cacheado/pele clara. O cabelo mais curto visível é compatível com essa hipótese.
2. A ausência do próprio guia2×, usado com sucesso nos pilotos, deixou ocupação de canvas/baseline para interpretação. Duas saídas exibiram pés−26/−25px, direita+14/+13 e centroY−15/−12,5.
3. A tentativa2 condicionou pelo desenho reprovado, repetindo a moldura e introduzindo coordenadas erradas para topo/centroY. Isso pode reforçar framing anterior.
4. As referências não são constraints duras. A interface disponível não expõe mask/pose-control/seed/strength; instruções de pixel não garantem obediência.

Controle na origem adotado: figura de referência única, fornecida original+guia2× do mesmo alvo; geometria exigida com valores corretos e contorno128. Piloto somente acabamento textual, sem figura concorrente. Nenhum rejeitado como referência na tentativa1. Não copiar alpha nem transformar saída final. Medir13métricas e anatomia visual depois de cada geração; parar em PASS ou duas falhas quase idênticas.
