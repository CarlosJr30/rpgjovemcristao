# GUILD-037 — Revisão preliminar de privacidade para lançamento público

**Data:** 2026-11-15
**Escopo:** criação própria de Guildas (COMMUNITY-043B), marcador de criação, exclusão Supabase Auth, auditoria e eventual participação de menores
**Tipo de documento:** avaliação técnica/documental preliminar assistida por IA, NÃO é parecer jurídico, aprovação formal de privacidade ou autorização de ativação
**Status:** REVIEWED_WITH_OPEN_ITEMS; PRIVACY_SIGNOFF=PENDING
**Nenhum dado pessoal de jogadores consultado ou incluído.**

## Material examinado no repositório

- `docs/architecture/GUILD-035-RETENTION-DECISION.md`
- `docs/architecture/GUILD-035C-CONTRACT.md`
- `docs/architecture/GUILD-036-REPORT.md`
- `docs/architecture/GUILD-036-PUBLIC-LAUNCH-AUTHORIZATION.md`
- `packages/database/deployments/community043b/production-package.json`
- `packages/database/deployments/community043b/sql/community_retention_v1.sql.in`
- PR #55, no commit `fc8921f3ecc970297a5869c8025efee5642182ed`, quando iniciada a análise.

## Resultados sustentados pela fonte

1. **Produto:** aprovado pelo proprietário. Um único marcador de criação por conta; janela máxima de 30 dias após exclusão quando houver finalidade demonstrada. A GUILD-036 esclarece que `deleteUser` é irreversível e não prevê reconstrução de identidade.
2. **Implementação candidata:** a sexta operação usa HMAC-SHA256 do UUID Auth com segredo privado e tabelas internas sem permissões de usuário. Impede novas criações quando o cron não estiver operacional. A política desidentifica no evento de exclusão coberto, em vez de aguardar 30 dias sem finalidade de recuperação.
3. **Auditoria:** a correção é limitada aos eventos `guild_create` relacionados, preservando outras ações. Não equivale a anonimizar todo o histórico de uso, participação, avatar ou conteúdo gerado pelo jogador.
4. **Exclusão:** outras FKs e dados de outros módulos podem impedir hard-delete do usuário; a operação deve falhar integralmente, não remover indiscriminadamente referências. Necessário fluxo público de solicitação, resolução de impedimentos, suporte e transparência; a migration isolada não prova esse fluxo completo.
5. **Agendamento:** o relatório GUILD-036 documenta validação real de pg_cron 1.6.4 em TEST com watchdog e falhas. Isto não comprova instalação nem operação em PROD.
6. **Publicação:** o pacote está `blocked`, `migrations=[]`, PR #55 permanece Draft; não existe decisão formal de privacidade aprovada.

## Parecer técnico preliminar

**Adequação técnica condicionada:** os mecanismos específicos de marcador e desidentificação avançaram, e a execução real de pg_cron foi testada em TEST, mas faltam controles documentados para exclusão completa, transparência e lançamento público. Não marcar PRIVACY_APPROVED nem PROD_READY.

### Pontos que exigem decisão de controlador/responsável por privacidade

A. **Bases legais por finalidade:** documentar bases pertinentes a autenticação, cadastro, avatar, Guilda, convites, auditoria e prevenção de duplicidade. Não presumir que o consentimento cubra automaticamente todas as finalidades.

B. **Menores de idade:** definir política de público e controles de acesso/cadastro; demonstrar avaliação do melhor interesse, riscos de convites e conteúdo de Guilda, medidas de segurança, transparência acessível e eventual consentimento/responsabilidade dos responsáveis quando exigidos. O fato de as três contas atuais serem de adultos não comprova que contas futuras o serão.

C. **Aviso de privacidade:** identificar controlador e canal de contato, categorias de dados, finalidades, bases legais, prazos, operadores/serviços, mecanismos de direitos e exclusão. Documentar e disponibilizar ao usuário antes do lançamento.

D. **Exclusão irreversível:** descrever e testar a jornada do usuário para solicitar exclusão, identidade/autorização, bloqueios de FK/Storage e tratamento de liderança/associações; não prometer recuperação após `deleteUser`, nem apagamento de todos os dados se houver outras retenções legais ou técnicas.

E. **Desidentificação parcial:** identificar referências residuais em outros módulos, logs, históricos e backups; verificar se podem ser correlacionadas. HMAC com segredo continua pseudonimização, não anonimização automática.

F. **Operação:** nomear controlador/responsável pelo processo, processo para responder solicitações e incidentes, monitorar job/alertas e documentar exceções legais. O relatório GUILD-036 indica proprietário como operador de referência, não como revisor jurídico independente.

## Referências públicas consultadas

- ANPD, Enunciado CD/ANPD nº 1/2023, tratamento de dados de crianças/adolescentes conforme bases dos arts. 7/11 da LGPD e prevalência do melhor interesse: https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes
- Supabase, Auth Admin deleteUser, soft delete não reversível: https://supabase.com/docs/reference/javascript/auth-admin-deleteuser
- Supabase, gestão de usuários, exclusão e validade de JWTs: https://supabase.com/docs/guides/auth/managing-user-data

## Encaminhamento para revisão competente

Solicitar decisão assinada/datada sobre:
1. Base legal para cada finalidade e legitimidade/necessidade da retenção;
2. política efetiva para futuros menores de idade, incluindo melhor interesse;
3. adequação da desidentificação parcial e dos resíduos;
4. procedimento de exclusão, tratamento de falhas e direitos do titular;
5. aprovação do aviso/termos de privacidade ao público;
6. riscos aceitos, medidas e condições de lançamento.

**Responsável competente e número de parecer:** NÃO IDENTIFICADOS. O documento anterior exige designação. Não inventar assinatura, parecer ou fundamento.

## Execução técnica remanescente após decisão válida

- Verificar a aprovação formal e incorporar eventuais exigências;
- revalidar CI para SHA final;
- fechar manifest/hashes e verificar migrations/estado remoto;
- instalar seis operações e configurar pg_cron com criação desabilitada;
- validar smoke autenticado e RLS com contas autorizadas;
- integrar PR #55 pelo fluxo normal e confirmar Vercel PROD READY;
- ativar por controle auditado e validar convites e criação.

**Resultado da revisão preliminar:** DOCUMENTED / NOT A LEGAL PRIVACY SIGNOFF. Nenhuma migration, merge ou ativação autorizada por este documento sozinho.
