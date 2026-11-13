# RPG-COMMUNITY-043B.1 — contrato futuro de criação pública

**Planejamento; sem alteração de comportamento.** O fluxo abaixo concretiza as regras já aprovadas em 043B. Identificadores de função são contratos conceituais, não nomes de RPC já implantados.

## Pré-condições e entrada

1. Exigir sessão Auth válida, confirmada e não anônima; identidade vem do servidor (`auth.uid()`), nunca de campo de cliente.
2. O cliente envia `traveler_id`, nome, descrição, visibilidade (`public`/`private`), política de entrada coerente e uma chave de requisição aleatória/idempotente. O servidor confirma avatar ativo pertencente à conta. Não aceitar papel, conta criadora, contagem, quota ou timestamp do cliente.
3. Validar nome/descrição em tamanho, formato e caracteres; escapar saída, moderar nomes públicos e rejeitar URLs/identificadores pessoais conforme política futura. Reutilizar os limites atuais observados como ponto inicial (nome 2–60; descrição até 500) somente após confirmar que coincidem com o contrato vigente no SHA de implementação.
4. Pública significa diretório autenticado allowlisted e pedido de entrada sujeito a aprovação. Privada não aparece no diretório e aceita ingresso por convite válido. Nenhuma adesão automática.

## Transação proposta

1. Abrir transação e estabelecer identidade/sessão e alvo; adquirir lock estável por conta para serializar criações feitas por avatares diferentes.
2. Consultar uma autorização privada de criação que revalida a conta, avatar ativo/ownership e estado elegível. Não reutilizar `leader_authorizations` como requisito de criação comum nem alterar os grants globais existentes.
3. Verificar registro durável de “Guilda criada por esta conta” que sobreviva a arquivamento/encerramento; a regra é uma Guilda criada por conta, não uma ativa. Definir recuperação de conta excluída separadamente; não apagar esse marcador por exclusão de avatar.
4. Conferir até cinco memberships ativas do avatar e idempotency key. Repetição da mesma chave e mesmo payload devolve a Guilda já criada; mesma chave com payload divergente é recusada.
5. Inserir Guilda com criador derivado de `auth.uid()`, política/visibilidade explícita e estado inicial seguro; inserir membership `leader` somente para o avatar próprio indicado. Gravar registro durável da cota e evento mínimo de auditoria na mesma transação.
6. Confirmar a transação. Resposta perdida recupera o mesmo resultado pela chave, sem criar segunda Guilda. Qualquer falha de validação, quota, conflito, auditoria ou escrita reverte integralmente as novas linhas.
7. Interface mostra confirmação e nova comunidade; esse estado visual não substitui autorização para operações subsequentes.

## Regras aprovadas associadas

- Uma Guilda criada por conta, inclusive contra abuso de arquivar e tentar criar novamente.
- Até cinco Guildas por avatar; até 50 integrantes por Guilda, contando líder, colíderes, moderadores e membros ativos.
- O criador elegível lidera apenas a Guilda criada; não recebe Admin global, papel de escola/EBD, recursos econômicos nem acesso a outras Guildas.
- Cada operação posterior revalida `guild_id`, papel e vínculo atual no servidor. Uma remoção/saída afeta só a membership alvo.
- Não emitir moedas, XP, cartas, equipamentos, baús ou recibos econômicos durante criação.

## Encaixe no sistema atual

O sistema existente tem `public.create_guild` e `guild_admin_private.guild_command(..., 'create', ...)`; ambos ainda dependem da autorização de liderança administrativa atual. O scoped command já é o melhor ponto de reutilização por validar ator/ownership e serializar comandos, porém exige separação explícita entre “elegibilidade para criar Guilda comum” e “autorização de liderança global”. A extensão deve manter wrappers públicos estreitos e helpers privados; não conceder execute amplo nem abrir tabelas via RLS. O esquema descrito ainda não possui política de visibilidade/pedido, então criação pública depende do contrato de diretório e dos controles de segurança 043B.

## Falhas e recuperação

| Situação | Resultado obrigatório |
|---|---|
| Timeout após commit | Consultar pela chave idempotente do ator; devolver mesma Guilda, sem segunda membership/liderança. |
| Timeout antes de commit | Retry com mesma chave executa uma vez; não deixar marcador de quota sem Guilda nem Guilda sem membership líder. |
| Duas criações simultâneas em avatares da mesma conta | Lock/constraint account-level permite no máximo uma; uma transação completa e a outra recebe conflito previsível. |
| Duas contas usam mesmo avatar | Ownership e integridade rejeitam ator não proprietário; constraint impede duplicação indevida. |
| Guilda criada mas resposta perdida | Registro de criação persistente impede recreação; recuperação não apaga nem clona Guilda. |
| Falha da auditoria ou de membro líder | Reverter a transação toda; não publicar Guilda órfã. |
| Nome/descrição recusados | Erro curto e seguro; não revela regra interna ou conteúdo de outro usuário. |

## Condições prévias ao runtime

Definir moderador/responsável operacional, revisão jurídica e regras apropriadas para menores; fechar enumeração/fields do diretório; validar migração aditiva, recuperação e preservação de Guildas existentes; integrar primeiro PR #53 e conferir histórico de migrations. Nada neste documento autoriza DDL ou instalação em TEST/PROD.
