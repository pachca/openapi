#!/usr/bin/env node
import { nodeIo } from './io.js';
import { main } from './main.js';

process.exitCode = await main(process.argv.slice(2), nodeIo());
