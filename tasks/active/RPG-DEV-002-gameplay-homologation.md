# RPG-DEV-002 — Estabilização e homologação de gameplay

ID: RPG-DEV-002
TITLE: Investigar WebKit e preparar homologação hospedada separada
OBJECTIVE: Resolver causas reproduzidas, preparar ambiente isolado e executar os cenários autorizados sem afetar Guilda/EBD.
PRIORITY: P1 High
STATUS: BLOCKED
SCOPE: Mesma branch codex/rpg-dev-001 e PR11; testes/diagnóstico de navegador, correções mínimas comprovadas em Auth/navegação se necessárias, configuração e contratos de ambiente de homologação separado, SQL somente nesse novo ambiente após gates; comparação visual privada de peças existentes; relatório e memória.
OUT_OF_SCOPE: Outra PR; liberação de gameplay na Preview Guilda/EBD; mudança econômica/Auth/RLS produtiva; edição de saldos, recibos retroativos, arte integrada sem aprovação; reset de banco; reutilizar projeto de outro sistema.
DEPENDENCIES: RPG-DEV-001, candidato2d0132e/relatório5bcd8cd; disponibilidade de banco hospedado separado e eventuais condições do provedor.
ASSIGNED_AGENT: Agente principal assumindo perfis Frontend/Backend/QA/Security/Operação, sem delegação. Revisões pelo autor, sem independência alegada.
REQUIRED_CONTEXT: RELEASE_POLICY.md; RPG-DEV-001-REPORT.md; instruções globais e fontes mínimas por defeito.
SECURITY_CONSIDERATIONS: Nenhuma conexão produtiva no novo ambiente; contas dedicadas com cadastro normal, sem confirmação artificial. Credenciais somente em armazenamento protegido/memória. Não desativar CORS, Auth, RLS ou proteção Vercel. Produção e Preview EBD permanecem intactas.

## Autorização dos perfis

O pedido RPG-DEV-002 autoriza explicitamente desenvolvimento, testes e preparação do serviço de homologação. O agente principal delimita a ampliação dos perfis aos caminhos acima, usando dependências já fixadas. Custos sujeitos às confirmações explícitas exigidas pelo provedor; não presumir autorização para despesas. A preparação técnica independente continua se houver bloqueio de provisionamento.

ACCEPTANCE_CRITERIA:
- Causa WebKit reproduzida/controlada, distinção aplicação/proteção/automação e correção verificável; testes repetidos.
- Ambiente hospedado separado e conta/ACL/recompensas auditadas, ou BLOCKED com causa externa e plano concreto.
- Arena/Torre realmente testadas no ambiente hospedado, sem confundir simulação com execução remota.
- Investigar proveniência16XP/6moedas sem alterar dados.
- Comparações visuais privadas preservam artes aprovadas e aguardam aprovação antes da integração.
- Atualizar relatório RPG-DEV-002 e PR11; publicar apenas escopo independente com todos os gates obrigatórios aprovados.

TEST_PLAN:
- Matriz WebKit/Chromium, navegação/Auth/HTTP/prefetch/cookies sem valores, repetições e comparação controlada de transporte autenticado.
- Testes afetados, unitários, lint/types/build e CI; reutilizar PG74 válidos onde código SQL/motor não mudar.
- Inspeções remotas somente leitura até existência de destino isolado aprovado.
- Revisão QA/Security e hashes de preservação; produção inalterada se houver bloqueios críticos.

DEFINITION_OF_DONE: Critérios comprovados, relatório/memória atualizados e classificação DONE/BLOCKED/REWORK por cenário. Nenhum PASS para teste ausente.

## Execução e aceite — 24/10/2026

Última orientação de Carlos: não criar banco, branch paga ou qualquer recurso com custo; continuar WebKit/economia/testes locais e somente preparar hospedagem. A criação inicial foi recusada antes de provisionar; a listagem posterior continua sem branches. Nenhuma confirmação de custo enviada. Plano/cotação em docs/architecture/RPG-DEV-002-HOSTED-PLAN.md.

SELF VALIDATE: 771 unitários PASS/74 SKIP, seis cenários locais Arena/Torre PASS (Chromium desktop/móvel e WebKit móvel), lint/types/build exit 0, protocolo25PASS. As 74 omissões PG já executadas no RPG-DEV-001 são reutilizadas, não classificadas como nova execução. Primeiros timeouts de apresentação/import sob carga preservados; mesmas asserções aprovadas após espera limitada da animação e execução unitária com dois workers.

QA pelo autor: links WebKit cinco repetições + uma execução versionada PASS (42 checks); navegação completa continua com erro RSC/CORS, inclusive no transporte experimental. Sem causa definitiva nem correção de aplicação alegada. Testes hospedados de gameplay BLOCKED por ausência de ambiente isolado e contratos homologados. Não desativar as restrições da Preview EBD para executar testes positivos.

Security pelo autor: token restrito à origem, redirects não seguidos pelo transporte experimental; sete testes de fronteira PASS. Sem secrets no diff, dependência nova, alteração de Auth/RLS/URLs/quotas/saldos/migrations. Oito hashes/datasets iguais em TEST e PROD em relação ao fechamento anterior. Produção808433aREADY e sete respostas HTTP esperadas reconferidas.

Economia BLOCKED:16XP/6moedas não comprovados; cinco checkpoints de compra conferem; backup privado anterior ao provisionamento não explica os valores. Nenhum ajuste/certificação. Visuais REWORK: quatro comparações privadas preparadas, elmo cobre rosto e botas ainda não acompanham o corpo; nenhuma integração ou aprovação solicitada para rascunho inadequado.

Aceite geral BLOCKED: causa WebKit, ambiente hospedado, catálogo/aquisição/recompensas, proveniência econômica e artes/variantes pendentes. Nenhum merge/deploy produtivo. Relatório detalhado docs/architecture/RPG-DEV-002-REPORT.md. Commit técnico cf056ea na mesma PR11; CI exato registrado no relatório. Não há DONE/DEPLOY_COMPLETE geral.
