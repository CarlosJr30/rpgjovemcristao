# RPG-COMMUNITY-043A — decisões para aprovação

Os itens abaixo são propostas, não decisões aprovadas por estarem documentadas. A fundação não inicia 043B/043C até os pontos aplicáveis terem resposta do proprietário e contratos de implementação revisados.

| ID | Decisão necessária | Recomendação inicial | Risco se ficar sem decisão |
| --- | --- | --- | --- |
| D1 | Quem pode criar Guilda e quais requisitos de conta/avatar? | Conta autenticada elegível, avatar ativo e próprio quando a ação do jogo o exigir; criação transacional e idempotente. | Abuso de criação ou poder delegado a avatar alheio. |
| D2 | Diretório autenticado ou público? Quais campos? | Autenticado por padrão; ID público/nome/emblema/descrição moderada e contagem agregada somente se aprovada. Sem roster, progresso ou identificador pessoal. | Enumeração e exposição de menores. |
| D3 | Política para Guilda pública? | `request` como padrão; adesão imediata explicitamente opcional após limites/moderação aprovados. Privada só por convite. | Entrada abusiva e exposição sem controle. |
| D4 | Quotas e rate limits numéricos | Medir uso e abuso; definir por conta, Guilda e janela antes de abrir criação/diretório. Não importar números arbitrários. | Spam, enumeração, flooding de pedidos/convites. |
| D5 | Permissões exatas de moderador/colíder/líder | Aprovar matriz 043A-PERMISSIONS; privilégio sempre local, ação auditada, Admin global separado. | Escalada de privilégio e remoção/convite em Guilda errada. |
| D6 | Convites e entrada | Expiração, revogação, usos, idempotência e troca de papel; aceitar somente após checagem atual do ator e Guilda. | Replay, enumeração ou entrada após revogação. |
| D7 | Eventos elegíveis de missões automáticas | Allowlist versionada de eventos de História/Arena realmente emitidos no servidor; excluir prova textual como prova automática. | Recompensas por client spoofing ou eventos duplicados. |
| D8 | Anti-farm cross-Guilda | Uma chave do evento canônico limita o mesmo evento/recompensa globalmente; definir Auth/account/avatar/evento participante e janela. | Uma ação gerar claims em várias Guildas ou tipos de missão. |
| D9 | Recompensas de missões | Usar apenas tiers e autoridade ECONOMY-041 aprovados, por receipt; decidir requisitos de participante mínimo/revisão. Nenhum campo livre de valor. | Desvio da economia ou dupla concessão pela função legada. |
| D10 | Elegibilidade account-level EBD e proteção de menor | Escola/turma privada por padrão; perfil mínimo e revisão legal de LGPD/consentimento antes de produção ampla. | Coleta excessiva e tratamento inadequado de dados infantis. |
| D11 | Aulas e identidade EBD | Reutilizar `guild_lessons` com `school_id` aditivo só se compatibilidade provar; manter traveler legado e dar account_id inequívoco a novos atores sem avatar. | Perda de histórico ou vinculação falsa de aluno/professor. |
| D12 | Mapeamento de classes/escolas legadas | Mapa individual revisável; legado ambíguo permanece em Guilda sem transferência de papel/dado. | Transferência de aula ou acesso a escola errada. |
| D13 | Link EBD–Guilda | Consentimento independente dos dois responsáveis; revogável; inicialmente apenas associação agregada, sem roster/matrícula/resposta. | Herança involuntária de cargos ou exposição de dados escolares. |
| D14 | Conteúdo, denúncias, retenção e exclusão | Definir responsável/SLA, denúncia/bloqueio, retenção por categoria e exclusão/retenção legal antes de diretório e escola. | Conteúdo abusivo sem resposta ou retenção indefinida. |
| D15 | Chat | Preservar chat Guild-bound existente; sem chat público global, DM ou contato irrestrito entre menores nesta expansão. | Confundir recurso atual moderado com uma permissão pública nova. |
| D16 | Recuperação e cutover | Compatibilidade expand/contract; backup restaurável ou recovery plan específico; não recriar índice single-Guilda nem executar downgrade destrutivo. | Perda de relações, indisponibilidade ou rollback incompatível. |

## Bloqueios conhecidos para os próximos incrementos

- **043B** depende de D2–D6, quotas aprovadas, PR #53 integrada e schema fresh read-only. A policy `guilds_select_member` atual não é diretório público.
- **043C** depende de D10–D14, plano jurídico/privacidade e mapeamento legado. O banco atual não tem `school_id` em aulas/classes e os atores existentes são travellers.
- **043D** depende de D7–D9 e prova de integração ECONOMY-041; `guild_reward_claims` deduplica por mission/avatar, não globalmente pelo evento.
- Os números/roles desta lista não alteram autorização técnica atual. Nenhuma resposta a estes itens autoriza sozinha código, migration ou publicação; cada fase requer contrato aprovado.
