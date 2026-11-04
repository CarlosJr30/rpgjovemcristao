# RPG-VISUAL-001 — apresentação de aventura

STATUS: ACTIVE
SCOPE: Refinar componentes existentes de cartas/editor, ArenaStage/ações, Loja e Torre; CSS e detalhes recolhíveis. Cenário/personagens/ícones/efeitos existentes. Sem referências bitmap anexadas neste pedido; seguir direção textual e não inventar ilustrações oficiais.
INVARIANTS: Sete cartas distintas/uso único; nomes/efeitos/custos/raridades/níveis; motor/IA/HP/Foco/turnos; dificuldade/progresso/recompensas; handlers econômicos/Auth/RLS/dados/QA/validade/recibos preservados. Sem SQL, migrations, novos produtos ou assets.
ACCEPTANCE: Cartas legíveis/tocáveis com símbolo e pendência de arte explícita, mão integrada, estados/regras acessíveis; Arena cinematográfica sem mudar cálculos; Loja com artes maiores e detalhes; Torre com sete andares e campeão identificados. Layout320/390/desktop/teclado/reduced-motion. CI/Preview TEST/gates e PROD conforme RELEASE_POLICY.
VALIDATION: Apenas unidades afetadas e um fluxo visual/de carta em TEST; leituras da Loja/Torre sem compras/concessões, reutilizar provas inalteradas. QA/Security/React pelo autor, sem independência.
