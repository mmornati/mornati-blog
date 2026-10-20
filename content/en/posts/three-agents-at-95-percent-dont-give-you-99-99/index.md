---
title: "Three Agents at 95% Don't Give You 99.99%: The Maths of Asking Twice"
categories:
- ai-coding-agents
tags:
- ai
- ai-agent
- code-review
- llm
- statistics
- software-engineering
date: '2026-10-22T16:00:00.000000+00:00'
draft: false
slug: three-agents-at-95-percent-dont-give-you-99-99
translationKey: shared-blind-spots
cover: cover.jpg
showHero: true
description: Running the same task through several LLM runs, several models or a generator plus a reviewer does give better code than a single execution. But not by the 1 - 0.05³ that every multi-agent pitch promises. What the probability actually says, what 40 years of N-version programming and two 2026 replications measured, and how human defect rates compare with models from a year ago and from today.
summary: Three agents at 95% each should give 99.9875%, if they fail independently and if you can tell which answer is right. Neither holds. With a voting step and realistic task difficulty the same three agents land near 96%. Why, what the data says about mixing model families and reviewers, and what we really know about human defect rates since the 1980s versus models from October 2025 and October 2026.
---

Every answer an LLM gives comes with an error rate. Even a very good coding agent gets some tasks wrong: say one in twenty, 5%. We can't push that number to zero, but statistics has an old trick for unreliable measurements: don't trust one, take several. Run the same task through several agents, and the chance that all of them are wrong should shrink fast. With three agents at 5% each, the chance that at least one gets it right is:

```text
1 - 0.05 × 0.05 × 0.05 = 99.9875%
```

It is the number behind every "use several agents" pitch, and the one I had in mind when I started using a second model to review the first one's pull requests. The real question is whether it holds, and we don't need a new experiment to check it. Decades of reliability engineering already report the data: a NASA report from 1985, a famous 1986 experiment with human programmers, two replications with coding agents published this summer, plus public benchmarks and defect studies. That is enough to do the maths and the estimations in this post.

This post is that answer. The short version: **yes, more runs, more models and an independent check all help, and the maths explains why. But they help far less than the naive formula says, and the reason is the same one people found with human programmers forty years ago.**

## 1. The formula is right, the question is wrong

`1 - 0.05³` is the probability that **at least one** of three agents is right. To turn that into a result, you need two things:

1. **The agents fail independently.** Agent B's chance of failing doesn't depend on whether agent A failed.
2. **You can tell which answer is the right one.** Someone, a full test suite or an oracle, picks the correct output whenever there is one.

The second assumption is the one people forget. In practice you rarely have an oracle; if you had one, you wouldn't need three agents. So you **vote**: you keep the answer at least two of the three agree on. With independent agents at 95%, majority voting gives:

```text
P(majority right) = 3p²(1 - p) + p³ = 99.275%
```

Still impressive, but the residual error went from 0.0125% to 0.725%, **58 times higher**, only because nobody knows which answer is correct. That gap between "at least one is right" (what the papers call pass@k) and "the vote is right" is the first thing to keep in mind. The [Large Language Monkeys](https://scalingintelligence.stanford.edu/blogs/monkeys) paper measured it on code: coverage keeps growing with more samples, but without a verifier, voting and reward models plateau.

## 2. Difficulty is correlation

The first assumption is worse, and it doesn't need any mysterious "the models think alike" argument. Tasks simply aren't equally hard.

Take two worlds where the agents have exactly the same 95% average accuracy:

- **World A**: every task fails 5% of the time.
- **World B**: 90% of tasks are easy and fail 1% of the time; 10% are hard and fail 41% of the time. On average that is still 5%.

A single agent can't tell the two worlds apart. Three agents can:

| 3 agents, 95% average accuracy | World A (independent) | World B (easy + hard tasks) |
| --- | --- | --- |
| At least one right (oracle) | 99.9875% | 99.31% |
| Majority vote right | 99.275% | **96.31%** |

In world B, all three agents fail together **55 times more often** than independence predicts. Nobody copied anybody. They are just all bad at the same hard tasks. And adding agents barely helps: with a majority vote, World B goes from 96.3% with 3 agents to 96.7% with 5 and 97.1% with 9. If the hard tasks fail more than half the time, voting even makes them worse, which is what [Chen et al.](https://arxiv.org/abs/2403.02419v1) found: more LLM calls help on easy queries and hurt on hard ones.

This is not a new idea. It is the Eckhardt-Lee model, written for NASA in [1985](https://ntrs.nasa.gov/citations/19850015006) for redundant flight software, and refined by [Littlewood and Miller](https://ntrs.nasa.gov/citations/19900036555). If θ(x) is the probability that a randomly chosen version fails on input x, then:

```text
P(all n versions fail) = E[θ(x)ⁿ]  ≥  (E[θ(x)])ⁿ
```

The inequality is the whole story: as soon as difficulty varies across inputs, joint failure is more likely than independence predicts. The only way out is to make the versions *different on purpose*, so that their θ(x) don't peak on the same inputs.

You can reproduce both tables in a few lines:

```python
from math import comb

def vote_fails(theta, n):
    return sum(comb(n, k) * theta**k * (1 - theta)**(n - k)
               for k in range(n // 2 + 1, n + 1))

worlds = {"A": [(1.0, 0.05)], "B": [(0.9, 0.01), (0.1, 0.41)]}
for name, tasks in worlds.items():
    for n in (1, 3, 5, 9):
        oracle = 1 - sum(w * t**n for w, t in tasks)
        vote = 1 - sum(w * vote_fails(t, n) for w, t in tasks)
        print(f"world {name}, n={n}: oracle {oracle:.4%}, vote {vote:.4%}")
```

## 3. What people measured: humans in 1986, agents in 2026

In 1986, John Knight and Nancy Leveson [ran the experiment](https://libraopen.lib.virginia.edu/public_view/jd472w463): 27 students at two universities wrote independent versions of the same program from the same specification, and each version was run on one million random inputs. Under independence they expected about 127 coincident failures. They observed 1,255, [about ten times more](https://shape-of-code.com/2026/06/21/reliability-via-n-version-programming/). Independence was rejected at 99% confidence, and the failures clustered on the hard parts of the spec.

This June, Ron, Baudry and Monperrus [replayed it with coding agents](https://www.emergentmind.com/papers/2606.20158): 69 versions from 5 agent harnesses and 23 models, the same kind of specification, one million tests. The results:

- Individually, the agent versions are good: 27 of the 48 that passed acceptance had **zero** failures on the million inputs, and the mean was 387 failures per version (about 0.04%).
- Majority-vote triples cut mean failures **by about two thirds** (from 387 to 131).
- But independence is rejected again: 429 coincident failures observed against 115 expected, **3.7 times** more. Failures cluster on spec ambiguities, exactly as with the students.

A second 2026 study, [Nogueira et al.](https://arxiv.org/abs/2607.02808), ran 12 models on 224 problems in 5 languages and found that majority-vote gains stay **under half** of what independence predicts, and that no ensemble beat the best single model. The choice of model mattered most; the prompting style barely did.

So the honest summary is: **the ensemble helps, by roughly a factor of three on failures, not by a factor of four hundred.**

## 4. Different models? Better, but less than you'd hope

If the problem is that versions share blind spots, the obvious move is to pick versions that don't share them: different model families. It helps, with a catch.

[Kim et al.](https://arxiv.org/abs/2506.07962v1) (ICML 2025) looked at more than 350 models. When two models are both wrong, they pick **the same wrong answer about 60% of the time** on one leaderboard. And the more accurate the models, the more correlated their errors, even across providers. [Goel et al.](https://arxiv.org/abs/2502.04313) found the same: as capability grows, mistakes become more similar. Big models are trained on the same internet, the same GitHub and increasingly the same synthetic data. Their θ(x) peak on the same inputs.

What really decorrelates errors is not the logo on the model, it is what you change around it:

- **a different input**: a spec rewritten or clarified, a different decomposition of the task;
- **a different method**: one version written test-first, one generated from examples;
- **a different kind of check**: tests that execute the code, not another model that reads it.

That last point is the one I use every day.

## 5. Generate and review: the check that changes the formula

Most of us don't run three agents and vote. We run one agent that writes the code and another one, or the same one in a fresh context, that reviews it. The formula changes:

```text
P(bug ships) = P(generator wrong) × P(reviewer misses it)
```

With a 95% generator and a reviewer that catches 80% of bugs, independence predicts that 5% × 20% = **1%** of changes ship with a bug. The same correlation problem applies: the reviewer is most likely to miss exactly the bugs that were hard to avoid in the first place. And there is a second risk, the self-review one. [Goel et al.](https://arxiv.org/abs/2502.04313) show LLM judges favour outputs of models similar to themselves, and [several](https://arxiv.org/pdf/2603.12123) [studies](https://arxiv.org/abs/2504.03846v3) find models miss errors in their own output that they catch when the same text comes from outside. The evidence is mixed: one [verifiable test](https://arxiv.org/abs/2606.20093) found no measurable self-preference. But nobody has yet measured, on code with executable ground truth, how much more often a bug written by model A gets approved by A than by a reviewer from another family. That is the most useful open question in this whole area.

What the numbers already support:

- **A reviewer is worth more than a third generator.** A vote needs two of three wrong answers to agree to fail; a review multiplies by the miss rate, and a reviewer that reads the spec and the diff is a different method, not a third copy of the same one.
- **Prefer a reviewer from another family**, in a fresh context, with the spec but not the generator's reasoning.
- **Prefer a check that executes.** Tests, a type checker, a fuzzer. Their errors are not correlated with the model's errors at all, which is exactly the property the maths asks for. It is also why I built [Graft](/you-dont-need-scion-graft-review-layer-for-agent-pull-requests/) and the [release gate](/your-agents-ship-fast-make-them-pass-a-release-gate/) around scripted checks, not around a second opinion.

## 6. And humans? Forty years of defect data

The second question I had: how does all this compare with us? What is the probability that a human-written change fails, and how does it compare with a model from a year ago and one from today?

The honest first answer is that **the metrics don't line up**. Human data is counted in defects per line or per function point over a whole project. Model data is counted in tasks passed on a benchmark. With that warning, here is what we have.

### Humans, 1975 to today

| Source | Period | What it measures | Number |
| --- | --- | --- | --- |
| [Watts Humphrey, SEI](https://www.sei.cmu.edu/documents/125/2009_019_001_29092.pdf) | 1990s | Defects *injected* by experienced engineers, before any review or test | 80-125 per KLOC |
| [Ray Panko, inspection data](http://panko.com/HumanErr/Software.html) | 1986-2006 | Faults per line found in code inspection | 1.9%-3.7% of lines |
| [Panko, residual faults](http://panko.com/HumanErr/Software.html) (Putnam & Myers, 1,486 projects) | 1975-1996 | Faults left *after* delivery | ~0.1%-0.3% of lines (1-3 per KLOC) |
| [Capers Jones](https://www.sqgne.org/presentations/2010-11/Jones-Nov-2010.pdf) | ~2010 | U.S. average defects created per function point, share removed before release | 5.1 per FP, 86.7% removed, 0.68 delivered |
| Capers Jones, same data | ~2010 | Teams using TSP/PSP | 4.0 per FP, 97% removed, 0.12 delivered |
| [Coverity Scan](https://news.synopsys.com/2015-07-29-Coverity-Scan-Open-Source-Report-Shows-Commercial-Code-Is-More-Compliant-to-Security-Standards-than-Open-Source-Code) | 2013-2014 | Static-analysis defects in ~10 billion lines | 0.61-0.77 per KLOC |
| [NASA Shuttle on-board software](https://www1.udel.edu/CIS/106h/16F/resources/theyWriteTheRightStuffNasa.html) | 1990s | Errors in each of the last three 420,000-line releases | 1 per release |

Three things stand out.

- **Humans make a lot of mistakes and catch most of them.** Around 100 defects per thousand lines go in; one to three come out. Nearly all the quality comes from the review, inspection and test steps, not from the first draft.
- **The rate of making mistakes hardly moved in forty years.** Jones's defect potentials look flat across his writings, and his removal efficiency barely moved from about 85% (2007-2012) to just over 90% (2015). I found no reliable decade-by-decade series before that. What changes the result by a factor of five to ten is the *process*: compare 0.68 delivered defects per function point for the U.S. average with 0.12 for TSP/PSP teams, or the Shuttle group, which got to one error in 420,000 lines with 260 people and $35M a year.
- **Human checks are the original ensemble.** Inspection plus testing plus a different person reviewing is exactly the "independent check" from section 5, and it has the same limit: [Knight and Leveson](https://libraopen.lib.virginia.edu/public_view/jd472w463) showed the humans share blind spots too.

To compare with models, I need the same unit. The best I can do is **the probability that a typical change ships with at least one fault**. Take a 50-line change and Panko's numbers. Before review, at ~3% faults per line, the chance of at least one fault is 1 - 0.97⁵⁰ ≈ **78%**. After the usual review and test, at ~0.3% residual per line, it is 1 - 0.997⁵⁰ ≈ **14%**. Treat those as back-of-envelope figures, not as measurements.

### Models, October 2025 and October 2026

| Benchmark | October 2025 | October 2026 |
| --- | --- | --- |
| [SWE-bench Verified](https://llm-stats.com/benchmarks/swe-bench-verified) (500 real GitHub issues, hidden tests) | [Claude Sonnet 4.5: 77.2%](https://www.anthropic.com/news/claude-sonnet-4-5), GPT-5: 74.9% | [95-97% at the top](https://www.vals.ai/benchmarks/swebench), now archived as saturated |
| [SWE-Bench Pro](https://labs.scale.com/leaderboard/swe_bench_pro) (harder, contamination-resistant) | ~23% at launch (GPT-5, Opus 4.1) | ~60% on the original set; [90-98% on the cleaned V2](https://labs.scale.com/leaderboard/swe_bench_pro_public_v2) |
| [METR time horizon](https://metr.org/blog/2026-1-29-time-horizon-1-1/) (task length at 50% success) | ~3.5 h (GPT-5), ~5 h (Opus 4.5, measured in Jan 2026) | [≥16 h](https://metr.org/time-horizons/) (Claude Mythos Preview, May 2026) |
| [Veracode security pass rate](https://www.veracode.com/blog/2026-genai-code-security-report-ai-risk/) (security-sensitive tasks) | [55%](https://www.veracode.com/press-release/ai-generated-code-poses-major-security-risks-in-nearly-half-of-all-development-tasks-veracode-research-reveals/) (45% of tasks vulnerable) | 56% on average, best model 68% |

Benchmark pass rates overstate correctness, because the hidden tests are weak. [SWE-ABS](https://arxiv.org/abs/2603.00520) re-checked "solved" patches from the top 30 agents and found **about one in five semantically wrong**. If I apply that discount, the probability that a task comes out right:

- **October 2025**: about 0.77 × 0.80 ≈ **60-65%** on SWE-bench Verified, and less than 25% on SWE-Bench Pro. So **35-40% of tasks failed**, more than twice the 14% of a reviewed human change, and close to an unreviewed one.
- **October 2026**: 95% or more on a saturated benchmark. Even with the same 20% discount, which is pessimistic for stronger models, failures fall to roughly **5-25%**. That is the range of a reviewed human change.

The only like-for-like comparison is the N-version experiment: same kind of spec, a million tests. The 2026 agent versions fail on about 0.04% of inputs on average, and more than half of them never fail at all. [Shape of Code](https://shape-of-code.com/2026/06/21/reliability-via-n-version-programming/) notes that this looks a lot lower than the 1986 student versions. Keep in mind that those were students, not professional teams.

And one number didn't move: **security**. Veracode's pass rate on security-sensitive tasks has stayed between 45% and 55% since 2023, while the functional benchmarks went from 75% to 95%. Java is at 29%, XSS and log injection at 13-15%. The model writes code that works much more often than a year ago. It doesn't write *safe* code much more often.

There is also real-repository data, and it is less dramatic than both camps claim. [Mao et al.](https://arxiv.org/html/2603.27130v3) matched 36,855 likely-AI code units with 65,391 human ones in the same repositories: 10.0 static-analysis alerts per KLOC for AI against 13.6 for humans, the same rate of high-risk alerts, and slightly more follow-up fixes for AI code. "Rather small" effects, in their words. On the other side, [CodeRabbit](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report) counted 1.7 times more review findings on AI-assisted pull requests at the end of 2025, on a small sample and from a vendor that sells AI review. I found **no 2026 study that measures production incidents** of AI-written against human-written code. That is the number everyone would want, and nobody has it yet.

## 7. What I take from it

The maths and the data say the same thing, for humans and for models:

1. **A single run is a draft.** Humans inject around 100 defects per thousand lines; models fail a share of tasks that went from about 40% to somewhere between 5% and 25% in a year. Neither is ready to ship as is.
2. **Repetition helps less than diversity.** Asking the same model three times mostly samples the same blind spots. Three model families do better, but the best models increasingly agree, including on their mistakes.
3. **The check that pays most is the one whose errors don't correlate with the author's.** For humans, that was inspection plus testing plus process, and it cut delivered defects by a factor of five to ten. For agents, it is a reviewer from another family with the spec in hand, and above all checks that *execute*: tests, types, fuzzing, a release gate.
4. **Fix the spec before adding agents.** In 1986 and in 2026, common failures cluster on ambiguous specifications. No ensemble fixes a question that was asked badly.
5. **Security is the exception.** Models got much better at working code, not at safe code. That is a place where a dedicated check, a scanner or a security review, is not optional.

Most of what we need to reason about ensembles is already measured, and the maths above is enough to use it. What remains open is narrow: whether a model approves its own bugs more often than a reviewer from another family does. A handful of tasks with good hidden tests would be enough to answer it.

## Sources

- [Knight & Leveson, An Experimental Evaluation of the Assumption of Independence in Multi-Version Programming (1986)](https://libraopen.lib.virginia.edu/public_view/jd472w463)
- [Eckhardt & Lee, A theoretical basis for the analysis of redundant software subject to coincident errors (NASA, 1985)](https://ntrs.nasa.gov/citations/19850015006)
- [Littlewood & Miller, Conceptual modeling of coincident failures in multiversion software](https://ntrs.nasa.gov/citations/19900036555)
- [Ron, Baudry, Monperrus, N-Version Programming with Coding Agents (2026)](https://arxiv.org/html/2606.20158v1)
- [Shape of Code, Reliability via N-version programming (2026)](https://shape-of-code.com/2026/06/21/reliability-via-n-version-programming/)
- [Nogueira et al., Evaluating Failure Independence in LLM-Generated Code (2026)](https://arxiv.org/abs/2607.02808)
- [Kim et al., Correlated Errors in Large Language Models (ICML 2025)](https://arxiv.org/abs/2506.07962v1)
- [Goel et al., Great Models Think Alike and this Undermines AI Oversight (ICML 2025)](https://arxiv.org/abs/2502.04313)
- [Chen et al., Are More LLM Calls All You Need? (2024)](https://arxiv.org/abs/2403.02419v1)
- [Brown et al., Large Language Monkeys (2024)](https://scalingintelligence.stanford.edu/blogs/monkeys)
- [Watts Humphrey, The Software Quality Profile (SEI)](https://www.sei.cmu.edu/documents/125/2009_019_001_29092.pdf)
- [Ray Panko, Human Error in Software](http://panko.com/HumanErr/Software.html)
- [Capers Jones, Software Quality in 2010](https://www.sqgne.org/presentations/2010-11/Jones-Nov-2010.pdf)
- [Coverity Scan Open Source Report 2014](https://news.synopsys.com/2015-07-29-Coverity-Scan-Open-Source-Report-Shows-Commercial-Code-Is-More-Compliant-to-Security-Standards-than-Open-Source-Code)
- [They Write the Right Stuff (Fast Company, 1996)](https://www1.udel.edu/CIS/106h/16F/resources/theyWriteTheRightStuffNasa.html)
- [Anthropic, Introducing Claude Sonnet 4.5 (2025)](https://www.anthropic.com/news/claude-sonnet-4-5)
- [SWE-bench Verified leaderboard (llm-stats)](https://llm-stats.com/benchmarks/swe-bench-verified) and [Vals.ai](https://www.vals.ai/benchmarks/swebench)
- [Scale, SWE-Bench Pro](https://labs.scale.com/leaderboard/swe_bench_pro) and [SWE-Bench Pro V2](https://labs.scale.com/leaderboard/swe_bench_pro_public_v2)
- [SWE-ABS: semantically wrong "solved" patches (2026)](https://arxiv.org/abs/2603.00520)
- [METR, Time Horizon 1.1 (2026)](https://metr.org/blog/2026-1-29-time-horizon-1-1/) and [METR time horizons](https://metr.org/time-horizons/)
- [Veracode, 2025 GenAI Code Security Report](https://www.veracode.com/press-release/ai-generated-code-poses-major-security-risks-in-nearly-half-of-all-development-tasks-veracode-research-reveals/) and [2026 report](https://www.veracode.com/blog/2026-genai-code-security-report-ai-risk/)
- [Mao et al., AI-generated vs human code in real repositories (2026)](https://arxiv.org/html/2603.27130v3)
- [CodeRabbit, State of AI vs Human Code Generation (2025)](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report)
- [Cross-Context Review (2026)](https://arxiv.org/pdf/2603.12123), [Do LLM Evaluators Prefer Themselves for a Reason?](https://arxiv.org/abs/2504.03846v3), [Self-Preference Is Weak or Absent in Verifiable Revision (2026)](https://arxiv.org/abs/2606.20093)
