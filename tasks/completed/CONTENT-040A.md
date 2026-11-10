# CONTENT-040A — planejamento das 40 cartas

STATUS: DONE para planejamento entregue; aprovação de fichas/implementação continua pendente.
OBJECTIVE: inventariar sete cartas oficiais e propor 33 fichas numéricas para revisão do proprietário.
SCOPE: docs/architecture/RPG-CONTENT-040A-CARDS.md e registro documental da tarefa/memória, em branch docs/content-040a.
PROFILE: Game Designer; escopo documental em docs/architecture expressamente autorizado pelo pedido, além do diretório padrão do perfil.
BASE: origin/main 6c7b0c9fe08eb6cb991eba231acf344a764a10dd; Mochila publicada preservada.
OUT_OF_SCOPE: runtime, SQL, imagens, concessões, testes de batalha/economia, Preview e publicação.
ACCEPTANCE: 40 IDs únicos; sete oficiais intactas; 33 fichas com números, duração, custos, nível, restrições, equipamento e arte; distribuição 10/10/9/7/4; riscos e dependências explícitos.
VALIDATION: revisão documental pelo autor; contagem/IDs/distribuição e cálculos aritméticos locais. Build/lint/unit/CI/browser N/A: somente documentação, sem PR nesta etapa. Security: revisão do diff, nenhuma credencial/dado pessoal ou mudança operacional. Conteúdo novo FICTIONAL, sem alegação bíblica.
BACKUP: referência remota origin/backup/arena-visual-006-aprovada-2026-11-07 preservada; confirmar hash ao concluir.
RESULT: documento com sete oficiais e 33 novas fichas; revisão aritmética confirmou IDs únicos, categorias9/8/8/8 e novas raridades3/10/9/7/4, fechando40. Conferência inicial encontrou uma distribuição9incomuns/10raras; Guarda Reforçada foi reclassificada para incomum antes do aceite documental. Números do comparativo recalculados com Math.round.
LIMITS: Python indisponível; conferência executada com Node24 existente, sem instalar dependências. Não houve simulação, testes runtime, CI ou homologação econômica. Revisão estrutural/segurança pelo autor, sem independência. Backup confirmado cdd4dcf06319e9cdadccdd818c78caaa7e96014b.

FINAL_BALANCE_REVIEW: owner requested targeted document revision. Updated guard roles, four small heals without changing shared20%/24 or individual caps, initiative utility for Breathe, and recommendation for Double Charge as two visual movements over one attack. Four legendary roles reviewed; dependencies and before/after table appended. Node arithmetic and identity comparison PASS: seven official entries byte-identical,33 IDs, rarity distribution unchanged; no runtime tests/build/CI applicable. Final owner approval pending.
