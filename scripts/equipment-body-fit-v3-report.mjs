import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  copyFile,
} from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url)),
  dir = path.join(root, 'build/task-0074-equipment-body-fit-v3');
const json = async (p) => JSON.parse(await readFile(path.join(dir, p), 'utf8'));
const inventory = await json('inventory.json');
const observations = {
  armor_traveler_uncommon_male_v2: [
    'Ombros/peitoral acompanham o torso; rosto, mãos e antebraços ficam livres. Cinto único legível; não observei deformação grosseira isolada. Pochete original continua visível na lateral.',
    'Revisão humana do conjunto exato. Conferir a suspensão da espada junto ao cinto e às abas antes de aceitar uma combinação.',
  ],
  armor_traveler_rare_female_v2: [
    'Gola alta próxima ao pescoço e ombreiras largas, com rosto e mãos preservados. Abas ornamentadas ocupam a cintura e parte do quadril; não foi observado corte de anatomia. Item arquivado, sem cadastro jogável.',
    'Revisar gola, volume peitoral e sobreposição das abas com espada/escudo. Mesmo eventual aprovação visual não autoriza criar este item no catálogo.',
  ],
  armor_traveler_rare_male_v2: [
    'Peitoral e cintura centrados; braços/mãos permanecem livres. Tabardo longo cobre parte das bolsas/calças originais; ombreiras mantêm a silhueta geral. Item arquivado, sem cadastro jogável.',
    'Revisar largura de ombreiras e abas na cintura. Combinações e item jogável precisam de escopo próprio; não ativar por esta inspeção.',
  ],
  shield_perseverance_rare_female_v2: [
    'Escudo sobre o antebraço à direita da imagem; escala entre cintura e coxa. Mão e punho ficam completamente ocultos. A imagem frontal não demonstra a correia ou a pega posterior: fixação visual ambígua.',
    'Prioridade P2: Carlos avaliar se a fixação parece natural. Se parecer flutuante, solicitar revisão de pose/oclusão/amarração; não deslocar ou deformar o Avatar para corrigir.',
  ],
  shield_perseverance_rare_male_v2: [
    'Escudo centrado na região do braço à direita da imagem, sem corte dos pés ou do rosto. Antebraço/mão ocultos; correias ou pega não são verificáveis na vista frontal.',
    'Prioridade P2: revisar fixação ao braço e a margem interna junto à guarda da espada. Manter inativo até decisão específica do usuário.',
  ],
  sword_path_common_female_v2: [
    'Espada embainhada no quadril, cabo para cima/ponta para baixo; lâmina duplicada não observada. Bainha com costura e duas correias junto ao cinto. Mão/antebraço à frente ficam livres.',
    'Revisar a boca da bainha e continuidade das correias em zoom. As armaduras alteram a leitura do cinto: a combinação não herda aprovação individual.',
  ],
  sword_path_common_male_v2: [
    'Bainha inclinada ao lado da coxa, ponta acima do solo e cabo para cima. Mão/antebraço preservados; sem lâmina extra observada. Suspensão ajustada ao cinto original, não a todos os cintos das armaduras.',
    'Revisão humana exata de bainha, guarda e correias. Conferir as duas combinações com armaduras e a oclusão pelo escudo.',
  ],
};
const pending = inventory.targets.filter(
  (t) => t.human === 'HUMAN_BODY_FIT_REVIEW_PENDING',
);
const visual = pending.map((t) => ({
  id: t.id,
  avatar: t.avatarId,
  avatarSha256: t.avatarSha256,
  asset: t.staging,
  sha256: t.sha256,
  sourceSha256: t.sourceSha256,
  resolution: t.resolution,
  technical: t.technical,
  human: t.human,
  productionActive: false,
  observations: observations[t.id][0],
  recommendation: observations[t.id][1],
  priority: 'P2',
  reviewer: 'Agente principal — inspeção técnica/visual, não aprovação humana',
  scope:
    'Static exact PNG composition; not animation, physical POCO or human acceptance',
  evidence: `inspection/chromium/${t.id}-390-after.png`,
}));
await writeFile(
  path.join(dir, 'visual-review.json'),
  JSON.stringify(
    {
      targets: visual,
      humanDecisionsChanged: 0,
      approvedFemalePreserved: true,
    },
    null,
    2,
  ),
);
const checks = [
  [
    'HTML offline, caminhos e imagens',
    'PASS',
    'inspection/{chromium,webkit}/results.json',
    '16 targets/18 imagens incorporadas; nenhum arquivo ausente',
    'Nenhuma',
    'P2',
  ],
  [
    'SHA/PNG/CRC/RGBA/Avatar',
    'PASS',
    'inventory.json e inspection/*/results.json',
    '16 fontes,16 bakes e54HD conferidos; PNG1024×1536 e alpha',
    'Nenhuma',
    'P1',
  ],
  [
    'Navegação e troca da referência',
    'PASS',
    'inspection/*/results.json',
    'Candidato troca para o Avatar exato masculino/feminino; variantes arbitrárias não oferecidas',
    'Não generalizar aprovação',
    'P1',
  ],
  [
    'Zoom real, corpo inteiro e acessibilidade',
    'PASS',
    'inspection/*/results.json',
    'Nome acessível ausente e enquadramento/zoom mobile corrigidos',
    'Rechecado nos11 tamanhos ×2 motores',
    'P2',
  ],
  [
    'Sobreposição estática',
    'PASS',
    'compatibility/results.json e30PNGs',
    '10 pares renderizados; ordem2/6/7 coerente, nenhum Avatar deformado',
    'A inspeção não aprova as combinações',
    'P2',
  ],
  [
    'Fixação dos escudos',
    'BLOCKED',
    'inspection/*/*shield*zoom-right-hand.png',
    'Mão/pega/correia posterior ficam ocultas; encaixe físico não demonstrável',
    'Revisão humana ou rework artístico específico',
    'P2',
  ],
  [
    'Decisões humanas dos7',
    'BLOCKED',
    'visual-review.json',
    'Nenhuma aprovação explícita nova',
    'Carlos decidir por hash/Avatar, sem herança para outros itens',
    'P1',
  ],
  [
    'Ativação dos7 em produção',
    'BLOCKED',
    'resolvedor/gate e smoke HTTP',
    'Pendentes inativos,2 armaduras sem item jogável',
    'Não ativar; não criar itens',
    'P1',
  ],
  [
    'Unitários',
    'PASS',
    'vitest run --maxWorkers=2',
    '447 testes/68 arquivos; inclui54 identidades,slots,atributos,HD/overlay inválido',
    'Duas expectativas históricas V1 atualizadas sem relaxar fallback',
    'P1',
  ],
  [
    'Portal/equipar/atributos/persistência',
    'PASS',
    'portal-acceptance.json',
    '44PASS/10skip de matriz desktop redundante;23 casos novos de provador',
    'Fluxos normais e reduced motion; saves só sintéticos locais',
    'P1',
  ],
  [
    'Arena/Jornada/Serpente',
    'PASS',
    'regressions-accepted.json',
    '80PASS/1skip exclusivamente desktop;21Portal rechecados no build final',
    'Câmera/swipe/engine preservados por SHA',
    'P1',
  ],
  [
    'Chat da Guilda (fixtures)',
    'PASS',
    'test-guild-chat-browser.mjs',
    '10checks com fixtures; fonte não modificada',
    'Não confundir com Realtime real',
    'P1',
  ],
  [
    'Chat real com2contas',
    'BLOCKED',
    'TASK-0072B',
    'Aceite real não executado nesta auditoria; nenhum dado/conversa real usado',
    'Continuar a tarefa de aceite real separadamente',
    'P1',
  ],
  [
    'Áudios/licenças e arquivos privados',
    'PASS',
    'local-smoke.json; production gate',
    '8áudios e8fontes404;51caminhos privados404; sem mudança de contratos',
    'Não inferir licença comercial/ownership exclusivo; nenhuma nova arte gerada',
    'P1',
  ],
  [
    'Performance',
    'PASS',
    'performance.json',
    '1HD carregado; CLSmobile0; CLSdesktop0.05083/0.03059 iguais ao baseline',
    'Tempos/heap/bytes DEV vsprodução não permitem alegar ganho percentual',
    'P2',
  ],
  [
    'Preservação',
    'PASS',
    'preservation-final.json',
    '54HD/16fontes/receipts/SQL/Auth/chat/saves/engine preservados',
    'Nenhuma mudança remota de segurança ou banco',
    'P1',
  ],
  [
    'POCO X7 físico',
    'BLOCKED',
    'Nenhum teste físico observado',
    'Emulação não equivale ao aparelho real',
    'Usuário testar galeria e produção',
    'P2',
  ],
];
const homeFile = path.join(dir, 'home-webkit-final.json');
let home;
try {
  home = JSON.parse(await readFile(homeFile, 'utf8'));
} catch {}
checks.splice(11, 0, [
  'Home e atributos entre telas',
  home?.stats?.unexpected === 0 && home?.stats?.expected === 5
    ? 'PASS'
    : 'BLOCKED',
  'home-attributes-verified.json + home-webkit-final.json',
  '25 casos aceitos +5 rechecagens WebKit; menu/accordion esperados e cancelamento de prefetch corrigidos no teste',
  'Sincronização do teste, sem mudança de domínio',
  'P1',
]);
await writeFile(
  path.join(dir, 'qa-summary.json'),
  JSON.stringify(
    {
      checks: checks.map(
        ([test, result, evidence, defect, recommendedFix, priority]) => ({
          test,
          result,
          evidence,
          defect,
          recommendedFix,
          priority,
        }),
      ),
      technicalCounts: inventory.counts,
      humanDecisionsChanged: 0,
      pendingProductionActivations: 0,
      physicalDevice: false,
    },
    null,
    2,
  ),
);
let md =
  '# TASK-0074 — Auditoria e Equipment Body-Fit V3\n\nEstado: REVIEW_READY; publicação de melhorias seguras aguardando confirmação de READY/SHA. Revisão de QA/Security pelo próprio autor, sem independência. Data14/10/2026. Nenhuma aprovação humana inferida.\n\n';
md +=
  '## Validação técnica\n\n16 candidatos,8FIT_PASS,1NEEDS_REWORK,7NEEDS_NEW_ART;1aprovação humana antiga válida e7pendentes. Catálogo6itens:2comuns/1incomum/3raros, sem épicos/lendários. Auditoria revalidou fontes/bakes/Avatares/metadata por SHA-256. A galeria é privada, offline e contém apenas2bases HD e16candidatos em data URLs; nenhum caminho relativo externo ou imagem ausente.\n\n';
md +=
  '## Avaliação visual individual\n\nA tabela registra inspeção estática do agente, nunca aceite de Carlos. PNGs/comparações/zoom em build/task-0074-equipment-body-fit-v3/inspection. O hash técnico FIT_PASS é mantido; observações não alteram registros humanos nem o PNG.\n\n|ID|Avatar|SHA-256 do candidato|Técnico|Observações e recomendação|Prioridade|\n|---|---|---|---|---|---|\n';
for (const t of visual)
  md += `|${t.id}|${t.avatar}|${t.sha256}|${t.technical}|${t.observations} ${t.recommendation}|${t.priority}|\n`;
md +=
  '\nAs10combinações de dois slots foram capturadas com os PNGs/HD imutáveis. Escudo cobre mão/guarda em parte das combinações; isso é uma oclusão coerente por ordem de camada, mas a correia/pega não é comprovada. Cinto da armadura e suspensão da espada devem ser avaliados como conjunto. Não foi testada anatomia em poses diferentes ou animação corporal. Nenhum candidato foi refeito ou reclassificado automaticamente.\n\n';
md +=
  '## Aprovação humana e ativação\n\nAs7revisões continuam HUMAN_BODY_FIT_REVIEW_PENDING. Não foram clicados Aprovar/Solicitar correção/Reprovar, nem escritos rascunhos, nesta auditoria. A galeria limita a referência ao Avatar do candidato; troca arbitrária dos54 não existe, pois não se pode extrapolar aprovação. Duas armaduras raras são definições arquivadas, sem item de catálogo.\n\nA Couraça feminina aprovada na TASK0054 permanece byte a byte: ebee2f026c2dd6aac6b47850c8412f243cdc20c51a36d6f91e2d6cf3b46c20cb, sobre female_short_moss_medium / Avatarf260cb9b053b35c328025f1bc7ee602cbb30e57c71ba1f2238a4b1519685f460. O receipt histórico não foi alterado. A autorização de integração condicional da TASK0074 permite somente essa combinação já aprovada após gates; nenhum dos sete entra no frontend. Escopo local1ativo/produção ainda não confirmada neste checkpoint.\n\n';
md +=
  '## Alterações funcionais seguras\n\nProvador usa uma cópia temporária do loadout, antes/depois/zoom e comparação; equipar apenas pela confirmação normal. Avatar maior, seleção/equipado evidentes e quatro atributos derivados presentes no Portal. Catálogo, cálculo de atributos, balanceamento e contrato de persistência permanecem intactos. A resolução exige gênero/Avatar exatos; falha do HD retira o overlay e mantém fallback legado/procedural; erro/dimensão inválida do overlay retira só a camada. Build/start revalidam receipt, fonte, Avatar, metadata e PNG aprovado e recusam fontes/candidatos/galeria no público.\n\nDefeitos corrigidos: zoom sem nome acessível; viewport de revisão cortava corpo e não ampliava em mobile; regiões de mãos agora possuem esquerda/direita e pan sem área negativa; seleção usa borda interna; filtros em coluna até360px evitam texto escapando do select WebKit. E2E antigos agora abrem o accordion, aguardam menu/intro, reabrem slot após reload e distinguem Avatar principal de miniatura do HUD. Prefetch concluído antes de navegar evita erros artificiais de cancelamento no WebKit.\n\n';
md +=
  '## Matriz de testes e bloqueios\n\n|Teste|Resultado|Evidência|Defeito/limitação|Correção recomendada|Prioridade|\n|---|---|---|---|---|---|\n';
for (const c of checks) md += '|' + c.join('|') + '|\n';
md +=
  '\nLint/typecheck/build: PASS nos comandos efetivamente executados;20rotas,210arquivos públicos,728artefatos de mídia e8SHA restritos. Falhas de QA anteriores são registradas em artefatos de rework; somente a matriz final conta como aceite.11dimensões:320×568,360×800,375×812,390×844,412×915,430×932,844×390,915×412,768×1024,1440×900,1920×1080. Baseline de performance foi DEV; não declarar otimização quantitativa a partir de diferenças de build.\n\n';
md +=
  '## Segurança, preservação e entrega\n\nSem SQL/migrations/RLS/Auth/Supabase/env remoto/proteção Vercel/saves/itens/economia/câmera/swipe alterados. Somente sessões sintéticas isoladas; requests fora da origem abortados nos testes. Nenhum secret/env/credencial/conversa real ou54HD duplicados no ZIP. Contratos de mídia e hash dos8Suno Free preservados fora da produção; a auditoria não concede uma licença comercial por inferência. Gallery/ZIP/capturas dos pendentes não entram em Git/public/Vercel.\n\nArquivos públicos alterados: screens/equipment, components/equipment-try-on/equipment-comparison/equipment-portal/avatar-runtime, data/avatarRuntime/equipmentAssets/equipmentBodyFitV3 e package.json build/start. Testes, scripts de auditoria/galeria/QA, template sem imagens privadas, contrato, checklist/memória/docs completam a entrega.\n\nZIP privado: build/task-0074-equipment-body-fit-v3/TASK-0074-auditoria-revisao.zip. HTML de revisão: review/index.html. Originais/54HD não são copiados no pacote: apenas capturas compostas necessárias, hashes e relatório. Publicação somente após gates, push normal da main e automático Vercel; nenhum deploy exclusivamente documental. Próximo passo humano: avaliar especialmente fixação dos escudos e combinações cintura/bainha e informar decisões específicas.\n';
await writeFile(
  path.join(
    root,
    'docs/architecture/TASK-0074-EQUIPMENT-BODY-FIT-V3-REPORT.md',
  ),
  md,
);
await writeFile(path.join(dir, 'AUDITORIA.md'), md);
const pack = path.join(dir, 'review-package');
await mkdir(pack, { recursive: true });
for (const file of [
  'AUDITORIA.md',
  'visual-review.json',
  'inventory.json',
  'qa-summary.json',
  'performance.json',
  'preservation-final.json',
])
  await copyFile(path.join(dir, file), path.join(pack, file));
for (const folder of ['inspection/chromium', 'compatibility']) {
  await mkdir(path.join(pack, folder), { recursive: true });
  for (const name of await readdir(path.join(dir, folder)))
    if (
      name === 'results.json' ||
      (name.endsWith('.png') &&
        !name.includes('zoom-hands') &&
        !name.includes('-with-'))
    )
      await copyFile(
        path.join(dir, folder, name),
        path.join(pack, folder, name),
      );
}
const hashes = [];
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
const cards = visual
  .map(
    (t) =>
      `<article><h2>${escape(t.id)}</h2><p>Avatar: ${escape(t.avatar)} · FIT_PASS técnico · aprovação humana PENDENTE · produção INATIVA</p><p class="hash">SHA-256: ${escape(t.sha256)}</p><div class="pair"><figure><img src="inspection/chromium/${t.id}-390-before.png" alt="Avatar original"><figcaption>Antes</figcaption></figure><figure><img src="inspection/chromium/${t.id}-390-after.png" alt="Candidato exato no Avatar"><figcaption>Depois — candidato não aprovado</figcaption></figure></div><p>${escape(t.observations)}</p><p><strong>Recomendação P2:</strong> ${escape(t.recommendation)}</p><details><summary>Comparação desktop e zoom</summary><img src="inspection/chromium/${t.id}-1440-comparison.png" alt="Antes e depois em desktop"><div class="pair">${(t.id.startsWith('armor') ? ['head', 'left-hand', 'right-hand', 'waist'] : t.id.startsWith('sword') ? ['right-hand', 'waist', 'feet'] : ['right-hand', 'waist']).map((region) => `<figure><img src="inspection/chromium/${t.id}-1440-zoom-${region}.png" alt="Zoom ${region}"><figcaption>${region}</figcaption></figure>`).join('')}</div></details></article>`,
  )
  .join('');
await writeFile(
  path.join(pack, 'RELATORIO.html'),
  `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none';img-src file:;style-src 'unsafe-inline';connect-src 'none';object-src 'none'"><title>Auditoria TASK-0074 — revisão privada</title><style>body{margin:0;padding:16px;background:#153829;color:#fff8dd;font:16px/1.55 system-ui}main{max-width:1000px;margin:auto}h1,h2{color:#efd493;overflow-wrap:anywhere}h2{font-size:22px}.hash{overflow-wrap:anywhere}article{border-top:2px solid #d8c98d;padding:20px 0}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}figure{margin:0}img{display:block;max-width:100%;height:auto}summary{padding:12px;cursor:pointer}a{color:#efd493}@media(max-width:500px){.pair{grid-template-columns:1fr}}</style><main><h1>Auditoria privada — sete candidatos pendentes</h1><p>Inspeção técnica e visual do agente. Nenhuma decisão humana foi alterada. Extraia o ZIP antes de abrir este arquivo; todas as capturas são locais. <a href="AUDITORIA.md">Relatório completo e matriz de testes</a>.</p>${cards}</main></html>`,
);
async function visit(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const p = path.join(folder, entry.name);
    if (entry.isDirectory()) await visit(p);
    else if (entry.name !== 'SHA256.json')
      hashes.push({
        path: path.relative(pack, p).replaceAll('\\', '/'),
        sha256: createHash('sha256')
          .update(await readFile(p))
          .digest('hex'),
      });
  }
}
await visit(pack);
await writeFile(
  path.join(pack, 'SHA256.json'),
  JSON.stringify(hashes, null, 2),
);
console.log(
  JSON.stringify({
    pending: visual.length,
    decisionsChanged: 0,
    packageFiles: hashes.length,
    packageIncludesRaw54HD: false,
  }),
);
