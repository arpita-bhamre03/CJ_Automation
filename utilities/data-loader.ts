/**
 * Generic file loading for test data.
 *
 * Layer rule: utilities are project-independent and must never import from pages/.
 */
import * as fs from 'fs';
import * as path from 'path';
import { TESTDATA_DIR } from '@config/app.config';

/** Load a JSON file relative to testdata/, e.g. loadJson('users.json'). */
export const loadJson = <T>(relativePath: string): T => {
  const fullPath = path.join(TESTDATA_DIR, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Test data file not found: ${fullPath}`);
  }
  return JSON.parse(fs.readFileSync(fullPath, 'utf8')) as T;
};

/** Load expected UI strings for a feature, e.g. loadLocale('login'). */
export const loadLocale = (feature: string, lang = process.env.LANG_CODE ?? 'en') =>
  loadJson<Record<string, string>>(path.join(feature, 'locales', `${lang}.json`));
