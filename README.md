# Ankit Chandola — Interactive Edition

This checkout is the updated interactive portfolio; the original interactive Site remains separate.

## Content

Project descriptions are based on the supplied project Markdown notes and direct ownership clarifications. Screenshots use the supplied dummy records. Internal project identities are anonymised.

- Recon Desk: documented comparison demo, actual comparison and reconciliation screenshots.
- Internal Operations Platform: frontend/backend combined; offline ownership described explicitly.
- Project Visualization Library: shared package used by operations and customer applications.
- Public Brand Website & CMS: SSR website, Frappe integration, Strapi configuration and shared EC2 staging setup.
- Sales CRM & Browser Telephony: custom CRM workflows and call handling on the existing Frappe platform.

Ricochet (`/play`) is a small mirror puzzle built for this site, linked from the homepage. It has five handcrafted levels, seeded random puzzles at three difficulties, a daily puzzle and shareable puzzle links. Its rules and level constraints are in the design guide; [docs/RICOCHET.md](docs/RICOCHET.md) explains the beam tracing, game state, solver and how to add levels.

`src/content/projects.json` supplies the homepage project sections, engineering decisions, project detail pages and lite summaries. Homepage sections are React components in `src/home/`, rendered to static HTML at build time; `index.html` holds only the document head. No fictional role or payment model remains. Project details describe supplied implementation facts, not inferred business outcomes.

## Design and development

Read [the design language](docs/DESIGN.md) for the palette, typography, layout, component, motion and content rules. [AGENTS.md](AGENTS.md) directs future coding assistants to follow it.

Use Node 24 (`nvm use`, or install the version in `.nvmrc`) and npm. Python 3
must be available as `python3` for the generated-site checks; they use only its
standard library. GitHub's Ubuntu runners provide it.

Run `npm ci` to install dependencies, then `npm run dev` for local development.
`npm run build` produces the prerendered site in `dist/`.

## Deployment

`.github/workflows/deploy.yml` runs `npm run check` on pull requests, pushes to
`main` and manual runs. Validation has read-only repository permissions and never
uploads Pages artifacts. New runs cancel older validation for the same PR or
branch.

After successful validation, pushes to `main` publish to
https://ankitchandola.github.io/. Manual runs publish only when run on `main`
with the **deploy** input explicitly enabled. Publication rebuilds the same
commit in its own job; only that job receives Pages/OIDC write permissions and
uploads the Pages artifact. Deployments are serialized separately from
validation and use the `github-pages` environment. The site URL used for
canonical links and the sitemap is set in `scripts/prerender.mjs`.

**Owner setup after this workflow lands:** require the **Validate** status check
in the ruleset or branch protection for `main`, after its first successful run.
Branch protection was not changed from this checkout: the active GitHub account
has read-only access and the new check has not been published yet. Configure
required reviewers on the `github-pages` environment if an additional human
deployment approval is desired.

## Validation

Run `npm run format` to format maintained source and documentation, or
`npm run format:check` to verify formatting without changing files. Generated
output, dependencies, local tool artifacts and third-party assets are excluded.

Run `npm run check` for formatting verification, zero-warning lint, model tests,
the production build and generated-site checks, in that order. Individual commands
are `npm run format:check`, `npm run lint`, `npm test`, `npm run build` and
`npm run check:site` (the last requires an existing `dist/` build).

ESLint covers application JS/JSX, Node scripts/tests, Vite and ESLint
configuration, and the public theme script, with separate browser and Node
globals. JSX uses the recommended React Hooks and accessibility rules. ESLint
stays on version 9 while the React/JSX accessibility plugins declare support
through that major. Browser storage is optional: documented catches keep theme
and motion controls usable when persistence is blocked.

The checks cover the comparison model, the puzzle model and levels,
prerendered links and assets, headings, duplicate IDs, script-free lite output
and principal palette contrast. They do not replace a rendered visual review
in a browser.
