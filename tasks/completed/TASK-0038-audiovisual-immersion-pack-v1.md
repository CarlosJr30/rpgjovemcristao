# TASK-0038 — audiovisual immersion pack V1
ID: TASK-0038
TITLE: Preparação validada do pacote audiovisual, Arena primeiro
OBJECTIVE: Prontidão técnica para mídia real, sem registrar arquivos ausentes.
PRIORITY: P1 High
STATUS: DONE
REWORK: Primeira validação dirigida: 14 PASS e 3 FAIL; corrigir reconhecimento de recusa de autoplay entre realms e sincronização dos testes com promises de mídia. Retorno ACTIVE para correção e nova validação.
SCOPE: Pedido explícito de 2026-10-05 autoriza mudanças locais reversíveis em apps/web/features/journey/audio, apresentação/bindings da Arena e slots visuais de portais, hooks, CSS e testes pertinentes; catálogo/manifesto/validador local em scripts e docs/architecture; docs/security, contrato e CURRENT_STATE. Frontend/QA/Security assumidos pelo autor; extensões para testes colocalizados e scripts documentadas. Exceção runtime somente para esta tarefa, supersedindo o limite fundação/TASK-0031 no escopo explícito.
OUT_OF_SCOPE: Downloads/geração de mídia ausente, dependências, push/deploy, Supabase/Auth/RLS/migrations/backend Guilda, saves/economia/balanceamento/motor/progressão/raridades, redesenho HD ou aprovação READY corporal.
SCOPE_EXTENSION: snake-chase-game exclusivamente binding de proximidade sonora usando distância visual vigente e throttle; nenhum cálculo de gameplay alterado.
DEPENDENCIES: TASK-0037; assets reais/receipts de aprovação serão necessários para ativar mídia futura.
ASSIGNED_AGENT: Frontend, QA e Security pelo autor, sem revisão independente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE/WORKFLOW/TOKEN_POLICY/ORCHESTRATOR/RULES/SECURITY, perfis/skills Frontend/QA/Security, AudioManager e apresentações atingidas.
SECURITY_CONSIDERATIONS: Catálogo local fechado, prova de existência/hash/licença/revisão, paths confinados ao public/assets, sem URL remota; falha de mídia não pode bloquear jogo.
ACCEPTANCE_CRITERIA:
- Auditar AudioManager e preservar único sistema, gesto/volumes/mute/persistência/fades/crossfade e ausência segura; fallback MP3 local validado opcional.
- Manifesto com sete faixas, vinte efeitos e assets visuais esperados; não registrar ausentes, validação local antes da integração.
- Arena preparada para cenário/retratos reais, fallback atual preservado; ataque/defesa/foco/esquiva/impacto/vitória/derrota ligados a eventos reais.
- Jornada/Fuga/Guilda/Devocional/Quiz conservam contextos/eventos existentes e slots futuros pertinentes.
- Mobile/cinco viewports/reduced motion/asset falho sem crash; não alegar audição/artes físicas ausentes.
TEST_PLAN:
- Unit dirigido AudioManager/bindings/validação/fallback; suíte unit, lint/typecheck/build; E2E pertinentes nas cinco larguras.
- Baseline em build/task-0038-baseline; guardar capturas fora de test-results, restaurar next-env.
DEFINITION_OF_DONE: Gates PASS, relatório dos 17 itens, Security/QA reais e memória/status atualizados. Produção de mídia pendente explicitamente permitida pelo pedido.

## Auditoria inicial
- Nenhum arquivo de áudio ou nova arte esperada encontrado. Catálogos atuais vazios; não baixar/gerar.

## Validação
- Ciclo REWORK adicional: lint inicial duas warnings de picture/disable desnecessário; typecheck inicial duas propriedades de objeto JS inferido em teste. Corrigidos; lint/typecheck finais PASS, zero warnings.
- Unit completo 49 arquivos/292 testes PASS. Nova execução final dirigida após ajustes documentada no aceite.
- Build PASS: 20 rotas estáticas; next-env restaurado byte a byte ao baseline.
- E2E três specs pertinentes: 17 PASS/1 skip preexistente de teste exclusivo mobile no projeto desktop. Cinco viewports solicitados, áudio/reload/ausência/reduced motion, Arena treino/apresentação e Fuga/input. Sem novo skip, erro ou retry.
- Audit local: 35 principais MISSING, zero REJECTED e zero registros; decoder/audição/artes reais indisponíveis e pendentes conforme pedido. Sem downloads ou geração.
- QA/Security pelo autor, sem revisão independente; revisão em docs/security/AUDIOVISUAL-PACK-V1-REVIEW.md. Não alterados narrativa ou referências bíblicas (gate N/A).
- Relatório de 17 itens em docs/architecture/AUDIOVISUAL-IMMERSION-PACK-V1.md; evidências locais em build/task-0038-evidence.
- Conferência dirigida final: cinco arquivos/18 testes PASS. Inspeção de batalha mobile/Arena desktop/Home mobile: PASS; 111 PNGs preservados. Ausência/falha de mídia não bloqueiam jogo.
- Preservação: 165 baseline, 154 hashes intactos e 11 edições autorizadas (incluindo memória); zero alteração inesperada. Next-env restaurado. Nenhum arquivo de mídia criado ou alterado.
- Gates SELF VALIDATE/QA/SECURITY/ACEITE/DOCUMENTAÇÃO/NO SECRETS/NO KNOWN CRITICAL REGRESSIONS PASS; unit/integração/lint/typecheck/build PASS. Narrative/biblical N/A com motivo acima. Aceite técnico satisfeito; mídia real pendente por instrução explícita.
- Risco encontrado: resume reinicia volume e reprodução mesmo quando não suspenso; cleanup de Shell suspende imediatamente durante troca de rota, prejudicando crossfade real.
- Arena tem eventos de ação/resultado; impacto ainda não tem binding separado. Adversários de treino usam monogramas; cenário reutiliza Jardim.
