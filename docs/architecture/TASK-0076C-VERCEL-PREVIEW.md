# TASK-0076C — Arena isolada no Vercel Preview

Estado pré-publicação: LOCAL_VALIDATED / PREVIEW_DEPLOYMENT_PENDING. Branch `preview/task-0076c-arena-mobile`; main permanece em `0df878764f26f0501959031dd4aec4a77fb9308a`.

## Isolamento

Rota `/arena-demo`, Viajante e treinadores fictícios, combate somente em memória; não importa portas econômicas, autenticação, repositórios ou storage. Recarregar perde a batalha. A decisão é do servidor: `VERCEL_ENV=preview` (exposição automática confirmada no projeto); `RPG_ARENA_DEMO=1` serve somente para ensaio local fora de Production. O layout Preview não renderiza nem carrega a fronteira cliente AuthProvider. Proxy nega métodos persistentes e `/api/*`, redireciona demais rotas para a demo e restringe conexões do navegador à própria origem por CSP. Em Production a decisão retorna false, mantendo o jogo normal. Sem nova credencial, migração, mudança de RLS ou acesso a jogadores.

Quatro funções de apresentação foram extraídas sem mudança de seus corpos (prova AST): TrainingArt, Fighter, CardFace e CardPreview. CSS mobile e seus keyframes da 0076B continuam idênticos. Engine, recompensas e protocolo econômico não mudaram. Um erro preexistente de typecheck no teste reward-contracts.postgres.test.ts foi resolvido explicitando apenas o tipo do JSON retornado, sem alterar execução do teste ou SQL.

## Verificações locais

- Build produção PASS com gates existentes de áudio/54 HD/Body-Fit e tipos da aplicação.
- `npm run lint` PASS (repositório), `npm run typecheck` PASS (workspaces e raiz).
- Cinco testes de isolamento do servidor PASS.
- Doze E2E direcionados PASS, sem retries: Chromium/Edge e WebKit, 406×904/904×406/320×568 CSS px, toque nas cinco cartas, jogar/energia/turno/rotação, reload sem persistência e diálogos de vitória/derrota.
- Armadilhas de escrita de localStorage/sessionStorage/IndexedDB detectam qualquer tentativa; snapshot sintético permanece intacto. Rede externa abortada e zero tentativas exigido. APIs econômicas retornam 403 antes dos handlers.
- Rework comprovado: importação desnecessária de SDK fazia sondagem de storage; resolvida movendo a seleção de Providers ao servidor. Composição inicial ocultava Energia pela regra do último span; corrigida preservando a linha de Foco da apresentação original.

Evidências locais: `build/task-0076c-vercel-preview/` (ignorado). Autorrevisão Frontend/DevOps/QA/Security, sem alegação de independência. Não repetidas as auditorias 0076A nem a suíte inteira do jogo.

## Publicação autorizada e recuperação

Projeto `prj_mG2ZSDaSc5i2Pz2uqKSlCzSGiVmG`, equipe `carlos-junior-s-projects`, raiz `apps/web`, GitHub `CarlosJr30/rpgjovemcristao`, branch Production `main`; todos confirmados por leitura na CLI. Preferir push exclusivo da branch de Preview pela integração Git já configurada. Não fazer merge/promoção, não alterar domínio, variáveis ou proteção. O diagnóstico `deploy --dry` mostrou caches/artefatos no upload direto do workspace; esse upload NÃO será usado. Somente arquivos Git revisados entram no commit; cópias SQL-PARA-REVISAO e diretórios ignorados ficam locais.

Se a Preview falhar ou o isolamento não puder ser comprovado, não liberar READY; corrigir somente a Preview ou registrar BLOCKED. Não recuperar promovendo versão, migrando banco ou desativando proteção. Cancelamento/remoção da Preview pode ser feito posteriormente pelo proprietário; Production fica intacta.

## POCO X7

Abrir a URL HTTPS exata entregue após READY; a proteção Vercel permanece ativa, portanto pode exigir login Vercel do proprietário. Não há login no jogo. Iniciar demonstração, tocar nas cinco cartas, jogar e encerrar turno, girar o aparelho; abrir Cenários de validação visual para ensaiar vitória/derrota. Conferir câmera/gestos/barras do navegador, leitura e ergonomia. Recarregar deve voltar ao início sem ganhos/salvamento. Validação física permanece a cargo do usuário.

A evidência final de URL, deployment, commit, READY e comparação de Production será anexada somente depois da verificação HTTPS.
