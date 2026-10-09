# PILOT_RECIPE_ANALYSIS — TASK-0049R

## Processo comprovado da TASK-0048 REWORK-1

- Ferramenta: imagegen built-in; transparent_background=true, edição/redesenho condicionado por referências locais.
- Referências de cada piloto: original legado512×768 + mesmo original nearest2×1024×1536. Guia2× somente referência/QA, nunca asset.
- Prompts: build/task-0048-evidence/geometry/prompts.json. Instruíam desenho novo somente dentro do contorno rastreado, geometria prioritária sobre beleza, pé/margem/cabelo/belt/coordenadas específicos ao legado.
- Canvas gerado:1024×1536 PNG alpha real; ambos passaram as13métricas alpha128; aprovação humana recebida.
- Exportação: bytes gerados copiados exatamente; nenhuma resize/crop/warp/stretch/ediçãoalpha final.
- Seed/modelo/strength/sampler/controlnet/mask: indisponíveis na interface da ferramenta. Não presumir modelo/seed reprodutível nem garantia física de inpainting. Parâmetros expostos:prompt,referenced_image_paths,transparent_background (alternativa num_last_images_to_include).
- Configuração conhecida explica condicionamento visual em canvas final; não prova causalidade do PASS nem determinismo.

## TASK-0049 rejeitada

Tentativa1: original512 + piloto de outra combinação1024; nenhum guia2× do próprio alvo. Tentativa2: original512 + candidato rejeitado + piloto. O candidato rejeitado introduziu o mesmo framing defeituoso como referência. O segundo prompt também tomou coordenadas do short_moss_medium:topo2/centroY758; alvo curly_blue_light exige topo6/centroY760. Base/laterais/centroX eram iguais, mas o erro concreto de especificação mostra a necessidade de derivar cada valor da fonte.

## Receita desta rework

Original512 + seu guia2× como únicas referências de figura na tentativa1. Pilotos revisados para nível de acabamento, descrito em texto; sua figura/combinação não será imagem concorrente de geometria. Referência silhouette128 criada e disponível para reforço se necessário. Prompt forte de preservação, coordenadas calculadas do alvo individual, material/detalhe somente dentro dos contornos. Geração continua probabilística; auditor determina o resultado real.
