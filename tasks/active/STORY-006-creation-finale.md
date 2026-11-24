# STORY-006 — Vídeo obrigatório e encerramento da Criação

ID: STORY-006
TITLE: Final demonstrativo da Fase 1 e preparação da prova de vídeo
PRIORITY: P1 High
STATUS: IMPLEMENTED — VALIDATED, AWAITING REVIEW

## Entrega

- Base limpa `5baac693a905af4c8a759a6fdd43876cf6aa69fd` e branch `codex/story-006-creation-finale`.
- O resumo consolida os sete dias, a Harmonia, o quiz, as referências de Gênesis 1:1–2:3 e uma reflexão opcional. A navegação do Diário retorna à mesma tela, com o resultado mantido em memória.
- A etapa do vídeo reutiliza o reprodutor nativo com controles, reprodução embutida, legenda e pausa/retomada do navegador. O usuário inicia a reprodução. Falha da mídia ou das legendas mantém a etapa pendente e oferece nova tentativa.
- A definição local de `creation` marca o vídeo como ausente. Sem um vínculo de publicação autorizado, o painel não carrega mídia. O jogador pode consultar o estado da conclusão, com o Jardim do Éden indisponível por este fluxo e retorno ao mapa.
- A interface exibe valores previstos e distingue elegibilidade validada pelo servidor de recebimento. Nenhum prêmio é recebido na demo. A Jornada avança por seus requisitos, sem aprovação de Líder de Guilda. [Contrato STORY-001A](../completed/STORY-001A-biblical-journey-rewards.md)

## Contrato futuro de confirmação do vídeo

O modelo de leitura atual expõe `video_completed`. A proposta local TASK-0081 prevê recibos privados por Viajante, história, revisão e etapa e uma função que verifica os requisitos de conclusão. O agregado não identifica a mídia publicada e o caminho de ingestão ainda precisa de um validador aprovado. A proposta não comprova aplicação em nenhum ambiente. [Proposta TASK-0081](../../packages/database/proposals/task0081-story-progress.sql)

1. Publicar um manifesto revisado para `creation` que fixe revisão, identidade imutável do vídeo, versão ou hash da mídia, duração, idioma, licença, incorporação, legendas, alternativa acessível e política de evidência. A revisão do conteúdo e a mídia devem ser resolvidas no servidor.
2. Iniciar a verificação somente após validar a sessão Auth, a titularidade atual do Viajante e a publicação ativa. Vincular uma tentativa de curta duração à conta, Viajante, `creation`, revisão e mídia. Expirar a tentativa e impedir reutilização entre contas, vídeos ou revisões.
3. Aceitar apenas evidência da fonte aprovada, vinculada à tentativa que o servidor emitiu. Se houver evento autenticado do provedor, verificar assinatura, origem, data, identidade da mídia e unicidade do evento. Sinais com cobertura de trechos devem deduplicar intervalos, limitar o avanço ao tempo plausível no servidor e tratar pausas e saltos segundo política aprovada. Sem fonte confiável ou alternativa acessível aprovada, manter o estado pendente.
4. Após validação, gravar um recibo privado e idempotente contendo identidade da mídia e referência auditável da evidência, com unicidade por Viajante, história, revisão e etapa. Processar chamadas concorrentes e reenvios retornando o recibo existente. Rejeitar publicação revogada ou revisão obsoleta e preservar o histórico. A confirmação de vídeo não é uma concessão econômica.

`ended`, tempo em React, `localStorage` e pontuação enviada pelo cliente não qualificam por si só. Uma entrega de mídia ou evento válido confirma apenas os sinais definidos na política e não garante que a pessoa prestou atenção. Antes de habilitar a conclusão, validar sete missões, Harmonia, quiz, vídeo e os requisitos canônicos da revisão. Conciliar Economy-041 e comprovar pools antes de qualquer concessão.

## Verificação

- Vitest direcionado para fluxo, reprodutor e progressão: PASS, 34 testes em 4 arquivos. Fixtures sintéticas cobrem mídia indisponível, vínculo ausente ou divergente, controles, legendas, falha e nova tentativa. Reprodução de mídia autorizada permanece pendente.
- ESLint direcionado aos seis arquivos TS/TSX: PASS. TypeScript via `npm run typecheck --workspace=@rpg/web`: PASS. O primeiro comando ESLint incluiu CSS, que não é configurado para lint neste repositório; repetir apenas nos arquivos TS/TSX concluiu sem avisos.
- `git diff --check`: PASS.
- Edge em 320, 360, 390 e 1280 px, com avatar de teste. Teclado, toque emulado, foco, mensagens de status, ausência de rolagem horizontal, movimento reduzido e Diário com retorno. A rota real redirecionou visitantes sem sessão para login. Nenhuma requisição de mídia ou de escrita durante o fluxo. Sessão autenticada real, leitor de tela e toque físico permanecem pendentes.
- A página temporária de verificação foi removida. Nenhuma conclusão canônica ou recompensa foi gravada ou concedida.

Próxima tarefa recomendada: aprovar a mídia e revisar o contrato de evidência com o provedor escolhido. Depois, implementar a validação no servidor em ambiente de teste, separadamente da ativação econômica.
