# GUILD-040 — elegibilidade etária de Guildas

**PARTIAL / RELEASE BLOCKED.** Continuação da PR55 a partir de `a291d81`. Não é publicação nem comprovação de aferição real.

Escopo autorizado: somente 18+ pode criar ou liderar, sem aprovação prévia de outro líder; uma criação por conta e quotas existentes preservadas. Não há exceção para célula/EBD. Revisão de privacidade formal PENDING, apesar da decisão de produto aprovada. Carlos Roberto Faustino Junior coordena o projeto; não foi apresentado parecer competente.

## Implementação local

Sétima operação candidata `20261116010001`, após os seis SQLs intactos. Guarda exige operador postgres, identidade PROD, scope e retenção; nenhum acesso remoto executado. Predicado compartilhado de liderança passa a exigir conta confirmada/ativa e atestado privado não expirado. O legado `require_creation` usa as mesmas verificações de sessão/avatar/controles de `community_actor`, sem exigir autorização de outro líder. Triggers também negam criação direta, atribuição de autoria/líder, promoção e concessão administrativa para menor/idade desconhecida. Marcador existente impede segunda criação, inclusive caminho legado, sob o lock de governança. O status antigo da interface também exige elegibilidade adulta; mensagem de indisponibilidade explica 18+ sem revelar dados pessoais.

Atestados guardam somente sujeito HMAC existente, resultado 18+, datas de validade e referência digest; sem nascimento/documento/e-mail. RLS e ACL negam anon/authenticated/service_role. Exclusão Auth elimina o atestado, sem recuperar autoridade quando `deleted_at` volta a NULL. Completar 18 exige nova verificação confiável, sem inferência por cron/aniversário. Expiração nega autoridade. Sem concessão ou preenchimento para usuários existentes.

**Limite deliberado:** tabela inicia vazia; não há emissor real integrado, endpoint de emissão, provedor aprovado ou atestado verdadeiro. Digest não prova idade. Inserções sintéticas postgres pertencem exclusivamente ao ensaio local. Portanto o mecanismo de autorização está preparado, mas identificação etária real permanece BLOCKED. Aplicar o pacote agora retiraria autoridade efetiva de líderes sem atestado: não instalar antes de resolver aferição, rollout e gates.

Novas participações sociais de menor/idade desconhecida são negadas até haver supervisão/salvaguardas implementadas. Registros antigos são preservados. Isto **não prova proteção integral** das interações antigas/chat: denúncia, bloqueio, supervisão parental, moderação, aviso/canal real de privacidade e revisão competente continuam requisitos pendentes. Nenhum chat novo foi liberado; cadastro/jogo seguro não foi alterado. Não declarar anonimização integral dos atestados ou demais registros.

## Validação e release

PostgreSQL17.12 descartável: 33 checks PASS (21 existentes de retenção/Auth, 12 grupos novos de idade); integração conjunta dos sete passos: 16 PASS, sem somar sobreposições como cenários distintos. Incluem criação/replay/segunda criação, menor/desconhecido, atribuição administrativa, participação negada, ACL/RLS, verificação após 18, expiração, suspensão, falta de sessão/avatar e exclusão Auth. Cron é fixture local; nenhuma prova hospedada de idade ou criação. Preflight: 12 PASS, mantendo `status=blocked`, `migrations=[]`; CI no novo SHA obrigatório. Falha inicial do preflight por inserção do sétimo pin não reconhecer CRLF foi corrigida sem alterar hashes anteriores. Ensaio conjunto detectou uso indevido do helper de transação dentro da transação externa da fixture; corrigido com savepoints, sem enfraquecer a comparação de dados.

QA/Security pelo autor; sem revisão independente ou jurídica. Risco de rollout e ausência de fonte etária impedem release. CI e evidências finais registrados no checkpoint de memória após execução; testes não executados não são PASS.

Próxima condição de desbloqueio: integrar um processo real e aprovado de aferição com evidência mínima e atendimento de direitos; obter revisão formal de privacidade/menores e implementar suas salvaguardas; depois homologar autenticação/criação/negação em TEST no candidato final. Não há nova solicitação de autorização rotineira de publicação. Migrations remotas, merge, ativação e deployment não executados nesta tarefa.
