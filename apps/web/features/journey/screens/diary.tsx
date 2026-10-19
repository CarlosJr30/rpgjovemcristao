'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Shell, RequireTraveler } from '../components/shell';
import {
  CAMPAIGN,
  GARDEN,
  GARDEN_CONTENT,
  JOURNEY_ROUTES as routes,
} from '../data/campaign';
import { saveDiaryEntry } from '../state/use-journey';
import { EquipmentBibleDetails } from '../components/equipment-bible-details';
import { equipmentAssetForItem } from '../data/avatarAssets';
import { JourneySpotlight } from '../components/journey-spotlight';
import { diaryView, type DiaryEvent } from '../data/diaryView';
import book from '../components/diary-experience.module.css';

const displayDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value));
function EventList({ events }: { events: DiaryEvent[] }) {
  return (
    <ol className={book.timeline}>
      {events.map((event) => (
        <li key={event.id} data-diary-event={event.id}>
          <strong>{event.title}</strong>
          <span>
            {GARDEN.title} · {event.status}
          </span>
          {event.date ? (
            <time dateTime={event.date}>{displayDate(event.date)}</time>
          ) : (
            <span>Data de conclusão não registrada</span>
          )}
        </li>
      ))}
    </ol>
  );
}

export function DiaryScreen() {
  const [registeredTraveler, setRegisteredTraveler] = useState<string | null>(
    null,
  );
  const [feedback, setFeedback] = useState<{
    travelerId: string;
    text: string;
  } | null>(null);
  return (
    <Shell back={routes.map} backLabel="Voltar ao mapa">
      <RequireTraveler>
        {(traveler) => {
          const view = diaryView(traveler),
            p = traveler.progress;
          return (
            <article className={book.book}>
              <header className={book.cover}>
                <p className={book.kicker}>
                  CADERNO DE VIAGEM · ATO {CAMPAIGN[0].numeral}
                </p>
                <h1>Diário do Viajante</h1>
                <p className={book.identity}>
                  {traveler.name} · Nível {traveler.level} · {CAMPAIGN[0].title}
                </p>
                <p>
                  Um espaço de participação e memória. Suas respostas não são
                  avaliadas.
                </p>
                <p>
                  Fase {GARDEN.order} · {GARDEN.title}
                </p>
              </header>
              <div className={book.pages}>
                <section className={book.next} aria-label="Próximo objetivo">
                  <JourneySpotlight traveler={traveler} />
                  {p.gardenCompleted && (
                    <p data-diary-guild-state>
                      {view.guildStatus}
                      {' · Atividade da Guilda independente do Modo História'}.
                    </p>
                  )}
                  <dl className={book.summary}>
                    <div>
                      <dt>Leituras confirmadas</dt>
                      <dd>
                        {view.readings.filter((r) => r.confirmed).length} de 2
                      </dd>
                    </div>
                    <div>
                      <dt>Devocional e reflexão</dt>
                      <dd>
                        {p.devotionalCompleted ? 'Concluídos' : 'Pendentes'}
                      </dd>
                    </div>
                    <div>
                      <dt>Quiz da fase</dt>
                      <dd>
                        {view.quizCompleted
                          ? 'Concluído'
                          : p.quizAttemptId > 0
                            ? 'Em andamento'
                            : 'Ainda não iniciado'}
                      </dd>
                    </div>
                    <div>
                      <dt>Fase atual</dt>
                      <dd>
                        {p.gardenCompleted ? 'Concluída' : 'Em andamento'}
                      </dd>
                    </div>
                  </dl>
                  <nav className={book.jump} aria-label="Páginas do Diário">
                    <a href="#diary-events">Eventos</a>
                    <a href="#diary-readings">Leituras</a>
                    <a href="#diary-reflection">Reflexão</a>
                    <a href="#diary-quiz">Quiz</a>
                  </nav>
                </section>
                <section
                  id="diary-events"
                  className={book.panel}
                  aria-labelledby="diary-events-title"
                >
                  <p className={book.kicker}>MEMÓRIA DA CAMINHADA</p>
                  <h2 id="diary-events-title">Eventos com data</h2>
                  {view.lastDated && (
                    <p>
                      Último evento com data:{' '}
                      <strong>{view.lastDated.title}</strong>.
                    </p>
                  )}
                  {view.dated.length ? (
                    <EventList events={view.dated} />
                  ) : (
                    <p>
                      Nenhum evento com data registrado ainda. Continue sua
                      jornada quando estiver pronto.
                    </p>
                  )}
                  <h3>Marcos da fase</h3>
                  <p className={book.muted}>
                    Estes estados estão salvos, mas não possuem data de
                    conclusão. Não indicam uma ordem cronológica.
                  </p>
                  {view.milestones.length ? (
                    <EventList events={view.milestones} />
                  ) : (
                    <p>
                      Seus marcos aparecerão aqui conforme forem registrados.
                    </p>
                  )}
                </section>
                <section
                  id="diary-readings"
                  className={book.panel}
                  aria-labelledby="diary-readings-title"
                >
                  <p className={book.kicker}>PÁGINAS DE LEITURA</p>
                  <h2 id="diary-readings-title">Leituras bíblicas</h2>
                  <p>{GARDEN_CONTENT.context}</p>
                  {view.readings.map((reading) => (
                    <div
                      className={book.reading}
                      key={reading.id}
                      data-diary-reading={reading.id}
                    >
                      <h3>{reading.reference}</h3>
                      <p>
                        {GARDEN.title} ·{' '}
                        {reading.confirmed
                          ? '✓ Leitura confirmada'
                          : 'Leitura pendente'}
                      </p>
                      {reading.openedAt && (
                        <p className={book.muted}>
                          Link aberto em{' '}
                          <time dateTime={reading.openedAt}>
                            {displayDate(reading.openedAt)}
                          </time>
                          . Essa data não é a confirmação de leitura.
                        </p>
                      )}
                      <a
                        href={reading.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Abrir {reading.label} na Bíblia ↗
                      </a>
                    </div>
                  ))}
                  <Link href={routes.garden}>Continuar leitura na fase →</Link>
                </section>
                <section
                  id="diary-reflection"
                  className={book.panel}
                  aria-labelledby="diary-reflection-title"
                >
                  <p className={book.kicker}>REGISTRO PESSOAL</p>
                  <h2 id="diary-reflection-title">Devocional e reflexão</h2>
                  <h3>Escolhas, confiança e responsabilidade</h3>
                  <p>
                    {GARDEN.title} ·{' '}
                    {p.devotionalCompleted
                      ? '✓ Devocional concluído'
                      : 'Devocional pendente'}
                  </p>
                  <p className={book.private}>
                    A reflexão privada do Viajante ativo aparece somente ao
                    expandir. Ela não é enviada ao líder, não recebe nota e não
                    mede espiritualidade.
                  </p>
                  {p.devotionalReflection ? (
                    <details className={book.reflection} key={traveler.id}>
                      <summary>Ver minha reflexão privada</summary>
                      <p>
                        <strong>
                          Depois da leitura, qual responsabilidade mais chamou
                          sua atenção?
                        </strong>
                      </p>
                      <p className={book.answer} data-private-reflection>
                        {p.devotionalReflection}
                      </p>
                      <p className={book.muted}>
                        Data da reflexão não registrada.
                      </p>
                    </details>
                  ) : (
                    <p>
                      Nenhuma reflexão salva ainda. O registro é feito no
                      Devocional da fase.
                    </p>
                  )}
                  <Link href={routes.garden}>
                    Continuar devocional na fase →
                  </Link>
                </section>
                <section
                  id="diary-quiz"
                  className={book.panel}
                  aria-labelledby="diary-quiz-title"
                >
                  <p className={book.kicker}>CONHECIMENTO DA FASE</p>
                  <h2 id="diary-quiz-title">Quiz Bíblico</h2>
                  <p>
                    {GARDEN.title} ·{' '}
                    {view.quizCompleted
                      ? '✓ Quiz concluído'
                      : p.quizAttemptId > 0
                        ? 'Quiz em andamento'
                        : 'Quiz ainda não iniciado'}
                  </p>
                  <p>
                    Tentativas iniciadas registradas:{' '}
                    <strong>{p.quizAttemptId}</strong>.
                  </p>
                  <p className={book.muted}>
                    Pontuação, respostas e datas de cada tentativa não são
                    armazenadas no histórico atual. O quiz não avalia fé.
                  </p>
                  <Link href={routes.garden}>
                    {view.quizCompleted
                      ? 'Revisitar a fase'
                      : 'Continuar jornada até o quiz'}{' '}
                    →
                  </Link>
                  <hr />
                  <h3>Participação no Diário</h3>
                  <p>
                    Participações registradas:{' '}
                    <strong data-diary-participations>{p.diaryEntries}</strong>.
                  </p>
                  <p className={book.muted}>
                    Este contador registra participação. Não guarda texto, datas
                    ou sequência de dias.
                  </p>
                  <button
                    type="button"
                    className={book.recordButton}
                    disabled={registeredTraveler === traveler.id}
                    onClick={() => {
                      if (saveDiaryEntry()) {
                        setRegisteredTraveler(traveler.id);
                        setFeedback({
                          travelerId: traveler.id,
                          text: 'Participação registrada. Nenhum texto novo foi salvo.',
                        });
                      } else
                        setFeedback({
                          travelerId: traveler.id,
                          text: 'Não foi possível registrar a participação. Tente novamente.',
                        });
                    }}
                  >
                    Registrar participação
                  </button>
                  <p role="status" aria-live="polite">
                    {feedback?.travelerId === traveler.id ? feedback.text : ''}
                  </p>
                </section>
                <section
                  className={book.codex}
                  aria-labelledby="equipment-codex-title"
                >
                  <p className={book.kicker}>CÓDICE</p>
                  <h2 id="equipment-codex-title">Equipamentos &amp; Bíblia</h2>
                  <details>
                    <summary>Ver itens descobertos e suas referências</summary>
                    <p>
                      Itens fictícios descobertos na jornada, com a inspiração
                      bíblica de cada um.
                    </p>
                    <div className={book.items}>
                      {traveler.inventory.map((item) => (
                        <article className={book.item} key={item.id}>
                          {/* eslint-disable-next-line @next/next/no-img-element -- existing local item icon registry */}
                          <img
                            src={equipmentAssetForItem(item)}
                            alt=""
                            onError={(e) => {
                              e.currentTarget.hidden = true;
                            }}
                          />
                          <h3>{item.name}</h3>
                          <EquipmentBibleDetails item={item} />
                        </article>
                      ))}
                    </div>
                  </details>
                </section>
              </div>
            </article>
          );
        }}
      </RequireTraveler>
    </Shell>
  );
}
