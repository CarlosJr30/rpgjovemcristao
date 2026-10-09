# TASK-0033 → Integração Equipment Overlays V1 HD / Retina

> Reavaliação humana em 2026-10-02: visual corporal V1 REPROVADO pelo usuário. TASK-0034 revoga READY corporal e prepara Body-fit V2. DONE abaixo registra a entrega técnica histórica pelo autor; não é aprovação visual humana. PNGs e evidências históricas preservados.

ID: TASK-0033
TITLE: Auditar e preservar nitidez de Avatar e overlays HD
OBJECTIVE: Integrar os 14 PNGs finais quando disponíveis e validar resolução, alinhamento e pipeline nos DPRs 1/2/3.
PRIORITY: P1 High
STATUS: DONE (auditoria HD e integração real V1 concluídas)
SCOPE: Avatar, composição e estilos de Avatar/equipamentos, resolver/visualConfig e assets dedicados V1, testes pertinentes, relatório e memória. Autorização explícita do usuário em 2026-10-01 para este escopo runtime; continuação da TASK-0031.
OUT_OF_SCOPE: Regenerar arte, usar ícones no corpo, Supabase, Auth, Guilda, Jornada como mecânica, Arena, Baús, economia, stats, RNG, Fuga, dependências e otimização global do Next.
DEPENDENCIES: TASK-0031 e TASK-0032 concluídas; 14 PNGs finais presentes no destino e com dimensões previstas.
ASSIGNED_AGENT: Perfil frontend, exercido localmente pelo autor.
REQUIRED_CONTEXT: GLOBAL_CONTEXT, CURRENT_STATE, WORKFLOW, RULES, SECURITY, frontend/coding/testing, manifesto V1, Avatar, resolver e CSS pertinentes.
SECURITY_CONSIDERATIONS: Sem serviços/credenciais/auth/dependências; testes em save local isolado. Não divulgar configuração local.
ACCEPTANCE_CRITERIA:

- Pipeline auditado com dimensões naturais/CSS e escala efetiva por DPR.
- Interpolação auto, original PNG preservado, arquivo independente por peça e carregamento somente dos equipamentos renderizados.
- Integração e READY somente após presença/alpha/resolução/encaixe visual aprovado nos dois corpos.
- Comparação visual e matriz 390×844, 412×915, 768×1024, 1440×900, 1920×1080 em DPR 1/2/3.
- Avatar base não regenerado; gargalo e resolução futura documentados.
- Unit/overlay/E2E/lint/typecheck/build executados; alterações existentes preservadas.
  TEST_PLAN:

- Testes existentes de overlays e suíte unitária completa.
- E2E existente e auditoria HD com medidas reais e capturas; inspeção pelo autor, sem revisão independente.
- Lint, typecheck, build e inspeção de diff no escopo.
  DEFINITION_OF_DONE: Todos os critérios com evidências reais, 14 arquivos finais aprovados e memória atualizada. Ausência da arte impede DONE, sem falsificar READY.

## Ajuste de escopo e aceite — 2026-10-01

Registro histórico da entrega de auditoria abaixo. Nova solicitação explícita em 2026-10-01 reabre o mesmo contrato para integrar os 14 arquivos agora presentes, mantendo todas as exclusões. READY exige inspeção real por peça/corpo e testes; peças incompatíveis ficam pendentes com evidência e fallback seguro. Não regenerar/editar arte ou criar novos itens mecânicos. QA pelo próprio autor.

O usuário confirmou que os PNGs finais ainda estão externos e pediu continuar apenas a auditoria, sem READY. Essa orientação substitui integração/aprovação das imagens como critério desta entrega. DONE se refere somente à auditoria. A integração futura permanece pendente. Correções de interpolação/intrínsecos já aplicadas antes da resposta foram preservadas; não houve alteração runtime posterior.

- Relatório: `docs/architecture/EQUIPMENT-OVERLAY-HD-AUDIT-V1.md`, com tabela dos 14 ausentes, demanda física e recomendação Avatar 1024×1536.
- SELF VALIDATE / QA pelo autor: 60 medidas nos dois corpos/telas, cinco viewports, DPR 1/2/3; quatro pares controlados de capturas inspecionados. Não há upscale CSS, mas DPR 3 e desktop DPR 2 demandam mais detalhe que a fonte. Visual dos equipamentos não testável sem assets e excluído do aceite atual.
- UNIT / OVERLAY: PASS, 37 arquivos / 204 testes, incluindo suites equipment-assets e equipment-overlays.
- E2E: PASS, 5 testes e 1 skip intencional para evitar repetir os contextos DPR próprios no projeto mobile.
- LINT / TYPECHECK / BUILD: PASS. Spawn EPERM inicial resolvido em execuções autorizadas fora do sandbox, sem instalação.
- SECURITY: N/A técnico, sem credenciais/auth/dependências/serviços; revisão pelo autor do escopo local e testes isolados. NO SECRETS PASS.
- PRESERVAÇÃO: 85 hashes preexistentes fora do CSS autorizado conferidos sem alteração após restaurar next-env aos bytes anteriores ao build. Avatar anteriormente limpo recebeu somente width/height; resolver/registro runtime preservados.
- ACCEPTANCE: PASS para auditoria reduzida explicitamente; nenhum READY, nenhuma arte copiada/produzida e nenhuma mecânica modificada. Memória atualizada.

## Integração real e aceite final — 2026-10-02

- A nova solicitação explícita reabriu o mesmo contrato; os 14 PNGs externos já estavam no destino. Todos reconhecidos em dimensões exatas/8 bits RGBA/alpha real. Nenhum byte de arte foi modificado, nenhum ícone substituído e nenhum item mecânico criado.
- Fontes conectadas em equipmentAssets.ts, calibração central female/male, registro de cabo da espada corrigido pela margem real, elmos com rosto aberto, botas independentes com mirrorX explícito e par masculino refinado após inspeção DPR 3. Medalhão reduzido e acima da armadura. Fonte e display separados, img nativo/auto preservados.
- READY após inspeção individual/composição real e checks: traveler-armor-uncommon, traveler-armor-rare, traveler-sword-common, traveler-sword-rare, traveler-helmet-rare, traveler-boots, traveler-shield-rare, wisdom-amulet. Nenhuma peça restante em ajuste. Dois IDs raros continuam legados somente no registro visual; catálogo/loot/stats inalterados, validada sua arte por fixtures de posse isolados.
- Relatório obrigatório ITEM/GENDER/ANCHOR/SOURCE/DISPLAY/STATUS/OBSERVAÇÃO: `docs/architecture/EQUIPMENT-OVERLAY-V1-INTEGRATION.md`, com os 14 arquivos, dimensões CSS reais, calibração e performance. Documentos anteriores recebem referência ao estado atual preservando auditorias históricas.
- SELF VALIDATE / QA pelo autor: fontes individuais, base e slots isolados, variantes raras e combos, dois corpos e elmos nos três cabelos. Inspeção real em 390/412/768/1440/1920 e DPR 1/2/3. Nenhum blur perceptível por upscale dos equipamentos; a base 512×768 continua gargalo conhecido, com recomendação futura 1024×1536, sem regeneração.
- UNIT / ASSET RESOLVER / OVERLAYS: PASS, `npm test`: 38 arquivos / 220 testes. Arquivos físicos verificados por decoder PNG, proporção e capacidade DPR 3, fallback de arte ausente testado com fixtures explícitos, snapshots de stats/Traveler preservados.
- E2E: PASS, `npm run test:e2e -- tests/e2e/hero-overlays.spec.ts tests/e2e/equipment-v1-hd.spec.ts tests/e2e/avatar-hd.spec.ts tests/e2e/equipment-v1-calibration.spec.ts`: 8 PASS / 4 skips intencionais nos projetos mobile dos testes com contextos próprios/preview. 840 medições reais de overlays e 60 da base. Troca, equipar/desequipar, voos dedicados, dois pés, persistência, contagem de camadas, atributos e preservação do nó base comprovados.
- LINT / TYPECHECK / BUILD: PASS na última calibração. `npm run lint`, `npm run typecheck`, `npm run build`. Formatação dos novos arquivos e diff do escopo conferidos; nenhuma dependência instalada.
- Falhas intermediárias corrigidas: nome de fixture inválido; antigo teste da base sem explicitar desequipar botas; tolerância inferior à quantização CSS. A inspeção DPR 3 levou ao refinamento das botas masculinas. Somente resultados finais entram no aceite.
- SECURITY: revisão local pelo autor, sem gatilhos técnicos de auth/dados/dependências/infraestrutura; imagens locais, testes com save isolado. NO SECRETS PASS. Não alegar revisão independente.
- PRESERVAÇÃO: 99 hashes fora das edições autorizadas, incluindo os 14 assets e as demais funcionalidades, sem alteração. Next-env restaurado aos bytes anteriores após build. Patches localizados preservam o trabalho anterior nos arquivos do escopo. Nenhum reset/checkout/clean/commit.
- ACCEPTANCE: PASS para integração solicitada. Documentação/memória atualizadas; ação manual de integração restante: nenhuma. Supabase/Auth/Guilda/Jornada como mecânica/Arena/Baús/economia/stats/Fuga/RNG preservados. Avatar HD e eventual inclusão mecânica dos IDs raros são trabalhos futuros fora desta entrega.
