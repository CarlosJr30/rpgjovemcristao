# RPG-DEV-002 — ambiente hospedado: plano sem provisionamento

**BLOCKED. Nenhum recurso criado.** Carlos determinou continuar sem custos e sem criar banco/branch. Este documento não autoriza despesa nem contém comando de provisionamento automático.

## Identidades e isolamento

| Ambiente | Referência | Regra |
| --- | --- | --- |
| PROD Guilda/EBD | `wspafhlbtlpabypzymjo` | Preservar integralmente |
| TEST Guilda/EBD | `wkdvdzfkbwvhyjmamrsg` | Preservar ACL, Auth e URLs; não habilitar gameplay |
| Gameplay hospedado | Ainda inexistente | Novo destino separado, sem dados reais |

Não reutilizar projetos pausados de outros sistemas. Uma branch Supabase tem banco, Auth e Storage próprios; não deve copiar dados dos jogadores. A tentativa anterior de criar `rpg-dev-002-gameplay` foi recusada antes da criação por falta da confirmação de custo. Nenhuma confirmação de cobrança foi enviada.

## Cotação e limites consultados em 24/10/2026

Cotação read-only do provedor para a organização `xwyyrzctzharutyqysch` (CarlosJr30's Org): **US$ 0,01344/h**. Em 730 horas, **US$ 9,81/mês apenas de computação**, sem câmbio/impostos. Não é orçamento total garantido.

Micro: CPU compartilhada, 1 GB RAM, banco recomendado até 10 GB (recomendação técnica, não franquia gratuita), 60 conexões Postgres e 200 clientes de pooler. Os serviços internos também consomem conexões. Branching exige plano Pro ou superior; eventual assinatura/upgrade e uso dos projetos existentes precisam entrar no orçamento antes de qualquer autorização futura. O plano contratado efetivo não foi certificado por esta cotação.

Disco, Storage, egress e demais serviços podem acrescentar cobrança e consomem quotas da organização. Branches não são cobertas pelo Spend Cap; créditos de computação não cobrem Branching Compute Hours. Não pressupor um teto de US$ 9,81. Plano Free não permite tratar esta branch como recurso gratuito.

Fontes oficiais: [branching e deployment](https://supabase.com/docs/guides/deployment), [cobrança de branches](https://supabase.com/docs/guides/platform/manage-your-usage/branching), [computação e limites](https://supabase.com/docs/guides/platform/compute-and-disk), [conexões](https://supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits).

## Preparação para quando houver autorização futura

1. Confirmar orçamento total, organização, região, modalidade/duração e autorização explícita de custo. Revalidar a cotação. Sem isso, parar antes do provisionamento.
2. Confirmar novo project ref, diferente de PROD e TEST. Inventariar schema/migrations locais e remotas e dependências; não aplicar automaticamente todo o histórico legado. Não clonar dados/Auth de jogadores.
3. Preparar bootstrap auditável do novo banco vazio, plano de recuperação e aplicação apenas das migrations necessárias. Primeiro validar localmente Auth, RLS, RPCs e autoridade econômica. Nenhuma migration é autorizada por este plano em PROD ou no TEST compartilhado.
4. Preparar um perfil de aplicação exclusivo de homologação. O código atual fixa `GAMEPLAY_ENABLED=false`: apontar a Preview EBD a outro banco ou mudar somente uma variável não libera gameplay com segurança. Será necessário um contrato de perfil específico, bloqueado por padrão, guardas no servidor e revisão Security antes do deploy separado.
5. Configurar Preview exclusiva e confirmar origem HTTPS/backend novo. Chave pública no cliente; credenciais privilegiadas somente no servidor. Proibir conexão com PROD/TEST e evitar compartilhamento de sessões entre ambientes. Não alterar as URLs Auth existentes de Guilda/EBD.
6. Criar contas dedicadas por cadastro normal, somente com endereços reais e acessíveis autorizados, confirmação normal e papéis pelo mecanismo oficial. Os endereços do novo ambiente ainda não foram definidos; não inventar.
7. Catálogo sintético de sete cartas e aquisição explicitamente autorizada só nesse ambiente. Recompensa da Torre continua proposta: 430 XP/215 moedas/um baú épico. Não habilitar créditos reais antes da homologação; testes transacionais sintéticos não são homologação econômica.
8. Executar matriz hospedada Arena/Torre (vitória/derrota, sete andares/campeão, recibos, reconexão, repetição, concorrência e isolamento), além de Auth/Guilda/EBD Chromium/WebKit. Registrar resultados reais e snapshots de preservação.
9. Recuperação: remover o vínculo somente da nova Preview e suspender seu acesso se falhar um gate; preservar evidências e dados antes de qualquer decisão de remoção. Não promover banco nem branch a PROD, não executar reset e não alterar produção para recuperar homologação.

## Alternativa atual sem custo novo

Usar fixtures locais com tráfego externo bloqueado e PostgreSQL efêmero offline já disponível. São evidências isoladas, não substituem validação hospedada. A produção continua no SHA `808433a`, Guilda/EBD habilitadas e gameplay bloqueado.
