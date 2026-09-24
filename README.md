# RPG Jovem Cristão

Fundação de engenharia assistida por agentes para um RPG cristão com progressão cronológica das narrativas bíblicas.

**Estado:** onboarding local funcional: Home → criação do Viajante → introdução → mapa de oito atos → Ato I → apresentação da fase 1.1. Sem autenticação, banco ou atividades da fase. Execução, reset e limites em [Jornada local](docs/architecture/LOCAL-JOURNEY.md). Stack preservada conforme [BOOTSTRAP](docs/architecture/BOOTSTRAP.md) e [TECH-STACK](docs/architecture/TECH-STACK.md).

## Executar localmente

Requisitos: Node.js 24.16.0 ou superior na linha 24 LTS, npm 11.13.0 ou superior na linha 11 e Git no PATH. Referência verificada: Windows build 26200, Node 24.16.0, npm 11.13.0 e Git 2.55.0.windows.5. Não é necessário instalar PostgreSQL ou configurar `.env`.

Na raiz do projeto:

```powershell
npm ci
npm run dev
```

Abra **http://127.0.0.1:3000**. O servidor escuta apenas na máquina local; encerre com `Ctrl+C`. Caso a porta esteja ocupada, confira a URL informada pelo Next no terminal. As dependências já instaladas dispensam repetir `npm ci` até o lockfile mudar.

Para testar o build de produção local:

```powershell
npm run build
npm run start
```

## Qualidade

| Comando                      | Finalidade                                                             |
| ---------------------------- | ---------------------------------------------------------------------- |
| `npm run build`              | Compilar aplicação Next.js                                             |
| `npm run lint`               | ESLint, incluindo fronteiras dos packages                              |
| `npm run typecheck`          | TypeScript strict em todos os workspaces e configurações               |
| `npm test`                   | Testes Vitest de página, engine e ambiente do banco                    |
| `npm run format:check`       | Conferir formatação de código/configuração e documentação do bootstrap |
| `npm run format`             | Aplicar Prettier no mesmo escopo                                       |
| `npm run test:e2e -- --list` | Conferir descoberta dos testes E2E                                     |
| `npm run test:e2e`           | Após build, testar desktop/mobile com Edge já instalado                |

Playwright inicia e encerra seu servidor local; mantenha a porta 3000 livre antes dos E2E. Não baixa navegadores automaticamente. A configuração usa o canal `msedge`; se ele não estiver disponível, configure explicitamente um navegador local compatível antes de executar E2E. Viewport móvel não substitui teste em aparelho real.

## Comece aqui

- [AGENTS.md](AGENTS.md): entrada e fluxo dos agentes.
- [Projeto e roadmap](projects/RPG-JOVEM-CRISTAO.md): visão e prioridades.
- [Workflow e contrato de tarefa](.agent/WORKFLOW.md): execução, validação e conclusão.
- [Estado atual](.agent/memory/CURRENT_STATE.md): resumo operacional.
- [Segurança](.agent/SECURITY.md): política obrigatória.
- [RAG](rag/README.md) e [MCP](mcp/README.md): preparação documental.

## Organização

| Caminho                 | Responsabilidade                                                    |
| ----------------------- | ------------------------------------------------------------------- |
| `.agent/`               | Governança, perfis, procedimentos e memória curta                   |
| `docs/`                 | Arquitetura, design, conteúdo bíblico, segurança e ADRs             |
| `projects/`             | Visão e roadmap                                                     |
| `tasks/`                | Contratos em backlog, execução e concluídos                         |
| `rag/`                  | Fontes, conteúdo curado e índices futuros                           |
| `mcp/`                  | Declarações e servidores futuros                                    |
| `apps/web/`             | Next.js App Router: página, layout e CSS                            |
| `apps/api/`             | Reserva histórica; não há API ou serviço separado                   |
| `packages/database/`    | Drizzle, pg, validação de ambiente e schema vazio; somente servidor |
| `packages/game-engine/` | Fundação de regras TypeScript puro, sem gameplay                    |
| `packages/shared/`      | Contratos públicos mínimos                                          |
| `packages/ui/`          | Componentes React sem dependência de banco                          |
| `tests/e2e/`            | Fluxos Playwright em desktop/mobile                                 |

## Ambiente e limites

Um npm workspace e um lockfile mantêm o monólito modular. Dependências e versões relevantes estão em [BOOTSTRAP](docs/architecture/BOOTSTRAP.md). Os procedimentos em `.agent/skills/` são guias locais, não skills instaladas no runtime.

`.env.example` contém somente `DATABASE_URL` vazio, reservado para persistência futura. Nenhuma credencial é necessária para abrir a página. Não há conexão, migration, serviço externo ou autenticação configurada. `.env`, caches e resultados gerados permanecem ignorados. Scripts automáticos de instalação são bloqueados por `.npmrc`.

Schema completo, regras de gameplay e Better Auth dependem de tarefas próprias. Antes de contas/publicação, fechar público operacional, privacidade, retenção/exclusão e licença da edição bíblica portuguesa. O roadmap não autoriza executar a próxima tarefa.

Revisão de dependências: auditoria de produção sem avisos; quatro avisos moderados na cadeia de desenvolvimento do Drizzle Kit e ESLint 9 temporariamente mantido por compatibilidade. Escopo, justificativa e acompanhamento estão em [BOOTSTRAP-REVIEW](docs/security/BOOTSTRAP-REVIEW.md).
