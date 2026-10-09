# TASK-0049R — Geometry-Controlled Generation Rework

**Resultado final: GEOMETRY_METHOD_VALIDATED / HUMAN_VISUAL_APPROVED.** Carlos Faustino aprovou explicitamente o candidato male_curly_blue_light da tentativa 2 e o método como referência visual para futura retomada da TASK-0049. A rework teve somente duas novas tentativas; a segunda passou nas 13 métricas com alpha ≥128 e a geração foi encerrada imediatamente. Nenhum dos outros 51 assets foi gerado. TASK-0049R DONE no escopo do método e candidato; o pack completo permanece pendente.

## 1. Hipótese de causa raiz

Referências concorrentes (piloto de outra combinação e depois candidato rejeitado) e ausência de guia 2× do próprio alvo podem explicar a deriva repetida. O segundo prompt anterior tinha coordenadas do piloto: topo 2 / centro Y 758, enquanto o alvo exige 6 / 760. Essas causas são hipóteses, não demonstradas isoladamente. [ROOT_CAUSE_HYPOTHESIS](task-0049r/ROOT_CAUSE_HYPOTHESIS.md).

## 2. Método antigo e novo

Antigo: legado512 + piloto e/ou desenho rejeitado1024. Novo: legado512 primário + o mesmo legado nearest2× como controle visual de coordenadas; tentativa2 adiciona silhouette128 do mesmo alvo em fundo branco exclusivamente como referência estrutural. Cada referência possui papel explícito. Não há figura de outra combinação nem desenho rejeitado como referência. Pilotos orientam somente qualidade/material/detalhe, descritos em texto.

Não é text-to-image puro. imagegen built-in com referenced_image_paths e transparent_background=true, solicitando regeneração da MESMA imagem. Interface não expõe seed, strength, sampler, ControlNet, mask/inpainting determinístico ou trava física de pose. Silhueta é referência visual, não máscara imposta pela API. PASS mede a saída real, não garante generalização ou determinismo.

## 3. Recipe dos pilotos

Ambos pilotos TASK-0048 foram gerados com original512 + seu guia2×, mesma ferramenta/transparência e prompts específicos por contorno/baseline/waist/cabelo. Exportação byte-exata, sem editar/crop/resize/warp/stretch/alpha. Sem seed/configuração oculta disponível. [PILOT_RECIPE_ANALYSIS](task-0049r/PILOT_RECIPE_ANALYSIS.md). Prompts originais: build/task-0048-evidence/geometry/prompts.json. Prompts desta rework: build/task-0049r-evidence/prompts.json.

## 4–5. Tentativas e métricas

Tentativa 1: 11/13 PASS; direita +10 px e largura +13 px FAIL. Pés +1 px e centro Y 0 px corrigiram os desvios anteriores de −25/−26 e −12,5/−15 px.

Tentativa 2: 13/13 PASS; pés 0 px, direita +3 px, largura +5 px, centro X +0,5 px, centro Y −0,5 px. A tentativa com a referência adicional de silhueta passou; duas amostras não demonstram causalidade. Nenhuma terceira ou quarta geração.

| Métrica | Legado | EsperadoHD | Tentativa1 | Delta1 | Resultado1 | Tentativa2 | Delta2 | Resultado2 | Tol.HD |
|---|---:|---:|---:|---:|---|---:|---:|---|---:|
| left | 86 | 172 | 169 | -3 | PASS | 170 | -2 | PASS | ±6 |
| right | 466 | 932 | 942 | 10 | FAIL | 935 | 3 | PASS | ±6 |
| top | 3 | 6 | 5 | -1 | PASS | 5 | -1 | PASS | ±6 |
| bottom | 757 | 1514 | 1515 | 1 | PASS | 1514 | 0 | PASS | ±4 |
| width | 380 | 760 | 773 | 13 | FAIL | 765 | 5 | PASS | ±12 |
| height | 754 | 1508 | 1510 | 2 | PASS | 1509 | 1 | PASS | ±10 |
| centerX | 276 | 552 | 555.5 | 3.5 | PASS | 552.5 | 0.5 | PASS | ±4 |
| centerY | 380 | 760 | 760 | 0 | PASS | 759.5 | -0.5 | PASS | ±4 |
| feetBaseline | 757 | 1514 | 1515 | 1 | PASS | 1514 | 0 | PASS | ±4 |
| hairTop | 3 | 6 | 5 | -1 | PASS | 5 | -1 | PASS | ±6 |
| maxSilhouetteWidth | 379 | 758 | 770 | 12 | PASS | 762 | 4 | PASS | ±12 |
| alphaCentroidX | 263.7876 | 527.5753 | 530.0367 | 2.4614 | PASS | 527.6469 | 0.0716 | PASS | ±4 |
| alphaCentroidY | 388.8791 | 777.7582 | 781.001 | 3.2428 | PASS | 777.7579 | -0.0002 | PASS | ±4 |

Arestas pixel com right/bottom exclusivos; esperadoHD=legado×2. Alpha≥128 gate, alpha>0 somente diagnóstico; FAIL diagnóstico continua nosJSON. Centroide e span máximo são critérios extras preservados do auditor TASK-0048. IoU diagnóstico:96,8073%→98,3323%; não equivale à aprovação da pose/identidade.

## 6–8. Arquivos e aceite técnico

- Tentativa1: REJECTED_GEOMETRY; PNG1024×1536,2184558bytes, alpha real com916608pixels transparentes,624096pixelsalpha≥128; SHA-256 `14c988c25895789779a75a47ffa3fec7168cd665737ed556913804543f8ae23c`.
- Tentativa2: GEOMETRY_PASS; PNG1024×1536,2180157bytes, alpha real com922588pixels transparentes,616091pixelsalpha≥128; SHA-256 `f4a119053fe94850222d606ca7ab5907399fec28246b8700338893a25897713c`.

PNG com alpha máximo 254 (valor mais comum 253), sem pixels com alpha 255. Transparência real e contorno válido foram comprovados; o alpha final foi preservado exatamente. Nenhuma limpeza de alpha, cópia de máscara, warp, offset, resize, crop ou movimento artificial. Todos os PNGs gerados foram copiados byte a byte; as fontes permanecem em generated_images e os hashes de origem e cópia coincidem.

Candidato aprovado técnica e visualmente: build/task-0049r-evidence/attempt-2/hd_candidate.png. Status GEOMETRY_PASS, humanReview HUMAN_VISUAL_APPROVED, approved=true exclusivamente para este candidato e referência do método. Aprovação humana por Carlos Faustino, vinculada ao SHA-256 acima e registrada com timestamp real em [HUMAN-VISUAL-APPROVAL.json](task-0049r/HUMAN-VISUAL-APPROVAL.json). Permanece fora do catálogo e renderer públicos; aprovação visual não ativa produção nem autoriza o restante do lote.

Revisão visual pelo autor: braço, mão, posição da cabeça, pés, pose e roupa aparentam preservados nos overlays; acabamento de cabelo, tecido, couro e antialias diferem sutilmente. A IoU diagnóstica de 98,33% não representa igualdade perfeita. Carlos Faustino realizou a revisão humana e aprovou explicitamente identidade visual, cabelo, pose, silhueta, proporções, linha dos pés, enquadramento e aparência geral em relação ao legado. QA técnico pelo autor; o aceite humano veio do usuário, sem aprovação automática.

## 9. Evidências para revisão humana

[Revisão HTML DEV](../../build/task-0049r-evidence/review/index.html):legado eHD lado a lado, alternânciaHD/overlay/diff e slider por teclado. Comparações alinhadas também em mobile. [Prévia sobre fundo claro](../../build/task-0049r-evidence/attempt-2/hd_candidate_on_light.png) é QA-only; asset final continua alpha original.

Cada attempt-n tem legacy_2x.png,hd_candidate.png,overlay_50_50.png,silhouette_difference.png,geometry_metrics.json. Guia2× e silhouette apenas em control, nunca assets runtime. Screenshots e qa-results.json em review.

## 10–11. Preservação e testes

Comparação de hashes: 452 arquivos de apps/web, packages, scripts, tests e tools intactos; nenhum alterado ou ausente. Os 165 arquivos públicos, incluindo 163 mídias legadas e dois pilotos, permanecem intactos. Nenhuma mudança em renderer, anchors, IDs, saves, domínio, Body-Fit ou produção. Evidência: preservation.json.

- Unit geometry:5/5PASS.
- Asset validator:2/2PASS, inclusive hashes origem/cópia e verificação do legado correto.
- Lab DEV QA local:6/6viewportsPASS (390×844,412×915,844×390,915×412,1440×900,1920×1080); fontes1024×1536,ratio2:3,overlay/diff/keyboard/overflow/JSerrorsPASS. Não afirmar integração deste candidato ao jogo.
- ESLint dos helpersJS novos:PASS. Typecheck/buildN/A nesta rework, sem TypeScript/runtime alterado e pedido explícito de checks diretamente afetados. Sem suiteglobal.

## 12–14. Aprovação humana e estado final

Aprovação visual explícita de Carlos Faustino recebida e registrada para male_curly_blue_light, incluindo os oito critérios acima. O candidato pode servir de referência do método visualmente validado na retomada da TASK-0049. Os 51 restantes permanecem PENDING_HD e não foram gerados nesta confirmação. A retomada exige nova instrução do usuário; preservar referência estrutural individual, auditor por asset e revisão de cada lote.

Status técnico GEOMETRY_METHOD_VALIDATED; revisão humana HUMAN_VISUAL_APPROVED. TASK-0049R DONE no escopo aprovado. TASK-0049 continua incompleta, aguardando autorização de retomada, com um candidato aprovado e 51 pendentes. Body-Fit e produção preservados; sem push, deploy, Supabase ou instalações.

Nesta confirmação foram atualizados apenas documentação e metadados. Revisão estrutural e consistência JSON pelo autor, hash do candidato e preservação dos 452 arquivos conferidos novamente. Nenhum teste de runtime foi repetido; os resultados anteriores permanecem válidos para os arquivos intactos. Lint, typecheck e build N/A nesta confirmação, sem código alterado. Security adicional N/A: nenhum novo controle de acesso, configuração, serviço remoto ou secret.
