# RPG-ECONOMY-FIX-012 — acesso econômico geral

10/11/2026. **Auditoria PROD somente por leitura; correção local em validação, sem escrita remota.** Branch própria `codex/rpg-economy-fix-012`, base publicada `4d5a64e`. A expansão já está na base; nenhuma branch de expansão ou aquisição foi integrada nesta correção. Backup Arena remoto `cdd4dcf` preservado.

| Estado observado | Avatares | Diagnóstico |
| --- | ---: | --- |
| Base administrativa aprovada anteriormente | 1 | Teste Chat A tem recibo e marcador próprios da FIX-010; não ampliados nem alterados. |
| Criados pela autoridade atual, já verificados | 4 | Carteiras zero e histórico vazio; inicialização nova funciona. Três estavam ativos. Saldo insuficiente não é bloqueio de proveniência. |
| Legados com marcador ausente | 19 | Oito ativos, em oito contas. A UI ocultava toda a Loja para esses estados. |
| Legados com estado inicial intocado comprovado | 8 dos 19 | Carteira zero intocada, XP zero/nível 1, atributos iniciais intocados, somente as botas da criação original com timestamp correspondente; nenhum recibo, baú, progresso econômico, suspensão ou histórico QA nas fontes consultadas. |
| Demais legados | 11 dos 19 | Oito com saldo/itens/histórico e três com saldo zero, mas progresso ou atributos atualizados. Continuam exigindo revisão; zero não prova ausência de histórico. |

**Causa:** `QAShopAccess` condicionava a própria vitrine a `enabled && balanceVerified`. O servidor mantém a trava histórica de `economic_verified_at`; novos avatares recebem o marcador pelo trigger existente. Faltava uma inicialização individual auditada para o estado legado comprovadamente inicial. A exceção FIX-010 e o Treino QA são autoridades distintas e não foram generalizados.

**Correção preparada:** reutiliza Loja, carteira, inventário e ledger. A vitrine permanece visível durante consulta, falha ou bloqueio; somente operações autorizadas são habilitadas. A troca de treino atualiza o acesso e remonta o estado visual sem apagar intenções persistidas. O botão explícito “Ativar economia” chama uma autoridade restrita ao próprio avatar ativo/sessão confirmada: revalida o estado inicial sob locks, registra recibo imutável de valor zero e só então grava o marcador. Não concede moedas, XP, itens, saldos QA ou fontes. A migration instala o mecanismo e **não inicializa nenhum avatar**, portanto não há UPDATE em massa.

**Validação atual:** 36 testes direcionados de interface/cliente PASS; 17 casos PG novos PASS no envelope TEST e os mesmos 17 no envelope PROD isolado, sem somar como 34 casos distintos. Incluem isolamento, concorrência, revogação durante lock, recuperação vazia, rollback e contenção. TypeScript e lint afetado PASS. Build Turbopack e gates locais de artefatos PASS; configura??o tempor?ria de resolu??o removida. CI/Preview e gates reais TEST ainda pendentes; nada publicado.

**Riscos e limites:** casos ambíguos permanecem bloqueados. SQL/fixtures isoladas não são prova de transição de um jogador hospedado. TEST tem 17 avatares já verificados, sem legado equivalente disponível; não serão alterados para fabricar histórico. Testes reais deverão registrar precisamente quais ramos puderam ser verificados. Falhas locais preservadas: faltava terminador no pacote de recuperação; fixture QA usou validade diferente das 168 horas exigidas. Corrigidas sem relaxar o contrato. Reutilização de dependências exigiu links locais para os workspaces atuais; nada instalado nem modificado nos irmãos. QA/Security pelo autor, sem revisão independente.
