'use strict';

const { BASE_URL } = require('../lib/constants');
const { jobOutputFields, jobSample } = require('../lib/fields');
const { isTrue } = require('../lib/utils');

const perform = async (z, bundle) => {
  const ref = String(bundle.inputData.job || '').trim();
  if (!ref) throw new z.errors.Error('Enter a job ID or slug.', 'InvalidParameter', 400);
  const response = await z.request({
    url: `${BASE_URL}/v1/jobs/${encodeURIComponent(ref)}`,
    params: isTrue(bundle.inputData.include_closed) ? { include_closed: 'true' } : {},
    skipThrowForStatus: true,
  });
  // Not found is an empty result for a search, not an error.
  if (response.status === 404) return [];
  if (response.status === 410) return [];
  const body = response.data || {};
  if (!body.data) return [];
  const job = Object.assign({}, body.data);
  if (body.description !== undefined) job.description = body.description;
  return [job];
};

module.exports = {
  key: 'find_job',
  noun: 'Job',
  display: {
    label: 'Find Job',
    description: 'Finds one job by its ID or slug, including the job description.',
  },
  operation: {
    perform,
    inputFields: [
      {
        key: 'job',
        label: 'Job ID or slug',
        type: 'string',
        required: true,
        helpText: 'The `id` (UUID) or `slug` of a job, as returned by the New Job trigger or the Find Jobs search.',
      },
      {
        key: 'include_closed',
        label: 'Include closed jobs',
        type: 'boolean',
        required: false,
        default: 'false',
        helpText: 'Return the job even after it has closed (its status is then `closed`).',
      },
    ],
    sample: Object.assign({}, jobSample, {
      description: 'We are looking for a Warehouse Associate to join our team in Hamburg.\n\nWhat you will do: ...',
    }),
    outputFields: jobOutputFields,
  },
};
