const statuses: Readonly<Record<string, string>> = {
  available: 'DISPONÍVEL',
  started: 'EM ANDAMENTO',
  'in-progress': 'EM ANDAMENTO',
  submitted: 'ENVIADA PARA APROVAÇÃO',
  pending_approval: 'ENVIADA PARA APROVAÇÃO',
  'awaiting-validation': 'ENVIADA PARA APROVAÇÃO',
  approved: 'APROVADA · RECOMPENSA DISPONÍVEL',
  'reward-available': 'APROVADA · RECOMPENSA DISPONÍVEL',
  claimed: 'CONCLUÍDA',
  completed: 'CONCLUÍDA',
  'revision-requested': 'AJUSTE SOLICITADO',
  rejected: 'NOVA TENTATIVA SOLICITADA',
  active: 'DISPONÍVEL',
  published: 'PUBLICADA',
  closed: 'ENCERRADA',
  archived: 'ARQUIVADA',
  draft: 'RASCUNHO',
};
export function guildStatusLabel(status: string) {
  return statuses[status] ?? status;
}
