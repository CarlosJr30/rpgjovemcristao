import { beforeEach, expect, test, vi } from 'vitest';
const { rpc, createAccount } = vi.hoisted(() => ({
  rpc: vi.fn(),
  createAccount: vi.fn(),
}));
vi.mock('./client', () => ({
  getSupabaseBrowserClient: () => ({ rpc, auth: { signUp: createAccount } }),
}));
import { signUp } from './auth';
beforeEach(() => {
  rpc.mockReset();
  createAccount.mockReset();
});
test('missing enrollment contract does not create an unverified Auth account', async () => {
  rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202' } });
  await expect(
    signUp('synthetic@example.invalid', 'synthetic-password', 'Synthetic'),
  ).rejects.toThrow(/verificação etária/);
  expect(createAccount).not.toHaveBeenCalled();
});
test('closed enrollment and malformed server response cannot be bypassed', async () => {
  for (const data of [
    { version: 1, allowed: false },
    { version: 1, allowed: 'true' },
    null,
  ]) {
    rpc.mockResolvedValueOnce({ data, error: null });
    await expect(
      signUp('synthetic@example.invalid', 'synthetic-password', 'Synthetic'),
    ).rejects.toThrow(/verificação etária/);
  }
  expect(createAccount).not.toHaveBeenCalled();
});
