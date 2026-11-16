# GUILD-041 — Lançamento público fase 1 restrito a adultos (18+)

**Data da decisão:** 2026-11-15  
**Decisor:** Carlos Roberto Faustino Junior, proprietário e idealizador do RPG Jovem Cristão  
**Tipo:** decisão vinculante de produto sobre escopo da primeira publicação  
**Status:** PRODUCT_APPROVED / IMPLEMENTATION_PENDING / PRIVACY_REVIEW_PENDING / NOT_DEPLOYED

## Decisão expressa

**Fase 1: o jogo inteiro e o cadastro de novas contas serão disponibilizados somente a pessoas de 18 anos completos ou mais.** Isso inclui a criação, liderança, administração e participação em Guildas. Pessoas menores de 18 anos **não deverão criar contas nem utilizar o jogo durante a fase 1**.

**Fase 2, futura e separada:** considerar o cadastro e a participação de menores somente depois de implementar e validar as medidas legais, de privacidade, segurança e supervisão aplicáveis. Sem data de ativação ou permissão implícita.

Esta decisão **substitui para a fase 1** a autorização de cadastro de menores da GUILD-038 e a proposta anterior de que menores poderiam participar de Guildas. Preserva a regra GUILD-040 de liderança/criação 18+.

## Critérios funcionais de fase 1

1. Bloquear no **backend** o cadastro/ativação elegível e os acessos protegidos de menores e de contas sem a aferição etária exigida; não confiar somente em ocultação de UI.
2. Aplicar controle de idade ao acesso ao jogo e também a todas as rotas/ações de criação, liderança, promoção, convites e participação em Guildas. Regras autorizativas jamais dependem de `user_metadata` ou checkbox editável como prova suficiente.
3. Tratar as três contas antigas declaradas adultas como **não verificadas** até existir evidência adequada de elegibilidade, sem apagar avatares, saves ou contas. Não inferir idade apenas da declaração do proprietário.
4. Definir/contratar mecanismo proporcional de aferição etária verificável, armazenando apenas atributo de elegibilidade, comprovação mínima, fonte e validade com acesso restrito. Evitar coletar documento/biometria sem necessidade e base adequada.
5. Quando o serviço não conseguir aferir idade, **negar acesso ao jogo para a fase 1** com mensagem clara e alternativa de suporte/revisão.
6. Não permitir caminhos alternativos por login social, convite, chamadas diretas de RPC, token antigo ou sessões legadas. Tratar revogação/renovação de sessão quando necessário.
7. Exibir informação de faixa etária 18+ no cadastro e na entrada; não representar a mera declaração como verificação independente.
8. Manter segurança/Auth/RLS, quotas, retenção aprovada e histórico das Guildas. Não ativar os fluxos de menores preparados para fase 2.
9. Preparar aviso de privacidade para o lançamento inicial **adulto** e fluxo de solicitações de titulares. Restringir por idade não afasta LGPD.
10. Tratar risco de serviço que possa atrair menores mesmo se identificado como 18+; não declarar automaticamente inaplicáveis todos os requisitos de proteção infantojuvenil.

## Impacto nas entregas e aprovação

- GUILD-040: sete operações candidatas, travas 18+ locais, CI `43780988289` aprovado no SHA `76ea4ed`, segundo relatório de execução.
- Não apagar nem modificar dados de jogadores existentes.
- PR #55 permanece Draft e SQL PROD não aplicado até completar aferição, validação hospedada e revisão formal aplicável.
- A autorização rotineira de publicação já está concedida; não pedir novamente. A designação do idealizador como coordenador de privacidade não cria parecer jurídico.
- CI da branch e pacote de migrations devem ser revistos no SHA final; somente executar deploy/ativação depois dos gates de integridade e privacidade efetivamente cumpridos.

## Plano direcionado

**P0:** implementar restrição global e aferição confiável de idade, incluindo cadastro e acessos existentes; testar adult/underage/unknown e bypass via RPC/URLs.  
**P1:** reduzir o aviso e controles ao lançamento adulto, concluir revisão de privacidade aplicável e documentação operacional.  
**P2:** validar hospedado, ajustar package/preflight, instalar sete operações SQL com controle desligado, integrar PR #55, confirmar Vercel PROD READY e ativar fluxo para adultos; verificar de ponta a ponta.

**Fim da fase 1:** somente jogadores efetivamente elegíveis como 18+ conseguem cadastrar-se, acessar o jogo e usar Guildas. Nenhum menor está liberado apenas por ser membro de Guilda.

**Não declarar DONE por este documento isolado.**
