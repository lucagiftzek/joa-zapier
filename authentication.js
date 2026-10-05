'use strict';

const { BASE_URL, SIGNUP_URL } = require('./lib/constants');

module.exports = {
  type: 'custom',
  fields: [
    {
      key: 'api_key',
      label: 'API key',
      type: 'password',
      required: true,
      helpText: `Your Job Opportunities API (JOA) key. Get a free key (no card required) at [jobopportunitiesapi.org/signup](${SIGNUP_URL}); existing keys are in your account dashboard.`,
    },
  ],
  // GET /v1/me returns the key's plan, status and limits.
  test: { url: `${BASE_URL}/v1/me` },
  // The test response (from /v1/me) is in bundle.inputData; show the plan, never the key.
  connectionLabel: (z, bundle) =>
    bundle.inputData && bundle.inputData.plan ? `${bundle.inputData.plan} plan` : '',
};
