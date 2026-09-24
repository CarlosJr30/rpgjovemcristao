export type GardenQuizOption = { id: string; text: string };
export type GardenQuizQuestion = {
  id: string;
  question: string;
  options: readonly GardenQuizOption[];
  correctOptionId: string;
  explanation: string;
  reference: string;
};
export type GardenQuizSessionQuestion = Omit<GardenQuizQuestion, 'options'> & { options: GardenQuizOption[] };

export const GARDEN_QUIZ_BANK: readonly GardenQuizQuestion[] = [
  question('book', 'Em qual livro está o relato estudado nesta fase?', 'genesis', 'Gênesis', ['Êxodo', 'Salmos', 'Atos'], 'A fase acompanha os capítulos 2 e 3 de Gênesis.', 'Gênesis 2–3'),
  question('garden-place', 'Onde o Senhor planta o jardim apresentado no relato?', 'eden', 'No Éden', ['Em Jerusalém', 'No Sinai', 'Em Nínive'], 'O jardim é situado no Éden, a leste.', 'Gênesis 2:8'),
  question('care', 'Qual responsabilidade é confiada ao ser humano no jardim?', 'cultivate-guard', 'Cultivar e guardar', ['Construir uma cidade', 'Esconder o rio', 'Escolher um rei'], 'O cuidado do jardim reúne trabalho e responsabilidade.', 'Gênesis 2:15'),
  question('freedom', 'Antes de apresentar o limite, o que a orientação destaca?', 'freedom-to-eat', 'A liberdade para comer das árvores', ['A proibição de toda colheita', 'A saída imediata do jardim', 'A construção de muralhas'], 'A orientação apresenta ampla liberdade antes de indicar um limite específico.', 'Gênesis 2:16–17'),
  question('limit', 'Qual limite é apresentado sobre a árvore do conhecimento do bem e do mal?', 'do-not-eat', 'Não comer do seu fruto', ['Não olhar para a árvore', 'Não cuidar do jardim', 'Não atravessar o rio'], 'O limite se refere a comer do fruto dessa árvore.', 'Gênesis 2:16–17'),
  question('river', 'Qual função do rio é mencionada no jardim?', 'irrigate', 'Irrigar o jardim', ['Cercar o jardim', 'Apagar as estrelas', 'Esconder as árvores'], 'O rio aparece ligado à irrigação do jardim.', 'Gênesis 2:10'),
  question('tree-life', 'Que árvore também é nomeada no meio do jardim?', 'life', 'A árvore da vida', ['Uma oliveira real', 'Um cedro do templo', 'Uma figueira sem folhas'], 'O relato nomeia a árvore da vida e a árvore do conhecimento do bem e do mal.', 'Gênesis 2:9'),
  question('serpent-question', 'Como começa a abordagem da serpente à mulher?', 'question', 'Questionando o que Deus havia dito', ['Entregando uma coroa', 'Abrindo o caminho do rio', 'Plantando uma nova árvore'], 'A serpente inicia sua abordagem colocando a orientação recebida em questão.', 'Gênesis 3:1–5'),
  question('fruit-not-apple', 'O texto de Gênesis identifica o fruto como maçã?', 'not-identified', 'Não; o tipo de fruto não é informado', ['Sim; é chamado de maçã', 'Sim; é chamado de uva', 'Sim; é chamado de figo'], 'O relato fala em fruto, sem identificar sua espécie.', 'Gênesis 3:1–7'),
  question('first-change', 'O que o casal percebe logo após comer do fruto?', 'nakedness', 'Que estavam nus', ['Que o jardim desapareceu', 'Que o rio secou', 'Que uma cidade surgiu'], 'A percepção da nudez é seguida pela tentativa de se cobrir.', 'Gênesis 3:7'),
  question('hiding', 'Como o casal reage ao ouvir o Senhor Deus no jardim?', 'hide', 'Esconde-se entre as árvores', ['Corre para fora sem ser chamado', 'Constrói um altar', 'Atravessa o rio'], 'O relato descreve medo e esconderijo entre as árvores.', 'Gênesis 3:8–10'),
  question('ground', 'Que mudança é associada ao trabalho da terra?', 'thorns', 'Passa a envolver dor, espinhos e esforço', ['Torna-se desnecessário', 'Produz somente ouro', 'Deixa de existir'], 'O trabalho da terra passa a ser descrito com esforço e obstáculos.', 'Gênesis 3:17–19'),
  question('garments', 'Que cuidado de Deus aparece antes da saída do jardim?', 'garments', 'Deus faz roupas para o casal', ['Deus entrega armas ao casal', 'Deus remove todas as árvores', 'Deus fecha os rios'], 'O relato menciona roupas feitas para o homem e a mulher.', 'Gênesis 3:21'),
  question('exit', 'Por que o caminho para a árvore da vida passa a ser guardado?', 'guard-life-tree', 'Para impedir o acesso à árvore da vida', ['Para esconder o rio', 'Para criar outro jardim', 'Para aprisionar a serpente'], 'O encerramento do capítulo associa a guarda ao caminho da árvore da vida.', 'Gênesis 3:22–24'),
];

function question(
  id: string,
  prompt: string,
  correctId: string,
  correctText: string,
  distractors: [string, string, string],
  explanation: string,
  reference: string,
): GardenQuizQuestion {
  return {
    id,
    question: prompt,
    options: [
      { id: `${id}-${correctId}`, text: correctText },
      ...distractors.map((text, index) => ({ id: `${id}-d${String(index + 1)}`, text })),
    ],
    correctOptionId: `${id}-${correctId}`,
    explanation,
    reference,
  };
}

export function createGardenQuizSession(attemptId: number, size = 5): GardenQuizSessionQuestion[] {
  const random = seededRandom(Math.max(1, attemptId));
  const selected = fisherYates([...GARDEN_QUIZ_BANK], random).slice(0, Math.min(size, GARDEN_QUIZ_BANK.length));
  const positions = fisherYates([0, 1, 2, 3], random);
  while (positions.length < selected.length) positions.push(Math.floor(random() * 4));
  return selected.map((item, index) => {
    const correct = item.options.find((option) => option.id === item.correctOptionId)!;
    const distractors = fisherYates(item.options.filter((option) => option.id !== item.correctOptionId), random);
    const options = [...distractors];
    options.splice(positions[index], 0, correct);
    return { ...item, options };
  });
}

export function scoreGardenQuiz(session: readonly GardenQuizSessionQuestion[], answers: Readonly<Record<string, string>>): number {
  return session.reduce((score, item) => score + Number(answers[item.id] === item.correctOptionId), 0);
}

export function fisherYates<T>(items: T[], random: () => number): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [items[index], items[swap]] = [items[swap], items[index]];
  }
  return items;
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
