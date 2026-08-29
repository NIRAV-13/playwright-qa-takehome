export interface Credentials {
  email: string;
  password: string;
}
 
/**
 * Reads an environment variable, treating an empty value as absent. CI systems
 * substitute an empty string for an unset secret rather than leaving the
 * variable undefined, and `??` would pass that straight through — so the suite
 * would silently run with blank credentials instead of the configured defaults.
 */
function envOrDefault(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value.trim() === '' ? fallback : value;
}
 
/**
 * Credentials are read from the environment so they can be swapped per
 * environment (or supplied as CI secrets) without touching test code. The
 * defaults are the demo credentials supplied with the assignment.
 */
export const VALID_USER: Credentials = {
  email: envOrDefault('APP_EMAIL', 'admin@test.com'),
  password: envOrDefault('APP_PASSWORD', 'password123'),
};
 
export const INVALID_USER: Credentials = {
  email: VALID_USER.email,
  password: 'definitely-not-the-password',
};