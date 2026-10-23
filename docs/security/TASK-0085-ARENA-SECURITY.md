# TASK-0085 — Parecer de segurança da Arena

Revisão pelo autor, não independente. Execução somente local com dados sintéticos. Implementação e checks locais validados; **aceite integral BLOCKED**, com achado P1 legado de autoridade econômica ainda aberto. Nenhum teste remoto, SQL, conta real ou configuração hospedada.

| Achado / fronteira | Evidência e resultado |
| --- | --- |
| Especiais diretos contornavam uso único0084 | Corrigido no produto: ArenaProductAction limita ataque/defesa/cardID; resolveArenaCommand também valida string e nega especiais em runtime, exige deck e ID/rodada atuais. Export legado resolveArenaRound nega especial direto quando há deck, e execução interna por carta não é exportada. Testes cobrem todos quatro especiais e criação legada sem deck |
| Posse/seleção/nível/Foco | Catálogo vazio intacto; não há concessão por nível ou conversão de equipamento. Adapter0084 continua cruzando catálogo com inventário da identidade atual. Deck congelado valida7/únicos/owner e consumo; nível/Foco derivados do efeito e snapshot; nenhum comando recusado consome carta |
| Loadout paralelo | Loadout legado permanece para IA/laboratório sem deck. Carta válida usa nível/Foco sem exigir esse segundo loadout; não concede cartão ou especial por si. Produto não importa o painel legado |
| Replay incompatível | Journals com special:* direto bloqueiam load/save/begin/command/claim com mensagem explícita; teste compara bytes preservados após cada tentativa. Não apaga nem converte uso em carta gratuita. Journals só básico/cartas continuam com ID e usos anteriores |
| Concorrência/reload | Web Locks0084, revisão e checkpoint antes da animação preservados. Duplo clique, duas abas, ações stale, finalização e revanche testados. Não asseguram autenticidade de cliente malicioso |
| Laboratórios | Referências ao painel/criação legados ficam em código DEV de apresentação sem rota Next de produto ou liquidação; testes de laboratório asseguram ausência de save/recompensa. API de produto nega batalha sem deck e especial direto mesmo no deck |
| P1: autoridade econômica local | OPEN/BLOCKED: journal/snapshots e histórico diário são adulteráveis; settle legado deriva prêmio de resultado local. Catálogo vazio impede novo combate real nesta entrega, mas não resolve autenticação de combate. Nenhum grant/valor/anti-farm alterado. Correção compatível preparada no plano vinculado abaixo, sem fingir implementação de servidor |
| Secrets/escopo/dependências | Somente variáveis públicas dummy .invalid para build/E2E; nenhuma leitura de .env/secret/dados reais. Sem pacote, lockfile, SQL, Auth/RLS ou serviço novo. Fixtures/harness fora de rotas; scan de JS produzido sem marcadores sintéticos |

Plano preparado: [autoridade da Arena](../architecture/TASK-0085-ARENA-AUTHORITY-PLAN.md). Requer snapshots/seed/sessão canônicos no servidor e conclusão validada integrada ao protocolo econômico da TASK-0078, com idempotência/limites existentes. Não criar outro ledger ou aceitar vitória/transcrição local como recibo. A ausência dessa autoridade impede declarar DONE integral, antifraude ou concessão remota segura.

Validação:68 testes direcionados/11 arquivos;6 cenários browser (3 produto vazio +3 harness com motor/componentes/storage reais), Chromium1440/320 e WebKit390; lint, tipos e build PASS. UI de controle/custos/motivos/teclado e snapshots inspecionados. SDK/DataAPI sintéticos nos cenários autenticados não comprovam Auth/RLS hospedados. Aparelhos físicos e sincronização entre aparelhos não testados. Nenhum gate exigido sem evidência foi marcado PASS.

Próximo: revisão de catálogo/aquisição e plano autoritativo em tarefa própria; ambiente remoto depende de autorização específica futura. Contratos0078/0080–0084 e main preservados.
