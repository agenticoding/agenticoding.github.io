/**
 * Canonical JSON writer for every committed audio artifact.
 *
 * One serializer keeps git diffs reviewable and lets the golden test compare
 * regenerated scripts byte-for-byte with what is committed. `sha256` lives here
 * (not in hash.ts) because a content hash is only ever taken over this canonical
 * form — and so hash.ts and dialogue.ts can both hash without importing each other.
 */
import { createHash } from 'node:crypto';

export const toCanonicalJson = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`;

export const sha256 = (text: string): string =>
  createHash('sha256').update(text).digest('hex');
