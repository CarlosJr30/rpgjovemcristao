# TASK-CLOUD-001 — Migração segura para GitHub

Estado de preparação: verificações locais PASS; push e conferência remota pendentes.

## Origem e conteúdo

Branch de destino: `cloud/rpg-jovem-cristao-migration`, criada a partir de `preview/task-0076e-integrated-arena`, SHA `40e843c1cf7defb661294bac0b646b09d8c4bf81`. A branch Cloud não existia localmente ou na consulta remota inicial. Não houve partida de main, reset, descarte, rebase ou forcepush.

As fontes0076/A/B/C já estavam no commit3616f49; a integração0076D e Preview integrada0076E estavam no40e843c, ambos já enviados ao GitHub. A branch Preview estava sincronizada (0 commits exclusivos de cada lado). Preserva-se também0076E: não voltar a uma versão anterior só por o pedido citar até0076D. Esta consolidação acrescenta guia de checkout isolado, contrato/relatório Cloud, memória e fechamento documental0076E que ainda estava local. Nenhuma fonte runtime foi modificada.

Presentes: motor único de cartas, UI mobile aprovada, Jornada/Arena principal e redirecionamento legado, backend econômico seguro, testes, assets, lockfile e migrations propostas. O motor antigo permanece como fonte, sem uso na navegação principal.

## SQL preservado, sem execução

| Arquivo em packages/database/migrations | Bytes locais | SHA-256 local |
| --- | ---: | --- |
| 0009_reward_security_task0076a.sql | 21264 | 0f52ca8fe1e288572eefb8c58b615fd7c0825979823bfe0e11d34b31b5548774 |
| 0010_reward_security_cutover_task0076a.sql | 4318 | 8b40e2abb6a4c0e40f55bce8ac1bbe45003b964a79e5e3b07fc48bcbe4106e34 |

Conteúdo normalizado idêntico aos blobs Git e cópias de revisão byte-idênticas aos originais. `SQL-PARA-REVISAO/` fica local por ser duplicação, não código faltante. Não há nova análise de SQL nem migration aplicada. BACKUP_ACCESS_PENDING, manutenção, backend/protocolo2 e aprovação de implantação0076A continuam vigentes.

## Segurança e exclusões

Inventário inicial: **2569 arquivos versionados**, nenhum caminho de credencial/backup/node_modules/arquivo temporário suspeito e maior arquivo abaixo de4MB. Revisão por padrões e caminhos de1420 arquivos de texto locais e117 blobs textuais dos dois commits Preview além de main: zero achados de chave privada, tokens identificáveis, senha em URL PostgreSQL ou JWT service_role. Exemplos `.env.example` contêm valores vazios. Esse controle é uma revisão direcionada, não garantia absoluta contra qualquer segredo possível.

Somente uma lista explícita de documentação/memória/contratos será adicionada. Não usar `git add .`. `.env.local` não foi aberto nem enviado; caches `.npm-cache`, `.next`, node_modules, builds/runtimes, capturas, logs, recibos de testes e possíveis dados de sessão continuam privados/ignorados. Não há arquivos ignorados pendentes nas áreas de runtime/assets verificadas; nenhum arquivo importante não versionado foi identificado. Evidências antigas ignoradas não são necessárias para executar as fontes/testes; documentos descrevem seus resultados sem copiar dados privados.

## Validação

- **32 testes essenciais PASS**, zero falhas/skips: motor de cartas, isolamento Preview, falha online sem fallback e gateway econômico/protocolo.
- `npm.cmd run lint` e `npm.cmd run typecheck`: **PASS**, recibos com exit_code0.
- Build PASS e16 E2E locais +8 HTTPS da0076E reutilizados: **746 arquivos runtime/configuração/teste idênticos por hash Git normalizado** ao40e843c; nenhuma fonte alterada. Não repetir build/suíte completa nem PostgreSQL sem mudança de SQL.
- Guia [CODEX-CLOUD-WORKSPACE.md](CODEX-CLOUD-WORKSPACE.md) traz versões, npm ci, checks, ensaio Preview sem credenciais e limitações. Não foi provisionada conta/ambiente Cloud nem executado Linux; não alegar essa validação.
- QA/Security: autorrevisão, sem independência alegada.

Evidências locais privadas: `build/task-cloud-001/{inventory,security-review,essential-tests,lint-result,typecheck-result,build-reuse}.json` e logs. Scanner não imprime valores secretos.

## Publicação e verificação propostas

Commit organizado apenas de documentação aprovada e push exclusivo da branch Cloud. Conferir ref remoto e fazer clone bare descartável da branch GitHub com filtro de blobs, comparando toda a árvore (caminho, modo e hash). Ler novamente os blobs críticos da Arena/CSS/economia/SQL no clone, sem depender de origin/ref local. Após essa prova, registrar o fechamento documental em commit separado na mesma branch e conferir a ref final.

Baseline remoto: main `0df878764f26f0501959031dd4aec4a77fb9308a`; Production `dpl_CHxbJAphNzND5f8ZbFoR86fT98Yt`, aliases e proteção registrados por leitura. A integração Git pode disparar Preview automática; não há deploy manual, promoção ou alteração de domínio/Production nesta tarefa. Não abrir merge automático.

Riscos remanescentes: configuração e validação Linux/Cloud futuras, dependências de sistema/navegadores para E2E, QA física POCO X7, pendências econômicas/backup0076A. Disponibilidade das fontes no GitHub não libera uso da economia real nem implantação das migrations.
