# GUILD-038 — Decisão de público: menores de 18 anos permitidos

**Data:** 2026-11-15
**Decisor de produto:** Carlos Roberto Faustino Junior, idealizador e responsável indicado para coordenação da revisão de privacidade.
**Status:** PRODUCT_DECISION_APPROVED / COMPLIANCE_REVIEW_PENDING / NOT_DEPLOYED

## Decisão expressa

**Fase1 GUILD-041:** a decisão `387b5f0` substitui a admissão de menores durante o lançamento inicial. Cadastro/acesso ao jogo ficam limitados a adultos com elegibilidade validada. Participação de menores pertence somente à futura fase2, sem ativação implícita. A revisão de privacidade permanece pendente.

**Complemento definitivo GUILD-040:** somente jogadores com **18 anos completos ou mais**, com elegibilidade validada no servidor, podem criar ou liderar Guildas. Inclui transferências, promoções, atribuições administrativas e recuperação de conta. Líder de célula e professor de EBD não têm exceção. Adultos elegíveis não precisam de aprovação de outro líder. Menores podem jogar e participar somente com as salvaguardas aplicáveis; essa decisão não prova que elas estejam implantadas.

A integração real de aferição etária e a revisão formal de privacidade continuam pendentes. Azure/AWS foram mencionados, mas nenhum serviço específico, contrato de evidência ou sandbox foi disponibilizado. Não há autorização para inferir idade de cargo, e-mail, avatar, metadados editáveis ou checkbox.

O jogo RPG Jovem Cristão poderá aceitar cadastro e participação de **crianças e adolescentes com menos de 18 anos**. A funcionalidade de Guildas deverá atender jogadores elegíveis, incluindo menores, quando cumprirem as salvaguardas apropriadas.

Esta decisão não é autorização para desativar verificações de idade, supervisão parental, proteção de dados ou controles específicos de comunicação; não equivale a parecer jurídico ou a comprovação técnica de conformidade. Não presumir que as três contas existentes de adultos descrevem o público futuro.

## Requisitos de lançamento a avaliar e implementar

- Avaliar a aplicação da LGPD, art. 14, e a prevalência do melhor interesse de crianças/adolescentes (Enunciado ANPD nº 1/2023).
- Avaliar a Lei nº 15.211/2025 (ECA Digital), vigente em 2026, e regulamentação aplicável a jogos e serviços com acesso provável de menores.
- Definir experiência por faixa etária, aferição de idade adequada, informação aos responsáveis, e mecanismos de supervisão/consentimento onde exigidos. Não inferir que simples autodeclaração ou checkbox prove responsabilidade parental.
- Antes de liberar interação em Guildas, convites, solicitações e eventual bate-papo, avaliar riscos de contato indesejado/aliciamento; configurar limites, bloqueio, denúncia/moderação e privacidade por padrão apropriados.
- Preparar aviso de privacidade em linguagem acessível, procedimentos de exclusão/direitos e canais de contato/atendimento; minimizar dados.
- Validar base legal e tratamento de dados de menores por pessoa/área competente, registrando parecer datado, responsável e eventuais condicionantes. Autor da decisão de produto não é automaticamente revisor jurídico independente.
- Considerar lançamento em fases se necessário; não abrir cadastro de menores nem interação social sem controles obrigatórios.

## Fontes regulatórias oficiais consultadas

- ANPD, ECA Digital: https://www.gov.br/anpd/pt-br/assuntos/eca-digital
- ANPD, Enunciado 1/2023: https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes/Enunciado1ANPD.pdf/@@display-file/file
- Lei 15.211/2025: https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm
- MJSP, ECA Digital: https://www.gov.br/mj/pt-br/assuntos/sua-protecao/sedigi/eca-digital/eca-digital-1/

## Estado de release

GUILD-035 retenção: decisão aprovada. GUILD-037: responsável pelo projeto designado e revisão preliminar documentada; parecer formal de privacidade/menores ainda não registrado. PR #55 Draft. A inclusão de menores é decisão de escopo público, não gate aprovado.

Nenhum dado pessoal de jogador enviado ou incorporado.
Nenhum SQL PROD, merge ou ativação autorizado apenas por esta decisão.
