# Avatar HD Asset Pack V1 — TASK-0048

## REWORK-1 — estado atual: PILOT_COMPLETE

Dois pilotos HD_READY passaram Geometry Lock alpha ≥128 (critério confirmado pelo usuário); alpha >0 é diagnóstico e seus FAIL permanecem registrados. Artes nativas1024×1536 copiadas sem transformação final. Aprovação visual humana dos DOIS pilotos: HUMAN_VISUAL_APPROVED por Carlos Faustino, registrada em 2026-10-07T12:46:52.119Z. Identidade, pose, silhueta, proporções, linha dos pés, enquadramento e aparência geral do legado aprovados explicitamente. Nenhum outro52gerado, nunca DONE nesta fase.

Runtime real e cinco modos DEV aprovados; produção/jogo normal permanecem legados. Laboratório Next isolado: node scripts/avatar-hd-pilot-lab.mjs, http://127.0.0.1:3112. Override recusa production mesmo com flag. Renderer/anchors/Body-Fit/save/domínio inalterados. 16comparações de overlays V1 apenas QA; zero READY/aprovações Body-Fit.

Unit109PASS; E2E56PASS (49produção+3Vite+4NextHD),19skips históricos; lint/typecheck/buildPASS. DPR180amostras lab+84telas reais, trêsDPR. QA/Security pelo autor, não independentes. Sem instalação/push/deploy/Supabase real. [Medidas, deltas, tolerâncias, fontes, diferenças e evidências](../architecture/AVATAR-HD-PILOT-GEOMETRY-LOCK-REWORK-1.md).

Aceite final: PILOT_COMPLETE, uso restrito DEV. Os outros52assets permanecem PENDING_HD e sua geração não está autorizada. Nenhuma promoção de overlays Body-Fit para READY; sem push/deploy/alterações remotas. TASK permanece em active por não ser DONE do pack integral.

## Relatório histórico da rodada anterior


STATUS: REWORK. Dois candidatos nativos foram produzidos; o aceite geométrico falhou. Não PILOT_COMPLETE, não DONE. Jogo normal mantém todas as fontes legadas.

## Arquitetura, arquivos e rollback

Reutilizados AvatarRuntime, resolver central, composição/ordem/Body-Fit existentes e canvas lógico512×768. Nenhuma segunda composição ou caminho HD em telas. avatarHDPack.ts contém duas identidades derivadas dos nomes existentes, dimensões físicas, status editorial e paths permitidos. Resolver prefere somente VALIDATED1024×1536; qualquer outra condição retorna legado. Renderer também verifica naturalWidth/naturalHeight; erro ou dimensão incorreta tenta legado, depois procedural visível. Mudar identidade/fonte reinicia falhas; equipamento isolado preserva nó da base. Não há migração de save/IDs.

Pack: apps/web/public/assets/avatar/hd/{male,female}/{ID}_hd.png. Um arquivo por personagem, PNG RGBA com alpha real e bordas transparentes; sem grids/sheets/background pintado. Os dois arquivos físicos têm1024×1536, cerca58% de pixels totalmente transparentes. Hash/dimensões/alpha/bytes e referência estão no inventário e build/task-0048-evidence/physical-audit.json.

Revisão de candidatos REJECTED é opt-in exclusivamente no laboratório Vite existente: node scripts/arena-lab.mjs → http://127.0.0.1:3109/tools/arena-lab/ → Avatar Runtime HD V1 → Revisar dois candidatos HD. O resolver recusa o bypass em NODE_ENV=production. Produção não tem rota/lab/endpoints. Arquivos públicos não são segredo e podem ser acessados pelo path; isso não os torna aprovados nem ativa seu uso.

## Origem e prompts

Ferramenta built-in imagegen, skill C:/Users/carlo/.codex/skills/.system/imagegen/SKILL.md. Não CLI/API próprio, não instalação, não processamento de upscale/resize de fonte. Referências locais512×768 foram fornecidas para redesenho nativo, detalhes novos de cabelo/tecido/couro e identidade/pose. Candidato masculino original recebeu extração de fundo pela própria imagegen; feminino recebeu iterações para corrigir geometria, última é redesenho nativo direto da referência. Não foi editado nenhum legado.

Especificação final do prompt: identity-preserve; single full-body RPG avatar; exact1024×1536 transparent RGBA; same face/short brown hair/medium skin/green moss cape/cream tunic/leather/brown boots; preserve normalized contours, head/feet/body ratio, baseline and framing; native fine hair strands, stitching/fabric/leather detail, no interpolation/upscale, no text, background or extra gear. Masculino solicitou baseline .985; feminino solicitou hair y2, soles y1496, cape x190..962; a ferramenta não preservou exatamente as coordenadas, motivo da reprovação. Alpha-extraction solicitou remover somente fundo preservando personagem/posição/dimensões. Todos os prompts reforçaram um personagem por arquivo e nenhum grid/sheet. Aprovação humana dos resultados PENDING; não é herdada de fontes anteriores, e não se declara licença comercial/ownership exclusivo por inferência.

## Geometria e revisão visual

- male_short_moss_medium: limites alfa >=128, delta lógico512×768: esquerda -2.50px; direita 3.00px; topo 0.00px; baseline 2.00px. Centro visual (centroide alfa) delta x 0.69px / y 2.65px. Geometria FAIL, não VALIDATED.
- female_short_moss_medium: limites alfa >=128, delta lógico512×768: esquerda -4.00px; direita 11.50px; topo 0.00px; baseline 17.50px. Centro visual (centroide alfa) delta x 4.69px / y 10.56px. Geometria FAIL, não VALIDATED.

Screenshots de comparação no laboratório confirmam detalhes mais finos, transparência e corpo inteiro nos seis viewports. Contudo o redesenho muda silhueta/roupa relativa/baseline, com divergência maior no feminino. Não se aplicou offset CSS nem escala para disfarçar. Ambos REJECTED para integração normal. Corrigir o desenho contra os contours originais é condição para avançar.

## Performance e DPR

| Identidade | Bytes legado512×768 | Bytes candidato1024×1536 | Multiplicador | Formato |
| --- | ---: | ---: | ---: | --- |
| male_short_moss_medium | 399651 | 2231509 | 5.58× | PNG RGBA |
| female_short_moss_medium | 385576 | 2229012 | 5.78× | PNG RGBA |

RGBA decodificado: 1.5MiB →6MiB por imagem,4×pixels. Aproximadamente +1.83MB de transferência por candidato; cache nativo compartilhado por URL entre modos, memo, decoding async e prioridade opcional preservados. Nenhum preload dos54 nem conversão global de formato. Arquivos candidatos não são solicitados no jogo normal. Cada candidato é carregado apenas ao abrir a revisão; fechar revisão desmonta imagens, mantendo cache do navegador. Compressão/formato/transferência devem ser avaliados depois de obter arte alinhada; bytes não equivalem a benchmark de tempo de download.

DEV audit:2corpos×5modos×6viewports×3DPR=180 amostras.390×844,412×915,844×390,915×412,1440×900,1920×1080; DPR1/2/3. natural1024×1536, CSS2:3, contain/auto, sem overflow, transparência e corpo inteiro nos screenshots. Demanda efetiva CSSwidth×DPR/fonte é metade do legado (ex.:170CSSpx×DPR3: .996 legado vs .498HD). Detalhe nativo melhora reserva de resolução DPR2/3, mas não garante HD ilimitado nem corrige fitting. Testes verificam dimensões/ratio durante rollback; não existe benchmark específico de CLS/tempo de decode. DPR produção legado mantém auditoria histórica mais dois landscapes, sem reduzir cobertura.

## Compatibilidade e Body-Fit

Cinco modos dos dois candidatos verificados no compositor real via lab. Região normalizada de portrait converte150/512,0,212/512,205/768 em300,0,424,410; IDs face3/hair2 preservados. Contrato de portrait centralizado permanece; nenhuma alteração na engine Fuga da Serpente.

Criação, Home/Shell, Hero, Equipamentos, Garden, Arena, fallback/reload/troca de corpo e persistência verificadas pela regressão com legados. Intro/Home/Create e Snake também cobertos por unit pertinentes. As telas reais NÃO foram validadas com os pilotos HD ativos, porque sua geometria não passou. Portrait foi validado estruturalmente pelo resolver no DEV, não em uma partida com HD. Aceite de compatibilidade completa HD permanece pendente; não confundir esses resultados.

| Plano/slot | Resultado estrutural | Resultado visual real contra candidatos |
| --- | --- | --- |
| capacete/head | gate READY+APPROVED_BY_USER preservado | PENDENTE; cabelo/silhueta redesenhados |
| armadura/torso | ordem2/anchors preservados | PENDENTE; roupa/anatomia divergente |
| botas/feet | ordem3/anchors preservados | PENDENTE; baseline divergente |
| medalhão/chest | ordem4/anchors preservados | PENDENTE; tecido/posição a revisar |
| mãos | plano5 pré-composto/overlays adicionais, sem slot novo | PENDENTE; posição/oclusão a revisar |
| arma/rightHand | ordem6/gate por corpo preservados | PENDENTE; empunhadura a revisar |
| escudo/leftHand | ordem7/gate por corpo preservados | PENDENTE; pegada/oclusão a revisar |

Oito definições reais NEEDS_NEW_OVERLAY, zero overlays aprovados em ambos corpos;14arquivos V1 continuam arquivados e não são convertidos em Body-Fit aprovado. Lab equipa catálogo inteiro em memória: zero layers renderizadas. Unit usa fixtures sintéticas READY para geometria do compositor, nunca para aprovar fitting ou mídia real. Sem offsets locais/correção mecânica/promoção READY. Visual Body-Fit real bloqueado pelas artes/approvals pendentes e candidatos divergentes.

## Auditoria das54identidades

ID é a chave existente do arquivo/composição, sem novos IDs persistidos. face=pré-composto; os IDs legados1/2/3 continuam guardados mas não são opções independentes de arte. Todos os54arquivos atuais512×768 foram decodificados e tiveram bytes/hash/alpha conferidos;82PNG legados preservados.52PENDING_HD,2REJECTED,0VALIDATED. Arquivos fora do runtime seguem LEGACY_ONLY do relatório TASK-0047.

| ID | Sexo/body | Rosto | Cabelo | Arquivo atual | Resolução atual | Caminho atual | Caminho HD esperado | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| female_curly_blue_dark | female | pré-composto; IDs 1/2/3 preservados | curly | female_curly_blue_dark.png | 512×768 | /assets/avatar/runtime/female/female_curly_blue_dark.png | /assets/avatar/hd/female/female_curly_blue_dark_hd.png | PENDING_HD |
| female_curly_blue_light | female | pré-composto; IDs 1/2/3 preservados | curly | female_curly_blue_light.png | 512×768 | /assets/avatar/runtime/female/female_curly_blue_light.png | /assets/avatar/hd/female/female_curly_blue_light_hd.png | PENDING_HD |
| female_curly_blue_medium | female | pré-composto; IDs 1/2/3 preservados | curly | female_curly_blue_medium.png | 512×768 | /assets/avatar/runtime/female/female_curly_blue_medium.png | /assets/avatar/hd/female/female_curly_blue_medium_hd.png | PENDING_HD |
| female_curly_moss_dark | female | pré-composto; IDs 1/2/3 preservados | curly | female_curly_moss_dark.png | 512×768 | /assets/avatar/runtime/female/female_curly_moss_dark.png | /assets/avatar/hd/female/female_curly_moss_dark_hd.png | PENDING_HD |
| female_curly_moss_light | female | pré-composto; IDs 1/2/3 preservados | curly | female_curly_moss_light.png | 512×768 | /assets/avatar/runtime/female/female_curly_moss_light.png | /assets/avatar/hd/female/female_curly_moss_light_hd.png | PENDING_HD |
| female_curly_moss_medium | female | pré-composto; IDs 1/2/3 preservados | curly | female_curly_moss_medium.png | 512×768 | /assets/avatar/runtime/female/female_curly_moss_medium.png | /assets/avatar/hd/female/female_curly_moss_medium_hd.png | PENDING_HD |
| female_curly_ochre_dark | female | pré-composto; IDs 1/2/3 preservados | curly | female_curly_ochre_dark.png | 512×768 | /assets/avatar/runtime/female/female_curly_ochre_dark.png | /assets/avatar/hd/female/female_curly_ochre_dark_hd.png | PENDING_HD |
| female_curly_ochre_light | female | pré-composto; IDs 1/2/3 preservados | curly | female_curly_ochre_light.png | 512×768 | /assets/avatar/runtime/female/female_curly_ochre_light.png | /assets/avatar/hd/female/female_curly_ochre_light_hd.png | PENDING_HD |
| female_curly_ochre_medium | female | pré-composto; IDs 1/2/3 preservados | curly | female_curly_ochre_medium.png | 512×768 | /assets/avatar/runtime/female/female_curly_ochre_medium.png | /assets/avatar/hd/female/female_curly_ochre_medium_hd.png | PENDING_HD |
| female_long_blue_dark | female | pré-composto; IDs 1/2/3 preservados | long | female_long_blue_dark.png | 512×768 | /assets/avatar/runtime/female/female_long_blue_dark.png | /assets/avatar/hd/female/female_long_blue_dark_hd.png | PENDING_HD |
| female_long_blue_light | female | pré-composto; IDs 1/2/3 preservados | long | female_long_blue_light.png | 512×768 | /assets/avatar/runtime/female/female_long_blue_light.png | /assets/avatar/hd/female/female_long_blue_light_hd.png | PENDING_HD |
| female_long_blue_medium | female | pré-composto; IDs 1/2/3 preservados | long | female_long_blue_medium.png | 512×768 | /assets/avatar/runtime/female/female_long_blue_medium.png | /assets/avatar/hd/female/female_long_blue_medium_hd.png | PENDING_HD |
| female_long_moss_dark | female | pré-composto; IDs 1/2/3 preservados | long | female_long_moss_dark.png | 512×768 | /assets/avatar/runtime/female/female_long_moss_dark.png | /assets/avatar/hd/female/female_long_moss_dark_hd.png | PENDING_HD |
| female_long_moss_light | female | pré-composto; IDs 1/2/3 preservados | long | female_long_moss_light.png | 512×768 | /assets/avatar/runtime/female/female_long_moss_light.png | /assets/avatar/hd/female/female_long_moss_light_hd.png | PENDING_HD |
| female_long_moss_medium | female | pré-composto; IDs 1/2/3 preservados | long | female_long_moss_medium.png | 512×768 | /assets/avatar/runtime/female/female_long_moss_medium.png | /assets/avatar/hd/female/female_long_moss_medium_hd.png | PENDING_HD |
| female_long_ochre_dark | female | pré-composto; IDs 1/2/3 preservados | long | female_long_ochre_dark.png | 512×768 | /assets/avatar/runtime/female/female_long_ochre_dark.png | /assets/avatar/hd/female/female_long_ochre_dark_hd.png | PENDING_HD |
| female_long_ochre_light | female | pré-composto; IDs 1/2/3 preservados | long | female_long_ochre_light.png | 512×768 | /assets/avatar/runtime/female/female_long_ochre_light.png | /assets/avatar/hd/female/female_long_ochre_light_hd.png | PENDING_HD |
| female_long_ochre_medium | female | pré-composto; IDs 1/2/3 preservados | long | female_long_ochre_medium.png | 512×768 | /assets/avatar/runtime/female/female_long_ochre_medium.png | /assets/avatar/hd/female/female_long_ochre_medium_hd.png | PENDING_HD |
| female_short_blue_dark | female | pré-composto; IDs 1/2/3 preservados | short | female_short_blue_dark.png | 512×768 | /assets/avatar/runtime/female/female_short_blue_dark.png | /assets/avatar/hd/female/female_short_blue_dark_hd.png | PENDING_HD |
| female_short_blue_light | female | pré-composto; IDs 1/2/3 preservados | short | female_short_blue_light.png | 512×768 | /assets/avatar/runtime/female/female_short_blue_light.png | /assets/avatar/hd/female/female_short_blue_light_hd.png | PENDING_HD |
| female_short_blue_medium | female | pré-composto; IDs 1/2/3 preservados | short | female_short_blue_medium.png | 512×768 | /assets/avatar/runtime/female/female_short_blue_medium.png | /assets/avatar/hd/female/female_short_blue_medium_hd.png | PENDING_HD |
| female_short_moss_dark | female | pré-composto; IDs 1/2/3 preservados | short | female_short_moss_dark.png | 512×768 | /assets/avatar/runtime/female/female_short_moss_dark.png | /assets/avatar/hd/female/female_short_moss_dark_hd.png | PENDING_HD |
| female_short_moss_light | female | pré-composto; IDs 1/2/3 preservados | short | female_short_moss_light.png | 512×768 | /assets/avatar/runtime/female/female_short_moss_light.png | /assets/avatar/hd/female/female_short_moss_light_hd.png | PENDING_HD |
| female_short_moss_medium | female | pré-composto; IDs 1/2/3 preservados | short | female_short_moss_medium.png | 512×768 | /assets/avatar/runtime/female/female_short_moss_medium.png | /assets/avatar/hd/female/female_short_moss_medium_hd.png | REJECTED |
| female_short_ochre_dark | female | pré-composto; IDs 1/2/3 preservados | short | female_short_ochre_dark.png | 512×768 | /assets/avatar/runtime/female/female_short_ochre_dark.png | /assets/avatar/hd/female/female_short_ochre_dark_hd.png | PENDING_HD |
| female_short_ochre_light | female | pré-composto; IDs 1/2/3 preservados | short | female_short_ochre_light.png | 512×768 | /assets/avatar/runtime/female/female_short_ochre_light.png | /assets/avatar/hd/female/female_short_ochre_light_hd.png | PENDING_HD |
| female_short_ochre_medium | female | pré-composto; IDs 1/2/3 preservados | short | female_short_ochre_medium.png | 512×768 | /assets/avatar/runtime/female/female_short_ochre_medium.png | /assets/avatar/hd/female/female_short_ochre_medium_hd.png | PENDING_HD |
| male_curly_blue_dark | male | pré-composto; IDs 1/2/3 preservados | curly | male_curly_blue_dark.png | 512×768 | /assets/avatar/runtime/male/male_curly_blue_dark.png | /assets/avatar/hd/male/male_curly_blue_dark_hd.png | PENDING_HD |
| male_curly_blue_light | male | pré-composto; IDs 1/2/3 preservados | curly | male_curly_blue_light.png | 512×768 | /assets/avatar/runtime/male/male_curly_blue_light.png | /assets/avatar/hd/male/male_curly_blue_light_hd.png | PENDING_HD |
| male_curly_blue_medium | male | pré-composto; IDs 1/2/3 preservados | curly | male_curly_blue_medium.png | 512×768 | /assets/avatar/runtime/male/male_curly_blue_medium.png | /assets/avatar/hd/male/male_curly_blue_medium_hd.png | PENDING_HD |
| male_curly_moss_dark | male | pré-composto; IDs 1/2/3 preservados | curly | male_curly_moss_dark.png | 512×768 | /assets/avatar/runtime/male/male_curly_moss_dark.png | /assets/avatar/hd/male/male_curly_moss_dark_hd.png | PENDING_HD |
| male_curly_moss_light | male | pré-composto; IDs 1/2/3 preservados | curly | male_curly_moss_light.png | 512×768 | /assets/avatar/runtime/male/male_curly_moss_light.png | /assets/avatar/hd/male/male_curly_moss_light_hd.png | PENDING_HD |
| male_curly_moss_medium | male | pré-composto; IDs 1/2/3 preservados | curly | male_curly_moss_medium.png | 512×768 | /assets/avatar/runtime/male/male_curly_moss_medium.png | /assets/avatar/hd/male/male_curly_moss_medium_hd.png | PENDING_HD |
| male_curly_ochre_dark | male | pré-composto; IDs 1/2/3 preservados | curly | male_curly_ochre_dark.png | 512×768 | /assets/avatar/runtime/male/male_curly_ochre_dark.png | /assets/avatar/hd/male/male_curly_ochre_dark_hd.png | PENDING_HD |
| male_curly_ochre_light | male | pré-composto; IDs 1/2/3 preservados | curly | male_curly_ochre_light.png | 512×768 | /assets/avatar/runtime/male/male_curly_ochre_light.png | /assets/avatar/hd/male/male_curly_ochre_light_hd.png | PENDING_HD |
| male_curly_ochre_medium | male | pré-composto; IDs 1/2/3 preservados | curly | male_curly_ochre_medium.png | 512×768 | /assets/avatar/runtime/male/male_curly_ochre_medium.png | /assets/avatar/hd/male/male_curly_ochre_medium_hd.png | PENDING_HD |
| male_long_blue_dark | male | pré-composto; IDs 1/2/3 preservados | long | male_long_blue_dark.png | 512×768 | /assets/avatar/runtime/male/male_long_blue_dark.png | /assets/avatar/hd/male/male_long_blue_dark_hd.png | PENDING_HD |
| male_long_blue_light | male | pré-composto; IDs 1/2/3 preservados | long | male_long_blue_light.png | 512×768 | /assets/avatar/runtime/male/male_long_blue_light.png | /assets/avatar/hd/male/male_long_blue_light_hd.png | PENDING_HD |
| male_long_blue_medium | male | pré-composto; IDs 1/2/3 preservados | long | male_long_blue_medium.png | 512×768 | /assets/avatar/runtime/male/male_long_blue_medium.png | /assets/avatar/hd/male/male_long_blue_medium_hd.png | PENDING_HD |
| male_long_moss_dark | male | pré-composto; IDs 1/2/3 preservados | long | male_long_moss_dark.png | 512×768 | /assets/avatar/runtime/male/male_long_moss_dark.png | /assets/avatar/hd/male/male_long_moss_dark_hd.png | PENDING_HD |
| male_long_moss_light | male | pré-composto; IDs 1/2/3 preservados | long | male_long_moss_light.png | 512×768 | /assets/avatar/runtime/male/male_long_moss_light.png | /assets/avatar/hd/male/male_long_moss_light_hd.png | PENDING_HD |
| male_long_moss_medium | male | pré-composto; IDs 1/2/3 preservados | long | male_long_moss_medium.png | 512×768 | /assets/avatar/runtime/male/male_long_moss_medium.png | /assets/avatar/hd/male/male_long_moss_medium_hd.png | PENDING_HD |
| male_long_ochre_dark | male | pré-composto; IDs 1/2/3 preservados | long | male_long_ochre_dark.png | 512×768 | /assets/avatar/runtime/male/male_long_ochre_dark.png | /assets/avatar/hd/male/male_long_ochre_dark_hd.png | PENDING_HD |
| male_long_ochre_light | male | pré-composto; IDs 1/2/3 preservados | long | male_long_ochre_light.png | 512×768 | /assets/avatar/runtime/male/male_long_ochre_light.png | /assets/avatar/hd/male/male_long_ochre_light_hd.png | PENDING_HD |
| male_long_ochre_medium | male | pré-composto; IDs 1/2/3 preservados | long | male_long_ochre_medium.png | 512×768 | /assets/avatar/runtime/male/male_long_ochre_medium.png | /assets/avatar/hd/male/male_long_ochre_medium_hd.png | PENDING_HD |
| male_short_blue_dark | male | pré-composto; IDs 1/2/3 preservados | short | male_short_blue_dark.png | 512×768 | /assets/avatar/runtime/male/male_short_blue_dark.png | /assets/avatar/hd/male/male_short_blue_dark_hd.png | PENDING_HD |
| male_short_blue_light | male | pré-composto; IDs 1/2/3 preservados | short | male_short_blue_light.png | 512×768 | /assets/avatar/runtime/male/male_short_blue_light.png | /assets/avatar/hd/male/male_short_blue_light_hd.png | PENDING_HD |
| male_short_blue_medium | male | pré-composto; IDs 1/2/3 preservados | short | male_short_blue_medium.png | 512×768 | /assets/avatar/runtime/male/male_short_blue_medium.png | /assets/avatar/hd/male/male_short_blue_medium_hd.png | PENDING_HD |
| male_short_moss_dark | male | pré-composto; IDs 1/2/3 preservados | short | male_short_moss_dark.png | 512×768 | /assets/avatar/runtime/male/male_short_moss_dark.png | /assets/avatar/hd/male/male_short_moss_dark_hd.png | PENDING_HD |
| male_short_moss_light | male | pré-composto; IDs 1/2/3 preservados | short | male_short_moss_light.png | 512×768 | /assets/avatar/runtime/male/male_short_moss_light.png | /assets/avatar/hd/male/male_short_moss_light_hd.png | PENDING_HD |
| male_short_moss_medium | male | pré-composto; IDs 1/2/3 preservados | short | male_short_moss_medium.png | 512×768 | /assets/avatar/runtime/male/male_short_moss_medium.png | /assets/avatar/hd/male/male_short_moss_medium_hd.png | REJECTED |
| male_short_ochre_dark | male | pré-composto; IDs 1/2/3 preservados | short | male_short_ochre_dark.png | 512×768 | /assets/avatar/runtime/male/male_short_ochre_dark.png | /assets/avatar/hd/male/male_short_ochre_dark_hd.png | PENDING_HD |
| male_short_ochre_light | male | pré-composto; IDs 1/2/3 preservados | short | male_short_ochre_light.png | 512×768 | /assets/avatar/runtime/male/male_short_ochre_light.png | /assets/avatar/hd/male/male_short_ochre_light_hd.png | PENDING_HD |
| male_short_ochre_medium | male | pré-composto; IDs 1/2/3 preservados | short | male_short_ochre_medium.png | 512×768 | /assets/avatar/runtime/male/male_short_ochre_medium.png | /assets/avatar/hd/male/male_short_ochre_medium_hd.png | PENDING_HD |

## Verificação, evidências e pendências

Unit:104PASS/13arquivos (mesmos93+11 novos). E2E49produção+3DEV=52PASS/19skips históricos. Lint/typecheck/buildPASS/20rotas; next-env restaurado e tsc direto web/raizPASS. Herói no dev3000HTTP200. Evidências em build/task-0048-evidence. REWORK de import literal absoluto no teste browser foi corrigido usando caminho dinâmico; typecheck repetido PASS. Produção permanece com legados e guard da revisão false; não há implantação/push/serviço remoto.

Preservação SHA-256:591baseline,582intactos,9edições delimitadas+6novos;163mídias legadas intactas, zero missing/unexpected. Config Playwright raiz revisada separadamente, somente diretório de evidência atualizado. Lista exata dos arquivos de implementação alterados: data/avatarRuntime.ts, data/avatarHDPack.ts, data/gameplayAvatarPortrait.ts, components/avatar-runtime.tsx, dev/avatar-runtime-panel.tsx, avatar-hd-pack.test.tsx (sob apps/web/features/journey); tests/e2e/avatar-runtime-lab.spec.ts e avatar-hd.spec.ts; playwright.avatar-runtime-lab.config.ts. Dois PNG em public/assets/avatar/hd; documentação/inventário/contrato/memória listados em preservation.json. Scripts auxiliares/logs/screenshots permanecem no diretório build ignorado.

Pendências: redesenhar pilotos com mesma silhueta/proporções/framing/posição/baseline/centro visual; repetir auditoria e QA completa em telas/minigame/Body-Fit e DPR, então PILOT_COMPLETE. Somente depois da aprovação humana dos DOIS pilotos iniciar os52restantes. DONE somente com54produzidos/validados. Se desejar aceitar mudanças de enquadramento, isso exige autorização explícita de alteração do requisito; não foi presumida. Revisão QA/Security pelo autor, não independente.
