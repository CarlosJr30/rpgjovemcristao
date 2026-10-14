# TASK-0072 — Merge do notebook e chat

Data: 2026-10-14. Revisão QA/Security pelo autor, sem independência. Integração em `integration/chat-notebook-20261014`; publicação/validação Vercel será registrada somente com evidência real.

## Versões preservadas

- Base desktop: `204ba56fc8b0ded2a4d99310818094210ddbbea2`.
- Notebook: oito commits até `8270e3d289889f7fa76b3849e7e4c69462845068`, melhorias mobile/câmera/swipe, isolamento de mídia e cadastro/recuperação de herói/senha.
- Trabalho local: chat Supabase, originalmente TASK-0062, preservado no commit `0192b8f` antes do merge e em backup de 25 arquivos com SHA256, `build/task-0072/premerge/manifest.json`. Todos os 25 hashes do backup conferidos.
- Merge Git real de origin/main, sem conflitos textuais, force, reset, rebase ou descarte. Preservação inicial: 197 dos 199 caminhos do notebook iguais; schema/types receberam adições de ambos. Correção posterior explícita em um teste E2E, sem alteração no comportamento de Auth: 196 iguais e três integrações autorizadas.
- Nenhuma alteração de gameplay/Avatar/áudio foi inventada nesta tarefa: mudanças recebidas são as aprovadas/publicadas pelo usuário no notebook. Oito fontes de áudio mantêm hashes/licenças e ficam fora de produção; auditoria de 54 Avatares PASS.

## Colisões conciliadas

| Origem local | Identidade integrada | Motivo |
| --- | --- | --- |
| TASK-0062 chat | TASK-0071 chat | TASK-0062 já identifica a entrega mobile publicada |
| TASK-0063 conciliação recém-registrada | TASK-0072 conciliação | TASK-0063 já identifica a publicação mobile do notebook |
| 0006_guild_chat.sql / .down.sql | 0007_guild_chat.sql / .down.sql | Notebook publicou 0006_traveler_journey_progress.sql |
| 0007_guild_chat_commit_order.sql | 0008_guild_chat_commit_order.sql | Sequência depois de Jornada/chat |

IDs publicados e suas referências não foram renumerados. Contratos atuais mantêm IDs únicos; aliases desktop anteriores ficam registrados. Os antigos arquivos do chat permanecem recuperáveis em backup/Git, sem duplicar contratos ativos.

Journal/snapshots reconciliados com o Drizzle instalado: 0006 representa Jornada, 0007 Jornada + chat, 0008 correção customizada de função. Geração posterior da árvore final retornou **No schema changes, nothing to migrate**. Não instalaram dependências nem executaram SQL no Supabase durante o merge.

**Não reaplicar as migrações no projeto Supabase atual só porque os nomes locais mudaram.** Histórico já aplicado: `20261011141155_traveler_journey_progress`, `20261014032438_guild_chat_v1`, `20261014033334_guild_chat_commit_order`. A conciliação foi documental/local; dados e permissões remotos foram preservados.

## Validação integrada

| Gate | Resultado |
| --- | --- |
| Lint | PASS |
| Typecheck | PASS |
| Unit | PASS: 67 arquivos / 443 testes |
| Build de produção | PASS; cache QA isolado por RPG_MOBILE_E2E, preservando cache/processo do usuário |
| Isolamento mídia | PASS: público209, artefato727, zero achados; oito hashes originais preservados |
| Avatares | PASS:54 identidades, sem promoção Body-Fit |
| Migrações/snapshots | PASS: journal único/ordenado e zero drift de schema |
| E2E Guilda/Auth/cadastro/mídia | 24PASS/2FAIL inicial; followup mídia4PASS. 26 casos distintos aceitos; não alegar uma execução inicial limpa |
| Chat UI | PASS:10 checks em Chrome/Edge, quatro larguras, com fixtures |
| Chat API pública | PASS: anon tabela/RPC401, schema privado406 |
| Backup | PASS:25 hashes |
| Secret scan/diff final | Registrar no contrato após staging final |

Falha E2E: `media-isolation.spec.ts` ainda esperava `validity.tooShort` no login. Cadastro do notebook passou a aplicar mínimo8 só em signup, preservando entrada de credenciais existentes. Teste agora verifica campo obrigatório no login, mínimo8 no cadastro e zero chamadas Auth nos formulários inválidos. Critérios de isolamento404 e segurança não foram removidos; runtime Auth não foi alterado.

## Vercel e gates restantes

Projeto existente: `carlos-junior-s-projects/rpgjovemcristao-web`, ID `prj_mG2ZSDaSc5i2Pz2uqKSlCzSGiVmG`, equipe `team_FWD8MfZ9vARK8EBovoyTn9Ox`. Domínio de produção: https://rpgjovemcristao-web-inky.vercel.app/.

GitHub confirmou status **success** de Vercel para o último commit do notebook. Referência: [status do deployment do notebook](https://vercel.com/carlos-junior-s-projects/rpgjovemcristao-web/8ZA44sJW5L3ziZB3fpbQx7cYvpPE).

Consultas detalhadas get_project/list_deployments via conector retornaram **HTTP403**, inclusive após o usuário confirmar que estava conectado. Erro informa ausência de autorização ao recurso na equipe específica; conexão existente não prova acesso efetivo a essa equipe. CLI e autenticação local não encontrados. Não solicitar nem registrar tokens/senhas, instalar ferramenta desnecessária ou reduzir proteção para contornar o erro.

A integração deve ser disponibilizada por branch/preview para revisar e executar o gate real de chat. Produção exige os gates aplicáveis e verificação do deployment correto. Não confundir sucesso do commit do notebook com um deployment novo da integração. Nenhuma release adicional apenas para encerrar documentação.

TASK-0071 permanece BLOCKED pelo teste real de duas contas em navegadores diferentes; testes SQL com claims simuladas/UI fixtures não substituem Auth/Reatime reais. Tentativas nativas localizaram Chrome e Edge, mas a ferramenta encerrou o controle por não conseguir determinar a URL com confiança. Nenhuma aprovação física ou social para menores foi presumida.

Relatórios: [chat](GUILD-CHAT-V1.md), [Security do chat](../security/GUILD-CHAT-V1-REVIEW.md). Receipts de preservação/backup/generation ficam em `build/task-0072/`, ignorados e sem ambiente privado.
