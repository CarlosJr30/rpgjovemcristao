import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { sha256 } from './body-fit-bake.mjs';
import { OUTPUT } from './body-fit-sheath-diagnostic.mjs';
const inv = JSON.parse(
  await readFile(OUTPUT + '/diagnostic-inventory.json', 'utf8'),
);
const facts = {
  sword_path_common_female_v2: [
    'Fonte é lâmina exposta, sem bainha ou correia.',
    'Estudo no quadril cobre parte do antebraço/luva com o cabo/guarda e aproxima a ponta da perna; reprovado como encaixe.',
    'Fixação física ausente; uma linha pontilhada de guia não é correia. Acabamento verde/dourado do cabo existente precisa ser avaliado para a comum simples.',
  ],
  sword_path_common_male_v2: [
    'Fonte e candidato anterior sem bainha ou suporte.',
    'Estudo no quadril coloca guarda diante da luva e da bolsa; lâmina toca a região lateral da perna. Profundidade incorreta.',
    'Comprimento cabe no canvas, mas não sustenta nem guarda a espada; precisa de bainha simples e suporte próprio.',
  ],
  sword_path_rare_female_v2: [
    'Detalhes verdes/dourados pertencem à lâmina exposta; não são bainha.',
    'Guarda larga cruza a luva e a bolsa; ponta aproxima/invade região lateral da coxa no diagnóstico.',
    'Bainha elaborada e suspensão próprias precisam respeitar a bolsa existente e a largura da guarda.',
  ],
  sword_path_rare_male_v2: [
    'Lâmina exposta, sem material de bainha ou suporte local.',
    'Guarda ornamental cobre luva/bolsa; corpo da arma avança no contorno lateral da perna no diagnóstico.',
    'Suspensão e profundidade precisam de arte dedicada; máscaras anteriores da mão não se aplicam à nova abordagem.',
  ],
};
const assets = [];
for (const m of inv.assets) {
  const dir = OUTPUT + '/' + m.id,
    female = m.gender === 'female';
  const belt = {
    measuredBox: female ? [410, 558, 655, 615] : [398, 590, 648, 650],
    attachmentProposal: female ? [455, 581] : [446, 618],
    approximation:
      'Refined manual belt-body bounds +/-12px; historical broad search box preserved in bake-metadata.json; attachment point is guide only',
  };
  const [x1, y1, x2, y2] = belt.measuredBox,
    [bx, by] = belt.attachmentProposal,
    [hx, hy] = m.hip.guardProxy;
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" fill="none" stroke="cyan" stroke-width="3"/><path d="M${bx} ${by}L${hx} ${hy}" stroke="magenta" stroke-dasharray="8 8" stroke-width="4"/><circle cx="${bx}" cy="${by}" r="8" fill="cyan"/><circle cx="${hx}" cy="${hy}" r="8" fill="magenta"/><path d="M${m.diagnostic.landmarks.root.projected.join(' ')}L${m.diagnostic.landmarks.tip.projected.join(' ')}" stroke="yellow" stroke-width="3"/><text x="30" y="50" font-size="27" fill="#a00000">DIAGNOSTICO: SEM BAINHA / SEM FIXACAO</text></svg>`,
  );
  const canvas = () =>
    sharp({
      create: { width: 1024, height: 1536, channels: 4, background: '#d3d3d3' },
    });
  const avatar = await readFile(m.avatar.path),
    diag = await readFile(m.diagnostic.output.path);
  await canvas()
    .composite([{ input: avatar }, { input: svg }])
    .png()
    .toFile(dir + '/reviewed_base_guides.png');
  await canvas()
    .composite([{ input: avatar }, { input: diag }, { input: svg }])
    .png()
    .toFile(dir + '/reviewed_alignment_guides.png');
  await sharp(dir + '/reviewed_alignment_guides.png')
    .extract({ left: 180, top: 500, width: 540, height: 380 })
    .resize(1080, 760)
    .png()
    .toFile(dir + '/reviewed_waist_zoom_guides.png');
  const reviewed = {
    ...m,
    belt,
    diagnosticsAreFinalCandidates: false,
    reviewedAtLocalDate: '2026-10-08',
  };
  await writeFile(
    dir + '/reviewed-metadata.json',
    JSON.stringify(reviewed, null, 2) + '\n',
  );
  const files = [
    'avatar_base.png',
    'source_original.png',
    'task0056_candidate.png',
    'task0056_combined.png',
    'diagnostic_unsheathed_hip.png',
    'diagnostic_composition.png',
    'full_body_diagnostic.png',
    'waist_zoom_base.png',
    'waist_zoom_diagnostic.png',
    'reviewed_base_guides.png',
    'reviewed_alignment_guides.png',
    'reviewed_waist_zoom_guides.png',
  ];
  const evidence = [];
  for (const f of files) {
    const bytes = await readFile(dir + '/' + f),
      size = await sharp(bytes).metadata();
    evidence.push({
      path: dir + '/' + f,
      sha256: sha256(bytes),
      width: size.width,
      height: size.height,
    });
  }
  const report = {
    task: 'TASK-0057',
    id: m.id,
    gender: m.gender,
    status: 'NEEDS_NEW_SHEATH_ART',
    technicalStatus: 'DIAGNOSTIC_PNG_VALID_ONLY',
    observations: facts[m.id],
    sheathPresent: false,
    supportPresent: false,
    fixationVerified: false,
    finalSheathedOutput: null,
    finalSheathedSha256: null,
    finalSheathedTransform: null,
    diagnosticOutput: m.diagnostic.output,
    diagnosticTransform: m.diagnostic.transform,
    diagnosticOrientation: 'BLADE_DOWN_GRIP_UP',
    finalOrientation: 'NOT_ASSESSABLE_NO_SHEATH_OVERLAY',
    secondaryFitIssues: [
      'FOREARM_GUARD_OVERLAP',
      'POUCH_OVERLAP',
      'LEG_CONTOUR_CONTACT',
      'NO_VISUAL_SUPPORT_FLOATING',
    ],
    occlusion:
      'No mask produced; anatomy unchanged. Future suspension must pass behind belt/pouch and avoid foreground arm/hand. Missing art prevents final occlusion validation.',
    belt,
    hip: m.hip,
    requiredArt: {
      sheath: m.id.includes('common')
        ? 'Simple leather sheath with throat and chape'
        : 'Coherent ornamented sheath with covered blade',
      support:
        'Belt-attached suspension strap/holder compatible with this reference; no painted guide used as art',
      preserve:
        'Avatar original/pose/hands/face and existing pouch; transparent full-canvas1024x1536',
    },
    evidence,
    assessedBy:
      'Codex author visual QA, not independent review or human approval',
    ready: false,
    humanBodyFitApproved: false,
    runtimeActivated: false,
    runtimePath: null,
  };
  await writeFile(
    dir + '/fit-report.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  const receipt = {
    task: 'TASK-0057',
    id: m.id,
    status: report.status,
    sourceSha256: m.source.sha256,
    avatarSha256: m.avatar.sha256,
    previousCandidateSha256: m.previousCandidate.sha256,
    diagnosticSha256: m.diagnostic.output.sha256,
    metadataSha256: sha256(await readFile(dir + '/reviewed-metadata.json')),
    reportSha256: sha256(await readFile(dir + '/fit-report.json')),
    finalSheathedSha256: null,
    ready: false,
    humanBodyFitApproved: false,
    runtimeActivated: false,
    runtimePath: null,
  };
  await writeFile(
    dir + '/receipt.json',
    JSON.stringify(receipt, null, 2) + '\n',
  );
  assets.push({
    ...reviewed,
    observations: facts[m.id],
    report: dir + '/fit-report.json',
    receipt: dir + '/receipt.json',
    metadata: dir + '/reviewed-metadata.json',
  });
}
const manifest = {
  task: 'TASK-0057',
  status: 'REWORK',
  reason: 'NEEDS_NEW_SHEATH_ART',
  counts: {
    targets: 4,
    diagnosticOverlays: 4,
    sheathedOverlays: 0,
    FIT_PASS: 0,
    NEEDS_REWORK: 0,
    NEEDS_NEW_SHEATH_ART: 4,
    HUMAN_BODY_FIT_REVIEW_PENDING: 0,
    HUMAN_APPROVED: 0,
    READY: 0,
    runtimeActivated: 0,
  },
  assets,
  inventory: OUTPUT + '/local-art-inventory.json',
};
await writeFile(
  'docs/architecture/TASK-0057-SHEATH-ASSET-MANIFEST.json',
  JSON.stringify(manifest, null, 2) + '\n',
);
await mkdir(OUTPUT + '/review', { recursive: true });
const rows = [
  ['avatar_base.png', 'Avatar HD original'],
  ['source_original.png', 'Source original: lâmina nua'],
  ['task0056_combined.png', 'Histórico TASK-0056'],
  ['diagnostic_unsheathed_hip.png', 'Diagnóstico isolado — SEM bainha'],
  ['diagnostic_composition.png', 'Composição diagnóstica — REPROVADA'],
  ['waist_zoom_base.png', 'Cinto e quadril original'],
  ['waist_zoom_diagnostic.png', 'Zoom do diagnóstico — SEM fixação'],
  [
    'reviewed_waist_zoom_guides.png',
    'Guias: cinto/correia proposta; não é arte',
  ],
  ['full_body_diagnostic.png', 'Corpo inteiro — diagnóstico'],
  ['reviewed_base_guides.png', 'Base com guias para nova arte'],
];
const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TASK-0057 — Sword Sheath Review</title><style>body{font:16px system-ui;background:#18231e;color:#f1f5ee;max-width:1600px;margin:auto;padding:24px}h1,h2{overflow-wrap:anywhere}a{color:#bce8d0}p,li{line-height:1.5}.comparison,.views{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:16px}figure{margin:0;color:#16221a;background:#ddd}img{display:block;width:100%;height:auto;transform:none}figcaption{padding:12px}article{margin-top:32px;padding-top:18px;border-top:1px solid #71917c}nav a{display:inline-block;padding:8px}</style><h1>TASK-0057 — Espadas embainhadas</h1><p><strong>REWORK / NEEDS_NEW_SHEATH_ART</strong> · FIT_PASS 0 · NEEDS_REWORK 0 · NEEDS_NEW_SHEATH_ART 4 · READY 0 · runtime 0.</p><p>Não foi encontrada bainha ou suporte adequado nos 48 assets locais de equipamento. Overlay embainhado e composição final: AUSENTES nos quatro targets. Os PNGs abaixo mostram somente estudos com espada nua no quadril, reprovados. Nenhuma guia pontilhada é correia.</p><p><a href="../local-equipment-contact-sheet.png">48 assets inspecionados</a> · <a href="../local-art-inventory.json">Inventário e hashes</a></p><h2>Comparação dos quatro diagnósticos — não são overlays embainhados</h2><div class="comparison">${assets.map((m) => `<figure><img src="../${m.id}/diagnostic_composition.png" alt="Diagnóstico sem bainha: ${m.id}"><figcaption>${m.id}<br>NEEDS_NEW_SHEATH_ART</figcaption></figure>`).join('')}</div><nav>${assets.map((m) => `<a href="#${m.id}">${m.gender} / ${m.id.includes('common') ? 'comum' : 'rara'}</a>`).join('')}</nav>${assets.map((m) => `<article id="${m.id}"><h2>${m.id}</h2><p><strong>NEEDS_NEW_SHEATH_ART</strong> — fixação NÃO validada — overlay embainhado AUSENTE.</p><ul>${m.observations.map((f) => `<li>${f}</li>`).join('')}</ul><p>Transform do diagnóstico: scale ${m.diagnostic.transform.scale}, rotation ${m.diagnostic.transform.rotation.toFixed(6)}°, tx ${m.diagnostic.transform.translateX.toFixed(6)}, ty ${m.diagnostic.transform.translateY.toFixed(6)}. Transform final embainhado: AUSENTE.</p><p><a href="../${m.id}/fit-report.json">Relatório individual</a> · <a href="../${m.id}/reviewed-metadata.json">Metadata / SHA</a> · <a href="../${m.id}/receipt.json">Receipt</a></p><div class="views">${rows.map(([f, label]) => `<figure><img loading="lazy" src="../${m.id}/${f}" alt="${label} — ${m.id}"><figcaption>${label}</figcaption></figure>`).join('')}</div></article>`).join('')}</html>`;
await writeFile(OUTPUT + '/review/index.html', html);
console.log(JSON.stringify(manifest.counts));
