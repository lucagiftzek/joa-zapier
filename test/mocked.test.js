'use strict';

const zapier = require('zapier-platform-core');
const nock = require('nock');
const App = require('../index');

const appTester = zapier.createAppTester(App);
const API = 'https://api.jobopportunitiesapi.org';
const authData = { api_key: 'test_key' };
const job = (id, extra = {}) => Object.assign({ id, slug: `job-${id}`, title: `Job ${id}`, company: 'Acme' }, extra);

beforeAll(() => nock.disableNetConnect());
afterAll(() => nock.enableNetConnect());
afterEach(() => nock.cleanAll());

describe('authentication', () => {
  it('tests the key with GET /v1/me and labels the connection with the plan', async () => {
    nock(API, { reqheaders: { authorization: 'Bearer test_key' } })
      .get('/v1/me')
      .reply(200, { plan: 'explore', status: 'active', limits: { max_page_size: 20 } });
    const result = await appTester(App.authentication.test, { authData });
    expect(result.plan).toBe('explore');
    const label = App.authentication.connectionLabel({}, { inputData: result });
    expect(label).toBe('explore plan');
  });

  it('maps 401 to a clear message with the signup link', async () => {
    nock(API).get('/v1/me').reply(401, { error: 'invalid_key', message: 'That key is not valid, or is no longer active.' });
    await expect(appTester(App.authentication.test, { authData: { api_key: 'bad' } })).rejects.toThrow(
      /rejected the API key \(401\).*jobopportunitiesapi\.org\/signup.*no longer active/
    );
  });
});

describe('new_job trigger', () => {
  it('sends filters, a posted_after window and pages past the server clamp', async () => {
    let seen;
    nock(API)
      .get('/v1/jobs')
      .query((q) => {
        seen = q;
        return !q.cursor;
      })
      .reply(200, { data: [job('a'), job('b')], next_cursor: 'c1', has_more: true })
      .get('/v1/jobs')
      .query((q) => q.cursor === 'c1' && q.limit === '1')
      .reply(200, { data: [job('c')], next_cursor: 'c2', has_more: true });
    const out = await appTester(App.triggers.new_job.operation.perform, {
      authData,
      inputData: {
        q: 'nurse',
        country: ['de', 'gb'],
        remote: ['remote', 'hybrid'],
        employment_type: ['Full-time'],
        seniority: ['Senior'],
        category: ['Healthcare'],
        company: ['acme'],
        max_results: '3',
        lookback_hours: '6',
      },
    });
    expect(out.map((j) => j.id)).toEqual(['a', 'b', 'c']);
    expect(seen).toMatchObject({
      q: 'nurse',
      country: 'DE,GB',
      remote: 'remote,hybrid',
      employment_type: 'Full-time',
      seniority: 'Senior',
      category: 'Healthcare',
      company: 'acme',
      limit: '3',
    });
    const ageH = (Date.now() - Date.parse(seen.posted_after)) / 3600e3;
    expect(ageH).toBeGreaterThan(5.9);
    expect(ageH).toBeLessThan(6.1);
  });

  it('every trigger and search has sample data and helpText on every input field', () => {
    const ops = [...Object.values(App.triggers), ...Object.values(App.searches)];
    for (const op of ops) {
      expect(op.operation.sample).toBeTruthy();
      expect(op.operation.sample.id || op.operation.sample.slug).toBeTruthy();
      for (const f of op.operation.inputFields || []) expect(f.helpText).toBeTruthy();
    }
  });
});

describe('job_closed trigger', () => {
  it('reads /v1/jobs/closed newest-closure-first with closed_after and filters', async () => {
    let seen;
    nock(API)
      .get('/v1/jobs/closed')
      .query((q) => {
        seen = q;
        return true;
      })
      .reply(200, { data: [job('z', { status: 'closed', closed_at: '2026-10-05T10:00:00Z' })], has_more: false });
    const out = await appTester(App.triggers.job_closed.operation.perform, {
      authData,
      inputData: { company: 'acme,globex' },
    });
    expect(out[0].status).toBe('closed');
    expect(seen.company).toBe('acme,globex');
    expect(seen.closed_after).toMatch(/Z$/);
    expect(seen.include_description).toBeUndefined();
  });

  it('maps 403 to a plan message', async () => {
    nock(API).get('/v1/jobs/closed').query(true).reply(403, { error: 'plan_upgrade_required', message: 'Growth plan needed.' });
    await expect(appTester(App.triggers.job_closed.operation.perform, { authData, inputData: {} })).rejects.toThrow(
      /does not include this endpoint \(403\).*Growth plan needed/
    );
  });
});

describe('searches', () => {
  it('find_job returns the job with its description, [] on 404', async () => {
    nock(API)
      .get('/v1/jobs/my-slug')
      .query({ include_closed: 'true' })
      .reply(200, { data: job('x'), description: 'Advert text' })
      .get('/v1/jobs/missing')
      .reply(404, { error: 'not_found', message: 'No listing with that id.' });
    const found = await appTester(App.searches.find_job.operation.perform, {
      authData,
      inputData: { job: 'my-slug', include_closed: true },
    });
    expect(found).toHaveLength(1);
    expect(found[0].description).toBe('Advert text');
    const none = await appTester(App.searches.find_job.operation.perform, {
      authData,
      inputData: { job: 'missing', include_closed: 'false' },
    });
    expect(none).toEqual([]);
  });

  it('search_jobs honours max_results and posted_after', async () => {
    nock(API)
      .get('/v1/jobs')
      .query({ q: 'go developer', limit: '2', posted_after: '2026-10-01' })
      .reply(200, { data: [job('1'), job('2')], has_more: true, next_cursor: 'n' });
    const out = await appTester(App.searches.search_jobs.operation.perform, {
      authData,
      inputData: { q: 'go developer', max_results: 2, posted_after: '2026-10-01' },
    });
    expect(out).toHaveLength(2);
  });

  it('find_company by name and by slug', async () => {
    nock(API)
      .get('/v1/companies')
      .query({ q: 'google', country: 'US', limit: '5' })
      .reply(200, { data: [{ slug: 'google', name: 'Google' }], has_more: false, next_cursor: null })
      .get('/v1/companies/google')
      .reply(200, { slug: 'google', name: 'Google' })
      .get('/v1/companies/nope')
      .reply(404, { error: 'not_found', message: 'No company.' });
    const byName = await appTester(App.searches.find_company.operation.perform, {
      authData,
      inputData: { name: 'google', country: 'us' },
    });
    expect(byName[0].slug).toBe('google');
    const bySlug = await appTester(App.searches.find_company.operation.perform, { authData, inputData: { slug: 'google' } });
    expect(bySlug[0].name).toBe('Google');
    const none = await appTester(App.searches.find_company.operation.perform, { authData, inputData: { slug: 'nope' } });
    expect(none).toEqual([]);
  });

  it('company_list paginates with offset for the dynamic dropdown', async () => {
    nock(API).get('/v1/companies').query({ limit: '50', offset: '50' }).reply(200, { data: [{ slug: 'acme', name: 'Acme' }] });
    const out = await appTester(App.triggers.company_list.operation.perform, { authData, meta: { page: 1 } });
    expect(out).toEqual([{ id: 'acme', slug: 'acme', name: 'Acme' }]);
  });
});

describe('error mapping', () => {
  it('429 becomes a ThrottledError using Retry-After', async () => {
    nock(API).get('/v1/jobs').query(true).reply(429, { error: 'rate_limited', message: 'Slow down' }, { 'Retry-After': '7' });
    const err = await appTester(App.searches.search_jobs.operation.perform, { authData, inputData: {} }).catch((e) => e);
    expect(err.name).toBe('ThrottledError');
    expect(err.message).toMatch(/429/);
    expect(err.message).toMatch(/"delay":7/);
  });

  it('402 and 422 carry the API message', async () => {
    nock(API).get('/v1/jobs').query(true).reply(402, { error: 'record_quota_exhausted', message: 'Allowance used.' });
    await expect(appTester(App.searches.search_jobs.operation.perform, { authData, inputData: {} })).rejects.toThrow(
      /record allowance.*Allowance used/
    );
    nock(API).get('/v1/jobs').query(true).reply(422, { error: 'bad_remote', message: 'Unknown remote "x".' });
    await expect(
      appTester(App.searches.search_jobs.operation.perform, { authData, inputData: { remote: 'x' } })
    ).rejects.toThrow(/rejected a parameter \(422\).*Unknown remote/);
  });
});
