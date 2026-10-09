import { guildMissionRewards, type GuildRewardTier } from '@rpg/game-engine';
import styles from '../journey.module.css';
import hall from './guild-experience.module.css';
import { GuildArtwork } from './guild-artwork';

export const guildRewardTierLabels: Readonly<Record<GuildRewardTier, string>> =
  {
    normal: 'Normal',
    great: 'Grande',
    epic: 'Épica',
    extraordinary: 'Extraordinária',
  };

export function GuildRewardPreview({ tier }: { tier: GuildRewardTier }) {
  const reward = guildMissionRewards[tier];
  return (
    <p className={styles.guildRewardPreview}>
      <b>Recompensa calculada pelo sistema:</b>
      <span>
        +{reward.xp} XP · +{reward.coins} Moedas do Viajante · +
        {reward.chestQuantity} {reward.chestLabel}
      </span>
      <small>Valores oficiais; não podem ser editados.</small>
    </p>
  );
}

export function GuildRewardDetails({
  tier,
  showChest = false,
}: {
  tier: GuildRewardTier;
  showChest?: boolean;
}) {
  const reward = guildMissionRewards[tier];
  return (
    <div className={styles.guildRewardDetails} aria-label="Recompensa">
      {showChest && reward.chestQuantity > 0 && (
        <GuildArtwork slot="guildRewardChest" className={hall.rewardChest} />
      )}
      <b>RECOMPENSA</b>
      <span>+{reward.xp} XP</span>
      <span>+{reward.coins} Moedas do Viajante</span>
      <span>
        +{reward.chestQuantity} {reward.chestLabel}
      </span>
    </div>
  );
}
