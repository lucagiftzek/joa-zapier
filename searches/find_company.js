'use strict';

const { BASE_URL } = require('../lib/constants');
const { clean, toInt, paginate } = require('../lib/utils');
const { companyOutputFields, companySample } = require('../lib/fields');

const perform = async (z, bundle) => {
  const input = bundle.inputData || {};
  if (input.slug) {
    const response = await z.request({
      url: `${BASE_URL}/v1/companies/${encodeURIComponent(String(input.slug).trim())}`,
      skipThrowForStatus: true,
    });
    if (response.status === 404) return [];
    response.throwForStatus();
    const body = response.data || {};
    const company = body.data || body;
    return company && company.slug ? [company] : [];
  }
  if (!input.name) {
    throw new z.errors.Error('Enter a company name or a company slug.', 'InvalidParameter', 400);
  }
  const params = clean({ q: input.name, country: input.country && String(input.country).toUpperCase() });
  return paginate(z, `${BASE_URL}/v1/companies`, params, toInt(input.max_results, 5, 1, 50));
};

module.exports = {
  key: 'find_company',
  noun: 'Company',
  display: {
    label: 'Find Company',
    description: 'Finds employers by name, or one employer by its slug.',
  },
  operation: {
    perform,
    inputFields: [
      {
        key: 'name',
        label: 'Company name',
        type: 'string',
        required: false,
        helpText: 'Search employers by name, for example `google`. Leave empty if you enter a slug.',
      },
      {
        key: 'slug',
        label: 'Company slug',
        type: 'string',
        required: false,
        helpText: 'Get exactly one employer by its slug, for example `google`. Takes precedence over the name.',
      },
      {
        key: 'country',
        label: 'Country',
        type: 'string',
        required: false,
        helpText: 'Two-letter ISO country code, for example `US`.',
      },
      {
        key: 'max_results',
        label: 'Maximum results',
        type: 'integer',
        required: false,
        default: '5',
        helpText: 'How many companies to return when searching by name (1 to 50).',
      },
    ],
    sample: companySample,
    outputFields: companyOutputFields,
  },
};
