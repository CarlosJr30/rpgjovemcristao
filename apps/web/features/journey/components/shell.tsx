'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { GAME_NAME } from '@rpg/shared';
import { Avatar } from './avatar';
import { logout, useJourney } from '../state/use-journey';
import { JOURNEY_ROUTES as routes } from '../data/campaign';
import type { Traveler } from '../domain/traveler';
import styles from '../journey.module.css';
import { MAX_LEVEL, TRAVELER_CURRENCY_NAME, xpForLevel } from '../data/progression';
const primaryLinks = [
  ['hero', 'Herói', '✦'], ['map', 'Jornada', '⌁'], ['garden', 'Missões', '◇'],
  ['equipment', 'Equipamentos', '◈'], ['backpack', 'Mochila', '▱'],
  ['shop', 'Loja', '◈'], ['collection', 'Coleção', '◇'],
  ['diary', 'Diário', '☼'], ['guild', 'Guilda', '⚑'],
  ['arena', 'Arena', '⚔'],
] as const;

export function Shell({
  children,
  back,
  backLabel = 'Voltar ao mapa',
}: {
  children: ReactNode;
  back?: string;
  backLabel?: string;
}) {
  const state = useJourney();
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [gainNotice, setGainNotice] = useState('');
  const previous = useRef<{ id: string; level: number; coins: number } | null>(null);
  useEffect(() => {
    if (state.status !== 'ready') { previous.current = null; return; }
    const current = { id: state.traveler.id, level: state.traveler.level, coins: state.traveler.coins };
    const before = previous.current;
    previous.current = current;
    if (!before || before.id !== current.id) return;
    const notice = current.level > before.level
      ? `NÍVEL ${current.level}! ${current.coins > before.coins ? `+${current.coins - before.coins} moedas` : 'Novo marco alcançado'}`
      : current.coins > before.coins ? `+${current.coins - before.coins} ${TRAVELER_CURRENCY_NAME}` : '';
    if (!notice) return;
    const show = window.setTimeout(() => setGainNotice(notice), 0);
    const hide = window.setTimeout(() => setGainNotice(''), 3200);
    return () => { window.clearTimeout(show); window.clearTimeout(hide); };
  }, [state]);
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#main">
        Pular para o conteúdo
      </a>
      <header className={styles.header}>
        <Link
          href="/"
          className={styles.brand}
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
            className={styles.hud}
            onClick={() => setProfileOpen((open) => !open)}
            aria-label="Abrir Herói"
          >
            <Avatar appearance={state.traveler.appearance} avatar={state.traveler.avatar} small />
            <span className={styles.hudIdentity}>
              <strong>{state.traveler.name}</strong>
              <span>Viajante · Nível {state.traveler.level}</span>
            </span>
            <span className={styles.hudValue}>
              {state.traveler.xp} XP<span>{state.traveler.level < MAX_LEVEL ? `${xpForLevel(state.traveler.level + 1) - state.traveler.xp} até nível ${state.traveler.level + 1}` : 'Nível máximo'}</span>
            </span>
            <span
              className={styles.coins}
              aria-label={`${state.traveler.coins} ${TRAVELER_CURRENCY_NAME}`}
            >
              ◈ {state.traveler.coins}
            </span>
            <span className={styles.profileChevron} aria-hidden="true">▼</span>
          </button>
          {profileOpen && <div className={styles.profilePopover} role="menu">
            <Link href={routes.hero} role="menuitem" onClick={() => setProfileOpen(false)}>Meu Herói</Link>
            <button role="menuitem" disabled>Configurações</button>
            <button role="menuitem" onClick={() => { setProfileOpen(false); setConfirmingLogout(true); }}>Sair</button>
          </div>}
          </div>
          <button className={styles.headerLogout} onClick={() => setConfirmingLogout(true)}>Sair</button>
          </div>
        ) : (
          <span className={styles.headerNote}>
            UMA HISTÓRIA. MUITOS CAMINHOS.
          </span>
        )}
      </header>
      {gainNotice && <p className={styles.gainNotice} role="status">{gainNotice}</p>}
      {confirmingLogout && <div className={styles.dialogBackdrop} role="presentation">
        <section className={styles.logoutDialog} role="dialog" aria-modal="true" aria-labelledby="logout-title">
          <h2 id="logout-title">Sair da jornada?</h2>
          <p>Seu progresso continuará salvo e você poderá voltar quando quiser.</p>
          <div><button onClick={() => setConfirmingLogout(false)}>Cancelar</button><button className={styles.primaryLink} onClick={() => { if (logout()) router.replace('/'); }}>Sair</button></div>
        </section>
      </div>}
      {state.status === 'ready' && <button className={styles.mobileMenuButton} aria-expanded={menuOpen} aria-controls="journey-sidebar" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? 'Fechar menu' : 'Abrir menu'}</button>}
      {menuOpen && state.status === 'ready' && <button className={styles.sidebarScrim} aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
      <div className={state.status === 'ready' ? styles.appLayout : styles.plainLayout}>
        {state.status === 'ready' && <aside id="journey-sidebar" className={`${styles.primarySidebar} ${menuOpen ? styles.primarySidebarOpen : ''}`}>
          <div className={styles.sidebarBrand}>RPG<span>JOVEM</span></div>
          <nav aria-label="Navegação principal">
            {primaryLinks.map(([id, label, icon]) => <Link key={id} href={routes[id]} aria-current={pathname === routes[id] ? 'page' : undefined} onClick={() => setMenuOpen(false)}><i aria-hidden="true">{icon}</i>{label}</Link>)}
          </nav>
        </aside>}
        <div className={styles.appContent}>
          {back && state.status !== 'ready' && <nav className={styles.backNav} aria-label="Navegação da jornada"><Link href={back}>← {backLabel}</Link></nav>}
          <main id="main" tabIndex={-1} className={styles.main}>{children}</main>
        </div>
      </div>
      <footer className={styles.footer}>
        <span>{GAME_NAME}</span>
        <span>Explore. Descubra. Continue.</span>
        <span>
          {state.status === 'ready'
            ? 'Jornada salva neste navegador'
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
    if (state.status !== 'loading' && state.status !== 'ready')
      router.replace('/');
  }, [state.status, router]);
  return state.status === 'ready' ? (
    children(state.traveler)
  ) : (
    <p className={styles.loading} role="status">
      Preparando sua jornada…
    </p>
  );
}
