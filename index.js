'use strict';

const authentication = require('./authentication');
const middleware = require('./middleware');
const newJob = require('./triggers/new_job');
const jobClosed = require('./triggers/job_closed');
const companyList = require('./triggers/company_list');
const findJob = require('./searches/find_job');
const searchJobs = require('./searches/search_jobs');
const findCompany = require('./searches/find_company');

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  // Inputs are normalised in lib/utils.js, so keep them exactly as the user mapped them (check D028).
  flags: { cleanInputData: false },

  authentication,
  beforeRequest: [...middleware.befores],
  afterResponse: [...middleware.afters],

  triggers: {
    [newJob.key]: newJob,
    [jobClosed.key]: jobClosed,
    [companyList.key]: companyList,
  },
  searches: {
    [findJob.key]: findJob,
    [searchJobs.key]: searchJobs,
    [findCompany.key]: findCompany,
  },
  creates: {},
  resources: {},
};
