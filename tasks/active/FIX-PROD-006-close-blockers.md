# FIX-PROD-006 — Encerramento dos bloqueios

ID: FIX-PROD-006
TITLE: Determinismo isolado da Torre e revisão dos gates restantes
OBJECTIVE: Concluir o escopo autorizado sem alterar dados reais ou presumir homologações.
PRIORITY: P1 High
STATUS: BLOCKED
SCOPE: Testes determinísticos com motor e PostgreSQL descartável; fixtures exclusivamente offline; revisão visual concreta em artefato isolado, sem registrar aprovação humana; economia/ambientes em leitura; liderança somente após identidade autenticada e processo administrativo auditável; testes e Preview/produção conforme RELEASE_POLICY.
OUT_OF_SCOPE: Seeds ou resultados alterados em hospedagem, progresso/vitórias/recompensas artificiais como prova produtiva; escrita em saldos/verified/recibos reais; ativação de prêmios antes de homologação; alteração do avatar antigo; extração de cookies/tokens de perfis; reset/queda de Auth/RLS; reexecução de migrations005/003; reativação ampla do projeto Body-Fit cancelado.
ASSIGNED_AGENT: Orquestrador assume Database/Backend/GameDesigner/Frontend/QA/Security/DevOps localmente, dentro deste contrato explícito; sem subagentes.
DEPENDENCIES: Origem legada, identidade e autorização efetivamente verificadas, composição visual revisada e gates de publicação.
REQUIRED_CONTEXT: Contexto/memória, RELEASE_POLICY, FIX-PROD-005-REPORT, regras/workflow/security, funções e fixtures diretamente afetadas.
SECURITY_CONSIDERATIONS: Aleatoriedade determinística apenas em fixture importada por testes, nunca em código/migration runtime. Não modificar dados reais para testar. Prêmios hospedados permanecem false. Qualquer DDL futuro exige CI, comparação de journal e recuperação; preferir nenhuma migration quando não necessária.
ACCEPTANCE_CRITERIA:
- Vitórias dos sete andares e campeão calculadas pelo motor com seed fixo offline, sem gravar progresso ou winner manualmente; orçamento, recibos, repetição, concorrência, derrota e persistência comprovados.
- Mesmo cenário produz mesmo estado/resultado em nova execução; origem e limites das fixtures explícitos.
- Equipar/desequipar/trocar/persistir testados em isolamento; revisão visual concreta entregue sem ativar arte rejeitada ou sem aprovação.
- Origem16XP/6moedas só certificada por eventos autoritativos; caso contrário BLOCKED.
- Liderança não aplicada sem getUser e mecanismo/auditoria adequados, preservando o antigo.
- Relatório FIX-PROD-006-REPORT.md, testes/lint/types/build/CI, Preview real, estados DONE/BLOCKED/REWORK e memória atualizados; produção apenas com todos os gates.
TEST_PLAN: Reutilizar005 válido; executar mudanças de fixture, PG/integração e regressões, API e navegador conforme alcance real; testes físicos e bloqueios não tratados como PASS. QA/Security pelo autor, sem independência alegada.
DEFINITION_OF_DONE: Todos os aceites comprovados; dependências ausentes explicitamente BLOCKED, sem declaração de deploy concluído.

Estado inicial: main5edc93f; branch005093ca23, candidato005da07a86. Disco insuficiente para novo checkout: git abortou a criação, sem worktree006 residual. Reutilizado checkout005 na branch nova006 de mesmo HEAD;005 e evidências preservados. CUA voltou a falhar com `failed to write kernel assets`; sessão alvo ainda inacessível.

SELF VALIDATE:10PG PASS na rodada final, dois percursos determinísticos completos1–7/champion, mesmos estados de combate, incremento430XP/215moedas/um baú por réplica, sequência/reconexão/recibo/replay/concorrência/derrota/política false/equipamento protegido. Inicial9PASS/1FAIL no teste que usava item não homologado; corrigido para exigir rejeição, sem alterar o catálogo.5unit de validação de seedPASS; suíte726PASS/66SKIP,lint/types/buildPASS e protocolo25PASS. QA/Security pelo autor; zero DDL hospedado e zero alteração em dados reais de jogo.

VISUAL: comparação HTML/CSS existente preparada e inspecionada em desktop e WebKit390, sem overflow/erros; revisão humana solicitada para couraça no corpo exato, ainda pendente. Dois rascunhos de PNG produzidos pela skill imagegen preservados privados em REWORK, sem ativação. Demais itens, troca positiva entre variantes oficiais e aparelho físico não aprovados.

ECONOMIA: SELECT novo confirma5checkpoints de compras iguais ao acumulado, saldo documentado1006259vsatual1006265,XP245016vs245000. Zero eventos de batalha,claimsGuilda,Jornada/EBD para justificar delta;verifiedNULL. BLOCKED sem origem comprovada; não alterar números. Liderança/getUser continua BLOCKED por falha dos dois runtimes Computer Use; não modificar o antigo.

ENTREGA: candidato cc64a52aa55862a782e79dc89fd3663283afea71,CI40060534000 success;Previewdpl_41eBGzUafvZ6R8LCKwpTsvLAb8GM READY no SHA exato.18checks API e12navegadorPASS em Auth real/estado persistido/negações, sem mutação de dados de jogo. Hashes dos oito conjuntos de dados conferem; banco de testes22migrations/20batalhas/22recibos/16XP/6moedas/0claims/políticafalse. Nenhum DDL ou migração repetida. Produção5edc93f READY,4migrations e dados/papéis anteriores preservados. Relatório raiz `FIX-PROD-006-REPORT.md`; dependências econômicas, arte/identidade/aparelho físico bloqueiam aceite global e publicação. Não há DEPLOY_COMPLETE.
