# TASK-0042 — Arena audio pack V1
ID: TASK-0042
TITLE: Trilha, SFX, mixagem e validação da Arena
OBJECTIVE: Música/SFX reais da Arena aprovados e sincronizados no AudioManager existente, exclusivamente em protótipo local não comercial; produção comercial bloqueada.
PRIORITY: P1 High
STATUS: PROTOTYPE_COMPLETE
SCOPE: Pedido explícito autoriza alterações locais reversíveis de áudio Arena: catálogo/receipts somente fatos reais e audit válido, mixagem Arena, timing semântico de apresentação, utilitários DEV, testes, documentação e memória. Autor assume Frontend/QA/Security localmente, sem subagentes; extensão dos perfis aos módulos de áudio existentes, hook de apresentação, testes colocalizados/e2e, scripts de inspeção, docs/architecture/security, contrato/memória/evidências. Outros contextos mantêm seus volumes/comportamentos.
OUT_OF_SCOPE: Downloads/instalações/geração de mídia sem autorização, aprovação ou audição inventada, segundo AudioManager; motor/dano/Foco/IA/progressão/XP/moedas/saves/visuais/Supabase/Guilda/Jornada/Fuga; push/deploy/migrations/RLS/Git destrutivo.
DEPENDENCIES: TASK-0038/0039/0040/0041; entrega dos oito áudios obrigatórios e aprovação humana; ffprobe disponível sem instalação automática.
ASSIGNED_AGENT: Autor assume Frontend, QA e Security; revisão não independente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE/WORKFLOW/RULES/SECURITY/TOKEN_POLICY/ORCHESTRATOR; perfis e skills locais Frontend/QA/Security; AudioManager/arena-audio/hook/manifesto/auditor e testes pertinentes.
SECURITY_CONSIDERATIONS: Não inventar assets/caminhos/receipts/licença/revisão de clipping/nível/loop. Catálogos somente pipeline existente. Preferências de áudio separadas do save; falha de mídia não bloqueia input.
ACCEPTANCE_CRITERIA:
- Música 60–120 s, SFX reais presentes/aprovados, audit e catálogo válidos.
- Eventos únicos sincronizados, mix Arena conservador, crossfade 650 ms, mute/gesto/aba oculta/cleanup/fallback preservados.
- Mobile 390/412 e desktop 1440/1920, stress/eventos/medias/input, unit/E2E/lint/typecheck/build comprovados; audição humana distinta de mocks.
TEST_PLAN:
- Inventário físico e ffprobe; pipeline existente; unit manager/mapping/timing/cleanup/stress; E2E Arena com catálogo vazio e eventos/preferências/input, sem alegar reprodução real.
DEFINITION_OF_DONE: PROTOTYPE_COMPLETE exige mídia/hash/probe/aprovação humana do protótipo e reprodução DEV isolada/regressão PASS; produção permanece bloqueada pela licença Suno Free, sem DONE comercial.

## Inspeção inicial
- Diretório apps/web/public/assets/audio ausente; nenhum dos oito arquivos obrigatórios encontrado. OGG/MP3 opcionais também ausentes. ffprobe não disponível no PATH; não instalar.
- Implementar somente preparação independente de mídia (mix/timing/testes/diagnóstico). Integração/audição/catalogação de áudio real ficam bloqueadas até entrega e receipts verdadeiras.

## Execução, REWORK e validação da preparação
- Mix central por categoria relativo aos sliders; música Arena 0,315 padrão, outros contextos sem mudança. Mesmo singleton, pool/650 ms central, saída interrompe efeitos e invalida retries pendentes.
- Hook emite ataque/especial em execution, contato/esquiva/Foco relevante em impact; dano/estado/fórmulas/settlement/resultados/timings visuais preservados. Lab mantém somente logs de eventos DEV, sem playback novo.
- Unit final 54 arquivos/335 PASS; E2E produção 31 PASS/1 skip preexistente +Lab 1 PASS; lint/typecheck/build PASS. Mocks/eventos/silêncio, não audição ou media playback real.
- REWORK: expectativa antiga de volume Arena corrigida para ganho; stress aguardou storage events jsdom; trace E2E tipado; rodadas falhas não contadas PASS. Baseline 563 arquivos usa hashes AudioManager/arena-audio da TASK-0039 (comprovadamente intactos em sua preservação final) para os dois arquivos já editados no início desta preparação; demais bytes capturados diretamente antes de edição.
- QA/Security pelo autor PASS somente preparação; relatório 28 itens docs/architecture/ARENA-AUDIO-PACK-V1.md e revisão docs/security/ARENA-AUDIO-PACK-V1-REVIEW.md. Evidências/preservação em build/task-0042-evidence.
- Audit global PASS sem rejeições, mas oito áudios MISSING: não é aceite de áudio. Não executar --write ou alterar approvals sem mídia/revisão real. ffprobe ausente, não instalado.
- BLOCKED por oito arquivos físicos +decoder/aprovações/audição; condição de desbloqueio no relatório. Critérios audiovisuais não atendidos, não DONE. Contrato único permanece active; memória atualizada.

## Retomada — finalização técnica 2026-10-05
- Pedido vigente autoriza ffprobe/hash, receipts parciais honestas, manifests/catálogos somente conforme auditor, testes/unit/E2E nos seis viewports, lint/typecheck/build, documentação e memória. Perfis Frontend/QA/Security assumidos pelo autor; sem delegação.
- Oito OGG presentes, ffprobe/ffmpeg disponíveis. Inspeção física: um stream Vorbis 48 kHz estéreo por arquivo, sem vídeo/cover art; durações esperadas e hashes reais registrados em build/task-0042-finalization.
- Origem Suno/edição local e reviewedBy Carlos Faustino fornecidos pelo usuário. Licença/autoria legal e audição pendentes; flags false, reviewedAt omitido porque revisão ainda não ocorreu.
- Auditor não possui READY_TECHNICAL/PENDING_PRESENTATION para catálogo. Gate humano permanece obrigatório; nenhuma ativação paralela nem --write enquanto houver rejeições.


## Aceite desta retomada — 2026-10-05

- STATUS: PROTOTYPE_COMPLETE (workflow); TECHNICAL_MEDIA_STATUS: TECHNICALLY_VALIDATED; HUMAN_GATE: PENDING_HUMAN_CONFIRMATION / PENDING_HUMAN_AUDIO_APPROVAL. Não DONE: catálogo ativo/auditor de aceite dependem de confirmação humana válida. Sem suporte READY_TECHNICAL no pipeline; gate não contornado.
- SELF VALIDATE: oito ffprobe/hash/metadata PASS e decode integral ffmpeg PASS. Edge desktop/mobile: decodeAudioData e playback mudo após clique isTrusted PASS, sem audição. Oito receipts parciais honestas e seis visuais preservadas.
- REWORK: reprodução de Defender confirmou duas emissões de defense, contra uma solicitada; removida emissão no impacto bloqueado. Teste valida uma em execution e um player_hit confirmado. Mix e timings não alterados; runtime somente uma linha removida do hook existente.
- Gates finais: unit 54 arquivos/336 PASS; E2E produção 37 PASS/1 skip preexistente +Lab 1 PASS; lint/typecheck/build PASS. E2E de vitória/derrota exige uma emissão final após impacto e não duplica no retry. Seis viewports pedidos cobertos; diagnóstico mudo não registra áudio no catálogo.
- QA/Security pelo autor, sem independência. Nenhum achado alto/crítico técnico. Audit exit 1: oito REJECTED por licença/revisão incompletas, seis visuais VALIDATED, 22 outros MISSING; --write NÃO EXECUTADO. Aprovações obrigatórias continuam false/ausentes.
- ACCEPTANCE: mídia técnica e regressão PASS; catálogo/aprovação/audição PENDING. Condição: obter origem de licença/autoria documentada compatível e aprovação real de apresentação/nível/clipping de cada hash/loop da música, registrar reviewedAt real e repetir audit/--write/reprodução integrada. Não substituir licença real para passar na allowlist.
- Memória/relatório/revisão atualizados. Evidência: build/task-0042-finalization; preservação final PASS (575 baseline, 565 intactos, 10 alterações autorizadas, 1 teste novo, zero divergências inesperadas); next-env restaurado. Sem dependências/ações remotas/publicação/push/deploy/dados apagados.

## Diagnóstico após relato de sons silenciosos — 2026-10-05
- Conferência atual: oito arquivos presentes com SHA-256 iguais às receipts; APPROVED_MUSIC e APPROVED_EFFECTS continuam vazios. Silêncio decorre da ausência de registro ativo, não de corrupção dos arquivos.
- Nenhuma aprovação nova foi fornecida pelo relato. Licença/autoria e aprovação auditiva continuam pendentes; esclarecimentos de fatos solicitados. Não contornar auditor nem fabricar aprovação. Sem alteração runtime; BLOCKED mantido.

## Contrato vigente — aprovação humana e registro de protótipo
- Usuário confirma Carlos Faustino ouviu/aprovou oito áudios, apresentação/níveis/ausência percebida de clipping/distorção e loop da música. Uso declarado Suno Free, somente protótipo/desenvolvimento não comercial; produção comercial NÃO aprovada.
- Autorizado: atualizar receipts/docs; catálogo e auditor separados de protótipo/dev, se compatíveis com isolamento existente; configuração local isolada de testes dev, testes unit/E2E/lint/typecheck/build. Autor assume Frontend/QA/Security, sem subagentes; extensão restrita aos módulos/scripts/configuração de teste necessários da TASK-0042.
- Produção: auditor/license allowlist e APPROVED_MUSIC/EFFECTS intactos. Não relabelar direitos. Aceite vigente do protótipo exige mídia/hash/review real, playback dev no singleton restrito à Arena, catálogos excluídos de produção, falhas não fatais e gates afetados PASS. Estado final PROTOTYPE_COMPLETE; lançamento comercial bloqueado até substituição/licença apropriada e nova auditoria/revisão. Não production-ready/DONE comercial.

## Aceite final do contrato de protótipo

- STATUS vigente: PROTOTYPE_COMPLETE. AUDIO: TECHNICALLY_VALIDATED / HUMAN_APPROVED_FOR_PROTOTYPE / NON_COMMERCIAL_ONLY. COMMERCIAL_RELEASE: BLOCKED_PENDING_AUDIO_REPLACEMENT. Não production-ready nem DONE comercial; contrato permanece active para visibilidade desse gate.
- reviewedBy Carlos Faustino; reviewedAt real nas oito receipts. presentation/noClipping/level true para os oito, loop true somente música e omitido em SFX. Origem Suno Free/edição local; licença SUNO_FREE_NON_COMMERCIAL, usageScope NON_COMMERCIAL_PROTOTYPE_DEVELOPMENT_ONLY, commercialProductionApproved=false. Crédito de geração/proveniência não é autoria/ownership exclusivo.
- Auditor original produção exit 1 por licença, seis visuais VALIDATED e 22 outros MISSING. Allowlist/auditor e catálogos APPROVED_* byte a byte intactos; --write de produção NÃO executado. Auditor de protótipo separado exit 0 e --write restrito DEV gerou oito bindings completos, sem alterar gate comercial.
- Seleção dev guarded NODE_ENV===development; efeitos apenas contexto Arena do mesmo singleton, música por arena. Outros contextos/mix/pools/crossfade/gestos/defaults/prefs/engine/saves preservados. Bundles produção não contêm bindings concretos/SunoFree.
- SELF VALIDATE/QA: oito reproduções nativas reais via manager no DEV, seis viewports, sem mock/mute forçado/unlock artificial, prefs/gesto/gains/mute/sliders/reload/cleanup/eventos únicos/esquiva/especial/resultados/falhas funcionais. Unit relevantes 7 arquivos/41 PASS; E2E produção 10 PASS e dev 3 PASS; lint/typecheck/build PASS. Seis receipts visuais intactas; bytes mídia preservados; next-env/web tsconfig restaurados.
- Security pelo autor, sem independência, sem achado alto/crítico técnico. Arquivos físicos continuam em public para desenvolvimento e NÃO autorizam publicação comercial. Preservação final PASS: 576 baseline, 564 intactos, 12 alterações autorizadas e 6 arquivos novos, zero divergências inesperadas; build/task-0042-prototype/preservation.json; documentação e memória atualizadas, evidência build/task-0042-prototype.
- ACCEPTANCE: protótipo PASS; comercial BLOCKED. Antes de publicação comercial, substituir os 8 áudios por assets com licença comercial válida ou regerar sob plano/licença apropriada, depois repetir auditor, receipts, catalog write e audição final.
- Não transportar aprovação para outro hash nem relabelar licença incompatível. Usar npm run dev e ativar Música/Efeitos no diálogo; npm run start mantém gate de produção. Sem publicação/push/deploy/Supabase/instalação/Git destrutivo.

## Reteste no servidor do usuário — 2026-10-05
- Relato de silêncio reabriu REWORK. No servidor DEV já existente em http://127.0.0.1:3000, E2E de reprodução nativa com preferências habilitadas PASS nos seis viewports. Não houve acesso à aba pessoal: inventário de computer-use vazio. Preferências começam desligadas; não afirmar qual era a preferência pessoal do usuário.
- Adicionado somente na Arena DEV o botão visível “Ativar e testar som”: clique explícito habilita música/efeitos, remove mute, recupera volumes padrão se zero, desbloqueia o manager e toca um ataque de teste. Nenhuma alteração automática de preferências; produção não apresenta o botão e continua sem este catálogo.
- E2E novo no mesmo servidor 3000 PASS: defaults desligados, ativação por clique real, música/efeito nativos, recuperação de mute/volumes zero persistidos e botão visível em 390px. Evidência build/task-0042-prototype/live-server-results; teste anterior dos seis viewports também PASS, registrado nesta retomada antes da adição do botão.
- Gates afetados: unit 3 arquivos/21 PASS; lint/typecheck/build PASS. QA pelo autor, sem independência. Revisão local do isolamento DEV e clique voluntário: sem novo risco alto/crítico; licenças/receipts/auditores/catálogos de produção intactos.
- Usuário confirmou “De certo!” após a atualização. Aceite funcional local confirmado; PROTOTYPE_COMPLETE restaurado. Bloqueio comercial e substituição futura dos oito assets permanecem.
