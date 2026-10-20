# Consolidação001 — escopo e checklist da Preview isolada

Base consolidada: `6a683f4b690e54c19a56aaaf41e89861faa6e510`. Este plano prepara uma Preview; não é publicação, autorização remota nem evidência de ambiente pronto. Estado remoto atual **não consultado**, conforme proibição deste contexto.

## Dependências por impacto

| ID | Prioridade | Evidência / bloqueio | Alcance e condição para liberar |
| --- | --- | --- | --- |
| ENV-TEST | P0 | Último recibo0080 não identificou Supabase RPG de teste; estado atual desconhecido | Impede qualquer Preview conectada: identificar/criar alvo exclusivo, comprovar ausência de produção/dados reais e configurar somente chaves desse alvo |
| AUTH-TEST | P0 | SDK exige configuração; mocks não comprovam Auth/JWT/RLS/callbacks reais | Login e identidade só liberados após verificação hospedada. Anonymous Sign-ins devem permanecer desabilitados enquanto endpoints legados não distinguirem conta anônima |
| SQL-ACCOUNT | P0 para Preview autenticada com Avatar/Guilda | Baseline e QR existem localmente, não comprovadamente no alvo; journal não contém QR | Revisar schema efetivo, aprovar manifesto e aplicar somente no alvo de teste; nunca usar schema fictício ou assumir journal igual a banco |
| ECON-LEGACY | P1, obrigatório antes de expor estado econômico | Teste cumulativo reproduz UPDATE próprio de XP/saldo no baseline; plano0078 já registra fronteiras cliente | Desabilitar concessões e escritas econômicas na API/ACL/RPC por escopo aprovado; ocultar UI não resolve. Se essas APIs permanecerem expostas, **não há GO** para aquela configuração da Preview |
| MISSIONS-EBD | P1 para os novos editores | Propostas0082/83 coexistem no teste local, mas não estão registradas/aplicadas | Aplicar cutover revisado e validar isolamento/roles reais; aprovação/avaliação mantém recompensa pendente |
| STORY-COMPLETE | P1 para concluir histórias | Conteúdo/vídeos/validador e recibo econômico pendentes; flags SQL começam false | Mapa e consulta podem estar disponíveis; não anunciar história incompleta como jogável, concluir ou premiar |
| COMBAT-AUTHORITY | P1 para combater com resultado oficial | Replay/checkpoint cliente não é autoridade; [plano existente](TASK-0085-ARENA-AUTHORITY-PLAN.md) | Sem prêmio Arena/Torre até servidor validar sessão, posse, comandos, resultado e recibo0078 |
| PIPELINE-TARGET | P1 para publicação | Publicador CLOUD fixa outro projectId e demonstração revisada; branch atual não elegível | Fluxo posterior deve apontar explicitamente ao projeto autorizado de teste e SHA com CI verde; não atualizar hashes antigos para contornar gate |
| CARDS | P2 enquanto combate indisponível | APPROVED_ARENA_CARDS vazio; produto bloqueia baralho/Torre | Pode permanecer assim na Preview. Habilitar combate exige catálogo, aquisição, posse, arte/efeitos e gate de autoridade; não inserir cartas sintéticas |
| AUDIO | P2 com silêncio e aviso | APPROVED_MUSIC/EFFECTS vazios; protótipos DEV isolados | Controles/transições podem ser testados sem som; arquivos e licença oficial não impedem testar Guilda/EBD |
| CHESTS | P2 com abertura indisponível | Apresentação exige recibo autenticado; integração econômica/hardening0078 pendentes | Consulta/revisão de recibo legítimo pode ser liberada; abertura/compra/concessão ficam desabilitadas até gate econômico |
| PHYSICAL | P2 para entrada limitada de testadores, P1 para homologar câmera/múltiplos aparelhos | Evidências locais são emulação, não aparelhos | Smoke hospedado antes de convidar; QR por câmera e sincronização real só aceitos após teste físico próprio |
| LATER | P3 | Sem melhoria adicional necessária para este contrato | Otimizações posteriores dependem de medição; não abrir nova funcionalidade nesta rodada |

P0 se refere à configuração concreta que será publicada, não a todos os bloqueios históricos. Cartas, música e conclusão de histórias podem continuar indisponíveis sem bloquear Guilda/EBD. Em contrapartida, uma API econômica permissiva não fica segura por esconder o botão: antes do GO, provar negação no servidor ou retirar completamente a superfície do escopo exposto.

## Menor escopo seguro proposto

| Capacidade | O que pode ser disponibilizado após os gates de ambiente/permissões | Exclusão explícita |
| --- | --- | --- |
| Conta e Avatar | Cadastro/login/logout, recuperação e seleção de Avatar próprio; criação pela RPC existente | Não usar sessão local/anônima como conta; não permitir cliente escrever XP/nível/saldo/stats/posse |
| Convites/Guilda | QR/link, prévia mínima, pedido e aprovação pelo líder; missão/desafio e correção auditada | Sem associação automática ou crédito por aprovação |
| EBD | Professores autorizados, aula/questionário, resposta/avaliação, presença e calendário | Sem prêmio concedido pelo cliente; ensinar não concede papel global |
| História | Mapa dos nove mundos, páginas e leitura/preparação claramente identificadas | Sem afirmação de capítulo pronto, vídeo assistido ou recompensa enquanto faltarem dependências |
| Arena/Torre | Prévia, atributos, Meu Baralho e mensagem de catálogo indisponível, sete andares bloqueados | Sem cartas de demonstração no produto ou combate premiável |
| Baús | Visualização de recibos históricos legítimos somente após RLS/ownership reais | Sem nova abertura/compra/grant antes do gate0078; fixture nunca vira saldo |
| Áudio | Preferências, acessibilidade, silêncio em estudo e prioridade de vídeo | Nenhuma mídia Suno Free promovida à produção |

Esse perfil **ainda não está aplicado** como nova configuração de disponibilidade. A branch contém o runtime0089 intacto. Gates legados de UI não são um mecanismo geral de bloqueio da API. O plano de ACL/cutover e os avisos/rotas indisponíveis precisam de contrato e validação próprios antes da publicação; não afirmar que a Preview já está segura ou jogável.

## Checklist operacional, preparado e não executado

- [x] Base e ancestralidade0080–0089 verificadas; worktree separado; nenhuma reaplicação.
- [x] SQL local cumulativo, fluxo de identidade, isolamento Guilda/EBD e corte de RPCs antigos testados em banco sintético offline.
- [x] Separar testes locais com SDK interceptado de aceite Auth/PostgREST hospedado.
- [x] CI antigo permanece sem autorização para publicar esta branch; nenhuma configuração remota alterada.
- [ ] **Identidade Supabase:** confirmar nome/ref/organização e finalidade exclusiva de teste; não reutilizar projeto de outro produto nem produção. Se ausente, criação mínima sem custo/upgrade automático, mediante autorização específica.
- [ ] **Autenticação:** decidir e registrar política de cadastro/confirmar e-mail/recuperação, desabilitar Anonymous Sign-ins no alvo legado, configurar URLs de callback/redirect exatas e testar token inválido/expirado/logout. Nenhum secret enviado pelo chat.
- [ ] **Schema:** colher metadata/ACL/RLS/RPC/extensões/publication/journals somente no alvo autorizado; reconciliar com [plano SQL](CONSOLIDATION-001-MIGRATION-PLAN.md). Divergência impede execução automática.
- [ ] **Economia:** negar pela API as escritas/concessões não autoritativas, inclusive acesso direto às tabelas; provar negativas com JWT real, antes de qualquer GO. Reusar0078, sem outra carteira/ledger.
- [ ] **Vercel:** revalidar `carlos-junior-s-projects/rpgjovemcristao-test`, projectId histórico `prj_qKzjXMVXwiVpGlU66SoTA71mStXX`, Root Directory `apps/web`, Node24.x e build/install do monorepo; não tocar `rpgjovemcristao-web`.
- [ ] **Env do alvo:** configurar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `APP_BASE_URL`, somente com origem/chave de teste. Publicáveis não são chaves secret/service_role; valores não entram em Git/relatórios. Não copiar env de produção nem usar fixtures para deploy.
- [ ] **Origem estável:** definir URL HTTPS real da Preview antes de testar convites e configurar APP_BASE_URL + allowlist de Auth para a mesma origem. Não derivar de Host, não usar wildcard amplo ou `.invalid`; links QR têm de apontar para o alvo certo. Revalidar por novo SHA se env embutida no cliente mudar.
- [ ] **Proteção:** Vercel Authentication/SSO restrita a testadores autorizados; verificar interação com callbacks e abertura do QR. A proteção Vercel não substitui Auth/RLS.
- [ ] **Git:** projeto de teste sem auto deploy indevido de main/branches; manter produção e hooks CLOUD intactos. Branch atual codex/consolidation-preview-001 não habilita job pinned-preview.
- [ ] **CI por SHA:** após autorização futura de push, rodar quality no SHA completo de consolidação escolhido. CI verde antigo1d8dd70 não aprova esta branch. Gate antigo de demonstração retorna eligible=false; não contornar com outra branch/hook.
- [ ] **Publicação:** autorização separada para método/projeto/SHA selecionados; verificar gitSource.sha, projectId, target Preview, READY, proteção e URL reais. Nenhum deploy nesta etapa.
- [ ] **Smoke hospedado:** login→Avatar→Story/mapa, convite/pedido, líder/missão/pendência, professor/aula/aluno, gates de combate/baú, troca de conta, negações e logs redigidos; somente contas fictícias autorizadas.
- [ ] **Aceite físico:** aparelhos/câmera/sessões reais nos fluxos liberados; registrar limites e responsáveis sem tokens.

## O que exige autorização posterior

O próximo passo é apresentar/autorizar uma inspeção **somente de metadados** dos alvos de teste para identificar Supabase e revalidar Vercel, sem SQL/config/dados. O resultado decide criação ou reaproveitamento de recurso existente. Criação/configuração do ambiente, migrações/cutover/ACL, contas fictícias, variáveis, push/CI e deploy são operações posteriores distintas, com escopo/SHA/manifestações revisados; este documento não as executa nem as autoriza por inferência.

O checklist não exige cadastrar serviço alternativo ou instalar dependência. Revalidar documentação oficial quando a execução remota for autorizada; esta revisão ficou limitada às fontes locais por pedido expresso.
