# STORY-007M — Proteção contra descoberta dos gabaritos

Status: DONE — implementação local no commit `35e1d4cdd48aae6b89c4e86e6279fb662f500d8c`.

## Política provisória de tentativas

- Política pedagógica aprovada pelo proprietário em STORY-007P. Uma avaliação por dia e duas tentativas de quiz por conta e revisão. O feedback diário indica avanço. A cota restringe tentativas repetidas nesta fase.
- O PostgreSQL registra a cota na mesma transação que a avaliação. O reenvio diário com a mesma alternativa e o mesmo Viajante devolve o resultado registrado. No quiz, o mesmo UUID e as mesmas escolhas devolvem o recibo existente. Trocar de Viajante ou excluir um Viajante não reinicia a cota da conta.
- O quiz informa se a avaliação foi concluída com aproveitamento pleno. As pontuações parciais permanecem privadas, inclusive nas releituras e reenvios. O avanço diário continua indicando o resultado pedagógico e, com duas alternativas, a opção rejeitada permite deduzir a outra.

## Recuperação pedagógica proposta

Uma falha de transporte permite reenviar as mesmas escolhas. Após esgotar a cota, o jogador pode consultar as referências e praticar na demonstração. Uma nova avaliação oficial depende de revisão autorizada com exercícios distintos. Não há reset de cota por troca de avatar, novo UUID, tempo decorrido ou intervenção automática. A revisão e os recibos anteriores permanecem preservados.

Risco residual aceito pelo proprietário para esta fase. Contas distintas e conhecimento prévio continuam permitindo inferências. Não há aprovação para aplicação em Supabase TEST.
