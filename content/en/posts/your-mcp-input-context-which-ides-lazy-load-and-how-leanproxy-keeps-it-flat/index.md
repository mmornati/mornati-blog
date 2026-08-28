---
title: 'Your MCP Input Context: Which IDEs Lazy-Load and How LeanProxy Keeps It Flat'
categories:
- ai-coding-agents
tags:
- ai
- mcp
- model-context-protocol
- claude-code
- cursor
- token-optimization
- leanproxy
- ai-coding-agents
date: '2026-08-23T09:00:00.000000+00:00'
slug: your-mcp-input-context-which-ides-lazy-load-and-how-leanproxy-keeps-it-flat
translationKey: mcp-input-context-ides-lazy-loading
description: Every MCP server you keep enabled pays a toll into the input context on
  every request. But not every IDE loads tools the same way. Here is who lazy-loads,
  who doesn't, and how LeanProxy keeps your context size flat no matter how many servers
  you keep configured and active.
---



Whenever I read about MCP servers, the conversation is almost always about the features: *"Connect this, connect that, the model can now do X, Y and Z."*

What nobody tells you is what actually happens to your **input context** the moment you enable a server.

Every MCP tool you add carries a schema — name, description, a JSON parameter blueprint. In most IDEs those schemas travel with **every single request** to the model, whether the tool is used or not. They live in a part of your input you don't see, they consume tokens your pay-per-token bill charges for, and they eat the exact same budget your code, your conversation and your instructions share.

The result? Enable three sport or dev servers, and a big chunk of your context window is busy doing nothing useful. The interesting bit, though, is that **not all IDEs behave the same way**. Let's look at what is actually happening right now.

## If You Do Not Use It, It Still Pays Rent

A tool schema is a small JSON document: tool name, human-readable description, and the JSON Schema of its parameters. An MCP server like the GitHub one exposes dozens of them, Garmin exposes a hundred.

When an IDE works in *eager* mode — the default for most tools — every enabled server's entire tool list is injected into the system prompt or the request. The model cannot swap it out, because it is part of the input each and every turn.

The size adds up quickly. I wrote about the same "schema tax" in a previous [post](/the-hidden-tax-on-every-ai-request-how-mcp-servers-are-draining-your-token-budget/): just to have Garmin, GitHub and Intervals.icu available costs about 16,000 to 17,000 tokens per request in my environment.

But wait — I should make a distinction: not every IDE loads tool definitions eagerly. And this is where the story gets interesting.

* * *

## The 2026 Check: Who Lazy-Loads MCP Tools?

I went through the current docs and issue trackers of the major clients to see how each one loads MCP tools into the input context. The results are more varied than you'd think:

| Client | Loading strategy (Aug 2026) | Lazy / on-demand | Docs & caps |
|:---|:---|:---|:---|
| **Claude Code** | **Lazy (default)** — "MCP Tool Search" | Yes; fetches up to a few tools on demand | Requires Claude 4.5+ models; falls back to eager in some setups (`docs.claude.com`) |
| **VS Code / Copilot** | Hybrid — lazy for allow-listed models | Partial (tool search for GPT-5.x, Claude 4.5+) | 128-tool hard cap; virtual grouping at 64 tools (`code.visualstudio.com/docs`) |
| **Cursor** | Eager | No | All enabled tools loaded every request; no documented cap (`docs.cursor.com`) |
| **Windsurf / Devin Desktop (Cascade)** | Eager | No | Hard cap of 100 tools (`docs.devin.ai`) |
| **Cline** | Eager | No | All tool defs injected into the system prompt at once (`docs.cline.bot`) |
| **Gemini CLI** | Eager | No | Startup registry, namespaced `mcp_<server>_<tool>` (`geminicli.com/docs`) |
| **JetBrains AI Assistant** | Eager (assumed) | No | Tools "become available", invoked automatically; no documented search |
| **opencode** | Eager | No | Docs explicitly warn MCP servers "add to the context" (`opencode.ai/docs`) |
| **Roo Code (QuillBot)** | Eager | No | Removal explicitly linked to "reducing token usage"; archived May 2026 |
| **Continue** | Agent-only, not verified | — | Likely eager, no documented token effect |
| **Aider** | N/A | — | No native MCP client support |

So the reality: **only Claude Code lazy-loads by default**, VS Code/Copilot does it partially depending on the model, and **everyone else is eager** — tool schemas hit the model on every turn.

## Claude Code: The Lazy Default

Claude Code is the outlier here. Since the launch of MCP Tool Search, tools are no longer all injected eagerly. Instead, the client sends a summary of the available tool, and a dedicated `ToolSearch` mechanism fetches the most relevant schemas on demand — historically it pulls up to a **few tools per request** based on what the task needs. Tools fetched in a turn stay available for later turns. In Claude's own docs, `ENABLE_TOOL_SEARCH` can be `true`, `auto:5` (fetch up to 5 tools), or `false`, and **`false` reverts to the old behavior: all tool definitions go into the context every turn**.

The catch: this "by default lazy" mode needs a recent Claude model (Sonnet 4.5+ / Haiku 4.5+ / Opus 4.5+). If you route through `ANTHROPIC_BASE_URL` to a gateway or any other non-first-party provider, Claude Code falls back to eager loading. Same if you use Microsoft Foundry on Azure or Google Cloud Agent Platform: everything goes in.

The other one, lesser known: **MCP discovery cache** (`MCP_DISCOVERY_CACHE`) — Claude Code now caches remote HTTP/SSE servers. A server showing `cached 2h ago · connects on first use · 5 tools` isn't even booting if the cache is fresh; it doesn't connect to the server until you actually use the first tool. That's real lazy loading for the server, not just the schema.

## Cursor, Windsurf, Cline, Copilot, JetBrains, opencode — the eager crowd

Every other client I checked still treats all your enabled MCP tools as being always-on. Let's be precise, because the exact behavior matters:

- **Cursor** — reads "Cursor automatically uses MCP tools listed under Available Tools when relevant". The "Available Tools" bucket is part of the context breakdown Cursor now shows, and it sits there in your budgets from the first message.
- **Windsurf (Devin Desktop)** — Cascade gets all the enabled tools of the connected MCP servers, with no on-demand loading. There's a documented hard cap: "Cascade has a limit of **100 tools** at its disposal". Once you exceed that, you have to choose which tools get excluded.
- **Cline** — injects the definitions of all available tools into the system prompt at once. There's an open discussion asking for "defer loading"/tool search; it was not shipped.
- **VS Code / Copilot** — the local agent and the Copilot agent-host load all selected tools into the request by default. For a small allowlist of models the client-side tool search kicks in; for everyone else it's full eager. And there's a hard `128 tools per message request`.
- **JetBrains AI Assistant** — tools "become available" and are invoked automatically or via the tool picker; no documented lazy loading.
- **opencode** — I found this candidly in opencode's own docs: ["When you use an MCP server, it adds to the context. This can quickly add up... MCP servers add to your context, so you want to be careful with which ones you enable."](https://opencode.ai/docs/mcp-servers/) — that's literally why they recommend toggling servers off.

So in most IDEs, adding a server (even one you rarely use) directly **enlarges your context size** — you lose space for your code, your files, your instructions, and your conversation.

## The Real Cost: Numbers Are Not Symbolic

I measured the size of the "tool namespace" in my own environment using LeanProxy and the canonical `pkg/reporter.Estimator` (1 token ≈ 4 characters, JSON-RPC envelope included). Native MCP tool list, no cache discount, compared to the LeanProxy router: 3 tools, ~158 tokens.

| Configuration | Native MCP (raw) | LeanProxy (router) | Savings |
|:---|:---|:---|:---|
| 1 server — Intervals.icu (10 tools) | 1,129 tokens | 158 tokens | **86.0%** |
| 1 server — GitHub (41 tools) | 4,570 tokens | 158 tokens | **96.5%** |
| 1 server — Garmin (100 tools) | 11,130 tokens | 158 tokens | **98.6%** |
| 3 servers — 151 tools | 16,830 tokens | 158 tokens | **99.1%** |

Session-level replays at a conservative cache-read discount (cache hits are NOT free; actual discounts are ~0.1x today — see below):

| Live scenario | Native MCP | LeanProxy | Savings |
|:---|:---|:---|:---|
| Morning Sport (2 servers, 4 prompts) | ~12,260 | ~740 | **94.0%** |
| Dev Workflow (2 servers, 5 prompts) | ~7,120 | ~925 | **87.0%** |
| Full Day (3 servers, 7 prompts) | ~29,450 | ~1,295 | **95.6%** |

Full methodology and tables are in the [LeanProxy benchmark results](https://github.com/mmornati/leanproxy-mcp/blob/main/docs/benchmark-results.md) (in the `docs/` folder of the repo).

* * *

## But Wait — Caching Makes It Cheaper, Right?

Here's the argument I hear most often: *"The context can be huge because of my MCP servers, but I only pay full price once — after that the provider serves the same prefix from its prompt cache on every turn."*

That's half true, and the half that's true is a trap. Let me check the current numbers.

Every major provider now splits input pricing into three buckets:

| Provider | Model | Fresh input | Cache **write** | Cache **read** |
|:---|:---|:---|:---|:---|
| Anthropic | [Sonnet 5](https://claude.com/pricing) | $2.00 | **$2.50 (1.25x)** | $0.20 (0.10x) |
| Anthropic | [Sonnet 4.6](https://claude.com/pricing) | $3.00 | **$3.75 (1.25x)** | $0.30 (0.10x) |
| Anthropic | [Opus 5](https://claude.com/pricing) | $5.00 | **$6.25 (1.25x)** | $0.50 (0.10x) |
| OpenAI | [gpt-5.6-sol](https://platform.openai.com/docs/pricing) | $4.00 | **$5.00 (1.25x)** | $0.40 (0.10x) |
| OpenAI | [gpt-5.5](https://platform.openai.com/docs/pricing) | $5.00 | —(billed as input) | $0.50 (0.10x) |
| OpenAI | [gpt-5-mini](https://platform.openai.com/docs/pricing) | $0.25 | —(billed as input) | $0.025 (0.10x) |
| Google | [Gemini 3.5 Flash](https://cloud.google.com/vertex-ai/generative-ai/pricing) | $1.50 | —(no write surcharge) | $0.15 (0.10x) |
| Google | [Gemini 3.1 Pro](https://cloud.google.com/vertex-ai/generative-ai/pricing) | $2.00 | —(no write surcharge) | $0.20 (0.10x) |

*USD per 1M tokens, current list prices (August 2026). "Cache write" is what you pay when a prefix enters the cache; "cache read" is every subsequent time the same prefix is re-sent. Google and some OpenAI models bill the first write as regular input instead of charging a write surcharge.*

So the pricing reality is exactly what you described:

1. **The write is not "full price once" — it's 1.25x.** The first time your huge MCP-bearing system prompt enters the cache, you pay a *premium* over normal input.
2. **The read is cheap but never zero.** 0.10x of the full 16,830 tokens is still ~1,700 token-equivalents *per turn*, for tokens you'll never use.
3. **The cache TTL resets the clock.** Standard Anthropic caching is a 5-minute TTL. In a long coding session — or one where you step away — the cache expires, and the next request triggers a *fresh* 1.25x write of the whole thing again. Multi-turn sessions that drag on re-pay it repeatedly.
4. **Caching never shrinks the context window.** The 16,830 tokens still occupy the same slots in the model's context on every single turn, cached or not. The cache is a *billing* discount, not a *capacity* discount — it saves you money, but it does not give you back the space that could hold your code, your files, or your instructions.

Let me put the numbers on that. A typical 20-turn development session, 3 MCP servers enabled (16,830 schema tokens) riding on top of ~20k tokens of actual payload (~36,830 input tokens), on Claude Sonnet 5 (`$2.00` input / `$2.50` write / `$0.20` read):

| | Schema tax only (16,830 tokens) | Full prompt (36,830 tokens) |
|:---|---:|---:|
| Turn #1 — cache **write** | ~$0.042 (at 1.25x) | ~$0.092 |
| Turns #2–20 — cache **read** (19 hits) | 19 x ~$0.0034 | 19 x ~$0.0074 |
| **Session total, schema only** | **~$0.106** | ~$0.232 |

Now the same session through LeanProxy (3-router tools, ~158 tokens):

| | Router-only (158 tokens) | Full prompt (20,158 tokens) |
|:---|---:|---:|
| Turn #1 — cache **write** | ~$0.0004 | ~$0.050 |
| Turns #2–20 — cache **read** | 19 x ~$0.00003 | 19 x ~$0.0040 |
| **Session total** | **~$0.0014** | **~$0.126** |

Even at the best of times — the whole prefix cached, nothing evicted — **carrying the MCP schemas costs you well under a cent per turn, forever, session after session**. The "I only pay once" statement is true only if a session lasts under the 5-minute TTL, never writes again, and you ignore the 0.10x reading you pay on every turn since.

The interesting part: caching and LeanProxy are *additive*. Prompt caching lowers the *dollar* per token; LeanProxy lowers the *number of tokens*. They answer different questions — and LeanProxy helps whether the cache hits or misses:

* If the cache **hits**: you pay 0.10x of 158 tokens instead of 0.10x of 16,830.
* If the cache **misses** or expires (5-min TTL): you pay 1.25x of 158 tokens instead of 1.25x of 16,830 — the most expensive case is precisely the one LeanProxy protects.

* * *

## How LeanProxy Keeps Your Context Size Flat

The way LeanProxy solves this problem is conceptually ridiculous — but that's why it works.

**LeanProxy presents itself to your IDE as a single MCP server.** Not four, not twelve: **one**, with exactly **three tools** — `list_servers`, `list_tools`, `invoke_tool` — about **158 tokens** total.

Those three tools are all the client sees, all the context consumes. The moment the model actually needs the GitHub API, it calls `invoke_tool("github", ...)`; LeanProxy then loads the server, the JIT schema, and routes the request. Tool stubs are resolved on first use (~26 tokens/stub) and then cached.

So the context size is **fixed** — the same, regardless of how many MCP servers you keep configured behind LeanProxy. Add Garmin, Intervals.icu, HASS for Home Assistant, Stitch, GitHub, the context stays at three tools. Three. The IDE never sees the "other" 100 tools.

Even for the IDEs that *do* lazy load (Claude Code with tool search), this matters: the client only ever has a handful of tools, so the discovery happens faster, the summary is tiny, every cache hit avoids schema churn, and — if you ever disable the tool search and go eager — you're still paying 158 tokens instead of 16,000.

## The one you can keep, and the one that pays

That is the key: **you can keep ALL your MCP servers configured and marked active** — GitHub for the code, Garmin and Intervals.icu for the sport, the Home Assistant one for the home automation — and the input context stays exactly the same. The IDE just won't blow its token budget on schemas.

No more juggling. No more *"which of the 4 servers do I need for this session?"* toggles that you forget about and then pay for all day. LeanProxy solves it in the background, and the tool explosion becomes invisible.

If that resonates with you, the project is on GitHub: [mmornati/leanproxy-mcp](https://github.com/mmornati/leanproxy-mcp). And before wiring it in, you can preview the savings without touching your live requests:

```
# preview how many tokens LeanProxy would save you
leanproxy-mcp report --dry-run
```

* * *

**The uncomfortable truth**: in most current IDEs, MCP integrations charge you for tools you never called on every single model turn — lazy loading is still the exception, not the rule. That's why keeping a proxy like LeanProxy in front of your MCP servers is the only way to keep ALL of them configured and active without watching your input context grow with every server you add.

Keep the capability, lose the tax.