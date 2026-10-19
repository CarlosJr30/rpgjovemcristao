export const comprehensionQuestions = [
  {
    id: 'care',
    prompt: 'Qual responsabilidade aparece em Gênesis 2:15?',
    options: [
      { id: 'cultivate', text: 'Cultivar e guardar o jardim' },
      { id: 'abandon', text: 'Abandonar o jardim' },
      { id: 'rule-city', text: 'Governar uma cidade' },
    ],
    correctOptionId: 'cultivate',
  },
  {
    id: 'orientation',
    prompt: 'Como Gênesis 2:16–17 apresenta liberdade e limite?',
    options: [
      {
        id: 'freedom-limit',
        text: 'Há liberdade ampla e um limite específico',
      },
      { id: 'no-freedom', text: 'Nenhuma árvore podia ser usada' },
      { id: 'no-guidance', text: 'Nenhuma orientação foi apresentada' },
    ],
    correctOptionId: 'freedom-limit',
  },
  {
    id: 'consequence',
    prompt: 'O que muda no relato depois da desobediência?',
    options: [
      { id: 'rupture', text: 'Surgem vergonha, medo e consequências' },
      { id: 'nothing', text: 'Nada muda no relato' },
      { id: 'garden-grows', text: 'O jardim se transforma em cidade' },
    ],
    correctOptionId: 'rupture',
  },
] as const;
