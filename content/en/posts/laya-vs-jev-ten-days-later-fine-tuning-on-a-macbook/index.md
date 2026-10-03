---
title: 'Laya vs Jev, Ten Days Later: New Rivals, a Fine-Tune on My MacBook, and a Reality Check in Home Assistant'
categories:
- ai-coding-agents
tags:
- ai
- llm
- ai-routing
- jev
- laya
- fine-tuning
- benchmark
- home-assistant
- apple-silicon
date: '2026-10-03T09:00:00.000000+00:00'
draft: false
slug: laya-vs-jev-ten-days-later-fine-tuning-on-a-macbook
translationKey: laya-vs-jev-fine-tuning
cover: cover.jpg
showHero: true
description: A follow-up to the system-one-router benchmark. Laya went from 0.3.6 to 0.3.24 (same weights), three more open decision models joined the benchmark, and I fine-tuned Laya on my own labels on an M4 MacBook, with the exact commands, outputs and timings. Then I replayed 80 real Home Assistant decisions through Laya to see whether it could replace Jev in the house.
summary: Laya says "fine-tune me", so I did, on a 16 GB MacBook. Here is the recipe, how long it takes, what it changes on the 80-prompt benchmark, and why my house still runs on Jev.
projects:
- ha-decision-models
---

Ten days ago, in the [system-one-router post](/system-one-router-picking-the-right-llm-for-every-prompt/), I benchmarked two "System One" decision models: **Jev**, TypeSafe's hosted model, and **Laya**, the open-weights alternative from Convai Innovations. The verdict was clear. Jev was usable as-is (89% topic accuracy, well calibrated), and Laya zero-shot was not (59%, and so unsure of itself that the router over-provisioned almost every request). I closed with "if Laya gets fine-tuned before I get to it, I'd like to hear about it".

Nobody wrote, so I got to it. Ten days is a long time in this corner of the AI world: Laya shipped 18 releases, a handful of new Jev-like models appeared, and Laya's own README now says it plainly, *treat Laya as a fast base to specialise, not as a zero-shot decision engine*. So this post does three things:

1.  re-runs the benchmark with the new Laya and three new open models;
2.  **fine-tunes Laya on my own labels, on my M4 MacBook**, with the real commands, outputs and timings;
3.  goes back to my house, where Jev now judges my [Home Assistant automations](/jev-home-assistant-letting-a-decision-model-judge-my-automations/), and replays 80 real decisions through Laya to check what I [said about running it locally](/jev-home-assistant-history-feedback-and-the-local-model-question/).

As before, the test machine is an Apple M4 with 16 GB of RAM.

## Laya 0.3.6 → 0.3.24: new code, same model

Between the first benchmark (23 September) and today, Laya went through 18 releases: MPS autocast, tokenizer reuse, length grouping, language-routing fixes, temperature tooling, a TypeScript SDK… All of that is runtime code. The weights and calibration files on Hugging Face are **byte-identical** to what I tested the first time, so I expected identical numbers, and that's what I got:

| | 0.3.6 | 0.3.24 |
| --- | --- | --- |
| Laya English, topic accuracy | 59% | 59% |
| Laya multilingual, topic accuracy | 45% | 45% |
| Laya auto, topic accuracy | 58% | 56% (one prompt) |
| Calibration error, latency | — | within 0.003 and 10 ms |

The upgrade is safe, and it changes nothing for routing. Jev, re-measured on the same day, barely moved too: 89% topic accuracy, 72% of routes identical to the gold route, 268 ms median latency.

## The new crowd

When I wrote the first post, Laya was "the" open alternative. It isn't anymore. I picked the ones that are Apache-2.0, run on a 16 GB Mac, and say they were **not** trained on Jev's outputs. That last point matters: TypeSafe's [customer agreement](https://typesafe.ai/legal/mca) forbids using Jev's output "to perform model distillation" or to train a model that imitates it, and a few of the community models are exactly that.

*   **Laya typed-decisions**: a third checkpoint that was sitting in Laya's repository all along. It's the English model fine-tuned on the [typed-decisions](https://huggingface.co/datasets/LocalLLaMA/typed-decisions) dataset (2,000 decisions across four workflows).
*   **[Von 1.3](https://huggingface.co/wfzyx/von)**: a 395M ModernBERT-large with an option-marker head, 8k context, English only.
*   **[Kev-0.8B](https://huggingface.co/jaredpalmer/kev-0.8b)**: a LoRA plus a pointer head on Qwen3.5-0.8B, served through MLX. The recommended Kev-4B needs a 32 GB Mac, so I couldn't test it.

All three speak the same request format as Jev, so system-one-router needed no adapter, just a URL. The 80-prompt benchmark, same prompts, same router, same config:

| | **Jev 1.13** | Laya English | Laya typed-decisions | Von 1.3 | Kev-0.8B |
| --- | --- | --- | --- | --- | --- |
| Topic accuracy | **89%** | 59% | 71% | 70% | 81% |
| Complexity exactly right | **72%** | 45% | 41% | 55% | 42% |
| Risk exactly right | **61%** | 31% | 34% | 46% | 49% |
| Confident answers (≥ 0.8) | 84% (94% right) | 12% | 0% | 74% (75% right) | 5% |
| Calibration error (lower is better) | **0.068** | 0.171 | 0.509 | 0.226 | 0.349 |
| Same route as gold | **72%** | 20% | 12% | 48% | 22% |
| Cheaper / pricier model than gold | 3 / 19 | 3 / 61 | 0 / 70 | 15 / 27 | 4 / 58 |
| Est. model cost (gold $1.18, always Opus $2.40) | $1.37 | $1.74 | $2.32 | $0.99 | $1.16 |
| Decision latency p50 | 268 ms | 300 ms | 334 ms | 216 ms | 371 ms (MLX) |

Three different personalities:

*   **Laya typed-decisions** is the best Laya on topic (71%), but it is *never* confident. Not once in 80 prompts. The router treats every decision as unsure, bumps the complexity, and sends 70 of 80 prompts to a pricier model than needed. It's the most expensive router in the table, and each of its decisions is free.
*   **Von** routes closest to gold out of the box (48%), and it's the cheapest. But that's partly for the wrong reason: it's over-confident, and 15 prompts end up on a model that is too weak for them. In a router, that's the bad direction to be wrong in.
*   **Kev-0.8B** is the best open topic classifier: 81%, and 100% on the multilingual prompts, with a 0.8B model. But it's very under-confident, so it over-provisions like Laya does.

The [interactive report](https://mmornati.github.io/system-one-router/) has all seven providers side by side, prompt by prompt.

### A cheap trick before training: rescale the confidence

Look at the table again: for Kev and Laya typed-decisions, the problem is less "wrong answers" than "right answers given with 40% confidence". And my router punishes low confidence by design. A model that is right but unsure still costs money.

The textbook fix is **temperature scaling**: divide the logits by a constant *T* before the softmax. It doesn't change which option wins, only how sure the model sounds about it. I added an optional `temperature` per provider to system-one-router, and fitted *T* on half the prompts, measuring on the other half (20 random splits):

| | Kev-0.8B | Laya typed-decisions | Von 1.3 |
| --- | --- | --- | --- |
| Fitted T | 0.47 | 0.43 | 2.47 |
| Calibration error, before → after | 0.349 → **0.059** | 0.509 → 0.072 | 0.226 → 0.236 |
| Same route as gold, before → after | 22% → **39%** | 12% → 25% | 48% → 36% |

With *T* = 0.47, Kev is as well calibrated as Jev (0.059 vs 0.068). For Von it doesn't help: its mistakes are *confident* ones, and no rescaling can separate a confident wrong answer from a confident right one. One honest caveat: 80 prompts is small, so treat these values as a starting point.

But even a perfectly calibrated Kev only matches the gold route 39% of the time. The bottleneck has moved: **for every open model, topic is no longer the weak part; complexity and risk are.** And no temperature will teach a model what "complexity 2" means *in my config*. That needs training.

## Fine-tuning Laya on a MacBook

Laya's README is very direct about it: on the typed-decisions benchmark, the base checkpoints score close to chance zero-shot (0.36 against a 0.32 random baseline), and the fine-tuned one reaches 0.766, above Jev's published 0.727. Convai ships two training paths: a Kaggle notebook for two free T4 GPUs, and a [standalone script for Apple Silicon](https://github.com/NandhaKishorM/laya/blob/v0.3.24/notebooks/laya_finetune_typed_decisions_mps.py). The method is called RLCD: a policy-gradient step whose reward is a *proper scoring rule* (it rewards a probability for being both right and honest), combined with plain cross-entropy, then a temperature fit per question type. I read the script before running it, as I did for the package: Hugging Face downloads, safetensors, no remote code.

### First rule: train on your own labels, not on Jev's

In the router post, my plan was to *"fine-tune Laya on logged Jev decisions"*. Shadow mode was even logging them for me. I dropped that plan: training a model on Jev's answers is exactly the distillation TypeSafe's terms forbid. And, thinking about it, it was the wrong goal anyway. I don't want a copy of Jev; I want a model that knows what "complexity 2" means *in my config*.

So the labels have to be mine. For this experiment I needed more than the 80 benchmark prompts (which must stay a test set), so I had the agent write **480 new labelled prompts**: 48 per topic, complexity 0 to 3, risk 0 to 2, 10% with (obviously fake) secrets or personal data, 45 in French, Italian, Spanish or German, 30 long ones with stack traces or diffs, a few prompt injections. Then I checked they don't overlap with the benchmark: the closest pair shares a third of its words ("fix it" vs "deploy it"). In real life, the better source is your own traffic: logged requests, labelled by hand, plus the check and feedback outcomes the gateway already records.

### Step 1: setup (5 seconds and 800 MB)

```bash
uv venv --python 3.12 train/.venv
uv pip install --python train/.venv/bin/python laya==0.3.24 datasets pyyaml
mkdir -p train/work && cd train/work
curl -sLO https://raw.githubusercontent.com/NandhaKishorM/laya/v0.3.24/notebooks/laya_finetune_typed_decisions_mps.py
# only the English checkpoint, not the whole repository
../.venv/bin/python -c "from huggingface_hub import snapshot_download as s; \
  s('convaiinnovations/laya', local_dir='laya_base', \
    allow_patterns=['model.safetensors','rl_agent_config.json','encoder/*','tokenizer/*'])"
```

### Step 2: turn labels into training items

This is the step where it's easy to get it subtly wrong. The model must be trained on **exactly** what it will see at inference: the same question wording, the same options in the same order, the same state shape. So `train/build_items.py` imports Laya's own `build_sequence` and rebuilds the router's four questions word for word. One trap I only caught by reading the Go code: the gateway sends the topics as a Go map, and Go's JSON encoder **sorts map keys**. So Laya sees the options in alphabetical order, not in `config.yaml` order, and the training items must match.

Each prompt becomes four items (topic, complexity, risk, private data). The targets are the labels with a bit of smoothing (90% on the label, the rest mostly on the neighbouring levels for scores), because hard 100% targets teach a model to be over-confident:

```bash
train/.venv/bin/python train/build_items.py train/data/train_cases.json train/work/route_items.pt
1920 items from 480 cases -> train/work/route_items.pt (skipped 0)
```

### Step 3: train (41 minutes)

Convai's recommendation for a 16 GB MacBook is one example at a time, with gradients accumulated over 32:

```bash
cd train/work
../.venv/bin/python laya_finetune_typed_decisions_mps.py --model-dir ./laya_base \
  --items ./route_items.pt --output-dir ./laya-route \
  --micro-batch 1 --grad-accum 32 --epochs 4
```

```text
00:10:39 Using legacy cached training items without metadata: route_items.pt
00:10:40 Device: mps
00:10:40 Training items: 1728; calibration items: 192
00:10:40 micro_batch=1; grad_accum=32; epochs=4
00:11:18 epoch 1/4, step 100, loss=0.9694
...
00:21:04 Epoch 1/4 complete; avg_loss=0.6999
00:31:16 Epoch 2/4 complete; avg_loss=0.2924
00:41:27 Epoch 3/4 complete; avg_loss=0.0979
00:51:44 Epoch 4/4 complete; avg_loss=0.1023
00:51:47 Running temperature calibration ...
00:52:01 Model saved to ./laya-route
00:52:01 Temperatures: [1.25038480758667, 1.4553054571151733, 1.0085362195968628]
```

(The "legacy cached items" line is expected: when `--items` already exists, the script skips its own dataset.) The script keeps 10% of the items aside for the temperature fit, which will be useful in a minute.

| Apple M4, 16 GB, nothing else running | |
| --- | --- |
| Wall-clock, 4 epochs | **41.5 minutes**, about 10.3 minutes per epoch |
| Speed | ~0.36 s per training item |
| Peak memory footprint | **15.4 GB**: close the browser |
| Output | a 1.6 GB checkpoint |

**How long would it take for you?** With short prompts like mine, count about 0.36 s per item per epoch, and four items per labelled prompt: 4 epochs over *N* prompts take roughly *N* × 6 seconds. 500 prompts: under an hour. 2,000 prompts: about 3 hours, a night. For comparison, I also started the official recipe on its own dataset (6,000 items, with longer states): it ran at 0.58 s per item, so its 4 epochs would take about **3.6 hours** on this laptop. I measured the first 700 steps and stopped it there. Two things I tried that didn't help: micro-batches of 8 were *slower* on 16 GB, not faster, and running anything heavy at the same time (my Home Assistant replay, below) visibly slowed both.

### Step 4: does it work?

The sidecar got a `--checkpoint NAME=DIR` option to serve a local checkpoint, and the benchmark a matching `laya:NAME` provider:

```bash
sidecar/.venv/bin/python sidecar/laya_server.py --checkpoint laya-route=train/work/laya-route &
go run ./cmd/bench -providers jev,laya,laya:laya-route
```

```text
                                          jev                   laya        laya:laya-route
topic accuracy                          88.8%                  58.8%                  85.0%
  topic acc · tricky                    42.9%                  28.6%                 100.0%
complexity exact / ±1          72.5% / 100.0%         45.0% /  98.8%         72.5% /  98.8%
risk exact                              61.3%                  31.2%                  68.8%
confident (≥ threshold) share           85.0%                  12.5%                   0.0%
ECE (lower = better calibrated)         0.070                  0.171                  0.311
route = gold-label route                72.5%                  20.0%                  35.0%
under / over-provisioned               3 / 19                 3 / 61                 1 / 51
```

The accuracy jump is real: topic from 59% to 85%, complexity from 45% to **72.5%, the same as Jev**, risk from 31% to **69%, better than Jev**. And then the confidence line: **0%**. Not one decision reached the router's 0.8 bar, so it still plays safe and over-provisions 51 prompts. Same disease as before, in a smarter model.

The cause is partly mine: the label smoothing tells the model "never be more than 90% sure", and the router reads Laya's own `confidence` field, which is stricter than the top probability. The fix is the `temperature` from earlier, but fitted **honestly**: not on the benchmark, but on the 192 items the trainer had kept aside. A small script asks the served checkpoint the topic question for those held-out prompts and finds the *T* that minimises the log-loss:

```bash
train/.venv/bin/python train/fit_temperature.py train/data/train_cases.json train/work/route_items.pt
52 held-out cases, topic accuracy 79%, log-loss 0.766 at T=1 -> 0.748 at T=0.87
go run ./cmd/bench -providers laya,laya:laya-route -temperature laya:laya-route=0.87
```

The Jev column comes from the same night's run, hence the small differences with the table at the top (0.070 instead of 0.068, for example).

| | **Jev 1.13** | Laya zero-shot | Laya fine-tuned | **Laya fine-tuned, T = 0.87** |
| --- | --- | --- | --- | --- |
| Topic accuracy | **89%** | 59% | 85% | 85% |
| Complexity exactly right | **72.5%** | 45% | **72.5%** | **72.5%** |
| Risk exactly right | 61% | 31% | **69%** | **69%** |
| Confident answers (≥ 0.8) | 85% (94% right) | 12.5% | 0% | 86% (90% right) |
| Calibration error | **0.070** | 0.171 | 0.311 | 0.082 |
| Same route as gold | **72.5%** | 20% | 35% | 64% |
| Cheaper / pricier model than gold | 3 / 19 | 3 / 61 | 1 / 51 | 9 / 20 |
| Est. model cost (gold $1.18) | $1.35 | $1.74 | $1.80 | **$1.28** |
| Decision latency p50 (M4 GPU) | 250 ms | 283 ms | 308 ms | 319 ms |
| Decision cost | $0.04 / 1k | $0 | $0 | $0 |

From 20% to **64%** of routes identical to the gold route, with a calibration almost as good as Jev's, and a routed cost slightly *below* Jev's. For 41 minutes on a laptop and 480 labelled prompts, that's much more than I expected. Of all the open models I've tested, it's the first one I'd actually consider plugging into the gateway.

Now the caveats, because they matter:

*   **The labeller is the same.** The 480 training prompts and the 80 gold labels were written by the same kind of labeller (an LLM agent following the same conventions). Part of the gain is the model learning *that* labeller's idea of complexity and risk. That's the point of fine-tuning (it's my config's idea, not a generic one), but it's also why it can beat Jev on risk. On someone else's labels, the gap would be smaller.
*   **The groups are tiny.** 100% on the "tricky" group sounds great, but it's 7 prompts.
*   **It's less careful than Jev.** 9 prompts go to a weaker model than gold, against 3 for Jev. That's the direction I like least. A higher `confidence_threshold` or temperature would trade some savings for safety.
*   **Jev still wins on the hard part**: when it's sure, it's right 94% of the time, and it does that zero-shot, on any question you invent tomorrow. My Laya is good at *these four questions*. Ask it something else, and you're back to the base model.

The recipe, the scripts and the labelled prompts are in the repository: [docs/fine-tuning.md](https://github.com/mmornati/system-one-router/blob/main/docs/fine-tuning.md).

## Back to the house: can Laya judge my automations?

The router is one use case. The other one, the one that runs 24/7, is my house: since [the first Home Assistant post](/jev-home-assistant-letting-a-decision-model-judge-my-automations/), Jev answers the "is this normal?" questions my threshold rules can't, always next to the rule, in shadow mode first. In the [second one](/jev-home-assistant-history-feedback-and-the-local-model-question/), a Mastodon reader asked why not a small local model, and I explained why I didn't go local on an N100 mini PC. This was a good moment to check that answer with numbers instead of arguments.

### First, how Jev is doing in the house

The scoreboard was reset on Sunday 27 September, so this is one week of the new prompts (with the compact history and the humidity baseline from the second post), straight from the live instance:

| Decision | Asked | Disagreed with the rule | Feedback "who was right?" |
| --- | --- | --- | --- |
| VMC (speed choice) | 265 | **17** (6%) | Jev 3, rule 0 |
| Shutters vs heat (yes/no per cover) | 198 | 6 (3%) | — |
| Watering tonight? | 5 | 0 | — |
| Presence simulation (room choice) | 4 | 4 | — |
| Laundry, water, temperature drop, water heater | 6 | 0 | — |

The VMC is the interesting line. In the second post, it disagreed with the rule on **every single call**, always with a confidence too low to act. With the history in the prompt, it now disagrees 6% of the time, and on the three disagreements I answered from the phone notification, Jev was right all three times (one of them, a shower on Friday evening, is in the examples below). The presence simulation is new and still in its "Jev and the rule pick different rooms" phase, which is fine: the rule there is a weighted random choice, so disagreement is expected.

Cost-wise, nothing changed: yesterday was 84 calls, 118k input tokens, **half a cent**.

### Replaying 80 real house decisions through Laya

To compare Laya with Jev on *house* questions rather than routing prompts, I needed the real requests. Home Assistant only logs the outcome of each decision ("jev=True (p=0.71) rule=False"), not the facts it sent, so I had Claude Code rebuild them, read-only:

*   the question definitions (instructions, options, thresholds) come straight from my config repository;
*   the current facts were rendered on the live instance with the real templates;
*   past moments, especially the logged disagreements, were rebuilt from the logbook, the timeline sensor and the recorder readings. For 11 of the 19 logged moments, a fresh Jev call reproduced the logged probability within ±0.1, so most reconstructions are faithful, but not all of them;
*   every payload went to Jev, to Laya English and to Laya multilingual, both on the **CPU with 4 threads**, to get closer to my 4-core N100.

80 payloads in total, 80 Jev calls, $0.0043. The results, with each answer turned into yes/no at the threshold the automation really uses (0.6 for the VMC, 0.7 for the shutters and the watering, 0.8 for the water):

| Decision | n | Laya EN = Jev | Laya multilingual = Jev | Jev's p | Laya EN's p | Laya multilingual's p |
| --- | --- | --- | --- | --- | --- | --- |
| VMC | 19 | 15 | 4 | 0.07 – 0.75 | 0.52 – 0.61 | 1.00, always |
| Shutters | 18 | 15 | 3 | 0.14 – 0.86 | 0.54 – 0.57 | 0.72 – 0.99 |
| Water flow | 15 | 12 | 4 | 0.09 – 0.85 | 0.46 – 0.54 | 0.85 – 0.98 |
| Watering | 12 | 12 | 0 | 0.12 – 0.61 | 0.52 – 0.54 | 0.98 – 0.99 |

Don't be fooled by the "Laya EN = Jev" column. Laya English answers **about 0.5 to everything**: its probabilities span 0.46 to 0.61 over 64 yes/no questions. It "agrees" with Jev only because 0.5 is below every threshold, so it never acts, and Jev usually doesn't either. Its rank correlation with Jev's probabilities is even slightly negative on the VMC and the shutters. The multilingual checkpoint has the opposite problem: it says **yes** to almost everything, with high confidence, including to "is the kitchen light on?" when the state says it's off.

Four moments make it concrete:

*   **Friday 20:00, a shower.** Upstairs bathroom humidity from 67% to 82%, outdoor air drier than indoor. Jev: 0.75, boost the VMC (and I had answered "Jev was right" on my phone that evening). Laya EN: 0.52, no. Laya multilingual: 1.00.
*   **Friday 19:56, 11 L/min of water** just after we came home. Jev: normal (0.67), cause "shower or bath" at 0.93. Laya EN: 0.49, cause "other" at 0.06. Laya multilingual: 0.96, cause "toilet running".
*   **A night leak.** 0.8 L/min, flat, for hours, at 04:30, no humidity change anywhere. Jev: 0.11, suspicious, cause "leak". Laya multilingual: **0.97, normal**. That's above the 0.9 bar for leaks, so in active mode it would have *suppressed the leak alert*. That's the one that would cost money.
*   **Hot afternoon, living room**, 27.8 °C outside and full sun. Jev: 0.86, lower the shutters. Laya EN: 0.54. Laya multilingual: 0.99, but it also said 0.94–0.97 on rainy, cool days.

And the practical side:

| | Jev (network) | Laya EN, CPU 4 threads | Laya multilingual, CPU 4 threads |
| --- | --- | --- | --- |
| Latency, median / p95 | 310 / 479 ms | 684 / 2,221 ms | 329 / 1,635 ms |
| Water (3 questions in one call) | 315 ms | 1,487 ms | 1,435 ms |
| Payloads cut by the context window | 0 / 80 (32k tokens) | **64 / 80** (512 tokens) | 34 / 80 (1,024 tokens) |

That's an M4 core, much faster than an N100 core, so on the mini PC multiply by "several". Part of the p95 is also my own fault: the first attempt at the fine-tune above was running on the GPU at the same time.

### What I got wrong in the earlier posts

Replaying real requests is humbling, so let me correct three things I wrote:

1.  **"My requests are around 300 tokens, which fits in 512."** That was true for the first version. Since the second post added compact history to every decision, the requests are **1,000 to 1,900 tokens**. The fix for "Jev has no memory" is exactly what makes them too long for Laya English: it reads less than half of a VMC request. For Jev, with 32k tokens, it's nothing.
2.  **"I'd use the multilingual checkpoint, which reads the French names better."** The payloads are English by design (only a few entity names and "Vitesse 2" are French), and the multilingual checkpoint is the worst of the two here. Language was never the problem. Also, sending a shorter request without the history series didn't help either checkpoint.
3.  **"When Laya is confident, it's right."** True on routing prompts. On house questions, Laya English is simply never confident, and the multilingual one is confident and wrong. The routing benchmark didn't transfer, which is a good reminder that a benchmark measures *its* questions.

The second post's conclusion holds, with numbers now: on my hardware and my questions, zero-shot Laya is not an option, and it's not about the CPU. The house stays on Jev.

### The Home Assistant side of the alternatives

If you want to try anyway, the ecosystem moved quickly too. [HA-Jev](https://github.com/AboveColin/HA-Jev), the integration I use (sensors, `jev.noul` / `jev.choice` / `jev.score` / `jev.ask` actions, an Assist agent), is still cloud-Jev only and installs as a HACS custom repository; several forks exist. There are also narrower components like [ha-conversation-jev](https://github.com/luxus/ha-conversation-jev) (a Jev fast path for lights, climate and covers) and "Gut Check", a weekly health check of your installation. For local models, the most practical bridge I found is [Decidealot](https://hub.docker.com/r/psyb0t/decidealot), a Docker service that serves Laya, Von or CLM behind a TypeSafe-compatible REST API: in theory, you point HA-Jev's custom address at it. I haven't tried it, and after the replay above I'd only plug a *fine-tuned* model into it.

## What's next

Where this leaves the two projects:

*   **system-one-router**: the fine-tuned Laya becomes a real option for `decision.provider: auto`, where private prompts are decided locally. Before using it as the main provider, I want it trained on *real* traffic: a few hundred logged requests labelled by hand, plus the check and feedback outcomes the gateway already logs. Kev, which ships its own `kev-finetune`, deserves the same treatment, ideally the 4B version on a bigger machine.
*   **Home Assistant**: the house stays on Jev. The route to a local model is now clear, though: the scoreboard's "who was right?" answers and the automatic outcome checks (the pump really stopped, the leak alert was or wasn't a leak) are labels that are *mine*, not Jev's. A few weeks of those, a fine-tune with the multilingual checkpoint and its 1,024-token window (or a smaller payload, the history is the long part), and it gets interesting. At the current pace of disagreements, though, collecting enough of them will take a while, which is also good news about Jev.

## Lessons learned

1.  **A new version is not a new model.** 18 Laya releases, zero change in the numbers: the weights didn't move. Check what actually changed before re-running a benchmark, and re-run it anyway.
2.  **Zero-shot decision models are a base, not a product.** Laya's own README says so, and the jump from 20% to 64% of good routes after 41 minutes of training shows it.
3.  **Calibration is half of the job, again.** The fine-tuned model went from "never confident" to "as calibrated as Jev" with one number, *T* = 0.87. Fit it on held-out data, never on your test set.
4.  **Train on your own labels.** It's what TypeSafe's terms require, and it's also what you actually want: a model that knows your definitions, not a copy of someone else's.
5.  **A laptop is enough.** 480 prompts, 41 minutes, 15 GB of memory. The expensive part is the labels, not the GPU.
6.  **Replay real requests before believing a benchmark.** The routing benchmark said "when Laya is confident, it's right". My house said otherwise, and the history I added for Jev made the requests too long for Laya anyway.

The code, the training scripts and the 480 labelled prompts are on GitHub: [mmornati/system-one-router](https://github.com/mmornati/system-one-router), and the [benchmark report](https://mmornati.github.io/system-one-router/) is live. If you fine-tune a decision model on your own data, especially for Home Assistant, I'd really like to compare notes in the comments.

## How it was built

Same setup as the previous posts: one Claude Code session with Opus 5.5. A first session upgraded Laya, added Von and Kev to the benchmark and opened the pull request. This one checked that work, searched for the newer models, measured the official training recipe, wrote the 480 labelled prompts (with a sub-agent) and the training scripts, ran the fine-tune and the benchmarks, and replayed the Home Assistant decisions (with another sub-agent, read-only on the live instance). My part was choosing what to measure, challenging the results (the 0% confidence line was the moment to stop and think), and deciding what to keep.
