---
name: mornati.net blog
description: Infrastructure Schematic — a rack elevation of running systems on blueprint paper by day, a night terminal by night.
colors:
  signal-copper: "#c46c1a"
  signal-copper-deep: "#a35712"
  signal-copper-lit: "#e0852d"
  trace-cyan: "#1b9cb3"
  trace-cyan-deep: "#0d6578"
  trace-cyan-lit: "#5ecbde"
  blueprint-paper: "#eef3f8"
  rack-face-paper: "#fafcfe"
  rack-rail-paper: "#ccd8e6"
  seam-paper: "#acbdd1"
  dim-ink-paper: "#42546b"
  ink-paper: "#1a222f"
  night-ground: "#0b0e14"
  rack-recess-night: "#080a0f"
  rack-face-hi-night: "#131923"
  seam-night: "#2d3b4f"
  dim-ink-night: "#7f94ac"
  ink-night: "#e3eaf2"
typography:
  display:
    fontFamily: "Archivo, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(1.9rem, 1.4rem + 2vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Archivo, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(1.5rem, 1.1rem + 1.6vw, 2.35rem)"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Archivo, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  unit-name:
    fontFamily: "Archivo, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1.02rem"
    fontWeight: 700
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: "1.05rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.72rem"
    fontWeight: 500
    fontFeature: "tnum"
  panel-label:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.12em"
rounded:
  none: "0px"
  pin: "1px"
  port: "2px"
  chip: "3px"
  round: "50%"
spacing:
  seam: "3px"
  ear: "0.95rem"
  face: "1.25rem"
  rail: "1.75rem"
  u: "2.75rem"
components:
  port:
    textColor: "{colors.signal-copper-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.port}"
    padding: "0.3em 0.5em"
  port-trace:
    textColor: "{colors.trace-cyan-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.port}"
    padding: "0.3em 0.5em"
  unit-face:
    backgroundColor: "{colors.rack-face-paper}"
    textColor: "{colors.ink-paper}"
    rounded: "{rounded.none}"
    padding: "1rem 1.25rem"
  unit-face-night:
    backgroundColor: "{colors.night-ground}"
    textColor: "{colors.ink-night}"
    rounded: "{rounded.none}"
  project-unit:
    height: "{spacing.u}"
    padding: "0.55rem 1.25rem 0.55rem 1rem"
    typography: "{typography.unit-name}"
  blank-panel:
    textColor: "{colors.dim-ink-paper}"
    typography: "{typography.panel-label}"
    padding: "0 1.25rem"
  jack:
    typography: "{typography.unit-name}"
    padding: "0.85rem 1rem"
    rounded: "{rounded.none}"
  badge-category:
    textColor: "{colors.trace-cyan-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "0.3em 0.55em 0.3em 0.45em"
  peek:
    backgroundColor: "{colors.rack-face-paper}"
    textColor: "{colors.ink-paper}"
    width: "20rem"
    padding: "0.6rem 0.6rem 0.75rem"
---

# Design System: mornati.net blog

<!-- impeccable:design-schema 1 -->

## Overview

**Creative North Star: "Infrastructure Schematic"**

Dark mode reads as a night terminal/schematic; light mode reads as blueprint paper pinned above a desk. Both are drawn from one blueprint-blue neutral ramp rather than a naive invert, so they feel like two real artifacts of the same discipline, not a light theme and its negative. Content renders as labeled, connected nodes: post cards, category chips, and TOC entries borrow the vocabulary of a diagram (node markers, port labels, signal dots) rather than a generic blog-template card grid. Chosen via the skill's direction round (seed key `d0c81b63`, network topology diagram), raised with disciplines borrowed from three catalog challengers: magnitude-as-size encoding, status-by-shape-not-color, and single-grotesque grid discipline.

Pass 2 (seed `639f710a`) gave the world a physical material: the **rack elevation**. Index surfaces (homepage, projects hub, project datasheets, topology map) are framed by two rails with square mounting holes; every block is a unit whose ears and screws sit over the rails, stacked with a 3px recess seam. Status is carried by LED shape. The wow lives on index surfaces; article pages stay calm, receiving only quiet schematic furniture (framed plate hero, project strip, freshness plate, connected posts, a copper reading-progress hairline).

Motion is mechanical and brief: drawers slide out on one long ease-out, the activity LED blinks once, jack pins flex when wired. Every animation has a reduced-motion off switch.

**Key Characteristics:**
- One neutral ramp, two artifacts: blueprint paper and night terminal.
- Copper is signal (links, active state, the trace line); cyan is the second wire (topics, ports to pillars, wiring on hover).
- Flat faceplates with hairline seams; depth comes from recess, not shadow.
- Status by LED shape, never color alone.
- Identifiers (dates, U-numbers, counts, pillar ids) are mono and tabular; names are Archivo; reading is Source Serif 4.

## Colors

A committed two-wire palette on a blueprint-blue ramp: copper carries the signal, cyan carries a smaller, deliberate share.

Custom Blowfish scheme at `assets/css/schemes/schematic.css`, activated via `colorScheme = "schematic"`. Its RGB-triplet ramps (`--color-neutral-*`, `--color-primary-*`, `--color-secondary-*`, 50 to 900) are the normative source; the frontmatter hexes are exact conversions. Blowfish's `dark:` variants pick the light or dark end of the same ramp. The rack layer adds semantic aliases in `assets/css/custom.css` (`--rack-recess`, `--rack-rail`, `--rack-hole`, `--rack-face`, `--rack-face-hi`, `--rack-seam`, `--rack-ink`, `--rack-dim`, `--rack-signal`, `--rack-trace`) that swap under `.dark`; new rack-world components use these aliases, not raw ramp steps.

### Primary
- **Signal Copper** (primary-500): node markers, card top edges, focus outlines, plate registration marks.
- **Deep Copper** (primary-600): `--rack-signal` on paper; links, active LEDs, the trace line, project hub links.
- **Lit Copper** (primary-400): `--rack-signal` at night; the same roles on the dark end.

### Secondary
- **Trace Cyan** (secondary-500): category badges on article surfaces.
- **Deep Trace** (secondary-700): `--rack-trace` on paper; topic ports, jack wiring, topology topic nodes, jack pillar ids.
- **Lit Trace** (secondary-300): `--rack-trace` at night.

### Neutral
- **Blueprint Paper** (neutral-50): page ground in light mode.
- **Faceplate Paper**: `--rack-face` in light mode, a near-white panel one step above paper; `--rack-face-hi` is pure white for hovered and open units.
- **Rail Paper** (neutral-200) and **Seam Paper** (neutral-300): rails, hairline seams and the recess between units on paper.
- **Dim Ink** (neutral-600 paper / neutral-400 night): metadata, counts, summaries, idle LEDs.
- **Ink** (neutral-800 paper / neutral-100 night): unit text.
- **Night Ground** (neutral-900): page ground and faceplates at night; the recess drops below it to an off-ramp near-black and hovered faces lift to an off-ramp slate.
- **Seam Night** (neutral-700): rails and seams at night.

The standalone `static/solar-analysis/index.html` page reimplements the same ramp as local custom properties under `:root` / `html.dark` and shares the site's `localStorage("appearance")` key.

### Named Rules
**The Two-Wire Rule.** Copper means "this is live or this is the way"; cyan means "this is a topic or a connection to one". A component uses one or the other per role, never both as decoration.

**The Alias Rule.** Rack-world components read `--rack-*` aliases so light and dark resolve in one place; reach for a raw ramp step only on non-rack surfaces (article prose, Blowfish overrides).

## Typography

**Display Font:** Archivo (with system sans fallback), wired as the global `--font-sans`.
**Body Font:** Source Serif 4 (with Georgia), long-form prose and summaries only.
**Label/Mono Font:** JetBrains Mono (with ui-monospace), `--font-mono`.

**Character:** A single grotesque does every name and heading at heavy weights with tight tracking; the serif is kept for reading; mono marks anything that is an identifier or a measurement.

### Hierarchy
- **Display** (800, clamp 1.9 to 3rem, 1.05): project datasheet names; the page heads of rack pages sit one step below (clamp 1.8 to 2.6rem).
- **Headline** (800, clamp 1.5 to 2.35rem, 1.12, balanced): the latest-transmission title; the head unit name uses the same weight at clamp 1.35 to 1.9rem.
- **Title** (700, 1.3rem, 1.2): story nodes on project pages; connected-post and trace titles run 0.92 to 1.1rem at 600 to 800.
- **Unit name** (700, 1.02rem): project unit names and jack labels (0.88rem, 600).
- **Body** (400 serif, 1.05 to 1.1rem, 1.5 to 1.55, max 58 to 65ch): article prose, latest/sheet/story summaries, hover-preview summaries.
- **Label** (500 mono, 0.64 to 0.75rem, tabular numerals): dates, reading time (as `12′`), U-numbers, counts, port and badge text, datasheet values.
- **Panel label** (600 mono, 0.75rem, 0.12em tracking, uppercase): blanking-panel group headings only. Datasheet field names (0.65rem, 0.1em, uppercase) follow the same printed-legend logic.

### Named Rules
**The Identifier Rule.** If it is a date, a count, a U-number, a duration or a machine id, set it in mono with tabular numerals. Names and prose never go mono.

**The Printed Legend Rule.** Uppercase tracked mono is a legend printed on hardware: blanking-panel headings, datasheet field names, the badge and port text, the LED readout beside the latest post's date. It is never a kicker above a headline.

## Layout

Index surfaces use the rack grid: `rail | bay | rail`, rails 1.75rem (`--rail`) wide, the rack pulled out by half a rail on each side. The bay stacks units in a column with a 3px gap and 3px block padding, so the recess color shows as the seam between units. Ears (0.95rem, `--ear`) hang outside the bay over each rail. The vertical module is `--u` (2.75rem): a project unit is at least 1U; the latest unit is at least six `--u` tall on desktop. Rail holes repeat every U/3.

Units carry mono U-number tags (`U01`, `U02–04`, then `U05` onwards for projects). The homepage order is head unit, latest transmission, a blanking panel, project units, blanking panel, patch panel, blanking panel, log, foot.

Rows inside units are grids with fixed mono columns (6.5rem date, 2.75rem U-number) and a flexible name column. At 1023px and below, secondary columns (newest post, count text) drop out. At 767px and below, rails shrink to 1rem and ears to 0.5rem, rows restack into name plus trailing control, the latest unit becomes a short 21:9 cover over a clamped summary so the first project unit starts in the fold, and the topology map puts its filter strip above the canvas.

Article pages keep Blowfish's reading layout (TOC in the right column) and add stacked, max 65ch schematic furniture around the prose.

## Elevation & Depth

Flat by default. Depth is conveyed by recess: units are flat faceplates with hairline seams sitting slightly above a darker recess, a 1px inset top highlight (`--rack-face-hi`) makes a faceplate read as a panel, and the rails carry punched square holes. Shadows appear only for things that physically leave the rack or float above it.

### Shadow Vocabulary
- **Pulled unit** (`box-shadow: 0 14px 28px -18px rgba(0, 0, 0, 0.45)`): an open project unit and its drawer.
- **Floating readout** (`box-shadow: 0 16px 36px -18px rgba(0, 0, 0, 0.55)`): the hover preview card; the topology tooltip uses `0 8px 20px -10px rgba(0, 0, 0, 0.5)`.
- **Card lift** (`box-shadow: 0 8px 24px -12px rgba(primary-900, 0.35)`, black 0.6 at night): hovered Blowfish post cards on list pages.
- **Screw rim** (`box-shadow: inset 0 0 0 1px var(--rack-seam)`): screw heads on the ears.

### Named Rules
**The Leaves-The-Rack Rule.** A shadow means the object has been pulled out or is floating. Units at rest, panels and plates never cast one.

## Shapes

Hard-edged hardware. Faceplates, plates, code frames, cards and cells are square (0). Small printed parts carry 1 to 3px: pin and socket outlines and the idle LED at 1px, ports and filter chips at 2px, category badges and the head avatar at 3px. True circles are reserved for things that are round in hardware: LEDs, screw heads (with a 45° slot), solder pads, trace nodes, status dots.

Recurring geometry: hairline 1px seams everywhere; a 1px copper vertical line as the trace, with 6px nodes (10px for the current post); registration marks as 2px copper L-corners on the plate; dashed 1px border meaning "unverified". The topology map encodes kind by shape: posts are circles, topics are hollow cyan squares, projects are filled copper squares rotated 45°.

## Components

### Rack and units
- **Rails:** neutral rail strips with square holes drawn by a repeating gradient; decorative (`aria-hidden`).
- **Unit:** a faceplate (`--rack-face`, 1px seam top and bottom, inset top highlight) with two ears, each holding two slotted screws. Ears render from one partial and are always present, including on blanking panels.
- **Blanking panel:** a group heading unit (0.85U) with a printed legend, a strip of vent slots and a count (`7U`, `12P`).

### Head unit
- Avatar (3.5rem, 3px radius) in a double hairline bezel with a copper status dot, name in headline weight, headline in dim ink, and a mono meter (posts, since year, languages) divided by seams.

### Latest transmission
- Cover left (5fr) and body right (7fr). Title in headline type, serif summary (62ch), and a mono meta row: active LED with the printed "latest" legend, date, reading time, topic port, project port. Cover zooms to 1.03 on hover over 0.9s ease-out and carries a view-transition name into the article hero.

### Project unit
- A native `details` element (all sharing `name="rack-unit"`, so one is open at a time) whose summary row is: U-number, status LED plus word, name and one-line summary, newest post, post count with a cyan patch port to its pillar, and a pull handle (a 1.5px chevron that turns 180° when open).
- **Drawer:** animated via `::details-content` block-size (0.45s ease-out) with `interpolate-size: allow-keywords`; holds a trace list and links to the project hub, dashboard and repo (external arrow).
- **Hover:** face lifts to `--rack-face-hi`; an active LED blinks once (stepped 0.7s). Open: face-hi plus the pulled-unit shadow.

### Status LED
- Shape carries the state: **filled circle** = active (newest post ≤60 days), **ring** = quiet (≤365 days), **hollow square** = idle. Color only reinforces (copper for active and quiet, dim ink for idle). Always paired with the state word or a `title` hint. Status is computed at build time from the newest post's date; it is never stored.

### Ports and badges
- **Port** (mono, 1px currentColor outline, 2px radius): copper for project ports, cyan (`port--trace`) for topic ports; links tint to 12% currentColor on hover. The patch port on a project unit adds a small socket pin mark.
- **Category/tag badge** (`.schematic-badge`, used on Blowfish list and article surfaces): mono uppercase with a leading 5px signal dot; categories in cyan, tags in copper.

### Patch panel
- A grid of jacks (min 12rem cells, seam lines between them): socket outline with two pin marks, topic label, mono count, and the pillar id in cyan below.
- **Wiring:** a jack exposes `--wired` (0 or 1) and mixes socket, pins and cell background toward cyan by that amount. Hovering a project unit's patch port sets `--wired: 1` on the matching jack through one generated `:has()` rule per topic (emitted inline in `layouts/partials/home/rack.html`). Direct hover on a jack also lights it and stretches the pins.

### Trace list
- Posts wired along a 1px copper line with 6px copper nodes; mono date, 600-weight title, mono reading time. The current post (`aria-current`) gets a 10px node with a face-colored halo and copper text. Used in project drawers and the article's bottom unit trace.

### Log
- The next twelve posts as ruled lines: mono date, title, first topic port (hidden on phones), reading time.

### Project datasheet and story (`/projects/<key>/`)
- **Sheet:** display name, serif summary, links row, and a spec grid (status, posts, first and last post) with uppercase mono field names and mono values.
- **Story:** the project's posts oldest first as numbered nodes on a vertical copper trace; mono step box, date, title, serif summary and a 16:10 thumbnail.
- The `/projects/` index lists the same project units as the homepage.

### Topology map (`/graph/`)
- A filter rail of mono chips (topic chips go cyan, project chips copper when pressed or hovered) beside an SVG canvas drawn by `assets/js/graph.js`. Links are seam hairlines; reference links are dashed. Focusing a node dims unrelated nodes (0.15), links (0.08) and labels, and turns lit links copper. Labels carry a face-colored stroke halo; small labels hide until lit. A legend unit explains the three node shapes. A `noscript` list is the fallback.

### Article furniture
- **Plate hero** (`heroStyle = "plate"`): cover in a 0.5rem hairline frame on neutral-100 (neutral-900 at night), 5:2 (16:9 on phones), two copper registration corners; shares the view-transition name with index thumbnails.
- **In-unit strip:** above the body, a faceplate strip naming the post's project with its LED, "part n of m", and previous/next links with the authored arrow.
- **Freshness plate:** a solid seam border with an active LED when `lastVerified` is set; a dashed dim border with an idle LED for posts older than three years without it.
- **Connected posts** (`related.html`): a heading ruled out to the edge, then up to three nodes (16:10 image or recess blank, mono meta, balanced title). Related weights: projects 150, categories 100, series 50.
- **Reading progress:** a 2px copper hairline fixed to the top, driven by `animation-timeline: scroll(root block)`; no script, absent where unsupported.
- **Hover preview (`.peek`):** a 20rem floating readout (16:9 image, mono meta, title, three-line serif summary) fading in over 0.18s from a 2px blur. Loaded by `assets/js/previews.js` from the per-language `previews.json` output, only when `(hover: hover) and (pointer: fine)` matches; it never blocks the link.

### Arrow icon
- One authored 16px SVG (`schematic/arrow.html`), 1.5 stroke with round caps to match the unit handle, in right, left and out variants. It is the only icon in the rack world.

### View transitions
- Cross-document (`@view-transition { navigation: auto }`), 0.42s on `cubic-bezier(0.16, 1, 0.3, 1)`; the cover image carries from list to article by a name hashed from its permalink. Off under reduced motion.

### Pre-rack components (Blowfish surfaces)
- **Post cards** (`.article-link--card`): sharp corners, a 2px copper top edge and a 6px copper solder pad on that edge; hover lifts 2px with the card-lift shadow. Still used on list, archive and taxonomy pages.
- **Article headings** (`h2`/`h3` in `.prose`): a 0.45em copper node-marker square precedes the text.
- **Table of contents:** the smart TOC marks the current section in copper, weight 600, with a 5px leading dot.
- **Code blocks** (`.highlight-wrapper`): a quiet 1px neutral hairline frame, square corners.
- **Schematic rule and avatar status dot** (`.schematic-rule`, `.schematic-avatar`): belong to the previous `grid` homepage partial, which remains in the tree but is inactive since the homepage layout is now `rack`.
- **Categories page** (`term-link/text.html`): wider columns and slightly smaller labels than the theme default so long names don't wrap mid-word in Archivo.

## Do's and Don'ts

### Do:
- **Do** build new index surfaces as rack units: faceplate, ears from the shared partial, a U-number or blanking-panel legend, 3px seams.
- **Do** encode state by shape first (filled circle, ring, hollow square) and pair it with a word or `title`.
- **Do** use the `--rack-*` aliases so a component resolves in both modes from one rule.
- **Do** set dates, counts, durations and ids in JetBrains Mono with tabular numerals, and write reading time as minutes with a prime (`12′`).
- **Do** use copper for live and navigational signal and cyan for topics and the wiring to them.
- **Do** give every animation a `prefers-reduced-motion` off switch and keep interactions CSS-first (native `details`, `:has()`, scroll timelines).
- **Do** keep article pages calm: schematic furniture sits above and below the prose, never inside it.

### Don't:
- **Don't** return the homepage to a grid of same-size cover cards.
- **Don't** signal status with color alone.
- **Don't** round faceplates, plates, frames or cells; radii above 3px have no place in this world.
- **Don't** cast shadows from units at rest; only pulled units and floating readouts leave the rack.
- **Don't** place uppercase tracked labels above headlines as kickers; printed legends label hardware.
- **Don't** add icon sets or glyph icons; the authored arrow is the vocabulary.
- **Don't** reintroduce copper and cyan accent borders on code blocks.

## Known follow-ups (not done in this pass)

- `static/solar-analysis/index.html` is generated by an external `generate_analysis.py` script outside this repository. This pass edited the committed static output directly; if that generator is re-run, its own HTML/CSS template should be updated to match this design system or the next generation will overwrite it.
- Pre-existing content bug left alone: `content/en/posts/achieving-zero-downtime-deployments-on-coolify-a-journey-from-monolith-to-decoupled-architecture/index.md` has malformed front matter (its `title` swallowed the `categories:` key).
- Pagefind search was not adopted; Blowfish's Fuse search is kept.
- Open Graph image generation was not done.
- Sidenotes were not done, because the article's right column holds the TOC.
- Hover preview is gated on `(hover: hover) and (pointer: fine)`; touch and coarse-pointer devices get plain links.
- Project membership comes from the `projects` front-matter taxonomy filled by `scripts/tag_projects.py` (from repo links, with units defined in `data/projects.yaml`). Re-run the script for every new project post, or the post will not appear in its rack unit, hub or trace.
- The status LED derives from the newest post's date at build time: active ≤60 days, quiet ≤365 days, idle otherwise. The site must be rebuilt for LEDs to age. The direction contract's four shapes (including a half LED for experiments and a maintained/archived split) were not built; the three date-derived states are the system.
- Datasheet field names "Status" and "Posts" in `layouts/projects/term.html` are hard-coded English rather than i18n strings.
- `assets/css/custom.css` ends with later-pass overrides that redefine the project row grid, jack and map placement after their base rules; fold them into the base rules when that file is next touched.
