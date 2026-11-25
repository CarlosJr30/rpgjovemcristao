import { CREATION_DAYS, creationPassageUrl } from '../../story/creation-days';
import { CREATION_DEMO_FEEDBACK } from '../../story/creation-demo-feedback';
import book from './diary-experience.module.css';

export function CreationDiaryChapter({
  discoveries,
}: {
  discoveries?: readonly string[];
}) {
  return (
    <section
      className={book.panel}
      aria-labelledby="diary-creation-title"
      id="diary-creation"
    >
      <h2 id="diary-creation-title" tabIndex={-1}>
        Diário Bíblico da Criação
      </h2>
      <p>
        Resumos do relato bíblico em revisão editorial. O Santuário, as
        paisagens e os marcos são elementos fictícios do jogo.
      </p>
      <p>
        {discoveries
          ? 'As descobertas valem apenas nesta sessão da demonstração.'
          : 'O estado das descobertas pode ser consultado durante a demonstração.'}
      </p>
      {CREATION_DAYS.map((day, index) => (
        <article key={day.id} className={book.reading}>
          <h3>
            Dia {index + 1} — {day.title}
          </h3>
          <p>{CREATION_DEMO_FEEDBACK[day.id].explanation}</p>
          {discoveries && (
            <p>
              {discoveries.includes(day.id)
                ? 'Descoberto nesta demonstração'
                : 'Ainda não descoberto nesta demonstração'}
            </p>
          )}
          <a
            href={creationPassageUrl(day.passage)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ler {day.reference} (NVI) ↗
          </a>
        </article>
      ))}
    </section>
  );
}
