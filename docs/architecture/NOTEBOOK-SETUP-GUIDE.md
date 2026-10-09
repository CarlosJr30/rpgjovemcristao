# Preparar o notebook — RPG Jovem Cristão

Este guia usa a branch `main` de `https://github.com/CarlosJr30/rpgjovemcristao.git`. Configuração privada e dados exclusivos do navegador não fazem parte do Git.

## Instalar as ferramentas manualmente

Instale Git for Windows e VS Code pelos sites oficiais. Instale Node compatível com o `package.json`: `>=24.16.0 <25`, com npm `>=11.13.0 <12`. A referência validada neste projeto é Node 24.16.0/npm 11.13.0. Reabra o PowerShell depois da instalação.

```powershell
git --version
node --version
npm --version
```

Não use uma versão Node incompatível nem altere o lockfile para contornar erro de instalação. Configure sua identidade Git local e autentique o GitHub pelo gerenciador de credenciais, sem inserir token no URL do remoto.

```powershell
git config --global user.name "Seu nome"
git config --global user.email "Seu email de commit"
```

## Clonar e instalar o projeto

Escolha uma pasta existente no notebook. O caminho pode ser diferente de `D:\rpg-jovem-cristao`; os comandos são executados na raiz clonada.

```powershell
git clone --branch main https://github.com/CarlosJr30/rpgjovemcristao.git
Set-Location rpgjovemcristao
git status --short --branch
npm ci
```

O lockfile é único para todos os workspaces. `.npmrc` mantém `ignore-scripts=true`; não desligue essa proteção globalmente. Não copie dependências/caches do computador original. Se uma dependência exigir um passo adicional, diagnostique o erro e autorize somente o passo específico.

## Ambiente privado

Antes de criar o arquivo, confirme que não existe uma configuração local a preservar:

```powershell
Test-Path apps/web/.env.local
```

Somente se retornar `False`:

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
code apps/web/.env.local
```

Preencha privadamente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com a configuração do projeto existente. Os exemplos versionados têm valores vazios. Não use chave service-role, senha de banco ou chave privada na aplicação browser. Não cole valores no chat, no Git ou em relatórios. `DATABASE_URL` não é necessária para compilar a aplicação; não executar migrations ou alterar Supabase para configurar o notebook.

```powershell
git check-ignore apps/web/.env.local
```

O comando deve mostrar o arquivo como ignorado. O build sem ambiente privado foi validado; login e sincronização online dependem da configuração privada e do serviço existente. Saves exclusivos do navegador antigo exigem transferência própria autorizada, fora do Git; não foram enviados.

## Restaurar cópias offline opcionais

Os originais públicos/fontes, bakes, manifests e recibos estão versionados. A TASK-0061 deixou 68 cópias idênticas ignoradas para evitar duplicação desnecessária. Para reconstruir esses caminhos em labs históricos:

```powershell
node scripts/restore-offline-copies.mjs
node scripts/restore-offline-copies.mjs --restore
```

O primeiro comando apenas verifica. O segundo valida os hashes de todos os originais e destinos existentes, cria somente cópias ausentes e não sobrescreve arquivos. Não gera arte nem aprova candidatos. Outras capturas, caches e vistas mecânicas antigas podem precisar ser regeneradas pelos scripts da respectiva tarefa; não são originais únicos exigidos pelo runtime. Evidências temporárias antigas não são backupadas pelo Git.

## Executar e verificar

```powershell
npm run build
npm run lint
npm run typecheck
npm test
npm run dev
```

Acesse `http://127.0.0.1:3000`. Para testes E2E, a configuração atual exige Microsoft Edge instalado e build prévio:

```powershell
npm run test:e2e
```

Não confunda build local com deploy. Nenhum comando de banco ou deploy é necessário para esta instalação. A auditoria TASK-0060 validou build e 54HD em snapshot sem `.env.local`, reutilizando dependências locais; instalação limpa ainda deve ser confirmada no notebook. Gates visuais/online pendentes das outras tarefas continuam pendentes.

## Configurar o Codex

Instale manualmente a interface Codex escolhida conforme a [documentação oficial OpenAI](https://learn.chatgpt.com/docs/quickstart). No aplicativo desktop, entre com sua conta, selecione a pasta clonada e abra uma conversa Codex. Essa sequência está descrita no quickstart oficial. Windows pode usar PowerShell nativo e sandbox; siga o [guia oficial de Windows](https://learn.chatgpt.com/docs/windows/windows-sandbox) para a configuração disponível na instalação.

Se preferir a extensão no VS Code, siga o link Codex IDE extension no quickstart. Se já tiver o CLI instalado, estes comandos foram confirmados pelo `codex --help` local:

```powershell
codex --help
codex login
codex -C .
```

Não copie `auth.json`, credenciais, tokens ou o diretório privado `.codex` inteiro da máquina antiga. Autentique novamente; reconecte plugins somente quando necessários e autorizados. As instruções do projeto estão em `AGENTS.md`, `.agent/GLOBAL_CONTEXT.md` e `.agent/memory/CURRENT_STATE.md`. Peça ao Codex para lê-las, identificar a tarefa e preservar os gates humanos de assets. Não habilite bypass de permissões como configuração padrão.

## Fluxo entre os computadores

Antes de trabalhar, com a árvore limpa:

```powershell
git status --short --branch
git pull --ff-only origin main
```

Se houver mudanças locais, preserve-as em commit revisado antes de puxar. Se o pull não puder avançar sem conciliar commits, pare e resolva o caso deliberadamente; não force/reset/rebase automaticamente.

Depois do trabalho:

```powershell
git status --short --branch
git diff
git add -- caminho/do/arquivo-auditado
git diff --cached --stat
git diff --cached --check
git diff --cached
git commit -m "Descreva a mudança"
git fetch origin
git rev-list --left-right --count HEAD...origin/main
```

Revise novos arquivos, secrets e assets antes do commit; não use `git add -f` para incluir ambientes/caches. Novos outputs em `build/` ficam ignorados até auditoria explícita. Se o segundo número da comparação for zero e houver autorização para publicar:

```powershell
git push origin main
```

Sincronize o outro computador com `git pull --ff-only` antes de continuar. Cada instalação mantém seu `.env.local` privado. Confira o hash com `git rev-parse HEAD` e compare com o commit publicado da TASK-0061.
