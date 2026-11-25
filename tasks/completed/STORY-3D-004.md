# STORY-3D-004 — Entrada direta na Criação 3D

Status: DONE

- Base: `8acd124232d57370ab45494adda70a4274599110` na branch `codex/story-3d-002r-sanctuary`.
- Escopo: rota de seleção da história Criação, estado inicial do `CreationExplorerView`, saída para `/journey`, fluxo de Harmonia no Dia 7 e remoção dos módulos exclusivos do Santuário sem consumidores.
- Fora de escopo: RPC, autorização, persistência, gabaritos, tentativas, economia, conteúdo oficial, Supabase remoto, produção e deployment.
- Segurança: Dia inicial remoto deriva exclusivamente de `remote.initial.completedDays`; demonstração sem checkpoint disponível inicia sempre no Dia 1 e não trata `canonicalSteps` como confirmação.
- Aceite: seleção da Criação redireciona diretamente à exploração; Dia 1 ou primeiro dia incompleto confirmado abre sem Santuário; progresso 7/7 abre Dia 7 sem nova tentativa diária e permite Harmonia; navegação de retorno/Diário acessível; fallback sem WebGL 2 preservado; Dia 1 Premium inalterado.
- Testes: Vitest direcionado da jornada; navegador desktop/mobile com screenshot/fluxo se o runtime local permitir; TypeScript, ESLint direcionado, build e `git diff --check`.
- Deployment TEST requer autorização específica posterior.
