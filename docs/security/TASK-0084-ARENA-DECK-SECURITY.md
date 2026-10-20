# TASK-0084 — Segurança do baralho

Revisão pelo autor, não independente. Escopo local sobre bd9ee35. Não houve acesso a dados reais, ambiente/SQL remoto, publicação, pacote novo, secret ou alteração do contrato econômico0078. Auditoria de dependências0080 não reaberta.

| Fronteira / risco | Controle e evidência |
| --- | --- |
| Inventar carta por metadata/equipamento | Catálogo homologado vazio, adapter cruza IDs conhecidos com quantidade positiva e traveler_id exato. Teste negativo e navegador com40 entradas desconhecidas continuam em0/7 |
| Conta/avatar incorretos | Loader usa identidade Auth atual e guard existente de Traveler antes/depois da leitura de inventory. Chaves de baralho/journal incluem conta e Traveler; teste negativo de ambos |
| Carta não possuída/duplicada/inativa | Validador exatamente7, IDs únicos, coleção fornecida sem ambiguidades e ação implementada; salvamento/entrada no combate exigem validação |
| Botão consumido ainda invocável | Motor rejeita IDs usados e cartas fora do snapshot. UI desabilitada é só apresentação; testes invocam motor/serviço diretamente |
| Duplo clique/aba concorrente | Lock síncrono de ação da UI, Web Locks por conta+Traveler, reler estado e identidade/rodada esperadas antes de gravar; concorrência real em duas abas coberta no harness |
| Reload reiniciando usos | Snapshot/seed/ID e ações persistidos antes de animar. Replay reconstrói o estado, rejeita transcrição inválida; recarga mantém mesmo ID e cartas usadas |
| Trocar deck ativo | Save/begin verificam o combate ativo dentro do lock, independentemente do editor ou rota |
| Corrupção/quota/API ausente | Limites de tamanho, quantidade, strings, atributos/equipamentos/perfis/ações e enum; falha fecha mutação. Sem reset automático que devolveria cartas ao combate |
| Mudança de coleção | Ativo exige mesmos IDs/definições/posse na retomada; finalizado pode usar snapshot histórico validado e permitir substituição para nova batalha |
| Crédito em outra identidade/replay de resultado | Guarda Auth/Traveler antes do settle legado; intenção de liquidação persistida uma vez, nenhum grant em reload de resultado. Sem transação econômica nova ou valores alterados |
| XSS / acesso externo | Textos React escapados; sem HTML, URL/asset de carta, render remoto, upload ou dados pedagógicos. Harness é somente fonte de teste, nunca rota de produto |

## Limites que bloqueiam o aceite integral

**Cliente não é autoridade.** LocalStorage, snapshots, coleção fornecida à engine e código JavaScript podem ser adulterados. Web Locks e revisão protegem o navegador cooperativo, não um cliente malicioso ou dois aparelhos. Nenhum teste local comprova Auth/JWT/PostgREST hospedados, aquisição autorizada, sincronização remota ou PvP seguro.

Inventário legado tem suas rotas de escrita existentes. Esta tarefa usa apenas leitura e não afirma que uma linha de inventory prova concessão econômica legítima. Antes de cadastrar cartas reais, validar aquisição/ACL/RLS e impedir fabricação de posse no backend apropriado. Não habilitar premiação real a partir de snapshots/claims locais. Esse limite é material e mantém STATUS BLOCKED; nenhuma exceção de produção foi aprovada.

O fluxo legado de recompensa não foi reescrito. Intenção antes do efeito evita retry automático de resultado; uma falha/unmount pode deixar crédito sem confirmação. Não há garantia exactly-once entre storage do combate, histórico e carteira, nem recuperação econômica automática. Backend/recibos da TASK0078 são dependência, não uma nova carteira aqui. Campos/valores de XP/moedas/chests/probabilidades e cálculos centrais ficaram intactos.

Em dispositivo compartilhado, usuários do mesmo perfil de navegador podem inspecionar o storage. Namespace reduz mistura acidental, não criptografa dados. O produto não usa deck de outro namespace e não migra saves de outra conta. Deletar dados locais não é proteção antifraude e não foi testado como tal. Não foi criado endpoint de reset/recompensa.

## Revisão técnica

API antiga createArenaBattle preservada para motor/labs legados; somente factory com deck7 deve servir à entrada das novas modalidades. Nenhuma simplificação dos especiais fixos, seus níveis/custos, IA, cooldowns ou equipamentos. Dados de cartas sintéticos vivem em tests/fixtures e testes; catálogo de produto permanece vazio e não lê fixture, URL/query ou variável para ganhar cartas.

47 testes dirigidos incluem regras, corrupção, falha de gravação, escopo, stale commands, chamadas repetidas, cartas usadas, invariantes do combate, troca após encerramento e integração de componente. Navegador distingue app real (SDK/DataAPI mockados; bloqueado) do harness positivo (motor/componentes/storage reais com40 sintéticas). QA visual desktop320/WebKit390 e checks finais no relatório.

Supabase skill aplicada apenas à leitura existente; [select](https://supabase.com/docs/reference/javascript/select) e changelog consultados em20/10/2026. A mudança de [cifras TLS](https://supabase.com/changelog/cbc-tls-ciphers-deprecated) de10/11 não exige mudança nesta integração local. Nenhum advisor, projeto, credencial ou alteração RLS remota foi usado. PostgreSQL N/A, pois não há SQL novo. Checklist React aplicado a hooks, cleanup, callbacks, labels, botões, persistência antes da apresentação e isolamento por key.

Próxima revisão: catálogo/efeitos/aquisição e protocolo autoritativo; ambiente isolado autorizado, testes reais de ownership/revogação/concorrência e recibo econômico antes de habilitar modalidades/recompensas remotas. Sem achado crítico/alto novo oculto no diff local; os limites de autoridade descritos continuam bloqueadores para produção.
