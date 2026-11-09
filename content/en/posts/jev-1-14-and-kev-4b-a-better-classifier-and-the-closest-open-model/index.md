---
title: 'Jev 1.14 and Kev-4B: a Better Classifier That Routes Pricier, and an Open Model That Almost Routes Like Jev'
categories:
- ai-coding-agents
tags:
- ai
- llm
- ai-routing
- jev
- kev
- laya
- benchmark
- mlx
- apple-silicon
date: '2026-11-10T18:00:00.000000+00:00'
draft: false
slug: jev-1-14-and-kev-4b-a-better-classifier-and-the-closest-open-model
translationKey: jev-1-14-and-kev-4b
cover: cover.jpg
showHero: true
description: One month after the VegaML post, a new round of the system-one-router benchmark. Jev 1.14 against 1.13 (two runs each), Kev-4B on a 16 GB M4 in bf16 with three temperature settings, and a tour of what changed in the "System One" ecosystem, including 28 Laya releases that didn't need a new test. All the results are now on an interactive page.
summary: Jev 1.14 is a better classifier than 1.13 but routes about 10% more expensively, so I'm staying on 1.13. Kev-4B, with its temperature set inside the server, gets 86% topic, 74% risk and 67.5% of routes identical to gold, the closest any open model has come to Jev. At 3 seconds per decision, though. And Laya shipped 28 releases without touching its weights.
projects:
- ha-decision-models
---

A month ago I closed the [VegaML post](/laya-0-4-2-and-vegaml-a-physics-engine-decision-model-on-a-macbook/) with the usual promise: the next candidate goes into the benchmark. In "System One" time, a month is long. So this time I didn't wait for a model to show up in my feed. I opened a Claude Code session on the system-one-router repository and asked a simple question: *is there any new System One model we can test? Any new Laya version worth a new run?*

This is the sixth post of the series. If you're arriving here:

1.  [system-one-router](/system-one-router-picking-the-right-llm-for-every-prompt/): a Go gateway that asks a "System One" decision model four typed questions about each prompt (topic, complexity, risk, private data) and picks the cheapest LLM good enough to answer it, with an 80-prompt benchmark;
2.  [Jev in Home Assistant](/jev-home-assistant-letting-a-decision-model-judge-my-automations/) and its [follow-up](/jev-home-assistant-history-feedback-and-the-local-model-question/): the same kind of model judging my house automations;
3.  [Laya vs Jev, ten days later](/laya-vs-jev-ten-days-later-fine-tuning-on-a-macbook/): Von, Kev-0.8B, a confidence temperature and a Laya fine-tune;
4.  [Clef-flash vs Jev](/clef-flash-vs-jev-cloudflare-decision-model-on-a-macbook/): Cloudflare's 9B model, the first open model to match Jev on topic;
5.  [Laya 0.4.2 and VegaML](/laya-0-4-2-and-vegaml-a-physics-engine-decision-model-on-a-macbook/): eight Laya releases with identical answers, and a decision model that rolls a ball downhill.

The answer to my question: **no new Laya model, but Jev 1.14 is out, and Kev-4B now fits (barely) on my 16 GB M4**. Those are the two runs of this post. Before them, a tour of what moved in a month, because a lot did, even where nothing needed a benchmark.

{{< alert "lightbulb" >}}
**New: all the results on one page.** Every run of the series (23 configurations, 80 prompts each) is now browsable on [**/system-one-benchmark/**](/system-one-benchmark/): leaderboard, Jev 1.14 vs 1.13, Kev-4B, temperatures, and a prompt-by-prompt explorer where you can compare any two models.
{{< /alert >}}

## One month of "System One": what changed

### Laya: 28 releases, same weights

Laya went from **0.4.2 to 0.4.30** between 11 October and 8 November: 28 releases in four weeks. The first thing I checked, as I promised myself in the last post's lessons, was the weights. The three `model.safetensors` files on Hugging Face (`convaiinnovations/laya`) still date from **18 and 19 September**. The only Hub commit since my last run is from this morning, and it only adds the citation of a preprint at the top of the model card (DOI `10.20944/preprints202611.0781.v1`). So Laya is now a paper too, which is nice, but the checkpoints are the ones I already measured three times.

Three upgrades in a row (0.3.6 → 0.3.24 → 0.4.2) gave **identical decisions on all 80 prompts**. With unchanged weights, 0.4.30 would almost certainly do the same, so I didn't spend an evening proving it. That's the first "no" of this post, and it's a useful one.

But what changed in the runtime is interesting, even if it doesn't move my numbers:

*   **Laya now bundles VegaML.** `Agent(vegaml=True)` puts VegaML's physics engine behind Laya's API, with trained policies on top. The two models from the same author are converging into one toolkit.
*   **A fine-tuning bug fix worth knowing about.** In 0.4.30, a yes/no gold label of `1.0` used to train as `false` in the VegaML path. Gold labels are now read the same way as in Laya's own fine-tune, a label keyed to no question is refused, and a non-finite number from the engine is refused before it can become a confident `auto` decision. If you fitted VegaML heads through Laya with numeric booleans, refit.
*   **Hooks everywhere.** `on_predict_start`, `on_predict_end` and `on_error` now run on the VegaML agent too, like on every Laya surface.
*   **Video.** Frame times now report the frame each answer came from, and a few crashes on clips without duration are gone.

None of these touch the four checkpoints my sidecar runs. If I fine-tune Laya again, it'll be with the official `laya-train` CLI, and that's the moment to upgrade.

### VegaML: from 0.8 to 0.16.1, "one engine, any reader"

VegaML moved faster than Laya: **0.8.0 → 0.16.1** in a month. The big change is **vega-U**: the 14M-parameter physics engine is no longer tied to Qwen3.5. You can *attach* it to another language model (the "reader"), feeding it 100 to 1,000+ texts from your domain, without retraining anything. Then you calibrate it with your own labelled examples. It also gained audio and video inputs, and trained policies.

It's a clever direction, but VegaML was weak zero-shot on my routing questions (51% topic). The only experiment that would be worth repeating is the few-shot heads, and I skipped it this round.

### Von is archived

On 19 October, Von's Hugging Face card was marked **archived**, and it now points to **LiquidAI's d1-omni-600M**. Von 1.3 was the open model that routed closest to gold out of the box among the small ones (48%), but it was over-confident. It stays in my tables as a reference, but it won't get new versions.

### LiquidAI enters the game: the d1 family

This is the most serious newcomer of the month. **LiquidAI** released a whole family of decision models: **d1-3B** and **d1-omni-600M** on 5 October, then **d1-2B** and **d1-Omni-2B** on 24 October. d1-2B is built on LFM3-VL-2B, reads text, pictures and video, speaks 16 languages, and the card claims **5.7 ms per decision on an H100**, with any number of questions about one state in one call. It runs on Apple Silicon through Transformers.

Two caveats kept it out of this round: the license is the **LFM Open License v1.0**, not Apache-2.0, and the card doesn't say whether Jev's outputs were in the training data. It also needs a small sidecar, like VegaML did. It's the first candidate for the next run.

### The rest of the landscape

*   **vllm-sr d3** (Apache-2.0): d3-mini, d3-flash and d3-turbo are strong on the public decision boards, but d3-mini alone (4.5B) peaks at **14.8 GiB** in bf16 according to its card. Not on a 16 GB laptop.
*   **Clef and Clef-flash**: no new weights, only evaluation results added to the cards.
*   **autotrust JEV-***: the most downloaded and most liked "System One" models on Hugging Face, and trained on Jev's outputs. Same rule as before: I don't benchmark distilled Jev, since TypeSafe's terms forbid it.
*   **The flood.** Searching Hugging Face for the `system-one` or `decision-model` tags now returns dozens of new repositories *per day*: `zils-*`, `OneJev`, `*-jev-*` fine-tunes, GGUF conversions. Most have zero downloads. In September, I could count the candidates on two hands.

### Jev 1.14

And then the one that matters most for me, because Jev is my production provider: **TypeSafe released Jev 1.14** on OpenRouter. `typesafe/jev-1.13` is still available, and `~typesafe/jev-latest` now points to 1.14. The headline feature is a new **box** question type: point Jev at an image and ask it to find one target, and it answers with the four edges of a box (1.13 rejects that with a 400). Context is 262,144 tokens.

My router doesn't send images, so the box doesn't matter. The real question is whether topic, complexity and risk drift between versions. And that's cheap to measure: 80 prompts cost about $0.04.

## Run 1: Jev 1.14 vs 1.13

`config.yaml` pins `typesafe/jev-1.13`. The bench now accepts any `jev-<version>` as a provider name, so the two versions run side by side, on the same prompts, the same evening, through the same router:

```bash
go run ./cmd/bench -providers jev-1.13,jev-1.14
```

A remote model isn't perfectly deterministic, so I ran it **twice** to see how much of the difference is just noise.

| | Jev 1.13 (run 1 / run 2) | Jev 1.14 (run 1 / run 2) |
| --- | --- | --- |
| Topic accuracy | 87.5% / 88.8% | 87.5% / 87.5% |
| Complexity exact / within ±1 | 70% / 71% · 100% | 69% / 69% · 100% |
| Risk exact | 60% / 60% | **65% / 66%** |
| Answers with confidence ≥ 0.8 | 86% / 86% (93% right) | 81% / 80% (95–97% right) |
| Calibration error (ECE) | 0.088 / 0.099 | **0.072 / 0.059** |
| Route = gold route | 71% / 74% | 71% / 70% |
| Cheaper / pricier model than gold | 5 / 18 · 3 / 18 | 3 / 20 · 3 / 21 |
| Est. model cost (gold: $1.18) | **$1.31 / $1.35** | $1.47 / $1.48 |
| Decision latency p50 | 221 / 207 ms | 199 / 192 ms |

The two versions agree on the topic for 95–96% of prompts and on the routed model for 84–86%. So it's not a different model, it's a refinement. And the refinement goes in two directions at once:

*   **1.14 is the better classifier.** +5 points on risk in both runs, a lower calibration error in both runs, and a slightly faster answer. Topic and complexity don't move.
*   **But it routes about 10% more expensively.** It's confident less often (80–81% of answers clear my 0.8 threshold, against 86%), and when it's not confident, my router plays safe and raises the quality floor. It also moves a few prompts from complexity 2 to 3.

Is it just my threshold being too strict for a better-calibrated model? I re-ran both versions with the threshold at 0.7 and 0.6:

| Confidence threshold | Jev 1.13 cost / route = gold | Jev 1.14 cost / route = gold |
| --- | --- | --- |
| 0.8 (current) | $1.31–1.35 / 71–74% | $1.47–1.48 / 70–71% |
| 0.7 | $1.32 / 75% | $1.44 / 70% |
| 0.6 | $1.28 / 76% | $1.43 / 72.5% |

No. 1.14 stays more expensive at every threshold, and 1.13 keeps the better match with gold every time.

Then, per prompt: where do the two versions route differently? On **13 prompts in the first run and 11 in the second**, and 1.14 picks the pricier model on 9 and 8 of them. The reasons are a mix: complexity 2 → 3 bumps (sometimes right, sometimes not), topic confidence falling below the threshold (0.92 → 0.69, 0.82 → 0.59), one risk 1 → 2. About a dozen prompts out of 80: that's a **direction**, not a measurement. But the direction is the same in both runs.

**Decision: I'm staying on 1.13** for now. A better risk score is nice, but my router doesn't pay for risk accuracy, it pays for routes. I'll re-check 1.14 when `cmd/refit` has enough real outcome data to say whether its extra caution was worth it, because maybe those pricier routes were the right ones.

### A side finding on risk

While looking at the risk scores, Claude noticed that both Jev versions are biased high on my labels: on average, the raw risk score is about **0.53 above** my label. The router subtracts a fixed `risk_offset` of −0.3 before rounding. With **−0.5** instead, risk accuracy would jump to about 80% for both versions.

I didn't change it. With −0.5, risk 2 would need a raw score of exactly 2.0: it works on these 80 prompts because of where their scores happen to fall, and that's the definition of overfitting. A fun detail: the first scan said −0.5 was much better than −0.4 and −0.6, which looked suspicious. The reason was rounding: Python rounds half to even, Go rounds half away from zero. Re-checked with Go's rounding, −0.5 is still the best, but by less.

## Run 2: Kev-4B on a 16 GB Mac

[Kev](https://github.com/jaredpalmer/kev), by Jared Palmer, is a LoRA plus a pointer head on a Qwen3.5 base model. Kev-0.8B was the best small open topic classifier of the series (81%, and 100% on the multilingual prompts), but weak on complexity and risk. **Kev-4B is the recommended size**, and in my docs I wrote that it needed a 32 GB Mac. The session found two ways to try it anyway: a 3 GB 4-bit MLX conversion from another publisher, or Kev's own server, which on Apple Silicon serves through MLX automatically.

I chose Kev's own server, in **bf16**, because it speaks my `/v1/systemone` shape directly, without adapter:

```bash
git clone https://github.com/jaredpalmer/kev.git && cd kev && uv sync --extra serve
uv run --extra serve python -m kev.serve --run jaredpalmer/kev-4b --host 127.0.0.1 --port 8794
go run ./cmd/bench -providers jev,kev-4b
```

(Claude couldn't clone and install Kev by itself: the permission check blocked running external code, which is exactly what it should do. I allowed the install.)

It "fits" in the sense that it runs: **8.4 GB of bf16 weights** on a 16 GB machine that also runs a browser, an IDE and a Go benchmark. The Mac swapped about 4 to 6 GB the whole time. The **first request took 143 seconds** (loading plus warm-up), then 44 s, 6.9 s, 3.4 s… down to about **2.6 to 3 seconds per decision** once warm.

### Three ways to read Kev's confidence

Kev ships with its own calibration: a temperature **T = 2.41**, fitted on its development set. On my questions, that's far too cautious. So Kev-4B ran three times:

1.  **As shipped**;
2.  With my usual **client-side temperature**, fitted the same way as for the other models (minimise log-loss on half the prompts, measure on the other half, 20 random splits). The script first reproduced Kev-0.8B's documented value (0.46 vs 0.47) to make sure it was the same method. For Kev-4B it gave **T = 0.46**;
3.  With the temperature **inside Kev's server**: `KEV_TEMPERATURE=1.11`, which is 2.41 × 0.46. I'll explain the difference below.

| | Jev 1.13 | Kev-0.8B | Kev-4B | Kev-4B, T = 0.46 | **Kev-4B, `KEV_TEMPERATURE=1.11`** |
| --- | --- | --- | --- | --- | --- |
| Topic accuracy | **89%** | 81% | 86% | 86% | 86% |
| Topic: core / multilingual / long / tricky | 95% / 88% / 75% / 43% | | 89% / **100%** / 75% / 43% | same | same |
| Complexity exact / within ±1 | **70%** / 100% | 42% / 98% | 51% / 99% | same | 55% / 98% |
| Risk exact | 61% | 49% | 61% | 61% | **74%** |
| Answers with confidence ≥ 0.8 | 85% (94% right) | 5% | 19% (100% right) | 74% (95% right) | 74% (95% right) |
| Calibration error (ECE) | **0.067** | 0.349 | 0.280 | 0.080 | 0.084 |
| Route = gold route | **69%** | 22% | 39% | 61% | 67.5% |
| Cheaper / pricier model than gold | 5 / 20 | 4 / 58 | 3 / 46 | 14 / 17 | 11 / 15 |
| Est. model cost (gold: $1.18) | $1.33 | $1.16 | $1.13 | $0.70 | $0.87 |
| Decision latency p50 / p90 | **211 / 278 ms** | 371 ms | 2,565 / 12,510 ms | 2,699 / 3,308 ms | 2,979 / 6,386 ms |

**As shipped**, Kev-4B is already a big step from Kev-0.8B: +5 points on topic, +12 on risk (level with Jev), every multilingual prompt right. It agrees with Jev on the topic 90% of the time. But only 19% of its answers clear the 0.8 bar (all of them right!), so the router doesn't trust it and over-provisions 46 prompts. The same "right but shy" story as Kev-0.8B.

**With my temperature (T = 0.46)**, 74% of answers become confident, still 95% right, the ECE drops to 0.080 and routes matching gold jump from 39% to 61%. But something new happens: the router now **under-provisions** 14 prompts (Jev: 5). The estimated cost falls to $0.70, *below* gold's $1.18. Cheaper than the right answer isn't a win, it's a quality risk.

Why? Look at complexity and risk. Kev-4B **squeezes its answers toward the middle**: 17 of the 21 trivial prompts come out as complexity 1, 8 of the 10 expert prompts below 3, and 15 of the 16 high-risk prompts as risk 1. As long as the router didn't trust the topic, that didn't matter, because it bumped the floor anyway. Once it trusts the topic, those middle-heavy scores decide the floor, and expert prompts land on models that are too cheap.

### The fix: put the temperature where the scores are

Here is the detail I missed for a month. My router's `temperature` only rescales **choice** answers (the topic). Complexity and risk are **scores**, so they kept Kev's flat T = 2.41 distributions, and a flat distribution over 0–3 has its expected value near the middle. That's the squeeze.

Kev reads `KEV_TEMPERATURE` at start, and applies it to **every** answer. So I restarted the server with 2.41 × 0.46 = **1.11** and ran the bench with no client-side temperature:

*   Topic answers are the same as with T = 0.46 (same probabilities, applied in a different place);
*   **Risk jumps from 61% to 74%**, ahead of Jev's 61%: 8 of the 16 high-risk prompts are now read as risk 2, instead of 1;
*   Expert prompts read as complexity 3 go from 2 of 10 to **6 of 10**;
*   **Routes matching gold reach 67.5%** (Jev in the same session: 69%), with 11 under-provisioned prompts instead of 14.

That's the **closest any open model has come to Jev on routing** in this series, and the first time an open model beats Jev on risk *and* nearly matches it on routes at the same time (Clef-flash beat Jev on risk, but routed at 64%).

It's not a tuned value, though: 0.46 was fitted on topic answers only. And complexity stays the weak spot: trivial prompts are still read as complexity 1 (16 of 21), which is most of the remaining gap to Jev.

### The catch: three seconds, and a timeout

The first run with `KEV_TEMPERATURE=1.11` lost **four prompts** (three of them long) to the bench's 60-second client timeout, while the Mac was about 6 GB into swap. Since this run measures decision quality, not latency, the bench now gives Kev-4B 180 seconds, and the table shows the clean re-run. But it tells the real story: **2.6–3 s p50 and up to 12.5 s p90** is not something you put in front of every request on this machine. The 3 GB 4-bit build should avoid the swapping. That's the next thing to try.

## All the models so far

Same 80 prompts, same router, different evenings. The full table, with every metric and a prompt-by-prompt view, is on the [results page](/system-one-benchmark/).

| Model (16 GB M4 unless hosted) | Topic | Risk | Route = gold | ECE | Latency p50 |
| --- | --- | --- | --- | --- | --- |
| **Jev 1.13** (hosted, pinned) | **87.5–89%** | 60–61% | **69–75%** | 0.067–0.099 | 207–364 ms |
| Jev 1.14 (hosted) | 87.5% | 65–66% | 70–71% | **0.059–0.072** | **192–199 ms** |
| Clef-flash 9B 4-bit, T = 0.64 | **90%** | **76%** | 64% | 0.072 | 4,017 ms |
| **Kev-4B bf16, `KEV_TEMPERATURE=1.11`** | 86% | 74% | 67.5% | 0.084 | 2,979 ms |
| Laya fine-tuned (480 labels), T = 0.87 | 85% | 69% | 64% | 0.082 | 319 ms |
| Kev-0.8B, T = 0.47 | 81% | 49% | 39% | **0.059** | 355 ms |
| Von 1.3 (archived) | 70% | 46% | 48% | 0.226 | 202 ms |
| Laya typed-decisions | 71% | 34% | 14% | 0.509 | 304 ms |
| VegaML 0.8B, few-shot (40 labels), T = 0.72 | 65% | 64% | 42.5% | 0.138 | 862 ms |
| Laya English (0.3.6 = 0.3.24 = 0.4.2) | 59% | 31% | 21% | 0.171 | 282 ms |
| VegaML 0.8B, zero-shot, T = 0.60 | 51% | 54% | 20% | 0.092 | 1,337 ms |

## A page for all of it

Until now, the only interactive view was the HTML report of one bench run, published on the project's GitHub Pages, and it still showed the seven-provider run of early October. Each post added a new model in a markdown table, and the results lived in JSON files spread across five git worktrees.

So, like I did for the [solar analysis](/solar-analysis/), the results now have their own page on this blog: [**/system-one-benchmark/**](/system-one-benchmark/). It's built from the raw bench files (23 runs, from 2 October to 9 November), with tabs for:

*   **Leaderboard**: every model and configuration, sortable by any metric, with a topic-vs-routing chart;
*   **Jev 1.14 vs 1.13**: the four runs, the threshold sweep and the prompts where the two versions route differently;
*   **Kev-4B**: the three temperature settings, with the complexity and risk confusion tables that show the "squeeze";
*   **Temperatures**: what a fitted temperature did for each model;
*   **Prompt explorer**: the 80 prompts with their labels, and any two runs side by side, wrong answers highlighted;
*   **Ecosystem**: the timeline of the series and of the models I checked but didn't run.

## Where it fits

*   **Jev 1.14:** better answers, pricier routes. Staying on 1.13 until outcome data says otherwise. Watch out: `jev-latest` already points to 1.14, so pin your version if you care about cost stability.
*   **Kev-4B:** the best open model for my router, *on paper*. 86% topic, 74% risk, 67.5% gold routes, Apache-2.0, multilingual. On a 16 GB Mac, at 3 seconds per decision, it's a batch tool, not a request-path tool. On a 32 GB Mac or a small GPU, it's the first open model I would seriously try in production.
*   **Laya:** no new test needed. The runtime keeps improving, and it's turning into a toolkit (with VegaML inside). For me, the next Laya step is a fine-tune with `laya-train`.
*   **Next candidates:** LiquidAI's d1-2B (after reading its license), the 4-bit Kev-4B, and maybe VegaML's few-shot heads again on the new vega-U engine.

## Lessons learned

1.  **Check the weights first, again.** 28 Laya releases, and a two-line API call to Hugging Face told me there was nothing to measure. It saved an evening.
2.  **Run a remote model twice.** Jev 1.13 moved by 2.5 points on route = gold between two runs, ten minutes apart. Without the second run, I couldn't have said whether 1.14's differences were real.
3.  **A better classifier isn't a cheaper router.** 1.14 wins on risk and calibration, and still costs 10% more, because the router's behaviour depends on *how often* the model is confident, not only on how right it is.
4.  **Put the temperature where the uncertainty is.** A client-side temperature on choice answers only fixed the topic, and made Kev-4B under-provision. The same temperature, applied by the server to every answer, fixed risk too. The place where you calibrate matters as much as the value.
5.  **"Cheaper than gold" is a bug, not a feature.** A routed cost below the gold route means some prompts got a model that's too weak for them.
6.  **Memory-bound models need patient benchmarks.** Swapping turned a 3-second model into a 12-second p90 and four timeouts. Measure quality with generous timeouts, and latency separately.
7.  **The ecosystem is exploding.** From a handful of names in September to dozens of repositories a day. A fixed benchmark, with my own labels, is the only way I've found to keep my head above water.

The code and the full write-up are in [mmornati/system-one-router#13](https://github.com/mmornati/system-one-router/pull/13), with the setup in [docs/benchmark.md](https://github.com/mmornati/system-one-router/blob/main/docs/benchmark.md). If you run Kev-4B on a bigger Mac, or the 4-bit build, I'd love to see your latency in the comments.

## How it was built

One Claude Code session with Opus 5.5 on the system-one-router repository. I asked it whether there was a new System One model or Laya version worth testing, keeping the same benchmark. It checked PyPI, Hugging Face and OpenRouter, compared Laya's weight dates, read the model cards of a dozen candidates, and came back with a ranked list: Jev 1.14 and Kev-4B first, LiquidAI d1 next, the rest skipped with reasons. I picked "Jev 1.14 + Kev-4B". It added the providers to the bench, ran Jev twice, swept the threshold, found the Python/Go rounding gotcha, and wrote the docs. For Kev-4B, it asked before cloning and installing external code, then ran the three configurations and suggested the server-side temperature, which I started myself. For this post, a second session read that transcript and the raw result files, wrote the text, and built the results page. My part was choosing what to test, and starting the servers.
