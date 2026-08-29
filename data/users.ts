export interface Credentials {
  email: string;
  password: string;
}

/**
 * Credentials are read from the environment so they can be swapped per
 * environment (or supplied as CI secrets) without touching test code. The
 * defaults are the demo credentials supplied with the assignment.
 */
export const VALID_USER: Credentials = {
  email: process.env.APP_EMAIL ?? 'admin@test.com',
  password: process.env.APP_PASSWORD ?? 'password123',
};

export const INVALID_USER: Credentials = {
  email: VALID_USER.email,
  password: 'definitely-not-the-password',
};
