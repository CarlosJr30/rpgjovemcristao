# GUILD-041 — fase adulta / implementação bloqueada para release

Continuação da decisão `387b5f0` e da PR55. **PARTIAL/BLOCKED, não publicado.** As sete operações anteriores permanecem intactas. Operação8 candidata `20261116020001` acrescenta o controle global; manifesto/preflight passam a oito operações e continuam blocked/migrations=[].

## Decisão e limite real

O proprietário escolheu data de nascimento **apenas informada pelo jogador**. O cálculo privado distingue 18 anos completos (29/02 torna-se elegível em 01/03 num ano não bissexto), não armazena nascimento e não cria atestado. Autodeclaração não foi ratificada como prova verificável. Não há emissor real integrado, verificação das três contas, documento/biometria coletado ou parecer de privacidade. O robô de cálculo não resolve essa ausência; não conceder acesso para obter PASS.

## Implementação candidata

- Contexto Auth consulta `phase1_game_access` antes de assegurar perfil/hidratar avatares e revalida em novo evento/refresh da mesma conta. Contrato ausente, erro, resposta inválida ou negativa mantêm estado restricted e não montam jogo/TreinoQA. Saves e contas preservados. Mensagem 18+ e aviso de privacidade acessíveis; não há promessa de canal operacional já disponível.
- Signup cliente consulta contrato de enrollment, fechado enquanto inexiste aferição; hooks Auth preparados negam novos cadastros por qualquer provedor e emissão/refresh de tokens sem atestado privado. Jogador não executa esses hooks nem modifica atestados. Hooks **não configurados remotamente**; criar funções não comprova instalação no Auth.
- Pre-request PostgREST consulta atestado e sessão atual a cada chamada; somente dois contratos booleanos de acesso podem ser consultados sem elegibilidade. Nega também service-role sem identidade de jogador, portanto endpoints server-side/operacionais precisam revisão antes de rollout; não abrir exceção genérica.
- Policies adicionais RESTRICTIVE nas tabelas já protegidas por RLS, mantendo condições de ownership e ACL anteriores. RLS desativada em tabela de cliente ou outro pre-request já configurado abortam a instalação; nenhuma política anterior é reescrita. SQL instala apenas o pre-request Data API, não os hooks Auth.

## Evidência e cobertura

PostgreSQL17.12 descartável: **44 checks PASS**, 10 grupos novos fase1 e 34 de dependências idade/retenção. Incluem recusa atômica de guarda/RLS/hook conflitante, cálculo sem emitir evidência, token legado desconhecido, sessão expirada, RLS de dono, Storage/Realtime sintéticos, signup/OAuth/invite/refresh autodeclarado negado e claims adultos sintéticos preservados. Sem autenticação hospedada real. Preflight12 PASS e testes de interface/cliente direcionados; CI obrigatório no candidato final.

Somente leitura PROD confirmou tabelas de aplicação acessíveis a anon/authenticated com RLS ativa e ausência de pre-request configurado. Storage/Realtime têm componentes gerenciados; ensaio sintético **não prova** permissões de owner/instalação nesses schemas hospedados, objetos públicos, URLs assinadas, canais Realtime públicos/conexões já estabelecidas ou hooks Auth reais. Nenhum DDL remoto executado. Não alegar proteção global completa enquanto esses gates estiverem pendentes.

Fontes técnicas: [limites do pre-request e RLS](https://supabase.com/docs/guides/api/securing-your-api), [before-user-created](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook), [custom access token](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook). São contratos oficiais consultados; mocks/SQL não substituem testes hospedados.

## Privacidade e publicação

Público fase1 adulto substitui a admissão de menores da GUILD038, sem atestar idade das contas antigas. Aviso `/privacy` preparado como minuta, responsável Carlos Roberto Faustino Junior; canal real de direitos/exclusão e revisão formal seguem pendentes. Não existe formulário operacional, fundamento/parecer aprovado ou procedimento real de comprovação; não inventá-los. Risco de menores declararem data falsa permanece. Recursos de fase2 não foram ativados.

QA/Security/React pelo autor, sem independência ou aprovação jurídica. Release bloqueada por aferição verificável ausente (opção atual é somente declaração), revisão/atendimento de privacidade pendentes, configuração e cobertura real de Auth/Storage/Realtime e homologação autenticada. Nenhum SQL remoto, merge, pg_cron PROD, deployment ou ativação foi realizado. Próximo passo depende de um processo real de aferição e revisão, não de repetir a autorização rotineira de publicar.
