import crypto from 'node:crypto';
import type { RawSourceRecord } from './types';

export function hashPayload(payload: unknown) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function makeRawRecord(payload: Record<string, unknown>, sourceUrl?: string, externalId?: string): RawSourceRecord {
  return { payload, sourceUrl, externalId };
}
