# RPG-ARENA-VISUAL-005 — cartas integradas ao cenário

Continuação na branch e PR #38 da VISUAL-004. O defeito era estrutural: `ArenaStage` e `ArenaBattleActions` eram irmãos no fluxo normal, então o seletor ocupava espaço abaixo do cenário.

**Implementação em validação:** composição compartilhada agora envolve o palco e as ações; ações e seletor são camadas posicionadas no palco. O feedback de combate também deixa o fluxo nessa composição. A prévia cinematográfica continua usando o modal existente, fixo e bloqueante, para manter a captura de foco e impedir interação com o restante da página. Arena e Torre passam pelo mesmo `AuthoritativeArena`/`ArenaBattleActions`.

Sem alteração de motor, IA, cartas, custos, HP, Foco, atributos, tempos de animação, movimento reduzido, economia, Auth, RLS ou dados. Nenhuma escrita, combate novo ou recompensa executada.

**Validação local:** 13 testes direcionados em `authoritative-arena.test.tsx` e `battle-actions.test.tsx`, ESLint, Prettier e `git diff --check` PASS. Typecheck local não foi conclusivo: este worktree não tem dependências próprias e o `node_modules` compartilhado de outra revisão forneceu tipos Next e APIs do game engine incompatíveis. Nenhuma dependência foi instalada. Typecheck/build do CI exato continuam obrigatórios.

**Pendente:** atualizar a cabeça da PR #38 e aguardar CI; gerar Preview para esse SHA; smoke autenticado/visual em 320/390/desktop pelo link Vercel temporário aprovado. O proprietário autorizou acesso do time Vercel, mas ainda não confirmou que conseguiu abrir a Preview anterior. Nenhuma promoção sem o smoke e gates obrigatórios.
