// The screenshot scenes behind ?shot=start|play|win|loss. Each one plays the
// real rules forward from a fresh game for a fixed number of rounds, steered
// by a simple autopilot, so the frame is what a short game really looks like
// and the same seed always gives the same frame.
import { createGame, startRound, playPlayerCard, resolveAiCard, isOver, winnerOf } from './engine.js';
import { SUITS, buildDeck } from './cards.js';

const PLAY_ROUNDS = 7;
const SIM_LIMIT = 40;

/**
 * The autopilot's taste, by scene: 'cautious' heals when hurt and banks
 * embers (win scene), 'reckless' never heals (loss scene), 'aggressive'
 * strikes first and asks later (play scene, so the table shows damage).
 */
function autopilotPick(game, style) {
  const hand = game.you.hand;
  const leaves = hand.filter((card) => card.suit === SUITS.LEAF);
  const flames = hand.filter((card) => card.suit === SUITS.FLAME);
  const frosts = hand.filter((card) => card.suit === SUITS.FROST);
  const storms = hand.filter((card) => card.suit === SUITS.STORM);
  const strongestFlame = () =>
    flames.reduce((best, card) => (card.value > best.value ? card : best), flames[0]);
  if (style === 'aggressive') {
    if (game.you.life <= 5 && leaves.length > 0) return leaves[0];
    if (flames.length > 0) return strongestFlame();
    if (storms.length > 0) return storms[0];
    if (frosts.length > 0) return frosts[0];
    return hand[0];
  }
  if (style === 'cautious' && game.you.life <= 8 && leaves.length > 0) return leaves[0];
  if (game.foe.life <= 6 && flames.length > 0) return strongestFlame();
  if (game.bankedEmber && flames.length > 0) return flames[0];
  if (game.you.shield === 0 && frosts.length > 0 && game.foe.life > 10) return frosts[0];
  if (flames.length > 0) return flames[0];
  if (storms.length > 0) return storms[0];
  if (frosts.length > 0) return frosts[0];
  return hand[0];
}

/** Play one full round through the engine and return the cards just played. */
function playRound(game, style) {
  const card = autopilotPick(game, style);
  playPlayerCard(game, card.id);
  if (isOver(game)) return { you: card, foe: null };
  const foeCard = game.aiPick;
  if (foeCard) resolveAiCard(game, foeCard);
  const played = { you: card, foe: foeCard };
  if (!isOver(game)) {
    game.round += 1;
    startRound(game);
  }
  return played;
}

/**
 * Guarantee the scene's outcome through a real card: set the losing side to
 * 3 life, put a fresh Wildfire in the winner's hand, and play it.
 */
function forceFinish(game, wanted) {
  const finisher = buildDeck().find((card) => card.suit === SUITS.FLAME && card.value === 5);
  if (wanted === 'you') {
    game.foe.life = 3;
    game.you.hand.unshift(finisher);
    playPlayerCard(game, finisher.id);
    return { you: finisher, foe: null };
  }
  game.you.life = 3;
  game.foe.hand.unshift(finisher);
  resolveAiCard(game, finisher);
  return { you: null, foe: finisher };
}

/**
 * Set `game` to the named scene and return what to draw: the screen, the
 * cards played in the frame, and the winner for an end scene.
 */
export function stageShot(name, seed) {
  const game = createGame(seed);
  startRound(game);
  if (name !== 'play' && name !== 'win' && name !== 'loss') {
    return { screen: 'title', game, played: { you: null, foe: null }, winner: null };
  }
  let played = { you: null, foe: null };
  const style = name === 'play' ? 'aggressive' : name === 'win' ? 'cautious' : 'reckless';
  const rounds = name === 'play' ? PLAY_ROUNDS : SIM_LIMIT;
  for (let i = 0; i < rounds; i += 1) {
    played = playRound(game, style);
    if (isOver(game)) break;
  }
  if (name === 'play') {
    return { screen: 'table', game, played, winner: null };
  }
  // The win scene must end in a win and the loss scene in a loss, whatever
  // the autopilot managed: force the finishing blow through a real card.
  const wanted = name === 'win' ? 'you' : 'foe';
  if (winnerOf(game) !== wanted) played = forceFinish(game, wanted);
  return { screen: 'end', game, played, winner: winnerOf(game) ?? wanted };
}
