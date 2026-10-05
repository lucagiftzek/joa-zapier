# Publishing the Zapier integration (run only after Luca approves)

Nothing below has been run. Steps 2 onwards need a Zapier account (a free account is enough to build and test).
Note: CLI v19 removed the old `zapier` binary — the command is `zapier-platform`.

## 1. Already done locally (no account)
- `npm test` (12 mocked) and `npm run test:live` (4 live) green.
- `npx zapier-platform validate`: structurally sound, **28 integration checks passed, 0 warnings**.
- `npx zapier-platform build`: `build/build.zip` and `build/source.zip`.

## 2. Command sequence (Luca / parent)
```bash
cd ~/joa-integrations/zapier
npm install
npx zapier-platform login              # add --sso for Google/Microsoft sign-in; writes ~/.zapierrc
npx zapier-platform register "Job Opportunities API (JOA)" \
  -D "Job Opportunities API (JOA) is a jobs API of employer-direct postings from company career sites, with every closure tracked." \
  -u https://jobopportunitiesapi.org -a private -c "hr-talent-recruitment"   # check category slug in the prompt
npx zapier-platform push               # uploads version 1.0.0 (private, visible only to the account)
# In the Zapier editor: connect with a JOA key, build one Zap per trigger/search, turn each Zap ON,
# get at least one successful run in Zap History for every trigger and search (required for review).
npx zapier-platform promote 1.0.0      # prints the URL of the publishing form when checks pass
```
Commit the `.zapierapprc` written by `register` (it holds the integration id) after removing it from `.gitignore`.

## 3. Listing copy (drafts)
- **Name:** Job Opportunities API (JOA) — alternative if Zapier insists on the bare brand: "Job Opportunities API".
- **Description (≤140 chars, starts with the name, no links, no mention of Zapier):**
  "Job Opportunities API (JOA) is a jobs API of employer-direct postings from company career sites, with every closure tracked." (124 characters)
- **Long description (for the form):** Job Opportunities API (JOA) returns job postings collected directly from employers'
  own applicant tracking systems and career sites. Each field says whether it was published by the employer, inferred,
  or absent, and closed roles are tracked so stale listings can be removed. Use it to route new roles that match your
  filters into a spreadsheet, CRM, chat channel or job board, and to retire jobs as soon as they close.
- **Homepage:** https://jobopportunitiesapi.org · **Category:** HR & Recruiting (or Developer Tools).
- **Logo:** square PNG at least 512 × 512 px (not in this repo — needs the JOA brand asset); primary colour from the brand.

## 4. Zapier publishing requirements checklist
- [x] HTTPS, production API (`https://api.jobopportunitiesapi.org`), no hard-coded credentials.
- [x] Credentials asked only in the authentication step; API-key field with helpText linking to the registration page.
- [x] Valid connection label (plan name; never the key).
- [x] English text; trigger "New Job"/"Job Closed", searches "Find Job"/"Find Jobs"/"Find Company" (no "Get").
- [x] helpText on every input field; sample data and output fields on every trigger and search.
- [x] Friendly, specific error messages; searches return `[]` for not found.
- [x] Integration checks: 28 passed, 0 warnings (`zapier-platform validate`).
- [ ] Integration owner: the Zapier account must belong to someone with an email on jobopportunitiesapi.org,
      and at least one admin team member must use that domain.
- [ ] API publicly launched and documented — link https://jobopportunitiesapi.org/docs in the form.
- [ ] Test account for Zapier staff: a non-expiring JOA key on an account using **integration-testing@zapier.com**,
      password changeable by Zapier support, with Growth-or-above features if closures should be reviewed on that plan.
- [ ] Every trigger and search used in a live Zap that is ON with ≥1 successful run in Zap History (do not delete them).
- [ ] Logo PNG ≥512×512, category, primary colour (package/branding settings in the developer platform).
- [ ] No "scraping" wording and no actions naming third-party sites (copy above complies).
- [ ] Promote, fill in the form, answer Zapier's review email.
