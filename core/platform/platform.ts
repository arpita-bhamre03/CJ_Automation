/**
 * Portal / platform resolution.
 *
 * CentraJob DEV is four separate React origins. Tests name a portal; this module
 * turns that name into a URL for the active environment. Nothing else in the
 * framework should read portal URLs directly.
 */
import { currentEnvironment, getPortalUrl, type Portal } from '@config/config';

export type { Portal };

export const PORTALS: readonly Portal[] = ['candidate', 'employer', 'college', 'admin'] as const;

export const isPortal = (value: string): value is Portal =>
  (PORTALS as readonly string[]).includes(value);

export const resolvePortalUrl = (portal: Portal): string => getPortalUrl(portal);

export const resolvePortalFromEnv = (fallback: Portal = 'candidate'): Portal => {
  const raw = process.env.PLATFORM ?? process.env.PORTAL;
  return raw && isPortal(raw) ? raw : fallback;
};

export const activeEnvironmentName = (): string => currentEnvironment.name;
