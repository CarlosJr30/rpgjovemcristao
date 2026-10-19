# TASK-0080 — Plano de validação isolada

**PREPARADO, NÃO EXECUTADO — BLOCKED.** Este documento não autoriza criar projetos, secrets, contas, configurar serviços, aplicar SQL, enviar commits ou publicar. Não há ambiente remoto novo, URL ou domínio atribuído. Não usar localhost/domínio fictício em convites hospedados. Riscos e parecer: [auditoria](../security/TASK-0080-SECURITY-AUDIT.md).

## Gate 0 — Autorização e riscos

- [ ] Resolver os cinco P1 da cadeia braces com correção compatível/revisada; sem patch estável disponível em19/10/2026. Os quatro P2 da cadeia esbuild devem ter responsável/tratamento e não ter serve/Studio ativado. Não considerar a ausência de exploit HTTP uma correção.
- [ ] Revisar AUTH-01/SQL-01 corrigidos, testes e diff posterior a17c6349; confirmar SHA exato candidato e checksum do SQL. Revisão pelo autor atual não equivale a revisão independente do alvo.
- [ ] Registrar autorização específica para preparar o ambiente separado e, em outro gate, para aplicar o manifesto SQL revisado. Push/deploy continuam fases próprias, com aprovação exigida por este pedido.
- [ ] Definir responsável, janela, teto de custo, expiração do ambiente e recuperação. Nenhum serviço pago ou exclusão automática autorizado aqui.

Evidência exigida antes de prosseguir: responsável/data/escopo da aprovação, SHA candidato, achados P1 resolvidos. Campo em branco mantém BLOCKED.

## Gate 1 — Identidade e isolamento, antes de qualquer migration

- [ ] Projeto Supabase separado, identificador/organização/região e host confirmados pelo responsável no painel; diferente do projeto de produção. `current_database() = postgres` sozinho não identifica o projeto.
- [ ] Alvo vazio ou contendo exclusivamente fixtures desta tarefa; nenhum clone/dump de produção, personagem real, e-mail pessoal, dados de chat ou secrets de produção.
- [ ] Projeto/preview Vercel isolado, sem alias de produção e sem ligação automática com main. Confirmar que as configurações públicas e de servidor apontam para o mesmo Supabase de teste. Não editar o projeto rpgjovemcristao-web nem a automação CLOUD nesta fase.
- [ ] Registrar origem HTTPS autorizada emitida pelo provedor/domínio validado e vínculo com o deployment candidato. Não derivar de Host/X-Forwarded-Host nem escolher domínio de exemplo. Não copiar configuração Production para Preview sem revisão.
- [ ] Observar versão PostgreSQL/pgcrypto, dono das funções, roles anon/authenticated e exposed schemas reais. A base local17.6 não certifica um alvo atualizado17.11; revisar changelog e compatibilidade antes da aplicação, sem desativar proteções.
- [ ] Plano de recuperação do alvo exclusivamente de teste aprovado. Preservar tabela/pedidos em eventual rollback; não propor restaurar produção ou apagar personagens. Backup só se necessário e autorizado, em canal privado.

Recibo sem secrets: IDs públicos do projeto/deployment, SHA, origem, nomes das variáveis/alvos e resultado dos checks. Não copiar valores de chaves/tokens, dumps ou dados pessoais para chat/Git/logs.

## Gate 2 — Configuração Auth/API, ainda antes da migration nova

| Item | Valor/controle a confirmar no alvo isolado |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Host do projeto de teste, HTTPS; comparar identidade com o painel. |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Publishable key daquele projeto; somente o nome e o alvo entram no recibo. Nunca secret/service_role. |
| APP_BASE_URL | Origem HTTPS real da preview, sem credentials/path/query/hash; valor validado pela aplicação. Não deve apontar para produção. |
| Auth Site URL / Redirect URLs | Origem autorizada e callback `/auth` compatível com `?next=` validado; revisar matching de query no Supabase. Usar regra mínima de callback nessa origem exata, sem liberar wildcard de qualquer domínio. |
| Cadastro/e-mail | Respeitar confirmação existente; testar sessão imediata e fluxo exigido pelo alvo sem desabilitar controles. Provider/e-mails de teste próprios e aprovados; nenhuma conta real nesta etapa. |
| Anonymous Sign-ins | Verificar configuração; endpoints legados usam auth.uid e não proíbem is_anonymous. Se habilitado, parar para revisão do controle servidor/contrato, sem desabilitar Auth silenciosamente. Validar tentativa direta de API no futuro ambiente de teste. |
| PostgREST | Schema public exposto conforme base; guild_invite_private fora de exposed schemas. SDK envia JWT do usuário, sem role autodeclarada ou service key. |
| Logs/telemetria | Remover/redigir caminho `/guilda/convite/<token>`, query next, corpos e Authorization dos acessos/erros/APM; definir acesso/retenção. Verificar também logs PostgREST/DB. As regras locais do Next não configuram o provedor. |
| Abuso | Avaliar limite de requisições/tempo e custos da prévia pública no alvo autorizado. Não instalar rate limiter ou mudar firewall remoto nesta preparação. |
| Browser/callbacks | HTTPS/TLS atuais no celular e desktop; callback não pode vazar sessão por referer/analytics. Não armazenar token completo em fixture compartilhada ou ferramenta externa de QR. |

Não é necessária service_role para a funcionalidade nova. Não criar ou copiar secret para suprir requisito inexistente. Não configurar DATABASE_URL da produção para geração/local.

## Gate 3 — Manifesto e preflight SQL

- [ ] Inventariar por catálogo/histórico o schema realmente presente no projeto de teste, sem presumir que o frontend cria tabelas.
- [ ] Em alvo vazio, preparar manifesto separado e revisado do baseline da aplicação até0008, incluindo Auth gerenciado, create_traveler e dependências de Guilda. Não executar automaticamente os arquivos pelo nome; excluir todos `.down.sql` e qualquer SQL de outra tarefa.
- [ ] Nova migration única desta funcionalidade: `packages/database/migrations/20261019054314_guild_link_invites.sql`, já contendo SQL-01 corrigido. Não depende das migrations econômicas0009/0010. Não importar a integração TASK-0078 como atalho.
- [ ] Conferir pgcrypto no schema extensions (`digest(text,text)`/`gen_random_bytes(integer)`), auth.users/is_anonymous, tabelas guilds/travelers/guild_members/guild_join_requests, funções owns_traveler/request_join_guild/review_guild_join_request, constraints/índices únicos originais e RLS das tabelas expostas.
- [ ] Confirmar que guild_invite_private/novos wrappers não existem, ou parar e reconciliar o histórico. O arquivo novo usa CREATE e não é idempotente; não reaplicar sobre objetos existentes.
- [ ] Revisar owner e ACL esperados. SQL ainda não está em `meta/_journal.json` do Drizzle; não presumir que db:generate ou um deploy o aplica. Selecionar processo transacional explícito do arquivo/checksum aprovado, com registro de histórico compatível com a ferramenta escolhida. Nenhum comando `db push`, `migrate --all` ou varredura do diretório preparado para execução automática.

Consulta de catálogo sugerida para a futura sessão autorizada, **não executada remotamente**:

```sql
BEGIN READ ONLY;
SELECT current_database(), current_setting('server_version');
SELECT extname, extversion, extnamespace::regnamespace
FROM pg_extension WHERE extname = 'pgcrypto';
SELECT to_regprocedure('extensions.digest(text,text)') IS NOT NULL AS digest_present,
       to_regprocedure('extensions.gen_random_bytes(integer)') IS NOT NULL AS random_present,
       to_regprocedure('public.request_join_guild(uuid,uuid)') IS NOT NULL AS join_present,
       to_regprocedure('public.review_guild_join_request(uuid,uuid,boolean)') IS NOT NULL AS review_present;
SELECT n.nspname, c.relname, c.relrowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public','guild_invite_private')
  AND c.relname IN ('travelers','guilds','guild_members','guild_join_requests','link_invites');
SELECT indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN ('guild_members_one_active_guild_per_traveler_idx','guild_join_requests_one_pending_idx');
ROLLBACK;
```

Esses SELECTs não comprovam ausência de dados reais, identidade do projeto, tokens JWT, permissões em execução ou aprovação para DDL. Tais evidências exigem os gates anteriores; não transformar sucesso do preflight em autorização automática.

## Gate 4 — Aplicação futura e verificação imediata

- [ ] Somente após aprovação específica, aplicar apenas o manifesto/arquivo revisado no projeto isolado, registrar checksum, transação, versão e executor; falha exige rollback da transação e diagnóstico, não desativar RLS.
- [ ] Conferir RLS habilitada na tabela nova e falta de SELECT/INSERT/UPDATE/DELETE direto para anon/authenticated; schema privado não exposto.
- [ ] Conferir SECURITY INVOKER nos6wrappers públicos e definer/search_path vazio nas funções privadas. EXECUTE de anon somente na prévia limitada; helpers de identidade/linha nunca diretamente executáveis pelo cliente.
- [ ] Executar advisors oficiais no alvo autorizado e revisar findings, sem aplicar correções automáticas.
- [ ] Testar via PostgREST com JWT real de fixtures: sem Bearer, JWT inválido, conta anônima se aplicável, jogador comum, líderA, líderB. Nenhum token completo entra no relatório.
- [ ] Sem API/RLS e configuração comprovadas, não passar ao teste funcional nem publicar preview para usuários reais.

## Gate 5 — Aceite ponta a ponta em dados fictícios

Criar somente após autorização contas fictícias de líderA, líderB e jogador, com caixas de e-mail próprias de teste sob controle do responsável. Não criar IDs privilegiados pelo navegador nem promover papel sem processo de fixture autorizado. Nenhuma conta foi criada por este plano.

| Cenário | Evidência esperada |
| --- | --- |
| Cadastro normal sem convite / login / logout / reentrada | Sessão válida; flag local e credenciais inválidas não liberam jogo; sem confirmação extra pela UI. |
| Conta anônima / avatar de outra conta / JWT inválido | Acesso ao recurso privado/pedido negado no servidor, sem depender do botão oculto. |
| Avatar entre aparelhosA/B | Mesmo avatar recuperado após login, sem copiar localStorage; conta diferente não lê/ativa/edita o avatar. Não modificar XP/inventário como procedimento de teste. |
| Líder gera QR/link real | URL da origem de teste, sem IDs/sessão; token guardado apenas pelo teste autorizado; copiar e WhatsApp somente por ação do operador. |
| Câmera física / prévia / cadastro ou login / avatar | Nome mínimo, retorno ao mesmo convite e confirmação explícita; pedido pending, sem associação automática. |
| Aprovação | Jogador e outro líder não aprovam indevidamente; líder correto aprova pelo fluxo existente; associação ativa única. |
| Negativos de convite | Token inválido/expirado/revogado, guilda arquivada ou líder removido não aceitos; não vazam detalhes ou dados da guilda. |
| Concorrência | Duas confirmações produzem um pedido; espera por lock não permite aceitar convite já expirado; duas aprovações não geram duas guildas ativas. Usar somente fixtures, sem alterar funções para facilitar o teste. |
| Logs/headers | no-store/no-referrer/noindex e logs sem token/query/sessão; sanitizar capturas antes de compartilhar. |
| Compatibilidade | Chromium desktop, Chromium/WebKit mobile e dois aparelhos reais, toque/formulários/câmera. TLS suportado pelo provedor. |

## Encerramento e pendências

Registrar SHA exato da preview, identidade separada do banco, versão SQL/checksum, contagens PASS/FAIL/SKIP, aparelhos/navegadores, evidências redigidas, findings e responsáveis. Não declarar sucesso por build ou mocks. Reverter frontend/desabilitar somente o acesso novo conforme plano aprovado; não reintroduzir modo local nem apagar personagens para fazer os testes passarem.

Agora: código/SQL e plano locais preparados. **Pendente de autorização:** criação/configuração do ambiente, contas, aplicação SQL, push e preview. **Pendente de execução/evidência:** todos os gates hospedados/físicos. TASK-0080 permanece BLOCKED; main/produção/TASK-0078/CLOUD preservadas.

Referências: [Redirect URLs Supabase](https://supabase.com/docs/guides/auth/redirect-urls), [Data API e grants/RLS](https://supabase.com/docs/guides/api/securing-your-api), [funções e permissões](https://supabase.com/docs/guides/database/functions). Conferir novamente a documentação quando a execução futura for autorizada.
