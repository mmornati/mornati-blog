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
- sdlc
- estimation
- productivity
- team-topology
date: '2026-10-31T17:00:00.000000+00:00'
draft: false
slug: one-human-a-board-and-a-team-of-agents
translationKey: human-agents-board
cover: cover.jpg
showHero: true
description: 'An experiment in reshaping the development life cycle around a GitHub Project board that one human and a team of AI agents share. Tickets written with Claude and validated by me, a single "follow the board" instruction, three agents per story (build, independent review, fix), and a simple protocol for when a human is needed. The estimate said one human plus agents would be slower than three developers. After 36 stories, the first three milestones, planned for 23 weeks, were merged in less than two days. What the numbers say, what happens when the usage quota stops everything, and how a second project, Angelia, changes the setup.'
summary: 'The estimate said one human with four agents would need 76 weeks where three developers need 22. After 36 stories, agent work took about a third of the estimated time, nobody took over, and the first three milestones, planned for 23 weeks, were merged in less than two days. The bottleneck is still the human, but not where the model put it. Plus: what quota stops teach you, and a second board, Angelia.'
projects:
- horae
- angelia
---

For a few weeks I've been testing how far the software development life cycle can change when humans and agents work **on the same board**. Not "an AI that writes code for me", but a shared workspace: the backlog, the columns, the pull requests and the decisions all live in a GitHub Project, and humans and agents both read and update it.

The first real test is **Horae**, a personal project I'm building mostly with agents. Before writing any code I asked Claude to estimate it two ways: in **human days**, if a team of developers built it, and in **AI days**, if a team of agents built it with me supervising. The answer was clear and a bit deflating: **one human plus four agents would be slower than three developers**. 76 weeks against 22, because my supervision would be the bottleneck.

I wasn't convinced. So I set up the project so that the board itself would tell me: every story carries its estimate, and every story gets its actual numbers posted when it's done. Then I gave the agents one instruction: *follow the board*.

This post covers how that works day to day (the board, the agents, the moments where I'm needed), what 36 finished stories say against the estimate, what happens when the usage quota stops everything halfway, how a second project, **Angelia**, changes the setup, and what changes when your "team" is one person and some agents instead of a two-pizza team.

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

![The Horae board on 31 October: 69 items in Backlog, 1 in Ready, 10 in progress, 1 waiting for the human and 40 done, including the first three milestone epics at 100%](/images/one-human-a-board-and-a-team-of-agents/board.webp)

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
2. **Build**: a subagent implements it on a `story/<n>-<slug>` branch. The lead picks the model by complexity: Sonnet for the scaffold, the CI and the agent workflow; Opus for the JSON Schemas, the intent validation, the ADRs and anything touching security.
3. **Review**: a separate agent reviews it against the acceptance criteria, `PLAN.md` and the stories that depend on it. It doesn't edit; it reproduces problems in a scratch clone and writes findings. Security stories get a security-focused reviewer.
4. **Fix**: a third agent fixes *every* finding.
5. Open the PR referencing the issue, **wait for CI to be green**, merge.
6. Post the **Actuals** on the issue and move the card to **Done**.

![Story #13 in the issue timeline: moved to Ready, self-assigned, moved to In progress, closed by the merged PR, then the Actuals comment: 1 implementation, 1 review with 20 findings (8 major), 1 fix pass, about 32 minutes of agent time, no human takeover](/images/one-human-a-board-and-a-team-of-agents/issue-actuals.webp)

Cards whose Executor is **Human-led** are skipped until I've made the decisions. When independent stories are Ready, the lead starts them **in parallel**, each in its own git worktree: three or four at a time is normal.

After the first evening, my instructions became even shorter, and always **one milestone at a time**: *"Start M2"*, then *"Can you proceed with the next user stories ready to dev?"*. I never asked for the whole backlog in one go. That turned out to matter (section 8).

### What the reviewers caught

This is the part that convinced me the loop works. The implementer always said "all checks pass". The reviewer always found something real, and often something serious. Over 36 stories the Actuals list **more than 360 review findings**, all fixed before merge. A few of them:

- **#15 agent workflow**: the commit hook used whatever `python3` was first on the PATH. On macOS's default Python 3.9 it crashed and **blocked every commit**, including mine.
- **#13 schemas** (20 findings, 8 major): a note path could escape the Obsidian vault into `.obsidian/plugins` (code execution on my laptop), `notify.push` accepted `javascript:` links, and the lockfile accepted `ext::` git URLs.
- **#18 SQLite store**: foreign keys were enabled before migrations, so a future table rebuild would have silently deleted every journal entry. The reviewer reproduced the data loss.
- **#19 run lifecycle**: liveness was judged by hostname plus process ID, which breaks inside containers. The fix became a kernel file lock per pipeline.
- **#32 cache**: after I undid a run, the next unchanged run would have re-applied the same intents from the cache, for free, for up to 7 days, including intents that came from a prompt injection.
- **#30 local backends**: a 305 KB gzip response expanded to 300 MiB and was accepted.

And one the reviewers couldn't catch: the claude-cli backend (#29) passed every mocked test, but the first live run with my real token failed four tests. The real CLI wraps JSON in code fences, thinks before answering, and silently retries truncated answers up to three times, so a call capped at 64 tokens billed 256. Mocks agree with your assumptions; reality doesn't.

## 5. When a human is needed

Some stories are mine by design: the threat model, the plugin host, anything where a wrong default is a security hole. For those, the agent doesn't guess. It writes a **design note** as a draft PR, with numbered questions and a recommendation for each, and the card moves to **Human needed**.

The protocol is two steps:

1. **Answer on the PR**, keeping the question numbers. Short answers are fine; "all as proposed" is fine too.
2. **Move the card back to Ready.** That's the signal. The next time an agent picks it up, it reads my comments, turns the note into the real deliverable, and runs the usual build → review → fix → merge loop.

![Pull request #85, the plugin-host design note: ten numbered questions for the maintainer, and below them my answers, one line each](/images/one-human-a-board-and-a-team-of-agents/pr-questions-answers.webp)

Ten questions, ten one-line answers, a card dragged back to Ready. That's the whole interface. So far I did it six times: the plugin host, the claude-cli backend, de-identification, the action guard, secret redaction and the signed action links. My longest answer is ten lines.

The same pattern shows up for smaller decisions. When `PLAN.md` was ambiguous, the agents **chose the tightest option** (relaxing a rule later breaks nothing, tightening one does), recorded it as provisional, and listed it for me: by the end of M3 there were more than 50 numbered decisions in `schemas/README.md`. The ADRs and the skill format ("Agent + human check") stayed unmerged until I wrote "Accept and merge".

The agents also told me plainly what they *couldn't* do: install a private GitHub App on the organisation, make the container image public, turn on the "Template repository" setting, or run the live test with my token. Those are mine, and they're listed in every report.

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

So most of the 1,134 hours were me, reviewing diffs and rescuing agents. And the roadmap built on it put the first three milestones (foundations, the walking skeleton, the LLM step) at **23 weeks**, from 2 November 2026 to 12 April 2027.

## 7. What the board says after 36 stories

The first version of this post had six stories. Two days later the board had 36, so here is the fuller picture. "Measured agent time" is the sum of the three agents' run times (build, review, fix) as posted on each issue; it doesn't include waiting for CI.

| Milestone | Stories | Estimated agent time | **Measured agent time** | Estimated supervision | Planned calendar | **Actual calendar** |
|---|---|---|---|---|---|---|
| M0 Foundations | 6 | 14.3 h | **1.1 h**¹ | 36 h | 4.4 weeks | first evening + one review |
| M1 Walking skeleton | 11 | 36.6 h | **9.4 h** | 88 h | 9.0 weeks | **one day** (28 Oct, 08:48 → 15:18) |
| M2 LLM step | 12² | 36.7 h | **17.9 h** | 101 h | 9.8 weeks | **18 hours** (28 Oct 15:32 → 29 Oct 09:22) |
| M3 Dogfood (in progress) | 7 so far | 15.8 h | **5.8 h** | 28 h | 18.4 weeks | one evening so far |
| **Total** | **36** | **103 h** | **34 h** | **252 h** | | **0 takeovers** |

¹ The threat model (#14) was reviewed by me and isn't timed. ² Includes #113, the live-test fix that wasn't in the original backlog, and #29, whose 3 h 40 min include waiting for parallel merges.

M0 to M2 were planned for **23 weeks of calendar** and were done **in less than two days**, before the planned start date. Even the three-developer team in the estimate would have needed about 7 weeks for them.

Three things stand out:

1. **Agent time was about 3× lower than estimated, not 9×.** The first six stories suggested 9×, but they were the easy ones. Later stories had security reviewers, second review rounds and merges between parallel branches: an M story averaged **65 minutes** against 3.6 hours estimated, an S story **48 minutes** against 1.1 hours (close to the estimate), and the Human-led security stories took about half their estimated agent time. Agent time was never the bottleneck anyway.
2. **No takeovers, in 36 stories.** The model expected M stories to fail their first pass most of the time and to fall back on me. They didn't fall back on me: the reviewer found the problems and the fixer fixed them. A failed first pass became a cheap internal iteration, not a human rescue.
3. **My supervision didn't disappear, it moved.** The estimate put **252 hours** of supervision on these 36 stories, mostly reviewing diffs. I reviewed no diff. What I actually did in those two days: about a dozen chat messages, answers on six design notes, one threat model review, two "Accept and merge", and one live test with my token. I didn't time it, but it fit around a normal working day. The rest of my time went *upstream*, into the planning sessions and validating 130 tickets.

### Why the model was wrong

The model wasn't sloppy. It was **built on 2025 numbers, and it put the human in the wrong place**.

- **The evidence aged fast.** METR's own update puts the doubling time of the task length frontier models can handle at [about 89 days for models since 2024](https://metr.org/blog/2026-1-29-time-horizon-1-1/), and Anthropic describes it as ["doubling roughly every four months, up from an earlier trend of doubling every seven months"](https://www.anthropic.com/institute/recursive-self-improvement). An estimate built in October from studies of early 2025 is calibrated on models two or three doublings old.
- **It assumed humans review every attempt.** In this workflow an independent agent reviews, and I review decisions. That's also where large teams are going: Anthropic writes that ["human code review has become a new bottleneck"](https://www.anthropic.com/institute/recursive-self-improvement), with more than 80% of its merged code now authored by Claude. Microsoft's .NET team, after ten months with the Copilot coding agent, also [names review as the bottleneck](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/).
- **"First-pass success" was the wrong unit.** It measures whether the first diff is mergeable. With a reviewer and a fixer in the loop, what counts is whether the *loop* converges without a human. 36 out of 36 did.

### What the model still gets right

I don't want to swap one wrong number for another, so here are the honest limits:

- **Nothing is in production yet.** "Merged with green CI after an independent review" is not "correct". M3 is the dogfood milestone, and it's the first time Horae will run on my real notes. The action guard (#35) still needs a manual red-team pass that the automated review couldn't do.
- **The hardest parts haven't started.** Plugin isolation, the marketplace and unofficial external APIs are later milestones.
- **Defects don't vanish.** Studies still find more issues in AI-written PRs ([1.7× more major issues for CodeRabbit](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report), [44% of tasks with a risky vulnerability for Veracode](https://www.veracode.com/wp-content/uploads/2026-GenAI-Report-Infographic.pdf), more instability for DORA). My 360 findings say the same thing: the first draft is often wrong. What changed is who catches it.
- **Upstream time is real.** Writing and validating 130 good tickets took me longer than the agents took to deliver three milestones. The .NET team saw the same thing: their agent's success rate went from 38% to 69% after better instructions, and they concluded that ["preparation matters more than the model"](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/).

So the estimate was right that **I am the bottleneck**. It was wrong about *what kind* of work I'd be doing. It priced me as a code reviewer. I'm working as a product owner and an architect who answers questions.

## 8. Stops are part of the workflow

Here is something no estimate mentions: the work **stops**. Not because something breaks, but because the human isn't there, or because the usage quota runs out. Horae isn't finished, and right now it isn't moving: my weekly quota is almost used up.

This is the Horae timeline so far (Paris time):

| Pause | Why | What restarted it |
|---|---|---|
| 27 Oct 23:22 → 28 Oct 07:58 | night; the ADRs were waiting for my acceptance | *"Accept and merge"* |
| 28 Oct 22:12 → 22:50 | usage limit reached | *"continue"* |
| 29 Oct 01:25 → 08:15 | M2 done except one story waiting for my live test | *"Merge #29 without it"*, then the live run |
| 29 Oct 09:22 → 18:24 | my working day; nothing left in Ready | *"Can you proceed with the next user stories ready to dev?"* |
| 29 Oct 22:16 → now | session limit, then the weekly quota | not yet |

In about 48 hours of calendar, agents were actually running for roughly 23. The rest was waiting for me, or waiting for the quota.

What I learned from the stops:

- **The board is the save file.** When everything stops, nothing is lost: each card says where it is, each PR holds its questions, each finished story has its Actuals. The next session, or the next person, starts by reading the board, not a chat history.
- **Asking one milestone at a time is what makes stops cheap.** Because I asked for M1, then M2, then "the next stories", each stop happened between batches or inside a small one. If I had asked for the whole backlog, the quota would have cut a much bigger batch in the middle.
- **A stop in the middle of a story costs something.** At the last limit, four plugin stories were In progress: one had a PR, the others only a branch or a worktree. When the first usage limit hit, the lead stopped its two running agents on purpose instead of burning the last of the allowance, and wrote down where each one stood (branch, worktree path, what was left). That note is what makes a restart possible. I'd now make it a rule: **before stopping, every In progress card gets a checkpoint comment.**
- **The human protocol works across stops, but only if the lead re-reads the board.** On 29 October I answered the ten questions on the signed-action-links note at 19:18 and moved #38 back to Ready. Three hours later the lead's report still listed #38 as "waiting for your answers": it was working from its own notes, not from the board. The card is still in Ready today. The fix is simple: re-read the board between stories, not only at the start.
- **The quota behaves like a WIP limit.** It caps how much work can be in flight, and like any WIP limit it rewards small batches and finishing before starting.

So the real loop isn't "agents run forever". It's **agents run a batch, the human decides and restarts**. The human is also the scheduler.

## 9. A second board: Angelia

On 30 October I started a second project, [**Angelia**](https://github.com/angelia-dev/angelia): a self-hosted release event bus that watches PyPI, npm, crates.io, GitHub releases and OCI registries, and delivers one signed CloudEvent per new version to CI, chat and AI agents. Written in Go this time.

I asked Claude to copy what we did on horae-dev and to build "a full board agent + human development oriented to work together", where **agents decide when a human is needed**, and where the **model is chosen from the complexity**. In about 45 minutes it set up five repositories and **129 issues** on the [Angelia Roadmap](https://github.com/orgs/angelia-dev/projects/1).

![The Angelia board: 87 items in Backlog, 6 in Ready, 1 in progress and 1 in review. Every card shows its executor, its model and its size, and the first cards are human-only tasks](/images/one-human-a-board-and-a-team-of-agents/angelia-board.webp)

It's similar, but not the same. Here is what changed, mostly from what Horae taught me:

| | Horae | Angelia |
|---|---|---|
| Repositories | 15 | 5 |
| Issues | 130 | 129 |
| **Model choice** | the lead picks per story | a **Complexity** field drives a **Model** field on every card: Low → Haiku, Medium → Sonnet, High and Very high → Opus; I can override it |
| **When to ask a human** | the Executor field, plus the agent's judgement | explicit triggers in `AGENTS.md`: a public contract, a security choice, a new dependency, an ambiguous spec, or the same CI check failing three times |
| **Escalation** | none written down | three CI failures or twice the estimated time → retry once with the next model up → then a human |
| **Spec depth** | every story detailed up front | Phases 0 and 1 detailed (`agent-ready`); Phases 2 and 3 are **27 outlines** (`needs-spec`), detailed just before they start |
| **First phase** | foundations | a **spike** with six benchmarks and a human go/no-go on the language and plugin choices |
| **Review** | Graft postponed | installing Graft is one of the first cards |
| **Views** | 6 | 8, adding a **Human needed** board and a **Model planner** |

![The "Model planner" view: open stories with their status, suggested model, phase, complexity, size, executor and agent hours](/images/one-human-a-board-and-a-team-of-agents/angelia-model-planner.webp)

Two of these changes answer problems I had on Horae:

- **Just-in-time specs.** On Horae I validated 130 detailed tickets before any code. That was the most expensive human step, and the later tickets will be outdated by the time agents reach them. On Angelia only the next two phases are detailed; the rest waits until the spike has answered the big questions.
- **The model is on the card.** On Horae the lead chose the model as it went, which worked, but it was invisible. On Angelia the choice is visible, reviewable and overridable before the run, and the Actuals will say whether Haiku was enough for the "Low" stories.

Nothing is merged on Angelia yet, and look at what's at the front of the board: **human-only tasks**. Install the review app, set up agent runtime and spend limits, reserve the names, prepare the benchmark environment. The human goes first.

Angelia's estimate still uses the same rubric as Horae (an M story = 3.5 agent hours), for **220 human days, 294 agent hours and 431 supervision hours**. Its Phase 0 will be a second test of the same model, on a different language and a different kind of project.

## 10. Pizza team or sandwich team?

The estimate compared "one human + agents" with "three developers". I think the more interesting comparison is about team shape.

Amazon's **two-pizza team** (small enough to be fed by two pizzas, so six to ten people) was designed to limit coordination. Even so, eight people have **28 communication channels** between them (n(n−1)/2). Matt Ström-Awn writes that the idea [has morphed into "two sandwich teams"](https://mattstromawn.com/writing/high-agency-strategy/), "the same principle, but with a team size of two". In July, [Business Insider collected the same signal from tech leaders](https://finance.yahoo.com/technology/ai/articles/2-pizza-days-over-heres-095501046.html): Cursor's field CTO saying "two pizzas are too much pizza", Coinbase's CEO talking about "one person teams".

A board like this one is a **hub**, not a mesh. One human talks to a lead agent, the lead talks to the workers, and the workers never talk to each other. With four agents that's four channels, not 28. That's not a detail: research on agent cooperation finds that agents coordinating with each other [do markedly worse than a single agent](https://www.mintlify.com/cooperbench/CooperBench/results/findings), so the hub is the right shape for the agents too.

What I take from it:

- **The unit of throughput is now decisions per day, not lines of code per day.** One person's decision bandwidth is the cap. My 15 hours a week is the real constraint, as the model said, just spent differently. And now there's a second cap: the usage quota.
- **A sandwich team of two is probably the sweet spot.** Two people double the decision bandwidth for one extra channel, and the board keeps moving when one of them is busy. On Horae the obvious split is product and architecture on one side, security and the Human-led stories on the other.
- **A pizza team becomes several sandwich teams**, each owning a product or a repository with its own board, rather than eight people on one backlog. That's literally what I'm doing with Horae and Angelia: two boards, one human, each with its own agents. The coordination that remains is between boards, and it can be explicit: "blocked by" links, contracts in `schemas/`, ADRs.
- **Pizza teams still win** where the work is irreducibly human and parallel: security reviews, on-call, domain knowledge, talking to users, and the bus factor. A sandwich team with agents has a bus factor of one or two.

The Microsoft field study of Claude Code and Copilot CLI found adopters [merging about 24% more PRs](https://arxiv.org/abs/2607.01418) in an organisation that kept its existing team shape. That's a real gain, but nothing like what you see when the process is rebuilt around the agents. I suspect most of the difference is team shape and process, not the model.

## 11. Set it up yourself

If you want to try this on your own project, this is the minimum that made it work, with what Angelia added:

1. **Write the backlog with the agent, validate it yourself.** Acceptance criteria on every story. But detail only the next phase or two; keep the rest as outlines.
2. **Add an Executor field** (Agent, Agent + human check, Human-led, Human-only) and an **Agent-ready view**. Agents need to know what to skip.
3. **Put the model on the card**: a Complexity field and a suggested Model you can override.
4. **Describe the columns.** "Ready = spec complete", "Human needed = blocked on the maintainer". The descriptions are the protocol.
5. **Write down when an agent must stop and ask**: public contracts, security choices, new dependencies, ambiguous specs, repeated CI failures.
6. **Put an estimate and an empty Actuals section in every story.** Ask the agent to fill in Actuals at the end. After 15 stories you'll have your own calibration instead of someone else's study.
7. **Separate the roles**: builder, independent reviewer, fixer. The one who writes never approves.
8. **Make CI the gate**: one aggregate "CI OK" check, and merge only on green.
9. **Agree on the human-needed protocol**: numbered questions in the PR, answers on the PR, card back to Ready. And make the lead **re-read the board between stories**.
10. **Ask one milestone at a time**, and make every In progress card carry a checkpoint before a stop.

What I haven't done yet, and should: branch protection that *requires* "CI OK" (today it's only a convention), [Graft](/six-weeks-in-one-night-building-a-product-in-the-agentic-era/) on Horae to record which agent and model wrote each PR, and measuring the token cost per story, now that the quota has shown it's a real constraint.

## 12. Close

The estimate said I'd be the bottleneck, and I am. But the hours I spend aren't in diffs. They're in the tickets before any code exists, in the questions the agents can't, and shouldn't, answer, and in deciding when to press "continue". Everything between those moments now takes minutes, or a few hours for a whole milestone.

Write the tickets well. Let the board drive. Keep the decisions human.

## Links

- 🗂️ [Horae Roadmap](https://github.com/orgs/horae-dev/projects/1): the public board, with all its views
- 📦 [horae-dev/horae](https://github.com/horae-dev/horae): the code, `docs/ESTIMATION.md` and `docs/ROADMAP.md`
- 🗂️ [Angelia Roadmap](https://github.com/orgs/angelia-dev/projects/1) and [angelia-dev/angelia](https://github.com/angelia-dev/angelia): the second board, with `docs/ESTIMATION.md` and `AGENTS.md`
- 🎬 [The video, full page](/videos/human-agents-board/?lang=en), made with [canvas-video-skill](https://github.com/mmornati/canvas-video-skill)
- 📖 [Six weeks in one night](/six-weeks-in-one-night-building-a-product-in-the-agentic-era/): the previous experiment, with Graft

**Sources:** [METR, Time Horizon 1.1](https://metr.org/blog/2026-1-29-time-horizon-1-1/) (Jan 2026) · [METR, uplift update](https://metr.org/blog/2026-02-24-uplift-update/) (Feb 2026) · [Anthropic, When AI builds itself](https://www.anthropic.com/institute/recursive-self-improvement) (updated Sep 2026) · [Murphy-Hill, Butler and Savelieva, CLI coding agents at Microsoft](https://arxiv.org/abs/2607.01418) (Jul 2026) · [.NET team, ten months with the Copilot coding agent](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/) (Mar 2026) · [CodeRabbit, AI vs human code](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report) (Dec 2025) · [Veracode 2026 GenAI report](https://www.veracode.com/wp-content/uploads/2026-GenAI-Report-Infographic.pdf) · [Matt Ström-Awn, High-agency strategy](https://mattstromawn.com/writing/high-agency-strategy/) · [Business Insider, the two-pizza days are over](https://finance.yahoo.com/technology/ai/articles/2-pizza-days-over-heres-095501046.html) (Jul 2026) · [CooperBench findings](https://www.mintlify.com/cooperbench/CooperBench/results/findings)
