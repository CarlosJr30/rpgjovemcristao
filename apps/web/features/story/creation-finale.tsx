import Link from 'next/link';
import { scoreGardenQuiz } from '../journey/data/gardenQuiz';
import { ORIGIN_STORIES } from './catalog';
import { CREATION_DAYS } from './creation-days';
import { CREATION_QUIZ } from './creation-quiz-content';
import type { QuizAnswers } from './creation-quiz';
import { StoryVideoPanel } from './video-panel';
import css from './creation-explorer.module.css';

const creationVideo = ORIGIN_STORIES.find(({ id }) => id === 'creation')!.video;

export function CreationVideoStage({ onContinue }: { onContinue: () => void }) {
  return (
    <>
      <StoryVideoPanel
        video={creationVideo}
        completed={false}
        publication={null}
      />
      <section className={css.panel} aria-label="Estado do vídeo obrigatório">
        <p role="status">
          Vídeo pendente. A conclusão oficial continua bloqueada.
        </p>
        <button type="button" onClick={onContinue}>
          Ver estado da conclusão
        </button>
      </section>
    </>
  );
}

const plannedRewards = [
  ['Sete missões', '140 XP + 70 moedas'],
  ['Harmonia', '100 XP + 30 moedas + 1 Baú Comum'],
  ['Quiz perfeito', '60 XP + 1 Baú Raro'],
  ['Conclusão', '200 XP + 100 moedas + 1 Baú Comum + 1 Baú Épico'],
] as const;

export function CreationFinale({
  discoveries,
  answers,
}: {
  discoveries: number;
  answers: QuizAnswers;
}) {
  return (
    <section className={css.panel} aria-labelledby="creation-finale-title">
      <h2 id="creation-finale-title" tabIndex={-1}>
        Encerramento da Criação
      </h2>
      <p role="status">
        Conclusão oficial bloqueada · vídeo obrigatório pendente.
      </p>
      <ul aria-label="Resumo da demonstração">
        <li>
          Descobertas: {discoveries} de {CREATION_DAYS.length} dias.
        </li>
        <li>Harmonia da Criação resolvida na demonstração.</li>
        <li>
          Quiz: {scoreGardenQuiz(CREATION_QUIZ, answers)} de{' '}
          {CREATION_QUIZ.length} acertos.
        </li>
      </ul>
      <h3>Recompensas da Fase 1</h3>
      <p>
        <strong>Previstas</strong> · valores planejados por marco.
      </p>
      <table className={css.rewardTable}>
        <caption>Planejamento de recompensas</caption>
        <thead>
          <tr>
            <th scope="col">Marco</th>
            <th scope="col">Recompensa</th>
          </tr>
        </thead>
        <tbody>
          {plannedRewards.map(([milestone, reward]) => (
            <tr key={milestone}>
              <th scope="row">{milestone}</th>
              <td>{reward}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total máximo</th>
            <td>500 XP + 200 moedas + 4 baús</td>
          </tr>
        </tfoot>
      </table>
      <p>
        <strong>Elegíveis</strong> · os marcos dependem de validação oficial no
        servidor e de política econômica aprovada.
      </p>
      <p>
        <strong>Recebidas nesta demonstração</strong> · nenhuma.
      </p>
      <h3>Próxima história · Jardim do Éden</h3>
      <p>
        Bloqueada até a conclusão oficial da Criação. A Jornada Bíblica avança
        por seus próprios requisitos, sem aprovação de Líder de Guilda.
      </p>
      <Link className={css.mapLink} href="/journey/worlds">
        Voltar ao mapa de mundos
      </Link>
    </section>
  );
}
