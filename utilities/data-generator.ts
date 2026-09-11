/**
 * Unique value generation for names, emails, companies, job titles and phones.
 * Uses a timestamp + random suffix so parallel runs never collide.
 *
 * Implemented without an external faker dependency - no new packages were added
 * to this project (see README "Dependencies").
 */
const FIRST_NAMES = ['Aarav', 'Diya', 'Ishaan', 'Meera', 'Rohan', 'Saanvi', 'Vivaan', 'Anaya'];
const LAST_NAMES = ['Sharma', 'Patel', 'Nair', 'Goyal', 'Reddy', 'Iyer', 'Desai', 'Mehta'];
const JOB_TITLES = ['QA Engineer', 'Backend Developer', 'Data Analyst', 'Product Manager'];

const pick = <T>(values: readonly T[]): T => values[Math.floor(Math.random() * values.length)];

/** Short unique token: base36 timestamp + 4 random chars. */
export const uniqueSuffix = (): string =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const firstName = (): string => pick(FIRST_NAMES);
export const lastName = (): string => pick(LAST_NAMES);
export const fullName = (): string => `${firstName()} ${lastName()}`;

/** Routed to yopmail, matching the disposable-inbox convention used in DEV. */
export const email = (prefix = 'qa'): string => `${prefix}.${uniqueSuffix()}@yopmail.com`;

export const companyName = (): string => `QA Test Company ${uniqueSuffix()}`;
export const jobTitle = (): string => `${pick(JOB_TITLES)} ${uniqueSuffix()}`;

/** 10-digit number starting 6-9, matching Indian mobile format. */
export const phoneNumber = (): string => {
  const first = 6 + Math.floor(Math.random() * 4);
  const rest = Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(9, '0');
  return `${first}${rest}`;
};

/**
 * A password meeting CentraJob's rules: at least 8 characters with an upper-case
 * letter, a lower-case letter, a digit and a special character.
 */
export const password = (): string => `Qa@${uniqueSuffix()}9Z`;

const COMPANY_WORDS = ['Nexora', 'Brightwave', 'Veltrix', 'Arkline', 'Tesora', 'Quantiva', 'Lumora', 'Crestline'];
const COMPANY_TYPES = ['Technologies', 'Solutions', 'Systems', 'Labs', 'Consulting', 'Services'];

export interface Person {
  firstName: string;
  lastName: string;
  fullName: string;
}

/** A first and last name that belong together, for building matching emails. */
export const person = (): Person => {
  const first = firstName();
  const last = lastName();
  return { firstName: first, lastName: last, fullName: `${first} ${last}` };
};

/** A random number with exactly `digits` digits and no leading zero, e.g. 4821. */
export const shortNumber = (digits = 4): string => {
  const min = 10 ** (digits - 1);
  return String(min + Math.floor(Math.random() * 9 * min));
};

/** A realistic but fictional company name, e.g. "Nexora Solutions". */
export const businessName = (): string => `${pick(COMPANY_WORDS)} ${pick(COMPANY_TYPES)}`;
