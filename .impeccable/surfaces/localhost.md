---
version: 1
slug: "localhost"
primary_target: "http://localhost:1313"
related_targets: []
---

## Scope

Whole-site visual redesign: home, article/post, archive, categories, about, 404, search overlay, and the standalone `/solar-analysis` dashboard, across EN/FR/IT. Mode: Read (comprehension of long-form technical articles is the core job).

## Direction contract

THESIS: The blog is organized the way its author organizes infrastructure before building it — content as labeled, connected nodes in a schematic, not a generic blog-template hero + gray card grid. Refuses the default "profile hero photo + drop-shadow card grid" arrangement every Hugo/Blowfish blog ships with.

OWN-WORLD: Two real technical artifacts, not an invert pair. Dark mode = a night schematic/terminal: near-black slate ground (`#0b0e12`-ish), one copper/amber signal accent for links/active state/category weight, thin cool-grey grid hairlines. Light mode = blueprint paper: pale blueprint-blue ground (`#eef3f8`-ish), deep blueprint-ink blue for text/rules, the same copper/amber accent carried over as the one warm note. Category/tag weight and post recency render via dot/mark size (raised from the star-atlas challenger), not color alone. Status/state (draft, read, active nav) is encoded by shape/mark, never color alone (raised from the film-cutting-bench challenger, also an accessibility win). One grotesque (Archivo) for display/UI/labels, one text serif (Source Serif 4) for article body copy, one mono (JetBrains Mono) for code, timestamps, meta — strict, no fourth face (raised from the design-annual challenger's single-grotesque discipline).

STORY: A visitor understands this is a working engineer's documentation of real, running systems — not content marketing. They believe the data (kWh figures, HR zones, YAML configs) because the page itself behaves like an engineering document: labeled, annotated, precisely gridded. They read the post, follow related posts rendered as connected nodes, and trust the content enough to act on it.

FIRST VIEWPORT: Homepage — author rendered as a compact status-lit "node" card (avatar + name + role + a live category/signal line), NOT a large centered profile hero. Recent posts as a connected node list: each post a labeled node (category shown as a port-style tag, date/reading-time as mono telemetry), thin schematic connector rules between related nodes as the signature structural motif — restrained, structural, never decorative wallpaper. Primary action (read a post) stays a normal top-to-bottom scan; the schematic grammar re-skins existing components, it doesn't add spectacle that competes with reading.

FORM: Candidate 6 of 7 in the self-derived, resonance-ordered list (Home Assistant Lovelace dashboard, Unix terminal/journal, rack-mounted server + patch panel, solar inverter LCD, GPS trail-watch summary, network/infrastructure topology diagram [chosen], maker breadboard notebook). Seed key: `d0c81b63` (`concept-seed --scope direction --mode read`).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Pass 2 — homepage rack elevation + features (seed 639f710a)

Scope for this pass: realise the world structurally. Visitor mode stays Read. User answers: push the schematic world (no replacement); add topic graph, project/series hubs, reading tools; refuse heavy JS and flashy article pages (wow lives on index surfaces, articles stay calm).

## Direction contract

THESIS: The homepage is a rack elevation of the author's running systems: each project is a 1U unit with a shape-coded status LED, its newest post and a patch port to its pillar. Refuses the Blowfish card grid of same-size cover cards.

OWN-WORLD: Unchanged schematic tokens (copper signal, cyan trace, blueprint/night ramp, Archivo / Source Serif 4 / JetBrains Mono). New material: two rack rails with square mounting holes and mono U-numbers framing the page; faceplates as flat panels with hairline seams; status by LED shape (filled = active, ring = maintained, half = experiment, hollow square = archived), never colour alone.

STORY: A visitor from search sees within one screen what Marco actually runs, which systems are live, and where every post plugs in; they open a unit, follow its series, or jump to the topology map.

FIRST VIEWPORT: Rails left/right at full height. U-top: 1U head unit (avatar, name, headline, links). Then a 3U "latest transmission" unit: cover image at left third, title, summary, mono telemetry. Below it the first project units start inside the fold. Units expand in place (native details) to list their series; ledger and patch panel follow.

FORM: Rack elevation, dealt index 4 of 7 in the surface structure list (pillar bus lines, topology map, rack elevation, featured plate + index, syslog ledger, datasheet, patch bay); locked by the user. Seed key: 639f710a. Signature interaction: unit slides out of the rack on expand, activity LED blinks on hover; card cover to article hero via view transitions.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved decisions

- Exact numeric palette values and font sizes are decided during implementation, within the OWN-WORLD description above.
- Whether the schematic connector-line motif extends to article-body content (e.g. section dividers) or stays confined to navigation/index surfaces — default to confining it to index/nav surfaces to protect reading comfort; revisit only if it reads as too bare.
