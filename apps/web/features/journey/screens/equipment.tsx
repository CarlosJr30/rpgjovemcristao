'use client';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Shell, RequireTraveler } from '../components/shell';
import { JOURNEY_ROUTES as routes } from '../data/campaign';
import { equipItem, unequipSlot } from '../state/use-journey';
import type { EquipmentSlot, Traveler } from '../domain/traveler';
import { EquippedAvatar } from '../components/equipped-avatar';
import styles from '../journey.module.css';
import { equipmentIcons } from '../data/avatarAssets';
import { EquipmentStatus, equipmentStateClass } from '../components/equipment-status';
import { EquipmentBibleDetails } from '../components/equipment-bible-details';
import { EquipmentStatBonuses } from '../components/equipment-stat-bonuses';
import { SLOT_INSPIRATION } from '../data/equipmentBible';
import { equipmentAssetForItem } from '../data/avatarAssets';
import { EQUIPMENT_ASSET_MANIFEST, equipmentAnchor, equipmentOverlayForItem } from '../data/equipmentAssets';
import { AVATAR_CANVAS } from '../data/bodyAnchors';
import { calculateTotalAttributes, equipmentSwapDelta, formatAttributeDelta, zeroAttributes } from '../data/attributes';
const slots: [EquipmentSlot, string, string][] = [
  ['helmet', '🪖', 'Elmo'],
  ['armor', '🧥', 'Armadura'],
  ['weapon', '⚔', 'Arma'],
  ['shield', '🛡', 'Escudo'],
  ['boots', '🥾', 'Botas'],
  ['amulet', '✦', 'Medalhão'],
];
const rarityEffect: Record<string, string> = {
  comum: styles.equipCommonEffect,
  incomum: styles.equipUncommonEffect,
  raro: styles.equipRareGlow,
  épico: styles.equipEpicEffect,
  lendário: styles.equipLegendaryEffect,
};
type FlightPiece = {
  src: string; x: number; y: number; width: number; height: number;
  dx: number; dy: number; scaleX: number; scaleY: number; rotation: number;
  clipPath?: string; maskImage?: string; moving: boolean;
};
export function EquipmentScreen() {
  const [slot, setSlot] = useState<EquipmentSlot>('weapon');
  const [equippedAnimationSlot, setEquippedAnimationSlot] = useState<EquipmentSlot | null>(null);
  const [feedback, setFeedback] = useState('');
  const [attributeChange, setAttributeChange] = useState<{ id: number; text: string } | null>(null);
  const [hidingSlot, setHidingSlot] = useState<EquipmentSlot | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attributeChangeId = useRef(0);
  const avatarTarget = useRef<HTMLDivElement>(null);
  const [flight, setFlight] = useState<FlightPiece[] | null>(null);
  useEffect(() => () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current); }, []);
  const finishEquip = (item: Parameters<typeof equipItem>[0], traveler: Traveler) => {
    const deltaText = formatAttributeDelta(equipmentSwapDelta(traveler, item)).join(' · ');
    if (!equipItem(item)) { setFeedback('Equipamento não encontrado na Mochila.'); setFlight(null); return; }
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setEquippedAnimationSlot(item.slot);
    setFeedback(`${item.name} equipado.${deltaText ? ` Atributos: ${deltaText}.` : ''}${EQUIPMENT_ASSET_MANIFEST[item.id]?.status === 'ready' ? ' Agora aparece no Avatar.' : ' Camada corporal ainda precisa de asset compatível.'}`);
    setAttributeChange(deltaText ? { id: ++attributeChangeId.current, text: deltaText } : null);
    setFlight(null);
    setHidingSlot(null);
    feedbackTimer.current = setTimeout(() => setEquippedAnimationSlot(null), 700);
  };
  const equip = (item: Parameters<typeof equipItem>[0], traveler: Traveler, event: MouseEvent<HTMLButtonElement>) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    const source = event.currentTarget.closest('article')?.querySelector('img');
    const target = avatarTarget.current?.querySelector<HTMLElement>('[data-body-type]');
    if (!source || !target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { finishEquip(item, traveler); return; }
    const from = source.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const overlays = equipmentOverlayForItem(item, traveler.avatar.gender);
    const targets = overlays.length ? overlays : [{ asset: equipmentAssetForItem(item), placement: {
      x: equipmentAnchor(item, traveler.avatar.gender).x - 20, y: equipmentAnchor(item, traveler.avatar.gender).y - 20,
      width: 40, height: 40, rotation: 0, clipPath: undefined, maskImage: undefined,
    } }];
    setHidingSlot(item.slot);
    setFlight(targets.map(({ asset, placement }) => {
      const endLeft = to.left + to.width * placement.x / AVATAR_CANVAS.width;
      const endTop = to.top + to.height * placement.y / AVATAR_CANVAS.height;
      const endWidth = to.width * placement.width / AVATAR_CANVAS.width;
      const endHeight = to.height * placement.height / AVATAR_CANVAS.height;
      return {
        src: asset, x: from.left, y: from.top, width: from.width, height: from.height,
        dx: endLeft + endWidth / 2 - (from.left + from.width / 2),
        dy: endTop + endHeight / 2 - (from.top + from.height / 2),
        scaleX: endWidth / from.width, scaleY: endHeight / from.height,
        rotation: placement.rotation, clipPath: placement.clipPath, maskImage: placement.maskImage, moving: false,
      };
    }));
    requestAnimationFrame(() => setFlight((current) => current ? current.map((piece) => ({ ...piece, moving: true })) : null));
    // Let the 620 ms CSS transition reach its exact final box before the saved overlay replaces it.
    feedbackTimer.current = setTimeout(() => finishEquip(item, traveler), 660);
  };
  const unequip = (id: EquipmentSlot, traveler: Traveler) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    const before = calculateTotalAttributes(traveler).total;
    const equipped = { ...traveler.equipped };
    delete equipped[id];
    const after = calculateTotalAttributes({ ...traveler, equipped }).total;
    const delta = zeroAttributes();
    for (const key of Object.keys(delta) as (keyof typeof delta)[]) delta[key] = after[key] - before[key];
    const deltaText = formatAttributeDelta(delta).join(' · ');
    setHidingSlot(id);
    feedbackTimer.current = setTimeout(() => {
      unequipSlot(id); setHidingSlot(null);
      setFeedback(`Equipamento removido do Avatar.${deltaText ? ` Atributos: ${deltaText}.` : ''}`);
      setAttributeChange(deltaText ? { id: ++attributeChangeId.current, text: deltaText } : null);
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180);
  };
  return (
    <Shell back={routes.hero} backLabel="Voltar ao Herói">
      <RequireTraveler>
        {(t) => (
          <section className={styles.equipmentPage}>
            <div className={styles.equipmentPreview}>
              <p className={styles.eyebrow}>PRÉVIA DO VIAJANTE</p>
              <div ref={avatarTarget} className={equippedAnimationSlot ? styles.equipAvatarPose : undefined}>
                <EquippedAvatar traveler={t} highlightedSlot={equippedAnimationSlot} hidingSlot={hidingSlot} />
              </div>
              <h1>{t.name}</h1>
              <p>
                Nível {t.level} · {t.xp} XP
              </p>
            </div>
            <div>
              <p className={styles.eyebrow}>ARSENAL</p>
              <h1>Equipamentos</h1>
              <div className={styles.slotGrid}>
                {slots.map(([id, , label]) => (
                  <button
                    key={id}
                    className={`${slot === id ? styles.slotActive : styles.slotButton} ${equippedAnimationSlot === id ? styles.equipSlotPulse : ''}`}
                    data-slot={id}
                    onClick={() => setSlot(id)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- local slot icon registry */}
                    <img src={equipmentIcons[id]} alt="" width={32} height={32} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <div className={styles.itemShelf}>
                <p className={styles.equipmentSlotTheme}>Tema do slot: {SLOT_INSPIRATION[slot].biblicalTheme} · {SLOT_INSPIRATION[slot].biblicalReference}</p>
                {t.inventory
                  .filter((i) => i.slot === slot)
                  .map((item) => (
                    <article key={item.id} className={`${styles.itemCard} ${equipmentStateClass(t.equipped[slot] === item.id)} ${equippedAnimationSlot === item.slot && t.equipped[slot] === item.id ? rarityEffect[item.rarity] : ''}`}>
                      {item.isNew && <b>NOVO EQUIPAMENTO!</b>}
                      {/* eslint-disable-next-line @next/next/no-img-element -- local item icon registry */}
                      <img className={styles.equipmentItemIcon} src={equipmentAssetForItem(item)} alt="" />
                      <h2>{item.name}</h2>
                      <p>
                        {item.rarity} · poder {item.power}
                      </p>
                      <EquipmentStatBonuses stats={item.stats} delta={t.equipped[slot] === item.id ? undefined : equipmentSwapDelta(t, item)} />
                      <EquipmentStatus equipped={t.equipped[slot] === item.id} item={item} />
                      <EquipmentBibleDetails item={item} />
                      <p>{EQUIPMENT_ASSET_MANIFEST[item.id]?.status === 'ready' ? 'Camada corporal disponível: aparece no Avatar ao equipar.' : 'Camada corporal pendente; o slot equipado permanece salvo.'}</p>
                      <p>
                        ATUAL → NOVO:{' '}
                        {t.equipped[slot] === item.id
                          ? 'Equipado'
                          : 'comparação de atributos acima'}
                      </p>
                      <button
                        className={styles.primaryLink}
                        disabled={Boolean(flight)}
                        onClick={(event) => t.equipped[slot] === item.id ? unequip(slot, t) : equip(item, t, event)}
                      >
                        {t.equipped[slot] === item.id ? 'Desequipar' : 'Equipar'}
                      </button>
                      {t.equipped[slot] === item.id && (
                        <button className={styles.textLink} onClick={() => unequip(slot, t)}>
                          Remover do slot
                        </button>
                      )}
                    </article>
                  ))}
                {!t.inventory.some((i) => i.slot === slot) && (
                  <p>Nenhum item compatível ainda.</p>
                )}
              </div>
              <p className={styles.equipmentFeedback} role="status" aria-live="polite">{feedback}</p>
              {attributeChange && <span key={attributeChange.id} className={styles.attributeChange} aria-hidden="true">{attributeChange.text}</span>}
              {flight?.map((piece, index) => (
                // eslint-disable-next-line @next/next/no-img-element -- imagem local animada entre card e Avatar
                <img key={index} className={styles.equipFlight} src={piece.src} alt="" aria-hidden="true" style={{
                  left: piece.x, top: piece.y, width: piece.width, height: piece.height,
                  transform: piece.moving ? `translate(${piece.dx}px, ${piece.dy}px) scale(${piece.scaleX}, ${piece.scaleY}) rotate(${piece.rotation}deg)` : 'translate(0, 0) scale(1)',
                  clipPath: piece.clipPath, maskImage: piece.maskImage, opacity: piece.moving ? .94 : 1,
                }} />
              ))}
            </div>
          </section>
        )}
      </RequireTraveler>
    </Shell>
  );
}
