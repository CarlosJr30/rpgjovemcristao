# CONSOLIDATION-005 — seleção e comprovação dos vídeos

2026-10-20. **Zero candidatos com fonte/termos verificados; zero vídeos autorizados ou incorporados.** O pedido exige trabalho local, sem operações remotas. Não foram feitas pesquisas, downloads ou consultas a provedores para preencher estes campos com suposições. Não usar popularidade como aprovação. A tabela é uma fila editorial de seleção, não uma lista de vídeos existentes.

| História | Recorte para seleção | Candidato/provedor/ID/URL | Autor/idioma/duração | Licença/incorporação/revisão | Prova oficial |
| --- | --- | --- | --- | --- | --- |
|A Criação|Gênesis1–2; sequência, ser humano, descanso e cuidado|Não selecionado|A confirmar|Pendente|Pendente|
|Jardim do Éden|Gênesis3; tentação, consequências e saída|Não selecionado|A confirmar|Pendente|Pendente|
|Caim e Abel|Gênesis4; ira, responsabilidade, consequências e proteção, sem violência gráfica|Não selecionado|A confirmar|Pendente|Pendente|
|Arca de Noé|Gênesis6–9; contexto, preparação, dilúvio e aliança|Não selecionado|A confirmar|Pendente|Pendente|
|Torre de Babel|Gênesis11:1–9; projeto, comunicação e dispersão sem inferiorizar povos/línguas|Não selecionado|A confirmar|Pendente|Pendente|

Antes de aprovar um candidato, registrar URL primária, identidade do autor, idioma, duração observável, licença/termos e evidência de autorização para o uso pretendido, permissão de incorporação, legendas/alternativa acessível e parecer editorial por recorte. Acesso público não significa licença. Nenhum campo pending deve virar approved por conveniência de teste.

StoryVideo amplia o contrato0081 com embedding, editorialReview e captionUrl. Fonte, autoria, autorização/termos/evidência, idioma, duração, disponibilidade, mecanismo de observação e acessibilidade continuam obrigatórios. Todas as cinco entradas reais permanecem missing/pending/null. Nenhum vídeo original é criado ou hospedado nesta tarefa.

## Adapters e limites de comprovação

HTML5: preparada reprodução somente para fonte HTTPS e legendas aprovadas pelo catálogo; usa eventos nativos play/pause/error/ended, duração e posição para observar término. Abrir/iniciar/simplesmente disparar ended sem estado válido não gera observação. Eventos e propriedades podem ser manipulados no navegador: **observação não é receipt oficial**, não atualiza story_progress, não conclui história e não recompensa. Rascunhos, pausas ou relógio local não substituem prova de servidor.

YouTube/Vimeo: construtor de URL mantém allowlist e validação de IDs, mas a UI não carrega o embed enquanto seu adapter de API de término não estiver integrado e revisado. Não presumir protocolo de postMessage/SDK sem documentação autorizada. Sem provedor selecionado, não carregar SDK de terceiros ou inventar verificação. Falta de API adequada mantém conclusão oficial bloqueada.

Futuro adapter de provedor deve validar origem/source/session/ID/revisão dos eventos, observar estados reais sem transformar mensagens do browser em antifraude, encerrar listeners ao fechar e documentar limites. Backend deve conferir evento elegível e mecanismo de prova autorizado antes de emitir step_receipt privado0081. Caso o provedor só ofereça eventos de cliente sem comprovação adequada, manter conclusão oficial bloqueada; não criar botão “Assisti” nem bypass de indisponibilidade.

## Áudio, acesso e falhas

Reprodução nativa usa AudioManager0089: holdMusic só durante reprodução; pause/ended/error/close/unmount liberam a retenção. Narração respeita mute e volume geral. Não existe música paralela ou redução das exigências de vídeo para sincronizar áudio. Nenhum áudio licenciado foi adicionado.

Falha de conexão/fonte mantém etapa pendente, permite fechar e tentar novamente após recuperar a fonte; não substitui o vídeo por confirmação manual. Remoção do vídeo exige disponibilidadeunavailable/revisão do catálogo. Legendas e alternativa acessível precisam de avaliação editorial; não substituem a etapa obrigatória automaticamente. Todos os players de produto permanecem ausentes por falta de vídeo autorizado.

## Integração futura

Reutilizar step_receipts/story_progress/complete_story0081 e a autoridade econômica004. Nenhuma ingestion, SQL, RPC de grant, wallet ou economia nova nesta005. Leituras/atividades do caderno são demonstrativas, sem promoção a provas oficiais. Conclusão/desbloqueio oficial é individual, após provas válidas de todas etapas/vídeo e receipt econômico autorizado, sem aprovação do líder. Não importar um caderno local como transcrição autenticada.
