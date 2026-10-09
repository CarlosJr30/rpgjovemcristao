import { useState } from 'react';
import { AvatarRuntime } from '../components/avatar-runtime';
import {
  AVATAR_FACE_IDS,
  resolveAvatarRuntime,
  type AvatarMode,
} from '../data/avatarRuntime';
import { HAIR, OUTFITS, SKIN, type Appearance } from '../domain/traveler';
import { EQUIPMENT_CATALOG } from '../data/equipmentCatalog';
import { LAB_TRAVELER } from './arena-lab-fixtures';
import css from './avatar-runtime-panel.module.css';
/* eslint-disable @next/next/no-img-element -- DEV comparison uses central legacySource and native pixels */
const modes: AvatarMode[] = ['thumbnail', 'card', 'full', 'hero', 'arena'];
const bodies = ['male', 'female'] as const;
export function AvatarRuntimePanel() {
  const [outfit, setOutfit] = useState<Appearance['outfit']>('musgo');
  const [skin, setSkin] = useState<Appearance['skin']>('claro');
  const [showEquipment, setShowEquipment] = useState(true);
  const [reviewPilot, setReviewPilot] = useState(false);
  const fixture = (
    body: (typeof bodies)[number],
    hair: Appearance['hair'],
    face: number,
  ) => ({
    ...LAB_TRAVELER,
    appearance: { hair, outfit, skin },
    avatar: { ...LAB_TRAVELER.avatar, gender: body, face },
    inventory: [...EQUIPMENT_CATALOG],
    equipped: Object.fromEntries(
      EQUIPMENT_CATALOG.map((item) => [item.slot, item.id]),
    ),
  });
  const sample = fixture('female', 'longo', 1);
  return (
    <details className={css.panel} data-avatar-runtime-lab>
      <summary>Avatar Runtime HD V1 · inspeção DEV</summary>
      <p>
        Dados sintéticos, sem gravação. Fontes HD aprovadas 1024×1536, READY_HD;
        fallback legado 512×768. Corpo, rosto e cabelo pré-compostos. IDs de
        rosto são preservados, mas não mudam o rosto pintado. Nenhuma aprovação
        Body-Fit é criada pelo lab.
      </p>
      <label>
        <input
          type="checkbox"
          checked={reviewPilot}
          onChange={(event) => setReviewPilot(event.target.checked)}
        />
        Revisar dois pilotos HD (Geometry Lock aprovado)
      </label>
      {reviewPilot && (
        <section data-hd-pilot-review>
          <h3>Comparação dos pilotos · sem aprovação Body-Fit</h3>
          <p>
            Arte nativa 1024×1536. Geometry Lock aprovado com contorno alpha
            ≥128, status HUMAN_VISUAL_APPROVED. Jogo normal prefere HD aprovado;
            esta revisão não grava saves nem aprova equipamentos.
          </p>
          {bodies.map((body) => {
            const traveler = {
              ...fixture(body, 'curto', 1),
              appearance: {
                hair: 'curto',
                outfit: 'musgo',
                skin: 'medio',
              } as Appearance,
            };
            return (
              <section key={body} data-hd-pilot-body={body}>
                <h4>{body === 'male' ? 'Masculino' : 'Feminino'}</h4>
                <div className={css.variants}>
                  <section className={css.variant} data-hd-legacy>
                    <h4>Legado</h4>
                    <img
                      src={resolveAvatarRuntime(traveler).legacySource}
                      alt={`Legado ${body}`}
                      width={512}
                      height={768}
                      style={{ width: 170, maxWidth: '100%', height: 'auto' }}
                    />
                  </section>
                  {modes.map((mode) => (
                    <section
                      className={css.variant}
                      key={mode}
                      data-hd-pilot-mode={mode}
                    >
                      <h4>HD · {mode}</h4>
                      <AvatarRuntime
                        traveler={traveler}
                        mode={mode}
                        reviewPilot
                        showEquipment={showEquipment}
                      />
                    </section>
                  ))}
                </div>
              </section>
            );
          })}
        </section>
      )}
      <div className={css.controls}>
        <label>
          Roupa do avatar no lab
          <select
            value={outfit}
            onChange={(event) =>
              setOutfit(event.target.value as Appearance['outfit'])
            }
          >
            {OUTFITS.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Tom de pele no lab
          <select
            value={skin}
            onChange={(event) =>
              setSkin(event.target.value as Appearance['skin'])
            }
          >
            {SKIN.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Com equipamentos aprovados</span>
          <input
            type="checkbox"
            checked={showEquipment}
            onChange={(event) => setShowEquipment(event.target.checked)}
          />
        </label>
      </div>
      <p>
        Camadas READY disponíveis nesta composição:{' '}
        <strong data-lab-ready-count>
          {resolveAvatarRuntime(sample, showEquipment).layers.length}
        </strong>
        . Itens pendentes continuam fora do corpo.
      </p>
      <h3>Tamanhos pelo mesmo pipeline</h3>
      <div className={css.variants}>
        {modes.map((mode) => (
          <section key={mode} className={css.variant} data-lab-mode={mode}>
            <h4>{mode}</h4>
            <AvatarRuntime
              traveler={sample}
              mode={mode}
              showEquipment={showEquipment}
              label={`Avatar de teste ${mode}`}
            />
          </section>
        ))}
      </div>
      <h3>Homem/Mulher · cabelo selecionável · IDs de rosto legados</h3>
      <div className={css.matrix}>
        {bodies.flatMap((body) =>
          HAIR.flatMap((hair) =>
            AVATAR_FACE_IDS.map((face) => {
              const traveler = fixture(body, hair, face);
              return (
                <section
                  key={`${body}-${hair}-${face}`}
                  className={css.sample}
                  data-lab-combination={`${body}-${hair}-${face}`}
                >
                  <p>
                    {body === 'female' ? 'Mulher' : 'Homem'} · {hair} · rosto ID{' '}
                    {face} (pré-composto)
                  </p>
                  <AvatarRuntime
                    traveler={traveler}
                    mode="card"
                    showEquipment={showEquipment}
                    label={`Avatar de teste ${body} ${hair} ${face}`}
                  />
                </section>
              );
            }),
          ),
        )}
      </div>
    </details>
  );
}
