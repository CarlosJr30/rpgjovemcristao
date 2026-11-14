# RPG-COMMUNITY-043B — segurança e autorização

**Proposta futura; nenhuma policy, ACL ou RPC foi alterada.** Completa a matriz de [043A-PERMISSIONS](RPG-COMMUNITY-043A-PERMISSIONS.md); não substitui o gate de Security da implementação.

## Invariantes

1. Auth identifica a conta; para ações de Guilda, o servidor revalida ownership e atividade do avatar. Não confiar em `user_metadata`, IDs, papel ou contexto enviados pelo cliente.
2. Cada ação aceita um `guild_id` explícito e verifica membership/papel vigente na mesma autoridade transacional. Permissão local não atravessa Guildas, avatares, EBD ou Admin global.
3. Diretório é para contas autenticadas. Uma função/projeção allowlisted retorna apenas dados públicos aprovados. Não conceder leitura geral à tabela base nem alterar `guilds_select_member` para `true`.
4. Escrita protegida por padrão; wrappers públicos mínimos `SECURITY INVOKER`, helpers privados com `search_path=''`, ACL específica, validação de sessão/ator/alvo e auditoria minimizada. `SECURITY DEFINER` atual não é recomendação automática para código novo.
5. Operações concorrentes e retry usam request ID + assinatura do payload; verificar permissão depois de esperas/locks e antes do commit.
6. Guilda pública pode ser descoberta, mas membros, e-mail, IDs Auth, pedidos, convites, escola, atividades e histórico continuam privados.
7. Nenhum papel, aprovação ou ação de Guilda concede XP/moedas/itens. Recompensas ficam fora desta fase.
8. A autoridade deve respeitar os limites aprovados: uma Guilda criada por conta, até cinco memberships por avatar, 50 integrantes por Guilda, entrada pública aprovada e entrada privada por convite. O criador só recebe liderança local na Guilda criada.
9. As quotas complementares foram aprovadas: 10 links ativos/Guilda, validade máxima de 30 dias e 50 usos/link, 20 convites individuais/Guilda/24h, 5 solicitações/conta/24h, 1 pedido pendente/avatar/Guilda, espera de 24h após rejeição e renomeação a cada 7 dias. Ainda exigem implementação segura; preservar integralmente convites existentes. Contadores precisam ser atômicos e idempotentes.

## Matriz proposta de autorização

| Ação | Não autenticado | Conta sem vínculo | Membro | Moderador | Colíder | Líder da Guilda | Admin global |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Diretório allowlisted | Negado | Permitido se autenticada e elegível | Permitido | Permitido | Permitido | Permitido | Ferramenta separada/auditada |
| Detalhe público mínimo | Negado | Campos allowlisted | Campos allowlisted + conteúdo do vínculo | Idem | Idem | Idem | Sem acesso implícito a conteúdo privado |
| Solicitar entrada | Negado | Próprio avatar ativo; regra da Guilda alvo | Somente Guilda alvo, sujeito à política | Idem | Idem | Idem | Sem bypass local |
| Revisar solicitação | Negado | Negado | Negado por padrão | Só se permissão aprovada | Só se delegação aprovada | Sim, apenas Guilda própria | Ferramenta global separada |
| Emitir/revogar convite | Negado | Negado | Negado | Só se escopo aprovado | Delegação aprovada | Sim, Guilda própria | Sem herança local |
| Moderar ou alterar papéis | Negado | Negado | Denunciar/bloquear por mecanismo aprovado | Ações locais explicitamente aprovadas | Delegação limitada aprovada | Ações locais aprovadas | Processo global auditado |
| Criar missão/revisar prova | Negado | Negado | Participar/submeter | Negado por padrão | Somente delegação aprovada | Escopo local e contratos existentes | Não decide payout |
| Emitir recompensa | Negado | Negado | Negado | Negado | Negado | Negado | Somente autoridade ECONOMY-041; fora de 043B |

As responsabilidades aprovadas são: líder gerencia a Guilda, aprova solicitações, administra membros/missões e designa responsáveis dentro das permissões autorizadas; colíder auxilia em missões, convites e membros conforme delegação, sem remover o líder nem receber autoridade global; moderador analisa denúncias locais e aplica ações autorizadas auditáveis; administração global atua em casos graves e contenção por autoridade própria, sem herdar liderança. A matriz técnica por ação está proposta em [043B.1 Permissões](RPG-COMMUNITY-043B1-PERMISSION-MATRIX.md) e ainda requer revisão antes de alterar RPC/RLS; não cria permissões reais.

## Proteção de menores e capacidade de resposta

As diretrizes aprovadas exigem privacidade por padrão, minimização de dados, nomes públicos seguros, ausência de roster público, denúncia e bloqueio acessíveis, contenção de conteúdo, prevenção de assédio/aliciamento, revisão do chat existente e proibição de comunicação privada irrestrita entre adultos e menores. Antes de ampliar diretório/chat/contato, ainda é necessário nomear responsável, comprovar capacidade de resposta, definir retenção/exclusão e acesso a registros, concluir revisão jurídica de LGPD e requisitos para crianças/adolescentes e definir autorização/representação adequada à faixa etária. Idade não pode ser inferida de avatar, nível ou atividade; as diretrizes não equivalem a homologação jurídica/operacional.

Metas operacionais propostas, não SLAs garantidos: triagem inicial de denúncias comuns em até 72h; assédio, ameaças ou exposição de dados em até 24h; risco iminente envolvendo menores encaminhado imediatamente pelo protocolo definido. Qualquer prazo público depende de equipe, cobertura, escalonamento e capacidade comprovados. Sem isso, não abrir a superfície pública que exija resposta operacional.

## Ameaças e controles

| Ameaça | Controle futuro exigido | Evidência de aceite |
| --- | --- | --- |
| Anônimo, sessão expirada ou avatar alheio cria Guilda | Auth confirmado, avatar ativo do `auth.uid()`, validação server-side e lock/idempotência | Negativas para anônimo, sessão revogada e avatar de outra conta; uma única Guilda em replay/concorrência |
| Exceder limites aprovados ou abusar das quotas | Enforçar no servidor, com lock/idempotência: 1 Guilda criada por conta, 5 memberships por avatar, 50 integrantes, quotas de convite/pedido e intervalo de renomeação aprovados. | Limites exatos no limiar e concorrência; uma conta não contorna o limite criando avatares; convites existentes permanecem intactos |
| Papel `leader`/`moderator` falsificado | Papel sempre lido do banco para Guilda explicitamente alvo; cliente não pode inserir membership | Matriz completa, IDs cruzados e chamada direta RPC/RLS negados |
| Enumeração da Guilda privada ou roster | Diretório autenticado, filtro de visibilidade no servidor, projeção allowlist, resposta indistinguível para alvo oculto | Tentativas por ID privado, lista de membros e buscas fora do escopo não revelam existência/dados |
| Convite revogado/expirado/replay | Hash de token, expiração, revogação, limite de usos, lock/consumo atômico, request key; não logar token | Expirado/revogado/replay/duas aceitações concorrentes não criam membership indevido |
| Troca ou remoção de contexto revela dados de outra Guilda | Scoping `guild_id` em todas as consultas, validação fresca, descarte de caches/local state após troca | Avatar em duas Guildas com papéis diferentes; nenhum read/write cruza Guildas |
| Remover último líder ou corrida de liderança | Invariante transacional: Guilda ativa sempre com líder atual autorizado; transferência atômica e recovery | Duas remoções/transferências concorrentes preservam um líder legítimo ou abortam integralmente |
| Abuso de descrição, nome, links ou imagem | Comprimento/formato, moderação, escape de saída, revisão e denúncia aprovadas; sem conteúdo executável | Casos de controle de conteúdo e prevenção XSS/URL perigosa |
| Contato/assédio/aliciamento de menores | Privacidade por padrão, sem roster, sem contato privado irrestrito adulto-menor, denúncia/bloqueio, contenção, revisão do chat, responsável e protocolo de escalonamento; revisão legal/privacidade | Abuse cases, teste de acesso/denúncia/bloqueio, processo operacional, retenção/exclusão e revisão jurídica aprovados antes de ampliar contato |
| Evento/recompensa duplicado em várias Guildas | 043D: evento canônico, chave global de idempotência e receipt ECONOMY-041 | Replays cross-Guilda não geram duplicidade; não é gate de implementação 043B |

## Superfície atual observada

PROD confirma RLS ativo e policy `guilds_select_member` restrita a membro ativo. `guild_scoped_contexts` e `guild_scoped_command` são wrappers `SECURITY INVOKER`; autoridades internas `guild_admin_private.*` são privilegiadas e checam conta/ownership/escopo. `create_guild` é `SECURITY DEFINER` com `search_path=''`, EXECUTE autenticado e negado a anon; seu helper atual ainda exige autorização explícita de liderança, incompatível com a criação comum aprovada em D1. Mudanças futuras precisam revisar corpo, proprietário, `proconfig`, ACL, grants indiretos e caminhos cliente/servidor no SHA exato.

Links de convite ficam em schema privado, tokens armazenados como hash; o limite técnico atual é 10 ativos/Guilda e expiração máxima de 7 dias. A política aprovada permite até 30 dias e 50 usos por link, com implementação futura para novas emissões. Preservar hash, validade e estado dos convites existentes, sem apagar, revogar ou encurtar; seus prazos originais expiram naturalmente. Até 50 usos nunca supera a capacidade de 50 integrantes. Contadores de convites/pedidos e janela de renomeação também são quotas aprovadas, ainda não implementadas. A prévia atual, incluindo a rota compatível com anon, expõe somente nome da Guilda e validade; não expandir essa resposta sem revisar ameaça de enumeração e privacidade. Aceite é autenticado e cria pedido pendente.

## Contenção e recuperação

Para falha de diretório: suspender temporariamente listagem/novos pedidos e manter memberships, solicitações e histórico. Para falha de convite: negar novas emissões/consumos e preservar tokens hash, pedidos e auditoria. Para falha de comando: desabilitar apenas escrita de gestão pela chave de controle já existente, se a autoridade concreta permitir; não desligar Auth/RLS e não apagar dados. Reabrir somente depois de correção e comparação de preservação. Downgrade que desfaça colunas novas ou memberships é proibido sem plano específico e autorização.
# Fundação técnica 043B.1

Consulte a [matriz por ação](RPG-COMMUNITY-043B1-PERMISSION-MATRIX.md), o [contrato de criação](RPG-COMMUNITY-043B1-CREATION-CONTRACT.md), [compatibilidade/recuperação](RPG-COMMUNITY-043B1-COMPATIBILITY.md) e o [plano de testes](RPG-COMMUNITY-043B1-TEST-PLAN.md). São propostas documentais: nenhum grant, policy, RPC ou controle de proteção de menores foi alterado ou homologado por este registro.
