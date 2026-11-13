# RPG-COMMUNITY-043B — decisões, limites e condições

**Consolidação técnica B.2:** consultar [RPG-COMMUNITY-043B2-FINAL-DECISIONS.md](RPG-COMMUNITY-043B2-FINAL-DECISIONS.md). Os valores de quota permanecem aprovados; semânticas técnicas estão propostas; os itens de produto, privacidade e operação continuam pendentes antes da implementação/abertura pública.

**Planejamento somente.** As diretrizes e valores de quotas das seções 1–3 foram aprovados pelo proprietário, mas ainda não foram implementados ou publicados. A proposta técnica por operação, criação, semântica de quotas, compatibilidade e testes está consolidada em [COMMUNITY-043B.1](RPG-COMMUNITY-043B1-PERMISSION-MATRIX.md). Os detalhes técnicos ainda requerem confirmação no contrato de runtime; prazos de resposta continuam metas condicionadas à capacidade operacional, e revisão jurídica/operacional permanece pendente.

## 1. Limites e fluxos aprovados

| Regra aprovada | Consequência de produto | Condição técnica futura |
| --- | --- | --- |
| Uma Guilda criada por conta, sem recriação abusiva | Impede recriação depois de arquivamento/exclusão. | Enforcement por conta Auth com registro durável de criação, mesmo após arquivamento/exclusão; não vale por avatar isolado. |
| Até cinco Guildas por avatar | Participação multiguild continua permitida. | Contagem server-side transacional; falha/replay não pode remover vínculo existente nem exceder o limite. |
| Até 50 integrantes por Guilda | Limita o tamanho da comunidade. | Contar todas as memberships ativas, inclusive líder, colíder e moderadores; reservar capacidade e aprovar entrada atomicamente. |
| Guilda pública: entrada por solicitação aprovada | Descoberta não implica adesão automática. | Criar membership somente após aprovação autorizada e revalidação de capacidade, política, identidade e pedido pendente. |
| Guilda privada: entrada por convite | Não aparece como comunidade de entrada pública. | Reutilizar convite existente; validar destino, validade, revogação, capacidade e replay no servidor. |
| Uma pessoa pode participar de várias Guildas | A seleção de contexto é explícita; permissões não se misturam. | Toda leitura/escrita nova recebe `guild_id` explícito e o servidor revalida membership e papel. |
| Criador elegível vira líder somente da Guilda criada | Não concede liderança global nem poderes sobre outras Guildas. | Criação e membership inicial de líder são atômicas; separar a elegibilidade comum da autorização administrativa global atual. |

## 2. Quotas complementares aprovadas — ainda não implementadas

| Quota aprovada | Semântica técnica a definir antes da implementação | Impacto e risco relevante |
| --- | --- | --- |
| Até 10 links ativos por Guilda | Semântica proposta: contar links válidos não expirados e não revogados sob lock da Guilda; replay não cria outro link. | Teto técnico 10 já observado; confirmar no preflight. Links existentes preservados. |
| Validade máxima de 30 dias por link | Semântica proposta: relógio UTC do banco, até 30×24h apenas para emissões novas. | Runtime observado limita hoje a 7 dias. Não alongar nem encurtar validade existente; a janela maior aumenta risco de vazamento. |
| Até 50 usos por link, limitado pela capacidade da Guilda | Proposta em B1: uso ocorre ao criar uma solicitação pendente; replay não consome novamente; rejeição/cancelamento não reembolsa. Membership depende de aprovação e capacidade. | Não há contador explícito atual; requer consumo atômico, idempotência e compatibilidade histórica. |
| Até 20 convites individuais por Guilda em janela móvel de 24 horas | Proposta em B1: contar nova emissão aceita pelo servidor, inclusive se depois revogada; replay da mesma chave não conta. | Contador rolling atômico sem expor destinatários. |
| Até 5 solicitações por conta em janela móvel de 24 horas | Proposta em B1: contar novos pedidos de todos os avatares da conta Auth; replay não conta e cancelamento/rejeição não reembolsa. | Evita bypass por múltiplos avatares e limite injusto por IP compartilhado. |
| Uma solicitação pendente por avatar/Guilda | Reutilizar unicidade parcial existente; conflito retorna o pedido pendente, sem nova linha. | Preservar pedidos atuais e tratar duplicata por idempotência. |
| Rejeição impõe espera de 24 horas antes de nova solicitação | Proposta em B1: cooldown por avatar/Guilda desde `rejected_at`, usando relógio do servidor. | Preservar histórico necessário sem revelar motivo privado. |
| Renomeação de Guilda no máximo uma vez a cada 7 dias | Proposta em B1: janela móvel desde a última mudança bem-sucedida; inicialização do nome não conta. | Lock/auditoria; moderação urgente usa contenção própria, sem bypass silencioso. |
| Uma criação por conta, inclusive contra recriação abusiva | Registro durável de criação por conta, independente de Guildas ativas; falha não consome quota. Recuperação de conta removida requer regra explícita. | Não coletar PII extra nem depender apenas de quantidade ativa. |

As semânticas acima são **propostas técnicas para confirmação antes do runtime**, não alteração dos valores aprovados nem autorização de implementação. Detalhes, cenários de concorrência e compatibilidade estão em [043B.1 Quotas](RPG-COMMUNITY-043B1-QUOTAS.md).

**Compatibilidade de convites:** preservar token hash, estado, validade e revogação de todo convite legítimo existente. Não apagar, revogar nem encurtar convites para encaixá-los nas quotas novas. Aplicar a validade de até 30 dias e o contador de até 50 usos a links emitidos após a ativação do contrato; links existentes expiram segundo o prazo originalmente registrado (hoje, no máximo 7 dias) e continuam sujeitos à capacidade vigente. A quota de 10 links ativos pode ser mantida sem invalidar links históricos. Novas quotas de convites individuais e pedidos aplicam-se a novas emissões/solicitações; replay idempotente não conta novamente.

Todas as quotas aprovadas devem futuramente ser aplicadas no servidor com locks/contadores atômicos e idempotência. A interface não é autoridade. Esta tarefa permanece documental; não instalar nem habilitar quotas agora.

## 3. Diretrizes de moderação aprovadas; matriz técnica proposta

| Papel e responsabilidade aprovados | Escopo | Limites que não podem ser herdados |
| --- | --- | --- |
| Líder | Aprova entradas, gerencia membros, cria missões e designa moderadores autorizados da própria Guilda. | Sem administração global; recompensas continuam sob ECONOMY-041 e contratos posteriores. |
| Colíder | Auxilia na gestão; administra missões e convites quando houver delegação explícita. | Não altera administração global nem liderança principal; não recebe poderes não delegados pelo nome do papel. |
| Moderador | Analisa denúncias da própria Guilda e restringe conteúdo/interações somente dentro de competências aprovadas, com auditoria. | Não atua fora da Guilda, não muda liderança principal e não emite recursos econômicos. |
| Administração global | Trata denúncias graves e recursos; pode conter comunidades abusivas por autoridade global própria. | Não herda nem assume liderança da Guilda ao intervir. A contenção deve ser auditável e não apagar histórico necessário. |

As responsabilidades acima foram aprovadas como diretrizes; não são grants/ACLs. A [matriz técnica por operação](RPG-COMMUNITY-043B1-PERMISSION-MATRIX.md) foi preparada para revisão; delegações de colíder/moderador, recurso/contestação, trilha de auditoria e responsável operacional ainda precisam ser fechados antes da implementação.

## 4. Prazos propostos e capacidade operacional

- Denúncia comum: triagem inicial em até 72 horas.
- Assédio, ameaça ou exposição de dados pessoais: triagem inicial em até 24 horas.
- Risco iminente envolvendo menores: encaminhamento imediato conforme protocolo definido.

Esses prazos não são promessa ativa. Exigem equipe identificada, cobertura, treinamento, fila monitorada, escalonamento e capacidade comprovada antes da abertura pública. Sem essa estrutura, não anunciar prazo nem abrir a superfície pública que dependa dela.

## 5. Proteção de menores — diretrizes aprovadas; execução detalhada pendente

As diretrizes aprovadas para contrato futuro são: privacidade por padrão; coleta mínima; nomes públicos seguros e moderáveis; diretório sem roster/lista pessoal; denúncia e bloqueio acessíveis; contenção de conteúdo inadequado; controles contra assédio e aliciamento; revisão do chat existente; e proibição de comunicação privada irrestrita entre adultos e menores.

Antes de ampliar chat/contato: nomear responsável por denúncias; definir retenção, exclusão e acesso a registros; concluir revisão jurídica de LGPD e requisitos aplicáveis a crianças/adolescentes; e definir autorização/representação apropriada à faixa etária. Não inferir idade a partir de avatar, nível, nome ou atividade. As diretrizes aprovadas não equivalem a homologação jurídica/operacional; contato ampliado fica fora de escopo até os controles necessários.

## 6. Economia e fases posteriores

- Preservar integralmente ECONOMY-041. Quotas e moderação jamais concedem moedas, XP, cartas, equipamentos ou baús.
- Missões cooperativas e prevenção de duplicação de recompensa entre Guildas pertencem à COMMUNITY-043D; a política anti-farm continua pendente.
- EBD e associação escolar pertencem à 043C; não inferir escola, papel ou autorização a partir da membership.
- Nenhuma decisão desta proposta autoriza alteração econômica, de Auth/RLS, schema ou dados.

## 7. Dependências e sequência

1. Integrar a PR #53 pelo fluxo normal e conferir o alinhamento da migration `20261113153902`/hash `1f377a035c68cde8921909536820a2e8fe3cc8d9c6b4d3c8dafe8901c6609ad0` antes de qualquer nova migration. **Não integrar nesta etapa documental.**
2. Revisar e confirmar as semânticas técnicas propostas de quotas e a matriz por ação, mantendo os valores já aprovados; resolver capacidade operacional de atendimento.
3. Fechar a análise legal/operacional de menores e chat antes de ampliar contato ou diretório público.
4. Só então elaborar contrato runtime, plano aditivo de dados/recuperação, testes de concorrência/isolamento e gates TEST/Preview conforme RELEASE_POLICY.md.
5. COMMUNITY-043C/043D permanecem trilhas separadas. Sem merge, migration, alteração de permissões ou deployment nesta tarefa.
