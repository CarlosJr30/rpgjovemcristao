# Auth — configuração mínima e dependência externa

01/11/2026. Auditoria: **TEST mailer_autoconfirm=false; PROD=true; cadastro por e-mail ativo em ambos**, telefone/anônimos desativados. Única alteração de configuração desta etapa: proprietário adicionou dois redirects exatos somente em TEST, pelo painel legítimo. Nenhuma configuração PROD, SMTP, Auth/RLS ou política foi relaxada.

O aplicativo já envia retorno explícito de confirmação para a própria origem (`/auth`, com retorno interno permitido) e de recuperação para `/auth/recover`. A confirmação TEST de29/10 chegou por `mail.app.supabase.io`; seu link tinha retorno legado `rpgjovemcristao-ebd001-preview.vercel.app`, não a Preview solicitante. Isso não prova callback correto na versão atual. Não seguir um retorno inesperado, copiar sessão ou reescrever o link recebido para fabricar aprovação.

O conector não expõe SMTP/SiteURL e a CLI não tem sessão administrativa. O proprietário conferiu visualmente o painel oficial no Edge, sem compartilhar cookies/credenciais: **Custom SMTP desligado nos dois ambientes**. Esta é evidência informada pelo proprietário, não leitura automática do conector.

| Ambiente | Site URL informada | Redirects preservados |
| --- | --- | --- |
|PROD|`https://rpgjovemcristao-web-inky.vercel.app`|Mesma origem: `/auth` e `/auth/recover`. Compatíveis com o cliente atual.|
|TEST|`https://rpgjovemcristao-ebd001-preview.vercel.app`|Mesma origem antiga: `/auth` e `/auth/recover`. Preservados.|

Em TEST, o proprietário confirmou a inclusão adicional de `https://rpgjovemcristao-b0otimxdk-carlos-junior-s-projects.vercel.app/auth` e `/auth/recover`, com número zero em `b0otimxdk`. Os dois links de e-mail recebidos confirmaram esses retornos exatos. SiteURL antiga, redirects anteriores, SMTP e PROD foram preservados. Reversão da configuração: remover somente esses dois novos itens se a Preview deixar de ser usada. Retornos com parâmetros internos adicionais não foram exercitados; conferir os valores efetivamente utilizados antes de ampliar a allowlist, sem curingas gerais.

## Cadastro e recuperação reais TEST — PASS funcional

Preview READY/candidato `9b23c4b97419a1653aefb0e26821997b3265c912`, somente backend TEST. Uma nova conta QA dedicada, caixa controlada e fingerprint `710b5ec32cde`: cadastro normal sem sessão antes de confirmar; mensagem real; link original seguido pelo navegador até `/auth`; identidade não anônima confirmada pelo Auth; logout e login por senha; recuperação normal; mensagem real até `/auth/recover`; troca de senha somente dessa QA; saída e novo login com a senha nova, mesma identidade. Nove verificações funcionais nas partes identificadas; exatamente um cadastro e um pedido de recuperação, sem reenviar e-mails. Três verificações adicionais confirmaram ausência de Admin implícito, avatares alheios invisíveis e nenhum avatar próprio criado. Senhas protegidas localmente por DPAPI; links/tokens não entram nas evidências ou arquivos versionados.

Primeiro coletor esperou o título da página anônima após login de conta sem avatar; o destino correto é `/journey/create`. Falha preservada e expectativa corrigida para o destino e título reais, sem criar avatar ou mudar aplicação/limite. Retomada sem duplicar cadastro/e-mails; rodada interrompida não é declarada integralmente PASS.

## 403 durante a saída — gate encerrado por evidência

O monitor original conserva um erro de console. Logs TEST correlacionam a sessão de recuperação, fingerprint `120A3C446A84`: `PUT /auth/v1/user`200; validação `GET /auth/v1/user`403/`session_not_found` durante `POST /auth/v1/logout`204. Os eventos Auth registram `user_modified`, `logout` e a negação na mesma janela; a sessão encerrada não existe mais em `auth.sessions`. O novo login retornou200 com outra sessão e validações200 da mesma identidade. O código [session_not_found](https://supabase.com/docs/guides/auth/debugging/error-codes) documenta precisamente a ausência de sessão, inclusive após logout.

Teste dirigido, sem novo e-mail, na mesma QA: cinco verificações PASS — sessão válida antes200; saída normal204; interface anônima e armazenamento limpo; reutilização deliberada da sessão encerrada negada403/`error_code=session_not_found`; novo login normal e identidade confirmada. Monitor do seguimento sem erros. Primeira assertion do coletor procurou o código semântico em `code`, que nesta resposta contém403; corrigida para `error_code` e exigidos ambos os valores exatos. Falha preservada; nenhuma negação convertida em autenticação válida.

Conclusão restrita: a validação concorrente chegou à sessão já invalidada pela saída, com recusa segura e estado final correto. **Sem defeito funcional ou bypass demonstrado nesse fluxo; não é necessária mudança de Auth.** Nenhum filtro de console, alteração Supabase, supressão genérica de403 ou sessão copiada. O monitor original não é declarado zero erros; o gate aceita esta negação específica comprovada. Mudança própria de senha sem e-mail também passou em diagnóstico separado, sem ser contada como nova recuperação completa.

Ensaio atual PROD: formulário legítimo de recuperação para a conta existente aprovada, com caixa controlada por conector Outlook, retornou200; mensagem recebida em01/11/2026,04:56:51UTC, de `mail.app.supabase.io`, com verificação no projeto PROD e retorno exato ao domínio oficial `/auth/recover`. Link não seguido, token não armazenado e senha não alterada. É evidência atual de entrega pelo remetente padrão ao proprietário e de retorno correto nessa mensagem, **não** de recuperação completa, cadastro novo ou entrega a qualquer destinatário público. A leitura do link usou o corpo completo recebido; não o preview truncado do correio.

## Dependência indispensável para cadastro público

O [SMTP padrão Supabase](https://supabase.com/docs/guides/auth/auth-smtp) entrega somente a endereços de membros da equipe do projeto e tem limites próprios; não é um serviço de produção para e-mails arbitrários dos jogadores. Confirmar/recuperar uma conta controlada não comprova entrega ao público geral. Para abrir cadastro seguro é necessário envio de **mensagens de segurança do Auth** com remetente/provedor autorizado e verificado, ou outro mecanismo de identidade equivalente aprovado e homologado. Não foi escolhido/contratado provedor ou comprado domínio. O contato Hotmail de privacidade não foi convertido em SMTP pessoal.

Isso é separado dos convites manuais: **e-mail automático de convites continua cancelado**. Não ativar Resend, SMTP ou adaptador preparado apenas para convites.

## Ordem mínima quando a dependência estiver disponível

1. Pelo acesso administrativo legítimo do proprietário, conferir/exportar sem segredos os flags, SiteURL, redirects, limites e estado do remetente; registrar configuração anterior para reversão. Não pedir token/senha na conversa.
2. Fluxo atual TEST com remetente padrão concluído nas condições acima. Quando houver provedor de segurança aprovado, validar sua entrega e ambos os fluxos em TEST antes de configurar PROD; a prova atual não valida um provedor ainda inexistente ou destinatários públicos arbitrários.
3. Em PROD, SiteURL oficial `https://rpgjovemcristao-web-inky.vercel.app`; callbacks reais de `/auth` e `/auth/recover` e retornos internos efetivamente usados devem ser conferidos. Evitar curingas amplos e origens TEST. Ligar confirmação de e-mail somente após envio/retornos validados; não desligar Auth/RLS.
4. Auditar contas preexistentes: `email_confirmed_at` gerado sob autoconfirmação não prova posse da caixa postal. Não desconfirmar, excluir, promover ou reconciliar usuários por SQL para simular validação. Qualquer reconciliação deve ter contrato próprio mínimo e prova legítima.
5. Cumprir gates de privacidade8+, CI/Preview e publicação; conferir domínio e preservação depois. Não criar jogador fictício permanente PROD para testar.

[Confirmação e recuperação](https://supabase.com/docs/guides/auth/passwords), [SiteURL/redirects](https://supabase.com/docs/guides/auth/redirect-urls), [checklist de produção](https://supabase.com/docs/guides/deployment/going-into-prod). Sem esse gate e proteção de menores comprovados, lançamento amplo permanece BLOCKED; a aplicação já publicada não é declarada tecnicamente fechada ou cadastro desativado.
