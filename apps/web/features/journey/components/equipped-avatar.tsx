import type { EquipmentSlot, Traveler } from '../domain/traveler';
import { equippedOverlayLayers } from '../data/equipmentAssets';
import { AVATAR_CANVAS } from '../data/bodyAnchors';
import { Avatar } from './avatar';
import styles from '../journey.module.css';

/* eslint-disable @next/next/no-img-element -- transparent local equipment layers need exact alignment */
export function EquippedAvatar({ traveler, highlightedSlot, hidingSlot }: {
  traveler: Traveler;
  highlightedSlot?: EquipmentSlot | null;
  hidingSlot?: EquipmentSlot | null;
}) {
  return <div className={styles.avatarComposite} data-body-type={traveler.avatar.gender}>
    <Avatar appearance={traveler.appearance} avatar={traveler.avatar} />
    {equippedOverlayLayers(traveler).map(({ asset, placement, itemId, slot }, index) =>
      <img
        key={`${itemId}-${index}`}
        src={asset}
        alt=""
        aria-hidden="true"
        data-overlay-slot={slot}
        className={`${styles.avatarEquipmentLayer} ${highlightedSlot === slot ? styles.avatarEquipmentArrive : ''} ${hidingSlot === slot ? styles.avatarEquipmentLeaving : ''}`}
        style={{
          left: `${placement.x / AVATAR_CANVAS.width * 100}%`, top: `${placement.y / AVATAR_CANVAS.height * 100}%`,
          width: `${placement.width / AVATAR_CANVAS.width * 100}%`, height: `${placement.height / AVATAR_CANVAS.height * 100}%`,
          transform: `rotate(${placement.rotation}deg)`, zIndex: placement.zIndex,
          clipPath: placement.clipPath, maskImage: placement.maskImage,
        }}
      />,
    )}
  </div>;
}
