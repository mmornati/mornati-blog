---
title: 'One Human, a Board and a Team of Agents: How I Build Software Now (and Why My Estimate Was Wrong)'
categories:
- ai-coding-agents
tags:
- ai
- claude-code
- multi-agent
- github-projects
- software-engineering
- estimation
- productivity
- team-topology
date: '2026-10-28T17:00:00.000000+00:00'
draft: false
slug: one-human-a-board-and-a-team-of-agents
translationKey: human-agents-board
cover: cover.jpg
showHero: true
description: 'How I build Horae with a team of AI agents and one GitHub Project board: tickets written with Claude and validated by me, a single "follow the board" instruction, three agents per story (build, independent review, fix), and a simple protocol for when a human is needed. The up-front estimate said one human plus agents would be slower than three developers. The first six stories took 7 to 32 minutes of agent time each, against hours in the estimate. Why the model was wrong, what it still gets right, and what this means for two-pizza teams versus sandwich teams.'
summary: 'The estimate said one human with four agents would need 76 weeks where three developers need 22. Then the board started moving: six stories, 7 to 32 minutes of agent work each, 97 review findings fixed before merge, zero takeovers. The bottleneck is still the human, but not where the model put it.'
projects:
- horae
---

Yesterday I asked Claude to estimate a project two ways: in **human days**, if a team of developers built it, and in **AI days**, if a team of agents built it with me supervising. The answer was clear and a bit deflating: **one human plus four agents would be slower than three developers**. 76 weeks against 22, because my supervision would be the bottleneck.

I wasn't convinced. So I set up the project so that the board itself would tell me: every story carries its estimate, and every story gets its actual numbers posted when it's done. Then I gave the agents one instruction: *follow the board*.

This post is about how that works day to day (the board, the agents, the moments where I'm needed), what the first numbers say against the estimate, and what changes when your "team" is one person and some agents instead of a two-pizza team.

## 0. The result first

Here is the whole loop in about 100 seconds. Like [my previous videos](/canvas-videos-with-voice-over-in-javascript/), it isn't a video file: every frame is drawn in JavaScript, over a synthetic voice-over.

<div style="container-type:inline-size;margin:1.5rem 0">
<iframe src="/videos/human-agents-board/?embed=1&lang=en" title="One human, a board, a team of agents" loading="lazy" allow="fullscreen; autoplay" allowfullscreen style="display:block;width:100%;height:calc(56.25cqw + 40px);border:0;border-radius:8px;background:#f7f9fc"></iframe>
</div>

*Press Play (sound on). Switch the language in the control bar or turn on the subtitles. [Open it full page](/videos/human-agents-board/?lang=en) to get the chapter list.*

## 1. The project: Horae

[**Horae**](https://github.com/horae-dev/horae) is a predictable, self-hosted personal agent: fixed pipelines instead of an agent loop, at most one bounded LLM step, plugins with declared permissions installed from git. Morning brief, reminders, a few integrations with my notes and my mail. A real product with real constraints: untrusted input, secrets, plugins I didn't write.

It's also the first project I decided to build **mostly with agents from day one**, with me as a part-time maintainer: about 15 hours a week, evenings and weekends.

## 2. Tickets first, and the human validates them

Nothing below works without this step, and it's the one that took me the most time.

Over a few sessions, Claude and I wrote the plan (`PLAN.md`), the architecture decisions to make, and the backlog. Then I asked Claude to put it all on GitHub: one organisation, 15 repositories, and a public project, the [Horae Roadmap](https://github.com/orgs/horae-dev/projects/1). It created **130 issues**: 23 epics, 90 stories, 7 human-only tasks and 10 risks ("burning points"), using issue types (Epic, Story, Risk), sub-issues and "blocked by" links.

I read and validated the tickets before any code existed. That's the part I'd never delegate: deciding what "done" means.

Every story has the same shape: a summary, **acceptance criteria**, an estimate table, instructions for agents, and an empty **Actuals** section to fill in at the end.

![The estimate table of story #13: size, human estimate in ideal days, executor, risk class, expected first-pass success of an agent, expected agent wall-clock and expected human supervision](/images/one-human-a-board-and-a-team-of-agents/issue-estimate.webp)

The project has custom fields that make the board readable by humans and by agents:

| Field | Values | Why |
|---|---|---|
| **Executor** | Agent · Agent + human check · Human-led · Human-only | who does the work, so agents know what to skip |
| Size | XS · S · M · L | for the estimate |
| Risk class | Normal · Docs/CI · Core contract · Security · Integration · External API · Design/prompt | security and external APIs need much more supervision |
| Human days, Agent hours, Supervision hours, First-pass % | numbers | the two estimates, per story and per epic |

![The "Backlog by milestone" view: each epic with its milestone, target date, human days, agent hours and supervision hours](/images/one-human-a-board-and-a-team-of-agents/estimates-by-epic.webp)

Each repository also has an `AGENTS.md` (setup, commands, conventions, definition of done) and a `graft.yaml` policy that says which paths need my review, so the rules live in the repo, not in a prompt.

## 3. The board is the interface

The board view has six columns. Their descriptions matter, because they are the contract between me and the agents:

| Column | Meaning |
|---|---|
| **Backlog** | not ready yet |
| **Ready** | spec complete, can start |
| **In progress** | an agent or a human is working on it |
| **In review** | PR open, Graft and/or the maintainer reviewing |
| **Human needed** | blocked on the maintainer |
| **Done** | merged and accepted |

![The Horae board this morning: 106 items in Backlog, 3 in Ready, 5 in progress and 6 done, each done card linked to its merged pull request](/images/one-human-a-board-and-a-team-of-agents/board.webp)

Around it there are five more views: **Roadmap**, **Backlog by milestone** (with the estimates), **Agent-ready** (filter `label:agent-ready status:Ready`: what an agent can pick up now), **Human work** (Human-led and Human-only items, the real bottleneck) and **Burning points** (the risks).

![The "Human work" view: every Human-led and Human-only item with its supervision hours, from 8 to 28 hours each](/images/one-human-a-board-and-a-team-of-agents/human-work.webp)

That last screenshot is the one I look at most. It says where my evenings will go.

## 4. One instruction: follow the board

Then I wrote this, typos included:

> Following the project on github https://github.com/orgs/horae-dev/projects/1/views/3 Start in the right order the epics/issues ready for agents dev.
> Use the proper workflow with subagents when needed assigning the proper model based on the complexity, make a full review with another agent and fix then all the findings with a third agent.
> Create the PR referencing the issue, wait for the CI to be green, merge and move on.

And a second message a minute later: *"be sure to assign each task before to start to be able to track the time"*.

From there, the lead Claude Code session ran the board. For each Ready story, in dependency order:

1. **Assign** the issue to me and move it to **In progress** (the timestamp starts the clock).
2. **Build**: a subagent implements it on a `story/<n>-<slug>` branch. The lead picks the model by complexity: Sonnet for the scaffold, the CI and the agent workflow; Opus for the JSON Schemas, the intent validation and the ADRs.
3. **Review**: a separate Opus agent reviews it against the acceptance criteria, `PLAN.md` and the stories that depend on it. It doesn't edit; it reproduces problems in a scratch clone and writes findings.
4. **Fix**: a third agent fixes *every* finding.
5. Open the PR referencing the issue, **wait for CI to be green**, merge.
6. Post the **Actuals** on the issue and move the card to **Done**.

![Story #13 in the issue timeline: moved to Ready, self-assigned, moved to In progress, closed by the merged PR, then the Actuals comment: 1 implementation, 1 review with 20 findings (8 major), 1 fix pass, about 32 minutes of agent time, no human takeover](/images/one-human-a-board-and-a-team-of-agents/issue-actuals.webp)

Cards whose Executor is **Human-led** are skipped: they wait for me. The next morning, when there were independent stories left, the lead started them **in parallel**, each in its own git worktree: a threat-model note, a plugin-host note, the SQLite store, the config loader and the intent validation, while the earlier ones were still in review.

### What the reviewers caught

This is the part that convinced me the loop works. The implementer always said "all checks pass". The reviewer always found something real, and often something serious:

- **#10 scaffold** (16 findings): gitleaks silently skipped a whole folder, and Renovate would never have updated the pre-commit hooks.
- **#15 agent workflow** (13): the commit hook used whatever `python3` was first on the PATH. On macOS's default Python 3.9 it crashed and **blocked every commit**, including mine.
- **#13 schemas** (20, 8 major): a note path could escape the Obsidian vault into `.obsidian/plugins` (code execution on my laptop), `notify.push` accepted `javascript:` links, `http.post` URLs could bypass the host allow-list, and the lockfile accepted `ext::` git URLs.
- **#18 SQLite store**: foreign keys were enabled before migrations, so a future table rebuild would have silently deleted every journal entry. The reviewer reproduced the data loss.
- **#16 config loader**: 400 nested `[` crashed `horae doctor`, and a secret could leak through Python's exception context.

On top of that, a Semgrep hook blocked the session twice on SQL built with f-strings, and the lead made the store agent rewrite every query as a fixed string. None of this needed me.

## 5. When a human is needed

Some stories are mine by design: the threat model, the plugin host, anything where a wrong default is a security hole. For those, the agent doesn't guess. It writes a **design note** as a draft PR, with numbered questions, and the card moves to **Human needed**.

The protocol is two steps:

1. **Answer on the PR**, keeping the question numbers. Short answers are fine; "all as proposed" is fine too.
2. **Move the card back to Ready.** That's the signal. The next time an agent picks it up, it reads my comments, turns the note into the real deliverable, and runs the usual build → review → fix → merge loop.

![Pull request #85, the plugin-host design note: ten numbered questions for the maintainer, and below them my answers, one line each](/images/one-human-a-board-and-a-team-of-agents/pr-questions-answers.webp)

Ten questions, ten one-line answers, a card dragged back to Ready. That's the whole interface.

The same pattern shows up for smaller decisions. When `PLAN.md` was ambiguous, the agents **chose the tightest option** (relaxing a rule later breaks nothing, tightening one does), recorded it as provisional, and listed it for me: 21 contract decisions in `schemas/README.md`, which I confirmed in one message the next morning. The ADRs (story #12, "Agent + human check") stayed unmerged until I read them and wrote "Accept and merge".

The agents also told me plainly what they *couldn't* do: install a private GitHub App on the organisation, or configure the Roadmap view's date fields, which the API doesn't expose. Those went to the "Human operations" epic.

## 6. The estimate, and why I doubted it

Here is what the model said, in its likely case:

| | Human team | One human + 4 agents |
|---|---|---|
| Effort | 218 person-days | 325 agent-hours + **1,134 h of my supervision** |
| Calendar | **22 weeks** with 3 developers · 67 weeks alone | **76 weeks** at 15 h/week · 38 weeks full-time |

The model was careful and its sources were good: [METR's time horizons](https://metr.org/blog/2026-1-29-time-horizon-1-1/), [METR's 2025 study](https://metr.org/blog/2026-02-24-uplift-update/) where experienced developers were 19% *slower* with AI, the [CodeRabbit](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report) and [Veracode](https://www.veracode.com/wp-content/uploads/2026-GenAI-Report-Infographic.pdf) reports on defects in AI-written code. Its core assumptions:

- An agent's **first-pass success** falls fast with size and risk: 85% for an S story, 30% for an L, halved again for security.
- Each failed attempt costs a **human review** of about 15% of the human effort, doubled for security.
- After three failures, **a human takes over** at 60% of the human effort.
- Agent wall-clock: 0.75 h for an S story, 2 h for an M, 5 h for an L.

So most of the 1,134 hours were me, reviewing diffs and rescuing agents.

## 7. What the board says after six stories

The project says "recalibrate after about 15 stories", so this is an early reading, not a verdict. But the gap is large enough to be worth showing:

| Story | Size · risk | Estimated agent time | Estimated supervision | **Measured agent time** | Review findings | Outcome |
|---|---|---|---|---|---|---|
| #10 uv scaffold | S · Docs/CI | 0.9 h | 2.0 h | **7 min** | 16 | merged, [#78](https://github.com/horae-dev/horae/pull/78) |
| #11 CI pipeline | S · Docs/CI | 0.9 h | 2.0 h | **7 min** | 10 (1 blocker) | merged, [#79](https://github.com/horae-dev/horae/pull/79) |
| #15 agent workflow | XS · Docs/CI | 0.3 h | 1.0 h | **12 min** | 13 (1 blocker) | merged, [#80](https://github.com/horae-dev/horae/pull/80) |
| #13 JSON Schemas | M · Core contract | 3.7 h | 7.7 h | **32 min** | 20 (8 major) | merged, [#81](https://github.com/horae-dev/horae/pull/81) |
| #12 ADRs | M · Design | 4.2 h | 7.5 h | **11 min** | 25 (8 major) | accepted by me, [#82](https://github.com/horae-dev/horae/pull/82) |
| #20 intent validation | M · Core contract | 3.7 h | 7.7 h | **20 min** | 13 (4 medium) | merged, [#87](https://github.com/horae-dev/horae/pull/87) |
| **Total** | | **13.7 h** | **27.9 h** | **89 min** | **97** | 6 done, 0 takeovers |

"Measured agent time" is the sum of the three agents' run times (build, review, fix) as reported on each issue. It doesn't include waiting for CI, which added a few minutes per story. The first five ran on one evening, from the first message at 21:03 to the last PR ready at 22:22.

Three things stand out:

1. **Agent time was off by about 9×.** 89 minutes where the model expected almost 14 hours. That's the part that matters least, because agent time was never the bottleneck.
2. **No takeovers.** The model expected the M stories to fail their first pass most of the time (30–50% success) and to fall back on me. They didn't fall back on me: the reviewer found the problems and the fixer fixed them. A failed first pass became a cheap internal iteration, not a human rescue.
3. **My supervision didn't disappear, it moved.** The estimate put about 28 hours of supervision on these six stories, mostly reviewing diffs. I reviewed no diff. My time went *upstream* (the planning sessions and validating 130 tickets, a few evenings) and *sideways* (answering design questions, confirming 21 provisional decisions, accepting six ADRs).

### Why the model was wrong

The model wasn't sloppy. It was **built on 2025 numbers, and it put the human in the wrong place**.

- **The evidence aged fast.** METR's own update puts the doubling time of the task length frontier models can handle at [about 89 days for models since 2024](https://metr.org/blog/2026-1-29-time-horizon-1-1/), and Anthropic describes it as ["doubling roughly every four months, up from an earlier trend of doubling every seven months"](https://www.anthropic.com/institute/recursive-self-improvement). An estimate built in October from studies of early 2025 is calibrated on models two or three doublings old.
- **It assumed humans review every attempt.** In this workflow an independent agent reviews, and I review decisions. That's also where large teams are going: Anthropic writes that ["human code review has become a new bottleneck"](https://www.anthropic.com/institute/recursive-self-improvement), with more than 80% of its merged code now authored by Claude. Microsoft's .NET team, after ten months with the Copilot coding agent, also [names review as the bottleneck](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/).
- **"First-pass success" was the wrong unit.** It measures whether the first diff is mergeable. With a reviewer and a fixer in the loop, what counts is whether the *loop* converges without a human. Six out of six did.

### What the model still gets right

I don't want to swap one wrong number for another, so here are the honest limits:

- **These were the easiest stories.** Foundations: scaffolding, CI, schemas, docs. The model itself says agents are almost free on Docs/CI work. The hard part (security, the plugin sandbox, unofficial external APIs) is marked Human-led and hasn't started.
- **Six stories is a tiny sample**, and nothing is in production yet. "Merged with green CI after an independent review" is not "correct".
- **Defects don't vanish.** Studies still find more issues in AI-written PRs ([1.7× more major issues for CodeRabbit](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report), [44% of tasks with a risky vulnerability for Veracode](https://www.veracode.com/wp-content/uploads/2026-GenAI-Report-Infographic.pdf), more instability for DORA). My 97 findings say the same thing: the first draft is often wrong. What changed is who catches it.
- **Upstream time is real.** Writing and validating 130 good tickets took me longer than the agents took to deliver six of them. The .NET team saw the same thing: their agent's success rate went from 38% to 69% after better instructions, and they concluded that ["preparation matters more than the model"](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/).

So the estimate was right that **I am the bottleneck**. It was wrong about *what kind* of work I'd be doing. It priced me as a code reviewer. I'm working as a product owner and an architect who answers questions.

## 8. Pizza team or sandwich team?

The estimate compared "one human + agents" with "three developers". I think the more interesting comparison is about team shape.

Amazon's **two-pizza team** (small enough to be fed by two pizzas, so six to ten people) was designed to limit coordination. Even so, eight people have **28 communication channels** between them (n(n−1)/2). Matt Ström-Awn writes that the idea [has morphed into "two sandwich teams"](https://mattstromawn.com/writing/high-agency-strategy/), "the same principle, but with a team size of two". In July, [Business Insider collected the same signal from tech leaders](https://finance.yahoo.com/technology/ai/articles/2-pizza-days-over-heres-095501046.html): Cursor's field CTO saying "two pizzas are too much pizza", Coinbase's CEO talking about "one person teams".

A board like this one is a **hub**, not a mesh. One human talks to a lead agent, the lead talks to the workers, and the workers never talk to each other. With four agents that's four channels, not 28. That's not a detail: research on agent cooperation finds that agents coordinating with each other [do markedly worse than a single agent](https://www.mintlify.com/cooperbench/CooperBench/results/findings), so the hub is the right shape for the agents too.

What I take from it:

- **The unit of throughput is now decisions per day, not lines of code per day.** One person's decision bandwidth is the cap. My 15 hours a week is the real constraint, as the model said, just spent differently.
- **A sandwich team of two is probably the sweet spot.** Two people double the decision bandwidth for one extra channel. On Horae the obvious split is product and architecture on one side, security and the Human-led stories on the other.
- **A pizza team becomes several sandwich teams**, each owning an epic or a repository with its own board, rather than eight people on one backlog. The coordination that remains is between boards, and it can be explicit: "blocked by" links, contracts in `schemas/`, ADRs.
- **Pizza teams still win** where the work is irreducibly human and parallel: security reviews, on-call, domain knowledge, talking to users, and the bus factor. A sandwich team with agents has a bus factor of one or two.

The Microsoft field study of Claude Code and Copilot CLI found adopters [merging about 24% more PRs](https://arxiv.org/abs/2607.01418) in an organisation that kept its existing team shape. That's a real gain, but nothing like what you see when the process is rebuilt around the agents. I suspect most of the difference is team shape and process, not the model.

## 9. Set it up yourself

If you want to try this on your own project, this is the minimum that made it work:

1. **Write the backlog with the agent, validate it yourself.** Acceptance criteria on every story. This is the human work that pays for everything else.
2. **Add an Executor field** (Agent, Agent + human check, Human-led, Human-only) and an **Agent-ready view**. Agents need to know what to skip.
3. **Describe the columns.** "Ready = spec complete", "Human needed = blocked on the maintainer". The descriptions are the protocol.
4. **Put an estimate and an empty Actuals section in every story.** Ask the agent to fill in Actuals at the end. After 15 stories you'll have your own calibration instead of someone else's study.
5. **Separate the roles**: builder, independent reviewer, fixer. The one who writes never approves.
6. **Make CI the gate**: one aggregate "CI OK" check, and merge only on green.
7. **Agree on the human-needed protocol**: numbered questions in the PR, answers on the PR, card back to Ready.
8. **Give one instruction**: follow the board, in order, assign before starting, merge on green, post the Actuals.

What I haven't done yet, and should: branch protection that *requires* "CI OK" (today it's only a convention), [Graft](/six-weeks-in-one-night-building-a-product-in-the-agentic-era/) on the organisation to record which agent and model wrote each PR, and measuring the token cost per story.

## 10. Close

The estimate said I'd be the bottleneck, and I am. But the hours I spend aren't in diffs. They're in the tickets before any code exists, and in the questions the agents can't, and shouldn't, answer. Everything between those two moments now takes minutes.

Write the tickets well. Let the board drive. Keep the decisions human.

## Links

- 🗂️ [Horae Roadmap](https://github.com/orgs/horae-dev/projects/1): the public board, with all its views
- 📦 [horae-dev/horae](https://github.com/horae-dev/horae): the code, `docs/ESTIMATION.md` and `docs/ROADMAP.md`
- 🎬 [The video, full page](/videos/human-agents-board/?lang=en), made with [canvas-video-skill](https://github.com/mmornati/canvas-video-skill)
- 📖 [Six weeks in one night](/six-weeks-in-one-night-building-a-product-in-the-agentic-era/): the previous experiment, with Graft

**Sources:** [METR, Time Horizon 1.1](https://metr.org/blog/2026-1-29-time-horizon-1-1/) (Jan 2026) · [METR, uplift update](https://metr.org/blog/2026-02-24-uplift-update/) (Feb 2026) · [Anthropic, When AI builds itself](https://www.anthropic.com/institute/recursive-self-improvement) (updated Sep 2026) · [Murphy-Hill, Butler and Savelieva, CLI coding agents at Microsoft](https://arxiv.org/abs/2607.01418) (Jul 2026) · [.NET team, ten months with the Copilot coding agent](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/) (Mar 2026) · [CodeRabbit, AI vs human code](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report) (Dec 2025) · [Veracode 2026 GenAI report](https://www.veracode.com/wp-content/uploads/2026-GenAI-Report-Infographic.pdf) · [Matt Ström-Awn, High-agency strategy](https://mattstromawn.com/writing/high-agency-strategy/) · [Business Insider, the two-pizza days are over](https://finance.yahoo.com/technology/ai/articles/2-pizza-days-over-heres-095501046.html) (Jul 2026) · [CooperBench findings](https://www.mintlify.com/cooperbench/CooperBench/results/findings)
