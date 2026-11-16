# GUILD-031B — interface de criação e convites

15/11/2026. **PARTIAL; sem publicação.** PR #55 permanece OPEN/Draft na cabeça remota `eda57bea2c716ef9e1040b17c6dfaa161d3ddaed`. CI anterior desse SHA passou; não valida estas alterações locais. Nenhum commit, push, merge, migration, ativação ou deployment foi feito.

## Implementado localmente

- A seleção da nova criação não depende mais de `NEXT_PUBLIC_COMMUNITY_CREATION_TEST` nem da URL do backend. O escopo consulta, pelo cliente Supabase autenticado, o contrato `community_own_guild_capability(p_actor)`, valida a sessão/avatar antes e depois, aceita somente `{version:1, available:boolean}` e falha fechada para RPC ausente, erro ou resposta inválida.
- Quando a capacidade própria vem autorizada, a interface usa `community_create_own_guild`; a autoridade transacional continua no banco. O fluxo antigo de liderança continua usando `createScoped` quando autorizado pelo status anterior. Criador e gestão existente continuam chegando a links/QR, revogação e análise de pedidos pela mesma Guilda/`CommonInvites`.
- Mensagens de criação permanecem genéricas; códigos de conta já criadora, sessão/avatar e limite de participações mantêm textos simples. RPC inexistente é apresentada como indisponibilidade.
- Convites, componentes, estilos e rotas existentes foram reutilizados; nenhum CSS ou serviço externo foi adicionado.

## Validação local

- Testes direcionados: **20/20 PASS** em `community-creation`, `release-ebd/guild`, `guild-governance/scope` e `guild-invites/invite-panel`. Cobrem capacidade aprovada/negada/ausente, caminho próprio e legado, aprovar/rejeitar, e link/WhatsApp/QR/revogação.
- ESLint dos arquivos afetados: PASS, zero warnings. TypeScript `next typegen && tsc --noEmit`: PASS. Build de produção Next 16.4.2 e gates de artefatos: PASS.
- Dependências reutilizadas de worktree irmão com lockfile igual e workspaces de jogo comparados idênticos; nenhum pacote foi instalado. O primeiro build falhou porque Turbopack não seguiu o junction; o retry usou raiz Turbopack temporária, compilou e passou. Configuração foi restaurada byte a byte, junction removido, `next-env.d.ts` restaurado e `git diff --check` PASS.
- **Mobile visual: não homologado.** Os componentes preservam classes e breakpoints responsivos existentes; não foi feita inspeção de viewport autenticada. Nenhum smoke hospedado foi realizado nesta tarefa.

## Dependência e bloqueios

- `community_own_guild_capability` **não existe** nas migrations COMMUNITY atuais nem no pacote PROD preparado. O cliente está fail-closed e exibirá indisponibilidade até essa leitura autenticada ser implementada/revisada no backend e entregue por migration aprovada. O status antigo `canCreateAdditionalGuilds` não é substituto: ele representa delegação de liderança e não a capacidade de criação própria para todos os jogadores.
- A interface só exibe a nova opção quando a autoridade de capacidade disser `available=true`; na submissão, o RPC transacional atual revalida as regras. A interface não altera elegibilidade, quotas ou flags. A criação própria continua sujeita à elegibilidade e revogação definidas no SQL aprovado.
- Os testes e o CI do novo SHA permanecem pendentes. A alteração ainda não foi enviada à PR porque a branch Preview está conectada e a tarefa proíbe deployment. Até o envio controlado, o SHA remoto e CI antigos não podem ser atribuídos ao código local.
- Recuperação PROD e política de retenção continuam BLOCKED/PENDING conforme GUILD-031A; não houve alteração em Supabase, Vercel, jogadores ou contratos de convite.

**Estado:** interface preparada localmente, integração backend incompleta e sem CI do SHA alterado. Não declarar funcionamento publicado nem `DONE`. Próxima dependência técnica: aprovar/implementar a RPC de capacidade no pacote de banco com ACL e testes isolados; depois decidir um caminho de CI que não inicie deployment, e realizar validação visual móvel/hospedada autorizada.
