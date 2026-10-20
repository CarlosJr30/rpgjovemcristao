# TASK-0086 — Atributos e descrições objetivas

Apresentação numérica implementada localmente, derivada de regras/funções compartilhadas. Mantém **ATACAR — DEFENDER — CARTAS**, sete cartas e uso único. Catálogo homologado vazio, sem cartas de produto inventadas. Aceite integral permanece **BLOCKED** pelas dependências de catálogo/aquisição e autoridade de combate/recompensa, não resolvidas por descrições.

## 1. Branch e commit local

Branch `codex/arena-numeric-descriptions`, worktree `build/task-0086-arena-descriptions/checkout`. Base limpa `26d394aecab164f73d1ef04d017ea147cf0d3a3e`, sucessor apenas documental do runtime0085 validado `cc419c61fe5b2856d113637ccde5b707789df968`. Commit desta entrega no controle final. Sem presumir envio ao GitHub; sem push, deploy, merge, main ou operação remota.

## 2. Componentes e fórmulas auditados

Auditados index/calculadores e ArenaV2, snapshot/atributos/catálogo, cartas/editor, personagem/equipamentos/Mochila/Coleção, comparação e feedback/histórico. Não há cura implementada na ArenaV2; Vida descreve HP máximo, não recuperação. Descrições de laboratórios/engine legada não substituem as regras da ArenaV2 do produto.

| Etapa real | Cálculo preservado |
| --- | --- |
| Normalização | Atributo e poder de cada item finitos limitados a0–999; não finito→0 |
| HP máximo | round(20+6×Vida) |
| Parcela ofensiva O |3+2,2×Força+0,18×soma(poder normalizado de todos os itens equipados), incluindo itens defensivos |
| Antes da guarda | max(1, round((O−1,15×Defesa do alvo)×multiplicadores)) |
| Defesa básica / Guarda |×0,5 /×0,25 no dano já arredondado, com ceil e piso1 |
| Armadura sob guarda |×0,85 adicional depois da etapa anterior, com outro ceil/piso1; sem esse efeito fora de guarda |
| Dano aplicado | Esquiva→0; caso contrário limitado ao HP restante do alvo. Percentuais nominais não garantem redução percentual exata após piso/arredondamentos |
| Iniciativa |2×Sabedoria+1se elmo+variação determinística; sem revelar seed ou escolha futura da IA |
| Discernimento | min(1,55;1,18+0,035×Sabedoria+0,15se reforço do amuleto disponível) |

Constantes antes literais (limite999, iniciativa2/elmo1, amuleto0,15 e teto de potência1,25) agora têm nomes compartilhados com apresentação. Não se alterou nenhum valor, ordem, probabilidade, arredondamento, custo, nível, uso, IA ou recompensa. `math-audit.json` prova index idêntico após reversão exata dessas extrações/exports e corpo do resolvedor idêntico após substituir nomes pelos literais originais. Testes exercitam cálculos reais e regressões de IA/batalha.

## 3. Descrições atualizadas

`arena-descriptions.ts` fornece contratos tipados e funções puras: ação/carta, efeito de equipamento, papéis dos atributos, regra de dano, parcela ofensiva e texto de evento confirmado. UI recebe números e textos derivados; não copia constantes de balanceamento para JSX. Formatação pt-BR evita artefatos como1,7999999999999998; não altera o cálculo.

Cartas mostram nome, tipo/raridade recebidos do snapshot, efeito principal, explicação consultável, duração, Foco real com descontos, nível, usos disponíveis, estado e motivo impeditivo. Editor usa custo base explicitamente rotulado; custo da batalha usa modificadores congelados. Não imprime intervalo de dano estimado nem promete dano futuro definitivo.

| Especial existente | Descrição objetiva |
| --- | --- |
| Golpe do Caminho |×1,45 sobre parcela ofensiva menos Defesa antes do arredondamento, potência do snapshot normalizada, reforços condicionais; não é percentual do HP |
| Guarda Perseverante | Próximo dano não esquivado×0,25 no lugar×0,5, ceil/piso1, guarda preparada antes da iniciativa; não dura número fixo de turnos |
| Discernimento | Fórmula/teto acima e multiplicador dinâmico próprio; vantagem para próximo ataque executado, substitui anterior, não acumula; intenção provável só após o uso permitido |
| Passo do Peregrino | Um golpe evitado, dano0, até receber esse golpe; sem chance, cura ou acúmulo; prioridade sobre uso das botas |

Básicos geram **até**1Foco com teto3. Atacar só gera se for executado; cair antes de agir não gera. Uma carta aceita continua consumida mesmo se seu ator cair antes de executar o ataque. Carta não usada após encerrar tem0usos disponíveis naquela batalha, sem ser marcada USADA.

## 4. Atributos e equipamentos exibidos

Base atual de atributos1por campo e progressão de bônus vazia preservadas. Os bônus de equipamento são somados por calculateTotalAttributes; o motor normaliza os totais. Personagem explica HP/parcela ofensiva/papéis dos atributos; gerenciador, Mochila e Coleção descoberta expõem detalhe numérico por item. Não altera narrativa bíblica, arte, overlays ou concessões. Raridade é exibida como salva, sem novo significado econômico.

| Item existente | Raridade; poder; atributos | Efeito Arena efetivo |
| --- | --- | --- |
| Espada do Caminho | comum;1; Força+2 | Poder contribui0,18à parcela ofensiva; Força contribui conforme total/cap. Reforço×1,28 do Golpe uma vez. Separadamente×1,2no ataque imediatamente após Defender, sem consumir o reforço |
| Escudo da Perseverança | raro;3; Vida+1/Defesa+2 | Poder contribui0,54; atributos afetam HP/Defesa. Registra um reforço ao usar Guarda, sem redução adicional além da Guarda |
| Couraça do Viajante | incomum;2; Vida+1/Defesa+1 | Poder contribui0,36; armadura×0,85somente sob guarda, passiva sem consumo |
| Botas do Viajante | comum;1; Vida+1 | Poder contribui0,18; evita1golpe quando vida projetada após ele≤35%do HP máximo; sem chance. Mobilidade preparada evita antes e preserva botas |
| Medalhão do Caminho | raro;2; Sabedoria+2 | Poder contribui0,36; reforça Discernimento em+0,15ao multiplicador antes do teto1,55, podendo ganhar0no teto;2usos/cooldown2rodadas, não gera recurso Foco |
| Elmo do Viajante | raro;2; Defesa+1 | Poder contribui0,36; iniciativa+1em cada rodada, passivo |

Vida+1normalmente corresponde a+6HP máximo, Força+1a+2,2na parcela ofensiva e Defesa+1à subtração de1,15antes de multiplicar/arredondar; caps e outros modificadores impedem tratar isso como dano final fixo. Efeitos ACTIVE são reforços automáticos acionados por carta correspondente; não há botão novo de equipamento. Painel de combate mostra condição/duração/usos/cooldown reais; passivos não aparecem como0usos esgotados.

## 5. Comparações implementadas

Comparação já usava snapshots da Arena para Poder total e atributos; foi ampliada com HP máximo, parcela ofensiva e Defesa normalizada, com atual/novo/diferença. Item ausente do inventário não simula equipar. Troca não altera dados e continua usando todos os equipamentos atuais e o slot correto. Poder total/parcela ofensiva são explicitamente distintos de dano final; efeitos condicionais ficam no detalhe de cada item, sem prometer aumento universal.

Exemplo de teste com botas equipadas e espada existente no inventário: parcela5,38→9,96, diferença+4,58; HP32→32. Os números vêm dos calculadores, não de exemplo de balanceamento novo. Tabela móvel reserva largura ao nome da métrica, com cabeçalho abreviado Dif. identificado como Diferença.

## 6. Feedback em combate

Histórico recente consultável mantém últimos8eventos do motor, com dano efetivamente aplicado já registrado. Em especial com execução confirmada, acrescenta custo real pago e Foco após a ação, conforme snapshot e log aceito. Antes de existir evento confirmado não anuncia esse gasto. Não calcula redução fictícia atribuída ao escudo ou dano antecipado como resultado; sem popup/animação nova. Apresentação/HP/áudio e checkpoint anteriores permanecem. Não foram alterados logs persistidos, replay, comando ou liquidação.

## 7. Testes e resultados

Logs em `build/task-0086-arena-descriptions/` ao lado do checkout. Resultados/capturas browser em `checkout/build/task-0086-arena-descriptions/`.

| Check | Evidência |
| --- | --- |
| Precisão nova |13PASS em2arquivos: ataque/poder/clamp/arredondamento, HP/iniciativa, defesa/armadura, escudo sem bônus extra, espada/reforço, amuleto/teto/cooldown/duração, botas/mobilidade, Foco/nível/potência e feedback; UI/cartas/usos/compare/histórico |
| Direcionados/regressões |89PASS/15arquivos, unit-final.log; inclui0084/0085, persistência, posse/gate vazio, ações/uso único, IA/lab, atributos e comparação vazia/igual/upgrade/downgrade |
| Último ajuste visual |9PASS/2arquivos, unit-ui-final.log, comparação e novos componentes |
| Browser | PASS6/0FAIL/0SKIP/retry0, e2e-final.log; Chromium1440×900/320×740 e WebKit390×844.3produto autenticado com SDK/DataAPI sintéticos: personagem com regras e catálogo vazio bloqueado;3positivos somente em harness isolado com motor/componentes/storage reais; capturas finais inspecionadas |
| Lint/tipos/build | PASS lint-final.log, typecheck-final.log e build-final.log; nove testes de UI repetidos após ajuste visual em unit-ui-final.log |
| Equivalência matemática | math-audit.json, comparação index e resolvedor com base0085; funções/valores econômicos preservados |
| Isolamento | PASS production-fixture-scan.log após build final: JS de produção sem IDs/títulos das fixtures; nenhum harness em rota Next |
| SQL/bíblico | N/A: nenhum SQL/schema/RLS/migration ou conteúdo bíblico novo |

QA e Security pelo autor, não independentes. Reworks registrados:89iniciais=85PASS/4FAIL por seletor regex antigo que passou a casar Vida e Vida máxima; tornou-se seleção do cabeçalho exato, preservando todas as comparações. E2Einicial=3PASS/3FAIL por busca ambígua de regra de Vida em vários detalhes; selector ancorado, depois6PASS. TypeScript final detectou opção `exact` de Playwright indevida no Testing Library; removida só no teste. Build falhou por esse tipo e uma tentativa browser subsequente não iniciou por BUILD_ID ausente; logs preservados, final depende de novo build/tipos e browser aprovados. Ajustes visuais justificam rebuild/recheck final; não se repetiram auditorias/dependências ou suítes extensas imutáveis.

## 8. Arquivos modificados

- Engine: novo arena-descriptions.ts/test; exports/extração de literais em index/ArenaV2 e delegação de arenaCardDescription à apresentação.
- Produto: editor/battle-actions; novos arena-rule-details TSX/CSS; comparação/CSS, aviso de nível; export do adapter equipmentSnapshot. Integração em Arena, personagem, equipamentos, Mochila e Coleção, sem recriá-los.
- Testes: novo arena-descriptions.test.tsx; seletor exato no equipment-portal.test.tsx; config Playwright e harness numérico isolado próprios.
- Documentos0086: relatório, parecer, contrato e memória de controle. Sem dependência/lockfile/asset/SQL/AuthQR/Story/EBD/economia/contratos anteriores alterados; next-env gerado restaurado antes do commit.

## 9. Diferenças/defeitos identificados

Corrigidas promessas vagas de força/defesa/armadura e confusão entre Foco de recurso e vantagem do amuleto. A guarda persiste até golpe não esquivado, não obrigatoriamente uma rodada. Ataque/Foco podem não executar se o ator cair; ganhos no teto são0. Arredondamentos/piso impedem percentuais universais; poder não é ataque fixo e todos itens contribuem.

**Pendência específica de design:** reforço ACTIVE do escudo registra uso mas não altera a proteção além da Guarda por carta. Reproduzido por teste comparando dano com/sem escudo de poder0e mesmos atributos; descrição agora informa exatamente isso. Adicionar proteção seria rebalanceamento, não autorizado. Nenhum defeito de engine foi corrigido alterando matemática. Revisão futura pode decidir efeito distinto ou remover classificação/registro sob contrato próprio.

## 10. Catálogo/backend e limites

APPROVED_ARENA_CARDS continua vazio. Catálogo/aquisição/homologação fora do escopo; nenhuma carta concedida ou equipamento convertido. Todo positivo com cartas é fixture de teste. Backend autoritativo/recibos econômicos/Auth/RLS hospedados e dispositivos reais pendentes. P1 legado de confiança em estado/recompensa locais continua aberto, com plano0085 preservado; descrições não o resolvem. Sem alegar antifraude, prêmio remoto seguro ou sincronização entre aparelhos. Bloqueio explícito de journals antigos incompatíveis permanece intacto.

## 11. Checklist e classificação

Ver [contrato0086](../../tasks/active/TASK-0086-arena-numeric-descriptions.md) e [parecer](../security/TASK-0086-ARENA-DESCRIPTIONS-SECURITY.md). Status integral BLOCKED; implementação e gates locais PASS. Trabalhos raiz/checkouts anteriores, main e contratos0078/0080–0085 preservados. Memória recebe entrada nova sem alterar os bytes anteriores. Nenhuma operação remota.

## 12. Próxima etapa

Revisar e homologar conteúdo/aquisição em tarefa própria com economia/atributos; resolver autoridade antes de habilitar cartas e prêmios reais. Decidir separadamente o reforço do escudo. Contexto07 não iniciado automaticamente; sem Torre, PvP, nova energia, animação de baú ou deploy nesta entrega.
