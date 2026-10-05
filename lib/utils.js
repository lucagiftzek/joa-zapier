'use strict';

/** Comma list from a Zapier list field, a comma string or undefined. */
const toCommaList = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parts = (Array.isArray(value) ? value : String(value).split(','))
    .map((v) => String(v).trim())
    .filter(Boolean);
  return parts.length ? parts.join(',') : undefined;
};

const clean = (params) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );

const isTrue = (v) => v === true || String(v).toLowerCase() === 'true' || String(v).toLowerCase() === 'yes';

/** /v1/jobs filters from bundle.inputData. */
const jobFilters = (input = {}) =>
  clean({
    q: input.q,
    country: toCommaList(input.country) && toCommaList(input.country).toUpperCase(),
    remote: toCommaList(input.remote),
    employment_type: toCommaList(input.employment_type),
    seniority: toCommaList(input.seniority),
    category: toCommaList(input.category),
    company: toCommaList(input.company),
    include_description: isTrue(input.include_description) ? 'true' : undefined,
  });

const toInt = (value, fallback, min, max) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
};

/** ISO timestamp `hours` ago, without milliseconds. */
const hoursAgo = (hours, now = Date.now()) =>
  new Date(now - hours * 3600 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');

/**
 * Page through a keyset-paginated list (/v1/jobs, /v1/jobs/closed, /v1/companies)
 * until `max` rows are collected. The API silently clamps `limit` to the key's
 * max_page_size, so we keep following next_cursor instead of trusting one page.
 */
const paginate = async (z, url, params, max) => {
  const rows = [];
  let cursor;
  let pages = 0;
  do {
    const response = await z.request({
      url,
      params: clean({ ...params, limit: Math.min(200, max - rows.length), cursor }),
    });
    const body = response.data || {};
    rows.push(...(body.data || []));
    cursor = body.has_more ? body.next_cursor : null;
    pages += 1;
  } while (cursor && rows.length < max && pages < 20);
  return rows.slice(0, max);
};

module.exports = { isTrue, toCommaList, clean, jobFilters, toInt, hoursAgo, paginate };
