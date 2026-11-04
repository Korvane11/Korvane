# Korvane playbook

How Korvane runs, from finding a lead to a paid, launched site and a monthly
care plan. Written 2026-11-04 from research (sources at the end) and what
the first five sites taught. Prices and policies marked **proposed** are
Marce's decisions to make; nothing here is legal or tax advice.

The team: Marce (owner), Kadin, Jailen, Nick, Kai. Roles and tasks live in
the Lead Desk (https://claude.ai/artifact/QGEo1hNei97gBYWHrP1QoV); the
starting split is below.

## The tools

| Need | Where | Notes |
| --- | --- | --- |
| Leads, calls, follow-ups, client projects, team tasks | Lead Desk (link above) | Private. Share it from its Share menu at Contributor or above so teammates can write. |
| How to build a site | `prompts/site-blueprint.md` | Paste into a new Claude Code session. |
| What to say on a call | `prompts/cold-call-script.md` | Price there is still $500: update once packages are chosen. |
| Proposal, agreement, onboarding, launch/handoff | `business/templates/` | Copy, fill in, send. |
| Getting paid | Stripe invoices | About 2.9% + 30¢ per card payment plus a small invoicing fee. |
| Client sites' hosting | Cloudflare Pages (proposed) | See "Hosting" below. |

## Roles (starting split, change it in the Lead Desk)

- **Marce:** owner. Prices, contracts, money, legal setup, final say on
  designs, closes deals.
- **Kadin:** lead research. 10 new verified leads a week, owner lookups,
  facts checked before anyone calls.
- **Jailen:** calling. Works the call list, logs every call, keeps
  follow-ups at zero.
- **Nick:** build. Korvane's own site, previews for top leads, pitch kits.
- **Kai:** marketing and client care. Google Business Profile, Instagram,
  care plans, review requests.

Everyone calls their own assigned leads.

## The pipeline (Lead Desk stages)

1. **New:** found, not checked.
2. **Researched:** their site and Google listing opened, still open, owner
   looked up (ecorp.azcc.gov), the hook written.
3. **Called:** at least one attempt logged. Every call gets an outcome and
   a follow-up date. No date means the lead is forgotten.
4. **Interested:** wants to see something. Follow up within 2 days.
5. **Preview sent:** they have the link. Call back the next day for their
   opinion.
6. **Won:** agreement signed and deposit paid. The project checklist
   appears on the lead.
7. **Not now:** follow up in 60-90 days. **Lost:** said no. "Don't call me
   again" is Lost with that outcome, never called again.

**Weekly rhythm.** Monday: 15-minute team check (Lead Desk numbers: new
leads, calls, follow-ups due, previews out, won). Daily: clear the Today
tab before anything else. Friday: Kadin adds next week's leads.

**The numbers to watch:** calls made, conversations with owners, previews
sent, deals won, and the care-plan total per month. After the first 50
calls, work out our own rate (owner conversations per sale) and plan the
weekly call target from it.

## Packages and prices (proposed)

Market check (2026): freelance builds for small businesses mostly run
$1,500-$8,000; care plans $50-$300 a month. Our sites (custom design, real
3D renders, measured speed) sit in the upper half of the freelance range.

| Package | Price | What's in it |
| --- | --- | --- |
| Launch | $2,000 | Up to 5 pages from the blueprint, rendered stills, mobile-first build, contact or quote form, local search setup, 2 rounds of changes, launch on their domain. |
| Signature | $3,500 | Launch, plus a custom cinematic 3D opening of their place or product (rendered, not stock), pitch-quality motion, 3 rounds of changes. |
| Care plan, Basic | $79/month | Hosting set up and watched, monthly check (forms, links, speed), up to 30 min of small edits. |
| Care plan, Plus | $149/month | Basic, plus up to 2 hours of edits, seasonal updates (menus, hours, specials), a quarterly report. |

- **Payment:** 50% deposit before work starts, 50% before launch (paid
  through Stripe invoices). Pre-built previews from cold calls: the
  deposit is due on signing, and work on changes starts after it.
- **Care plans are where the business gets steady.** Offer one on every
  sale; 10 clients on Basic is about $790 a month.
- **Discounts:** offer a split payment before cutting the price. Know the
  floor before calling.
- **The call script's "$500" needs to match whatever is chosen here.**

## From yes to launch (the Won checklist)

The Lead Desk's project checklist follows these steps:

1. Agreement signed (`templates/client-agreement.md`, reviewed by a lawyer
   first).
2. Deposit received.
3. Onboarding questionnaire back (`templates/onboarding-questionnaire.md`).
4. Facts, photos, logo files collected, with permission for each.
5. Concept approved (blueprint phase 2).
6. 3D look approved (side-by-side likeness, low-res preview).
7. Built and checked (blueprint QA).
8. Review rounds (as many as the package includes; more are billed).
9. Final payment.
10. Domain connected, registered in the client's own name.
11. Launch checklist (`templates/launch-handoff.md`).
12. Handoff sent: logins, how to ask for changes, the care plan.
13. Review request two weeks after launch.

## Hosting and ownership

- **The client owns their domain, registered in their name, from day one.**
  Whoever is listed as the registrant legally owns it, whatever a contract
  says. Help them buy it on their account; never hold it over an invoice.
- **GitHub Pages is for previews, not paying clients.** GitHub's own limits
  page says Pages isn't meant to run an online business. Previews stay
  there (`noindex`); each paying client's site moves to a host that allows
  commercial use. Cloudflare Pages' free plan is reported to (confirm its
  current terms before the first move), and it serves plain static files
  like ours with no changes.
- **Code:** the client gets the site's files on final payment. Korvane
  keeps the right to show the work in its portfolio (in the agreement).
- **Accessibility:** website accessibility lawsuits are rising and small
  businesses get them. The blueprint's QA (WCAG 2.2 AA level checks) is
  part of what they pay for; say so in the proposal, but never promise a
  site is "ADA compliant", which no one can guarantee.

## Setting up the business (Tucson, Arizona)

In order. Confirm fees on the official sites; the figures are from 2026
sources.

1. **Form an LLC** with the Arizona Corporation Commission: about $50
   ($85 expedited). Businesses in Pima County generally don't need the
   newspaper notice: confirm with the ACC.
2. **EIN** from the IRS (free, online).
3. **City of Tucson business license.** Required for businesses operating
   in Tucson; working from home also needs the Home Occupation Form. City
   license line: (520) 791-4566.
4. **Business bank account** and **Stripe** connected to it.
5. **Arizona sales tax (TPT):** design services are generally not taxed in
   Arizona, but hosting or subscription parts may be. Bill design and care
   plans as separate lines and ask an accountant whether the care plan
   needs a TPT license.
6. **A lawyer's review** of the client agreement (one-time, worth it).
7. **Insurance:** ask about general liability and professional liability
   (errors and omissions) once revenue starts.
8. **Taxes:** set aside about 25-30% of profit for income and
   self-employment tax; an accountant confirms the number.

## Cold-calling rules (US)

- Dial by hand. No autodialers, prerecorded messages or AI voices to cell
  numbers without written consent: fines start at $500 per call.
- Calls to cell phones are the risk area even when the cell is a business
  line. Prefer the business's listed landline; keep an internal do-not-call
  list (the Lost / "asked not to be called" outcome).
- Call 8 AM-9 PM their time. Don't cold-text the pitch; text the preview
  link only after they say yes on the call.
- No false or misleading claims on a call.

## Sources

- Pricing: [studiomesa.co](https://studiomesa.co/articles/how-much-does-a-small-business-website-cost-in-2026/), [we.inc](https://we.inc/blog/how-much-to-charge-for-a-website), [filecurrent.com](https://www.filecurrent.com/blog/freelance-web-designer-rates), [projectcostestimator.com](https://projectcostestimator.com/blog/web-design-pricing-guide-2026)
- Arizona tax on services: [nexusbystate.com](https://nexusbystate.com/state/arizona/services), [AZ DOR ruling 18-008](https://azdor.gov/sites/default/files/2023-03/RULINGS_TPT_2018_18-008.pdf), [taxcloud.com](https://taxcloud.com/blog/arizona-saas-sales-tax/)
- Tucson license: [tucsonaz.gov business license](https://www.tucsonaz.gov/Departments/Business-Services-Department/Apply-for-a-Business-License), [home-based business rules](https://www.tucsonaz.gov/Departments/Planning-Development-Services/Development-Tools-Resources/Home-Based-Business-Requirements)
- Arizona LLC: [stripe.com guide](https://stripe.com/resources/more/how-to-form-an-llc-in-arizona), [zenbusiness.com](https://www.zenbusiness.com/arizona-filing-fees/)
- Cold calling: [leadium.com](https://www.leadium.com/blog/cold-calling-laws), [instantly.ai](https://instantly.ai/blog/b2b-cold-calling-legal-guide/)
- Contracts: [sitepoint.com](https://www.sitepoint.com/bulletproof-web-design-contract/), [signwell.com](https://www.signwell.com/contracts/web-design-contract-template/)
- Domains: [godaddy.com](https://www.godaddy.com/resources/in/web-pro-in/why-your-clients-should-own-their-domain-email-and-hosting), [dev.to](https://dev.to/instarenewal/how-to-transfer-a-domain-name-from-an-agency-to-a-client-step-by-step-bpk)
- Hosting: [GitHub Pages limits](https://docs.github.com/ru/enterprise-server@3.13/pages/getting-started-with-github-pages/github-pages-limits), [Cloudflare Pages comparison](https://hostfleet.pages.dev/cf-pages-vs-vercel-vs-netlify-2026/)
- Accessibility: [stacker.com](https://stacker.com/stories/small-business/website-accessibility-lawsuits-are-rising-and-smaller-businesses-are)
- Stripe fees: [nerdwallet.com](https://www.nerdwallet.com/article/small-business/stripe-fees)
