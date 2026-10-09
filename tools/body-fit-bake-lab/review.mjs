export async function initializeBakeReview() {
  if (!['127.0.0.1', 'localhost'].includes(location.hostname))
    throw Error('Offline bake editor is localhost DEV-only');
  const metadata = await fetch('../fit-metadata.json').then((r) => r.json());
  const source = new Image(),
    base = new Image();
  source.src = '../source.png';
  base.src = '../avatar_base.png';
  await Promise.all([source.decode(), base.decode()]);
  const canvas = document.querySelector('#draft'),
    ctx = canvas.getContext('2d');
  const defaults = { ...metadata.transform };
  const getTransform = () =>
    Object.fromEntries(
      Object.keys(defaults).map((n) => [
        n,
        Number(document.getElementById(n).value),
      ]),
    );
  function draw() {
    const t = getTransform(),
      alpha = Number(document.querySelector('#opacity').value);
    const before = document.querySelector('#draft-mode').value === 'before';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, 1024, 1536);
    ctx.drawImage(base, 0, 0);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (!before) {
      const r = (t.rotation * Math.PI) / 180;
      ctx.setTransform(
        t.scale * Math.cos(r),
        t.scale * Math.sin(r),
        -t.scale * Math.sin(r),
        t.scale * Math.cos(r),
        t.translateX,
        t.translateY,
      );
    }
    ctx.drawImage(source, 0, 0);
    ctx.restore();
    if (document.querySelector('#draft-guides').checked) {
      ctx.fillStyle = 'cyan';
      for (const p of Object.values(metadata.landmarks)) {
        ctx.beginPath();
        ctx.arc(...p.avatar, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    document.querySelector('#draft-metadata').textContent = JSON.stringify(
      {
        transform: t,
        opacity: alpha,
        view: before ? 'before' : 'after',
        warning: 'DEV preview only; baked PNG unchanged',
      },
      null,
      2,
    );
  }
  document.querySelector('#zoom').onchange = (e) =>
    document.body.classList.toggle('native', e.target.value === '1024');
  for (const input of document.querySelectorAll('#editor input,#editor select'))
    input.addEventListener('input', draw);
  document.querySelector('#reset').onclick = () => {
    for (const [n, v] of Object.entries(defaults))
      document.getElementById(n).value = String(v);
    document.querySelector('#opacity').value = '.5';
    document.querySelector('#draft-mode').value = 'after';
    document.querySelector('#draft-guides').checked = true;
    draw();
  };
  document.querySelector('#export').onclick = () => {
    const settings = { ...metadata, transform: getTransform() };
    settings.fittingMethod =
      'Manual DEV draft; requires bake and fresh fit review';
    delete settings.validatedAt;
    delete settings.output;
    delete settings.landmarkResiduals;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(settings, null, 2)], {
        type: 'application/json',
      }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'task-0054-pilot-settings.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const assessment = await fetch('../fit-report.json').then((r) => r.json());
  const bound = assessment.output?.sha256 === metadata.output.sha256;
  const effective = bound
    ? assessment
    : {
        status: 'FIT_VALIDATION_PENDING',
        ready: false,
        humanBodyFitApproved: false,
        reason: 'Assessment hash does not match current baked output',
      };
  document.querySelector('#fit-status').textContent =
    `${effective.status} / ${effective.reviewStatus ?? 'FIT_VALIDATION_PENDING'}. ${effective.ready && effective.humanBodyFitApproved ? 'READY em staging; aceite limitado a este hash/avatar; runtime não ativado.' : 'Somente DEV; aprovação humana/READY pendentes.'}`;
  document.querySelector('#report').textContent = JSON.stringify(
    effective,
    null,
    2,
  );
  draw();
  document.body.dataset.bakeEditorReady = 'true';
}
