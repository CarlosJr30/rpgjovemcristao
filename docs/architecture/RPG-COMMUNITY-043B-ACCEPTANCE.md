# RPG-COMMUNITY-043B — critérios futuros de aceite

Este roteiro serve a uma implementação futura autorizada. **Nenhum teste funcional/CI foi executado para 043B:** esta entrega é documentação somente. Os casos não substituem fluxo autenticado obrigatório da [RELEASE_POLICY.md](../../.agent/RELEASE_POLICY.md).

## Casos focados

| Grupo | Cenário mínimo | Resultado exigido |
| --- | --- | --- |
| Criação | Conta autenticada elegível cria Guilda com avatar ativo próprio | Guilda e membership leader são atômicos; diretório/política resultam do payload validado. |
| Criação | Avatar alheio, inativo, anônimo ou sessão revogada | Negado sem inserir Guilda, membership ou log parcial. |
| Idempotência | Mesmo request/payload repetido e duas criações concorrentes | Um recurso lógico; replay coerente; payload diferente com mesma chave é recusado. |
| Quota | Cada limite aprovado é exercitado no limiar, acima dele, com replay e concorrência | Enforcement server-side; não contornável por avatar alternativo; operações negadas não deixam escrita parcial. Valores são os registrados na seção de quotas aprovadas. |
| Limites aprovados | Uma Guilda criada por conta; quinto/sexto membership do avatar; integrante 50/51 | Limites de produto aplicados atomicamente; não exceder sob concorrência. Contagem do limite de 50 deve seguir a convenção fechada no contrato final. |
| Criação por conta | Repetir criação com outro avatar, arquivar/excluir a Guilda ou repetir chave após resposta perdida | Uma única criação por conta mesmo contra recriação abusiva; replay idempotente não cria outra Guilda. |
| Diretório | Autenticado lista e filtra Guildas públicas; anônimo tenta a mesma chamada | Autenticado vê apenas allowlist; anônimo não enumera; Guilda privada não é revelada por busca/id. |
| Pedidos | Próprio avatar pede entrada, repete, cancela e líder aprova/rejeita | Uma solicitação pendente por Guilda/avatar; aprovação revalida liderança/política e cria um único membership. |
| Convites | Link válido, expirado, revogado, esgotado e preview | Só estado elegível cria pedido/entrada permitida; token não aparece em lista/log; limite e replay são atômicos. |
| Multiguild | Mesmo avatar em duas Guildas com roles diferentes | Seleção explícita; leitura/ação em Guilda A não acessa nem muda Guilda B. |
| Papéis | Membro/moderador/colíder/líder e Admin global em cada operação | Somente matriz aprovada; papel do cliente ignorado; Admin global não herda liderança local. |
| Privacidade/menores | Diretório, descrição, roster, chat/DM, denúncia e bloqueio | Não divulgar dados privados/escolares; regras de comunicação e moderação decididas antes do lançamento. |
| Quotas aprovadas | 10 links ativos/Guilda; link novo até 30 dias/50 usos; 20 convites individuais/Guilda/24h; 5 solicitações/conta/24h; 1 pendência/avatar/Guilda; espera de 24h após rejeição; rename/7 dias | Implementar valores aprovados atomicamente e com idempotência; capacidade de 50 integrantes (incluindo líder e demais papéis) prevalece. Convites existentes preservam termos e expiram naturalmente; limites de 30 dias/50 usos valem para novos links. |
| Moderação/papéis | Líder, colíder delegado, moderador local e Administração global | Diretrizes aprovadas; matriz por operação precisa ser fechada antes de RPC/RLS. Todas as ações são scoped/auditáveis; Administração global não herda liderança. |
| Proteção de menores | Privacidade padrão, sem identificação pessoal de membros, denúncia/bloqueio e limites de contato | Diretrizes aprovadas, mas revisão jurídica/operacional, responsáveis, retenção/exclusão, política etária/representação e capacidade de resposta devem ser concluídas antes da abertura pública ou expansão de contato. |
| Metas de triagem | Denúncia comum 72h; assédio/ameaça/exposição de dados 24h; risco iminente encaminhamento imediato | Metas condicionais, não SLA vigente; demonstrar equipe, cobertura e protocolo antes de anunciar prazos. |
| Economia/EBD | Tentar emitir recompensa ou ler/escrever estrutura escolar por Guild flow | 043B não concede recurso e não muda escopo EBD; 043D/043C usam seus próprios contratos. |
| Recovery | Conter diretório/pedidos/convites após falha | Novas operações param; Guildas, memberships, pedidos existentes, convites e auditoria permanecem. |

## Gates do futuro incremento

- Fresh-read de main, worktrees, migrations, tables, constraints, indexes, triggers, policies, grants, RPC definitions/ACL/owners e configuração de Vercel.
- PR #53 integrada normalmente antes de qualquer nova migration; confirmar versão `20261113153902` e hash aprovado `1f377a035c68cde8921909536820a2e8fe3cc8d9c6b4d3c8dafe8901c6609ad0`, sem reaplicar a ECONOMY-041.
- Revisão funcional/QA e Security para criação, diretório, convite, RPC/RLS, conteúdo público e menores. Nenhuma suíte de EBD/economia precisa repetir se não afetada; as fronteiras ligadas precisam de regressão dirigida.
- Migration aditiva no TEST, plano de contenção e recuperação, comparação de dados/ACL/RLS pré/pós sem PII; Preview READY apontando ao commit e backend TEST.
- Smoke autenticado mínimo de criar, listar, solicitar, aprovar e trocar entre duas Guildas legitimamente existentes/criadas para teste. Nenhuma concessão econômica artificial.
- CI obrigatório no SHA exato. Publicação somente depois de todo gate exigido aprovado; nenhuma migration/alteração de produção nesta tarefa.
- Pós-publicação, confirmar deployment/alias/commit e rotas, diretório autenticado e negativas; verificar que relações/roles/dados existentes foram preservados.

## Reuso sem falsa equivalência

Reaproveitar testes de criação/convite/multiguild dos incrementos 010A/010A.2/010B quando suas fixtures e autoridades continuarem idênticas. Reexecutar somente os casos impactados por uma mudança. Teste sintético de SQL/JSDOM não substitui smoke autenticado; relatório antigo ou CI de outra SHA não aprova um fluxo novo.
# Fundação técnica 043B.1

O roteiro mínimo por criação, permissões, quotas, compatibilidade, isolamento e recuperação está em [043B.1 Plano de Testes](RPG-COMMUNITY-043B1-TEST-PLAN.md). Nenhum cenário runtime, CI, smoke autenticado ou verificação de produção foi executado nesta tarefa documental.
