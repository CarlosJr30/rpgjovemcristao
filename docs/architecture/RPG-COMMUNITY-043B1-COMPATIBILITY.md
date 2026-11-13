# RPG-COMMUNITY-043B.1 — compatibilidade e recuperação futura

**Contrato documental somente; sem migration, backfill ou mudança remota.** A referência observada é código/migrations versionados e snapshot PROD somente leitura de 13/11/2026. Revalidar contra o schema real no começo da implementação.

| Dado/fluxo atual | Compatibilidade obrigatória | Estratégia futura recomendada | Risco e verificação |
|---|---|---|---|
| Guildas e memberships atuais | Não mudar IDs, líderes, papéis, memberships multiguild, estado, histórico nem progressão | Migração aditiva; defaults fechados/privados; sem reclassificação automática para pública | Comparar contagens e hashes/IDs de conjuntos antes/depois; confirmar que o índice multiguild não foi revertido |
| Papéis `leader`, `co_leader`, `moderator`, `member` | Manter rótulos e vínculo; não converter papel em grant global | Adaptador de autorização por ação e Guilda; delegações novas explícitas | Testar papel revogado, escopo errado e avatar em duas Guildas com papéis diferentes |
| Criação atual e `leader_authorizations` | Não remover nem ampliar a autoridade administrativa para comandos existentes | Novo caminho estreito para criação comum elegível; preservar caminho administrativo separadamente, com invariantes documentados | Provar que nova RPC não permite cliente criar papel global nem contornar controles atuais |
| `guild_join_requests` | Preservar pendentes, decisões, timestamps e unicidade parcial um pending/avatar/Guilda | Acrescentar somente campos/índices necessários; não reconstruir pedidos | Snapshot dos pedidos; conflito de pedido deve responder com estado existente, sem inserir duplicata |
| Links de convite | Preservar token hash, data de expiração, revogação, estado, usos/consumos e referência; não expor token bruto | Limites 30 dias/50 usos valem somente para novos links; campos novos nullable ou default compatível, sem inventar uso histórico | Comparar todos os links existentes por IDs/hashes/status/expiry/consumption; testar link antigo e novo separadamente |
| Convites individuais | Não apagar nem invalidar emissões pendentes/válidas | Quota de 20/24h aplicada às novas emissões após ativação | Confirmar retries não contam duas vezes; preservar destinatários e histórico com acesso mínimo |
| Diretório e visibilidade | Tabela base mantém RLS ativa; membership e roster não ficam públicos | Criar projeção autenticada allowlisted somente para Guildas públicas, sem campos privados; nenhuma listagem de Guildas privadas | Tentativas anônimas, por ID, busca e paginação não podem revelar existência privada/roster |
| Missões, tentativas e claims | Nenhuma alteração/recompensa retroativa; missões atuais continuam sob autoridades que já possuem | 043B não habilita payout; planejar conexão futura em 043D/autoridade ECONOMY-041 | Conferir recibos/claims existentes e negar replay/cross-Guilda na futura fase |
| EBD/aulas/presença | Não reassociar aula ou aluno, nem inferir escola ou consentimento pela membership | EBD continua Guilda-bound; integração escolar/account-level pertence a 043C | Baseline de aulas, professor, atividade e presença; regressão de isolamento por Guilda |
| RPCs públicas e schemas privados | Não abrir tabelas nem conceder execute a helpers internos | Wrappers públicos estreitos `SECURITY INVOKER` quando viável; helpers privados com identidade/ownership revalidados, `search_path` seguro e ACL explícita | Comparar grants, owners, `proconfig`, RLS/policies; negar anon, `service_role` e usuários fora do escopo conforme contrato |
| Clientes antigos | Cliente antigo não deve inferir visibilidade ou autoridade e não deve causar criação duplicada | Expand-contract: servidor preserva contratos de RPC atuais ou responde erro compatível; feature nova permanece fechada até cliente e backend compatíveis | Smoke do cliente anterior e novo, request replay e falha de versão; não confiar em validação client-side |

## Tratamento conservador de dados antigos

1. Default recomendado para Guildas sem classificação explícita: privada/não listável. Manter memberships como estão; sem UPDATE em massa para “pública”.
2. Não preencher contadores de uso retroativamente por aproximação. Links existentes mantêm seu contrato original; caso a nova lógica não consiga distingui-los, introduzir versão explícita apenas para novas emissões e preservar a rota antiga compatível até expiração natural.
3. Registro de “uma Guilda criada por conta” precisa respeitar o histórico existente. Antes de ativar a quota, levantar o universo de criadores com base comprovável e definir individualmente casos sem provenance. Não marcar todas as contas, nem liberar recriação por ausência de marcador sem análise.
4. Dados novos de moderação/quota devem minimizar PII, ter retenção e acesso definidos, e não armazenar token bruto, conteúdo de denúncia desnecessário ou informação escolar no diretório.

## Sequência futura e recuperação

1. Integrar PR #53 normalmente e conferir que `20261113153902` e SHA-256 `1f377a035c68cde8921909536820a2e8fe3cc8d9c6b4d3c8dafe8901c6609ad0` correspondem ao único SQL registrado; não reaplicar.
2. Capturar baselines TEST/PROD de schemas, ACLs, policies, RPCs, memberships, convites, pedidos, missões e EBD. Confirmar projeto/ambiente e plano de backup/restauração; um export de schema não equivale a snapshot restaurável.
3. Usar migração aditiva e expand-contract; instalar primeiro em TEST, validar cenários, Preview/backend e migração progressiva. No PROD, aplicar apenas migration nova aprovada e ainda pendente.
4. Se falha: suspender somente novas criações/diretório/convites afetados por feature control; preservar leitura, vínculos e histórico. Não apagar coluna/ledger recém usado nem reverter dados por downgrade destrutivo.
5. Recuperação do app pode voltar ao commit anterior apenas se compatível com schema expandido. Reverter migration não é rollback automático; preferir corrigir/containment forward. Restaurar backup completo exige autorização e plano de impacto, pois transações legítimas posteriores podem ser perdidas.
6. Conferir login, contexto de Guilda, convite/pedido, leitura/membership e EBD preservada, além de contagens e permissões. Nenhum desses passos foi executado nesta fase documental.

**Bloqueio adicional:** PR #53 está aberta, não integrada segundo a verificação registrada para esta tarefa. Deve ser integrada/conferida antes de qualquer nova migration de comunidade. O alinhamento de referência, por si, não exige deployment funcional; qualquer deploy automático após merge deve ser observado sem duplicação.
