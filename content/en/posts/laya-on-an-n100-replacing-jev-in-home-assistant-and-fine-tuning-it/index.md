---
title: 'Laya on an N100: Swapping Jev for a Local Model in Home Assistant, and Teaching It My House'
categories:
- smart-home
tags:
- home-assistant
- smart-home
- automation
- ai
- jev
- laya
- fine-tuning
- distillation
- docker
- self-hosting
date: '2026-10-27T18:00:00.000000+00:00'
draft: false
slug: laya-on-an-n100-replacing-jev-in-home-assistant-and-fine-tuning-it
translationKey: laya-n100-home-assistant
cover: cover.jpg
showHero: true
description: Laya speaks Jev's API, so I put it in a Docker container on my N100 mini PC and pointed Home Assistant at it. It works, it's slow but fast enough, and its answers out of the box are useless for my house. Then, as a local experiment, I fine-tuned it on two weeks of real Home Assistant requests on my MacBook. How the training works, how to serve the new checkpoint, the numbers on held-out days, and why this stays an experiment.
summary: A Jev-compatible model running on a 4-core mini PC, with none of my sensor data leaving the house. Out of the box it said "yes" to almost everything. After one hour of training on my MacBook it agrees with Jev 93% of the time on days it never saw. Good enough for shadow mode, not for running the house, and with a terms-of-service question I can't ignore.
projects:
- ha-decision-models
---

For a month now, my Home Assistant has been asking **Jev** the questions my YAML rules can't answer well: *should the ventilation boost right now? Should these shutters come down? Is this water flow normal?* I described the setup in [the first post](/jev-home-assistant-letting-a-decision-model-judge-my-automations/) and the history and feedback loop in [the second one](/jev-home-assistant-history-feedback-and-the-local-model-question/). Jev is TypeSafe's hosted "System One" model: you send it a JSON state and typed questions, it sends back calibrated probabilities, for a fraction of a cent a day.

**Laya**, from Convai Innovations, is the open-weights alternative I've been following since the [router benchmark](/system-one-router-picking-the-right-llm-for-every-prompt/), through [a fine-tune on my labels](/laya-vs-jev-ten-days-later-fine-tuning-on-a-macbook/) and [the 0.4.2 check](/laya-0-4-2-and-vegaml-a-physics-engine-decision-model-on-a-macbook/). It speaks the same API as Jev. And there is one argument for it that no benchmark measures: if it runs at home, **none of my house data goes anywhere**. The humidity of my bathrooms, when the shutters move and whether someone is home are exactly the kind of data I'd rather keep on my own network.

In the second post I explained why I didn't go local on my N100 mini PC. This time I stopped arguing and installed it. This post covers:

1.  running Laya in Docker on an N100 and plugging it into Home Assistant;
2.  what happened when I replayed two weeks of **real** Jev requests through it;
3.  a local experiment: **fine-tuning Laya on those requests**, how it works, how to serve the result, and the numbers;
4.  whether it was worth it.

## Laya in a container on an N100

The hardware is a small Intel N100 box: 4 cores, 16 GB of RAM, no GPU, and already busy with other containers. I manage it with Coolify, but any Docker host works. Laya ships its own server, `laya-serve`, which exposes `POST /v1/systemone` with the same request and response shape as Jev.

My first version installed everything at container start:

```yaml
services:
  laya-api:
    image: python:3.13-slim
    restart: unless-stopped
    command: >
      sh -c "pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu &&
             pip install --no-cache-dir 'laya[serve]' &&
             laya-serve"
    environment:
      - LAYA_HOST=0.0.0.0
      - LAYA_PORT=8000
      - LAYA_SERVER_PRELOAD=multilingual
      - OMP_NUM_THREADS=4
      - PYTHONUNBUFFERED=1
    volumes:
      - laya_model_cache:/root/.cache/huggingface
    ports:
      - "8180:8000"
    healthcheck:
      test: ["CMD", "python3", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 30s
      start_period: 120s

volumes:
  laya_model_cache:
```

It works, and it's a good way to try Laya in five minutes. A few notes if you keep it:

*   **Use the CPU-only PyTorch wheel.** The default one pulls CUDA libraries you can't use on an N100 and weighs gigabytes more.
*   **Keep the Hugging Face cache in a volume**, or every restart downloads the checkpoint again.
*   **`OMP_NUM_THREADS=4`** matches the N100's four cores. Adding workers or replicas doesn't help: each request already uses all four cores.
*   **Pin your versions.** This `command:` reinstalls an unpinned `laya[serve]` on every restart, so a restart can silently bring a new version that answers differently, after several minutes of installing. Once you know you want to keep it, bake it into an image:

```dockerfile
FROM python:3.13-slim
RUN pip install --no-cache-dir torch==2.14.1 --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir "laya[serve]==0.4.15"
ENV LAYA_HOST=0.0.0.0 LAYA_PORT=8000 OMP_NUM_THREADS=4 PYTHONUNBUFFERED=1
CMD ["laya-serve"]
```

I preload the **multilingual** checkpoint: it reads 1,024 tokens, against 512 for the English one, and my requests are long.

### Plugging it into Home Assistant

The [HA-Jev integration](https://github.com/AboveColin/HA-Jev) I use already accepts a custom address. So switching is a configuration change, not a code change: a second entry with the URL `http://<your-laya-host>:8180`, the model `multilingual`, and no API key (the integration warns about plain HTTP, which is acceptable on a LAN). The scripts that ask Jev take a `config_entry`, so each decision can be pointed at one or the other.

That was the easy part. What came next was less fun.

## First results: it works, slowly, and the answers are wrong

### Laya cuts your request, and Home Assistant can't see it

My first test was a real VMC (ventilation) request, the one where Jev decides whether to run the noisy speed 2. Laya answered 0.9954, "boost", where Jev had said 0.49. Laya looked decisive. Then I read the rest of the response:

```json
"usage": {"input_tokens": 1024, "state_tokens": 960,
          "state_tokens_dropped": 196, "truncated": true}
```

The multilingual checkpoint reads 1,024 tokens in total, and 256 of them are reserved for the question and its options. My VMC state is about 1,150 tokens, because the [second post](/jev-home-assistant-history-feedback-and-the-local-model-question/) gave Jev a memory: three hours of humidity per room, recent events, each room against its own daily median. Laya simply drops the end.

Two experiments showed exactly what gets lost. I put one decisive fact ("garage door open/closed") after 1,500 tokens of filler: both versions returned exactly 0.7307, so Laya never saw it. Then, on the real request, setting `away` and `sleeping` to on, or changing the thresholds at the end of the question's background, returned **exactly** 0.9954 every time. Laya cuts the **end of the state**, which is where my `away`, `sleeping`, outdoor data and unreliable-sensor warnings were. It also caps the question at 256 tokens and cuts the end of a long background without reporting it.

And the integration never tells you: the client reads the answers and the token counts, not the `truncated` flag. A truncated answer looks like any other one in Home Assistant.

### Shortening the requests: only if Jev's answers don't change

The obvious fix is a shorter request. A compact version of the VMC state, with the decisive facts first and one block per room, went from 1,221 to 471 tokens. But I added all that data *because* Jev needed it to decide well, so I set a rule: **a shortening goes in only if Jev's answers don't move more than Jev's own noise**.

Claude Code measured that noise first: the same real request sent twice to Jev moves by 0.013 on average for the VMC and 0.007 for the shutters. Then it removed one field at a time on 50 real situations, and finally tested the combined rules on 200 more (about 1,400 Jev calls, $0.10):

| VMC change | Saved | Avg / max change in Jev's answer | Verdict |
| --- | --- | --- | --- |
| Remove empty entries | 126 B | 0.013 / 0.05 | noise |
| Short unreliable-sensor list | 76 B | 0.009 / 0.03 | noise |
| Drop pump lines from events | 154 B | 0.039 / 0.14 | **Jev uses them** |
| Drop absolute humidity and ventilation gain | 104 B | 0.041 / 0.18 | **used** |
| Drop the 3-hour series | 741 B | 0.058 / 0.26 | **used** |
| Drop the background text | 1,079 B | 0.096 / 0.42 | **used** |

Even the "safe" rules together moved the VMC answers twice as much as noise and flipped four decisions out of 120. Only the shutters passed: keeping the series values without the min/max summaries saves 15% of the tokens with no change at all, and that went into my config. **The VMC request stays as it is.** It doesn't fit in Laya, and making it fit would make Jev worse.

### Is it fast enough?

To size it, I counted two weeks of real Jev calls: **1,416 calls, 101 a day, 4.2 an hour** on average. The busiest minute had 4 calls, at :00 and :30 when the scheduled questions line up. On the N100, with nothing else asking:

| Request | Time |
| --- | --- |
| Full VMC request (1,024 tokens, truncated) | **4.9 s** (7.8 s for the first call) |
| Compact VMC request (325 tokens) | **1.0 s** |
| 4 requests at the same time | 5.3 / 10.2 / 15.1 / **19.9 s** |

`laya-serve` handles **one request at a time**, so a burst queues. With 4 at once, the last answer takes 20 seconds, inside the integration's 30-second timeout but without much room. The cost grows faster than the length, so a shorter request is the real speed-up, more than any CPU setting. Over a day, though, it's about 8 minutes of CPU work. **For a house, slow is fine.** I'd happily wait 5 seconds for a ventilation decision if it means my data stays home.

### The real test: two weeks of real requests

Until then I only had one real request. But prompt logging was on in my OpenRouter account, so the real requests were all there. Claude Code read them in the browser, after I signed in myself: **1,416 requests from 11 to 25 October, each with the exact JSON Home Assistant sent and Jev's answer**. These logs show when people are home, so they stayed on my laptop, out of every repository.

Each request went to Laya unchanged. After 396 of them the picture was clear:

| Question | Laya base | Jev |
| --- | --- | --- |
| VMC boost | truncated every time; "yes" at 0.994–0.999 every time | "yes" 18% of the time |
| Shutters | "lower them" 99% of the time | once |
| Garden watering | "yes" 100% of the time | never |
| Which light to turn on | same choice as Jev 27% of the time | |

The truncation isn't the main problem. With the full state visible on a hand-made example, a shower happening now (90.8%, +16 points in 15 minutes), a shower an hour ago, flat humidity and "everyone asleep" all scored between 0.980 and 0.992. I gave it the facts as numbers, as words ("rising fast, fresh steam") and as a plain `fresh_steam: true` flag: none of it moved the answer the right way. On the VMC, its ranking of situations was barely better than chance (AUC 0.60 against Jev's decisions).

That matches Laya's own documentation: it's a 322M-parameter encoder (mmBERT-base) pre-trained on generic decision tasks, its yes/no answers can follow the wording of the options rather than the state, and the authors say to treat it as a base to specialise. A temperature or a threshold can't fix it: they rescale the scores, but keep their order, and here the order is wrong.

So, in its base form, Laya can't replace Jev in my house. Which brings me to the part I said in [an earlier post](/laya-vs-jev-ten-days-later-fine-tuning-on-a-macbook/) I wouldn't do.

## A local experiment: teaching Laya from Jev

### First, the elephant in the room

I had 1,416 real requests, each with Jev's probabilities. Training a model to reproduce those probabilities is **distillation**: Jev is the teacher, Laya the student. Three weeks ago I dropped exactly this plan, because TypeSafe's [customer agreement](https://typesafe.ai/legal/mca) (§2.3(b)) says you may not use the service or its output "to perform model distillation" or to "train a model to imitate the output of the Services". It has no exception for personal or non-commercial use.

I did it anyway, as a bounded experiment, and I want to be clear about what that means:

*   **It's a local test for my own house.** It ran on my MacBook, on my own requests, for my own home automation. Nothing went to Kaggle or any cloud GPU: the data shows who is home and when.
*   **Nothing is published.** Not the dataset, not the weights, not the scripts as a product. There is no model to download from this post, and none will be. The weights encode my household's routines anyway, which is a second reason to keep them private.
*   **The point was to learn how far Laya can go** with real house data, and how its training works, not to build a Jev replacement for anyone.

I'm not pretending this makes it fine with TypeSafe's terms: the clause doesn't care about scale or intent. I'm telling you what I did and what the terms say, so you can decide for yourself. I'm also clearly not the only one curious. On GitHub, [Mini-Jev](https://github.com/Shauryagulati/mini-jev) distils Jev into Qwen3-1.7B and compares supervised fine-tuning, soft-label distillation and RL, and warns readers to check TypeSafe's terms before reusing the weights. On Hugging Face, [jev-distill-corpus-v3](https://huggingface.co/datasets/SargeDev/jev-distill-corpus-v3) publishes about half a million rows labelled by Jev 1.13. Many other "Jev-like" projects ([Kev](https://github.com/jaredpalmer/kev), [system-one-open](https://github.com/mithalouni/system-one-open), [Von](https://huggingface.co/wfzyx/von)...) train on public datasets or their own synthetic labels instead, and that's the clean route. I come back to it at the end.

### What Laya actually is, and what training changes

Laya isn't a chat model and never writes text. For each question it builds **one sequence**:

```text
[CLS] <question type> instructions [SEP] [MASK] option 1 option 2 ... [SEP] state JSON [SEP]
```

An encoder reads the whole thing at once, and a small head on top turns it into probabilities over the options: `noul: 0.12`, or one probability per choice. One forward pass, no reasoning steps, which is why a 322M model answers in about a second on a mini PC CPU.

Fine-tuning changes the weights, not the program. For each training example, Laya predicts, the prediction is compared with the target, and all the weights move a little towards it. Do that a few hundred times with a small learning rate, and the model adapts to *your* questions without forgetting the rest. With Jev's probabilities as targets, it also learns Jev's uncertainty: a 0.55 teaches "borderline", not "yes".

Laya ships its own training code, `laya.train`, which was better than reverse-engineering the Kaggle notebook linked from the model card.

### Step 1: build the dataset

Each training row is a request plus a target:

```json
{"state": {...},
 "questions": {"answer": {"type": "noul", "instructions": {...}, "criteria": {...}}},
 "gold": {"answer": {"probabilities": {"false": 0.34, "true": 0.66}}}}
```

The important choices were:

*   **Split by time, not at random.** Train on 11–21 October (1,004 requests), test on 22–25 October (409 requests the model never sees). A random split would put almost identical consecutive VMC requests on both sides, and the score would look much better than it is.
*   **Never cut anything.** Since Jev isn't involved here, I could use a Laya-specific compact state: the compaction rules tested above, the decisive facts first, and a short VMC background. Every row was checked with Laya's own `build_sequence`: if a single state token would be dropped, a fallback rule shortens the series, then removes the oldest events one at a time. Final result: **every input fits in 1,024 tokens with 0 tokens dropped**, which I also checked against the server on the N100.
*   **Jev's probabilities as soft targets**, converted to Laya's format for each question type (`noul`, `choice`, `score`).

The data is very unbalanced: 587 VMC and 358 shutter requests in the training set, and a few dozen for everything else (watering, laundry, water heater, presence).

### Step 2: train on the MacBook

The training script is short, because `laya.train` does the work:

```python
from laya.train import TrainConfig, finetune

cfg = TrainConfig(
    epochs=6,
    micro_batch=2, grad_accum=8,   # effective batch of 16
    encoder_lr=2.5e-5,
    loss="soft-ce",                # match Jev's probabilities, not just yes/no
    gradient_checkpointing=True,   # 1,024-token inputs in 16 GB
    seed=0,
)
finetune(data="train.jsonl", model_dir="laya/multilingual",
         output_dir="ckpt/jev-ft", config=cfg, device="mps")
```

Three settings worth explaining:

*   **6 epochs, effective batch 16**, about 340 optimizer updates. The defaults would have given only 60, and Laya's code itself warns that too few updates can collapse the model to a constant answer, the very problem I was trying to fix.
*   **`soft-ce` loss** instead of the default `rlcd`: soft cross-entropy is the natural objective when the target is a probability distribution, and Laya's own notes say the RL term gave no gain here.
*   **Gradient checkpointing**: without it, 1,024-token sequences don't fit in the M4's 16 GB of memory. It's not exposed by the CLI, which is why I called `finetune()` from Python.

The run took **66 minutes** on the M4's GPU (MPS), nothing left the laptop, and the loss stopped falling around 0.5. That's expected: when the target itself is 0.3/0.7, the loss can't reach zero. It's the held-out days that tell you whether it worked.

### Step 3: the results on days it never saw

Every answer is turned into a decision at the threshold my automation really uses, and compared with Jev's:

| 22–25 October, held out | Laya base | **Laya fine-tuned** | Jev's own noise |
| --- | --- | --- | --- |
| **VMC**: same decision as Jev (244 requests) | 14% | **93%** | |
| VMC: ranking vs Jev's decisions (AUC) | 0.56 | **0.94** | |
| VMC: rank correlation with Jev (Spearman) | −0.02 | **0.84** | |
| VMC: average gap with Jev's probability | 0.71 | 0.087 | 0.013 |
| VMC: boosts (Jev: 34) | 244 | 18 | |
| **Shutters**: same decision as Jev (145) | 0% | 100% | |
| Shutters: average gap with Jev's probability | 0.82 | 0.018 | 0.007 |

From "yes to everything" to 93% agreement on days it had never seen, in one hour on a laptop. I honestly didn't expect that much.

Now the fine print, because it matters more than the headline:

*   **It misses half of Jev's boosts.** Of Jev's 34 boost decisions, the fine-tuned Laya agrees on 17 and misses 17 (and adds 1). Every miss is close to the line: Jev at 0.60–0.67, Laya at 0.30–0.50. Counted by episode, it joins 5 of Jev's 6 boost episodes at least once and misses one Saturday-evening shower entirely. Moving its threshold doesn't help: the best offset, fitted on the training days, is +0.01.
*   **It partly memorised the training days.** 98.5% agreement on them, 92.6% on new days. More data, or fewer epochs with early stopping, should narrow that.
*   **The shutters prove nothing.** It's autumn: in neither the training nor the test days did Jev ever say "lower them". The model has only learnt "keep them up". I'll check again in spring.
*   **It learnt my house, not reasoning.** On six generic test states, the obvious humidity pair still goes the wrong way: a jump from 68.8% to 90.8% gets 0.38, flat humidity 0.44. Ask it a new question tomorrow and you're back to the base model.
*   **The rare questions are too few to judge**: water heater on solar 5/5, watering 3/3, laundry 2/2, presence 2/4...

And a reminder about the ceiling: a student trained on Jev can at best match Jev. The gain is not better decisions; it's the same decisions, locally, for free, with my data at home.

### Step 4: serving the fine-tuned checkpoint

The good news: **it's the same program and the same image**. `laya-serve` loads extra checkpoints from the `LAYA_EXTRA_MODELS` variable, a local folder or a Hugging Face repository. The checkpoint folder is about 650 MB (`model.safetensors`, `rl_agent_config.json`, `questions.json`, `encoder/`, `tokenizer/`; the optimizer state isn't needed).

I wouldn't touch the running container for a trial. A second service next to it is enough:

```yaml
services:
  laya-shadow:
    build: .                      # the Dockerfile above
    restart: unless-stopped
    environment:
      LAYA_EXTRA_MODELS: '{"jev-ft": "/models/jev-ft"}'
      LAYA_MODELS: jev-ft
      LAYA_DEFAULT_MODEL: jev-ft
      OMP_NUM_THREADS: "4"
    volumes:
      - ./jev-ft:/models/jev-ft:ro
    ports:
      - "8181:8000"
```

With `LAYA_DEFAULT_MODEL`, Home Assistant doesn't even need to name the model; otherwise it sends `"model": "jev-ft"`. I checked this locally: served this way, the checkpoint gives exactly the answers of the evaluation, with nothing dropped. A private Hugging Face repository with an `HF_TOKEN` also works, but a local folder is simpler and keeps the weights on your network. Watch the RAM: the model itself needs about 1.3 GB, and `docker stats` shows my current Laya container at about 5 GB, page cache included, on a 16 GB box that runs other things too. The speed doesn't change, since the model has the same size: about 1 second for a short request, 5 for a long one.

One real change remains on the Home Assistant side, and it's not optional: **it must send the compact state the model was trained on**. The full Jev request would be cut at 1,024 tokens again, and the model would see something it was never trained on.

## Was it worth it?

As an experiment, yes, clearly. A few things I take away:

*   **The install is the easy part.** A Jev-compatible API means a Docker container and a URL in Home Assistant. That's genuinely nice.
*   **Check `truncated` before anything else.** A model that silently cuts the end of your request will look confident and be wrong, and Home Assistant won't tell you.
*   **An N100 is enough for a house**, at about 100 decisions a day. Slow isn't a problem here; bursts are, and shorter requests fix them better than hardware.
*   **Base Laya is not a decision engine for numeric house states**, and its authors say so. Fine-tuned, it becomes surprisingly good at *my* questions, after one hour of training on a laptop.
*   **Measure against the teacher's noise, on held-out days.** 93% sounds great until you see the average gap is 7 times Jev's own noise and half the boosts are missed.
*   **The house still runs on Jev.** The fine-tuned model is good enough to try in **shadow mode on the VMC**: Home Assistant asks both, acts on Jev, and logs Laya next to it. It's not good enough to decide.

The bigger lesson is about the data. This experiment proved Laya can learn my house from about 1,000 examples. It didn't need to learn it from Jev. My [scoreboard](/jev-home-assistant-history-feedback-and-the-local-model-question/) already collects my own "who was right?" answers, and the outcome checks record what really happened after each decision: the shower that did happen, the pump that did stop. Those labels are **mine**, they're allowed, and they could even teach a model where Jev itself is wrong. It takes longer to collect a thousand of them, but that's the version of this model I'd actually be comfortable running. Until then, the fine-tuned checkpoint stays on my laptop, and the house stays on Jev.

If you're running Laya, or any Jev-compatible model, at home, I'd really like to hear how you handle the context window and what you train it on. The comments are open.

## How it was built

Two Claude Code sessions with Opus 5.5. The first one started from my "let's replace Jev with Laya", worked out how the integration talks to Jev, found the truncation, measured the N100, read my OpenRouter prompt logs in the browser (I signed in myself), replayed them through Laya, and tested every shortening against Jev's noise before changing a single template. When it concluded that only fine-tuning could help, it proposed it as a separate session, which built the dataset, trained the checkpoint on my MacBook, evaluated it and checked how to serve it. A third session read both transcripts and drafted this post. My part was deciding what to test, insisting that Jev's answers must not change, and deciding what to keep, including whether to publish the distillation part at all.
