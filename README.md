# DrillLab — Practising Until You Can Do It Alone

A study app I built for myself. The goal is not "I understood the solution" — it is
**writing it in an empty folder, with no answer in front of you**.

## Where the material comes from

While learning React, GraphQL and Spring Boot, I kept running into problems and concepts
that were more interesting than the tutorials around them — some from things I read, some
from formats friends described, some I hit myself and had to work out. I wanted somewhere to
put them so I could come back and practise, rather than re-reading the same articles and
mistaking recognition for ability.

**Everything here is written by me.** The problems are my own, built to exercise the ideas
they came from; the lessons are my own explanations; the reference solutions are mine. If a
problem was inspired by a format I had seen, I wrote a new scenario for it rather than
reproducing anything. It is a study project, and it is public in case it is useful to
someone learning the same things.

![The home — four tracks, each giving you less than the last](docs/home.jpg)

*The home — four tracks, each giving you less than the last*

![The drill track — question banks with flashcards](docs/drill.jpg)

*The drill track — question banks with flashcards*

## Four tracks

The tracks differ by **how much you are given** — each one hands you less than the last:

| Track | What it is | What you get | Goal |
| --- | --- | --- | --- |
| `/drill` | 105 short questions | A question; you answer out loud | Be able to say it |
| `/practice` | 148 in-lesson exercises | Blanks already cut, waiting to be filled | Be able to recognise it |
| `/code` | 25 coding problems | Files, dependencies and tests all provided | Be able to write it correctly |
| `/arena` | 7 timed sittings (2 full mocks) | An empty folder, a clock, no hints | Be able to do it from nothing |

`/path` is the course archive — 80 written lessons explaining the ideas behind the
problems. It is a reference to come back to when stuck, not the main line.

## What it covers

Five courses: foundations, React, GraphQL Federation, a mixed interview set, and one
Context-based React build. In practice that means React and hooks, TypeScript, GraphQL and
Apollo Federation, Node subgraphs, and a Java Spring Boot service — plus the production
concerns that come with them, like error handling, correlation IDs and configuration.

It starts from "what does `npm install` actually do" and assumes nothing before that.

## Running code in the browser

**Yes, in one place: 21 of the `/code` problems.** Open the workspace and you get a real
editor, a preview and a test panel; hitting "run tests" gives you actual pass/fail output
with diffs and line numbers. Each of those 21 was verified from both ends — the starting
files genuinely fail, and the reference implementation genuinely passes.

This needs network access: the bundler and npm dependencies run on CodeSandbox's remote
service. Offline, it falls back to a "run it locally" card.

The remaining 4 have no sandbox, and each page says why — Node/JVM projects cannot start a
server process inside a browser iframe, and two of them need `fetch` or
`HTMLMediaElement.prototype` stubbed, which this environment cannot intercept (they pass
locally under vitest).

**`/practice`'s "check" does not run code** — it is regex matching after comments are
stripped. It can tell whether you used `filter` instead of `push`; it cannot tell whether
your code actually works. The pages say so explicitly.

**`/arena` and `/mock` deliberately have no runtime.** Not because it is impossible, but
because adding it would remove the hardest and most valuable tier. In exchange, the "how to
run this locally" instructions there have to be exact: commands you can copy verbatim, the
full file tree, and real measured numbers for what you should see before and after.

## Running locally

```bash
npm install
npm run dev        # port 3000 by default

npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run gen:nav    # regenerate content/nav.ts after editing course content
npm run gen:src    # re-snapshot reference projects after editing sourceFiles
```

## Scale

| | Count |
| --- | --- |
| Courses | 5 |
| Modules | 27 |
| Lessons | 80 |
| In-lesson exercises | 148 |
| Debug Labs | 26 |
| Short-answer questions | 105 |
| Coding problems | 25 (21 runnable in the browser) |
| Arena problems | 7 (5 rebuilds + 2 mocks) |
| Prerendered pages | 251 |

## Content integrity rules

The question tracks are **derived** from the lesson content rather than stored twice — two
copies means two truths, and the one you forget to update is the one people read. Every
table asserts its own shape at build time: if a count is off, a number has a gap, or a
referenced exercise cannot be found, **the build fails**.

---

© 2026 Weiren Feng.
