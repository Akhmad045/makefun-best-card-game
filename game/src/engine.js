// Ember Duel engine: pure game rules, no DOM. A game is two duelists, each with
// life, shield, a hand, a deck and a discard pile; cards resolve in the order
// they are played, and the first duelist at 0 life loses.
import { buildDeck, SUITS } from './cards.js';
import { createRng, shuffle } from './random.js';
import { chooseAiCard, describeIntent } from './ai.js';

export const MAX_LIFE = 20;
export const MAX_SHIELD = 10;
export const HAND_SIZE = 5;

function newDuelist(deck) {
  return { life: MAX_LIFE, shield: 0, hand: [], deck, discard: [], banked: false, kindle: 0 };
}

/** A fresh duel: shuffled decks, five cards each, round one. */
export function createGame(seed) {
  const rng = createRng(seed);
  const game = {
    seed,
    rng,
    round: 1,
    log: [],
    you: newDuelist(shuffle(buildDeck(), rng)),
    foe: newDuelist(shuffle(buildDeck(), rng)),
    bankedEmber: false,
    kindleBonus: 0,
    aiPick: null,
    aiIntent: '',
  };
  drawUpTo(game, game.you, HAND_SIZE);
  drawUpTo(game, game.foe, HAND_SIZE);
  return game;
}

/** Draw one card, reshuffling the discard into the deck when it runs out. */
export function drawCard(game, duelist) {
  if (duelist.deck.length === 0) {
    if (duelist.discard.length === 0) return null;
    duelist.deck = shuffle(duelist.discard, game.rng);
    duelist.discard = [];
  }
  return duelist.deck.pop() ?? null;
}

/** Draw until the hand holds `count` cards, or the cards run out. */
export function drawUpTo(game, duelist, count) {
  while (duelist.hand.length < count) {
    const card = drawCard(game, duelist);
    if (card === null) break;
    duelist.hand.push(card);
  }
}

/**
 * Start a round: both duelists draw back to five, and the foe picks a card
 * and telegraphs it, so the player can read the move and counter it.
 */
export function startRound(game) {
  drawUpTo(game, game.you, HAND_SIZE);
  drawUpTo(game, game.foe, HAND_SIZE);
  game.aiPick = chooseAiCard(game);
  game.aiIntent = game.aiPick ? describeIntent(game.aiPick) : '';
}

/** Damage soaks into shield first; whatever is left hits life. */
function applyDamage(target, amount) {
  const absorbed = Math.min(target.shield, amount);
  target.shield -= absorbed;
  target.life = Math.max(0, target.life - (amount - absorbed));
  return { absorbed, dealt: amount - absorbed };
}

/**
 * Resolve one card from `actor` onto `target`. Banked Ember (+2 Flame after a
 * Frost) and Kindle (+3 to the next Flame) live on the actor and are spent by
 * the Flame card that uses them.
 */
export function resolveCard(game, actor, target, card, actorName, targetName) {
  const flameBonus = actor.banked ? 2 : 0;
  switch (card.kind) {
    case 'attack': {
      const damage = card.value + flameBonus + actor.kindle;
      const result = applyDamage(target, damage);
      actor.banked = false;
      actor.kindle = 0;
      game.log.push(`${actorName} played ${card.name} for ${damage} damage${result.absorbed ? ` (${result.absorbed} soaked by shield)` : ''}.`);
      break;
    }
    case 'shield': {
      actor.shield = Math.min(MAX_SHIELD, actor.shield + card.value);
      actor.banked = true;
      game.log.push(`${actorName} raised ${card.value} shield. Ember banked — the next Flame hits +2.`);
      break;
    }
    case 'heal': {
      actor.life = Math.min(MAX_LIFE, actor.life + card.value);
      game.log.push(`${actorName} restored ${card.value} life.`);
      break;
    }
    case 'spark': {
      const wasShielded = target.shield > 0;
      const damage = card.value + (wasShielded ? 2 : 0);
      applyDamage(target, damage);
      game.log.push(`${actorName} sparked for ${damage} damage${wasShielded ? ' — the shield cracked' : ''}.`);
      break;
    }
    case 'kindle': {
      actor.kindle = 3;
      game.log.push(`${actorName} kindled an ember. The next Flame card deals +3.`);
      break;
    }
    case 'douse': {
      target.shield = 0;
      applyDamage(target, card.value);
      game.log.push(`${actorName} doused the shield and dealt ${card.value} damage.`);
      break;
    }
    case 'surge': {
      applyDamage(target, actor.shield);
      game.log.push(`${actorName} surged for ${actor.shield} damage, equal to their shield.`);
      break;
    }
    default:
      game.log.push(`${actorName} played ${card.name}.`);
  }
  // Keep the player's combo flags mirrored at the top level for the table.
  game.bankedEmber = game.you.banked;
  game.kindleBonus = game.you.kindle;
}

/** Play one of your cards by id; returns false when the card is not in hand. */
export function playPlayerCard(game, cardId) {
  const index = game.you.hand.findIndex((card) => card.id === cardId);
  if (index === -1) return false;
  const [card] = game.you.hand.splice(index, 1);
  resolveCard(game, game.you, game.foe, card, 'You', 'Ash');
  game.you.discard.push(card);
  return true;
}

/** Resolve the foe's chosen card; returns false when it is not in hand. */
export function resolveAiCard(game, card) {
  const index = game.foe.hand.findIndex((held) => held.id === card.id);
  if (index === -1) return false;
  const [played] = game.foe.hand.splice(index, 1);
  resolveCard(game, game.foe, game.you, played, 'Ash', 'You');
  game.foe.discard.push(played);
  return true;
}

export function isOver(game) {
  return game.you.life <= 0 || game.foe.life <= 0;
}

/** 'you' | 'foe' | null while the duel is still going. */
export function winnerOf(game) {
  if (game.foe.life <= 0 && game.you.life <= 0) return 'you';
  if (game.foe.life <= 0) return 'you';
  if (game.you.life <= 0) return 'foe';
  return null;
}
