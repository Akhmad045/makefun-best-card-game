// Ash, the rival duelist: a readable opponent. Every pick follows a simple
// policy the player can learn — heal when hurt, finish a low player, crack a
// shield — and the pick is always telegraphed before the player moves.
import { SUITS } from './cards.js';

/** The strongest card of a list by value, first one on a tie. */
function strongest(cards) {
  let best = cards[0];
  for (const card of cards) if (card.value > best.value) best = card;
  return best;
}

/** Pick the foe's card for this round from its hand. */
export function chooseAiCard(game) {
  const hand = game.foe.hand;
  if (hand.length === 0) return null;
  const rng = game.rng;
  const leaves = hand.filter((card) => card.suit === SUITS.LEAF);
  const attacks = hand.filter(
    (card) =>
      card.suit === SUITS.FLAME ||
      card.kind === 'spark' ||
      (card.kind === 'surge' && game.foe.shield > 0),
  );
  const tricks = hand.filter((card) => card.kind === 'spark' || card.kind === 'douse');
  const shields = hand.filter((card) => card.suit === SUITS.FROST);

  // Hurt? Mend first, most of the time.
  if (game.foe.life <= 8 && leaves.length > 0 && rng() < 0.8) return leaves[0];
  // A low player is finished off.
  if (game.you.life <= 5 && attacks.length > 0) return strongest(attacks);
  // A shielded player invites a crack.
  if (game.you.shield > 0 && tricks.length > 0 && rng() < 0.7) return tricks[0];
  // Otherwise weigh the hand: attack most, shield or heal sometimes.
  const pool = [];
  for (const card of attacks) pool.push([card, 3]);
  for (const card of shields) pool.push([card, 2]);
  for (const card of leaves) pool.push([card, 2]);
  for (const card of hand.filter((card) => card.kind === 'kindle')) pool.push([card, 1]);
  let total = 0;
  for (const [, weight] of pool) total += weight;
  let roll = rng() * total;
  for (const [card, weight] of pool) {
    roll -= weight;
    if (roll <= 0) return card;
  }
  return hand[0];
}

/** The telegraphed intent the table shows before the player moves. */
export function describeIntent(card) {
  switch (card.kind) {
    case 'attack':
      return `Ash is about to strike for ${card.value}!`;
    case 'shield':
      return `Ash raises a ${card.value} shield.`;
    case 'heal':
      return `Ash will mend ${card.value} life.`;
    case 'spark':
      return 'Ash crackles with a Spark…';
    case 'kindle':
      return 'Ash kindles an ember…';
    case 'douse':
      return 'Ash is about to douse your shield!';
    case 'surge':
      return 'Ash gathers a Surge…';
    default:
      return 'Ash plays a card…';
  }
}
