'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@rpg/ui';
import {
  DEFAULT_APPEARANCE,
  DEFAULT_AVATAR,
  PROTOTYPE_BASE_STATS,
  validateName,
  type Appearance,
} from '../domain/traveler';
import { registerTraveler, useJourney } from '../state/use-journey';
import { JOURNEY_ROUTES as routes } from '../data/campaign';
import { Shell } from '../components/shell';
import { Avatar } from '../components/avatar';
import styles from '../journey.module.css';

const options = {
  hair: [
    { value: 'curto', label: 'Curto' },
    { value: 'longo', label: 'Longo' },
    { value: 'cacheado', label: 'Cacheado' },
  ],
  outfit: [
    { value: 'musgo', label: 'Musgo' },
    { value: 'ocre', label: 'Ocre' },
    { value: 'azul', label: 'Azul' },
  ],
  skin: [
    { value: 'claro', label: 'Claro' },
    { value: 'medio', label: 'Médio' },
    { value: 'escuro', label: 'Escuro' },
  ],
} as const;
const labels = { hair: 'Cabelo', outfit: 'Roupa', skin: 'Tom de pele' };
export function CreateScreen() {
  const [name, setName] = useState('');
  const [appearance, setAppearance] = useState<Appearance>({
    ...DEFAULT_APPEARANCE,
  });
  const [bodyType, setBodyType] = useState<'male' | 'female'>('male');
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const state = useJourney();
  const router = useRouter();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = validateName(name);
    setNameError(invalid);
    if (invalid) {
      event.currentTarget.querySelector('input')?.focus();
      return;
    }
    const failure = registerTraveler(name, appearance, bodyType);
    setError(failure);
    if (!failure) router.push(routes.intro);
  }
  return (
    <Shell back="/" backLabel="Voltar ao início">
      <section className={styles.createSection}>
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>01 — SEU PRIMEIRO PASSO</p>
          <h1>Sua jornada começa aqui</h1>
          <p>
            Antes de atravessar histórias que marcaram gerações,
            <br /> crie o viajante que irá acompanhá-las.
          </p>
        </div>
        {state.status === 'ready' ? (
          <div className={styles.emptyState}>
            <h2>Seu Viajante já está pronto.</h2>
            <p>Continue o caminho de {state.traveler.name}.</p>
            <Link className={styles.primaryLink} href={routes.map}>
              Continuar jornada →
            </Link>
          </div>
        ) : (
          <div className={styles.createGrid}>
            <aside className={styles.characterStage}>
              <span className={styles.eyebrow}>UM NOVO VIAJANTE</span>
              <div className={styles.avatarScene}>
                <span className={styles.avatarHalo} />
                <Avatar appearance={appearance} avatar={{ ...DEFAULT_AVATAR, gender: bodyType }} />
                <span className={styles.pedestal} />
              </div>
              <h2>{name.trim() || 'Seu Viajante'}</h2>
              <p>
                Viajante <span>·</span> Nível 1
              </p>
              <div className={styles.stats} aria-label="Atributos iniciais">
                <div>
                  <strong>{PROTOTYPE_BASE_STATS.life}</strong>Vida
                </div>
                <div>
                  <strong>{PROTOTYPE_BASE_STATS.strength}</strong>Força
                </div>
                <div>
                  <strong>{PROTOTYPE_BASE_STATS.defense}</strong>Defesa
                </div>
                <div>
                  <strong>{PROTOTYPE_BASE_STATS.wisdom}</strong>Sabedoria
                </div>
              </div>
              <p className={styles.statNote}>
                Atributos de jogo. Sabedoria não mede espiritualidade.
              </p>
            </aside>
            <form className={styles.createForm} onSubmit={submit} noValidate>
              {state.status === 'corrupt' && (
                <p role="alert" className={styles.notice}>
                  O registro local não pôde ser recuperado. Criar um novo
                  Viajante substituirá esse registro inválido.
                </p>
              )}
              {state.status === 'unavailable' && (
                <p role="alert" className={styles.notice}>
                  Armazenamento indisponível. Permita que este site salve dados
                  neste navegador para continuar.
                </p>
              )}
              <label className={styles.fieldLabel} htmlFor="traveler-name">
                Nome do Viajante
              </label>
              <input
                id="traveler-name"
                name="traveler-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setNameError(null);
                }}
                maxLength={24}
                autoComplete="off"
                placeholder="Como você será chamado?"
                required
                aria-invalid={Boolean(nameError)}
                aria-describedby={
                  nameError ? 'name-hint name-error' : 'name-hint'
                }
              />
              <p id="name-hint" className={styles.hint}>
                De 2 a 24 caracteres. Escolha um apelido, não precisa ser seu
                nome real.
              </p>
              {nameError && (
                <p id="name-error" role="alert" className={styles.error}>
                  {nameError}
                </p>
              )}
              <div className={styles.formDivider}>
                <span>DEIXE A SUA MARCA</span>
                <span>01 — APARÊNCIA</span>
              </div>
              <fieldset className={styles.options}>
                <legend>Corpo</legend>
                <div>
                  {(['male', 'female'] as const).map((value) => (
                    <label key={value} className={styles.option}>
                      <input type="radio" name="body-type" checked={bodyType === value} onChange={() => setBodyType(value)} />
                      <span>{value === 'male' ? 'Masculino' : 'Feminino'}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {(Object.keys(options) as (keyof Appearance)[]).map((key) => (
                <fieldset className={styles.options} key={key}>
                  <legend>{labels[key]}</legend>
                  <div>
                    {options[key].map((option) => (
                      <label key={option.value} className={styles.option}>
                        <input
                          type="radio"
                          name={key}
                          value={option.value}
                          checked={appearance[key] === option.value}
                          onChange={() =>
                            setAppearance((current) => ({
                              ...current,
                              [key]: option.value,
                            }))
                          }
                        />
                        <span>
                          {key !== 'hair' && (
                            <i
                              className={styles[option.value]}
                              aria-hidden="true"
                            />
                          )}
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              <p className={styles.hint}>
                Seu estilo é só seu. Todos começam com os mesmos atributos.
              </p>
              {error && (
                <p role="alert" className={styles.error}>
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className={styles.primary}
                disabled={
                  state.status === 'loading' || state.status === 'unavailable'
                }
              >
                Criar Viajante <span aria-hidden="true">→</span>
              </Button>
              <p className={styles.micro}>
                Salvo apenas neste navegador. Nenhuma conta necessária.
              </p>
            </form>
          </div>
        )}
      </section>
    </Shell>
  );
}
