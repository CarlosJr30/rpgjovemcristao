# RPG-DEV-007 — Mochila, Coleção e Diário

26/10/2026. **VALIDATING — candidato implementado, publicação ainda não concluída.** Branch `codex/rpg-dev-007-preparation`, iniciada em `8c9c0c0` sobre main/produção `1a82d2c`. A PR #12 permanece aberta/draft em `61b7177`; nenhuma implementação ou migration de Equipamentos foi incluída nesta branch.

## Funcionalidades restauradas no candidato

- Mochila: consulta fresca do inventário do avatar autenticado, nome/quantidade/raridade/descrição e indicação de equipamento selecionado. Reutiliza estilos, ícones e metadados existentes; não possui compra, venda, transferência, baús ou ação de equipar.
- Coleção: apresentação existente de cartas, com descrição, atributos/condições e efeitos, limitada às cartas adquiridas que a fonte canônica confirma por recibo, dono, versão e ausência de revogação. Não usa o catálogo local proposto para fabricar posse nem habilita baralho, aquisição ou combate. Catálogo PROD vazio é um resultado vazio legítimo.
- Diário: reutiliza o livro, histórico, referências e projeção existentes, em modo de consulta. Somente progresso persistido do servidor é exibido; ausência ou conteúdo inválido não é substituído pelo histórico local. Reflexão privada permanece recolhida e renderizada como texto. Sem participação, conclusão de fase, recompensa ou links operacionais de Jornada.
- Menu original de onze opções preservado. Somente Mochila, Coleção e Diário acrescentados a Herói/Guilda/EBD. Equipamentos, Jornada/Missões, Arena, Torre, Loja e a API de autoridade econômica continuam bloqueados.

As leituras descartam respostas de sessão anterior e não salvam o snapshot, não trocam o avatar ativo e não atualizam inventário, atributos, XP, moedas ou progresso. Leitura negada/erro não vira coleção vazia de sucesso.

## Banco, Auth, RLS e recuperação

Migration mínima necessária: `20261026192057_rpg_dev_007_owned_cards_read.sql`. A coleção canônica já existe em schema privado, mas o único caminho anterior era a autoridade de combate, cujo EXECUTE está bloqueado. A migration cria somente `public.get_owned_cards(uuid)` INVOKER e a implementação privada STABLE/DEFINER, com search_path vazio, auth.uid, conta não anônima e dono verificados. Concede apenas EXECUTE desta leitura a authenticated; nega PUBLIC/anon/service_role. Não concede EXECUTE da autoridade ou da função privada canônica, nem SELECT geral de catálogo. Não altera Auth/RLS, release_scope, catálogo, tabelas, saldos, inventários ou progressão.

Antes da aplicação remota: ambos endpoints ausentes; scope PROD guild-ebd-001, TEST hero-equipment-006; protocolo 3. A definição de economy_private.collection tem o mesmo hash `77791950c34168c84805aa740d42510d` nos dois ambientes. Baselines de 38 conjuntos PROD e 40 TEST capturados antes de qualquer mudança remota desta tarefa. Não aplicar outras migrations pendentes nem a 006.

Recuperação: renovar snapshot de definições/ACLs/ausência dos dois endpoints e baseline imediatamente antes de eventual migration produtiva. Aplicar somente 007 em transação. Em falha, interromper e manter/restaurar aplicação `1a82d2c`; conferir identidade/hash e remover apenas o wrapper público e a implementação privada novos, sem restaurar dados de jogadores nem apagar histórico de migrations. Compensação remota deve ser rastreável. Migration inclui ensaio de remoção/rollback em subtransação e comparação de definições/ACLs; recuperação também exercitada no PostgreSQL isolado, com dados inalterados. Revalidar negações econômicas e Guilda/EBD antes de seguir.

## Testes e evidências até este checkpoint

| Verificação | Resultado |
| --- | --- |
| Unitários integrais | **825 PASS / 74 SKIP**, 123 arquivos aprovados e 7 opt-in não executados nesta suíte. Não converter SKIP em PASS. |
| PostgreSQL isolado | **18 checks PASS**: migration/recuperação, definições e ACLs, conta/anon/serviço/dono alheio, vazio, carta já adquirida com recibo, revogação, recibo inválido, constraints de proveniência/quantidade, ausência de escrita e repetição indevida de migration. |
| Lint / TypeScript / build | PASS antes do checkpoint GitHub; o ensaio isolado adicional terá lint conferido junto do diff final. |
| Protocolo CI | 25 checks PASS. |
| Navegador hospedado TEST | Pendente da Preview candidata; sessão disponível da conta nova vazia. Não foi ensaiado neste checkpoint. |
| Positivo hospedado com contas antigas | **Pendente por falta de acesso confirmado**, conforme orientação posterior do usuário. Não é declarado PASS. |
| Produção / publicação | Não executadas neste checkpoint. Produção preservada. |

Os 18 casos usam PostgreSQL 17.10 temporário em loopback, sem serviço do Windows, credenciais remotas ou dados reais. Binário fixado `@embedded-postgres/windows-x64@17.10.0-beta.17` somente em build ignorado; nenhuma dependência ou lockfile de produto alterado. Script reproduzível: `tests/hosted/rpg-dev-007-postgres.mjs`, reutilizando migrations com hashes revisados e as cartas sintéticas já existentes em `tests/fixtures/arena-deck.ts`. O cluster foi encerrado após a execução; arquivos privados preservados em build/rpg-dev-007. Não é uma instância Supabase nem prova de Auth cliente hospedada.

Falhas preservadas: primeira validação de progresso rejeitou timestamp sem milissegundos; corrigida normalização para o formato canônico já usado pelo projeto. Teste de menu atualizado para as três consultas novas. O coletor PostgreSQL precisou de inicialização Windows por pg_ctl e fixtures com campos obrigatórios; casos impossíveis de recibo/quantidade foram ajustados para esperar a rejeição da constraint, sem removê-la. Uma execução foi interrompida por timeout durante indisponibilidade do notebook. Não houve correção de Auth/RLS ou alteração de dados hospedados para passar.

## Orientação posterior e fronteiras

O usuário confirmou que não tem acesso às contas TEST Homologacao Lider/Professor neste notebook. Determinou preservar essas contas, usar Herói TEST Equipamentos para coleção vazia e fixtures autorizadas somente no PostgreSQL isolado para positivos. Não conceder cartas à conta nova, não alterar inventário PROD e manter como pendentes testes hospedados que dependam das contas antigas. Essa orientação substitui a matriz inicial que previa login dessas contas na Preview; não autoriza declarar seus testes executados. “RPG-RELEASE-007” refere-se à continuação desta mesma RPG-DEV-007.

QA/Security/Frontend/Database/DevOps pelo autor; não se alega revisão independente nem aparelho físico a partir de WebKit emulado. Sem novas artes, permissões econômicas, recursos pagos ou alteração de jogadores para fabricar testes. Somente módulos com gates obrigatórios comprovados poderão ser publicados.

## Commits, Preview e produção

- Base: `1a82d2c058b40b37ae4ae79b82c085bb3488c02b`; preparação: `8c9c0c0afd8b4361cee85dcfae3dcb3a6309f55c`.
- CI do candidato, PR própria e URLs: pendentes neste checkpoint, a registrar antes de publicação.
- Preview da nova branch recebeu somente suas duas configurações públicas Supabase TEST, copiadas em memória da configuração TEST verificada. Nenhuma variável PROD, alias ou proteção alterados. Backend TEST conferido antes de deploy.
- Produção segue https://rpgjovemcristao-web-inky.vercel.app, baseline `1a82d2c`; nenhuma migration, merge ou deploy desta tarefa até este checkpoint.

Próximos passos: GitHub/CI; aplicar apenas a leitura em TEST; Preview exata com TEST; Auth/RLS e três consultas reais vazias, desktop/WebKit e negações econômicas; preservação e Security. Se os gates passarem, migration PROD mínima, merge normal da PR própria e acompanhamento do deploy automático, com READY/SHA/backend/alias e conferências de consulta. PR #12 não será integrada ou encerrada como dependência desta tarefa.
