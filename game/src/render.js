// Ember Duel rendering: the DOM table, the cards on it, and the screens.
// The engine owns the rules; this module only shows them.
import { SUIT_STYLE } from './cards.js';
import { MAX_LIFE } from './engine.js';
import { createRng } from './random.js';

const $ = (id) => document.getElementById(id);

/** What the value corner of a card shows: its number, or its trick's promise. */
export function displayValue(card) {
  if (card.kind === 'kindle') return '+3';
  if (card.kind === 'surge') return '=◆';
  return String(card.value);
}

/** One face-up card element. `key` is its keyboard number (1–5), or null. */
export function makeCardElement(card, key) {
  const style = SUIT_STYLE[card.suit];
  const el = document.createElement('div');
  el.className = `card suit-${card.suit}`;
  el.dataset.cardId = card.id;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', `${card.name}, ${style.label} ${displayValue(card)}: ${card.text}`);
  el.innerHTML =
    (key ? `<span class="card-key">${key}</span>` : '') +
    `<span class="suit-glyph">${style.glyph}</span>` +
    `<span class="card-value">${displayValue(card)}</span>` +
    `<span class="card-name">${card.name}</span>` +
    `<span class="card-text">${card.text}</span>`;
  return el;
}

/** One face-down card for the rival's hand. */
function makeBackElement() {
  const el = document.createElement('div');
  el.className = 'card face-down';
  el.innerHTML = '<span class="back-mark">▲</span>';
  return el;
}

function setLife(who, life, shield) {
  $(`${who}-life`).textContent = String(life);
  $(`${who}-life`).classList.toggle('low', life <= 5 && life > 0);
  $(`${who}-life-fill`).style.width = `${Math.max(0, (life / MAX_LIFE) * 100)}%`;
  $(`${who}-shield`).textContent = shield > 0 ? `◆ ${shield} shield` : '';
}

/** Show exactly one of the three screens. */
export function showScreen(name) {
  $('title-screen').classList.toggle('hidden', name !== 'title');
  $('table-screen').classList.toggle('hidden', name !== 'table');
  $('end-screen').classList.toggle('hidden', name !== 'end');
}

/**
 * Draw the whole table from the game: lives, shields, both hands, the cards
 * just played, Ash's telegraphed intent, the combo line and the log.
 * `ui` carries the cards played this round ({ you, foe }) and whether the
 * player may move now.
 */
export function renderTable(game, ui) {
  setLife('you', game.you.life, game.you.shield);
  setLife('foe', game.foe.life, game.foe.shield);

  const foeHand = $('foe-hand');
  foeHand.innerHTML = '';
  for (let i = 0; i < game.foe.hand.length; i += 1) foeHand.appendChild(makeBackElement());

  const youHand = $('you-hand');
  youHand.innerHTML = '';
  game.you.hand.forEach((card, index) => {
    const el = makeCardElement(card, index + 1);
    if (ui.canPlay) el.classList.add('playable');
    el.addEventListener('click', () => ui.onPlay(card.id));
    youHand.appendChild(el);
  });

  const youPlayed = $('you-played');
  youPlayed.innerHTML = '';
  if (ui.you) {
    const el = makeCardElement(ui.you, null);
    el.classList.add('played');
    youPlayed.appendChild(el);
  }
  const foePlayed = $('foe-played');
  foePlayed.innerHTML = '';
  if (ui.foe) {
    const el = makeCardElement(ui.foe, null);
    el.classList.add('played');
    foePlayed.appendChild(el);
  }

  $('intent-box').textContent = game.aiIntent || 'Ash is thinking…';
  const combos = [];
  if (game.bankedEmber) combos.push('Ember banked — your next Flame hits +2');
  if (game.kindleBonus > 0) combos.push(`Kindled — your next Flame deals +${game.kindleBonus}`);
  $('combo-box').textContent = combos.join(' · ');
  $('round-box').textContent = `Round ${game.round} · deck ${game.you.deck.length} · discard ${game.you.discard.length}`;

  const log = $('log');
  log.innerHTML = '';
  for (const line of game.log.slice(-4)) {
    const div = document.createElement('div');
    div.textContent = line;
    log.appendChild(div);
  }

  $('status').textContent =
    `You have ${game.you.life} life, Ash has ${game.foe.life}. ${game.aiIntent}`;
}

/** The win or loss screen, with a confetti flourish for a win. */
export function renderEnd(game, winner) {
  const end = $('end-screen');
  end.classList.toggle('win', winner === 'you');
  end.classList.toggle('loss', winner === 'foe');
  $('end-title').textContent = winner === 'you' ? 'VICTORY' : 'DEFEAT';
  $('end-line').textContent =
    winner === 'you'
      ? 'Ash bows. The embers are yours, challenger.'
      : 'Ash takes the embers this time. Duel again — the fire remembers.';
  $('end-stats').textContent =
    `Final life — You ${game.you.life} · Ash ${game.foe.life} · ${game.round} rounds · ${game.log.length} cards played`;
  const confetti = $('confetti');
  confetti.innerHTML = '';
  if (winner === 'you') {
    const rng = createRng(game.seed + 99);
    const colours = ['#f5c542', '#ff6b35', '#7ed957', '#4fc3f7', '#c77dff'];
    for (let i = 0; i < 42; i += 1) {
      const piece = document.createElement('i');
      piece.style.left = `${rng() * 100}%`;
      piece.style.background = colours[i % colours.length];
      piece.style.animationDelay = `${rng() * 2.2}s`;
      piece.style.animationDuration = `${2 + rng() * 1.6}s`;
      confetti.appendChild(piece);
    }
  }
}
