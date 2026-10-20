# TASK-0088 — Parecer de segurança da revelação de Baús

Revisão pelo autor, sem independência. Escopo frontend/consulta somente leitura; nenhum SQL, migration, novo grant, dado real, secret ou serviço remoto. Aceite integral condicionado aos gates econômicos/Auth/RLS/aparelhos existentes, não resolvidos por animação.

| Fronteira | Controle / limite |
| --- | --- |
| Autoridade | Adapter de produto aceita só registro open consultado no repository autenticado existente, com Traveler/operation_key/ID/tipo compatíveis e equipamento de catálogo. Resposta RPC isolada, pendência ou checkpoint local não produzem prêmio confirmado |
| Economia | Renderer/máquina de estados/cursor não importam grants, wallet, inventário mutável ou RNG. Só coordinator de intenção chama RPC open_chest existente. Pular/avançar/fechar/rever/retomar não chamam abertura ou crédito |
| Idempotência | Intent persistida antes da RPC, Web Lock por conta/Traveler e ref de clique. Retry explícito primeiro consulta registro e depois reutiliza mesmo UUID; reload não repete RPC. Garantias econômicas de servidor dependem da implementação/ambiente0078 existente, não de lock local |
| Posse/cartas | Catálogo de cartas intocado/vazio; adapter legado rejeita cartas/campos extras. Harness separado testa contrato de carta sem caminho de concessão no produto. Sem criação de coleção/carteira/recibo econômico paralelo |
| Inventário | Comparação só com item no inventário atual sincronizado. Nunca adiciona item para comparar ou equipa automaticamente. Quantidade/novo/repetido não são estimados a partir de cache anterior |
| Persistência | Somente IDs/tipo/índice/apresentados/resumo, conta+Traveler em chave codificada, schema versionado/limite2KB. Sem credenciais/prêmios armazenados como prova. Falha/corrupção preservam bytes; cursor adulterável afeta leitura, não concessão |
| Acesso | Nova consulta select possui filtros Traveler, operação open e chave exata; nenhuma permissão/RLS/Auth alterada. Conta vem de AuthProvider existente que já exclui sessão anônima; key de componente reinicia estado ao trocar identidade. Testes negam registro estrangeiro |
| Sons/assets | Somente arte local registrada e AudioManager/catálogo aprovado. Catálogo de produção vazio implica silêncio; não reutilizar efeitos de protótipo fora da Arena, nem baixar conteúdo protegido |
| Entrada/saída | Strings renderizadas pelo React, sem HTML bruto, URL de recurso arbitrário ou query concatenada. Lookup parametrizado via SDK existente. Mensagens de repository não expõem detalhes privados do banco |

Risco herdado alto: hardening/cutover econômico0078 e validação de ownership/isolamento/concorrência no ambiente hospedado ainda não são provas desta tarefa. Helpers locais legados de loot permanecem intactos; botão de abertura da nova UI não os chama, mostrando bloqueio offline. Compras anteriores não foram redesenhadas ou auditadas como novo sistema econômico. Nenhuma revisão de segurança aqui permite promover dados locais a prêmios oficiais.

Evidência local: testes de forma/negação/conta/Traveler, concorrência de intent/duplo clique, confirmação versus pendência/reload/retry, spies da RPC, revisão de dependências/imports e diff protegido. QA, lint/tipos/build, browser/capturas e scan de fixtures são detalhados no relatório. Não alegar auditoria independente, antifraude de browser, validação de produção, licença de áudio novo ou PASS remoto.

[Contrato visual](../architecture/TASK-0088-CHEST-RECEIPT-PRESENTATION.md) · [Relatório](../architecture/TASK-0088-CHEST-CINEMATIC-REVEAL.md).
