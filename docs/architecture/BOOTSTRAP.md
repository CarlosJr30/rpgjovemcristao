# Bootstrap executável

TASK-0005 concretiza ADR-0001 sem alterar a stack ou implementar o MVP. A autorização do usuário permite código e dependências locais nesta tarefa; os limites documentais históricos não autorizam automaticamente trabalho futuro.

## Estrutura e fronteiras

Um npm workspace, um lockfile, uma aplicação Next.js App Router. `apps/api` continua reservado, sem processo separado. Packages privados exportam TypeScript fonte; Next transpila os packages da UI. Não são pacotes publicáveis nem serviços.

| Local                | Papel                                               | Limite                                                      |
| -------------------- | --------------------------------------------------- | ----------------------------------------------------------- |
| apps/web             | Composição de páginas React e futuro adaptador HTTP | Não implementa regras de gameplay                           |
| packages/ui          | Apresentação semântica React/CSS Modules            | Sem persistência ou lógica de jogo                          |
| packages/shared      | Contratos públicos mínimos                          | Sem infraestrutura, dados pessoais ou secrets               |
| packages/game-engine | Fundação pura de regras                             | Sem React, Next, rede ou persistência                       |
| packages/database    | Adaptador Drizzle/node-postgres e validação Zod     | Export principal marcado server-only; sem conexão no import |

Domínio e casos de uso ainda não têm comportamento implementado. O mapa de packages/domain, application, contracts e persistence em TECH-STACK é conceitual; neste bootstrap os quatro packages solicitados bastam. Extrações futuras dependem de casos de uso reais. ESLint restringe importações entre engine/shared, UI e persistência. O marcador server-only impede importar database na árvore cliente Next.

## Ambiente e banco

A página não lê variáveis de ambiente nem precisa de PostgreSQL. `.env.example` declara somente `DATABASE_URL=` vazio. `createDatabase` exige configuração explicitamente recebida e validada com Zod; só cria pool quando chamada e conexão somente quando consultada. Mensagens de configuração não refletem entradas. A aplicação não chama a factory.

O schema é vazio; Drizzle Kit tem somente configuração de geração local, sem credenciais e sem comandos de push/migration. Não existem tabelas, banco instalado, conexões, migrações ou promessa de integridade transacional implementada. Better Auth continua aprovado para tarefa posterior, sem instalação ou endpoints neste bootstrap.

## Dependências

Versões diretas exatas em package.json e manifests dos workspaces; transitivas fixadas no package-lock.json. Registro oficial npm consultado para engines, peers e licenças. Node 24.16.0/npm 11.13.0 são a referência local. Next 16.3.5/React 19.3.0; TypeScript 5.9.3 escolhido porque typescript-eslint 8 aceita versões abaixo de 6.1 (TypeScript latest 7 não é compatível). ESLint 9.39.5, Prettier 3.9.6, Vitest 5.0.1/Vite 7.3.6, Playwright 1.63.0. Drizzle 0.45.2, Kit 0.31.10, pg 8.23.0 e Zod 4.6.5.

Dependências diretas sob MIT ou Apache-2.0. A instalação bloqueia scripts de lifecycle via `.npmrc`; não usa gerador remoto nem downloads de browsers. Cache npm permanece dentro do workspace. Licenças transitivas e riscos residuais (Drizzle Kit/esbuild moderado e manutenção do ESLint 9) estão na [revisão de segurança](../security/BOOTSTRAP-REVIEW.md). `npm ci` reproduz o lockfile. Nenhuma atualização global é necessária.

Fontes de compatibilidade: [Node LTS](https://nodejs.org/en/about/previous-releases), [Next instalação](https://nextjs.org/docs/app/getting-started/installation), metadados `npm view` das versões fixadas. Consultados em 2026-09-16.

## Validação e limites

Build compila a página; typecheck cobre todos os workspaces e configurações; lint verifica convenções/fronteiras; Vitest cobre página, fundação da engine e configuração do banco. Playwright usa Edge instalado, testa desktop e viewport móvel contra build de produção e gerencia o servidor. E2E exige `npm run build` primeiro. Não há download automático de navegador. Outras máquinas podem trocar o channel por seu navegador disponível explicitamente.

Nenhum teste de banco real, auth, concorrência ou gameplay é aplicável: essas implementações permanecem futuras. A página inicial é uma apresentação original, sem citação bíblica ou narrativa de missão. QA e Security deste bootstrap são revisões pelo autor, sem independência. Evidências finais no [contrato TASK-0005](../../tasks/completed/TASK-0005-bootstrap.md).
