'use client';
import Image from 'next/image';
import portal from '../components/equipment-portal.module.css';
import { EquipmentComparison } from '../components/equipment-comparison';
import { EquipmentArenaDetails } from '../components/arena-rule-details';
import { EquipmentTryOn } from '../components/equipment-try-on';
import { ATTRIBUTE_LABELS } from '../data/attributes';
import { resolveAvatarIdentity } from '../data/avatarRuntime';
import { travelerBattleSnapshot } from '../data/arena';
import { RARITY_PRESENTATION } from '../data/equipmentCinematic';
import { formatAttributeBonuses, equippedItems } from '../data/attributes';
import { gameAudio } from '../audio/audio-manager';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Shell, RequireTraveler } from '../components/shell';
import { JOURNEY_ROUTES as routes } from '../data/campaign';
import { equipItem, unequipSlot } from '../state/use-journey';
import { getCurrentOnlineUserId } from '../../../lib/supabase/online-sync';
import { changeOnlineEquipment } from '../../../lib/supabase/online-equipment';
import type { EquipmentSlot, Traveler } from '../domain/traveler';
import { EquippedAvatar } from '../components/equipped-avatar';
import styles from '../journey.module.css';
import { equipmentIcons } from '../data/avatarAssets';
import { equipmentStateClass } from '../components/equipment-status';
import { EquipmentBibleDetails } from '../components/equipment-bible-details';
import { EquipmentStatBonuses } from '../components/equipment-stat-bonuses';
import { SLOT_INSPIRATION } from '../data/equipmentBible';
import { equipmentAssetForItem } from '../data/avatarAssets';
import { equipmentVisualForItem } from '../data/equipmentAssets';
import { EQUIP_ANIMATION_TIMING } from '../data/equipmentAnimation';
import {
  cinematicGeometry,
  equipmentReward,
  signedValue,
} from '../data/equipmentCinematic';
import { useEquipmentCinematic } from '../hooks/use-equipment-cinematic';
import { EquipmentEquipCinematic } from '../components/equipment-equip-cinematic';
import cinematicStyles from '../components/equipment-cinematic.module.css';
import {
  ResponsivePanel,
  useCompactGameLayout,
} from '../components/responsive-panel';
import {
  calculateTotalAttributes,
  equipmentSwapDelta,
  formatAttributeDelta,
  zeroAttributes,
} from '../data/attributes';
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
export function EquipmentScreen({
  serverConfirmedOnly = false,
}: {
  serverConfirmedOnly?: boolean;
}) {
  const compact = useCompactGameLayout();
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [selected, setSelected] = useState<{
    travelerId: string;
    itemId: string;
  } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [availability, setAvailability] = useState('all');
  const [rarity, setRarity] = useState('all');
  const [slot, setSlot] = useState<EquipmentSlot>('weapon');
  const [equippedAnimationSlot, setEquippedAnimationSlot] =
    useState<EquipmentSlot | null>(null);
  const [feedback, setFeedback] = useState('');
  const [attributeChange, setAttributeChange] = useState<{
    id: number;
    text: string;
  } | null>(null);
  const [hidingSlot, setHidingSlot] = useState<EquipmentSlot | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attributeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attributeChangeId = useRef(0);
  const avatarTarget = useRef<HTMLDivElement>(null);
  const cinematic = useEquipmentCinematic();
  const [removing, setRemoving] = useState(false);
  const [onlineBusy, setOnlineBusy] = useState(false);
  const pending = useRef(false);
  const live = useRef(true);
  const busy = cinematic.busy || removing || onlineBusy;
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  const confirmOnline = async (
    traveler: Traveler,
    id: EquipmentSlot,
    itemId: string | null,
  ) => {
    if (pending.current) return;
    pending.current = true;
    setOnlineBusy(true);
    setFeedback('Confirmando equipamento no servidor…');
    try {
      await changeOnlineEquipment(
        traveler.id,
        id,
        itemId,
        traveler.equipped[id] ?? null,
      );
      if (live.current)
        setFeedback(
          'Equipamento confirmado pelo servidor. Mochila e atributos atualizados.',
        );
    } catch (error) {
      if (live.current)
        setFeedback(
          error instanceof Error
            ? error.message
            : 'Não foi possível confirmar o equipamento. Atualize para conferir.',
        );
    } finally {
      pending.current = false;
      if (live.current) setOnlineBusy(false);
    }
  };
  useEffect(
    () => () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      if (attributeTimer.current) clearTimeout(attributeTimer.current);
    },
    [],
  );
  const finishEquip = (
    item: Parameters<typeof equipItem>[0],
    traveler: Traveler,
  ) => {
    const reward = equipmentReward(traveler, item);
    const deltaText = formatAttributeDelta(
      equipmentSwapDelta(traveler, item),
    ).join(' · ');
    if (!equipItem(item)) {
      setFeedback('Equipamento não encontrado na Mochila.');
      setHidingSlot(null);
      return false;
    }
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    const visual = equipmentVisualForItem(
      item,
      traveler.avatar.gender,
      resolveAvatarIdentity(traveler).source,
    );
    setEquippedAnimationSlot(item.slot);
    setFeedback(
      `${item.name} equipado. ${reward.beforePower} → ${reward.afterPower} PODER (${signedValue(reward.powerDelta)}).${deltaText ? ` Atributos: ${deltaText}.` : ''}${visual.visualOverlayUnavailable ? ' Camada corporal pendente; o item mantém seus atributos.' : ' Agora aparece no Avatar.'}`,
    );
    setAttributeChange({
      id: ++attributeChangeId.current,
      text: `${signedValue(reward.powerDelta)} PODER${deltaText ? ` · ${deltaText}` : ''}`,
    });
    if (attributeTimer.current) clearTimeout(attributeTimer.current);
    attributeTimer.current = setTimeout(() => setAttributeChange(null), 900);
    setHidingSlot(null);
    feedbackTimer.current = setTimeout(
      () => setEquippedAnimationSlot(null),
      600,
    );
    gameAudio.playEffect('equipment');
    return true;
  };
  const equip = (
    item: Parameters<typeof equipItem>[0],
    traveler: Traveler,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    if (busy) return;
    if (serverConfirmedOnly || getCurrentOnlineUserId()) {
      void confirmOnline(traveler, item.slot, item.id);
      return;
    }
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    const source = event.currentTarget.closest('article')?.querySelector('img');
    const target =
      avatarTarget.current?.querySelector<HTMLElement>('[data-body-type]');
    setEquippedAnimationSlot(null);
    setAttributeChange(null);
    setHidingSlot(item.slot);
    const viewport = () => ({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    const sourceRect = source?.getBoundingClientRect() ?? null;
    const captureTarget = () =>
      cinematicGeometry(
        sourceRect,
        target?.getBoundingClientRect() ?? null,
        traveler.avatar.gender,
        item.slot,
        viewport(),
      );
    cinematic.start({
      reward: equipmentReward(traveler, item),
      geometry: captureTarget(),
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)')
        .matches,
      captureTarget,
      confirm: () => finishEquip(item, traveler),
    });
  };
  const unequip = (id: EquipmentSlot, traveler: Traveler) => {
    if (busy) return;
    if (serverConfirmedOnly || getCurrentOnlineUserId()) {
      void confirmOnline(traveler, id, null);
      return;
    }
    setRemoving(true);
    setEquippedAnimationSlot(null);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    const before = calculateTotalAttributes(traveler).total;
    const equipped = { ...traveler.equipped };
    delete equipped[id];
    const after = calculateTotalAttributes({ ...traveler, equipped }).total;
    const beforePower = travelerBattleSnapshot(traveler).combatPower;
    const afterPower = travelerBattleSnapshot({
      ...traveler,
      equipped,
    }).combatPower;
    const delta = zeroAttributes();
    for (const key of Object.keys(delta) as (keyof typeof delta)[])
      delta[key] = after[key] - before[key];
    const deltaText = formatAttributeDelta(delta).join(' · ');
    setHidingSlot(id);
    feedbackTimer.current = setTimeout(() => {
      unequipSlot(id);
      setRemoving(false);
      setHidingSlot(null);
      setFeedback(
        `Equipamento removido do slot. ${beforePower} → ${afterPower} PODER (${signedValue(afterPower - beforePower)}).${deltaText ? ` Atributos: ${deltaText}.` : ''}`,
      );
      setAttributeChange(
        deltaText ? { id: ++attributeChangeId.current, text: deltaText } : null,
      );
      if (attributeTimer.current) clearTimeout(attributeTimer.current);
      attributeTimer.current = setTimeout(() => setAttributeChange(null), 900);
    }, EQUIP_ANIMATION_TIMING.leave);
  };
  return (
    <Shell
      navigationMode={serverConfirmedOnly ? 'released' : 'journey'}
      back={routes.hero}
      backLabel="Voltar ao Herói"
    >
      <RequireTraveler>
        {(t) => (
          <section className={portal.portal} data-mobile-screen="equipment">
            <div className={portal.hero}>
              <p className={portal.kicker}>PORTAL DE EQUIPAMENTOS</p>
              <h1>Arsenal do Viajante</h1>
              <div
                ref={avatarTarget}
                className={`${cinematicStyles.hero} ${portal.stage}`}
                data-confirmed={equippedAnimationSlot !== null}
              >
                <EquippedAvatar
                  traveler={t}
                  highlightedSlot={equippedAnimationSlot}
                  hidingSlot={hidingSlot}
                />
                {attributeChange && (
                  <span
                    key={attributeChange.id}
                    className={cinematicStyles.feedback}
                    aria-hidden="true"
                  >
                    {attributeChange.text}
                  </span>
                )}
              </div>
              <h2>{t.name}</h2>
              <p>
                Nível {t.level} · {t.xp} XP
              </p>
              <div className={portal.power}>
                <span>PODER ATUAL</span>
                <strong data-current-power>
                  {travelerBattleSnapshot(t).combatPower}
                </strong>
                <small>{equippedItems(t).length} de 6 slots equipados</small>
              </div>
              <dl
                className={portal.totalAttributes}
                aria-label="Atributos equipados do Viajante"
              >
                {Object.entries(calculateTotalAttributes(t).total).map(
                  ([key, value]) => (
                    <div key={key}>
                      <dt>
                        {ATTRIBUTE_LABELS[key as keyof typeof ATTRIBUTE_LABELS]}
                      </dt>
                      <dd data-current-attribute={key}>{value}</dd>
                    </div>
                  ),
                )}
              </dl>
            </div>
            <div className={portal.workspace}>
              <p className={portal.kicker}>SEU EQUIPAMENTO</p>
              <h2>Equipamentos</h2>
              <p>
                Escolha um slot para explorar a Mochila e preparar sua próxima
                troca.
              </p>
              <div className={portal.slots} aria-label="Slots de equipamentos">
                {slots.map(([id, , label]) => {
                  const current = t.inventory.find(
                    (i) => i.id === t.equipped[id] && i.slot === id,
                  );
                  return (
                    <button
                      key={id}
                      className={`${portal.slot} ${equippedAnimationSlot === id ? styles.equipSlotPulse : ''}`}
                      aria-label={label}
                      aria-describedby={`equipment-slot-${id}`}
                      aria-pressed={slot === id}
                      data-slot={id}
                      onClick={(event) => {
                        setSlot(id);
                        setSelected(null);
                        setPreviewOpen(false);
                        setInventoryOpen(true);
                        if (
                          event.detail > 0 &&
                          window.matchMedia('(max-width: 1024px)').matches
                        )
                          requestAnimationFrame(() => {
                            document
                              .querySelector('#equipment-inventory > summary')
                              ?.scrollIntoView({ block: 'start' });
                            (
                              document.querySelector(
                                '#equipment-inventory > summary',
                              ) as HTMLElement | null
                            )?.focus({ preventScroll: true });
                          });
                      }}
                    >
                      <Image
                        src={
                          current
                            ? equipmentAssetForItem(current)
                            : equipmentIcons[id]
                        }
                        alt=""
                        onError={(event) => {
                          event.currentTarget.hidden = true;
                        }}
                        onLoad={(event) => {
                          event.currentTarget.hidden = false;
                        }}
                        width={32}
                        height={32}
                      />
                      <span>
                        {label}
                        {current && (
                          <b className={portal.equippedMark} aria-hidden="true">
                            ✓
                          </b>
                        )}
                        {equippedAnimationSlot === id && (
                          <span
                            className={cinematicStyles.check}
                            aria-hidden="true"
                          >
                            ✓
                          </span>
                        )}
                      </span>
                      <span id={`equipment-slot-${id}`}>
                        {current ? `${current.name} · equipado` : 'Slot vazio'}
                      </span>
                      <small>
                        {current
                          ? RARITY_PRESENTATION[current.rarity].label
                          : 'Pronto para um equipamento'}
                      </small>
                      <small>
                        {current
                          ? formatAttributeBonuses(current.stats).join(' · ') ||
                            'Sem bônus de atributo'
                          : 'Sem bônus equipado'}
                      </small>
                      <em>
                        {slot === id
                          ? '✓ Selecionado'
                          : current
                            ? 'Trocar equipamento'
                            : 'Escolher equipamento'}
                      </em>
                    </button>
                  );
                })}
              </div>
              <ResponsivePanel
                id="equipment-inventory"
                title={`Mochila · ${slots.find(([id]) => id === slot)?.[2]}`}
                expanded={inventoryOpen}
                onExpandedChange={setInventoryOpen}
              >
                <h2>Mochila · {slots.find(([id]) => id === slot)?.[2]}</h2>
                <div className={portal.filters}>
                  <label>
                    Mostrar
                    <select
                      aria-label="Mostrar"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                    >
                      <option value="all">Todos do slot</option>
                      <option value="available">Equipáveis</option>
                      <option value="equipped">Equipados</option>
                    </select>
                  </label>
                  <label>
                    Raridade
                    <select
                      aria-label="Raridade"
                      value={rarity}
                      onChange={(e) => setRarity(e.target.value)}
                    >
                      <option value="all">Todas as raridades</option>
                      {Object.entries(RARITY_PRESENTATION).map(
                        ([value, config]) => (
                          <option key={value} value={value}>
                            {config.label}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                </div>
                <p className={styles.equipmentSlotTheme}>
                  Tema do slot: {SLOT_INSPIRATION[slot].biblicalTheme} ·{' '}
                  {SLOT_INSPIRATION[slot].biblicalReference}
                </p>
                <div className={portal.shelf}>
                  {t.inventory
                    .filter(
                      (i) =>
                        i.slot === slot &&
                        (rarity === 'all' || i.rarity === rarity) &&
                        (availability === 'all' ||
                          (availability === 'equipped'
                            ? t.equipped[slot] === i.id
                            : t.equipped[slot] !== i.id)),
                    )
                    .map((item) => {
                      const visual = equipmentVisualForItem(
                        item,
                        t.avatar.gender,
                        resolveAvatarIdentity(t).source,
                      );
                      return (
                        <article
                          key={item.id}
                          data-rarity={item.rarity}
                          data-equipped={t.equipped[slot] === item.id}
                          data-selected={
                            selected?.travelerId === t.id &&
                            selected.itemId === item.id
                          }
                          className={`${portal.card} ${equipmentStateClass(t.equipped[slot] === item.id)} ${equippedAnimationSlot === item.slot && t.equipped[slot] === item.id ? rarityEffect[item.rarity] : ''}`}
                        >
                          {item.isNew && <b>NOVO EQUIPAMENTO!</b>}
                          {(!compact || inventoryOpen) && (
                            <Image
                              width={64}
                              height={64}
                              className={styles.equipmentItemIcon}
                              src={equipmentAssetForItem(item)}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              onError={(event) => {
                                event.currentTarget.hidden = true;
                              }}
                              onLoad={(event) => {
                                event.currentTarget.hidden = false;
                              }}
                            />
                          )}
                          <h2>{item.name}</h2>
                          <p>
                            {RARITY_PRESENTATION[item.rarity].label} · poder do
                            item {item.power}
                          </p>
                          <EquipmentStatBonuses
                            stats={item.stats}
                            delta={
                              t.equipped[slot] === item.id
                                ? undefined
                                : equipmentSwapDelta(t, item)
                            }
                          />
                          <span className={portal.available}>
                            {t.equipped[slot] === item.id
                              ? '✓ Equipado'
                              : 'Disponível para equipar'}
                          </span>
                          <EquipmentBibleDetails item={item} />
                          <EquipmentArenaDetails item={item} />
                          <p
                            className={portal.visualNote}
                            data-visual-quality={visual.visualQuality}
                            data-visual-overlay-unavailable={
                              visual.visualOverlayUnavailable
                            }
                          >
                            {visual.visualOverlayUnavailable
                              ? 'Visual corporal em preparação · pode ser equipado e mantém seus atributos.'
                              : 'Camada corporal disponível: aparece no Avatar ao equipar.'}
                          </p>
                          <EquipmentComparison traveler={t} item={item} />
                          <button
                            className={portal.tryOn}
                            disabled={busy}
                            onClick={(event) => {
                              event.currentTarget.focus({
                                preventScroll: true,
                              });
                              setSelected({
                                travelerId: t.id,
                                itemId: item.id,
                              });
                              setPreviewOpen(true);
                            }}
                          >
                            Experimentar
                          </button>
                          <button
                            className={styles.primaryLink}
                            disabled={busy}
                            onClick={(event) =>
                              t.equipped[slot] === item.id
                                ? unequip(slot, t)
                                : equip(item, t, event)
                            }
                          >
                            {t.equipped[slot] === item.id
                              ? 'Desequipar'
                              : 'Equipar'}
                          </button>
                          {t.equipped[slot] === item.id && (
                            <button
                              className={styles.textLink}
                              disabled={busy}
                              onClick={() => unequip(slot, t)}
                            >
                              Remover do slot
                            </button>
                          )}
                        </article>
                      );
                    })}
                  {!t.inventory.some(
                    (i) =>
                      i.slot === slot &&
                      (rarity === 'all' || i.rarity === rarity) &&
                      (availability === 'all' ||
                        (availability === 'equipped'
                          ? t.equipped[slot] === i.id
                          : t.equipped[slot] !== i.id)),
                  ) && (
                    <p>
                      Nenhum item para estes filtros. Escolha Todos do slot ou
                      outra raridade.
                    </p>
                  )}
                </div>
              </ResponsivePanel>
              <p className={portal.feedback} role="status" aria-live="polite">
                {feedback}
              </p>
              {selected?.travelerId === t.id &&
                t.inventory.some((item) => item.id === selected.itemId) && (
                  <>
                    <p className={portal.selectionStatus}>
                      Item selecionado:{' '}
                      <strong>
                        {
                          t.inventory.find(
                            (item) => item.id === selected.itemId,
                          )!.name
                        }
                      </strong>
                      {t.equipped[slot] === selected.itemId
                        ? ' · ✓ Equipado'
                        : ' · Pré-visualização'}
                    </p>
                    <EquipmentTryOn
                      key={`${t.id}:${selected.itemId}:${previewOpen}`}
                      traveler={t}
                      item={t.inventory.find(
                        (item) => item.id === selected.itemId,
                      )!}
                      open={previewOpen}
                      busy={busy}
                      onClose={() => setPreviewOpen(false)}
                      onEquip={(event) => {
                        const item = t.inventory.find(
                          (candidate) => candidate.id === selected.itemId,
                        )!;
                        setPreviewOpen(false);
                        equip(item, t, event);
                      }}
                    />
                  </>
                )}
              <EquipmentEquipCinematic
                session={cinematic.session}
                onSkip={cinematic.skip}
              />
            </div>
          </section>
        )}
      </RequireTraveler>
    </Shell>
  );
}
