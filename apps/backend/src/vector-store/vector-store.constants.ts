import type { Schemas } from '@qdrant/js-client-rest';

export const QDRANT_CLIENT = 'QDRANT_CLIENT';
export const RACE_RESULTS_COLLECTION = 'race_results';
export const EMBEDDING_DIMENSION = 1536;
export const VECTOR_DISTANCE: Schemas['Distance'] = 'Cosine';
