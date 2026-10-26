# RPG-DEV-006 — Publicação de Herói e equipamentos possuídos

26/10/2026. **RELEASE_VALIDATING**. O usuário autorizou publicar equipar/desequipar itens que os jogadores já possuem. Troca entre variantes diferentes está fora deste lançamento; não exige segunda variante para este aceite. A PR12 continua pelo fluxo normal, sem alteração de artes ou liberação econômica adicional.

Baseline reconfirmado: main/produção `1a82d2c058b40b37ae4ae79b82c085bb3488c02b`, deployment `dpl_CJFBMXjTKfm7nRt76FL8BLJLM87M`, READY. PR12 head `0da8facf04c1a5742ea5ac4ad406117de1850523`, CIpush40332648483/PR40332657990success. PreviewTEST runtime `816918e40cf06ae77b9ff442cb46460d1e7e25d5` READY e aplicativo idêntico ao head; somente testes/docs posteriores. Nenhum runtime novo é necessário para reduzir o escopo: RPC aceita somente os seis IDs existentes, um por slot.

Evidências existentes preservadas:806unitPASS86SKIP,29PGdistintosPASS,lint/types/build/protocolo25PASS;24RSC/134UI/48Guilda,4browserisolados,39API/duasrodadas199browser/162visuaishospedados/16hashesPASS. O teste sintético não homologa variante real. Nenhum desses resultados é apresentado como teste produtivo novo.

Gates desta execução: confirmar estado/CI/SHA/env; repetir API/Preview no escopo; Auth/getUser/RLS/propriedade reais em contas dedicadas PROD, sem criar itens; baseline agregado de dados e schema/ACLs; recuperação da única migration testada offline; aplicar somente006 emPROD; reter aliases antes do merge; aguardar CI do merge e deploymentprodutivo automático, sem build duplicado; validar staging com backendPROD; promover e verificar rotas/fluxos/data preservation; restaurar autoAssignCustomDomains. Falha crítica interrompe os passos seguintes e usa a recuperação aplicável.

TesteChatA/nível50 continua em leitura, sem usar o avatar antigo ou modificar equipamento/progresso. A identidade dessa conta por sessão cliente ficou indisponível anteriormente; Auth/RLS do sistema será validado com getUser, contas dedicadas existentes e negativas reais, sem tratar SQL administrativo como login. Nenhuma autorização para inventar itens, saldos ou recompensas PROD.

Migration necessária: `supabase/migrations/20261026122539_rpg_dev_006_owned_equipment.sql`, já aplicada TEST como20261026125946. Não aplicar migrations antigas de catálogo/Torre ou todas as pendências. Sem alteração de Auth/CORS/RLS; apenas RPCs privados/públicos revisados e marcador de escopo. Recuperação: restaurar a aplicação1a82d2c; revogar/remover somente o par owned instalado e restaurar release_scope anterior, preservando dados. QA/Security/DevOps pelo autor, sem independência ou teste físico alegados.

Resultados finais, commit de merge, migrations remotas, URLs e limitações serão registrados ao concluir os gates. Relatório inicial e falhas preservadas em RPG-DEV-006-REPORT.md e evidências adjacentes. Sem recursos pagos.
