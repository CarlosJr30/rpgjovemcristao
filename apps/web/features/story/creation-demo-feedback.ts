// Exercises about the demonstration controls. Official grading lives in PostgreSQL.
export const CREATION_DEMO_FEEDBACK: Readonly<Record<string, { correctIndex: number; explanation: string }>> = {
  "creation-day-1": {
    "correctIndex": 0,
    "explanation": "O portal do Santuário."
  },
  "creation-day-2": {
    "correctIndex": 0,
    "explanation": "Visitando os marcos da cena."
  },
  "creation-day-3": {
    "correctIndex": 0,
    "explanation": "A descoberta continua registrada uma vez."
  },
  "creation-day-4": {
    "correctIndex": 0,
    "explanation": "Na navegação acessível."
  },
  "creation-day-5": {
    "correctIndex": 0,
    "explanation": "Usando a saída da cena."
  },
  "creation-day-6": {
    "correctIndex": 0,
    "explanation": "A demonstração reinicia."
  },
  "creation-day-7": {
    "correctIndex": 0,
    "explanation": "Concluir as atividades dos sete dias."
  },
  "practice-portal": {
    "correctIndex": 0,
    "explanation": "No Santuário."
  },
  "practice-markers": {
    "correctIndex": 0,
    "explanation": "O estado Visitado."
  },
  "practice-diary": {
    "correctIndex": 0,
    "explanation": "Para consultar referências e resumos."
  },
  "practice-harmony": {
    "correctIndex": 0,
    "explanation": "Os sete símbolos dos dias."
  },
  "practice-progress": {
    "correctIndex": 0,
    "explanation": "Nenhum progresso oficial."
  }
};

export const CREATION_DAY_SUMMARIES: Readonly<Record<string, string>> = {
  "creation-day-1": "Use o portal para entrar na primeira cena.",
  "creation-day-2": "Explore a cena para encontrar o ponto de interação.",
  "creation-day-3": "Acompanhe os marcos restantes enquanto explora a cena.",
  "creation-day-4": "Use a navegação acessível para selecionar um marco.",
  "creation-day-5": "Use a saída para retornar ao Santuário.",
  "creation-day-6": "Consulte as referências do Diário durante a visita.",
  "creation-day-7": "Conclua as cenas para abrir a atividade de Harmonia."
};
