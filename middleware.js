'use strict';

const { REGISTER_URL } = require('./lib/constants');

const includeBearerToken = (request, z, bundle) => {
  if (bundle.authData && bundle.authData.api_key) {
    request.headers = request.headers || {};
    request.headers.Authorization = `Bearer ${String(bundle.authData.api_key).trim()}`;
    request.headers.Accept = 'application/json';
  }
  return request;
};

const apiMessage = (response) => {
  let body = response.data;
  if (body === undefined) {
    try {
      body = JSON.parse(response.content);
    } catch (e) {
      body = null;
    }
  }
  if (body && typeof body === 'object') return body.message || body.error || '';
  return '';
};

/** Translate Job Opportunities API (JOA) HTTP errors into clear Zapier errors. */
const handleErrors = (response, z) => {
  const status = response.status;
  if (status < 400) return response;
  // Callers that handle a status themselves (searches treat 404 as "no result") opt out.
  if (response.skipThrowForStatus || (response.request && response.request.skipThrowForStatus)) return response;
  const msg = apiMessage(response);
  const said = msg ? ` API said: ${msg}` : '';
  switch (status) {
    case 401:
      throw new z.errors.Error(
        `Job Opportunities API (JOA) rejected the API key (401). Reconnect with a valid key; a free key (no card required) is available at ${REGISTER_URL}.${said}`,
        'AuthenticationError',
        401
      );
    case 402:
      throw new z.errors.Error(
        `Your Job Opportunities API (JOA) plan has used up its record allowance for this period (402).${said}`,
        'RecordQuotaExhausted',
        402
      );
    case 403:
      throw new z.errors.Error(
        `Your Job Opportunities API (JOA) plan does not include this endpoint (403). Upgrade the plan to use it.${said}`,
        'PlanUpgradeRequired',
        403
      );
    case 404:
      throw new z.errors.Error(`Not found in Job Opportunities API (JOA) (404).${said}`, 'NotFound', 404);
    case 410:
      throw new z.errors.Error(
        `The employer withdrew this listing (410); stop showing it.${said}`,
        'Gone',
        410
      );
    case 400:
    case 422:
      throw new z.errors.Error(
        `Job Opportunities API (JOA) rejected a parameter (${status}).${said}`,
        'InvalidParameter',
        status
      );
    case 429: {
      // zapier-platform-core already turns 429 into a ThrottledError honouring Retry-After before
      // afterResponse runs; this branch is a fallback for older cores.
      const retry = parseInt(response.getHeader ? response.getHeader('retry-after') : '', 10);
      const delay = Number.isNaN(retry) ? 60 : retry;
      throw new z.errors.ThrottledError(
        `Job Opportunities API (JOA) rate limit reached (429). Retrying in ${delay} seconds.${said}`,
        delay
      );
    }
    default:
      throw new z.errors.Error(
        `Job Opportunities API (JOA) returned HTTP ${status}.${said}`,
        'ApiError',
        status
      );
  }
};

module.exports = { befores: [includeBearerToken], afters: [handleErrors] };
