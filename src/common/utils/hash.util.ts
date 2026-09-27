import { createHmac } from 'crypto';

/**
 * Deterministically hashes a token with optional secret salt.
 * Used for things like CSRF session identifiers.
 */
export function hmacHash(token: string, secret?: string): string {
  const hmac = createHmac('sha256', secret ?? '');
  hmac.update(token);
  return hmac.digest('hex');
}
