# STORY-007 — Persistência e integração segura da Jornada Bíblica

ID: STORY-007
STATUS: LOCAL CONTRACT PREPARED — CI VALIDATION RUNNING
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
- `packages/database/proposals/story007-economy-conciliation-v1.md`: proposta de absorver a recompensa de mundo Origens no marco já aprovado de conclusão. Preserva as quatro chaves STORY-001A e o teto, abatendo 30 moedas + um Baú Comum de recibos históricos Origens apenas no payload futuro de conclusão. Não ativa claims.

## Resultados e limites

- Revisão de contrato: implementada localmente em propostas, sem RPC existente duplicada. A proposta de checkpoint cria operações por dia, Harmonia, tentativa de quiz, leitura e manifesto futuro; só responde sobre validação de resposta, não comprova percurso físico nem atenção.
- Persistência cross-device no aplicativo: PENDENTE. Não integrar a tela ao RPC enquanto a proposta não estiver validada/aplicada em ambiente local/TEST e a revisão editorial não publicar conteúdo. Hoje a demonstração STORY-006 continua só em memória.
- PostgreSQL/RLS/concorrência: PENDING até CI. A primeira execução local não iniciou porque este Windows não tem WSL; nenhum banco remoto foi usado. A suíte foi adaptada ao binário temporário fixado já empregado pelo workflow Windows existente, sem exigir instalação local. O job direcionado aguardará execução no runner depois do push desta branch.
- Conteúdo e vídeo: PENDENTES. As respostas seed são marcadas candidatas/draft. O manifesto exige identidade imutável, hash, duração, idioma, hash de legendas, alternativa acessível, aprovação editorial, licença e versão de política. Não existe RPC de vídeo nem função de conclusão de fase nesta proposta; `video_completed` permanece falso até validador aprovado.
- Economia-041: PROPOSTA, não aprovada. Requer revisão independente dos recibos históricos e do payload final antes de criar migration/alterar roteador.
- Nenhuma migration registrada/remota, migration aplicada, escrita canônica, recompensa, alteração de Guilda/QA, merge ou deploy.

## Próximos gates para TEST

1. Passar o job `story007-postgres` e corrigir SQL/fixtures se necessário; revisar ACL/RLS com análise independente antes de qualquer aplicação.
2. Revisão editorial aprovar texto, respostas e referências. Publicar uma nova revisão no servidor; nunca mudar em-place resposta de uma revisão já usada.
3. Escolher vídeo e provedor autorizado; aprovar manifesto, licenças, legendas, alternativa acessível e fonte confiável do evento de conclusão. Implementar validador de vídeo fora do navegador.
4. Aprovar `creation-phase-economy-v1` com revisão independente; testar conciliação sintética e concorrência sem grants em contas reais.
5. Converter as propostas para migration versionada, registrar no fluxo de migrações depois da revisão e aplicar somente em Supabase TEST. Integrar o adaptador cliente ao RPC validado e testar Auth/RLS/retomada com contas sintéticas autorizadas.
6. Confirmar hospedado em TEST que progresso retoma em outro dispositivo e que vídeo, fase e recompensas continuam fechados sem prova.
