/**
 * There is no login system in this app — a single demo user is
 * seeded on boot (see prisma/seed.ts and repository/user.repository.ts)
 * and every request implicitly acts as that user.
 */
export const DEMO_USER_ID = 'demo-user';
export const DEMO_USER_EMAIL = 'demo@example.com';
export const DEMO_USER_NAME = 'Demo User';

/**
 * The 4 languages this app supports end-to-end — the manual language
 * selector, product info shown to the user, and (conceptually)
 * `SearchHistory.language`. Not Open Food Facts-specific; the
 * integration layer maps these onto OFF's own language codes.
 */
export const SUPPORTED_LANGUAGES = ['en', 'de', 'fr'];
