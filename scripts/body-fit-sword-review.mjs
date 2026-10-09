import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { OUTPUT } from './body-fit-sword-bake.mjs';
import { sha256 } from './body-fit-bake.mjs';
const json = async (p) => JSON.parse(await readFile(p, 'utf8'));
const facts = {
  sword_path_common_female_v2: [
    'Cabo sobreposto à palma e dedos no candidato sem máscara; polegar visivelmente afastado.',
    'Máscara revela os dedos à frente, mas recorta a empunhadura e deixa abertura entre polegar e cabo.',
    'Lâmina vertical, lateral, sem cruzar torso/pernas/botas na segunda tentativa; pomo sobre região da luva.',
  ],
  sword_path_common_male_v2: [
    'Rotação offline de 149,414° elimina direção para cima e travessia do torso.',
    'Redução de escala elimina contato com a bota observado na primeira tentativa; guarda próxima do bolso lateral requer revisão humana.',
    'Máscara revela os dedos, mas produz recorte anguloso na empunhadura; polegar separado e pega não fechada.',
  ],
  sword_path_rare_female_v2: [
    'Lâmina vertical; escala reduzida mantém guarda fora da coxa na segunda tentativa, com pequena folga visual ao bolso.',
    'Espada ficou mais curta para preservar proporção e espaço lateral; proporção de espada curta depende de avaliação humana.',
    'Dedos continuam abertos; máscara cria cabo parcialmente interrompido e halo/recorte sob os dedos junto à guarda.',
  ],
  sword_path_rare_male_v2: [
    'Rotação própria de -0,128° corrige pequeno desvio da fonte; lâmina vertical para baixo.',
    'Guarda e lâmina menores, laterais, sem atravessar torso/pernas; extremidade da guarda permanece próxima do bolso.',
    'Máscara deixa dedos à frente, porém polegar aberto, cabo recortado e tangência com a guarda não formam empunhadura convincente.',
  ],
};
const evidenceFiles = [
  'avatar_base.png',
  'source.png',
  'combined.png',
  'full_body.png',
  'hand_zoom.png',
  'hand_zoom_base.png',
  'alignment_guides.png',
  'offline_hand_occlusion_mask.png',
  'masked_overlay_diagnostic.png',
  'masked_combined_diagnostic.png',
  'hand_zoom_masked.png',
  'previous_combined.png',
];
const final = await json(OUTPUT + '/attempt-02/inventory.json');
for (const run of [OUTPUT, OUTPUT + '/attempt-02']) {
  const inv = await json(run + '/inventory.json');
  for (const m of inv.assets) {
    const dir = m.output.path.substring(0, m.output.path.lastIndexOf('/'));
    const selected = run.endsWith('attempt-02');
    const evidence = [];
    for (const file of [...evidenceFiles, m.id + '_downward_baked.png']) {
      const p = dir + '/' + file,
        bytes = await readFile(p),
        size = await sharp(bytes).metadata();
      evidence.push({
        path: p,
        sha256: sha256(bytes),
        width: size.width,
        height: size.height,
      });
    }
    const report = {
      task: 'TASK-0056',
      id: m.id,
      gender: m.gender,
      itemId: m.itemId,
      assessedBy:
        'Codex / QA visual pelo autor; não revisão independente nem aprovação de Carlos Faustino',
      outputSha256: m.output.sha256,
      sourceSha256: m.source.sha256,
      avatar: m.avatar,
      selectedForReview: selected,
      attempt: selected ? 2 : 1,
      status: 'NEEDS_REWORK',
      reviewStatus: 'NEEDS_REWORK',
      technicalStatus: 'TECHNICALLY_VALIDATED',
      orientation: 'DOWNWARD_VERTICAL',
      grip: 'FAIL_OPEN_HAND',
      actualHandHoldsGrip: false,
      floatingOrDisconnectedGrip: 'VISUAL_GRIP_NOT_CONVINCING',
      observations: selected
        ? facts[m.id]
        : [
            'Tentativa diagnóstica preservada; pega aberta permanece nas quatro.',
            ...(m.id === 'sword_path_common_male_v2'
              ? [
                  'Ponta entra na bota; reprovado e substituído pela segunda tentativa.',
                ]
              : []),
            ...(m.id.includes('rare')
              ? [
                  'Guarda muito larga avança na região da coxa; segunda tentativa reduz escala.',
                ]
              : []),
          ],
      regions: {
        bladeDirection: 'PASS_DOWNWARD',
        tipTowardsGround: 'PASS',
        gripRegistration: 'PALM_PROXY_ALIGNED_ONLY',
        fingersOcclusion: 'FAIL_HANDLE_FOREGROUND',
        thumbClosure: 'FAIL_OPEN_THUMB',
        torsoBladeCrossing: selected ? 'NOT_OBSERVED' : 'NOT_OBSERVED',
        legBladeCrossing: selected ? 'NOT_OBSERVED' : 'SEE_ATTEMPT_LIMITS',
        proportion: 'VISUAL_REVIEW_PENDING',
      },
      occlusion: {
        ...m.occlusionExperiment,
        status: 'NEEDS_REWORK',
        observations:
          'Máscara experimental offline melhora ordem dos dedos/cabo, mas não muda a pose aberta; bordas poligonais introduzem recortes/halo. Não selecionada como PNG final.',
      },
      reworkRecommendation:
        'Contornar precisamente os dedos e polegar em máscara offline própria por referência, testar perfil mais estreito e menor comprimento da empunhadura. A máscara não fecha os dedos: se continuar aberta, manter NEEDS_REWORK. Alternativa a avaliar por Carlos: camada frontal independente de mão em pose de pega, sem sobrescrever HD, exigindo escopo/arte e aceite específicos antes de qualquer runtime.',
      limits:
        'Somente este hash sobre female_short_moss_medium ou male_short_moss_medium. Nenhuma compatibilidade com os outros 52 HD presumida. Registro matemático e direção vertical não provam pega real. Avaliação da capa/guarda é 2D; anatomia oculta não certificada.',
      evidence,
      humanBodyFitApproved: false,
      ready: false,
      runtimeActivated: false,
    };
    await writeFile(
      dir + '/fit-report.json',
      JSON.stringify(report, null, 2) + '\n',
    );
    await writeFile(
      dir + '/receipt.json',
      JSON.stringify(
        {
          task: 'TASK-0056',
          id: m.id,
          output: m.output,
          source: m.source,
          avatar: m.avatar,
          transform: m.transform,
          status: report.status,
          metadataSha256: sha256(await readFile(dir + '/fit-metadata.json')),
          reportSha256: sha256(await readFile(dir + '/fit-report.json')),
          runtimePath: null,
          humanBodyFitApproved: false,
          ready: false,
          runtimeActivated: false,
        },
        null,
        2,
      ) + '\n',
    );
  }
}
const assets = [];
for (const m of final.assets) {
  const dir = m.output.path.substring(0, m.output.path.lastIndexOf('/'));
  assets.push({
    ...m,
    occlusionExperiment: {
      ...m.occlusionExperiment,
      status: 'NEEDS_REWORK',
      assessmentReference: dir + '/fit-report.json',
    },
    fitStatus: 'NEEDS_REWORK',
    fitReport: dir + '/fit-report.json',
    receipt: dir + '/receipt.json',
    observations: facts[m.id],
  });
}
const manifest = {
  task: 'TASK-0056',
  status: 'REWORK',
  counts: {
    processedTargets: 4,
    attempts: 2,
    candidatePngs: 8,
    DOWNWARD: 4,
    FIT_PASS: 0,
    NEEDS_REWORK: 4,
    HUMAN_BODY_FIT_REVIEW_PENDING: 0,
    HUMAN_APPROVED: 0,
    READY: 0,
    runtimeActivated: 0,
  },
  assets,
  history: [OUTPUT + '/inventory.json', OUTPUT + '/attempt-02/inventory.json'],
  physicalInventory: OUTPUT + '/physical-png-inventory.json',
};
await writeFile(
  'docs/architecture/TASK-0056-BAKED-ASSET-MANIFEST.json',
  JSON.stringify(manifest, null, 2) + '\n',
);
await mkdir(OUTPUT + '/review', { recursive: true });
const names = [
  ['avatar_base.png', 'Avatar HD original'],
  ['source.png', 'Fonte original isolada'],
  ['combined.png', 'Composição final candidata'],
  ['full_body.png', 'Corpo inteiro'],
  ['hand_zoom.png', 'Mão / empunhadura'],
  ['hand_zoom_base.png', 'Mão sem espada'],
  ['alignment_guides.png', 'Guias: palma/eixo/solo/máscara'],
  ['hand_zoom_masked.png', 'Teste de oclusão offline — reprovado'],
  ['masked_combined_diagnostic.png', 'Teste de máscara no corpo — reprovado'],
  ['previous_combined.png', 'Candidato anterior TASK-0055'],
];
const sections = assets
  .map(
    (m) =>
      `<article id="${m.id}"><h2>${m.id}</h2><p><strong>NEEDS_REWORK</strong> · lâmina para baixo · pega reprovada · READY não</p><ul>${facts[m.id].map((f) => `<li>${f}</li>`).join('')}</ul><p>Escala ${m.transform.scale}; rotação ${m.transform.rotation.toFixed(6)}°; tx ${m.transform.translateX.toFixed(6)}; ty ${m.transform.translateY.toFixed(6)}</p><p><a href="../attempt-02/${m.id}/fit-report.json">Relatório / oclusão</a> · <a href="../attempt-02/${m.id}/fit-metadata.json">Transform / hashes</a> · <a href="../attempt-02/${m.id}/receipt.json">Receipt</a> · <a href="../attempt-02/${m.id}/${m.id}_downward_baked.png">PNG isolado full-canvas</a></p><div class="views">${names.map(([f, label]) => `<figure><a href="../attempt-02/${m.id}/${f}"><img loading="lazy" alt="${label} — ${m.id}" src="../attempt-02/${m.id}/${f}"></a><figcaption>${label}</figcaption></figure>`).join('')}</div></article>`,
  )
  .join('');
await writeFile(
  OUTPUT + '/review/index.html',
  `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TASK-0056 — Sword Downward Review</title><style>body{margin:auto;padding:24px;max-width:1500px;background:#18221d;color:#edf3ed;font:16px system-ui}a{color:#b7e4c2}h1,h2{overflow-wrap:anywhere}.views{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:16px}figure{margin:0;background:#d3d3d3;color:#18221d}img{display:block;width:100%;height:auto;transform:none}figcaption{padding:12px}article{border-top:1px solid #6a856a;margin-top:32px;padding-top:16px}p,li{line-height:1.5}nav a{display:inline-block;padding:10px}</style><h1>TASK-0056 — Espadas em repouso</h1><p>REWORK · 4 apontadas para baixo · FIT_PASS 0 · NEEDS_REWORK 4 · READY 0 · runtime 0.</p><p>As imagens mostram somente duas referências HD imutáveis. A máscara experimental não fecha a mão e não foi selecionada. Todos os transforms estão baked no PNG; nenhuma correção runtime. Clique nas imagens para tamanho nativo.</p><nav>${assets.map((m) => `<a href="#${m.id}">${m.gender} / ${m.id.includes('common') ? 'comum' : 'rara'}</a>`).join('')}</nav><h2>FIT_PASS (0)</h2><p>Nenhuma espada com pega convincente.</p><h2>NEEDS_REWORK (4)</h2>${sections}</html>`,
);
console.log(JSON.stringify(manifest.counts));
