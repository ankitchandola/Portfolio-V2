# Portfolio design language

This is the design contract for Ankit Chandola's portfolio, including the interactive homepage, lite page and project detail pages. It records approved decisions and gives rules for future additions. A new explicit owner request may change a rule; update this guide alongside that change.

## Character

Welcoming, expressive and practical. The portfolio should feel like a developer showing useful work: warm surfaces, confident typography, visible controls and real product evidence. Give content enough presence and contrast. Do not drift into an overly sparse template, tiny technical labels or a generic terminal aesthetic.

Use teal, apricot and olive as a coordinated palette. Do not introduce violet or purple into portfolio UI. Original product screenshots may retain their own colours.

## Colour roles

| Role | Light | Dark |
| --- | --- | --- |
| Page | `#F5F2E9` | `#101E20` |
| Raised surface | `#FFFDF7` | `#182A2D` |
| Main text | `#172F31` | `#F1F2E9` |
| Secondary text | `#4B6260` | `#B7C8C2` |
| Teal accent | `#245E58` | `#9AD9C7` |
| Mint surface | `#C6DFD4` | `#294A43` |
| Apricot accent | `#F4C7A4` | `#EFB98E` |
| Divider | `#BDC8BE` | `#4C6761` |
| Contact section | `#245E58` | `#20473F` |

Use semantic CSS variables instead of new isolated hex values where a role already exists. The homepage calls the main accent `--teal`; detail/lite styles also use `--accent`. Read the final cascade before editing: earlier styles contain superseded colours.

### Fixed exceptions — preserve precisely

- Third experience card: background `#E8E9DA`, ordinary body text `#172F31`, and sequence number/date/role/outcome/tag accents `#626B3D`. Keep the card light in both themes. Olive is an accent, not the whole card fill or all body text.
- Footer means **only the final bar**, with its spaced content groups. Its background is `#E8E9DA`, edge to edge, with `#172F31` text in both themes and both editions. Do not apply this colour to the contact section above it.
- Scope sequence numbers use three distinct accents: 01 `#245E58`, 02 `#86532B`, 03 `#626B3D` in light mode. Use existing theme adaptations for dark surfaces.
- The contact section retains teal with apricot emphasis. Section numbering changes must not accidentally recolour it.

## Typography

| Purpose | Typeface | Local assets |
| --- | --- | --- |
| Display headings and large numbers | URW Gothic | `display.woff` |
| Paragraphs and descriptions | Nimbus Sans | `body.woff`, `body-bold.woff` |
| Section labels and compact headings | Nimbus Sans Narrow | `label.woff`, `label-bold.woff` |
| Actual code/data, when useful | Nimbus Mono PS | `mono.woff` |

Keep the font licence in `public/assets/fonts/LICENSE.txt`. Use the final `--display`, `--body` and `--label` variables rather than assuming the initial font aliases are identical on every page.

Section labels such as `01 / SELECTED WORK` should be distinctive condensed sans, not monospace. Paragraphs should read naturally beside headings. Do not use monospace as the default card description or tag font.

For new content, target 18px body text with approximately 1.5–1.65 line height, 17–19px card descriptions and 14–16px tags. Small screens may reduce body text to 17px. These are design targets, not a claim that every legacy selector has been normalised. Do not shrink text to solve a layout problem. No readable text goes below 13px at any width; the final readable-minimum block in `theme.css` enforces this for legacy labels. Section intros put the label on its own row, the headline on the left and the description in the right column on wide screens, stacking below 1000px. Keep long reading passages around 60–75 characters per line.

## Layout and hierarchy

Use the existing centred container, approximately 1320px maximum width, with responsive side gutters. Use an 8px spacing rhythm with the existing 12, 16, 24, 32, 48 and 64px intervals where appropriate. Avoid adding a new spacing system for one component.

Give each section a clear label, headline and supporting description. Emphasised headline words use the same accent treatment as neighbouring sections. Borders and colour blocks should establish structure without making every item a floating card.

The header separator and final footer background extend to the viewport edges; their contents remain aligned with the page container. Use the `ac` monogram without a decorative star. The homepage, detail and lite headers share one wordmark (monogram, name, FULL-STACK DEVELOPER) and the same nav labels: About me, Work, Experience, Say hello, which jumps to that page's contact section. Keep the Lite version link quiet. About me links to the main page's How I Work section (`#about`). Place a map-pin icon inline with the Delhi location.

### Main and lite editions

Projects are not numbered, so section numbers stay the only sequence on the homepage. Main sections: 01 Selected Work, 02 How I Work, 03 Engineering Decisions, 04 Today & Yesterday, 05 Contact. The current-work summary appears before these, and the unnumbered Ricochet invitation sits between 04 and 05.

Lite has its own consecutive numbering: 01 Today, 02 Selected Work, 03 Experience. It may omit How I Work and the interactive demo. Do not leave only a stray 03 label.

Lite's current-work summary places introductory copy beside three scope columns on wide screens and stacks the layout when space is insufficient. Numbers identify scope, not unverified performance metrics:

1. CRM & operations — Frontend + backend
2. Shared React package — Two applications
3. Website & CMS — Staging infrastructure

Both editions retain current employment: Green Fortune Technologies, followed by Hippo Homes and Nethues. Anonymous internal project titles do not require hiding the employer in employment history.

Lite remains script-free after prerendering. Project descriptions may expand on hover, must also appear on keyboard focus, and must remain available on touch devices without hover. Do not add a nonfunctional theme toggle to the script-free page.

## Components

### Work and project details

Keep one Selected Work collection instead of duplicating it as a second Closer Look section. Each project links to its own expandable detail page in the same tab. Use Project details wording until supplied material supports a fuller case study. Add future projects to the existing model rather than inventing another navigation category.

On the homepage, the interactive flagship stays first as a single card. Professional projects follow without an outer card: on wide screens the text column (label, title, summary, My role, tags, Project details) sits beside the screenshot gallery and alternates sides from one project to the next, and below 1000px they stack text first. The ownership statement sits under the summary in full ink with a My role label, never as a footnote below the gallery. Order projects by résumé weight after the flagship: operations, CRM, visualization package, website and CMS.

Detail pages follow one order: heading and tags, screenshot gallery, The problem, My contribution, Engineering challenges, Evidence and Scope limits. Each challenge states its problem, decision and trade-off. Evidence lists only counted or measured facts, and every figure keeps its caveat (environment, input size, what was timed) beside it. Scope limits say what the project is not. Take each field from the supplied project notes; omit a block rather than fill it with assumptions. Display-font numbers avoid symbols the face lacks, such as ≈ and →.

Prefer actual sanitised screenshots with clear captions. If an illustration is necessary, depict the project's real purpose and flow; avoid decorative generic dashboards. Never invent metrics or plausible business records and present them as evidence.

Gallery controls must clearly invite interaction, show the selected view, expose accessible names and preserve keyboard operation. Keep useful screenshot context visible. Previews are fixed 16:10 frames with no nested scrolling; a screenshot whose key area is small gets a `left top width` focus (percent of the image) in `projects.json`, and the caption's Open full screenshot link shows the whole image. Leave the focus out when the important parts sit far apart. Full-size images may open separately with an explicit link and safe external-link attributes. Do not recolour screenshots to match the portfolio.

### Experience

Use large sequence numbers, not unexplained icons. Give each number its own accent family. Maintain readable tags and a clear separation between employer, role, dates, responsibilities and supported outcomes.

When cards stack, the previous card's separator must not show through. Use opaque surfaces and check actual scrolling behaviour. On narrow screens use normal document flow rather than a cramped sticky stack.

### Engineering Decisions

Expanded content currently has two blocks: Implementation and Boundary. Use two equal columns on wide screens and one column on mobile. Align the content with the title text, leaving space for the summary number. Put the project link on its own full-width row.

Existing desktop alignment uses an 86px left inset (60px number plus 26px gap), 48px column gap and 24px row gap. Mobile removes the inset. Do not preserve an empty third column from an older accordion design. Check open and closed states with long content.

### Ricochet puzzle

`/play` is a side project and is labelled as one. It makes no claims about professional work and never appears in Selected Work, Engineering Decisions or Evidence. Visitors find it through an unnumbered homepage invitation between Today & Yesterday and Contact: a plain link with no client script, styled as an outlined secondary action, using neither the contact teal block nor the footer colour. Lite and the footer do not link to it.

The rules are deliberately small. Double-sided mirrors toggle between `/` and `\`, walls block, leaving the grid escapes, the target ends the shot, and the beam passes through its own source. That last rule is what makes loops possible: every rule is reversible, so a loop always returns to the first state. One-way pieces, splitters or multiple targets need their own design rather than a quiet extension.

Levels live in `src/content/levels.json` as row strings. Keep them at most 6 columns wide so mirror cells stay at least 44px on a 320px screen, and at most 8 mirrors so the test solver can enumerate every layout. Each level starts unsolved, and its minimum rotation count is pinned in `tests/play.test.mjs`. Change that number deliberately, and play a changed level by hand; solvable is not the same as enjoyable.

The board is SVG with a real button over each mirror, named by row, column and slant. Each shot's outcome is announced in a status region with an icon and text. Reset is enabled whenever a beam is shown or a mirror has moved. There are no single-key shortcuts. Progress is stored under `ricochet-solved`, loaded after hydration and saved only when a shot newly hits. Board colours are the `--rc-*` tokens in `src/play/play.css` and are checked at 3:1 in `tests/check-site.py`; loop dashes use the board surface colour over the beam. The beam draws in at most 600ms and mirrors turn in 120ms, both instant under reduced motion.

### Actions and icons

Reuse existing teal primary actions, outlined secondary actions, restrained offset shadows and small corner radii. Keep the contact CTA in the same visual family. Use Lucide consistently; prefer icons around 24px and comfortable controls of at least 44px. Icon-only buttons need accessible labels. Draw icons from the Lucide set in `src/home/icons.jsx`; do not use unicode glyphs (▤ ✓ ✳ ↺ ⇅) as icons. Footer social links include recognisable GitHub and LinkedIn icons alongside names.

## Motion and interaction

The main hero cycles through `<ankit chandola>`, `</>`, `<full stack developer>`, `<problem solver>` and `<tool builder>`. Keep a stable accessible identity alongside decorative animation. The skills banner runs continuously with relevant technologies.

Respect reduced-motion preferences and the existing pause control. Sections that start below the fold enter once with a short 70ms stagger, and only when motion is allowed and not paused. Content is visible without JavaScript. Pressable controls give press feedback; hover transforms apply only on devices that can hover. Gallery views crossfade in 180ms. Essential content must not depend on animation. Use short, restrained transitions for actions and expansion. 3D is optional only when it explains the work; do not add it as ambient decoration or a prerequisite to reading.

Interactive demonstrations must be visibly inviting before the first click: explain what to try, show controls, indicate the result and make reset clear. Label simplified sample data. The portfolio's CSV demo has deliberately limited scope; it is not the full Recon Desk engine.

## Content integrity

Use supplied project notes, screenshots and direct ownership clarifications. Do not assume business impact, authorship, scale, production infrastructure, uptime or technical decisions. If a detail is missing, omit it or request it when needed. A longer narrative does not justify invented case-study content.

Keep OpsGate frontend/backend under one operations project. Keep shared package ownership distinct from its two consuming applications. Distinguish custom CRM work from inherited Frappe functionality and CMS configuration from writing Strapi itself. Infrastructure evidence describes shared staging; do not convert it into a production availability claim.

Keep internal project names and private infrastructure identifiers anonymous. Use only approved sanitised screenshots. Do not commit credentials, private source notes or raw business data. Poke Hack Hub remains pending until its details are supplied.

## Implementation map

- `index.html`: homepage document head and a placeholder for the rendered sections.
- `src/home/`: homepage section components. They are rendered to static markup and never hydrated.
- `src/content/projects.json`: homepage project sections, engineering decisions, project details and lite summaries.
- `src/content/profile.js`: contact links, résumé path and the current-scope list shared by the homepage and lite.
- `src/App.jsx`: lite, project detail, `/play` and 404 layouts.
- `src/play/`: the Ricochet model, progress storage, page component and its stylesheet; `src/content/levels.json` holds the levels and `tests/solve.mjs` the test-only solver.
- `src/home/PlayInvite.jsx`: the homepage invitation to `/play`, styled in `public/assets/v2.css`.
- `src/home/client.js`, `src/home/interactions.js`: homepage galleries and interactions, attached to the static markup by element ids and data attributes.
- `public/assets/style.css`, `v2.css`: main styles; some legacy rules remain.
- `src/style.css`, `src/case-theme.css`: detail and lite styles.
- `public/assets/theme.css`: final shared theme overrides and recent component corrections.
- `scripts/prerender.mjs`: homepage rendering, route generation and script-free lite output.

Update all affected representations together. Prefer editing the relevant existing rule over appending another conflicting override. Do not change the retained original interactive Site when updating this edition. Internal filenames may contain v2; visible branding should not.

## Review before shipping UI changes

Run `npm run build` and `python tests/check-site.py`. Run `npm test` when changing comparison or puzzle behaviour. Static checks cover selected contrast pairs and output structure; they do not replace rendered visual review.

When browser review is available, inspect light/dark themes at 375, 768, 1024 and 1440px, plus a narrow 320px check. Review expanded accordions, experience stacking, gallery controls, keyboard focus, touch access, footer width and lite layout. Aim for at least 4.5:1 normal-text contrast and 3:1 large-text/control contrast. Never communicate meaning by colour alone.

Record which checks actually ran and any limitations. Documentation-only edits need link/content checks, not a website deployment. When an approved visual decision changes, update this guide in the same change.
