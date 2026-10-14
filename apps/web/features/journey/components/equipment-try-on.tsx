'use client';
import { useMemo, useState, type MouseEvent, type CSSProperties } from 'react';
import type { Equipment, Traveler } from '../domain/traveler';
import { resolveAvatarIdentity } from '../data/avatarRuntime';
import { equipmentVisualForItem } from '../data/equipmentAssets';
import { ContextPanel } from './context-panel';
import { AvatarRuntime } from './avatar-runtime';
import { EquipmentComparison } from './equipment-comparison';
import portal from './equipment-portal.module.css';

/** A temporary loadout copy: trying on never writes inventory, attributes or saves. */
export function EquipmentTryOn({
  traveler,
  item,
  open,
  busy,
  onClose,
  onEquip,
}: {
  traveler: Traveler;
  item: Equipment;
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onEquip: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const [before, setBefore] = useState(false);
  const [zoom, setZoom] = useState(1);
  const candidate = useMemo(
    () => ({
      ...traveler,
      equipped: { ...traveler.equipped, [item.slot]: item.id },
      avatar: {
        ...traveler.avatar,
        equippedItems: { ...traveler.equipped, [item.slot]: item.id },
      },
    }),
    [traveler, item],
  );
  const visual = equipmentVisualForItem(
    item,
    traveler.avatar.gender,
    resolveAvatarIdentity(traveler).source,
  );
  const equipped = traveler.equipped[item.slot] === item.id;
  return (
    <ContextPanel
      open={open}
      title={`Experimentar · ${item.name}`}
      onClose={onClose}
    >
      <p className={portal.previewNotice}>
        Pré-visualização. O equipamento só muda quando você confirma Equipar.
      </p>
      <div className={portal.previewControls} aria-label="Comparação do Avatar">
        <button aria-pressed={before} onClick={() => setBefore(true)}>
          Antes
        </button>
        <button aria-pressed={!before} onClick={() => setBefore(false)}>
          Depois
        </button>
        <label>
          Zoom
          <select
            aria-label="Zoom"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          >
            <option value={1}>Corpo inteiro</option>
            <option value={1.5}>1,5×</option>
            <option value={2}>2×</option>
            <option value={3}>3×</option>
          </select>
        </label>
      </div>
      <div
        className={portal.previewViewport}
        tabIndex={0}
        aria-label="Avatar ampliado; role para inspecionar"
        data-preview-before={before}
      >
        <div
          className={portal.previewCanvas}
          style={{ '--preview-zoom': zoom } as CSSProperties}
        >
          <AvatarRuntime
            traveler={before ? traveler : candidate}
            label={
              before
                ? 'Avatar com os equipamentos atuais'
                : `Avatar experimentando ${item.name}`
            }
          />
        </div>
      </div>
      <p>
        {before ? 'Antes: seus equipamentos atuais.' : `Depois: ${item.name}.`}
      </p>
      {visual.visualOverlayUnavailable && (
        <p className={portal.previewNotice}>
          Este item mantém os bônus do catálogo. O visual corporal desta
          aparência ainda está em preparação; a prévia conserva seu Avatar.
        </p>
      )}
      <EquipmentComparison traveler={traveler} item={item} expanded />
      <button
        className={portal.previewConfirm}
        disabled={busy || equipped}
        onClick={onEquip}
      >
        {equipped ? 'Já equipado' : 'Equipar este item'}
      </button>
    </ContextPanel>
  );
}
