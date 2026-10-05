'use strict';

// A few real calls. Skipped unless JOA_API_KEY is set. Every returned row is metered: keep this small.
const zapier = require('zapier-platform-core');
const App = require('../index');

const appTester = zapier.createAppTester(App);
const KEY = process.env.JOA_API_KEY;
const live = KEY ? describe : describe.skip;

live('live API', () => {
  const authData = { api_key: KEY };

  it('auth test returns a plan for the label', async () => {
    const me = await appTester(App.authentication.test, { authData });
    expect(App.authentication.connectionLabel({}, { inputData: me })).toMatch(/ plan$/);
    expect(me.limits.max_page_size).toBeGreaterThan(0);
  });

  it('new_job returns newest-first jobs within the window', async () => {
    const jobs = await appTester(App.triggers.new_job.operation.perform, {
      authData,
      inputData: { country: ['DE'], max_results: '3', lookback_hours: '48' },
    });
    expect(jobs.length).toBeGreaterThan(0);
    expect(jobs.length).toBeLessThanOrEqual(3);
    const dates = jobs.map((j) => j.posted_at);
    expect([...dates].sort().reverse()).toEqual(dates);
    const found = await appTester(App.searches.find_job.operation.perform, {
      authData,
      inputData: { job: jobs[0].slug },
    });
    expect(found[0].id).toBe(jobs[0].id);
  });

  it('job_closed returns closed jobs', async () => {
    const jobs = await appTester(App.triggers.job_closed.operation.perform, {
      authData,
      inputData: { max_results: '2' },
    });
    expect(jobs.length).toBeLessThanOrEqual(2);
    for (const j of jobs) expect(j.status).toBe('closed');
  });

  it('find_company by name and slug, and a bad key is rejected', async () => {
    const byName = await appTester(App.searches.find_company.operation.perform, {
      authData,
      inputData: { name: 'google', max_results: '1' },
    });
    expect(byName.length).toBe(1);
    const bySlug = await appTester(App.searches.find_company.operation.perform, {
      authData,
      inputData: { slug: byName[0].slug },
    });
    expect(bySlug[0].slug).toBe(byName[0].slug);
    await expect(appTester(App.authentication.test, { authData: { api_key: 'joa_invalid_key_for_test' } })).rejects.toThrow(/401/);
  });
});
