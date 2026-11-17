import { expect as baseExpect } from '@playwright/test';
import { config } from '../config/config';

/**
 * Playwright's web-first `expect`, pre-configured with the environment's assertion
 * timeout. Step definitions import `expect` from here (not from @playwright/test)
 * so every assertion honours config/environments/<env>.json.
 */
export const expect = baseExpect.configure({ timeout: config.timeouts.expect });
