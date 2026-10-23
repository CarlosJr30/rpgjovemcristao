# CONSOLIDATION-006 — revisão de segurança

2026-10-20. Revisão pelo autor, sem independência. Diff limitado à interrupção de música anterior em contexto falho, links de navegação Arena/Torre, testes e documentos006. Nenhuma alteração de SQL, Auth, serviço de autoridade, regras/engine, aquisições, probabilidades, dependências ou mídia. Revisão React: Link estático entre rotas existentes, sem efeito/hook/estado novo; acesso continua sob Shell/RequireTraveler/Auth e as mesmas consultas/negações do servidor.

| Risco verificado | Evidência / resultado local |
| --- | --- |
| Login local / sessão inventada no produto | Browser recusa flag antiga e rota privada; auth-screen/auth-context não aceitam ausência de sessão SDK/getUser; fixture só no grafo de testes |
| Recuperação cruzada / logout | integrated006 captura filtro AuthUID e nega EBD após logout. Não comprova RLS hospedada |
| Convite sem identidade | POST real local retorna401/no-store; componente QR testado isolado; nenhuma mensagem/compartilhamento externo enviado |
| Outra Guilda / professor indevido | Browser usa papéis sintéticos e nega membro não líder; EBD exige delegação. SQL002 inalterado já ensaiou fronteiras reais offline; JWT/RLS hospedados pendentes |
| XP/moedas/posse por browser | legacy-cutover novamente nega adapters antes da rede; integrated006 verifica ausência de escrita econômica e só collection/resume/tower na API. Serviço/SQL004 preservados |
| Cartas fictícias / combate sem backend | Coleção0/7, iniciar negado e503 sem credencial,40 itens sintéticos não viram cartas. Positivos só em testes; sem nova demo route |
| Vitória/checkpoint local como prêmio | Tests de storage Torre e cliente autoritativo; nenhuma alteração de ledger/economia. 28PG004 não repetidos por ausência de mudança SQL/servidor |
| Vídeo falso / reflexão privada | Workbook rejeita eventos econômicos/oficiais, escopo/ordem; player nativo sintético só observa localmente e não emite receipt/completion. Player real continua indisponível |
| Mídia sem licença | Catálogos aprovados vazios e protótipos/assets/política intactos. Gate de build969artefatos/8hashes; zero áudio público e zero play/request no percurso com preferências ligadas |
| Navegação como bypass | Links só abrem rotas já protegidas; ambas continuam sem posse/servidor. Nenhum comando nem condição de autorização mudou |
| Falha musical mantém contexto errado | Reprodução pré-fix1FAIL; fadeMusicOut existente agora silencia destino falho sem novas tentativas. Regressões de retenção/mute/background/cleanup passam |
| Secrets / contaminação por fixtures | Scan focado de fontes alteradas,263JS de build/213arquivos públicos,44JS públicos sem nome de credencial servidor; nenhum marcador de teste encontrado. Configuração pública fixture.invalid é intencional para teste local e proíbe usar este build em deploy |
| Efeitos externos | Browser intercepta Auth/DataAPI sintéticos e aborta destinos não locais. Nenhum MCP, fetch/push/deploy/SQL remoto/dado real ou mensagem externa nesta006 |

Não foi aberta auditoria de dependências remotas nem feito pentest completo. P0/P1 de ambiente/cutover/hosted permanecem; não se declara produção segura, atualizada ou inspecionada. [Parecer004](CONSOLIDATION-004-SECURITY.md), [parecer005](CONSOLIDATION-005-SECURITY.md) e [bloqueios006](../architecture/CONSOLIDATION-006-BLOCKERS.md) conservam os limites.

WebKit inicial: quatro pageerrors de fetch `_rsc` coincidiram no trace com goto completo Arena→Torre e unload. Não foram filtrados. O percurso passou a usar Link da interface; ao exercê-lo, reproduziu-se a ausência do link autenticado, corrigida no componente. Logs/JSONs/traces das duas falhas preservados fora do outputDir substituído pelo Playwright. Falhas não foram tratadas como PASS.
