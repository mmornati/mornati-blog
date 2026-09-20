# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are readers researching a specific technical problem they're actively working on: self-hosting infrastructure, AI/agentic tooling (MCP, coding agents), home automation (Home Assistant, Zigbee), solar/energy monitoring, or macOS/Linux sysadmin work. They typically arrive from a search engine or a link (Hacker News, Reddit, Mastodon/X) landing on one specific post, not browsing the homepage first. A smaller repeat-visitor segment follows Marco's ongoing projects (ai-running-coach, ha-energy-analysis, leanproxy-mcp) across posts.

## Product Purpose

A personal technical blog documenting real, running systems: production self-hosted infrastructure, home-lab automations, and AI-tooling experiments, written by the person who built and operates them. Success is a reader trusting the content enough to act on it (deploy the config, adopt the tool, replicate the setup) — not pageviews or engagement theater.

## Positioning

Writes from the operator's chair with real telemetry — actual kWh figures, actual Garmin/HR data, actual Home Assistant YAML, actual dollar/euro ROI numbers — rather than generic "how self-hosting works" explainers. A tutorial-aggregator blog could not truthfully reuse this content because it isn't reproducible without the author's own running systems.

## Operating Context

- Hugo static site, Blowfish theme (git submodule), deployed via git + CI/CD to a self-hosted VPS.
- Three fully separate content trees/languages: EN (site root), FR (`/fr/`), IT (`/it/`) — every redesign change must render correctly across all three.
- One standalone non-Hugo page, `/solar-analysis` (`static/solar-analysis/index.html`), a hand-built solar telemetry dashboard, currently visually disconnected from the rest of the site.
- Comments via self-hosted Remark42; view/like counts via Firebase; analytics via self-hosted Umami.

## Capabilities and Constraints

- Theming is CSS-token-based (Blowfish `assets/css/schemes/*.css`, RGB-triplet custom properties consumed by precompiled Tailwind utilities) plus a plain-CSS `assets/css/custom.css` override — no Tailwind rebuild toolchain is required or planned for this pass; layout changes reuse the utility classes already compiled into the theme, and bespoke visuals live in plain CSS.
- Existing behavior to preserve as-is: light/dark toggle (class-based, `prefers-color-scheme` + localStorage), Cmd/Ctrl+K search, sticky smart table-of-contents on articles, Remark42 comments, sharing links, reading time/word count, multi-language switcher.

## Brand Commitments

- Author identity: Marco Mornati, software engineer based in Lille, France (works at Decathlon), self-hoster, AI/OSS enthusiast. Personal avatar photo is an existing confirmed asset (`assets/img/avatar.jpg`).
- No existing logo, wordmark, or fixed color identity — this is the first deliberate visual system for the blog.

## Evidence on Hand

- Live site content and structure reviewed directly (blog.mornati.net): homepage, article page, archive, categories, about, 404, search overlay, `/solar-analysis`.
- Author bio and project list: `content/en/page/about.md`.
- Category taxonomy (from live categories page): AI & AI Coding Agents, DevOps & Infrastructure, Linux & Sysadmin, macOS, Mobile & Gadgets, Programming & Software Engineering, Smart Home & Home Assistant, Solar & Home Energy, Web Development & Blogging.
- No customer testimonials, pricing, or commercial claims exist or are needed; none should be invented.

## Product Principles

1. Content and data are real and specific (actual numbers, actual configs) — the design should make real data look credible and legible, never decorative or invented.
2. The reading experience for long technical articles (code blocks, TOC, headings) is the core job; visual expression must never fight readability.
3. One coherent system across all site surfaces, including the previously-orphaned `/solar-analysis` dashboard and all three languages.
4. Preserve every existing working mechanism (light/dark, search, comments, TOC, multilingual routing) — this is a visual and structural redesign, not a feature rebuild.

## Accessibility & Inclusion

No project-specific requirement was established beyond standard web accessibility (WCAG AA contrast, keyboard navigation) — treated as a baseline constraint for the new color system given long-form reading is the core use case.
