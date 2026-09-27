import { hmacHash } from './hash.util';

describe('hmacHash', () => {
  const hex64Regex = /^[a-f0-9]{64}$/i;

  it('should produce a deterministic 64-character hex string', () => {
    const token = 'my-token';
    const secret = 'my-secret';

    const first = hmacHash(token, secret);
    const second = hmacHash(token, secret);

    expect(first).toMatch(hex64Regex);
    expect(second).toMatch(hex64Regex);
    expect(first).toBe(second); // determinism check
  });

  it('should produce different hashes for different tokens', () => {
    const secret = 'my-secret';
    const a = hmacHash('token1', secret);
    const b = hmacHash('token2', secret);

    expect(a).not.toBe(b);
  });
});
