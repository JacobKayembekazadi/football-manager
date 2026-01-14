/**
 * Encryption Utilities
 *
 * Provides AES-256-GCM encryption/decryption for sensitive data.
 * Used for BYOK API keys and OAuth tokens.
 */

/**
 * Convert base64 string to Uint8Array
 */
export function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert Uint8Array to base64 string
 */
export function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) {
    bin += String.fromCharCode(b);
  }
  return btoa(bin);
}

/**
 * Get the encryption key from environment
 */
function getEncryptionKey(): Uint8Array {
  const keyB64 = Deno.env.get('APP_ENCRYPTION_KEY');
  if (!keyB64) {
    throw new Error('Missing APP_ENCRYPTION_KEY environment variable');
  }
  return b64ToBytes(keyB64);
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 *
 * @param plaintext - The string to encrypt
 * @returns Object containing base64-encoded ciphertext and IV
 */
export async function encryptSecret(
  plaintext: string
): Promise<{ ciphertext: string; iv: string }> {
  const keyBytes = getEncryptionKey();
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    'AES-GCM',
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertextBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );

  return {
    ciphertext: bytesToB64(new Uint8Array(ciphertextBuf)),
    iv: bytesToB64(iv),
  };
}

/**
 * Decrypt a ciphertext using AES-256-GCM
 *
 * @param ciphertextB64 - Base64-encoded ciphertext
 * @param ivB64 - Base64-encoded initialization vector
 * @returns Decrypted plaintext string
 */
export async function decryptSecret(
  ciphertextB64: string,
  ivB64: string
): Promise<string> {
  const keyBytes = getEncryptionKey();
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    'AES-GCM',
    false,
    ['decrypt']
  );

  const iv = b64ToBytes(ivB64);
  const ciphertext = b64ToBytes(ciphertextB64);
  const plaintextBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintextBuf);
}
