# Repository guidance

Read `docs/DESIGN.md` before changing UI, theme, layout, motion or portfolio copy. It is the design contract for the main, lite and project-detail experiences. Explicit new owner instructions take precedence; update the guide when they change a settled decision.

- Preserve strong contrast, readable descriptions/tags and the local display/body/label font roles. Do not default to monospace labels or purple accents.
- Preserve the exact third-experience and footer colour rules. The footer is only the last bar, not the contact section.
- Keep lite script-free, its section numbering consistent and current employment visible.
- Treat supplied notes and direct ownership clarifications as the source for claims. Do not invent outcomes, project details, metrics or case-study narratives.
- Keep internal identities private and use approved sanitised screenshots. Do not commit credentials, private source notes or business data.
- Homepage sections live in `src/home/` and read project content from `src/content/projects.json`. Put project copy in the data file, not in components. Keep the element ids and data attributes that `src/original.js` and `src/home.jsx` depend on.
- Inspect the full CSS cascade before editing; `public/assets/theme.css` is the final shared layer. Avoid accumulating contradictory overrides.
- Preserve the separate original interactive Site. This repository is the updated edition.
- For UI changes, run `npm run build` and `python tests/check-site.py`; run `npm test` for comparison-model changes. Perform rendered checks when available and report unavailable checks honestly.
- For documentation-only changes, verify references and content without unnecessary UI changes or deployment.

Use `README.md` for setup and `docs/DESIGN.md` for component rules, responsive behaviour and the review checklist.
