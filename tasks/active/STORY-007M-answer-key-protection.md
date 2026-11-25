# STORY-007M — Proteção contra descoberta dos gabaritos

Status: VALIDATING. Base `b4dc536418aa21c03c62fd680c93fa81763adeb9`.

## Política provisória de tentativas

- Uma avaliação por dia e duas tentativas de quiz por conta e revisão. A cota diária única impede testar as duas alternativas na mesma conta. Duas tentativas de quiz permitem uma segunda avaliação sem expor pontuações parciais. Os valores e a política dependem de aprovação do responsável pedagógico antes de qualquer uso remoto.
- O PostgreSQL registra a cota na mesma transação que a avaliação. O reenvio diário com a mesma alternativa e o mesmo Viajante devolve o resultado registrado. No quiz, o mesmo UUID e as mesmas escolhas devolvem o recibo existente. Trocar de Viajante ou excluir um Viajante não reinicia a cota da conta.
- O quiz informa se a avaliação foi concluída com aproveitamento pleno. As pontuações parciais permanecem privadas, inclusive nas releituras e reenvios. O avanço diário continua indicando o resultado pedagógico e, com duas alternativas, a opção rejeitada permite deduzir a outra.

## Recuperação pedagógica proposta

Uma falha de transporte permite reenviar as mesmas escolhas. Após esgotar a cota, o jogador pode consultar as referências e praticar na demonstração. Uma nova avaliação oficial depende de revisão autorizada com exercícios distintos. Não há reset de cota por troca de avatar, novo UUID, tempo decorrido ou intervenção automática. A revisão e os recibos anteriores permanecem preservados.

A cota limita repetição por conta. A criação de contas distintas, o conhecimento do conteúdo bíblico e materiais anteriores continuam permitindo inferências. A revisão final deve avaliar esses riscos e o impacto da cota diária na recuperação antes de qualquer autorização para TEST.
