# Ankit Chandola — Interactive Edition

This checkout is the updated interactive portfolio; the original interactive Site remains separate.

## Content

Project descriptions are based on the supplied project Markdown notes and direct ownership clarifications. Screenshots use the supplied dummy records. Internal project identities are anonymised.

- Recon Desk: documented comparison demo, actual comparison and reconciliation screenshots.
- Internal Operations Platform: frontend/backend combined; offline ownership described explicitly.
- Project Visualization Library: shared package used by operations and customer applications.
- Public Brand Website & CMS: SSR website, Frappe integration, Strapi configuration and shared EC2 staging setup.
- Sales CRM & Browser Telephony: custom CRM workflows and call handling on the existing Frappe platform.

`src/content/projects.json` supplies the homepage project sections, engineering decisions, project detail pages and lite summaries. Homepage sections are React components in `src/home/`, rendered to static HTML at build time; `index.html` holds only the document head. No fictional role or payment model remains. Project details describe supplied implementation facts, not inferred business outcomes.

## Design and development

Read [the design language](docs/DESIGN.md) for the palette, typography, layout, component, motion and content rules. [AGENTS.md](AGENTS.md) directs future coding assistants to follow it.

Run `npm ci` to install dependencies, then `npm run dev` for local development. `npm run build` produces the prerendered site in `dist/`.

## Deployment

Pushes to `main` deploy to GitHub Pages at https://ankitchandola.github.io/ through `.github/workflows/deploy.yml`, which runs the tests, build and site checks first. The site URL used for canonical links and the sitemap is set in `scripts/prerender.mjs`.

## Validation

Run `npm run build`, `node --test tests/*.test.mjs`, and `python tests/check-site.py`.
The checks cover the comparison model, prerendered links and assets, headings, duplicate IDs, script-free lite output and principal palette contrast. Browser visual QA was unavailable for this update.
