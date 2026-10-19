# TASK-0080 — Auditoria local de segurança

Data: 19/10/2026. Branch `codex/account-only-entry`; ponto auditado `17c63491540c9226779b50a2b303a819347e21a2`, preservado como ancestral. Checkout inicialmente limpo, sem divergências do relatório anterior. Autor assume Backend/Database/QA/Security; revisão pelo autor, não independente. Estado global **BLOCKED**. Nenhum acesso a projeto/dados remotos, push, deploy, novo secret ou configuração externa.

## Achados demonstrados e correções

| ID / prioridade | Evidência anterior | Impacto e correção | Evidência posterior |
| --- | --- | --- | --- |
| AUTH-01 / P1 | Dois testes novos falham: `INITIAL_SESSION` bufferizado reabre signedIn após getUser rejeitar a sessão; evento posterior aceita identidade divergente. security-auth-before.log: 6PASS/2FAIL. | O gate da interface aceitava eventos do SDK sem nova verificação; isso não demonstra bypass de RLS nem acesso remoto. A fila agora verifica getUser/ID/conta não anônima em cada sessão recebida; falha mantém signedOut, e os dados verificados substituem os claims locais. Bootstrap usa a mesma fila, sem duplicar verificação. | security-auth-after.log: 8PASS/0FAIL. Testes cobrem replay, ID divergente, logout/reentrada e restauração. |
| SQL-01 / P2 | PostgreSQL real: token ainda válido entra na consulta, espera lock e expira; prévia termina com sucesso indevido. security-sql-before.log: subteste FAIL e parent FAIL (2 nós reprovados, um único defeito). | O predicado temporal era avaliado antes da espera. `valid_invite` agora revalida expires_at com clock_timestamp após obter o lock. Mesmo helper protege prévia, resolução e pedido. Nenhum ingresso é autorizado pelo token. | security-sql-final.log: parent +3 subtestes PASS, zero skips. Prévia e pedido expirados durante espera negados; duas confirmações concorrentes retornam o mesmo pedido pending, sem membro. |

Corrigidos somente esses defeitos reproduzidos. A migration continua local e nunca aplicada remotamente; por isso o mesmo arquivo proposto foi corrigido, sem reescrever histórico aplicado. A fixture SQL agora inclui os índices únicos originais de um membro ativo por avatar e de um pedido pending por guilda/avatar, extraídos de0001. Não alterou a função de aprovação existente nem suas permissões.

## Fronteiras revisadas

- **Auth:** getSession restaura o SDK, mas não autoriza sozinho; getUser verifica identidade no bootstrap, nos eventos, na criação e na API de convites. Flag local antiga não concede sessão. Saves legados não são apagados/importados. Callback e next aceitam somente destinos internos previstos; display_name é apresentação, nunca papel de autorização.
- **Rotas:** o gate React impede a experiência do jogo sem conta; não é uma barreira de autorização do banco. Dados privados dependem de Auth/PostgREST/RLS/RPC. Páginas estáticas/bundles não devem conter dados privados. API de escrita exige Bearer verificado; chave pública apenas, sem service_role. Sem sessão, só preview é permitida, com nome/validade e token válido, nunca IDs/membros/líder.
- **Avatar:** create_traveler legado é invoker e deriva user_id de auth.uid; consultas de recuperação filtram user_id, além das políticas de propriedade em0000. registerTraveler rejeita sessão nula/anônima e identidades divergentes. Não foram alteradas hidratação, economia ou sincronização existentes.
- **Liderança:** SQL consulta propriedade do avatar, membro leader ativo e guilda ativa; não usa papel enviado pelo navegador nem user_metadata. Outros líderes não revogam convites de outra guilda. Token não concede administração; só identifica uma guilda para solicitar entrada.
- **RLS/ACL:** nova tabela em guild_invite_private, RLS habilitada, sem políticas de acesso direto e sem grants de tabela para anon/authenticated. Esse fechamento é intencional; funções definer privadas fazem as operações restritas. Wrappers públicos são invoker. search_path vazio, referências qualificadas, nenhuma montagem de SQL dinâmico. Helpers de identidade/linha não têm EXECUTE para clientes; a exceção pública é somente preview_invite, com saída limitada.
- **Tokens:** 32 bytes de pgcrypto, somente SHA256 armazenado; sete dias, limite10ativos, revogação e invalidação por guilda/líder inativo. API valida formato/tamanho, corpo2KiB e header8KiB; erros externos não repetem SQL, token ou credenciais. QR é local; WhatsApp só abre por clique, sem mensagem enviada pelo agente.
- **Transações:** criação serializa no registro da guilda antes de contar ativos; resolução/pedido mantêm locks share até terminar a transação; revogação faz update transacional. request_join_guild usa upsert sob índice parcial para idempotência. review_guild_join_request bloqueia o pedido, confere líder e associação existente; índice de um membro ativo por avatar impede associação concorrente duplicada. A prova nova cobre duas confirmações; não é prova formal de ausência de todos os deadlocks ou teste de carga. Erros não são repetidos automaticamente.
- **Índices/constraints:** hash único/32bytes para resolução, índice parcial guilda/validade para listagem/limite; FK para guilda/avatar, validade maior que emissão e no máximo7dias. Sem alteração de tabelas/valores econômicos nem das migrations0009/0010.
- **Logs:** código novo não registra tokens/corpos/sessões; diagnóstico Auth remove query; no-store/noindex/no-referrer nos caminhos pertinentes. Histórico, link compartilhado e logs do provedor continuam superfícies de token limitado e precisam do gate operacional antes do ambiente remoto.

## Nove alertas DEV — duas causas raiz

Audit renovado nesta sessão: **5high/4moderate/0critical**, mesmos nove pacotes; produção `--omit=dev`: **0**. Evidências security-audit-current.json e security-audit-production.json. Metadados npm e árvore instalada consultados em19/10; nenhuma dependência/lockfile foi alterada.

| Pacote instalado | Severidade / vínculo | Caminho relevante e prioridade | Correção disponível e risco da mudança |
| --- | --- | --- | --- |
| braces3.0.3 | Alta / transitiva | Causa A, micromatch→braces; recursão com padrão glob profundamente aninhado. **P1**. | Nenhuma versão corrigida publicada; latest3.0.3. Patch local não revisado ou troca de parser muda a semântica de glob e pode omitir arquivos do lint. |
| micromatch4.0.8 | Alta / transitiva | Causa A, fast-glob→micromatch→braces. **P1**. | Latest ainda usa braces^3.0.3. Atualizar sem remover a causa não resolve; override de parser é incompatível. |
| fast-glob3.3.1 | Alta / transitiva | Causa A, plugin Next→fast-glob→micromatch. **P1**. | Atualização isolada na mesma cadeia não elimina braces; troca/downgrade pode alterar seleção de diretórios. |
| @next/eslint-plugin-next16.4.2 | Alta / transitiva | Causa A, eslint-config-next→plugin→fast-glob. **P1**. | Versão alinhada ao Next atual; não substituir por plugin antigo nem desabilitar regras para ocultar o alerta. Regressão: perder checks de Next. |
| eslint-config-next16.4.2 | Alta / direta raiz | Causa A, dependência DEV do lint. **P1**. | Latest16.4.2; audit sugere downgrade14.2.35, não correção compatível com Next16/ESLint9. Regressão em flat config/regras; não aplicado. |
| esbuild0.18.20 (aninhado) | Moderada / transitiva | Causa B, Drizzle→esm-loader→core-utils→esbuild antigo. **P2**. | Advisory corrigido em>=0.25.0, mas core-utils exige~0.18.20. Override fora do range é mudança de API não comprovada; não aplicado. Outros esbuild instalados0.25.12/0.28.2 não são esse achado. |
| @esbuild-kit/core-utils3.3.2 | Moderada / transitiva | Causa B, loader usa transform/transformSync do esbuild. **P2**. | Latest3.3.2 ainda fixa~0.18.20. Migrar loader/upstream exige testes próprios de geração/TypeScript, não só fazer audit ficar verde. |
| @esbuild-kit/esm-loader2.6.5 | Moderada / transitiva | Causa B, Drizzle→loader→core-utils. **P2**. | A cadeia permanece na versão usada; remoção/troca afeta resolução ESM. Sem correção estável compatível comprovada. |
| drizzle-kit0.31.10 | Moderada / direta no workspace database | Causa B, ferramenta de geração; não atende requisições da aplicação. **P2**. | Latest estável0.31.11 ainda depende esm-loader^2.5.5. Audit sugere downgrade0.18.1; comandos/formato/snapshots podem regredir. Beta/RC não adotada. |

**Exploração no projeto:** A é alcançada pelo utilitário get-root-dirs do plugin, a partir de settings.next.rootDir, atualmente a constante versionada `apps/web/`. Não foi identificado caminho HTTP/formulário/convite que forneça padrões glob ao linter. Isso reduz exposição, mas não resolve a severidade alta; P1 continua bloqueando o ambiente remoto conforme o pedido. CI que executa código de PR não confiável exige isolamento e ausência de secrets; a automação não foi alterada.

B exige o recurso serve do esbuild antigo para expor respostas por CORS. O loader instalado chama transform/transformSync; não foi identificado uso de serve nessa cadeia. A configuração Drizzle só prepara generate, sem credentials de banco nem servidor Studio; a porta web de teste pertence ao Next, não ao esbuild0.18.20. O risco é moderado e condicionado à ativação daquele servidor; manter a ferramenta fora da preview e não iniciar Studio/serve. Os quatro P2 podem ter tratamento próprio, sem rebaixar os cinco P1. Nenhum P0 ou P3 atribuído; nove entradas não representam nove vulnerabilidades independentes.

**Decisão:** não executar audit fix/force, downgrade, instalação, override de esbuild ou atualização0.31.11 sem efeito. Manter os alertas visíveis e o gate BLOCKED. Reavaliar upstream ou propor correção limitada em trabalho com teste de compatibilidade antes de hospedar. Não há aceite tácito de risco.

## Limites e riscos ainda abertos

1. **P1 aberto:** cadeia braces sem patch compatível publicado; bloqueia próxima execução remota pela instrução do usuário.
2. **P1 condicional de configuração:** create_traveler/políticas legadas em0000 conferem auth.uid/propriedade, mas não is_anonymous. Se Anonymous Sign-ins estiver habilitado no alvo, um cliente fora da UI poderá criar avatar próprio sob conta anônima. A TASK-0080 bloqueia isso na UI e nos convites, mas não certifica o endpoint legado. Configuração hospedada não consultada; revisar no preflight e, se necessário, preparar contrato/revisão específica do controle servidor, sem desativar Auth ou alterar políticas existentes silenciosamente. Nunca confundir flag local sem JWT com conta anônima válida do Supabase.
3. **P2 aberto:** cadeia esbuild, retenção/redação de logs e proteção de abuso da prévia pública devem ser revisadas no ambiente autorizado. Limites de corpo/token não equivalem a rate limiting de infraestrutura.
4. SQL local usa PostgreSQL17.6.1.166 sintético, não o stack Auth/PostgREST hospedado nem um clone do banco real. Advisors oficiais do alvo não foram executados nesta sessão sem acesso remoto autorizado. Revisão estática e ACLs locais não substituem esse gate.
5. Aceite de e-mail/callbacks, isolamento de duas contas, persistência entre aparelhos, câmera real, configuração/schema hospedados e aprovação E2E real continuam pendentes. A economia existente pertence à TASK-0078 e não foi auditada/corrigida por este recorte; não habilitar seus fluxos para contornar gates.

## Validação desta rodada

- Direcionados: security-unit-final.log, **40PASS/6arquivos/0FAIL/0SKIP**, AuthProvider, tela de entrada, retorno, API, registro e cache online.
- SQL real: security-sql-final.log, **1 integração com3 subtestes de concorrência**,4 nós PASS/0FAIL/0SKIP; fixtures sintéticas, container descartável sem rede/portas/mounts reais. Falha anterior preservada.
- Lint: security-lint.log PASS. Tipos: security-types.log PASS. Build: security-build.log PASS, configuração pública fictícia, gates de artefatos aprovados. E2E: security-e2e.log **27PASS/0FAIL/0SKIP/0retry**, Chromium desktop/mobile e WebKit mobile.
- Suíte unitária completa470 anterior reutilizada como baseline; os dois novos casos estão nos40 direcionados. Não declarar472 testes executados nesta rodada. E2E da entrada repetido pela mudança transversal no AuthProvider; suíte geral de gameplay não repetida.

## Fontes primárias

[braces GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [esbuild GHSA-67mh-4wv8-2f99](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99), [Supabase funções](https://supabase.com/docs/guides/database/functions), [PostgreSQL locks](https://www.postgresql.org/docs/17/explicit-locking.html), metadados públicos npm e fontes instaladas nas versões da tabela. Nenhum PoC executado contra serviço real.

Changelog Supabase consultado via HTTPS; ferramenta web não aceitou text/markdown, então o índice público foi lido por fetch local. Mudanças pertinentes revisadas: [TLS HTTP](https://supabase.com/changelog/cbc-tls-ciphers-deprecated) e [Postgres17.11/pgcrypto](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes). SHA256/aleatoriedade usados aqui não dependem dos cifradores PGP legados; confirmar versão/extensão do alvo, sem upgrade ou alteração remota nesta sessão.
