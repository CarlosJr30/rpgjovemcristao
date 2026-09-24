# Invariantes de banco e contratos transacionais

> TASK-0006 — PRECEDÊNCIA: **Neemias SUPERSEDED; Gênesis 2–3 / O Jardim e a Escolha CURRENT VERTICAL SLICE**. Regras abaixo conservam o desenho da TASK-0004. Autoridade do servidor, atomicidade e idempotência continuam válidas; DB-02/03/05/06 e os fluxos ligados obrigatoriamente a Battle, etapas fixas ou ator dono exigem revisão para o novo produto. Consulte [impacto da dinâmica central](CENTRAL-DYNAMICS-IMPACT.md) antes de implementar. Esta preservação histórica não aprova os contratos antigos para missões comunitárias ou replay.

TASK-0004, 2026-09-16. Normas para implementação futura do [modelo](DATA-MODEL.md). Não são controles executados. PostgreSQL/Drizzle já estão escolhidos; nenhuma instalação, migration ou API integra esta entrega.

## Integridade obrigatória

| ID | Invariante | Garantia planejada |
| --- | --- | --- |
| DB-01 | Character pertence a exatamente um PlayerProfile, perfil a um User; no máximo um de cada por conta | NOT NULL, FK e UNIQUE na cadeia; criação transacional |
| DB-02 | XP nunca negativo; só aumenta pela concessão oficial única. Level segue limites 1–3 e stats seguem regras fixadas | CHECK XP ≥ 0; engine deriva level/stats; aplicação confere XP = soma dos grants; não aceitar XP/level do cliente |
| DB-03 | Missão só inicia após pré-requisitos e apenas uma fica ativa por personagem | UNIQUE parcial ACTIVE + engine sob lock do Character; pré-requisitos e cursor na campanha correta |
| DB-04 | Conclusão COMPLETED é terminal, inseparável do grant correspondente | UNIQUE grant(character, mission), FK composta e transação final; não existe comando público de pagar prêmio ou confirmar vitória |
| DB-05 | Item sem pilhas tem quantidade 1 por linha, nunca negativa ou duplicada; capacidade 4 inclui equipados | PK(character, item); contagem sob lock do Character; I1 inicial e I2/I3 só via grant; falha de capacidade reverte tudo |
| DB-06 | Equipamento é posse do mesmo personagem e slot é compatível | FK composta para InventoryItem, PK(character, slot), UNIQUE(character, item); engine valida compatibilidade e ausência de missão ACTIVE |
| DB-07 | Progresso, tentativa, encontro, prêmio e posse devem referir-se ao mesmo dono/missão | FKs compostas do modelo; acesso sempre restrito pelo User autenticado; validação de domínio complementar |
| DB-08 | Exatamente dois participantes por Battle; HP entre 0 e máximo; uma habilidade por tentativa | PK(battle, side), enum/CHECK local; criação atômica dos dois e engine; usado não volta a false na mesma tentativa |
| DB-09 | Uma Battle ACTIVE por personagem; encerrada nunca recebe nova rodada | UNIQUE parcial + máquina de estados; versão condicional e lock; resultado só do servidor |
| DB-10 | Vitória tem inimigo a zero e jogador vivo; derrota tem jogador a zero; sem rodada parcial ou empate | Engine + persistência atômica dos dois participantes/status; ended_at obrigatório para terminal e nulo para ACTIVE |
| DB-11 | Mesmo operation_id/ator nunca executa novamente; intenção diferente com mesmo ID falha | PK de OperationReceipt, fingerprint normalizado incluindo kind/recurso/versão/payload; resultado original somente após reautorizar dono |
| DB-12 | Snapshot/regras de uma tentativa não mudam ao reconectar | Versões fixadas e artefatos imutáveis; snapshot do equipamento; nova tentativa é nova Battle |
| DB-13 | Narrativa mantém classificação/proveniência por unidade | Enum, FKs de referências, CHECK intervalos; gate editorial de referências obrigatórias e revisão |

CHECK deve validar somente a própria linha. Cardinalidade exata de participantes, contagem de inventário, soma de XP/grants, transições, coerência de resultado, slot e relações editoriais dependem da aplicação transacional. Não alegar que FKs/Drizzle verificam regras de jogo. O schema futuro deverá tornar explícito cada CHECK, FK e índice parcial, com testes PostgreSQL reais.

MissionProgress: completed_at existe somente em COMPLETED; ACTIVE tem stage; AVAILABLE não tem etapa/cursor/desafio concluído. Entrada em BATTLE exige challenge_completed. COMPLETED conserva resumo final, sem reativação. Desconexão não altera estados. Após derrota, missão continua ativa: voltar ao mapa executa abandono antes de permitir equipamento. A projeção da missão atual vem da única linha ACTIVE.

Battle começa em round_number=1, version=0 e attempt_number positivo; Character/Battle usam versões inteiras não negativas. Rodada não terminal incrementa round_number; rodada terminal conserva o número da rodada final. Ambas incrementam versões de Battle e Character. Criar tentativa ou mudar etapa incrementa Character.version. Início exige rules_version da campanha compatível com Character e artefato disponível; não migrar regra implicitamente. Enemy/Item aprovados devem respeitar os valores do design; snapshots são copiados pelo servidor, nunca pelo cliente. InventoryItem sem grant só é admitido para I1 na criação; item concedido precisa ter grant não nulo e correspondente. Essas condições são verificadas pela aplicação sob lock, além das FKs.

## Unidade de escrita e concorrência

Todas as mutações de jogo de um personagem usam a mesma disciplina: transação PostgreSQL, lock exclusivo da linha Character, leitura das condições depois do lock e incremento de Character.version a cada mutação aceita. Isso serializa início de missões, equipamento, rodadas e prêmios entre abas/instâncias, inclusive quando alteram linhas diferentes. Não usar mutex apenas em memória. Criação sem Character existente bloqueia User primeiro; UNIQUE mantém a proteção contra criação concorrente de perfil/personagem.

Ordem de locks: User somente para criação/exclusão; Character; MissionProgress; Battle; participantes por side; posse/slots ordenados por chave. Operação de exclusão deve respeitar a mesma ordem. Um comando normal jamais adquire User depois de Character. Alterações de conteúdo publicado são proibidas; não competem com transações do jogador.

Isolamento planejado: READ COMMITTED com locks explícitos acima, UNIQUE/FKs e comparação de versão sob o lock. Não assumir que READ COMMITTED sozinho evita corrida. Toda intenção de mutação existente traz expected_character_version; rodada traz também expected_battle_version. Uma versão vencida retorna conflito sem mutação, mesmo se a ação ainda parecer válida. Não aplicar automaticamente sobre versão nova.

Algoritmo conceitual (não SQL):

1. Validar sessão, ação, allowlist de campos e limites. Resolver recurso por consulta restrita ao dono; negar sem revelar dados de terceiros. Fazer autorização novamente na unidade de escrita quando necessário.
2. Abrir transação e adquirir locks; buscar OperationReceipt por (User, operation_id) antes de rejeitar versão antiga. Se fingerprint coincide, devolver o resultado confirmado original, sem incrementar versão. Se diverge, conflito sem alteração. Consulta de recibo também exige sessão/propriedade atual.
3. Sem recibo, comparar versões e validar estado/pré-requisitos. Calcular transição pelo engine sobre dados oficiais. Validar novamente capacidade, equipamento, desafio e conteúdo fixado conforme ação.
4. Atualizar todas as linhas afetadas, incrementar versões e gravar OperationReceipt com resultado mínimo na mesma transação. Confirmar antes de responder sucesso. Ausência de recibo confirmado implica ausência daquela operação confirmada.
5. UNIQUE concorrente no mesmo operation_id (inclusive recursos distintos) aborta toda transação perdedora; iniciar nova leitura autorizada do recibo e comparar fingerprint. Nunca continuar uma transação abortada ou tratar conflito de grant como sucesso parcial.

Deadlock/falha de serialização permite retentativa interna limitada com mesma intenção e versões; após limite retorna erro recuperável sem prometer sucesso. Conflito de versão de domínio não é retry automático. Na incerteza de commit, consultar recibo usando mesmo ID antes de reaplicar. Operações rejeitadas antes de mutação não precisam gravar recibo; as que confirmam transição precisam. Respostas informativas de desafio errado sem alteração não concedem nada.

## Conclusão e falhas

Rodada vencedora precisa bloquear Character e Battle como qualquer rodada. Antes do commit valida missão ACTIVE, etapa BATTLE, encontro da missão, dois participantes e resultado do engine. Insere RewardGrant único, soma XP, insere item quando houver, completa missão, termina batalha e grava recibo. Level/stats fora da batalha e desbloqueios são derivados desse commit. Não existe loot separado do boss, fila assíncrona de pagamento ou botão de resgate.

Se qualquer FK, unicidade, capacidade, engine ou escrita falhar, rollback integral: inclusive golpe final e HP voltam ao estado anterior. Se commit suceder mas resposta se perder, retry com mesmo ID devolve recibo; consulta do estado mostra missão concluída. Outro ID de conclusão não paga: estado terminal e UNIQUE(character, mission) impedem. Não usar operação que ignore conflito de grant e mesmo assim incremente XP.

Uma concessão não pode ser removida para viabilizar novo prêmio. Correções administrativas de progresso não fazem parte do MVP; precisam de contrato, autorização e trilha próprios. Tabelas de recibos/concessões não substituem logs de segurança nem constituem event sourcing.

## Autorização e fronteiras de segurança

- Derivar User da sessão validada. Nunca confiar em user_id, profile_id, character_id ou papel declarado pelo cliente como prova de posse. Character acessado via PlayerProfile.user_id; filhos via Character. Usar predicado de dono em leituras, updates, joins, resumos e recibos, inclusive nos caminhos de erro/retry.
- DTO aceita somente intenção, alvo, operation_id, versões esperadas e argumentos específicos permitidos (ação/slot/item/cursor/resposta). Rejeitar propriedades extras como xp, level, stats, current_hp, victory, reward, owner e inventory. Não fazer mass assignment de corpo HTTP para ORM.
- ID opaco dificulta enumeração, mas proteção é autorização. Resposta para recurso ausente ou de terceiro deve ter o mesmo formato externo, sem nomes/XP/estado ou recibos do dono real. Limitar consultas/payloads e aplicar rate limiting antes de exposição.
- Separar credencial operacional, migração e eventual publicação editorial. Aplicação não deve editar catálogo publicado nem DDL; cliente nunca tem acesso direto ao banco. RLS não é dependência do MVP; autorização explícita e testes entre usuários são obrigatórios, mesmo se RLS for adicionada depois.
- Consultas parametrizadas; cookies/sessões, CSRF/origem, cache privado e logs mínimos seguem [TECH-STACK](TECH-STACK.md). FKs evitam vínculos inválidos, mas não autenticam ator. Não expor fingerprint/result_payload em endpoint público.
- Retenção e exclusão de contas serão fechadas antes de cadastro. RESTRICT impede cascata destrutiva acidental; exclusão futura precisa transação ordenada para perfil/personagem, progresso, posses, tentativas, grants, recibos e identidade, além de política para backups/logs. Não prometer retenção eterna nem excluir apenas User deixando dados órfãos.
- Para esta fase, manter recibos e concessões enquanto existir o estado correspondente, sem limpeza automática. Antes do piloto definir prazo, janela de retry e descarte seguro: eliminar recibo cedo pode permitir repetição de comando antigo. Grants únicos permanecem enquanto houver progresso. Responsável pela decisão operacional: produto com SECURITY.

## Revisão de mesa e testes futuros obrigatórios

Os resultados abaixo são expectativas verificadas no desenho; não testes de software executados.

| Cenário | Resultado e mecanismo esperado |
| --- | --- |
| Duas criações na mesma conta | Lock User + UNIQUE perfil/personagem: um Character e um I1 |
| Duas abas iniciam M1/M2 | Lock Character + pré-requisito + ACTIVE único: no máximo uma missão, M2 bloqueada antes de M1 |
| Equipar e iniciar missão simultaneamente | Mesma trava/versão: uma ação vence; outra recebe conflito; snapshot não mistura configurações |
| Duas ações distintas na mesma rodada | Uma confirma; outra falha por versão; não consome duas habilidades/rodadas |
| Mesmo ID com mesma intenção após resposta perdida | Recibo autorizado antes do check de versão retorna resultado original |
| Mesmo ID com payload, alvo ou versão diferentes | Fingerprint difere: conflito; sem segunda escrita |
| Duas vitórias com IDs diferentes | Estado terminal + grant único: XP/item uma vez |
| Falha ao inserir item no golpe final | Rollback inclui batalha, missão, grant, XP e recibo; nenhuma conclusão parcial |
| A envia IDs de personagem, battle, grant, inventário ou recibo de B | Filtro de dono nega em todos os caminhos; FKs compostas impedem ligação de filhos de donos distintos |
| Cliente envia XP, status VICTORY ou troca de owner | Allowlist rejeita antes da escrita; engine decide resultado |
| Derrota no boss e reconexão | XP 200; tentativa derrotada preservada; retry cria nova tentativa cheia e habilidade disponível sem repetir desafio |
| Abandono e reentrada | Fecha tentativa, limpa etapa da missão; reentrada inicia narrativa; equipamento só muda no mapa |
| M1/M2/M3 e consulta repetida do epílogo | XP 100/200/300; níveis 2/2/3; I1/I2/I3 sem duplicatas; epílogo não concede prêmio |
| Conteúdo alterado durante batalha | Publicação rejeita alteração de definição referenciada; tentativa usa snapshot/versões conservados |

Antes de implementação aceita, cobrir esses casos em PostgreSQL descartável com concorrência real, rollback e autorização por sessão. Build/lint/typecheck e testes de runtime são N/A nesta tarefa exclusivamente documental. Política de idade/privacidade e edição/licença portuguesa continuam pendentes antes de cadastro/publicação.
