# TASK-0053 — Body-Fit geometry-locked pilot

Estado: **REWORK / NEEDS_REWORK / GENERATION_LIMIT_REACHED / GEOMETRY_METHOD_NOT_VALIDATED**. Quatro tentativas do único target autorizado. Não DONE; nenhuma candidata habilitada para aprovação corporal, READY ou runtime. Revisão técnica/visual pelo autor, não aprovação humana nem revisão independente.

## Referências imutáveis

| Papel | Arquivo | SHA-256 |
|---|---|---|
| Estrutura | apps/web/public/assets/avatar/hd/female/female_short_moss_medium_hd.png | f260cb9b053b35c328025f1bc7ee602cbb30e57c71ba1f2238a4b1519685f460 |
| Estética somente | assets-source/body-fit-v2-targets/armor_traveler_uncommon_female_v2.png | 564e2a4ebeaf51c41fd32dd7dca311dcc6d9c7cb4015d579d4f3b7f9d98714d1 |

Os hashes foram conferidos contra os originais. As duas referências foram copiadas byte a byte para avatar_base.png e source_reference.png, sem substituição do original.

## Método e tentativas

Tool built-in imagegen com alpha solicitado, não CLI/fallback. Cada candidato gerado foi copiado do diretório generated_images para o projeto sem modificar bytes. Canvas nativo1024×1536 em todas as quatro saídas. Nenhum avatar/pele/mão foi exportado no equipamento.

| Tentativa | Método concreto | bbox alpha≥128 (left,top,right,bottom) | Técnica | Fit |
|---|---|---|---|---|
| 1 | HD e fonte estética como entradas, prompt de camada vestida | 134,252,892,1178 | PASS | FAIL / NEEDS_REWORK |
| 2 | HD como única imagem, estética verbal; coordenadas explícitas | 281,326,763,1011 | PASS | FAIL / NEEDS_REWORK |
| 3 | HD e contorno diagnóstico com linha do cinto/landmarks | 278,323,772,985 | PASS | FAIL / NEEDS_REWORK |
| 4 | Esquema separado em posição nativa; HD como anatomia/estilo | 303,337,722,858 | PASS | FAIL / NEEDS_REWORK |

Tentativas1/2 repetiram torso longo/cintura baixa. A referência mudou concretamente nas tentativas3/4. Encerrado no limite de quatro. A quarta aproxima mais a silhueta, mas não prova o método. O esquema é guia de geração e não um overlay final. Não houve edição corretiva de PNG, resize, stretch, warp, crop, deslocamento, alpha copiado ou transform CSS para fazer encaixar.

Todos têm PNG/CRC/decode PASS e alpha real (pixels totalmente transparentes e parciais; nenhum pixel255, interior majoritariamente próximo de253). Cópia candidata e original gerado têm SHA idêntico.

| Tentativa | SHA-256 | Pixels alpha0 | Pixels alpha1–254 |
|---|---|---:|---:|
| 1 | ec2ea0368b4f2b4b61c2b93629020e1ffae8fe1928acb4731f161d4101cfc00e | 1122927 | 449937 |
| 2 | 244742a8bbdfbbb6d037073a0fa0b59e3ad978d4b030c435ca052372b47878fd | 1349429 | 223435 |
| 3 | 3a25c5b95e97a819774a33fdcb5207fc679ac24b2bf2c10ec43715d2a7959a3d | 1351526 | 221338 |
| 4 | 6b49cff1e5209bfdb01f69a116932b029c8f848065c12fe8b309ed432a073900 | 1421631 | 151233 |

## Landmarks

Pixels nativos, X para direita/Y para baixo; left/right referem-se ao lado da tela. Inspeção manual aproximada ±12px, diagnóstica; não anchors de runtime nem certificação de geometria pixel exata. Baseline HD1495.

| Landmark | X,Y |
|---|---|
| neck center | 520,302 |
| left shoulder | 379,346 |
| right shoulder | 657,352 |
| chest center | 520,455 |
| left armpit | 391,492 |
| right armpit | 646,499 |
| waist center | 531,579 |
| left hip | 421,705 |
| right hip | 646,711 |
| left hand clearance | 240,799 |
| right hand clearance | 783,810 |

Na tentativa4, discos pescoço raio35/mãos raio45 tiveram zero pixels alpha≥128 de equipamento:3853/6361/6361 pixels amostrados. Isso verifica apenas essas áreas de clearance; não prova torso fit.

## Fit da tentativa4

| Região | Resultado | Evidência/observação |
|---|---|---|
| Ombros | PASS | Caps pequenos apoiados perto de y346/352, seguem inclinação sem ombreiras gigantes. |
| Peito | FAIL | Placa larga/retangular com pouca curvatura; ainda parece plana sobreposta. |
| Axilas | PASS | Laterais sem mangas gigantes, braços expostos livres; comparação nativa com mangas do HD. |
| Cintura | FAIL | Fivela aproximada520,607 versus531,579:28px baixa/11px esquerda; acessórios do cinto original expostos mostram segunda cintura. |
| Quadril | FAIL | Barra alpha128 em858 versus envelope diagnóstico815:43px além; saia contínua em vez de abas curtas com profundidade. |
| Rosto/pescoço | PASS | Expostos e livres, topo do equipamento337. |
| Mãos/braços | PASS | Ambas mãos, antebraços e bracers livres na composição. |
| Silhueta vestida | FAIL | Escala melhor, porém peito plano/segunda cintura impedem aparência convincente de armadura vestida. |

Não ampliar tolerâncias para obter FIT_PASS. Análises das tentativas1–3 estão nos respectivos fit_report.json e no agregado.

## Evidências e checks

Pasta build/task-0053-body-fit-pilot: avatar_base.png, source_reference.png, overlay_candidate.png, combined.png, overlay_50_50.png, alignment_guides.png, fit_report.json, review/index.html. Candidato raiz é cópia exata da tentativa4 apenas para diagnóstico. Quatro galerias individuais têm seis vistas/zoom100%/receipt e observações,24 amostras de viewport. Prompts1–4 preservados em prompt-attempt-N.txt; tool built-in e referências descritas acima.

As primeiras capturas de locator tinham1537 linhas por arredondamento de posição fracionária do navegador. Refizemos as evidências num viewport1024×1536 inteiro, sem tocar no PNG candidato. structural_generation_guide.png usado na tentativa3 permanece com1537 linhas, como registro honesto da entrada; native_layout_guide.png da tentativa4 e todas as saídas candidatas/evidências finais são1024×1536. Não houve pós-processamento de tamanho.

| Check | Resultado |
|---|---|
| node scripts/body-fit-pilot-check.mjs | Pipeline PASS; asset4/4, classificações coerentes; fit do piloto FAIL, gate READY fechado |
| node --test scripts/body-fit-source-audit.test.mjs scripts/body-fit-target-audit.test.mjs | 15 PASS: CRC corrupção, mapping inequívoco, READY sem fit/sem aprovação rejeitado |
| DEV lab seis viewports × quatro tentativas | 24 PASS: base/equipamento mesma posição e canvas, sem transform |
| Review quatro galerias/seis vistas/zoom | PASS,24 vistas; sem page errors |
| Playwright Equipment Portal desktop — Missing artwork | 1 PASS: fallback, equip action, comparison |
| npm run lint | PASS |
| Typecheck/build | N/A conforme contrato; nenhum TS/runtime alterado, regressão sobre build vigente |
| Preservação antes/depois | 281/281 SHA PASS,54 HD e16 fontes originais intactos, runtime/anchors/arquitetura/mecânicas protegidos |
| Security | PASS pelo autor; ver docs/security/TASK-0053-body-fit-pilot-review.md |

DEV somente; nenhum catálogo/público/runtime ativado. Nenhuma alteração de saves/IDs/economia/combate/Arena/Guilda/Diário/produção, outros15 ou overlaysV1. Nenhuma instalação, push, deploy ou alteração remota.

## Estado final e próxima etapa

1 target avaliado com4 candidatos: TECHNICALLY_VALIDATED4, FIT_PASS0, FIT_FAIL4, NEEDS_REWORK4; revisão corporal humana pendente0, aprovação humana0, READY0, outros assets gerados0.

Não extrapolar aos outros15. Recomendação: próximo rework com desenho real em camadas sobre o HD imutável, cinto no landmark nativo e peito com volume, exportando apenas equipamento sem deslocamento. Repetir validators/fit; só após FIT_PASS e aprovação corporal humana do piloto planejar os demais. TASK-0053 REWORK; quatro tentativas autorizadas esgotadas. TASK-0052B e fontes originais permanecem com seus estados anteriores.
