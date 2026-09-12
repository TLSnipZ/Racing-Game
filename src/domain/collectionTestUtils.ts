import type { GameState } from './types';
/** Historical equality assertions exclude ONLY the newly introduced v8 field. */
export function withoutCollection({ collection: _collection, ...old }: GameState) { return old; }
