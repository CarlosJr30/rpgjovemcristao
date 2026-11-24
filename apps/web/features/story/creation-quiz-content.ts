import type { GardenQuizSessionQuestion } from '../journey/data/gardenQuiz';

function question(
  id: string,
  prompt: string,
  choices: [string, string, string],
  correctOptionId: 'a' | 'b' | 'c',
  reference: string,
  passage: string,
  explanation: string,
): GardenQuizSessionQuestion & { passage: string } {
  return {
    id,
    question: prompt,
    options: choices.map((text, index) => ({
      id: ['a', 'b', 'c'][index],
      text,
    })),
    correctOptionId,
    reference,
    passage,
    explanation,
  };
}

// Conteúdo da demonstração. Aprovação editorial final pendente.
export const CREATION_QUIZ = [
  question(
    'light',
    'O que Deus criou no primeiro dia?',
    ['Os animais terrestres', 'A luz', 'O sol e a lua'],
    'b',
    'Gênesis 1:3–5',
    '1.3-5',
    'A luz aparece no primeiro dia.',
  ),
  question(
    'land',
    'Em qual dia surgiram a porção seca e a vegetação?',
    ['Terceiro dia', 'Quinto dia', 'Sexto dia'],
    'a',
    'Gênesis 1:9–13',
    '1.9-13',
    'A terra seca e a vegetação aparecem no terceiro dia.',
  ),
  question(
    'lights',
    'O que Deus estabeleceu no quarto dia?',
    ['As aves e os peixes', 'Os animais terrestres', 'Os luminares'],
    'c',
    'Gênesis 1:14–19',
    '1.14-19',
    'Os luminares são apresentados no quarto dia.',
  ),
  question(
    'image',
    'À imagem de quem Deus criou o ser humano?',
    ['Dos anjos', 'De Deus', 'Dos animais'],
    'b',
    'Gênesis 1:26–27',
    '1.26-27',
    'O relato descreve o ser humano como criado à imagem de Deus.',
  ),
  question(
    'rest',
    'O que Deus fez no sétimo dia?',
    [
      'Criou os mares',
      'Criou as árvores',
      'Concluiu Sua obra, descansou e santificou o dia',
    ],
    'c',
    'Gênesis 2:1–3',
    '2.1-3',
    'Com a obra concluída, Deus descansou e santificou o sétimo dia.',
  ),
] as const;
