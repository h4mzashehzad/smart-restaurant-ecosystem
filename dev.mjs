#!/usr/bin/env node
import { startDashboard } from './tools/dev/server.mjs';

try {
  await startDashboard();
} catch (error) {
  console.error(`Development dashboard: ${error.message}`);
  process.exitCode = 1;
}
