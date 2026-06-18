const { resolveCustomerForUser } = require('../../utils/customerResolver');

describe('customerResolver', () => {
  test('returns null when user is missing', async () => {
    expect(await resolveCustomerForUser(null)).toBeNull();
  });
});
