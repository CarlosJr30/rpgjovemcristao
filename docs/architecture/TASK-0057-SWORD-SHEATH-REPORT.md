# TASK-0057 — Sword Sheath Body-Fit V1

08/10/2026, America/Sao_Paulo. **REWORK / NEEDS_NEW_SHEATH_ART**, não DONE. QA e Security pelo próprio autor, sem revisão independente ou aprovação humana presumida.

A apresentação corporal futura de repouso é espada **embainhada no quadril**, cabo para cima e ponta para baixo. A tentativa de mão permanente da TASK-0056 fica como histórico, não como solução vigente. Cinematic, runtime e combate não foram alterados.

## Resultado

**Nenhum overlay embainhado foi produzido.** As quatro fontes têm lâminas expostas e faltam bainhas e suspensões adequadas. Os recursos locais inspecionados não permitem produzir uma bainha coerente mediante translação, escala, rotação ou máscara sem inventar nova arte. O contrato exige NEEDS_NEW_SHEATH_ART nessa condição; não foi improvisada uma bainha.

Foram criados quatro PNGs **somente diagnósticos**, de espada nua deslocada ao quadril, para documentar escala, direção, conflitos e orientar a futura arte. Eles não são candidatos embainhados, não têm fixação real e não cumprem o aceite.

| Target | Classificação | Orientação do diagnóstico | Fixação | Problemas do diagnóstico |
| --- | --- | --- | --- | --- |
| sword_path_common_female_v2 | NEEDS_NEW_SHEATH_ART | Lâmina para baixo, cabo para cima | Ausente | Cabo/guarda à frente do antebraço/luva; aproximação da perna; suporte inexistente. |
| sword_path_common_male_v2 | NEEDS_NEW_SHEATH_ART | Lâmina para baixo, cabo para cima | Ausente | Guarda cobre luva e bolsa; contato com contorno lateral da perna; profundidade incorreta. |
| sword_path_rare_female_v2 | NEEDS_NEW_SHEATH_ART | Lâmina para baixo, cabo para cima | Ausente | Guarda ampla sobre luva/bolsa; ponta invade/aproxima coxa; não há bainha. |
| sword_path_rare_male_v2 | NEEDS_NEW_SHEATH_ART | Lâmina para baixo, cabo para cima | Ausente | Guarda sobre luva/bolsa e arma diante do contorno da perna; suspensão ausente. |

Contagens por target, mutuamente exclusivas: **FIT_PASS 0; NEEDS_REWORK 0; NEEDS_NEW_SHEATH_ART 4**. O status da tarefa é REWORK; erros de posição dos diagnósticos estão registrados como problemas secundários, sem contar novamente os mesmos targets. Overlay embainhado 0; diagnósticos 4; HUMAN_BODY_FIT_REVIEW_PENDING 0; HUMAN_APPROVED 0; READY 0; ativação runtime 0.

## Inspeção e reaproveitamento

Antes de alterar arquivos foram inspecionados os quatro candidatos selecionados da TASK-0056, suas fontes no contact sheet histórico, reports/manifest, pipeline TASK-0054/0055/0056, overlays V1 comum/rara, ícone da espada e duas fontes antigas. SHA das quatro fontes, dos candidatos TASK-0056 e das duas referências HD conferidos antes do bake. Não se repetiu a avaliação de empunhadura anterior.

A busca por nomes/conteúdo `bainha`, `embainh`, `sheath`, `scabbard`, `sheathed` e `correia` não encontrou componente de arte compatível. Catálogo físico com **48 assets** de `assets-source/` e `apps/web/public/assets/equipment/` foi inventariado por caminho/SHA e inspecionado visualmente em contact sheet. Fontes atuais, antigas e V1 mostram lâminas expostas; ornamentação da rara não é bainha. Cintos de armaduras não fornecem uma suspensão de espada ou bainha reutilizável; a bolsa dos HD é uma bolsa, não bainha. Nenhum equipamento foi recortado ou modificado para simular esse componente.

Reaproveitados: quatro sources originais para diagnósticos; dois HD para cópias/composições; candidatos0056 apenas para comparação; sampler existente para bake. V1, fontes antigas e ícone foram somente inspecionados, não remapeados como V2 nem promovidos.

Entradas e hashes completos: [manifest](TASK-0057-SHEATH-ASSET-MANIFEST.json), `build/task-0057-sword-sheath/local-art-inventory.json` e `preservation-before.json`.

## Cinto, quadril e transforms

Referências: `female_short_moss_medium` / `male_short_moss_medium`, PNG HD1024×1536. Não se extrapola compatibilidade aos outros 52 HD.

Medição manual refinada do corpo do cinto, aproximadamente ±12px: feminino x410–655/y558–615; masculino x398–648/y590–650. Ponto de suspensão proposto no couro: feminino **455,581**; masculino **446,618**. Esses pontos são guias para desenho futuro, **não fixação validada**. As medidas amplas iniciais foram preservadas em `bake-metadata.json`; refinamento está em `reviewed-metadata.json` e arquivos `reviewed_*guides.png`. Não houve alteração dos PNGs diagnósticos ou sobrescrita dos primeiros guias.

| Target | Guarda no quadril (proxy) | Escala uniforme | Rotação | translateX | translateY |
| --- | --- | ---: | ---: | ---: | ---: |
| common female | 313,666 | 0,400 | +32,930753° | 310,320641 | 472,206241 |
| common male | 302,696 | 0,415 | +149,414140° | 656,415490 | 1024,027353 |
| rare female | 317,678 | 0,345 | 0° | 140,015000 | 557,250000 |
| rare male | 305,699 | 0,355 | −0,127892° | 122,929036 | 559,891061 |

**Transforms da tabela são somente dos diagnósticos sem bainha. Transform final embainhado: null nos quatro.** Cada espada tem landmarks próprios de guarda/cabo/raiz/ponta, registro da guarda ao proxy e solução individual de direção. Convenção: origem top-left; rotação positiva horária em coordenadas de imagem; similaridade uniforme offline.

Samplagem existente TASK-0054/0056: amostragem inversa, bilinear com alpha premultiplicado; pipeline compartilhado **não modificado** nesta tarefa. Quatro diagnósticos RGBA1024×1536 com transparência real, CRC/decode/SHA PASS; zero pixels de fonte alpha≥128 projetados fora do canvas. Direção geométrica e registro do proxy não equivalem a fixação física. Runtime render contratado sem transform; não houve integração.

## SHA-256

**Derivados finais embainhados: ausentes, SHA null.** Os hashes abaixo identificam exclusivamente `diagnostic_unsheathed_hip.png` de cada target:

| Target | SHA-256 diagnóstico |
| --- | --- |
| common female | 5698df0343a9cebde08576577a04a30c371dfa42f97194b7c3b0d10a9e3b72bd |
| common male | f408c2f6c6cfe4c68c967bd9bccbdf1cd68d7c39347bd3c38b8dc67ed88edc6c |
| rare female | f1c7c3901bce263b7008db3935b3dc555f6c71b7a4dbc6dd2455c67d061cee7d |
| rare male | 6f23c869ebdf02981873f363ecef8b362d9c97825feba6867e0a70bd3023eee4 |

## Arte necessária, profundidade e oclusão

Necessários quatro overlays embainhados próprios por target/gênero, ou componentes locais legítimos que permitam produzi-los: bainha simples de couro para comum; bainha com ornamentação coerente para rara; garganta e ponta/chape da bainha; correia/suporte de suspensão que realmente conecte o cinto à bainha. A lâmina deverá ficar coberta. É possível reaproveitar cabo/guarda apenas se sua proporção e posicionamento forem compatíveis, incluindo acabamento simples da comum.

Suspensão deve respeitar bolsa, roupa e braço existentes; pode passar parcialmente atrás do cinto/bolsa, com oclusão offline limpa. O diagnóstico em primeiro plano demonstra por que deslocar a espada nua não resolve: falta sustentação e há cruzamentos com braço/luva/bolsa/perna. Futuro asset precisa rever posição e perfil da guarda, não copiar cegamente o transform diagnóstico. Linha pontilhada magenta indica intenção de suspensão, não é correia ou arte de equipamento.

Não foram usadas máscaras, não há halos introduzidos por máscara e nenhum pixel HD foi redesenhado, recortado ou copiado para um equipamento. A validação de oclusão da bainha real é **não executável enquanto faltar essa arte**. Não se alegou ausência de defeitos de oclusão dos diagnósticos: os defeitos estão explicitamente registrados.

## Evidências

Review: `build/task-0057-sword-sheath/review/index.html`, com comparação das quatro, status e ausência de overlay final claramente indicados.

Por target em `build/task-0057-sword-sheath/<target>/`: Avatar base; source original; candidato/composição0056; overlay/composição/corpo inteiro diagnósticos; zoom original de cinto/quadril; zoom diagnóstico; guias refinados na base e composição; metadata original/refinada; SHA; report individual de encaixe/oclusão; receipt. Reports listam hash/dimensões de 12 evidências por target. `finalSheathedOutput`, `finalSheathedSha256` e `finalSheathedTransform` ficam null. Não há arquivo fingindo representar um overlay embainhado ou composição final.

Contact sheet dos 48 assets e zooms dos cintos em staging; screenshots dos seis viewports em `lab-results/`; capturas do Portal/cinematic/reduced motion em `portal-results/`. Guias cyan=cinto/ponto de ancoragem proposto; magenta=trajeto proposto para suspensão e proxy do quadril; amarelo=eixo da lâmina diagnóstica.

## Testes e gates

| Check | Resultado | Evidência / limite |
| --- | --- | --- |
| PNG/alpha/dimensões/CRC/decode/SHA/orientação | PASS nos quatro diagnósticos | `node scripts/body-fit-sheath-check.mjs`; `asset-validation.json` |
| Determinismo, gates de arte, geometria e proteção contra sobrescrita | 7/7 PASS | `node --test scripts/body-fit-sheath-diagnostic.test.mjs` |
| Review e Body-Fit Lab | 2/2 PASS | `npx playwright test --config=playwright.task-0057-lab.config.mjs`; `lab-results.json` |
| Equipment Portal e cinematic reduced motion | 9/9 PASS | `npx playwright test --config=playwright.task-0057-portal.config.mjs`; `portal-results.json` |
| Lint | PASS | `npm run lint`, exit0 |
| Typecheck | PASS | `npm run typecheck`, exit0 |
| Build nesta task | N/A | Nenhum runtime/TypeScript de produção modificado; dispensa explícita no pedido. Portal executado sobre build local existente validado na TASK-0056. |
| Fixação / bainha / aceite visual | FAIL | Arte necessária ausente; diagnósticos flutuantes/com conflitos, não candidatos aprovados |
| Security pelo autor | PASS | [Parecer](../security/TASK-0057-sword-sheath-review.md) |
| Preservação | 864/864 PASS | `preservation-before.json` / `preservation-after.json` |

Seis viewports exatos: **390×844, 412×915, 844×390, 915×412, 1440×900, 1920×1080**. Review: quatro targets×seis viewports×dez vistas = 240 amostras, sem overflow horizontal, imagens ausentes, erros de página ou transforms corretivos CSS; reduced motion ativo. Body-Fit Lab: somente duas referências/common sword, 12 amostras de viewport, gate READY0/fallback preservado. A rara arquivada não é selecionável no catálogo runtime do Lab; as duas raras foram inspecionadas no review próprio, não ativadas para testar.

Portal: seis viewports com comparação/slots/filtros/poder/links/equip/reload, mais fallback de arte; reduced motion feminino/masculino sem flight/impact, equip e reload preservados, nenhum overlay de staging no runtime. Dados dos testes ficam em contextos de navegador isolados, descartados; nenhum save real do usuário foi acessado. Screenshots de review390/1440 e Lab inspecionados visualmente; não se alega revisão manual de todas as capturas do Portal. Servidores locais3109/3111 encerrados pelo Playwright, servidores preexistentes preservados.

## Preservação, pendências e status final

864 arquivos protegidos permanecem byte a byte idênticos: **54 HD**, fontes, piloto0054 aprovado, lote0055 incluindo cinco FIT_PASS, todos os candidatos/evidências0056, V1 e demais equipamentos, scripts históricos e código runtime/saves/IDs/atributos/economia/progressão/combate/auth. Arquivos novos ficam somente nos caminhos da TASK-0057. Body-Fit Lab mantém textos históricos de mão porque o runtime/DEV existente não foi editado; a decisão visual vigente foi registrada em DEC-037 e no novo review. Cache/typegen locais não são novos assets nem alteração de produção.

Sem geração externa, instalações, operações remotas, Supabase, push, deploy, READY ou aprovação humana presumida.

**TASK-0057 permanece REWORK / NEEDS_NEW_SHEATH_ART em tasks/active.** Para avançar, falta disponibilizar arte local de bainha/suspensão adequada aos quatro targets ou autorizar explicitamente geração externa. Depois: bake por hash, correção real de oclusão/proporção, inspeção de cintura/quadril, regressões e aprovação corporal humana específica. Nenhum diagnóstico atual é elegível a FIT_PASS ou READY.
