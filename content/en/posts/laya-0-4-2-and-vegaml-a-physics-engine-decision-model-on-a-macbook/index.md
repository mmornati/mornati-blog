---
title: 'Laya 0.4.2 and VegaML: a Decision Model That Rolls a Ball Downhill, on a 16 GB MacBook'
categories:
- ai-coding-agents
tags:
- ai
- llm
- ai-routing
- jev
- laya
- vegaml
- benchmark
- few-shot
- apple-silicon
date: '2026-10-11T19:00:00.000000+00:00'
draft: false
slug: laya-0-4-2-and-vegaml-a-physics-engine-decision-model-on-a-macbook
translationKey: laya-0-4-2-and-vegaml
cover: cover.jpg
showHero: true
description: A quick check of Laya 0.4.2 (eight releases, identical answers on all 80 benchmark prompts), then VegaML, the new "System One" model from Laya's author, a frozen Qwen3.5-0.8B plus a 14M-parameter physics engine. What it is, what the author's benchmarks say, and how it does on the system-one-router benchmark on an M4 MacBook, zero-shot, with a confidence temperature and with few-shot heads fitted from 40 labelled prompts.
summary: Laya shipped eight releases and nothing moved for routing. Its author also shipped VegaML, a decision model that answers by letting a particle settle in a valley. Zero-shot it isn't ready for my router, but it can learn from 40 labels in a minute, which none of the other models can do.
projects:
- ha-decision-models
---

A week ago I closed the [Clef-flash post](/clef-flash-vs-jev-cloudflare-decision-model-on-a-macbook/) by saying I'd fold the next candidate into the benchmark at the next full run. The next candidate came, once again, from a familiar name: **Nandakishor M**, the author of Laya, released a second "System One" model, **VegaML**. And Laya itself went through eight more releases in the meantime.

This is the fifth post of the series. If you're arriving here:

1.  [system-one-router](/system-one-router-picking-the-right-llm-for-every-prompt/): a Go gateway that asks a "System One" decision model four typed questions about each prompt (topic, complexity, risk, private data) and picks the cheapest LLM good enough to answer it, with an 80-prompt benchmark of Jev against Laya;
2.  [Jev in Home Assistant](/jev-home-assistant-letting-a-decision-model-judge-my-automations/) and its [follow-up](/jev-home-assistant-history-feedback-and-the-local-model-question/): the same kind of model judging my house automations;
3.  [Laya vs Jev, ten days later](/laya-vs-jev-ten-days-later-fine-tuning-on-a-macbook/): new open models (Von, Kev), a confidence temperature, and a Laya fine-tune on my MacBook;
4.  [Clef-flash vs Jev](/clef-flash-vs-jev-cloudflare-decision-model-on-a-macbook/): Cloudflare's 9B decision model, the first open model to match Jev on topic, but at 4 seconds per decision on my laptop.

This one has two parts: a short update on Laya, then VegaML in detail.

## Laya 0.3.24 → 0.4.2: eight releases, same answers

Between 3 and 10 October, Laya went from 0.3.24 to **0.4.2**. Like [last time](/laya-vs-jev-ten-days-later-fine-tuning-on-a-macbook/), the first question was: did the model change, or only the code around it?

Only the code. The last commit touching the weights on Hugging Face (`convaiinnovations/laya`) is from **19 September**. The three `model.safetensors` files have the same hashes, and the only Hub commit since my previous run adds a root `config.json` so that downloads are counted. So I didn't expect anything to move, but I checked anyway: same 80 prompts, all four Laya columns, on 0.4.2.

**Every topic, complexity level, risk level and confidence is identical** to the 0.3.24 run, on all 80 prompts and all four checkpoints. The largest difference in confidence is 0.0000. The training story and the expected results from the previous posts don't change: zero-shot Laya is still at 59% on topic and still too unsure of itself for the router, and the fine-tune is still the way to make it useful.

What changed upstream, and why it doesn't reach the benchmark:

| Change | Affects the benchmark? |
| --- | --- |
| **0.4.0, breaking:** `laya.Router` now sends text whose language it can't detect to the multilingual checkpoint instead of the English one | No. My sidecar does its own language routing for `laya-auto` with `laya.detect_language()`, and doesn't use `Router`. |
| `detect_language` fixes: English acronyms like MON or EST no longer read as French; a word that is English and also a foreign function word counts once | It could have moved one or two `laya-auto` prompts. It didn't. |
| Histogram-binning recalibration, stricter `min_confidence` checks | No. No published checkpoint ships new calibration files. |
| Opt-in, order-invariant "parallel" option layout | No. It needs a retrained checkpoint; the published ones stay sequential. |
| New `laya-train` CLI, Java and .NET SDKs, `LAYA_EXTRA_MODELS`, idle unload | Not for the numbers. `laya-train` is interesting for the next fine-tune. |

The sidecar pin is now `laya==0.4.2`. If you run Laya with the system-one-router sidecar, the upgrade is safe.

One thing *did* change in the report, and it's a good reminder of how the benchmark works: on 6 to 19 prompts per checkpoint, the **routed model** is different from 2 October, even though the decisions are the same. The cause is OpenRouter pricing. DeepSeek V4.1 Flash went from $0.02/$0.60 to **$0.30/$1.20** per million tokens, so GPT-5.6 Luna now wins those slots, for every provider and for the gold route too. The router reads live prices, so the same decision can lead to a different model next week. That's by design.

## VegaML in a nutshell

[VegaML](https://github.com/NandhaKishorM/vegaml) appeared on GitHub and PyPI on **9 October**, and went from 0.1.0 to **0.8.0** in two days. It's Apache-2.0, published as the `vegaml` Python package, with both sizes in one Hugging Face repository ([nandakishorm/vega-08b-public-intents](https://huggingface.co/nandakishorm/vega-08b-public-intents)). The README doesn't mention Laya, but the author is the same.

The pitch is the same as Jev, Laya, Kev and Clef: you give it a **state** (a ticket, a prompt, a sensor reading) and **typed questions** whose answer space is fixed in advance, and it returns an answer your code can use directly, with probabilities. No text is generated. Three question types:

*   `choice`: one option from a set you define (my *topic*);
*   `score`: an integer level against ordered criteria, plus an expected value (my *complexity* and *risk*);
*   `boolean`: the probability that a statement holds (my *private data*). It was called `noul` in the first releases, the same name as in Jev's API, and renamed in 0.5.0.

What's different is **how** it gets to the answer. Laya fine-tunes a whole ModernBERT. Kev and Clef put a trained head on a language model. VegaML keeps the language model **completely frozen** and adds a small "physics engine" on top:

1.  The state, the question and the options go into one prompt, with no chat template. The frozen **Qwen3.5** reads it once. VegaML taps the hidden states at two inner layers (13 and 19 for the 0.8B) and stops there: the language-model head never runs.
2.  The pooled vectors place a **particle** in a 64-dimensional "decision space", with a starting position and a push.
3.  Each possible answer becomes a **valley** (a Gaussian well) in that space. For `score` questions, the levels sit on a line, so level 2 is physically next to levels 1 and 3.
4.  The particle rolls under damped dynamics for a fixed budget of 12 steps (with early exit), and **the answer is the valley where it settles**. Probabilities come from how close it ends up to each valley bottom.

The author's blog post title says it well: a decision model that *rolls a ball down a hill*. The engine is small: **14.3M parameters (57 MB)** for the 0.8B, 30.9M for the 4B, no attention layers. It's trained on the settling behaviour, not on next-token prediction. Two small LoRA-style adapters (about 5 MB together) sit on the engine, and a gate decides per question whether they help.

The physics isn't just a gimmick. It produces several **safety signals** that come back with every answer:

*   **A per-decision temperature.** A particle that is still moving at the end, or that stopped far from every valley, gets a "hotter" temperature, so a less confident answer.
*   **Conformal sets.** For a risk level α (e.g. 0.1), the set of answers that should contain the right one 90% of the time.
*   **Abstain**, a flag when confidence is below a fitted floor.
*   **Unbound**, a flag when the particle settled far from every valley: the model's own way of saying "this question is outside what I know".

And there is the feature that caught my eye: **`fit()`**. Give it labelled examples (the docs say about 20 per question) and it trains a small head per question, cross-validates it, and **drops any head that doesn't beat chance**. No training run, no GPU hours. Then you choose a mode:

| Mode | What it does |
| --- | --- |
| `engine` | Zero-shot. Calibration, conformal sets and abstain. This is the mode behind every published figure. |
| `auto` | The default since 0.7.0: use a fitted head where it beats chance, the engine everywhere else. With nothing fitted, it's the engine. |
| `ttt` | Fitted heads only. Sharper on their labels, but no calibration and no abstain. |
| `both` | Both readouts side by side. |

A few other things worth knowing:

*   **Two sizes.** 0.8B (on Qwen3.5-0.8B, a 1.77 GB backbone) and 4B (on Qwen3.5-4B, 9.34 GB).
*   **Long context: 73,728 tokens.** States of 4,096 tokens or more are read once and cached, so asking twelve questions about a long contract costs roughly one read. Inputs that are too long are refused, not silently truncated.
*   **Images.** `decide_image` reads a picture through the backbone's frozen vision encoder. It works from 0.8.0; the author says the published benchmarks don't cover it.
*   **Views.** `views=2` or `3` re-reads the input with the options reversed or the state rephrased, and averages. It costs about two or three times more. All published figures use `views=1`.
*   **Languages:** not stated. The adapters were trained on [LocalLLaMA/typed-decisions](https://huggingface.co/datasets/LocalLLaMA/typed-decisions), which is English.

## What it's for, according to the author

The README is refreshingly honest about it. The author doesn't claim VegaML beats Jev on accuracy; they say Jev wins accuracy across the board. What VegaML offers instead is **honest probabilities**, an answer for every request (no "max tokens exceeded"), low latency, and everything running locally, with nothing leaving the machine.

The example workflows are routing an email or a ticket to a team, scoring churn risk, classifying a document from its image, and asking many questions about a very long contract. The domains where it does best are **short screening tasks**: phishing (its strongest result in an earlier run), spam, prompt injection, toxicity, and tasks with **very wide label spaces**, where the engine helps the small backbone most (151 intents on CLINC150: 0.900 with the engine against 0.100 for the backbone alone).

## The author's benchmarks

The current numbers (README and [bench/RESULTS.md](https://github.com/NandhaKishorM/vegaml/blob/main/bench/RESULTS.md)) come from a run that finished on 11 October on two Tesla T4 on Kaggle: zero-shot `engine` mode, 3,841 decisions per system, and Jev called live through TypeSafe's `jev-latest` endpoint for every row.

| | Vega 0.8B | Vega 4B | Jev |
| --- | --- | --- | --- |
| **Public menu, 43 tasks** (macro average) | | | |
| Accuracy | 0.556 | 0.717 | **0.836** |
| Macro F1 | 0.486 | 0.649 | **0.796** |
| ECE (lower is better) | 0.151 | 0.148 | **0.115** |
| p50 latency | **74 ms** | 106 ms | 162 ms |
| **JevBench, 231 items** | | | |
| Accuracy | 0.545 | 0.662 | **0.866** |
| ECE | 0.178 | 0.169 | **0.067** |
| Paraphrase consistency | 0.694 | 0.722 | **0.972** |
| **DecisionBench, 1,075 items** | | | |
| Accuracy | 0.509 | 0.633 | **0.752** |
| Coverage | **1.000** | **1.000** | 0.997 |
| ECE | 0.103 | **0.098** | 0.122 |
| p50 latency | **85 ms** | 245 ms | 163 ms |

So, on the author's own suites, Jev is clearly ahead on accuracy, and VegaML is competitive on calibration (better than Jev on DecisionBench, where Jev's average confidence is 0.874 for an accuracy of 0.752) and faster on a GPU.

With the **typed-decisions adapter**, on the test split of the dataset it was trained on (2,050 decisions), the picture is much better: **76.3% accuracy and an ECE of 0.026** for the 0.8B, 80.3% and 0.019 for the 4B, at 22–28 ms per decision. That's the "specialised" VegaML, on in-domain data: the same 0.8B engine without the adapter scores 38.9% on the same split.

The README also lists where it beats Jev, task by task: 4 of 43 tasks for the 0.8B and 12 of 43 for the 4B (spam, jailbreak and toxicity classification, prompt injection, terms-of-service fairness, some tweet tasks). And then, to their credit, the author explains why most of these wins don't count: 8 of the 12 are on 3 rows or fewer, two have a majority-class problem, and only prompt injection survives a significance test. In an earlier run, paired against Jev 1.13, VegaML caught **252 of 400 phishing emails against 99 for Jev** (with lower precision: 0.84 vs 0.96), and was 2.1 times faster: **280 ms per decision on an Apple M-series in fp32**, against 591 ms for hosted Jev.

The RESULTS page also lists "real findings against Vega", which I appreciated:

*   **Conformal sets under-cover**: on the public menu, the 90% sets contain the right answer 70.5% of the time for the 0.8B (77.1% for the 4B).
*   **Option order matters**: reversing the options flips the answer on 70% of the rows of one legal benchmark for the 0.8B.
*   **The backbone alone** (Qwen3.5 generating the answer) is about as accurate as VegaML on these suites (0.523 vs 0.556 for the 0.8B). The author's conclusion is that the engine's contribution is coverage, probabilities, calibration, abstention and about a third of the latency, not accuracy.

I found only one independent test: a [small information-extraction benchmark](https://github.com/umstek/zero-shot-ie-bench/pull/32) where the 0.8B scored 9 of 12, but where the abstain flag caught **all six** wrong answers. There's also an [8-bit ONNX port](https://huggingface.co/nvkudva/vega-onnx-q8) that runs in the browser. No one had published routing numbers yet. Time for mine.

## Will it run on my Mac?

**The 0.8B, yes. The 4B, no.** VegaML runs in fp32 only, and the 4B needs about 16.5 GB of RAM in fp32 (that's the independent tester's figure; the author only gives the backbone size). On a 16 GB M4, that's the same story as Kev-4B and Clef 27B.

Three things to know before you start:

1.  **There's no `/v1/systemone` server.** Laya, Von, Kev and Clef-flash all speak Jev's HTTP shape, so adding them was a URL. VegaML is a Python API (`vegaml.load(...).decide(state, questions)`), so it needed a small sidecar: [sidecar/vega_server.py](https://github.com/mmornati/system-one-router/blob/main/sidecar/vega_server.py), 130 lines. It renames `noul` to `boolean` on the way in, `probs` to `probabilities` and `expected_score` to `score` on the way out, and passes VegaML's own `abstain`, `prediction_set` and `unbound` fields through.
2.  **It defaults to CUDA, then CPU.** On a Mac you have to pass `device="mps"` to use the GPU.
3.  **It needs `transformers>=5.17`**, so it gets its own virtual environment instead of sharing Laya's.

```bash
uv venv --python 3.12 sidecar/.venv-vega && uv pip install --python sidecar/.venv-vega/bin/python vegaml==0.8.0
sidecar/.venv-vega/bin/python sidecar/vega_server.py                                  # :8793, zero-shot ("engine")
sidecar/.venv-vega/bin/python sidecar/vega_server.py --mode auto --fit examples.jsonl # with fitted heads
go run ./cmd/bench -providers jev,vega
```

The first start downloads the Qwen3.5-0.8B backbone (about 2 GB), which VegaML checks against a pinned SHA-256. On the bench side, it's a new `vega` provider and a `-vega-url` flag, with the same 6,000-character state limit as Jev, Von, Kev and Clef-flash.

## The standard test, once more

For newcomers, and because the details matter for reading the results, here is what the benchmark does. `cmd/bench` sends **80 labelled prompts** through each decision provider, using the same router and the same config:

*   57 core dev tasks (code, review, debugging, SQL, infra, architecture, writing, chat);
*   8 prompts in other languages (French, Spanish, German, Italian, Japanese, Chinese, Portuguese);
*   4 inputs longer than 512 tokens;
*   7 tricky or ambiguous ones ("fix it", "can you make it faster?", a prompt injection…);
*   4 with private data (tokens, a database URL with a password, a patient record).

Each prompt gets the router's **four questions** in one request: **topic** (a `choice` among 10 options: code-gen, code-review, debugging, security, docs, data-sql, infra-devops, architecture, writing, chat), **complexity** (a `score` from 0 to 3), **risk** (a `score` from 0 to 2) and **private data** (a `noul`/`boolean`). From the answers, the router computes a quality floor, raises it when the topic confidence is below **0.8**, and picks the cheapest model above the floor among five OpenRouter models, from Qwen 3.7 Flash to Claude Opus 5.5.

**No prompt is sent to a chat model.** The benchmark only compares decisions. The reference is the **gold route**: the model the router picks when it's fed the human labels instead of a model's answers. The metrics:

*   **Topic, complexity, risk accuracy** against the labels (complexity also "within ±1");
*   **Confident answers**: the share of topic answers at or above 0.8, and how often those are right;
*   **ECE** (expected calibration error): how far the stated confidence is from the actual accuracy. Lower is better;
*   **Route = gold**: how often the routed model is exactly the gold one, and how often it's cheaper (*under-provisioned*, a quality risk) or pricier (*over-provisioned*, money wasted);
*   **Latency** of the decision itself, p50 and p90.

Jev was re-run in the same session as the reference, so its numbers move a little from post to post (70% to 75% of routes identical to gold over the last runs, the noise of a remote model on 80 prompts, plus the price change above).

## Run 1: VegaML zero-shot

The first run is the configuration the author's figures use: `mode="engine"`, `views=1`. Here is the summary of the HTML report:

![Benchmark report summary, Jev 1.13 (OpenRouter) vs VegaML 0.8B (local) on 80 prompts: topic accuracy 89% vs 51%, tricky 43% vs 0%, complexity exact 71% vs 42%, risk exact 61% vs 54%, confident answers 84% vs 1%, ECE 0.074 vs 0.162, route matches gold 70% vs 18%, latency p50 364 ms vs 1344 ms](/images/vegaml-benchmark/report-summary.webp)

**51% topic accuracy.** That's below every open model I've tested except Laya multilingual (45%), and **0% on the tricky group**. Complexity and risk are a bit better than Laya's (42.5% and 54%), and private data is detected 92% of the time. But only **one answer out of 80** reaches the router's 0.8 confidence bar. As with zero-shot Laya, the router plays safe, bumps the quality floor, and sends almost everything to Sonnet:

![Where requests would go: Jev spreads the 80 prompts over qwen3.7-flash (18), gpt-5.6-luna (27), claude-sonnet-5 (19) and claude-opus-5.5 (15); VegaML sends 16 to gpt-5.6-luna, 51 to claude-sonnet-5 and 13 to claude-opus-5.5, and none to the cheapest model](/images/vegaml-benchmark/report-routes.webp)

59 prompts go to a pricier model than gold, and only 17.5% match the gold route. The per-prompt rows show the pattern: `hello` ("hey, how are you today?") is read as *debugging* at 20%, `git-undo` as *docs* at 21%. Even when VegaML gets the topic right (`py-csv`, `rename-var`), it does so at 26–32% confidence, which the router can't trust.

![Per-prompt rows of the report: for hello, git-undo, regex, py-csv and rename-var, the gold labels and model, then Jev's answers (all correct, 78–100% confidence) and VegaML's (debugging 20%, docs 21%, code-review 22%, code-gen 26%, code-gen 32%) with the routed model and latency](/images/vegaml-benchmark/report-rows.webp)

Why so different from the author's results? I think the task is the reason. Its wins are on **binary or few-class screening** (phishing yes/no, spam yes/no, a news topic among four). My topic question is a **10-way choice with overlapping categories**: a "write a regex" prompt is code-gen, but a reasonable reader could say code-review or debugging. That's exactly the kind of question where Jev's 0.866 vs VegaML's 0.545 on JevBench shows up.

### Do the safety signals help the router?

VegaML's selling point is its uncertainty signals, so I checked each one against the router's own confidence threshold:

*   **`abstain`** flags 72 of the 80 topic answers. Those 72 are right 47% of the time; the 8 it keeps are right 88% of the time. So it's a correct signal, but it says the same thing the 0.8 threshold already says: "I'm not sure", almost always.
*   **`unbound`** carries no signal here: answers flagged and not flagged are right 51% and 52% of the time.
*   **Conformal sets** at α = 0.1 hold a single option and contain the gold topic **54% of the time instead of 90%**. The shipped calibration doesn't transfer to my questions, which matches the under-coverage the author reports on their own suites.

## Run 2: a confidence temperature

In the [Laya post](/laya-vs-jev-ten-days-later-fine-tuning-on-a-macbook/#a-cheap-trick-before-training-rescale-the-confidence) I added an optional per-provider `temperature`: divide the logits by *T* before the softmax. It never changes which answer wins, only how confident it sounds. It fixed Kev, the Laya fine-tune and Clef-flash. Same method: minimise the log-loss on half of the prompts, measure on the other half, 20 random splits. The script reproduced Kev's earlier value (0.45 against 0.47, close enough for a coarse grid), and gave **T = 0.60** for VegaML.

| | VegaML zero-shot | **VegaML, T = 0.60** | Jev 1.13 |
| --- | --- | --- | --- |
| Topic accuracy | 51% | 51% (unchanged) | 89% |
| Confident answers (≥ 0.8) | 1% | 19% (93% right) | 84% (94% right) |
| Calibration error | 0.162 | **0.092** | 0.074 |
| Route = gold | 17.5% | 20% | 70% |
| Cheaper / pricier than gold | 7 / 59 | 11 / 53 | 4 / 20 |

Calibration improves a lot (0.162 → 0.092), but a temperature can't create accuracy that isn't there: 51% stays 51%, and routes barely move. Kev had the opposite problem: right but shy. VegaML zero-shot is mostly unsure because it's often wrong, and saying so is the honest answer.

## Run 3: few-shot heads from 40 labelled prompts

This is the part I was most curious about, and the reason VegaML deserves a post rather than a line in a table. None of the other models can learn from my labels without a training run. VegaML's `fit()` claims to do it in about a minute.

To measure it honestly, I couldn't fit on the 80 prompts and test on the same 80. So:

1.  The 80 prompts were split into **two halves, A and B, stratified by topic**.
2.  The sidecar got a `--fit` option: it reads labelled examples (state, labels, questions) and calls `fit()` before serving in `auto` mode.
3.  Heads fitted on A answered the prompts of B, then heads fitted on B answered A. The two halves are pooled, so **every prompt is scored by heads that never saw it**.

One gotcha on the way: Go marshals maps with sorted keys, so the router sends the topic options **alphabetically**. The fit file has to use the same order, or the head features don't line up with the questions at serving time.

Fitting 40 examples takes about **a minute** on the M4. On fold A, VegaML's own cross-validation reported 84% for the topic head, 53% for complexity and 70% for risk. The private-data head was dropped on one half (too few private examples to beat chance), so the engine answered that question there, which is exactly what `auto` mode is for.

| | Jev 1.13 | VegaML zero-shot | **VegaML few-shot heads** (held-out) | few-shot, T = 0.72 |
| --- | --- | --- | --- | --- |
| Topic accuracy | **89%** | 51% | 65% | 65% |
| Topic: core / multilingual / long / tricky | 95% / 88% / 75% / 43% | 56% / 62% / 75% / 0% | 63% / 62% / 100% / **57%** | same |
| Complexity exact / within ±1 | **71%** / 100% | 42.5% / 94% | 54% / 96% | same |
| Risk exact | 61% | 54% | **64%** | **64%** |
| Confident answers (≥ 0.8) | 84% (94% right) | 1% | 10% (88% right) | 24% (84% right) |
| Calibration error | **0.074** | 0.162 | 0.186 | 0.138 |
| Route = gold | **70%** | 17.5% | 39% | 42.5% |
| Cheaper / pricier than gold | 4 / 20 | 7 / 59 | 2 / 47 | 6 / 40 |
| Decision latency p50 / p90 | **364 / 436 ms** | 1,344 / 1,703 ms | 862 / 977 ms | same |

With 40 labels and a minute of fitting, on prompts the heads never saw:

*   **Topic goes from 51% to 65%**, and the tricky group from 0% to 57% (Jev: 43%);
*   **Risk reaches 64%, above Jev's 61%**, the same thing I saw with the Laya fine-tune: labels written with my conventions teach my idea of risk;
*   **Routes matching gold more than double**, from 17.5% to 39%, and to 42.5% with a temperature;
*   and it gets **faster**: a fitted head replaces the engine for its question, so 0.86 s instead of 1.34 s.

The heads are still under-confident (10% of answers above 0.8), and fitted heads come without calibration by design. A temperature (T = 0.72, fitted on the pooled held-out answers, so in-sample for *T*, like the other "full bench" rows) helps a bit. It's still far from Jev, and below Kev-0.8B's 81% zero-shot topic.

For scale, the [Laya fine-tune](/laya-vs-jev-ten-days-later-fine-tuning-on-a-macbook/#fine-tuning-laya-on-a-macbook) took **480 labelled prompts and 41 minutes** to reach 85% topic and 64% routes matching gold. VegaML gets to 65% and 39% with **40 prompts and one minute**. They're not the same experiment (the Laya fine-tune trained on a separate set of prompts; here the two halves of the benchmark take turns), but the trade-off is clear: VegaML is a cheap way to get *something* from a handful of labels; a real fine-tune is still the way to get a model you can route with.

## All the models so far

Same 80 prompts, same router, different evenings. Jev is the reference of each run, so compare each model with its own Jev column in the earlier posts for the fine details.

| Model (16 GB M4 unless hosted) | Topic | Route = gold | ECE | Latency p50 |
| --- | --- | --- | --- | --- |
| **Jev 1.13** (hosted) | **89%** | **70–75%** | **0.068–0.080** | 258–364 ms |
| Clef-flash 9B 4-bit, T = 0.64 | **90%** | 64% | 0.072 | 3,854 ms |
| Laya fine-tuned (480 labels), T = 0.87 | 85% | 64% | 0.082 | 319 ms |
| Kev-0.8B, T = 0.47 | 81% | 39% | **0.059** | 371 ms |
| Von 1.3 | 70% | 48% | 0.226 | 216 ms |
| Laya typed-decisions | 71% | 12% | 0.509 | 334 ms |
| **VegaML 0.8B, few-shot (40 labels), T = 0.72** | 65% | 42.5% | 0.138 | 862 ms |
| Laya English (0.4.2 = 0.3.24) | 59% | 20% | 0.171 | 300 ms |
| **VegaML 0.8B, zero-shot, T = 0.60** | 51% | 20% | 0.092 | 1,344 ms |

## Why 1.3 seconds when the card says 280 ms?

Because the card measures **one decision** and a router request is **four questions**. VegaML runs one pass through the backbone per question, and the prefix cache only starts at 4,096 tokens, far above my prompts. Four passes at roughly 330 ms each on the M4 GPU give the 1.3 s I measured. With fitted heads, the heads replace the engine for their questions, hence 0.86 s.

The author's 74–85 ms p50 is on a T4 GPU in fp16, a different hardware story again. As with Clef-flash, every number is true on its own machine.

## The usual question: what was it trained on?

I only include models that say they were not trained on Jev's outputs, since TypeSafe's terms forbid distilling Jev. VegaML is a borderline case, like Clef-flash. The **adapters** are documented: trained on the train split of [LocalLLaMA/typed-decisions](https://huggingface.co/datasets/LocalLLaMA/typed-decisions), whose card says it isn't affiliated with TypeSafe and doesn't reproduce Jev. The **base engine's** training data isn't described, only its objective. Jev appears in the repository as a live-called baseline, nothing more. I included the model and noted the question in the benchmark docs, the same way as for Clef-flash.

## Where it fits

*   **As a drop-in router, zero-shot: no.** 51% topic and 1% confident answers mean the router over-provisions almost everything, and the safety signals don't add anything the confidence threshold doesn't already say.
*   **As a "bootstrap" for my own labels: interesting.** system-one-router already logs outcomes for `cmd/refit`. Feeding a few dozen of those to `fit()` every night, with heads dropped automatically when they don't beat chance, is a cheap loop no other model here offers.
*   **For the tasks it was built for: probably yes.** Binary screening (is this a prompt injection? is this phishing?) with abstention, locally, on long documents. That's not my router's question, but it could be one of my house's questions.
*   **Laya:** nothing new for routing. The next step there is still a fine-tune, now with the official `laya-train` CLI instead of my own scripts.

## Lessons learned

1.  **Check the weights before re-running a benchmark.** Eight Laya releases, zero changed weights, zero changed answers. A hash comparison would have told me the same thing in a second.
2.  **The price list moves even when the model doesn't.** A DeepSeek price change moved up to 19 routes per column. Benchmarks of a router are only comparable at the same prices.
3.  **A vendor's wins describe the vendor's tasks.** Phishing yes/no and a 10-way topic choice are both "decisions", but they're not the same difficulty.
4.  **Uncertainty signals are only useful if they add information.** `abstain`, `unbound` and conformal sets are well designed, but on my questions they repeat the confidence score.
5.  **Few-shot is a real middle ground.** 40 labels, one minute, measured on held-out prompts: not enough to route with, but the best return on effort of anything I've tried so far.
6.  **"Per decision" is not "per request".** Four questions are four passes for VegaML. Read latency figures with the number of questions in mind.

The code and the full write-up are in [mmornati/system-one-router#12](https://github.com/mmornati/system-one-router/pull/12), with the setup in [docs/benchmark.md](https://github.com/mmornati/system-one-router/blob/main/docs/benchmark.md). The [published report](https://mmornati.github.io/system-one-router/) still shows the seven-provider run; Clef-flash and VegaML will join it at the next full run, when all the local servers are up at the same time. If you've tried VegaML's `fit()` on your own data, or the 4B on a bigger machine, I'd love to hear about it in the comments.

## How it was built

Same setup as the rest of the series: one Claude Code session with Opus 5.5. I asked it to read Laya's changelog, tell me whether a new benchmark was worth it, and judge whether VegaML was "on the same level" and could be benchmarked, with a plan and no code. It compared the weight hashes, read VegaML's README and code, and proposed six steps: sidecar, bench provider, zero-shot run, temperature, few-shot heads, docs. I said "run all the points". It wrote the sidecar, ran the Laya check and the three VegaML runs, found the sorted-keys gotcha in the fit file, and opened the pull request. For this post, a second session read that transcript, researched VegaML's published material online, and drafted the text. My part was choosing what to measure and what to keep.
