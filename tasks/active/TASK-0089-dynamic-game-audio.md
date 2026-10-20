# TASK-0089 — Trilha sonora dinâmica e efeitos
ID: TASK-0089
TITLE: Contextos, conforto de leitura/vídeo e ciclo de vida no AudioManager existente (contexto09/09)
OBJECTIVE: Completar arquitetura de áudio dinâmica sem player paralelo, mídia nova, licença presumida ou alteração de gameplay/economia.
PRIORITY: P2 Normal
STATUS: BLOCKED
SCOPE: AudioManager/audio-assets e novo contrato tipado de slots/contextos, hooks/useGameAudio, controles existentes, integração apenas sonora em StoryVideoPanel/etapas Story e Arena/Torre/Baús, testes/harness/config e documentos/memória próprios. Orquestrador assume Architect/Frontend/QA/Security e permite esses caminhos, incluindo persistência somente de preferências de áudio. Relatório consolidado dos nove contextos é documento novo, sem editar contratos anteriores.
OUT_OF_SCOPE: Novas músicas/sons/vídeos/downloads/assets/protótipos/licenças/aprovações, dependências/serviços, engine/fórmulas/regras/loot/XP/moedas/inventário/0078/SQL/Auth/RLS, concessões ou confirmação de vídeo, main/merge/push/deploy/remoto/dados reais, overlays cancelados e funcionalidades após os nove contextos.
DEPENDENCIES: Base0088 limpa760b269dbbe947bb4da00903d64d19280a9e38ce, runtimeea0c07f; catálogo de produção de áudio vazio e mídias/licenças pendentes. Protótipo Suno Free é restrito à Arena DEV, sem promover a produção/Torre/estudo.
ASSIGNED_AGENT: Autor assume Architect/Frontend/QA/Security, sem subagentes ou revisão independente.
REQUIRED_CONTEXT: AGENTS/GLOBAL/CURRENT/WORKFLOW/RULES/SECURITY e perfis/skills selecionados já lidos; pedido09; manager/hook/config/mix/gesto/settings/testes, video-panel/progressão0081, Arena/Torre/reveal0088; manifestos/receipts e isolamento0042.
SECURITY_CONSIDERATIONS: Slots sem mídia/licença não viram playback. Aprovação fica nos artefatos revisados existentes; metadados de slot não são autorização. Nenhum secret/config remoto. Áudio de vídeo nunca confirma etapa, progresso ou prêmio; iframe externo sem eventos confiáveis usa pausa conservadora enquanto carregado, com fechar explícito. Som sem equivalente visual não é requisito de gameplay.
ACCEPTANCE_CRITERIA:
- Dez ambientes e nove mundos futuros tipados, metadados de ID/nome/contexto/path/duração/loop/volume/versão/aprovação/fonte/autoria/licença; slots pendentes sem URL/arquivo inventado.
- Mesmo singleton, uma ambientação estável e no máximo duas mídias no crossfade breve; fades/loops/volumes/mutes/prefs/gesto/aba/cleanup robustos, sem late-play após pausa/saída ou download repetido por UI menor.
- Vídeo/estudo têm prioridade e retomada respeita mute/aba/contexto; Torre/chefe/intensidade usam mesma arquitetura e somente mídia aprovada. Sem alterar regras de confirmação de vídeo.
- Baús acionam eventos por raridade real via manager, silêncio quando não aprovado; efeitos da Arena/controles três ações preservados.
- Testes dos20 critérios, regressões pertinentes, lint/tipos/build, matriz desktop/mobile/inspeção visual, escopo/preservação/relatório13 itens/memória/commits locais.
TEST_PLAN: FakeMedia isolada sem arquivo/áudio gerado para ciclo de vida/transições/falhas/concorrência/volumes/pause/aba/dados; hooks/route/video/settings/raridade; regressões Arena/Torre/Story/reveal; browser produto silencioso e harness de eventos com mesmo singleton, Chromium1440/320/WebKit390. Auditoria de hashes/proveniência local e scan produção sem protótipo. PostgreSQL N/A sem SQL.
DEFINITION_OF_DONE: Infraestrutura local comprovada e rodada09 documentada; integral BLOCKED para mídia/licença/audição real/aparelhos e dependências já registradas dos demais contextos, sem declarar lançamento/aceite integral do jogo.

## Auditoria e decisões
- Manager já oferece singleton, slots legados, duas mídias/crossfade de 650 ms, pool de 4SFX, preload none, fallback OGG/MP3, gesto isTrusted, defaults off e preferências/aba. Completar essas rotinas, sem reescrever playback em outra tecnologia.
- Faltam contextos específicos, contrato de proveniência, prioridade de vídeo/estudo, cache limitado de música e proteção de play assíncrono tardio/contexto alterado durante suspensão. Escopos sonoros/retenções de música serão tokens do mesmo manager, liberados no cleanup.
- Produção:APPROVED_MUSIC/EFFECTS vazios; oito arquivos Suno Free existem em assets-source/arena-audio-prototype com receipts históricas DEV, fora de public/produção nesta base. Não atualizar catálogo/aprovações ou auditor de licença. Títulos citados no pedido são referências, não identidade comprovada de arquivos.
- Players atuais são iframes YouTube/Vimeo sem API confiável de play/end. Pausar música enquanto iframe está carregado, oferecer fechar e retomar; não simular evento ended, assistir ou recompensa. Render de vídeos faltantes não bloqueia nem retoma áudio indevidamente.
- Intensidade Torre altera somente mix conservador de música aprovada, sem alterar NPCs ou combate. Boss usa slot próprio, ausência implica silêncio, sem fallback ao protótipo Arena. Leitura/quiz/Guilda/EBD/reflexão silenciosos por padrão, opção consciente de música de estudo separada.

## Checklist
- [x] Auditoria/base/contrato
- [x] Catálogo/proveniência/slots
- [x] Manager/contextos/volumes/ciclo de vida
- [x] Vídeo/estudo/Arena/Torre/Baús
- [x] QA/Security/checks/relatório consolidado; memória/recibo no fechamento
- [ ] Mídias/licenças/audição/aparelhos e aceite integral das dependências

## Validação e aceite

Infraestrutura local PASS. Critérios 1–20 mapeados individualmente no item 12 de `docs/architecture/TASK-0089-DYNAMIC-GAME-AUDIO.md`; relatório completo com13 itens e fechamento da rodada em `docs/architecture/NINE-CONTEXTS-LOCAL-REVIEW.md`. Não equivale ao aceite integral de mídia/gameplay hospedado.

SELF VALIDATE/QA:17 arquivos/104 testes direcionados PASS, mais1teste de ChestReveal real cobrindo cinco raridades, sem som em montagem/recarga;6 E2E PASS/0 skip/0 retry no produto e harness FakeMedia, Chromium1440/320 e WebKit390. Capturas inspecionadas, modal com teclado/rolagem; nenhum áudio gerado ou tocado. Lint/TypeScript/build PASS, gate de isolamento948 artefatos/0achado/8 hashes preservados, gate Avatar também PASS. Sem repetir suítes extensas ou antiga auditoria de dependências. Banco/editorial N/A sem SQL/narrativa alterados. Revisão React aplicada aos hooks/cleanup, componentes, rótulos e fronteiras de estado; nenhuma dependência nova.

REWORK→ACTIVE→VALIDATING: teste antigo esperava journey no menu e áudio de Guilda sem opção de estudo; ajustadas expectativas à política aprovada. Typecheck dos testes corrigiu casts Window. Regressão Torre inicial101 PASS/1 FAIL: primeiro ataque pode sofrer esquiva Ágil; orquestrador autoriza ajuste somente do teste de integração para comandos reais limitados até o resultado, preservando engine/RNG e verificações anti-concessão. Após rework104 PASS. Lint final identificou argumento não usado no novo teste de promessa: removido, sem mudança runtime. Logs das falhas preservados na pasta ignorada da tarefa.

SECURITY pelo autor: parecer próprio em `docs/security/TASK-0089-AUDIO-SECURITY.md`; sem revisão independente. Catálogos aprovados vazios/intactos e fontes Suno Free DEV intactas, sem novas licenças ou mídia. Vídeo não confirma progresso; som não concede prêmio. Auditoria `build/task-0089-dynamic-audio/scope-audit.json` confere limites, refs/main, engine/economia/0078/SQL/Auth/RLS/assets/contratos e hashes dos arquivos pendentes raiz. Memória raiz deve manter bytes anteriores como sufixo exato; registro final no recibo local. Nenhum remoto/push/deploy/merge/instalação.

BLOCKED: arquivos/direitos oficiais e aprovação verificável, audição/loops/mix reais, aparelhos físicos; dependências herdadas de conteúdo/vídeos/validador0081, catálogo/aquisição0084, autoridade/recibos0078 e ambiente/schema/Auth/RLS/cutover/riscos já documentados. Condição de desbloqueio: escopo posterior autorizado resolve essas dependências e produz evidências reais. Não iniciar próxima funcionalidade nem marcar jogo DONE.
