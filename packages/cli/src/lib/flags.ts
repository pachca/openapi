import { Errors, Flags } from '@oclif/core';

/**
 * Flags for body fields the spec marks nullable.
 *
 * In such a field `null` carries meaning of its own: `--kind null` deletes a
 * bot's incoming webhook, `--parent-message-id null` takes the reply off a
 * draft. A plain string flag would send the text "null", which the API refuses,
 * and an integer flag would not accept the word at all. These flags read the
 * literal `null` as JSON null and pass every other value through as before.
 */
export const nullableString = Flags.custom<string | null>({
  async parse(input) {
    return input === 'null' ? null : input;
  },
});

export const nullableInteger = Flags.custom<number | null>({
  async parse(input) {
    if (input === 'null') return null;
    if (!/^-?\d+$/.test(input)) {
      throw new Errors.CLIError(`Expected an integer or null but received: ${input}`);
    }
    return Number.parseInt(input, 10);
  },
});
