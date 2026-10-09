# TASK-0056 — Body-Fit V2 — Sword Downward Orientation

Data local: 08/10/2026 (America/Sao_Paulo). Estado: **REWORK**, não DONE. QA/Security pelo próprio autor; nenhuma revisão independente ou aprovação humana alegada.

Quatro targets processados, duas tentativas preservadas por target. Os quatro candidatos selecionados para revisão estão inteiramente orientados para baixo, mas **nenhum mostra uma empunhadura convincente**. FIT_PASS **0**, NEEDS_REWORK **4**, HUMAN_BODY_FIT_REVIEW_PENDING **0**, HUMAN_APPROVED **0**, READY **0**, ativação runtime **0**. Os oito PNGs produzidos não são oito targets.

## Resultado individual

| Target | Lâmina | Mão realmente segura? | Status | Oclusão / pendência |
| --- | --- | --- | --- | --- |
| sword_path_common_female_v2 | Vertical para baixo | Não | NEEDS_REWORK | Cabo na frente dos dedos; polegar afastado; máscara recorta cabo e deixa abertura. |
| sword_path_common_male_v2 | Vertical para baixo | Não | NEEDS_REWORK | Cabo cobre dedos; máscara cria recorte anguloso; polegar aberto. Guarda próxima ao bolso. |
| sword_path_rare_female_v2 | Vertical para baixo | Não | NEEDS_REWORK | Máscara interrompe cabo e cria halo junto à guarda; polegar aberto; proporção menor exige revisão. |
| sword_path_rare_male_v2 | Vertical para baixo | Não | NEEDS_REWORK | Dedos revelados pela máscara, mas cabo recortado e polegar separado; guarda próxima do bolso. |

Inspeção do corpo inteiro da segunda tentativa: nenhuma lâmina atravessa torso, pernas ou botas. Isso não equivale a FIT_PASS: o equipamento ainda parece sobreposto na mão. As guardas das raras e comum masculina têm pequenas folgas/tangências próximas dos bolsos, que permanecem para revisão humana. Há sobreposição à capa e o pomo invade visualmente a região da luva; sem certificação de profundidade 3D. As raras ficam com proporção de espada curta para reduzir a invasão lateral da guarda; a adequação estética dessa proporção permanece pendente.

## Entradas verificadas

Os quatro originais físicos em `assets-source/body-fit-v2-targets/` tiveram SHA-256 comparado aos reports da TASK-0055. Os quatro candidatos anteriores e seus reports NEEDS_REWORK também foram lidos e conferidos por hash. Nenhuma nova arte de espada mapeada foi encontrada; nenhuma geração foi executada. Não foram renomeadas fontes históricas nem atribuídos nomes de targets a imagens genéricas.

Inventário físico anterior ao bake: **4.482 PNGs** do workspace, incluindo arquivos ignorados em build e excluindo dependências, `.git` e `.next`. Cada arquivo possui caminho e SHA em `build/task-0056-sword-downward/physical-png-inventory.json`. Esse inventário não atribui aprovação ou identidade a arte não mapeada.

| Fonte | SHA-256 |
| --- | --- |
| common female | 03e3edbcf9572fae0cafc46b0a02eda045cbcdfe855dfcdf808e4aa8a5401d29 |
| common male | ef4ca354506a7da6a9c80dcbb2b4d5388af7d11bef98fce9a81d8de6b40e8818 |
| rare female | 5b445879d181b54e7a4f22761f63602cce83b15341255df8409d5b6b2f8a6ab8 |
| rare male | 89676a2f0f5b8ce73e25e6088ff52979115a11a091bbf25ce810b3c8488c96cb |

Referências imutáveis: `female_short_moss_medium_hd.png` SHA `f260cb9b053b35c328025f1bc7ee602cbb30e57c71ba1f2238a4b1519685f460` e `male_short_moss_medium_hd.png` SHA `b182c2e29b512b337891716a413ab7efaad737e23c6354779fae17fe19b8af34`. Nenhum encaixe é extrapolado para os outros 52 HD.

## Bake e transforms

Reutilizado o sampler da TASK-0054: transformação de similaridade uniforme, amostragem inversa e interpolação bilinear com alpha premultiplicado. A nova entrada `bakeSwordBytes` permite até ±180° offline; a entrada histórica `bakeBytes`, usada pelas TASK-0054/0055, **continua limitada a ±5°**. Os PNGs históricos continuam determinísticos byte a byte. Não há warp, espelhamento ou escala independente por eixo.

Cada fonte tem landmarks próprios de cabo, raiz e ponta, escala própria e transform completo em `fit-metadata.json`. Origem do canvas no canto superior esquerdo; rotação positiva gira no sentido horário no plano da imagem. Raiz→ponta resolve para eixo vertical positivo de Y. O registro exato no proxy da palma não comprova dedos fechados.

| Target | Escala | Rotação offline | Palma proxy x/y |
| --- | ---: | ---: | --- |
| common female | 0,400 | +32,930753° | 240 / 812 |
| common male | 0,400 | +149,414140° | 228 / 834 |
| rare female | 0,345 | 0° | 237 / 812 |
| rare male | 0,335 | −0,127892° | 225 / 832 |

Valores completos, translações e hashes de saída: [manifest](TASK-0056-BAKED-ASSET-MANIFEST.json). Landmarks visuais aproximados, não medidas anatômicas certificadas.

Primeira tentativa preservada na raiz do staging: pega aberta nas quatro, contato da comum masculina com a bota e guardas raras muito largas junto à coxa. Segunda tentativa em `attempt-02/` reduz escala/ajusta posição. Nenhum original, candidato TASK-0055 ou primeiro candidato TASK-0056 foi sobrescrito. O bake agora falha se a pasta de um candidato já existe, impedindo sobrescrita acidental.

Os quatro derivados finais são PNG RGBA 1024×1536 full-canvas com transparência. Nenhum pixel visível de fonte (alpha≥128) projetado foi cortado pelo canvas nas oito saídas. Zero transform corretivo runtime; contrato de render top/left 0, width/height 100%, transform none. Não há import do manifest no runtime.

## Anatomia e máscara offline

As mãos HD pré-compostas têm dedos curvados e polegar afastado. A postura não é uma mão fechada de empunhadura. Translação, escala e rotação da espada não alteram essa anatomia.

Foi produzida uma máscara experimental full-canvas RGBA para cada espada, baseada em polígono próprio da referência feminina ou masculina. Aplicação exclusivamente offline: subtrai alpha do PNG da espada onde os dedos devem ficar à frente, revelando os pixels originais HD ao compor. Não altera, copia ou redesenha pixels do Avatar. Máscaras e derivados têm hashes próprios.

O teste melhora a ordem de profundidade dos dedos, mas deixa recortes duros, trechos descontínuos de cabo e halo junto à guarda. O polegar continua aberto. **Nenhum derivado mascarado foi selecionado como final ou aprovado.** Os arquivos `masked_*_diagnostic.png` são evidência de experimento reprovado, não alternativa READY.

Solução proposta: máscara offline com contorno fino dos dedos/polegar, combinada a arte de empunhadura com perfil e comprimento compatíveis com a mão. Se a pose aberta continuar impedindo a pega, manter NEEDS_REWORK. Carlos pode avaliar uma camada frontal independente de mão fechada, preservando o HD original; essa alternativa exige arte, escopo e aceite específicos e não foi executada. Uma máscara sozinha não fecha dedos nem move o polegar.

## Evidências e reprodução

Review local: `build/task-0056-sword-downward/review/index.html`. Evidências selecionadas: `build/task-0056-sword-downward/attempt-02/<target>/`.

Por target: Avatar original, fonte isolada, PNG baked isolado, composição, corpo inteiro, zoom original da mão, zoom da mão equipada, guias de palma/eixo/solo/máscara, máscara offline, composição/zoom mascarados diagnósticos, comparação TASK-0055, metadata, report de fit/oclusão e receipt com SHA. O report lista caminho/hash/dimensões de cada evidência. Guias: cyan=palma/eixo/solo, amarelo=eixo da lâmina, vermelho=palma, magenta=polígono de máscara. Zoom é ampliação de evidência, não transform corretivo de overlay.

Comandos executados:

- `node scripts/body-fit-sword-inspect.mjs`: inventário físico/hashes e baseline 709 arquivos.
- `node scripts/body-fit-sword-bake.mjs`: segunda tentativa, quatro PNGs; primeira tentativa também preservada.
- `node scripts/body-fit-sword-review.mjs`: reports individuais/receipts/manifest/review.
- `node scripts/body-fit-sword-check.mjs`: CRC/decode/RGBA/alpha/SHA, zero clipping de pixels visíveis, hashes das entradas/candidatos/evidências, gates e preservação — PASS técnico; aceite visual FAIL_OPEN_HAND_REQUIRES_REWORK.
- `node --test scripts/body-fit-bake.test.mjs scripts/body-fit-batch-bake.test.mjs scripts/body-fit-sword-bake.test.mjs`: **40/40 PASS**, incluindo 11 novos, determinismo do piloto/15 históricos/quatro novos, direção real do raster após grande rotação, rejeição de transforms inválidos, máscara restrita ao cabo, e gates sem promoção.
- `node scripts/body-fit-sword-review-check.mjs`: **6 viewports / 24 target samples / 240 vistas**, sem transform CSS, overflow horizontal ou page errors — PASS. Browser headless Edge via arquivo local, sem servidor. Screenshots 390/1366 inspecionados.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm run build`: PASS; auditor runtime HD **54/54 PASS**, build Next local 20 páginas. Não é deploy.

E2E de gameplay/Portal: N/A nesta mudança offline, com código runtime byte a byte preservado; nenhum fluxo runtime foi alterado. QA visual e de review executado como descrito, sem alegar nova partida manual ou revisão independente.

## Preservação, segurança e aceite

Baseline de 709 arquivos: **707 inalterados**, duas alterações permitidas (`scripts/body-fit-bake.mjs`, extensão compatível; `scripts/body-fit-sword-inspect.mjs`, script novo presente no snapshot e posteriormente formatado). Os 54 HD, 16 fontes originais, demais 12 equipamentos, V1, piloto aprovado, lote TASK-0055 e arquivos de runtime/saves/IDs/mecânicas protegidos permaneceram intactos. Evidência: `preservation-before.json` / `preservation-after.json`. Build/cache/tipos gerados locais não fazem parte das mídias protegidas.

Security pelo autor: [parecer](../security/TASK-0056-sword-downward-review.md). Nenhuma dependência instalada, serviço externo, operação Supabase, push, deploy ou promoção READY. Todos os resultados permanecem em staging local.

**Aceite FAIL. TASK-0056 fica REWORK em tasks/active.** Pendências para Carlos: inspecionar mãos/cabos e máscaras por hash; avaliar proporção menor das raras e folgas das guardas; decidir a solução de arte de empunhadura/máscara ou eventual camada frontal. Nenhum candidato elegível para aprovação Body-Fit final até corrigir a pega; revisão humana não substitui a falha documentada.
