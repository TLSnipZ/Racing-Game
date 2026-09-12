import type { GameState } from './types';
/** Historical equality assertions exclude ONLY the introduced v8 collection , v9 specialist and v10 empire fields (verified separately). */
export function withoutCollection({ collection: _collection, advanced: _advanced, empire: _empire, ...old }: GameState) { return old; }
