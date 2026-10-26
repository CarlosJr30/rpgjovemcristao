# UI-RESTORE-002 — aprovação visual e publicação

Data:26/10/2026. **VISUAL_APPROVED / RELEASE_VALIDATING**. O usuário declarou explicitamente “APROVAÇÃO VISUAL CONFIRMADA” e autorizou merge daPR11/publicação somente após os gates do escopo visual. Não é aprovação de Arena, Torre, loja ou gameplay/economia.

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
