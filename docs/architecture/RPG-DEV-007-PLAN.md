# RPG-DEV-007 — Plano de Mochila, Coleção e Diário

> Plano inicial histórico. O pedido posterior autorizou o runtime de consulta. Estado atual, evidências e limitações no [RPG-DEV-007-REPORT.md](RPG-DEV-007-REPORT.md); [contrato ativo](../../tasks/active/RPG-DEV-007-backpack-collection-diary.md).

Preparação documental de 26/10/2026, preservada no commit 8c9c0c0. Branch `codex/rpg-dev-007-preparation`, base `origin/main` em `1a82d2c`. Nenhuma implementação, migration, abertura de rota ou publicação ocorreu na preparação inicial abaixo.

A [revisão de RPG-DEV-006](https://github.com/CarlosJr30/rpgjovemcristao/blob/61b7177b2ba52a04b955a8306677a0e13dfdeb3c/docs/architecture/RPG-DEV-006-RELEASE-REPORT.md#revisão-da-ordem-dos-gates-e-do-menor-escopo-seguro) preserva TEST e mantém a publicação de escrita de equipamentos bloqueada pela indisponibilidade de uma conferência positiva posterior autorizada em PROD. Não herdar uma suposta integração da PR #12; reconciliar o baseline antes de ativar trabalho funcional.

## Fontes mínimas e riscos observados

| Área | Fonte existente | Atenção antes de liberar |
| --- | --- | --- |
| Mochila | apps/web/features/journey/screens/backpack.tsx; app/journey/backpack/page.tsx | Tela existente inclui link da Loja, aba de baús e ChestPanel. Abrir a rota atual inteira pode expor fluxos econômicos fora do escopo. |
| Coleção | apps/web/features/journey/screens/collection.tsx; app/journey/collection/page.tsx; data/equipmentCatalog.ts | Há link para baralho de Arena e cálculo de descobertas baseado no inventário atual. Posse atual não comprova descoberta histórica. |
| Diário | apps/web/features/journey/screens/diary.tsx; app/journey/diary/page.tsx; data/diaryView.ts | A tela importa saveDiaryEntry e expõe progressão/narrativa. A projeção diaryView é somente leitura, mas a tela completa não é, por isso não basta abrir a rota. |
| Sessão e dados | apps/web/lib/supabase/online-sync.ts; features/journey/state/use-journey.ts; domain/traveler.ts | Mapear leitura realmente persistida e dados locais. Nunca substituir dado ausente do servidor por progresso inventado ou por estado de outra sessão. |
| Limites de release | apps/web/lib/release-scope.ts; navegação e shell usados pelas telas | Atualmente as três rotas não estão na allowlist. Toda ativação futura exige manter o bloqueio em página, API, navegação e chamadas indiretas. |

Os caminhos abreviados de features/data/domain acima são relativos a apps/web/features/journey. A inspeção nesta etapa não é homologação funcional nem auditoria completa dessas telas.

## Primeiro escopo proposto

- **Mochila:** listar quantidades e equipamentos já possuídos pelo viajante da sessão; estado vazio e erro explícitos. Sem abrir baús, consumir, vender, transferir, comprar, equipar ou conceder recompensas por esta tela.
- **Coleção:** apresentar o catálogo oficial existente e a posse atual comprovada. Se não houver fonte persistida de descoberta histórica, usar rótulo de posse atual; não reconstruir conquistas ou inventar datas. Nenhum link operacional de Arena ou Loja.
- **Diário:** consultar somente registros e histórico já persistidos, com tratamento claro para informação indisponível. Sem registrar respostas, marcar leituras, concluir etapas ou disparar recompensas. Revisar privacidade do texto; não renderizar HTML arbitrário. Não inventar narrativa, datas, XP, respostas, classificações bíblicas ou progresso para preencher tela vazia.
- Reutilizar componentes e artes homologados. Se não houver uma fonte autorizada para determinado bloco, mantê-lo indisponível; não ampliar permissões nem criar migration como atalho.

O escopo é uma proposta para implementação futura. Qualquer edição de Diário ou ação econômica é uma ampliação separada que requer autorização e contrato próprio.

## Sequência futura e gates

1. Reconfirmar main/produção, situação da PR #12 e baseline de dados; ativar contrato runtime somente com autorização. Atualizar a branch pelo fluxo normal, sem sobrescrever alterações ou importar recursos não aprovados.
2. Mapear cada campo às leituras existentes de servidor e às regras de dono; verificar Auth, RLS, grants e isolamento entre sessões. Identificar dados ausentes antes de escolher a interface.
3. Preparar as três projeções de consulta, removendo ações indiretas e navegação para recursos bloqueados. Preservar Herói/Equipamentos/Guilda/EBD e estados de erro/sessão; sem fallback econômico local.
4. Validar localmente comportamento, acessibilidade, sessão trocada e negações; executar lint/types/build/CI pertinentes. QA/Security não podem ser substituídos por tela vazia ou mocks quando o teste real for obrigatório.
5. Conferir Preview TEST com contas autorizadas: inventário vazio e existente, reload, propriedade e leitura do Diário. Usar dados TEST já autorizados; não reaplicar automaticamente a fixture de RPG-DEV-006, cuja autorização era específica e cuja limpeza está concluída.
6. Revisar preservação e recuperação. A proposta de consulta começa sem migration; se uma lacuna exigir schema/permissão nova, registrar bloqueio e revisar o contrato antes de seguir.
7. Após todos os gates anteriores, seguir RELEASE_POLICY: publicação normal, READY/SHA/backend/alias e conferências reais após implantação. Definir antes do deploy uma forma autorizada de executar cada conferência; não fabricar itens PROD ou usar outros jogadores para suprir cobertura.

## Matriz de aceite futura

| Verificação | Resultado esperado | Estado atual |
| --- | --- | --- |
| Leitura do dono / tentativa de usuário alheio | Somente recursos autorizados; nenhuma informação privada alheia | Planejado, não executado |
| Logout/login e troca de conta em request pendente | Sem exibir ou aplicar dados da sessão anterior | Planejado, não executado |
| Inventário existente e vazio; reload | Quantidades/posse iguais ao servidor, sem concessão ou perda | Planejado, não executado |
| Diário com e sem registros | Texto privado e persistido, ausência explícita, nenhuma escrita ou recompensa | Planejado, não executado |
| Navegação e APIs indiretas | Arena/Torre/Loja/baús/economia não homologada continuam negados | Planejado, não executado |
| Hashes e regressão | Inventários, seleção, XP, moedas, atributos e dados existentes preservados; Guilda/EBD/Auth intactos | Planejado, não executado |
| Mobile/WebKit e desktop | Conteúdo e estados consistentes, sem alegar aparelho físico a partir de emulação | Planejado, não executado |

## Recuperação e limites

Para a proposta somente leitura, a recuperação consiste em restaurar o aplicativo anterior pelo fluxo normal e revalidar as fronteiras; não há DML, nova migration ou restauração de dados prevista. A existência de saves ou eventos indiretos na tela atual deve ser resolvida antes de publicar. Qualquer necessidade de escrita muda o risco e requer plano específico.

Preparação revisada estruturalmente pelo autor: contrato, referências locais, caminhos e ausência de código/permissões alterados. A revisão não afirma aprovação de runtime ou de produção. Não instalar dependências, criar serviços, acessar credenciais ou publicar um deploy artificial para estes documentos. RPG-DEV-007 permanece BACKLOG; somente a preparação foi concluída.
