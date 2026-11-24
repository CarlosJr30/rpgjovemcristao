import type { Point } from './creation-explorer-model';

type Marker = Readonly<{
  label: string;
  symbol: string;
  point: Point;
  note?: string;
}>;
type Day = Readonly<{
  id: string;
  title: string;
  reference: string;
  passage: string;
  motifs: string;
  objective: string;
  markers: readonly Marker[];
  question: string;
  options: readonly [string, string];
  correct: 0 | 1;
  explanation: string;
}>;

const mainMarker = { x: 72, y: 50 };

export const CREATION_DAYS: readonly Day[] = [
  {
    id: 'creation-day-1',
    title: 'Luz e trevas',
    reference: 'Gênesis 1:3–5',
    passage: '1.3-5',
    motifs: '✦',
    objective: 'Encontre o marco da luz para abrir o desafio.',
    markers: [{ label: 'Marco da luz', symbol: '✦', point: mainMarker }],
    question: 'O que Deus criou no primeiro dia?',
    options: ['A luz.', 'O firmamento.'],
    correct: 0,
    explanation:
      'Deus disse que houvesse luz, separou a luz das trevas e chamou a luz de Dia e as trevas de Noite.',
  },
  {
    id: 'creation-day-2',
    title: 'Firmamento',
    reference: 'Gênesis 1:6–8',
    passage: '1.6-8',
    motifs: '☁ ≋',
    objective:
      'Encontre o marco do céu e identifique o acontecimento do segundo dia.',
    markers: [{ label: 'Marco do céu', symbol: '☁', point: mainMarker }],
    question: 'O que o firmamento separou?',
    options: [
      'A terra seca dos mares.',
      'As águas de cima das águas de baixo.',
    ],
    correct: 1,
    explanation:
      'O firmamento separou as águas acima e abaixo dele. Deus deu ao firmamento o nome de céu.',
  },
  {
    id: 'creation-day-3',
    title: 'Terra e vegetação',
    reference: 'Gênesis 1:9–13',
    passage: '1.9-13',
    motifs: '▲ ≋ ♧',
    objective: 'Visite os três marcos educativos: terra, mares e vegetação.',
    markers: [
      {
        label: 'Terra',
        symbol: '▲',
        point: { x: 25, y: 80 },
        note: 'A porção seca recebeu o nome de terra.',
      },
      {
        label: 'Mares',
        symbol: '≋',
        point: mainMarker,
        note: 'As águas reunidas receberam o nome de mares.',
      },
      {
        label: 'Vegetação',
        symbol: '♧',
        point: { x: 73, y: 78 },
        note: 'A terra fez brotar plantas e árvores que produzem sementes.',
      },
    ],
    question: 'O que acontece no terceiro dia?',
    options: [
      'Aparece a terra seca, as águas se reúnem e surge vegetação.',
      'As aves e os seres aquáticos povoam o céu e as águas.',
    ],
    correct: 0,
    explanation:
      'O relato reúne o aparecimento da terra seca, a formação dos mares e o surgimento da vegetação.',
  },
  {
    id: 'creation-day-4',
    title: 'Luminares',
    reference: 'Gênesis 1:14–19',
    passage: '1.14-19',
    motifs: '☀ ☾ ✦',
    objective: 'Observe o céu e encontre o marco dos luminares.',
    markers: [{ label: 'Marco dos luminares', symbol: '☀', point: mainMarker }],
    question: 'Que funções o relato atribui aos luminares?',
    options: [
      'Separar as águas acima e abaixo do céu.',
      'Iluminar a terra, distinguir dia e noite e marcar tempos.',
    ],
    correct: 1,
    explanation:
      'Os luminares iluminam a terra, distinguem dia e noite e servem para marcar tempos, dias e anos.',
  },
  {
    id: 'creation-day-5',
    title: 'Aves e criaturas das águas',
    reference: 'Gênesis 1:20–23',
    passage: '1.20-23',
    motifs: '🐦 🐟',
    objective: 'Encontre o marco das águas e dos céus.',
    markers: [{ label: 'Marco da vida', symbol: '≈', point: mainMarker }],
    question: 'Quais grupos aparecem no quinto dia?',
    options: ['Seres aquáticos e aves.', 'Animais terrestres e seres humanos.'],
    correct: 0,
    explanation:
      'Deus criou os seres que povoam as águas e as aves que voam pelo céu.',
  },
  {
    id: 'creation-day-6',
    title: 'Animais terrestres e humanidade',
    reference: 'Gênesis 1:24–31',
    passage: '1.24-31',
    motifs: '🐾 👥',
    objective:
      'Encontre o marco que apresenta os animais terrestres e a humanidade.',
    markers: [{ label: 'Marco da humanidade', symbol: '◇', point: mainMarker }],
    question: 'Além dos animais terrestres, quem foi criado no sexto dia?',
    options: [
      'As aves, feitas à imagem de Deus.',
      'Os seres humanos, criados à imagem de Deus.',
    ],
    correct: 1,
    explanation:
      'O relato apresenta os animais terrestres e ensina que Deus criou os seres humanos à sua imagem.',
  },
  {
    id: 'creation-day-7',
    title: 'Descanso e reflexão',
    reference: 'Gênesis 2:1–3',
    passage: '2.1-3',
    motifs: '◌',
    objective: 'Visite o marco do descanso. O Diário Bíblico é opcional.',
    markers: [{ label: 'Marco do descanso', symbol: '◌', point: mainMarker }],
    question: 'Como o relato descreve o sétimo dia?',
    options: [
      'Deus havia concluído sua obra, descansou e santificou o dia.',
      'Deus começou a criar os luminares do céu.',
    ],
    correct: 0,
    explanation:
      'Com sua obra concluída, Deus descansou. Ele abençoou e santificou o sétimo dia.',
  },
];
