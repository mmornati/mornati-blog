---
title: "Your Agents Ship Fast. Make Them Pass a Release Gate First"
categories:
- ai-coding-agents
tags:
- ai
- claude-code
- ai-agent
- privacy
- security
- release-engineering
- ci
- git
date: '2026-10-20T16:00:00.000000+00:00'
draft: false
slug: your-agents-ship-fast-make-them-pass-a-release-gate
translationKey: release-gate
cover: cover.jpg
showHero: true
description: Coding agents write code, tests, fixtures and docs on your behalf, often with your real data in their context. Without a check that knows what "personal" means for you, some of that data ends up in a public repository. How ai-finance-coach turns every mandatory pre-release check into one command, keeps the list of private terms off the repository, and makes agents, CI and the release workflow all go through it.
summary: Before tagging ai-finance-coach 1.0.0, one command found my first name in a test, an employer in a test id and one of my own figures in the demo data, all in a repository with green CI. What leaks when agents work with real data, why CI and secret scanners can't see it, and the generic recipe I use now - one scripted release gate, a local term file that never enters the repository, and four places that force everyone, agents included, to run it.
projects:
- ai-finance-coach
---

Agents now do a lot of my work. They open pull requests while I sleep, they write the tests, they update the docs, they fix CI. Most of the time the result is good. But "most of the time" is not the bar for a repository that is public and that is built on top of my bank accounts.

This weekend, before tagging [ai-finance-coach](https://github.com/mmornati/ai-finance-coach) 1.0.0, I ran one command:

```bash
uv run coach dev release-check
```

It answered **NOT READY**, with 142 hits in the personal data scan. Most of them were noise (I'll come back to that), but not all. In a repository with green CI on every merged pull request, it found:

- **my first name** in the SSO tests, in a web form test and in two docs;
- **the name of an employer** in a test id;
- **one of my own figures** in the rental-tax test, and another one in the synthetic demo data.

Nobody put them there on purpose. That is exactly the problem. This post is about the check that found them, and more generally about how to force agents to pass the same gate every time they deliver something.

## 1. Where the leaks come from

ai-finance-coach syncs the household's bank accounts through PSD2 and keeps everything in an encrypted local database ([I presented it here](/new-week-another-ai-coach-ai-finance-coach/)). To know whether a change breaks something, synthetic tests are not enough: the real descriptions of my banks are messier than anything I can invent. So I often validate a pull request against real data, on a scratch copy of the database (`coach backup`, then `coach restore` into a throwaway folder).

That is a good practice for the code. It is a bad one for the repository, because now real data is in the agent's context. And an agent that writes a test reaches for the most concrete example it has seen. In a project that runs on your bank data, the most concrete example is yours: the name in the SSO claim, the merchant that broke the parser, the exact amount of the loan payment.

It doesn't stop at tests. The places I found or had to protect:

- **tests and fixtures**: a "realistic" value copied from a real run;
- **docs and changelog**: an example that is a bit too real;
- **demo data**: a seed generator where one invented figure happened to equal a real one;
- **tool files**: `.claude/settings.json` holds absolute paths with your home folder;
- **the agents' own workspace**: Claude Code keeps worktrees in `.claude/worktrees/`, full copies of the repository with their own settings files.

## 2. Why CI can't see it

CI was green on every one of those pull requests. It had no reason not to be:

- **CI doesn't know what is personal.** A secret scanner finds an API key or a private key block. It doesn't know that "Quenby" is the town where you live or that 1,357.91 is your mortgage payment.
- **You can't give CI the list.** The list of what identifies your household is itself the most sensitive file you have. You can't commit it, and a hash doesn't help: a hash of a first name is reversed with a dictionary in seconds.
- **Reviewers don't see it either.** A name in a test fixture looks like any other test name. Reviewing hundreds of agent pull requests, you read the logic, not the sample values.

So the check has to run where the list is: on my machine. And it has to run every time, which means I can't rely on remembering it.

## 3. One command for every mandatory check

The first decision was to stop having a checklist in my head. Everything that must be true before a release is a script, with one exit code: `coach dev release-check` ([`src/coach/release.py`](https://github.com/mmornati/ai-finance-coach/blob/main/src/coach/release.py), documented in [`docs/release.md`](https://github.com/mmornati/ai-finance-coach/blob/main/docs/release.md)).

```text
coach dev release-check (coach 0.2.0, ~/Projects/ai-finance-coach)
  [ok  ] LICENSE file              LICENSE
  [ok  ] Owner placeholders        no licence / contact / repository placeholder left
  [ok  ] Version                   0.2.0, changelog dated 2026-10-06
  [ok  ] Web app build             built (5 asset reference(s) present)
  [FAIL] Personal data scan        142 hit(s) in 885 files (publishable + sdist): .github/CODEOWNERS:2  [real-data:machine#1163]; CODE_OF_CONDUCT.md:17  [real-data:machine#1163]; ...
  [ok  ] Real-data terms           the local term file was used (1163 terms)
  [ok  ] Package metadata          ai-finance-coach 0.2.0, python >=3.11
  [ok  ] Wheel contents            the built web app, the configuration example and the import profiles are packaged
  [ok  ] Shipped templates         memory skeleton present
  [ok  ] Project URLs              set
  [ok  ] Documentation             9 required documents present
  [ok  ] .gitignore                personal-data paths are ignored
  [ok  ] Docker files (static)     Dockerfile, docker-compose.yml and .dockerignore pass the policy (not built here)
  [ok  ] CI workflow               runs pytest, the web tests, ruff and release-check
  [FAIL] Python tests              exit 1: FAILED tests/test_hygiene.py::test_with_the_owners_local_term_file_the_repository_is_clean_too
  [ok  ] Lint (ruff)               passed
  [ok  ] Web tests (vitest)        passed
  [ok  ] Web type check            passed

NOT READY: 2 check(s) failed. See docs/release.md.
```

That is the real output of the run I described at the top. The fixes went into the 1.0.0 pull request, and this same command is what has to print READY before a tag.

Three rules make it useful instead of decorative:

1. **Each check is `ok`, `fail` or `skip`, and a skip is never a success.** `--skip-tests` exists to go faster, but the run then says it is not release-grade. A missing term file is a **failure**, not a silent pass: a scan without the list proves nothing about your household.
2. **It checks the boring things too.** Version in `pyproject.toml` = version in the code = the top dated section of the changelog. No `TODO(license)` placeholder left. The web app built and not older than its sources. Boring checks are the ones an agent skips when it is "almost done".
3. **It sends nothing anywhere.** It only runs local tools, so it can run on the machine that holds the data without a second thought.

## 4. The personal data scan, in two layers

The interesting check is the personal data scan ([`src/coach/hygiene.py`](https://github.com/mmornati/ai-finance-coach/blob/main/src/coach/hygiene.py)). It has two layers.

**Structural rules, in the repository.** They contain nothing about anybody, so they can be public and run everywhere, CI included: a private key block, an API key, a home folder path (`/Users/<name>/`) that is not an obvious placeholder, an IBAN **with a valid checksum** (examples and tests use invalid ones), an e-mail address outside the reserved example domains.

**Real-data terms, outside the repository.** Everything that identifies my household lives in a local file, `~/.ai-finance-coach/hygiene-terms.txt`, built from my own database and memory:

```text
$ uv run coach dev hygiene --build-terms
wrote 1163 term(s) to ~/.ai-finance-coach/hygiene-terms.txt (mode 0600; never commit or share it). Terms per category:
  name         20
  employer     3
  place        19
  school       1
  account      14
  id           22
  counterparty 19
  merchant     955
  amount       108
  machine      2
```

Names, employers, towns, schools, account labels, IBAN fragments, people I send money to, distinctive merchants, exact recurring amounts, loan figures, and the login and host name of the machine. The details that make it safe to have such a file:

- it is written **0600 from the first byte** and is git-ignored;
- the scan **refuses a term file inside the repository**, so it can't be committed by accident;
- the command **prints counts, never a term**;
- a hit **never prints the matched text**, only `file:line` and the category and number of the term, like `CODE_OF_CONDUCT.md:17 [real-data:machine#1163]` above. The report itself can be pasted in an issue or read by an agent;
- matching ignores case, accents, punctuation and spacing, and finds an amount written `1234.56`, `1 234,56` or `1234,56`.

Generic merchants (a supermarket chain, a bank label) are left out on purpose: they are public, and flagging them would only make noise.

## 5. Scan what actually ships

The first full run on my machine failed for a reason I didn't expect: the scan walked into `.claude/worktrees/`, where Claude Code keeps one copy of the repository per session. Each copy had its own `docs/release.md` with the placeholder markers and its own `.claude/settings.json` with my home folder. 4,211 files scanned, three checks red, all because of the agents' workspace.

Those files are not published: they are git-ignored, or they belong to another checkout. The fix was to define "publishable" precisely:

- **what git would publish**: the scan applies `.gitignore` itself (last match wins, negations, excluded parents), so the rule is the same whether the folder is a repository or not;
- **never another checkout**: a folder below the root with its own `.git` is a worktree, a nested clone or a submodule, and is skipped;
- **plus what you actually ship**: the member list of the sdist, and the content of the wheel and sdist in `dist/` when they exist. A file can be ignored by git and still end up in a package.

After that, 885 files. That is the real surface, and the gate looks at all of it.

## 6. Forcing everyone through the gate, agents included

A gate that depends on someone remembering it is a suggestion. ai-finance-coach puts it in four places, from the cheapest to the strictest.

**1. The agent's instructions.** `CLAUDE.md` says which variants are safe for an agent to run on its own (`coach dev hygiene --ci`, `coach dev release-check --skip-tests --skip-web --ci`), and what it must never do: build the terms against the real database, or read, print, move or search the term file. The permission template backs this up with deny rules (`Read(**/hygiene-terms*)`, `Bash(*hygiene-terms*)`), and a test fails if either of them disappears.

**2. The test suite.** The scan is a pytest test (`tests/test_hygiene.py`). Agents run the test suite before they open a pull request (the contributing checklist asks for it), so they run the scan without being asked. The structural rules run everywhere; on my machine, where the term file exists, the real-data rule runs too. The tests themselves use invented values only (the test household is the Zorbax family, living in Quenby-sur-Loze), and trigger strings are built at run time so that the test file never contains what it is looking for.

**3. CI.** A `release-check` job runs `release-check --ci` after the test jobs. `--ci` skips the real-data rule, because CI doesn't have the list, and says so in the output instead of pretending.

**4. The release workflow.** Tags are not pushed by hand. The **Tag a release** workflow takes one input, a checkbox: *"I ran `uv run coach dev release-check` (no --ci, no skips) on this commit and it printed READY"*. It then verifies that the three versions agree, that the tag doesn't exist, and that every CI job is green on that exact commit. Only then does it push the tag and build the release, which runs the check once more on the built archives.

The checkbox is a human statement, not a proof, and that's fine. It is the one step that needs the private list, so it is the one step that stays with me.

If you want a stricter version of point 1, Claude Code hooks can turn the instruction into a hard block. This is not in ai-finance-coach today, but the generic recipe is short. A `PreToolUse` hook on `Bash` that refuses a push, a tag or a release until the gate passes:

```bash
#!/usr/bin/env bash
# .claude/hooks/release-gate.sh: no push, tag or release while the gate is red
cmd=$(jq -r '.tool_input.command // ""')
case "$cmd" in
  *"git push"*|*"git tag"*|*"gh release"*)
    if ! uv run coach dev release-check --skip-tests --skip-web > "${TMPDIR:-/tmp}/release-check.log" 2>&1; then
      echo "release-check is NOT READY: read $TMPDIR/release-check.log and fix it before delivering." >&2
      exit 2   # exit 2 blocks the tool call and sends the message back to the agent
    fi ;;
esac
exit 0
```

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [ { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/release-gate.sh" } ] }
    ]
  }
}
```

The agent then can't deliver without passing the gate, and the message tells it why. A git `pre-push` hook does the same for humans.

## 7. The gate is code too, and it gets things wrong

Back to the 142 hits. Most of them were one term: my login name, which is also my GitHub handle. It matched every repository URL, `CODEOWNERS`, the `LICENSE` and the README. The fix: `--build-terms` now leaves out a machine name that matches the repository owner in the project URLs. That name is public by my own decision.

Then a CSS colour (`#0d1422`) and an id slug (`housing-5050`) matched two of my real amounts. The fix: a number glued to a word is part of an identifier, not an amount.

And that fix was too broad. An automated security review on the commit pointed out that `17.43EUR` or `EUR17.43`, an amount with the currency glued to it, was now skipped too. A false negative in a leak scanner is the worst kind of bug: nothing fails, and the data goes out. A currency next to a number counts as an amount again, with tests for both forms.

Three lessons from that evening:

- **Test the gate like any other code**, with invented data that covers each rule, each false positive you fixed and each false negative you could introduce.
- **A noisy gate gets ignored.** 142 hits, most of them one false positive, is how people learn to skip a check. Fix the noise quickly.
- **Have something review the reviewer.** The false negative was caught by a second automated pass, not by me.

## 8. What the scan can't know

The term list knows names, places and amounts. It doesn't know a situation that is in no term: how many children you have, a health problem you mention in passing in a backlog item, the job you never declared in the app. So step 6 of the release procedure is still human: read the diff of the README and the backlog once more, looking for anything personal that no list can catch.

The gate removes the mechanical part, so the human part gets the attention it needs.

## 9. The recipe, without the finance

Nothing above is specific to bank data. If your agents work with real data, customer records, your company's internal names, your own health or training data, the same recipe applies:

1. **Script every mandatory check in one command** with one exit code. `ok`, `fail`, `skip`; a skip is not a pass.
2. **Split the scan in two**: generic rules in the repository, the list of private terms in a local file that the repository refuses to contain.
3. **Never print what you found**, only where and which category. The report can then travel safely, to an agent, an issue, a CI log.
4. **Scan what ships**: what git publishes plus your packages, and never the agents' own worktrees.
5. **Put the gate everywhere**: in the agent's instructions and permissions, in the test suite, in CI, and as a required step of the release workflow. A hook if you want a hard block.
6. **Keep one human step** for the part that needs the private list, or judgement.
7. **Test the gate**, and fix its noise before people learn to ignore it.

Agents made it cheap to produce code. They didn't make it cheap to un-publish data: once it is in a public git history, it is in every clone and every mirror. A few hundred lines of checks, run every single time, cost far less.

The code is in the [ai-finance-coach repository](https://github.com/mmornati/ai-finance-coach) (MIT): `src/coach/release.py`, `src/coach/hygiene.py` and `docs/release.md` are a good starting point if you want to copy the idea.
