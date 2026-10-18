---
title: 'Use AI to Build the Tool, Not to Be the Tool'
categories:
- ai-coding-agents
tags:
- ai
- claude-code
- automation
- productivity
- cost
- llm
date: '2026-10-15T05:00:00.000000+00:00'
draft: false
slug: use-ai-to-build-the-tool-not-to-be-the-tool
translationKey: use-ai-to-build-the-tool-not-to-be-the-tool
cover: cover.jpg
showHero: true
description: We are replacing scripts, boards and small apps with the same paid prompt asked every day. I measured what that costs with Claude Code on three everyday jobs, against having the agent write the script once. Building costs about one ask, the answers stop changing from one run to the next, and the model stays only where judgement is needed.
summary: Asking an agent to block focus time, summarise yesterday's numbers or find a meeting slot works, but you pay for it every time, and the answer changes. I measured 14 Claude Code runs on three everyday jobs. Writing the script once costs about as much as asking once. With an interactive calculator, a checklist, and my own projects as examples.
keyfigure: '$0.19 per ask, every time'
---

I asked an agent to block two hours of focus time in my calendar tomorrow. It worked. It took **4 turns, 114,000 tokens, 14 seconds and $0.19**. Then I asked again, with exactly the same words and the same calendar, and it booked a different slot. Three runs, three answers: 13:00, 14:00, 13:00.

The script the same agent wrote for the same job books 12:30. Every time. For free.

This post is about that difference. Not "AI is bad" (I use it every day and most of my recent projects were written with Claude Code), but a habit I see growing around me and in myself: **we are replacing cheap, deterministic, write-once automation with expensive, non-deterministic, pay-every-time conversations.** The better move is to use the AI to build the automation, and then get it out of the loop.

## 1. From "do it" to "ask an agent to do it"

For a long time, repetitive work went through three stages. First you click. Then, when you've clicked the same thing enough times, you write a script, a board, a cron job, a small app. The script is boring, it does one thing, and it costs nothing to run.

Now there's a third option, and it's very tempting: **you ask.** "Find a slot for the six of us next week." "How did we do yesterday?" "Block me two hours tomorrow." The agent reads the calendars, queries the database, does the arithmetic, and writes you a nice paragraph.

That's where the industry is pushing. In an [IEEE survey](https://life.ieee.org/ieee-global-survey-the-impact-of-tech-in-2026/) published in November 2025, 52% of technology leaders *expected* agentic AI to reach mass or near-mass consumer adoption in 2026 as a "personal assistant, scheduler, or family calendar manager", first on the list. It's a prediction, not measured usage, but it says where the money is going. Google added [Gemini suggestions for meeting times](https://www.neowin.net/news/gemini-can-now-suggest-the-best-meeting-times-for-everyone-in-google-calendar/) to Calendar, even though the plain "Find a time" grid already did most of the job.

Nothing wrong with any of this for a one-off question. The problem starts when the same question comes back every morning.

## 2. The bill: cheaper tokens, bigger invoices

Token prices go down every year. Bills don't. An agentic task takes many model calls where a chat takes one, and every turn re-sends the growing context. Vendors [estimate](https://takara.ai/blog/ai-got-cheaper-so-why-are-enterprise-bills-exploding) 10 to 30 calls per task, with loops and retries multiplying that again (vendor estimates, but my own measurements below land in the same place).

Some companies found out the hard way in 2026:

- **Uber.** In April, [The Information](https://www.theinformation.com/newsletters/applied-ai/uber-cto-shows-claude-code-can-blow-ai-budgets) reported that the CTO, Praveen Neppalli Naga, said the full-year AI budget was used up a few months into the year: *"the budget I thought I would need is blown away already."* The amount was never disclosed. In June, [Bloomberg](https://www.bloomberg.com/news/articles/2026-06-02/uber-caps-usage-of-ai-tools-like-claude-code-to-cut-costs) reported, with confirmation from a spokesperson, a cap of $1,500 a month in token spend per agentic coding tool, per employee, with a way to ask for more.
- **Tokenmaxxing.** Meta ran an internal leaderboard of token consumption ("Claudeonomics"), with 85,000+ employees and about 60 trillion tokens in 30 days. [Some people let agents run for hours](https://the-decoder.com/meta-employees-compete-for-token-consumption-on-an-internal-ai-leaderboard/) to climb it. It was shut down within days (Meta cited data leaking outside, not the gaming). At Amazon, an unofficial leaderboard was [taken offline](https://www.cio.com/article/4178825/amazon-deletes-devs-tokenmaxxing-leaderboard-to-minimize-costs-2.html) and the company said token counts won't affect reviews. Salesforce didn't have a leaderboard, but it set [minimum weekly spend targets](https://blog.pragmaticengineer.com/the-pulse-tokenmaxxing-as-a-weird-new-trend/) on Claude Code and Cursor, before publicly criticising tokenmaxxing.
- **The measurement problem.** In the [LeadDev AI Impact Report 2026](https://leaddev.com/?p=34954), 58% of respondents say their organisation measures AI impact by token usage, and 57% say that measure doesn't work. Only 19% think tokenmaxxing is effective.

When the metric is "tokens spent", asking the same question every day looks like productivity.

## 3. The other bill: us

There's a second cost, harder to measure, and I want to be careful with it because it's easy to overstate.

A [Microsoft Research and Carnegie Mellon study](https://www.microsoft.com/en-us/research/publication/the-impact-of-generative-ai-on-critical-thinking-self-reported-reductions-in-cognitive-effort-and-confidence-effects-from-a-survey-of-knowledge-workers/) (CHI 2025, 319 knowledge workers, 936 real examples) found that, in most examples, workers felt generative AI reduced the effort of critical thinking, and that higher confidence in the AI was associated with less critical thinking. It's all self-reported. (You'll see a "62%" figure quoted around the web. It's not in the paper.) The MIT Media Lab's ["Your Brain on ChatGPT"](https://arxiv.org/abs/2506.08872) talks about "cognitive debt" from EEG on 54 participants, but it's a preprint and only 18 people did the last session.

So I won't build the argument on that. But I recognise the feeling: when the answer is one prompt away, I stop knowing how the number is computed. A script you wrote (or reviewed) is a definition you understand. A paragraph that changes every morning is not.

## 4. I measured it

I couldn't find anyone who put a number on "asking the same question every day". There are good opinion pieces: [TechTarget](https://www.techtarget.com/searchbusinessanalytics/opinion/Why-the-rush-to-replace-dashboards-with-AI-is-a-mistake) on why a dashboard you scan in 30 seconds beats a chat, [incident.io](https://incident.io/blog/dashboards-arent-quite-dead) on an LLM that "makes a best guess" about your metric definitions and gives a different number on different days. But no measurements. So I made some.

### The setup

Three everyday jobs, with seeded test data (no real calendars or company data):

1. **Focus blocker.** "Block 2 hours of focus time tomorrow." One calendar, working hours, existing meetings.
2. **KPI question.** "How did we do yesterday?" A SQLite database with 90 days of orders, signups and incidents, where yesterday was a bad day on purpose.
3. **Meeting finder.** Six people in four timezones, two weeks of meetings, and a clock change on 25 October in the middle.

Each job ran through `claude -p --output-format json` (Claude Code 2.1.284, Claude Sonnet 5.5) in a clean, empty workspace containing only the fixture data, in three ways:

- **ask**: the agent does the job, the way you'd do it every morning;
- **build**: the agent writes a script for the job, once;
- **residual**: the small model call that remains after the script, if any. For the KPI board, a ~100-token prompt only when a metric is 3σ out of range. For the meeting finder, one call to weigh the soft preferences ("Chen prefers mornings").

14 runs in total, **$1.52** at list prices.

### The numbers

| Job | Ask the agent, per run (cold cache) | Have it build the script, once | Left for a model after that |
|---|---:|---:|---:|
| Block 2h of focus time | **$0.185**, 114k tokens, 4 turns, 14 s | about $0.23 | nothing |
| "How did we do yesterday?" | **$0.208**, 186k tokens, 5–6 turns, 24 s | about $0.22 | $0.013 (3k tokens), only on anomaly days |
| 6 people, 4 timezones, find a slot | **$0.254**, 266k tokens, 7–8 turns, 38 s | about $0.22 | $0.022 (4k tokens) per meeting |

"Context tokens" are input plus cache reads: what the model actually processes. "Cold" means the first run of the hour, which has to write about 32k tokens of Claude Code context to the prompt cache. A question you ask once a day pays the cold price every day. Repeated within the hour, the same ask costs about three times less ($0.06 to $0.12), but that's not how a daily question works.

What I take from this table:

**1. Building costs about one ask.** Writing the script cost $0.22 to $0.23, the same as asking once. From the second day, the script is ahead. There is no "it's not worth automating" for a job you do daily.

**2. The answers change.** This was the surprise. The three identical focus-time runs booked **13:00, 14:00 and 13:00**. The script books 12:30 every time. The three "how did we do yesterday?" runs each chose their own headline: "paid orders fell by about half", "orders down about 37%", "about 40% below normal". All three are defensible. None is the same. And all three reported revenue **including failed orders** (€2,879), where the board reports paid revenue (€2,159). That's incident.io's "different number on different days", measured.

**3. The agent was right on the hard one.** I want to be fair here. All three meeting-finder runs found the same six valid slots as the script, across the clock change. The agent isn't wrong. It's just **12 times more expensive** than the script plus one small call, and it pays that every time.

**4. Most of the bill is the harness.** Sending "reply ok" through Claude Code with its tools enabled costs **34,499 context tokens** ($0.138 on Sonnet). That's the system prompt, the tool definitions, the environment. My residual calls, with tools turned off (`--tools ""`), cost 3,000 to 4,000 tokens. When you "just ask" an agent, most of what you pay for isn't your question. (I wrote about this standing cost before, for [MCP servers](/the-hidden-tax-on-every-ai-request-how-mcp-servers-are-draining-your-token-budget/) and [MCP versus a CLI](/the-future-of-agentic-tooling-mcp-servers-vs-cli-a-data-driven-comparison/): a CLI the model already knows costs 0 tokens of schema, a native MCP server about 3,000 per prompt.)

**5. Review what it builds.** The agent-written meeting script found **seven** slots, not six: it steps every 15 minutes instead of 30. Not a bug, a different choice. But it's exactly why you read the script once. You review it one time, instead of trusting a new paragraph every morning.

### Over a year

Take the KPI question, asked by a team of 20 people every working day. That's 4,400 runs a year. In tokens alone, on Sonnet, asking costs about **$850**. The board plus the anomaly calls cost about **$0.36**.

Tokens aren't the real cost, though, so let's count people at $60 an hour (my estimate, change it). The board needs about one hour of review and two hours of upkeep a year: about **$180**. Asking, once you count the 25 seconds everyone waits for the answer, climbs to about **$2,700**. These are my calculations from the measured runs, not measurements of a real team.

I built a small calculator so you can put in your own numbers: **[Ask once or build once? The calculator](/ask-once-build-once/)**. The presets are the measured runs above. Change the team size, the model, the hourly rate, and tick "count waiting and review time" to see where the two lines cross.

## 5. Where AI earns its tokens

None of this means "stop asking". Some jobs deserve an agent every time:

- **Novel**: you've never done it, and you won't do it again. Reading 40 contracts once to find the unusual clause.
- **Messy**: the inputs change shape every time. A root cause across three systems you've never correlated.
- **Exploratory**: the first look at a dataset, before you know what the right question is.
- **Judgement in prose**: explaining an anomaly to a human, weighing "Chen prefers mornings" against "Dana is on holiday Friday".

The meeting finder is the honest example. The agent got it right, all three times. The question isn't whether it can, it's whether it has to **every time**. Timezones, free/busy and working hours are arithmetic. The soft preferences are judgement. Split them, and the model only gets the 4,000 tokens it needs.

## 6. The missing move: use AI to take AI out of the loop

This is the habit I'm trying to build: when I notice I'm asking the same thing again, I ask the agent **one more time**, for the script.

It's also what the people building these tools are discovering:

- Anthropic's ["Code execution with MCP"](https://www.anthropic.com/engineering/code-execution-with-mcp): letting the agent write code against tools instead of calling them one by one reduced one workflow "from 150,000 tokens to 2,000 tokens", a 98.7% saving.
- Cloudflare's ["Code Mode"](https://blog.cloudflare.com/code-mode-mcp/) exposes its whole API in two tools and about 1,000 tokens, against 1.17 million for an equivalent plain MCP server.
- Tomasz Tunguz [wrote](https://tomtunguz.com/hybrid-state-machine-agents/) that "65% of my agent's workflow nodes run as non-AI code", across 14 of his production workflows.
- Aleksei Spinov [measured](https://blog.spinov.online/blog/token-economics-agent-driven-scraping/) a 12-page scrape at about $0.165 through an agent loop, and $0.014 with a deterministic crawler. Michael Tuszynski runs 30+ scheduled jobs and [only three use an agent](https://dev.to/michaeltuszynski/stop-turning-your-cron-jobs-into-agents-3i84).

### My own case: ai-email-assistant

The project I published last week, [ai-email-assistant](/drowning-in-email-ai-email-assistant-rules-first-models-last/), is this idea from start to finish, so I'll use it as the example.

**Built by AI.** All 15 commits are co-authored by Claude Opus 5.5, written in one evening. About 2,000 lines of plain Python, no runtime dependencies, 125 offline tests. I reviewed the code; I didn't type it.

**Run by code.** Every hour on working days, a `launchd` job runs Gmail rules (first match wins), sweeps, a same-day cache, and the validation of every model answer. The due dates are computed in code. The undo journal is code. If rules and cache place everything, **no model is called at all**.

**The model gets the leftovers.** Only the mail no rule can place goes to Claude Haiku 5.5, in batches, with metadata and a 240-character snippet. Only what Haiku isn't sure about goes to Sonnet. And even the AI skills shipped with the project have one job: **propose deterministic rules**. The AI writes the rules once, plain code runs them every hour.

What does that change? Here's my estimate, built from the project's measured overhead (not from a month of real use, which I don't have yet): an agent session per run on a Sonnet-class model would pay at least the ~17k-token CLI context every hour, about **$11.60 a month even on an empty inbox**. The hybrid costs between $0 and about $2.50 a month. Most of the saving doesn't come from cheaper calls, it comes from the runs that make **no call at all**.

The same pattern is in my other projects: [system-one-router](/system-one-router-picking-the-right-llm-for-every-prompt/) picks a model with a typed decision model and arithmetic instead of asking an LLM to route (the LLM-as-router baseline cost about 4.6 times more per decision, with similar accuracy), and [leanproxy](/your-mcp-input-context-which-ides-lazy-load-and-how-leanproxy-keeps-it-flat/) does search, projection and truncation in code before anything reaches the context. And it's what my earlier posts on a [local RAG for coding assistants](/stop-repeating-yourself-to-ai-how-i-built-a-local-rag-system-for-coding-assistants/) and a [tool harness for agents](/your-ai-agent-deserves-a-tool-harness-not-a-wild-west/) were circling around.

## 7. The rule: ask once, build once, run forever

Here's the checklist I use now. **Promote a prompt to code** (a script, a board, a rule, a cron job) when two or more of these are true:

- I've asked essentially the same thing **3 or more times**.
- The inputs come from the **same sources** each time (same database, same calendars, same inbox).
- The right answer is **definable**: a metric, a rule, a format, a threshold.
- I need the **same answer every time**, for consistency, comparison over time or audit.
- It runs on a **schedule or a trigger**, not on a whim.
- **Other people** need the result too.

Keep it as a prompt when the task is novel, ambiguous, cross-domain or truly one-off.

And when you build it, give each part of the job to the right worker:

| Part of the job | Who does it |
|---|---|
| Fetching, filtering, joining, arithmetic, timezones | code |
| Thresholds, schedules, "is this normal?" | code |
| Explaining an anomaly, weighing soft preferences, writing prose for a human | a model, with a few hundred tokens of context the code prepared |
| Writing and updating the code itself | a model, once, then you review it |

### Find your own repeated prompts

I wrote a small script that reads your local Claude Code history and groups the prompts you keep asking, with no model call. On mine, it found 253 human prompts, **13% of them in groups repeated on two or more days**. The biggest group, 28 times, was a templated "review this change for security vulnerabilities" prompt fired automatically. Claude Code only keeps recent transcripts, so that's a few weeks, not a year. But it was enough to show me which ones should already be scripts.

## 8. Honest limits

- **Three jobs, synthetic data, one model.** The fixtures are invented and seeded. Real calendars and real databases are messier, which usually makes the agent more expensive, not less.
- **Small samples.** Three runs per "ask", one per "build". Enough to show the variance, not enough for statistics.
- **List prices on 15 October 2026.** Subscriptions, discounts and batch pricing change the dollars, not the ratios. Re-check before you quote them.
- **The ai-email-assistant monthly numbers are estimates.** The only real-mailbox data is one dry run on a quiet personal inbox. A week of real usage logs on a busy mailbox would be a much better number.
- **The yearly team cost depends on my assumptions**: 20 people, 220 working days, $60 an hour, 25 seconds of waiting. The calculator lets you replace all of them.
- **Scripts have costs too.** They break when an API changes, and someone has to own them. I counted two hours of upkeep a year; yours may differ.

## 9. Close

AI is a fantastic compiler of intent into tools. Tell it what you want, review what it writes, and you get a script that answers the same question the same way, forever, for free. That's the best use of the tokens I found this year.

So my suggestion: treat a repeated prompt as a code smell. The third time you type the same question, ask the agent one last time, for the tool. Then try the [calculator](/ask-once-build-once/) with your own numbers, and tell me where your lines cross.
