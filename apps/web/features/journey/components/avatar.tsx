import type { Appearance, AvatarConfig } from '../domain/traveler';
import { AvatarRuntime } from './avatar-runtime';
import styles from '../journey.module.css';
// Compatibility adapter for editor/legacy callers; one central pipeline.
export function Avatar({
  appearance,
  avatar,
  small = false,
}: {
  appearance: Appearance;
  avatar?: AvatarConfig;
  small?: boolean;
}) {
  return (
    <AvatarRuntime
      traveler={{ appearance, avatar }}
      showEquipment={false}
      mode={small ? 'thumbnail' : 'card'}
      className={small ? styles.avatarSmall : styles.avatar}
    />
  );
}
