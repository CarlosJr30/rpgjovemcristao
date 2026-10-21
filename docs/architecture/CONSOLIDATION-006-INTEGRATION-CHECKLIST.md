# CONSOLIDATION-006 — checklist de integração

2026-10-20. Verificação local pelo autor, sem revisão independente. Os testes positivos usam identidades/DataAPI sintéticas interceptadas; a API de combate do produto é real, mas retorna indisponível por falta de configuração. Não confundir essa combinação com sessão/JWT/PostgREST hospedados.

| Caminho | Evidência nova006 | Evidência reutilizada / limite |
| --- | --- | --- |
| Entrada/cadastro | auth-screen: oito casos, inclusive cadastro e confirmação obrigatória; auth-context: sessão verificada; browser entrada/cadastro sem opção local | Cadastro/e-mail reais não executados; fixture não comprova entrega de mensagem |
| Login/restauração/logout | integrated006 restaura Lia via SDK/DataAPI simulados, filtra Traveler pelo AuthUID, conserva preferências, encerra sessão e nega EBD após logout | Não importa save local como identidade; teste físico de duas sessões pendente |
| Rotas e convites | Browser nega flag local antiga e API de convite sem sessão; invite-panel gera QR/link e revoga em teste de componente | 002 PostgreSQL cobre isolamento entre Guildas, QR/pedido sem promoção; câmera/leitura/expiração com JWT real pendentes |
| História | Browser mapa nove mundos, Criação candidata e vídeo/conclusão bloqueados; workbook testa ordem/escopo/privacidade/ausência de prêmio | Percurso completo leitura→atividade→quiz→reflexão, cinco capítulos e Serpente: seis E2E005 inalterados. História individual não depende de líder; conteúdo/vídeo/recibo ainda bloqueiam conclusão |
| Guilda | Browser líder cria/publica missão, membro comprova, líder pede correção e aprova; recompensa continua pendente. Desafio, pedido de entrada e acesso não líder também exercitados | Workspace/RPCs simulados no browser; não comprova RLS nem concorrência hospedada |
| EBD | Browser líder autoriza professor; professor cria/publica aula/atividade, aluno responde, professor avalia e registra presença; histórico e ausência de crédito conferidos | Papéis/isolamento SQL: 002; backend faltante e conflitos: componentes e evidência001/0083. Professor não recebe papel global |
| Arena | Browser coleção0/7 e iniciar desabilitado com API indisponível; navegação para Torre agora acessível. Componentes testam intenção, resposta confirmada, Atacar/Defender/Cartas e recuperação de uso | Positivos com cartas sintéticas só em testes. Motor/atributos/126 comparações/27 batalhas003A e autoridade/28PG004 reutilizados, não reexecutados |
| Torre | Browser destino acessível e retomada sem servidor negada; storage exercita sete vitórias ordenadas, derrota, checkpoints, duplicatas, corrupção e nenhum crédito | Config de sete NPCs/dificuldade003A/0087 inalterada. Checkpoint demonstrativo não se converte em progresso oficial; positivo hospedado pendente |
| Baús | Reveal testa pausa exata2000ms, próximo/resumo/comparação/reload e cursor visual; opening testa recibo/timeout/reconsulta, sem grant por animação; browser mochila sem pilha não inventa botão de abertura | Abertura positiva do produto0088/001 usa recibos simulados. SQL de compra/abertura/atomicidade004 inalterado. Carta de revelação só em fixture demonstrativa |
| Áudio | AudioManager/cenas/holds/aba/saveData/volumes/mute/persistência/fallback/cleanup e cinco raridades; browser preferências persistidas entre Story/Arena/Torre/mochila, zero request de mídia/zero play sem homologação | Positivos de playback com FakeMedia, sem audição de arquivo; slots pendentes não são bindings aprovados |
| Vídeo→áudio | NativeVideo sintético testa retenção no play e liberação em pause/end/error/close/unmount, mute/master e observação sem recibo | Zero vídeos reais autorizados. YouTube/Vimeo aguardam adapter de término; abrir vídeo jamais conclui |

Execuções e contagens finais no [relatório](TASK-CONSOLIDATION-006-REPORT.md). Evidências históricas não são somadas às novas. SQL, grants, Auth, valores econômicos, engine, RNG, probabilidades e catálogo de cartas não mudam nesta tarefa.

## Auditoria do áudio

Reutilizado `gameAudio`/AudioManager0089: uma ambientação estável, até duas mídias nos650ms de crossfade, cache4 e pool4; loop definido pelo contexto, reward sem loop; preload none e alocação sob demanda. Master multiplica música/efeitos; estudo continua opt-in, preferências inicialmente desligadas. O gesto confiável é necessário, rejeição/fallback não bloqueiam jogo. Visibilidade/saveData suspendem; tokens e listeners têm cleanup coberto pelos testes.

20 slots musicais pendentes preservados, incluindo os nove mundos; cinco slots sonoros de baú pendentes. Menu, jardim, exploração, Serpente, Arena, Torre/boss, Guilda/EBD, estudo/oração/reflexão e recompensa/vitória mantêm seleção existente. Vitória usa evento semântico existente; slot reward não foi promovido a faixa real. APPROVED_MUSIC/APPROVED_EFFECTS vazios. Oito OGG históricos Suno Free continuam somente protótipos Arena DEV, sem cópia pública e sem nova homologação.

Raridade do prêmio confirmado, inclusive lendário→Extraordinário, seleciona chest_common/uncommon/rare/epic/extraordinary; não usa tipo do baú para inventar raridade. Montar/recarregar detalhes não repete som. Sem binding aprovado, silêncio. [Proveniência histórica](TASK-0089-AUDIO-CATALOG-AND-PROVENANCE.md).
