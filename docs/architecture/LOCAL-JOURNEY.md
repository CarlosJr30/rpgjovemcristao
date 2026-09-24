# Jornada local — TASK-0008

Implementação temporária autorizada para validar a experiência Home → criação do Viajante → introdução → mapa → Ato I → apresentação da fase 1.1. Não inclui narrativa jogável, Quiz, minigame, combate, XP/recompensas funcionais, banco, conta, igreja ou autenticação. Regras de produto continuam em [MVP](../game-design/MVP.md); esta página documenta somente a implementação e suas exceções locais.

## Executar e validar

Na raiz, com dependências existentes: `npm run dev` e abrir `http://127.0.0.1:3000`. Não requer `.env`, banco ou acesso externo. Caso já exista um Next dev do mesmo diretório, usar esse servidor; não iniciar outro ou encerrar processo alheio.

Produção local: `npm run build` e `npm run start`. Qualidade: `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`. E2E usa Edge instalado e servidor de produção isolado na porta **3108**, preservando dev em 3000; precisa de build prévio e encerra seu próprio servidor. Nenhuma dependência nova.

## Rotas

| Rota | Experiência |
| --- | --- |
| `/` | Home; CTA decide entre criar e abrir mapa após carregar storage |
| `/journey/create` | Nome e aparência; personagem existente oferece continuar sem sobrescrever |
| `/journey/intro` | Boas-vindas e confirmação do primeiro passo |
| `/journey` | Oito atos no mapa/caminho, alternativa em lista; somente Ato I navegável |
| `/journey/acts/as-origens` | Fase 1.1 disponível e futuro sem conteúdo definido |
| `/journey/phases/o-jardim-e-a-escolha` | Apresentação, Gênesis 2–3 e elementos conceituais futuros |
| `/journey/phases/o-jardim-e-a-escolha/preview` | Placeholder explícito após Começar fase, retorno ao mapa |

Rotas de jornada sem Viajante válido redirecionam à criação. Guarda cliente é navegação do protótipo, não autenticação/autorização. Atos bloqueados não têm links nem rotas implementadas.

## Estrutura e fronteiras

`apps/web/app` contém páginas finas. `apps/web/features/journey` concentra o módulo de onboarding separado em:

- `domain/traveler.ts`: tipos, validação e criação puras, sem React/storage/rede.
- `data/campaign.ts`: catálogo editorial mínimo e rotas; atos/fase separados do progresso individual. Novos contratos de quiz, missões, requisitos, desafio e Codex serão adicionados apenas quando especificados, sem campos fictícios antecipados.
- `persistence/journey-storage.ts`: interface JourneyRepository e adapter local; único acesso ao localStorage de produção. `load/save/clear` isolam falhas de API/quota.
- `state/use-journey.ts`: sincronização React com snapshot SSR estável, assinatura de storage/foco e comandos de onboarding; não concede economia.
- `components`: Shell/HUD/guarda, avatar e cenário; `screens`: composição de cada tela; `journey.module.css`: identidade responsiva.

Reutiliza `@rpg/ui` (Button) e `@rpg/shared` (nome do jogo). Engine/database permanecem preservados. A modularidade interna mantém o deploy Next existente, sem microserviços e sem concentrar domínio, UI e storage em um componente. Migração futura troca o adapter e os casos de uso apropriados; **nunca importar XP/posse local como estado confiável de servidor**.

## Estado temporário

Chave versionada `rpg-jovem-cristao:journey:v1`; envelope atual versão 2 e Viajante com UUID local, apelido, nível, XP, moedas, atributos-base, inventário, slots equipados, aparência, progresso e data ISO. `BASE_ATTRIBUTES` usa **1 para Vida, Força, Defesa e Sabedoria**. Totais são derivados por `data/attributes.ts` e não entram no save. Saves antigos com `vigor/dexterity/perception/wisdom` e itens sem `stats` são migrados para a estrutura vigente sem apagar progresso.

Cabelo, roupa e tom de pele têm três opções cada (27 combinações); cosméticos independem de atributos. Modelo usa IDs permitidos extensíveis. Progresso limita-se à introdução concluída e referência à fase inicial, sem marcar fase concluída ou atribuir recompensa. Home com Viajante abre mapa, inclusive se a introdução tiver sido interrompida; introdução continua acessível pela rota.

Persistência por origem e navegador/dispositivo: `localhost` e `127.0.0.1`, ou portas diferentes, não compartilham Viajante. Um Viajante por origem, sem conta. Não há sincronização externa, backup ou garantia de concorrência transacional entre abas. Evento storage atualiza abas abertas; criação revalida existência antes de gravar. Alteração manual continua possível, portanto este estado não serve como autoridade antifraude.

Leitura limita tamanho, exige versão e campos esperados, valida nome, UUID, data, cosméticos, atributos e progresso. JSON inválido/adulterado não derruba UI nem é apagado automaticamente; a criação avisa que substituirá registro inválido. Storage bloqueado e quota excedida geram mensagens, sem navegação de sucesso ou falsa promessa de salvamento. Nome é texto React, nunca HTML; 2–24 caracteres após trim, letras Unicode e separadores simples. Sem e-mail, senha, igreja, tokens, credenciais ou relatos pessoais.

## Reset de desenvolvimento

Sem botão destrutivo na jornada. No DevTools do navegador usado para testar, na origem correta, abrir **Application → Local Storage**, selecionar **somente** a chave `rpg-jovem-cristao:journey:v1` e excluí-la. Recarregar a página: Iniciar Jornada volta à criação. Isso remove permanentemente apenas o Viajante desse protótipo. Não usar Clear site data/localStorage.clear, que podem apagar outros dados. O adapter também fornece `clear()` para ferramentas/testes de desenvolvimento, sem exposição na UI normal.

## Arte, conteúdo e acessibilidade

SVG/CSS originais locais: cenário decorativo de montanhas/caminho, avatar em grade pixelada e ícone. Fontes de sistema; sem fontes/assets/scripts externos, downloads ou arte protegida de terceiros. Arte provisória classificada FICTIONAL, não reconstrução do Éden. Textos de onboarding são convites de interface fornecidos/adaptados do pedido, não versículos. Referência Gênesis 2–3 identifica o conteúdo futuro; nenhuma cena ou interpretação canônica foi implementada.

Desktop com mapa espacial, mobile com caminho vertical; mesma lista semântica e alternativa em lista. Links para navegação, botões para ações, radio groups nativos, labels, erros anunciados, foco visível e link de salto; decoração escondida de leitores de tela. Reduced-motion remove transição de introdução. Contraste revisado com axe-core já disponível no ambiente, sem instalação; não equivale a certificação de acessibilidade completa ou teste com todas as tecnologias assistivas.

## Limites e evidências

Persistência local e ausência de autenticação são exceções do pedido desta tarefa aos contratos futuros de servidor/autosave, não alteração da arquitetura definitiva. Economia, licenças bíblicas, público/privacidade e autenticação seguem gates próprios. Não há conteúdo bíblico completo nem implementação de fase, Quiz ou minigame.

Evidências e matriz de aceite no [contrato TASK-0008](../../tasks/completed/TASK-0008-local-journey.md). Screenshots gerados localmente em `test-results` durante E2E; são artefatos descartáveis, sem dados reais. Revisões do mesmo executor, sem independência.
