# STORY-QUIZ-002 — Estado oficial das tentativas da Criação

ID: STORY-QUIZ-002
TITLE: Restaurar o estado oficial da avaliação do dia
OBJECTIVE: Mostrar a cota da avaliação conforme o servidor, inclusive em nova sessão.
PRIORITY: P1 High
STATUS: DONE (local)
SCOPE: RPC de leitura existente, proposta local de migration, adaptador, interface de avaliação e testes direcionados.
OUT_OF_SCOPE: Alterar cotas, gabaritos, cenas, demais sistemas, dados reais, migrations anteriores, push e deploy.
DEPENDENCIES: STORY-QUIZ-001 (`fe204fb`), STORY-3D-006 e STORY-007C.
ASSIGNED_AGENT: Frontend e Backend, com QA e Security pelo implementador.
REQUIRED_CONTEXT: Contrato de avaliação STORY-007M e autorização das RPCs da Criação.
SECURITY_CONSIDERATIONS: Derivar a conta de auth.uid(), reutilizar as guardas de Viajante e expor apenas números de dias na revisão corrente.
ACCEPTANCE_CRITERIA:
- Tentativa consumida reaparece bloqueada em qualquer sessão da conta, sem autorizar avanço.
- Apenas checkpoint confirmado libera o próximo dia. Exploração permanece disponível se a leitura falhar.
TEST_PLAN:
- Vitest direcionado, PostgreSQL efêmero, ESLint, TypeScript e build.
DEFINITION_OF_DONE:
- Evidências locais e ordem de implantação documentadas.

## Contrato de leitura

`read_creation_checkpoints(uuid)` mantém a assinatura e acrescenta `consumedDays`, lista de números de dias consumidos pela conta autenticada na revisão publicada. `completedDays` continua a identificar recibos do Viajante ativo. O primeiro dia sem recibo é o próximo dia da sequência. Só há avaliação nesse dia quando a lista de tentativas é conhecida e o dia não consta nela. Os limites de `submit_creation_day` e do quiz são os mesmos da STORY-QUIZ-001.

A migration pressupõe a RPC da STORY-007C instalada. A substituição mantém proprietário e privilégios existentes, exige a guarda de sessão e Viajante ativo e lê a cota com `auth.uid()`. A resposta acrescenta somente números de dias. As tabelas privadas continuam sem acesso direto pela Data API.

## Publicação futura em TEST

1. Verificar se o TEST já tem a RPC da STORY-007C e seus privilégios esperados.
2. Com autorização específica, aplicar somente `20261127190000_story_quiz_002_creation_attempt_state.sql` e confirmar que a RPC retorna `consumedDays` com uma sessão TEST autorizada.
3. Publicar o frontend TEST e verificar recarga, novo dispositivo e troca de Viajante com contas autorizadas.

O frontend anterior ignora o campo adicional. Com o frontend novo e um backend antigo, a avaliação diária fica indisponível enquanto a exploração continua. Uma nova revisão publicada exige carregar seu manifesto e seu estado oficial antes de voltar a avaliar. Nenhuma publicação hospedada faz parte do aceite local.

## Validação local

- PASS — 33 testes Vitest do explorador e adaptador. Cobrem recarga, sessão sem armazenamento anterior, troca de Viajante, bloqueio recebido e recuperação de falha de leitura.
- PASS — 12 testes PostgreSQL em cluster efêmero no loopback. A migration foi executada duas vezes. Foram verificados os privilégios preservados, o isolamento entre contas, as cotas, a nova revisão e a projeção pública sem gabarito.
- PASS — ESLint direcionado, TypeScript, build e revisão do diff.
- QA e Security executados pelo implementador. Sem novos grants ou credenciais na entrega. A confirmação hospedada aguarda publicação TEST autorizada.
