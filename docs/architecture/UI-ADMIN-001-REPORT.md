# UI-ADMIN-001 — Administração simplificada

## 01/11/2026 — confirmação de nova emissão e pacote próprio

**VALIDATING, sem publicação PROD.** Usuário aprovou confirmação explícita para concluir/abandonar a intenção local e preparar outro convite. Cancelar preserva os mesmos IDs; confirmar limpa somente IDs locais da conta, não emite/reenvia/revoga convite. Navegação/reload deixam de prender a próxima emissão. Repetição comum mantém UUID/nonce originais. Dois testes adicionais; nove testes direcionados de tela/intenção PASS, lint pertinente/tipos/build PASS após corrigir opção `exact` indevida na fixture Testing Library. A primeira verificação de tipos/build não é PASS.

PR25 draft, runtime inicial190c4f2: CIpush41228715943/PR41228731074 success, **1006unit/74SKIP**, qualidade/PG/RSC/protocolo25. TEST migration20261031182355 (arquivo180623),40migrations/75tabelas/201funções. Todos os75 conjuntos,199 rotinas/ACLs e39policies anteriores intactos; apenas duas leituras novas. Preview n5hfghg68/dpl_44ZBHGdfLMPbxThspAxrbSibUSzk READY/190c4f2/TEST, proteções mantidas.

Cinco checks negativos TEST PASS com login QA normal. **12 checks funcionais hospedados identificados PASS**, doisUIDs normais/Admin original ativo: quatro áreas/menu, emissão/QR exato/replay sem segredo, destinatário errado negado, aceite correto e revogação por seleção/motivo sem renovar JWT. Chromium1365/320/390 e WebKit320/390 emulados; positivos Admin no Chromium, QA negativa no WebKit. Não é aparelho físico. A confirmação nova ainda exige seu recheck no novo artefato.

O monitor final da primeira rodada **FAIL** por um registro genérico de console; não declarar a rodada integralmente PASS. Diagnóstico reteve a única resposta404 de `accept`. Reprodução controlada posterior confirmou exatamente `Failed to load resource ...404` em `/api/guild-governance`, causada pela tentativa deliberada de aceite por destinatário errado; resposta de negação correta, sem consumir convite. Não transformar404 em200 nem filtrar erros. Recheck das quatro áreas sem essa negação deliberada teve zero erros. O registro genérico original não foi retrospectivamente reescrito. Primeiro diagnóstico interrompido por seletor global `alert` que também encontrou anunciador Next; escopo corrigido para main. Convites diagnósticos foram revogados, auditorias mantidas.

Pacote produtivo próprio `20261101035710_ui_admin_001_leaders_read_production.sql`, equivalente às rotinas/ACLs TEST; recuperação/contenção preservadoras em arquivos próprios. **10PG isolados TEST** (nove anteriores+contenção) PASS; envelope PROD recebe os mesmos casos, sem contar como casos exclusivos. Falha inicial da fixture de scope por delimitador SQL foi corrigida sem mudar guardas. [Plano produtivo](UI-ADMIN-001-PRODUCTION-PLAN.md). Nenhum DDL/grant/merge/deploy PROD executado. Envio automático continua desativado, manual preservado.

Os checkpoints abaixo são históricos.

31/10/2026 — **VALIDATING; ainda sem publicação.** Painel em quatro áreas, menu condicionado à autorização atual do servidor, listagem privada de lideranças e revogação com confirmação/motivo. Convites individuais reutilizam a autoridade publicada; geração manual de link/QR, WhatsApp e composição de e-mail acionados pelo administrador. Nenhuma mensagem enviada automaticamente.

O proprietário confirmou que não há provedor/remetente verificado e autorizou publicar a interface independentemente dessa pendência. Template e adaptador exclusivamente servidor preparados, sem rota conectada, chave, contratação ou ativação. Antes de ligar envio: provedor/domínio verificados, proteção durável do segredo, outbox/idempotência e limites globais, auditoria mínima, validação real TEST e configuração PROD. Hashes de convites existentes não permitem recuperar o segredo para reenvio; não emitir outro convite como retry.

Validação local: **44 testes direcionados PASS**, lint/tipos/build e protocolo25 PASS; **9 PostgreSQL isolados PASS**, incluindo autorização, legado, mascaramento, revogação na mesma identidade e recuperação preservadora com comparação integral de definições/ACLs. Provas anteriores de aceite/expiração/consumo permanecem válidas, sem repetir grandes suítes locais. Testes do provedor são simulados, não entrega real. Primeiras fixtures de e-mail usavam domínio reservado e uma substituição sem efeito; corrigidas somente as fixtures, mantendo validação estrita. Rodadas anteriores não são PASS.

Migration TEST candidata `20261031180623_ui_admin_001_leaders_read_test.sql`: somente duas funções de leitura paginada, sem tabelas ou mutações; wrapper INVOKER, leitura privada exige `leadership.manage`, anon/service_role negados. Recuperação remove somente essas rotinas e preserva vínculos/histórico. Ainda não aplicada remotamente; versão PROD própria somente após homologação TEST.

Snapshots privados renovados de75 conjuntos TEST e70 PROD e respectivas estruturas. CI exato, Preview TEST com Auth normal, mobile320–390 emulado, pacote produtivo e gates remotos continuam pendentes. Não declarar DONE/DEPLOY_COMPLETE. Aplicação usa AuthBearer publicado: GET entrega shell sem dados privados; APIs/RPCs verificam identidade e permissão a cada operação, sem nova autenticação por cookie.

QA/Security/React pelo autor, sem independência alegada. Sem economia, novos grants, alteração de Auth/RLS, dependência ou arte. PR12/18/24 e produção010C.2 preservadas. Artefatos privados em `build/ui-admin-001`.

Referências da preparação futura: [idempotência Resend](https://resend.com/changelog/idempotency-keys), [QR inline por CID](https://resend.com/changelog/embed-images-using-cid). A janela de deduplicação do provedor não substitui controle durável da aplicação.
