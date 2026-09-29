export class OnlinePersistenceError extends Error {
  constructor(
    message: string,
    readonly developmentDetails?: string,
  ) {
    super(message);
    this.name = 'OnlinePersistenceError';
  }
}

export const requireData = <T>(
  result: { data: T | null; error: unknown },
  message: string,
): T => {
  if (result.error || result.data === null)
    throw new OnlinePersistenceError(message);
  return result.data;
};

export const requireSuccess = (
  result: { error: unknown },
  message: string,
): void => {
  if (result.error) throw new OnlinePersistenceError(message);
};
