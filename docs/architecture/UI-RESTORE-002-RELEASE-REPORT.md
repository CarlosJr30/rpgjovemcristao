# UI-RESTORE-002 — aprovação visual e publicação

Data:26/10/2026. **VISUAL_APPROVED / DEPLOY_COMPLETE / DONE no escopo visual**. O usuário declarou explicitamente “APROVAÇÃO VISUAL CONFIRMADA” e autorizou merge daPR11/publicação somente após os gates do escopo visual. Não é aprovação de Arena, Torre, loja ou gameplay/economia. Produção READY: https://rpgjovemcristao-web-inky.vercel.app — commit `1a82d2c058b40b37ae4ae79b82c085bb3488c02b`. As seções iniciais registram o plano e o histórico; o resultado definitivo está ao final.

## Candidato e escopo

Interface aprovada emPreviewTEST: runtime`caa682c2b19d3f95f7d4d584e7036dd82369266d`, deployment`dpl_A4MWCmTPepU4HKzJn8X3SRcRXqJg`READY. Head documental recebido`609e75df08752b1714b4a88d80c25504aed81497`, runtime idêntico. O registro desta aprovação não altera a aplicação. CI e Preview serão vinculados ao candidato atualizado antes do merge.

Auditoria daPR inteira contra`808433a`: nenhum diff em migrations/Supabase/packages/database, proxy, allowlist/release-scope, autoridade econômica/API ou código deAuth. `GAMEPLAY_ENABLED=false` e limites de servidor permanecem constantes. Os diffs anteriores de sincronização acrescentam checagens de sessão/revisão para rejeitar respostas antigas; não ampliam autoridade. Os overlays previamente aprovados e o patchRSC005 foram preservados e já fazem parte da interface homologada/testada. As pendências de gameplay anteriores continuam excluídas; não são declaradas resolvidas por aprovação estética.

## Gates e sequência de publicação

1. Registrar aprovação e confirmar CI do SHA candidato; testes unitários/lint/TypeScript/build/protocolo e matrizRSC/UI pelo workflow existente.
2. Preview do SHA candidato com SupabaseTEST, READY/SHA e login/avatar/menu11/Guilda/EBD/negativas reais em desktop/móvel.
3. Validar variáveis deprodução apontando exclusivamente ao SupabasePROD; dados/RLS preservados e zero migrations necessárias. Nenhum recurso pago novo.
4. Reter a atribuição automática de domínios antes do merge, usando a configuração já existente do projeto; registrar/restaurar o valor original. A produção atual permanece servida durante CI/build/staging.
5. Merge normal daPR11 com SHA esperado; acompanhar CI do merge e deploymentprodutivo existente, sem duplicar builds. Validar READY, SHA/backend e gates antes de promoção.
6. Promover somente o deploymentprodutivo validado, conferir alias/SHA/READY, testar funções principais com contasPRODdedicadas existentes. Se crítico, restaurar o deploymentanterior e registrarBLOCKED.

Produção de recuperação: `808433a780e96a048c4a3f2d7e419351ab85e5a3`, `dpl_H8VCqQx2vT8sqVzjDbpFYKnE1mSA`, URLoficial`https://rpgjovemcristao-web-inky.vercel.app`. Não modificar dados reais para ensaios, não conceder recompensas, não alterarAuth/RLS/CORS/proteções para obterPASS. A retenção de aliases protege a versão vigente até os gates; não desativa DeploymentProtection.

## Estado inicial

CI do runtime aprovado e head609: success já registrados naPR11. Preview anterior:151checksreais/12AuthRLS/37tabelasRLS/12hashesPASS, sem errosRSC. Aprovação visual agora registrada. Novos resultados, SHA de merge, deployment e validação pós-publicação serão registrados em evidência e naPR. QA/Security/DevOps pelo próprio autor; não alegar revisão independente ou teste físico não realizado.

## Execução da release — 26/10/2026

O registro inicial acima é histórico. A aprovação visual explícita foi persistida no commit `0d3feb2391cbdbc61beacfdca3b6b200c91a5da7`. Não houve alteração de runtime nesta etapa. Os workflows push `40313224246` e PR `40313229229` passaram no candidato. A PR11 foi integrada por merge normal, com conferência do head esperado, no commit `1a82d2c058b40b37ae4ae79b82c085bb3488c02b`. O runtime do merge é idêntico ao candidato aprovado.

| Gate | Evidência e resultado |
| --- | --- |
| Unitários | CI do merge: 804 PASS, 74 SKIP preexistentes, sem perda dos 787 testes de referência. SKIP não é PASS de integração. |
| Lint, TypeScript, build, protocolo | Job de qualidade do merge aprovado; patch RSC e gate dos assets aprovados presentes no build Vercel. |
| Preview TEST | `dpl_m7QKFdEu9dNHp5RVBigNPZoWPPhw`, READY, SHA exato `0d3feb2`; 151/151 checks reais, seis fluxos, três perfis em Chromium desktop/WebKit móvel. |
| Backend Preview | Exclusivamente Supabase TEST `wkdvdzfkbwvhyjmamrsg`; chave pública válida e nenhum secret privilegiado público. |
| Staging produtivo | Deployment automático `dpl_CJFBMXjTKfm7nRt76FL8BLJLM87M`, READY, SHA exato do merge; duas rodadas de 151/151 checks reais sem erros de página, DOM ou console. |
| Backend produtivo | Exclusivamente Supabase PROD `wspafhlbtlpabypzymjo`, sem troca com TEST. Três contas dedicadas existentes; login normal, sem grants ou recompensas. |
| Auth/RLS | Seis negativas reais em PROD: viajante de outra conta oculto e ator EBD de outra conta negado com 403/42501, nos três perfis. As 35 tabelas públicas de jogo auditadas mantêm RLS. |
| Dados | 36 conjuntos comparados antes/depois do staging: contagem/hash de linhas de 35 tabelas e hash dos IDs Auth idênticos. Sessões Auth normais não são confundidas com alteração de progresso. |
| Artes | 16/16 assets servidos com bytes/hash esperados: nove overlays, três corpos e quatro artes da Guilda. |
| Menu e bloqueios | Onze opções em ordem original, oito marcadas Em desenvolvimento sem link/botão; Herói/Guilda/EBD ativos. Nove rotas protegidas e autoridade econômica retornam 403 em cada fluxo. |
| Desktop/celular | Avatar carregado, cenário medieval, menu móvel abre/fecha, restaura foco e bloqueia scroll; retrato/paisagem sem overflow. Capturas privadas, não são prova em aparelho físico. |

Preview de testes: https://rpgjovemcristao-hemz6fyb3-carlos-junior-s-projects.vercel.app . Deployment Protection continua habilitada. O acesso automatizado usa somente os mecanismos oficiais escopados; capacidades temporárias e credenciais ficam em DPAPI local, fora do Git.

## Falha de CI preservada

A primeira tentativa do workflow do merge `40314497732`, job `121543576424`, falhou na aplicação local: Chromium, fixture-only/goto, repetição 2, botão Entrar ausente após 15 segundos, antes do login. As outras 23 execuções funcionais passaram; todas as 12 WebKit passaram. O resumo registra zero erros de página nessa execução, mas `errorFree=false`; o detalhe de DOM/console não foi disponibilizado pelo workflow. Logo, não há evidência para declarar a causa como infraestrutura ou excluir uma falha de bootstrap. A reprodução nativa e a fixture corrigida passaram seus respectivos critérios nessa tentativa. A falha permanece FAIL histórico, sem redução de assertions ou filtro de erros.

Foi solicitada uma única repetição do job no mesmo SHA, sem alteração de código ou ambiente. Justificativa: candidato push/PR já aprovados, runtime do merge idêntico e duas matrizes hospedadas produtivas sem falhas. A publicação fica retida até o resultado dessa repetição; uma nova falha exige REWORK/BLOCKED, sem repetição indefinida para obter verde.

## Estado operacional em validação

O projeto teve somente `autoAssignCustomDomains` retido em false (valor original true) antes do merge. SSO/Deployment Protection permaneceu `all_except_custom_domains`; nenhuma proteção de Auth/CORS/RLS foi alterada. O deployment automático do merge foi acompanhado, sem build produtivo duplicado. A URL oficial continua no deployment anterior até os gates finais. Não houve migrations, dependências novas, recursos pagos, concessão econômica nem alteração dos dados de jogo.

Pendências anteriores de gameplay/economia (inclusive origem dos 16 XP/6 moedas), catálogo/recompensas e homologações positivas/ aparelho Safari físico continuam fora do escopo e bloqueadas. Aprovação estética não as resolve. QA, Security e DevOps foram executados pelo próprio autor, sem alegar revisão independente.

## Resultado final da publicação

O workflow [40314497732](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40314497732) concluiu **success na tentativa 2**. O único job repetido, `121547148842`, aprovou a referência nativa WebKit 3/3 falhas esperadas sem patch, a fixture corrigida 63/63 estáveis, a aplicação completa 24/24 funcionais/sem erros, 138 checks de interface e 48 da Guilda. O job de qualidade permaneceu aprovado. Não houve alteração de código, timeout, assertion ou regra de classificação para obter esse resultado. A causa do timeout inicial continua indeterminada; seu registro FAIL não foi apagado. Não se atribui uma correção de bootstrap não demonstrada. As matrizes hospedadas e a repetição passaram, sem regressão crítica reproduzida no escopo; ocorrência semelhante deve reabrir REWORK.

O deployment automático existente foi promovido somente após esses gates. A API de promoção retornou sucesso sem corpo; o helper local inicialmente falhou ao tentar interpretar JSON vazio. Não houve nova solicitação de promoção: a consulta remota seguinte confirmou que o alias oficial já apontava para o deployment correto. O helper privado passou a aceitar sucesso sem corpo. Isso não alterou a aplicação nem os testes.

- URL oficial: https://rpgjovemcristao-web-inky.vercel.app .
- Commit de produção: `1a82d2c058b40b37ae4ae79b82c085bb3488c02b`, merge normal da [PR11](https://github.com/CarlosJr30/rpgjovemcristao/pull/11).
- Deployment: `dpl_CJFBMXjTKfm7nRt76FL8BLJLM87M`, target production, READY; alias e SHA reconfirmados remotamente após a publicação.
- Pós-publicação pela URL oficial, sem bypass: **151/151 PASS**, três perfis existentes, Chromium desktop e WebKit móvel; login/logout, avatar, onze opções, navegação móvel, Guilda/gestão do líder, EBD e negativas de rotas/autoridade. Zero erros de página, DOM ou console nas seis execuções.
- Preservação final: **36/36 conjuntos idênticos** ao baseline; 35 tabelas públicas/economy_private com RLS, zero sem RLS. Nenhuma escrita de progresso, conta nova, recompensa artificial ou migration.
- `autoAssignCustomDomains` restaurado para **true**, igual ao valor original. Proteção SSO/Deployment Protection conferida e inalterada. Nenhum recurso pago criado.

A promoção não desbloqueou Arena, Torre, loja ou os demais módulos não homologados. O inventário completo e o estado de cada módulo permanecem em [UI-RESTORE-002-REPORT.md](UI-RESTORE-002-REPORT.md) e [UI-RESTORE-002-INVENTORY.json](UI-RESTORE-002-INVENTORY.json). Provas agregadas desta release: [UI-RESTORE-002-RELEASE-EVIDENCE.json](UI-RESTORE-002-RELEASE-EVIDENCE.json). Logs/capturas de contas dedicadas ficam em `build/ui-restore-002/release/{preview,stage,public}` no checkout de execução; credenciais e capacidades não foram versionadas.

Aceite visual, QA, Security e DevOps do escopo atendidos. Teste em celular físico não foi realizado e não é declarado PASS; WebKit móvel é emulação. Não há homologação de gameplay. O encerramento documental é persistido na branch `codex/ui-restore-002-release-report`, baseada no merge, sem deploy artificial ou novo merge da aplicação apenas para atualizar o relatório, conforme RELEASE_POLICY.md.
