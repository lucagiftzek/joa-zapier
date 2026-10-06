# Job Opportunities API (JOA) — Zapier integration

A Zapier Platform CLI integration (`zapier-platform-core` 19.1.0, custom API-key auth) for the
**Job Opportunities API (JOA)**: employer-direct job postings from employers' own applicant tracking systems and
career sites. Every field is tagged published, inferred or absent, and closures are tracked.

- Website: https://jobopportunitiesapi.org — coverage (live figures): https://jobopportunitiesapi.org/coverage
- API docs: https://jobopportunitiesapi.org/docs
- Free API key (no card required): https://jobopportunitiesapi.org/register

## What it offers

| Kind | Key | Label | Endpoint |
|---|---|---|---|
| Auth | — | API key (`Authorization: Bearer`), test `GET /v1/me`, connection label "`<plan>` plan" | `/v1/me` |
| Trigger | `new_job` | **New Job** — filters: keywords, countries, work arrangement, employment type, seniority, category, companies; look-back window; jobs per check | `GET /v1/jobs` |
| Trigger | `job_closed` | **Job Closed** — same filters; newest closure first | `GET /v1/jobs/closed` |
| Trigger (hidden) | `company_list` | feeds the Companies dynamic dropdown (paged) | `GET /v1/companies` |
| Search | `find_job` | **Find Job** — by ID or slug, with the description; optional closed jobs | `GET /v1/jobs/{id}` |
| Search | `search_jobs` | **Find Jobs** — filters + posted after + maximum results (users may turn on line items) | `GET /v1/jobs` |
| Search | `find_company` | **Find Company** — by name (and country) or slug | `GET /v1/companies`, `/v1/companies/{slug}` |

Design notes
- Zapier dedupes polling triggers by `id` and keeps no cursor between polls, so **New Job** asks for jobs posted within
  a look-back window (default 24 h) and reads at most "Jobs per check" (default 20) newest rows. **Job Closed** uses
  `/v1/jobs/closed` (ordered by closure time, newest first, every `/v1/jobs` filter) rather than the unfiltered,
  ascending `/v1/jobs/expired` feed, which needs a stored cursor Zapier cannot keep. A "Job Changed" trigger is left out
  for the same reason (the change feed needs a cursor); the Pipedream, Activepieces and Make builds have it.
- Every returned row counts against the plan's record allowance; field help texts say so and defaults are small.
- The API silently clamps `limit` to the key's `max_page_size`; list code follows `next_cursor` until it has the
  requested number of rows.
- Errors: 401 (bad key + registration link), 402 (record allowance used up), 403 (plan does not include the endpoint),
  404 (searches return no result instead), 410 (listing withdrawn), 400/422 (API's parameter message),
  429 (core's ThrottledError honours `Retry-After`).
- `apply_url` is always the employer's own apply link. When `attribution` / `canonical_url` are present, show the
  attribution with the listing and link to `canonical_url`.

## Develop and test

```bash
npm install
npm test                                   # jest + nock + appTester, 12 mocked tests
set -a; . ~/.config/joa-integrations/test.env; set +a
npm run test:live                          # 4 tests, a handful of real calls
npx zapier-platform validate               # schema + integration checks (works without login)
npx zapier-platform build                  # build/build.zip + build/source.zip
```

## Publishing

See [PUBLISHING.md](PUBLISHING.md). Nothing has been registered, pushed or published.

## Showing listings publicly

If you display the listings publicly, the Job Opportunities API terms ask for a visible credit, "Data: Job Opportunities API", linking to https://jobopportunitiesapi.org.

## Licence

MIT — see [LICENSE](LICENSE). Maintainer: Loukas Tzekos <support@jobopportunitiesapi.org>.
