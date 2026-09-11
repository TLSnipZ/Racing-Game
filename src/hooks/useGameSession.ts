import { useEffect, useRef, useState } from 'react';
import { createNewGameState } from '../domain/game';
import { deserializeSave, SAVE_STORAGE_KEY, serializeSave } from '../domain/persistence';
import type { GameState } from '../domain/types';

type Session = { game: GameState; blocked: boolean; error: string | null; raw: string | null; savedAt: number | null };
const message = (error: unknown) => error instanceof Error ? error.message : 'Browser storage is unavailable.';

function readSession(): Session {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(SAVE_STORAGE_KEY);
    const envelope = raw === null ? null : deserializeSave(raw);
    return { game: envelope?.state ?? createNewGameState(), blocked: false, error: null, raw, savedAt: envelope?.savedAt ?? null };
  } catch (error) {
    // Do not clear corrupt or newer saves, including inside React's initialiser.
    return { game: createNewGameState(), blocked: true, error: message(error), raw, savedAt: null };
  }
}

export function useGameSession() {
  const [session, setSession] = useState<Session>(readSession);
  const current = useRef(session);

  function publish(next: Session) {
    current.current = next;
    setSession(next);
  }

  function fail(error: unknown, blocked = current.current.blocked) {
    publish({ ...current.current, blocked, error: message(error) });
  }

  function persist(game: GameState, replace = false): boolean {
    try {
      const previous = current.current;
      if (previous.blocked && !replace) throw new Error('Resolve the save warning before continuing.');
      if (!replace && localStorage.getItem(SAVE_STORAGE_KEY) !== previous.raw) {
        fail(new Error('Another tab changed this save. Reload this page before continuing.'), true);
        return false;
      }
      const savedAt = Date.now();
      const raw = serializeSave(game, savedAt);
      // Synchronous durable write first. Failed imports/resets never replace the visible state.
      localStorage.setItem(SAVE_STORAGE_KEY, raw);
      publish({ game, blocked: false, error: null, raw, savedAt });
      return true;
    } catch (error) {
      fail(error);
      return false;
    }
  }

  useEffect(() => {
    if (!current.current.blocked) persist(current.current.game);
    function onStorage(event: StorageEvent) {
      try {
        if (event.storageArea === localStorage && (event.key === SAVE_STORAGE_KEY || event.key === null)
          && localStorage.getItem(SAVE_STORAGE_KEY) !== current.current.raw) {
          fail(new Error('Another tab changed this save. Reload this page before continuing.'), true);
        }
      } catch (error) { fail(error, true); }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // Initial load/migration only; all later changes are saved by explicit commands below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function command(update: (state: GameState) => GameState): boolean {
    try {
      if (current.current.blocked) throw new Error('Resolve the save warning before continuing.');
      return persist(update(current.current.game));
    } catch (error) { fail(error); return false; }
  }

  return {
    ...session,
    command,
    replaceGame: (state: GameState) => persist(state, true),
    resetGame: () => persist(createNewGameState(), true),
  };
}
