# Privacidade do acesso antecipado — proposta v0.1

01/11/2026. **PARA REVISÃO; NÃO APROVADA/NÃO PUBLICADA.** Público mínimo8anos, responsável e contato fornecidos pelo proprietário. Isto não comprova consentimento de famílias, idade de jogadores ou funcionamento de controles ainda ausentes.

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

1. Designar quem verificará as famílias; Carlos é o responsável pelo projeto informado, mas não se presume que já assumiu esse procedimento. Verificar identidade e relação legal por meio proporcional documentado, preferencialmente na relação presencial já existente com a família; líder/professor não substitui responsável legal. Não exigir foto/documento permanente por padrão.
2. Registrar apenas referências protegidas de conta da criança e responsável, faixa necessária, versão/finalidade da autorização, data, verificador e estado. Preservar separação de participação educativa e dados religiosos/privados; não guardar texto devocional como prova de autorização.
3. Exigir evidência válida no servidor antes da admissão, incluindo a chamada direta ao Auth; um bloqueio apenas na tela é contornável. Não confiar em idade/papel/autorização enviados em `user_metadata`. Convites comuns/administrativos não substituem esse gate.
4. Vincular e conferir as autorizações aplicáveis às contas de até16anos, oferecer as salvaguardas de supervisão/limitação apropriadas e atendimento/revogação. Não compartilhar senha, converter avatar em usuário independente ou alterar jogadores antigos para fabricar a prova.
5. Homologar em TEST permissão/negação/replay/isolamento/revogação com famílias QA autorizadas e fluxo legítimo de e-mail; só então propor produção. O desenho técnico final e a assunção do procedimento humano dependem de aprovação explícita. Não iniciar um novo módulo de jogo ou modificar a Administração para simular o cumprimento.

Este é o menor contrato de admissão proposto, não um mecanismo existente. O público mínimo8anos é uma escolha informada pelo proprietário e não uma classificação indicativa oficial atribuída por este relatório.

## Referências oficiais verificadas

- [LGPD, art.14 e informações acessíveis a famílias](https://www2.camara.leg.br/legin/fed/lei/2018/lei-13709-14-agosto-2018-787077-normaatualizada-pl.html); [enunciado da ANPD sobre bases legais e melhor interesse](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes). Base legal exige avaliação concreta, inclusive para dados sensíveis; não se presume pelo tema religioso.
- [ECA Digital, arts.10/17/21/24](https://www2.camara.leg.br/legin/fed/lei/2025/lei-15211-17-setembro-2025-797997-normaatualizada-pl.html): idade, supervisão, interação e vínculo do responsável para contas de até16anos, conforme aplicação ao serviço; [guia ANPD publicado em28/10/2026](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-publica-guia-que-esclarece-quem-deve-cumprir-e-quais-sao-as-responsabilidades-das-plataformas-na-protecao-de-criancas-e-adolescentes).

Preparação técnica pelo autor, sem parecer jurídico independente ou aprovação do proprietário presumidos.
