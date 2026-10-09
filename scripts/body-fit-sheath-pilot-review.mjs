import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { sha256 } from './body-fit-bake.mjs';
import { OUTPUT, AVATAR, SWORD } from './body-fit-sheath-pilot-bake.mjs';
const json = async (p) => JSON.parse(await readFile(p, 'utf8'));
const dir = OUTPUT + '/baked/attempt-03',
  m = await json(dir + '/bake-metadata.json');
const selected = await readFile(m.output.path);
for (const [name, background] of [
  ['on-light.png', '#ffffff'],
  ['on-dark.png', '#18231e'],
])
  await sharp({
    create: { width: 1024, height: 1536, channels: 4, background },
  })
    .composite([{ input: selected }])
    .png()
    .toFile(dir + '/' + name);
const rows = [
  [AVATAR, 'Avatar HD original, imutável'],
  [SWORD, 'Espada original: cabo/guarda reutilizados'],
  [m.sheathSource.path, 'Nova bainha de couro e suspensão — source v2'],
  [m.output.path, 'Overlay baked selecionado — transparência real'],
  [dir + '/final-composition.png', 'Composição final / corpo inteiro'],
  [dir + '/waist-zoom.png', 'Zoom de cintura, guarda e mão'],
  [dir + '/support-zoom.png', 'Zoom do suporte e pontos no cinto'],
  [
    'build/task-0057-sword-sheath/sword_path_common_female_v2/diagnostic_composition.png',
    'Anterior TASK0057: espada nua / sem suporte',
  ],
  [
    dir + '/alignment-guides.png',
    'Guias: cinto cyan, ancoragens magenta, eixo yellow, máscara orange',
  ],
  [dir + '/on-dark.png', 'Acabamento / alpha em fundo escuro'],
];
const evidence = [];
for (const [p, label] of [
  ...rows,
  [dir + '/on-light.png', 'Alpha em fundo branco'],
  [dir + '/foreground-arm-mask.png', 'Máscara offline'],
  [dir + '/hilt-original-pixels.png', 'Cabo/guarda originais isolados'],
]) {
  const bytes = await readFile(p),
    meta = await sharp(bytes).metadata();
  evidence.push({
    path: p,
    label,
    sha256: sha256(bytes),
    width: meta.width,
    height: meta.height,
  });
}
const report = {
  task: 'TASK-0058',
  id: m.id,
  status: 'FIT_PASS',
  taskStatus: 'PILOT_TECHNICALLY_COMPLETE',
  humanReviewStatus: 'HUMAN_BODY_FIT_REVIEW_PENDING',
  selectedAttempt: 3,
  outputSha256: m.output.sha256,
  criteria: {
    sheathed: true,
    bladeFullyCovered: true,
    tipDown: true,
    gripUp: true,
    convincingBeltAttachment: true,
    duplicatedSword: false,
    severeOcclusion: false,
    visibleArtificialCutsOrHalos: false,
    proportional: true,
    immutableAvatar: true,
  },
  observations: [
    'Bainha real de couro marrom com costura discreta, garganta/ponta em bronze; duas correias conectadas ao colar da bainha.',
    'Contato superior aproximadamente613,568 no cinto frontal direito e644,597 na extremidade descendente do couro. Não são âncoras da mão.',
    'Espada estética preservada mediante pixels originais de cabo/guarda, sem hilt redesenhado pelo gerador. Parte nua da lâmina removida sob a garganta; nenhuma segunda espada.',
    'Ponta832.70,1225.75, abaixo da garganta697,745, acima do chão1495. Eixo desce para a lateral direita, sem cruzar pernas ou bolsa esquerda.',
    'Guarda parcialmente atrás do antebraço. Máscara subtrai alpha somente do equipamento; refinamento local pela cor do HD evita apagar guarda sobre a capa verde. Nenhum pixel do HD entra no overlay.',
    'Mão aberta permanece original e livre; não se exige empunhadura permanente conforme DEC037.',
    'Aceite técnico visual pelo autor apenas para female_short_moss_medium; não extrapolado aos outros53HD. Carlos deve confirmar proporção, pontos de fixação e transição guarda/bainha.',
  ],
  remainingOcclusionIssues: [],
  limitations: [
    'A máscara é específica desta pose/roupa, não generalizada.',
    'Medidas manuais do cinto aproximadamente±12px; inspeção visual sustenta a classificação, não só o bounding box.',
    'Gerador alterou pixels do corpo da bainha durante a edição, apesar do pedido de preservar. Source v2 foi reinventariada por novo hash; v1 preservada.',
  ],
  previousAttempts: [
    {
      attempt: 1,
      status: 'NEEDS_REWORK',
      reason: 'Correias fora do cinto; recorte grosseiro da guarda.',
    },
    {
      attempt: 2,
      status: 'NEEDS_REWORK',
      reason:
        'Suspensão corrigida, mas trace manual apagava guarda sobre a capa antes do contorno real do braço.',
    },
  ],
  evidence,
  assessedBy:
    'Codex, QA visual pelo autor; não independente nem aprovação humana',
  ready: false,
  humanBodyFitApproved: false,
  runtimeActivated: false,
  runtimePath: null,
};
await writeFile(dir + '/fit-report.json', JSON.stringify(report, null, 2));
for (const attempt of ['attempt-01', 'attempt-02']) {
  const p = OUTPUT + '/baked/' + attempt,
    old = await json(p + '/bake-metadata.json');
  await writeFile(
    p + '/fit-report.json',
    JSON.stringify(
      {
        task: 'TASK-0058',
        id: m.id,
        status: 'NEEDS_REWORK',
        outputSha256: old.output.sha256,
        reason: report.previousAttempts.find(
          (a) => a.attempt === Number(attempt.slice(-2)),
        ).reason,
        ready: false,
        humanBodyFitApproved: false,
        runtimeActivated: false,
      },
      null,
      2,
    ),
  );
}
const manifest = {
  task: 'TASK-0058',
  status: report.taskStatus,
  fitStatus: report.status,
  humanReviewStatus: report.humanReviewStatus,
  counts: {
    targets: 1,
    FIT_PASS: 1,
    NEEDS_REWORK: 0,
    historicalRejectedAttempts: 2,
    HUMAN_BODY_FIT_REVIEW_PENDING: 1,
    HUMAN_APPROVED: 0,
    READY: 0,
    runtimeActivated: 0,
  },
  metadata: m,
  reportPath: dir + '/fit-report.json',
  evidence,
  unprocessedTargets: [
    'sword_path_common_male_v2',
    'sword_path_rare_female_v2',
    'sword_path_rare_male_v2',
  ],
};
await writeFile(
  'docs/architecture/TASK-0058-SHEATH-PILOT-MANIFEST.json',
  JSON.stringify(manifest, null, 2),
);
await writeFile(
  dir + '/receipt.json',
  JSON.stringify(
    {
      task: 'TASK-0058',
      outputSha256: m.output.sha256,
      metadataSha256: sha256(await readFile(dir + '/bake-metadata.json')),
      reportSha256: sha256(await readFile(dir + '/fit-report.json')),
      sourceSha256: m.sheathSource.sha256,
      originalSwordSha256: m.originalSword.sha256,
      avatarSha256: m.avatar.sha256,
      ready: false,
      humanBodyFitApproved: false,
      runtimeActivated: false,
    },
    null,
    2,
  ),
);
const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TASK-0058 — Piloto de bainha</title><style>body{font:16px system-ui;background:#18231e;color:#f1f5ee;max-width:1500px;margin:auto;padding:24px}h1,p,li{overflow-wrap:anywhere}p,li{line-height:1.5}a{color:#bce8d0}.comparison,.views{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:16px}figure{margin:0;background:#ddd;color:#16221a}img{display:block;width:100%;height:auto;transform:none}figcaption{padding:12px}details{margin:16px 0}code{overflow-wrap:anywhere}button{font:inherit}</style><h1>TASK-0058 — Piloto de espada embainhada</h1><p><strong>PILOT_TECHNICALLY_COMPLETE / FIT_PASS / HUMAN_BODY_FIT_REVIEW_PENDING</strong></p><p>Somente sword_path_common_female_v2 em female_short_moss_medium. FIT_PASS1 · READY0 · aprovação humana0 · runtime0. Carlos Faustino ainda deve revisar este hash específico.</p><div class="comparison"><figure><img src="/build/task-0057-sword-sheath/sword_path_common_female_v2/diagnostic_composition.png" alt="Antes: espada nua sem suporte"><figcaption>Antes0057 — NEEDS_NEW_SHEATH_ART</figcaption></figure><figure><img src="/${dir}/final-composition.png" alt="Novo piloto embainhado"><figcaption>Piloto0058 — FIT_PASS técnico</figcaption></figure></div><article id="sword_path_common_female_v2"><h2>Encaixe e oclusão</h2><ul>${report.observations.map((s) => `<li>${s}</li>`).join('')}</ul><p><a href="/${dir}/fit-report.json">Relatório de encaixe</a> · <a href="/${dir}/bake-metadata.json">Transforms / hashes</a> · <a href="/${dir}/receipt.json">Receipt</a></p><p>SHA selecionado: <code>${m.output.sha256}</code></p><div class="views">${rows.map(([p, l]) => `<figure><img loading="lazy" src="/${p}" alt="${l}"><figcaption>${l}</figcaption></figure>`).join('')}</div><details><summary>Tentativas rejeitadas do mesmo piloto</summary><p>Attempt01: correias fora do cinto. Attempt02: corte prematuro na guarda. Ambas NEEDS_REWORK, preservadas.</p><a href="/${OUTPUT}/baked/attempt-01/final-composition.png">01</a> · <a href="/${OUTPUT}/baked/attempt-02/final-composition.png">02</a></details><p>As outras três espadas não foram geradas nem processadas. Este review não ativa equipamento e não escreve saves.</p></article></html>`;
const portableHtml = html.replace(
  /(src|href)="\/([^"]+)"/g,
  (_, attribute, target) =>
    `${attribute}="${path.relative(OUTPUT + '/review', target).replaceAll('\\', '/')}"`,
);
await writeFile(OUTPUT + '/review/index.html', portableHtml);
console.log(
  JSON.stringify({ counts: manifest.counts, sha256: m.output.sha256 }),
);
