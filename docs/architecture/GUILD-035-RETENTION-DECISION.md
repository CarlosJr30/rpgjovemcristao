# GUILD-035 — Decisão de produto: retenção do marcador de criação de Guilda

**Data da decisão:** 2026-11-15  
**Aprovador:** proprietário do RPG Jovem Cristão (aprovação expressa registrada na conversa)  
**Status de produto:** APPROVED  
**Status de revisão jurídica/privacidade:** PENDING — não há parecer ou aprovação jurídica registrada  
**Escopo:** marcador que limita a criação própria de Guilda por conta Auth, na implementação COMMUNITY-043B. Esta decisão não libera migrations nem ativa funcionalidade em PROD.

## Decisão aprovada

1. **Finalidade:** aplicar a regra de uma Guilda criada por conta, prevenir criações duplicadas e possibilitar recuperação durante a janela definida.
2. **Minimização:** manter apenas o identificador mínimo pseudonimizado estritamente necessário para relacionar a conta ao marcador. Não adicionar e-mail, telefone, documento ou identificadores do dispositivo para tentar impedir recriação por outra pessoa/conta.
3. **Conta existente:** manter o marcador enquanto a conta existir, com acesso restrito a operações autorizadas.
4. **Exclusão da conta:** manter o marcador por **até 30 dias** após exclusão para recuperação, quando aplicável, e eliminar ao término desse prazo, salvo obrigação legal específica de preservação devidamente documentada.
5. **Expiração:** após o prazo e a eliminação do marcador, uma conta nova poderá criar Guilda se cumprir os requisitos gerais. Isso não garante uma Guilda por pessoa física; a regra aprovada é uma Guilda criada por conta.
6. **Acesso e segurança:** restringir leitura e operações do marcador aos componentes internos autorizados; manter Auth, RLS, ACLs, auditoria e políticas de acesso aplicáveis.
7. **Restauração/recuperação Auth:** preservar a relação apropriada durante a janela de recuperação somente quando permitida e tecnicamente demonstrada; não associar automaticamente identidades novas a marcadores anteriores sem base validada.

## Encaminhamento obrigatório para revisão de privacidade

**Status: PENDING.** Solicitar à pessoa/área responsável por privacidade uma revisão documental e, se exigida, jurídica, considerando LGPD e proteção de crianças/adolescentes. Pedir resposta expressa sobre:

- Base legal, transparência ao jogador/responsável e necessidade do marcador após exclusão;
- definição técnica do pseudônimo, reversibilidade, segregação da chave e minimização;
- início exato da contagem de 30 dias, eventos de exclusão e recuperação, e tratamento de contas suspensas;
- mecanismo de expiração e eliminação verificável (inclusive logs, backups, retenções legais e reprocessamentos);
- autorização de acesso, trilha de auditoria e direitos dos titulares;
- efeitos de exclusão/recuperação de Auth sobre Guilda existente, liderança e dados de outros membros;
- tratamento de dados de menores e eventual atualização de aviso de privacidade.

**Pendente de implementação/revisão:** confirmar que o código existente realmente suporta a expiração e exclusão do marcador em 30 dias. Não tratar esta decisão documental como prova de implementação.

## Condições para liberação funcional

- Evidência de aprovação de privacidade quando aplicável e aderência implementada à decisão;
- requisitos técnicos e de release efetivamente satisfeitos, com quaisquer exceções limitadas e registradas;
- migrations e autoridade PROD aprovadas e verificadas, e homologação exigida pelo procedimento vigente;
- CI aprovado no SHA final, integração pelo fluxo normal e confirmação de deployment/ativação no ambiente remoto.

**Separação explícita:** aprovação de produto ≠ aprovação jurídica ≠ implementação ≠ publicação.

## Estado conhecido no momento da decisão

- PR #55 permanece Draft, sem merge;
- migrations COMMUNITY-043B não aplicadas em PROD;
- criação própria para todos ainda inativa;
- exceção anterior de release limitada à dispensa de backup manual/repetições não indispensáveis, sem declaração de recuperação comprovada.

## Próxima ação

Encaminhar este documento para revisão de privacidade; registrar o parecer e eventuais ajustes. Não incluir informações pessoais de jogadores no encaminhamento.
