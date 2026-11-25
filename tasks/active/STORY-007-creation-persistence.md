# STORY-007 — Persistência e integração segura da Jornada Bíblica

ID: STORY-007
STATUS: POSTGRESQL CONTRACT VALIDATED — APPLICATION ADAPTER PREPARED, NOT WIRED
BASE: `codex/story-006-creation-finale` @ `b944f3c76be96c8c03da7bb8ff337570363ea58b`

## Contratos reutilizados

- Auth atual e ownership: `auth.users`, `public.travelers.user_id`, `public.owns_traveler`; o avatar ativo já é `travelers.is_active` e `set_active_traveler(uuid)`. RPCs de progresso exigem conta permanente, ownership e avatar ativo; lock na linha do Viajante serializa troca de avatar e escrita.
- Progresso agregado: `public.story_definitions`, `public.story_progress`, `story_private.step_receipts` e `public.complete_story(uuid,text)` da proposta TASK-0081. `story_progress` continua leitura/retomada agregada; TASK-0081 não distingue os sete dias e permanece proposta local, não migration registrada.
- A extensão abaixo mantém as sete evidências e tentativas de quiz em `story_private`; não duplica `story_progress` nem reescreve os recibos existentes. Progresso corrente deriva da revisão ativa de `story_definitions`.
- O Diário continua fora de evidência de gameplay/economia. Não há escrita de progresso pelo cliente, localStorage, XP, moedas ou baús.

## Artefatos locais

- `packages/database/proposals/story007-creation-checkpoints.sql`: proposta versionada e desligada por padrão. Acrescenta conteúdo candidato privado por revisão, recibos idempotentes por dia/Harmonia, tentativas server-scored de quiz, leitura de retomada, e manifesto privado para vínculo futuro de vídeo/revisão/hash/legenda/licença/verificação. Não concede economia. Execução depende da proposta TASK-0081 e de migrações futuras aprovadas.
- `packages/database/tests/story007-creation-checkpoints.postgres.test.mjs`: suíte isolada com Auth e contas sintéticas para ownership, avatar ativo, RLS/grants, bloqueio de sequência, resultado incorreto, concorrência/replay, pontuação e ausência de alterações econômicas/canônicas.
- `.github/workflows/quality.yml`: job direcionado `story007-postgres` reaproveita o binário PostgreSQL efêmero fixado já usado por `governance-postgres`.
- `apps/web/lib/supabase/repositories/creation-checkpoint-repository.ts`: adaptador injetável e ainda desconectado da tela; encapsula leitura, sete dias, Harmonia e tentativas de quiz, valida payloads e preserva `operationId` para replays idempotentes.
- `apps/web/lib/supabase/repositories/creation-checkpoint-repository.test.ts`: testes direcionados do mapeamento de RPC, validação de respostas, inputs, retomada por revisão e repetição de quiz.
- `packages/database/proposals/story007-economy-conciliation-v1.md`: proposta de absorver a recompensa de mundo Origens no marco já aprovado de conclusão. Preserva as quatro chaves STORY-001A e o teto, abatendo 30 moedas + um Baú Comum de recibos históricos Origens apenas no payload futuro de conclusão. Não ativa claims.

## Resultados e limites

- Revisão de contrato: implementada localmente em propostas, sem RPC existente duplicada. A proposta de checkpoint cria operações por dia, Harmonia, tentativa de quiz, leitura e manifesto futuro; só responde sobre validação de resposta, não comprova percurso físico nem atenção.
- Persistência cross-device no aplicativo: PENDENTE. O adaptador está preparado, mas não é importado pelo fluxo demonstrativo, não obtém cliente Supabase e não faz chamadas até sua integração explícita após migração aprovada em TEST. Hoje a demonstração STORY-006 continua só em memória.
- PostgreSQL/RLS/concorrência: PASS no job direcionado `PostgreSQL isolado — STORY-007`, Actions run 544, commit `7fb489122e7969b0236799fb6eb349720e206716`: 6/6 testes passaram em PostgreSQL efêmero nativo no runner Windows. A suíte verificou ownership/conta permanente/avatar ativo, leitura isolada entre usuários, acesso anônimo, ACL/RLS, escrita direta negada, ordem e respostas, concorrência/replay, sete dias, Harmonia, quiz, revisão independente, preservação agregada e ausência de economia/conclusão/vídeo canônicos. Nenhum WSL, Docker ou Supabase remoto foi usado.
- Verificações do adaptador: teste direcionado 4/4, ESLint dos dois arquivos e TypeScript raiz passaram; `git diff --check` passou.
- Conteúdo e vídeo: PENDENTES. As respostas seed são marcadas candidatas/draft. O manifesto exige identidade imutável, hash, duração, idioma, hash de legendas, alternativa acessível, aprovação editorial, licença e versão de política. Não existe RPC de vídeo nem função de conclusão de fase nesta proposta; `video_completed` permanece falso até validador aprovado.
- Economia-041: PROPOSTA, não aprovada. Requer revisão independente dos recibos históricos e do payload final antes de criar migration/alterar roteador.
- Nenhuma migration registrada/remota, migration aplicada, escrita canônica, recompensa, alteração de Guilda/QA, merge ou deploy.

## Próximos gates para TEST

1. Fazer revisão independente do contrato SQL e ACL/RLS antes de converter a proposta em migration para TEST; o teste local sintético não substitui essa revisão nem valida configuração remota.
2. Revisão editorial aprovar texto, respostas e referências. Publicar uma nova revisão no servidor; nunca mudar em-place resposta de uma revisão já usada.
3. Escolher vídeo e provedor autorizado; aprovar manifesto, licenças, legendas, alternativa acessível e fonte confiável do evento de conclusão. Implementar validador de vídeo fora do navegador.
4. Aprovar `creation-phase-economy-v1` com revisão independente; testar conciliação sintética e concorrência sem grants em contas reais.
5. Converter as propostas para migration versionada, registrar no fluxo de migrações depois da revisão e aplicar somente em Supabase TEST. Então injetar o RPC Supabase tipado no adaptador e testar Auth/RLS/retomada com contas sintéticas autorizadas.
6. Confirmar hospedado em TEST que progresso retoma em outro dispositivo e que vídeo, fase e recompensas continuam fechados sem prova.
