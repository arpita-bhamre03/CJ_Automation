/**
 * The one shared logger. Import this everywhere:
 *
 *   import { logger } from '@helpers/logger';
 *
 * Layer rule: console output is forbidden in pages/, helpers/, utilities/ and
 * api/ - this file is the single exception (enforced by the eslint override).
 * Logs are mirrored to reports/logs/automation.log.
 */
import * as fs from 'fs';
import * as path from 'path';
import { LOG_DIR } from '@config/app.config';

type Level = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LEVEL_ORDER: Record<Level, number> = { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 };
const activeLevel = (process.env.LOG_LEVEL?.toUpperCase() as Level) ?? 'INFO';
const logFile = path.join(LOG_DIR, 'automation.log');

const ensureLogDir = (): void => {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
};

const write = (level: Level, message: string): void => {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[activeLevel]) return;

  const line = `${new Date().toISOString()} [${level}] ${message}`;
  console.log(line);

  try {
    ensureLogDir();
    fs.appendFileSync(logFile, `${line}\n`, 'utf8');
  } catch {
    // Never let logging break a test run.
  }
};

export const logger = {
  debug: (message: string) => write('DEBUG', message),
  info: (message: string) => write('INFO', message),
  warn: (message: string) => write('WARN', message),
  error: (message: string) => write('ERROR', message),
};
