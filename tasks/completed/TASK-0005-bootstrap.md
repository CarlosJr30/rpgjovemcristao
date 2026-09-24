# TASK-0005 → Bootstrap executável

ID: TASK-0005
TITLE: Bootstrap local do RPG Jovem Cristão
OBJECTIVE: Executar a aplicação web local com workspace modular e checks reproduzíveis.
PRIORITY: P1 High
STATUS: DONE
SCOPE: apps/web; packages/database, game-engine, shared e ui; configuração raiz, testes, README e memória.
OUT_OF_SCOPE: gameplay, autenticação, schema completo, conexão de banco, migrations, cloud, deploy, software global e push.
DEPENDENCIES: TASK-0002; TASK-0004
ASSIGNED_AGENT: ORCHESTRATOR; perfis ARCHITECT, DEVOPS, BACKEND, FRONTEND, QA e SECURITY assumidos pelo mesmo autor, sem revisão independente.
REQUIRED_CONTEXT: AGENTS.md; GLOBAL_CONTEXT; CURRENT_STATE; WORKFLOW; ORCHESTRATOR; RULES; SECURITY; TECH-STACK; DATA-MODEL; DATABASE-RULES; ADR-0001/0002; perfis e procedimentos locais selecionados.
SECURITY_CONSIDERATIONS: Dependências estáveis fixadas, sem secrets/serviços externos; .env ignorado; database somente servidor e sem conexão automática; página sem dados privados.

## Autorização e distribuição

Pedido explícito autoriza a primeira implementação e instalação de dependências locais. Substitui o limite documental anterior somente para este contrato. A recomendação de políticas não havia sido contratada; passa a próxima recomendação TASK-0006. Nenhuma implementação dessa próxima tarefa está autorizada.

ORCHESTRATOR amplia os escopos dos perfis dentro deste pedido: DEVOPS configura raiz/workspaces; BACKEND prepara database, shared e fundação pura de engine; FRONTEND implementa web/UI; ARCHITECT documenta fronteiras; QA mantém testes e evidências; SECURITY revisa dependências, configuração e exposição. Todos executados localmente pelo autor.

ACCEPTANCE_CRITERIA:
- Aplicação inicial identifica RPG Jovem Cristão e apresenta Iniciar Jornada sem gameplay.
- Quatro packages estruturados com fronteiras de domínio, persistência e UI.
- build, lint, typecheck e testes passam; estrutura E2E disponível sem download pesado obrigatório.
- Aplicação inicia localmente; instruções e URL documentadas.
- Nenhum secret criado; ambiente ignorado; dependências revisadas.

TEST_PLAN:
- npm run build; npm run lint; npm run typecheck; npm test.
- Verificar configuração/descoberta E2E e executar com navegador instalado se disponível.
- Smoke HTTP local, revisão de semântica/responsividade e isolamento da persistência.
- Auditoria npm, licenças, arquivos de ambiente e exclusões Git.

DEFINITION_OF_DONE:
- Critérios comprovados, QA e SECURITY registrados, memória atualizada; somente então DONE.

## Pré-flight

Windows NT 10.0.26200.0; Node 24.16.0; npm 11.13.0; Git 2.55.0.windows.5 disponível. Node 24 em linha LTS suportada e acima do mínimo 20.9 do Next 16. Compatibilidade de cada dependência será conferida via metadados npm. Nenhum software global alterado. Repositório Git ainda não inicializado; inicialização local autorizada se necessária para checks de ignore.

Fontes: https://nodejs.org/en/about/previous-releases e https://nextjs.org/docs/app/getting-started/installation (consulta 2026-09-16).

## Evidências

Instalação concluída com scripts de lifecycle desabilitados. Primeiro build compilou, mas sandbox bloqueou subprocesso de TypeScript (EPERM); nova execução autorizada fora do sandbox PASS. Lint inicial PASS. Typecheck inicial FAIL por falta de lib DOM no tsconfig raiz para E2E; corrigido em REWORK, revalidação pendente. Vitest também exigiu execução fora do sandbox por spawn EPERM. Nenhuma falha mascarada como sucesso.

Correção aplicada e retomada ACTIVE → VALIDATING. Typecheck reexecutado com sucesso; nenhum erro de implementação aberto.

## SELF VALIDATE / QA

Autor e revisor: mesmo ORCHESTRATOR assumindo QA; sem independência.

| Check | Resultado e evidência |
| --- | --- |
| BUILD | PASS — npm run build, Next 16.3.5, rota / estática e /_not-found; compilação e verificação TypeScript completas |
| LINT | PASS — npm run lint, ESLint --max-warnings=0 |
| TYPECHECK | PASS — npm run typecheck; cinco workspaces e configuração raiz |
| UNIT TEST | PASS — npm test; 4 arquivos, 10 testes (página, engine, validação PostgreSQL, adaptador sem conexão no import e fechamento do pool) |
| INTEGRATION | PASS no escopo — composição Next/shared/ui exercitada em build e navegador; factory database com driver mockado. PostgreSQL real N/A: schema/persistência de jogo não implementados |
| E2E | PASS — npm run test:e2e -- --list descobre 2; npm run test:e2e executa 2/2 no Edge existente, desktop/mobile, HTTP 200, título/idioma/heading, descrição acessível, botão desabilitado, sem overflow ou pageerror |
| FORMAT | PASS — npm run format:check |
| DEV | PASS — Next dev local, HTTP 200 e conteúdo RPG; servidor/árvore de subprocessos encerrados pelo PID criado nesta validação |
| VISUAL | PASS — capturas em test-results/home-desktop.png (1280×800) e home-mobile.png (390×844) inspecionadas; conteúdo legível, sem corte/sobreposição. Artefatos locais ignorados pelo Git |
| DEPENDÊNCIAS | PASS — npm ls --depth=0 sem peers inválidos, versões exatas, engines compatíveis; lockfile somente registry.npmjs.org |
| SECURITY | PASS com exceções moderada/baixa registradas em docs/security/BOOTSTRAP-REVIEW.md; produção 0 vulnerabilidades; completo 4 moderadas da mesma cadeia esbuild, 0 altas/críticas |
| NO SECRETS | PASS — .env.example vazio, nenhum .env real; git check-ignore confirma ambiente/cache/build/test-results; scan de conteúdo e revisão manual sem segredo adicionado |
| DOCUMENTAÇÃO | README, BOOTSTRAP, revisão de segurança e memória atualizados para implementação |
| REGRESSÕES | Nenhuma crítica conhecida no bootstrap; nenhuma afirmação sobre gameplay/auth/banco ainda não implementados |

Não foram baixados browsers nem executados migrations, banco remoto, software global, deploy, push ou commit. Git inicializado localmente para validar exclusões; arquivos preexistentes preservados. Telemetria Next desativada nos comandos de validação do agente.

## Aceite e acompanhamento

Página funcional local sem configuração, packages estruturados, checks obrigatórios aprovados. Formatação consistente; E2E já executável com Edge. Comando npm run dev, URL http://127.0.0.1:3000. Nenhuma credencial criada. Riscos residuais explicitamente aceitos para bootstrap local pelo ORCHESTRATOR; DEVOPS/SECURITY acompanham atualizações antes de habilitar ferramentas de banco/publicação.

Próxima recomendação única: TASK-0006 para políticas do piloto, privacidade/contas, retenção/exclusão e edição/licença portuguesa; não iniciada. Schema completo, auth e gameplay ficam para outros contratos após seus gates aplicáveis.

Aceite final: todos os checks obrigatórios aprovados, links locais conferidos, porta 3000 sem listener remanescente e memória atualizada. VALIDATING → DONE.
