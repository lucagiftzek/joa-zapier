'use strict';

const BASE_URL = 'https://api.jobopportunitiesapi.org';
const REGISTER_URL = 'https://jobopportunitiesapi.org/register';
const DOCS_URL = 'https://jobopportunitiesapi.org/docs';

const REMOTE_CHOICES = [
  { value: 'remote', label: 'Remote', sample: 'remote' },
  { value: 'hybrid', label: 'Hybrid', sample: 'hybrid' },
  { value: 'on_site', label: 'On site', sample: 'on_site' },
  { value: 'not_stated', label: 'Not stated', sample: 'not_stated' },
];

const EMPLOYMENT_TYPE_CHOICES = [
  'Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship',
].map((v) => ({ value: v, label: v, sample: v })).concat([
  { value: 'not_stated', label: 'Not stated', sample: 'not_stated' },
]);

const SENIORITY_CHOICES = [
  'Intern', 'Entry', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'Executive',
].map((v) => ({ value: v, label: v, sample: v })).concat([
  { value: 'not_stated', label: 'Not stated', sample: 'not_stated' },
]);

const CATEGORY_CHOICES = [
  'Consulting & Strategy', 'Construction & Trades', 'Customer Support', 'Data & Analytics', 'Design',
  'Education', 'Engineering', 'Finance', 'Healthcare', 'Hospitality', 'HR & Recruiting',
  'Legal & Compliance', 'Logistics & Transport', 'Manufacturing', 'Marketing', 'Operations & Admin',
  'Procurement', 'Product', 'Retail', 'Safety & Environment', 'Sales', 'Science & Research', 'Security',
  'Skilled Technician',
].map((v) => ({ value: v, label: v, sample: v })).concat([
  { value: 'uncategorised', label: 'Uncategorised', sample: 'uncategorised' },
]);

module.exports = {
  BASE_URL,
  REGISTER_URL,
  DOCS_URL,
  REMOTE_CHOICES,
  EMPLOYMENT_TYPE_CHOICES,
  SENIORITY_CHOICES,
  CATEGORY_CHOICES,
};
