# Changelog

## 2026-10-09 to 2026-10-10 — audit fixes

An audit of the site covered bugs, UI and UX, accessibility, performance and
the teaching content in both languages. Each fix below is its own pull request,
and all are merged into `main`. The end-to-end suite grew from 34 tests in 3
files to 124 in 14: 106 pass, and 18 are skipped by design because they apply
to one screen width or only need one of the two browser projects.

### Bugs

- Two tabs no longer wipe each other's progress: every write starts from what
  is in storage, and the other tabs follow along. A stored plan id that no
  longer exists is dropped instead of hiding the one Continue button ([#20]).
- The arena records the moment you hand in, so an on-time sitting is never
  scored as over time because you reviewed it later ([#21]).
- The flashcard result screen ignores the rating keys; resuming a round keeps
  the ratings made before leaving; a redo round is not resumed as the original
  ([#22]).
- Cold loads no longer fail to hydrate now and then: the two bootstrap scripts
  moved from `<head>` to the start of `<body>`. The audit saw React error #418
  on about 11% of cold loads (30 of 270); afterwards `/path` had 0 of 120 in
  production ([#29]).
- Sandbox edits survive switching mode or theme and reloading the page, and
  the first "Run tests" click no longer gets lost while the runner starts
  ([#26]).

### English and Chinese copy in the interface

- The English UI shows the English fields that already existed: arena
  scenarios, course and mock titles, categories, prerequisites, the Continue
  lesson name, the difficulty badge ([#23]).
- Answer tabs follow the interface language before hydration, after
  client-side navigation and on flipped flashcards ([#24]).
- Exercise starters and file names follow the interface language ([#25]);
  expected command output does too ([#39]).
- Coding hints come in English, and a problem whose answer is overridden keeps
  its hints ([#32]).
- Chinese copy no longer shows the stray spaces JSX made from line breaks:
  2,845 edits in 31 files, and `npm run audit:zh` in CI keeps it that way.
  The audit's scan of 255 pages went from 3,589 to 0 outside code blocks
  ([#45]).
- Multi-line hints keep their line breaks ([#41]).

### Teaching content

- Debug Labs and symptoms rewritten from real runs where the error shown could
  not happen, and core rules that were stated backwards corrected:
  Foundations ([#33]), React ([#34]), GraphQL Federation ([#35]), the
  interview course ([#36]) and Cab Booking ([#37]).
- The answer behind every coding problem's answer gate now turns its own
  sandbox green (11 of the 21 did not); four problems no longer show another
  problem's English brief, and three got a brief of their own ([#38]).
- The four data-flow diagrams ([#31]), the arena hints ([#40]) and the
  missing source-file roles ([#44]) are in English; the two mock exams got
  real four-level hints ([#40]).
- The last hint of the two React rebuilds no longer hands over the whole
  answer ([#42]); guided-plan copy and exercise labels are corrected
  ([#43]); interface copy the content audit flagged is fixed ([#32]).
- The generated navigation, manifests and search index are rebuilt from the
  corrected content ([#46]).

### Accessibility

- The code editor no longer traps the keyboard: Shift+Tab, or Esc then Tab,
  leaves it ([#25]).
- The search dialog keeps Tab inside, closes on Esc from anywhere, returns
  focus and exposes the selected result; the drawer returns focus when closed
  from the scrim and closes when the window widens ([#27]).
- The flashcard page has an h1 ([#22]); the mock page no longer skips a
  heading level; phone touch targets are at least 24px; the mock self-score is
  validated ([#28]).
- Text fields are 16px on phones, so iOS does not zoom in ([#25]).

### Performance

- `content/nav` left the shell's first-load JavaScript: Continue reads the
  track manifest, the context sidebar loads lazily, and the search index
  loads when search first opens. Transferred first-load JS (gzip): `/` 164 →
  125 KB, lessons 189 → 157 KB, `/code/[id]` 168 → 135 KB ([#27], [#30]).

### Tooling and dependencies

- `CLAUDE.md` matches the code again: the theme defaults to dark, the
  bootstrap scripts' place and why, and new first-load baselines ([#46]).
- Patched advisories for js-yaml, Next.js (15.5.27), sharp, brace-expansion
  and source-map-js, lockfile only ([#47]).

### Not changed

- The review page still carries the hints and the reference answer in its
  HTML before you check yourself off. The gate is a self-discipline tool with
  its own "show me anyway" link; making it airtight would mean a separate
  route for the answer.
- The coding sandboxes themselves (starter files and tests) are unchanged; a
  sandbox change only counts once it has been run in the browser sandbox.
- Mock exam B's data source stays marked as a demo: it was run against local
  stand-ins, not the real packages.
- Five dev-only advisories in the eslint-config-next chain remain; npm's only
  fix is a downgrade to eslint-config-next 14.

[#20]: https://github.com/renrenmimi/DrillLab/pull/20
[#21]: https://github.com/renrenmimi/DrillLab/pull/21
[#22]: https://github.com/renrenmimi/DrillLab/pull/22
[#23]: https://github.com/renrenmimi/DrillLab/pull/23
[#24]: https://github.com/renrenmimi/DrillLab/pull/24
[#25]: https://github.com/renrenmimi/DrillLab/pull/25
[#26]: https://github.com/renrenmimi/DrillLab/pull/26
[#27]: https://github.com/renrenmimi/DrillLab/pull/27
[#28]: https://github.com/renrenmimi/DrillLab/pull/28
[#29]: https://github.com/renrenmimi/DrillLab/pull/29
[#30]: https://github.com/renrenmimi/DrillLab/pull/30
[#31]: https://github.com/renrenmimi/DrillLab/pull/31
[#32]: https://github.com/renrenmimi/DrillLab/pull/32
[#33]: https://github.com/renrenmimi/DrillLab/pull/33
[#34]: https://github.com/renrenmimi/DrillLab/pull/34
[#35]: https://github.com/renrenmimi/DrillLab/pull/35
[#36]: https://github.com/renrenmimi/DrillLab/pull/36
[#37]: https://github.com/renrenmimi/DrillLab/pull/37
[#38]: https://github.com/renrenmimi/DrillLab/pull/38
[#39]: https://github.com/renrenmimi/DrillLab/pull/39
[#40]: https://github.com/renrenmimi/DrillLab/pull/40
[#41]: https://github.com/renrenmimi/DrillLab/pull/41
[#42]: https://github.com/renrenmimi/DrillLab/pull/42
[#43]: https://github.com/renrenmimi/DrillLab/pull/43
[#44]: https://github.com/renrenmimi/DrillLab/pull/44
[#45]: https://github.com/renrenmimi/DrillLab/pull/45
[#46]: https://github.com/renrenmimi/DrillLab/pull/46
[#47]: https://github.com/renrenmimi/DrillLab/pull/47
