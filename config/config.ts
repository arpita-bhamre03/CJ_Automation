/**
 * Environment configuration - single source of truth for CentraJob URLs and timings.
 *
 * Layer rule: this file holds environment configuration only. No test data,
 * no locators, no credentials (credentials live in the environment - see settings.ts).
 */
import { config as loadEnv } from 'dotenv';

loadEnv();

export type EnvironmentName = 'dev' | 'qa' | 'uat' | 'prod';

/** The CentraJob portals. Each is a separate React app on its own origin. */
export type Portal = 'candidate' | 'employer' | 'college' | 'admin';

export interface AppEnvironmentConfig {
  name: EnvironmentName;
  /** Default portal used when a test does not name one. */
  baseUrl: string;
  portals: Record<Portal, string>;
  timeout: number;
  retryCount: number;
}

export const envName = (process.env.ENV as EnvironmentName | undefined) ?? 'dev';

/**
 * DEV is the active environment. QA/UAT/PROD entries are placeholders following the
 * same host pattern; they are unverified and must be confirmed before use.
 */
export const appConfig: Record<EnvironmentName, AppEnvironmentConfig> = {
  dev: {
    name: 'dev',
    baseUrl: 'https://dev-candidate.centrajob.com',
    portals: {
      candidate: 'https://dev-candidate.centrajob.com',
      employer: 'https://dev-employer.centrajob.com',
      college: 'https://dev-college.centrajob.com',
      admin: 'https://dev-adminpanel.centrajob.com/job-fair',
    },
    timeout: 30_000,
    retryCount: 1,
  },
  qa: {
    name: 'qa',
    baseUrl: 'https://qa-candidate.centrajob.com',
    portals: {
      candidate: 'https://qa-candidate.centrajob.com',
      employer: 'https://qa-employer.centrajob.com',
      college: 'https://qa-college.centrajob.com',
      admin: 'https://qa-adminpanel.centrajob.com/job-fair',
    },
    timeout: 30_000,
    retryCount: 1,
  },
  uat: {
    name: 'uat',
    baseUrl: 'https://uat-candidate.centrajob.com',
    portals: {
      candidate: 'https://uat-candidate.centrajob.com',
      employer: 'https://uat-employer.centrajob.com',
      college: 'https://uat-college.centrajob.com',
      admin: 'https://uat-adminpanel.centrajob.com/job-fair',
    },
    timeout: 30_000,
    retryCount: 1,
  },
  prod: {
    name: 'prod',
    baseUrl: 'https://candidate.centrajob.com',
    portals: {
      candidate: 'https://candidate.centrajob.com',
      employer: 'https://employer.centrajob.com',
      college: 'https://college.centrajob.com',
      admin: 'https://adminpanel.centrajob.com/job-fair',
    },
    timeout: 30_000,
    retryCount: 1,
  },
};

export const currentEnvironment: AppEnvironmentConfig = appConfig[envName] ?? appConfig.dev;

/** Resolve a portal URL for the active environment. */
export const getPortalUrl = (portal: Portal): string => currentEnvironment.portals[portal];
