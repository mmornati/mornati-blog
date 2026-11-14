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
date: '2026-11-14T17:00:00.000000+00:00'
draft: false
slug: one-human-a-board-and-a-team-of-agents
translationKey: human-agents-board
cover: cover.jpg
showHero: true
description: 'An experiment in reshaping the development life cycle around a GitHub Project board that one human and a team of AI agents share, run on two real projects. Tickets written with Claude and validated by me, a single "follow the board" instruction, build, review and fix agents, and a simple protocol for when a human is needed. The estimate said one human plus agents would need 76 weeks for Horae. All the work agents could do was finished in 15 days, with zero human takeovers in 123 recorded stories. What the numbers say on both projects, what the usage quota and the token bill changed, and why the last mile, a real deployment, was still mostly human.'
summary: 'The estimate said one human with four agents would need 76 weeks to build Horae, where three developers need 22. All the work agents could do was finished in 15 days. On both projects agents needed a third to a sixth of the estimated time, and nobody took over in 123 recorded stories. The bottleneck is still the human, but not where the model put it: in the tickets, the decisions, the quota and the first real deployment.'
projects:
- horae
- angelia
---

For a few weeks I've been testing how far the software development life cycle can change when humans and agents work **on the same board**. Not "an AI that writes code for me", but a shared workspace: the backlog, the columns, the pull requests and the decisions all live in a GitHub Project, and humans and agents both read and update it.

I ran the experiment on two real projects. **Horae**, a self-hosted personal agent, was the first. Before writing any code I asked Claude to estimate it two ways: in **human days**, if a team of developers built it, and in **AI days**, if a team of agents built it with me supervising. The answer was clear and a bit deflating: **one human plus four agents would be slower than three developers**. 76 weeks against 22, because my supervision would be the bottleneck. **Angelia**, a release event bus written in Go, came a few days later, with a board set up from what Horae had taught me.

I wasn't convinced by the estimate. So I set up both projects so that the board itself would tell me: every story carries its estimate, and every story gets its actual numbers posted when it's done. Then I gave the agents one instruction: *follow the board*.

Two and a half weeks later, all the Horae work an agent could do is merged, Horae runs on my home server and has already sent a reminder to my phone, and Angelia has published its first release. This post covers how that works day to day, what the numbers say against the estimate, what the usage quota and the token bill changed, and why the last mile was still mostly human.

## 0. The result first

Here is the whole loop in about 100 seconds. Like [my previous videos](/canvas-videos-with-voice-over-in-javascript/), it isn't a video file: every frame is drawn in JavaScript, over a synthetic voice-over.

<div style="container-type:inline-size;margin:1.5rem 0">
<iframe src="/videos/human-agents-board/?embed=1&lang=en" title="One human, a board, a team of agents" loading="lazy" allow="fullscreen; autoplay" allowfullscreen style="display:block;width:100%;height:calc(56.25cqw + 40px);border:0;border-radius:8px;background:#f7f9fc"></iframe>
</div>

*Press Play (sound on). Switch the language in the control bar or turn on the subtitles. [Open it full page](/videos/human-agents-board/?lang=en) to get the chapter list.*

## 1. Two projects

[**Horae**](https://github.com/horae-dev/horae) is a predictable, self-hosted personal agent: fixed pipelines instead of an agent loop, at most one bounded LLM step, plugins with declared permissions installed from git. Morning brief, reminders, integrations with my notes, my calendars and my mail. A real product with real constraints: untrusted input, secrets, plugins I didn't write. Python, 15 repositories.

[**Angelia**](https://github.com/angelia-dev/angelia) is a self-hosted release event bus: it watches PyPI, npm, crates.io, GitHub releases and OCI registries, and delivers one signed CloudEvent per new version to CI, chat and AI agents. Go, 5 repositories.

I built both **mostly with agents from day one**, with me as a part-time maintainer: evenings, a few mornings and weekends.

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

![The "Backlog by milestone" view at the start: each epic with its milestone, target date, human days, agent hours and supervision hours](/images/one-human-a-board-and-a-team-of-agents/estimates-by-epic.webp)

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

![The Horae board on 13 November: 150 items done, 1 in progress, 3 waiting for the human, and a Backlog that holds only human tasks: the Graft app, security settings, provider keys, server resources, phone tests, publishing setup and the v0.1 release](/images/one-human-a-board-and-a-team-of-agents/board.webp)

Around it there are five more views: **Roadmap**, **Backlog by milestone** (with the estimates), **Agent-ready** (filter `label:agent-ready status:Ready`: what an agent can pick up now), **Human work** (Human-led and Human-only items, the real bottleneck) and **Burning points** (the risks).

![The "Human work" view at the start: every Human-led and Human-only item with its supervision hours, from 8 to 28 hours each](/images/one-human-a-board-and-a-team-of-agents/human-work.webp)

Look at the Backlog column in the board above: what's left on Horae is exactly the work only I can do.

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

Cards whose Executor is **Human-led** are skipped until I've made the decisions. When independent stories are Ready, the lead starts them **in parallel**, each in its own git worktree.

After the first evening, my instructions became even shorter, and always **one milestone at a time**: *"Start M2"*, *"Can you proceed with the next user stories ready to dev?"*, *"continue"*. Eleven days later, the last one was *"yes go to complete the full project with the remaining tasks"*. I never asked for the whole backlog in one go. That turned out to matter (section 8).

The board also grew on its own. The agents opened **43 new issues** on Horae and 34 on Angelia: follow-ups from reviews, stories split in two, core gaps found while building plugins. They went through the same loop.

### What the reviewers caught

This is the part that convinced me the loop works. The implementer always said "all checks pass". The reviewer almost always found something real, and often something serious. In the first 36 Horae stories alone, the Actuals list **more than 360 review findings**, all fixed before merge. A few of them:

- **#15 agent workflow**: the commit hook used whatever `python3` was first on the PATH. On macOS's default Python 3.9 it crashed and **blocked every commit**, including mine.
- **#13 schemas** (20 findings, 8 major): a note path could escape the Obsidian vault into `.obsidian/plugins` (code execution on my laptop), `notify.push` accepted `javascript:` links, and the lockfile accepted `ext::` git URLs.
- **#18 SQLite store**: foreign keys were enabled before migrations, so a future table rebuild would have silently deleted every journal entry. The reviewer reproduced the data loss.
- **#32 cache**: after I undid a run, the next unchanged run would have re-applied the same intents from the cache, for free, for up to 7 days, including intents that came from a prompt injection.
- **#191 third-party installs**: a third-party plugin could plant a poisoned package in the download cache shared with first-party installs, which a later build would run on my machine, without the plugin ever running. The reviewer reproduced the attack end to end.
- **#52 malicious-plugin suite**: none of the 41 attacks got through. Then a reviewer switched off 24 protections one at a time to check that the matching test failed. Five tests still passed with their protection removed, so for those guarantees the suite was giving false assurance. Fixed before merge.

And one the reviewers couldn't catch: the claude-cli backend (#29) passed every mocked test, but the first live run with my real token failed four tests. The real CLI wraps JSON in code fences, thinks before answering, and silently retries truncated answers up to three times, so a call capped at 64 tokens billed 256. Mocks agree with your assumptions; reality doesn't. Section 10 has many more of those.

## 5. When a human is needed

Some stories are mine by design: the threat model, the plugin host, anything where a wrong default is a security hole. For those, the agent doesn't guess. It writes a **design note** as a draft PR, with numbered questions and a recommendation for each, and the card moves to **Human needed**.

The protocol is two steps:

1. **Answer on the PR**, keeping the question numbers. Short answers are fine; "all as proposed" is fine too.
2. **Move the card back to Ready.** That's the signal. The next time an agent picks it up, it reads my comments, turns the note into the real deliverable, and runs the usual build → review → fix → merge loop.

![Pull request #85, the plugin-host design note: ten numbered questions for the maintainer, and below them my answers, one line each](/images/one-human-a-board-and-a-team-of-agents/pr-questions-answers.webp)

Ten questions, ten one-line answers, a card dragged back to Ready. That's the whole interface.

When `PLAN.md` was ambiguous, the agents **chose the tightest option** (relaxing a rule later breaks nothing, tightening one does), recorded it as provisional, and listed it for me. By the end there were more than 70 numbered decisions in Horae's `schemas/README.md`.

### The protocol changed on day 13

On 9 November the board had several cards waiting for me, all with code already merged and only a real-world check left. I wrote: *"Get for all of them the recommendation you would like to do and move on. Plan the next development phases and go."* The lead closed them, moved each real-world check into one of three checklist issues for me, accepted the default note template as a design call I'd delegated, posted a plan for M4 to M8, and started building.

It still drew a line I hadn't asked for. Stories that control what plugin code gets installed and run (#44, #46, #47) went only as far as a reviewed PR: *"Merging security-critical install code without you looking at it is not my call."* Over the next two days I approved nine of those PRs: install from git, permission approval and the lockfile, upgrade and audit, the container runtime, MCP authentication, the egress proxy, approval-gated pipeline runs, mounts and limits, and third-party installs.

Here's the uncomfortable part. Some of those approvals took me a couple of minutes: "I'll review it", then "review done, you can proceed" two minutes later. An independent security reviewer had already gone through each diff, and the PR listed the decisions to check, so I read the decisions, not the code. That's what the setup is designed for, but it also means **the human gate is only as strong as the attention behind it**.

## 6. The estimate, and why I doubted it

Here is what the model said for Horae, in its likely case:

| | Human team | One human + 4 agents |
|---|---|---|
| Effort | 218 person-days | 325 agent-hours + **1,134 h of my supervision** |
| Calendar | **22 weeks** with 3 developers · 67 weeks alone | **76 weeks** at 15 h/week · 38 weeks full-time |

The model was careful and its sources were good: [METR's time horizons](https://metr.org/blog/2026-1-29-time-horizon-1-1/), [METR's 2025 study](https://metr.org/blog/2026-02-24-uplift-update/) where experienced developers were 19% *slower* with AI, the [CodeRabbit](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report) and [Veracode](https://www.veracode.com/wp-content/uploads/2026-GenAI-Report-Infographic.pdf) reports on defects in AI-written code. Its core assumptions:

- An agent's **first-pass success** falls fast with size and risk: 85% for an S story, 30% for an L, halved again for security.
- Each failed attempt costs a **human review** of about 15% of the human effort, doubled for security.
- After three failures, **a human takes over** at 60% of the human effort.
- Agent wall-clock: 0.75 h for an S story, 2 h for an M, 5 h for an L.

So most of the 1,134 hours were me, reviewing diffs and rescuing agents. The roadmap built on it ran from **2 November 2026 to 13 April 2028**.

## 7. What the boards say

### Horae: done in 15 days

Of the 97 stories and tasks in the original Horae backlog, **89 are done**. The 8 left are 7 human-only tasks (accounts, settings, devices, the release itself) and one integration that needs a small change in two services I run. The agents also opened and closed 41 issues of their own along the way.

| Milestone | Done | Planned (start → target) |
|---|---|---|
| M0 Foundations | 6 / 8 | Nov 2026 → Dec 2026 |
| M1 Walking skeleton | 11 / 11 | Dec 2026 → Feb 2027 |
| M2 LLM step | 12 / 13 | Feb 2027 → Apr 2027 |
| M3 Dogfood | 39 / 42 | Apr 2027 → Aug 2027 |
| M4 Marketplace | 9 / 9 | Aug 2027 → Oct 2027 |
| M5 Hard isolation | 7 / 7 | Oct 2027 → Jan 2028 |
| M6 Existing MCP services | 2 / 3 | Jan 2028 → Feb 2028 |
| M7 Mail, school, home | 10 / 10 | Feb 2028 → Mar 2028 |
| M8 Public v0.1 | 3 / 5 | Mar 2028 → **Apr 2028** |

Everything still open is in a human's hands. The first story started on **27 October**, and the last agent task merged on **11 November**: **15 calendar days**, of which agents actually ran on 8. The plan said 76 weeks. Even the three-developer team in the estimate would have needed about 18 weeks for the same 89 stories (183 person-days).

### Agent time: a third to a sixth of the estimate

Both projects record agent wall-clock in the Actuals. Here are the stories that have both a time and an estimate:

| | Stories timed | Estimated agent time | **Measured agent time** | Ratio |
|---|---|---|---|---|
| Horae | 42 | 116 h | **39 h** | ~3× less |
| Angelia | 30 | 106 h | **18 h** | ~6× less |

On Angelia, where the model is on the card, the pattern is the same at every level: an Opus story averaged **44 minutes** against 4.2 hours estimated, a Sonnet story **30 minutes** against 2.9 hours, and an M story **34 minutes** against 3.5 hours.

Horae has a gap I created myself: when I switched to a leaner loop to save tokens (section 8), the Actuals kept saying which agent and model did the work, but **stopped recording the time**. So 88 Horae stories have no measured duration. If you copy this setup, protect the timing in your Actuals template; it's the first thing to go when you optimise for cost.

### Takeovers and supervision

**Zero human takeovers**, in all 123 Actuals that record it, across both projects. The model expected the M stories to fail their first pass most of the time and fall back on me. They didn't: the reviewer found the problems and the fixer fixed them. A failed first pass became a cheap internal iteration, not a human rescue.

For the 89 Horae stories that are done, the estimate planned **684 hours of my supervision**, mostly reviewing diffs. I reviewed almost no diff. In those 15 days I sent about forty messages to the lead session, most of them one line ("continue", "Start M2", "review done, you can proceed"), answered seven design notes, accepted the ADRs and the skill format, made a handful of decisions ("Relax it (option 2)", "Yes, container only"), and approved nine security PRs. I didn't time it, so I won't invent a number, but it's nowhere near 684 hours. The rest of my time went **upstream**, into the planning sessions and validating the tickets, and **downstream**, into the deployment of section 10.

### Why the model was wrong

The model wasn't sloppy. It was **built on 2025 numbers, and it put the human in the wrong place**.

- **The evidence aged fast.** METR's own update puts the doubling time of the task length frontier models can handle at [about 89 days for models since 2024](https://metr.org/blog/2026-1-29-time-horizon-1-1/), and Anthropic describes it as ["doubling roughly every four months, up from an earlier trend of doubling every seven months"](https://www.anthropic.com/institute/recursive-self-improvement). An estimate built in October from studies of early 2025 is calibrated on models two or three doublings old.
- **It assumed humans review every attempt.** In this workflow an independent agent reviews, and I review decisions. That's also where large teams are going: Anthropic writes that ["human code review has become a new bottleneck"](https://www.anthropic.com/institute/recursive-self-improvement), with more than 80% of its merged code now authored by Claude. Microsoft's .NET team, after ten months with the Copilot coding agent, also [names review as the bottleneck](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/).
- **"First-pass success" was the wrong unit.** It measures whether the first diff is mergeable. With a reviewer and a fixer in the loop, what counts is whether the *loop* converges without a human. 123 out of 123 did.

### What the model still gets right

I don't want to swap one wrong number for another, so here are the honest limits:

- **Most of it isn't proven in use yet.** Horae's core, Obsidian, calendar and ntfy plugins now run on my server (section 10). The mail, school, Home Assistant and Google plugins have never touched a real account; the ÉcoleDirecte protocol was written from community docs.
- **Defects don't vanish.** Studies still find more issues in AI-written PRs ([1.7× more major issues for CodeRabbit](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report), [44% of tasks with a risky vulnerability for Veracode](https://www.veracode.com/wp-content/uploads/2026-GenAI-Report-Infographic.pdf), more instability for DORA). My hundreds of findings say the same thing: the first draft is often wrong. What changed is who catches it.
- **Upstream and downstream time is real.** Writing and validating the tickets took me longer than the agents took to deliver whole milestones. Deploying took me two evenings. The .NET team saw the upstream part too: their agent's success rate went from 38% to 69% after better instructions, and they concluded that ["preparation matters more than the model"](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/).
- **The model didn't price two new limits**: the usage quota and the token bill. Next section.

So the estimate was right that **I am the bottleneck**. It was wrong about *what kind* of work I'd be doing. It priced me as a code reviewer. I worked as a product owner, an architect who answers questions, an approver, and finally an operator.

## 8. Stops, quota and the token bill

Here is something no estimate mentions: the work **stops**. Not because something breaks, but because the human isn't there, or because the usage quota runs out.

Horae closed stories on 9 days between 27 October and 12 November. In between: nights, my working days, four usage-limit stops, and two long pauses, 30–31 October and 2–7 November. The second one was the weekly quota and the other project: from 1 to 7 November I was running Angelia, then Horae again from 8 November. **Two boards share one human and one quota.**

What I learned from the stops:

- **The board is the save file.** When everything stops, nothing is lost: each card says where it is, each PR holds its questions, each finished story has its Actuals. A week later, *"Continue"* was enough to pick Horae up again.
- **Asking one milestone at a time is what makes stops cheap.** Each stop happened between batches or inside a small one.
- **A stop in the middle of a story costs something.** When a usage limit hits, the lead stops its running agents on purpose instead of burning the last of the allowance, and writes down where each one stood (branch, worktree path, what was left). That note is what makes a restart possible.
- **The lead must re-read the board between stories.** Once I answered a design note and moved the card back to Ready, and three hours later the lead was still listing it as "waiting for your answers": it was working from its own notes, not from the board.

### The token bill

On 8 November, after the third usage-limit stop, I asked the lead to analyse where the tokens were going. The answer was clear:

- **Three agents per story** (build, review, fix) each re-read most of the same docs and code: about **600,000 to 1 million tokens per story**.
- **Up to 7 stories in parallel** caused merge conflicts and three clashes over decision numbers, each costing extra rounds.
- **Every low finding got a fix pass**, and small edits went to agents.

The new "lean loop":

1. **One agent per story by default**: it implements, reviews its own diff against a checklist, fixes, opens the PR and waits for CI. Sonnet by default, Opus for security or core-contract work.
2. **An independent reviewer only for security or core-contract stories**, limited to the diff, reporting high and medium findings, and fixing them itself.
3. **Low findings become follow-up issues.**
4. **At most two stories in flight.**
5. **The lead does merges, renumbering and small edits itself.**

The next three stories used about **80,000, 108,000 and 220,000 tokens**. That's three to ten times cheaper, and it's the loop that finished M3 to M7. Security work kept its independent reviewer, which is where the serious findings of section 4 came from. The cost was the timing data, as I said above.

## 9. A second board: Angelia

On 30 October I asked Claude to copy what we did on horae-dev and to build "a full board agent + human development oriented to work together", where **agents decide when a human is needed** and the **model is chosen from the complexity**. In about 45 minutes it set up five repositories and **129 issues** on the [Angelia Roadmap](https://github.com/orgs/angelia-dev/projects/1).

![The Angelia board on 13 November: 180 items done (issues and their pull requests), 35 in Backlog, 2 Ready, 3 in progress, 3 in review and 4 waiting for the human. Every card shows its executor, its model and its size](/images/one-human-a-board-and-a-team-of-agents/angelia-board.webp)

It's similar to Horae, but not the same:

| | Horae | Angelia |
|---|---|---|
| Repositories | 15 | 5 |
| Issues at the start | 130 | 129 |
| **Model choice** | the lead picks per story | a **Complexity** field drives a **Model** field on every card: Low → Haiku, Medium → Sonnet, High and Very high → Opus; I can override it |
| **When to ask a human** | the Executor field, plus the agent's judgement | explicit triggers in `AGENTS.md`: a public contract, a security choice, a new dependency, an ambiguous spec, or the same CI check failing three times |
| **Escalation** | none written down | three CI failures or twice the estimated time → retry once with the next model up → then a human |
| **Spec depth** | every story detailed up front | Phases 0 and 1 detailed (`agent-ready`); Phases 2 and 3 are **27 outlines** (`needs-spec`), detailed just before they start |
| **First phase** | foundations | a **spike** with benchmarks and a human go/no-go |
| **Where agents run** | one local Claude Code session | a coordinator thread and cloud agents; my Mac for board writes and benchmarks |
| **Views** | 6 | 8, adding a **Human needed** board and a **Model planner** |

![The "Model planner" view: open stories with their status, suggested model, phase, complexity, size, executor and agent hours](/images/one-human-a-board-and-a-team-of-agents/angelia-model-planner.webp)

### What happened

Angelia started on 1 November with one message: check the board, act as a coordinator, build each Ready story with the model on its card, review with another agent, fix, and merge when CI is green. **35 stories closed that first day.** By 13 November:

- **83 stories done**: 55 of the 95 in the original backlog, plus 28 the agents added. Phase 0 is at 32 of 38, Phase 1 at 21 of 30, and Phase 2 has started.
- **Releases**: v0.1.0 tagged on 10 November and **v0.1.2 published on 12 November**. The roadmap had planned the v0.1 MVP for March 2027.
- **Benchmarks on real hardware**: the spike's benchmarks ran on my Mac, including one that watches 2,000 GitHub repositories on a single token. A 6.5-hour live run was cut short by a Claude Code restart and produced a partial report.

And three things that didn't go to plan:

- **The board drifted.** The coordinator couldn't write to the project itself, so it relayed **64 board-update requests** to a helper session on my Mac. On 3 November I wrote: *"there is nothing on the board to approve. Where the PR/Issues concerned are?"* The fix was to put every PR on the board as its own card, which is why the Done column counts issues and PRs. **The agent doing the work must be able to update the board directly**, or the board stops being the truth.
- **The release came before the go/no-go.** v0.1 shipped, but the Phase 0 report and the go/no-go decision (#110, #119) are still in Backlog. Agents moved faster than my paperwork; the formal decision has to catch up.
- **The estimate wasn't recalibrated.** Angelia's rubric still says an M story takes 3.5 agent hours. It took 34 minutes on average. Horae's data was there; I should have fed it in.

**Just-in-time specs** worked as hoped: the outlines for later phases are being detailed only now, after the spike answered the big questions. And the **model on the card** made cost visible before each run: of the timed stories, 15 ran on Opus, 14 on Sonnet and 1 on Haiku.

## 10. The last mile is human

On 12 November I asked the Horae lead: *"What is the status of the horae-dev project? Are we able to finish and start to test?"* It ran Horae locally on a fresh copy in a few minutes. Then I asked it to deploy on my home server, where Coolify, authentik, a Cloudflare tunnel, ntfy and Uptime Kuma were already running.

That took **two evenings**, and it's where CI green met reality:

- The container image on GHCR was **private**, so the server couldn't pull it. GitHub has no API to change that; I had to click it.
- **Cloudflare blocked the LiveSync helper's health check** because it identified as `Python-urllib`, and the helper read the 403 as wrong credentials.
- Coolify created a mounted config file **empty and read-only**.
- The LiveSync database was **locked** to my two devices, so the server was refused as a new one.
- **Every plugin install failed**: plugins took the SDK from a git commit, and Horae's own installer rightly refuses sources without a hash. The fix was publishing the SDK to PyPI, which needed me to set up the trusted publisher.
- **Packs couldn't be installed at all**: the installer tried to build a Python environment for a plugin that ships only files. That was a real bug, fixed in #201.
- My desktop Obsidian **stopped syncing** because of a DNS problem on the Mac.

Each of those took an agent minutes to diagnose, once I'd done my part: signing in to Coolify and authentik in the browser pane, typing the secrets, adding the tunnel hostname, setting up PyPI, unlocking things in Obsidian, pasting commands into the container terminal, and looking at my phone.

At 21:24 on 13 November I wrote two words in the session: *"Phone rang."* A task I'd written in Obsidian on my desktop had synced to the server, Horae had found it, and ntfy had pushed the reminder to my iPhone. The morning brief is next, waiting on #201.

The agents did weeks of work in days. The first real deployment still needed a human for every account, secret, setting and device, and it found bugs that no review and no CI run had seen.

## 11. Pizza team or sandwich team?

The estimate compared "one human + agents" with "three developers". I think the more interesting comparison is about team shape.

Amazon's **two-pizza team** (small enough to be fed by two pizzas, so six to ten people) was designed to limit coordination. Even so, eight people have **28 communication channels** between them (n(n−1)/2). Matt Ström-Awn writes that the idea [has morphed into "two sandwich teams"](https://mattstromawn.com/writing/high-agency-strategy/), "the same principle, but with a team size of two". In July, [Business Insider collected the same signal from tech leaders](https://finance.yahoo.com/technology/ai/articles/2-pizza-days-over-heres-095501046.html): Cursor's field CTO saying "two pizzas are too much pizza", Coinbase's CEO talking about "one person teams".

A board like this one is a **hub**, not a mesh. One human talks to a lead agent, the lead talks to the workers, and the workers never talk to each other. With four agents that's four channels, not 28. That's not a detail: research on agent cooperation finds that agents coordinating with each other [do markedly worse than a single agent](https://www.mintlify.com/cooperbench/CooperBench/results/findings), so the hub is the right shape for the agents too. Horae's token analysis says the same thing from the cost side: more parallel agents meant more conflicts, not more speed.

What I take from it:

- **The unit of throughput is now decisions per day, not lines of code per day.** One person's decision bandwidth is the cap, and now there's a second cap: the usage quota.
- **A pizza team becomes several sandwich teams**, each owning a product with its own board. That's literally what I did with Horae and Angelia: two boards, one human, each with its own agents. But they don't run in parallel the way two teams would: they share my attention and my quota, so in practice I alternated.
- **A sandwich team of two is probably the sweet spot.** Two people double the decision bandwidth for one extra channel, the board keeps moving when one of them is busy, and a second person makes the security approvals of section 5 much less of a formality.
- **Pizza teams still win** where the work is irreducibly human and parallel: security reviews, on-call, domain knowledge, talking to users, deployments on real infrastructure, and the bus factor. A sandwich team with agents has a bus factor of one or two.

The Microsoft field study of Claude Code and Copilot CLI found adopters [merging about 24% more PRs](https://arxiv.org/abs/2607.01418) in an organisation that kept its existing team shape. That's a real gain, but nothing like what you see when the process is rebuilt around the agents. I suspect most of the difference is team shape and process, not the model.

## 12. Set it up yourself

If you want to try this on your own project, this is the minimum that made it work, with what Angelia and the token bill added:

1. **Write the backlog with the agent, validate it yourself.** Acceptance criteria on every story. Detail only the next phase or two; keep the rest as outlines.
2. **Add an Executor field** (Agent, Agent + human check, Human-led, Human-only) and an **Agent-ready view**. Agents need to know what to skip.
3. **Put the model on the card**: a Complexity field and a suggested Model you can override.
4. **Describe the columns.** "Ready = spec complete", "Human needed = blocked on the maintainer". The descriptions are the protocol.
5. **Write down when an agent must stop and ask**: public contracts, security choices, new dependencies, ambiguous specs, repeated CI failures.
6. **Put an estimate and an Actuals section in every story**, and make the time a required line. Recalibrate after 15 stories, and carry the calibration to your next project.
7. **Start with one agent per story and a checklist self-review**; add an independent reviewer for security and public contracts. The one who writes never approves those.
8. **Make CI the gate**, and keep at most two stories in flight.
9. **Agree on the human-needed protocol**: numbered questions in the PR, answers on the PR, card back to Ready. Make the lead re-read the board between stories, and let it update the board itself.
10. **Ask one milestone at a time**, and expect stops.
11. **Deploy early.** A real instance on real infrastructure finds what reviews and CI don't, and it needs you.

## 13. Close

The estimate said I'd be the bottleneck, and I am. But the hours I spend aren't in diffs. They're in the tickets before any code exists, in the questions the agents can't, and shouldn't, answer, in deciding when to press "continue", and in the accounts, secrets and devices of the first real deployment. Everything between those moments now takes minutes, or a few days for a whole project.

Write the tickets well. Let the board drive. Keep the decisions human.

## Links

- 🗂️ [Horae Roadmap](https://github.com/orgs/horae-dev/projects/1): the public board, with all its views
- 📦 [horae-dev/horae](https://github.com/horae-dev/horae): the code, `docs/ESTIMATION.md` and `docs/ROADMAP.md`
- 🗂️ [Angelia Roadmap](https://github.com/orgs/angelia-dev/projects/1) and [angelia-dev/angelia](https://github.com/angelia-dev/angelia): the second board, with `docs/ESTIMATION.md`, `AGENTS.md` and the [v0.1.2 release](https://github.com/angelia-dev/angelia/releases/tag/v0.1.2)
- 🎬 [The video, full page](/videos/human-agents-board/?lang=en), made with [canvas-video-skill](https://github.com/mmornati/canvas-video-skill)
- 📖 [Six weeks in one night](/six-weeks-in-one-night-building-a-product-in-the-agentic-era/): the previous experiment, with Graft

**Sources:** [METR, Time Horizon 1.1](https://metr.org/blog/2026-1-29-time-horizon-1-1/) (Jan 2026) · [METR, uplift update](https://metr.org/blog/2026-02-24-uplift-update/) (Feb 2026) · [Anthropic, When AI builds itself](https://www.anthropic.com/institute/recursive-self-improvement) (updated Sep 2026) · [Murphy-Hill, Butler and Savelieva, CLI coding agents at Microsoft](https://arxiv.org/abs/2607.01418) (Jul 2026) · [.NET team, ten months with the Copilot coding agent](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/) (Mar 2026) · [CodeRabbit, AI vs human code](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report) (Dec 2025) · [Veracode 2026 GenAI report](https://www.veracode.com/wp-content/uploads/2026-GenAI-Report-Infographic.pdf) · [Matt Ström-Awn, High-agency strategy](https://mattstromawn.com/writing/high-agency-strategy/) · [Business Insider, the two-pizza days are over](https://finance.yahoo.com/technology/ai/articles/2-pizza-days-over-heres-095501046.html) (Jul 2026) · [CooperBench findings](https://www.mintlify.com/cooperbench/CooperBench/results/findings)
