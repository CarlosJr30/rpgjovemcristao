# Consolidação001 — ancestralidade e preservação

Inspeção somente local em2026-10-20. Base escolhida `6a683f4b690e54c19a56aaaf41e89861faa6e510`, HEAD documental real da0089; inclui implementação de áudio `a573cd12c0541524644c3cb552bfdbb28456f600`. Worktree nova `build/task-consolidation-001/checkout`, branch `codex/consolidation-preview-001`. Nenhum merge/cherry-pick/rebase/fetch executado.

| Tarefa / branch | Implementação | HEAD documental auditado | Checkout anterior |
| --- | --- | --- | --- |
| 0080 / codex/account-only-entry | `17c6349` + correção de segurança `b71b205` | `99fb2c048f20a2d168b109b453a8de512430a61d` | Sete pendências preservadas, não importadas |
| 0081 / codex/story-nine-worlds | `35c589896c9118312dfa0f9a0461e807960cdb38` | `bb547c6c8e8588f49705dd73a34f5d56c8f09425` | Limpo |
| 0082 / codex/guild-leader-missions | `b0aa00af0d5601a16583dd08bf76b47f818a216d` | `775d7e70fcd2b12a7037a21b636d976d776f2a4e` | Limpo |
| 0083 / codex/guild-ebd | `c4b3d92a8f4a77f1dc0f1f0821382067a6932ff2` | `bd9ee35dc7b3a4fac9081d043330b3cf1b493415` | Limpo |
| 0084 / codex/arena-seven-card-deck | `f254349130c7779413b4ae7d3e0438e766955b39` | `f5e716560022a1956e4fa13626fad4ea26b195ac` | Limpo |
| 0085 / codex/arena-three-actions | `cc419c61fe5b2856d113637ccde5b707789df968` | `26d394aecab164f73d1ef04d017ea147cf0d3a3e` | Limpo |
| 0086 / codex/arena-numeric-descriptions | `34dde31b25a6ff9ef373e88c8eff1b6132ca3820` | `fc424ff58c704cb7794974c3055e708f6895fa3b` | Limpo |
| 0087 / codex/arena-seven-challenge-tower | `170beefd2b3fc79c7e2e780bf56a5b67cb1b7866` | `e24f8ed0712ff3b5f9392313194232e1efe044ed` | Limpo |
| 0088 / codex/chest-cinematic-reveal | `ea0c07f214ee13824a43f14666c6132d51b10677` | `760b269dbbe947bb4da00903d64d19280a9e38ce` | Limpo |
| 0089 / codex/dynamic-game-audio | `a573cd12c0541524644c3cb552bfdbb28456f600` | `6a683f4b690e54c19a56aaaf41e89861faa6e510` | Limpo |

Todos esses HEADs são ancestrais da base consolidada, confirmados por `git merge-base --is-ancestor`, em ordem progressiva. Os commits de implementação também estão no histórico; os recibos históricos não foram tratados como HEAD por suposição. Não há conflito de Git a resolver, nem tarefa a reaplicar.

## Diferença em relação à main

`main` local=`0df878764f26f0501959031dd4aec4a77fb9308a`, ancestral da base, divergência `0/30`. `origin/main` local em cache=`5508514828a455ccb0d1ee83d652c419e8643a49`, também ancestral, divergência `0/24`. Nenhum fetch foi feito: o estado atual do servidor Git não foi confirmado.

Seis commits entre main local e a referência origin/main em cache já pertencem aos históricos aprovados de CI/pinned-preview/mobile; não foram buscados ou mesclados agora. Os 24 commits seguintes cobrem0080–0089 e seus controles documentais. Portanto, comparar somente com main local inclui trabalho anterior aprovado, e não um desvio novo da consolidação.

A inspeção por intervalos/arquivos confirma Auth/QR0080, Story0081, missões0082, EBD0083, engine/deck0084/85 e descrições0086 autorizadas por seus contratos, Torre0087, Baús0088 e integrações sonoras0089. Alterações de dependências QR são históricas da0080, não instalação desta rodada. SQL adicional continua como proposta/QR fora do journal; não foi promovido automaticamente. Código/arte de overlays e economia0078 não foram importados de branches paralelas. Não identificado commit alheio aos intervalos de tarefa e aos predecessores aprovados na base selecionada; isso não reclassifica os riscos funcionais já registrados.

Nesta consolidação, o diff de runtime deve permanecer vazio se os testes não reproduzirem defeito real. Novos arquivos limitam-se a testes/config e documentos próprios, sem editar contratos anteriores. Auditoria final de paths/hashes e recibo em `build/task-consolidation-001/`, fora do controle de versão da raiz.

## Trabalho pendente preservado

Checkout0080 tem quatro arquivos modificados e três não rastreados: memória, plano de validação, relatório de publicação e contrato0080; pacote de aprovação remota, manifesto de baseline e teste full-baseline. Suas versões não commitadas não pertencem à base6a683f4. Foram registrados status/hashes para conferir preservação, sem copiar, versionar ou editar esses sete arquivos.

Raiz permanece na branch `integration/chat-notebook-20261014`, HEAD `a1a2053aacec8604d7e1ff37eee6c5e805044e0f`. Preservados GLOBAL_CONTEXT, checklist/plano0078, duas migrations econômicas pendentes e contratos0078/CLOUD009/CLOUD010. Memória raiz receberá somente prefixo desta consolidação, mantendo bytes anteriores como sufixo exato. Todos os checkouts0081–0089 e refs/main devem manter seus estados iniciais. Recibos locais registram os hashes, sem expor credenciais ou dados reais.
