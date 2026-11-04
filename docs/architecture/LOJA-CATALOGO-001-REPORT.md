# LOJA-CATALOGO-001 — catálogo existente

04/11/2026. ACTIVE. Main confirmada29825f5; worktree/branch próprios, fechamento documental RPG-FIX-002 preservado. Nenhum preço ou aquisição nova autorizado por inferência.

| Conteúdo encontrado | Classificação e integração permitida |
| --- | --- |
| Seis equipamentos, idênticos ao catálogo PR12 | Venda aprovada: Espada35, Couraça65, Escudo115. Botas: inicial, sem venda. Elmo: loot épico comunitário aprovado, sem preço de venda. Medalhão: progressão prevista, aquisição produtiva/venda indisponíveis. |
| Cinco tipos de baú no motor legado | Comum40 comprável; comum e épico por atividade validada. Incomum/raro/extraordinário sem contrato produtivo completo. Valores legados90/180 são dados de protótipo, não aprovação de venda. Épico sem preço. |
| Sete cartas funcionais | Starter manual publicado, uma vez por Auth; consulta de raridades/efeitos/posse no Meu Baralho. Nenhum contrato/preço para venda. Hash do catálogo igual nas branches locais que contêm o arquivo, inclusive PR12/18/24/26; nenhuma carta adicional encontrada nessas fontes. |
| Artes e animações | Ícones/overlays dos seis equipamentos e arte compartilhada dos baús existentes reutilizados. Variantes de corpo/gênero não são produtos. Artes individuais das cartas sem aprovação/mapeamento localizado; nenhuma criada. |

Fontes: equipmentCatalog.ts, domain/traveler.ts, game-engine/src/index.ts e arena-card-catalog.ts; manifesto produtivo economy001a, planos ECONOMY-001C/001C2 e PR12 consultada sem integração. Loot legado não aprovado não vira promessa de conteúdo na interface.

Integração mínima: manter quatro ofertas/handlers/preços e filtros; acrescentar seções informativas de baús por atividade, outros equipamentos e baús indisponíveis, e acesso ao catálogo de cartas existente. Itens sem contrato não possuem botão de compra; não se cria carteira, inventário ou endpoint para venda futura. A futura venda exige contrato/preço aprovado antes de reutilizar inventário/recibos atuais.

Três testes Shop diretamente afetados PASS (dois preservados e um novo de indisponibilidade/filtros), lint direcionado PASS. Tipos/build/CI/Preview/publicação em andamento. Zero migrations, concessões ou alterações Auth/RLS. QA/Security/React pelo autor, sem independência; uso controlado e carteira QA preservados. Não DEPLOY_COMPLETE neste checkpoint.
