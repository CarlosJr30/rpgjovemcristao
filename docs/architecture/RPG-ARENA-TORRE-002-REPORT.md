# RPG-ARENA-TORRE-002 — integração produtiva

01/11/2026. **ACTIVE, sem publicação deste incremento.** Branch própria da origin/mainc853d9b; PR26/12/18/24 e main local posterior preservadas.

Reutilizados Arena V2, IA, cartas, editor e Torre7, incluindo modo local sem settlement homologado001. Alterações: entrada no menu/telas existentes e coleção própria via get_owned_cards, com recusa de proveniênciaQA/versãoTEST, recibos inválidos e definições incompatíveis. Sem perfil50, preset, autoridade QA, migration ou alterações Auth/RLS/engine/balanceamento. Batalhas oficiais/economia seguem indisponíveis; treino local também exige sete cartas produtivas próprias.

Preflight somente leitura: PROD catálogo vazio/sem arena_qa_private/17migrations,70conjuntos capturados; TEST75conjuntos dos schemas anteriores capturados, QA preservado fora do pacote produtivo. Falta posse produtiva homologada: publicar somente navegação/consulta segura e orientação de bloqueio; não alegar Arena oficial plenamente jogável. Zero cartas/saldos modificados.

Testes diretamente afetados:70PASS/1FAIL inicial, expectativa antiga de menu; atualizado apenas o contrato aprovado Arena visível, mantendo Loja/Equipamentos bloqueados. Recheck5PASS; lint/tipos/build/protocolo/CI/Preview e gates produtivos serão registrados com seus resultados reais. Não repetida homologação geral ou Torre7; prova001 reutilizada para engine/IA/checkpoint, sem equiparar QA a posse produtiva.

Recuperação: aplicação anterior por deployment/SHA confirmado, sem rollback de banco ou apagar vínculos/dados; não há migration. Publicação somente após CI exato, Preview e checks reais de Auth/posse/negações/preservação; confirmar merge, VercelREADY/backendPROD/alias e pós-publicação. QA/Security pelo autor, sem independência; emulação não é aparelho físico. Nenhum DEPLOY_COMPLETE neste checkpoint.
