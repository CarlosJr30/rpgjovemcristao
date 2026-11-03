# ARENA-FIX-001 — início do treino

STATUS: DONE
Autorização: pedido 7534ae63, após concluir ECONOMY-001B. Branch independente codex/arena-fix-001, produção base 5f38914; registro XP 25e1712 preservado.
Escopo: reproduzir Teste Chat A nível50 versus Noemi; verificar clique, estado, sete cartas próprias, Auth, console e transição. Corrigir somente o defeito comprovado e explicar bloqueios junto à ação, com acesso a Meu Baralho quando necessário. Preservar motor, IA, cartas, atributos, equipamentos, Auth/RLS e dados; nenhuma concessão ou recompensa de combate.
Validação: testes diretamente afetados e CI/gates obrigatórios RELEASE_POLICY. Diagnóstico PROD somente leitura/navegação com sessão normal já autorizada; positivos TEST quando elegíveis. Sem grandes suítes locais. QA/Security pelo autor, sem independência alegada. PR12/18/24/26 intactas.
Aceite: causa demonstrada, feedback e transição corretos sem contornar posse; publicação somente após gates e confirmação READY/SHA/backend/alias. Sem migration prevista.

FINAL: merge86ae074656c8fac8da3ae18c9636114906edcf0a/PR30, CI obrigatório aprovado, deploymentdpl_8iGErYZYufcMGx2KAJ1UdTdUqQ1p READY/PROD/alias. 6 direcionados/1069unit74SKIP; TEST positivo normal com sete cartas; PROD coleção0 legítima com explicação/disabled. 80TEST/73PROD e metadados exatos; sem migrations/concessões. Selfvalidate/QA/Security/aceite PASS nos limites do relatório; sem revisão independente.
