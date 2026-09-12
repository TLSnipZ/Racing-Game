import type { GameState } from './types';
/** Historical equality assertions exclude ONLY the introduced v8 collection and v9 specialist fields. */
export function withoutCollection({ collection: _collection, advanced: _advanced, ...old }: GameState) { return old; }
