---
version: 1
slug: "localhost"
primary_target: "http://localhost:1313"
related_targets: []
---

## Scope

Whole-site redesign (pass 3, replaces the rack/schematic world): home, article, posts list, archive, categories/topic pages, projects, graph, about, 404, search overlay and `/solar-analysis`, across EN/FR/IT. Mode: Read. User complaint driving the pass: the home page made it hard to find the latest posts and to move from post to post. Critique 2026-10-18 scored the rack home 24/40 (P0 latest posts buried; P1 jargon; P1 duplicated titles).

## Direction contract

THESIS: The blog is Marco's home-lab notebook: graph-paper pages, marker headings, highlighter topics, so the newest page is always the first thing you see and every page tells you which page comes next. Refuses both the Blowfish card grid and the rack dashboard that put projects ahead of posts.

OWN-WORLD: White graph-paper ground (pale blue 28px grid) by day, a dark slate notebook with a faint grid by night. Black marker ink. Highlighter colours, one per topic (yellow AI, mint smart home, pink DevOps, orange Linux, lilac programming, sky web, lime mobile, apricot solar), used as swipes behind labels, never as text colour. Shantell Sans for headings, nav and annotations only; Atkinson Hyperlegible for body and article prose; Fragment Mono for code, dates and figures. Wobbly hand-drawn frame radius on panels, sticky notes for topics, hand-drawn SVG arrows.

STORY: A visitor sees the newest post at once, scans the latest pages as a ruled list, picks a topic sticky note or a running project, and at the end of every article is handed the previous/next page of the same project plus older/newer posts.

FIRST VIEWPORT: Header with the hand-lettered name underlined in yellow, nav (Latest, Topics, Projects, Archive, About) and a Search button. A framed panel carrying the newest post (cover left, title, summary, key figure in highlighter, "Read it" link) with a hand-drawn "newest page!" arrow. Below, within the fold on desktop: the ruled "Latest pages" list beside the topic sticky notes.

FORM: Hand-drawn zine explainer, catalog challenger (verdict competitive) from seed 535cbf0a, chosen by the user over the assigned Parts Catalogue and the Release Log pick. Kept from the declined hand: read marks / "new" badges, one real figure per post, project timelines. Code-led (no image generation). Signature interaction: hand-drawn arrows and underlines draw on once (stroke-dashoffset), highlighter swipes sweep in on hover; reduced motion renders them drawn.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved decisions

- Handwritten face never sets article body text or long titles in lists; long-form reading stays in Atkinson Hyperlegible.
- /graph/ keeps its JS; only colours and labels move to the notebook world.
