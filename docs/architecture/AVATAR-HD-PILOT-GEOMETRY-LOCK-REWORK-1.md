# TASK-0048 REWORK-1 — Geometry Lock

Estado final: PILOT_COMPLETE. GEOMETRY_LOCK_PASS e HUMAN_VISUAL_APPROVED nos dois pilotos; catálogo mantém HD_READY para uso exclusivo DEV. Jogo normal/produção ainda usa legado. Nenhum outro52gerado.

## Critério confirmado pelo usuário

Carlos respondeu literalmente: “Usar contorno alpha ≥128 para geometria e alpha >0 como diagnóstico”. Não se apagou/limpou nenhum pixel nem transformou o asset para passar. Alpha total também é medido e os FAIL diagnósticos continuam publicados. Antialias/noise residual muda bbox alpha1 sem representar nova anatomia visível. Imagens geradas foram copiadas byte-exatamente, sem crop/stretch/warp/resize.

Coordenadas em arestas de pixel: left/top inclusivos, right/bottom exclusivos, largura=right-left, altura=bottom-top, bboxcenter=(left+right)/2,(top+bottom)/2. Esse contrato faz retângulo512×768 e equivalente2× terem delta zero, sem erro ±1. Alpha128 é binário para silhueta; centroide alfa128 e máximo span por linha são métricas adicionais pequenas. Alpha>0 diagnóstico paralelo. Topo do cabelo/hairTop=limite superior da silhueta neste personagem sem acessório acima; pés/feetBaseline=limite inferior (botas são os pixels mais baixos); largura máxima=maior span horizontal por linha. Não se inventa landmark anatomico independente.

Tolerâncias HD: baseline/pés±4px; centros bboxX/Y e centroides±4; topo/cabelo±6; laterais±6por lado; largura±12 e altura±10derivadas dos endpoints; spanmáximo±12. Lógico é metade dessas medidas. Pose/proporções/anatomia precisam passar visualmente mesmo quando bbox PASS. Revisão visual pelo autor, não humana nem independente.

## male — contorno alpha≥128

| METRIC | LEGACY512×768 | EXPECTED_HD | CURRENT_HD | DELTA_HD | TOLERANCE_HD | RESULT |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| left | 86.000 | 172.000 | 169.000 | -3.000 | ±6 | PASS |
| right | 466.000 | 932.000 | 934.000 | 2.000 | ±6 | PASS |
| top | 1.000 | 2.000 | 2.000 | 0.000 | ±6 | PASS |
| bottom | 757.000 | 1514.000 | 1514.000 | 0.000 | ±4 | PASS |
| width | 380.000 | 760.000 | 765.000 | 5.000 | ±12 | PASS |
| height | 756.000 | 1512.000 | 1512.000 | 0.000 | ±10 | PASS |
| centerX | 276.000 | 552.000 | 551.500 | -0.500 | ±4 | PASS |
| centerY | 379.000 | 758.000 | 758.000 | 0.000 | ±4 | PASS |
| feetBaseline | 757.000 | 1514.000 | 1514.000 | 0.000 | ±4 | PASS |
| hairTop | 1.000 | 2.000 | 2.000 | 0.000 | ±6 | PASS |
| maxSilhouetteWidth | 379.000 | 758.000 | 763.000 | 5.000 | ±12 | PASS |
| alphaCentroidX | 263.751 | 527.502 | 528.064 | 0.562 | ±4 | PASS |
| alphaCentroidY | 389.875 | 779.750 | 781.506 | 1.757 | ±4 | PASS |

IoU silhouette (diagnóstico, não substitui pose):97.841%. Bytes:2238839. SHA-256:b182c2e29b512b337891716a413ab7efaad737e23c6354779fae17fe19b8af34.

### male — alpha total >0, diagnóstico somente

| METRIC | LEGACY | EXPECTED_HD | CURRENT_HD | DELTA | RESULT DIAGNOSTIC |
| --- | ---: | ---: | ---: | ---: | --- |
| left | 82.000 | 164.000 | 0.000 | -164.000 | FAIL |
| right | 502.000 | 1004.000 | 1004.000 | 0.000 | PASS |
| top | 0.000 | 0.000 | 0.000 | 0.000 | PASS |
| bottom | 760.000 | 1520.000 | 1522.000 | 2.000 | PASS |
| width | 420.000 | 840.000 | 1004.000 | 164.000 | FAIL |
| height | 760.000 | 1520.000 | 1522.000 | 2.000 | PASS |
| centerX | 292.000 | 584.000 | 502.000 | -82.000 | FAIL |
| centerY | 380.000 | 760.000 | 761.000 | 1.000 | PASS |
| feetBaseline | 760.000 | 1520.000 | 1522.000 | 2.000 | PASS |
| hairTop | 0.000 | 0.000 | 0.000 | 0.000 | PASS |
| maxSilhouetteWidth | 392.000 | 784.000 | 944.000 | 160.000 | FAIL |
| alphaCentroidX | 263.261 | 526.521 | 527.250 | 0.728 | PASS |
| alphaCentroidY | 391.572 | 783.143 | 785.370 | 2.227 | PASS |

## female — contorno alpha≥128

| METRIC | LEGACY512×768 | EXPECTED_HD | CURRENT_HD | DELTA_HD | TOLERANCE_HD | RESULT |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| left | 95.000 | 190.000 | 187.000 | -3.000 | ±6 | PASS |
| right | 481.000 | 962.000 | 965.000 | 3.000 | ±6 | PASS |
| top | 1.000 | 2.000 | 2.000 | 0.000 | ±6 | PASS |
| bottom | 748.000 | 1496.000 | 1496.000 | 0.000 | ±4 | PASS |
| width | 386.000 | 772.000 | 778.000 | 6.000 | ±12 | PASS |
| height | 747.000 | 1494.000 | 1494.000 | 0.000 | ±10 | PASS |
| centerX | 288.000 | 576.000 | 576.000 | 0.000 | ±4 | PASS |
| centerY | 374.500 | 749.000 | 749.000 | 0.000 | ±4 | PASS |
| feetBaseline | 748.000 | 1496.000 | 1496.000 | 0.000 | ±4 | PASS |
| hairTop | 1.000 | 2.000 | 2.000 | 0.000 | ±6 | PASS |
| maxSilhouetteWidth | 382.000 | 764.000 | 770.000 | 6.000 | ±12 | PASS |
| alphaCentroidX | 272.101 | 544.202 | 544.438 | 0.236 | ±4 | PASS |
| alphaCentroidY | 376.965 | 753.931 | 755.112 | 1.181 | ±4 | PASS |

IoU silhouette (diagnóstico, não substitui pose):97.865%. Bytes:2156807. SHA-256:f260cb9b053b35c328025f1bc7ee602cbb30e57c71ba1f2238a4b1519685f460.

### female — alpha total >0, diagnóstico somente

| METRIC | LEGACY | EXPECTED_HD | CURRENT_HD | DELTA | RESULT DIAGNOSTIC |
| --- | ---: | ---: | ---: | ---: | --- |
| left | 0.000 | 0.000 | 0.000 | 0.000 | PASS |
| right | 486.000 | 972.000 | 1002.000 | 30.000 | FAIL |
| top | 0.000 | 0.000 | 0.000 | 0.000 | PASS |
| bottom | 752.000 | 1504.000 | 1505.000 | 1.000 | PASS |
| width | 486.000 | 972.000 | 1002.000 | 30.000 | FAIL |
| height | 752.000 | 1504.000 | 1505.000 | 1.000 | PASS |
| centerX | 243.000 | 486.000 | 501.000 | 15.000 | FAIL |
| centerY | 376.000 | 752.000 | 752.500 | 0.500 | PASS |
| feetBaseline | 752.000 | 1504.000 | 1505.000 | 1.000 | PASS |
| hairTop | 0.000 | 0.000 | 0.000 | 0.000 | PASS |
| maxSilhouetteWidth | 423.000 | 846.000 | 940.000 | 94.000 | FAIL |
| alphaCentroidX | 271.390 | 542.779 | 542.611 | -0.168 | PASS |
| alphaCentroidY | 379.033 | 758.065 | 758.315 | 0.249 | PASS |


## Evidências e geração

build/task-0048-evidence/geometry: male/female-legacy-scaled.png (somente QA), -hd-current.png (candidatos anteriores), -overlay.png/-alpha-diff.png (antes); -hd-final.png/-overlay-final.png/-alpha-diff-final.png (vencedores); -final-on-light.png (QA de alpha); -r1-metrics.json (primeira medição sem decisão do critério); -final-metrics.json (decisão confirmada e revisão do autor); candidates/{male,female}-r1.png. Red/cyan: pixels exclusivos legado/HD; gray: sobreposição128. Overlay50/50 usa alpha premultiplicado equivalente à média das duas imagens no mesmo fundo, não redimensiona HD.

Built-in imagegen, dois pedidos apenas, originais legados como referência principal + normalização2× como guia de QA. prompts.json preserva textos literais/referências; enfatizam preserve exact pose/proportions/silhouette/framing/feet/head/shoulders/arms/legs/canvas occupancy, native1024×1536, improve only fidelity, do not redesign/anatomy/change scale. Nenhum upscale virou asset final. Originais512×768 intactos. Candidatos antes do rework continuam evidência de reprovação; os novos têm mesmo path final, novos hashes auditados. Asset físico=PNG RGBA1024×1536.

Revisão do autor com overlays e diferenças confirma anatomia/pose/ombros/braços/mãos/pernas sem reposicionamento perceptível. Pequenas variações de fios do cabelo, contorno da capa e acabamento de couro/roupa explicam cerca2.2% de diferença binária. Baseline exato nos dois; topo exato; laterais≤1.5px lógico, bboxcenterX≤.25px lógico. Novo feminino remove o deslocamento17.5px lógico dos pés. Não há clipping do contorno128:22px inferiores masculino,40px feminino; diferenças alpha>0 irrelevantes ao critério autorizado permanecem registradas.

## Runtime DEV e DPR

Renderer/avatar-runtime.tsx INTACTO neste round, sem offsets/calibrações especiais. Catálogo HD_READY mantém fontes fora do jogo normal. Mesmo resolver permite revisão no Vite opt-in3109 e no laboratório Next de telas reais3112, somente NODE_ENVdevelopment + flag NEXT_PUBLIC_AVATAR_HD_LAB=1. scripts/avatar-hd-pilot-lab.mjs injeta flag só no processo filho, binds127.0.0.1 e usa cache.next/task-0048-pilot-lab. Não muda ambiente do usuário/servidor3000 nem fonte global de produção. Production recusa flag1 e review explícito (unit). Novo configPlaywright isola laboratório, produção ignora a spec DEV.

Nos dois corpos: criação/card, Intro, Home/Shell/thumbnail, Hero/full, Equipment/full, Garden/full, Arena/arena, Snake portrait realPASS. Teste do Snake observa drawImage real apontandoPNG1024×1536 com crop[300,0,424,410]; engine/mecânica INTACTAS. Reload, fontes quebradas→legado→procedural, recuperação, troca de viajante e saves sem alteração de objetosPASS. Dois contextos sintéticos locais, sem escrita na sessão do usuário/serviço remoto.

DPR DEV:180amostras Vite(2corpos×5modos×6viewports×3DPR) +84amostras Hero/Equipment real(2corpos×2telas×7viewports×3DPR), preservando tablet768×1024além dos seis pedidos. Native1024×1536/contain/auto/ratio2:3/overflow/geometriaPASS; capturasDPR2/3 com corpo/cabelo/boots visíveis, sem offsets/sizing ampliado. Suavidade/detail melhor que legado, demandaefetiva fonte é metade da512; não garantia ilimitada de resolução, nem benchmarkCLS. explicitwidth/height e canvasproporcional mantidos.

## Body-Fit — comparação QA, nunca aprovação

16comparações (8definições×2corpos) em geometry/body-fit. QA-only desenha V1 arquivados sobre legado eHD, com EXATAS posições/rotação/mirror/transformOrigin do resolveOverlayPlacement central, sem mudar assets/configs/gates. Arquivos lado a lado são evidência, jamais assets no jogo. audit.json comprova0overlays normais/0approval e8NEEDS_NEW_OVERLAY. No laboratório real, equipamentos completos mecanicamente equipados continuam0overlays normais nos doiscorpos.

Encaixe herdado essencialmente igual legado→HD, sem regressão visível decorrente da base. Problemas V1 continuam: capacete deve considerar cabelo/oclusão, botas cropped sobre botas já pintadas com margens/sobreposição, armadura veste por cima do figurino e não resolve oclusão da manga/faixa, espada e escudo sem empunhadura/oclusão apropriada da mão, medalhão flutua sem cordão. Não foram promovidos READY; aprovaçãoBody-Fit V2 aguarda fontes fullcanvas próprias e aprovação porcorpo. Mãos já estão pintadas no avatar, sem layer independente aprovado.

## Verificação e aceite

Unit109PASS/14arquivos (104anteriores+5medidas); Vite3E2EPASS; NextHD4E2EPASS incluindoDPR/telas/minigame; produção49E2EPASS/19skips históricos →56E2EPASS sem reduzir cobertura. Lint/typecheck/buildPASS/20rotas. Logsgeometry/{unit,lab,runtime,e2e,lint,typecheck,build}. REWORK: variávelunusedauditor corrigida; define do flag paraVite corrigido e teste reiniciado; criação de outroviajante usa botão existente; seleção usa chave ativa existente, não novo campo no save. Nenhuma falha crítica/regressão produto conhecida.

Human art approval: HUMAN_VISUAL_APPROVED por Carlos Faustino para masculino e feminino, registrada em 2026-10-07T12:46:52.119Z. O usuário confirmou identidade, pose, silhueta, proporções, linha dos pés, enquadramento e aparência geral do legado. Aceite final PILOT_COMPLETE; nuncaDONE enquanto52restantes não produzidos/validados. Não ativar globalmente/produção nem produzir outros52nesta rodada. QA/Security peloautor nãoindependentes. Sem instalação/push/deploy/Supabase real.

## Preservação e arquivos desta rodada

SHA-256:597arquivos baseline,583intactos,14alterações autorizadas,zero missing/unexpected. Todas163mídias legadas e82PNG avatar anteriores intactos, incluindo54runtime. Renderer central inalterado; nenhuma alteração de anchors/equipmentAssets/domínio/save/engines. next-env restaurado; tsc direto web/raizPASS; servidor normal3000HTTP200. Configs raiz revisadas separadamente: somente exclusão da nova spec DEV na configuração produção e nova configuração HDDEV. Evidência geometry/preservation.json e final-tsc.log.

Arquivos alterados relativos ao baseline da rodada:

- `scripts/arena-lab.mjs`
- `tasks/active/TASK-0048-avatar-hd-asset-pack-v1.md`
- `.agent/memory/CURRENT_STATE.md`
- `docs/security/AVATAR-HD-ASSET-PACK-V1-REVIEW.md`
- `tests/e2e/avatar-runtime-lab.spec.ts`
- `tests/e2e/avatar-hd.spec.ts`
- `docs/architecture/avatar-runtime-hd-v1-assets.json`
- `docs/architecture/AVATAR-HD-ASSET-PACK-V1.md`
- `apps/web/features/journey/avatar-hd-pack.test.tsx`
- `apps/web/next.config.ts`
- `apps/web/features/journey/dev/avatar-runtime-panel.tsx`
- `apps/web/features/journey/data/avatarHDPack.ts`
- `apps/web/public/assets/avatar/hd/male/male_short_moss_medium_hd.png`
- `apps/web/public/assets/avatar/hd/female/female_short_moss_medium_hd.png`
- `playwright.config.ts`

Arquivos novos:

- `scripts/audit-avatar-geometry.mjs`
- `scripts/avatar-hd-pilot-lab.mjs`
- `apps/web/features/journey/avatar-geometry-audit.test.ts`
- `tests/e2e/avatar-hd-pilot.spec.ts`
- `docs/architecture/AVATAR-HD-PILOT-GEOMETRY-LOCK-REWORK-1.md`
- `playwright.avatar-hd-pilot.config.ts`

Scripts/capturas/prompts/medidas/logs temporários de QA exclusivamente em build/task-0048-evidence/geometry. O diff git global contém trabalho anterior; não representa somente esta rodada.

## Registro final da aprovação humana

- Masculino: HUMAN_VISUAL_APPROVED.
- Feminino: HUMAN_VISUAL_APPROVED.
- Revisado por: Carlos Faustino. Timestamp real do registro (UTC): 2026-10-07T12:46:52.119Z.
- Uso permanece DEV_PILOT_ONLY; produção/jogo normal continuam legado, sem mudança de status runtime para VALIDATED.
- Geometry Lock, runtime real e DPR PASS; aceites automáticos já registrados na rodada de 2026-10-06.
- Nenhum overlay Body-Fit READY; outros52PENDING_HD e não autorizados; sem push/deploy/alterações remotas.
- TASK-0048: PILOT_COMPLETE, não DONE.
- Evidência vinculada aos hashes dos dois PNG: build/task-0048-evidence/geometry/human-visual-approval.json.
- Esta finalização alterou somente documentos, inventário e receipts de QA. SELF VALIDATE/QA: revisão estrutural pelo autor, parse JSON e conferência SHA-256; suites runtime não repetidas porque código e assets permanecem inalterados. Security adicional N/A: nenhum novo gatilho; gates existentes preservados.
