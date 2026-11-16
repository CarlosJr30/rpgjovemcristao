# GUILD-036 — Autorização do proprietário para lançamento público das Guildas

**Data:** 2026-11-15
**Decisor:** proprietário do RPG Jovem Cristão
**Tipo:** decisão de produto e autorização de publicação, não parecer jurídico
**Status:** APPROVED (escopo de lançamento público)

## Decisão expressa

O proprietário confirmou que, até esta data, existem três contas de teste pertencentes a adultos (ele e dois amigos). Autorizou explicitamente o lançamento público do jogo assim que a funcionalidade de criação própria de Guildas estiver disponível.

A criação de Guilda deve ser liberada para **todos os futuros jogadores que se cadastrarem e atenderem aos requisitos de elegibilidade**; não limitar a funcionalidade às três contas existentes, não exigir autorização de outro líder, e não presumir que todos os futuros usuários serão adultos.

## Limites da aprovação

Esta autorização confirma o público-alvo da liberação e dispensa pedir novamente autorização rotineira do proprietário para publicar a funcionalidade já aprovada. Não representa parecer técnico-jurídico de conformidade, nem comprova aprovação da revisão de privacidade pendente, e não autoriza registrar verificações como PASS sem evidência.

Manter controles de autenticação, RLS, quotas, criação única por conta, proteção de registros históricos, política de retenção aprovada em GUILD-035 e validação remota. Para lançamento público, avaliar explicitamente tratamento de menores de idade, informação ao usuário e fluxos de exclusão, bem como a documentação/decisão de privacidade necessária.

## Estado da entrega ao registrar decisão

- PR #55 ainda Draft, último SHA observado 706202db72d1cafbdbca7b45022d7a5efccb8937;
- CI desse SHA aprovado (run 43740253128);
- GUILD-036: Auth resolvido, retenção tecnicamente pronta, pg_cron efetivamente validado em TEST, conforme relatório do executor;
- seis operações SQL COMMUNITY pendentes em PROD;
- ativação geral de Guildas pendente;
- revisão formal de privacidade ainda pendente.

## Próxima execução

Concluir objetivamente a revisão de privacidade exigida e os gates hospedados restantes; depois aplicar SQL, integrar PR pelo fluxo normal, verificar Vercel PROD e ativar criação. Manter registro verificável de responsáveis, parecer, checks, hashes, migrations, logs e resultado real. Não apresentar autorização de produto como aprovação legal inexistente.
