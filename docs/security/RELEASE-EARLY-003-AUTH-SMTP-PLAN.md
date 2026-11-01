# AUTH-SMTP-003-R1 — proposta para aprovação

01/11/2026. **PREPARADO; NÃO AUTORIZADO/NÃO CONFIGURADO.** Escopo exclusivo: confirmação de cadastro e recuperação de senha pelo Supabase Auth. Convites de liderança/Guilda/EBD permanecem manuais; seu envio automático continua cancelado.

**Decisão posterior do proprietário:** informou possuir somente o endereçoVercel, sem domínio próprio, e respondeu **não** à autorização de criar conta/chave ResendFreeTEST. Nenhum serviço ou credencial será criado. As opções abaixo ficam como pesquisa, não instrução para instalação. Outra solução dependerá de aprovação própria; não substituir silenciosamente o provedor recusado.

## Escolha e custo

| Alternativa | Custo/limite público consultado | Avaliação para este projeto |
| --- | --- | --- |
|**Resend Free — proposta recusada**|US$0/mês,3.000mensagens/mês e100/dia; SMTP e domínio verificado. [Preço](https://resend.com/pricing), [SMTP](https://resend.com/docs/send-with-smtp).|Primeiro resultado da descoberta Vercel Messaging. Ligação direta ao SMTP do Supabase, sem SDK, rota, dependência ou serviço de envio na aplicação; não será criada por causa da recusa explícita.|
|Brevo Free|US$0/mês,300mensagens/dia; SMTP transacional e autenticação de domínio. [Plano](https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans), [SMTP](https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP).|Alternativa se o proprietário preferir ou já tiver conta válida; não elimina domínio/remetente e aprovação.|
|SMTP padrão Supabase|Restrito a endereços da equipe, com limite próprio; não é a solução pública. [Restrições](https://supabase.com/docs/guides/auth/auth-smtp).|As provas002 são válidas, mas não homologam destinatários externos arbitrários.|

Valores consultados em01/11/2026, sujeitos a revisão no cadastro. **Domínio não está incluído nesse custo.** Proprietário confirmou não possuir domínio próprio; a aplicação tem somente `rpgjovemcristao-web-inky.vercel.app`. A listagem da contaVercel contém uma entrada fora do vínculo do projeto, mas isso não comprova domínio remetente próprio e não autoriza reutilização. Hotmail/Gmail e hostname `vercel.app` não são domínios remetentes sob nosso controle de DNS. Nenhuma cotação/compra ou outro provedor será contratado por inferência.

## Configuração revisável, somente após aprovação

1. Proprietário aprova Resend Free, finalidade, tratamento dos dados necessários e domínio/subdomínio remetente. Criar conta/chave apenas após autorização explícita; não aceitar plano pago, excedentes, automações ou cobrança automática. Não pressupor domínio verificado ou aceite contratual.
2. Conferir domínio no provedor e publicar somente seus registros DNS de autenticação, com evidência do estado anterior. Verificar SPF/DKIM e alinhamento/DMARC; preservar DNS/MX existentes. Preferir subdomínio dedicado à segurança. Não habilitar recebimento, campanhas ou lista de contatos.
3. Desligar rastreamento de abertura/cliques para o domínio de segurança e conferir a configuração real. Não reescrever callbacks ou usar link de rastreamento. [Rastreamento](https://resend.com/docs/dashboard/domains/tracking). Acesso ao painel de mensagens deve ser restrito: o provedor processa endereço, conteúdo e link de segurança; retenção/condições precisam de aceite, não se promete ausência de armazenamento no provedor.
4. Em TEST `wkdvdzfkbwvhyjmamrsg`, guardar a credencial exclusivamente no campo protegido do Supabase Auth → Emails/SMTP. Host `smtp.resend.com`, porta465 com TLS, usuário `resend`; senha: chave real do provedor, inserida no painel legítimo, nunca na conversa, `.env`, cliente, logs ou relatório. Remetente: endereço do domínio efetivamente aprovado/verificado; nome proposto `RPG Jovem Cristão`. Não inventar endereço enquanto faltar domínio. [Integração oficial](https://resend.com/docs/send-with-supabase-smtp).
5. Usar credencial de envio limitada ao domínio, separando TEST/PROD quando o plano permitir; não criar chave administrativa geral para a aplicação. Nenhuma variável Resend precisa entrar na Vercel. O adaptador de convites preparado continua sem chamadas de rota/UI, outbox ou ativação.
6. Preservar SiteURLTEST `https://rpgjovemcristao-ebd001-preview.vercel.app`, dois callbacks antigos e os dois exatos de `b0otimxdk...vercel.app/auth` e `/auth/recover`. Preservar SiteURLPROD `https://rpgjovemcristao-web-inky.vercel.app` e seus `/auth` e `/auth/recover`. Sem curingas ou origem TEST em PROD. Snapshot não secreto dos limites, templates, flags, remetente e redirects antes de salvar qualquer alteração.
7. Confirmar remetente/domínio aprovados, TLS, cotas e limites de Auth compatíveis; não aumentar limites às cegas. Templates ficam restritos à segurança, com link original do Auth e informação mínima. Nenhum dado de Guilda, presença, religião declarada ou reflexão no e-mail. Não enviar convites, marketing ou notificações educativas por este canal.

## Homologação mínima do novo transporte

O proprietário precisa autorizar **um destinatário legítimo externo ao conjunto anteriormente autorizado**, com caixa acessível pelo próprio destinatário. Não solicitar senha/cookie/token, usar endereço descartável ou disparar teste para terceiro desavisado. O endereço ainda não foi indicado/autorizado para esta prova.

Uma conta QA TEST dedicada, sem avatar: cadastro normal → confirmação obrigatória sem sessão antes do e-mail → mensagem real do novo remetente → callback exato/original → Auth confirmado/login; recuperação → mensagem real → callback original → senha nova somente dessa QA → logout/login válido. Registrar dois envios e seus estados mínimos, sem guardar o segredo. Evidenciar aceitação do provedor e recebimento da caixa, pois SMTP aceito não garante entrega. Reutilizar isolamento/403/WebKit002; repetir somente eventual fronteira afetada pelo transporte. Falhou: preservar evidência e parar, sem reenviar indiscriminadamente ou desativar confirmação.

## PROD e contenção

Somente após TEST externo, demais gates de privacidade e aprovação da configuração sensível: renovar baselines/snapshot, confirmar conta aprovada/ativo50, gravar SMTP PROD com credencial própria e preservar URLs. Validar entrega antes de tornar obrigatória a confirmação em PROD; plano de aplicação e janela de contenção serão apresentados com os valores reais, não com placeholders. Não criar usuário fictício permanente PROD ou alterar senha de jogador existente para testar.

Antes de qualquer mudança, manter a configuração anterior protegida sob controle do proprietário. Falha em TEST: restaurar somente a configuração anteriorTEST, preservando confirmação e contas. Falha depois de exigir confirmaçãoPROD: **não voltar à autoconfirmação para mascarar falha de envio**; conter novas inscrições conforme plano aprovado, manter logins válidos e restaurar o último transporte verificado. Não apagar usuários/vínculos, resetar Auth, fabricar JWT ou alterar RLS. Rotação/revogação de chave comprometida ocorre pelo proprietário, sem expô-la.

**Estado de bloqueio:** ResendFree foi recusado e não há domínio remetente próprio. Falta solução de envio de segurança aprovada, com identidade de remetente legítima e destinatário externo autorizado. SMTP padrão continua restrito; não adicionar jogadores como membros da equipe do projeto para contornar a restrição, confirmar contas administrativamente ou desligar confirmação. Cadastro público seguro não será declarado resolvido nessas condições. Este documento não concede aprovações ou instala integração fictícia.
