# Auth — configuração mínima e dependência externa

01/11/2026. Auditoria somente leitura: **TEST mailer_autoconfirm=false; PROD=true; cadastro por e-mail ativo em ambos**, telefone/anônimos desativados. Nenhuma configuração alterada.

O aplicativo já envia retorno explícito de confirmação para a própria origem (`/auth`, com retorno interno permitido) e de recuperação para `/auth/recover`. A confirmação TEST de29/10 chegou por `mail.app.supabase.io`; seu link tinha retorno legado `rpgjovemcristao-ebd001-preview.vercel.app`, não a Preview solicitante. Isso não prova callback correto na versão atual. Não seguir um retorno inesperado, copiar sessão ou reescrever o link recebido para fabricar aprovação.

O proprietário informou não conhecer SMTP próprio/domínio verificado. O conector disponível não expõe a configuração administrativa de Auth/SMTP/SiteURL; a CLI retornou ausência de login administrativo. Portanto **não foi possível comprovar diretamente o SMTP e a allowlist atuais PROD**. Public settings não informa esses campos. Não inferir configuração global pela mensagem TEST histórica.

Ensaio atual PROD: formulário legítimo de recuperação para a conta existente aprovada, com caixa controlada por conector Outlook, retornou200; mensagem recebida em01/11/2026,04:56:51UTC, de `mail.app.supabase.io`, com verificação no projeto PROD e retorno exato ao domínio oficial `/auth/recover`. Link não seguido, token não armazenado e senha não alterada. É evidência atual de entrega pelo remetente padrão ao proprietário e de retorno correto nessa mensagem, **não** de recuperação completa, cadastro novo ou entrega a qualquer destinatário público. A leitura do link usou o corpo completo recebido; não o preview truncado do correio.

## Dependência indispensável para cadastro público

O [SMTP padrão Supabase](https://supabase.com/docs/guides/auth/auth-smtp) entrega somente a endereços de membros da equipe do projeto e tem limites próprios; não é um serviço de produção para e-mails arbitrários dos jogadores. Confirmar/recuperar uma conta controlada não comprova entrega ao público geral. Para abrir cadastro seguro é necessário envio de **mensagens de segurança do Auth** com remetente/provedor autorizado e verificado, ou outro mecanismo de identidade equivalente aprovado e homologado. Não foi escolhido/contratado provedor ou comprado domínio. O contato Hotmail de privacidade não foi convertido em SMTP pessoal.

Isso é separado dos convites manuais: **e-mail automático de convites continua cancelado**. Não ativar Resend, SMTP ou adaptador preparado apenas para convites.

## Ordem mínima quando a dependência estiver disponível

1. Pelo acesso administrativo legítimo do proprietário, conferir/exportar sem segredos os flags, SiteURL, redirects, limites e estado do remetente; registrar configuração anterior para reversão. Não pedir token/senha na conversa.
2. Em TEST, autorizar somente origens/callbacks controlados da Preview corrente e testar cadastro→mensagem real→retorno correto→login. Testar recuperação→mensagem real→retorno correto→troca de senha→novo login em conta QA dedicada, sem afetar jogadores existentes. Não aprovar apenas o formulário ou recebimento de e-mail.
3. Em PROD, SiteURL oficial `https://rpgjovemcristao-web-inky.vercel.app`; callbacks reais de `/auth` e `/auth/recover` e retornos internos efetivamente usados devem ser conferidos. Evitar curingas amplos e origens TEST. Ligar confirmação de e-mail somente após envio/retornos validados; não desligar Auth/RLS.
4. Auditar contas preexistentes: `email_confirmed_at` gerado sob autoconfirmação não prova posse da caixa postal. Não desconfirmar, excluir, promover ou reconciliar usuários por SQL para simular validação. Qualquer reconciliação deve ter contrato próprio mínimo e prova legítima.
5. Cumprir gates de privacidade8+, CI/Preview e publicação; conferir domínio e preservação depois. Não criar jogador fictício permanente PROD para testar.

[Confirmação e recuperação](https://supabase.com/docs/guides/auth/passwords), [SiteURL/redirects](https://supabase.com/docs/guides/auth/redirect-urls), [checklist de produção](https://supabase.com/docs/guides/deployment/going-into-prod). Sem esse gate e proteção de menores comprovados, lançamento amplo permanece BLOCKED; a aplicação já publicada não é declarada tecnicamente fechada ou cadastro desativado.
