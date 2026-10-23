import type { GardenQuizQuestion } from '../journey/data/gardenQuiz';
export type LessonScene = {
  id: string;
  title: string;
  text: string;
  reference: string;
  classification: 'INTERPRETATIVE';
};
export type LessonTask = {
  id: string;
  prompt: string;
  answer: string;
  feedback: string;
};
export type OriginsLesson = {
  storyId: string;
  revision: 1;
  review: 'candidate';
  objective: string;
  readings: readonly { chapter: number; reference: string; url: string }[];
  scenes: readonly LessonScene[];
  activity: {
    title: string;
    instructions: string;
    classification: 'FICTIONAL';
    options: readonly { id: string; text: string }[];
    tasks: readonly LessonTask[];
  };
  quiz: readonly GardenQuizQuestion[];
  reflection: readonly string[];
};
const reading = (chapter: number, reference = `Gênesis ${chapter}`) => ({
  chapter,
  reference,
  url: `https://www.bible.com/pt/bible/129/GEN.${chapter}.NVI`,
});
const scene = (
  id: string,
  title: string,
  text: string,
  reference: string,
): LessonScene => ({
  id,
  title,
  text,
  reference,
  classification: 'INTERPRETATIVE',
});
const options = (values: readonly string[]) =>
  values.map((text, index) => ({ id: String(index), text }));
function quiz(
  id: string,
  question: string,
  values: [string, string, string, string],
  correct: number,
  explanation: string,
  reference: string,
): GardenQuizQuestion {
  return {
    id,
    question,
    options: values.map((text, index) => ({ id: `${id}-${index}`, text })),
    correctOptionId: `${id}-${correct}`,
    explanation,
    reference,
  };
}
export const ORIGINS_LESSONS: readonly OriginsLesson[] = [
  {
    storyId: 'creation',
    revision: 1,
    review: 'candidate',
    objective:
      'Reconhecer a sequência literária da criação e relacionar cuidado e descanso.',
    readings: [reading(1), reading(2)],
    scenes: [
      scene(
        'beginning',
        'Céus e terra',
        'O relato começa com Deus criando os céus e a terra. A narrativa apresenta luz e separações que organizam o mundo.',
        'Gênesis 1:1–10',
      ),
      scene(
        'life',
        'Um mundo com vida',
        'Vegetação, luminares, animais das águas e aves aparecem na sequência do relato. Cada grupo tem seu lugar na organização dos dias.',
        'Gênesis 1:11–23',
      ),
      scene(
        'humanity',
        'O ser humano',
        'O sexto dia inclui os animais terrestres e a criação do ser humano à imagem de Deus, homem e mulher. O texto associa essa criação a uma responsabilidade sobre a vida na terra.',
        'Gênesis 1:24–31',
      ),
      scene(
        'rest',
        'O sétimo dia',
        'Gênesis 2 apresenta o descanso do sétimo dia. O ser humano é colocado no jardim para cultivar e guardar. Descanso e cuidado fazem parte desta leitura.',
        'Gênesis 2:1–3,15',
      ),
    ],
    activity: {
      title: 'O mosaico dos dias',
      classification: 'FICTIONAL',
      instructions:
        'Associe cada dia ao acontecimento apresentado em Gênesis 1:1–2:3. É um exercício de leitura, sem afirmar duração científica dos dias.',
      options: options([
        'Luz e separação entre dia e noite',
        'Firmamento e separação das águas',
        'Terra seca, mares e vegetação',
        'Luminares para marcar tempos, dias e anos',
        'Seres das águas e aves',
        'Animais terrestres e ser humano',
        'Descanso do sétimo dia',
      ]),
      tasks: Array.from({ length: 7 }, (_, i) => ({
        id: `day-${i + 1}`,
        prompt: `Dia ${i + 1}`,
        answer: String(i),
        feedback: `Confira o dia ${i + 1} na sequência de Gênesis 1:1–2:3.`,
      })),
    },
    quiz: [
      quiz(
        'creation-order',
        'Por que observar a sequência do relato é útil?',
        [
          'Para decidir o valor das pessoas',
          'Para reconhecer como o texto apresenta organização e vida',
          'Para descobrir uma ferramenta de Noé',
          'Para ignorar o descanso',
        ],
        1,
        'A sequência organiza a apresentação da criação; ela não classifica o valor das pessoas.',
        'Gênesis 1:1–2:3',
      ),
      quiz(
        'creation-image',
        'Quem é apresentado como criado à imagem de Deus?',
        [
          'Somente governantes',
          'Somente o personagem do jogo',
          'O ser humano, homem e mulher',
          'Somente quem termina o quiz',
        ],
        2,
        'O texto fala de homem e mulher; terminar uma atividade não concede essa dignidade.',
        'Gênesis 1:26–28',
      ),
      quiz(
        'creation-care',
        'Qual responsabilidade aparece no jardim?',
        [
          'Cultivar e guardar',
          'Abandonar o lugar',
          'Modificar o passado',
          'Acumular pontos espirituais',
        ],
        0,
        'Cultivar e guardar são as responsabilidades citadas; os pontos do jogo não medem espiritualidade.',
        'Gênesis 2:15',
      ),
    ],
    reflection: [
      'Que cuidado concreto com pessoas, animais ou espaços você pode praticar?',
      'Como o descanso pode fazer parte de uma rotina responsável?',
    ],
  },
  {
    storyId: 'garden-choice',
    revision: 1,
    review: 'candidate',
    objective:
      'Observar tentação, escolha, consequências e cuidado sem mudar o desfecho do relato.',
    readings: [reading(3)],
    scenes: [
      scene(
        'garden',
        'Uma orientação questionada',
        'A serpente questiona a orientação recebida. A conversa apresenta uma tentação; a escolha do jogador não substitui as escolhas das personagens bíblicas.',
        'Gênesis 3:1–5',
      ),
      scene(
        'choice',
        'A desobediência',
        'A mulher e o homem comem do fruto. O relato não identifica a espécie do fruto como maçã.',
        'Gênesis 3:6–7',
      ),
      scene(
        'consequences',
        'Consequências e cuidado',
        'O casal se esconde e responde a Deus. Há consequências para a vida e para os relacionamentos; antes da saída, o texto também menciona roupas feitas por Deus.',
        'Gênesis 3:8–21',
      ),
      scene(
        'departure',
        'A saída do jardim',
        'O casal é enviado para fora do jardim e o caminho para a árvore da vida é guardado. Vencer a Fuga da Serpente não desfaz esses acontecimentos.',
        'Gênesis 3:22–24',
      ),
    ],
    activity: {
      title: 'Fuga da Serpente',
      classification: 'FICTIONAL',
      instructions:
        'Reutiliza o desafio existente. Correr, recolher fragmentos e chegar ao portal são ficção de gameplay; não representam uma fuga descrita em Gênesis nem alteram a expulsão.',
      options: [],
      tasks: [],
    },
    quiz: [
      quiz(
        'eden-fruit',
        'Qual cuidado evita acrescentar um detalhe que o texto não informa?',
        [
          'Chamar o fruto de maçã',
          'Dar um nome ao rio do jogo',
          'Dizer que o casal venceu a serpente numa corrida',
          'Reconhecer que a espécie do fruto não é identificada',
        ],
        3,
        'Gênesis fala do fruto; a identificação como maçã não aparece nessa passagem.',
        'Gênesis 3:1–7',
      ),
      quiz(
        'eden-response',
        'O que acontece depois da desobediência?',
        [
          'Nada muda',
          'Surgem vergonha, medo e consequências',
          'O jardim vira uma arca',
          'O jogador muda a decisão do casal',
        ],
        1,
        'O texto descreve percepção da nudez, esconderijo, medo e consequências.',
        'Gênesis 3:7–19',
      ),
      quiz(
        'eden-care',
        'Qual cuidado é mencionado antes da saída?',
        [
          'Um prêmio de moedas',
          'Uma coroa',
          'Roupas feitas por Deus',
          'Um novo placar',
        ],
        2,
        'Gênesis 3:21 menciona roupas para o homem e a mulher.',
        'Gênesis 3:21–24',
      ),
    ],
    reflection: [
      'O que ajuda você a reconhecer consequências antes de agir?',
      'Como assumir responsabilidade sem expor situações íntimas a outras pessoas?',
    ],
  },
  {
    storyId: 'cain-abel',
    revision: 1,
    review: 'candidate',
    objective:
      'Relacionar ira, responsabilidade e consequências, reconhecendo também a proteção mencionada no texto.',
    readings: [reading(4)],
    scenes: [
      scene(
        'offerings',
        'Dois irmãos e suas ofertas',
        'Caim trabalha a terra e Abel cuida de rebanhos. Ambos apresentam ofertas. Esta prévia não inventa uma explicação única para todos os detalhes da aceitação das ofertas.',
        'Gênesis 4:1–5',
      ),
      scene(
        'anger',
        'A ira e a advertência',
        'Caim fica irado. Deus o questiona e o adverte sobre o pecado; a narrativa convida a observar sua responsabilidade diante da advertência.',
        'Gênesis 4:5–7',
      ),
      scene(
        'abel',
        'A morte de Abel',
        'Caim mata Abel. A cena é tratada em texto, sem violência gráfica. Deus pergunta por Abel e confronta Caim com sua responsabilidade.',
        'Gênesis 4:8–10',
      ),
      scene(
        'mercy',
        'Consequência e proteção',
        'Caim recebe consequências e teme ser morto. Deus coloca um sinal para protegê-lo de quem o encontrasse. O texto não descreve a aparência desse sinal; ele não é uma marca racial.',
        'Gênesis 4:11–16',
      ),
    ],
    activity: {
      title: 'Acontecimentos e consequências',
      classification: 'FICTIONAL',
      instructions:
        'Associe cada momento ao que o texto narra. Você observa a história; não escolhe um final alternativo para Abel.',
      options: options([
        'Caim fica irado e recebe uma advertência',
        'Deus pergunta por Abel e confronta Caim',
        'Consequências não autorizam que outros matem Caim',
      ]),
      tasks: [
        {
          id: 'anger',
          prompt: 'Depois das ofertas',
          answer: '0',
          feedback: 'Observe a ira e a advertência em Gênesis 4:5–7.',
        },
        {
          id: 'responsibility',
          prompt: 'Depois da morte de Abel',
          answer: '1',
          feedback:
            'A pergunta por Abel confronta a responsabilidade de Caim, em 4:9–10.',
        },
        {
          id: 'protection',
          prompt: 'Diante do temor de Caim',
          answer: '2',
          feedback: 'Gênesis 4:13–15 também menciona proteção contra vingança.',
        },
      ],
    },
    quiz: [
      quiz(
        'cain-warning',
        'O que a advertência dirigida a Caim destaca?',
        [
          'Que a ira elimina sua responsabilidade',
          'Que existe responsabilidade diante do pecado',
          'Que o jogador deve punir Abel',
          'Que não há consequências',
        ],
        1,
        'A advertência antecede a violência e trata da responsabilidade de Caim.',
        'Gênesis 4:6–7',
      ),
      quiz(
        'cain-keeper',
        'Por que a pergunta sobre Abel é relevante?',
        [
          'Porque procura uma ferramenta',
          'Porque entrega uma recompensa',
          'Porque confronta Caim com a vida de seu irmão',
          'Porque descreve uma corrida',
        ],
        2,
        'A pergunta confronta a tentativa de fugir da responsabilidade pelo irmão.',
        'Gênesis 4:9–10',
      ),
      quiz(
        'cain-sign',
        'O que podemos afirmar sobre o sinal dado a Caim?',
        [
          'Sua cor racial é descrita',
          'É um prêmio pela violência',
          'Apaga a morte de Abel',
          'É associado à proteção; sua aparência não é descrita',
        ],
        3,
        'O sinal tem função protetora no relato; não há descrição de aparência ou raça.',
        'Gênesis 4:13–15',
      ),
    ],
    reflection: [
      'Que maneiras seguras existem de lidar com a ira antes de agir?',
      'Como buscar ajuda e assumir responsabilidade sem alimentar vingança?',
    ],
  },
  {
    storyId: 'noah-ark',
    revision: 1,
    review: 'candidate',
    objective:
      'Relacionar preparação, preservação da vida e aliança na narrativa de Noé.',
    readings: [reading(6), reading(7), reading(8), reading(9)],
    scenes: [
      scene(
        'violence',
        'Um mundo marcado pela violência',
        'Gênesis descreve corrupção e violência na terra. Nesse contexto apresenta Noé e as instruções para a arca.',
        'Gênesis 6:5–22',
      ),
      scene(
        'preparation',
        'Preparar a arca',
        'Noé recebe instruções para construir a arca, reunir alimento e acolher sua família e animais. A atividade de organização é um exercício do jogo, não uma nova tarefa histórica do jogador.',
        'Gênesis 6:14–22',
      ),
      scene(
        'flood',
        'O dilúvio e a espera',
        'O relato acompanha a entrada na arca, o dilúvio e a espera até que as águas diminuam. A saída ocorre depois da orientação de Deus.',
        'Gênesis 7:1–8:19',
      ),
      scene(
        'covenant',
        'A aliança e o arco-íris',
        'Após a saída, o relato apresenta uma aliança com Noé, seus descendentes e os seres vivos. O arco-íris é seu sinal. Não é uma promessa de ausência de toda dificuldade.',
        'Gênesis 9:8–17',
      ),
    ],
    activity: {
      title: 'Preparar, preservar, esperar',
      classification: 'FICTIONAL',
      instructions:
        'Organize um painel de estudo associando tarefas ao seu propósito. Não há contagem inventada de espécies nem corrida para mudar o dilúvio.',
      options: options([
        'Construir a arca conforme a orientação',
        'Reunir alimento',
        'Esperar a orientação para sair',
        'Reconhecer o sinal da aliança',
      ]),
      tasks: [
        {
          id: 'build',
          prompt: 'Estrutura para a travessia',
          answer: '0',
          feedback:
            'As instruções para a construção aparecem em Gênesis 6:14–16.',
        },
        {
          id: 'food',
          prompt: 'Provisão para quem está na arca',
          answer: '1',
          feedback: 'O alimento é mencionado em Gênesis 6:21.',
        },
        {
          id: 'exit',
          prompt: 'Saída após a espera',
          answer: '2',
          feedback: 'A orientação para sair está em Gênesis 8:15–19.',
        },
        {
          id: 'rainbow',
          prompt: 'Arco-íris após o dilúvio',
          answer: '3',
          feedback: 'O sinal da aliança aparece em Gênesis 9:12–17.',
        },
      ],
    },
    quiz: [
      quiz(
        'noah-context',
        'Qual contexto o texto apresenta antes da arca?',
        [
          'Uma competição esportiva',
          'A construção de Babel',
          'Corrupção e violência na terra',
          'Uma eleição de reis',
        ],
        2,
        'A narrativa situa a arca no contexto da corrupção e da violência.',
        'Gênesis 6:5–13',
      ),
      quiz(
        'noah-preparation',
        'O que a preparação inclui além da construção?',
        [
          'Somente um troféu',
          'Alimento para a família e os animais',
          'Uma nova língua',
          'Um placar de espiritualidade',
        ],
        1,
        'A orientação também inclui reunir alimento; a atividade do jogo não concede nota espiritual.',
        'Gênesis 6:18–22',
      ),
      quiz(
        'noah-covenant',
        'A quem a aliança apresentada alcança?',
        [
          'Só quem termina o quiz',
          'Só um animal',
          'Só os construtores de Babel',
          'Noé, seus descendentes e os seres vivos mencionados',
        ],
        3,
        'O texto amplia a aliança para os descendentes e os seres vivos.',
        'Gênesis 9:8–17',
      ),
    ],
    reflection: [
      'Como se preparar com responsabilidade para cuidar de outras pessoas?',
      'Que diferença há entre ter esperança e prometer que nunca haverá dificuldades?',
    ],
  },
  {
    storyId: 'babel',
    revision: 1,
    review: 'candidate',
    objective:
      'Observar o projeto da cidade, a busca de um nome e a dispersão, sem desvalorizar línguas ou povos.',
    readings: [reading(11, 'Gênesis 11:1–9')],
    scenes: [
      scene(
        'language',
        'Uma língua em comum',
        'O relato começa com uma mesma língua e um povo que se estabelece numa planície. Os construtores usam tijolos e argamassa.',
        'Gênesis 11:1–3',
      ),
      scene(
        'project',
        'A cidade e a torre',
        'O projeto inclui uma cidade e uma torre. Os construtores desejam fazer um nome para si e evitar a dispersão; essa busca de grandeza é uma aplicação interpretativa sobre orgulho.',
        'Gênesis 11:4',
      ),
      scene(
        'communication',
        'A comunicação interrompida',
        'Deus confunde a língua dos construtores. Eles deixam de se compreender e interrompem a construção. O jogo não reconstrói as línguas históricas.',
        'Gênesis 11:5–8',
      ),
      scene(
        'dispersion',
        'A dispersão dos povos',
        'O relato termina com a dispersão e o nome Babel. Nenhuma língua, povo ou sotaque é apresentado aqui como inferior.',
        'Gênesis 11:8–9',
      ),
    ],
    activity: {
      title: 'Uma legenda em comum',
      classification: 'FICTIONAL',
      instructions:
        'Exercício inventado de comunicação: use a legenda ◇ = água, ○ = abrigo, △ = alimento. Esses símbolos não são uma escrita antiga nem explicam a origem de línguas reais.',
      options: options(['Água', 'Abrigo', 'Alimento']),
      tasks: [
        {
          id: 'water',
          prompt: 'Mensagem ◇',
          answer: '0',
          feedback: 'Na legenda inventada, ◇ significa água.',
        },
        {
          id: 'shelter',
          prompt: 'Mensagem ○',
          answer: '1',
          feedback: 'Na legenda inventada, ○ significa abrigo.',
        },
        {
          id: 'food',
          prompt: 'Mensagem △',
          answer: '2',
          feedback: 'Na legenda inventada, △ significa alimento.',
        },
      ],
    },
    quiz: [
      quiz(
        'babel-purpose',
        'O que os construtores dizem querer?',
        [
          'Construir a arca',
          'Fazer um nome para si e evitar a dispersão',
          'Cuidar do rebanho de Abel',
          'Vencer uma corrida',
        ],
        1,
        'Esses objetivos são mencionados no projeto da cidade e da torre.',
        'Gênesis 11:4',
      ),
      quiz(
        'babel-change',
        'O que interrompe a cooperação no relato?',
        [
          'A vitória do jogador',
          'A chegada de uma eleição',
          'A confusão da língua e a falta de compreensão',
          'O fim de um campeonato',
        ],
        2,
        'A falta de compreensão acompanha a interrupção da construção e a dispersão.',
        'Gênesis 11:7–9',
      ),
      quiz(
        'babel-symbols',
        'O que os símbolos desta atividade representam?',
        [
          'Uma língua bíblica reconstruída',
          'Uma prova de que um povo é inferior',
          'Um versículo literal',
          'Uma legenda ficcional para exercitar comunicação',
        ],
        3,
        'A legenda é uma atividade inventada. Ela não representa uma língua histórica.',
        'Contexto: Gênesis 11:1–9; atividade FICTIONAL',
      ),
    ],
    reflection: [
      'Como ouvir melhor alguém que se expressa de maneira diferente de você?',
      'Quando um projeto coletivo precisa de mais cuidado e menos busca de prestígio?',
    ],
  },
];
export const originsLesson = (id: string) =>
  ORIGINS_LESSONS.find((lesson) => lesson.storyId === id);
