import { Hook } from '@oclif/core';

// Banner and version refresh moved to init hook (process.on('exit'))
// so they fire even when commands fail.
const hook: Hook<'postrun'> = async function () {};

export default hook;
