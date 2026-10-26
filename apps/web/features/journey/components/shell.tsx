'use client';
import Link from 'next/link';
import {
  useEffect,
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { GAME_NAME } from '@rpg/shared';
import { AvatarRuntime } from './avatar-runtime';
import {
  signOutAccount,
  switchTraveler,
  useJourney,
} from '../state/use-journey';
import { JOURNEY_ROUTES as routes } from '../data/campaign';
import type { Traveler } from '../domain/traveler';
import styles from '../journey.module.css';
import mobile from './mobile-game-mode.module.css';
import {
  MAX_LEVEL,
  TRAVELER_CURRENCY_NAME,
  xpForLevel,
} from '../data/progression';
import {
  getOnlineSyncStatus,
  subscribeOnlineSync,
} from '../../../lib/supabase/online-sync';
import { useAuth } from '../../../lib/supabase/auth-context';
import { JourneyIcon } from './journey-icon';
import { AudioSettings } from './audio-settings';
import { useGameAudio } from '../hooks/use-game-audio';
import { DEFAULT_AUDIO_PREFERENCES, gameAudio } from '../audio/audio-manager';
import { MUSIC_ASSETS } from '../audio/audio-assets';
import { safeEntryReturn } from '../../../lib/supabase/auth-return';
const primaryLinks = [
  ['hero', 'Herói', '✦'],
  ['map', 'Jornada', '⌁'],
  ['garden', 'Missões', '◇'],
  ['equipment', 'Equipamentos', '◈'],
  ['backpack', 'Mochila', '▱'],
  ['shop', 'Loja', '◈'],
  ['collection', 'Coleção', '◇'],
  ['diary', 'Diário', '☼'],
  ['guild', 'Guilda', '⚑'],
  ['arena', 'Arena', '⚔'],
] as const;
const releasedLinks = [
  { id: 'home', label: 'Início', href: '/journey', icon: 'map' },
  { id: 'hero', label: 'Meu avatar', href: '/journey/hero', icon: 'hero' },
  { id: 'guild', label: 'Guilda', href: '/journey/guild', icon: 'guild' },
  { id: 'ebd', label: 'EBD', href: '/journey/guild/ebd', icon: 'diary' },
] as const;

export function Shell({
  children,
  back,
  backLabel = 'Voltar ao mapa',
  navigationMode = 'journey',
  className = '',
}: {
  children: ReactNode;
  back?: string;
  backLabel?: string;
  navigationMode?: 'journey' | 'released';
  className?: string;
}) {
  const state = useJourney();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const released = navigationMode === 'released';
  const links = released
    ? releasedLinks
    : primaryLinks.map(([id, label]) => ({
        id,
        label,
        href: routes[id],
        icon: id,
      }));
  const audioPreferences = useGameAudio(
    pathname ?? '/',
    state.status === 'ready' ? state.traveler.progress?.gardenStep : undefined,
  );
  const [audioOpen, setAudioOpen] = useState(false);
  const closeAudio = useCallback(() => setAudioOpen(false), []);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingTravelerSwitch, setConfirmingTravelerSwitch] =
    useState(false);
  const [gainNotice, setGainNotice] = useState('');
  const switchDialog = useRef<HTMLElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const profileTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!confirmingTravelerSwitch) return;
    const previousFocus =
      document.activeElement === document.body
        ? profileTrigger.current
        : (document.activeElement as HTMLElement | null);
    const dialog = switchDialog.current;
    dialog?.querySelector('button')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setConfirmingTravelerSwitch(false);
      if (event.key !== 'Tab' || !dialog) return;
      const controls = Array.from(
        dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
      );
      const first = controls[0],
        last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [confirmingTravelerSwitch]);
  useEffect(() => {
    if (!menuOpen) return;
    const trigger = menuTrigger.current;
    const sidebar = document.getElementById('journey-sidebar');
    const previousOverflow = document.body.style.overflow;
    if (released) document.body.style.overflow = 'hidden';
    document.querySelector<HTMLElement>('#journey-sidebar a')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
      if (released && event.key === 'Tab' && sidebar) {
        const controls = Array.from(
          sidebar.querySelectorAll<HTMLElement>(
            'a[href], button:not(:disabled)',
          ),
        );
        const first = controls[0],
          last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    const close = () => setMenuOpen(false);
    const desktop = window.matchMedia?.('(min-width: 1025px)');
    const resize = () => {
      if (desktop?.matches) close();
    };
    document.addEventListener('keydown', handleKey);
    window.addEventListener('popstate', close);
    desktop?.addEventListener('change', resize);
    return () => {
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('popstate', close);
      desktop?.removeEventListener('change', resize);
      if (released) document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [menuOpen, released]);
  const onlineSync = useSyncExternalStore(
    subscribeOnlineSync,
    getOnlineSyncStatus,
    getOnlineSyncStatus,
  );
  const previous = useRef<{
    id: string;
    level: number;
    coins: number;
    xp: number;
  } | null>(null);
  const noticeTimers = useRef<number[]>([]);
  useEffect(() => () => noticeTimers.current.forEach(window.clearTimeout), []);
  useEffect(() => {
    if (state.status !== 'ready') {
      previous.current = null;
      return;
    }
    const current = {
      id: state.traveler.id,
      level: state.traveler.level,
      coins: state.traveler.coins,
      xp: state.traveler.xp,
    };
    const before = previous.current;
    previous.current = current;
    if (!before || before.id !== current.id) return;
    const rewards = [
      current.xp > before.xp ? `+${current.xp - before.xp} XP` : '',
      current.coins > before.coins
        ? `+${current.coins - before.coins} ${TRAVELER_CURRENCY_NAME}`
        : '',
    ].filter(Boolean);
    const notice = [
      current.level > before.level ? `NÍVEL ${current.level}!` : '',
      ...rewards,
    ]
      .filter(Boolean)
      .join(' · ');
    if (!notice) return;
    gameAudio.playEffect(current.level > before.level ? 'levelUp' : 'reward');
    noticeTimers.current.forEach(window.clearTimeout);
    const show = window.setTimeout(() => setGainNotice(notice), 0);
    const hide = window.setTimeout(() => setGainNotice(''), 3200);
    noticeTimers.current = [show, hide];
  }, [state]);
  return (
    <div
      className={`${styles.shell} ${mobile.gameShell} ${className}`}
      data-game-shell="mobile-game-mode-v1"
      data-navigation-mode={navigationMode}
      onClickCapture={(event) => {
        if (
          event.target instanceof HTMLElement &&
          event.target.closest('button:not(:disabled), a')
        )
          gameAudio.playEffect('ui');
      }}
    >
      <a className={styles.skip} href="#main">
        Pular para o conteúdo
      </a>
      <header className={`${styles.header} ${mobile.gameHeader}`}>
        <Link
          href="/"
          className={`${styles.brand} ${state.status === 'ready' && !released ? mobile.readyBrand : ''}`}
          aria-label="RPG Jovem Cristão — início"
        >
          <span className={styles.brandMark} aria-hidden="true">
            ✧
          </span>
          <span>
            RPG<span className={styles.brandSub}>JOVEM CRISTÃO</span>
          </span>
        </Link>
        {state.status === 'ready' ? (
          <div className={styles.headerActions}>
            <div className={styles.profileMenu}>
              <button
                ref={profileTrigger}
                className={`${styles.hud} ${mobile.playerHud}`}
                onClick={() => {
                  setMenuOpen(false);
                  setProfileOpen((open) => !open);
                }}
                aria-label="Abrir Herói"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                aria-controls="journey-account-menu"
              >
                <AvatarRuntime
                  traveler={state.traveler}
                  mode="thumbnail"
                  decorative
                />
                <span className={styles.hudIdentity}>
                  <strong>{state.traveler.name}</strong>
                  <span>
                    <span className={mobile.desktopContext}>Viajante</span>
                    <span className={mobile.mobileContext}>
                      {released
                        ? ''
                        : (links.find((link) => pathname === link.href)
                            ?.label ?? 'Jornada')}
                    </span>{' '}
                    {released ? (
                      <span className={mobile.desktopContext}>· </span>
                    ) : (
                      '· '
                    )}
                    Nível {state.traveler.level}
                  </span>
                </span>
                <span className={styles.hudValue}>
                  {state.traveler.xp} XP
                  <span>
                    {state.traveler.level < MAX_LEVEL
                      ? `${xpForLevel(state.traveler.level + 1) - state.traveler.xp} até nível ${state.traveler.level + 1}`
                      : 'Nível máximo'}
                  </span>
                </span>
                <span
                  className={styles.coins}
                  aria-label={`${state.traveler.coins} ${TRAVELER_CURRENCY_NAME}`}
                >
                  ◈ {state.traveler.coins}
                </span>
                <span className={styles.profileChevron} aria-hidden="true">
                  ▼
                </span>
              </button>
              {profileOpen && (
                <div
                  id="journey-account-menu"
                  className={styles.profilePopover}
                  role="menu"
                >
                  <Link
                    href={routes.hero}
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                  >
                    {released ? 'Meu avatar' : 'Meu Herói'}
                  </Link>
                  <span className={mobile.mobilePlayerStats}>
                    {state.traveler.xp} XP · {state.traveler.coins}{' '}
                    {TRAVELER_CURRENCY_NAME}
                  </span>
                  {auth.status === 'signedOut' && (
                    <Link
                      href="/auth"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                    >
                      Sincronizar conta
                    </Link>
                  )}
                  <button
                    role="menuitem"
                    onClick={() => {
                      setProfileOpen(false);
                      setConfirmingTravelerSwitch(true);
                    }}
                  >
                    Trocar Viajante
                  </button>
                  <Link
                    href={routes.create}
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                  >
                    Criar novo Viajante
                  </Link>
                  {auth.status === 'signedIn' && (
                    <button
                      role="menuitem"
                      onClick={async () => {
                        setProfileOpen(false);
                        if (await signOutAccount()) router.replace('/auth');
                      }}
                    >
                      Sair da conta
                    </button>
                  )}
                  <button role="menuitem" disabled>
                    Configurações
                  </button>
                </div>
              )}
            </div>
            {!released && (
              <button
                className={styles.headerLogout}
                onClick={() => setConfirmingTravelerSwitch(true)}
              >
                Trocar Viajante
              </button>
            )}
          </div>
        ) : (
          <span className={styles.headerNote}>
            UMA HISTÓRIA. MUITOS CAMINHOS.
          </span>
        )}
        <button
          className={styles.audioLauncher}
          aria-label="Configurações de áudio"
          aria-haspopup="dialog"
          onClick={() => setAudioOpen(true)}
        >
          <span aria-hidden="true">♫</span>
        </button>
        {state.status === 'ready' && (
          <button
            ref={menuTrigger}
            className={`${styles.mobileMenuButton} ${mobile.moreButton}`}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            aria-controls="journey-sidebar"
            onClick={() => {
              setProfileOpen(false);
              setMenuOpen((open) => !open);
            }}
          >
            <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
          </button>
        )}
      </header>
      {audioOpen && (
        <AudioSettings preferences={audioPreferences} onClose={closeAudio} />
      )}
      {gainNotice && (
        <p
          key={gainNotice}
          className={styles.gainNotice}
          data-level-up={gainNotice.startsWith('NÍVEL')}
          role="status"
        >
          {gainNotice}
        </p>
      )}
      {confirmingTravelerSwitch && (
        <div className={styles.dialogBackdrop} role="presentation">
          <section
            ref={switchDialog}
            className={styles.logoutDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="traveler-switch-title"
          >
            <h2 id="traveler-switch-title">Trocar de Viajante?</h2>
            <p>
              Sua conta continuará conectada e nenhum Viajante será apagado.
            </p>
            <div>
              <button onClick={() => setConfirmingTravelerSwitch(false)}>
                Cancelar
              </button>
              <button
                className={styles.primaryLink}
                onClick={() => {
                  if (switchTraveler()) router.replace('/');
                }}
              >
                Trocar Viajante
              </button>
            </div>
          </section>
        </div>
      )}
      {onlineSync.message && (
        <p className={styles.notice} role="status">
          {onlineSync.message}
        </p>
      )}
      {!released && auth.user && (
        <p className={styles.notice} role="note">
          Economia em transição: recompensas da Jornada e compras de
          equipamentos estão pausadas nesta versão. Trocas de equipamento exigem
          confirmação do servidor. Progresso local não concede XP, moedas ou
          baús online. Arena e Torre consultam somente o servidor; saldos
          antigos aguardam reconciliação.
        </p>
      )}
      {menuOpen && state.status === 'ready' && (
        <button
          className={styles.sidebarScrim}
          aria-label={released ? 'Fechar menu pelo fundo' : 'Fechar menu'}
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div
        className={
          state.status === 'ready' ? styles.appLayout : styles.plainLayout
        }
      >
        {state.status === 'ready' && (
          <aside
            id="journey-sidebar"
            className={`${styles.primarySidebar} ${menuOpen ? styles.primarySidebarOpen : ''}`}
            role={released && menuOpen ? 'dialog' : undefined}
            aria-modal={released && menuOpen ? true : undefined}
            aria-label={released && menuOpen ? 'Menu principal' : undefined}
          >
            <div className={styles.sidebarBrand}>
              RPG<span>JOVEM</span>
            </div>
            {released && (
              <button
                className={styles.sidebarDismiss}
                aria-label="Fechar navegação"
                onClick={() => setMenuOpen(false)}
              >
                ×
              </button>
            )}
            <nav aria-label="Navegação principal">
              {links.map(({ id, label, href, icon }) => (
                <Link
                  key={id}
                  href={href}
                  aria-current={
                    pathname === href ||
                    (released && id === 'home' && pathname === '/')
                      ? 'page'
                      : undefined
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  <i aria-hidden="true">
                    <JourneyIcon name={icon} />
                  </i>
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
        )}
        <div className={styles.appContent}>
          {back && state.status !== 'ready' && (
            <nav className={styles.backNav} aria-label="Navegação da jornada">
              <Link href={back}>← {backLabel}</Link>
            </nav>
          )}
          <main
            id="main"
            tabIndex={-1}
            inert={menuOpen}
            className={`${styles.main} ${mobile.gameMain}`}
          >
            {process.env.NODE_ENV === 'development' &&
              MUSIC_ASSETS.arena &&
              pathname?.startsWith('/journey/arena') && (
                <section
                  className={styles.arenaAudioPrompt}
                  aria-label="Som da Arena"
                >
                  <p>
                    <strong>Som da Arena</strong>
                    <span>
                      Protótipo não comercial. Clique para ouvir a música e um
                      efeito de teste.
                    </span>
                  </p>
                  <button
                    className={styles.primaryLink}
                    onClick={() => {
                      gameAudio.updatePreferences({
                        music: true,
                        effects: true,
                        muted: false,
                        musicVolume:
                          audioPreferences.musicVolume ||
                          DEFAULT_AUDIO_PREFERENCES.musicVolume,
                        effectsVolume:
                          audioPreferences.effectsVolume ||
                          DEFAULT_AUDIO_PREFERENCES.effectsVolume,
                      });
                      gameAudio.unlock();
                      gameAudio.playEffect('attack');
                    }}
                  >
                    Ativar e testar som
                  </button>
                </section>
              )}
            <div key={pathname} className={styles.areaArrival}>
              {children}
            </div>
          </main>
        </div>
      </div>
      {state.status === 'ready' && !released && (
        <nav
          className={mobile.bottomNav}
          inert={menuOpen}
          aria-label="Navegação do jogo"
        >
          {(['map', 'arena', 'equipment', 'guild', 'diary'] as const).map(
            (id) => (
              <Link
                key={id}
                href={routes[id]}
                prefetch={false}
                aria-current={
                  pathname === routes[id] ||
                  (id === 'map' &&
                    (pathname === '/' ||
                      pathname?.startsWith('/journey/phases/')))
                    ? 'page'
                    : undefined
                }
              >
                <JourneyIcon name={id} />
                <span>
                  {id === 'map'
                    ? 'Jornada'
                    : id === 'equipment'
                      ? 'Equipar'
                      : primaryLinks.find(([key]) => key === id)?.[1]}
                </span>
              </Link>
            ),
          )}
        </nav>
      )}
      <footer className={styles.footer}>
        <span>{GAME_NAME}</span>
        <span>Explore. Descubra. Continue.</span>
        <span>
          {state.status === 'ready'
            ? released
              ? 'Seu progresso continua na sua conta'
              : 'Jornada salva neste navegador'
            : 'Seu próximo passo começa aqui'}
        </span>
      </footer>
    </div>
  );
}

export function RequireTraveler({
  children,
}: {
  children: (traveler: Traveler) => ReactNode;
}) {
  const state = useJourney();
  const router = useRouter();
  useEffect(() => {
    if (state.status !== 'loading' && state.status !== 'ready') {
      const next = safeEntryReturn(
        `${window.location.pathname}${window.location.search}`,
        window.location.origin,
      );
      router.replace(next ? `/?next=${encodeURIComponent(next)}` : '/');
    }
  }, [state.status, router]);
  return state.status === 'ready' ? (
    children(state.traveler)
  ) : (
    <p className={styles.loading} role="status">
      Preparando sua jornada…
    </p>
  );
}
