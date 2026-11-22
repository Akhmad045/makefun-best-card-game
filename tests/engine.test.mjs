// Tests for the Ember Duel engine (pure logic, no DOM).
// Run: node --test tests/engine.test.mjs   (from the repo root)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDeck, SUITS } from '../game/src/cards.js';
import { createGame, startRound, playPlayerCard, resolveAiCard, isOver, winnerOf } from '../game/src/engine.js';
import { chooseAiCard, describeIntent } from '../game/src/ai.js';

test('deck has 24 cards, each with a suit, value, name and effect text', () => {
  const deck = buildDeck();
  assert.equal(deck.length, 24);
  for (const card of deck) {
    assert.ok(Object.values(SUITS).includes(card.suit), `bad suit on ${card.name}`);
    assert.equal(typeof card.value, 'number');
    assert.ok(card.value >= 0);
    assert.ok(card.name.length > 0);
    assert.ok(card.text.length > 0);
    assert.ok(card.id.length > 0);
  }
  assert.equal(new Set(deck.map((c) => c.id)).size, 24);
});

test('deck holds all four suits', () => {
  const suits = new Set(buildDeck().map((c) => c.suit));
  assert.equal(suits.size, 4);
});

test('a new game starts both duelists at 20 life with a 5-card hand', () => {
  const game = createGame(1);
  assert.equal(game.you.life, 20);
  assert.equal(game.foe.life, 20);
  assert.equal(game.you.shield, 0);
  assert.equal(game.foe.shield, 0);
  assert.equal(game.you.hand.length, 5);
  assert.equal(game.round, 1);
  assert.equal(isOver(game), false);
});

test('Flame attack deals its value as damage', () => {
  const game = createGame(7);
  const strike = buildDeck().find((c) => c.suit === SUITS.FLAME && c.value === 4);
  game.you.hand = [strike];
  startRound(game);
  playPlayerCard(game, strike.id);
  assert.equal(game.foe.life, 20 - strike.value);
});

test('shield absorbs damage before life, and is spent', () => {
  const game = createGame(11);
  const guard = buildDeck().find((c) => c.suit === SUITS.FROST);
  game.you.hand = [guard];
  startRound(game);
  playPlayerCard(game, guard.id);
  assert.equal(game.you.shield, guard.value);
  // Foe strikes for 5 through the shield.
  game.foe.hand = [{ id: 'test-strike', suit: SUITS.FLAME, kind: 'attack', value: 5, name: 'Test Strike', text: '' }];
  resolveAiCard(game, game.foe.hand[0]);
  const absorbed = Math.min(guard.value, 5);
  assert.equal(game.you.shield, guard.value - absorbed);
  assert.equal(game.you.life, 20 - (5 - absorbed));
});

test('heal restores life but never above 20', () => {
  const game = createGame(13);
  game.you.life = 19;
  const mend = buildDeck().find((c) => c.suit === SUITS.LEAF);
  game.you.hand = [mend];
  startRound(game);
  playPlayerCard(game, mend.id);
  assert.equal(game.you.life, 20);
});

test('Banked Ember: Flame deals +2 when the previous card was Frost', () => {
  const game = createGame(17);
  const deck = buildDeck();
  const frost = deck.find((c) => c.suit === SUITS.FROST);
  const strike = deck.find((c) => c.suit === SUITS.FLAME);
  game.you.hand = [frost, strike];
  startRound(game);
  playPlayerCard(game, frost.id);
  assert.equal(game.bankedEmber, true);
  const foeLifeBefore = game.foe.life;
  playPlayerCard(game, strike.id);
  assert.equal(game.foe.life, foeLifeBefore - (strike.value + 2));
  assert.equal(game.bankedEmber, false);
});

test('Kindle adds +3 to the next Flame card only', () => {
  const game = createGame(19);
  const deck = buildDeck();
  const kindle = deck.find((c) => c.kind === 'kindle');
  const strike = deck.find((c) => c.suit === SUITS.FLAME);
  game.you.hand = [kindle, strike];
  startRound(game);
  assert.ok(kindle, 'deck should contain a Kindle');
  playPlayerCard(game, kindle.id);
  assert.equal(game.kindleBonus, 3);
  const foeLifeBefore = game.foe.life;
  playPlayerCard(game, strike.id);
  assert.equal(game.foe.life, foeLifeBefore - (strike.value + 3));
  assert.equal(game.kindleBonus, 0);
});

test('Spark deals +2 when the foe is shielded', () => {
  const game = createGame(23);
  game.foe.shield = 4;
  const spark = buildDeck().find((c) => c.kind === 'spark');
  game.you.hand = [spark];
  startRound(game);
  playPlayerCard(game, spark.id);
  // 2 base + 2 bonus = 4 damage, all absorbed by the 4 shield.
  assert.equal(game.foe.shield, 0);
  assert.equal(game.foe.life, 20);
});

test('Douse strips the foe shield and deals 1', () => {
  const game = createGame(29);
  game.foe.shield = 5;
  const douse = buildDeck().find((c) => c.kind === 'douse');
  game.you.hand = [douse];
  startRound(game);
  playPlayerCard(game, douse.id);
  assert.equal(game.foe.shield, 0);
  assert.equal(game.foe.life, 19);
});

test('Surge deals damage equal to your own shield', () => {
  const game = createGame(31);
  game.you.shield = 4;
  const surge = buildDeck().find((c) => c.kind === 'surge');
  game.you.hand = [surge];
  startRound(game);
  playPlayerCard(game, surge.id);
  assert.equal(game.foe.life, 16);
});

test('reducing a duelist to 0 life ends the game with the right winner', () => {
  const game = createGame(37);
  game.foe.life = 3;
  const strike = buildDeck().find((c) => c.suit === SUITS.FLAME && c.value >= 4);
  game.you.hand = [strike];
  startRound(game);
  playPlayerCard(game, strike.id);
  assert.equal(isOver(game), true);
  assert.equal(winnerOf(game), 'you');
});

test('drawing back to 5 each round never loses cards; empty deck reshuffles', () => {
  const game = createGame(41);
  let total = 0;
  for (let round = 0; round < 12; round += 1) {
    startRound(game);
    total = game.you.hand.length + game.you.deck.length + game.you.discard.length;
    assert.equal(total, 24, `round ${round}: cards must total 24`);
    const card = game.you.hand[0];
    playPlayerCard(game, card.id);
    resolveAiCard(game, game.foe.hand[0]);
  }
});

test('AI choice is deterministic for a fixed seed', () => {
  const a = createGame(53);
  const b = createGame(53);
  startRound(a);
  startRound(b);
  const pickA = chooseAiCard(a);
  const pickB = chooseAiCard(b);
  assert.equal(pickA.id, pickB.id);
  assert.ok(describeIntent(a, pickA).length > 0);
});

test('AI prefers healing when its life is low', () => {
  const game = createGame(59);
  game.foe.life = 4;
  const deck = buildDeck();
  game.foe.hand = [
    deck.find((c) => c.suit === SUITS.LEAF),
    deck.find((c) => c.suit === SUITS.FLAME),
    deck.find((c) => c.suit === SUITS.FROST),
    deck.find((c) => c.kind === 'spark'),
    deck.find((c) => c.kind === 'kindle'),
  ];
  const pick = chooseAiCard(game);
  assert.equal(pick.suit, SUITS.LEAF);
});

test('playing a card removes it from the hand and into the discard', () => {
  const game = createGame(61);
  startRound(game);
  const before = game.you.hand.length;
  const card = game.you.hand[2];
  playPlayerCard(game, card.id);
  assert.equal(game.you.hand.length, before - 1);
  assert.ok(game.you.discard.some((c) => c.id === card.id));
  assert.equal(game.log.length > 0, true);
});
