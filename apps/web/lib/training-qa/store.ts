export type TrainingState = {
  version: 1;
  qaOnly: true;
  enabled: true;
  actor: string;
  activation: string;
  expiresAt: string;
  coins: number;
  chests: number;
  revision: number;
  items: Record<string, number>;
  equipped: Record<string, string | null>;
  history: TrainingReceipt[];
};
export type TrainingReceipt = {
  id: string;
  createdAt: string;
  operationId: string;
  command: string;
  payload: Record<string, unknown>;
  result: Record<string, unknown>;
};
export type TrainingBinding = {
  owner: string;
  actor: string;
  session: number;
  state: TrainingState;
  selected: boolean;
};
let binding: TrainingBinding | null = null;
const listeners = new Set<() => void>();
export const trainingSnapshot = () => binding;
export const emptyTrainingSnapshot = () => null;
export function subscribeTraining(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
export function setTraining(next: TrainingBinding | null) {
  binding = next;
  listeners.forEach((fn) => fn());
}
export const trainingRoute = (path: string) =>
  [
    '/journey/shop',
    '/journey/equipment',
    '/journey/backpack',
    '/journey/arena',
    '/journey/arena/deck',
    '/journey/arena/tower',
  ].includes(path);
export function selectedTraining(actor: string) {
  return binding?.selected &&
    binding.actor === actor &&
    typeof window !== 'undefined' &&
    trainingRoute(window.location.pathname)
    ? binding
    : null;
}
export function trainingNamespace(actor: string) {
  const b = selectedTraining(actor);
  return b ? ':training002:' + b.state.activation : '';
}
