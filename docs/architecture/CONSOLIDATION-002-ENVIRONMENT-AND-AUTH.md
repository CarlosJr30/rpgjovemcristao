# Consolidação002 — ambiente, custos, Auth e autorizações

Leituras de metadados autorizadas em2026-10-20, sem criação, configuração, DDL remoto, dados reais ou leitura de chaves. O [plano JSON](CONSOLIDATION-002-REMOTE-PLAN.json) é uma especificação revisável, **não um payload executável do provedor**. Campos sem alvo/origem confirmados continuam nulos.

## Supabase disponível

Uma organização visível: `CarlosJr30's Org`, ID `xwyyrzctzharutyqysch`, plano/tier Free confirmados pelo conector. Inventário: RPGJOVEMCRISTAO ativo, produção excluída (`wspafhlbtlpabypzymjo`); Louvor IBCI e MVP Oficina Fulineiro inativos, de outros produtos, não reutilizados. Os três metadados indicam região sa-east-1. **Nenhum Supabase RPG de teste identificado**; não foram consultados schema, Auth, dados ou logs de produção para preencher lacunas.

Proposta: projeto novo e vazio `rpgjovemcristao-test`, em São Paulo/`sa-east-1`, Free, sem cópia de produção, branch de produção, upgrade ou add-on. São Paulo consta nas [regiões oficiais](https://supabase.com/docs/guides/platform/regions). Mesmo nome do Vercel não implica vínculo; o novo ref e o host precisam ser distintos dos de produção e conferidos antes de configuração.

## Custos e limitações

A [tabela oficial](https://supabase.com/pricing), consultada nesta data, anuncia Free a US$0/mês, limite de dois projetos ativos, 500MB de banco e pausa por inatividade após uma semana. Não há garantia automática de slot pela contagem do inventário. A organização visível está Free. Não houve contratação, upgrade ou aceitação de cobrança.

A ferramenta `get_cost` exige organização indicada pelo usuário. O usuário respondeu “Sim, consultar nessa organização”, escolhendo `CarlosJr30's Org` somente para cotação. A consulta específica retornou `type:project`, `recurrence:monthly`, `amount:0`; a ferramenta não informou campo de moeda. O resultado foi repetido ao usuário e salvo em `build/task-consolidation-002/supabase-project-quote.json` na raiz. **Cotação zero mensal não autoriza criação**, nem garante disponibilidade permanente de slot. Reconfirmar o valor se o contexto mudar. Se houver custo não zero, limite ou plano diferente, interromper e apresentar o valor/recorrência antes de qualquer futura criação. Free não oferece backup automático; preparar exportação/snapshot autorizado antes de DDL e recuperação não destrutiva. [Backups oficiais](https://supabase.com/docs/guides/platform/backups).

## Vercel de teste confirmado

MCP retornou403 no escopo; sem repetição do mesmo erro, CLI64.0.2 já disponível consultou explicitamente o projeto autorizado, com credenciais próprias da CLI e somente GET. API confirmou:

- `rpgjovemcristao-test` / `prj_qKzjXMVXwiVpGlU66SoTA71mStXX`, equipe `team_FWD8MfZ9vARK8EBovoyTn9Ox`.
- Next.js, Root Directory `apps/web`, Node24.x, build `npm run build`, instalação `npm ci --prefix ../.. --no-audit --no-fund`.
- SSO/Vercel Authentication em **todos** os deployments; Git desconectado, nenhuma variável configurada e lista de deployments vazia.

Não existe URL jogável confirmada. Não inventar origem pelo nome do projeto. Não se criou link local `.vercel`, domínio ou deploy. O projeto de produção `rpgjovemcristao-web` não foi consultado/modificado. A leitura resumida de `project inspect` não mostrava proteção; GET completo do mesmo projectId confirmou `deploymentType:all`, portanto omissão de campo não foi interpretada como proteção desativada.

## Configuração exata a aprovar depois

| Área | Estado desejado e gate |
| --- | --- |
| Cadastro | E-mail/senha normais, signup permitido, confirmação de e-mail mantida. Nenhuma opção de continuar apenas no navegador ou conta anônima |
| Anonymous Sign-ins | Desabilitado no novo alvo enquanto o endpoint legado de Avatar não distinguir is_anonymous; não alterar produção |
| Sessão/Avatar | Client existente persistSession/autoRefresh/getUser, lookup por conta, Avatar recuperado do banco. Nenhuma migração de localStorage como identidade ou posse |
| Site URL | A origem HTTPS real e estável da Preview de teste; ainda desconhecida, portanto `null`, sem PATCH |
| Callbacks | O código existente envia `/auth` ou `/auth?next=<rota interna codificada>` para confirmação. Validar origem e permitir somente esse destino no alvo. `next` continua relativo e restrito; não criar `/auth/callback` por suposição |
| Redirect allowlist | Origem escolhida e caminho `/auth`, contemplando a query interna revisada quando usada. Sem wildcard para todas as branches/projetos, sem localhost/fixture em configuração hospedada. [Redirect URLs oficiais](https://supabase.com/docs/guides/auth/redirect-urls) |
| E-mail de teste | Caixas sob controle do responsável; SMTP padrão só envia a endereços pré-autorizados da equipe e atualmente limita a2mensagens/hora. Para outros testadores, configurar SMTP próprio somente em nova autorização; não desabilitar confirmação como atalho. [SMTP oficial](https://supabase.com/docs/guides/auth/auth-smtp) |
| PostgREST | Expor somente schema público necessário; privados guild_invite_private/story_private/guild_ops/ebd_ops fora da API. Verificar grants **e** RLS reais; ambos são necessários. Não usar service_role no cliente. [Segurança da Data API](https://supabase.com/docs/guides/api/securing-your-api) |
| API econômica | Gate0078 continua aberto. Antes de conectar a app aos testadores, retirar canais de concessão/escrita não autoritativos ou aprovar cutover próprio e testar negativas com JWT real; UI oculta não fecha API |
| Env Vercel | Somente `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `APP_BASE_URL` do alvo de teste. Sem copiar produção, secret/service_role em NEXT_PUBLIC ou valor em Git/relatório |
| Build/CI | Novo SHA selecionado com CI próprio e env de teste validada. Artefato001 com fixture.invalid é somente teste local, não pacote para deploy. CLOUD007/pinned-preview antigo continuam intactos e não elegíveis |
| Proteção | Manter SSO/proteção do projeto de teste e validar callbacks/QR com testadores autorizados. Proteção de deployment não substitui Auth/RLS |

O changelog oficial foi lido; o aviso TLS de2026-10-12 afeta aparelhos antigos após2026-11-10 e entra no aceite físico futuro, sem alterar SDK/dependências nesta tarefa. [Aviso oficial](https://supabase.com/changelog/cbc-tls-ciphers-deprecated). Não reaberta a auditoria DEV encerrada.

## Operações futuras separadas

1. **Cotação:** organização escolhida pelo usuário e valor zero mensal consultados nesta tarefa. Revalidar se houver mudança de contexto/plano; isso não autoriza criar recurso.
2. **Criação:** somente aprovação específica de nome/organização/região/plano/custo; novo projeto vazio, sem copiar dados, sem extras. Nenhuma criação nesta tarefa.
3. **Verificação do alvo:** confirmar ref/região/plano/estado e separação de produção; coletar somente metadata schema/ACL/históricos/config depois do isolamento, sem dados reais/chaves em logs.
4. **Pacote SQL:** revisar hash congelado e critérios de concessão/ACL. P1 econômico impede GO irrestrito: não pedir aprovação genérica que ignore esse achado. Registro/aplicação de migrations e eventual cutover são autorização própria, com transação/backup/recuperação; nada aplicado aqui.
5. **Auth/env/e-mail:** aprovar valores desejados e a origem real, plano de caixas/SMTP e callbacks; depois configurar somente o alvo de teste. Ainda não executado.
6. **Push/CI/publicação:** escolher SHA completo, autorizar push e obter CI verde, aprovar método/projectId/Preview e verificar READY/URL/proteção. Não executar hook antigo, deployment ou produção neste contexto.

Próximo passo disponível: revisar e autorizar especificamente a criação vazia na organização escolhida, região `sa-east-1`, plano Free, cotação zero mensal, sem upgrade/add-ons. Mesmo após existir o projeto, migrations/aplicação/configuração continuam dependentes de seus gates, não de autorização inferida da criação.
