# COMMUNITY-043B-TEST-2 — desbloqueio técnico

14/11/2026. **Preparação local; homologação BLOCKED.** PR55 preservada no head remoto `f3e9ed19d3702b4064a3ad19e7b7e4502fa7e3f0`. Nenhum merge, migration remota, restore, ativação, Guilda nova ou deployment nesta execução.

## Dependências e compatibilidade

Estados remotos reconfirmados: #53 aberta/head `c98638aecec0ff37db1ad3b933b3dbc12992d036`/CI `43458777891` SUCCESS; #54 aberta/head `95e6196f34908d52620b12e9f55444a847337f8d`/CI `43488443489` SUCCESS; #55 aberta/Draft/head `f3e9ed19d3702b4064a3ad19e7b7e4502fa7e3f0`/CI `43553123476` SUCCESS. Mergeabilidade atual true nas três; isso não comprova compatibilidade depois de atualizar a base.

Ordem futura: #53 → conferir nome/manifesto/hash ECONOMY-041 e histórico → #54 → sincronizar #55 com main → CI do novo SHA → instalação/Preview/smoke TEST autorizados. Só depois reavaliar a integração funcional. Cada merge em main pode disparar o deploy automático existente; portanto as integrações continuam fora desta autorização. Não reaplicar ECONOMY-041 nem usar db push indiscriminado. Os hashes e a comparação completos estão no [preflight TEST-1](RPG-COMMUNITY-043B-TEST-1-READINESS.md).

## Causa exata de eligible=false

`scripts/ci/demo-isolation.mjs` autoriza exclusivamente seis blobs da demo revisada no commit `9e501ea275f3019991ec9ac233d58790946daf51`; não é um gate genérico para qualquer aplicação com backend TEST. No candidato:

| Arquivo exigido | Resultado |
| --- | --- |
| `apps/web/app/journey/arena/legacy/page.tsx` | Ausente |
| `apps/web/lib/arena-preview.ts` | Ausente |
| `apps/web/app/journey/arena/page.tsx` | Blob diferente |
| `apps/web/app/journey/page.tsx` | Blob diferente |
| `apps/web/app/layout.tsx` | Blob diferente |
| `apps/web/proxy.ts` | Blob diferente |

O workflow exige também branch `preview/*` ou `codex/pinned-preview-ci`, push/tentativa 1, qualidade aprovada, `demo_eligible=true`, `RPG_PINNED_PREVIEW_ENABLED=true` e ambiente protegido `preview-deploy`. Mudar apenas o nome da branch não resolve os seis desencontros. Restaurar a demo antiga destruiria a composição atual do jogo; atualizar a whitelist sem revisar a nova fronteira não é aceite de segurança.

Patch local preparado: `reviewedDemoIssues()` e opção `--explain` mostram ausências, mudanças, entradas inválidas e árvores incompletas. **A função de autorização, hashes revisados, workflow e vercel.json não foram relaxados.** O candidato continua inelegível.

Alternativa técnica proposta, ainda sem implementação/ativação: um contrato separado de Preview COMMUNITY TEST, com manifesto imutável do SHA final, projeto/time fixos, somente target Preview, URL TEST e chave pública TEST de origem conferida, rejeição de overrides PROD, flag UI TEST, SSO preservado, CI exato obrigatório, verificação do bundle/backend antes do login e reutilização do deployment existente por SHA. Deve ter revisão própria e testes negativos antes de integrar o mecanismo oficial. A demo antiga mantém sua regra atual. Usar CLI/API diretamente para escapar da recusa atual não está aprovado.

## Supabase TEST: recuperação e migrations

Projeto confirmado `wkdvdzfkbwvhyjmamrsg` / `rpgjovemcristao-test` / ACTIVE_HEALTHY. Histórico reconfirmado: últimos registros `20261111100618` (041 TEST), `20261113091653` e `20261113111702` (fixtures 041); nenhuma migration 043B. Os três arquivos locais permanecem na ordem `20261113215415` → `20261113232954` → `20261114110000`; sem modificação neste incremento. A leitura do histórico confirma presença/ausência de versões, não uma nova comparação integral de todos os objetos do banco; reutilizar o baseline TEST-1 e recapturá-lo imediatamente antes da DDL futura.

**Backup/PITR: não comprovado.** O conector não oferece listagem de backups nem expõe cobertura no get_project. Não há SUPABASE_ACCESS_TOKEN explicitamente configurado no processo para a consulta oficial de backups; nenhum token pessoal foi procurado. Menor condição: um operador autorizado consultar o painel Database → Backups/Point in Time ou disponibilizar acesso de leitura ao endpoint `GET /v1/projects/wkdvdzfkbwvhyjmamrsg/database/backups`, registrando status, instante, janela e mecanismo de restauração sem dados sensíveis. Não habilitar plano pago ou backup automaticamente.

Limites documentados pelo [Supabase](https://supabase.com/docs/guides/platform/backups): backups de banco não cobrem os objetos de Storage; restore substitui o estado do banco e exige indisponibilidade; alterações posteriores ao ponto escolhido podem ser perdidas. Não presumir PITR por o projeto estar saudável, nem tomar metadados como ensaio de restore. Nenhum restore foi executado.

## Procedimento privado TEST proposto

Este é um procedimento de operação para revisão, **não um novo RPC ou script executável aprovado**. Aplicação/ativação exigem autorização da etapa seguinte e recuperação verificável.

1. Fixar projeto TEST, SHA final, hashes das três migrations e referência de operação; confirmar #53 integrada e comparar histórico. Revalidar sessão legítima do operador de manutenção, separada da sessão do jogador. Projeto/ambiente são conferidos fora do banco pela API e no banco pelo release_scope; release_scope isolado não identifica o projeto.
2. Usar instalação por migration explicitamente selecionada, uma transação por arquivo, com o respectivo SET LOCAL de opt-in no mesmo pedido: `rpg.community043b.install`, `rpg.community043b.quotas_install`, `rpg.community043b.request_quotas_install`, todos `local-test`. Não usar conexão separada para setar o GUC. Conferir versão registrada após cada arquivo e interromper se divergir; nunca reaplicar automaticamente.
3. Conferir flags novas `false`/`disabled`, RPC INVOKER público, helper privado, ACLs mínimas, RLS/constraints/triggers e baselines sem alterações econômicas. As migrações de quotas têm efeitos nos comandos existentes mesmo com criação desativada; a flag de criação não contém essas quotas.
4. Preparar uma operação de manutenção versionada e de propósito único para ativar/desativar somente os dois campos COMMUNITY no TEST. Antes de executá-la: identidade TEST, operador privilegiado permitido, hashes dos objetos, valor/revisão esperados e autorização da operação. Na mesma transação: lock `(1010,1)`, revalidação, compare-and-set do estado esperado e registro de antes/depois/referência no journal privado da operação. Não expor SQL arbitrário, conceder EXECUTE a jogadores nem alterar o controle global `writes_enabled`. O artefato executável e seu ensaio de reversão ainda precisam ser preparados/revisados; não considerar esse passo implementado.
5. Para habilitar, definir somente criação COMMUNITY ativa/ambiente test; para conter, desligar criação sob a mesma trava. Validar uma única linha e estado resultante. Falha aborta integralmente. Nenhuma concessão de papel global ou recurso econômico.
6. Conservar Guildas/memberships/auditoria após o smoke. O recovery-empty local só remove a fundação vazia e recusa histórico de criação; não desfaz as duas migrations de quotas. Havendo problema nas quotas, conter a operação afetada por procedimento revisado ou corrigir forward. Não prometer rollback integral pela flag ou pelo pacote empty. Rollback de cliente não reverte banco.

## Conta e smoke

Leitura restrita aos três avatares anteriormente autorizados, sem e-mails/UUIDs: Herói TEST Equipamentos está ativo, conta confirmada/elegível e não revogada, com três memberships; Carlos Teste e QA Arena Torre estão inativos. **Nos três, a conta já tem criação registrada**, portanto nenhum serve à primeira criação pelo contrato atual. Ativar outro avatar não restaura a quota. Não apagar Guildas ou audit para fabricar elegibilidade.

As quatro contas estaticamente elegíveis do preflight anterior não têm login/controle legitimamente disponibilizado nesta sessão. Menor condição de acesso: um operador que já controle uma delas entrar normalmente na futura Preview e selecionar avatar próprio elegível. Nenhuma credencial deve ser enviada no chat. Não é necessário criar conta/avatar, mas o smoke de primeira criação permanece bloqueado até existir esse operador.

Smoke único após instalações/ativação/Preview autorizadas: baseline → login TEST → criar uma Guilda nomeada para a homologação → verificar uma Guilda, um líder e um audit → replay do mesmo request ID sem duplicação → segunda intenção da mesma conta negada, sem criar outra Guilda → confirmar ausência de grant Admin global/diretório e igualdade dos baselines econômicos. Preservar a Guilda criada e a auditoria. Os 45 cenários isolados anteriores continuam evidência automatizada, sem substituir esse fluxo real.

## Validação e estado final

27 testes Node direcionados PASS (`demo-isolation.test.mjs` e `pinned-preview.test.mjs`), incluindo dois novos cenários de diagnóstico e as negativas existentes de isolamento, SHA, alvo Production e duplicação de deployment. Prettier nos dois arquivos e diff check aplicados. Nenhuma suíte geral, teste econômico ou batalha repetida. Patch apenas local/sem commit; o CI de f3e9ed1 continua válido para o candidato remoto, não atesta este patch novo. Um futuro commit exige CI próprio. QA/Security pelo autor, sem revisão independente.

Pendentes: contrato específico de Preview revisado; backup/recuperação TEST comprovados; operação privada de ativação versionada e ensaiada; operador com conta elegível; sequência #53/#54 e CI do SHA resultante; instalação/Preview/smoke em etapa posterior autorizada. Retenção após exclusão Auth e abertura pública continuam pendentes. **Não TEST PASS, não DEPLOY_COMPLETE.**
