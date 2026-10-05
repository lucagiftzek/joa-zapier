'use strict';

const { BASE_URL } = require('../lib/constants');
const { jobFilters, toInt, hoursAgo, paginate } = require('../lib/utils');
const { filterFields, jobOutputFields, jobSample } = require('../lib/fields');

const perform = async (z, bundle) => {
  const input = bundle.inputData || {};
  const params = jobFilters(input);
  delete params.include_description;
  params.closed_after = hoursAgo(toInt(input.lookback_hours, 48, 1, 168));
  const max = toInt(input.max_results, 20, 1, 100);
  // /v1/jobs/closed is ordered by closed_at DESC: newest closure first, as Zapier expects.
  return paginate(z, `${BASE_URL}/v1/jobs/closed`, params, max);
};

module.exports = {
  key: 'job_closed',
  noun: 'Job',
  display: {
    label: 'Job Closed',
    description: 'Triggers when a job matching your filters closes or expires at its source.',
  },
  operation: {
    perform,
    inputFields: [
      ...filterFields,
      {
        key: 'lookback_hours',
        label: 'Look-back window (hours)',
        type: 'integer',
        required: false,
        default: '48',
        helpText:
          'Each check asks for closures recorded within this many hours (1 to 168). Closures are confirmed by a daily verification, so keep at least 48.',
      },
      {
        key: 'max_results',
        label: 'Closures per check',
        type: 'integer',
        required: false,
        default: '20',
        helpText:
          'Most recent matching closures read on each check (1 to 100). Every returned job counts against your plan\'s record allowance, so use filters.',
      },
    ],
    sample: Object.assign({}, jobSample, {
      status: 'closed',
      closed_at: '2026-10-06T03:12:00Z',
      closed_reason: 'expired_upstream',
    }),
    outputFields: jobOutputFields,
  },
};
