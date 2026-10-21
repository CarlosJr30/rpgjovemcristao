# CONSOLIDATION-006 — matriz local, hospedada e física

Responsável pelo aceite real e testadores: a designar antes da operação autorizada. Para cada execução futura registrar SHA, deploymentId/URL, novo ref de teste, contas fictícias pseudonimizadas A/B/C, aparelho/OS/browser/rede, horário, resultado, evidência e defeito/recheck. Não registrar senhas, JWTs, QR tokens ou respostas privadas de reflexão.

## Matriz local006

| Ambiente | Conjunto | Cobertura e limite |
| --- | --- | --- |
| Chromium1440×900 | Sete cenários produto | Auth/rotas, navegação/audio/Story bloqueada, Guilda e EBD; teclado/mouse, modal/scroll/overflow |
| Chromium320×740, touch | Mesmos sete | Menu compacto, formulários Guilda/EBD e botões, áudio/mute/slider persistido, Torre/baús indisponíveis; sem overflow |
| WebKit390×844, touch | Mesmos sete | Mesmas rotas/estados e modais; navegação pela UI evita unload artificial de prefetch. Inspeção de capturas pelo autor |

Fechamento/contagem final no [relatório006](TASK-CONSOLIDATION-006-REPORT.md). Geometria de fechar áudio e label Música ≥44px no teste; CSS existente mantém alvos48px e modal com max-height100dvh−32/scroll. Não há mudança de layout006. Demais alvos avaliados por uso/capturas e evidência anterior, sem alegar auditoria WCAG integral. Campos foram preenchidos por automação: **teclado virtual e oclusão reais ainda não testados**.

Vídeo positivo nativo, carta de baú demonstrativa, combate e checkpoint positivos foram verificados em componentes/fixtures e evidência histórica aplicável; o produto autenticado desta rodada fica bloqueado sem servidor/catálogo. Não há player autorizado real para avaliar em mobile. Desempenho/sons físicos não são inferidos dessas emulações.

## Execuções futuras obrigatórias — todas PENDENTES

| Fluxo | Hospedado em HTTPS | Android Chrome físico / iOS Safari físico e dois aparelhos |
| --- | --- | --- |
| Conta/Avatar | Cadastro com confirmação, login/getUser, restaurar somente próprio Traveler, logout/expiração/callback/next seguro | A cria, B restaura mesma conta; conta C não vê A; reiniciar navegador, teclado virtual não encobre ação/erro |
| Proteção | Rota privada, JWT inválido/anônimo/expirado, cache após logout | Histórico/back/link compartilhado não exibe dado privado; alternar contas sem cache cruzado |
| QR/Guilda | Líder gera convite limitado; outro pede, líder aprova; expiração/revogação/duas Guildas negadas | Câmera real, URL correta/protegida, retornar após login; QR não promove automaticamente |
| Missão/desafio | Criar/publicar/iniciar/provar/corrigir/aprovar com atores distintos; pendência sem crédito | A líder e B membro, reload nas duas telas; digitação longa/scroll, orientação e feedback persistidos |
| EBD | Delegar escopo, criar/publicar, resposta sem gabarito antecipado, avaliar/presença/histórico; aluno não promove papel | Dois aparelhos professor/aluno; teclado/listas/modais; negar outra Guilda e professor revogado |
| Story | Nove slots, cinco candidatos; após homologação, ordem/leitura/atividade/quiz/reflexão/vídeo/prova/recibo sem líder | Refletir sem enviar texto privado; player/legendas/rotação/background/offline; término real sem bypass por seek/ended falso |
| Arena | Sete cartas legítimas e uso único; Atacar/Defender/Cartas; round CAS e receipt final; negar HP/winner/coins enviados | A/B mesma conta concorrem: uma transição; timeout/recuperação sem duplicar prêmio, reconexão e toque rápido |
| Torre | Sete NPCs/andar seguinte só de vitória canônica, derrota permanece, recompensa pendente | Retomar em segundo aparelho, checkpoint forjado/andar futuro negados; boss não usa protótipo de Arena |
| Baús | Débito/loot/receipt únicos, consultar após timeout; cursor/replay não paga | Pausa2s, raridade/contraste/área de toque, equipamento/resumo, reduzir movimento, back/reload sem abrir novamente |
| Áudio | Somente arquivos aprovados, erro404/codec/autoplay tratado, loop/transição/mute/master e volume independente | Alto-falante/fone, volume percebido e loop sem corte; telefonema/background/aba/bateria/dados; vídeo pausa ambiente e restaura contexto correto |
| Performance | Transferência por rota, cache frio/quente, console/request404, memória/listeners após navegação repetida | Rede lenta/4G, LCP/INP/CLS e tempo de interação, aquecimento/bateria; profiling apenas se houver sintoma reproduzido |

Ausência de falha local não preenche esta matriz. Executar somente com contas fictícias e autorização específica; sem tocar produção. P0 para publicar e bloqueios por funcionalidade em [bloqueios006](CONSOLIDATION-006-BLOCKERS.md).
