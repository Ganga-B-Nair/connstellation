import { customAlphabet } from 'nanoid';

/** No 0/O/1/I — these get read aloud and typed by hand at events. */
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const makeJoinCode = customAlphabet(ALPHABET, 6);
export const makeStarCode = customAlphabet(ALPHABET, 4);

/**
 * Generates a code that isn't taken yet. `exists` is an async predicate.
 */
export async function uniqueCode(generator, exists, attempts = 8) {
  for (let i = 0; i < attempts; i += 1) {
    const code = generator();
    if (!(await exists(code))) return code;
  }
  throw Object.assign(new Error('Could not allocate a unique code'), { status: 500 });
}
