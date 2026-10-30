# RPG-DEV-010B — Convites, classes e EBD

## Implementação inicial010B.2/010B.1 — VALIDATING local

Fechamento local do candidato: **963unitários PASS/74SKIP**,142arquivos aprovados/7opt-in omitidos; **39PG isolados PASS**, incluindo definições/ACLs canônicas das25rotinas legadas auditadas. Lint/typecheck/build/protocolo25 e24RSC/222interface/48Guilda sintéticos PASS. Captura móvel da Guilda inspecionada; botão de convite reutiliza o estilo verde original. Nenhuma dependência/lockfile/arte alterada. A comparação de ACL inicialmente recebeu formato textual do driver em vez de JSON; corrigida serialização do coletor com to_jsonb, sem modificar grants ou assertions de segurança. Primeira configuração de Preview foi recusada porque a branch ainda não existia remotamente; criada a referência exata8e7797c, depois adicionadas somente as duas configurações públicas TEST. Sem variável/alias/SSO produtivo alterado. NovoCI, migraçõesTEST, Preview e fluxos reais de010B permanecem gates pendentes.

Classes privadas por Guilda, professores/matrículas explícitos, seleção de classe sem assumir a primeira, histórico e comandos idempotentes preparados. Saída/remoção da Guilda revoga os vínculos de classe daquela comunidade e impede sua restauração involuntária na reentrada. Convites comuns novos oferecem Guilda ou Guilda+classe,1–30dias/1–100usos, QR/link/WhatsApp acionado pelo usuário, consumo automático sem pedido pendente e sem privilégios. Professores emitem apenas para as classes atribuídas. Validação de emissor é repetida no consumo; aluno removido não retorna por replay. Segredo é hash no banco, fragmento no link e cookie host-only HttpOnly/Secure/SameSite=Lax no retorno Auth; nonce/limites não secretos retomam emissão após reload. Nenhuma mensagem foi enviada.

Reutilizados seleção/governança010A, aparência medieval, dependência QR existente e fluxos Auth/avatar. Rotinas e links antigos preservados como legado; novas emissões na Guilda publicada usam o contrato automático. Links antigos ainda pertencem ao contrato de pedido pendente e não são declarados migrados para o contrato novo. Aulas, atividades e presença publicadas permanecem no modelo anterior, sem conversão automática em classes.010B.3 ainda exige implementação e gates próprios; não há concessão econômica.

Local: suíte completa no checkpoint inicial **955PASS/74SKIP**, seguida de **42 direcionados PASS**, incluindo8 testes adicionais; não somar42 à suíte. Novo CI definirá a contagem integral final do candidato. **38 PostgreSQL isolados PASS**, incluindo recuperação vazia das duas migrations, contenção preservadora, múltiplas classes/vínculos, replay, concorrência, convites e revogação. Ajuste final de auditoria ainda em recheck. Lint/tipos/build/protocolo25 PASS nos checkpoints; verificação final em curso. **24RSC/222interface/48Guilda PASS** com API/Auth sintéticos, Chromium/WebKit390/320/paisagem, sem prova hospedada ou aparelho físico. Artefatos privados em build/rpg-dev-010b e diretórios dos coletores existentes. QA/Security/React pelo autor, sem revisão independente alegada.

Falhas preservadas: bootstrap do cluster isolado inicialmente não fixou o scope TEST e depois omitiu a contenção exigida pela migration antiga; corrigida somente preparação sintética, sem mudar guardas. Nova migration de convites teve alias PL/pgSQL conflitante, corrigido antes de qualquer aplicação remota. Lint identificou leitura de ref durante render e build encontrou Guilda opcional; corrigidos estado visual e estreitamento de tipo, sem desativar regras. Não considerar essas rodadas PASS. Binário isolado PostgreSQL17.10 já fixado reutilizado em loopback, sem serviço Windows ou dados reais.

Preflight remoto somente leitura: TEST PostgreSQL17.11/49tabelas/33migrations e PROD17.6/44tabelas/10migrations,39policies cada, zero tabelas de aplicação sem RLS, gestão ativa e um Admin existente em cada ambiente. Capturadas contagens/hashes dos49TEST/44PROD antes de qualquer DDL010B. Avisos legados de dependências/Supabase preservados, sem audit-fix forçado ou alteração de configuração. Conector Vercel403; CLI existente no mesmo projeto/equipe confirmou READY/SHA/alias010A e proteções originais. Sem migration, grant, merge, Preview ou publicação010B remotos neste checkpoint.

Migrations locais próprias TEST-only geradas pela CLI2.122.0: `20261030105539_rpg_dev_010b_classes_test.sql` e `20261030110258_rpg_dev_010b_member_invites_test.sql`. Recuperação vazia recusa qualquer registro emitido; contenção bloqueia classes e convites preservando leituras, vínculos e histórico. Pacote PROD independente somente após homologação completa do incremento. Não aplicar TEST-only em PROD.

30/10/2026 — **ACTIVE, sem publicação010B**. Branch própria `codex/rpg-dev-010b-ebd-classes` criada da main `994fe9d` e avançada normalmente ao fechamento documental `8e7797c`. PR12/18 e nove worktrees preservados. Produção010A READY/production/994fe9d/alias oficial e CI40852856242 success reconfirmados; TEST33migrations/49tabelas e PROD10migrations/44tabelas, sem DDL010B neste checkpoint.

## Auditoria e reutilização

| Fonte existente | Reutilização e adaptação necessária |
| --- | --- |
| `guild_admin_private.guild_role/active_actor`, seleção multiguild | Reutilizar identidade própria ativa, papel real e revogação consultados no servidor. Administrador global não se torna líder/professor implicitamente. |
| `guild_invite_private.link_invites` e `/api/guild-invites` | Convites existentes têm7dias e geram pedido pendente. Preservar registros/links legados; novo contrato comum30dias/100usos, entrada automática e classe explícita. Convite de liderança permanece separado. |
| `features/guild-governance/invitation.tsx` | Reutilizar padrão de token no fragmento, cookie host-only protegido e retorno Auth limpo para novos convites comuns, sem criar autenticação por convite. |
| `public.guild_lessons`, `ebd_ops.command/workspace` | Preservar aulas e APIs publicadas, versão/revisão/PT409, agenda/materiais/editor. Não converter aulas legadas automaticamente em classes. |
| `guild_ebd_teachers` | Papel atual por Guilda/aula não representa classe. Novo escopo precisa de atribuição explícita por classe, sem promover permissões antigas globalmente. |
| `guild_ebd_activities/answers` | Reutilizar formatos/validação e feedback; questionário novo exige conjunto exato7 e correção servidor, sem gabarito antecipado ou reflexão privada compartilhada. |
| `guild_ebd_attendance/history` | Preservar presente/ausente e auditoria existentes; acrescentar pendente/justificada e elegibilidade sem emissão econômica no incremento de aulas. |
| `guild_ebd_reward_pending` | Dados históricos intactos; não usar tier legado para fabricar XP/baús. Contrato novo de50XP condicionado à010D, emissão desabilitada. |
| `GuildHall`, `ReleaseShell`, menu11 e componentes EBD | Reutilizar visual medieval e navegação; seleção de classe subordinada à Guilda explícita. |

## Ordem técnica e gates

A base de classes/permissões (010B.2) precede o destino “Guilda + classe” de010B.1. Essa dependência real reorganiza a implementação, não dispensa os gates próprios. Não publicar convite que prometa matrícula numa classe ainda inexistente.010B.3 depende das duas fronteiras para aulas, quiz e presença.

Gate atual: auditoria e implementação inicial. Nenhum teste010B, migration remota, CI candidato, Preview ou publicação010B declarado PASS. Testes010A anteriores preservados como baseline, sem convertê-los em evidência nova. Sem economia, mensagens privadas, nova arte/recurso pago, alteração de jogadores PROD ou concessão administrativa. QA/Security pelo autor, sem independência alegada.
