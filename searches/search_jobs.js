'use strict';

const { BASE_URL } = require('../lib/constants');
const { jobFilters, toInt, clean, paginate } = require('../lib/utils');
const { filterFields, includeDescriptionField, jobOutputFields, jobSample } = require('../lib/fields');

const perform = async (z, bundle) => {
  const input = bundle.inputData || {};
  const params = Object.assign(jobFilters(input), clean({ posted_after: input.posted_after }));
  const max = toInt(input.max_results, 10, 1, 100);
  return paginate(z, `${BASE_URL}/v1/jobs`, params, max);
};

module.exports = {
  key: 'search_jobs',
  noun: 'Job',
  display: {
    label: 'Find Jobs',
    description:
      'Finds employer-direct jobs matching keywords and filters, newest first. Turn on line items in the Zap to use every result.',
  },
  operation: {
    perform,
    inputFields: [
      ...filterFields,
      {
        key: 'posted_after',
        label: 'Posted after',
        type: 'datetime',
        required: false,
        helpText: 'Only jobs posted after this date or time.',
      },
      includeDescriptionField,
      {
        key: 'max_results',
        label: 'Maximum results',
        type: 'integer',
        required: false,
        default: '10',
        helpText: 'How many jobs to return (1 to 100). Every returned job counts against your plan\'s record allowance.',
      },
    ],
    sample: jobSample,
    outputFields: jobOutputFields,
  },
};
