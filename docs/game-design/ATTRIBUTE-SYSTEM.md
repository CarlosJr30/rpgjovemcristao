# Sistema de atributos

## Regra

Os quatro atributos são mecânicas fictícias do RPG:

- **Vida:** resistência em sistemas apropriados.
- **Força:** capacidade ofensiva em mecânicas futuras.
- **Defesa:** proteção e redução em desafios apropriados.
- **Sabedoria:** pode liberar dicas, percepção ou opções adicionais em puzzles; nunca resolve a atividade automaticamente e não representa a sabedoria espiritual real do jogador.

O total é sempre derivado:

`base + equipamentos equipados + progressão configurada + efeitos temporários = total`

Somente os atributos-base, inventário, slots equipados e progresso são persistidos. O total não é salvo. Isso faz troca e remoção substituírem o bônus do slot sem acumulação.

## Balanceamento inicial

| Item | Raridade | Bônus de gameplay |
| --- | --- | --- |
| Botas do Viajante | Comum | +1 Vida |
| Espada do Caminho | Comum | +2 Força |
| Elmo do Viajante | Raro | +1 Defesa |
| Couraça do Viajante | Incomum | +1 Vida, +1 Defesa |
| Escudo da Perseverança | Raro | +1 Vida, +2 Defesa |
| Medalhão do Caminho | Raro | +2 Sabedoria |

Esses valores são iniciais e ficam na definição individual de cada item. Slots não determinam atributos. Raridade pode orientar orçamento futuro, mas não aplica multiplicador automático nem garante uma combinação específica.

## Progressão e efeitos temporários

`LEVEL_ATTRIBUTE_BONUSES` está centralizado e vazio até existir balanceamento aprovado. Talentos ou pontos futuros devem entrar nessa fonte sem modificar os atributos-base. Efeitos temporários são passados ao cálculo em tempo de execução e não são persistidos por padrão.

## Integridade bíblica

Referências bíblicas permanecem como inspiração temática. Bônus são regras fictícias de gameplay e não afirmam aumentar fé, maturidade ou espiritualidade reais.
