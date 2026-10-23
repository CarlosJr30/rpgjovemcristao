# FIX-PROD-002 — Recuperação dos Sistemas de Combate

ID: FIX-PROD-002
TITLE: Recuperar equipamentos e verificar Arena/Torre com autoridade preservada
OBJECTIVE: Corrigir defeitos comprovados sem repetir entregas, conceder cartas ou enfraquecer economia; publicar somente após gates reais.
PRIORITY: P1 High
STATUS: BLOCKED
SCOPE: Diagnóstico GitHub/Vercel/Supabase; equipamentos e seus adaptadores/UI/atributos/avatar; autoridade e testes relevantes; preparação de homologação de cartas/Torre; conferência da identidade e processo administrativo de Guilda/EBD; migration incremental somente se necessária/aprovada e após backup/gates; relatório, evidências e memória.
OUT_OF_SCOPE: Concessão automática de cartas/prêmios/XP/níveis; service_role à conta; reconciliação econômica automática; reset/recriação de tabelas/contas; alterações não relacionadas ou Git destrutivo.
DEPENDENCIES: Sessão real autenticada acessível do Teste Chat A; catálogo e recompensas homologados para testes positivos oficiais; aprovação visual do corpo alvo; backup atual verificado antes de escrita de produção. FIX-PROD-001 deixou de ser dependência: Carlos confirmou que era somente um plano sem execução comprovada.
ASSIGNED_AGENT: Orquestrador assume Backend/Database/Frontend/QA/Security/DevOps no escopo acima, sem subagentes; ampliação dos perfis registrada por autorização explícita do pedido vigente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT; CURRENT_STATE; RELEASE_POLICY; WORKFLOW/RULES/SECURITY/TOKEN_POLICY/ORCHESTRATOR; fontes e testes afetados; DEPLOY-005; FIX-PROD-001 quando localizado.
SECURITY_CONSIDERATIONS: Confirmar UID por sessão autenticada antes de testar/mudar permissões. Dois Teste Chat A distintos exigem seleção pelo ID; nenhum privilégio por nome/nível. Preservar RLS/Auth/locks/idempotência/saves/dados reais; catálogo vazio não autoriza semear cartas. Pedido atual autoriza verificar aparência antes cancelada, limitado aos equipamentos existentes e assets aprovados, sem retomar automaticamente o projeto Body-Fit ou ativar mídia não homologada.
ACCEPTANCE_CRITERIA:
- Diagnóstico com causas e evidências, sem repetir correções concluídas.
- Equipamentos autoritativos com propriedade, atributos, persistência e ausência de duplicação/perda; conta de teste validada.
- Arena/Torre testadas com sete cartas homologadas/posse/uso único/progressão/encerramento/recibos ou bloqueios explícitos e homologação preparada.
- Liderança somente no processo administrativo autorizado após UID autenticado confirmado; auditoria registrada sem privilégios globais.
- Gates obrigatórios reais antes de produção, CI do SHA exato e confirmação remota de publicação; caso bloqueado, produção preservada e relatório por item DONE/BLOCKED/REWORK.
TEST_PLAN:
- Unit/integration, PostgreSQL/RLS/Auth/autoridade/equipamentos/Arena/Torre; lint/typecheck/build; navegador/mobile quando disponíveis.
- SQL de produção inicialmente somente leitura; sem mutação de dados reais para testes. Positivos sintéticos apenas em clone offline isolado.
- Registrar PASS somente para executados; pendências não viram N/A ou PASS.
DEFINITION_OF_DONE:
- Todos os aceites e gates comprovados; relatório, memória e estado remoto conferidos. Falha exige REWORK; dependência indispensável ausente exige BLOCKED.

## Verificação inicial

- Política permanente lida; alterações locais e worktrees inventariadas/preservadas. Root permanece integration/chat-notebook-20261014; não é fonte de produção.
- Fetch remoto: origin/main 5edc93f5857b26a59b183e8abfb963110831f90c; Vercel produção mesmo SHA, dpl_H9aXo2mnhWvk2PD6BwQowpxeaiVv READY. MCP Vercel recusou escopo (403); CLI autenticada existente confirmou destino, sem alterar acesso.
- Nenhum arquivo/log de commit/branch/pesquisa GitHub localizou FIX-PROD-001. Carlos esclareceu que foi somente planejado, sem execução comprovada; requisito removido e busca encerrada. FIX-PROD-002 é a primeira correção.
- Supabase wspafhlbtlpabypzymjo / RPGJOVEMCRISTAO / ACTIVE_HEALTHY; 30 tabelas públicas RLS, zero sem RLS, zero cartas homologadas ativas.
- SQL somente leitura encontrou Teste Chat A ativo nível50, membro ativo. Avatar antigo homônimo nível1 é líder da mesma guilda e pertence à mesma conta. Ambos economic_verified_at NULL. Identificadores completos somente no diagnóstico privado local, sem publicar dados de conta desnecessários no Git. Não confundir registro no banco com UID de sessão autenticada.
- Controle de navegador e runtime Computer Use falharam ao inicializar: "failed to write kernel assets". Sessão real não disponível; informação solicitada. Nenhuma conta/permissão/economia alterada.

## Candidata local validada — publicação de produção BLOCKED

- Checkout isolado em C:/Users/carlo/rpg-worktrees/fix-prod-002, branch codex/fix-prod-002, base 5edc93f. Novo caminho evita falta de disco em D:; todas as worktrees e pendências anteriores preservadas. npm ci exato do lockfile local, sem upgrade/dependência nova.
- Equipamentos: novo RPC proposto para seleção atômica de item já possuído; owner/Auth, catálogo/slot fixos, quantidade positiva, CAS, locks, replay seguro e bloqueio em combate. Nenhum saldo, inventário, atributo-base, reconciliação ou grant econômico alterado. UI aguarda confirmação+releitura; falha não finge sucesso e não produz snapshot econômico local. Reload não grava resposta de conta anterior após troca de sessão.
- Proposta SQL packages/database/proposals/fix-prod-002-equipment.sql ensaiada somente em clone offline. Não é migration aplicada nem catálogo aprovado. RLS/grants antigos, guarda econômica e código de Arena/Torre preservados.
- SELF VALIDATE/QA/Security/React pelo autor, sem independência: revisão de owner/slots/SQL qualificado/search_path/grants mínimos, ausência de secrets, operações sem snapshots econômicos e erros/cleanup/ocupação de UI. Nenhum achado crítico/alto aberto na candidata local; gates hospedados continuam pendentes.
- Unit/integration comum: 698 PASS, 0 FAIL, 41 opt-in SKIP declarados; novos testes de cache/confirmar/falhar/sessão incluídos. PostgreSQL opt-in executado separadamente: 37 PASS, 0 FAIL, 0 SKIP (28 autoridade e 9 equipamentos), sem rede/portas e sem dados reais. 25 testes de protocolo CI PASS. Lint e TypeScript completos PASS, build final PASS; isolamento969artefatos/0achados e4camadas corporais aprovadas preservadas.
- Browser local: 6 PASS, 0 FAIL/SKIP/RETRY/FLAKY; Chromium1440/320 e WebKit390. Equipar/desequipar/atributos/persistência/erro409 e Arena/Torre sem servidor bloqueadas, sem overflow/pageerrors. Auth/Data API positivos são mocks HTTP sintéticos, não prova hospedada. Chromium verifica reload; WebKit verifica novo documento no mesmo contexto, sem cancelar prefetches do anterior. Não alegar aparelho físico.
- REWORK preservado: primeira PG24PASS/13timeouts5s, final serial/60s37PASS; primeira suíte comum697PASS/1timeout/41skip, final dois workers/15s698PASS. Primeiro build recusou junction fora do root, resolvido npm ci local. Duas rodadas browser5PASS/1FAIL de cancelamento de prefetch WebKit; corrigida navegação de teste pela UI/novo documento, sem filtrar pageerrors. Sem mudanças de regra de combate para passar testes.
- Homologação preparada em docs/architecture/FIX-PROD-002-HOMOLOGATION.md: sete cartas propostas sem aprovação/concessão, Torre com recompensa bloqueada, corpo alvo incompatível com as quatro camadas existentes, processo administrativo de liderança com auditoria ainda não executado.
- Carlos informou Chrome logado. Controle ainda falha após reset; sessão/JWT real não verificados. Não conceder liderança por nome ou por SQL com claims simulados. Zero alterações de permissões/contas/dados reais.
- Vercel: somente duas Configs públicas específicas da branch Preview apontando ao Supabase de testes confirmado. Nenhuma variável de produção alterada e nenhuma chave privada copiada. Primeira tentativa de Config recusou branch inexistente, sem escrita; branch criada por API antes da configuração. CI do commit e Preview serão conferidos após push; resultados finais no relatório local e memória.
- BLOCKED para produção: Auth real/acesso de navegador; homologação cartas/aquisição/recompensas; reconciliação do legado para combate; aparência do corpo alvo; validação administrativa de liderança e backup atual para qualquer escrita produtiva. Nenhuma migration ou deploy de produção nesta tarefa enquanto esses gates permanecerem pendentes.
