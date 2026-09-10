/**
 * Candidate portal login.
 *
 * Migrated from CJ_Automation/tests/web/login/login.spec.ts. Test intent and the
 * expected result are unchanged: navigate to the candidate portal, log in, and
 * confirm the resulting URL. What changed is only structure - the page object now
 * arrives via a fixture instead of `new LoginPage(page)`, credentials come from
 * the environment instead of a committed JSON file, and the URL comes from config
 * instead of being read out of test data.
 *
 * Layer rule: assertions live here; the page object performs no verification.
 */
import { test, expect } from '@fixtures/test-fixtures';

test.describe('Candidate login UI', () => {
  test(
    'should open candidate portal and login successfully @smoke @regression @login @candidate',
    async ({ page, candidateLoginPage, candidateUser }) => {
      await candidateLoginPage.navigateToLoginPage();
      await candidateLoginPage.login(candidateUser.username, candidateUser.password);

      // Assertion preserved verbatim from the pre-migration test.
      await expect(page).toHaveURL(/.*(candidate|dashboard|home).*/i);
    },
  );
});
