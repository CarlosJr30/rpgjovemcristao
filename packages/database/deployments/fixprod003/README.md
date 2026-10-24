# FIX-PROD-003: candidato de homologação em testes

Destino exclusivo do catálogo: `wkdvdzfkbwvhyjmamrsg` (`rpgjovemcristao-test`). `productionApproval: false`. Nenhuma aprovação de conteúdo/economia de produção é inferida deste ensaio.

O manifesto congela as sete definições existentes, inclusive Golpe Medido, sem alterar números, raridade, nível mínimo ou efeitos. A aprovação técnica é limitada ao ambiente de testes. A aquisição depende da solicitação explícita do jogador ao evento starter existente, uma vez por conta, com recibo e autoridade do servidor. As migrations não distribuem cartas, itens, XP ou moedas.

Ordem: CI do SHA candidato; confirmar destino e journal; aplicar somente owned_equipment pendente; aplicar test_catalog com `SET LOCAL fixprod003.target_project = 'wkdvdzfkbwvhyjmamrsg'` na mesma transação; validar permissões, preservação de dados e aquisição real. Nunca executar db push indiscriminado deste diretório contra produção.

Recuperação: snapshot local ignorado `build/fix-prod-003/test-before.json`, anterior à alteração, cobre 35 tabelas públicas/econômicas, 71 definições de funções/ACL, políticas e journal. Não é backup completo do Auth e não habilita alteração em produção. O ensaio PostgreSQL compara os dados e funções restaurados, testa rollback atômico da migration de equipamentos, nega catálogo sem destino e verifica sete ações distintas sem inventário ou recibos concedidos. Quatro testes passaram. Em falha de aplicação, preservar o journal e interromper; corrigir de forma incremental após avaliar dependências. Não apagar aquisições posteriores nem executar reset.

Validação local do candidato: 703 testes aprovados, 45 opt-in não executados nessa suíte; recuperação PostgreSQL 4/4 aprovada separadamente; lint, TypeScript, 25 verificações de protocolo e build aprovados. Resultados hospedados e gates restantes devem ser registrados no relatório FIX-PROD-003; estes números não substituem Auth, Arena, Torre ou testes de navegador reais.
