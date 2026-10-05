'use strict';

const { BASE_URL } = require('../lib/constants');

const PAGE = 50;

// Hidden trigger that feeds the "Companies" dynamic dropdown (largest employers first).
const perform = async (z, bundle) => {
  const page = (bundle.meta && bundle.meta.page) || 0;
  const response = await z.request({
    url: `${BASE_URL}/v1/companies`,
    params: { limit: PAGE, offset: page * PAGE },
  });
  return (response.data.data || []).map((c) => Object.assign({ id: c.slug }, c));
};

module.exports = {
  key: 'company_list',
  noun: 'Company',
  display: {
    label: 'List Companies',
    description: 'Lists employers for the company dropdown.',
    hidden: true,
  },
  operation: {
    perform,
    canPaginate: true,
    sample: { id: 'example-logistics', slug: 'example-logistics', name: 'Example Logistics' },
    outputFields: [
      { key: 'slug', label: 'Company slug' },
      { key: 'name', label: 'Name' },
    ],
  },
};
