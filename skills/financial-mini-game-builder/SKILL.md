---
name: financial-mini-game-builder
description: Build small, single-file, self-hosted interactive educational games/explainers in the "شهر ابزار مالی" (Financial City) style — narrative-driven, schema-driven wizard intros, hand-drawn illustrations via rough.js (no image files needed), a persistent meter/progress bar, and a modular per-game folder structure. Use this skill whenever the user asks to create a new financial/behavioral/educational mini-game, an "explorable explanation," a Nicky-Case-style interactive story, or wants to add a game to an existing Financial City-style dashboard. Also use it when the user wants a game whose visuals are procedurally drawn (not hand-illustrated) because they say they are weak at drawing/animation.
---

# Financial Mini-Game Builder

This skill captures a specific, tested house style for building short (~10 minute) single-page interactive
educational games in Persian (or any RTL/LTR language) — the kind used in the "شهر ابزار مالی" (Financial City)
project. It was distilled from building 6 real games, and then **unified**: two early games (compound interest,
inflation) started as a separate "tool + wizard" style before being rebuilt into the same scened-narrative
pattern as the other four. There is now **one house style**, not two.

## When to use this

- The user wants a new mini-game/explainer added to an existing Financial-City-style dashboard.
- The user wants an "explorable explanation" (Bret Victor / Nicky Case style) on any topic — finance,
  behavioral psychology, entrepreneurship, health, etc. — not just finance.
- The user says they can't draw/animate but still want illustrated-feeling content. **rough.js solves this.**
- The user wants something schema/data-driven so non-developers (or a future AI) can extend it later.

## One house style: full scened narrative game

Every game is a self-contained multi-scene experience (~7–10 scenes): an **ambiguous, suspenseful hook**
(withhold the topic for 1–2 scenes — a found object, a mysterious phone call, an old door — before revealing
what the game is actually about), a persistent meter tracking one concept across the whole game, a
guess-before-reveal moment, interactive mechanics (round-based decisions, a chart, or Tangle-style
draggable numbers embedded in narrative text), a clickable cycle/diagram scene where relevant, a real-life
application scene, and a personalized summary. See `references/scene-game-pattern.md` for the full scene
checklist and code skeleton, and `references/wizard-schema.md` for the older guess/reveal 4-screen intro
pattern (still useful as a *sub-pattern* for the opening scenes of any game, not as a separate archetype).

**A calculator/chart is a tool *inside* a scene, never the whole game.** If a topic reduces to "adjust some
numbers, see a result" (e.g. compound interest), don't ship it as a bare slider-and-chart page — wrap it in the
suspenseful-hook → guess → explore → apply → summary arc described above. `games/compound-gold/` and
`games/inflation/` are the reference examples of a chart-driven topic done this way (Chart.js lives inside one
scene of a 7-scene narrative, not as the entire page).

**Legacy note:** an earlier iteration of this project had a second, simpler "Tool + Wizard intro" archetype
(`shared/wizard-engine.js`, `assets/wizard-engine.js` + `assets/wizard-styles.css` in this skill). It has been
fully superseded — every game in the current project uses the pattern above instead — but the files are kept
in this skill's `assets/` in case a future project genuinely wants a bare calculator with no narrative at all
(rare; prefer the unified style by default).

## The non-negotiable house rules

1. **No image files required.** All illustration is done with rough.js (hand-drawn-SVG library) via small
   JS draw functions (face, coin, handshake, mirror, arrows, etc.). See `references/roughjs-drawing.md`.
   This is the single most important trick in this style — it means visual quality does not depend on the
   author's drawing/animation skill. Only use real image files if the user explicitly wants photography or
   provides their own art; even then, wrap every `<img>` in an `onerror` fallback (see wizard-schema.md) so a
   missing file degrades to an emoji + filename hint instead of a broken image icon.
2. **Deployable output is one self-contained `index.html` per game**, placed at `games/<slug>/index.html` —
   this file is what actually gets hosted, and it must work standalone (no external sibling files except CDN
   links). Author in modular **source** files under `games/<slug>/src/` (`scenes.html`, one or more
   `NN-*.js` logic files sorted alphabetically, `game-style.css`, and an optional `extra-cdn.txt` listing one
   CDN URL per line for anything beyond rough.js, e.g. Chart.js) — each file under the line-count limit below
   — then run `python3 tools/bundle.py <slug>` to generate the deployable `index.html`. **Never hand-edit the
   generated `index.html`** — edit `src/` and re-run the bundler, or your changes are silently lost the next
   time someone bundles. This gets you real code reuse (shared draw functions and scene navigation live once
   in `shared-src/`, not copy-pasted per game) while still shipping a single preview/deploy-ready file.
3. **No source file over ~300–350 lines.** If a `src/game-logic.js` or `scenes.html` is creeping past that,
   split it further (e.g. a game with many mini-games-within-the-game can split `game-logic.js` into
   `rounds.js` + `summary.js` and list both in the bundler call) rather than letting one file balloon.
4. **Relative paths everywhere.** Never hardcode a domain. `../../dashboard.html`, `../../shared-src/...`,
   `assets/images/...`. The whole project must work unmodified from any host (subdomain, GitHub Pages,
   `wp-content/uploads/...`, or opened directly from disk).
5. **Per-game asset folder**, even if empty: `games/<slug>/assets/images/` and `games/<slug>/assets/audio/`.
   Never share an assets folder between games.
6. **Schema before code.** Story content (screens, choices, payoffs) is data — a JS array/object — not
   hardcoded markup. This is what lets a future AI (or a non-technical user) extend the game by editing data,
   not logic.
7. **A running meter/state, not just a final score.** Every game should track at least one number across the
   whole experience (trust %, doubling time, coins, control) and reflect it back in the summary — this is what
   makes the ending feel earned rather than arbitrary.
8. **RTL Persian by default** unless told otherwise: `<html lang="fa" dir="rtl">`, Vazirmatn font
   (`https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css`), Persian-digit
   formatting helper (`toFa()` — already exported as `FCDraw.toFa`, copy-paste-safe).
9. **End every response of building a game by wiring it into the dashboard** — add a card in
   `dashboard.html`'s `.grid` (see the existing cards for the exact markup pattern), not just the game file
   alone. A game that isn't linked from the hub is unreachable.
10. **After bundling, present the generated `index.html` on its own** (not only inside a zip) so it can be
    previewed immediately — a modular multi-file source tree can't be dragged into a preview as one working
    page, but the bundled output always can.

## Build sequence (follow in order)

1. **Ask or infer the topic and the suspenseful hook.** If ambiguous, propose a one-sentence ambiguous-opening
   idea and confirm before writing code — a half-built wrong hook wastes real effort.
2. **Design on paper first, in the chat, not in code:** write the full scene list (hook → reveal → guess →
   explore/mechanic → cycle if relevant → apply → summary), what the meter measures, and what the core
   interactive mechanic is. Get implicit or explicit buy-in before generating a few hundred lines of HTML.
3. **Scaffold the folder**: `games/<slug>/src/{scenes.html, 01-*.js, ..., game-style.css}` +
   `assets/{images,audio}/`.
4. **Write the HTML/CSS shell** using the palette and structural CSS classes documented in the reference
   files — reuse them verbatim, don't reinvent a new visual language per game. Generic/shared classes (meter,
   dots, scene, btn, cycle-*, char-intro-grid, guess-choice-row, tangle-*) belong in
   `shared-src/paper-theme.css` — only add truly game-specific classes to `src/game-style.css`. If you notice
   a class is now used by a 2nd game, move it to shared immediately; don't wait for a 3rd or 4th use.
   classes (meter, dots, scene, btn, cycle-*) belong in `shared-src/paper-theme.css`, already written — only
   add game-specific classes to `src/game-style.css`.
5. **Write the JS** as one or more `src/NN-*.js` files calling `FCDraw.*` (drawing), `FCScene.init(...)`
   (navigation), and `FCTangle.init(...)` (draggable numbers, if used) — never redefine these; they already
   exist in `shared-src/`.
6. **Bundle**: run `python3 tools/bundle.py <slug>` to generate `games/<slug>/index.html` from the `src/`
   files. Re-run after every edit to `src/`.
7. **Validate before delivering**: run every inline `<script>` block through a JS syntax checker
   (e.g. `node --check`), and grep every `getElementById`/`querySelector` id against the actual HTML ids —
   id-mismatch typos (e.g. an id that lives on the wrong element) are the most common real bug in this style
   and are silent until runtime. Also verify `<div>`/`<section>` open/close tag counts match. Do this on the
   *generated* `index.html`, not just the source fragments, since the bundler concatenation is itself a place
   bugs can hide.
8. **Wire into the dashboard** (rule 9 above).
9. **Present the generated `index.html`** so it can be previewed (rule 10 above), plus the full project.
10. **Tell the user what's still a placeholder** (e.g. `assets/images/scene-01.png` not yet supplied) rather
    than silently shipping broken-looking gaps — but remember rule 1: missing images degrade gracefully, so
    this is a note, not a blocker.

## Reference files (read the relevant one before writing code)

- `references/wizard-schema.md` — the hook/story/guess/transition 4-screen pattern, useful as a sub-pattern
  for a game's opening scenes (see the legacy note above for its original standalone-engine context).
- `references/roughjs-drawing.md` — the rough.js draw-function toolkit (faces, coins, handshakes, mirrors,
  arrows, cycle diagrams) with copy-pasteable code and the exact color palette. Called via `FCDraw.*` — the
  toolkit is already implemented in `shared-src/draw-helpers.js`, don't redefine it.
- `references/scene-game-pattern.md` — full scene checklist, meter/state pattern, round-based mini-game
  engine, the summary-scene personalization pattern, and the `src/` + `bundle.py` authoring workflow.
- **Must exist in the project**: `shared-src/draw-helpers.js`, `shared-src/scene-engine.js`,
  `shared-src/tangle-lite.js`, `shared-src/paper-theme.css`, and `tools/bundle.py` (all copied into this
  skill's `assets/`). If a project doesn't have these yet, create them first (copy from `assets/`) before
  writing any new game — never fork a duplicate copy of the drawing/engine code into a game's own `src/`.

## Two more narrative mechanisms (optional, use where they fit)

- **Tangle-lite (Bret Victor's "reactive documents")** — `shared-src/tangle-lite.js`, exposed as `FCTangle`.
  Numbers live *inside sentences* (`<span class="tangle-num" data-var="rate" data-val="20" data-min="1"
  data-max="80" data-unit="٪">۲۰٪</span>`) and are drag-scrubbable; dependent `<span class="tangle-output">`
  spans update live via a callback (`FCTangle.init(selector, onChange)`). Prefer this over a separate slider
  card when the number is naturally part of a narrated sentence — it keeps the story and the math in the same
  visual object, which is the whole point of Bret Victor's approach.
- **Loopy-style growth loop (Nicky Case)** — no shared module yet (only used once so far, in
  `compound-gold/src/01-loopy.js`); a single stock (circle) redrawn on an interval, radius scaling with the
  value, so the user *watches* compounding accelerate rather than reading a chart. If a third game wants this,
  extract it into `shared-src/loopy-lite.js` first rather than copying the file — don't wait for a fourth
  use to justify extraction; two real uses is already enough signal.

## A real bug this style already produced once — watch for the class

When concatenating multiple `src/*.js` files with a generated comment header per file, get the string-building
logic exactly right — a naive string-join over a header and the file bodies in the wrong order can leave a
`/* ... */` comment unclosed around one file (silently deleting a whole file's code, no error) or an orphaned
`*/` with no matching opener (a hard `SyntaxError`, at least that one is loud). Always `node --check` the fully
concatenated output, not each source file individually — syntax errors introduced by concatenation don't exist
in any single source file.

## What NOT to do

- Don't invent a new illustration approach per game (photoreal AI-generated images, external icon packs) —
  it breaks the visual consistency and reintroduces the drawing-skill dependency this style exists to avoid.
- Don't put story content and rendering logic in the same function — always separate the `screens`/`scenes`
  data array from the code that walks it.
- Don't skip the syntax/id validation step even for "small" changes — the failure mode (blank canvas, dead
  button) is silent and looks like a mystery bug to a non-developer user.
- Don't add a game to the project without also adding its dashboard card — an orphaned game file is invisible
  to the end user.
