export const EMBEDDING_MODEL = 'text-embedding-3-small';

export const EMBED_STATUS = {
  PENDING: 'pending',
  COMPLETE: 'complete',
  FAILED: 'failed',
} as const;

export type EmbedStatus = (typeof EMBED_STATUS)[keyof typeof EMBED_STATUS];
