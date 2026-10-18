---
name: mornati.net blog
description: Home-lab notebook. Graph-paper pages, marker headings and one highlighter per topic, so the newest page comes first and every page says which page comes next.
colors:
  ballpoint-blue: "#2b46d6"
  ballpoint-blue-night: "#8096ff"
  highlighter-yellow: "#ffe14a"
  highlighter-mint: "#7fe3cf"
  highlighter-pink: "#ff9fc4"
  highlighter-orange: "#ffbf6b"
  highlighter-lilac: "#c9b8ff"
  highlighter-sky: "#9fd3ff"
  highlighter-lime: "#b8f07a"
  highlighter-apricot: "#ffa76b"
  highlighter-graphite: "#d5dbe3"
  marker-ink: "#15171c"
  graph-paper: "#ffffff"
  grid-line: "#dce7f3"
  rule-line: "#d3dbe6"
  pencil-grey: "#4c5260"
  slate-notebook: "#181b21"
  slate-grid-line: "#242a33"
  slate-rule-line: "#343b47"
  chalk-ink: "#edf1f6"
  chalk-grey: "#bac2ce"
typography:
  display:
    fontFamily: "Shantell Sans, Comic Neue, ui-rounded, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 1.2rem + 2.1vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.06
    letterSpacing: "-0.02em"
    fontVariation: "'INFM' 30, 'BNCE' 10"
  headline:
    fontFamily: "Shantell Sans, Comic Neue, ui-rounded, system-ui, sans-serif"
    fontSize: "1.85rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.015em"
    fontVariation: "'INFM' 80, 'BNCE' 30"
  title:
    fontFamily: "Shantell Sans, Comic Neue, ui-rounded, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.2
    fontVariation: "'INFM' 40"
  annotation:
    fontFamily: "Shantell Sans, Comic Neue, ui-rounded, system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 700
    lineHeight: 1.2
    fontVariation: "'INFM' 100, 'BNCE' 60"
  nav:
    fontFamily: "Shantell Sans, Comic Neue, ui-rounded, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    fontVariation: "'INFM' 40"
  body:
    fontFamily: "Atkinson Hyperlegible, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1.08rem"
    fontWeight: 400
    lineHeight: 1.7
  body-ui:
    fontFamily: "Atkinson Hyperlegible, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 400
    lineHeight: 1.6
  row-title:
    fontFamily: "Atkinson Hyperlegible, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 700
    lineHeight: 1.35
  label:
    fontFamily: "Fragment Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "0.78rem"
    fontWeight: 400
    lineHeight: 1.4
  code:
    fontFamily: "Fragment Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "0.88rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  wobble: "255px 18px 225px 16px / 16px 225px 18px 255px"
  wobble-sm: "12px 3px 14px 4px / 4px 14px 3px 12px"
  sm: "4px"
  round: "50%"
spacing:
  grid: "28px"
  xs: "0.35rem"
  sm: "0.75rem"
  md: "1.25rem"
  lg: "1.9rem"
  xl: "3rem"
  section: "3.5rem"
components:
  nav-link:
    textColor: "{colors.marker-ink}"
    typography: "{typography.nav}"
    rounded: "{rounded.wobble}"
    padding: "0.3rem 0.65rem"
  nav-link-hover:
    backgroundColor: "{colors.highlighter-yellow}"
    textColor: "{colors.marker-ink}"
  icon-button:
    textColor: "{colors.marker-ink}"
    rounded: "{rounded.wobble}"
    width: "2.4rem"
    height: "2.2rem"
  icon-button-hover:
    backgroundColor: "{colors.highlighter-yellow}"
    textColor: "{colors.marker-ink}"
  cta-link:
    textColor: "{colors.marker-ink}"
    typography: "{typography.annotation}"
  cta-link-hover:
    backgroundColor: "{colors.highlighter-yellow}"
    textColor: "{colors.marker-ink}"
  highlighter-label:
    backgroundColor: "{colors.highlighter-graphite}"
    textColor: "{colors.marker-ink}"
    typography: "{typography.label}"
    padding: "0 0.35em"
  panel:
    backgroundColor: "{colors.graph-paper}"
    textColor: "{colors.marker-ink}"
    rounded: "{rounded.wobble}"
    padding: "{spacing.lg}"
  ruled-row:
    textColor: "{colors.marker-ink}"
    typography: "{typography.row-title}"
    padding: "0.85rem 1.25rem"
  sticky-note:
    backgroundColor: "{colors.highlighter-pink}"
    textColor: "{colors.marker-ink}"
    padding: "0.85rem 0.9rem 0.95rem"
  project-card:
    backgroundColor: "{colors.graph-paper}"
    textColor: "{colors.marker-ink}"
    rounded: "{rounded.wobble}"
    padding: "1.1rem 1.25rem 1.15rem"
  turn-page:
    backgroundColor: "{colors.graph-paper}"
    textColor: "{colors.marker-ink}"
    rounded: "{rounded.wobble}"
    padding: "1.15rem 1.4rem 1.2rem"
  freshness-note:
    backgroundColor: "{colors.highlighter-orange}"
    textColor: "{colors.marker-ink}"
    padding: "0.85rem 1rem"
  freshness-note-verified:
    backgroundColor: "{colors.highlighter-mint}"
    textColor: "{colors.marker-ink}"
  new-badge:
    textColor: "{colors.marker-ink}"
    rounded: "{rounded.round}"
    padding: "0.15rem 0.4rem"
---

# Design System: mornati.net blog

## Overview

**Creative North Star: "The Home-Lab Notebook"**

Every page of the blog is a page torn from Marco's lab notebook: white graph paper ruled in a pale blue 28px grid by day, a dark slate notebook with a faint grid by night. Headings, navigation and margin notes are lettered in a variable marker face; reading happens in a hyperlegible sans; dates, minutes, figures and code are typed in mono. Colour comes almost entirely from highlighters: one per topic, swiped behind dark ink, never used to colour the ink itself.

Structure is chronological and sequential, not a dashboard. The newest post sits in a framed panel with a hand-drawn "newest page!" arrow, the next pages run as a ruled list, topics are sticky notes, projects are cards that tick off one box per post, and every article ends by handing the reader the neighbouring pages of the same project plus the older and newer post. Frames are drawn in marker with a deliberately wobbly radius; paper notes lift off the page with a soft drop; nothing else casts a shadow.

Hand-drawn strokes (the wordmark underline, the arrows) are static SVG. They render fully drawn on first paint; there is no draw-on animation.

**Key Characteristics:**
- Graph-paper ground in both modes, carried by the body background, never by a panel.
- Marker-ink frames (2 to 2.5px) with an asymmetric wobble radius on every panel, sheet, card and pill.
- One highlighter per topic, mapped in data/topics.yaml, always behind marker ink.
- Three faces with fixed jobs: marker for voice, hyperlegible sans for reading, mono for facts.
- Lists are ruled sheets with dashed rules; no post image grids.
- Reader state is visible: "new" ring on recent posts, "read" mark from this browser's history, "you are here" on project steps.

## Colors

A white-paper, black-marker palette with a full box of highlighters and a single ballpoint blue for corrections and links.

### Primary
- **Ballpoint Blue** (light `ballpoint-blue`, night `ballpoint-blue-night`): the pen correction on the page. Prose links, project-link hover, the active graph node and index-page fact links. Links in prose carry a 45%-strength underline of the same blue that fills to full on hover. Blowfish's primary ramp (scheme `notebook`) carries the full scale.

### Secondary
- **Highlighter Yellow** (`highlighter-yellow`): the house highlighter and the AI topic colour. The wordmark underline, every hover swipe on nav, buttons, CTAs and search results, the current TOC entry, the prose h2 underline stroke, the reading-progress stroke, text selection, the tape strips on the article cover, the "newer post" label and the current project step. It is also Blowfish's secondary ramp.

### Tertiary (topic highlighters)
One per category, keyed in data/topics.yaml and exposed as `--hl-<key>`:
- **Highlighter Mint** (`highlighter-mint`): smart home; also the "verified" freshness note and project nodes on the map.
- **Highlighter Pink** (`highlighter-pink`): DevOps; also the like-button hover and the 404 numerals.
- **Highlighter Orange** (`highlighter-orange`): Linux and sysadmin; also the "this post is old" freshness note.
- **Highlighter Lilac** (`highlighter-lilac`): programming.
- **Highlighter Sky** (`highlighter-sky`): web development and blogging.
- **Highlighter Lime** (`highlighter-lime`): mobile and gadgets.
- **Highlighter Apricot** (`highlighter-apricot`): solar energy.
- **Highlighter Graphite** (`highlighter-graphite`): macOS and the fallback for any unmapped category.

### Neutral
- **Graph Paper** (`graph-paper`) with **Grid Line** (`grid-line`): the day page and its 28px grid.
- **Slate Notebook** (`slate-notebook`) with **Slate Grid Line** (`slate-grid-line`): the night page and its grid.
- **Marker Ink** (`marker-ink`): all day text and every frame stroke; in both modes, the ink drawn on top of a highlighter.
- **Chalk Ink** (`chalk-ink`): night text and frame stroke.
- **Pencil Grey** (`pencil-grey`, night `chalk-grey`): secondary text: summaries, dates, minutes, list asides, read posts.
- **Rule Line** (`rule-line`, night `slate-rule-line`): dashed rules between list rows and the map's filter divider.

### Named Rules
**The Swipe-Not-Ink Rule.** A highlighter is only ever a band of colour behind marker ink (`marker-ink`, in both modes). It is never a text colour, and never a panel or page fill. The only full-colour fills are paper notes: topic sticky notes, the freshness note, the map tooltip and the cover tape.

**The One-Topic-One-Colour Rule.** A topic's highlighter comes from data/topics.yaml and nowhere else; a new category gets a mapping there or falls back to graphite. Do not pick a highlighter for decoration.

**The Ballpoint Rule.** Blue is for links and corrections only; it never fills a surface.

## Typography

**Display Font:** Shantell Sans (with Comic Neue, ui-rounded)
**Body Font:** Atkinson Hyperlegible (with the system sans stack)
**Label/Mono Font:** Fragment Mono (with the system mono stack)

**Character:** A friendly variable marker hand (weight plus the INFM informality and BNCE bounce axes) against a sans built for legibility, with a plain mono for anything you might copy or compare. The marker gets bouncier the more it behaves like a note (annotations at INFM 100, BNCE 60) and steadier the more it has to be read (article titles at INFM 25 to 30, BNCE 5 to 10).

### Hierarchy
- **Display** (800, clamp(1.9rem, 1.2rem + 2.1vw, 3rem), 1.06): the lead post title on the home and article titles (clamp to 3rem at 1.08). Balanced wrapping. Index page titles use a sibling clamp(2rem, 1.5rem + 1.6vw, 2.9rem).
- **Headline** (800, 1.85rem, 1.15): section headings such as "The latest pages", "Pick a topic"; 1.55rem on phones. Prose h2 is 1.75rem with a short yellow marker stroke beneath; year headings are 1.7rem.
- **Title** (800, 1.2 to 1.45rem, 1.2): project card names, older/newer page titles, project story titles, sticky note titles (1.08 to 1.3rem).
- **Annotation** (700, 1.15rem): the "newest page!" note, CTA links, the punchline line.
- **Nav** (600, INFM 40): main menu, footer links, map filter chips.
- **Body** (400, 1.08rem, 1.7): article prose in the theme's prose column. Summaries and leads use body-ui (1.05rem, 1.6) capped at 52 to 68ch.
- **Row title** (700, 1.05rem, 1.35): post titles in ruled lists, in the reading face, not the marker.
- **Label** (Fragment Mono 400, 0.75 to 0.85rem): dates, minutes, post counts, topic labels, the article meta line, pagination. Never uppercase, never tracked.
- **Code** (Fragment Mono, 0.88rem, 1.6): code blocks and inline code on a graphite tint.

### Named Rules
**The Three Jobs Rule.** Marker for voice (headings, nav, notes, CTAs), Atkinson for anything read as sentences (including list titles), mono for facts (dates, counts, minutes, code). A face never borrows another's job.

**The Marker Is Not Body Rule.** Shantell Sans never sets paragraphs or summaries.

## Layout

The theme's centred content column holds every page; the body carries the 28px graph grid edge to edge, offset by a pixel so grid lines sit under frame strokes. The home is a spread: the lead panel (cover 1.05fr beside body 1fr, 2.25rem gap, 1.9rem padding), then a two-column spread (ruled list 1.65fr, topic stickies 1fr, 3rem gap, 3.5rem above), then a three-column project grid (4rem above). Ruled rows use a three-column grid: a 4.75rem marker date column (day large, month small), the title block, and minutes at the end.

Index pages open with a page head (marker title, one lead line, optional mono facts) capped at 68ch. The archive is grouped by year under a year-jump strip of bars sized by post count. Project pages run a vertical story line: dashed ink spine, numbered circles, a 13rem thumbnail beside each entry. Article end matter (project pages, related, older/newer) is capped at 65ch.

Rhythm runs on 0.35 / 0.75 / 1.25 / 1.9 / 3 / 3.5rem. Breakpoints: below 1024px the spread stacks and projects go to two columns; below 768px the lead stacks with a 16:9 cover, the annotation drops its arrow and moves to the right, rows drop the minutes column and narrow the date to 3.1rem, projects and older/newer go to one column, and the map filters become a horizontal scroller.

## Elevation & Depth

Flat paper, drawn depth. Panels, sheets and cards are separated from the grid by a marker frame and an opaque paper fill, not by shadow. Shadows belong only to things that physically sit on the page: paper notes and floating overlays. Slight rotations (-1.3 to 1.2deg) do the rest of the work of making a note look placed by hand.

### Shadow Vocabulary
- **Note drop** (`box-shadow: 0 10px 14px -10px rgba(0, 0, 0, 0.35)`): topic sticky notes at rest; the freshness note uses 0.3 alpha.
- **Note lifted** (`box-shadow: 0 16px 20px -12px rgba(0, 0, 0, 0.4)`): sticky note on hover, as it straightens and rises 4px.
- **Tooltip** (`box-shadow: 0 10px 18px -10px rgba(0, 0, 0, 0.45)`): the yellow map tooltip.
- **Overlay** (`box-shadow: 0 16px 30px -18px rgba(0, 0, 0, 0.5)`; search modal `0 24px 40px -24px rgba(0, 0, 0, 0.5)`): the hover preview card and the search overlay.

### Named Rules
**The Paper-Only Shadow Rule.** If it is not a loose note or a floating overlay, it has no shadow. Framed panels never cast one, and no shadow is ever a hard offset block.

## Shapes

Every frame is drawn, not ruled. Large frames (panels, sheets, project cards, older/newer pages, nav pills, buttons, the search modal, the TOC, quotes) use the asymmetric wobble radius; small framed images (covers, thumbnails, code blocks, prose images, the hover preview) use the smaller wobble. Strokes are marker weight: 2.5px for primary panels and the story spine, 2px for everything else, 1.5px dashed for rules between rows. Circles mark counters: the "new" ring (rotated -8deg), project story numbers. Project progress is a row of hand-drawn tick boxes, one per post (capped at 12 then "+n"). Horizontal rules in prose are a hand-drawn wave. Arrows are three SVG shapes, one stroke weight (2.2 to 2.4): a curve for annotations, and a right and a left arrow for direction.

**The Wobble Rule.** No framed element uses a uniform radius; pick the wobble for panels and pills, the small wobble for images and code.

## Components

### Navigation
- **Style:** marker nav (600) beside a hand-lettered wordmark ("Marco's home-lab notebook", 800, 1.5rem) underlined by a static yellow SVG stroke (6px, round caps). Menu: All posts, Topics, Projects, Map, About, then language, search and appearance.
- **States:** hover lays a yellow swipe in a wobble pill; the section you are in gets a 2px inset ink ring (set by script from the path). Search and appearance are 2.4 by 2.2rem wobble-framed icon buttons with the same yellow hover.
- **Mobile:** the theme's mobile menu in the marker face; the wordmark drops to 1.2rem and may wrap.

### Links and CTAs
- **CTA:** marker 700 at 1.1rem with a 3px ink underline and a hand-drawn right arrow; hover lays the yellow swipe and nudges the arrow 3px right.
- **Prose links:** ballpoint blue with a soft underline; hover paints a 55% yellow wash with ink text.
- **List titles:** hover draws a wavy underline (1.5 to 2px).
- **Project links:** dotted underline, mono, turning ballpoint on hover.

### Highlighter labels
- **Style:** a slightly ragged band (transparent at the 2% and 98% edges, angled 100deg) in the topic's highlighter, ink text, mono at 0.75 to 0.78rem in meta lines. The same swipe marks a project name, the newer-post label and the current TOC entry. `mark` swipes are bold.

### Ruled sheets
- **Style:** a paper-filled, 2px-framed wobble sheet of rows separated by 1.5px dashed rules. The single list pattern for the latest pages, archive years, topic and project lists, project steps and related posts.
- **Row states:** a rotated "new" ring for posts under ten days old; a "read" mark and pencil-grey title once this browser has opened the post (localStorage key "nb-read"); the current project step sits on a 55% yellow wash (22% at night).

### Sticky notes (signature)
- **Style:** a square of the topic's highlighter, ink text, marker title, mono count, note drop shadow, rotated by position (-1.3, 1.2, -0.5deg). Two columns beside the latest list, three on tablets, a wider auto-fill grid on the Topics page.
- **Hover:** straightens and rises 4px with the lifted shadow (0.4s).

### Lead panel (signature)
- **Style:** the newest post in a 2.5px wobble panel with the "newest page!" annotation and curved arrow breaking its top edge on a paper patch, rotated -3deg. Cover tilted -1deg in a small-wobble frame (straightens on hover); mono meta and topic label; display title; summary; an optional punchline (`keyfigure` front-matter) set in mono on a yellow mark; a "Read it" CTA.

### Project cards
- **Style:** wobble-framed paper card with marker name, a one-line summary, tick boxes per post, and mono meta. Hover lifts 3px and lays the yellow swipe behind the name.

### Page turn
- **Style:** older and newer posts as two wobble panels side by side (2.5px frame), marker direction label with arrow, marker title, mono date. Newer sits right, right-aligned, with its label on the yellow swipe. A "Page n of N in [project]" strip with prev/next arrow buttons heads project posts.

### Paper notes
- **Freshness note:** an orange note ("this post is from [year]") on posts older than three years, mint when `lastVerified` is set; ink text, slight rotation, note drop.
- **Article cover:** a paper-framed photo rotated -0.6deg, held by two translucent yellow tape strips.

### Inputs and overlays
- **Search:** the theme's modal in a 2.5px wobble frame with the overlay shadow; marker query input at 1.2rem; results hover to a 70% yellow wash.
- **Focus (all interactive):** 3px dashed ink outline, 3px offset.
- **Map chips:** marker 600 wobble pills; pressed topics fill yellow, pressed projects fill mint.

### Article furniture
- **Code blocks:** small-wobble ink frame; the copy button is a yellow wobble pill in marker. Inline code sits on a 70% graphite tint (#2a313c at night).
- **Quotes:** dashed 2px ink frame, wobble radius, upright text, no quote marks.
- **Tables:** marker header cells over a 2px ink rule, tabular figures.
- **Reading progress:** a 5px yellow stroke across the top, driven by the scroll timeline where supported.
- **Share and like buttons:** theme markup restyled to small-wobble ink frames with yellow (share) or pink (like) hover.

### Motion
One easing for everything: `cubic-bezier(0.16, 1, 0.3, 1)`. Card and page-turn lift 0.35s, sticky lift 0.4s, cover straightening 0.6s, arrow nudge 0.25s, preview card fade 0.18s. Cross-document view transitions carry the cover from list to article (0.42s). Reduced motion turns off view transitions and every transform transition.

## Do's and Don'ts

### Do:
- **Do** put every highlighter behind marker ink (`marker-ink`) and take a topic's colour from data/topics.yaml.
- **Do** frame panels, sheets and cards with a 2 to 2.5px ink stroke and the wobble radius.
- **Do** list posts as ruled rows with a marker date column, an Atkinson title, a topic label and mono minutes.
- **Do** keep reader state visible: "new" rings, read marks, "you are here".
- **Do** end every article with the project's pages and the older and newer post.
- **Do** set dates, counts, minutes and figures in Fragment Mono.
- **Do** keep hand-drawn strokes as static SVG, fully drawn on first paint.

### Don't:
- **Don't** use a highlighter as a text colour or as a panel or page fill; only paper notes are solid highlighter.
- **Don't** set summaries or paragraphs in Shantell Sans.
- **Don't** give framed panels a shadow, and never use a hard offset shadow.
- **Don't** use a uniform border radius on a framed element.
- **Don't** list posts as a grid of image cards; posts are rows, covers appear only on the lead, the article, project stories and the hover preview.
- **Don't** put uppercase tracked labels (eyebrows) above headings; the theme's "Author" eyebrow is deliberately hidden.
- **Don't** animate strokes drawing on; a stroke that can render blank is worse than no animation.
