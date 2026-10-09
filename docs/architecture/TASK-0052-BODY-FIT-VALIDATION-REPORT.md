# TASK-0052 — Body-Fit V2 — review após entrega das fontes

Atualização vigente: fontes16 entregues/validadas/mapeadas; fit16FAIL/NEEDS_REWORK e0READY. ASSET_REWORK_REQUIRED; bloqueio antigo de acesso/mapping resolvido para o novo pack. Ver [relatório TASK-0052B](TASK-0052B-BODY-FIT-TARGET-VALIDATION-REPORT.md). Textos de estados anteriores abaixo são históricos.

Estado atual após TASK-0052B: BLOCKED / MAPPING_REQUIRED / TARGET_SOURCE_DELIVERY_REQUIRED. As 12 fontes antigas permanecem auditadas; os 16 novos targets ainda não foram localizados. Ver [relatório TASK-0052B](TASK-0052B-BODY-FIT-TARGET-VALIDATION-REPORT.md). Histórico abaixo preservado.

Estado: **BLOCKED / MAPPING_REQUIRED**, com **DIAGNOSTIC_REWORK_REQUIRED**. Não cancelada e não DONE. A dependência anterior SOURCE_FILE_NOT_LOCATED foi resolvida. Auditoria e diagnóstico locais concluídos; integração por target permanece pendente.

## Fontes e validação técnica

12 PNGs em `assets-source/body-fit-v2`, 11 hashes únicos. `imagegen.png` é duplicado byte a byte de `armadura_paladina_verde_e_dourada.png`. O manifest anunciado em `assets-source/body-fit-v2/manifest.json` está ausente; o manifest realmente entregue está na raiz, `manifest.json`. Seus 12 hashes conferem com os arquivos. Nenhum original ou manifest foi editado/movido/renomeado.

Todos: PNG RGBA, 1024×1536, transparência real, contorno alpha ≥128 não vazio, leitura completa sem warnings, CRC de todos os chunks PASS, SHA-256 real registrado. Alpha máximo é 254 nas fontes; há pixels completamente transparentes, e isso não é uma falha por si só. Aprovação estética de Carlos vinculada agora aos arquivos e hashes reais: SOURCE_VISUAL_APPROVED. Não implica aprovação Body-Fit.

Inventário: [source-inventory.json](../../build/task-0052-body-fit-validation/delivery/source-inventory.json). Receipts individuais estão na mesma pasta, como `<filename>.fit-report.json`.

## Mapping e contagens formais

| Estado | Total |
|---|---:|
| Fontes encontradas | 12 |
| Hashes únicos | 11 |
| TECHNICAL_PASS | 12 |
| MAPPED | 0 |
| UNMAPPED_SOURCE_ART | 12 |
| FIT_PASS por target | 0 |
| FIT_FAIL por target | 0 |
| NEEDS_REWORK por target | 0 |
| FIT_VALIDATION_PENDING nas fontes | 12 |
| Targets sem fonte inequivocamente vinculada | 16 |
| READY | 0 |

O manifest declara origem, aprovação estética, dimensões e hashes; não contém target, item, raridade ou gênero. Nenhum filename é igual aos 16 targets. Nome português, estética ou família de equipamento não prova uma correspondência. “Paladina” não resolve gênero de runtime nem distinção armor uncommon/rare; duas espadas e dois elmos/botas também não têm binding inequívoco. Sem medallion visual identificável. Não houve mapping arbitrário ou renomeação.

Os 16 targets constam de [NEEDS_NEW_BODY_FIT_ASSET.json](NEEDS_NEW_BODY_FIT_ASSET.json), sem alteração. Seus reports atuais dizem FIT_VALIDATION_PENDING por mapping, em vez de alegar ausência física de todas as novas fontes. São 16 targets sem binding; não uma alegação de 16 arquivos físicos inexistentes.

## Diagnóstico visual real, independente do mapping

As 12 fontes foram compostas full-canvas sem correção sobre `female_short_moss_medium` e `male_short_moss_medium`. As 24 composições foram inspecionadas pelo autor. Isso não atribui nenhum gênero/target às artes e não comprova compatibilidade geral com as 54 identidades.

**12 arquivos / 11 artes únicas receberam recomendação diagnóstica NEEDS_REWORK.** Essa contagem é separada dos estados formais de fit por target acima; não há FIT_FAIL por target inventado.

| Fonte | Observação diagnóstica |
|---|---|
| armadura_paladina_verde_e_dourada.png | Ombros/cintura/saia fora do torso; peça larga e baixa; gola no nível da cabeça. |
| armadura_templária_verde_e_dourada.png | Gola cobre rosto; cintura/saia invadem pernas; ombreiras largas. |
| armadura_torácica_de_paladina_verde.png | Gola cobre rosto; cintura e saia abaixo dos limites reais do torso. |
| armadura_verde_e_dourada_de_paladina.png | Rosto preservado, mas ombros largos e cintura/saia descem sobre coxas. |
| botas_de_paladino_verde_e_dourado.png | Cano na cintura; botas grandes, afastadas e sem acompanhar pés reais. |
| botas_élficas_de_esmeralda_e_ouro.png | Cano na cintura; pés/solas fora do contorno e posição dos pés HD. |
| capuz_sacerdotal_esmeralda_ornamentado.png | Quase full-body; abertura facial no torso e pano até pernas. |
| elmo_paladino_esmeralda_ornado.png | Elmo ocupa corpo; rosto escondido e abertura abaixo da cabeça. |
| escudo_esmeralda_do_sol_dourado.png | Da cabeça aos pés; escala excessiva e pega não demonstrada. |
| espada_esmeralda_de_aço_e_ouro.png | Punho/guarda na coxa/joelho, abaixo dos dedos; sem pega. |
| espada_real_de_esmeralda_e_ouro.png | Punho abaixo da mão e direção sem contato corporal coerente. |
| imagegen.png | Duplicado da primeira armadura; mesmo diagnóstico. |

Regeneração exata: primeiro confirmar arquivo → target/item/gênero/raridade; depois gerar uma nova camada corporal transparente sobre a referência HD correta, sem mudar pose/canvas/anchors. Armaduras devem seguir ombros/peito/cintura/quadril e excluir rosto/mãos/pernas; botas devem seguir tornozelos/pés reais e baseline alpha ≥128 (female 1495, male 1513); elmos devem ficar na cabeça, com abertura facial e linha do cabelo medidas; espada deve ter punho nos dedos reais; escudo deve ter escala e pega coerentes com antebraço/torso. Não ampliar a peça para preencher a imagem. Os números de baseline não validam a anatomia restante. Brief individual e motivos completos em [visual-assessment.json](../../build/task-0052-body-fit-validation/delivery/visual-assessment.json). Nenhuma regeneração/edição foi executada.

## Evidências e review

[Review local atual](../../build/task-0052-body-fit-validation/delivery/review/index.html): avatar base, source original, combinado, mistura alpha 50%, divisão 50/50, guides e fit report, para cada uma das 12 fontes sobre as duas referências. 24 painéis gerais + 144 screenshots individuais = 168 PNGs de evidência. Source art e HD usados no review são cópias byte a byte, não artes corrigidas. Guides verdes/laranja são bounding boxes alpha ≥128; baseline vermelha e eixo x512. Não são novos anchors ou homologação anatômica.

Para servir no lab DEV existente: `node scripts/arena-lab.mjs`, abrir `http://127.0.0.1:3109/build/task-0052-body-fit-validation/delivery/review/index.html`. O review também pode ser aberto como HTML local. Nenhum módulo de produção importa o review.

## Checks e preservação

- Asset audit: 12/12 PASS, manifest real 12/12 SHA-256, strict CRC e decode.
- Validator unit: 7 PASS (ambiguidade/hash/target desconhecido/CRC/payload truncado ou adulterado).
- Runtime/equipamentos: 94 unit PASS em seis arquivos.
- Lab de fontes: 1 E2E PASS, 144 amostras (12 fontes × 2 referências × 6 viewports), reduced motion, hashes originais/cópias e seis vistas full-canvas.
- Lab existente: 1 E2E PASS, 54 seleções HD e 48 amostras; gates continuam sem READY.
- Portal/produção: 11 E2E PASS + 5 skips planejados de duplicação mobile; equip/atributos/fallback/cinematic e seis viewports.
- Isolamento adicional: 2 E2E PASS, originais/review/cópias/lab retornam 404 em produção.
- Lint, typecheck, auditor HD54 e build de produção PASS.
- 191/191 arquivos protegidos e 12/12 originais preservados; manifest também intacto. Avatar HD/runtime/arquitetura Body-Fit/anchors/IDs/saves/produção não alterados.

Logs/checks: [TASK-0052-FINAL-CHECKS.json](TASK-0052-FINAL-CHECKS.json) e `build/task-0052-body-fit-validation/delivery`. Falha inicial de overflow mobile do review corrigida e E2E repetido com PASS; nenhuma falha ativa. O diagnóstico visual de rework não é falha de teste automatizado nem aprovação humana de fit.

QA e Security pelo autor, sem alegar revisão independente. Sem instalação, geração, push, deploy ou alteração remota. Histórico pré-entrega mantido em `build/task-0052-body-fit-validation/history/pre-delivery`.

## Próximo gate

Disponibilizar binding inequívoco de cada fonte que realmente corresponda a um target, com filename e hash atual. Fontes sem binding continuam UNMAPPED_SOURCE_ART. Regenerar as artes que falham no diagnóstico corporal usando a referência do target confirmado; repetir técnica/fit e variantes do mesmo gênero, obter FIT_PASS e aprovação humana Body-Fit específica. Só então um overlay poderá ser considerado para READY, mediante autorização. A aprovação estética atual permanece SOURCE_VISUAL_APPROVED.
