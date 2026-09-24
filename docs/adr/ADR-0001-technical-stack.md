# ADR-0001 → Stack técnica do RPG Jovem Cristão

STATUS: accepted
DATE: 2026-09-16
TASK: TASK-0002

## CONTEXT

RPG web responsivo para desktop/celular com jogadores reais, contas e progressão persistente, campanha bíblica cronológica e futura expansão para PWA, ranking, social e administração. A solicitação autoriza decidir a arquitetura, sem implementação ou instalação. A fundação favorece monólito modular. Supõe-se equipe pequena, custo inicial controlado e batalhas por ações; gameplay e público/MVP ainda serão validados. Não existe requisito confirmado de simulação em tempo real.

## DECISION

Adotar monólito modular TypeScript strict: React e Next.js App Router para UI e adaptadores HTTP/JSON no mesmo serviço Node.js LTS; PostgreSQL com Drizzle ORM, node-postgres e futuras migrações Drizzle Kit; Better Auth com adaptador Drizzle e sessões no banco; Zod nas fronteiras. UI semântica com CSS Modules/tokens CSS. Regras em núcleo TypeScript puro, independente de renderização, executado autoritativamente no servidor.

Separar apps de bibliotecas packages e fronteiras de domínio, aplicação, persistência, auth, contratos e UI. Apenas um deploy inicial, sem API Nest separada ou microserviços. Servidor valida propriedade, regras e transações de XP, nível, inventário, recompensas, batalhas e progressão; cliente emite intenções. Exigir idempotência e proteção de concorrência nas futuras concessões.

Planejar Vitest, React Testing Library, Playwright e integração PostgreSQL; npm workspaces e verificações de tipos/lint na futura preparação. Deploy em serviço Node via contêiner Linux com PostgreSQL gerenciado, sem fornecedor contratado. Logs JSON redigidos e futura instrumentação OpenTelemetry. Redis e storage S3 apenas quando justificados. Sem engine gráfica dedicada: React inicialmente, possibilidade híbrida posterior.

[TECH-STACK](../architecture/TECH-STACK.md) é o detalhamento de fronteiras, entidades, comparações, controles, fontes e gatilhos de evolução. Versões e compatibilidade deverão ser verificadas antes de instalação autorizada; accepted significa direção arquitetural oficial, não controles implementados ou aprovação de produção.

## ALTERNATIVES

- React/Vite com API Node: viável, mas exige compor mais peças e operar artefatos distintos; reservar para necessidade de separação real. NestJS favorece convenções de equipes maiores, com custo desnecessário agora.
- Prisma: boa produtividade e abstração de modelos; preferiu-se controle próximo de SQL com Drizzle. SQL direto exige mais mapeamento e convenções. Não combinar ORMs.
- SQLite ou banco documental: não oferecem vantagem decisiva para o conjunto de relações, escrita concorrente e integridade previsto; PostgreSQL é a referência de produção escolhida.
- Identidade gerenciada: pode reduzir operação, mas depende de custos e privacidade ainda não definidos; auth própria foi rejeitada por risco e esforço.
- Canvas/Phaser: adequados a cenas animadas e simulação visual, ainda sem requisito que compense complexidade. Abordagem híbrida fica disponível sem alterar núcleo de regras.
- Tailwind/kit completo, cache distribuído, filas e microserviços: não são necessários para atender à decisão inicial; introduzir somente por necessidade observada.

## CONSEQUENCES

Benefícios: linguagem comum, operação inicial enxuta, dados relacionais transacionais, regras isoladas para testes e evolução gráfica sem vincular progressão ao cliente. Contratos pequenos ajudam revisão humana e desenvolvimento assistido por IA.

Custos: ciclo de atualização Next/React, domínio de SQL, operação segura de identidade e disciplina manual de fronteiras. Drizzle e Better Auth exigem avaliação de manutenção/compatibilidade; nenhuma biblioteca torna a aplicação segura por si. Sem benchmark, capacidade ou custo garantido.

Controles exigidos antes de exposição pública: autorização por recurso, validação server-side, cookies/sessões seguros, CSRF, rate limiting, consultas parametrizadas, secrets protegidos, logs mínimos, testes de concorrência e restauração. Cadastro/social dependem de definição do público e privacidade. Persistência de jogo offline não faz parte da decisão.

Reavaliar por novo ADR se tempo real virar requisito, incompatibilidade de dependências impedir adoção, limitações operacionais justificarem identidade gerenciada ou métricas demonstrarem necessidade de extração. Próxima tarefa recomendada é definição documental de público/MVP antes da modelagem. Nenhuma próxima tarefa está iniciada.
