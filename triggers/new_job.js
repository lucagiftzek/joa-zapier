'use strict';

const { BASE_URL } = require('../lib/constants');
const { jobFilters, toInt, hoursAgo, paginate } = require('../lib/utils');
const { filterFields, includeDescriptionField, jobOutputFields, jobSample } = require('../lib/fields');

const perform = async (z, bundle) => {
  const input = bundle.inputData || {};
  const params = jobFilters(input);
  // Zapier keeps no cursor between polls: look back a fixed window and let Zapier dedupe by id.
  params.posted_after = hoursAgo(toInt(input.lookback_hours, 24, 1, 168));
  const max = toInt(input.max_results, 20, 1, 100);
  // Newest first, as Zapier expects.
  return paginate(z, `${BASE_URL}/v1/jobs`, params, max);
};

module.exports = {
  key: 'new_job',
  noun: 'Job',
  display: {
    label: 'New Job',
    description: 'Triggers when a new employer-direct job matching your filters is published.',
  },
  operation: {
    perform,
    inputFields: [
      ...filterFields,
      includeDescriptionField,
      {
        key: 'lookback_hours',
        label: 'Look-back window (hours)',
        type: 'integer',
        required: false,
        default: '24',
        helpText:
          'Each check asks for jobs posted within this many hours (1 to 168). Jobs are matched once; a longer window catches late-indexed jobs.',
      },
      {
        key: 'max_results',
        label: 'Jobs per check',
        type: 'integer',
        required: false,
        default: '20',
        helpText:
          'Most recent matching jobs read on each check (1 to 100). Every returned job counts against your plan\'s record allowance, so narrow filters keep usage low.',
      },
    ],
    sample: jobSample,
    outputFields: jobOutputFields,
  },
};
