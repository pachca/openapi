import { Help } from '@oclif/core';

/**
 * Root help with a footer pointing at the web documentation.
 *
 * Terminal help is necessarily terse — it lists commands and flags, not
 * scenarios. Somebody who did not find what they needed has nowhere to go from
 * here unless we say where the long-form version lives.
 *
 * The footer goes after the command list, not before it: the end of the output
 * is where the eye rests, and it is the last thing left on screen after a long
 * list scrolls past.
 */
export default class PachcaHelp extends Help {
  public async showRootHelp(): Promise<void> {
    await super.showRootHelp();

    this.log('ДОКУМЕНТАЦИЯ');
    this.log('  Руководства и справочник API  https://dev.pachca.com');
    this.log('  Сценарии в терминале          pachca guide');
    this.log('');
  }
}
