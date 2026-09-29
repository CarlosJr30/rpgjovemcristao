type SafeAuthError = Readonly<{
  name?: string;
  code?: string;
  message?: string;
  status?: number;
}>;

let sequence = 0;

export const safeAuthError = (value: unknown): SafeAuthError | null => {
  if (!value || typeof value !== 'object') return null;
  const error = value as Record<string, unknown>;
  return {
    ...(typeof error.name === 'string' ? { name: error.name } : {}),
    ...(typeof error.code === 'string' ? { code: error.code } : {}),
    ...(typeof error.message === 'string' ? { message: error.message } : {}),
    ...(typeof error.status === 'number' ? { status: error.status } : {}),
  };
};

export const authDiagnostic = (
  operation: string,
  details: Readonly<Record<string, unknown>> = {},
) => {
  if (process.env.NODE_ENV !== 'development') return;
  sequence += 1;
  console.info(`[AUTH TRACE ${sequence}] ${operation}`, details);
};

