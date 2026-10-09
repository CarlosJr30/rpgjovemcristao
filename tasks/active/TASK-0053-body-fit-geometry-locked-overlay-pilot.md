# TASK-0053 — Body-Fit V2 Geometry-Locked Overlay Pilot

ID: TASK-0053
TITLE: Piloto geometry-locked de armadura feminina incomum
OBJECTIVE: Provar encaixe real da armadura sobre female_short_moss_medium HD, sem corrigir PNG após geração.
PRIORITY: P2 Normal
STATUS: REWORK
SCOPE: Um target armor_traveler_uncommon_female_v2; até quatro tentativas imagegen; scripts e evidências DEV/lab; documentação e memória. Extensão explícita dos perfis FRONTEND/QA a scripts/build/docs autorizada pelo contrato do usuário.
OUT_OF_SCOPE: Outros 15 targets, Avatar HD, anchors, arquitetura/runtime, saves/IDs/mecânicas/produção, READY, aprovação humana presumida, remotos, instalações.
DEPENDENCIES: TASK-0052B; female_short_moss_medium HD aprovado; fonte estética original tecnicamente válida.
ASSIGNED_AGENT: FRONTEND + QA pelo autor, sem revisão independente.
REQUIRED_CONTEXT: Contrato anexado TASK-0053; GLOBAL_CONTEXT; CURRENT_STATE; WORKFLOW; RULES; SECURITY; TOKEN_POLICY; perfis FRONTEND/QA; imagegen SKILL.md.
SECURITY_CONSIDERATIONS: PNG gerado deve passar CRC/decode/alpha; arquivos isolados em build, sem URLs externas, escrita de runtime ou secrets. SHA antes/depois.
ACCEPTANCE_CRITERIA:
- Canvas nativo PNG 1024×1536 com alpha real, somente armadura na posição corporal original.
- Geometria segue ombros/peito/axilas/cintura/quadril; rosto, pescoço, mãos e braços livres.
- Nenhum crop/resize/translate/scale/warp/alpha copiado/correção de PNG.
- Landmarks e vistas base/fonte/candidato/combinado/50%/guides com análise real por tentativa.
- Parar em FIT_PASS; duas falhas iguais exigem mudança concreta de método ou bloqueio; máximo quatro tentativas.
- FIT_PASS exige revisão corporal humana posterior; ZERO READY nesta etapa.
TEST_PLAN:
- Asset validator: CRC, decode, dimensão nativa, distribuição alpha, SHA-256.
- Body-Fit: inspeção visual nativa/composição e landmarks, sem inferir fit apenas de bbox.
- DEV lab: cópias byte a byte, mesma matriz de canvas, seis viewports, evidências.
- Equipment Portal: regressão mínima de fallback atual.
- Lint se scripts alterados; typecheck/build N/A se não houver TS/runtime alterado, conforme contrato.
- Preservação SHA-256 antes/depois de todo conjunto protegido.
DEFINITION_OF_DONE: Piloto FIT_PASS documentado com checks aplicáveis e memória atualizada, aguardando aprovação humana; falha leva a REWORK/BLOCKED sem alegar método validado.

## Execução

Método inicial: gerar somente camada de armadura diretamente nas coordenadas da referência HD imutável; estética secundária não determina escala. Landmarks são diagnósticos locais e não alteram anchors centrais.

## Resultado / acceptance check

2026-10-08: quatro tentativas imagegen concluídas; técnica4/4, FIT_PASS0, FIT_FAIL4, NEEDS_REWORK4 candidatos/1 target. Tentativa4 é a mais próxima, apenas diagnóstico. Sem HUMAN_BODY_FIT_REVIEW_PENDING, HUMAN_BODY_FIT_APPROVED ou READY. GENERATION_LIMIT_REACHED / GEOMETRY_METHOD_NOT_VALIDATED. Não DONE.

Métodos: (1) HD+fonte estética; (2) somente HD com estética verbal; (3) HD+contorno/landmarks; (4) esquema nativo separado+HD. Após duas falhas repetidas de torso longo/cintura baixa, mudou-se concretamente a referência visual; sem retries idênticos. Nenhum candidato corrigido por resize/crop/warp/alpha copiado/translate/scale/deslocamento.

SELF VALIDATE / QA pelo autor: PNG/CRC/decode/dimensão1024×1536/alpha/SHA4/4 PASS; classificação de fit real FAIL4/4. DEV24 amostras de viewport e24 vistas/zoom PASS, imagens finais de evidência1024×1536. Pequeno arredondamento inicial das capturas (1537 linhas) corrigido no viewport de QA; bytes dos candidatos intactos. Guia sobre HD usada na tentativa3 mantém1537 linhas como registro exato da entrada; esquema separado usado na tentativa4 é1024×1536. Referência HD sempre1024×1536.

Unit15 PASS (integridade/mapping/gate READY), Portal fallback/equip/comparison1 desktop PASS, lint PASS. Typecheck/build N/A pelo contrato: nenhum TS/runtime alterado; Portal executado sobre build vigente. SHA281/281 PASS, incluindo54 HD,16 fontes originais e arquitetura/anchors/runtime/mecânicas protegidos. ZERO outros assets gerados.

SECURITY: revisão pelo autor em docs/security/TASK-0053-body-fit-pilot-review.md; sem revisão independente alegada. PNGs não confiáveis passam CRC/decode, DEV localhost; sem secrets/configuração/dependências/remotos.

Evidências: build/task-0053-body-fit-pilot/review/index.html; fit_report.json; cada attempt-N tem receipt, análise por região, base/source/candidato/combinado/50%/guides/lab-checks; prompts preservados. Relatório: docs/architecture/TASK-0053-BODY-FIT-PILOT-REPORT.md.

Próximo passo: nova etapa de rework com desenho em camadas sobre HD imutável, cinto ancorado na cintura e volume do peito; exportar só equipamento em posição original. Não aplicar método aos outros15 antes de FIT_PASS e aprovação corporal humana específica. Não gerar nova tentativa sob este contrato esgotado.
