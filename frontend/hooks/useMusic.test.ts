import { expect, test } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { TRACKS } from './useMusic';

// Catches a renamed/moved mp3 before it becomes a silent 404 in the player
test('every track points to a real file in public/', () => {
  for (const { src } of TRACKS) {
    const file = fileURLToPath(new URL(`../public${src}`, import.meta.url));
    expect(existsSync(file), `missing ${src}`).toBe(true);
  }
});
