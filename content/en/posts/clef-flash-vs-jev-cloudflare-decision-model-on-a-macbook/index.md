---
title: 'Clef-flash vs Jev: Cloudflare''s Open Decision Model on a 16 GB MacBook'
categories:
- ai-coding-agents
tags:
- ai
- llm
- ai-routing
- jev
- clef
- cloudflare
- benchmark
- mlx
- apple-silicon
date: '2026-10-04T19:00:00.000000+00:00'
draft: false
slug: clef-flash-vs-jev-cloudflare-decision-model-on-a-macbook
translationKey: clef-flash-vs-jev
cover: cover.jpg
showHero: true
description: Cloudflare released Clef and Clef-flash, two open-weights "System One" decision models that speak Jev's API. I ran the 9B Clef-flash, at 4-bit with MLX, through the system-one-router benchmark on an M4 MacBook. It is the first open model to match Jev on topic accuracy, and it beats Jev on risk, but at about 4 seconds per decision it can't sit in the request path on this machine.
summary: Three days after Cloudflare's announcement, Clef-flash went through the same 80-prompt benchmark as Jev, Laya, Von and Kev. 90% topic accuracy, a confidence temperature that brings it level with Jev on calibration, and one problem no temperature can fix on a laptop.
projects:
- ha-decision-models
---

I closed [yesterday's post](/laya-vs-jev-ten-days-later-fine-tuning-on-a-macbook/) by saying that the open decision models had caught up with Jev on topic, but not yet on complexity and risk. I didn't expect the next candidate to show up the same week, and certainly not from **Cloudflare**.

This is the fourth post of a series. If you're arriving here:

1.  [system-one-router](/system-one-router-picking-the-right-llm-for-every-prompt/): a Go gateway that asks a "System One" decision model four typed questions about each prompt (topic, complexity, risk, private data) and picks the cheapest LLM good enough to answer it, with an 80-prompt benchmark;
2.  [Jev in Home Assistant](/jev-home-assistant-letting-a-decision-model-judge-my-automations/) and its [follow-up](/jev-home-assistant-history-feedback-and-the-local-model-question/): the same kind of model judging my house automations;
3.  [Laya vs Jev, ten days later](/laya-vs-jev-ten-days-later-fine-tuning-on-a-macbook/): new open models (Von, Kev), a confidence temperature, and a Laya fine-tune on my MacBook.

This one is shorter: one new model, the same benchmark, the same laptop.

## Clef and Clef-flash in a nutshell

On 1 October, Cloudflare [announced **Clef** and **Clef-flash**](https://blog.cloudflare.com/clef-decision-models/), two "decision models" in the same family as Jev and Laya. They don't write prose. You give them a question and a schema (pick one of these options, give a score, yes or no) and they return a probability for every allowed answer. Cloudflare's pitch is exactly the use case of this series: routing, classification, tool selection, triage, all the small decisions an agent makes before it does anything expensive.

What's inside:

*   **Clef** is built on a frozen **Qwen 3.8-27B**; **Clef-flash** on a frozen **Qwen 3.5-9B**. Both add low-rank adapters and a **joint schema head**: instead of generating an answer token by token, the model reads the prompt once, lets each valid option "look" at the relevant context, and scores all options in parallel. That's why the output is always one of the allowed answers, with a probability, and why it is fast on the right hardware.
*   **64k tokens of context** (twice Jev's 32k) and a **vision encoder**, so they can classify images as well as text.
*   **Open weights under Apache 2.0** on Hugging Face ([Cloudflare/clef](https://huggingface.co/Cloudflare/clef), [Cloudflare/clef-flash](https://huggingface.co/Cloudflare/clef-flash)), and hosted on **Workers AI** as `@cf/cloudflare/clef` and `@cf/cloudflare/clef-flash`.
*   **Jev-API compatible.** For me, this is the important line: system-one-router already speaks that format, so adding Clef-flash to the benchmark meant adding a URL, not an adapter.

Cloudflare's own numbers are ambitious. On their latency test across 43 evaluations, Clef-flash answers in **38.8 ms median** (122 ms p95), Clef in 209 ms, and Jev in 524 ms. On quality, they report Clef-flash ahead of Jev on tool-calling and intent benchmarks (BFCL 98.8% vs 95.8%, API-Bank 93.1% vs 88.2%), and Clef ahead on BANKING77 and CLINC150, while Jev keeps the lead on a couple of them (When2Call, BRIGHT). Their table also includes Kev-9B and Laya, which is a nice touch. The announcement comes with a reinforcement-learning fine-tuning service, starting with hands-on help from their engineers and becoming self-serve later.

Those are Cloudflare's benchmarks, on Cloudflare's servers. Mine are less glamorous: 80 routing prompts and a 16 GB M4 MacBook.

## Will it run on my Mac?

The first question was whether either model fits. Short answer: **Clef-flash at 4-bit, yes. Clef, no.**

| Variant | Download | Peak memory | On an M4 with 16 GB? |
| --- | --- | --- | --- |
| Clef-flash, full precision (bf16) | ~19 GB | > 16 GB | No |
| [`mlx-community/clef-flash-4bit`](https://huggingface.co/mlx-community/clef-flash-4bit) | 6.2 GB | 7.0 – 8.6 GB | **Yes** (16 GB is its stated minimum) |
| Clef-flash 8-bit | 10.7 GB | 11.4 – 13 GB | Risky: macOS gives the GPU only 70–75% of RAM |
| Clef 27B, 4-bit or 8-bit | 16 – 30 GB | 17 – 33 GB | No, needs a 32 GB Mac or more |

There is **one trap**, and it's worth knowing before you download anything. The decision head that produces the answers lives in a **separate file** (`joint_head.safetensors`). The GGUF builds you'll find for Ollama or LM Studio load the Qwen backbone *without* it, and the MLX model page warns they "produce meaningless text". The `mlx-community` 4-bit conversion is the one that ships the head plus a loader script, `clef_mlx.py`, which includes a small `/v1/systemone` server. Two other MLX conversions had a shorter loader without the server.

As with Laya and Kev, I read the loader in full before running it (786 lines, no remote code, safetensors only) and skipped the `__pycache__` folder that the repository also ships. Then:

```bash
uv venv -p 3.12 clef-venv && uv pip install -p clef-venv/bin/python "mlx==0.32.3" "mlx-lm>=0.32,<0.33" \
  "mlx-vlm>=0.7.4,<0.8" huggingface_hub pillow
SNAP=$(clef-venv/bin/python -c "from huggingface_hub import snapshot_download as d; \
  print(d('mlx-community/clef-flash-4bit', ignore_patterns=['__pycache__/*']))")
clef-venv/bin/python $SNAP/clef_mlx.py serve --model $SNAP --name clef-flash --port 8792 --quiet
```

A first test ticket went to `technical` with 0.94 confidence. On the benchmark side, the change was a new `clef-flash` provider and a `-clef-url` flag in `cmd/bench`, a dozen lines. Clef-flash gets the same 6,000-character state limit as Jev, Von and Kev, so the comparison is fair.

## The benchmark: 80 prompts, Jev re-run the same evening

Same 80 labelled prompts as in the previous posts, same router, same config. Jev was re-run in the same session as the reference, so its numbers move a little compared with yesterday's table (75% of routes identical to gold instead of 72%; that's the noise of a remote model on 80 prompts).

This is the summary from the HTML report the benchmark generates:

![Benchmark report summary: Jev 1.13 (OpenRouter) vs Clef-flash 9B (local, MLX 4-bit) on 80 prompts. Topic accuracy 89% vs 90%, risk exact 61% vs 76%, complexity exact 70% vs 64%, confident answers 86% vs 56%, route matches gold 75% vs 52%, latency p50 258 ms vs 3854 ms](/images/clef-flash-benchmark/report-summary.webp)

The same numbers in a table:

| | **Jev 1.13** | **Clef-flash 9B, MLX 4-bit** |
| --- | --- | --- |
| Topic accuracy | 89% | **90%** |
| Topic: core / multilingual / long / tricky | **95%** / 88% / 75% / 43% | 89% / **100%** / **100%** / **71%** |
| Complexity exactly right / within ±1 | **70%** / 100% | 64% / 100% |
| Risk exactly right | 61% | **76%** |
| Confident answers (≥ 0.8) | 86% (93% right) | 56% (**98%** right) |
| Calibration error (lower is better) | **0.080** | 0.101 |
| Same route as gold | **75%** | 52.5% |
| Cheaper / pricier model than gold | 3 / 17 | **0** / 38 |
| Est. model cost (gold $1.19, always Opus $2.35) | **$1.34** | $1.57 |
| Decision latency p50 / p90 | **258 / 332 ms** | 3,854 / 5,477 ms |
| Decision cost per 1,000 requests | $0.04 | $0 |

Three things stand out.

**It's the first open model that matches Jev on topic.** 90% against 89%. Laya was at 59%, Kev-0.8B at 81%. And it's better than Jev exactly where Jev is weak: 71% on the "tricky" prompts (Jev 43%), 100% on the long and multilingual ones. On risk it beats Jev by 15 points, which none of the other zero-shot models came close to. Clef-flash agrees with Jev on the topic 85% of the time.

**It's accurate but cautious.** Only 56% of its answers are above the router's 0.8 confidence bar. When it *is* confident, it's right 98% of the time, better than Jev's 93%. But my router treats an unsure answer as a reason to play safe, so it bumps the complexity and sends the prompt to a bigger model. Result: 38 prompts go to a pricier model than needed. On the plus side, it never routed a prompt to a model *weaker* than gold. If I have to choose a direction to be wrong in, that's the right one.

You can see it in the "where requests would go" bar: fewer prompts on the cheap Qwen, more on Sonnet and Opus.

![Where requests would go: Jev sends 20 prompts to qwen3.7-flash, 25 to gpt-5.6-luna, 20 to claude-sonnet-5 and 14 to claude-opus-5.5; Clef-flash sends 10, 23, 27 and 18](/images/clef-flash-benchmark/report-routes.webp)

**It's slow, on this Mac.** 3.9 seconds median per decision, against 258 ms for Jev, which runs remotely. More on that below.

The per-prompt table of the report shows what "cautious" looks like in practice. On `rename-var` ("rename the variable `tmp` to `retryCount` in this function"), the gold label is code-gen, complexity 0, to the cheapest model. Jev says code-gen at 75% and sends it to gpt-5.6-luna. Clef-flash says code-*review* at 63% and, being unsure, sends it to Claude Sonnet. Not wrong, but expensive for a rename.

![Per-prompt rows of the report: case, prompt, gold labels and model, then Jev's and Clef-flash's topic with confidence, complexity, risk, private-data probability, chosen model and latency](/images/clef-flash-benchmark/report-rows.webp)

## The temperature trick, again

In the [previous post](/laya-vs-jev-ten-days-later-fine-tuning-on-a-macbook/#a-cheap-trick-before-training-rescale-the-confidence) I added an optional `temperature` per provider: divide the logits by *T* before the softmax. It never changes which answer wins, only how sure the model sounds. It fixed Kev's calibration and didn't help Von.

Clef-flash looked like a perfect candidate: right answers given with too little confidence. Same method as before: minimise log-loss on half the prompts, measure on the other half, 20 random splits. The value was stable: **T = 0.64** at the median, between 0.55 and 0.70 for the middle half of the splits. On the held-out prompts, confident answers went from 56% to 81%, and 95% of those were right.

Then the full 80-prompt run with `-temperature clef-flash=0.64`:

| | Clef-flash | **Clef-flash, T = 0.64** | Jev 1.13 |
| --- | --- | --- | --- |
| Topic accuracy | 90% | 90% (unchanged) | 89% |
| Confident answers (≥ 0.8) | 56% (98% right) | **78%** (98% right) | 86% (93% right) |
| Calibration error | 0.101 | **0.072** | 0.080 |
| Same route as gold | 52.5% | **64%** | 75% |
| Cheaper / pricier model than gold | 0 / 38 | 2 / 27 | 3 / 17 |
| Est. model cost (gold $1.19) | $1.57 | $1.42 | $1.34 |

With one number, Clef-flash is now **as well calibrated as Jev** (0.072 vs 0.080), and routes match gold 64% of the time instead of 52.5%. Over-provisioning drops from 38 to 27 prompts, with only 2 going the wrong way. As yesterday, keep in mind that 80 prompts is small: treat 0.64 as a starting point, not a tuned value.

The remaining gap with Jev is mostly **complexity**: 64% exactly right against Jev's 70%. That's the same lesson as with every open model so far: topic is solved, and "what does complexity 2 mean *in my config*" is something a temperature can't teach.

## Why 4 seconds when Cloudflare says 39 ms?

Because the numbers aren't measured on the same thing, and the difference is mostly hardware.

*   A router request is about **750 tokens**: four questions and 19 options, plus the prompt. On the M4, the GPU needs about **3.6 seconds** just to read (prefill) that much text through a 9B model. A tiny 128-token request still takes about 0.57 s.
*   The MLX model page reports about **0.3 s** per decision for 1k-token prompts, measured on an **M5 Max**, a much bigger GPU.
*   Cloudflare's **39 ms** is on their own inference servers on Workers AI.
*   And honestly, the Mac wasn't at its best: it already had 8 GB in swap from other apps during the run.

So this isn't a verdict on Clef-flash; it's a verdict on a 9B model on a base M4. For comparison, Kev-0.8B answered in 371 ms on the same machine, but it's ten times smaller and much less accurate.

One small lesson learned along the way: the first T = 0.64 run **failed halfway**, with 49 of 80 requests in error. The Clef server was running as a background task with a 30-minute limit, and it got stopped in the middle of the run. I deleted that report, restarted the server with a longer limit, and re-ran it cleanly with zero errors. If a benchmark suddenly looks bad, check the error count before reading the accuracy.

## An open question: what was it trained on?

In the previous post I only kept models that say they were **not** trained on Jev's outputs, because TypeSafe's terms forbid distillation. Clef-flash's model card doesn't say either way. Cloudflare's blog describes internal synthetic datasets (shuffled field orders, prompts and schema structures) on top of Qwen, and nothing suggests Jev outputs were used, but the card doesn't state it explicitly. I included the model and flagged the question in the benchmark docs rather than excluding it. If someone from Cloudflare reads this, a single line on the model card would settle it.

## Where it fits

*   **In the request path, on my M4: no.** Four seconds before every LLM call is not acceptable for a router whose job is to save time and money.
*   **On a faster Mac, or on Workers AI: very probably yes.** It's the most accurate open model I've tested, it's calibrated with T = 0.64, it reads 64k tokens, and it's Apache 2.0. With Workers AI it's even a hosted alternative to Jev with a public, open-weights twin you can run yourself.
*   **Offline, already today.** system-one-router has a `shadow` mode and a `cmd/refit` tool that don't need an answer in real time. Re-labelling yesterday's traffic with Clef-flash overnight is a perfectly good use of a slow but accurate model.
*   **For the house:** I didn't run the Home Assistant replay this time. Clef-flash's 64k context removes the problem that killed Laya (my requests are 1,000 to 1,900 tokens), but on an N100 mini PC a 9B model would be far slower than on the M4. If I try it there, it will be through Workers AI, not locally.

## Lessons learned

1.  **Check the files, not just the model name.** A decision model is a backbone *plus* a head. A GGUF that loads only the backbone will run, and answer nonsense.
2.  **Accuracy isn't the whole story for a router.** Clef-flash beats Jev on topic and risk, and still routes worse, because a cautious model makes the router spend money.
3.  **Temperature scaling keeps paying off.** Kev, the Laya fine-tune and now Clef-flash: one fitted number, and calibration goes from "too shy" to "as good as Jev".
4.  **Vendor latency is measured on vendor hardware.** 39 ms on Cloudflare, 0.3 s on an M5 Max, 3.9 s on my M4. All three are true.
5.  **Look at the error count before the accuracy.** A broken run looks exactly like a bad model.

The code changes and the full write-up are in [mmornati/system-one-router#11](https://github.com/mmornati/system-one-router/pull/11), with setup instructions in [docs/benchmark.md](https://github.com/mmornati/system-one-router/blob/main/docs/benchmark.md). The [published report](https://mmornati.github.io/system-one-router/) still shows the seven-provider run from the previous post; I'll fold Clef-flash into it at the next full run. If you run Clef-flash on a bigger Mac, or Clef on Workers AI, I'd love to see your latency numbers in the comments.

## How it was built

Same setup as the rest of the series: one Claude Code session with Opus 5.5. I asked whether the new Cloudflare model could run on this Mac; the agent checked the hardware, compared the available conversions, spotted the missing-head trap in the GGUF builds, reviewed the MLX loader before running it, added the provider, ran the benchmarks, fitted the temperature, and opened the pull request. My part was deciding to go with the 4-bit build, asking for the temperature fit, and choosing what to keep.
