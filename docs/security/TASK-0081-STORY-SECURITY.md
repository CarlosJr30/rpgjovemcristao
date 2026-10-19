# TASK-0081 — revisão de segurança local

Data: 19/10/2026. Security pelo próprio autor; sem revisão independente. Escopo: diff local da campanha e proposta SQL, não produção.

## Fronteiras verificadas

- `journey_progress`, `gardenCompleted`, `nextPhaseUnlocked` e flags de Guilda não autorizam a conclusão oficial. O histórico permanece intacto; o modo narrativo novo usa recibos separados por Viajante.
- `story_progress` e `story_definitions`: cliente authenticated apenas SELECT, RLS e bloqueio de identidade anônima. Inserts/updates/deletes pelo cliente são negados. A conta existente é reutilizada, sem nova identidade.
- `story_private.step_receipts`: schema sem USAGE para cliente, RLS ativa e sem grants de escrita a anon/authenticated. Somente futuro validador de servidor pode atestar atividades, vídeo e recibo econômico; não foi criado endpoint que aceite prova autodeclarada.
- `complete_story`: SECURITY DEFINER necessário para atualizar o snapshot protegido, `search_path=''`, relações qualificadas, autorização pela conta Auth real não anônima e ownership, bloqueio do Viajante para serializar chamadas, ordem anterior + requisitos + revisão verificados. EXECUTE revogado de PUBLIC/anon/service_role e concedido a authenticated. Nenhum papel de líder exigido.
- Vídeo aberto/tempo parcial/revisão antiga não satisfazem a proposta. `source` diferencia eventos de navegador de API; isso não constitui antifraude. O validador de vídeo ainda não existe. Nunca transmitir service_role ao cliente.
- Embeds somente por IDs validados e hosts fixos YouTube privacy-enhanced/Vimeo; URL arbitrária não é usada como src. Carregamento apenas por ação explícita e metadados aprovados. Catálogo real não contém nenhum vídeo selecionado.
- Recompensa não é concedida pelo novo RPC: ele exige recibo econômico já emitido. Unicidade do recibo e retorno false após primeira conclusão protegem a confirmação/revisita. Integração econômica real e recibos de recompensas legadas dependem da TASK-0078, sem alterar seu contrato.
- A troca de conta/Viajante esconde imediatamente o snapshot anterior e cancela respostas antigas; teste direcionado cobre a corrida.
- Leitura de erro ausente/inválida falha de forma visível e não produz progresso oficial fictício. Saves antigos não são apagados.

## Evidência e limites

PostgreSQL 17 real em container sintético: sem rede, portas, bind mounts, backups ou dados pessoais. RLS/ACL, negações, dependências, ordem, snapshots, duas confirmações simultâneas, repetição e recibo único passaram. As flags content/video/reward são false na proposta; somente a fixture as ativa dentro do banco descartável. Nenhum SQL foi aplicado em serviço remoto. A proposta não é migration registrada, nem foi adicionada ao journal Drizzle; conversão/integração e advisors do ambiente alvo ficam para autorização futura.

Referências técnicas consultadas: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Database Functions](https://supabase.com/docs/guides/database/functions), [changelog](https://supabase.com/changelog). O índice Markdown foi consultado; mudança de cifras TLS anunciada para 10/11/2026 não altera estes contratos SQL locais. Nenhum advisor remoto executado.

Sem novas dependências, manifests/lockfile inalterados. A auditoria da TASK-0080 permanece encerrada e seus avisos DEV aceitos apenas para preparo isolado não foram reabertos nem declarados corrigidos. Gates herdados de build não significam reativação de overlays cancelados; nenhum asset/encaixe foi modificado.

Limitações que bloqueiam aceite integral: falta de conteúdo/vídeos autorizados, ingestão/atestação de eventos de atividades, integração de recibos econômicos, aplicação autorizada da proposta e teste hospedado de Auth/JWT/PostgREST. As antigas APIs econômicas continuam no estado herdado: este trabalho não certifica nem altera a segurança econômica pendente da TASK-0078. Nenhuma promessa de antifraude ou de recompensa econômica end-to-end.

Parecer: controles novos testados localmente, sem achado alto/crítico novo identificado no diff. Integração completa BLOCKED pelas dependências; não apto a produção por este parecer. QA/Security não independentes.
