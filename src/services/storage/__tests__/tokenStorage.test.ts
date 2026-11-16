import { clearSession, getSession, getToken, saveSession } from '../tokenStorage';

describe('tokenStorage', () => {
  it('saves, reads and clears the session token', async () => {
    const expiresAt = new Date(Date.now() + 3600_000).toISOString();
    await saveSession({ token: 'tok_abc', expiresAt });
    expect(await getToken()).toBe('tok_abc');
    expect(await getSession()).toEqual({ token: 'tok_abc', expiresAt });
    await clearSession();
    expect(await getSession()).toBeNull();
  });
});
