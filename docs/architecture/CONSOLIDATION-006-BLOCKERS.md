# CONSOLIDATION-006 — bloqueios P0–P3

Estado LOCAL em2026-10-20; nenhum inventário remoto atualizado. Prioridade indica impacto na liberação, não nova autorização ou diagnóstico de vulnerabilidade remota. Segurança/autoridade004 foi implementada e testada offline, mas não aplicada nem verificada hospedada.

| ID | Prioridade | Alcance | Condição de desbloqueio / responsável |
| --- | --- | --- | --- |
| ENV-ISOLATED | P0 | Qualquer Preview conectada | Responsável autoriza projeto vazio/custos; comprovar novo Supabase ref/host separado de produção, sem copiar dados |
| AUTH-ACL-CUTOVER | P0 | Qualquer Preview com contas/recursos econômicos | Revisar pacote002+alternativa004, backup/recuperação, aplicar só quando autorizado; comprovar Auth/JWT/ACL/RLS reais, negar writes econômicos diretos e comandos antigos. UI bloqueada não substitui essa prova |
| PREVIEW-IDENTITY | P0 | Publicação/testadores | SHA exato com CI verde e método de publicação elegível, projeto Vercel correto, credenciais de teste isoladas, proteção e URL HTTPS verificadas. Nenhum deployment006 existe |
| HOSTED-CROSS-ACCOUNT | P1 | Aceite de Guilda/EBD/contas/economia | Duas contas/Travelers e duas Guildas no alvo isolado; comprovar negativas e papéis reais. Mocks não provam segurança hospedada |
| STORY-EDITORIAL-VIDEO | P1 | Conclusão oficial Story; não impede uma Preview limitada claramente rotulada | Revisão editorial dos cinco candidatos, fonte/licença/incorporação/legendas/alternativa e adapter/prova de vídeo+recibos protegidos. Zero vídeo autorizado hoje; sem dependência de aprovação de líder |
| ARENA-CARDS | P1 | Arena/Torre jogáveis | Homologar sete propostas003A, versão/arte/fontes/recibos e starter; banco e protocolo3 compatíveis, provar posse e partidas server-side. Nenhuma carta concedida nesta tarefa |
| ECON-DOMAINS | P1 | Prêmios/ações ainda pausados | Reconciliação revisada de legados; contratos específicos para jornada, liquidação Guilda/EBD e recompensas Torre. Manter pausas e pendências; não reativar gateway antigo para liberar botões |
| PHYSICAL-ACCEPTANCE | P1 | Alegação de pronto para aparelhos reais | Matriz física/duas sessões/câmera/teclado/retomada/background. Emulação não atende esse gate |
| AUDIO-RIGHTS-MIX | P2 | Experiência sonora; Preview silenciosa pode ser limitada | Mídias com direitos e revisão individual, hashes/duração/loop/mix/audição; bindings aprovados. Protótipos Suno Free não são alternativa comercial |
| PERF-MEDIA | P2 | Qualidade/performance | Medir em rede/aparelhos alvo antes de priorizar compressão: assets públicos200657136B; maiores imagens2,48–3,51MB. Não otimizar ou trocar arte por suposição |
| MAINTENANCE-FOLLOWUP | P3 | Acompanhamento | Reavaliar apenas ao surgir evidência nova; auditoria anterior de dependências não foi reaberta. Sem upgrade ou vulnerabilidade reclassificada nesta006 |
| WORLDS-2-9 | P3 / roadmap | Conteúdo futuro | Permanecem slots, fora da entrega006. Não preencher automaticamente nem apresentar os nove mundos como campanha completa |

Os defeitos AUDIO-FAILED-CONTEXT e NAV-TOWER foram corrigidos localmente com evidência anterior e posterior. Não há novo achado alto/crítico conhecido no diff006. A ausência de prova hosted continua bloqueando GO; não equivale a afirmar que produção foi inspecionada ou corrigida.

Uma Preview limitada pode validar conta/Avatar/Guilda/EBD e prévias sem conclusão após todos os P0 e os P1 pertinentes. Enquanto Story e combate principais estiverem bloqueados, não chamar o jogo de integralmente jogável. [Guia operacional](CONSOLIDATION-006-PREVIEW-GUIDE.md) e [matriz](CONSOLIDATION-006-HOSTED-PHYSICAL-MATRIX.md).
