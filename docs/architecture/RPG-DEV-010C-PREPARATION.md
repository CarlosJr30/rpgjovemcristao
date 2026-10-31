# 010C — preparação de Células, atividades e desafios

31/10/2026 — **Proposta para próxima etapa, sem implementação ou publicação010C.** Base produtiva010B.3/4ded3c5, com classes, convites e administração publicados. Este documento fica fora da PR21. Não é aprovação de conteúdo, algoritmo competitivo ou recompensas.

## Escopo proposto

Reutilizar `guild_missions`, `guild_ops`, revisão educativa, seleção explícita de Guilda e as permissões consultadas no servidor. Preservar classes/EBD: classe não vira Célula, aula não vira encontro e professor não recebe automaticamente administração de eventos. Manter artes, menu e componentes existentes.

- Encontros presenciais e digitais com agenda, participação declarada, validação por responsável autorizado e histórico auditado.
- Atividades, desafios cooperativos e gincanas com critérios versionados, participantes e responsáveis explícitos.
- Eventos conjuntos e competições entre Guildas somente com aceite dos responsáveis de cada comunidade, escopo e regras fixados antes do início.
- Resultado educativo e elegibilidade futura separados de qualquer autoridade econômica. Nenhum XP, moeda, baú, item ou carta até a010D homologada.

## Fronteiras obrigatórias

Cada comando deve vincular Auth não anônimo, avatar próprio ativo, Guilda, atividade/evento e revisão. Identidade canônica é o UID confirmado pelo servidor: dois avatares da mesma conta não representam duas pessoas nem duas equipes concorrentes. Delegações serão explícitas e revogadas no servidor, inclusive em JWT ainda válido; Admin global não recebe papel operacional por inferência.

Participação declarada não comprova presença física, leitura humana ou fé. Não exigir fotos, localização precisa, depoimentos ou texto devocional privado. Não publicar listas de adolescentes. Visibilidade própria, do responsável autorizado e de agregados comunitários precisa ser delimitada antes de habilitar qualquer compartilhamento. Chat/notificações e questões de privacidade010E permanecem separados.

Resultado enviado pelo navegador não é prova suficiente. Planejar emissor/verificador apropriado ao tipo de atividade, idempotência por nonce, consumo atômico, revisão fixada, concorrência e retomada de resultado incerto. Preservar tentativas, vínculos e auditoria; não limpar dados para recuperar versão. Não converter missões históricas automaticamente nem reconciliar os16XP/6moedas legados.

## Decisões a fechar no contrato de implementação

| Decisão | Proposta para discussão | Estado |
| --- | --- | --- |
| D1 — responsáveis | Líder designa validadores por comunidade/evento; poderes explícitos, sem herança automática de professor | PENDENTE |
| D2 — equilíbrio competitivo | Fixar elegibilidade, identidade canônica por conta e fórmula proporcional antes de abrir inscrições | PENDENTE; nenhuma fórmula aprovada |
| D3 — validação | Definir quais atividades aceitam declaração, validação humana ou prova verificável pelo servidor | PENDENTE |
| D4 — evento conjunto | Aceite de todas as comunidades, regras versionadas, efeito de revogação e cancelamento preservador | PENDENTE |
| D5 — privacidade | Campos mínimos, quem consulta cada dado, retenção e ausência de exposição pública de menores | PENDENTE; sem aceite jurídico alegado |
| D6 — conteúdo e resultados | Revisar conteúdo reutilizável, rubrica educativa e tratamento de empates/contestação sem pontuar fé | PENDENTE |

## Sequência de execução futura

Auditar interfaces legadas e definir contrato ativo mínimo antes de alterar runtime. Implementar em branch010C própria sobre a produção atual, sem incorporar PR12/18. Executar testes direcionados de autorização, isolamento, revogação, replay, concorrência, privacidade e preservação; depois CI exato, Supabase TEST e Preview com as duas identidades QA normais existentes. Diferenciar fixtures de provas hospedadas e mobile emulado de aparelho físico.

Pacote PROD próprio somente após homologação TEST, com baseline, recuperação/contenção, revisão de segurança e fluxo RELEASE_POLICY completo. Nenhuma migration, concessão ou publicação010C foi preparada para execução por este documento. O runtime010B.3 e suas evidências permanecem a referência aceita.
