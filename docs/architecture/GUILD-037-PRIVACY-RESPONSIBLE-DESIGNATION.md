# GUILD-037 — Designação do responsável pelo projeto para coordenação da revisão de privacidade

**Data:** 2026-11-15  
**Indicado pelo proprietário:** Carlos Roberto Faustino Junior  
**Função informada:** Idealizador do projeto RPG Jovem Cristão  
**Papel neste processo:** responsável indicado para coordenar a revisão de privacidade e documentar as decisões de produto/gestão referentes ao lançamento público de Guildas.

## Limites da designação

A identificação acima foi fornecida expressamente pelo usuário, que informou ser o responsável. Não há comprovação nesta designação de que seja advogado, encarregado de dados formalmente nomeado, DPO ou profissional com habilitação jurídica. A designação como coordenador e responsável pelo projeto **não constitui parecer jurídico, avaliação independente, aprovação da política de privacidade nem liberação automática de produção**.

## Análise a concluir e registrar

O responsável deverá registrar decisão datada sobre: (1) bases legais e transparência para criação de Guildas, prevenção de duplicidade e retenção; (2) exclusão irreversível no Supabase Auth e limites da desidentificação; (3) tratamento de dados e salvaguardas para possíveis jogadores menores de idade; (4) aviso de privacidade, contato e atendimento aos direitos de titulares; (5) tratamento de referências residuais em outros módulos e cópias; (6) responsável pelo acompanhamento do cron, incidentes e exceções de retenção legal.

A revisão técnica preliminar está em `docs/architecture/GUILD-037-PRIVACY-PRELIMINARY-REVIEW.md`; a decisão de produto está em `docs/architecture/GUILD-035-RETENTION-DECISION.md`.

**Status:** RESPONSIBLE_DESIGNATED; PRIVACY_DECISION=PENDING; LEGAL_SIGNOFF=NOT_RECORDED.

Não inserir dados pessoais de jogadores nesta revisão. Não executar migrations PROD, merge ou ativação usando apenas esta designação.
