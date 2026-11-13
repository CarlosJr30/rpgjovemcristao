# RPG-COMMUNITY-043B.1 — plano mínimo de testes futuros

**Plano; nenhum teste de runtime executado e nenhum gate declarado PASS nesta etapa.** Os cenários só serão executados depois de contrato runtime aprovado, PR #53 integrada e ambiente TEST autorizado. A matriz mantém foco em autorização, quotas, compatibilidade e privacidade.

## Gate documental atual

| Verificação | Resultado |
|---|---|
| Cinco documentos 043A/043B existentes foram preservados e referenciados | PASS após revisão dos caminhos na PR documental |
| Matriz cobre operações e papéis solicitados | PASS após revisão estrutural |
| Números de quotas coincidem com a aprovação | PASS após busca/revisão dos limites |
| Diff restrito a Markdown de planejamento | PASS se confirmado no staged diff |
| `git diff --check`, links relativos, ausência de secrets e tag backup intacta | Executar antes do commit; registrar resultado |
| CI de aplicação, Supabase remoto, Preview, smoke ou deploy | N/A nesta etapa documental; nenhum é executado ou inferido |

## Cenários indispensáveis para implementação

### Criação e identidade

1. Conta autenticada elegível cria Guilda e membership líder atômicas; resposta contém só o resultado autorizado.
2. Retry igual e duas chamadas concorrentes com mesma chave produzem uma Guilda; chave igual com payload diferente é recusada.
3. Avatares distintos da mesma conta concorrem: apenas uma criação total; avatar próprio inativo, alheio, sessão revogada, anônimo e Auth não confirmado são recusados.
4. Quinta membership pode existir; sexta falha sem afetar as cinco atuais. Conta não contorna criação por arquivamento/exclusão/recriação.
5. Falha injetada entre Guilda, membership líder, quota e auditoria reverte todas as escritas; retry recupera um único resultado.

### Matriz de autoridade

6. Para cada uma das 18 operações da [matriz](RPG-COMMUNITY-043B1-PERMISSION-MATRIX.md), exercitar permitido e negado para membro, moderador, colíder, líder, conta sem vínculo, anon e Admin global separado.
7. Troca/revogação de papel ou membership entre leitura e escrita é revalidada; `guild_id` de outra Guilda não cruza escopo.
8. Admin global não ganha membership/liderança nem lê conteúdo comunitário privado fora da ferramenta/processo autorizados.
9. RPC direta, acesso Data API, `service_role` e helper privado respeitam ACL/RLS; negar anon e usuário autenticado sem ownership/papel. Verificar owners, `search_path`, grants e RLS em migração.

### Quotas, pedidos e convites

10. Exercitar exatamente nos limites e um acima: 10 links ativos, 30 dias, 50 usos, 20 convites individuais/rolling 24h, 5 solicitações por conta/24h, uma pendente/avatar/Guilda, cooldown 24h, rename uma vez/7 dias.
11. Duas emissões/aceitações simultâneas no limite não excedem quota/capacidade; 50 membros ativos incluem todos os papéis; 51º é recusado.
12. Request replay idempotente não consome contador outra vez; replay divergente falha. Link expirado, revogado, esgotado e de outra Guilda é recusado sem revelar Guilda privada.
13. Para link novo, contabilizar uso conforme semântica aprovada; aprovação final revalida capacidade. Cancelamento/rejeição mantém a contabilização proposta. Para links antigos, verificar hash, expiry, revocation, consumption e fluxo anterior intactos.
14. Cancelamentos/rejeições/alterações de relógio do cliente não burlam janelas; contagem rolling usa relógio UTC server-side.

### Compatibilidade, privacidade, EBD e recuperação

15. Guildas antigas começam em estado conservador não público; memberships, papéis, convites, missões, claims, EBD, recibos e histórico permanecem idênticos salvo linhas novas comprovadas.
16. Diretório retorna apenas allowlist autenticada; negar anon e esconder Guildas privadas, roster, nomes pessoais, e-mails, IDs Auth, escolas, pedidos, convites e atividade individual.
17. Mensagem/denúncia/bloqueio e contenção passam cenários de abuso; validação jurídica, responsável e capacidade operacional são gates de lançamento, não substituídos por teste automatizado.
18. Erro em cada etapa de migração/fluxo pode ser contido sem apagar histórico; teste de recuperação verifica aplicação compatível com schema expandido e compara baselines. Backup só é “restaurável” após prova de restore controlada em ambiente próprio.
19. Missões não emitem recursos na 043B; ausência de autoridade ECONOMY-041/contrato 043D nega payout. Verificar zero mudança econômica por todas as ações sociais.

## Gates de entrega da implementação futura

- Testes direcionados de RPC/integração, Auth/RLS/ACL, ownership, concorrência e idempotência; lint, TypeScript e build exigidos pelo repositório; CI obrigatório no SHA candidato.
- Aplicar somente migrations aprovadas e pendentes em TEST; comparar dados e grants antes/depois. Preview READY com backend TEST, login normal por conta TEST autorizada e smoke dos fluxos novos sem alterar dados reais não autorizados.
- Segurança revisada por pessoa independente quando exigido; revisão jurídica e operacional para público menor de idade; política de denúncias, retenção e equipe comprovadas antes de abrir diretório/contato.
- PR #53 integrada e histórico de migration alinhado antes da próxima migration. Merge e publicação seguem RELEASE_POLICY.md; nenhum gate ausente é N/A ou PASS por mocks.

## Critério de corte

Se não houver conta TEST naturalmente elegível para um fluxo, não criar avatar, membership, convite ou conteúdo que represente usuário real para fabricar prova. Registrar exatamente o ramo não exercitável e bloquear a etapa que depende dele. Testes sintéticos podem cobrir invariantes de banco, mas não substituem autenticação real/Preview prevista pela política.
