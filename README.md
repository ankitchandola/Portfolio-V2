# Ankit Chandola — Interactive Edition

This checkout is the updated interactive portfolio; the original interactive Site remains separate.

## Content

Project descriptions are based on the supplied project Markdown notes and direct ownership clarifications. Screenshots use the supplied dummy records. Internal project identities are anonymised.

- Recon Desk: documented comparison demo, actual comparison and reconciliation screenshots.
- Internal Operations Platform: frontend/backend combined; offline ownership described explicitly.
- Project Visualization Library: shared package used by operations and customer applications.
- Public Brand Website & CMS: SSR website, Frappe integration, Strapi configuration and shared EC2 staging setup.
- Sales CRM & Browser Telephony: custom CRM workflows and call handling on the existing Frappe platform.

`src/content/projects.json` supplies project detail pages and lite summaries. Main markup is in `index.html`. The old `/work/b2c` and `/work/opsgate` paths render the same operations details. No fictional role or payment model remains. Project details describe supplied implementation facts, not inferred business outcomes.

## Design and development

Read [the design language](docs/DESIGN.md) for the palette, typography, layout, component, motion and content rules. [AGENTS.md](AGENTS.md) directs future coding assistants to follow it.

Run `npm ci` to install dependencies, then `npm run dev` for local development. `npm run build` produces the prerendered site in `dist/`.

## Validation

Run `npm run build`, `node --test tests/*.test.mjs`, and `python tests/check-site.py`.
The checks cover the comparison model, prerendered links and assets, headings, duplicate IDs, script-free lite output and principal palette contrast. Browser visual QA was unavailable for this update.
