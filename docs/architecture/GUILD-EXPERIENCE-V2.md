# TASK-0043 — Guild Experience V2

**Status final: DONE para implementação/aceite local.**

## Arquivos alterados

- Runtime existente: screens/guild-hub.tsx; components/guild-content-board.tsx; components/online-guild-hub.tsx (sob apps/web/features/journey).
- Novos: components/guild-hero.tsx; components/guild-experience.module.css; data/guildPresentation.ts; data/guildExperienceAssets.ts; guild-experience.test.tsx (mesma raiz).
- Testes: online-guild-hub.test.tsx; tests/e2e/guild-experience-v2.spec.ts (novo); tests/e2e/home.spec.ts; tests/e2e/immersion-sprint.spec.ts (somente rótulos locais atualizados).
- Documentação: este relatório; docs/security/GUILD-EXPERIENCE-V2-REVIEW.md; tasks/completed/TASK-0043-guild-experience-v2.md; .agent/memory/CURRENT_STATE.md. Evidências auxiliares não são runtime.

## Resultado e arquitetura

Guilda existente aprimorada, sem reconstrução de domínio. GuildHub/GuildContentBoard continuam locais; OnlineGuildHub continua usando os mesmos repositories; GuildManageScreen e suas permissões não mudaram. Salão em CSS com pedra clara/pergaminho, estandarte de inicial neutro, verde profundo, luz quente e detalhes dourados. Nenhum símbolo espiritual, imagem, áudio ou identidade pessoal foi inventado.

GuildHero é compartilhado entre jogador local/online e gestão online. Mostra nome, descrição, líder disponível nos dados, participação e contadores de atividades carregadas. Nome ausente é explicitamente “Liderança não informada”; contadores não afirmam totais globais quando os dados são paginados. Não há pontuação de fé/ranking espiritual.

## Jogador

- Conteúdo local tem Disponíveis, Aguardando aprovação e Concluídas; aprovadas antigas ainda pendentes de resgate continuam na área de aprovação/recompensa, conforme o modelo anterior. Desafios legados mantêm suas seções próprias.
- Online mantém disponíveis, em andamento, nova tentativa e aguardando aprovação separados; concluídas seguem no Histórico. Nenhuma alteração na seleção de missões publicadas/vigentes/realizáveis: guildPlayerVisibility continua intacto.
- Cards mostram tipo, título, descrição curta, estado textual, prazo quando existe, recompensa oficial e ação existente. “Ver missão” usa details/summary nativo acessível para conteúdo completo; fechamento por clique/teclado, sem novo modal. Destaque de tier épico/extraordinário sem recompensa fabricada.
- Progresso coletivo local usa apenas aprovações reais/meta existente; online não inventa progresso coletivo do membro quando não está disponível nos dados carregados. Gestão mantém contadores existentes.
- Relógio do resumo local também considera prazos de conteúdo, acompanhando expiração sem precisar recarregar.

## Líder e aprovação

Fila local movida antes de criação/conteúdo, inclusive ordem DOM/teclado. Cada envio apresenta jogador, missão, data registrada ou ausência explícita, recompensa e as ações existentes. Evidência objetiva online continua visível; modelo local não contém nota/evidência extra, portanto nada foi fabricado.

Online preserva atenção prioritária, ordenação de gate da Jornada, membros, agenda, conteúdo e histórico. Aprovar/nova tentativa bloqueiam durante a mesma requisição; guarda por ref evita duas chamadas concorrentes. Sucesso mostra missão aprovada, Viajante e recompensa real. Erro mantém feedback recuperável.

No domínio local, aprovação já concede XP/moedas/baú automaticamente e registra claimed; feedback informa recompensa processada. Não há novo resgate nem segunda concessão. Domain/RPC/idempotência/economia/persistência permanecem intactos. Aprovação online usa o evento guildApproval já existente; ausência de áudio aprovado continua silenciosa. Nenhum áudio Arena reutilizado.

## Acessibilidade e visual

Alvos de 48px, foco visível, labels existentes, status por texto, detalhes por teclado, wrap de palavras e métricas compactas. Entrada/hover/feedback leves com animações e transições desativadas sob prefers-reduced-motion. Retrato e landscape não dependem de modal.

## Validação

Resultados finais devem ser lidos junto aos logs em build/task-0043-evidence:

| Check | Resultado | Cobertura |
| --- | --- | --- |
| Unit | 7 arquivos / 27 PASS | Filtros/relógio/hero, domínio e recompensas locais, repositories/online UI mockados, aprovação concorrente bloqueada e feedback |
| E2E | 10 PASS | Guilda local, criação/publicação/persistência, filtros/seções, abrir missão, aprovação, recompensa única/reload/histórico; desktop/mobile |
| Lint | PASS | npm run lint |
| Typecheck | PASS | npm run typecheck |
| Build | PASS, 20 rotas | npm run build |

Seis viewports no teste matricial: 390×844, 412×915, 844×390, 915×412, 1440×900, 1920×1080. Capturas jogador/líder em cada tamanho e resultado da aprovação em build/task-0043-evidence/e2e-final; movimento reduzido alternado, keyboard/foco/summary/overflow/touch targets verificados. Inspeção visual adicional de retrato, desktop e landscape realizada pelo autor.

QA/Security pelo próprio autor, sem revisão independente. E2E usa storage isolado do navegador de teste, não dados pessoais salvos. Online validado por unit/repositories mockados; **nenhuma validação visual online autenticada, escrita ou teste RLS no Supabase real**. A validação remota existente de Guild Leader V2 permanece uma pendência prévia, sem ser substituída por esses testes locais.

REWORK durante validação: rótulo do painel mantido para compatibilidade; teste novo de baú corrigido para consultar o mapa real de quantidades por tipo, em vez de tratá-lo como array. Rodadas falhas não contadas como PASS.

## Correções e regras preservadas

Melhorias verificadas: pendências locais antes do formulário; estado expirado textual no catálogo do líder; apresentação de recompensas/decisão; trava de requisição de revisão online; sincronização do resumo com prazo local. Recompensas oficiais, datas/janelas, aprovação/revisão, idempotência, collectiveTarget, gates da fase, histórico, direitos de líder, repositories e save schema preservados. Arena/combate/Auth/Supabase/migrations/equipamentos/inventário/áudios/mídia existentes não editados nesta tarefa.

## NEEDS_NEW_ASSET

Inventário tipado de planejamento: apps/web/features/journey/data/guildExperienceAssets.ts. Não é catálogo aprovado nem loader; zero requisições a caminhos ausentes. Nenhum item READY.

| Nome | Caminho sugerido | Resolução | Transparência | Função |
| --- | --- | --- | --- | --- |
| guild_hall | /assets/world/guild/guild_hall.webp | 1920×1080 | Não | Salão desktop acolhedor |
| guild_hall_mobile | /assets/world/guild/guild_hall_mobile.webp | 960×1280 | Não | Composição própria mobile |
| guild_banner_neutral | /assets/world/guild/guild_banner_neutral.png | 512×768 | Sim | Estandarte neutro |
| guild_mission_parchment | /assets/world/guild/guild_mission_parchment.png | 768×1024 | Sim | Decoração discreta dos cards |
| guild_leader_table | /assets/world/guild/guild_leader_table.webp | 1600×600 | Não | Ambiente de liderança, sem retrato pessoal fictício |
| guild_reward_chest | /assets/world/guild/guild_reward_chest.png | 512×512 | Sim | Baú quando a recompensa real o incluir |

Assets opcionais não bloqueiam o fallback CSS entregue. Usuário gera/aprova separadamente. Futuro registro segue o pipeline audiovisual da Arena: arquivo real, dimensões/alpha/hash, proveniência/licença/revisão humana, receipt, manifest e auditor antes de binding em catálogo aprovado. Não ativar asset/áudio ausente para passar audit.

## Pendências

- Entrega e aprovação humana desses assets opcionais; nenhuma geração automática.
- Validação remota previamente pendente da Guilda online, com autorização específica e contas de teste; não realizada nesta TASK.
- Revisão humana de sensação/estética no jogo. Aceite técnico local da TASK-0043 não concede licença/publicação comercial ao áudio Suno Free da Arena.
