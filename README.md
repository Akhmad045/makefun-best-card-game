# Ember Duel

[![Ember Duel](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Rank](https://make.fun/badge/best-card-game-20261122-1826/Akhmad045/makefun-best-card-game/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Reward](https://make.fun/badge/best-card-game-20261122-1826/Akhmad045/makefun-best-card-game/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

**Ember Duel** — a tactical card duel for the [make.fun best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826). You face Ash the Ember Knight across a green felt table. Both duelists start at 20 life; first to 0 loses.

## How it plays

Each round Ash telegraphs a move, then you play one card from your hand of five — click it, or press 1–5. Four suits, told apart by colour *and* shape:

- **Flame ▲** (red) — strikes for its value.
- **Frost ◆** (blue) — shields, and banks an ember so your next Flame hits +2.
- **Leaf ●** (green) — heals.
- **Storm ★** (purple) — tricks: Spark cracks a shielded foe, Kindle adds +3 to your next Flame, Douse strips a shield, Surge hits for your own shield value.

Cards combine: shield, then strike with the banked ember; kindle, then wildfire. Ash's choices are readable — heal when hurt, finish a low duelist, crack a shield — so every hand is a decision you can answer.

## Play it

Serve `game/` with any static server (`node serve.ts`, then open http://localhost:8080) and play offline in a desktop browser — no network, no build step. `?shot=start|play|win|loss` stages a reproducible scene for the screenshots in `screenshots/`.

Referral code: `4g7knchf`
