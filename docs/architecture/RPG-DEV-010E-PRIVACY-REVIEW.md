# 010E — preparação da revisão de privacidade

28/10/2026. **Revisão técnica preparatória, não aceite jurídico ou autorização de publicação.** Nenhum chat/notificação/delegação novos liberados. Reutilizar a comunicação supervisionada existente e preservar os controles publicados; não coletar novos dados nesta revisão.

## Fontes e decisões pendentes

A LGPD trata convicção religiosa e filiação a organização religiosa vinculadas a uma pessoa natural como dados sensíveis. O inventário deste projeto precisa considerar que um vínculo identificável a célula/EBD pode revelar essa informação; isso é uma avaliação de risco do projeto, não decisão automática sobre a base legal. Fonte: [LGPD, texto compilado, art.5º/11/14](https://www.presidencia.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm).

A ANPD orienta avaliar o melhor interesse de crianças e adolescentes no caso concreto, considerando as hipóteses dos artigos7º ou11. Não presumir que um checkbox genérico, convite ou permissão de líder resolva esse exame. Fonte: [Enunciado1/2023 e explicação oficial](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes).

A revisão atual também precisa contemplar o ECA Digital e seus mecanismos de proteção para jogos com interação entre usuários; analisar somente LGPD seria insuficiente. A ANPD informa vigência desde17/03/2026 e mantém orientações/cronograma de aferição etária. Não concluir adequação sem verificar o enquadramento concreto, as normas vigentes e a solução aprovada para este produto. Fontes: [ANPD/ECA Digital](https://www.gov.br/anpd/pt-br/assuntos/eca-digital), [Lei15.211/2025](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm), [Decreto12.880/2026](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/d12880.htm).

## Inventário mínimo e aceite por fronteira

| Fronteira | Contrato técnico proposto | Decisão/evidência ainda necessária |
| --- | --- | --- |
|Identidade e vínculos|Alias/avatar no grupo autorizado; IDs somente como chaves técnicas, nunca diretório público. Auth guarda o endereço, sem expor lista de e-mails/telefones.|Controlador/responsáveis, finalidade e hipótese legal documentados por operação; público etário e aferição/supervisão definidos.|
|Chat supervisionado|Somente membros do escopo; sem mensagens privadas livres. Líder/moderador com papel explícito, denúncia e histórico mínimo de decisões. Nenhum acesso administrativo a reflexão privada por conveniência.|Política de moderação, contato prejudicial, recurso, supervisão e mecanismo parental adequado. Cobertura real de membro/expulso/moderador em Guildas distintas.|
|Avisos no jogo|Eventos mínimos de aula/convite/atividade, destinatários calculados no servidor; sem e-mail/push externos por padrão, sem prévia de conteúdo privado.|Texto informativo, preferência e retenção; política para avisos sensíveis. Confirmar que leitura não dispara participação/recompensa.|
|Presença e atividades|Comprovar somente participação/resultado pertinente; não exigir foto, localização precisa, texto de oração ou avaliação de fé.|Finalidade, minimização e retenção por tipo de registro; acesso de professor limitado à classe e período autorizado.|
|Concursos compartilhados|Equipes e totais proporcionais, sem lista pública identificável de adolescentes. Mesmo evento canônico para impedir crédito duplicado entre Guildas.|Consentimento operacional de todos os líderes envolvidos, avaliação de exposição e documentação de participantes elegíveis. Consentimento do líder não é base legal presumida do titular.|
|Auditoria administrativa|Motivo sem credenciais/dados devocionais; acesso explicitamente autorizado, paginação e proteção contra alteração pela aplicação.|Retenção, consulta pelo titular, revisão independente e tratamento de solicitações de eliminação. Imutabilidade técnica não significa conservação ilimitada de dados pessoais.|
|Saída/pausa/arquivamento|Revogar acesso prospectivo do vínculo/delegação, preservar outros vínculos e dados do jogador. Nunca expor histórico privado ao novo líder por herança automática.|Separar prazo de guarda, obrigação de preservação e anonimização/eliminação aplicáveis; transferência de liderança e reativação revisadas.|

## Gates antes de ampliar comunicação em PROD

- Registro de revisão humana com responsável, versão, finalidade/base legal, avaliação do melhor interesse, informação ao titular/responsável e solução de aferição/supervisão pertinente.
- Política operacional de moderação, denúncia/recurso, retenção e resposta a incidentes; responsáveis realmente designados, sem inferir poder por nome/nível.
- Testes de isolamento Guilda/classe/conta, revogação imediata e delegação expirada; notificações não vazam conteúdo em destinatários ou logs.
- CI/Preview TEST/fluxos reais e preservação estrutural/de dados; nenhuma liberação de economia ou progresso como efeito colateral.

Esses pontos estão **PENDING**, não aprovados automaticamente. Esta preparação não altera a produção, não declara conformidade geral do sistema legado e não substitui o fluxo de publicação da RELEASE_POLICY.
