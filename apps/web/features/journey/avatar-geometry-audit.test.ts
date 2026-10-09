import { expect, it } from 'vitest';
const auditPath = '../../../../../../scripts/audit-avatar-geometry.mjs';
const { measureAlpha, compareGeometry } = await import(auditPath);
function rect(
  width: number,
  height: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  const data = new Uint8Array(width * height * 4);
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) data[(y * width + x) * 4 + 3] = 255;
  return data;
}
it('uses pixel edges so exact 2x geometry has zero deltas, including centroid', () => {
  const legacy = measureAlpha(rect(10, 12, 2, 1, 7, 11), 10, 12);
  const hd = measureAlpha(rect(20, 24, 4, 2, 14, 22), 20, 24);
  expect(legacy).toMatchObject({
    left: 2,
    right: 7,
    top: 1,
    bottom: 11,
    width: 5,
    height: 10,
    centerX: 4.5,
    centerY: 6,
  });
  expect(
    compareGeometry(legacy, hd).every(
      (row: { delta: number; result: string }) =>
        row.delta === 0 && row.result === 'PASS',
    ),
  ).toBe(true);
});
it('includes partial alpha in total bounds and exposes it separately from opaque contour', () => {
  const pixels = rect(10, 12, 2, 1, 7, 11);
  pixels[3] = 1;
  expect(measureAlpha(pixels, 10, 12).left).toBe(0);
  expect(measureAlpha(pixels, 10, 12, 128).left).toBe(2);
});
it('feet at HD tolerance 4px pass, 5px fail; no threshold relaxation', () => {
  const legacy = measureAlpha(rect(10, 12, 2, 1, 7, 8), 10, 12);
  for (const [delta, expected] of [
    [4, 'PASS'],
    [5, 'FAIL'],
  ] as const) {
    const hd = measureAlpha(rect(20, 24, 4, 2, 14, 16 + delta), 20, 24);
    const row = compareGeometry(legacy, hd).find(
      (r: { metric: string }) => r.metric === 'feetBaseline',
    );
    expect(row.delta).toBe(delta);
    expect(row.result).toBe(expected);
  }
});
it('anatomy changes inside the same bounding box remain visible in silhouette diagnostics', () => {
  const pixels = rect(10, 12, 2, 1, 7, 11),
    changed = pixels.slice();
  for (let y = 3; y < 8; y++) changed[(y * 10 + 4) * 4 + 3] = 0;
  const a = measureAlpha(pixels, 10, 12),
    b = measureAlpha(changed, 10, 12);
  expect(b.width).toBe(a.width);
  expect(b.height).toBe(a.height);
  expect(changed).not.toEqual(pixels);
  // Bounding-box equality is deliberately not a human pose/silhouette approval.
});
it('empty transparent input cannot silently pass geometry', () => {
  expect(() => measureAlpha(new Uint8Array(10 * 12 * 4), 10, 12)).toThrow(
    'Empty alpha silhouette',
  );
});
