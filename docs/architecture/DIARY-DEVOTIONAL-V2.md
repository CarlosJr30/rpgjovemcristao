# Diário / Jornada Devocional V2 — TASK-0046

Entrega local em 2026-10-06. Diário apresentado como caderno do viajante: capa verde, lombada, marcador dourado, páginas claras e dois painéis por linha em desktop. Mobile usa uma coluna; nenhum asset novo necessário ou gerado.

## Arquitetura e dados

- `screens/diary.tsx`: Shell/RequireTraveler existentes; nome, nível, ato/fase atuais e seções sem alteração de save.
- `data/diaryView.ts`: projeção somente leitura dos campos existentes. `JourneySpotlight`, `resolveGardenStep` e PHASE_STEPS continuam sendo as fontes centrais de progresso/próximo objetivo; nenhuma fórmula paralela.
- CSS isolado em `components/diary-experience.module.css`. O fundo do próximo objetivo é sólido e escuro para manter contraste dos textos do componente reutilizado, sem alterar o componente compartilhado.
- Contexto, título/pergunta devocional e referências são os existentes; não há conteúdo bíblico novo. Links BIBLE_LINKS Gênesis 2/3 intactos, target blank com noopener/noreferrer.
- Timeline ordena apenas timestamps reais de abertura de links e envio/validação do desafio da Guilda. Identificadores únicos; confirmações/conclusões/recompensas sem timestamp aparecem em marcos separados, sem ordem cronológica inventada. Último evento significa último evento com data disponível, não última atividade absoluta.
- Reflexão `devotionalReflection` é a resposta já persistida, inicialmente recolhida em details, teclado/foco nativos e reset ao trocar viajante. Data não existe no modelo e isso fica explícito. O fluxo existente do Devocional grava a reflexão; o Diário apenas exibe e oferece o caminho para a fase.
- Quiz mostra estado pelo resolver central e tentativas iniciadas (`quizAttemptId`). Pontuação, respostas e datas por tentativa são transitórias e não são apresentadas como histórico. Nenhuma nota de fé/espiritualidade.
- Códice existente mantido, recolhido para destacar a jornada; ícone ausente deixa texto/metadados acessíveis.

## Correções e limites

O antigo formulário não salvava seus textos: saveDiaryEntry apenas incrementava diaryEntries. Foram removidas as áreas de texto sem persistência; o botão agora informa honestamente participação, sem alegar salvar resposta. O contador deixou de representar devocionais concluídos e a sequência fictícia de um dia foi removida. O botão bloqueia repetição após sucesso na visita e reporta falha real. A persistência/domínio existentes permanecem intactos.

Não foi criado histórico de entradas livres nem schema novo. Datas de confirmação, reflexão, quiz e recompensas e resultados de quiz permanecem indisponíveis. Eventual implementação desses dados exige contrato próprio. Nenhuma pendência bloqueante para esta apresentação local.

## Validação

- Unit: 5 arquivos, 61 testes PASS, projeção/datas únicas/não mutação, gate central, privacidade entre viajantes, React escapando texto e gravação/falha/duplo clique, regressão leitura/quiz/Guilda.
- E2E novos: 9 PASS, 5 skips de tamanhos duplicados no projeto mobile (todos os seis tamanhos testados no desktop; mobile adicional verifica toque 390). Reflexão longa, vazio, datas reais, ausência de pontuação inventada, links, progress 0→11, persistência, feedback e formulário Devocional existente.
- E2E regressão: 4 PASS, fluxo completo/teclado/persistência/mapa e equipamento/Códice nos projetos desktop/mobile.
- Lint, typecheck e build PASS; 20 rotas estáticas. Next-env restaurado byte a byte e compilação TypeScript direta revalidada ao final.
- Seis viewports: 390×844, 412×915, 844×390, 915×412, 1440×900, 1920×1080. QA visual de vazio e registros, texto longo e foco; sem overflow horizontal, alvos visíveis >=44px, reduced motion sem animação, contraste do painel do próximo objetivo >=4.5:1 verificado por E2E.
- REWORK: mapa de estados da Guilda inicialmente omitira submitted (build detectou); adicionado/testado. QA visual detectou contraste insuficiente do próximo objetivo no fundo claro; fundo/texto corrigidos e E2E repetido. Verificação de contraste usou Array.from após typecheck apontar NodeList não iterável no tsconfig raiz; typecheck repetido PASS.
- QA/Security feitos pelo autor, sem independência. Evidências/logs/screenshots e preservação SHA-256 em `build/task-0046-evidence`; Security em `docs/security/DIARY-DEVOTIONAL-V2-REVIEW.md`.
- Preservação final PASS: baseline 571 arquivos, 567 íntegros, três alterados autorizados, contrato movido e sete novos autorizados; zero ausentes/divergências inesperadas. As 163 mídias e next-env permaneceram byte a byte íntegros. Rota local em 127.0.0.1:3000/journey/diary respondeu HTTP 200.

Sem alteração de domínio, stores/save, Auth/Supabase, economia/progressão, conteúdo bíblico, outras telas, mídia/catálogos/licenças. Sem instalação, serviço externo, push/deploy/publicação.
