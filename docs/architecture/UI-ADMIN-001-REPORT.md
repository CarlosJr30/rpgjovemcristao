# UI-ADMIN-001 — Administração simplificada

31/10/2026 — **VALIDATING; ainda sem publicação.** Painel em quatro áreas, menu condicionado à autorização atual do servidor, listagem privada de lideranças e revogação com confirmação/motivo. Convites individuais reutilizam a autoridade publicada; geração manual de link/QR, WhatsApp e composição de e-mail acionados pelo administrador. Nenhuma mensagem enviada automaticamente.

O proprietário confirmou que não há provedor/remetente verificado e autorizou publicar a interface independentemente dessa pendência. Template e adaptador exclusivamente servidor preparados, sem rota conectada, chave, contratação ou ativação. Antes de ligar envio: provedor/domínio verificados, proteção durável do segredo, outbox/idempotência e limites globais, auditoria mínima, validação real TEST e configuração PROD. Hashes de convites existentes não permitem recuperar o segredo para reenvio; não emitir outro convite como retry.

Validação local: **44 testes direcionados PASS**, lint/tipos/build e protocolo25 PASS; **9 PostgreSQL isolados PASS**, incluindo autorização, legado, mascaramento, revogação na mesma identidade e recuperação preservadora com comparação integral de definições/ACLs. Provas anteriores de aceite/expiração/consumo permanecem válidas, sem repetir grandes suítes locais. Testes do provedor são simulados, não entrega real. Primeiras fixtures de e-mail usavam domínio reservado e uma substituição sem efeito; corrigidas somente as fixtures, mantendo validação estrita. Rodadas anteriores não são PASS.

Migration TEST candidata `20261031180623_ui_admin_001_leaders_read_test.sql`: somente duas funções de leitura paginada, sem tabelas ou mutações; wrapper INVOKER, leitura privada exige `leadership.manage`, anon/service_role negados. Recuperação remove somente essas rotinas e preserva vínculos/histórico. Ainda não aplicada remotamente; versão PROD própria somente após homologação TEST.

Snapshots privados renovados de75 conjuntos TEST e70 PROD e respectivas estruturas. CI exato, Preview TEST com Auth normal, mobile320–390 emulado, pacote produtivo e gates remotos continuam pendentes. Não declarar DONE/DEPLOY_COMPLETE. Aplicação usa AuthBearer publicado: GET entrega shell sem dados privados; APIs/RPCs verificam identidade e permissão a cada operação, sem nova autenticação por cookie.

QA/Security/React pelo autor, sem independência alegada. Sem economia, novos grants, alteração de Auth/RLS, dependência ou arte. PR12/18/24 e produção010C.2 preservadas. Artefatos privados em `build/ui-admin-001`.

Referências da preparação futura: [idempotência Resend](https://resend.com/changelog/idempotency-keys), [QR inline por CID](https://resend.com/changelog/embed-images-using-cid). A janela de deduplicação do provedor não substitui controle durável da aplicação.
