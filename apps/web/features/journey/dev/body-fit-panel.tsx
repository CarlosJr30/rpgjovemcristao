import { useState, type CSSProperties } from 'react';
import { AvatarRuntime } from '../components/avatar-runtime';
import { AVATAR_HD_APPROVED } from '../data/avatarHDPack';
import { BODY_ANCHORS } from '../data/bodyAnchors';
import { EQUIPMENT_CATALOG } from '../data/equipmentCatalog';
import { equipmentVisualForItem } from '../data/equipmentAssets';
import { BODY_FIT_V2_TARGETS } from '../data/bodyFitV2Plan';
import type { Appearance } from '../domain/traveler';
import { LAB_TRAVELER } from './arena-lab-fixtures';
import metrics from './body-fit-reference-metrics.json';
import css from './body-fit-panel.module.css';

const hairMap = { short: 'curto', long: 'longo', curly: 'cacheado' } as const;
const outfitMap = { moss: 'musgo', ochre: 'ocre', blue: 'azul' } as const;
const skinMap = { light: 'claro', medium: 'medio', dark: 'escuro' } as const;
export function BodyFitPanel() {
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [id, setId] = useState('female_short_moss_medium');
  const [itemId, setItemId] = useState('traveler-armor-uncommon');
  const [enabled, setEnabled] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [split, setSplit] = useState(50);
  const [comparison, setComparison] = useState<'side' | 'split'>('side');
  const [guides, setGuides] = useState(true);
  const [silhouette, setSilhouette] = useState(false);
  const [, hair, outfit, skin] = id.split('_');
  const appearance: Appearance = {
    hair: hairMap[hair as keyof typeof hairMap],
    outfit: outfitMap[outfit as keyof typeof outfitMap],
    skin: skinMap[skin as keyof typeof skinMap],
  };
  const item = EQUIPMENT_CATALOG.find((entry) => entry.id === itemId)!;
  const traveler = {
    ...LAB_TRAVELER,
    appearance,
    avatar: { ...LAB_TRAVELER.avatar, gender },
    inventory: [...EQUIPMENT_CATALOG],
    equipped: { [item.slot]: item.id },
  };
  const visual = equipmentVisualForItem(item, gender);
  const target = BODY_FIT_V2_TARGETS.find(
    (entry) => entry.itemId === itemId && entry.gender === gender,
  )!;
  const reference = metrics.find((entry) => entry.id === id)!;
  const guideLayer = guides ? (
    <svg
      className={css.guides}
      viewBox="0 0 1024 1536"
      aria-label="Guias anatômicas indicativas e contorno HD medido"
    >
      <rect
        x={reference.bounds.left}
        y={reference.bounds.top}
        width={reference.bounds.right - reference.bounds.left + 1}
        height={reference.bounds.bottom - reference.bounds.top + 1}
        fill="none"
        stroke="#007a78"
        strokeWidth="3"
      />
      <line
        x1="0"
        x2="1024"
        y1={reference.footBaseline}
        y2={reference.footBaseline}
        stroke="#b72424"
        strokeWidth="4"
      />
      <line
        x1="512"
        x2="512"
        y1="0"
        y2="1536"
        stroke="#007a78"
        strokeDasharray="10 10"
        strokeWidth="2"
      />
      {Object.entries(BODY_ANCHORS[gender]).map(([name, point]) => (
        <g key={name}>
          <circle
            cx={point.x * 1024}
            cy={point.y * 1536}
            r="7"
            fill="#bd287c"
          />
          <text
            x={point.x * 1024 + 12}
            y={point.y * 1536}
            fontSize="22"
            fill="#75104b"
          >
            {name}
          </text>
        </g>
      ))}
    </svg>
  ) : null;
  return (
    <details className={css.panel} data-body-fit-lab>
      <summary>Body-Fit V2 · inspeção HD DEV</summary>
      <p>
        Dados sintéticos, sem gravação. Somente READY com aprovação humana por
        gênero aparece no corpo. Nenhum asset é aprovado pelo lab.
      </p>
      <div className={css.controls}>
        <label>
          Gênero Body-Fit
          <select
            value={gender}
            onChange={(event) => {
              const next = event.target.value as typeof gender;
              setGender(next);
              setId(`${next}_short_moss_medium`);
            }}
          >
            <option value="female">Feminino</option>
            <option value="male">Masculino</option>
          </select>
        </label>
        <label>
          Avatar HD Body-Fit
          <select value={id} onChange={(event) => setId(event.target.value)}>
            {AVATAR_HD_APPROVED.filter((entry) => entry.gender === gender).map(
              (entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.id}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          Item Body-Fit
          <select
            value={itemId}
            onChange={(event) => setItemId(event.target.value)}
          >
            {EQUIPMENT_CATALOG.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Comparação Body-Fit
          <select
            value={comparison}
            onChange={(event) =>
              setComparison(event.target.value as typeof comparison)
            }
          >
            <option value="side">Sem / com equipamento</option>
            <option value="split">50/50 deslizante</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          Ligar overlay Body-Fit
        </label>
        <label>
          <input
            type="checkbox"
            checked={guides}
            onChange={(event) => setGuides(event.target.checked)}
          />
          Guias Body-Fit
        </label>
        <label>
          <input
            type="checkbox"
            checked={silhouette}
            onChange={(event) => setSilhouette(event.target.checked)}
          />
          Silhueta Body-Fit
        </label>
        <label>
          Zoom Body-Fit · {zoom}%
          <input
            type="range"
            min="50"
            max="200"
            step="25"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>
        {comparison === 'split' && (
          <label>
            Divisão Body-Fit · {split}%
            <input
              type="range"
              min="0"
              max="100"
              value={split}
              onChange={(event) => setSplit(Number(event.target.value))}
            />
          </label>
        )}
      </div>
      <p data-body-fit-status>
        {visual.visualQuality} · Camadas READY: {visual.layers.length}.{' '}
        {visual.visualOverlayUnavailable
          ? 'Visual corporal em preparação.'
          : 'Fonte corporal aprovada.'}
      </p>
      <p data-body-fit-target>
        {target.filename} · {target.priority} ·{' '}
        {target.expectedLandmarks.join('; ')}.
      </p>
      <p>
        Verde: bounding box HD alpha ≥128; vermelho: baseline medida{' '}
        {reference.footBaseline} px. Pontos magenta: anchors históricos
        indicativos, ainda sem validação anatômica HD. Alinhamento de
        equipamento, hairline, grip e oclusão aguardam arte V2 e revisão humana.
      </p>
      <div className={css.scroll}>
        <div
          className={css.comparison}
          data-body-fit-comparison={comparison}
          style={
            { '--body-fit-width': `${(256 * zoom) / 100}px` } as CSSProperties
          }
        >
          <section className={css.frame} data-body-fit-before>
            <span>Sem equipamento</span>
            <div
              className={`${css.canvas} ${silhouette ? css.silhouette : ''}`}
            >
              <AvatarRuntime traveler={traveler} showEquipment={false} />
              {guideLayer}
            </div>
          </section>
          <section
            className={`${css.frame} ${comparison === 'split' ? css.split : ''}`}
            data-body-fit-after
            style={
              comparison === 'split'
                ? { clipPath: `inset(0 0 0 ${split}%)` }
                : undefined
            }
          >
            <span>Com equipamento</span>
            <div
              className={`${css.canvas} ${silhouette ? css.silhouette : ''}`}
            >
              <AvatarRuntime traveler={traveler} showEquipment={enabled} />
              {guideLayer}
            </div>
          </section>
          {comparison === 'split' && (
            <div
              className={css.divider}
              style={{ left: `${split}%` }}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </details>
  );
}
