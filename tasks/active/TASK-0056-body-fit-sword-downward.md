# TASK-0056 — Body-Fit V2 — Sword Downward Orientation
ID: TASK-0056
OBJECTIVE: Corrigir quatro espadas para repouso com lâmina para baixo e verificar pega real, preservando HD e histórico.
PRIORITY: P2 Normal
STATUS: REWORK
SCOPE: Quatro sword_path_{common,rare}_{female,male}_v2; scripts/body-fit-sword-*.mjs; extensão compatível do bake TASK-0054 para rotação offline autorizada; build/task-0056-sword-downward/; docs/architecture/TASK-0056*, docs/security/TASK-0056*, memória. Perfil Frontend/QA estendido pelo orquestrador a esses scripts e staging dentro da autorização explícita do usuário. Máscara de oclusão offline pode ser experimentada; original HD imutável.
OUT_OF_SCOPE: Demais 12 equipamentos; 54 HD; runtime/combate/atributos/cinematic/saves/IDs/economia/progressão; READY automático; instalações, remotos, push, deploy, Supabase.
DEPENDENCIES: Pipeline TASK-0054/0055 e fontes físicas validadas por hash.
ASSIGNED_AGENT: Frontend, QA e Security pelo autor; sem delegação ou independência alegada.
REQUIRED_CONTEXT: Regras/workflow/perfis/skills locais; relatórios das quatro espadas TASK-0055; bake existente.
SECURITY_CONSIDERATIONS: PNG CRC/decode/dimensões; destinos locais fechados; snapshot dos arquivos protegidos; sem rede/secrets.
ACCEPTANCE_CRITERIA:
- Cada espada com cabo na palma, lâmina inteiramente para baixo, ponta ao chão, lateral sem atravessar corpo, proporção adequada e pega convincente.
- Dedos abertos ou mera proximidade não qualificam FIT_PASS; documentar limitação e solução de máscara/oclusão offline.
- Quatro derivados novos RGBA 1024×1536, transforms próprios; nenhum original/candidato antigo sobrescrito; runtime transform:none e ativação zero.
- Base, isolada, composição, zoom mão, corpo inteiro, guias, report/receipt por hash.
- FIT_PASS separado de NEEDS_REWORK; aceite humano pendente e READY zero.
TEST_PLAN: Inventário físico/hashes; checks PNG/bake/determinismo/rotação/oclusão; inspeção visual de quatro corpos e mãos; preservação SHA; lint/typecheck/build disponíveis; testes existentes do bake.
DEFINITION_OF_DONE: Todos os critérios visuais reais atingidos e checks aprovados, documentação/memória atualizadas. Falha anatômica exige REWORK, não DONE.

## Autorização
Pedido TASK-0056 desta sessão autoriza alterações locais reversíveis e bake offline individual com posição/escala/rotação. Não autoriza ativação runtime ou alteração da imagem original HD. Não será presumida presença de novas artes.

## Resultado e gates — 08/10/2026

Quatro targets / duas tentativas preservadas / oito PNGs. Seleção de revisão: attempt-02, quatro lâminas verticais para baixo. FIT_PASS 0; NEEDS_REWORK 4; READY 0; aprovação humana 0; ativação runtime 0. Inspeção visual dos quatro corpos e mãos, incluindo teste de máscara: dedos/polegar abertos não formam pega convincente. Máscara offline experimental reprovada, não selecionada. Escalas menores das raras e proximidade de guardas aos bolsos precisam revisão.

SELF VALIDATE / QA pelo autor: PNG CRC/decode/RGBA1024×1536/alpha/SHA e zero clipping de pixels visíveis das oito saídas PASS; 40 unit PASS (11 novos); browser local seis viewports/240 vistas PASS; lint/typecheck/build PASS; auditor HD54 PASS. Security pelo autor PASS, não independente. E2E gameplay/Portal N/A: runtime byte a byte preservado, mudança só offline. Aceite visual FAIL_OPEN_HAND_REQUIRES_REWORK; não DONE.

Baseline709:707 intactos; duas mudanças permitidas — bake compartilhado e formatação do novo inspector. 54 HD/16 fontes/demais12/V1/piloto/lote0055/runtime/saves/IDs/sistemas preservados. Nenhum push/deploy/remoto/Supabase/install/READY.

Relatório docs/architecture/TASK-0056-SWORD-DOWNWARD-REPORT.md; manifest TASK-0056-BAKED-ASSET-MANIFEST.json; checks TASK-0056-FINAL-CHECKS.json; review build/task-0056-sword-downward/review/index.html.

NEXT_ACTION: Carlos inspecionar evidências por hash e avaliar arte de cabo + máscara offline precisa. Mera proximidade da palma não aprova. Se a pose aberta impedir encaixe, manter REWORK e avaliar escopo específico de camada frontal independente sem modificar HD. Nenhum candidato elegível para aprovação Body-Fit final neste resultado.
