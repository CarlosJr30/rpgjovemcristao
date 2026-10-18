import Link from 'next/link';
import styles from './card-arena.module.css';
import demo from './arena-demo.module.css';

/** Navigation fixture only: no profile, progression, repositories or AuthProvider. */
export function JourneyPreview() {
  return (
    <main className={demo.root} data-journey-preview="memory-only">
      <p className={demo.notice}>
        PREVIEW · JORNADA FICTÍCIA · Sem login, recompensas ou salvamento.
      </p>
      <section className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <h1>Jornada do Viajante</h1>
            <p>
              Valide a entrada na Arena de Cartas com um personagem fictício.
            </p>
          </div>
        </header>
        <nav aria-label="Navegação da Jornada">
          <Link
            className={styles.primary}
            href="/journey/arena"
            prefetch={false}
          >
            Entrar na Arena de Cartas
          </Link>
        </nav>
        <p>
          Esta prévia permite testar navegação e combate. Mapa, progresso,
          equipamentos pessoais e economia online permanecem indisponíveis.
          Nenhum dado de jogador é carregado.
        </p>
      </section>
    </main>
  );
}
