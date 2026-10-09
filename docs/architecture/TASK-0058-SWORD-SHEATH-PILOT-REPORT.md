# TASK-0058 — Sword Sheath Art & Body-Fit Pilot V1

08/10/2026, America/Sao_Paulo. **PILOT_TECHNICALLY_COMPLETE / FIT_PASS / HUMAN_BODY_FIT_REVIEW_PENDING**. Tarefa permanece em `tasks/active`, status de workflow BLOCKED por ausência de confirmação humana explícita; **não DONE**, não READY, não ativada. QA visual e Security pelo próprio autor, sem revisão independente ou aprovação de Carlos Faustino presumida.

1. **Fontes encontradas.** Reutilizados `assets-source/body-fit-v2-targets/sword_path_common_female_v2.png`, fonte estética existente, sampler TASK-0054/0056 e referência HD aprovada. Inspecionados source, bake/transform0056, diagnóstico0057 e cinto/quadril. Consultados relatório/manifest0057 e `NEEDS_NEW_BODY_FIT_ASSET.json`. A auditoria0057 de48assets continua válida por hash: nenhuma bainha/suspensão compatível existente. Histórico de mão0056 preservado; DEC-037 permanece vigente.

2. **Nova arte.** Skill imagegen e gerador integrado disponíveis e usados sob autorização deste contrato. Criada **uma bainha piloto**, com duas versões da mesma arte: v1 e uma edição dirigida da suspensão, v2. Ambas existem fisicamente em `build/task-0058-sword-sheath-pilot/source/`. Gerador exportou somente bainha/correias, sem Avatar, cabo, guarda ou lâmina. Não respeitou o registro pedido no primeiro prompt; o bake resolveu a similaridade offline. Na edição alterou também pixels da bainha, apesar do pedido de preservação: v2 recebeu nova auditoria/hash, v1 não foi sobrescrita. Prompts exatos e caminhos de origem em `source/generation-receipt.json`. Sem CLI/API fallback, instalação ou contratação de outro serviço.

3. **Avatar utilizado.** `female_short_moss_medium_hd.png`, físico1024×1536. SHA-256 `f260cb9b053b35c328025f1bc7ee602cbb30e57c71ba1f2238a4b1519685f460`. HD original não foi redesenhado, alterado nem copiado para dentro do overlay. Compatibilidade validada somente nesta referência, não nos outros53HD.

4. **Geometria da espada.** Cabo e guarda vêm exclusivamente dos pixels da fonte original, após similaridade uniforme. Não houve geração de outra espada. A parte da lâmina nua foi excluída sob a garganta da bainha, preservando pixels retidos;16.352pixels de alpha positivo removidos. Plano axial de corte55px a partir do landmark de referência da guarda. Cabo projetado674,33/642,92, acima da garganta697/745. Ponta da bainha832,70/1225,75, abaixo da garganta e acima do chão1495. Eixo cerca de15,8° para fora da vertical, descendo à direita da imagem.

5. **Cinto/quadril.** Cinto medido aproximadamente x410–655/y558–615, incerteza manual±12px. Fixação à direita da imagem, evitando bolsa à esquerda. Contatos superiores613,36/567,70 e644,16/596,96, respectivamente cinto frontal direito e extremidade descendente do couro. Duas correias contínuas conectam esses contatos ao suporte da bainha. A inspeção visual da conexão, além dos landmarks, sustenta o resultado técnico.

6. **Tipo de bainha.** Couro marrom, costura discreta, garganta e ponteira metálicas, duas correias com fivelas/rebites em bronze. Sem símbolos mágicos ou efeitos novos de brilho. Cabo/guarda verdes e dourados da espada original permanecem intactos esteticamente; não foram simplificados nem substituídos.

7. **Transform offline.** Convenção: origem superior esquerda, rotação positiva horária nas coordenadas da imagem. Mesma amostragem inversa bilinear com alpha premultiplicado do pipeline existente; nenhum arquivo do sampler compartilhado alterado nesta task.

| Componente | Escala uniforme | Rotação | Translate X | Translate Y |
| --- | ---: | ---: | ---: | ---: |
| Espada original, somente cabo/guarda retidos | 0,400 | +17,930753063561° | 633,254422103176 | 503,503072378310 |
| Bainha/suspensão source v2 | 0,460 | +10° | 549,022476824495 | 508,714261465397 |

Máscara offline localizada subtrai alpha do equipamento para manter braço/mão em primeiro plano. Trace poligonal e refinamento na região x720–824/y690–764: pixels verdes da capa com R<G+10 não são removidos, evitando corte prematuro na guarda. A cor do HD é usada somente para construir alpha da máscara; nenhum RGB/alpha do Avatar é embutido no overlay. Método específico desta pose/roupa; não generalizado. Registro completo e hash da máscara no metadata. Render contratado do resultado: full-canvas, `transform:none`; nenhuma integração runtime.

8. **Integridade/SHA.** PNG RGBA1024×1536 full-canvas, transparência real, CRC/decode/SHA PASS.1.534.326pixels totalmente transparentes no selecionado; nenhuma fonte alpha≥128 projetada fora do canvas. Os três bakes reproduzem exatamente seus hashes, inclusive máscara/composição.

| Arquivo | SHA-256 |
| --- | --- |
| Espada original | `03e3edbcf9572fae0cafc46b0a02eda045cbcdfe855dfcdf808e4aa8a5401d29` |
| Bainha source v2 | `b042739c4e179c504b33b0c50da710ae1c42edb7f67444f967264c8a219a9949` |
| Overlay selecionado attempt03 | `735000c62ddaee5214cfb895deae17685a1f2e1c0c642f3557e09879d90524f2` |

`baked/attempt-03/sword_path_common_female_v2_sheathed_baked.png` é o candidato selecionado. Metadata é o registro inicial de bake `FIT_VALIDATION_PENDING`; o **fit-report** posterior, receipt e manifest vinculam a avaliação FIT_PASS ao mesmo hash. Um novo hash exigirá nova avaliação.

9. **Resultado visual.** Espada embainhada, sem lâmina nua duplicada, cabo para cima/ponta para baixo, escala proporcional e suspensão visível. Não atravessa pernas ou bolsa; mão original livre e aberta, sem tentativa de empunhadura permanente. Guarda passa parcialmente atrás do braço. Não foram observados halos visíveis ou cortes artificiais na composição final, em fundo claro/escuro ou no zoom mobile. A abertura da máscara no overlay isolado representa profundidade prevista, não remoção de anatomia. Nenhum problema grave de oclusão remanescente identificado pelo autor; Carlos deve confirmar esse julgamento.

10. **Classificação.** Um target: **FIT_PASS1; NEEDS_REWORK0; HUMAN_BODY_FIT_REVIEW_PENDING1; HUMAN_APPROVED0; READY0; runtime0**. Duas tentativas históricas do mesmo target continuam NEEDS_REWORK: attempt01, correias fora do cinto; attempt02, trace apagava a guarda antes do braço. Attempt03 corrigiu a máscara. Não somar tentativas como três espadas ou três resultados de target. PNG válido não fundamentou sozinho o FIT_PASS.

11. **Evidências.** [Review desktop/mobile](../../build/task-0058-sword-sheath-pilot/review/index.html), com caminhos relativos para abertura local. Dez vistas com Avatar, espada original, nova bainha, overlay baked, composição/corpo inteiro, cintura, suporte, anterior×novo, guias e acabamento; relatório de encaixe acessível e apresentado na página.13evidências vinculadas por SHA no fit-report/manifest, incluindo máscara e cabo/guarda isolados. Staging `source/` e `baked/attempt-01`, `02`, `03` preservados. Capturas em `lab-results/` e `portal-results/`.

12. **Testes.**

| Check | Resultado | Evidência |
| --- | --- | --- |
| PNG/CRC/alpha/dimensões/SHA/bake/clipping | PASS, três tentativas | `node scripts/body-fit-sheath-pilot-check.mjs`; `asset-validation.json` |
| Limites de staging/rotação, pixels originais, máscara localizada, não sobrescrita | 5/5 PASS | `node --test scripts/body-fit-sheath-pilot-bake.test.mjs` |
| Review e Body-Fit Lab | 2/2 PASS | `npx playwright test --config=playwright.task-0058-lab.config.mjs`; `lab-results.json` |
| Equipment Portal/reduced motion/fallback/equip/reload | 9/9 PASS | `npx playwright test --config=playwright.task-0058-portal.config.mjs`; `portal-results.json` |
| Lint | PASS, exit0 após remover variável nova não usada | `npm run lint` |
| Typecheck | PASS, exit0 | `npm run typecheck` |
| Build nesta task | N/A, contrato dispensa sem produção alterada | Portal sobre build local0056 existente; nenhum TypeScript/runtime de produção modificado |
| Preservação | 1.078/1.078 PASS,54HD | `preservation-before.json` / `preservation-after.json` |
| Security pelo autor | PASS | [Revisão](../security/TASK-0058-sword-sheath-pilot-review.md) |

Viewports exatos:390×844,412×915,844×390,915×412,1440×900,1920×1080. Review60amostras de imagem; Lab6amostras da referência feminina, gate NEEDS_NEW_OVERLAY/READY0 preservado. Portal testa seis viewports; cinematic reduced motion feminino/masculino testa ausência de flight/impact, equip/reload e ausência de staging. Fixtures isoladas de navegador, sem save real. Capturas desktop1440/mobile390 e zoom mobile inspecionados visualmente; não se alega revisão manual de todas as capturas. Lab repetido apenas para verificar a troca dos links absolutos por relativos; sem repetição global. Servidores locais de teste3109/3111 encerrados, preexistentes preservados.

13. **Preservação.**54HD,16sources, piloto de armadura aprovado0054, cinco FIT_PASS0055, espadas/candidatos/evidências anteriores, demais equipamentos e código de runtime/saves/IDs/atributos/economia/combate/progressão permanecem byte a byte iguais no baseline. Mudanças desta task restritas a staging, novos scripts/testes/configs, documentação, contrato e memória. Sampler compartilhado intacto. Nenhuma cópia para produção, operação Supabase, push, deploy, instalação ou Git destrutivo. Geração artística integrada foi a única capacidade externa explicitamente usada.

14. **Pendência humana.** Carlos Faustino precisa aprovar visualmente **este piloto, esta referência e este SHA**: proporção, contato das duas suspensões no cinto e profundidade guarda/braço/garganta. Nenhuma aprovação geral, READY ou autorização runtime inferida. Máscara específica exige reavaliação antes de extrapolar a outras roupas/identidades.

15. **Outras três espadas.** Não geradas, processadas nem promovidas. Recomenda-se aguardar revisão deste piloto e depois contratar artes/transforms/evidências próprios para common male e rare female/male, respeitando cada cinto, bolsa, largura da guarda e pose. Não copiar automaticamente esta máscara/transform.

16. **Status final.** **PILOT_TECHNICALLY_COMPLETE / FIT_PASS / HUMAN_BODY_FIT_REVIEW_PENDING**. Workflow BLOCKED em `tasks/active/TASK-0058-sword-sheath-art-pilot.md`, aguardando confirmação humana explícita; **não DONE**.

## Verificação posterior do gate humano — 08/10/2026

O pedido de registrar aprovação é condicional e expressamente proíbe presumi-la. Nenhuma confirmação visual explícita de Carlos Faustino existe na conversa ou nos registros TASK-0058 inspecionados. Assim, não foram registrados HUMAN_BODY_FIT_APPROVED nem READY. O [receipt do gate](../../build/task-0058-sword-sheath-pilot/baked/attempt-03/human-approval-receipt.json) informa approver/approvedAt/evidência null e revisão pendente; receipt técnico original e candidatos não alterados.

SHA físico conferido novamente: `735000c62ddaee5214cfb895deae17685a1f2e1c0c642f3557e09879d90524f2`, igual ao pedido, manifest e receipt. PNG RGBA1024×1536, CRC/decode/alpha PASS; hash do Avatar e vínculos de metadata/fit-report com receipt conferidos.1.078/1.078 protegidos intactos. Alteração somente documental, sem geração, bake, runtime ou testes globais; validação estrutural e de integridade pelo autor. Testes anteriores da seção12 permanecem evidência histórica, não reexecutados nesta confirmação.

Desbloqueio: Carlos confirmar explicitamente a revisão deste target/Avatar/hash abrangendo proporção, fixação no cinto, posição lateral, cabo/guarda, direção para baixo, profundidade/oclusão, ausência de flutuação e aparência geral. Depois conferir novamente o hash e gates antes de registrar aprovação e READY exclusivamente em staging. Nenhuma ativação runtime autorizada.

TASK-0059 preparada somente como contrato futuro em backlog para as outras três espadas; nenhuma arte ou processamento iniciado.
