# Revisão de segurança do bootstrap

TASK-0005 · 2026-09-16 · SECURITY e QA assumidos pelo mesmo autor/orquestrador. Revisão não independente, limitada ao bootstrap local.

## Resultado

Aceitável para desenvolvimento local, com os riscos residuais abaixo. Não representa aprovação de publicação, contas reais ou banco. Auditoria de produção: zero avisos conhecidos no momento da consulta. Nenhum achado alto/crítico na auditoria completa.

| Achado | Severidade / evidência | Tratamento e responsável |
| --- | --- | --- |
| Cadeia Drizzle Kit → esm-loader → core-utils → esbuild antigo | Moderada; npm audit aponta quatro pacotes afetados pela mesma vulnerabilidade GHSA-67mh-4wv8-2f99, relacionada ao servidor de desenvolvimento esbuild | Exceção local aceita pelo ORCHESTRATOR nesta tarefa: ferramenta somente dev, sem uso de serve/studio, sem script de migration/push ou banco. O Next serve a página e não usa esse servidor esbuild. Não aplicar downgrade automático para Kit 0.18.1 sugerido por audit fix --force. DEVOPS/SECURITY devem rever antes de habilitar ferramentas de banco ou distribuir o projeto. |
| ESLint 9.39.5 descontinuado upstream | Baixa, manutenção; npm emite deprecated | Última linha compatível com eslint-plugin-react 7.37.5 (até ^9.7) e jsx-a11y 6.10.2 (até ^9) instalados por eslint-config-next. ORCHESTRATOR aceita temporariamente para lint local; DEVOPS acompanha atualização conjunta antes de ampliar a aplicação. Não forçar peer dependencies nem desabilitar checks. |

Aviso esbuild: https://github.com/advisories/GHSA-67mh-4wv8-2f99. Evidência: `npm audit --json` retorna 4 moderados, 0 altos/críticos; `npm audit --omit=dev --json` retorna 0. Os avisos não foram ocultados por configuração de auditoria ou overrides incompatíveis.

## Dependências e licenças

`npm ls --depth=0` passou sem peers inválidos. Versões diretas exatas e lockfile; todos os tarballs remotos registrados apontam para registry.npmjs.org. `.npmrc` bloqueia lifecycle scripts, mantém cache local e exige compatibilidade de engines. Nenhum navegador ou software global instalado. Não foi executado gerador remoto.

Dependências diretas MIT/Apache-2.0. Todas as entradas externas do lockfile declaram licença. Transitivas incluem MIT, Apache-2.0, BSD, ISC, 0BSD, MIT-0, BlueOak-1.0.0, Python-2.0, CC0-1.0; Sharp/libvips inclui LGPL-3.0-or-later, axe-core MPL-2.0 e caniuse-lite CC-BY-4.0. Nenhum código dessas dependências foi modificado ou redistribuído nesta tarefa. Preservar licenças/avisos e revisar obrigações aplicáveis antes de futura distribuição. Isto é inventário técnico, não parecer jurídico.

## Controles verificados

- `.env` e variantes locais ignorados, inclusive em apps/web; único arquivo de ambiente criado/editado é `.env.example` com DATABASE_URL vazio.
- Inspeção de conteúdo dos arquivos não ignorados sem padrões de private key, tokens comuns ou connection strings com senha. Revisão manual do código/configuração confirma que não foram adicionados secrets/API keys/credenciais. Scan por padrões não é garantia contra qualquer segredo arbitrário preexistente.
- Nenhum dado pessoal, cookie, sessão, endpoint de autenticação ou entrada HTTP dinâmica; erros de ambiente são fixos e não refletem configuração.
- Database export principal com server-only; import não cria pool. Testes com driver mockado verificam configuração inválida antes do driver e encerramento do pool; não são testes PostgreSQL reais.
- Shared/engine sem infraestrutura; UI sem banco, protegidos por regras de importação e revisão dos imports atuais.
- Servidores locais vinculados a 127.0.0.1. Sem deploy, cloud, banco remoto, migrations, push ou commit.
- CSS e fontes locais, sem analytics, assets remotos ou código de terceiros injetado na página. NEXT_TELEMETRY_DISABLED usado durante validações do agente.

## Limites

Testes de auth, autorização, concorrência, retenção e banco real são N/A neste contrato, pois não foram implementados. Passam a gates de suas futuras tarefas. Políticas do piloto e licença portuguesa permanecem pendentes antes de cadastro/publicação. Não afirmar segurança de produção a partir deste bootstrap.
