# Privacidade do acesso antecipado — proposta v0.2

01/11/2026. **PARA REVISÃO; NÃO APROVADA/NÃO PUBLICADA.** Revisão RELEASE-EARLY-003 da minuta002, preservando os fatos anteriores. Público mínimo8anos, responsável e contato fornecidos pelo proprietário. Isto não comprova consentimento de famílias, idade de jogadores ou funcionamento de controles ainda ausentes. Nenhum procedimento abaixo foi ativado.

## Texto proposto para jogador e família

**Versão curta para a criança, ainda não publicada:** “Use um apelido e peça ajuda ao seu responsável. Sua conta guarda seu avatar e as atividades que você fizer. Pessoas autorizadas da sua comunidade podem acompanhar as atividades do grupo. Não coloque telefone, endereço ou assuntos íntimos no jogo. Se algo incomodar, pare e converse com seu responsável. Para pedir ajuda: carlosrf1302@hotmail.com.”

**Versão curta para o responsável, ainda não publicada:** “O projeto pretende atender a partir de8anos. Antes de admitir crianças, precisamos verificar o vínculo e a autorização aplicáveis, explicar os dados usados e oferecer a supervisão necessária. Um convite de Guilda não substitui essa autorização. Leia a política e use o contato acima para informações, correção ou encerramento. O mecanismo de admissão ainda precisa ser aprovado e implementado.”

**Quem cuida do projeto.** Carlos Faustino — RPG Jovem Cristão. Contato de privacidade e suporte: **carlosrf1302@hotmail.com**, indicado pelo proprietário. É possível pedir informações, correção, acesso ou encerramento de conta por esse canal. A identidade e, quando necessário, a relação do responsável deverão ser verificadas antes de divulgar dados ou atender mudanças.

**O que usamos e por quê.** Para manter sua conta, usamos e-mail, identificador de acesso, apelido e avatar. Guildas e classes guardam vínculos, atividades, respostas de aprendizagem, resultados, presença e histórico das decisões dos responsáveis autorizados. Dados técnicos de sessão e segurança ajudam a proteger o acesso. O navegador também pode guardar dados locais do jogo. Use apelido; não coloque telefone, endereço, documentos ou informações íntimas em nomes e atividades.

**Quem pode ver.** Sua conta acessa seus dados. Participantes e responsáveis de comunidades veem somente as informações necessárias aos seus papéis. Dados administrativos ficam restritos a pessoas autorizadas. E-mails, telefone e localização não são listas públicas de jogadores; reflexões devocionais privadas não devem ser compartilhadas com a comunidade. O jogo não mede fé. Vínculos religiosos podem revelar informações sensíveis e exigem finalidade e proteção específicas.

**Infraestrutura.** Supabase fornece banco/autenticação e Vercel hospeda a aplicação. Somente os dados necessários ao serviço e à segurança devem passar por esses operadores, conforme configurações e condições efetivas. Convites são manuais por link/QR/WhatsApp; não existe envio automático de convites por e-mail. Mensagens de confirmação e recuperação do acesso pertencem à segurança da conta.

**Crianças e adolescentes.** O público pretendido começa em8anos. O acesso desse público depende das salvaguardas aplicáveis, incluindo participação verificável do responsável e experiência adequada à idade. Crianças devem pedir ajuda a um responsável. Convite de Guilda, cargo de líder/professor ou marcação de uma caixa não comprova parentesco, idade ou autorização familiar. Não solicitamos documentos/fotos ou localização precisa por padrão para jogar.

**Escolhas e cuidado.** Chat e mensagens privadas não estão liberados. Arena, Loja, Torre, baús, novas recompensas e progressão oficial pendente continuam bloqueados; não há promessa retroativa. Se algo incomodar ou seus dados forem usados indevidamente, procure seu responsável e o contato acima. Antes do lançamento, serão definidos e comunicados critérios reais de retenção, encerramento e atendimento; esta minuta não promete exclusão automática que o sistema não implementa.

## O que falta aprovar e demonstrar antes de publicar o texto

| Decisão/gate | Proposta mínima para revisão | Situação |
| --- | --- | --- |
|Controlador/canal|Carlos Faustino como controlador operacional identificado publicamente; canal acima com atendimento real e acesso controlado.|Dados indicados; texto final e procedimento ainda sem aceite.|
|Finalidades/bases e retenção|Documentar finalidade de cada conjunto, inclusive vínculos religiosos, fundamento aplicável, retenção efetiva dos operadores e tratamento de pedidos sem apagar auditoria/jogadores indevidamente.|Pendente; não presumir consentimento genérico ou retenção infinita.|
|Idade/responsável|Aferição proporcional com coleta mínima; vínculo verificável de contas quando aplicável, autorização específica/versionada e possibilidade de revogar/limitar participação. Impedir liberação pela API sem requisito válido, não apenas esconder botão.|Não implementado no produto publicado; nenhum registro de autorização familiar será fabricado.|
|Supervisão/atendimento|Definir responsável humano, denúncia/resposta e controles de supervisão/uso adequados. Líder de Guilda não é responsável legal por presunção.|Pendente de contrato mínimo e validação real; manter chat/DM fechados.|

A abertura8+ continua **BLOCKED** até esses requisitos serem aprovados e comprovados. A minuta pode ser revisada agora, mas não deve ser exibida como política vigente, consentimento coletado ou declaração de conformidade.

## Caminho mínimo proposto para o primeiro piloto — não autorizado/implementado por este documento

1. Carlos confirmou em01/11/2026 que assumirá atendimento de privacidade e verificação inicial do vínculo das famílias. Isso define o responsável operacional, sem aprovar automaticamente política/controles ou criar privilégio no sistema. Verificar identidade e relação legal por meio proporcional documentado, preferencialmente na relação presencial já existente com a família; líder/professor não substitui responsável legal. Não exigir foto/documento permanente por padrão.
2. Registrar apenas referências protegidas de conta da criança e responsável, faixa necessária, versão/finalidade da autorização, data, verificador e estado. Preservar separação de participação educativa e dados religiosos/privados; não guardar texto devocional como prova de autorização.
3. Exigir evidência válida no servidor antes da admissão, incluindo a chamada direta ao Auth; um bloqueio apenas na tela é contornável. Não confiar em idade/papel/autorização enviados em `user_metadata`. Convites comuns/administrativos não substituem esse gate.
4. Vincular e conferir as autorizações aplicáveis às contas de até16anos, oferecer as salvaguardas de supervisão/limitação apropriadas e atendimento/revogação. Não compartilhar senha, converter avatar em usuário independente ou alterar jogadores antigos para fabricar a prova.
5. Homologar em TEST permissão/negação/replay/isolamento/revogação com famílias QA autorizadas e fluxo legítimo de e-mail; só então propor produção. O desenho técnico final e a assunção do procedimento humano dependem de aprovação explícita. Não iniciar um novo módulo de jogo ou modificar a Administração para simular o cumprimento.

Este é o menor contrato de admissão proposto, não um mecanismo existente. O público mínimo8anos é uma escolha informada pelo proprietário e não uma classificação indicativa oficial atribuída por este relatório.

## Faixas e decisões de admissão propostas

| Faixa | Tratamento proposto, ainda sujeito a aprovação e implementação |
| --- | --- |
|Menos de8|Fora do público escolhido. Não criar autorização por exceção implícita.|
|8–11|Crianças: informação acessível, verificação proporcional da relação legal e autorização específica do responsável para o piloto. Definir a hipótese legal por finalidade e categoria antes da ativação.|
|12–15|Adolescentes: informação diretamente compreensível e participação na decisão; supervisão e vínculo do responsável propostos para o piloto, sem tratá-los automaticamente como adultos.|
|16|Adolescente; considerar expressamente o alcance de “até16anos” na análise do art.24 e registrar a decisão de vínculo/supervisão.|
|17|Continua adolescente: melhor interesse, informação acessível e supervisão proporcional; não presumir que consentimento sozinho resolve todas as finalidades.|
|18+|Adultos: informação e exercício de direitos próprios, sem dispensar segurança ou proteção de dados sensíveis.|

O ECA distingue criança de adolescente aos12anos; a [ANPD](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes) admite análise das hipóteses dos arts.7º/11, sempre com melhor interesse. Não há base legal genérica aprovada aqui. Vínculos identificáveis a grupos religiosos exigem exame específico de dados sensíveis; interesse legítimo não substitui as hipóteses do art.11. O art.24 do ECA Digital está no capítulo de redes sociais: confirmar enquadramento do serviço e orientação aplicável, sem declarar automaticamente que todo jogo é rede social. O piloto propõe vínculo protegido como salvaguarda do projeto, não como conclusão jurídica automática.

## Procedimento operacional concreto para aprovação

1. **Responsáveis humanos:** Carlos Faustino confirmou que assumirá atendimento de privacidade e verificação inicial do vínculo das famílias. Nenhum substituto foi designado. A decisão é operacional e explícita; não cria grant técnico nem aprova o restante da minuta. Administrador Geral/líder/professor não se torna representante legal por inferência; acesso de eventual verificador deverá ser mínimo e explicitamente autorizado.
2. **Verificação proporcional:** o adulto entra por sua própria conta com e-mail confirmado. Isso prova a caixa, não parentesco. Verificador designado confere relação legal por procedimento documentado e proporcional, preferindo relação presencial previamente conhecida da escola/família e confirmação direta. Caso duvidoso: não admitir até esclarecimento; não exigir documento/foto persistente ou dado biométrico por padrão. Definir atendimento remoto equivalente antes de abrir esse canal.
3. **Registro mínimo protegido:** referências das contas do menor e responsável; faixa validada e validade da aferição; versão do aviso/finalidade autorizada; data, método categórico sem documentos, referência do verificador e estado pendente/ativo/revogado/expirado. Não armazenar parentesco detalhado, relato íntimo, documento ou foto. Menor e adulto não compartilham senha; dois avatares do mesmo login não comprovam duas identidades. Aprovação não cria Admin, líder, professor ou matrícula.
4. **Integridade:** a evidência é emitida por autoridade restrita, com motivo mínimo, revisão e identificador idempotente; cliente não altera autorização ou idade via metadata. Alterações/revogação ficam rastreáveis, sem duplicação ou eliminação do histórico. Associação do adulto não abre dados de outros menores, Guildas ou classes.
5. **Admissão e supervisão:** antes de admitir novo jogador menor, servidor confere o requisito aprovado, inclusive frente a cadastro direto à API. Informar claramente controles em vigor; responsável pode acompanhar/limitar o uso pertinente e pedir suspensão/revogação. Limite e monitoramento de tempo, restrições de interação, aviso acessível e canal de denúncia precisam de implementação/verificação; autorização manual isolada não substitui ferramentas necessárias. Não se presume aferição documental obrigatória para todo jogo apenas por ser jogo.
6. **Padrões protegidos:** sem perfil público pesquisável, lista pública de crianças, e-mails em rankings, reflexão privada em API/grupo, publicidade comportamental, chat/DM ou mensagens a desconhecidos. Manter comunidades/classes restritas, papéis explícitos e revogação no servidor. Placar não pode abrir resultado alheio antecipado ou ampliar o público existente. Evidências002/010A–C preservam os controles atuais, mas não comprovam controles parentais inexistentes.
7. **Contas existentes:** nenhuma idade, parentesco ou autorização será inferida do nome, avatar, nível, convite ou e-mail. Preservar dados e vínculos. Plano de regularização/contensão será separado e aprovado antes de mudar acesso de jogadores; não alterar ou apagar contas para fabricar conformidade.

## Atendimento, retenção e encerramento — proposta, não promessa vigente

Canal indicado: **carlosrf1302@hotmail.com**. Carlos assumirá essas funções, conforme confirmação expressa; a operação proposta recebe pedido, registra protocolo mínimo e faz triagem, orientando a não enviar senhas/documentos pelo e-mail. Confirmar titularidade por sessão normal/canal já verificado e, quando necessário, vínculo legal pelo procedimento acima. Não divulgar dados antes disso, nem exigir informação excessiva. Risco imediato recebe prioridade e contenção pontual autorizada; não se promete atendimento24h sem equipe real.

Para confirmação/acesso, oferecer resposta simplificada imediata quando possível e resposta completa no prazo legal aplicável; a LGPD art.19 prevê até15dias nessa modalidade. Outros pedidos devem ter tratamento e prazo definidos por espécie, sem usar esse prazo como regra universal. Informar decisão/motivo e via de revisão. Um pedido de exclusão não é atendido apenas escondendo a conta: mapear Auth, perfil, avatares, vínculos, aprendizagem, logs e cópias, preservar terceiros e justificar eventuais exceções legais. **Nenhuma exclusão ou job de limpeza está autorizado/executado nesta tarefa.**

| Conjunto | Prazo/critério proposto para decisão do proprietário |
| --- | --- |
|Conta e registros educativos|Enquanto a finalidade e participação ativa justificarem; revisar no encerramento. Proposta operacional: concluir eliminação/anonimização aplicável em até30dias após pedido validado, comunicando antes as exceções. Não é mecanismo implementado.|
|Autorização e decisões administrativas|Conservar a versão aplicável durante o uso; proposta de até180dias após encerramento para prestação de contas, com revisão da necessidade e hipótese legal. Imutabilidade da aplicação não autoriza retenção indefinida; nenhuma alteração dos históricos legados será feita por este documento.|
|Protocolos de privacidade|Proposta de90dias após conclusão, contendo resultado mínimo e justificativa de eventual guarda adicional. Não anexar documentos ou texto íntimo.|
|Logs, backups e mensagens em operadores|A retenção efetiva do plano e de cada categoria deve ser registrada, inclusive propagação de exclusão/cópias. Não prometer apagar imediatamente backup ou log fora do controle do projeto, nem restaurar dado eliminado para uso normal.|

Os prazos propostos dependem de validação de finalidade/base, capacidade operacional e implementação/ensaio seguro. Não criam cron, eliminação retroativa ou garantia pública. Antes de publicar a política, substituir pendências pelos critérios efetivamente aprovados e praticáveis.

## Operadores e telemetria — fatos conferidos em003

| Fronteira | Confirmado | Decisão/gate aberto |
| --- | --- | --- |
|Supabase|TEST e PROD ativos na região `sa-east-1`; Auth e banco processam conta, vínculos e registros sob escopos publicados. Logs de Auth/API foram efetivamente usados no diagnóstico002.|Registrar plano/retenção real de logs/backups, operadores/suboperadores e mecanismo de transferência pertinente. Região do banco não prova residência exclusiva de todo dado de suporte/metadados. [DPA](https://supabase.com/legal/customer-resources/data-processing-addendum).|
|Vercel|PlanoHobby, região de funções indicada `iad1`; hospedagem/CDN e APIs existentes. Sem WebAnalytics/SpeedInsights habilitados na metadata consultada, zero drains configurados. Home eAuth anônimos observados só requisitaram a origem oficial, sem cookies/escritas/erros nessa amostra.|Termos/contrato e uso de dados precisam ser conferidos para o público e as categorias tratadas; não equivaler ausência de SDK a ausência de logs/telemetria da plataforma.|
|Uso de conteúdo na Vercel|[Termos](https://vercel.com/legal/terms) de19/10/2026 preveem modelo de uso/opt-out para treinamento no Hobby. A consulta de metadata disponível **não informou o estado do opt-out**.|Proposta: conferir e desativar treinamento para este projeto pelo painel legítimo, após aprovação da configuração. Não afirmar que dados de jogadores foram treinados nem que o opt-out já existe. O [DPA público](https://vercel.com/legal/dpa) tem escopo de planos e restrição sobre dados sensíveis; confirmar condições efetivamente aplicáveis ao Hobby e ao trânsito de dados religiosos, sem inferir que mudar para plano pago resolve a restrição.|
|E-mail futuro|Nenhum provedor novo instalado. Resend é só proposta separada para mensagens mínimas de segurança, sem vínculos/reflexões/cargos no conteúdo.|Domínio, termos, retenção de mensagens e tratamento pelo provedor precisam de aceite antes de enviar dados. Rastreamento de abertura/cliques deve permanecer desligado.|
|Telemetria da aplicação|Nenhum SDK de analytics/publicidade localizado nas dependências diretas/layout/código examinados. Preview usou ToolbarVercel no diagnóstico; isso não foi observado como script externo na amostra oficial.|Amostra anônima não cobre todas as rotas/sessões nem todos os tratamentos de infraestrutura; não declarar ausência global de coleta. Não adicionar SDK ou rastreador nesta fase.|

O DPA/aviso de cada fornecedor não substitui a política do controlador. Avaliar transferências internacionais conforme o fluxo real e instrumento pertinente, não presumir suficiência de cláusulas estrangeiras. Fonte: [ANPD — transferências internacionais](https://www.gov.br/anpd/pt-br/assuntos/assuntos-internacionais/transferencia-internacional-de-dados). Nenhum contrato, opção de treinamento ou plano foi alterado nesta auditoria.

## Android — somente se houver distribuição Google Play

Não foi localizada aplicação Android/Capacitor ou publicaçãoPlay nos caminhos examinados; a entrega atual é web. Isso não prova inexistência de pacote distribuído fora deste repositório. Não transformar regras da loja em evidência de aceite web ou iniciar pacote Android.

Se houver publicaçãoPlay: conferir público real incluindo crianças, classificação do conteúdo, declaração Segurança dos dados de todos os SDKs, política pública acessível no app e loja, processo de exclusão dentro/fora do app e controle adulto aplicável aos recursos sociais. Manter ausência de anúncios/SDKs publicitários no piloto. [Famílias](https://support.google.com/googleplay/android-developer/answer/9893335?hl=pt-BR), [Dados do usuário e exclusão](https://support.google.com/googleplay/android-developer/answer/10144311?hl=pt-BR). Nenhuma homologação da loja foi realizada ou presumida.

## Decisões para ativação

- [ ] Proprietário aprovar texto/finalidades/bases, público e prazos praticáveis.
- Responsável por atendimento/verificação: **Carlos Faustino confirmado expressamente em01/11/2026**. Procedimento de comprovação familiar e acesso técnico continuam sujeitos a aprovação e teste.
- [ ] Aprovar contrato mínimo de admissão, vínculo, supervisão/tempo/denúncia e regularização das contas existentes; implementar/testar somente os controles necessários.
- [ ] Conferir condições dos operadores, retenção/transferências e preferência de treinamento Vercel; aprovar qualquer mudança sensível antes de aplicá-la.
- [ ] Homologar emTEST negação por falta de requisito, isolamento entre famílias, vínculo legítimo, replay, revogação e supervisão; não fabricar famílias ou consentimentos.

O responsável operacional foi confirmado; os demais itens permanecem pendentes. Aprovar o texto sozinho não comprova a operação ou os controles técnicos. A política não será publicada como vigente nem o público8+ liberado enquanto faltar gate indispensável.

## Referências oficiais verificadas

- [LGPD, art.14 e informações acessíveis a famílias](https://www2.camara.leg.br/legin/fed/lei/2018/lei-13709-14-agosto-2018-787077-normaatualizada-pl.html); [enunciado da ANPD sobre bases legais e melhor interesse](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes). Base legal exige avaliação concreta, inclusive para dados sensíveis; não se presume pelo tema religioso.
- [ECA Digital, arts.10/17/21/24](https://www2.camara.leg.br/legin/fed/lei/2025/lei-15211-17-setembro-2025-797997-normaatualizada-pl.html): idade, supervisão, interação e vínculo do responsável para contas de até16anos, conforme aplicação ao serviço; [guia ANPD publicado em28/10/2026](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-publica-guia-que-esclarece-quem-deve-cumprir-e-quais-sao-as-responsabilidades-das-plataformas-na-protecao-de-criancas-e-adolescentes).

Preparação técnica pelo autor, sem parecer jurídico independente ou aprovação do proprietário presumidos.
